// @ts-nocheck

import '/ui/home/trust-item.js'
import '/ui/home/testimonial-card.js'
import '/ui/home/media-highlight.js'
import '/ui/product-item/product-item.js'
import { tiendu } from '/shared/tiendu-client.js'
import { refreshIcons } from '/shared/icons.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import { escapeHtml } from '/shared/sanitize.js'

const FEATURED_PAGE_SIZE = 8
const FEATURED_CATEGORY_ID = 242
const TESTIMONIALS_PAGE_SIZE = 6

const renderFeaturedStatus = message => {
	const track = document.querySelector('[data-featured-group="featured"]')
	if (!(track instanceof HTMLElement)) return

	track.innerHTML = `<div class="model-featured__status">${escapeHtml(message)}</div>`
	track.removeAttribute('aria-busy')
}

const renderTestimonialsStatus = message => {
	const grid = document.querySelector('[data-testimonials-grid]')
	if (!(grid instanceof HTMLElement)) return

	grid.innerHTML = `<div class="model-featured__status">${escapeHtml(message)}</div>`
	grid.removeAttribute('aria-busy')
}

const loadFeaturedProducts = async () => {
	const track = document.querySelector('[data-featured-group="featured"]')
	if (!(track instanceof HTMLElement)) return

	track.setAttribute('aria-busy', 'true')

	try {
		const response = await tiendu.products.list({
			categoryId: FEATURED_CATEGORY_ID,
			includeProductsFromSubcategories: true,
			criteria: 'created',
			order: 'desc',
			page: 1,
			size: FEATURED_PAGE_SIZE
		})

		const products = Array.isArray(response?.data) ? response.data : []
		if (products.length === 0) {
			renderFeaturedStatus('No hay productos disponibles en este momento.')
			return
		}

		const fragment = document.createDocumentFragment()
		for (const product of products) {
			if (!product || !Number.isFinite(Number(product.id))) continue
			fragment.appendChild(createProductItemElement(product))
		}

		if (fragment.childNodes.length === 0) {
			renderFeaturedStatus('No hay productos disponibles en este momento.')
			return
		}

		track.innerHTML = ''
		track.appendChild(fragment)
		refreshIcons()
	} catch (error) {
		console.error('[Home] Error loading featured products:', error)
		renderFeaturedStatus('No pudimos cargar los productos. Intentá de nuevo.')
	} finally {
		track.removeAttribute('aria-busy')
	}
}

const loadTestimonials = async () => {
	const grid = document.querySelector('[data-testimonials-grid]')
	if (!(grid instanceof HTMLElement)) return

	grid.setAttribute('aria-busy', 'true')

	try {
		const response = await tiendu.reviews.list({
			criteria: 'updatedAt',
			order: 'desc',
			page: 1,
			size: TESTIMONIALS_PAGE_SIZE
		})

		const reviews = Array.isArray(response?.data) ? response.data : []
		if (reviews.length === 0) {
			renderTestimonialsStatus('Todavía no hay reseñas para mostrar.')
			return
		}

		const fragment = document.createDocumentFragment()
		for (const review of reviews) {
			if (!review || !Number.isFinite(Number(review.id))) continue

			const author = typeof review.authorName === 'string' && review.authorName.trim()
				? review.authorName.trim()
				: 'Cliente verificado'
			const initial = author.charAt(0) || 'C'
			const product = review.product && typeof review.product === 'object'
				? review.product
				: null
			const image = Array.isArray(review.images) && review.images[0]?.url
				? review.images[0]
				: product?.coverImage ?? null
			const card = document.createElement('home-testimonial-card')

			card.setAttribute('rating', String(Number(review.rating) || 5))
			card.setAttribute('title', product?.title || 'Reseña destacada')
			card.setAttribute(
				'quote',
				typeof review.content === 'string' && review.content.trim()
					? review.content.trim()
					: 'Nuestros clientes siguen compartiendo sus experiencias con estas fragancias.'
			)
			card.setAttribute('author', author)
			card.setAttribute('initial', initial)
			card.setAttribute('verified', String(review.isVerifiedPurchase !== false))
			card.setAttribute('image-src', image?.url || '/public/no-image.svg')
			card.setAttribute('image-alt', image?.alt || product?.title || 'Producto reseñado')

			fragment.appendChild(card)
		}

		if (fragment.childNodes.length === 0) {
			renderTestimonialsStatus('Todavía no hay reseñas para mostrar.')
			return
		}

		grid.innerHTML = ''
		grid.appendChild(fragment)
		refreshIcons()
	} catch (error) {
		console.error('[Home] Error loading testimonials:', error)
		renderTestimonialsStatus('No pudimos cargar las reseñas. Intentá de nuevo.')
	} finally {
		grid.removeAttribute('aria-busy')
	}
}

const init = () => {
	void loadFeaturedProducts()
	void loadTestimonials()
	refreshIcons()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init)
} else {
	init()
}

export {}
