// @ts-nocheck

import '/ui/category-item/category-item.js'
import '/ui/category-list/category-list.js'
import '/ui/app-button/app-button.js'
import '/ui/tiendu-image-carousel/tiendu-image-carousel.js'
import '/ui/home-category-products-section/home-category-products-section.js'
import '/ui/home-banner/home-banner.js'
import { tiendu } from '/shared/tiendu-client.js'
import { storefrontConfig } from '/shared/storefront-config.js'
import { withPageLoading } from '/shared/page-loading.js'
import { createCategoryItemElement } from '/shared/category-item-element.js'
import { refreshIcons } from '/shared/icons.js'

const HOME_PINNED_FIRST_CATEGORY_ID = 255
const HOME_PINNED_LAST_CATEGORY_IDS = [252, 253, 254, 250]
const HOME_CATEGORY_PRODUCT_SECTION_IDS = [
	HOME_PINNED_FIRST_CATEGORY_ID,
	...HOME_PINNED_LAST_CATEGORY_IDS
]

const normalizeImageUrl = input => {
	if (!input) return ''
	if (typeof input === 'string') return input.trim()
	if (typeof input === 'object' && typeof input.url === 'string') return input.url.trim()
	return ''
}

const normalizeHeroSlides = input => {
	if (!Array.isArray(input)) return []

	const slides = input
		.map((raw, index) => {
			if (!raw || typeof raw !== 'object') return null

			const title = typeof raw.title === 'string' ? raw.title.trim() : ''
			const description = typeof raw.description === 'string' ? raw.description.trim() : ''
			const mobileImage = normalizeImageUrl(raw.mobileImage)
			const desktopImage = normalizeImageUrl(raw.desktopImage)
			const imageAlt =
				typeof raw.imageAlt === 'string' && raw.imageAlt.trim()
					? raw.imageAlt.trim()
					: title || `Slide ${index + 1}`

			const ctaText = typeof raw.ctaText === 'string' ? raw.ctaText.trim() : ''
			const path = typeof raw.ctaPath === 'string' ? raw.ctaPath.trim() : ''
			const url = typeof raw.ctaUrl === 'string' ? raw.ctaUrl.trim() : ''

			let href = ''
			if (/^https?:\/\//i.test(url)) {
				href = url
			} else if (path.startsWith('/')) {
				href = path
			} else if (/^https?:\/\//i.test(path)) {
				href = path
			}

			const hasVisual = Boolean(title || description || mobileImage || desktopImage)
			if (!hasVisual) return null

			const isExternal = /^https?:\/\//i.test(href)
			return {
				title,
				description,
				mobileImage,
				desktopImage,
				imageAlt,
				ctaText,
				href,
				newTab: Boolean(raw.ctaNewTab) || isExternal
			}
		})
		.filter(Boolean)

	return slides
}

const resolveMetadataPayload = payload => {
	if (Array.isArray(payload)) return payload
	if (!payload || typeof payload !== 'object') return []
	if (Array.isArray(payload.value)) return payload.value
	if (Array.isArray(payload.data)) return payload.data
	if (payload.data && Array.isArray(payload.data.value)) return payload.data.value
	if (Array.isArray(payload.items)) return payload.items
	if (Array.isArray(payload.slides)) return payload.slides
	return []
}

const loadHeroSlides = async () => {
	const metadataKey = storefrontConfig.homeHeroMetadataKey || 'home-hero-carousel'

	try {
		const metadataValue = await tiendu.metadata.get(metadataKey)
		const slides = normalizeHeroSlides(resolveMetadataPayload(metadataValue))
		if (slides.length > 0) return slides
	} catch (error) {
		console.warn('[Home] Could not load hero metadata:', error)
	}

	return []
}

const renderHeroCarousel = slides => {
	const section = document.getElementById('home-hero')
	const carousel = document.getElementById('home-hero-carousel')
	if (!(section instanceof HTMLElement)) return
	if (!(carousel instanceof HTMLElement) || typeof carousel.setSlides !== 'function') return

	if (!Array.isArray(slides) || slides.length === 0) {
		section.hidden = true
		carousel.setSlides([])
		return
	}

	section.hidden = false
	carousel.setSlides(slides)
}

const HOME_MARQUEE_PIXELS_PER_SECOND = 42
const HOME_MARQUEE_MIN_DURATION = 30

const setupHomeMarquee = () => {
	const marquee = document.querySelector('.home-marquee')
	if (!(marquee instanceof HTMLElement)) return

	const viewport = marquee.querySelector('.home-marquee__viewport')
	const track = marquee.querySelector('.home-marquee__track')
	const sourceList = marquee.querySelector('[data-home-marquee-source]')

	if (!(viewport instanceof HTMLElement)) return
	if (!(track instanceof HTMLElement)) return
	if (!(sourceList instanceof HTMLElement)) return

	const sync = () => {
		for (const clone of track.querySelectorAll('.home-marquee__list[aria-hidden="true"]')) {
			clone.remove()
		}

		sourceList.removeAttribute('aria-hidden')

		const sourceWidth = Math.ceil(sourceList.getBoundingClientRect().width)
		const viewportWidth = Math.ceil(viewport.getBoundingClientRect().width)
		if (!sourceWidth || !viewportWidth) return

		const totalCopies = Math.max(2, Math.ceil(viewportWidth / sourceWidth) + 2)
		for (let index = 1; index < totalCopies; index += 1) {
			const clone = sourceList.cloneNode(true)
			clone.removeAttribute('data-home-marquee-source')
			clone.setAttribute('aria-hidden', 'true')
			track.appendChild(clone)
		}

		const duration = Math.max(
			HOME_MARQUEE_MIN_DURATION,
			Number((sourceWidth / HOME_MARQUEE_PIXELS_PER_SECOND).toFixed(2))
		)

		track.style.setProperty('--home-marquee-loop-distance', `${sourceWidth}px`)
		track.style.setProperty('--home-marquee-duration', `${duration}s`)
	}

	const scheduleSync = () => {
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(sync)
		})
	}

	scheduleSync()

	if (marquee._resizeObserver && typeof marquee._resizeObserver.disconnect === 'function') {
		marquee._resizeObserver.disconnect()
	}

	if (typeof ResizeObserver === 'function') {
		const resizeObserver = new ResizeObserver(() => {
			scheduleSync()
		})
		resizeObserver.observe(viewport)
		resizeObserver.observe(sourceList)
		marquee._resizeObserver = resizeObserver
	}

	if (document.fonts?.ready) {
		void document.fonts.ready.then(() => {
			scheduleSync()
		})
	}
}

const createCategoryProductSectionElement = sectionData => {
	if (!sectionData?.category?.id) return null
	const el = document.createElement('home-category-products-section')
	if (typeof el.setData === 'function') el.setData(sectionData)
	return el
}

const createCategoriesListingElement = categories => {
	const section = document.createElement('section')
	section.className = 'section'
	section.setAttribute('aria-labelledby', 'home-categories-title')

	const header = document.createElement('div')
	header.className = 'section__header'

	const title = document.createElement('h2')
	title.id = 'home-categories-title'
	title.className = 'section__title section__title--large'
	title.textContent = 'Categorías'

	header.appendChild(title)
	section.appendChild(header)

	const container = document.createElement('div')
	container.className = 'home-categories-list'

	if (!Array.isArray(categories) || categories.length === 0) {
		container.innerHTML =
			'<div class="empty-state"><i data-lucide="layout-grid"></i><span class="empty-state__title">No hay categorías disponibles por ahora.</span></div>'
	} else {
		const list = document.createElement('category-list')
		for (const category of categories) {
			if (!category || !category.id) continue
			list.appendChild(
				createCategoryItemElement(category, {
					origin: { url: '/', title: 'Inicio' }
				})
			)
		}
		container.appendChild(list)
	}

	section.appendChild(container)
	return section
}

const createBannerElement = bannerData => {
	const el = document.createElement('home-banner')
	if (typeof el.setData === 'function') el.setData(bannerData)
	return el
}

const loadHomeCategories = async () => {
	try {
		const categoriesResponse = await tiendu.categories.list()
		const categories = Array.isArray(categoriesResponse)
			? categoriesResponse
			: categoriesResponse?.data || []

		return categories.filter(category => category && category.id)
	} catch (error) {
		console.error('[Home] Error loading categories:', error)
		return []
	}
}

const loadHomeCategoryProductSections = async categories => {
	const categoryMap = new Map(
		(Array.isArray(categories) ? categories : []).map(category => [Number(category.id), category])
	)

	const sections = await Promise.all(
		HOME_CATEGORY_PRODUCT_SECTION_IDS.map(async categoryId => {
			let category = categoryMap.get(categoryId)
			if (!category) {
				try {
					category = await tiendu.categories.get(categoryId)
				} catch {
					return null
				}
			}

			try {
				const response = await tiendu.products.list({
					categoryId,
					page: 1,
					size: 8
				})
				const products = Array.isArray(response?.data) ? response.data : []
				return { category, products }
			} catch (error) {
				console.error(`[Home] Error loading category products (${categoryId}):`, error)
				return { category, products: [] }
			}
		})
	)

	return sections.filter(Boolean)
}

const loadHomeBanners = async () => {
	try {
		const metadataValue = await tiendu.metadata.get('home-page-banners')
		const items = resolveMetadataPayload(metadataValue)
		if (!Array.isArray(items)) return []
		return items.filter(item => item && typeof item === 'object' && item.title)
	} catch (error) {
		console.warn('[Home] Could not load banner metadata:', error)
		return []
	}
}

const renderHomeSections = ({ categoryProductSections, categories, banners }) => {
	const container = document.getElementById('home-sections')
	if (!(container instanceof HTMLElement)) return

	container.innerHTML = ''

	const catSections = Array.isArray(categoryProductSections) ? categoryProductSections : []
	const bannerItems = Array.isArray(banners) ? banners : []

	let catIndex = 0
	let bannerIndex = 0

	// 1. First category products section
	if (catIndex < catSections.length) {
		const el = createCategoryProductSectionElement(catSections[catIndex++])
		if (el) container.appendChild(el)
	}

	// 2. Categorías listing
	container.appendChild(createCategoriesListingElement(categories))

	// 3. Interleave: banner, category products, banner, category products...
	while (catIndex < catSections.length || bannerIndex < bannerItems.length) {
		if (bannerIndex < bannerItems.length) {
			const el = createBannerElement(bannerItems[bannerIndex++])
			if (el) container.appendChild(el)
		}

		if (catIndex < catSections.length) {
			const el = createCategoryProductSectionElement(catSections[catIndex++])
			if (el) container.appendChild(el)
		}
	}

	refreshIcons()
}

const init = async () => {
	const [heroSlides, categories, banners] = await Promise.all([
		loadHeroSlides(),
		loadHomeCategories(),
		loadHomeBanners()
	])
	const categoryProductSections = await loadHomeCategoryProductSections(categories)

	renderHeroCarousel(heroSlides)
	renderHomeSections({ categoryProductSections, categories, banners })
	setupHomeMarquee()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		void withPageLoading(init)
	})
} else {
	void withPageLoading(init)
}

export {}
