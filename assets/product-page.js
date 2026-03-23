// @ts-nocheck

/**
 * PDP hydration script for Liquid-rendered product pages.
 * Product HTML is rendered server-side; this script hydrates interactive behaviors:
 * - Image gallery
 * - Variant selection (chips + dropdowns)
 * - Price & stock updates
 * - Add-to-cart
 * - Reviews toggle
 * - Description toggle
 * - Share button
 */

import '/assets/listing-quick-add.js'
import { Tiendu } from '/assets/tiendu-sdk.js'
import { createProductGallery } from '/assets/gallery.js'
import { showWarningToast } from '/assets/toast.js'
import {
	getPriceDataForVariant,
	getVariantSetPriceData,
	getVariantSetStockData,
	getSharedVariantCoverImageId
} from '/assets/product-pricing.js'
import {
	getStoreWhatsAppUrl,
	buildOutOfStockWhatsAppUrl,
	hasPurchasablePrice,
	normalizeVariants,
	extractVariantValueMap,
	serializeMap,
	buildVariantIndex
} from '/assets/helpers.js'

const tiendu = Tiendu()

const loadProductFromPage = () => {
	const scriptEl = document.getElementById('product-json')
	if (!scriptEl) return null
	try {
		return JSON.parse(scriptEl.textContent || '{}')
	} catch {
		return null
	}
}

const setButtonState = (button, { label, icon, disabled = false, loading = false } = {}) => {
	if (!(button instanceof HTMLButtonElement)) return
	const labelText = loading ? button.dataset.loadingLabel || label || '' : label || ''
	button.dataset.icon = icon || button.dataset.icon || 'plus'
	button.dataset.loading = loading ? 'true' : 'false'
	button.disabled = Boolean(disabled || loading)
	const labelNode = button.querySelector('.button__label')
	if (labelNode) labelNode.textContent = labelText
	const nextIcon = loading
		? button.dataset.loadingIcon || 'loader-2'
		: icon || button.dataset.icon || 'plus'
	for (const iconNode of button.querySelectorAll('[data-button-icon]')) {
		if (!(iconNode instanceof HTMLElement)) continue
		iconNode.hidden = iconNode.dataset.buttonIcon !== nextIcon
	}
}

const readSelectedValuesFromDom = root => {
	const selectedValues = new Map()
	if (!(root instanceof HTMLElement)) return selectedValues

	for (const button of root.querySelectorAll('.option-chip[aria-pressed="true"]')) {
		if (!(button instanceof HTMLButtonElement)) continue
		const attributeId = Number(button.dataset.attributeId)
		const valueId = Number(button.dataset.valueId)
		if (!Number.isFinite(attributeId) || !Number.isFinite(valueId)) continue
		selectedValues.set(attributeId, valueId)
	}

	for (const option of root.querySelectorAll('.variant-select__option[aria-selected="true"]')) {
		if (!(option instanceof HTMLButtonElement)) continue
		const select = option.closest('.variant-select')
		if (!(select instanceof HTMLElement)) continue
		const attributeId = Number(select.dataset.attributeId)
		const valueId = Number(option.dataset.valueId)
		if (!Number.isFinite(attributeId) || !Number.isFinite(valueId)) continue
		selectedValues.set(attributeId, valueId)
	}

	return selectedValues
}

const hydrateProduct = product => {
	if (!product) return

	const variants = normalizeVariants(product.variants)
	const productAttributes = Array.isArray(product.attributes) ? product.attributes : []
	const variantIndex = buildVariantIndex(variants)
	const variantValueEntries = variants.map(variant => ({
		variant,
		valueMap: extractVariantValueMap(variant)
	}))
	const defaultVariant = variants[0] || null
	const requiresVariantSelection = variants.length > 1 && productAttributes.length > 0
	const variantSelector = document.getElementById('variant-selector')
	const selectedValuesFromDom = readSelectedValuesFromDom(variantSelector)
	const variantFromDom =
		selectedValuesFromDom.size > 0
			? variantIndex.get(serializeMap(selectedValuesFromDom)) || null
			: null
	const currentUrl = new URL(window.location.href)
	const initialVariantId = Number(currentUrl.searchParams.get('variant-id'))
	const variantFromUrl = variants.find(variant => variant.id === initialVariantId) || null
	const initialVariant =
		variantFromUrl || variantFromDom || (requiresVariantSelection ? null : defaultVariant)
	const selectedValues = initialVariant
		? extractVariantValueMap(initialVariant)
		: selectedValuesFromDom.size > 0
			? new Map(selectedValuesFromDom)
			: new Map()

	const title = product.title || 'Producto'
	const gallery = createProductGallery(document.getElementById('product-gallery'))
	const priceNode = document.getElementById('product-price')
	const compareNode = document.getElementById('product-compare')
	const priceLineNode = priceNode?.closest('.product-price-line')
	const stockNode = document.getElementById('stock-note')
	const addToCartButton = document.getElementById('add-to-cart-button')
	const quantityInput = document.getElementById('product-quantity-input')
	const quantityField = quantityInput?.querySelector('.quantity-input__field')
	const quantityDecreaseButton = quantityInput?.querySelector('[data-quantity-decrease]')
	const quantityIncreaseButton = quantityInput?.querySelector('[data-quantity-increase]')
	const goToReviewsButton = document.getElementById('go-to-reviews-button')
	const shareProductButton = document.getElementById('share-product-button')
	const descriptionToggle = document.getElementById('description-toggle')
	const reviewsList = document.getElementById('reviews-list')
	const reviewsToggle = document.getElementById('reviews-toggle')
	const reviewsToggleLabel = document.getElementById('reviews-toggle-label')
	const descriptionWrap = document.getElementById('product-description-wrap')
	const descriptionFade = document.getElementById('product-description-fade')
	const descriptionToggleLabel = document.getElementById('description-toggle-label')
	let isDescriptionExpanded = false

	let variantOptionButtons = Array.from(variantSelector?.querySelectorAll('.option-chip') || [])
	let variantSelects = Array.from(variantSelector?.querySelectorAll('.variant-select') || [])
	const variantSelectCloseTimers = new WeakMap()

	let currentVariant = initialVariant
	let matchingVariants = variants
	let quantity = 1

	tiendu.analytics.trackViewContent({
		productId: product.id,
		productTitle: product.title,
		productVariantId: currentVariant?.id ?? defaultVariant?.id,
		priceInCents: currentVariant?.priceInCents ?? defaultVariant?.priceInCents ?? product.basePriceInCents
	})

	const getVariantMaxQuantity = () => {
		const stock = currentVariant?.stock
		if (typeof stock !== 'number') return null
		if (stock <= 0) return 0
		return Math.floor(stock)
	}

	const setStockNote = (tone, message) => {
		if (!stockNode) return
		stockNode.setAttribute('data-tone', tone)
		stockNode.className = `product-stock-note product-stock-note--${tone}`
		const messageNode = stockNode.querySelector('.product-stock-note__message')
		if (messageNode) messageNode.textContent = message
	}

	const setStockFromQuantity = stock => {
		if (stock === 0) {
			setStockNote('error', 'Temporalmente agotado')
			return
		}
		if (stock <= 4) {
			setStockNote('warning', `Quedan ${stock} ${stock === 1 ? 'unidad' : 'unidades'} en stock`)
			return
		}
		setStockNote('success', `${stock} ${stock === 1 ? 'unidad' : 'unidades'} en stock`)
	}

	const setVariableStockNote = () => {
		setStockNote('neutral', 'Selecciona una opción para ver el stock')
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

		if (quantityInput instanceof HTMLElement) quantityInput.hidden = !hasPrice
		quantity = clampQuantity(quantity)
		const atMin = quantity <= 1
		const atMax = typeof maxQuantity === 'number' ? quantity >= maxQuantity : false
		if (quantityField instanceof HTMLInputElement) {
			quantityField.min = '1'
			if (typeof maxQuantity === 'number' && maxQuantity > 0) quantityField.max = String(maxQuantity)
			else quantityField.removeAttribute('max')
			quantityField.disabled = !shouldEnable
			quantityField.value = String(quantity)
		}
		if (quantityDecreaseButton instanceof HTMLButtonElement) {
			quantityDecreaseButton.disabled = !shouldEnable || atMin
		}
		if (quantityIncreaseButton instanceof HTMLButtonElement) {
			quantityIncreaseButton.disabled = !shouldEnable || atMax
		}
	}

	const isVariantSelectionComplete = () => {
		if (!requiresVariantSelection) return true
		return productAttributes.every(attribute => selectedValues.has(Number(attribute.id)))
	}

	const getMatchingVariants = () => {
		if (!requiresVariantSelection) return variants
		if (selectedValues.size === 0) return variants
		return variantValueEntries
			.filter(({ valueMap }) => {
				for (const [selectedAttrId, selectedValueId] of selectedValues.entries()) {
					if (valueMap.get(selectedAttrId) !== selectedValueId) return false
				}
				return true
			})
			.map(({ variant }) => variant)
	}

	const isValueEnabledForSelection = (attributeId, valueId) => {
		return variantValueEntries.some(({ valueMap }) => {
			if (valueMap.get(attributeId) !== valueId) return false
			for (const [selectedAttrId, selectedValueId] of selectedValues.entries()) {
				if (selectedAttrId === attributeId) continue
				if (valueMap.has(selectedAttrId) && valueMap.get(selectedAttrId) !== selectedValueId) return false
			}
			return true
		})
	}

	const updatePrice = () => {
		if (requiresVariantSelection && !currentVariant) {
			const priceData = getVariantSetPriceData({ product, variants: matchingVariants })
			const hasPrice = typeof priceData?.label === 'string' && priceData.label.length > 0
			if (priceLineNode) priceLineNode.hidden = !hasPrice
			if (priceNode) priceNode.textContent = hasPrice ? priceData.label : ''
			if (compareNode) {
				compareNode.textContent = hasPrice ? priceData.compareLabel || '' : ''
				compareNode.hidden = !hasPrice || !priceData.compareLabel
			}
			if (stockNode) {
				const stockData = getVariantSetStockData(matchingVariants)
				if (stockData.mode === 'exact' && typeof stockData.value === 'number') setStockFromQuantity(stockData.value)
				else if (stockData.mode === 'untracked') setStockNote('success', 'Tenemos en stock')
				else setVariableStockNote()
			}
			return
		}

		const priceData = getPriceDataForVariant(product, currentVariant)
		const hasPrice = hasPurchasablePrice(product, currentVariant)
		if (priceLineNode) priceLineNode.hidden = !hasPrice
		if (priceNode) priceNode.textContent = hasPrice ? priceData.label : ''
		if (compareNode) {
			compareNode.textContent = hasPrice ? priceData.compareLabel || '' : ''
			compareNode.hidden = !hasPrice || !priceData.compareLabel
		}
		if (stockNode) {
			const stock = currentVariant?.stock
			if (typeof stock === 'number') setStockFromQuantity(Math.max(0, Math.floor(stock)))
			else setStockNote('success', 'Tenemos en stock')
		}
	}

	const updateAddToCartAction = () => {
		if (!(addToCartButton instanceof HTMLButtonElement)) return
		if (requiresVariantSelection && !currentVariant) {
			setButtonState(addToCartButton, {
				label: 'Agregar al carrito',
				icon: 'plus',
				disabled: false
			})
			syncQuantityUi()
			return
		}
		const hasPrice = hasPurchasablePrice(product, currentVariant)
		const isOutOfStock = Boolean(currentVariant && currentVariant.stock === 0)
		if (isOutOfStock) {
			setButtonState(addToCartButton, {
				label: 'Consultar',
				icon: 'message-square',
				disabled: false
			})
			syncQuantityUi()
			return
		}
		if (!hasPrice) {
			setButtonState(addToCartButton, {
				label: 'Consultar precio',
				icon: 'message-square',
				disabled: false
			})
			syncQuantityUi()
			return
		}
		setButtonState(addToCartButton, {
			label: 'Agregar al carrito',
			icon: 'plus',
			disabled: !currentVariant
		})
		syncQuantityUi()
	}

	const showVariantSelectionWarning = () => {
		showWarningToast('Elegi una variante antes de agregarla al carrito', 5000)
	}

	const syncVariantUrl = () => {
		const nextUrl = new URL(window.location.href)
		const hadVariantId = nextUrl.searchParams.has('variant-id')
		if (currentVariant?.id && variants.length > 1) {
			nextUrl.searchParams.set('variant-id', String(currentVariant.id))
		} else {
			nextUrl.searchParams.delete('variant-id')
		}

		const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
		const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`
		if (nextHref === currentHref && hadVariantId === nextUrl.searchParams.has('variant-id')) return
		window.history.replaceState(window.history.state, '', nextHref)
	}

	const syncVariantSelectTrigger = (select, selectedValueId) => {
		if (!(select instanceof HTMLElement)) return
		const labelNode = select.querySelector('[data-variant-select-label]')
		const swatchNode = select.querySelector('[data-variant-select-trigger-swatch]')
		const selectedOption = Array.from(select.querySelectorAll('.variant-select__option')).find(
			option => Number(option.dataset.valueId) === Number(selectedValueId)
		)

		if (labelNode instanceof HTMLElement) {
			labelNode.textContent = selectedOption?.dataset.label || 'Selecciona una opción'
			labelNode.classList.toggle('variant-select__label--placeholder', !selectedOption)
		}

		if (swatchNode instanceof HTMLElement) {
			const swatch = selectedOption?.querySelector('.variant-select__swatch')
			swatchNode.innerHTML = swatch ? swatch.outerHTML : ''
			swatchNode.classList.toggle('variant-select__trigger-swatch--hidden', !swatch)
		}
	}

	const closeVariantSelect = (select, immediate = false) => {
		if (!(select instanceof HTMLElement)) return
		const menu = select.querySelector('[data-variant-select-menu]')
		const trigger = select.querySelector('[data-variant-select-trigger]')
		if (!(menu instanceof HTMLElement) || !(trigger instanceof HTMLButtonElement)) return
		const existingTimer = variantSelectCloseTimers.get(select)
		if (existingTimer) {
			window.clearTimeout(existingTimer)
			variantSelectCloseTimers.delete(select)
		}
		select.dataset.open = 'false'
		trigger.setAttribute('aria-expanded', 'false')
		if (immediate || menu.hidden) {
			menu.hidden = true
			menu.removeAttribute('data-state')
			return
		}
		menu.dataset.state = 'closing'
		const timer = window.setTimeout(() => {
			menu.hidden = true
			menu.removeAttribute('data-state')
			variantSelectCloseTimers.delete(select)
		}, 180)
		variantSelectCloseTimers.set(select, timer)
	}

	const openVariantSelect = select => {
		if (!(select instanceof HTMLElement)) return
		for (const otherSelect of variantSelects) {
			if (otherSelect === select) continue
			closeVariantSelect(otherSelect, true)
		}
		const menu = select.querySelector('[data-variant-select-menu]')
		const trigger = select.querySelector('[data-variant-select-trigger]')
		if (!(menu instanceof HTMLElement) || !(trigger instanceof HTMLButtonElement)) return
		const existingTimer = variantSelectCloseTimers.get(select)
		if (existingTimer) {
			window.clearTimeout(existingTimer)
			variantSelectCloseTimers.delete(select)
		}
		select.dataset.open = 'true'
		trigger.setAttribute('aria-expanded', 'true')
		menu.hidden = false
		menu.dataset.state = 'open'
	}

	const updateVariantSelectorState = () => {
		if (!variantSelector) return
		variantOptionButtons = Array.from(variantSelector.querySelectorAll('.option-chip'))
		variantSelects = Array.from(variantSelector.querySelectorAll('.variant-select'))

		for (const button of variantOptionButtons) {
			if (!(button instanceof HTMLButtonElement)) continue
			const attributeId = Number(button.dataset.attributeId)
			const valueId = Number(button.dataset.valueId)
			if (!Number.isFinite(attributeId) || !Number.isFinite(valueId)) continue
			const selected = selectedValues.get(attributeId) === valueId
			const enabled = isValueEnabledForSelection(attributeId, valueId)
			button.setAttribute('aria-pressed', selected ? 'true' : 'false')
			button.disabled = !enabled
		}

		for (const select of variantSelects) {
			if (!(select instanceof HTMLElement)) continue
			const attributeId = Number(select.dataset.attributeId)
			const attribute = productAttributes.find(item => Number(item.id) === attributeId)
			if (!attribute || !Array.isArray(attribute.values)) continue
			const selectedValueId = selectedValues.get(attributeId)
			for (const option of select.querySelectorAll('.variant-select__option')) {
				if (!(option instanceof HTMLButtonElement)) continue
				const valueId = Number(option.dataset.valueId)
				if (!Number.isFinite(valueId)) {
					option.disabled = false
					continue
				}
				option.setAttribute('aria-selected', selectedValueId === valueId ? 'true' : 'false')
				option.disabled = !isValueEnabledForSelection(attributeId, valueId)
			}
			syncVariantSelectTrigger(select, selectedValueId)
		}
	}

	const syncVariantFromSelection = () => {
		matchingVariants = getMatchingVariants()
		if (requiresVariantSelection && !isVariantSelectionComplete()) {
			currentVariant = null
		} else {
			const selectedKey = serializeMap(selectedValues)
			currentVariant = variantIndex.get(selectedKey) || (requiresVariantSelection ? null : defaultVariant)
		}

		updatePrice()
		updateVariantSelectorState()
		updateAddToCartAction()
		syncVariantUrl()

		if (gallery && typeof currentVariant?.coverImage?.id === 'number') {
			gallery.setCurrentImageById(currentVariant.coverImage.id)
			return
		}
		if (gallery) {
			const sharedImageId = getSharedVariantCoverImageId(matchingVariants)
			if (typeof sharedImageId === 'number') gallery.setCurrentImageById(sharedImageId)
		}
	}

	variantSelector?.addEventListener('click', event => {
		const target = event.target instanceof Element ? event.target.closest('button') : null
		if (!(target instanceof HTMLButtonElement)) return

		const selectTrigger = target.closest('[data-variant-select-trigger]')
		if (selectTrigger) {
			event.preventDefault()
			const select = selectTrigger.closest('.variant-select')
			if (!(select instanceof HTMLElement)) return
			if (select.dataset.open === 'true') closeVariantSelect(select)
			else openVariantSelect(select)
			return
		}

		const selectOption = target.closest('.variant-select__option')
		if (selectOption instanceof HTMLButtonElement) {
			event.preventDefault()
			const select = selectOption.closest('.variant-select')
			if (!(select instanceof HTMLElement)) return
			const attributeId = Number(select.dataset.attributeId)
			const valueId = Number(selectOption.dataset.valueId)
			if (!Number.isFinite(attributeId) || !Number.isFinite(valueId) || selectOption.disabled) return
			selectedValues.set(attributeId, valueId)
			closeVariantSelect(select)
			syncVariantFromSelection()
			return
		}

		const attributeId = Number(target.dataset.attributeId)
		const valueId = Number(target.dataset.valueId)
		if (!Number.isFinite(attributeId) || !Number.isFinite(valueId)) return
		selectedValues.set(attributeId, valueId)
		syncVariantFromSelection()
	})

	document.addEventListener('click', event => {
		if (!(event.target instanceof Node)) return
		if (variantSelector?.contains(event.target)) return
		for (const select of variantSelects) closeVariantSelect(select)
	})

	document.addEventListener('keydown', event => {
		if (event.key !== 'Escape') return
		for (const select of variantSelects) closeVariantSelect(select)
	})

	if (addToCartButton instanceof HTMLButtonElement) {
		addToCartButton.addEventListener('click', () => {
			if (requiresVariantSelection && !currentVariant) {
				showVariantSelectionWarning()
				return
			}
			if (currentVariant && currentVariant.stock === 0) {
				const outOfStockUrl = buildOutOfStockWhatsAppUrl(title)
				if (outOfStockUrl) window.open(outOfStockUrl, '_blank', 'noopener,noreferrer')
				return
			}
			if (!hasPurchasablePrice(product, currentVariant)) {
				const contactUrl = getStoreWhatsAppUrl()
				if (contactUrl) window.open(contactUrl, '_blank', 'noopener,noreferrer')
				return
			}
			if (!currentVariant) return

			setButtonState(addToCartButton, {
				label: addToCartButton.querySelector('.button__label')?.textContent || 'Agregar al carrito',
				icon: addToCartButton.dataset.icon || 'plus',
				loading: true
			})

			tiendu.cart
				.addProductVariant(currentVariant, clampQuantity(quantity), () => {
					updateAddToCartAction()
				})
				.catch(() => {
					updateAddToCartAction()
				})
		})
	}

	if (quantityInput instanceof HTMLElement && quantityField instanceof HTMLInputElement) {
		quantityInput.addEventListener('click', event => {
			const target = event.target instanceof Element ? event.target.closest('button') : null
			if (!(target instanceof HTMLButtonElement)) return
			if (target.hasAttribute('data-quantity-decrease')) quantity = clampQuantity(quantity - 1)
			if (target.hasAttribute('data-quantity-increase')) quantity = clampQuantity(quantity + 1)
			quantityField.value = String(quantity)
			syncQuantityUi()
		})

		quantityField.addEventListener('input', () => {
			const cleanedValue = quantityField.value.replace(/[^0-9]/g, '')
			if (cleanedValue !== quantityField.value) quantityField.value = cleanedValue
		})

		const commitQuantity = () => {
			quantity = clampQuantity(Number(quantityField.value))
			quantityField.value = String(quantity)
			syncQuantityUi()
		}

		quantityField.addEventListener('change', commitQuantity)
		quantityField.addEventListener('blur', commitQuantity)
		quantityField.addEventListener('keydown', event => {
			if (event.key !== 'Enter') return
			event.preventDefault()
			commitQuantity()
			quantityField.blur()
		})
	}

	if (goToReviewsButton) {
		goToReviewsButton.addEventListener('click', () => {
			const section = document.getElementById('reviews-section')
			if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
		})
	}

	if (reviewsToggle && reviewsList) {
		reviewsToggle.addEventListener('click', () => {
			const expanded = reviewsList.getAttribute('data-expanded') === 'true'
			const nextExpanded = !expanded
			reviewsList.setAttribute('data-expanded', nextExpanded ? 'true' : 'false')
			reviewsToggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false')
			reviewsToggle.classList.toggle('is-expanded', nextExpanded)
			if (reviewsToggleLabel) reviewsToggleLabel.textContent = nextExpanded ? 'Mostrar menos' : 'Ver más reseñas'
		})
	}

	if (shareProductButton instanceof HTMLButtonElement) {
		if (typeof navigator.share !== 'function') {
			shareProductButton.style.display = 'none'
		} else {
			shareProductButton.addEventListener('click', async () => {
				try {
					await navigator.share({ title, text: `Mira este producto: ${title}`, url: window.location.href })
				} catch (error) {
					if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return
				}
			})
		}
	}

	if (descriptionToggle) {
		descriptionToggle.addEventListener('click', () => {
			isDescriptionExpanded = !isDescriptionExpanded
			if (isDescriptionExpanded) {
				if (descriptionToggleLabel) descriptionToggleLabel.textContent = 'Ver menos'
				descriptionToggle.classList.add('is-expanded')
				descriptionWrap?.classList.remove('is-collapsed')
				descriptionWrap?.classList.add('is-expanded')
				descriptionFade?.setAttribute('hidden', 'true')
			} else {
				if (descriptionToggleLabel) descriptionToggleLabel.textContent = 'Ver más'
				descriptionToggle.classList.remove('is-expanded')
				descriptionWrap?.classList.remove('is-expanded')
				descriptionWrap?.classList.add('is-collapsed')
				descriptionFade?.removeAttribute('hidden')
			}
		})
	}

	syncVariantFromSelection()
}

const product = loadProductFromPage()
if (product) {
	hydrateProduct(product)
}

export {}
