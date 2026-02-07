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
	console.log('[Categories] Rendering:', categories?.length, 'categories')
	
	if (!Array.isArray(categories) || categories.length === 0) {
		renderState(
			`<div class="empty-state">
				<i data-lucide="layout-grid"></i>
				<span class="empty-state__title">No hay categorias disponibles</span>
			</div>`
		)
		return
	}

	const html = categories
		.slice()
		.sort((a, b) => Number(b.productCount || 0) - Number(a.productCount || 0))
		.map(category => {
			const href = escapeHtml(`/categorias/${category.id}/${urlSafe(category.name || 'categoria')}`)
			const name = escapeHtml(category.name || 'Categoria')
			const count = Number(category.productCount || 0)
			
			if (category.coverImage?.url) {
				return `
					<a class="category-card" href="${href}">
						<img class="category-card__image" src="${escapeHtml(category.coverImage.url)}" alt="${escapeHtml(category.coverImage.alt || category.name || '')}" loading="lazy" />
						<div class="category-card__overlay"></div>
						<div class="category-card__content">
							<div class="category-card__name">${name}</div>
							<div class="category-card__count">${count} productos</div>
						</div>
					</a>
				`
			}
			
			return `
				<a class="category-card category-card--no-image" href="${href}">
					<div class="category-card__content">
						<div class="category-card__name">${name}</div>
						<div class="category-card__count">${count} productos</div>
					</div>
				</a>
			`
		})
		.join('')

	renderState(html)
}

const init = async () => {
	try {
		console.log('[Categories] Fetching categories...')
		const categories = await tiendu.categories.list()
		console.log('[Categories] Response:', categories)
		
		const categoriesList = Array.isArray(categories) ? categories : (categories?.data || [])
		renderCategories(categoriesList)
	} catch (error) {
		console.error('[Categories] Error:', error)
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error al cargar categorias: ${escapeHtml(message)}</span>
			</div>`
		)
	}
}

init()

export {}
