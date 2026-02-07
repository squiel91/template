// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { getListingPriceData } from '/shared/product-pricing.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const renderState = html => {
	const container = document.getElementById('featured-products')
	if (!container) {
		console.error('[Home] Featured products container not found')
		return
	}
	container.innerHTML = html
	refreshIcons()
}

const renderCategoriesState = html => {
	const container = document.getElementById('home-categories')
	if (!container) {
		console.error('[Home] Categories container not found')
		return
	}
	container.innerHTML = html
	refreshIcons()
}

const renderProducts = products => {
	const container = document.getElementById('featured-products')
	if (!container) {
		console.error('[Home] Cannot render products - container not found')
		return
	}

	console.log('[Home] renderProducts called with:', products?.length, 'products')

	if (!Array.isArray(products) || products.length === 0) {
		console.log('[Home] No products to render')
		renderState(
			`<div class="empty-state">
				<i data-lucide="package-search"></i>
				<span class="empty-state__title">No hay productos publicados aun</span>
			</div>`
		)
		return
	}

	// Check if custom elements are defined
	if (!customElements.get('product-list')) {
		console.error('[Home] product-list custom element not defined')
		renderState(
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error: Componentes no cargados</span>
			</div>`
		)
		return
	}

	if (!customElements.get('product-item')) {
		console.error('[Home] product-item custom element not defined')
		renderState(
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error: Componentes no cargados</span>
			</div>`
		)
		return
	}

	container.innerHTML = ''
	const list = document.createElement('product-list')

	for (const product of products.slice(0, 8)) {
		if (!product || !product.id) {
			console.warn('[Home] Skipping invalid product:', product)
			continue
		}

		const item = document.createElement('product-item')
		
		try {
			const priceData = getListingPriceData(product)
			const validVariants = (product.variants || []).filter(v => typeof v?.priceInCents === 'number')
			
			item.setAttribute('product-id', String(product.id))
			item.setAttribute('url', `/productos/${product.id}/${urlSafe(product.title || 'producto')}`)
			item.setAttribute('title', product.title || 'Producto')
			item.setAttribute('price', priceData.label || '')
			
			if (priceData.compareLabel) {
				item.setAttribute('compare-price', priceData.compareLabel)
			}
			
			if (product.coverImage?.url) {
				item.setAttribute('image-url', product.coverImage.url)
				item.setAttribute('image-alt', product.coverImage.alt || product.title || '')
			}
			
			// Pass variant info for quick actions
			if (validVariants.length === 1) {
				item.setAttribute('has-single-variant', 'true')
				item.setAttribute('variant-id', String(validVariants[0].id))
			} else if (validVariants.length > 1) {
				item.setAttribute('has-multiple-variants', 'true')
			}
			
			list.appendChild(item)
		} catch (err) {
			console.error('[Home] Error creating product item:', err, product)
		}
	}

	container.appendChild(list)
	refreshIcons()
	console.log('[Home] Products rendered successfully')
}

const renderHomeCategories = categories => {
	console.log('[Home] renderHomeCategories called with:', categories?.length, 'categories')

	if (!Array.isArray(categories) || categories.length === 0) {
		console.log('[Home] No categories to render')
		renderCategoriesState(
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
		.slice(0, 8)
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

	renderCategoriesState(html)
	console.log('[Home] Categories rendered successfully')
}

const init = async () => {
	console.log('[Home] Initializing...')
	
	try {
		console.log('[Home] Fetching products and categories...')
		
		const [productsResponse, categories] = await Promise.all([
			tiendu.products.list({ page: 1, size: 20 }),
			tiendu.categories.list()
		])
		
		console.log('[Home] Products response:', productsResponse)
		console.log('[Home] Categories response:', categories)
		
		// Handle different response structures
		const products = productsResponse?.data || productsResponse || []
		const categoriesList = Array.isArray(categories) ? categories : (categories?.data || [])
		
		console.log('[Home] Parsed products:', products.length, products)
		console.log('[Home] Parsed categories:', categoriesList.length, categoriesList)
		
		renderProducts(products)
		renderHomeCategories(categoriesList)
	} catch (error) {
		console.error('[Home] Error loading data:', error)
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error al cargar: ${escapeHtml(message)}</span>
			</div>`
		)
		renderCategoriesState(
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error al cargar categorias</span>
			</div>`
		)
	}
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init)
} else {
	init()
}

export {}
