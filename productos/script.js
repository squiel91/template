// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import { createInfiniteScroll } from '/shared/infinite-scroll.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import {
	getCurrentRelativeUrlWithoutOrigin
} from '/shared/navigation-origin.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'

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

const init = async () => {
	const search = url.searchParams.get('q')?.trim() || ''
	const resultsCopy = document.getElementById('products-results-copy')
	const container = document.getElementById('products-list')
	if (!container) return

	let page = 0
	let totalLoaded = 0
	let hasMore = true
	const origin = {
		url: getCurrentRelativeUrlWithoutOrigin(),
		title: search ? 'Busqueda' : 'Productos'
	}

	container.innerHTML = ''
	const list = document.createElement('product-list')
	container.appendChild(list)

	const updateResultsCopy = () => {
		if (!resultsCopy) return
		resultsCopy.textContent = formatResultsCopy(totalLoaded, search)
	}

	const appendProducts = products => {
		for (const product of products) {
			list.appendChild(createProductItemElement(product, { origin }))
		}
		refreshIcons()
	}

	const loadNextPage = async () => {
		if (!hasMore) return false
		page += 1
		const response = await tiendu.products.list({ search, page, size: PAGE_SIZE })
		const products = response?.data || []

		if (page === 1 && products.length === 0) {
			renderEmpty('No encontramos productos con ese criterio.')
			hasMore = false
			return false
		}

		appendProducts(products)
		totalLoaded += products.length
		updateResultsCopy()
		hasMore = products.length === PAGE_SIZE
		return hasMore
	}

	try {
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
		renderEmpty(`Error al cargar el catalogo: ${message}`)
	}
}

void withPageLoading(init)

export {}
