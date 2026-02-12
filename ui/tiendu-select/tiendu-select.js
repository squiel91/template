// @ts-nocheck

const MENU_ANIMATION_MS = 180
const ICON_PATHS = {
	'arrow-down-up': '<path d="m3 16 4 4 4-4"></path><path d="M7 20V4"></path><path d="m21 8-4-4-4 4"></path><path d="M17 4v16"></path>'
}

class TienduSelect extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		this._options = []
		this._value = ''
		this._open = false
		this._closing = false
		this._closeTimer = null
		this._boundOutsideClick = this.handleOutsideClick.bind(this)
	}

	connectedCallback() {
		this.render()
		document.addEventListener('click', this._boundOutsideClick)
	}

	disconnectedCallback() {
		document.removeEventListener('click', this._boundOutsideClick)
		if (this._closeTimer) {
			clearTimeout(this._closeTimer)
			this._closeTimer = null
		}
	}

	set options(value) {
		this._options = Array.isArray(value) ? value : []
		if (!this.selectedOption && this._options.length > 0) {
			this._value = String(this._options[0].value)
		}
		this.render()
	}

	setOptions(options) {
		this.options = options
	}

	setValue(value) {
		this._value = value == null ? '' : String(value)
		this.render()
	}

	get selectedOption() {
		return this._options.find(option => String(option.value) === this._value) || null
	}

	handleOutsideClick(event) {
		if (!this._open) return
		if (event.composedPath().includes(this)) return
		this.closeMenu()
	}

	toggleOpen() {
		if (this._open) {
			this.closeMenu()
			return
		}

		if (this._closeTimer) {
			clearTimeout(this._closeTimer)
			this._closeTimer = null
		}

		this._closing = false
		this._open = true
		this.render()
	}

	closeMenu() {
		if ((!this._open && !this._closing) || this._closing) return
		this._open = false
		this._closing = true
		this.render()

		if (this._closeTimer) clearTimeout(this._closeTimer)
		this._closeTimer = window.setTimeout(() => {
			this._closing = false
			this._closeTimer = null
			this.render()
		}, MENU_ANIMATION_MS)
	}

	selectOption(value) {
		const normalized = String(value)
		if (!normalized) return
		this._value = normalized
		this.closeMenu()
		this.dispatchEvent(
			new CustomEvent('tiendu-select-change', {
				bubbles: true,
				composed: true,
				detail: { value: normalized }
			})
		)
	}

	renderIcon() {
		const iconName = (this.getAttribute('icon') || '').trim()
		const iconPath = ICON_PATHS[iconName]
		if (!iconPath) return ''
		return `<svg class="leading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPath}</svg>`
	}

	render() {
		const isMenuVisible = this._open || this._closing
		const menuState = this._closing ? 'closing' : 'open'
		const selectedOption = this.selectedOption
		const placeholder = this.getAttribute('placeholder') || 'Seleccionar'
		const selectedLabel = selectedOption?.label || placeholder

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: inline-block;
					width: 100%;
					min-width: 0;
					position: relative;
				}

				.trigger {
					width: 100%;
					height: 40px;
					padding: 0 0.75rem;
					display: inline-flex;
					align-items: center;
					gap: 0.5rem;
					border-radius: 14px;
					border: 1px solid #cbd5e1;
					background: #fff;
					color: #0f172a;
					font-family: inherit;
					font-size: 0.875rem;
					font-weight: 600;
					box-sizing: border-box;
				}

				.trigger:hover {
					background: #f8fafc;
					border-color: #94a3b8;
				}

				.leading-icon {
					width: 16px;
					height: 16px;
					color: #64748b;
					flex-shrink: 0;
				}

				.label {
					flex: 1;
					text-align: left;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.chevron {
					width: 16px;
					height: 16px;
					flex-shrink: 0;
					transform: ${this._open ? 'rotate(180deg)' : 'rotate(0deg)'};
					transition: transform 0.15s ease;
				}

				.menu {
					position: absolute;
					top: calc(100% + 0.4rem);
					left: 0;
					right: 0;
					z-index: 20;
					background: #fff;
					border: 1px solid #cbd5e1;
					border-radius: 12px;
					padding: 0;
					box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
					max-height: 240px;
					overflow: auto;
					transform-origin: top center;
				}

				.menu[data-state='open'] {
					opacity: 0;
					transform: translateY(-8px);
					animation: tiendu-select-menu-in 180ms ease forwards;
				}

				.menu[data-state='closing'] {
					opacity: 1;
					transform: translateY(0);
					animation: tiendu-select-menu-out 180ms ease forwards;
					pointer-events: none;
				}

				@keyframes tiendu-select-menu-in {
					from {
						opacity: 0;
						transform: translateY(-8px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@keyframes tiendu-select-menu-out {
					from {
						opacity: 1;
						transform: translateY(0);
					}
					to {
						opacity: 0;
						transform: translateY(-8px);
					}
				}

				.option {
					width: 100%;
					height: 40px;
					padding: 0 0.75rem;
					display: inline-flex;
					align-items: center;
					border: none;
					background: #fff;
					font-family: inherit;
					font-size: 0.875rem;
					font-weight: 600;
					color: #0f172a;
					text-align: left;
				}

				.option + .option {
					box-shadow: inset 0 1px 0 #e2e8f0;
				}

				.option:hover {
					background: #f8fafc;
				}

				.option[aria-selected='true'] {
					font-weight: 800;
				}
			</style>

			<button class="trigger" type="button" aria-haspopup="listbox" aria-expanded="${this._open ? 'true' : 'false'}">
				${this.renderIcon()}
				<span class="label">${selectedLabel}</span>
				<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
			</button>

			${
				isMenuVisible
					? `<div class="menu" data-state="${menuState}" role="listbox">${this._options
							.map(option => {
								const selected = String(option.value) === this._value
								return `<button class="option" type="button" data-value="${String(option.value)}" aria-selected="${selected ? 'true' : 'false'}">${option.label}</button>`
							})
							.join('')}</div>`
					: ''
			}
		`

		const trigger = this.shadowRoot.querySelector('.trigger')
		trigger?.addEventListener('click', () => this.toggleOpen())

		for (const option of this.shadowRoot.querySelectorAll('.option')) {
			option.addEventListener('click', () => {
				const value = option.getAttribute('data-value') || ''
				this.selectOption(value)
			})
		}
	}
}

if (!customElements.get('tiendu-select')) {
	customElements.define('tiendu-select', TienduSelect)
}

export {}
