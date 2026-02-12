// @ts-nocheck

const LUCIDE_STAR_POLYGON = '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26'

class RatingStars extends HTMLElement {
	static get observedAttributes() {
		return ['value', 'size', 'max', 'label']
	}

	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
	}

	connectedCallback() {
		this.render()
	}

	attributeChangedCallback() {
		this.render()
	}

	getNumberAttribute(name, fallback) {
		const rawValue = this.getAttribute(name)
		if (rawValue === null || rawValue === '') return fallback
		const value = Number(rawValue)
		return Number.isFinite(value) ? value : fallback
	}

	renderStars(max) {
		return new Array(max)
			.fill(0)
			.map(
				() =>
					`<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="${LUCIDE_STAR_POLYGON}"></polygon></svg>`
			)
			.join('')
	}

	render() {
		const value = Math.max(0, this.getNumberAttribute('value', 0))
		const max = Math.max(1, this.getNumberAttribute('max', 5))
		const size = Math.max(10, this.getNumberAttribute('size', 16))
		const gap = 2
		const totalWidth = max * size + (max - 1) * gap
		const fillPercent = Math.min(100, (value / max) * 100)
		const label =
			this.getAttribute('label') || `${value.toFixed(1)} de ${max} estrellas`

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: inline-flex;
					line-height: 1;
				}

				.stars {
					position: relative;
					display: inline-block;
					width: ${totalWidth}px;
					height: ${size}px;
				}

				.layer {
					display: flex;
					align-items: center;
					gap: ${gap}px;
					width: ${totalWidth}px;
					height: ${size}px;
				}

				.layer svg {
					width: ${size}px;
					height: ${size}px;
					flex: 0 0 auto;
					display: block;
					fill: currentColor;
					stroke: none;
				}

				.layer--base {
					position: absolute;
					left: 0;
					top: 0;
					color: #cbd5e1;
				}

				.layer--fill-wrap {
					position: absolute;
					left: 0;
					top: 0;
					height: ${size}px;
					overflow: hidden;
					width: ${fillPercent}%;
				}

				.layer--fill {
					position: absolute;
					left: 0;
					top: 0;
					color: #f59e0b;
				}
			</style>
			<div class="stars" role="img" aria-label="${label}">
				<div class="layer layer--base">${this.renderStars(max)}</div>
				<div class="layer--fill-wrap">
					<div class="layer layer--fill">${this.renderStars(max)}</div>
				</div>
			</div>
		`
	}
}

if (!customElements.get('rating-stars')) {
	customElements.define('rating-stars', RatingStars)
}

export {}
