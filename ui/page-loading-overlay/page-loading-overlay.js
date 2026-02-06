// @ts-nocheck

import { refreshIcons } from '/shared/icons.js'

class StoreLoadingOverlay extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
	}

	connectedCallback() {
		if (!this.shadowRoot || this.shadowRoot.childElementCount > 0) return
		this.setAttribute('aria-hidden', 'true')
		this.shadowRoot.innerHTML = `
			<div class="overlay-surface" role="status" aria-live="polite" aria-label="Cargando pagina">
				<div class="overlay-panel">
					<i data-lucide="loader-circle"></i>
				</div>
			</div>
			<style>
				:host {
					position: fixed;
					inset: 0;
					display: none;
					z-index: 999;
				}

				:host([open]) {
					display: grid;
				}

				.overlay-surface {
					display: grid;
					place-items: center;
					background: rgba(255, 255, 255, 0.8);
					backdrop-filter: blur(2px);
				}

				.overlay-panel {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					width: 44px;
					height: 44px;
					border-radius: 999px;
					background: #fff;
					border: 1px solid #e4e7ec;
				}

				.overlay-panel i {
					width: 20px;
					height: 20px;
					animation: spin 1s linear infinite;
				}

				@keyframes spin {
					to {
						transform: rotate(360deg);
					}
				}
			</style>
		`
		refreshIcons()
	}

	show() {
		this.setAttribute('open', '')
		this.setAttribute('aria-hidden', 'false')
	}

	hide() {
		this.removeAttribute('open')
		this.setAttribute('aria-hidden', 'true')
	}
}

if (!customElements.get('store-loading-overlay')) {
	customElements.define('store-loading-overlay', StoreLoadingOverlay)
}

export {}
