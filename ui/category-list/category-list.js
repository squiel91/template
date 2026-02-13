// @ts-nocheck

import { LitElement } from '/shared/lit.js'

const STYLE_ID = 'category-list-lit-styles'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		category-list {
			display: grid;
			gap: 24px;
		}

		@media (min-width: 640px) {
			category-list {
				grid-template-columns: repeat(2, 1fr);
			}
		}

		@media (min-width: 1024px) {
			category-list {
				grid-template-columns: repeat(3, 1fr);
				gap: 32px;
			}
		}
	`
	document.head.appendChild(style)
}

class CategoryList extends LitElement {
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

if (!customElements.get('category-list')) {
	customElements.define('category-list', CategoryList)
}

export {}
