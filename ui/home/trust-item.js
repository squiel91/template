// @ts-nocheck

import { refreshIcons } from '/shared/icons.js'

class HomeTrustItem extends HTMLElement {
	connectedCallback() {
		const icon = this.getAttribute('icon') || 'sparkles'
		const title = this.getAttribute('title') || 'Título'
		const subtitle = this.getAttribute('subtitle') || ''

		this.classList.add('model-trust-item')
		this.innerHTML = `
			<span class="model-trust-item__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
			<div>
				<p class="model-trust-item__title">${title}</p>
				<p class="model-trust-item__subtitle">${subtitle}</p>
			</div>
		`

		refreshIcons()
	}
}

if (!customElements.get('home-trust-item')) {
	customElements.define('home-trust-item', HomeTrustItem)
}

export {}
