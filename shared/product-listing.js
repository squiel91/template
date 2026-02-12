// @ts-nocheck

import '/ui/tiendu-select/tiendu-select.js'
import { createInfiniteScroll } from '/shared/infinite-scroll.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'

export const PRODUCT_SORT_OPTIONS = [
	{ value: 'sales-desc', label: 'Más vendido', criteria: 'sales', order: 'desc' },
	{ value: 'name-asc', label: 'Nombre A-Z', criteria: 'name', order: 'asc' },
	{ value: 'name-desc', label: 'Nombre Z-A', criteria: 'name', order: 'desc' },
	{ value: 'price-asc', label: 'Precio: menor a mayor', criteria: 'price', order: 'asc' },
	{ value: 'price-desc', label: 'Precio: mayor a menor', criteria: 'price', order: 'desc' },
	{ value: 'created-desc', label: 'Más nuevos', criteria: 'created', order: 'desc' }
]

const DEFAULT_SORT = PRODUCT_SORT_OPTIONS[0]

const getSortByValue = value => PRODUCT_SORT_OPTIONS.find(option => option.value === value) || DEFAULT_SORT

export const getSortFromCurrentUrl = (paramName = 'orden') => {
	const url = new URL(window.location.href)
	return getSortByValue(url.searchParams.get(paramName) || '')
}

export const renderSortOptions = (selectNode, selectedValue) => {
	if (!(selectNode instanceof HTMLElement)) return
	const normalizedValue = getSortByValue(selectedValue).value

	if (typeof selectNode.setOptions === 'function') {
		selectNode.setOptions(PRODUCT_SORT_OPTIONS)
		if (typeof selectNode.setValue === 'function') {
			selectNode.setValue(normalizedValue)
		}
		return
	}

	if (selectNode instanceof HTMLSelectElement) {
		selectNode.innerHTML = PRODUCT_SORT_OPTIONS.map(
			option => `<option value="${option.value}">${option.label}</option>`
		).join('')
		selectNode.value = normalizedValue
	}
}

const setSortInUrl = (sortValue, paramName = 'orden') => {
	const url = new URL(window.location.href)
	url.searchParams.set(paramName, sortValue)
	window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

const renderState = (container, message) => {
	container.innerHTML = `
		<div class="empty-state">
			<i data-lucide="package-search"></i>
			<span class="empty-state__title">${escapeHtml(message)}</span>
		</div>
	`
	refreshIcons()
}

export const initPaginatedProductListing = async ({
	containerId,
	pageSize = 20,
	emptyMessage,
	errorPrefix,
	fetchPage,
	buildOrigin,
	sortSelectId,
	sortParamName = 'orden',
	resultsCopyId,
	formatResultsCopy
}) => {
	const container = document.getElementById(containerId)
	if (!(container instanceof HTMLElement)) return

	const sortSelect = sortSelectId ? document.getElementById(sortSelectId) : null
	const resultsCopyNode = resultsCopyId ? document.getElementById(resultsCopyId) : null

	let currentSort = getSortFromCurrentUrl(sortParamName)
	if (sortSelect instanceof HTMLElement) {
		renderSortOptions(sortSelect, currentSort.value)
	}

	let scroller = null
	let requestVersion = 0

	const loadListing = async () => {
		requestVersion += 1
		const version = requestVersion

		if (scroller && typeof scroller.stop === 'function') {
			scroller.stop()
			scroller = null
		}

		container.innerHTML = ''
		const list = document.createElement('product-list')
		container.appendChild(list)

		let page = 0
		let totalLoaded = 0
		let hasMore = true

		const appendProducts = products => {
			for (const product of products) {
				list.appendChild(createProductItemElement(product, { origin: buildOrigin() }))
			}
			refreshIcons()
		}

		const updateResultsCopy = () => {
			if (!(resultsCopyNode instanceof HTMLElement) || typeof formatResultsCopy !== 'function') return
			resultsCopyNode.textContent = formatResultsCopy(totalLoaded)
		}

		const loadNextPage = async () => {
			if (!hasMore || version !== requestVersion) return false
			page += 1
			const products = await fetchPage({
				page,
				size: pageSize,
				sort: { criteria: currentSort.criteria, order: currentSort.order }
			})

			if (version !== requestVersion) return false

			if (page === 1 && products.length === 0) {
				renderState(container, emptyMessage)
				hasMore = false
				return false
			}

			appendProducts(products)
			totalLoaded += products.length
			updateResultsCopy()
			hasMore = products.length === pageSize
			return hasMore
		}

		try {
			const shouldKeepLoading = await loadNextPage()
			if (!hasMore) return

			scroller = createInfiniteScroll({
				container,
				onLoadMore: loadNextPage,
				loadingText: 'Cargando mas productos...'
			})
			scroller.start()
			if (!shouldKeepLoading) scroller.setDone(true)
		} catch (error) {
			if (version !== requestVersion) return
			const message = error instanceof Error ? error.message : 'Error inesperado.'
			renderState(container, `${errorPrefix}: ${message}`)
		}
	}

	if (sortSelect instanceof HTMLElement) {
		const handleSortChange = nextValue => {
			currentSort = getSortByValue(nextValue)
			setSortInUrl(currentSort.value, sortParamName)
			void loadListing()
		}

		sortSelect.addEventListener('tiendu-select-change', event => {
			const nextValue = event?.detail?.value
			handleSortChange(nextValue)
		})

		if (sortSelect instanceof HTMLSelectElement) {
			sortSelect.addEventListener('change', () => {
				handleSortChange(sortSelect.value)
			})
		}
	}

	await loadListing()
}
