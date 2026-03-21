// @ts-nocheck

import { tiendu } from '/assets/tiendu-client.js'
import { getListingPriceLabel } from '/assets/product-pricing.js'
import { withOriginQuery } from '/assets/navigation-origin.js'
import { urlSafe } from '/assets/url-safe.js'
import { escapeHtml } from '/assets/sanitize.js'

const DROPDOWN_ANIMATION_MS = 180
const SEARCH_DROPDOWN_LIMIT = 8
const SEARCH_MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 1500
const LOADING_ICON =
	'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-form-control__icon"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>'
const SEARCH_ICON =
	'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-form-control__icon"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>'

class StorefrontSearchController {
	constructor(root) {
		this.root = root
		this.form = root.querySelector('.storefront-search__form')
		this.input = root.querySelector('#storefront-search-input')
		this.icon = root.querySelector('[data-search-icon]')
		this.dropdown = root.querySelector('[data-search-dropdown]')
		this.openButton = root.querySelector('[data-search-open]')
		this.closeButton = root.querySelector('[data-search-close]')
		this.backdrop = root.querySelector('[data-search-backdrop]')
		const urlQuery = new URL(window.location.href).searchParams.get('q')?.trim() || ''
		this.query = urlQuery || (this.input instanceof HTMLInputElement ? this.input.value.trim() : '')
		if (this.input instanceof HTMLInputElement) this.input.value = this.query
		this.items = []
		this.loading = false
		this.open = false
		this.dropdownVisible = false
		this.dropdownOpening = false
		this.dropdownClosing = false
		this.mobileOpen = false
		this.requestId = 0
		this.debounceId = null
		this.dropdownOpenTimer = null
		this.dropdownHideTimer = null
		this.viewportMedia = window.matchMedia('(max-width: 768px)')
		this.handleDocumentClick = this.handleDocumentClick.bind(this)
		this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this)
		this.handleViewportChange = this.handleViewportChange.bind(this)
	}

	connect() {
		if (!(this.form instanceof HTMLFormElement) || !(this.input instanceof HTMLInputElement) || !(this.dropdown instanceof HTMLElement)) {
			return
		}

		this.form.addEventListener('submit', event => this.handleSubmit(event))
		this.input.addEventListener('input', event => this.handleInput(event))
		this.input.addEventListener('focus', () => this.handleFocus())
		this.openButton?.addEventListener('click', () => this.openMobile())
		this.closeButton?.addEventListener('click', () => this.clearAndCloseMobile())
		this.backdrop?.addEventListener('click', () => this.closeMobile())
		document.addEventListener('click', this.handleDocumentClick)
		document.addEventListener('keydown', this.handleDocumentKeydown)
		this.viewportMedia.addEventListener('change', this.handleViewportChange)
		this.renderDropdown()
	}

	isMobileView() {
		return this.viewportMedia.matches
	}

	setIconLoading(isLoading) {
		if (!(this.icon instanceof HTMLElement)) return
		this.icon.classList.toggle('storefront-search__icon--loading', isLoading)
		this.icon.innerHTML = isLoading ? LOADING_ICON : SEARCH_ICON
	}

	setDropdownOpen(nextOpen) {
		if (!(this.dropdown instanceof HTMLElement)) return

		if (nextOpen) {
			if (this.open && this.dropdownVisible && !this.dropdownClosing) {
				return
			}

			if (this.dropdownOpenTimer) {
				window.clearTimeout(this.dropdownOpenTimer)
				this.dropdownOpenTimer = null
			}
			if (this.dropdownHideTimer) {
				window.clearTimeout(this.dropdownHideTimer)
				this.dropdownHideTimer = null
			}
			this.open = true
			this.dropdownVisible = true
			this.dropdownOpening = true
			this.dropdownClosing = false
			this.dropdown.hidden = false
			this.renderDropdown()
			this.dropdownOpenTimer = window.setTimeout(() => {
				this.dropdownOpening = false
				this.dropdownOpenTimer = null
				this.renderDropdown()
			}, DROPDOWN_ANIMATION_MS)
			return
		}

		if (!this.dropdownVisible) {
			this.open = false
			return
		}

		this.open = false
		this.dropdownOpening = false
		this.dropdownClosing = true
		this.renderDropdown()
		if (this.dropdownHideTimer) window.clearTimeout(this.dropdownHideTimer)
		this.dropdownHideTimer = window.setTimeout(() => {
			this.dropdownVisible = false
			this.dropdownClosing = false
			this.dropdown.hidden = true
			this.dropdownHideTimer = null
			this.renderDropdown()
		}, DROPDOWN_ANIMATION_MS)
	}

	invalidatePendingRequests() {
		this.requestId += 1
	}

	openMobile() {
		if (!this.isMobileView()) return
		this.mobileOpen = true
		this.root.dataset.mobileOpen = 'true'
		this.setDropdownOpen(this.items.length > 0)
		window.requestAnimationFrame(() => {
			this.input?.focus()
		})
	}

	closeMobile() {
		this.mobileOpen = false
		delete this.root.dataset.mobileOpen
		this.setDropdownOpen(false)
	}

	clearAndCloseMobile() {
		this.query = ''
		this.items = []
		this.invalidatePendingRequests()
		this.loading = false
		if (this.input instanceof HTMLInputElement) this.input.value = ''
		this.setIconLoading(false)
		this.renderDropdown()
		this.closeMobile()
	}

	handleViewportChange() {
		if (this.isMobileView()) return
		this.mobileOpen = false
		delete this.root.dataset.mobileOpen
		this.setDropdownOpen(false)
	}

	handleInput(event) {
		const input = event.target
		const previousQuery = this.query
		const nextQuery = input instanceof HTMLInputElement ? input.value.trim() : ''
		this.query = nextQuery
		if (nextQuery !== previousQuery) {
			this.invalidatePendingRequests()
		}

		if (this.debounceId) {
			window.clearTimeout(this.debounceId)
			this.debounceId = null
		}

		if (!nextQuery || nextQuery.length < SEARCH_MIN_QUERY_LENGTH) {
			this.items = []
			this.loading = false
			this.setIconLoading(false)
			this.setDropdownOpen(false)
			this.renderDropdown()
			return
		}

		this.loading = true
		this.setIconLoading(true)
		this.renderDropdown()
		this.setDropdownOpen(this.dropdownVisible || this.items.length > 0)
		this.debounceId = window.setTimeout(() => {
			this.fetchProducts(nextQuery)
		}, SEARCH_DEBOUNCE_MS)
	}

	handleFocus() {
		if (this.isMobileView() && !this.mobileOpen) {
			this.openMobile()
			return
		}

		if (!this.query || this.query.length < SEARCH_MIN_QUERY_LENGTH) {
			this.setDropdownOpen(false)
			return
		}

		if (!this.loading && this.items.length === 0) {
			this.loading = true
			this.setIconLoading(true)
			this.renderDropdown()
			void this.fetchProducts(this.query)
			return
		}

		this.setDropdownOpen(this.items.length > 0)
	}

	handleSubmit(event) {
		const normalizedQuery = this.query.trim()
		if (!normalizedQuery) {
			event.preventDefault()
			return
		}

		if (tiendu?.analytics && typeof tiendu.analytics.trackSearch === 'function') {
			tiendu.analytics.trackSearch({
				query: normalizedQuery,
				source: 'header-submit',
				resultsCount: this.items.length
			})
		}

		event.preventDefault()
		this.setDropdownOpen(false)
		this.mobileOpen = false
		delete this.root.dataset.mobileOpen
		window.location.assign(`/busqueda?q=${encodeURIComponent(normalizedQuery)}`)
	}

	async fetchProducts(term) {
		if (!term || term.length < SEARCH_MIN_QUERY_LENGTH) {
			this.loading = false
			this.items = []
			this.setIconLoading(false)
			this.setDropdownOpen(false)
			this.renderDropdown()
			return
		}

		const currentRequestId = ++this.requestId
		try {
			const response = await tiendu.products.list({
				search: term,
				page: 1,
				size: SEARCH_DROPDOWN_LIMIT
			})
			if (currentRequestId !== this.requestId) return
			this.items = Array.isArray(response?.data) ? response.data : []
		} catch {
			if (currentRequestId !== this.requestId) return
			this.items = []
		} finally {
			if (currentRequestId !== this.requestId) return
			this.loading = false
			this.setIconLoading(false)
			this.setDropdownOpen(Boolean(this.query))
			this.renderDropdown()
		}
	}

	handleDocumentClick(event) {
		if (this.isMobileView()) return
		if (!(event.target instanceof Node)) return
		if (this.root.contains(event.target)) return
		this.setDropdownOpen(false)
	}

	handleDocumentKeydown(event) {
		if (event.key !== 'Escape') return
		if (this.mobileOpen) {
			this.closeMobile()
			return
		}
		this.setDropdownOpen(false)
	}

	renderItem(product) {
		const searchPageUrl = `/busqueda?q=${encodeURIComponent(this.query)}`
		const priceLabel = getListingPriceLabel(product)
		const productUrl = withOriginQuery(
			`/productos/${product.id}/${urlSafe(product.title || '')}`,
			{ url: searchPageUrl, title: 'Busqueda' }
		)
		const imageUrl = product.coverImage?.url ? escapeHtml(product.coverImage.url) : ''
		const imageAlt = escapeHtml(product.coverImage?.alt || product.title || 'Producto')

		return `
			<li class="storefront-search__item">
				<a class="storefront-search__item-link" href="${escapeHtml(productUrl)}">
					<div class="storefront-search__thumb">
						${imageUrl ? `<img src="${imageUrl}" alt="${imageAlt}" loading="lazy" />` : ''}
					</div>
					<div class="storefront-search__meta">
						<span class="storefront-search__title">${escapeHtml(product.title || 'Producto')}</span>
						${priceLabel ? `<span class="storefront-search__price">${escapeHtml(priceLabel)}</span>` : ''}
					</div>
				</a>
			</li>
		`
	}

	renderStatus() {
		if (this.loading) {
			return `
				<li class="storefront-search__item">
					<div class="storefront-search__status storefront-search__status--loading">
						${LOADING_ICON}
						<span>Buscando productos...</span>
					</div>
				</li>
			`
		}

		return `
			<li class="storefront-search__item">
				<div class="storefront-search__status">
					<span>No se encontraron productos</span>
				</div>
			</li>
		`
	}

	renderDropdown() {
		if (!(this.dropdown instanceof HTMLElement)) return

		const shouldShow =
			this.dropdownVisible &&
			(this.items.length > 0 || (this.query.length > 0 && this.query.length >= SEARCH_MIN_QUERY_LENGTH) || this.dropdownClosing)

		if (!shouldShow) {
			this.dropdown.hidden = true
			this.dropdown.innerHTML = ''
			return
		}

		const state = this.dropdownClosing
			? 'closing'
			: this.dropdownOpening
				? 'opening'
				: 'open'

		const itemsHtml = this.items.length > 0 ? this.items.map(product => this.renderItem(product)).join('') : this.renderStatus()
		const moreHtml = !this.loading && this.items.length === SEARCH_DROPDOWN_LIMIT
			? `
				<div class="storefront-search__more">
					<a class="storefront-search__more-link" href="/busqueda?q=${encodeURIComponent(this.query)}">Ver mas resultados</a>
				</div>
			`
			: ''

		this.dropdown.hidden = false
		this.dropdown.dataset.state = state
		this.dropdown.innerHTML = `
			<ul class="storefront-search__results">${itemsHtml}</ul>
			${moreHtml}
		`
	}
}

export const initHeaderSearch = () => {
	const root = document.querySelector('[data-storefront-search]')
	if (!(root instanceof HTMLElement)) return
	const controller = new StorefrontSearchController(root)
	controller.connect()
	return controller
}

export {}
