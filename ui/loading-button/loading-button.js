// @ts-nocheck

import { LitElement, html } from '/shared/lit.js'

const STYLE_ID = 'loading-button-lit-styles'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		loading-button button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 14px 28px;
			font-family: inherit;
			font-size: 16px;
			font-weight: 600;
			color: #ffffff;
			background: #0f172a;
			border: none;
			border-radius: 9999px;
			cursor: pointer;
			transition: all 0.15s ease;
			min-width: 180px;
		}

		loading-button button:hover:not([disabled]) {
			background: #1e293b;
			transform: translateY(-2px);
			box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
		}

		loading-button button:active:not([disabled]) {
			transform: translateY(0);
		}

		loading-button button[disabled] {
			opacity: 0.6;
			cursor: not-allowed;
		}

		loading-button button[aria-busy='true'] {
			animation: loading-button-pulse 1.5s ease-in-out infinite;
		}

		@keyframes loading-button-pulse {
			0%,
			100% { opacity: 1; }
			50% { opacity: 0.7; }
		}
	`
	document.head.appendChild(style)
}

class LoadingButton extends LitElement {
	static properties = {
		label: { type: String },
		loadingLabel: { type: String, attribute: 'loading-label' },
		duration: { type: Number },
		disabled: { type: Boolean, reflect: true }
	}

	constructor() {
		super()
		this.label = 'Agregar al carrito'
		this.loadingLabel = 'Agregando...'
		this.duration = 4000
		this.disabled = false
		this._loading = false
		this._timeoutId = null
	}

	createRenderRoot() {
		return this
	}

	connectedCallback() {
		super.connectedCallback()
		ensureStyles()
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		if (this._timeoutId) {
			clearTimeout(this._timeoutId)
			this._timeoutId = null
		}
	}

	getDuration() {
		const duration = Number(this.duration)
		return Number.isFinite(duration) && duration > 0 ? duration : 4000
	}

	handleClick() {
		if (this._loading || this.disabled) return
		this._loading = true
		this.requestUpdate()
		this.dispatchEvent(new CustomEvent('loading-click', { bubbles: true, composed: true }))
		this._timeoutId = window.setTimeout(() => {
			this._loading = false
			this.requestUpdate()
		}, this.getDuration())
	}

	render() {
		const isDisabled = this._loading || this.disabled
		return html`
			<button ?disabled=${isDisabled} aria-busy=${String(this._loading)} @click=${this.handleClick}>
				${this._loading ? this.loadingLabel : this.label}
			</button>
		`
	}
}

if (!customElements.get('loading-button')) {
	customElements.define('loading-button', LoadingButton)
}

export {}
