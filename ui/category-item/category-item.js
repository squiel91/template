// @ts-nocheck

import { LitElement, html, nothing } from '/shared/lit.js'

const STYLE_ID = 'category-item-lit-styles'
const FALLBACK_IMAGE_SRC = '/public/no-image.svg'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		category-item {
			display: block;
		}

		.category-item__link {
			position: relative;
			display: block;
			aspect-ratio: 1 / 1;
			border-radius: 16px;
			overflow: hidden;
			text-decoration: none;
		}

		.category-item__image {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			object-fit: cover;
			transform: scale(1);
			transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.category-item__link:hover .category-item__image {
			transform: scale(1.05);
		}

		.category-item__overlay {
			position: absolute;
			inset: 0;
			background: linear-gradient(
				to bottom,
				rgba(15, 23, 42, 0) 0%,
				rgba(15, 23, 42, 0) 75%,
				rgba(15, 23, 42, 0.74) 100%
			);
			transition: background 180ms ease;
		}

		.category-item__link:hover .category-item__overlay {
			background: linear-gradient(
				to bottom,
				rgba(15, 23, 42, 0) 0%,
				rgba(15, 23, 42, 0) 75%,
				rgba(15, 23, 42, 0.8) 100%
			);
		}

		.category-item__content {
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			padding: 20px;
			color: #ffffff;
		}

		.category-item__name {
			font-size: 1.125rem;
			font-weight: 700;
			line-height: 1.2;
			margin: 0 0 4px;
		}

		.category-item__count {
			font-size: 0.875rem;
			opacity: 0.88;
			margin: 0;
		}
	`
	document.head.appendChild(style)
}

class CategoryItem extends LitElement {
	static properties = {
		categoryId: { type: String, attribute: 'category-id' },
		title: { type: String },
		count: { type: Number },
		url: { type: String },
		imageUrl: { type: String, attribute: 'image-url' },
		imageAlt: { type: String, attribute: 'image-alt' }
	}

	constructor() {
		super()
		this.categoryId = ''
		this.title = ''
		this.count = 0
		this.url = ''
		this.imageUrl = ''
		this.imageAlt = ''
	}

	createRenderRoot() {
		return this
	}

	connectedCallback() {
		super.connectedCallback()
		ensureStyles()
	}

	render() {
		if (!this.title) return nothing
		const href = this.url || `/categorias/${this.categoryId}`
		const imageSrc = this.imageUrl || FALLBACK_IMAGE_SRC
		const imageAlt = this.imageAlt || this.title || 'Sin imagen'
		const count = Number.isFinite(Number(this.count)) ? Number(this.count) : 0

		return html`
			<a class="category-item__link" href=${href}>
				<img class="category-item__image" src=${imageSrc} alt=${imageAlt} loading="lazy" />
				<div class="category-item__overlay"></div>
				<div class="category-item__content">
					<p class="category-item__name">${this.title}</p>
					<p class="category-item__count">${count} ${count === 1 ? 'producto' : 'productos'}</p>
				</div>
			</a>
		`
	}
}

if (!customElements.get('category-item')) {
	customElements.define('category-item', CategoryItem)
}

export {}
