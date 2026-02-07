// @ts-nocheck

import { LitElement } from '/shared/lit.js'

const STYLE_ID = 'product-list-lit-styles'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		product-list {
			display: grid;
			gap: 24px;
			grid-template-columns: repeat(2, 1fr);
		}

		@media (min-width: 640px) {
			product-list {
				grid-template-columns: repeat(3, 1fr);
			}
		}

		@media (min-width: 1024px) {
			product-list {
				grid-template-columns: repeat(4, 1fr);
				gap: 32px;
			}
		}
	`
	document.head.appendChild(style)
}

class ProductList extends LitElement {
	createRenderRoot() {
		return this
	}

	connectedCallback() {
		super.connectedCallback()
		ensureStyles()
	}

	render() {
		return null
	}
}

if (!customElements.get('product-list')) {
	customElements.define('product-list', ProductList)
}

export {}
