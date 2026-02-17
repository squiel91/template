// @ts-nocheck

import '/ui/home/trust-item.js'
import '/ui/home/testimonial-card.js'
import '/ui/home/media-highlight.js'
import '/ui/product-item/product-item.js'
import { tiendu } from '/shared/tiendu-client.js'
import { refreshIcons } from '/shared/icons.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import { escapeHtml } from '/shared/sanitize.js'

const FEATURED_PAGE_SIZE = 8
const FEATURED_CATEGORY_ID = 242

const renderFeaturedStatus = message => {
	const track = document.querySelector('[data-featured-group="featured"]')
	if (!(track instanceof HTMLElement)) return

	track.innerHTML = `<div class="model-featured__status">${escapeHtml(message)}</div>`
	track.removeAttribute('aria-busy')
}

const loadFeaturedProducts = async () => {
	const track = document.querySelector('[data-featured-group="featured"]')
	if (!(track instanceof HTMLElement)) return

	track.setAttribute('aria-busy', 'true')

	try {
		const response = await tiendu.products.list({
			categoryId: FEATURED_CATEGORY_ID,
			includeProductsFromSubcategories: true,
			criteria: 'created',
			order: 'desc',
			page: 1,
			size: FEATURED_PAGE_SIZE
		})

		const products = Array.isArray(response?.data) ? response.data : []
		if (products.length === 0) {
			renderFeaturedStatus('No hay productos disponibles en este momento.')
			return
		}

		const fragment = document.createDocumentFragment()
		for (const product of products) {
			if (!product || !Number.isFinite(Number(product.id))) continue
			fragment.appendChild(createProductItemElement(product))
		}

		if (fragment.childNodes.length === 0) {
			renderFeaturedStatus('No hay productos disponibles en este momento.')
			return
		}

		track.innerHTML = ''
		track.appendChild(fragment)
		refreshIcons()
	} catch (error) {
		console.error('[Home] Error loading featured products:', error)
		renderFeaturedStatus('No pudimos cargar los productos. Intentá de nuevo.')
	} finally {
		track.removeAttribute('aria-busy')
	}
}

const init = () => {
	void loadFeaturedProducts()
	refreshIcons()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init)
} else {
	init()
}

export {}
