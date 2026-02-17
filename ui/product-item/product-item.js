// @ts-nocheck

import { LitElement, html, nothing } from '/shared/lit.js'
import '/ui/rating-stars/rating-stars.js'
import { getAggregateProductInfo } from '/shared/aggregate-product-info.js'
import { getProductVariantByPriceStrategy } from '/shared/aggregate-product-info.js'
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
			gap: 0;
			height: 100%;
			padding: 0 0 0.95rem;
			text-decoration: none;
			color: inherit;
			background: #ffffff;
			border-radius: 12px;
			border: none;
			overflow: hidden;
			box-shadow: 0 3px 10px rgba(15, 23, 42, 0.11);
		}

		.product-item__media {
			position: relative;
			aspect-ratio: 1 / 1;
			width: 100%;
			background: #f8fafc;
			border-radius: 12px 12px 0 0;
			overflow: hidden;
		}

		.product-item__media img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.product-item__link:hover img,
		.product-item__link:focus-visible img {
			transform: scale(1.05);
		}

		.product-item__zoom-indicator {
			position: absolute;
			top: 0.75rem;
			right: 0.75rem;
			width: 40px;
			height: 40px;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.96);
			color: #0f172a;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
			opacity: 0;
			transform: translateY(-6px);
			pointer-events: none;
			transition: opacity 0.2s ease, transform 0.2s ease;
		}

		.product-item__zoom-indicator svg {
			width: 18px;
			height: 18px;
		}

		.product-item__link:hover .product-item__zoom-indicator,
		.product-item__link:focus-visible .product-item__zoom-indicator {
			opacity: 1;
			transform: translateY(0);
		}

		.product-item__meta {
			display: flex;
			flex-direction: column;
			gap: 0.45rem;
			padding: 0.8rem 0.9rem 0;
		}

		.product-item__brand {
			margin: 0;
			font-size: 0.8rem;
			font-weight: 400;
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
			font-weight: 600;
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
			top: 12px;
			left: 12px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0.35rem 0.55rem;
			border-radius: 6px;
			background: #193cb8;
			color: #fff;
			font-weight: 700;
			font-size: 0.68rem;
			line-height: 1;
			letter-spacing: 0.01em;
			box-shadow: 0 6px 12px rgba(25, 60, 184, 0.28);
		}
	`
	document.head.appendChild(style)
}

class ProductItem extends LitElement {
	static properties = {
		product: { attribute: false },
		url: { type: String },
		priceStrategy: { type: String, attribute: 'price-strategy' }
	}

	constructor() {
		super()
		this.product = null
		this.url = ''
		this.priceStrategy = 'most-expensive'
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
		const initialHref = this.url || `/perfumes/${Number(product.id) || ''}`
		const resolvedUrl = new URL(initialHref, window.location.origin)
		const selectedVariant = getProductVariantByPriceStrategy(product?.variants, this.priceStrategy)
		if (Number.isFinite(Number(selectedVariant?.id))) {
			resolvedUrl.searchParams.set('variantId', String(selectedVariant.id))
		}
		const href = `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`
		const imageSrc = product?.coverImage?.url || FALLBACK_IMAGE_SRC
		const alt = product?.coverImage?.alt || product?.title || 'Producto'
		const brand = getMetadataBrand(product)
		const listing = getAggregateProductInfo(product, { strategy: this.priceStrategy })
		const averageRating = Number.isFinite(Number(product?.averageRating))
			? Number(product.averageRating)
			: 0

		return html`
			<a href=${href} class="product-item__link">
				<div class="product-item__media">
					<img src=${imageSrc} alt=${alt} loading="lazy" />
					<span class="product-item__zoom-indicator" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
					</span>
					${this.renderOutOfStockBadge(listing.isOutOfStock)}
				</div>
				<div class="product-item__meta">
					${brand ? html`<p class="product-item__brand">${brand}</p>` : nothing}
					<h3 class="product-item__title">${title}</h3>
					<div class="product-item__rating-line" aria-label="Calificación del producto">
						<rating-stars value=${String(averageRating)} size="18"></rating-stars>
						<span>${averageRating.toFixed(1)}</span>
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
