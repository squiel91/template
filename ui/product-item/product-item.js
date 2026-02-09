// @ts-nocheck

import { LitElement, html, nothing } from '/shared/lit.js'
import { tiendu } from '/shared/tiendu-client.js'
import '/ui/rating-stars/rating-stars.js'

const STYLE_ID = 'product-item-lit-styles'

const CART_ICON = html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4"/><path d="m9 11 1 9"/><path d="M4.5 15.5h15"/></svg>`
const SPINNER_ICON = html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="product-item__spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`

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
			gap: 12px;
			text-decoration: none;
			color: inherit;
		}

		.product-item__media {
			position: relative;
			aspect-ratio: 1 / 1;
			width: 100%;
			background: #f8fafc;
			border-radius: 16px;
			overflow: hidden;
		}

		.product-item__media img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.product-item__link:hover img {
			transform: scale(1.05);
		}

		.product-item__quick-action {
			position: absolute;
			bottom: 12px;
			right: 12px;
			opacity: 0;
			transform: translateY(8px);
			transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.product-item__link:hover .product-item__quick-action {
			opacity: 1;
			transform: translateY(0);
		}

		.product-item__quick-action-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			padding: 10px 14px;
			border-radius: 9999px;
			font-size: 13px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s ease;
			border: none;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		}

		.product-item__quick-action-btn--cart {
			width: 40px;
			height: 40px;
			padding: 0;
			background: #0f172a;
			color: white;
		}

		.product-item__quick-action-btn--cart:hover {
			background: #1e293b;
			transform: scale(1.05);
		}

		.product-item__quick-action-btn--options {
			background: white;
			color: #0f172a;
			padding: 10px 16px;
		}

		.product-item__quick-action-btn--options:hover {
			background: #f8fafc;
			transform: scale(1.02);
		}

		.product-item__quick-action-btn:disabled {
			opacity: 0.7;
			cursor: wait;
		}

		.product-item__quick-action-btn svg {
			width: 16px;
			height: 16px;
		}

		.product-item__spin {
			animation: product-item-spin 1s linear infinite;
		}

		.product-item__meta {
			padding: 0 4px;
		}

		.product-item__title {
			font-size: 15px;
			font-weight: 500;
			color: #0f172a;
			line-height: 1.4;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
			margin: 0;
		}

		.product-item__price-line {
			display: flex;
			align-items: center;
			gap: 8px;
			flex-wrap: wrap;
		}

		.product-item__rating-line {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			margin-top: 6px;
			color: #64748b;
			font-size: 15px;
			line-height: 1;
		}

		.product-item__rating-line span {
			display: inline-flex;
			align-items: center;
		}

		.product-item__price {
			font-size: 15px;
			font-weight: 700;
			color: #0f172a;
			letter-spacing: -0.01em;
		}

		.product-item__compare {
			font-size: 13px;
			color: #94a3b8;
			text-decoration: line-through;
			font-weight: 500;
		}

		@keyframes product-item-spin {
			from { transform: rotate(0deg); }
			to { transform: rotate(360deg); }
		}

		@media (max-width: 768px) {
			.product-item__quick-action {
				opacity: 1;
				transform: none;
			}
		}
	`
	document.head.appendChild(style)
}

class ProductItem extends LitElement {
	static properties = {
		productId: { type: String, attribute: 'product-id' },
		title: { type: String },
		price: { type: String },
		comparePrice: { type: String, attribute: 'compare-price' },
		imageUrl: { type: String, attribute: 'image-url' },
		imageAlt: { type: String, attribute: 'image-alt' },
		url: { type: String },
		hasSingleVariant: { type: Boolean, attribute: 'has-single-variant' },
		hasMultipleVariants: { type: Boolean, attribute: 'has-multiple-variants' },
		variantId: { type: String, attribute: 'variant-id' },
		averageRating: { type: Number, attribute: 'average-rating' },
		reviewsQuantity: { type: Number, attribute: 'reviews-quantity' }
	}

	constructor() {
		super()
		this.productId = ''
		this.title = ''
		this.price = ''
		this.comparePrice = ''
		this.imageUrl = ''
		this.imageAlt = ''
		this.url = ''
		this.hasSingleVariant = false
		this.hasMultipleVariants = false
		this.variantId = ''
		this.averageRating = 0
		this.reviewsQuantity = 0
		this.isLoading = false
	}

	createRenderRoot() {
		return this
	}

	connectedCallback() {
		super.connectedCallback()
		ensureStyles()
	}

	handleQuickAction(event) {
		event.preventDefault()
		event.stopPropagation()

		if (this.hasMultipleVariants) {
			window.location.href = this.url || `/productos/${this.productId}`
			return
		}

		if (!this.variantId || this.isLoading) return

		this.isLoading = true
		this.requestUpdate()

		tiendu.cart
			.addProductVariant({ id: Number(this.variantId) }, 1, ({ updatedCartItemsQuantity }) => {
				const cartBadge = document.getElementById('cart-quantity')
				if (cartBadge) cartBadge.textContent = String(updatedCartItemsQuantity)
			})
			.catch(err => {
				console.error('[ProductItem] Error adding to cart:', err)
			})
			.finally(() => {
				this.isLoading = false
				this.requestUpdate()
			})
	}

	renderQuickAction() {
		if (!this.hasSingleVariant && !this.hasMultipleVariants) return nothing

		if (this.hasSingleVariant) {
			return html`
				<div class="product-item__quick-action">
					<button
						class="product-item__quick-action-btn product-item__quick-action-btn--cart"
						type="button"
						aria-label="Agregar al carrito"
						@click=${this.handleQuickAction}
						?disabled=${this.isLoading}
					>
						${this.isLoading ? SPINNER_ICON : CART_ICON}
					</button>
				</div>
			`
		}

		return html`
			<div class="product-item__quick-action">
				<button
					class="product-item__quick-action-btn product-item__quick-action-btn--options"
					type="button"
					aria-label="Ver opciones"
					@click=${this.handleQuickAction}
				>
					<span>Opciones</span>
				</button>
			</div>
		`
	}

	render() {
		if (!this.title || !this.price) return nothing

		const href = this.url || `/productos/${this.productId}`
		const alt = this.imageAlt || this.title
		const averageRating = Number.isFinite(this.averageRating)
			? this.averageRating
			: 0
		const reviewsQuantity = Number.isFinite(this.reviewsQuantity)
			? this.reviewsQuantity
			: 0

		return html`
			<a href=${href} class="product-item__link">
				<div class="product-item__media">
					${this.imageUrl
						? html`<img src=${this.imageUrl} alt=${alt} loading="lazy" />`
						: nothing}
					${this.renderQuickAction()}
				</div>
				<div class="product-item__meta">
					<h3 class="product-item__title">${this.title}</h3>
					<div class="product-item__rating-line" aria-label="Calificacion del producto">
						<rating-stars value=${String(averageRating)} size="18"></rating-stars>
						<span>${averageRating.toFixed(1)} (${reviewsQuantity})</span>
					</div>
					<div class="product-item__price-line">
						<span class="product-item__price">${this.price}</span>
						${this.comparePrice
							? html`<span class="product-item__compare">${this.comparePrice}</span>`
							: nothing}
					</div>
				</div>
			</a>
		`
	}
}

if (!customElements.get('product-item')) {
	customElements.define('product-item', ProductItem)
}

export {}
