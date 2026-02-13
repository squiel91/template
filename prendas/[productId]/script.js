// @ts-nocheck

import '/ui/app-button/app-button.js'
import '/ui/attribute-select/attribute-select.js'
import '/ui/rating-stars/rating-stars.js'
import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import '/ui/tiendu-image-carousel/tiendu-image-carousel.js'
import '/ui/quantity-input/quantity-input.js'
import '/ui/stock-note/stock-note.js'
import '/ui/toast-stack/toast-stack.js'
import { tiendu } from '/shared/tiendu-client.js'
import { getPriceDataForVariant } from '/shared/product-pricing.js'
import { getProductStockOverview } from '/shared/product-pricing.js'
import { withPageLoading } from '/shared/page-loading.js'
import { getOriginFromCurrentUrl } from '/shared/navigation-origin.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { toSafeCssColor } from '/shared/css-color.js'
import { urlSafe } from '/shared/url-safe.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import {
	PRICE_CONTACT_WHATSAPP_URL,
	buildOutOfStockWhatsAppUrl,
	hasPurchasablePrice,
	normalizeVariants,
	extractVariantValueMap,
	serializeMap,
	buildVariantIndex,
	isValueEnabled,
	formatRelativeTime,
	getUnitsSoldCopy,
	buildGalleryImages
} from '/prendas/[productId]/helpers.js'

const PAYMENT_METHOD_LOGOS = [
	{ src: '/public/payment-methods/mercadopago.svg', alt: 'Mercado Pago' },
	{ src: '/public/payment-methods/visa.svg', alt: 'Visa' },
	{ src: '/public/payment-methods/master.svg', alt: 'Mastercard' },
	{ src: '/public/payment-methods/oca.svg', alt: 'OCA' },
	{ src: '/public/payment-methods/amex.svg', alt: 'American Express' },
	{ src: '/public/payment-methods/diners.svg', alt: 'Diners Club' },
	{ src: '/public/payment-methods/brou.svg', alt: 'BROU' },
	{ src: '/public/payment-methods/itau.svg', alt: 'Itaú' },
	{ src: '/public/payment-methods/cabal.svg', alt: 'Cabal' },
	{ src: '/public/payment-methods/lider.svg', alt: 'Líder' }
]

const renderRelatedProducts = products => {
	const container = document.getElementById('related-products-list')
	if (!container) return

	const relatedProducts = Array.isArray(products) ? products : []

	const list = document.createElement('product-list')

	for (const product of relatedProducts) {
		const item = createProductItemElement(product, {
			url: `/prendas/${product.id}/${urlSafe(product.title || 'producto')}`
		})
		list.appendChild(item)
	}

	container.innerHTML = ''
	container.appendChild(list)
}

/** @param {any} product */
const renderProduct = (product, relatedProducts = []) => {
	const container = document.getElementById('product')
	if (!container) return

	const variants = normalizeVariants(product.variants)
	const productAttributes = Array.isArray(product.attributes) ? product.attributes : []
	const variantIndex = buildVariantIndex(variants)
	const defaultVariant = variants[0] || null
	const requiresVariantSelection = variants.length > 1 && productAttributes.length > 0
	const selectedValues =
		requiresVariantSelection || !defaultVariant ? new Map() : extractVariantValueMap(defaultVariant)

	const title = product.title || 'Producto'
	const description = product.description || ''
	const descriptionText = String(description).trim()
	const hasDescription = descriptionText.length > 0
	const descriptionPreviewLength = 260
	const hasLongDescription = descriptionText.length > descriptionPreviewLength
	const unitsSoldCopy = getUnitsSoldCopy(Number(product.unitsSold))
	const visibleSpecs = Array.isArray(product.specifications)
		? product.specifications.filter(spec => !spec.name.startsWith('_'))
		: []
	const hasSpecifications = visibleSpecs.length > 0
	const normalizedRelatedProducts = (Array.isArray(relatedProducts) ? relatedProducts : [])
		.filter(item => item && Number(item.id) !== Number(product.id))
		.slice(0, 4)

	const warningContext = Number.isFinite(Number(product?.id))
		? `[product:${Number(product.id)}]`
		: '[product:unknown]'
	const warnInvalidMetadata = (message, payload) => {
		if (typeof console?.warn !== 'function') return
		console.warn(`${warningContext} ${message}`, payload)
	}

	let metadata = null
	if (product?.metadata && typeof product.metadata === 'object' && !Array.isArray(product.metadata)) {
		metadata = product.metadata
	} else if (typeof product?.metadata === 'string') {
		try {
			const parsedMetadata = JSON.parse(product.metadata)
			if (parsedMetadata && typeof parsedMetadata === 'object' && !Array.isArray(parsedMetadata)) {
				metadata = parsedMetadata
			} else {
				warnInvalidMetadata('`metadata` should be an object.', parsedMetadata)
			}
		} catch (error) {
			warnInvalidMetadata('`metadata` string is not valid JSON.', product.metadata)
		}
	} else if (product?.metadata != null) {
		warnInvalidMetadata('`metadata` has an unsupported type.', product.metadata)
	}

	const normalizeColorsMetadata = rawColors => {
		if (rawColors == null) return []
		if (!Array.isArray(rawColors)) {
			warnInvalidMetadata('`metadata.colors` should be an array.', rawColors)
			return []
		}

		return rawColors.reduce((result, item, index) => {
			if (!item || typeof item !== 'object' || Array.isArray(item)) {
				warnInvalidMetadata('Invalid color item. Expected object.', {
					index,
					item
				})
				return result
			}

			const name = typeof item.name === 'string' ? item.name.trim() : ''
			const value = typeof item.value === 'string' ? item.value.trim() : ''
			const safeColor = toSafeCssColor(value)

			if (!name || !value || !safeColor) {
				warnInvalidMetadata('Invalid color item. Expected non-empty `name` and valid css `value`.', {
					index,
					item
				})
				return result
			}

			result.push({ name, value: safeColor })
			return result
		}, [])
	}

	const colorsMetadata = normalizeColorsMetadata(metadata?.colors)
	const requiresMetadataColorSelection = colorsMetadata.length > 0
	const metadataColorOptions = colorsMetadata.map((color, index) => ({
		id: index + 1,
		name: color.name,
		value: color.value
	}))

	const hasRelatedProducts = normalizedRelatedProducts.length > 0
	const images = Array.isArray(product.images) ? product.images : []
	const galleryImages = buildGalleryImages(images, variants, title)
	const reviews = Array.isArray(product.reviews) ? product.reviews : []
	const reviewsQuantity =
		typeof product.reviewsQuantity === 'number' ? product.reviewsQuantity : reviews.length
	const reviewsLabel = `${reviewsQuantity} ${reviewsQuantity === 1 ? 'reseña' : 'reseñas'}`
	const averageRating =
		typeof product.averageRating === 'number' ? product.averageRating : reviews.length
			? reviews.reduce((sum, review) => sum + (Number(review?.rating) || 0), 0) /
				reviews.length
			: 0

	const reviewsByScore = new Map([
		[5, 0],
		[4, 0],
		[3, 0],
		[2, 0],
		[1, 0]
	])
	for (const review of reviews) {
		const rating = Math.max(1, Math.min(5, Number(review?.rating) || 0))
		reviewsByScore.set(rating, (reviewsByScore.get(rating) || 0) + 1)
	}

	const reviewRowsHtml = [5, 4, 3, 2, 1]
		.map(score => {
			const count = reviewsByScore.get(score) || 0
			const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0
			return `<div class="reviews-overview__row"><span>${score} ${score === 1 ? 'estrella' : 'estrellas'}</span><div class="reviews-overview__bar"><div style="width:${percent}%;"></div></div><strong>${count}</strong></div>`
		})
		.join('')

	const hasReviewToggle = reviews.length > 3

	const reviewItemsHtml = reviews.length
		? reviews
				.map((review, index) => {
					const authorName = escapeHtml(review?.authorName || 'Cliente')
					const content = escapeHtml(review?.content || '')
					const reviewTime = escapeHtml(
						formatRelativeTime(review?.createdAt || review?.updatedAt)
					)
					const isVerified = Boolean(review?.isVerifiedPurchase)
					const extraClass = hasReviewToggle && index >= 3 ? ' review-item--extra' : ''

					return `
						<article class="review-item${extraClass}">
							<header class="review-item__header">
								<div class="review-item__author">
									<div class="review-item__name-line">
										<h3>${authorName}</h3>
										${
											isVerified
												? '<span class="review-item__verified"><i data-lucide="badge-check"></i>Compra verificada</span>'
												: ''
										}
									</div>
									<p>${reviewTime}</p>
								</div>
								<div class="review-item__meta">
									<rating-stars value="${Math.max(1, Math.min(5, Number(review?.rating) || 0))}" size="22"></rating-stars>
								</div>
							</header>
							<p class="review-item__content">${content}</p>
						</article>
					`
				})
				.join('')
		: `<div class="empty-state"><i data-lucide="messages-square"></i><span class="empty-state__title">Este producto aún no tiene reseñas.</span></div>`

	const paymentMethodsHtml = PAYMENT_METHOD_LOGOS.map(
		method =>
			`<li class="payment-methods__item"><img src="${method.src}" alt="${escapeHtml(method.alt)}" loading="lazy" decoding="async" /></li>`
	).join('')

	container.innerHTML = `
		<div class="product-detail">
			<div class="product-gallery">
				<tiendu-image-carousel id="product-image-carousel"></tiendu-image-carousel>
			</div>
			<div class="product-info">
				<h1 class="product-info__title">${escapeHtml(title)}</h1>
				${
					unitsSoldCopy
						? `<p class="product-units-sold"><i data-lucide="trending-up"></i><span>${unitsSoldCopy}</span></p>`
						: ''
				}
				<button type="button" id="go-to-reviews-button" class="product-rating-summary" aria-label="Ver reseñas">
					<rating-stars value="${Number(averageRating).toFixed(2)}" size="22"></rating-stars>
					<span>${Number(averageRating || 0).toFixed(1)} (${reviewsLabel})</span>
				</button>
				<div class="product-price-line">
					<span class="product-price" id="product-price">-</span>
					<span class="product-compare" id="product-compare"></span>
				</div>
				<div id="variant-selector" class="variant-selector"></div>
				<tiendu-stock-note id="stock-note"></tiendu-stock-note>
				<div class="product-actions">
					<div class="product-actions__primary">
						<tiendu-quantity-input id="product-quantity-input" min="1" value="1" aria-label="Cantidad"></tiendu-quantity-input>
						<tiendu-button id="add-to-cart-button" variant="primary" label="Agregar al carrito" loading-label="Agregar al carrito" icon="plus" loading-icon="loader-2" duration="4000"></tiendu-button>
					</div>
					<ul class="purchase-notes" aria-label="Beneficios de compra">
						<li class="purchase-notes__item"><i data-lucide="truck" aria-hidden="true"></i><span>Envío gratis en pedidos superiores a $ 2.000</span></li>
						<li class="purchase-notes__item"><i data-lucide="rotate-ccw" aria-hidden="true"></i><span>Devolución simplificada</span></li>
						<li class="purchase-notes__item"><i data-lucide="credit-card" aria-hidden="true"></i><span>Pagalo hasta en 12 cuotas sin recargo con tarjeta de crédito</span></li>
					</ul>
					<ul class="payment-methods" aria-label="Medios de pago disponibles">
						${paymentMethodsHtml}
					</ul>
					<tiendu-button id="share-product-button" variant="secondary" label="Compartir" icon="forward" aria-label="Compartir producto"></tiendu-button>
				</div>
			</div>
		</div>

		${
			hasDescription || hasSpecifications
				? `<section id="description-section" class="description-section section" aria-labelledby="description-title">
			<div class="section__header">
				<h2 id="description-title" class="section__title section__title--large">Sobre el producto</h2>
			</div>
			${
				hasDescription
					? `<div id="product-description-wrap" class="product-description-wrap ${
							hasLongDescription ? 'product-description-wrap--collapsible is-collapsed' : ''
						}">
						<p id="product-description-text" class="product-description" data-full="${escapeHtml(descriptionText)}">${escapeHtml(descriptionText)}</p>
						${
							hasLongDescription
								? '<div id="product-description-fade" class="product-description-fade" aria-hidden="true"></div>'
								: ''
						}
					</div>`
					: ''
			}
			${
				hasLongDescription && hasDescription
					? '<button type="button" id="description-toggle" class="description-toggle"><span id="description-toggle-label">Ver más</span><i data-lucide="chevron-down"></i></button>'
					: ''
			}
			${hasSpecifications ? '<dl class="product-specs" id="product-specs"></dl>' : ''}
		</section>`
				: ''
		}

		<section id="reviews-section" class="reviews-section" aria-labelledby="reviews-title">
			<div class="section__header reviews-section__header reviews-section__header-layout">
				<h2 id="reviews-title" class="section__title section__title--large">Reseñas</h2>
				<span class="reviews-section__verified"><i data-lucide="shield-check"></i>Verificadas por Tiendu</span>
			</div>

			<div class="reviews-overview">
				<div class="reviews-overview__score">
					<strong>${Number(averageRating || 0).toFixed(1)}</strong>
					<rating-stars value="${Number(averageRating).toFixed(2)}" size="28"></rating-stars>
					<span>${reviewsLabel}</span>
				</div>
				<div class="reviews-overview__distribution">
					${reviewRowsHtml}
				</div>
			</div>

			<div class="reviews-list" id="reviews-list" data-expanded="false">${reviewItemsHtml}</div>
			${
				hasReviewToggle
					? `<button type="button" id="reviews-toggle" class="reviews-toggle" aria-expanded="false"><span id="reviews-toggle-label">Ver más reseñas</span><i data-lucide="chevron-down"></i></button>`
					: ''
			}
		</section>

		${
			hasRelatedProducts
				? `<section id="related-products-section" class="related-products section" aria-labelledby="related-products-title">
			<div class="section__header">
				<h2 id="related-products-title" class="section__title section__title--large">También te puede interesar</h2>
			</div>
			<div id="related-products-list" aria-live="polite"></div>
		</section>`
				: ''
		}

		<tiendu-toast-stack id="product-toast-stack"></tiendu-toast-stack>
	`

	const breadcrumb = document.getElementById('product-breadcrumbs')
	const origin = getOriginFromCurrentUrl()
	if (breadcrumb && typeof breadcrumb.setItems === 'function') {
		const items = [{ label: 'Inicio', href: '/' }]
		if (origin) {
			items.push({ label: origin.title, href: origin.url })
		}
		breadcrumb.setItems(items)
	}
	if (breadcrumb && typeof breadcrumb.setCurrentLabel === 'function') {
		breadcrumb.setCurrentLabel(title)
	}

	document.title = `${title} | Tienda Genérica`
	const descriptionMeta = document.querySelector('meta[name="description"]')
	if (descriptionMeta) {
		descriptionMeta.setAttribute('content', description.slice(0, 150))
	}

	const imageCarousel = document.getElementById('product-image-carousel')
	if (imageCarousel && typeof imageCarousel.setImages === 'function') {
		imageCarousel.setImages(galleryImages)
	}

	const variantSelector = document.getElementById('variant-selector')
	const priceLineNode = container.querySelector('.product-price-line')
	const priceNode = document.getElementById('product-price')
	const compareNode = document.getElementById('product-compare')
	const stockNode = document.getElementById('stock-note')
	const addToCartButton = document.getElementById('add-to-cart-button')
	const quantityInput = document.getElementById('product-quantity-input')
	const toastStack = document.getElementById('product-toast-stack')
	const goToReviewsButton = document.getElementById('go-to-reviews-button')
	const shareProductButton = document.getElementById('share-product-button')
	const descriptionToggle = document.getElementById('description-toggle')
	const reviewsList = document.getElementById('reviews-list')
	const reviewsToggle = document.getElementById('reviews-toggle')
	const reviewsToggleLabel = document.getElementById('reviews-toggle-label')
	const descriptionNode = document.getElementById('product-description-text')
	const descriptionWrap = document.getElementById('product-description-wrap')
	const descriptionFade = document.getElementById('product-description-fade')
	const descriptionToggleLabel = document.getElementById('description-toggle-label')
	let isDescriptionExpanded = false
	/** @type {Array<HTMLButtonElement>} */
	let variantOptionButtons = []
	/** @type {Array<any>} */
	let variantSelects = []
	let metadataColorSelect = null

	let currentVariant = requiresVariantSelection ? null : defaultVariant
	let selectedMetadataColorOptionId = null
	let quantity = 1

	const getVariantMaxQuantity = () => {
		const stock = currentVariant?.stock
		if (typeof stock !== 'number') return null
		if (stock <= 0) return 0
		return Math.floor(stock)
	}

	const stockOverview = getProductStockOverview(product)

	const setStockNote = (tone, messageHtml, options = {}) => {
		if (!stockNode) return
		const icon = options.icon || ''
		const pulse = Boolean(options.pulse)
		if (typeof stockNode.setState === 'function') {
			stockNode.setState({ tone, message: messageHtml, icon, pulse })
			return
		}
		stockNode.textContent = messageHtml
	}

	const setStockFromQuantity = stock => {
		if (stock === 0) {
			setStockNote('error', 'Temporalmente agotado', { pulse: true })
			return
		}

		if (stock <= 4) {
			setStockNote('warning', `Quedan ${stock} ${stock === 1 ? 'unidad' : 'unidades'} en stock`, {
				pulse: true
			})
			return
		}

		setStockNote('success', `${stock} ${stock === 1 ? 'unidad' : 'unidades'} en stock`, {
			pulse: true
		})
	}

	const clampQuantity = value => {
		const numericValue = Number(value)
		const normalizedValue = Number.isFinite(numericValue) ? Math.floor(numericValue) : 1
		const maxQuantity = getVariantMaxQuantity()
		if (typeof maxQuantity === 'number' && maxQuantity > 0) {
			return Math.max(1, Math.min(maxQuantity, normalizedValue))
		}
		return Math.max(1, normalizedValue)
	}

	const syncQuantityUi = () => {
		const hasPrice = hasPurchasablePrice(product, currentVariant)
		const maxQuantity = getVariantMaxQuantity()
		const hasStock = typeof maxQuantity !== 'number' || maxQuantity > 0
		const shouldEnable = hasPrice && hasStock

		if (quantityInput instanceof HTMLElement) {
			quantityInput.hidden = !hasPrice
		}

		quantity = clampQuantity(quantity)

		if (quantityInput && typeof quantityInput.setMin === 'function') {
			quantityInput.setMin(1)
		}

		if (quantityInput && typeof quantityInput.setMax === 'function') {
			quantityInput.setMax(typeof maxQuantity === 'number' && maxQuantity > 0 ? maxQuantity : null)
		}

		if (quantityInput && typeof quantityInput.setDisabled === 'function') {
			quantityInput.setDisabled(!shouldEnable)
		}

		if (quantityInput && typeof quantityInput.setValue === 'function') {
			quantityInput.setValue(quantity)
		}

		if (quantityInput && typeof quantityInput.getValue === 'function') {
			quantity = clampQuantity(quantityInput.getValue())
		}
	}

	const isVariantSelectionComplete = () => {
		if (!requiresVariantSelection) return true
		return productAttributes.every(attribute => selectedValues.has(Number(attribute.id)))
	}

	const isMetadataColorSelectionComplete = () => {
		if (!requiresMetadataColorSelection) return true
		return (
			typeof selectedMetadataColorOptionId === 'number' &&
			Number.isFinite(selectedMetadataColorOptionId) &&
			selectedMetadataColorOptionId > 0
		)
	}

	const updatePrice = () => {
		const priceData = getPriceDataForVariant(product, currentVariant)
		const hasPrice = hasPurchasablePrice(product, currentVariant)

		if (priceLineNode) {
			priceLineNode.hidden = !hasPrice
		}

		if (priceNode) {
			priceNode.textContent = hasPrice ? priceData.label : ''
		}
		if (compareNode) {
			compareNode.textContent = hasPrice ? priceData.compareLabel || '' : ''
		}
		if (stockNode) {
			if (requiresVariantSelection && !currentVariant) {
				const sharedStock = stockOverview.sharedVariantStock
				if (typeof sharedStock === 'number') {
					setStockFromQuantity(sharedStock)
				} else if (stockOverview.allVariantsUntracked) {
					setStockNote('success', 'Tenemos en stock', { pulse: true })
				} else {
					setStockNote('neutral', 'Selecciona una variante para ver stock', { pulse: true })
				}
				return priceData
			}

			const stock = currentVariant?.stock
			if (typeof stock === 'number') {
				setStockFromQuantity(Math.max(0, Math.floor(stock)))
			} else {
				setStockNote('success', 'Tenemos en stock', { pulse: true })
			}
		}
		return priceData
	}

	const updateAddToCartAction = () => {
		if (!addToCartButton) return

		if (requiresVariantSelection && !currentVariant) {
			addToCartButton.setAttribute('label', 'Agregar al carrito')
			addToCartButton.setAttribute('loading-label', 'Agregar al carrito')
			addToCartButton.setAttribute('icon', 'plus')
			addToCartButton.setAttribute('aria-label', 'Agregar al carrito')
			if (typeof addToCartButton.setDisabled === 'function') {
				addToCartButton.setDisabled(false)
			} else {
				addToCartButton.removeAttribute('disabled')
			}
			syncQuantityUi()
			return
		}

		const hasPrice = hasPurchasablePrice(product, currentVariant)
		const isOutOfStock = Boolean(currentVariant && currentVariant.stock === 0)

		if (isOutOfStock) {
			addToCartButton.setAttribute('label', 'Consultar')
			addToCartButton.setAttribute('loading-label', 'Consultar')
			addToCartButton.setAttribute('icon', 'message-square')
			addToCartButton.setAttribute('aria-label', 'Consultar por WhatsApp')
			if (typeof addToCartButton.setDisabled === 'function') {
				addToCartButton.setDisabled(false)
			} else {
				addToCartButton.removeAttribute('disabled')
			}
			syncQuantityUi()
			return
		}

		if (!hasPrice) {
			addToCartButton.setAttribute('label', 'Consultar precio')
			addToCartButton.setAttribute('loading-label', 'Consultar precio')
			addToCartButton.setAttribute('icon', 'message-square')
			addToCartButton.setAttribute('aria-label', 'Consultar precio')
			if (typeof addToCartButton.setDisabled === 'function') {
				addToCartButton.setDisabled(false)
			} else {
				addToCartButton.removeAttribute('disabled')
			}
			syncQuantityUi()
			return
		}

		addToCartButton.setAttribute('label', 'Agregar al carrito')
		addToCartButton.setAttribute('loading-label', 'Agregar al carrito')
		addToCartButton.setAttribute('icon', 'plus')
		addToCartButton.setAttribute('aria-label', 'Agregar al carrito')

		const unavailable = !currentVariant
		if (typeof addToCartButton.setDisabled === 'function') {
			addToCartButton.setDisabled(unavailable)
		} else if (unavailable) {
			addToCartButton.setAttribute('disabled', '')
		} else {
			addToCartButton.removeAttribute('disabled')
		}

		syncQuantityUi()
	}

	const showVariantSelectionWarning = () => {
		if (toastStack && typeof toastStack.showWarning === 'function') {
			toastStack.showWarning('Elegí una variante antes de agregarla al carrito', 5000)
		}
	}

	const renderVariantSelector = () => {
		if (!variantSelector) return
		const hasVariantAttributes = productAttributes.length > 0 && variants.length > 0
		if (!hasVariantAttributes && !requiresMetadataColorSelection) {
			variantSelector.style.display = 'none'
			return
		}
		variantSelector.style.display = ''

		if (variantSelector.childElementCount > 0) return

		const variantAttributesHtml = hasVariantAttributes
			? productAttributes
				.map(attribute => {
				if (attribute.displayType === 'dropdown') {
					return `<fieldset class="variant-group">
						<legend>${escapeHtml(attribute.name)}</legend>
						<tiendu-attribute-select class="variant-select" data-attribute-id="${attribute.id}"></tiendu-attribute-select>
					</fieldset>`
				}

				const optionsHtml = attribute.values
					.map(value => {
						const safeColor = toSafeCssColor(value?.color)
						const swatchImageUrl = value?.image?.url
						const swatchHtml = swatchImageUrl
							? `<span class="option-chip__swatch option-chip__swatch--image" aria-hidden="true"><img src="${escapeHtml(swatchImageUrl)}" alt="" loading="lazy" /></span>`
							: safeColor
								? `<span class="option-chip__swatch option-chip__swatch--color" style="background:${safeColor};" aria-hidden="true"></span>`
								: ''
						return `<button type="button" class="option-chip ${swatchHtml ? '' : 'option-chip--no-swatch'}" data-attribute-id="${attribute.id}" data-value-id="${value.id}" aria-pressed="false">${swatchHtml}<span class="option-chip__label">${escapeHtml(value.value)}</span></button>`
					})
					.join('')

				return `<fieldset class="variant-group">
					<legend>${escapeHtml(attribute.name)}</legend>
					${optionsHtml}
				</fieldset>`
			})
				.join('')
			: ''

		const colorsMetadataHtml = requiresMetadataColorSelection
			? `<fieldset class="variant-group variant-group--metadata-colors">
				<legend>Color</legend>
				<tiendu-attribute-select class="variant-select" data-metadata-colors="true"></tiendu-attribute-select>
			</fieldset>`
			: ''

		const sectionHtml = `${variantAttributesHtml}${colorsMetadataHtml}`

		variantSelector.innerHTML = sectionHtml
		variantOptionButtons = Array.from(
			variantSelector.querySelectorAll('.option-chip')
		)
		variantSelects = Array.from(variantSelector.querySelectorAll('tiendu-attribute-select'))
		metadataColorSelect = variantSelector.querySelector('tiendu-attribute-select[data-metadata-colors="true"]')
		if (metadataColorSelect) {
			variantSelects = variantSelects.filter(select => select !== metadataColorSelect)
			metadataColorSelect.setAttribute('placeholder', 'Selecciona una opción')
			metadataColorSelect.options = metadataColorOptions.map(option => ({
				id: option.id,
				label: option.name,
				color: option.value,
				imageUrl: null
			}))
		}

		for (const select of variantSelects) {
			const attributeId = Number(select.dataset.attributeId)
			const attribute = productAttributes.find(item => Number(item.id) === attributeId)
			if (!attribute || !Array.isArray(attribute.values)) continue

			select.setAttribute('placeholder', 'Selecciona una opción')

			select.options = attribute.values.map(value => ({
				id: value.id,
				label: value.value,
				color: value.color || null,
				imageUrl: value?.image?.url || null
			}))
		}
	}

	const updateVariantSelectorState = () => {
		if (!variantSelector) return

		for (const button of variantOptionButtons) {
			if (!(button instanceof HTMLButtonElement)) continue
			const attributeId = Number(button.dataset.attributeId)
			const valueId = Number(button.dataset.valueId)
			if (!Number.isFinite(attributeId) || !Number.isFinite(valueId)) continue

			const selected = selectedValues.get(attributeId) === valueId
			const enabled = isValueEnabled(variants, attributeId, valueId, selectedValues)
			button.setAttribute('aria-pressed', selected ? 'true' : 'false')
			button.disabled = !enabled
		}

		for (const select of variantSelects) {
			const attributeId = Number(select.dataset.attributeId)
			const attribute = productAttributes.find(item => Number(item.id) === attributeId)
			if (!attribute || !Array.isArray(attribute.values)) continue

			const selectedValueId = selectedValues.get(attributeId)
			select.setValue(Number.isFinite(Number(selectedValueId)) ? selectedValueId : null)

			const disabledIds = attribute.values
				.filter(value => !isValueEnabled(variants, attributeId, value.id, selectedValues))
				.map(value => value.id)
			select.setDisabledOptionIds(disabledIds)
		}

		if (metadataColorSelect && typeof metadataColorSelect.setValue === 'function') {
			metadataColorSelect.setValue(
				typeof selectedMetadataColorOptionId === 'number' &&
				Number.isFinite(selectedMetadataColorOptionId) &&
				selectedMetadataColorOptionId > 0
					? selectedMetadataColorOptionId
					: null
			)
		}
	}

	const syncVariantFromSelection = () => {
		if (requiresVariantSelection && !isVariantSelectionComplete()) {
			currentVariant = null
		} else {
			const selectedKey = serializeMap(selectedValues)
			currentVariant = variantIndex.get(selectedKey) || (requiresVariantSelection ? null : defaultVariant)
		}

		updatePrice()
		updateVariantSelectorState()
		updateAddToCartAction()

		if (
			imageCarousel &&
			typeof imageCarousel.setCurrentImageById === 'function' &&
			typeof currentVariant?.coverImage?.id === 'number'
		) {
			imageCarousel.setCurrentImageById(currentVariant.coverImage.id)
		}
	}

	variantSelector?.addEventListener('click', event => {
		const target = event.target instanceof Element ? event.target.closest('button') : null
		if (!(target instanceof HTMLButtonElement)) return

		const attributeId = Number(target.dataset.attributeId)
		const valueId = Number(target.dataset.valueId)
		if (!Number.isFinite(attributeId) || !Number.isFinite(valueId)) return

		selectedValues.set(attributeId, valueId)
		syncVariantFromSelection()
	})

	variantSelector?.addEventListener('tiendu-select-change', event => {
		const select = event.target
		if (!(select instanceof HTMLElement)) return

		if (select.dataset.metadataColors === 'true') {
			const selectedOptionId = Number(event?.detail?.valueId)
			const selectedOption = metadataColorOptions.find(option => option.id === selectedOptionId)
			selectedMetadataColorOptionId = selectedOption ? selectedOption.id : null
			updateVariantSelectorState()
			return
		}

		const attributeId = Number(select.dataset.attributeId)
		const valueId = Number(event?.detail?.valueId)
		if (!Number.isFinite(attributeId) || !Number.isFinite(valueId)) return

		selectedValues.set(attributeId, valueId)
		syncVariantFromSelection()
	})

	if (addToCartButton) {
		addToCartButton.addEventListener('app-click', () => {
			if (
				(requiresVariantSelection && !currentVariant) ||
				(requiresMetadataColorSelection && !isMetadataColorSelectionComplete())
			) {
				showVariantSelectionWarning()
				return
			}

			if (currentVariant && currentVariant.stock === 0) {
				window.open(buildOutOfStockWhatsAppUrl(title), '_blank', 'noopener,noreferrer')
				return
			}

			if (!hasPurchasablePrice(product, currentVariant)) {
				window.open(PRICE_CONTACT_WHATSAPP_URL, '_blank', 'noopener,noreferrer')
				return
			}
			if (!currentVariant) return
			if (typeof addToCartButton.startLoading === 'function') {
				addToCartButton.startLoading()
			}
			tiendu.cart
				.addProductVariant(currentVariant, clampQuantity(quantity), () => {
					if (typeof addToCartButton.stopLoading === 'function') {
						addToCartButton.stopLoading()
					}
				})
				.catch(() => {
					if (typeof addToCartButton.stopLoading === 'function') {
						addToCartButton.stopLoading()
					}
				})
		})
	}

	if (quantityInput instanceof HTMLElement) {
		quantityInput.addEventListener('quantity-change', event => {
			quantity = clampQuantity(Number(event?.detail?.value))
			if (typeof quantityInput.setValue === 'function') {
				quantityInput.setValue(quantity)
			}
		})
	}

	if (goToReviewsButton) {
		goToReviewsButton.addEventListener('click', () => {
			const section = document.getElementById('reviews-section')
			if (!section) return
			section.scrollIntoView({ behavior: 'smooth', block: 'start' })
		})
	}

	if (reviewsToggle && reviewsList) {
		reviewsToggle.addEventListener('click', () => {
			const expanded = reviewsList.getAttribute('data-expanded') === 'true'
			const nextExpanded = !expanded
			reviewsList.setAttribute('data-expanded', nextExpanded ? 'true' : 'false')
			reviewsToggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false')
			reviewsToggle.classList.toggle('is-expanded', nextExpanded)
			if (reviewsToggleLabel) {
				reviewsToggleLabel.textContent = nextExpanded ? 'Mostrar menos' : 'Ver más reseñas'
			}
		})
	}

	if (shareProductButton instanceof HTMLElement) {
		if (typeof navigator.share !== 'function') {
			shareProductButton.style.display = 'none'
		} else {
			shareProductButton.addEventListener('app-click', async () => {
				try {
					await navigator.share({
						title,
						text: `Mira este producto: ${title}`,
						url: window.location.href
					})
				} catch (error) {
					if (
						error &&
						typeof error === 'object' &&
						'name' in error &&
						error.name === 'AbortError'
					) {
						return
					}
				}
			})
		}
	}

	if (descriptionToggle && descriptionNode) {
		descriptionToggle.addEventListener('click', () => {
			isDescriptionExpanded = !isDescriptionExpanded
			if (isDescriptionExpanded) {
				if (descriptionToggleLabel) {
					descriptionToggleLabel.textContent = 'Ver menos'
				}
				descriptionToggle.classList.add('is-expanded')
				descriptionWrap?.classList.remove('is-collapsed')
				descriptionWrap?.classList.add('is-expanded')
				descriptionFade?.setAttribute('hidden', 'true')
			} else {
				if (descriptionToggleLabel) {
					descriptionToggleLabel.textContent = 'Ver más'
				}
				descriptionToggle.classList.remove('is-expanded')
				descriptionWrap?.classList.remove('is-expanded')
				descriptionWrap?.classList.add('is-collapsed')
				descriptionFade?.removeAttribute('hidden')
			}
			refreshIcons()
		})
	}

	if (hasRelatedProducts) {
		renderRelatedProducts(normalizedRelatedProducts)
	}

	const specsNode = document.getElementById('product-specs')
	if (specsNode && hasSpecifications) {
		specsNode.innerHTML = visibleSpecs
			.map(
				spec => `<div>
					<dt>${escapeHtml(spec.name)}</dt>
					<dd>${escapeHtml(spec.value)}</dd>
				</div>`
			)
			.join('')
	}

	renderVariantSelector()
	syncVariantFromSelection()
	refreshIcons()
}

const renderMessage = message => {
	const container = document.getElementById('product')
	if (!container) return
	container.innerHTML = `
		<div class="empty-state">
			<i data-lucide="alert-circle"></i>
			<span class="empty-state__title">${escapeHtml(message)}</span>
		</div>
	`
	refreshIcons()
}

const init = async () => {
	const params = /** @type {{ productId?: string }} */ (
		/** @type {any} */ (window).PARAMS ?? {}
	)
	const productId = Number(params.productId)
	if (!Number.isFinite(productId) || productId < 1) {
		renderMessage('Producto inválido.')
		return
	}

	try {
		const [product, relatedProducts] = await Promise.all([
			tiendu.products.get(productId),
			tiendu.products.getRelated(productId).catch(() => [])
		])
		renderProduct(product, relatedProducts)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderMessage(`No se pudo cargar el producto: ${message}`)
	}
}

void withPageLoading(init)

export {}
