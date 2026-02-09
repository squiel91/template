// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { storefrontConfig } from '/shared/storefront-config.js'
import { getListingPriceData } from '/shared/product-pricing.js'
import { withPageLoading } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const renderHomeState = html => {
	const container = document.getElementById('home-category-sections')
	if (!container) {
		console.error('[Home] Category sections container not found')
		return
	}
	container.innerHTML = html
	refreshIcons()
}

const formatDate = value => {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	return new Intl.DateTimeFormat('es-UY', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(date)
}

const renderBlogPosts = posts => {
	const container = document.getElementById('home-blog-posts')
	if (!container) return

	if (!Array.isArray(posts) || posts.length === 0) {
		container.innerHTML = `<div class="empty-state"><i data-lucide="newspaper"></i><span class="empty-state__title">No hay articulos publicados aun.</span></div>`
		refreshIcons()
		return
	}

	const topPosts = [...posts]
		.sort((a, b) => {
			const dateA = new Date(a?.createdAt || 0).getTime()
			const dateB = new Date(b?.createdAt || 0).getTime()
			return dateB - dateA
		})
		.slice(0, 4)

	container.innerHTML = topPosts
		.map(post => {
			const title = escapeHtml(post?.title || 'Articulo')
			const excerpt = escapeHtml(post?.excerpt || 'Leelo completo en nuestro blog.')
			const href = escapeHtml(`/blog/${post.id}/${urlSafe(post?.title || 'articulo')}`)
			const coverImage = post?.coverImage?.url
			const dateLabel = escapeHtml(formatDate(post?.createdAt))

			return `
				<article class="blog-card">
					<a class="blog-card__media" href="${href}" aria-label="Leer ${title}">
						${
							coverImage
								? `<img src="${escapeHtml(coverImage)}" alt="${title}" loading="lazy" />`
								: '<div class="blog-card__media-fallback"><i data-lucide="file-text"></i></div>'
						}
					</a>
					<div class="blog-card__body">
						${dateLabel ? `<p class="blog-card__meta">${dateLabel}</p>` : ''}
						<h3><a href="${href}">${title}</a></h3>
						<p>${excerpt}</p>
					</div>
				</article>
			`
		})
		.join('')

	refreshIcons()
}

const setSubscribeMessage = (message, tone = 'neutral') => {
	const messageNode = document.getElementById('home-subscribe-message')
	if (!messageNode) return
	messageNode.textContent = message
	messageNode.setAttribute('data-tone', tone)
}

const initSubscribeForm = () => {
	const form = document.getElementById('home-subscribe-form')
	if (!(form instanceof HTMLFormElement)) return

	form.addEventListener('submit', async event => {
		event.preventDefault()
		const formData = new FormData(form)
		const email = String(formData.get('email') || '').trim()

		if (!email) {
			setSubscribeMessage('Ingresa un email valido.', 'error')
			return
		}

		const submitButton = form.querySelector('button[type="submit"]')
		if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true
		setSubscribeMessage('Enviando...', 'neutral')

		try {
			const response = await tiendu.subscribers.add(email)
			if (response?.success) {
				setSubscribeMessage('Listo. Revisa tu email para confirmar la suscripcion.', 'success')
				form.reset()
			} else if (response?.errorCode === 'EXISTING_SUBSCRIBER') {
				setSubscribeMessage('Ese email ya esta suscripto.', 'warning')
			} else if (response?.errorCode === 'INVALID_EMAIL') {
				setSubscribeMessage('El email no es valido.', 'error')
			} else {
				setSubscribeMessage('No pudimos procesar la suscripcion. Intenta nuevamente.', 'error')
			}
		} catch {
			setSubscribeMessage('No pudimos procesar la suscripcion. Intenta nuevamente.', 'error')
		} finally {
			if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false
		}
	})
}

const loadBlogPosts = async () => {
	try {
		const blogPosts = await tiendu.blogPosts.list()
		renderBlogPosts(blogPosts)
	} catch (error) {
		console.error('[Home] Error loading blog posts:', error)
		renderBlogPosts([])
	}
}

const renderProductsInContainer = (containerId, products) => {
	const container = document.getElementById(containerId)
	if (!container) {
		console.error('[Home] Cannot render products - container not found:', containerId)
		return
	}

	if (!Array.isArray(products) || products.length === 0) {
		container.innerHTML =
			`<div class="empty-state">
				<i data-lucide="package-search"></i>
				<span class="empty-state__title">No hay productos publicados aun</span>
			</div>`
		refreshIcons()
		return
	}

	if (!customElements.get('product-list')) {
		console.error('[Home] product-list custom element not defined')
		container.innerHTML =
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error: Componentes no cargados</span>
			</div>`
		refreshIcons()
		return
	}

	if (!customElements.get('product-item')) {
		console.error('[Home] product-item custom element not defined')
		container.innerHTML =
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error: Componentes no cargados</span>
			</div>`
		refreshIcons()
		return
	}

	container.innerHTML = ''
	const list = document.createElement('product-list')

	for (const product of products) {
		if (!product || !product.id) {
			console.warn('[Home] Skipping invalid product:', product)
			continue
		}

		const item = document.createElement('product-item')

		try {
			const priceData = getListingPriceData(product)
			const validVariants = (product.variants || []).filter(v => typeof v?.priceInCents === 'number')

			item.setAttribute('product-id', String(product.id))
			item.setAttribute('url', `/productos/${product.id}/${urlSafe(product.title || 'producto')}`)
			item.setAttribute('title', product.title || 'Producto')
			item.setAttribute('price', priceData.label || '')
			item.setAttribute('average-rating', String(Number(product.averageRating) || 0))
			item.setAttribute('reviews-quantity', String(Number(product.reviewsQuantity) || 0))

			if (priceData.compareLabel) {
				item.setAttribute('compare-price', priceData.compareLabel)
			}

			if (product.coverImage?.url) {
				item.setAttribute('image-url', product.coverImage.url)
				item.setAttribute('image-alt', product.coverImage.alt || product.title || '')
			}

			if (validVariants.length === 1) {
				item.setAttribute('has-single-variant', 'true')
				item.setAttribute('variant-id', String(validVariants[0].id))
			} else if (validVariants.length > 1) {
				item.setAttribute('has-multiple-variants', 'true')
			}

			list.appendChild(item)
		} catch (err) {
			console.error('[Home] Error creating product item:', err, product)
		}
	}

	container.appendChild(list)
	refreshIcons()
}

const renderCategorySections = sections => {
	if (!Array.isArray(sections) || sections.length === 0) {
		renderHomeState(
			`<div class="empty-state">
				<i data-lucide="layout-grid"></i>
				<span class="empty-state__title">No hay productos para las categorias configuradas.</span>
			</div>`
		)
		return
	}

	const html = sections
		.map(({ category }) => {
			const categoryName = escapeHtml(category.name || 'Categoria')
			const categoryHref = escapeHtml(
				`/categorias/${category.id}/${urlSafe(category.name || 'categoria')}`
			)
			const productsContainerId = `home-category-products-${category.id}`

			return `
				<section class="section" aria-labelledby="home-category-title-${category.id}">
					<div class="section__header">
						<h2 id="home-category-title-${category.id}" class="section__title section__title--large">${categoryName}</h2>
						<a class="section__action" href="${categoryHref}">Ver más <i data-lucide="arrow-right" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-left:2px;"></i></a>
					</div>
					<div id="${productsContainerId}" aria-live="polite"></div>
				</section>
			`
		})
		.join('')

	renderHomeState(html)

	for (const section of sections) {
		renderProductsInContainer(
			`home-category-products-${section.category.id}`,
			section.products
		)
	}
}

const init = async () => {
	initSubscribeForm()
	const blogPostsPromise = loadBlogPosts()

	const configuredIds = Array.isArray(storefrontConfig.homeCategoryIds)
		? storefrontConfig.homeCategoryIds
		: []

	if (configuredIds.length === 0) {
		renderHomeState(
			`<div class="empty-state">
				<i data-lucide="layout-grid"></i>
				<span class="empty-state__title">No hay categorias configuradas para la portada.</span>
			</div>`
		)
		await blogPostsPromise
		return
	}

	try {
		const categoriesResponse = await tiendu.categories.list()
		const categories = Array.isArray(categoriesResponse)
			? categoriesResponse
			: categoriesResponse?.data || []
		const categoryById = new Map(categories.map(category => [Number(category.id), category]))

		const sectionData = await Promise.all(
			configuredIds.map(async categoryId => {
				const category = categoryById.get(Number(categoryId))
				if (!category) return null

				const response = await tiendu.products.list({
					categoryId: Number(category.id),
					includeProductsFromSubcategories: true,
					page: 1,
					size: 8
				})

				return {
					category,
					products: Array.isArray(response?.data) ? response.data : []
				}
			})
		)

		const validSections = sectionData.filter(
			section => section && Array.isArray(section.products) && section.products.length > 0
		)

		renderCategorySections(validSections)
	} catch (error) {
		console.error('[Home] Error loading data:', error)
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderHomeState(
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error al cargar las categorias de portada: ${escapeHtml(message)}</span>
			</div>`
		)
	} finally {
		await blogPostsPromise
	}
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		void withPageLoading(init)
	})
} else {
	void withPageLoading(init)
}

export {}
