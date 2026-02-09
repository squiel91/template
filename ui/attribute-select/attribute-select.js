// @ts-nocheck

const toSafeCssColor = value => {
	const color = String(value || '').trim()
	if (!color) return null
	if (/^#([0-9a-fA-F]{3,8})$/.test(color)) return color
	if (/^[a-zA-Z]+$/.test(color)) return color
	return null
}

class TienduAttributeSelect extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		this._options = []
		this._valueId = null
		this._disabledOptionIds = new Set()
		this._open = false
		this._boundOutsideClick = this.handleOutsideClick.bind(this)
	}

	connectedCallback() {
		this.render()
		document.addEventListener('click', this._boundOutsideClick)
	}

	disconnectedCallback() {
		document.removeEventListener('click', this._boundOutsideClick)
	}

	set options(value) {
		this._options = Array.isArray(value) ? value : []
		this.render()
	}

	setValue(valueId) {
		this._valueId = Number.isFinite(Number(valueId)) ? Number(valueId) : null
		this.render()
	}

	setDisabledOptionIds(optionIds) {
		this._disabledOptionIds = new Set(
			(Array.isArray(optionIds) ? optionIds : []).map(id => Number(id)).filter(Number.isFinite)
		)
		this.render()
	}

	get selectedOption() {
		return this._options.find(option => Number(option.id) === Number(this._valueId)) || null
	}

	handleOutsideClick(event) {
		if (!this._open) return
		if (event.composedPath().includes(this)) return
		this._open = false
		this.render()
	}

	toggleOpen() {
		this._open = !this._open
		this.render()
	}

	selectOption(valueId) {
		const normalized = Number(valueId)
		if (!Number.isFinite(normalized)) return
		if (this._disabledOptionIds.has(normalized)) return
		this._valueId = normalized
		this._open = false
		this.render()
		this.dispatchEvent(
			new CustomEvent('tiendu-select-change', {
				bubbles: true,
				composed: true,
				detail: { valueId: normalized }
			})
		)
	}

	renderSwatch(option) {
		if (!option) return ''
		if (option.imageUrl) {
			return `<span class="swatch swatch--image" aria-hidden="true"><img src="${option.imageUrl}" alt="" loading="lazy" /></span>`
		}
		const safeColor = toSafeCssColor(option.color)
		if (safeColor) {
			return `<span class="swatch swatch--color" style="background:${safeColor};" aria-hidden="true"></span>`
		}
		return ''
	}

	render() {
		const selectedOption = this.selectedOption
		const selectedLabel = selectedOption?.label || 'Seleccionar'
		const selectedSwatch = this.renderSwatch(selectedOption)

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: inline-block;
					min-width: 220px;
					position: relative;
				}

				.trigger {
					width: 100%;
					height: 40px;
					padding: 0 0.75rem 0 0;
					display: inline-flex;
					align-items: center;
					gap: 0;
					border-radius: 14px;
					border: 1px solid #cbd5e1;
					background: #fff;
					color: #0f172a;
					font-family: inherit;
					font-size: 0.875rem;
					font-weight: 600;
					box-sizing: border-box;
					overflow: hidden;
				}

				.trigger:hover {
					background: #f8fafc;
					border-color: #94a3b8;
				}

				.swatch {
					width: 40px;
					height: 40px;
					border-right: 1px solid rgba(148, 163, 184, 0.45);
					flex-shrink: 0;
					overflow: hidden;
					background: #e2e8f0;
				}

				.swatch img {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}

				.label {
					flex: 1;
					text-align: left;
					padding: 0 0.75rem;
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
				}

				.option {
					width: 100%;
					height: 40px;
					padding: 0;
					display: flex;
					align-items: stretch;
					gap: 0;
					border: none;
					border-radius: 0;
					background: #fff;
					font-family: inherit;
					font-size: 0.875rem;
					font-weight: 600;
					color: #0f172a;
					overflow: hidden;
				}

				.option + .option {
					box-shadow: inset 0 1px 0 #e2e8f0;
				}

				.option:first-child {
					border-top-left-radius: 11px;
					border-top-right-radius: 11px;
				}

				.option:last-child {
					border-bottom-left-radius: 11px;
					border-bottom-right-radius: 11px;
				}

				.option .swatch img {
					display: block;
				}

				.option .label {
					display: inline-flex;
					align-items: center;
					height: 100%;
				}

				.option:hover:not(:disabled) {
					background: #f8fafc;
				}

				.option[aria-selected='true'] {
					outline: 2px solid #0f172a;
					outline-offset: -2px;
				}

				.option:disabled {
					opacity: 0.4;
					cursor: not-allowed;
				}
			</style>

			<button class="trigger" type="button" aria-haspopup="listbox" aria-expanded="${this._open ? 'true' : 'false'}">
				${selectedSwatch}
				<span class="label">${selectedLabel}</span>
				<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
			</button>

			${
				this._open
					? `<div class="menu" role="listbox">
						${this._options
							.map(option => {
								const optionId = Number(option.id)
								const isSelected = optionId === Number(this._valueId)
								const isDisabled = this._disabledOptionIds.has(optionId)
								return `<button class="option" type="button" data-value-id="${optionId}" aria-selected="${isSelected ? 'true' : 'false'}" ${isDisabled ? 'disabled' : ''}>${this.renderSwatch(option)}<span class="label">${option.label}</span></button>`
							})
							.join('')}
					</div>`
					: ''
			}
		`

		const trigger = this.shadowRoot.querySelector('.trigger')
		trigger?.addEventListener('click', () => this.toggleOpen())

		for (const option of this.shadowRoot.querySelectorAll('.option')) {
			option.addEventListener('click', () => {
				const valueId = Number(option.getAttribute('data-value-id'))
				this.selectOption(valueId)
			})
		}
	}
}

if (!customElements.get('tiendu-attribute-select')) {
	customElements.define('tiendu-attribute-select', TienduAttributeSelect)
}

export {}
