// @ts-nocheck

import { refreshIcons } from '/shared/icons.js'

const escapeHtml = value =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')

const parseItemsAttribute = value => {
	if (!value) return []
	try {
		const parsed = JSON.parse(value)
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

class StoreBreadcrumbs extends HTMLElement {
	static get observedAttributes() {
		return ['items', 'current-label', 'aria-label']
	}

	constructor() {
		super()
		this._items = null
		this._currentLabel = null
	}

	attributeChangedCallback() {
		this.render()
	}

	connectedCallback() {
		this.render()
	}

	setItems(items) {
		this._items = Array.isArray(items) ? items : []
		this.render()
	}

	setCurrentLabel(label) {
		this._currentLabel = label == null ? '' : String(label)
		this.render()
	}

	render() {
		const items = this._items ?? parseItemsAttribute(this.getAttribute('items'))
		const currentLabel =
			this._currentLabel ?? (this.getAttribute('current-label') || '')
		const navLabel = this.getAttribute('aria-label') || 'Breadcrumb'

		const linksHtml = items
			.filter(item => item && typeof item.label === 'string' && typeof item.href === 'string')
			.map(
				item => `
					<li class="breadcrumbs__item">
						<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>
					</li>
					<li class="breadcrumbs__separator" aria-hidden="true"><i data-lucide="chevron-right" width="14" height="14"></i></li>
				`
			)
			.join('')

		this.innerHTML = `
			<nav class="breadcrumbs" aria-label="${escapeHtml(navLabel)}">
				<ol class="breadcrumbs__list">
					${linksHtml}
					<li class="breadcrumbs__item breadcrumbs__item--current" aria-current="page" title="${escapeHtml(currentLabel)}">
						<span>${escapeHtml(currentLabel)}</span>
					</li>
				</ol>
			</nav>
		`
		refreshIcons()
	}
}

if (!customElements.get('store-breadcrumbs')) {
	customElements.define('store-breadcrumbs', StoreBreadcrumbs)
}

export {}
