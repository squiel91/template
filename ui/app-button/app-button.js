// @ts-nocheck

import { LitElement, html, nothing } from '/shared/lit.js'

const STYLE_ID = 'app-button-lit-styles'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		tiendu-button {
			display: inline-flex;
		}

		tiendu-button button,
		tiendu-button a {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: var(--space-2, 0.5rem);
			height: 40px;
			padding: 0 0.75rem;
			border-radius: 14px;
			font-family: inherit;
			font-size: var(--text-sm, 0.875rem);
			font-weight: 600;
			transition: all var(--transition-fast, 0.15s ease);
			border: 1px solid transparent;
			cursor: pointer;
			line-height: 1;
			text-decoration: none;
		}

		tiendu-button .tiendu-button__icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		tiendu-button .tiendu-button__icon i,
		tiendu-button .tiendu-button__icon svg {
			width: 18px;
			height: 18px;
		}

		tiendu-button[variant='secondary'] button,
		tiendu-button[variant='secondary'] a {
			background: #ffffff;
			border-color: #cbd5e1;
			color: var(--text-primary, #0f172a);
		}

		tiendu-button[variant='secondary'] button:hover:not(:disabled),
		tiendu-button[variant='secondary'] a:hover {
			background: #e2e8f0;
			border-color: #64748b;
		}

		tiendu-button[variant='primary'] button,
		tiendu-button[variant='primary'] a {
			background: var(--color-primary, #0f172a);
			border-color: var(--color-primary, #0f172a);
			color: #ffffff;
		}

		tiendu-button[variant='primary'] button:hover:not(:disabled),
		tiendu-button[variant='primary'] a:hover {
			background: var(--color-primary-hover, #1e293b);
			border-color: var(--color-primary-hover, #1e293b);
		}

		tiendu-button button:disabled {
			opacity: 0.78;
			cursor: wait;
		}

		tiendu-button a[aria-disabled='true'] {
			opacity: 0.78;
			cursor: wait;
			pointer-events: none;
		}

		tiendu-button[variant='secondary'] button:disabled:hover,
		tiendu-button[variant='secondary'] a[aria-disabled='true']:hover {
			background: #ffffff;
			border-color: #cbd5e1;
		}

		tiendu-button button[data-loading='true'] .tiendu-button__icon i,
		tiendu-button button[data-loading='true'] .tiendu-button__icon svg {
			animation: app-button-spin 1s linear infinite;
		}

		tiendu-button .tiendu-button__label {
			display: inline-flex;
			align-items: center;
		}

		tiendu-button#open-cart-button button {
			font-family: 'Bebas Neue', sans-serif;
			font-weight: 400;
			font-size: var(--text-lg, 1.125rem);
			letter-spacing: 0.03em;
		}

		tiendu-button .tiendu-button__badge {
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		@keyframes app-button-spin {
			to {
				transform: rotate(360deg);
			}
		}
	`
	document.head.appendChild(style)
}

class AppButton extends LitElement {
	static properties = {
		label: { type: String },
		loadingLabel: { type: String, attribute: 'loading-label' },
		icon: { type: String },
		loadingIcon: { type: String, attribute: 'loading-icon' },
		href: { type: String },
		newTab: { type: Boolean, attribute: 'new-tab' },
		variant: { type: String },
		type: { type: String },
		badge: { type: String },
		badgeId: { type: String, attribute: 'badge-id' },
		duration: { type: Number },
		disabled: { type: Boolean, reflect: true }
	}

	constructor() {
		super()
		this.label = ''
		this.loadingLabel = ''
		this.icon = ''
		this.loadingIcon = 'loader-2'
		this.href = ''
		this.newTab = false
		this.variant = 'secondary'
		this.type = 'button'
		this.badge = ''
		this.badgeId = ''
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

	renderIcon(iconName) {
		if (!iconName) return ''

		if (iconName === 'loader-2') {
			return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`
		}

		if (iconName === 'plus') {
			return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>`
		}

		if (iconName === 'shopping-cart') {
			return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2h3l2.68 12.39a2 2 0 0 0 1.95 1.61h7.72a2 2 0 0 0 1.95-1.57L22 7H6"></path></svg>`
		}

		if (iconName === 'forward') {
			return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 17 5-5-5-5"></path><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg>`
		}

		if (iconName === 'message-square') {
			return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
		}

		return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`
	}

	getDuration() {
		const value = Number(this.duration)
		return Number.isFinite(value) && value > 0 ? value : 4000
	}

	startLoading() {
		if (this.disabled) return
		if (this._timeoutId) clearTimeout(this._timeoutId)
		this._loading = true
		this.requestUpdate()
		this._timeoutId = window.setTimeout(() => this.stopLoading(), this.getDuration())
	}

	stopLoading() {
		if (this._timeoutId) {
			clearTimeout(this._timeoutId)
			this._timeoutId = null
		}
		if (!this._loading) return
		this._loading = false
		this.requestUpdate()
	}

	setDisabled(value) {
		this.disabled = Boolean(value)
	}

	setBadge(value) {
		this.badge = value == null ? '' : String(value)
	}

	handleClick(event) {
		if (this.disabled || this._loading) {
			event.preventDefault()
			return
		}
		this.dispatchEvent(new CustomEvent('app-click', { bubbles: true, composed: true }))
	}

	render() {
		const isDisabled = this.disabled || this._loading
		const iconName = this._loading ? this.loadingIcon : this.icon
		const text = this._loading ? this.loadingLabel || this.label : this.label
		const ariaLabel = this.getAttribute('aria-label') || this.label || ''
		const hasBadge = this.badge !== ''
		const hasHref = typeof this.href === 'string' && this.href.trim().length > 0
		const href = hasHref ? this.href.trim() : ''
		const target = this.newTab ? '_blank' : nothing
		const rel = this.newTab ? 'noopener noreferrer' : nothing

		const content = html`
			${iconName
				? html`<span class="tiendu-button__icon" aria-hidden="true">${this.renderIcon(iconName)}</span>`
				: ''}
			${text ? html`<span class="tiendu-button__label">${text}</span>` : ''}
			${hasBadge
				? html`<span class="cart-quantity tiendu-button__badge" id=${this.badgeId || nothing} aria-live="polite">${this.badge}</span>`
				: ''}
		`

		if (hasHref) {
			return html`
				<a
					href=${href}
					target=${target}
					rel=${rel}
					aria-label=${ariaLabel}
					aria-disabled=${isDisabled ? 'true' : 'false'}
					@click=${this.handleClick}
				>
					${content}
				</a>
			`
		}

		return html`
			<button
				type=${this.type || 'button'}
				aria-label=${ariaLabel}
				?disabled=${isDisabled}
				data-loading=${this._loading ? 'true' : 'false'}
				@click=${this.handleClick}
			>
				${content}
			</button>
		`
	}
}

if (!customElements.get('tiendu-button')) {
	customElements.define('tiendu-button', AppButton)
}

export {}
