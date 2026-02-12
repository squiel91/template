// @ts-nocheck

const ICONS = {
	'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>'
}

class TienduStockNote extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		this._tone = 'neutral'
		this._message = ''
		this._icon = ''
		this._pulse = false
	}

	static get observedAttributes() {
		return ['tone', 'message', 'icon', 'pulse']
	}

	connectedCallback() {
		this.syncFromAttributes()
		this.render()
	}

	attributeChangedCallback() {
		this.syncFromAttributes()
		this.render()
	}

	syncFromAttributes() {
		const tone = this.getAttribute('tone') || 'neutral'
		this._tone = ['neutral', 'success', 'warning', 'error'].includes(tone) ? tone : 'neutral'
		this._message = this.getAttribute('message') || ''
		this._icon = this.getAttribute('icon') || ''
		this._pulse = this.hasAttribute('pulse')
	}

	setState({ tone = 'neutral', message = '', icon = '', pulse = false } = {}) {
		this._tone = ['neutral', 'success', 'warning', 'error'].includes(tone) ? tone : 'neutral'
		this._message = String(message || '')
		this._icon = String(icon || '')
		this._pulse = Boolean(pulse)
		this.render()
	}

	renderIcon() {
		const path = ICONS[this._icon]
		if (!path) return ''
		return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`
	}

	render() {
		const indicator = this._pulse
			? '<span class="dot-wrap" aria-hidden="true"><span class="pulse"></span><span class="dot"></span></span>'
			: this.renderIcon()

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: inline-flex;
				}

				.note {
					display: inline-flex;
					align-items: center;
					gap: 0.5rem;
					font-size: var(--text-sm, 0.875rem);
					font-weight: 600;
					line-height: 1.35;
					color: #64748b;
				}

				.note[data-tone='success'] {
					color: #16a34a;
				}

				.note[data-tone='warning'] {
					color: #d97706;
				}

				.note[data-tone='error'] {
					color: #dc2626;
				}

				svg {
					width: 16px;
					height: 16px;
					flex-shrink: 0;
				}

				.dot-wrap {
					position: relative;
					width: 14px;
					height: 14px;
					display: inline-grid;
					place-items: center;
					flex-shrink: 0;
					align-self: center;
				}

				.dot,
				.pulse {
					position: absolute;
					top: 50%;
					left: 50%;
					border-radius: 999px;
					transform: translate(-50%, -50%);
				}

				.dot {
					width: 12px;
					height: 12px;
					background: currentColor;
					z-index: 1;
				}

				.pulse {
					width: 12px;
					height: 12px;
					background: currentColor;
					opacity: 0.35;
					animation: stock-note-pulse 1.35s ease-out infinite;
				}

				@keyframes stock-note-pulse {
					0% {
						transform: translate(-50%, -50%) scale(1);
						opacity: 0.4;
					}
					100% {
						transform: translate(-50%, -50%) scale(2.6);
						opacity: 0;
					}
				}
			</style>
			<div class="note" data-tone="${this._tone}">
				${indicator}
				<span>${this._message}</span>
			</div>
		`
	}
}

if (!customElements.get('tiendu-stock-note')) {
	customElements.define('tiendu-stock-note', TienduStockNote)
}

export {}
