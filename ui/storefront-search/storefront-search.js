// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { getListingPriceLabel } from '/shared/product-pricing.js'
import { urlSafe } from '/shared/url-safe.js'
import { refreshIcons } from '/shared/icons.js'

class StorefrontSearch extends HTMLElement {
	constructor() {
		super()
		this.query = ''
		this.items = []
		this.loading = false
		this.open = false
		this.requestId = 0
		this.debounceId = null
		this.handleDocumentClick = this.handleDocumentClick.bind(this)
		this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this)
	}

	connectedCallback() {
		if (this.childElementCount > 0) return
		this.render()
		this.bindEvents()

		const urlQuery = new URL(window.location.href).searchParams.get('q')?.trim() || ''
		if (urlQuery) {
			this.query = urlQuery
			if (this.input instanceof HTMLInputElement) {
				this.input.value = urlQuery
			}
		}

		document.addEventListener('click', this.handleDocumentClick)
		document.addEventListener('keydown', this.handleDocumentKeydown)
	}

	disconnectedCallback() {
		if (this.debounceId) {
			window.clearTimeout(this.debounceId)
			this.debounceId = null
		}
		document.removeEventListener('click', this.handleDocumentClick)
		document.removeEventListener('keydown', this.handleDocumentKeydown)
	}

	render() {
		this.innerHTML = `
			<form class="storefront-search" action="/productos" method="get" role="search" autocomplete="off">
				<label class="sr-only" for="storefront-search-input">Buscar productos</label>
				<div class="storefront-search__control">
					<i data-lucide="search"></i>
					<input id="storefront-search-input" type="search" name="q" placeholder="Buscar productos" />
					<button type="submit">Buscar</button>
				</div>
				<div class="storefront-search__dropdown" id="storefront-search-dropdown" hidden>
					<ul class="storefront-search__results" id="storefront-search-results"></ul>
				</div>
			</form>
			<style>
				storefront-search {
					display: block;
				}

				.storefront-search {
					position: relative;
				}

				.storefront-search__control {
					display: flex;
					align-items: center;
					gap: 8px;
					border: 1px solid #d0d5dd;
					border-radius: 10px;
					padding: 4px 6px 4px 10px;
					background: #fff;
					min-width: 240px;
				}

				.storefront-search__control i {
					width: 16px;
					height: 16px;
					stroke-width: 1.8;
				}

				.storefront-search__control input {
					border: none;
					outline: none;
					font: inherit;
					width: 100%;
					min-width: 0;
				}

				.storefront-search__control button {
					border: 1px solid #d0d5dd;
					background: #fff;
					color: #101828;
					border-radius: 8px;
					padding: 7px 10px;
					font: inherit;
					font-size: 0.88rem;
					font-weight: 500;
					cursor: pointer;
				}

				.storefront-search__dropdown {
					position: absolute;
					top: calc(100% + 8px);
					left: 0;
					right: 0;
					background: #fff;
					border: 1px solid #e4e7ec;
					border-radius: 12px;
					box-shadow: 0 12px 28px rgba(16, 24, 40, 0.12);
					max-height: min(72vh, 420px);
					overflow: auto;
					z-index: 35;
				}

				.storefront-search__results {
					list-style: none;
					padding: 0;
					margin: 0;
				}

				.storefront-search__item {
					padding: 0;
					border-bottom: 1px solid #f2f4f7;
				}

				.storefront-search__item:last-child {
					border-bottom: none;
				}

				.storefront-search__item-link {
					display: grid;
					grid-template-columns: 56px 1fr;
					gap: 10px;
					align-items: center;
					padding: 9px 10px;
					text-decoration: none;
					color: inherit;
				}

				.storefront-search__item-link:hover {
					background: #f8fafc;
				}

				.storefront-search__thumb {
					width: 56px;
					height: 56px;
					border-radius: 8px;
					background: #e5e7eb;
					overflow: hidden;
					border: 1px solid #e4e7ec;
				}

				.storefront-search__thumb img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}

				.storefront-search__meta {
					display: flex;
					flex-direction: column;
					gap: 4px;
				}

				.storefront-search__title {
					font-size: 0.92rem;
					font-weight: 600;
					line-height: 1.25;
					color: #101828;
				}

				.storefront-search__price {
					font-size: 0.86rem;
					font-weight: 600;
					color: #1f4fbf;
				}

				.storefront-search__status {
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 10px;
					font-size: 0.88rem;
					color: #667085;
				}

				.storefront-search__status i {
					width: 16px;
					height: 16px;
				}

				.storefront-search__status--loading i {
					animation: spin 1s linear infinite;
				}

				@keyframes spin {
					to {
						transform: rotate(360deg);
					}
				}
			</style>
		`

		this.form = this.querySelector('form')
		this.input = this.querySelector('#storefront-search-input')
		this.dropdown = this.querySelector('#storefront-search-dropdown')
		this.results = this.querySelector('#storefront-search-results')
		refreshIcons()
	}

	bindEvents() {
		if (!(this.form instanceof HTMLFormElement) || !(this.input instanceof HTMLInputElement)) {
			return
		}

		this.input.addEventListener('input', () => {
			const nextQuery = this.input.value.trim()
			this.query = nextQuery

			if (this.debounceId) {
				window.clearTimeout(this.debounceId)
				this.debounceId = null
			}

			if (!nextQuery) {
				this.items = []
				this.loading = false
				this.open = false
				this.renderResults()
				return
			}

			this.open = true
			this.loading = true
			this.renderResults()
			this.debounceId = window.setTimeout(() => {
				this.fetchProducts(nextQuery)
			}, 280)
		})

		this.input.addEventListener('focus', () => {
			if (!this.query) return
			this.open = true
			this.renderResults()
		})

		this.form.addEventListener('submit', event => {
			if (!this.query.trim()) {
				event.preventDefault()
			}
		})
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
			this.renderResults()
		}
	}

	renderResults() {
		if (!(this.dropdown instanceof HTMLElement) || !(this.results instanceof HTMLElement)) {
			return
		}

		const shouldShow = this.open && (this.query.length > 0 || this.loading)
		this.dropdown.hidden = !shouldShow
		if (!shouldShow) {
			this.results.replaceChildren()
			return
		}

		const fragment = document.createDocumentFragment()

		for (const product of this.items) {
			const item = document.createElement('li')
			item.className = 'storefront-search__item'

			const link = document.createElement('a')
			link.className = 'storefront-search__item-link'
			link.href = `/productos/${product.id}/${urlSafe(product.title || '')}`

			const thumb = document.createElement('div')
			thumb.className = 'storefront-search__thumb'
			if (product.coverImage?.url) {
				const image = document.createElement('img')
				image.src = product.coverImage.url
				image.alt = product.coverImage.alt || product.title || 'Producto'
				image.loading = 'lazy'
				thumb.appendChild(image)
			}

			const meta = document.createElement('div')
			meta.className = 'storefront-search__meta'
			const title = document.createElement('span')
			title.className = 'storefront-search__title'
			title.textContent = product.title || 'Producto'
			const price = document.createElement('span')
			price.className = 'storefront-search__price'
			price.textContent = getListingPriceLabel(product)
			meta.appendChild(title)
			meta.appendChild(price)

			link.appendChild(thumb)
			link.appendChild(meta)
			item.appendChild(link)
			fragment.appendChild(item)
		}

		if (!this.loading && this.query && this.items.length === 0) {
			const empty = document.createElement('li')
			empty.className = 'storefront-search__item'
			empty.innerHTML = '<div class="storefront-search__status"><i data-lucide="search-x"></i><span>Sin resultados</span></div>'
			fragment.appendChild(empty)
		}

		if (this.loading) {
			const loading = document.createElement('li')
			loading.className = 'storefront-search__item'
			loading.innerHTML = '<div class="storefront-search__status storefront-search__status--loading"><i data-lucide="loader-circle"></i><span>Cargando...</span></div>'
			fragment.appendChild(loading)
		}

		this.results.replaceChildren(fragment)
		refreshIcons()
	}

	handleDocumentClick(event) {
		if (!(event.target instanceof Node)) return
		if (this.contains(event.target)) return
		this.open = false
		this.renderResults()
	}

	handleDocumentKeydown(event) {
		if (event.key !== 'Escape') return
		this.open = false
		this.renderResults()
	}
}

if (!customElements.get('storefront-search')) {
	customElements.define('storefront-search', StorefrontSearch)
}

export {}
