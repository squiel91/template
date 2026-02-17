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
const FEATURED_CATEGORY_IDS = [612, 611]
const FEATURED_TAB_KEYS = ['new', 'top']

const getFeaturedCategoryByTab = key => {
	if (FEATURED_CATEGORY_IDS.length === 0) return null

	const tabIndex = FEATURED_TAB_KEYS.indexOf(key)
	if (tabIndex === -1) return FEATURED_CATEGORY_IDS[0]

	return FEATURED_CATEGORY_IDS[tabIndex] || FEATURED_CATEGORY_IDS[0]
}
const renderFeaturedStatus = (key, message) => {
	const track = document.querySelector(`[data-featured-group="${key}"]`)
	if (!(track instanceof HTMLElement)) return

	track.innerHTML = `<div class="model-featured__status">${escapeHtml(message)}</div>`
	track.removeAttribute('aria-busy')
}

const loadFeaturedGroup = async ({ key, criteria, order }) => {
	const track = document.querySelector(`[data-featured-group="${key}"]`)
	if (!(track instanceof HTMLElement)) return

	track.setAttribute('aria-busy', 'true')

	try {
		const featuredCategoryId = getFeaturedCategoryByTab(key)
		const response = await tiendu.products.list({
			...(featuredCategoryId ? { categoryId: featuredCategoryId } : {}),
			includeProductsFromSubcategories: true,
			criteria,
			order,
			page: 1,
			size: FEATURED_PAGE_SIZE
		})

		const products = Array.isArray(response?.data) ? response.data : []
		if (products.length === 0) {
			renderFeaturedStatus(key, 'No hay productos disponibles en este momento.')
			return
		}

		const fragment = document.createDocumentFragment()
		for (const product of products) {
			if (!product || !Number.isFinite(Number(product.id))) continue
			fragment.appendChild(createProductItemElement(product))
		}

		if (fragment.childNodes.length === 0) {
			renderFeaturedStatus(key, 'No hay productos disponibles en este momento.')
			return
		}

		track.innerHTML = ''
		track.appendChild(fragment)
		refreshIcons()
	} catch (error) {
		console.error('[Home] Error loading featured products:', error)
		renderFeaturedStatus(key, 'No pudimos cargar los productos. Intentá de nuevo.')
	} finally {
		track.removeAttribute('aria-busy')
	}
}

const initFeaturedProducts = async () => {
	await Promise.all([
		loadFeaturedGroup({ key: 'new', criteria: 'created', order: 'desc' }),
		loadFeaturedGroup({ key: 'top', criteria: 'sales', order: 'desc' })
	])
}

const initFeaturedTabs = () => {
	const tabButtons = Array.from(document.querySelectorAll('[data-featured-tab]'))
	const groups = Array.from(document.querySelectorAll('[data-featured-group]'))

	if (tabButtons.length === 0 || groups.length === 0) return

	const activate = (key, { focus = false } = {}) => {
		tabButtons.forEach(button => {
			const isActive = button.dataset.featuredTab === key
			button.classList.toggle('is-active', isActive)
			button.setAttribute('aria-selected', isActive ? 'true' : 'false')
			button.tabIndex = isActive ? 0 : -1
			if (focus && isActive) button.focus()
		})

		groups.forEach(group => {
			const isMatch = group.dataset.featuredGroup === key
			group.hidden = !isMatch
			group.setAttribute('aria-hidden', isMatch ? 'false' : 'true')
			group.tabIndex = isMatch ? 0 : -1
		})
	}

	tabButtons.forEach(button => {
		button.addEventListener('click', () => {
			activate(button.dataset.featuredTab || 'new')
		})

		button.addEventListener('keydown', event => {
			const currentIndex = tabButtons.indexOf(button)
			if (currentIndex === -1) return

			if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
				event.preventDefault()
				const direction = event.key === 'ArrowRight' ? 1 : -1
				const nextIndex = (currentIndex + direction + tabButtons.length) % tabButtons.length
				const nextButton = tabButtons[nextIndex]
				activate(nextButton.dataset.featuredTab || 'new', { focus: true })
				return
			}

			if (event.key === 'Home' || event.key === 'End') {
				event.preventDefault()
				const targetButton = event.key === 'Home' ? tabButtons[0] : tabButtons[tabButtons.length - 1]
				activate(targetButton.dataset.featuredTab || 'new', { focus: true })
			}
		})
	})

	const initialActive =
		tabButtons.find(button => button.classList.contains('is-active'))?.dataset.featuredTab ||
		tabButtons[0].dataset.featuredTab ||
		'new'
	activate(initialActive)
}

const init = () => {
	initFeaturedTabs()
	void initFeaturedProducts()
	refreshIcons()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init)
} else {
	init()
}

export {}
