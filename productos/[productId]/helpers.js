// @ts-nocheck

export const PRICE_CONTACT_WHATSAPP_URL = 'https://wa.me/59899424414'

export const buildOutOfStockWhatsAppUrl = productTitle => {
	const message = `¡Hola! Quiero consultarles sobre el producto "${productTitle}" que vi que ya no tienen en stock.`
	return `${PRICE_CONTACT_WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}

export const hasPurchasablePrice = (product, variant) => {
	if (variant) return typeof variant?.priceInCents === 'number'
	return typeof product?.basePriceInCents === 'number'
}

/**
 * @param {Array<any> | null | undefined} variants
 */
export const normalizeVariants = variants => {
	if (!Array.isArray(variants)) return []
	return variants.filter(variant => variant && typeof variant.id === 'number')
}

/** @param {any} variant */
export const extractVariantValueMap = variant => {
	/** @type {Map<number, number>} */
	const selectedMap = new Map()
	for (const attribute of variant.attributes || []) {
		const selectedValue = attribute.values?.[0]
		if (selectedValue?.id) {
			selectedMap.set(attribute.id, selectedValue.id)
		}
	}
	return selectedMap
}

/** @param {Map<number, number>} map */
export const serializeMap = map =>
	Array.from(map.entries())
		.sort((a, b) => a[0] - b[0])
		.map(([key, value]) => `${key}:${value}`)
		.join('|')

/**
 * @param {Array<any>} variants
 * @returns {Map<string, any>}
 */
export const buildVariantIndex = variants => {
	/** @type {Map<string, any>} */
	const index = new Map()
	for (const variant of variants) {
		index.set(serializeMap(extractVariantValueMap(variant)), variant)
	}
	return index
}

/**
 * @param {Array<any>} variants
 * @param {number} attributeId
 * @param {number} valueId
 * @param {Map<number, number>} selectedValues
 */
export const isValueEnabled = (variants, attributeId, valueId, selectedValues) => {
	return variants.some(variant => {
		const map = extractVariantValueMap(variant)
		if (map.get(attributeId) !== valueId) return false

		for (const [selectedAttrId, selectedValueId] of selectedValues.entries()) {
			if (selectedAttrId === attributeId) continue
			if (map.has(selectedAttrId) && map.get(selectedAttrId) !== selectedValueId) {
				return false
			}
		}

		return true
	})
}

export const formatRelativeTime = value => {
	if (!value) return 'hace un momento'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'hace un momento'

	const diffMs = Math.max(0, Date.now() - date.getTime())
	const minutes = Math.floor(diffMs / 60000)
	const hours = Math.floor(diffMs / 3600000)
	const days = Math.floor(diffMs / 86400000)
	const weeks = Math.floor(days / 7)
	const months = Math.floor(days / 30)
	const years = Math.floor(days / 365)

	if (minutes < 1) return 'hace un momento'
	if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`
	if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`
	if (days < 7) return `hace ${days} ${days === 1 ? 'día' : 'días'}`
	if (weeks < 5) return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
	if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
	return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}

export const getUnitsSoldCopy = unitsSold => {
	if (!Number.isFinite(unitsSold) || unitsSold <= 0) return ''
	if (unitsSold < 5) return '3 vendidos'
	if (unitsSold < 10) return 'Más de 5 vendidos'
	if (unitsSold < 20) return 'Más de 10 vendidos'
	if (unitsSold < 30) return 'Más de 20 vendidos'
	return 'Más de 30 vendidos'
}

export const buildGalleryImages = (images, variants, fallbackAlt) => {
	const result = []
	const seen = new Set()

	const addImage = image => {
		if (!image || typeof image.url !== 'string' || !image.url.trim()) return
		const key =
			typeof image.id === 'number'
				? `id:${image.id}`
				: `url:${image.url.trim()}`
		if (seen.has(key)) return
		seen.add(key)
		result.push({
			id: typeof image.id === 'number' ? image.id : null,
			url: image.url,
			alt: image.alt || fallbackAlt || ''
		})
	}

	if (Array.isArray(images)) {
		for (const image of images) addImage(image)
	}

	if (Array.isArray(variants)) {
		for (const variant of variants) addImage(variant?.coverImage)
	}

	return result
}
