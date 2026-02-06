// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const renderState = html => {
	const container = document.getElementById('categories-grid')
	if (!container) return
	container.innerHTML = html
	refreshIcons()
}

const renderCategories = categories => {
	if (!Array.isArray(categories) || categories.length === 0) {
		renderState(
			'<div class="empty-state"><i data-lucide="layout-grid"></i><span>No hay categorias publicadas.</span></div>'
		)
		return
	}

	const html = categories
		.map(
			category => `<a class="category-card" href="${escapeHtml(`/categorias/${category.id}/${urlSafe(category.name)}`)}">
				<strong>${escapeHtml(category.name)}</strong>
				<span>${category.productCount} productos</span>
			</a>`
		)
		.join('')

	renderState(html)
}

const init = async () => {
	try {
		const categories = await tiendu.categories.list()
		renderCategories(categories)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(
			`<div class="empty-state"><i data-lucide="alert-circle"></i><span>Error al cargar categorias: ${escapeHtml(message)}</span></div>`
		)
	}
}

init()

export {}
