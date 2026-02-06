class ProductList extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
	}

	connectedCallback() {
		this.render()
	}

	render() {
		if (!this.shadowRoot) return
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
				}
				.grid {
					display: grid;
					gap: 14px;
					grid-template-columns: repeat(4, minmax(0, 1fr));
				}
				@media (max-width: 1100px) {
					.grid {
						grid-template-columns: repeat(3, minmax(0, 1fr));
					}
				}
				@media (max-width: 820px) {
					.grid {
						grid-template-columns: repeat(2, minmax(0, 1fr));
					}
				}
				@media (max-width: 520px) {
					.grid {
						grid-template-columns: 1fr;
					}
				}
			</style>
			<div class="grid">
				<slot></slot>
			</div>
		`
	}
}

if (!customElements.get('product-list')) {
	customElements.define('product-list', ProductList)
}

export {}
