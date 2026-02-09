// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { getListingPriceData } from '/shared/product-pricing.js'
import { withPageLoading } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const url = new URL(window.location.href)

const formatResultsCopy = (total, query) => {
	if (query) {
		return total === 1
			? `1 resultado para "${query}"`
			: `${total} resultados para "${query}"`
	}
	return total === 1 ? '1 producto' : `${total} productos`
}

const renderEmpty = message => {
	const container = document.getElementById('products-list')
	if (!container) return
	container.innerHTML = `
		<div class="empty-state">
			<i data-lucide="package-search"></i>
			<span class="empty-state__title">${escapeHtml(message)}</span>
		</div>
	`
	refreshIcons()
}

const renderProducts = products => {
	const container = document.getElementById('products-list')
	if (!container) return

	if (!Array.isArray(products) || products.length === 0) {
		renderEmpty('No encontramos productos con ese criterio.')
		return
	}

	container.innerHTML = ''
	const list = document.createElement('product-list')

	for (const product of products) {
		const item = document.createElement('product-item')
		const priceData = getListingPriceData(product)
		const validVariants = (product.variants || []).filter(v => typeof v?.priceInCents === 'number')

		item.setAttribute('product-id', String(product.id))
		item.setAttribute('title', product.title)
		item.setAttribute('price', priceData.label)
		item.setAttribute('average-rating', String(Number(product.averageRating) || 0))
		item.setAttribute('reviews-quantity', String(Number(product.reviewsQuantity) || 0))
		
		if (priceData.compareLabel) {
			item.setAttribute('compare-price', priceData.compareLabel)
		}
		
		item.setAttribute('url', `/productos/${product.id}/${urlSafe(product.title)}`)
		
		if (product.coverImage?.url) {
			item.setAttribute('image-url', product.coverImage.url)
			item.setAttribute('image-alt', product.coverImage.alt || product.title)
		}
		
		// Pass variant info for quick actions
		if (validVariants.length === 1) {
			item.setAttribute('has-single-variant', 'true')
			item.setAttribute('variant-id', String(validVariants[0].id))
		} else if (validVariants.length > 1) {
			item.setAttribute('has-multiple-variants', 'true')
		}
		
		list.appendChild(item)
	}

	container.appendChild(list)
	refreshIcons()
}

const init = async () => {
	const search = url.searchParams.get('q')?.trim() || ''
	const resultsCopy = document.getElementById('products-results-copy')

	try {
		const response = await tiendu.products.list({ search, page: 1, size: 60 })
		const products = response.data || []
		
		if (resultsCopy) {
			resultsCopy.textContent = formatResultsCopy(products.length, search)
		}
		
		renderProducts(products)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderEmpty(`Error al cargar el catalogo: ${message}`)
	}
}

void withPageLoading(init)

export {}
