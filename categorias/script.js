// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import '/ui/category-item/category-item.js'
import '/ui/category-list/category-list.js'
import { getCurrentRelativeUrlWithoutOrigin } from '/shared/navigation-origin.js'
import { createCategoryItemElement } from '/shared/category-item-element.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'

const renderState = html => {
	const container = document.getElementById('categories-grid')
	if (!container) return
	container.innerHTML = html
	refreshIcons()
}

const renderCategories = categories => {
	if (!Array.isArray(categories) || categories.length === 0) {
		renderState(
			`<div class="empty-state">
				<i data-lucide="layout-grid"></i>
				<span class="empty-state__title">No hay categorías disponibles</span>
			</div>`
		)
		return
	}

	const origin = {
		url: getCurrentRelativeUrlWithoutOrigin(),
		title: 'Categorías'
	}

	const sortedCategories = categories
		.slice()
		.sort((a, b) => Number(b.productCount || 0) - Number(a.productCount || 0))

	const container = document.getElementById('categories-grid')
	if (!container) return

	container.innerHTML = ''
	const list = document.createElement('category-list')

	for (const category of sortedCategories) {
		if (!category || !category.id) continue
		const item = createCategoryItemElement(category, { origin })
		list.appendChild(item)
	}

	container.appendChild(list)
	refreshIcons()
}

const init = async () => {
	try {
		const categories = await tiendu.categories.list()
		const categoriesList = Array.isArray(categories) ? categories : (categories?.data || [])
		renderCategories(categoriesList)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error al cargar categorías: ${escapeHtml(message)}</span>
			</div>`
		)
	}
}

void withPageLoading(init)

export {}
