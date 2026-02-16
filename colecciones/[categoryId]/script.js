// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import { initPaginatedProductListing } from '/shared/product-listing.js'
import {
	getCurrentRelativeUrlWithoutOrigin,
	getOriginFromCurrentUrl
} from '/shared/navigation-origin.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'

const PAGE_SIZE = 20

const formatCategoryResultsCopy = total => {
	if (total === 1) return '1 producto en esta colección'
	return `${total} productos en esta colección`
}

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

const init = async () => {
	const params = /** @type {{ categoryId?: string }} */ (
		/** @type {any} */ (window).PARAMS ?? {}
	)
	const categoryId = Number(params.categoryId)
	const origin = getOriginFromCurrentUrl()

	if (!Number.isFinite(categoryId) || categoryId < 1) {
			renderState('Colección no válida.')
		return
	}

	try {
		const category = await tiendu.categories.get(categoryId)

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
			const description = String(category.description || '').trim()
			categoryDescription.textContent = description
			categoryDescription.hidden = description.length === 0
		}

		const categoryProductsSummary = document.getElementById('category-products-summary')
		if (categoryProductsSummary) {
			categoryProductsSummary.textContent = formatCategoryResultsCopy(Number(category.productCount) || 0)
		}

		document.title = `${category.name} | Tienda Genérica`

		const productOrigin = {
			url: getCurrentRelativeUrlWithoutOrigin(),
			title: category.name || 'Colección'
		}

		await initPaginatedProductListing({
			containerId: 'category-products',
			sortSelectId: 'category-sort-select',
			sortParamName: 'orden',
			resultsCopyId: 'category-products-summary',
			formatResultsCopy: formatCategoryResultsCopy,
			pageSize: PAGE_SIZE,
			emptyMessage: 'No hay productos publicados en esta colección.',
			errorPrefix: 'Error al cargar la colección',
			buildOrigin: () => productOrigin,
			fetchPage: async ({ page, size, sort }) => {
				const response = await tiendu.products.list({
					categoryId,
					includeProductsFromSubcategories: true,
					page,
					size,
					criteria: sort.criteria,
					order: sort.order
				})
				return Array.isArray(response?.data) ? response.data : []
			}
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(`Error al cargar la colección: ${message}`)
	}
}

void withPageLoading(init)

export {}
