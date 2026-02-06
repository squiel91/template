// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { getListingPriceData } from '/shared/product-pricing.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const renderState = message => {
	const container = document.getElementById('category-products')
	if (!container) return
	container.innerHTML = `<div class="empty-state"><i data-lucide="package-search"></i><span>${escapeHtml(message)}</span></div>`
	refreshIcons()
}

const renderProducts = products => {
	const container = document.getElementById('category-products')
	if (!container) return

	if (!Array.isArray(products) || products.length === 0) {
		renderState('No hay productos publicados en esta categoria.')
		return
	}

	container.innerHTML = ''
	const list = document.createElement('product-list')

	for (const product of products) {
		const item = document.createElement('product-item')
		const priceData = getListingPriceData(product)
		item.setAttribute('product-id', String(product.id))
		item.setAttribute('title', product.title)
		item.setAttribute('price', priceData.label)
		if (priceData.compareLabel) {
			item.setAttribute('compare-price', priceData.compareLabel)
		}
		item.setAttribute('url', `/productos/${product.id}/${urlSafe(product.title)}`)
		if (product.coverImage?.url) {
			item.setAttribute('image-url', product.coverImage.url)
			item.setAttribute('image-alt', product.coverImage.alt || product.title)
		}
		list.appendChild(item)
	}

	container.appendChild(list)
	refreshIcons()
}

const init = async () => {
	const params = /** @type {{ categoryId?: string }} */ (
		/** @type {any} */ (window).PARAMS ?? {}
	)
	const categoryId = Number(params.categoryId)

	if (!Number.isFinite(categoryId) || categoryId < 1) {
		renderState('Categoria no valida.')
		return
	}

	try {
		const [category, response] = await Promise.all([
			tiendu.categories.get(categoryId),
			tiendu.products.list({
				categoryId,
				includeProductsFromSubcategories: true,
				page: 1,
				size: 60
			})
		])

		const categoryTitle = document.getElementById('category-title')
		if (categoryTitle) categoryTitle.textContent = category.name

		const categoryBreadcrumb = document.getElementById('category-breadcrumb')
		if (categoryBreadcrumb) categoryBreadcrumb.textContent = category.name

		const categoryDescription = document.getElementById('category-description')
		if (categoryDescription) {
			categoryDescription.textContent = category.description || 'Productos de esta categoria.'
		}

		document.title = `${category.name} | Tienda Genérica`
		renderProducts(response.data || [])
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(`Error al cargar la categoria: ${message}`)
	}
}

init()

export {}
