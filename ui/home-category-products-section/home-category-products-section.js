// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import { urlSafe } from '/shared/url-safe.js'

const STYLE_ID = 'home-category-products-section-styles'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		home-category-products-section {
			display: block;
		}
	`
	document.head.appendChild(style)
}

class HomeCategoryProductsSection extends HTMLElement {
	constructor() {
		super()
		this._category = null
		this._products = []
	}

	connectedCallback() {
		ensureStyles()
		this.render()
	}

	setData({ category = null, products = [] } = {}) {
		this._category = category && category.id ? category : null
		this._products = Array.isArray(products) ? products : []
		this.render()
	}

	resolveCategoryHref(category) {
		const fallback = `/categorias/${category.id}/${urlSafe(category.name || 'categoria')}`
		if (typeof category?.publicUrl !== 'string' || !category.publicUrl.trim()) return fallback

		try {
			const resolved = new URL(category.publicUrl, window.location.origin)
			return `${resolved.pathname}${resolved.search}${resolved.hash}` || fallback
		} catch {
			return fallback
		}
	}

	render() {
		const category = this._category
		if (!category || !category.id) {
			this.innerHTML = ''
			return
		}

		const categoryHref = this.resolveCategoryHref(category)
		const section = document.createElement('section')
		section.className = 'section'

		const titleId = `home-category-products-title-${category.id}`
		section.setAttribute('aria-labelledby', titleId)

		const header = document.createElement('div')
		header.className = 'section__header'

		const title = document.createElement('h2')
		title.id = titleId
		title.className = 'section__title section__title--large'
		title.textContent = String(category.name || 'Categoria')

		const action = document.createElement('a')
		action.className = 'section__action'
		action.href = categoryHref
		action.innerHTML =
			'Ver todos <i data-lucide="arrow-right" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-left:2px;"></i>'

		header.append(title, action)
		section.appendChild(header)

		const products = this._products.filter(product => product && product.id).slice(0, 4)
		if (products.length === 0) {
			section.innerHTML +=
				'<div class="empty-state"><i data-lucide="package-search"></i><span class="empty-state__title">No hay productos disponibles en esta categoria.</span></div>'
			this.innerHTML = ''
			this.appendChild(section)
			return
		}

		const list = document.createElement('product-list')
		for (const product of products) {
			list.appendChild(
				createProductItemElement(product, {
					origin: {
						url: categoryHref,
						title: String(category.name || 'Categoria')
					}
				})
			)
		}

		section.appendChild(list)
		this.innerHTML = ''
		this.appendChild(section)
	}
}

if (!customElements.get('home-category-products-section')) {
	customElements.define('home-category-products-section', HomeCategoryProductsSection)
}

export {}
