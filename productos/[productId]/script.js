// @ts-nocheck

import '/ui/loading-button/loading-button.js'
import { tiendu } from '/shared/tiendu-client.js'
import { getPriceDataForVariant } from '/shared/product-pricing.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'

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

/** @param {any} product */
const renderProduct = product => {
	const container = document.getElementById('product')
	if (!container) return

	const variants = normalizeVariants(product.variants)
	const variantIndex = buildVariantIndex(variants)
	const defaultVariant = variants[0] || null
	const selectedValues = defaultVariant ? extractVariantValueMap(defaultVariant) : new Map()

	const title = product.title || 'Producto'
	const description = product.description || 'Sin descripcion disponible.'
	const images = Array.isArray(product.images) ? product.images : []
	const firstImage = images[0]

	container.innerHTML = `
		<section class="product-detail">
			<div>
				<img class="product-main-image" id="product-main-image" alt="${escapeHtml(title)}" ${
					firstImage?.url ? `src="${escapeHtml(firstImage.url)}"` : ''
				} />
				<div id="product-thumbs" class="product-thumbs"></div>
			</div>
			<div class="product-info">
				<h1 class="page-title">${escapeHtml(title)}</h1>
				<div class="product-price-line">
					<span class="product-price" id="product-price">-</span>
					<span class="product-compare" id="product-compare"></span>
				</div>
				<p class="product-description">${escapeHtml(description)}</p>
				<div id="variant-selector" class="variant-selector"></div>
				<div class="product-actions">
					<loading-button id="add-to-cart-button" label="Agregar al carrito" loading-label="Agregando" duration="900"></loading-button>
					<span class="stock-note" id="stock-note"></span>
				</div>
				<dl class="product-specs" id="product-specs"></dl>
			</div>
		</section>
	`

	const breadcrumb = document.getElementById('product-breadcrumb')
	if (breadcrumb) breadcrumb.textContent = title

	document.title = `${title} | Tienda Genérica`
	const descriptionMeta = document.querySelector('meta[name="description"]')
	if (descriptionMeta) {
		descriptionMeta.setAttribute('content', description.slice(0, 150))
	}

	const mainImage = document.getElementById('product-main-image')
	const thumbs = document.getElementById('product-thumbs')
	if (thumbs && mainImage) {
		if (images.length > 1) {
			thumbs.innerHTML = images
				.map(
					(image, index) => `<button type="button" data-image-url="${escapeHtml(image.url)}" data-image-alt="${
						escapeHtml(image.alt || title)
					}" class="${index === 0 ? 'is-active' : ''}">
						<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || title)}" loading="lazy" />
					</button>`
				)
				.join('')

			thumbs.addEventListener('click', event => {
				const button = event.target instanceof Element ? event.target.closest('button') : null
				if (!(button instanceof HTMLButtonElement)) return
				const imageUrl = button.dataset.imageUrl
				const imageAlt = button.dataset.imageAlt
				if (!imageUrl || !(mainImage instanceof HTMLImageElement)) return
				mainImage.src = imageUrl
				mainImage.alt = imageAlt || title
				for (const activeButton of thumbs.querySelectorAll('button')) {
					activeButton.classList.remove('is-active')
				}
				button.classList.add('is-active')
			})
		}
	}

	const variantSelector = document.getElementById('variant-selector')
	const priceNode = document.getElementById('product-price')
	const compareNode = document.getElementById('product-compare')
	const stockNode = document.getElementById('stock-note')
	const addToCartButton = document.getElementById('add-to-cart-button')

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
				stockNode.textContent = stock > 0 ? `${stock} disponibles` : 'Sin stock'
			} else {
				stockNode.textContent = 'Stock sujeto a disponibilidad'
			}
		}
	}

	const renderVariantSelector = () => {
		if (!variantSelector) return
		const attributes = Array.isArray(product.attributes) ? product.attributes : []
		if (attributes.length === 0 || variants.length === 0) {
			variantSelector.innerHTML = '<p class="stock-note">Sin opciones configurables.</p>'
			return
		}

		const sectionHtml = attributes
			.map(attribute => {
				const optionsHtml = attribute.values
					.map(value => {
						const selected = selectedValues.get(attribute.id) === value.id
						const enabled = isValueEnabled(variants, attribute.id, value.id, selectedValues)
						return `<button type="button" class="option-chip" data-attribute-id="${attribute.id}" data-value-id="${value.id}" aria-pressed="${selected}" ${
							enabled ? '' : 'disabled'
						}><i data-lucide="check"></i><span>${escapeHtml(value.value)}</span></button>`
					})
					.join('')

				return `<fieldset class="variant-group">
					<legend>${escapeHtml(attribute.name)}</legend>
					<div class="variant-options">${optionsHtml}</div>
				</fieldset>`
			})
			.join('')

		variantSelector.innerHTML = sectionHtml
		refreshIcons()
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
		renderVariantSelector()
		const unavailable = !currentVariant || currentVariant.stock === 0
		if (addToCartButton) {
			if (unavailable) {
				addToCartButton.setAttribute('disabled', '')
			} else {
				addToCartButton.removeAttribute('disabled')
			}
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

	if (addToCartButton) {
		addToCartButton.addEventListener('loading-click', () => {
			if (!currentVariant || currentVariant.stock === 0) return
			tiendu.cart.addProductVariant(currentVariant, 1)
		})
	}

	const specsNode = document.getElementById('product-specs')
	if (specsNode && Array.isArray(product.specifications)) {
		const visibleSpecs = product.specifications.filter(spec => !spec.name.startsWith('_'))
		specsNode.innerHTML = visibleSpecs
			.map(
				spec => `<div>
					<dt>${escapeHtml(spec.name)}</dt>
					<dd>${escapeHtml(spec.value)}</dd>
				</div>`
			)
			.join('')
	}

	syncVariantFromSelection()
	updatePrice()
	refreshIcons()
}

const renderMessage = message => {
	const container = document.getElementById('product')
	if (!container) return
	container.innerHTML = `<div class="empty-state"><i data-lucide="alert-circle"></i><span>${escapeHtml(message)}</span></div>`
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
		const product = await tiendu.products.get(productId)
		renderProduct(product)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderMessage(`No se pudo cargar el producto: ${message}`)
	}
}

init()

export {}
