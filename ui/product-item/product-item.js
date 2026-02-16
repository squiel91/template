// @ts-nocheck

import { LitElement, html, nothing } from '/shared/lit.js'
import '/ui/rating-stars/rating-stars.js'
import { getAggregateProductInfo } from '/shared/aggregate-product-info.js'
import { getMetadataBrand } from '/shared/product-metadata.js'

const STYLE_ID = 'product-item-lit-styles'
const FALLBACK_IMAGE_SRC = '/public/no-image.svg'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		product-item {
			display: block;
			font-family: inherit;
		}

		.product-item__link {
			display: flex;
			flex-direction: column;
			gap: 10px;
			height: 100%;
			padding: 1rem;
			text-decoration: none;
			color: inherit;
			background: #f3f4f6;
			border-radius: 22px;
			border: 1px solid #e5e7eb;
		}

		.product-item__media {
			position: relative;
			aspect-ratio: 1 / 1;
			width: 100%;
			background: rgba(255, 255, 255, 0.6);
			border-radius: 16px;
			overflow: hidden;
		}

		.product-item__media img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.product-item__link:hover img {
			transform: scale(1.05);
		}

		.product-item__meta {
			display: flex;
			flex-direction: column;
			gap: 0.45rem;
		}

		.product-item__brand {
			margin: 0;
			font-size: 0.8rem;
			font-weight: 600;
			color: #6b7280;
		}

		.product-item__title {
			font-size: 1rem;
			font-weight: 600;
			color: #111827;
			line-height: 1.4;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
			margin: 0;
		}

		.product-item__rating-line {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			color: #6b7280;
			font-size: 0.9rem;
			line-height: 1;
		}

		.product-item__rating-line span {
			display: inline-flex;
			align-items: center;
		}

		.product-item__price-line {
			display: grid;
			gap: 0.22rem;
			justify-items: start;
		}

		.product-item__price {
			font-size: 1.05rem;
			font-weight: 700;
			color: #111827;
			line-height: 1;
		}

		.product-item__compare {
			font-size: 0.85rem;
			color: #9ca3af;
			text-decoration: line-through;
			font-weight: 500;
		}

		.product-item__sale {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			font-size: 0.8rem;
			line-height: 1;
		}

		.product-item__sale span {
			text-decoration: line-through;
			color: #9ca3af;
		}

		.product-item__sale small {
			padding: 0.12rem 0.35rem;
			border-radius: 999px;
			font-size: 0.62rem;
			font-weight: 700;
			background: #fee2e2;
			color: #b91c1c;
		}

		.product-item__price--sale {
			color: #b91c1c;
		}

		.product-item__soldout {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.5rem 0.75rem;
			border-radius: 0;
			background: rgba(220, 38, 38, 0.95);
			color: #fff;
			font-weight: 700;
			font-size: 0.72rem;
			line-height: 1;
			letter-spacing: 0.01em;
			box-shadow: 0 3px 10px rgba(127, 29, 29, 0.2);
		}
	`
	document.head.appendChild(style)
}

class ProductItem extends LitElement {
	static properties = {
		product: { attribute: false },
		url: { type: String }
	}

	constructor() {
		super()
		this.product = null
		this.url = ''
	}

	createRenderRoot() {
		return this
	}

	connectedCallback() {
		super.connectedCallback()
		ensureStyles()
	}

	renderOutOfStockBadge(isOutOfStock) {
		if (!isOutOfStock) return nothing
		return html`<span class="product-item__soldout">Agotado</span>`
	}

	render() {
		if (!this.product || typeof this.product !== 'object') return nothing

		const product = this.product
		const title = product.title || 'Producto'
		const href = this.url || `/perfumes/${Number(product.id) || ''}`
		const imageSrc = product?.coverImage?.url || FALLBACK_IMAGE_SRC
		const alt = product?.coverImage?.alt || product?.title || 'Producto'
		const brand = getMetadataBrand(product)
		const listing = getAggregateProductInfo(product)
		const averageRating = Number.isFinite(Number(product?.averageRating))
			? Number(product.averageRating)
			: 0
		const reviewsQuantity = Number.isFinite(Number(product?.reviewsQuantity))
			? Number(product.reviewsQuantity)
			: 0

		return html`
			<a href=${href} class="product-item__link">
				<div class="product-item__media">
					<img src=${imageSrc} alt=${alt} loading="lazy" />
					${this.renderOutOfStockBadge(listing.isOutOfStock)}
				</div>
				<div class="product-item__meta">
					${brand ? html`<p class="product-item__brand">${brand}</p>` : nothing}
					<h3 class="product-item__title">${title}</h3>
					<div class="product-item__rating-line" aria-label="Calificación del producto">
						<rating-stars value=${String(averageRating)} size="18"></rating-stars>
						<span>${averageRating.toFixed(1)} (${reviewsQuantity})</span>
					</div>
					${listing.hasDisplayPrice
						? html`<div class="product-item__price-line">
								${listing.compareLabel && listing.discountPercentage
									? html`<span class="product-item__sale"><span>${listing.compareLabel}</span><small>${listing.discountPercentage}% OFF</small></span>`
									: nothing}
								<span class=${listing.compareLabel && listing.discountPercentage ? 'product-item__price product-item__price--sale' : 'product-item__price'}>${listing.priceLabel}</span>
						  </div>`
						: nothing}
				</div>
			</a>
		`
	}
}

if (!customElements.get('product-item')) {
	customElements.define('product-item', ProductItem)
}

export {}
