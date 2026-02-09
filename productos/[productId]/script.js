// @ts-nocheck

import '/ui/app-button/app-button.js'
import '/ui/attribute-select/attribute-select.js'
import '/ui/rating-stars/rating-stars.js'
import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import '/ui/tiendu-image-carousel/tiendu-image-carousel.js'
import { tiendu } from '/shared/tiendu-client.js'
import { getPriceDataForVariant } from '/shared/product-pricing.js'
import { getListingPriceData } from '/shared/product-pricing.js'
import { withPageLoading } from '/shared/page-loading.js'
import { getOriginFromCurrentUrl } from '/shared/navigation-origin.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

/**
 * @param {Array<any> | null | undefined} variants
 */
const normalizeVariants = variants => {
	if (!Array.isArray(variants)) return []
	return variants.filter(variant => variant && typeof variant.id === 'number')
}

/** @param {any} variant */
const extractVariantValueMap = variant => {
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
const serializeMap = map =>
	Array.from(map.entries())
		.sort((a, b) => a[0] - b[0])
		.map(([key, value]) => `${key}:${value}`)
		.join('|')

/**
 * @param {Array<any>} variants
 * @returns {Map<string, any>}
 */
const buildVariantIndex = variants => {
	/** @type {Map<string, any>} */
	const index = new Map()
	for (const variant of variants) {
		index.set(serializeMap(extractVariantValueMap(variant)), variant)
	}
	return index
}

/**
 * @param {Array<any>} variants
 * @param {Map<number, number>} selection
 */
const findBestMatchingVariant = (variants, selection) => {
	let best = null
	let bestScore = -1

	for (const variant of variants) {
		const map = extractVariantValueMap(variant)
		let isCompatible = true
		let score = 0
		for (const [attributeId, valueId] of selection.entries()) {
			if (!map.has(attributeId)) continue
			if (map.get(attributeId) !== valueId) {
				isCompatible = false
				break
			}
			score += 1
		}
		if (isCompatible && score > bestScore) {
			best = variant
			bestScore = score
		}
	}

	return best
}

/**
 * @param {Array<any>} variants
 * @param {number} attributeId
 * @param {number} valueId
 * @param {Map<number, number>} selectedValues
 */
const isValueEnabled = (variants, attributeId, valueId, selectedValues) => {
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

const buildReviewReportHref = reviewId => {
	const subject = 'Reportar resena'
	const body = `Creo que la resena ${reviewId} viola las politicas de Tiendu. Por favor revisen esta resena.`
	return `mailto:hello@tiendu.lat?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

const formatRelativeTime = value => {
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
	if (days < 7) return `hace ${days} ${days === 1 ? 'dia' : 'dias'}`
	if (weeks < 5) return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
	if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
	return `hace ${years} ${years === 1 ? 'ano' : 'anos'}`
}

const getUnitsSoldCopy = unitsSold => {
	if (!Number.isFinite(unitsSold) || unitsSold <= 0) return ''
	if (unitsSold < 5) return '3 unidades vendidas'
	if (unitsSold < 10) return 'Mas de 5 unidades vendidas'
	if (unitsSold < 20) return 'Mas de 10 unidades vendidas'
	if (unitsSold < 30) return 'Mas de 20 unidades vendidas'
	return 'Mas de 30 unidades vendidas'
}

const toSafeCssColor = value => {
	const color = String(value || '').trim()
	if (!color) return null
	if (/^#([0-9a-fA-F]{3,8})$/.test(color)) return color
	if (/^[a-zA-Z]+$/.test(color)) return color
	return null
}

const buildGalleryImages = (images, variants, fallbackAlt) => {
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

const renderRelatedProducts = products => {
	const container = document.getElementById('related-products-list')
	if (!container) return

	const relatedProducts = Array.isArray(products) ? products : []

	const list = document.createElement('product-list')

	for (const product of relatedProducts) {
		const item = document.createElement('product-item')
		const priceData = getListingPriceData(product)
		const validVariants = (product.variants || []).filter(v => typeof v?.priceInCents === 'number')

		item.setAttribute('product-id', String(product.id))
		item.setAttribute('title', product.title || 'Producto')
		item.setAttribute('price', priceData.label || '')
		item.setAttribute('average-rating', String(Number(product.averageRating) || 0))
		item.setAttribute('reviews-quantity', String(Number(product.reviewsQuantity) || 0))
		item.setAttribute('url', `/productos/${product.id}/${urlSafe(product.title || 'producto')}`)

		if (priceData.compareLabel) {
			item.setAttribute('compare-price', priceData.compareLabel)
		}

		if (product.coverImage?.url) {
			item.setAttribute('image-url', product.coverImage.url)
			item.setAttribute('image-alt', product.coverImage.alt || product.title || '')
		}

		if (validVariants.length === 1) {
			item.setAttribute('has-single-variant', 'true')
			item.setAttribute('variant-id', String(validVariants[0].id))
		} else if (validVariants.length > 1) {
			item.setAttribute('has-multiple-variants', 'true')
		}

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
	const variantIndex = buildVariantIndex(variants)
	const defaultVariant = variants[0] || null
	const selectedValues = defaultVariant ? extractVariantValueMap(defaultVariant) : new Map()

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
	const hasRelatedProducts = normalizedRelatedProducts.length > 0
	const images = Array.isArray(product.images) ? product.images : []
	const galleryImages = buildGalleryImages(images, variants, title)
	const reviews = Array.isArray(product.reviews) ? product.reviews : []
	const reviewsQuantity =
		typeof product.reviewsQuantity === 'number' ? product.reviewsQuantity : reviews.length
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

	const reviewItemsHtml = reviews.length
		? reviews
				.map(review => {
					const reviewId = Number(review?.id) || 0
					const reportHref = buildReviewReportHref(reviewId)
					const authorName = escapeHtml(review?.authorName || 'Cliente')
					const content = escapeHtml(review?.content || '')
					const reviewTime = escapeHtml(
						formatRelativeTime(review?.createdAt || review?.updatedAt)
					)
					const isVerified = Boolean(review?.isVerifiedPurchase)

					return `
						<article class="review-item">
							<header class="review-item__header">
								<div>
									<h3>${authorName}</h3>
									<p>${reviewTime}</p>
								</div>
								<div class="review-item__meta">
									<rating-stars value="${Math.max(1, Math.min(5, Number(review?.rating) || 0))}" size="18"></rating-stars>
									${
										isVerified
											? '<span class="review-item__verified"><i data-lucide="badge-check"></i>Compra verificada</span>'
											: ''
									}
								</div>
							</header>
							<p class="review-item__content">${content}</p>
							<footer class="review-item__actions">
								<a class="review-item__report" href="${reportHref}">Reportar</a>
								<a class="review-item__report-link" href="${reportHref}">
									mailto:hello@tiendu.lat?subject=Reportar resena&body=Creo que la resena ${reviewId} viola las politicas de Tiendu. Por favor revisen esta resena.
								</a>
							</footer>
						</article>
					`
				})
				.join('')
		: `<div class="empty-state"><i data-lucide="messages-square"></i><span class="empty-state__title">Este producto aun no tiene reseñas.</span></div>`

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
					<span>${Number(averageRating || 0).toFixed(1)} (${reviewsQuantity})</span>
				</button>
				<div class="product-price-line">
					<span class="product-price" id="product-price">-</span>
					<span class="product-compare" id="product-compare"></span>
				</div>
				<div id="variant-selector" class="variant-selector"></div>
				<div class="stock-note" id="stock-note"></div>
				<div class="product-actions">
					<tiendu-button id="add-to-cart-button" variant="primary" label="Agregar al carrito" loading-label="Agregar al carrito" icon="plus" loading-icon="loader-2" duration="4000"></tiendu-button>
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
					? `<p id="product-description-text" class="product-description" data-full="${escapeHtml(descriptionText)}">${escapeHtml(
							hasLongDescription
								? `${descriptionText.slice(0, descriptionPreviewLength).trimEnd()}...`
								: descriptionText
						)}</p>`
					: ''
			}
			${
				hasLongDescription && hasDescription
					? '<button type="button" id="description-toggle" class="description-toggle">Ver mas</button>'
					: ''
			}
			${hasSpecifications ? '<dl class="product-specs" id="product-specs"></dl>' : ''}
		</section>`
				: ''
		}

		<section id="reviews-section" class="reviews-section" aria-labelledby="reviews-title">
			<div class="section__header reviews-section__header">
				<h2 id="reviews-title" class="section__title section__title--large">Reseñas</h2>
				<span class="reviews-section__verified"><i data-lucide="shield-check"></i>Verificadas por Tiendu</span>
			</div>

			<div class="reviews-overview">
				<div class="reviews-overview__score">
					<strong>${Number(averageRating || 0).toFixed(1)}</strong>
					<rating-stars value="${Number(averageRating).toFixed(2)}" size="28"></rating-stars>
					<span>${reviewsQuantity} ${reviewsQuantity === 1 ? 'resena' : 'reseñas'}</span>
				</div>
				<div class="reviews-overview__distribution">
					${reviewRowsHtml}
				</div>
			</div>

			<div class="reviews-list">${reviewItemsHtml}</div>
		</section>

		${
			hasRelatedProducts
				? `<section id="related-products-section" class="related-products section" aria-labelledby="related-products-title">
			<div class="section__header">
				<h2 id="related-products-title" class="section__title section__title--large">Tambien te puede interesar</h2>
			</div>
			<div id="related-products-list" aria-live="polite"></div>
		</section>`
				: ''
		}
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
	const priceNode = document.getElementById('product-price')
	const compareNode = document.getElementById('product-compare')
	const stockNode = document.getElementById('stock-note')
	const addToCartButton = document.getElementById('add-to-cart-button')
	const goToReviewsButton = document.getElementById('go-to-reviews-button')
	const shareProductButton = document.getElementById('share-product-button')
	const descriptionToggle = document.getElementById('description-toggle')
	const descriptionNode = document.getElementById('product-description-text')
	let isDescriptionExpanded = false
	/** @type {Array<HTMLButtonElement>} */
	let variantOptionButtons = []
	/** @type {Array<any>} */
	let variantSelects = []

	let currentVariant = defaultVariant

	const updatePrice = () => {
		const priceData = getPriceDataForVariant(product, currentVariant)
		if (priceNode) priceNode.textContent = priceData.label
		if (compareNode) {
			compareNode.textContent = priceData.compareLabel || ''
		}
		if (stockNode) {
			const stock = currentVariant?.stock
			if (typeof stock === 'number') {
				if (stock === 0) {
					stockNode.innerHTML = 'Actualmente sin stock. Consultar por <a href="https://wa.me/59899424414" target="_blank" rel="noopener noreferrer">WhatsApp</a>'
					stockNode.style.color = '#ef4444'
				} else {
					stockNode.textContent = `${stock} ${stock === 1 ? 'unidad' : 'unidades'} en stock`
					stockNode.style.color = '#10b981'
				}
			} else {
				stockNode.textContent = 'Tenemos en stock'
				stockNode.style.color = '#64748b'
			}
		}
	}

	const renderVariantSelector = () => {
		if (!variantSelector) return
		const attributes = Array.isArray(product.attributes) ? product.attributes : []
		if (attributes.length === 0 || variants.length === 0) {
			variantSelector.style.display = 'none'
			return
		}

		if (variantSelector.childElementCount > 0) return

		const sectionHtml = attributes
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

		variantSelector.innerHTML = sectionHtml
		variantOptionButtons = Array.from(variantSelector.querySelectorAll('.option-chip'))
		variantSelects = Array.from(variantSelector.querySelectorAll('tiendu-attribute-select'))

		for (const select of variantSelects) {
			const attributeId = Number(select.dataset.attributeId)
			const attribute = attributes.find(item => Number(item.id) === attributeId)
			if (!attribute || !Array.isArray(attribute.values)) continue

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
		const attributes = Array.isArray(product.attributes) ? product.attributes : []

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
			const attribute = attributes.find(item => Number(item.id) === attributeId)
			if (!attribute || !Array.isArray(attribute.values)) continue

			const selectedValueId = selectedValues.get(attributeId)
			select.setValue(Number.isFinite(Number(selectedValueId)) ? selectedValueId : null)

			const disabledIds = attribute.values
				.filter(value => !isValueEnabled(variants, attributeId, value.id, selectedValues))
				.map(value => value.id)
			select.setDisabledOptionIds(disabledIds)
		}
	}

	const syncVariantFromSelection = () => {
		const selectedKey = serializeMap(selectedValues)
		currentVariant = variantIndex.get(selectedKey) || findBestMatchingVariant(variants, selectedValues)

		if (currentVariant) {
			for (const [attributeId, valueId] of extractVariantValueMap(currentVariant).entries()) {
				selectedValues.set(attributeId, valueId)
			}
		}

		updatePrice()
		updateVariantSelectorState()
		const unavailable = !currentVariant || currentVariant.stock === 0
		if (addToCartButton) {
			if (typeof addToCartButton.setDisabled === 'function') {
				addToCartButton.setDisabled(unavailable)
			} else if (unavailable) {
				addToCartButton.setAttribute('disabled', '')
			} else {
				addToCartButton.removeAttribute('disabled')
			}
		}

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
		const attributeId = Number(select.dataset.attributeId)
		const valueId = Number(event?.detail?.valueId)
		if (!Number.isFinite(attributeId) || !Number.isFinite(valueId)) return

		selectedValues.set(attributeId, valueId)
		syncVariantFromSelection()
	})

	if (addToCartButton) {
		addToCartButton.addEventListener('app-click', () => {
			if (!currentVariant || currentVariant.stock === 0) return
			if (typeof addToCartButton.startLoading === 'function') {
				addToCartButton.startLoading()
			}
			tiendu.cart
				.addProductVariant(currentVariant, 1, () => {
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

	if (goToReviewsButton) {
		goToReviewsButton.addEventListener('click', () => {
			const section = document.getElementById('reviews-section')
			if (!section) return
			section.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
				descriptionNode.textContent = descriptionText
				descriptionToggle.textContent = 'Ver menos'
			} else {
				descriptionNode.textContent = `${descriptionText.slice(0, descriptionPreviewLength).trimEnd()}...`
				descriptionToggle.textContent = 'Ver mas'
			}
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
		renderMessage('Producto invalido.')
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
