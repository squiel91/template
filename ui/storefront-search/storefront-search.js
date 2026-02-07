// @ts-nocheck

import { LitElement, html, nothing } from '/shared/lit.js'
import { tiendu } from '/shared/tiendu-client.js'
import { getListingPriceLabel } from '/shared/product-pricing.js'
import { urlSafe } from '/shared/url-safe.js'
import { refreshIcons } from '/shared/icons.js'

const STYLE_ID = 'storefront-search-lit-styles'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		storefront-search {
			display: block;
		}

		storefront-search .storefront-search-shell {
			position: relative;
		}

		storefront-search .storefront-search__mobile-trigger {
			display: none;
			width: 40px;
			height: 40px;
			align-items: center;
			justify-content: center;
			border-radius: 9999px;
			border: 1px solid #e2e8f0;
			background: #ffffff;
			color: #0f172a;
		}

		storefront-search .storefront-search__mobile-trigger i,
		storefront-search .storefront-search__mobile-trigger svg {
			width: 18px;
			height: 18px;
		}

		storefront-search .storefront-search__mobile-backdrop {
			display: none;
			border: none;
			background: rgba(15, 23, 42, 0.35);
		}

		storefront-search .storefront-search__form {
			position: relative;
		}

		storefront-search .storefront-search__control {
			display: flex;
			align-items: center;
			padding: 0 0 0 10px;
			height: 40px;
			background: #ffffff;
			border-radius: 14px;
			overflow: hidden;
			border: 1px solid #cbd5e1;
			transition: all 0.15s ease;
		}

		storefront-search .storefront-search__control:focus-within {
			background: #f8fafc;
			border-color: #94a3b8;
		}

		storefront-search .storefront-search__control i,
		storefront-search .storefront-search__control svg {
			width: 18px;
			height: 18px;
			color: #94a3b8;
			flex-shrink: 0;
		}

		storefront-search .storefront-search__control input {
			border: none;
			outline: none;
			font: inherit;
			width: 100%;
			min-width: 0;
			padding: 0;
			margin-left: 8px;
			font-size: 14px;
			color: #0f172a;
			background: transparent;
		}

		storefront-search .storefront-search__control input::placeholder {
			color: #94a3b8;
		}

		storefront-search .storefront-search__control input[type='search']::-webkit-search-cancel-button {
			-webkit-appearance: none;
			appearance: none;
			display: none;
		}

		storefront-search .storefront-search__submit {
			padding: 0 14px;
			font-size: 14px;
			font-weight: 600;
			color: #0f172a;
			background: transparent;
			border: none;
			border-left: 1px solid #cbd5e1;
			border-radius: 0;
			align-self: stretch;
			display: inline-flex;
			align-items: center;
			flex-shrink: 0;
			transition: color 0.15s ease;
		}

		storefront-search .storefront-search__submit:hover,
		storefront-search .storefront-search__submit:focus-visible {
			outline: none;
			color: #1e293b;
			background: #f8fafc;
			border-left-color: #94a3b8;
		}

		storefront-search .storefront-search__mobile-close {
			display: none;
			padding: 0 10px;
			background: transparent;
			border: none;
			border-left: 1px solid #cbd5e1;
			border-radius: 0;
			align-self: stretch;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		storefront-search .storefront-search__mobile-close i,
		storefront-search .storefront-search__mobile-close svg {
			width: 16px;
			height: 16px;
		}

		storefront-search .storefront-search__dropdown {
			position: absolute;
			top: calc(100% + 8px);
			left: 0;
			right: 0;
			background: #ffffff;
			border-radius: 16px;
			box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
			max-height: min(72vh, 420px);
			overflow: auto;
			z-index: 50;
			border: 1px solid #e2e8f0;
		}

		storefront-search .storefront-search__results {
			list-style: none;
			padding: 8px;
			margin: 0;
		}

		storefront-search .storefront-search__item {
			padding: 0;
		}

		storefront-search .storefront-search__item-link {
			display: grid;
			grid-template-columns: 52px 1fr;
			gap: 12px;
			align-items: center;
			padding: 10px 12px;
			text-decoration: none;
			color: inherit;
			border-radius: 12px;
			transition: background 0.15s ease;
		}

		storefront-search .storefront-search__item-link:hover {
			background: #f8fafc;
		}

		storefront-search .storefront-search__thumb {
			width: 52px;
			height: 52px;
			border-radius: 10px;
			background: #f1f5f9;
			overflow: hidden;
			flex-shrink: 0;
		}

		storefront-search .storefront-search__thumb img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		storefront-search .storefront-search__meta {
			display: flex;
			flex-direction: column;
			gap: 4px;
			min-width: 0;
		}

		storefront-search .storefront-search__title {
			font-size: 14px;
			font-weight: 500;
			line-height: 1.4;
			color: #0f172a;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		storefront-search .storefront-search__price {
			font-size: 14px;
			font-weight: 700;
			color: #0f172a;
		}

		storefront-search .storefront-search__status {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 16px;
			font-size: 14px;
			color: #64748b;
		}

		storefront-search .storefront-search__status i,
		storefront-search .storefront-search__status svg {
			width: 16px;
			height: 16px;
		}

		storefront-search .storefront-search__status--loading i,
		storefront-search .storefront-search__status--loading svg {
			animation: storefront-search-spin 1s linear infinite;
		}

		@keyframes storefront-search-spin {
			to { transform: rotate(360deg); }
		}

		@media (max-width: 768px) {
			storefront-search .storefront-search__mobile-trigger {
				display: inline-flex;
			}

			storefront-search .storefront-search__form {
				display: block;
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				z-index: 80;
				padding: 12px;
				background: #ffffff;
				box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
				transform: translateY(-120%);
				opacity: 0;
				pointer-events: none;
				transition: transform 180ms ease, opacity 180ms ease;
			}

			storefront-search[data-mobile-open] .storefront-search__mobile-backdrop {
				display: block;
				position: fixed;
				inset: 0;
				z-index: 70;
			}

			storefront-search[data-mobile-open] .storefront-search__form {
				transform: translateY(0);
				opacity: 1;
				pointer-events: auto;
			}

			storefront-search .storefront-search__mobile-close {
				display: inline-flex;
			}

			storefront-search .storefront-search__dropdown {
				position: static;
				margin-top: 8px;
				max-height: 60vh;
			}
		}
	`
	document.head.appendChild(style)
}

class StorefrontSearch extends LitElement {
	static properties = {
		query: { type: String },
		items: { type: Array },
		loading: { type: Boolean },
		open: { type: Boolean },
		mobileOpen: { type: Boolean, attribute: 'data-mobile-open', reflect: true }
	}

	constructor() {
		super()
		this.query = ''
		this.items = []
		this.loading = false
		this.open = false
		this.mobileOpen = false
		this.requestId = 0
		this.debounceId = null
		this.viewportMedia = window.matchMedia('(max-width: 768px)')
		this.handleDocumentClick = this.handleDocumentClick.bind(this)
		this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this)
		this.handleViewportChange = this.handleViewportChange.bind(this)
	}

	createRenderRoot() {
		return this
	}

	connectedCallback() {
		super.connectedCallback()
		ensureStyles()
		const urlQuery = new URL(window.location.href).searchParams.get('q')?.trim() || ''
		if (urlQuery) this.query = urlQuery
		document.addEventListener('click', this.handleDocumentClick)
		document.addEventListener('keydown', this.handleDocumentKeydown)
		this.viewportMedia.addEventListener('change', this.handleViewportChange)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		if (this.debounceId) {
			window.clearTimeout(this.debounceId)
			this.debounceId = null
		}
		document.removeEventListener('click', this.handleDocumentClick)
		document.removeEventListener('keydown', this.handleDocumentKeydown)
		this.viewportMedia.removeEventListener('change', this.handleViewportChange)
	}

	updated() {
		refreshIcons()
	}

	isMobileView() {
		return this.viewportMedia.matches
	}

	openMobile() {
		if (!this.isMobileView()) return
		this.mobileOpen = true
		this.open = this.loading || this.query.length > 0
		window.requestAnimationFrame(() => {
			const input = this.querySelector('#storefront-search-input')
			if (input instanceof HTMLInputElement) input.focus()
		})
	}

	closeMobile() {
		this.mobileOpen = false
		this.open = false
	}

	clearAndCloseMobile() {
		this.query = ''
		this.items = []
		this.loading = false
		this.closeMobile()
	}

	handleViewportChange() {
		if (this.isMobileView()) return
		this.mobileOpen = false
		this.open = false
	}

	handleInput(event) {
		const input = event.target
		const nextQuery = input instanceof HTMLInputElement ? input.value.trim() : ''
		this.query = nextQuery

		if (this.debounceId) {
			window.clearTimeout(this.debounceId)
			this.debounceId = null
		}

		if (!nextQuery) {
			this.items = []
			this.loading = false
			this.open = false
			return
		}

		this.open = true
		this.loading = true
		this.debounceId = window.setTimeout(() => {
			this.fetchProducts(nextQuery)
		}, 280)
	}

	handleFocus() {
		if (this.isMobileView() && !this.mobileOpen) {
			this.openMobile()
			return
		}
		if (!this.query) return
		this.open = true
	}

	handleSubmit(event) {
		if (!this.query.trim()) {
			event.preventDefault()
		}
	}

	async fetchProducts(term) {
		const currentRequestId = ++this.requestId
		try {
			const response = await tiendu.products.list({ search: term, page: 1, size: 6 })
			if (currentRequestId !== this.requestId) return
			this.items = Array.isArray(response?.data) ? response.data : []
		} catch {
			if (currentRequestId !== this.requestId) return
			this.items = []
		} finally {
			if (currentRequestId !== this.requestId) return
			this.loading = false
			this.open = true
		}
	}

	handleDocumentClick(event) {
		if (this.isMobileView()) return
		if (!(event.target instanceof Node)) return
		if (this.contains(event.target)) return
		this.open = false
	}

	handleDocumentKeydown(event) {
		if (event.key !== 'Escape') return
		if (this.mobileOpen) {
			this.closeMobile()
			return
		}
		this.open = false
	}

	renderStatusLoading() {
		return html`
			<li class="storefront-search__item">
				<div class="storefront-search__status storefront-search__status--loading">
					<i data-lucide="loader-circle"></i>
					<span>Buscando...</span>
				</div>
			</li>
		`
	}

	renderStatusEmpty() {
		return html`
			<li class="storefront-search__item">
				<div class="storefront-search__status">
					<i data-lucide="search-x"></i>
					<span>Sin resultados</span>
				</div>
			</li>
		`
	}

	renderItem(product) {
		return html`
			<li class="storefront-search__item">
				<a class="storefront-search__item-link" href=${`/productos/${product.id}/${urlSafe(product.title || '')}`}>
					<div class="storefront-search__thumb">
						${product.coverImage?.url
							? html`<img src=${product.coverImage.url} alt=${product.coverImage.alt || product.title || 'Producto'} loading="lazy" />`
							: nothing}
					</div>
					<div class="storefront-search__meta">
						<span class="storefront-search__title">${product.title || 'Producto'}</span>
						<span class="storefront-search__price">${getListingPriceLabel(product)}</span>
					</div>
				</a>
			</li>
		`
	}

	render() {
		const shouldShow = this.open && (this.query.length > 0 || this.loading)
		return html`
			<div class="storefront-search-shell">
				<button class="storefront-search__mobile-trigger" type="button" aria-label="Abrir busqueda" @click=${this.openMobile}>
					<i data-lucide="search"></i>
				</button>
				<button class="storefront-search__mobile-backdrop" type="button" aria-label="Cerrar busqueda" @click=${this.closeMobile}></button>
				<form class="storefront-search__form" action="/productos" method="get" role="search" autocomplete="off" @submit=${this.handleSubmit}>
					<label class="sr-only" for="storefront-search-input">Buscar productos</label>
					<div class="storefront-search__control">
						<i data-lucide="search"></i>
						<input
							id="storefront-search-input"
							type="search"
							name="q"
							placeholder="Buscar productos..."
							.value=${this.query}
							@input=${this.handleInput}
							@focus=${this.handleFocus}
						/>
						<button class="storefront-search__submit" type="submit">Buscar</button>
						<button class="storefront-search__mobile-close" type="button" aria-label="Limpiar y cerrar busqueda" @click=${this.clearAndCloseMobile}>
							<i data-lucide="x"></i>
						</button>
					</div>
					<div class="storefront-search__dropdown" ?hidden=${!shouldShow}>
						<ul class="storefront-search__results">
							${this.items.map(product => this.renderItem(product))}
							${this.loading ? this.renderStatusLoading() : nothing}
							${!this.loading && this.query && this.items.length === 0
								? this.renderStatusEmpty()
								: nothing}
						</ul>
					</div>
				</form>
			</div>
		`
	}
}

if (!customElements.get('storefront-search')) {
	customElements.define('storefront-search', StorefrontSearch)
}

export {}
