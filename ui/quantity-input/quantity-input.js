// @ts-nocheck

class TienduQuantityInput extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		this._value = 1
		this._min = 1
		this._max = null
		this._disabled = false
	}

	static get observedAttributes() {
		return ['value', 'min', 'max', 'disabled']
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
		const minAttr = Number(this.getAttribute('min'))
		this._min = Number.isFinite(minAttr) ? Math.max(1, Math.floor(minAttr)) : 1

		const maxAttrRaw = this.getAttribute('max')
		if (maxAttrRaw == null || maxAttrRaw === '') {
			this._max = null
		} else {
			const maxAttr = Number(maxAttrRaw)
			this._max = Number.isFinite(maxAttr) ? Math.max(this._min, Math.floor(maxAttr)) : null
		}

		this._disabled = this.hasAttribute('disabled')

		const valueAttr = Number(this.getAttribute('value'))
		if (Number.isFinite(valueAttr)) {
			this._value = this.clamp(Math.floor(valueAttr))
		} else {
			this._value = this.clamp(this._value)
		}
	}

	clamp(value) {
		const min = this._min
		const max = this._max
		if (typeof max === 'number') {
			return Math.max(min, Math.min(max, value))
		}
		return Math.max(min, value)
	}

	getValue() {
		return this._value
	}

	setValue(nextValue, { emit = false } = {}) {
		const next = this.clamp(Math.floor(Number(nextValue) || 0))
		const changed = next !== this._value
		this._value = next
		this.setAttribute('value', String(next))
		if (changed && emit) {
			this.dispatchEvent(
				new CustomEvent('quantity-change', {
					bubbles: true,
					composed: true,
					detail: { value: this._value }
				})
			)
		}
		this.render()
	}

	setMin(value) {
		const parsed = Number(value)
		const nextMin = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1
		this.setAttribute('min', String(nextMin))
		if (this._max != null && this._max < nextMin) {
			this.setAttribute('max', String(nextMin))
		}
		this.setValue(this._value)
	}

	setMax(value) {
		if (value == null || value === '') {
			this.removeAttribute('max')
			this.setValue(this._value)
			return
		}
		const parsed = Number(value)
		if (!Number.isFinite(parsed)) {
			this.removeAttribute('max')
			this.setValue(this._value)
			return
		}
		const nextMax = Math.max(this._min, Math.floor(parsed))
		this.setAttribute('max', String(nextMax))
		this.setValue(this._value)
	}

	setDisabled(value) {
		if (value) this.setAttribute('disabled', '')
		else this.removeAttribute('disabled')
	}

	handleDecrease = () => {
		if (this._disabled) return
		this.setValue(this._value - 1, { emit: true })
	}

	handleIncrease = () => {
		if (this._disabled) return
		this.setValue(this._value + 1, { emit: true })
	}

	handleInput = event => {
		if (this._disabled) return
		const input = event.target
		if (!(input instanceof HTMLInputElement)) return
		const cleaned = input.value.replace(/[^0-9]/g, '')
		if (cleaned !== input.value) input.value = cleaned
	}

	handleInputCommit = event => {
		if (this._disabled) return
		const input = event.target
		if (!(input instanceof HTMLInputElement)) return
		const numeric = Number(input.value)
		if (!Number.isFinite(numeric)) {
			this.setValue(this._value)
			return
		}
		this.setValue(numeric, { emit: true })
	}

	handleInputKeydown = event => {
		if (!(event.target instanceof HTMLInputElement)) return
		if (event.key !== 'Enter') return
		event.preventDefault()
		this.handleInputCommit(event)
		event.target.blur()
	}

	render() {
		const min = this._min
		const max = this._max
		const atMin = this._value <= min
		const atMax = typeof max === 'number' ? this._value >= max : false
		const minusDisabled = this._disabled || atMin
		const plusDisabled = this._disabled || atMax

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: inline-flex;
				}

				.wrapper {
					display: inline-flex;
					align-items: center;
					border: 1px solid #cbd5e1;
					border-radius: 14px;
					overflow: hidden;
					background: #ffffff;
					height: 40px;
				}

				button {
					width: 40px;
					height: 40px;
					border: none;
					background: transparent;
					color: #0f172a;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					padding: 0;
					cursor: pointer;
					transition: background-color 0.15s ease;
				}

				button:hover:not(:disabled) {
					background: #f8fafc;
				}

				button:disabled {
					opacity: 0.35;
					cursor: not-allowed;
				}

				svg {
					width: 18px;
					height: 18px;
				}

				input {
					width: 48px;
					height: 40px;
					border: none;
					outline: none;
					text-align: center;
					font-family: inherit;
					font-size: 0.95rem;
					font-weight: 700;
					color: #0f172a;
					background: transparent;
					padding: 0;
				}

				input[type='number']::-webkit-outer-spin-button,
				input[type='number']::-webkit-inner-spin-button {
					-webkit-appearance: none;
					margin: 0;
				}

				input[type='number'] {
					-moz-appearance: textfield;
				}
			</style>
			<div class="wrapper" part="wrapper">
				<button type="button" data-role="decrease" aria-label="Disminuir cantidad" ${minusDisabled ? 'disabled' : ''}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path></svg>
				</button>
				<input type="number" inputmode="numeric" min="${min}" ${typeof max === 'number' ? `max="${max}"` : ''} value="${this._value}" ${this._disabled ? 'disabled' : ''} aria-label="Cantidad" />
				<button type="button" data-role="increase" aria-label="Aumentar cantidad" ${plusDisabled ? 'disabled' : ''}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
				</button>
			</div>
		`

		this.shadowRoot.querySelector('[data-role="decrease"]')?.addEventListener('click', this.handleDecrease)
		this.shadowRoot.querySelector('[data-role="increase"]')?.addEventListener('click', this.handleIncrease)

		const input = this.shadowRoot.querySelector('input')
		input?.addEventListener('input', this.handleInput)
		input?.addEventListener('change', this.handleInputCommit)
		input?.addEventListener('blur', this.handleInputCommit)
		input?.addEventListener('keydown', this.handleInputKeydown)
	}
}

if (!customElements.get('tiendu-quantity-input')) {
	customElements.define('tiendu-quantity-input', TienduQuantityInput)
}

export {}
