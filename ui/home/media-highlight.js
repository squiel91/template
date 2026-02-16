// @ts-nocheck

class HomeMediaHighlight extends HTMLElement {
	connectedCallback() {
		const imageSrc = this.getAttribute('image-src') || '/public/no-image.svg'
		const imageAlt = this.getAttribute('image-alt') || 'Campaña destacada'
		const title = this.getAttribute('title') || 'Campaña'
		const description = this.getAttribute('description') || ''
		const ctaLabel = this.getAttribute('cta-label') || 'EXPLORAR'
		const ctaHref = this.getAttribute('cta-href') || '/perfumes'
		const reverse = this.hasAttribute('reverse')

		this.classList.add('model-reveal')
		this.innerHTML = `
			<section class="model-media${reverse ? ' model-media--reverse' : ''}">
				<div class="model-media__visual">
					<img src="${imageSrc}" alt="${imageAlt}" loading="lazy" />
				</div>
				<div class="model-media__content">
					<h2>${title}</h2>
					<p>${description}</p>
					<a href="${ctaHref}">${ctaLabel}</a>
				</div>
			</section>
		`
	}
}

if (!customElements.get('home-media-highlight')) {
	customElements.define('home-media-highlight', HomeMediaHighlight)
}

export {}
