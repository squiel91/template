// @ts-nocheck

const SHOPPER_SESSION_TOKEN_LOCAL_STORAGE_KEY = 'shopper_session_token'
const SHOPPER_SESSION_TOKEN_HEADER = 'X-shopper-session-token'

const SEARCH_DEDUPE_STORAGE_KEY = 'tiendu:analytics:search-dedupe'
const PURCHASE_DEDUPE_STORAGE_KEY = 'tiendu:analytics:purchase-dedupe'
const SEARCH_DEDUPE_WINDOW_MS = 5000
const PURCHASE_DEDUPE_WINDOW_MS = 1000 * 60 * 60 * 24

const warnedProviders = new Set()
const warnedCapiErrors = new Set()

const META_EVENT_NAMES = {
	search: 'Search',
	addToCart: 'AddToCart',
	beginCheckout: 'InitiateCheckout',
	purchase: 'Purchase'
}

const GOOGLE_EVENT_NAMES = {
	search: 'search',
	addToCart: 'add_to_cart',
	beginCheckout: 'begin_checkout',
	purchase: 'purchase'
}

const toPositiveInt = value => {
	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed <= 0) return null
	return Math.floor(parsed)
}

const toMoney = cents => {
	const parsed = Number(cents)
	if (!Number.isFinite(parsed)) return null
	return parsed / 100
}

const warnOnce = (key, message) => {
	if (warnedProviders.has(key)) return
	warnedProviders.add(key)
	console.warn(message)
}

const warnCapiErrorOnce = (key, message, details) => {
	if (warnedCapiErrors.has(key)) return
	warnedCapiErrors.add(key)
	console.warn(message, details)
}

const getGlobal = () => {
	if (typeof window === 'undefined') return null
	return window
}

const getShopperSessionToken = () => {
	try {
		return localStorage.getItem(SHOPPER_SESSION_TOKEN_LOCAL_STORAGE_KEY)
	} catch {
		return null
	}
}

const getCookieValue = name => {
	if (typeof document === 'undefined') return null
	const target = `${name}=`
	const chunks = String(document.cookie || '').split(';')
	for (const chunk of chunks) {
		const trimmed = chunk.trim()
		if (!trimmed.startsWith(target)) continue
		const value = trimmed.slice(target.length)
		return value ? decodeURIComponent(value) : null
	}
	return null
}

const resolveFbc = () => {
	const cookieFbc = getCookieValue('_fbc')
	if (cookieFbc) return cookieFbc

	if (typeof window === 'undefined') return null
	const fbclid = new URL(window.location.href).searchParams.get('fbclid')
	if (!fbclid) return null
	return `fb.1.${Date.now()}.${fbclid}`
}

const buildEventId = prefix => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return `${prefix}_${crypto.randomUUID()}`
	}
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

const now = () => Date.now()

const withStorageMap = (storage, storageKey, update) => {
	if (!storage) return false
	let map = {}
	try {
		const raw = storage.getItem(storageKey)
		if (raw) {
			const parsed = JSON.parse(raw)
			if (parsed && typeof parsed === 'object') {
				map = parsed
			}
		}
	} catch {
		map = {}
	}

	const changed = update(map)

	if (!changed) return false

	try {
		storage.setItem(storageKey, JSON.stringify(map))
	} catch {
		return false
	}

	return true
}

const shouldSkipByWindow = (storage, storageKey, dedupeKey, windowMs) => {
	if (!dedupeKey) return false
	let shouldSkip = false
	withStorageMap(storage, storageKey, map => {
		const currentTime = now()
		for (const [key, value] of Object.entries(map)) {
			const parsed = Number(value)
			if (!Number.isFinite(parsed) || currentTime - parsed > windowMs) {
				delete map[key]
			}
		}

		const previous = Number(map[dedupeKey])
		if (Number.isFinite(previous) && currentTime - previous < windowMs) {
			shouldSkip = true
			return true
		}

		map[dedupeKey] = currentTime
		return true
	})
	return shouldSkip
}

const normalizeItems = items => {
	if (!Array.isArray(items)) return []
	return items
		.map(item => {
			if (!item || typeof item !== 'object') return null
			const id = toPositiveInt(item.productVariantId)
			const quantity = toPositiveInt(item.quantity) || 1
			if (!id) return null
			return {
				id,
				quantity
			}
		})
		.filter(Boolean)
}

const toGoogleItems = items =>
	normalizeItems(items).map(item => ({
		item_id: String(item.id),
		quantity: item.quantity
	}))

const toMetaContents = items =>
	normalizeItems(items).map(item => ({
		id: String(item.id),
		quantity: item.quantity
	}))

const hasProviderFn = fn => typeof fn === 'function'

const trackGoogle = (eventName, params) => {
	const target = getGlobal()
	if (!target) return
	if (!hasProviderFn(target.gtag)) {
		warnOnce(
			'missing-gtag',
			'[analytics] Google tag (gtag) is not available. Skipping Google event tracking.'
		)
		return
	}

	try {
		target.gtag('event', eventName, params)
	} catch (error) {
		console.warn('[analytics] Failed to send Google event.', {
			eventName,
			error
		})
	}
}

const trackMeta = (eventName, params, eventId) => {
	const target = getGlobal()
	if (!target) return
	if (!hasProviderFn(target.fbq)) {
		warnOnce(
			'missing-fbq',
			'[analytics] Meta Pixel (fbq) is not available. Skipping browser Meta event tracking.'
		)
		return
	}

	try {
		target.fbq('track', eventName, params, eventId ? { eventID: eventId } : undefined)
	} catch (error) {
		console.warn('[analytics] Failed to send Meta browser event.', {
			eventName,
			error
		})
	}
}

const sendMetaConversionApiEvent = async ({
	storeId,
	baseUrl,
	eventName,
	eventId,
	customData
}) => {
	const normalizedStoreId = toPositiveInt(storeId)
	if (!normalizedStoreId || typeof baseUrl !== 'string' || !baseUrl.trim()) return

	const endpoint = new URL(
		`/api/stores/${normalizedStoreId}/analytics/meta-events`,
		baseUrl
	).toString()

	const headers = {
		'Content-Type': 'application/json'
	}

	const shopperSessionToken = getShopperSessionToken()
	if (shopperSessionToken) {
		headers[SHOPPER_SESSION_TOKEN_HEADER] = shopperSessionToken
	}

	const payload = {
		eventName,
		eventId,
		eventSourceUrl:
			typeof window !== 'undefined' ? window.location.href : undefined,
		fbp: getCookieValue('_fbp'),
		fbc: resolveFbc(),
		customData
	}

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify(payload),
			keepalive: true,
			mode: 'cors',
			credentials: 'omit'
		})

		if (!response.ok) {
			warnCapiErrorOnce(
				`meta-capi-${response.status}`,
				'[analytics] Meta Conversion API endpoint returned a non-success response.',
				{ status: response.status }
			)
		}
	} catch (error) {
		warnCapiErrorOnce(
			'meta-capi-network-error',
			'[analytics] Failed to send Meta Conversion API event.',
			{ eventName, error }
		)
	}
}

const buildMetaValuePayload = ({
	currency,
	value,
	items
}) => {
	const contents = toMetaContents(items)
	const contentIds = contents.map(item => item.id)
	const numItems = contents.reduce((acc, item) => acc + item.quantity, 0)

	return {
		...(currency ? { currency } : {}),
		...(typeof value === 'number' ? { value } : {}),
		...(contents.length > 0
			? {
					contents,
					content_ids: contentIds,
					content_type: 'product',
					num_items: numItems
				}
			: {})
	}
}

export const trackSearchEvent = ({ storeId, baseUrl, query, source, resultsCount }) => {
	const normalizedQuery = String(query || '').trim()
	if (normalizedQuery.length < 2) return

	const dedupeKey = `${String(storeId || 'unknown')}:${normalizedQuery.toLowerCase()}`
	if (
		typeof sessionStorage !== 'undefined' &&
		shouldSkipByWindow(
			sessionStorage,
			SEARCH_DEDUPE_STORAGE_KEY,
			dedupeKey,
			SEARCH_DEDUPE_WINDOW_MS
		)
	) {
		return
	}

	const eventId = buildEventId('search')
	const safeResultsCount = toPositiveInt(resultsCount)

	trackGoogle(GOOGLE_EVENT_NAMES.search, {
		search_term: normalizedQuery,
		...(safeResultsCount ? { search_results: safeResultsCount } : {})
	})

	trackMeta(
		META_EVENT_NAMES.search,
		{
			search_string: normalizedQuery
		},
		eventId
	)

	void sendMetaConversionApiEvent({
		storeId,
		baseUrl,
		eventName: META_EVENT_NAMES.search,
		eventId,
		customData: {
			search_string: normalizedQuery,
			source: source || null,
			results_count: safeResultsCount
		}
	})
}

export const trackAddToCartEvent = ({
	storeId,
	baseUrl,
	productVariantId,
	quantity,
	priceInCents,
	currency = 'UYU'
}) => {
	const variantId = toPositiveInt(productVariantId)
	if (!variantId) return

	const normalizedQuantity = toPositiveInt(quantity) || 1
	const value = toMoney(priceInCents)
	const items = [{ productVariantId: variantId, quantity: normalizedQuantity }]
	const googleItems = toGoogleItems(items)
	const eventId = buildEventId('add_to_cart')

	trackGoogle(GOOGLE_EVENT_NAMES.addToCart, {
		currency,
		...(typeof value === 'number' ? { value } : {}),
		items: googleItems
	})

	const metaPayload = buildMetaValuePayload({
		currency,
		value,
		items
	})
	trackMeta(META_EVENT_NAMES.addToCart, metaPayload, eventId)

	void sendMetaConversionApiEvent({
		storeId,
		baseUrl,
		eventName: META_EVENT_NAMES.addToCart,
		eventId,
		customData: metaPayload
	})
}

export const trackBeginCheckoutEvent = ({
	storeId,
	baseUrl,
	totalPriceInCents,
	items,
	currency = 'UYU'
}) => {
	const normalizedItems = normalizeItems(items)
	const googleItems = toGoogleItems(normalizedItems)
	const value = toMoney(totalPriceInCents)
	const eventId = buildEventId('begin_checkout')

	trackGoogle(GOOGLE_EVENT_NAMES.beginCheckout, {
		currency,
		...(typeof value === 'number' ? { value } : {}),
		items: googleItems
	})

	const metaPayload = buildMetaValuePayload({
		currency,
		value,
		items: normalizedItems
	})
	trackMeta(META_EVENT_NAMES.beginCheckout, metaPayload, eventId)

	void sendMetaConversionApiEvent({
		storeId,
		baseUrl,
		eventName: META_EVENT_NAMES.beginCheckout,
		eventId,
		customData: metaPayload
	})
}

export const trackPurchaseEvent = ({
	storeId,
	baseUrl,
	totalPriceInCents,
	items,
	currency = 'UYU',
	orderId,
	paymentExternalReference
}) => {
	const normalizedItems = normalizeItems(items)
	const dedupeReference =
		(orderId && String(orderId)) ||
		(paymentExternalReference && String(paymentExternalReference)) ||
		`${String(totalPriceInCents)}:${normalizedItems
			.map(item => `${item.id}:${item.quantity}`)
			.join('|')}`
	const purchaseDedupeKey = `${String(storeId || 'unknown')}:${dedupeReference}`

	if (
		typeof localStorage !== 'undefined' &&
		shouldSkipByWindow(
			localStorage,
			PURCHASE_DEDUPE_STORAGE_KEY,
			purchaseDedupeKey,
			PURCHASE_DEDUPE_WINDOW_MS
		)
	) {
		return
	}

	const eventId = buildEventId('purchase')
	const value = toMoney(totalPriceInCents)
	const googleItems = toGoogleItems(normalizedItems)
	const transactionId =
		(orderId && String(orderId)) ||
		(paymentExternalReference && String(paymentExternalReference)) ||
		eventId

	trackGoogle(GOOGLE_EVENT_NAMES.purchase, {
		transaction_id: transactionId,
		currency,
		...(typeof value === 'number' ? { value } : {}),
		items: googleItems
	})

	const metaPayload = {
		...buildMetaValuePayload({
			currency,
			value,
			items: normalizedItems
		}),
		order_id: orderId || null
	}
	trackMeta(META_EVENT_NAMES.purchase, metaPayload, eventId)

	void sendMetaConversionApiEvent({
		storeId,
		baseUrl,
		eventName: META_EVENT_NAMES.purchase,
		eventId,
		customData: {
			...metaPayload,
			payment_external_reference: paymentExternalReference || null
		}
	})
}
