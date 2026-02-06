class LoadingButton extends HTMLElement {
	static get observedAttributes() {
		return ['label', 'loading-label', 'duration', 'disabled']
	}

	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		this._loading = false
		this._timeoutId = null
		this.handleClick = this.handleClick.bind(this)
	}

	connectedCallback() {
		this.render()
	}

	disconnectedCallback() {
		const button = this.shadowRoot?.querySelector('button')
		button?.removeEventListener('click', this.handleClick)
		if (this._timeoutId) {
			clearTimeout(this._timeoutId)
			this._timeoutId = null
		}
	}

	attributeChangedCallback() {
		this.render()
	}

	getDuration() {
		const durationAttr = this.getAttribute('duration')
		const duration = Number(durationAttr)
		return Number.isFinite(duration) && duration > 0 ? duration : 4000
	}

	handleClick() {
		if (this._loading || this.hasAttribute('disabled')) return
		this.startLoading()
		this.dispatchEvent(
			new CustomEvent('loading-click', { bubbles: true, composed: true })
		)
	}

	startLoading() {
		if (this._loading) return
		this._loading = true
		this.render()
		this._timeoutId = setTimeout(() => {
			this._loading = false
			this.render()
		}, this.getDuration())
	}

		render() {
			if (!this.shadowRoot) return
			const label = this.getAttribute('label') || 'Button'
			const loadingLabel = this.getAttribute('loading-label') || 'Loading'
			const isDisabled = this._loading || this.hasAttribute('disabled')
			this.shadowRoot.innerHTML = `
				<style>
					button {
						background: #1f4fbf;
						color: #fff;
						border: 1px solid #1f4fbf;
						padding: 10px 14px;
						border-radius: 10px;
						font-size: 0.95rem;
						font-family: 'DM Sans', sans-serif;
						font-weight: 600;
						cursor: pointer;
						transition: filter 0.15s ease;
					}
					button:hover {
						filter: brightness(0.96);
					}
					button[disabled] {
						opacity: 0.6;
						cursor: not-allowed;
					}
				</style>
				<button ${isDisabled ? 'disabled' : ''} aria-busy="${this._loading}">
					${this._loading ? loadingLabel : label}
				</button>
			`
		this.shadowRoot
			.querySelector('button')
			?.addEventListener('click', this.handleClick)
	}
}

if (!customElements.get('loading-button')) {
	customElements.define('loading-button', LoadingButton)
}

export {}
