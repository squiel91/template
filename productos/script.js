// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import {
	getCurrentRelativeUrlWithoutOrigin
} from '/shared/navigation-origin.js'
import { initPaginatedProductListing } from '/shared/product-listing.js'
import { refreshIcons } from '/shared/icons.js'

const url = new URL(window.location.href)
const PAGE_SIZE = 20

const formatResultsCopy = (total, query) => {
	if (query) {
		return total === 1
			? `1 resultado para "${query}"`
			: `${total} resultados para "${query}"`
	}
	return total === 1 ? '1 producto' : `${total} productos`
}

const init = async () => {
	const search = url.searchParams.get('q')?.trim() || ''
	const listingHead = document.querySelector('.listing-head')
	if (listingHead instanceof HTMLElement) {
		listingHead.classList.toggle('listing-head--search', search.length > 0)
	}

	const clearSearchLink = document.getElementById('products-clear-search')
	if (clearSearchLink instanceof HTMLElement) {
		clearSearchLink.hidden = search.length === 0
	}
	refreshIcons()

	const origin = {
		url: getCurrentRelativeUrlWithoutOrigin(),
		title: search ? 'Búsqueda' : 'Productos'
	}

	await initPaginatedProductListing({
		containerId: 'products-list',
		sortSelectId: 'products-sort-select',
		resultsCopyId: 'products-results-summary',
		sortParamName: 'orden',
		pageSize: PAGE_SIZE,
		emptyMessage: 'No encontramos productos con ese criterio.',
		errorPrefix: 'Error al cargar el catálogo',
		buildOrigin: () => origin,
		formatResultsCopy: totalLoaded => formatResultsCopy(totalLoaded, search),
		fetchPage: async ({ page, size, sort }) => {
			const response = await tiendu.products.list({
				search,
				page,
				size,
				criteria: sort.criteria,
				order: sort.order
			})
			return Array.isArray(response?.data) ? response.data : []
		}
	})
}

void withPageLoading(init)

export {}
