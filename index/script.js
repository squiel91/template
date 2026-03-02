// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import '/ui/category-item/category-item.js'
import '/ui/category-list/category-list.js'
import '/ui/app-button/app-button.js'
import '/ui/tiendu-image-carousel/tiendu-image-carousel.js'
import { tiendu } from '/shared/tiendu-client.js'
import { storefrontConfig } from '/shared/storefront-config.js'
import { withPageLoading } from '/shared/page-loading.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import { createCategoryItemElement } from '/shared/category-item-element.js'
import { refreshIcons } from '/shared/icons.js'

const FALLBACK_IMAGE_SRC = '/public/no-image.svg'

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

const renderFeaturedProducts = products => {
	const container = document.getElementById('home-featured-products')
	if (!(container instanceof HTMLElement)) return

	if (!Array.isArray(products) || products.length === 0) {
		container.innerHTML =
			'<div class="empty-state"><i data-lucide="package-search"></i><span class="empty-state__title">No hay productos destacados disponibles.</span></div>'
		refreshIcons()
		return
	}

	const list = document.createElement('product-list')
	for (const product of products.slice(0, 4)) {
		if (!product || !product.id) continue
		list.appendChild(createProductItemElement(product))
	}

	container.innerHTML = ''
	container.appendChild(list)
	refreshIcons()
}

const loadFeaturedProducts = async () => {
	try {
		const featuredResponse = await tiendu.products.list({
			isFeatured: true,
			page: 1,
			size: 8
		})
		const featured = Array.isArray(featuredResponse?.data) ? featuredResponse.data : []
		if (featured.length >= 4) return featured.slice(0, 4)

		const fallbackResponse = await tiendu.products.list({ page: 1, size: 8 })
		const fallback = Array.isArray(fallbackResponse?.data) ? fallbackResponse.data : []
		return (featured.length > 0 ? [...featured, ...fallback] : fallback).slice(0, 4)
	} catch (error) {
		console.error('[Home] Error loading featured products:', error)
		return []
	}
}

const renderHomeCategories = categories => {
	const container = document.getElementById('home-categories-list')
	if (!(container instanceof HTMLElement)) return

	if (!Array.isArray(categories) || categories.length === 0) {
		container.innerHTML =
			'<div class="empty-state"><i data-lucide="layout-grid"></i><span class="empty-state__title">No hay categorías disponibles por ahora.</span></div>'
		refreshIcons()
		return
	}

	const list = document.createElement('category-list')
	for (const category of categories.slice(0, 4)) {
		if (!category || !category.id) continue
		list.appendChild(
			createCategoryItemElement(category, {
				origin: { url: '/', title: 'Inicio' }
			})
		)
	}

	container.innerHTML = ''
	container.appendChild(list)
	refreshIcons()
}

const loadHomeCategories = async () => {
	try {
		const categoriesResponse = await tiendu.categories.list()
		const categories = Array.isArray(categoriesResponse)
			? categoriesResponse
			: categoriesResponse?.data || []

		const configuredListIds = Array.isArray(storefrontConfig.homeListCategoryIds)
			? storefrontConfig.homeListCategoryIds
			: []

		const byId = new Map(categories.map(category => [Number(category.id), category]))
		let selected = configuredListIds
			.map(categoryId => byId.get(Number(categoryId)))
			.filter(Boolean)

		if (selected.length === 0) {
			selected = categories.filter(category => Number(category?.productCount) > 0)
		}

		return selected.slice(0, 4)
	} catch (error) {
		console.error('[Home] Error loading categories:', error)
		return []
	}
}

const setSectionImage = (imageId, sectionId, imageUrl, alt) => {
	const image = document.getElementById(imageId)
	const section = document.getElementById(sectionId)
	if (!(image instanceof HTMLImageElement) || !(section instanceof HTMLElement)) return

	if (typeof imageUrl === 'string' && imageUrl.trim()) {
		image.src = imageUrl.trim()
		if (typeof alt === 'string' && alt.trim()) image.alt = alt.trim()
		section.classList.remove('is-empty')
		return
	}

	image.src = FALLBACK_IMAGE_SRC
	section.classList.add('is-empty')
}

const init = async () => {
	const [heroSlides, featuredProducts, categories] = await Promise.all([
		loadHeroSlides(),
		loadFeaturedProducts(),
		loadHomeCategories()
	])

	renderHeroCarousel(heroSlides)
	renderFeaturedProducts(featuredProducts)
	renderHomeCategories(categories)

	const campaignSlide = heroSlides[1] || heroSlides[0] || null
	const impactSlide = heroSlides[2] || heroSlides[0] || null
	const firstCategoryImage = categories[0]?.coverImage?.url || ''
	const secondCategoryImage = categories[1]?.coverImage?.url || ''

	setSectionImage(
		'home-campaign-image',
		'home-campaign',
		campaignSlide?.desktopImage || campaignSlide?.mobileImage || firstCategoryImage,
		campaignSlide?.imageAlt || 'Campaña del Santuario Animal Libre'
	)

	setSectionImage(
		'home-impact-image',
		'home-impact',
		impactSlide?.desktopImage || impactSlide?.mobileImage || secondCategoryImage,
		impactSlide?.imageAlt || 'Animal rescatado del santuario'
	)

	refreshIcons()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		void withPageLoading(init)
	})
} else {
	void withPageLoading(init)
}

export {}
