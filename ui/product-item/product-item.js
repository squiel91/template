class ProductItem extends HTMLElement {
	static get observedAttributes() {
		return ['product-id', 'title', 'price', 'compare-price', 'image-url', 'image-alt', 'url']
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

	render() {
		if (!this.shadowRoot) return
		const productId = this.getAttribute('product-id') ?? ''
		const url = this.getAttribute('url') || `/productos/${productId}`
		const title = this.getAttribute('title') ?? ''
		const price = this.getAttribute('price') ?? ''
		const comparePrice = this.getAttribute('compare-price') ?? ''
		const imageUrl = this.getAttribute('image-url')
		const imageAlt = this.getAttribute('image-alt') ?? title

		this.shadowRoot.innerHTML = `
			<a href="${url}">
				<div class="media">
				${
					imageUrl
						? `<img src="${imageUrl}" alt="${imageAlt}" loading="lazy" />`
						: ''
				}
				</div>
				<div class="meta">
					<h3>${title}</h3>
					<div class="price-line">
						<p class="price">${price}</p>
						${comparePrice ? `<p class="compare">${comparePrice}</p>` : ''}
					</div>
				</div>
			</a>
			<style>
				:host {
					display: block;
					font-family: inherit;
				}
				a {
					display: flex;
					flex-direction: column;
					gap: 10px;
					padding: 0;
					text-decoration: none;
					color: inherit;
				}
				.media {
					aspect-ratio: 1 / 1;
					width: 100%;
					background: #f8fafc;
					border-radius: 16px;
					display: flex;
					align-items: center;
					justify-content: center;
					overflow: hidden;
				}
				img {
					width: 100%;
					height: 100%;
					object-fit: cover;
					transition: transform 0.28s ease;
				}
				a:hover img {
					transform: scale(1.06);
				}
				.meta {
					padding: 0 2px;
				}
				.meta h3 {
					font-size: 16px;
					margin: 0 0 6px;
					font-weight: 600;
					line-height: 1.3;
				}
				.price-line {
					display: flex;
					align-items: baseline;
					gap: 8px;
				}
				.price {
					margin: 0;
					font-weight: 600;
					color: #1f4fbf;
				}
				.compare {
					margin: 0;
					font-size: 0.84rem;
					color: #667085;
					text-decoration: line-through;
				}
			</style>
		`
	}
}

if (!customElements.get('product-item')) {
	customElements.define('product-item', ProductItem)
}

export {}
