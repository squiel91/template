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
	if (!container) return
	container.innerHTML = html
	refreshIcons()
}

const renderCategoriesState = html => {
	const container = document.getElementById('home-categories')
	if (!container) return
	container.innerHTML = html
	refreshIcons()
}

const renderProducts = products => {
	const container = document.getElementById('featured-products')
	if (!container) return

	if (!Array.isArray(products) || products.length === 0) {
		renderState(
			'<div class="empty-state"><i data-lucide="package-search"></i><span>No hay productos publicados.</span></div>'
		)
		return
	}

	container.innerHTML = ''
	const list = document.createElement('product-list')

	for (const product of products.slice(0, 8)) {
		const item = document.createElement('product-item')
		const priceData = getListingPriceData(product)
		item.setAttribute('product-id', String(product.id))
		item.setAttribute('url', `/productos/${product.id}/${urlSafe(product.title)}`)
		item.setAttribute('title', product.title)
		item.setAttribute('price', priceData.label)
		if (priceData.compareLabel) {
			item.setAttribute('compare-price', priceData.compareLabel)
		}
		if (product.coverImage?.url) {
			item.setAttribute('image-url', product.coverImage.url)
			item.setAttribute('image-alt', product.coverImage.alt || product.title)
		}
		list.appendChild(item)
	}

	container.appendChild(list)
	refreshIcons()
}

const renderPrimaryCategory = categories => {
	const cta = document.getElementById('hero-primary-category')
	if (!(cta instanceof HTMLAnchorElement)) return
	if (!Array.isArray(categories) || categories.length === 0) {
		cta.href = '/categorias'
		cta.querySelector('span')?.replaceChildren(document.createTextNode('Ver categorias'))
		return
	}
	const firstCategory = categories[0]
	cta.href = `/categorias/${firstCategory.id}/${urlSafe(firstCategory.name)}`
	cta.querySelector('span')?.replaceChildren(
		document.createTextNode(`Ir a ${firstCategory.name}`)
	)
}

const renderOffersCta = products => {
	const cta = document.getElementById('hero-offers-link')
	if (!(cta instanceof HTMLAnchorElement)) return

	const discounted = (Array.isArray(products) ? products : []).find(product =>
		Array.isArray(product.variants)
			? product.variants.some(
				variant =>
					typeof variant.compareAtPriceInCents === 'number' &&
					typeof variant.priceInCents === 'number' &&
					variant.compareAtPriceInCents > variant.priceInCents
			)
			: false
	)

	if (discounted) {
		cta.href = `/productos/${discounted.id}/${urlSafe(discounted.title)}`
	}
}

const renderHomeCategories = categories => {
	if (!Array.isArray(categories) || categories.length === 0) {
		renderCategoriesState(
			'<div class="empty-state"><i data-lucide="layout-grid"></i><span>No hay categorias publicadas.</span></div>'
		)
		return
	}

	const html = categories
		.slice()
		.sort((a, b) => Number(b.productCount || 0) - Number(a.productCount || 0))
		.slice(0, 8)
		.map(category => {
			const href = escapeHtml(`/categorias/${category.id}/${urlSafe(category.name)}`)
			const name = escapeHtml(category.name)
			const count = Number(category.productCount || 0)
			const visual = category.coverImage?.url
				? `<div class="category-visual"><img src="${escapeHtml(category.coverImage.url)}" alt="${escapeHtml(category.coverImage.alt || category.name)}" loading="lazy" /></div>`
				: '<div class="category-visual"></div>'

			return `<a class="category-card" href="${href}">${visual}<strong>${name}</strong><span>${count} productos</span></a>`
		})
		.join('')

	renderCategoriesState(html)
}

const init = async () => {
	try {
		const [productsResponse, categories] = await Promise.all([
			tiendu.products.list({ page: 1, size: 20 }),
			tiendu.categories.list()
		])
		const products = productsResponse.data || []
		renderProducts(products)
		renderOffersCta(products)
		renderPrimaryCategory(categories)
		renderHomeCategories(categories)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(
			`<div class="empty-state"><i data-lucide="alert-circle"></i><span>Error al cargar productos: ${escapeHtml(message)}</span></div>`
		)
		renderCategoriesState(
			`<div class="empty-state"><i data-lucide="alert-circle"></i><span>Error al cargar categorias: ${escapeHtml(message)}</span></div>`
		)
	}
}

init()

export {}
