// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import { createInfiniteScroll } from '/shared/infinite-scroll.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import {
	getCurrentRelativeUrlWithoutOrigin,
	getOriginFromCurrentUrl
} from '/shared/navigation-origin.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'

const PAGE_SIZE = 20

const renderState = message => {
	const container = document.getElementById('category-products')
	if (!container) return
	container.innerHTML = `
		<div class="empty-state">
			<i data-lucide="package-search"></i>
			<span class="empty-state__title">${escapeHtml(message)}</span>
		</div>
	`
	refreshIcons()
}

const renderProducts = (list, products, origin) => {
	const container = document.getElementById('category-products')
	if (!container) return

	if (!Array.isArray(products) || products.length === 0) {
		renderState('No hay productos publicados en esta categoria.')
		return
	}

	for (const product of products) {
		list.appendChild(createProductItemElement(product, { origin }))
	}
	refreshIcons()
}

const init = async () => {
	const params = /** @type {{ categoryId?: string }} */ (
		/** @type {any} */ (window).PARAMS ?? {}
	)
	const categoryId = Number(params.categoryId)
	const origin = getOriginFromCurrentUrl()

	if (!Number.isFinite(categoryId) || categoryId < 1) {
		renderState('Categoria no valida.')
		return
	}

	try {
		const [category] = await Promise.all([
			tiendu.categories.get(categoryId),
			tiendu.products.list({
				categoryId,
				includeProductsFromSubcategories: true,
				page: 1,
				size: PAGE_SIZE
			})
		])

		const categoryTitle = document.getElementById('category-title')
		if (categoryTitle) categoryTitle.textContent = category.name

		const categoryBreadcrumb = document.getElementById('category-breadcrumbs')
		if (categoryBreadcrumb && typeof categoryBreadcrumb.setItems === 'function') {
			const items = [{ label: 'Inicio', href: '/' }]
			if (origin) {
				items.push({ label: origin.title, href: origin.url })
			}
			categoryBreadcrumb.setItems(items)
		}
		if (categoryBreadcrumb && typeof categoryBreadcrumb.setCurrentLabel === 'function') {
			categoryBreadcrumb.setCurrentLabel(category.name)
		}

		const categoryDescription = document.getElementById('category-description')
		if (categoryDescription) {
			categoryDescription.textContent = category.description || `${category.productCount || 0} productos en esta categoria`
		}

		document.title = `${category.name} | Tienda Genérica`

		const container = document.getElementById('category-products')
		if (!container) return
		container.innerHTML = ''
		const list = document.createElement('product-list')
		container.appendChild(list)

		let page = 0
		let hasMore = true
		const productOrigin = {
			url: getCurrentRelativeUrlWithoutOrigin(),
			title: category.name || 'Categoria'
		}

		const loadNextPage = async () => {
			if (!hasMore) return false
			page += 1
			const response = await tiendu.products.list({
				categoryId,
				includeProductsFromSubcategories: true,
				page,
				size: PAGE_SIZE
			})
			const products = response?.data || []

			if (page === 1 && products.length === 0) {
				renderState('No hay productos publicados en esta categoria.')
				hasMore = false
				return false
			}

			renderProducts(list, products, productOrigin)
			hasMore = products.length === PAGE_SIZE
			return hasMore
		}

		const shouldKeepLoading = await loadNextPage()
		if (!hasMore) return

		const scroller = createInfiniteScroll({
			container,
			onLoadMore: loadNextPage,
			loadingText: 'Cargando mas productos...'
		})
		scroller.start()
		if (!shouldKeepLoading) scroller.setDone(true)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(`Error al cargar la categoria: ${message}`)
	}
}

void withPageLoading(init)

export {}
