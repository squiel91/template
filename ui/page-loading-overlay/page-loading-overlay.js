// @ts-nocheck

import { LitElement, html } from '/shared/lit.js'
import { refreshIcons } from '/shared/icons.js'

const STYLE_ID = 'page-loading-overlay-lit-styles'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		store-loading-overlay {
			position: fixed;
			inset: 0;
			display: none;
			z-index: 100;
		}

		store-loading-overlay[open] {
			display: grid;
		}

		store-loading-overlay .overlay-surface {
			display: grid;
			place-items: center;
			background: rgba(255, 255, 255, 0.9);
			backdrop-filter: blur(4px);
		}

		store-loading-overlay .overlay-panel {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 56px;
			height: 56px;
			border-radius: 50%;
			background: #0f172a;
			box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		}

		store-loading-overlay .overlay-panel i,
		store-loading-overlay .overlay-panel svg {
			width: 24px;
			height: 24px;
			color: white;
			animation: page-overlay-spin 1s linear infinite;
		}

		@keyframes page-overlay-spin {
			to { transform: rotate(360deg); }
		}
	`
	document.head.appendChild(style)
}

class StoreLoadingOverlay extends LitElement {
	static properties = {
		open: { type: Boolean, reflect: true }
	}

	constructor() {
		super()
		this.open = false
	}

	createRenderRoot() {
		return this
	}

	connectedCallback() {
		super.connectedCallback()
		ensureStyles()
		this.setAttribute('aria-hidden', this.open ? 'false' : 'true')
	}

	updated() {
		this.setAttribute('aria-hidden', this.open ? 'false' : 'true')
		refreshIcons()
	}

	show() {
		this.open = true
	}

	hide() {
		this.open = false
	}

	render() {
		return html`
			<div class="overlay-surface" role="status" aria-live="polite" aria-label="Cargando pagina">
				<div class="overlay-panel">
					<i data-lucide="loader-2"></i>
				</div>
			</div>
		`
	}
}

if (!customElements.get('store-loading-overlay')) {
	customElements.define('store-loading-overlay', StoreLoadingOverlay)
}

export {}
