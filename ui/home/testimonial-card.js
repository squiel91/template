// @ts-nocheck

import { refreshIcons } from '/shared/icons.js'

const clampRating = value => {
	const parsed = Number(value)
	if (!Number.isFinite(parsed)) return 5
	return Math.max(1, Math.min(5, Math.round(parsed)))
}

class HomeTestimonialCard extends HTMLElement {
	connectedCallback() {
		const rating = clampRating(this.getAttribute('rating'))
		const title = this.getAttribute('title') || 'Excelente producto'
		const quote = this.getAttribute('quote') || 'Comentario pendiente.'
		const author = this.getAttribute('author') || 'Cliente verificado'
		const product = this.getAttribute('product') || 'Review en producto destacado'
		const initial = (this.getAttribute('initial') || author.charAt(0) || 'C').slice(0, 1)
		const imageSrc = this.getAttribute('image-src') || '/public/no-image.svg'
		const imageAlt = this.getAttribute('image-alt') || 'Producto'

		const stars = Array.from({ length: 5 })
			.map((_, index) => {
				if (index < rating) return '<i data-lucide="star"></i>'
				return '<i data-lucide="star" style="opacity:0.3"></i>'
			})
			.join('')

		this.classList.add('model-review-card')
		this.innerHTML = `
			<div class="model-review-card__top">
				<div class="model-review-card__stars" aria-label="${rating} estrellas de 5">${stars}</div>
				<span class="model-review-card__thumb"><img src="${imageSrc}" alt="${imageAlt}" /></span>
			</div>
			<h3>${title}</h3>
			<p class="model-review-card__quote">${quote}</p>
			<div class="model-review-card__bottom">
				<span class="model-review-card__avatar" aria-hidden="true">${initial}</span>
				<div class="model-review-card__meta">
					<strong>${author}</strong>
					<span>${product}</span>
				</div>
				<span class="model-review-card__verified"><i data-lucide="circle-check"></i>Verificado</span>
			</div>
		`

		refreshIcons()
	}
}

if (!customElements.get('home-testimonial-card')) {
	customElements.define('home-testimonial-card', HomeTestimonialCard)
}

export {}
