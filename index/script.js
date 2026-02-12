// @ts-nocheck

import '/ui/product-item/product-item.js'
import '/ui/product-list/product-list.js'
import '/ui/category-item/category-item.js'
import '/ui/category-list/category-list.js'
import { tiendu } from '/shared/tiendu-client.js'
import { storefrontConfig } from '/shared/storefront-config.js'
import { withPageLoading } from '/shared/page-loading.js'
import { createProductItemElement } from '/shared/product-item-element.js'
import { createCategoryItemElement } from '/shared/category-item-element.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const FALLBACK_IMAGE_SRC = '/public/no-image.svg'

const renderHomeState = html => {
	const container = document.getElementById('home-category-sections')
	if (!container) {
		console.error('[Home] Category sections container not found')
		return
	}
	container.innerHTML = html
	refreshIcons()
}

const renderHomeCategories = categories => {
	const container = document.getElementById('home-categories-list')
	if (!container) return

	if (!Array.isArray(categories) || categories.length === 0) {
		container.innerHTML = ''
		return
	}

	container.innerHTML = ''
	const list = document.createElement('category-list')

	for (const category of categories) {
		if (!category || !category.id) continue
		const item = createCategoryItemElement(category, {
			origin: { url: '/', title: 'Inicio' }
		})
		list.appendChild(item)
	}

	if (list.childElementCount === 0) {
		container.innerHTML = ''
		return
	}

	container.appendChild(list)
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
		container.innerHTML = `<div class="empty-state"><i data-lucide="newspaper"></i><span class="empty-state__title">No hay artículos publicados aún.</span></div>`
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
			const title = escapeHtml(post?.title || 'Artículo')
			const excerpt = escapeHtml(post?.excerpt || 'Léelo completo en nuestro blog.')
			const href = escapeHtml(`/blog/${post.id}/${urlSafe(post?.title || 'articulo')}`)
			const coverImage = post?.coverImage?.url
			const coverImageSrc = escapeHtml(coverImage || FALLBACK_IMAGE_SRC)
			const dateLabel = escapeHtml(formatDate(post?.createdAt))

			return `
				<article class="blog-card">
					<a class="blog-card__media" href="${href}" aria-label="Leer ${title}">
						<img src="${coverImageSrc}" alt="${title}" loading="lazy" />
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
				<span class="empty-state__title">No hay productos publicados aún</span>
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

		try {
			const item = createProductItemElement(product)
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
				<span class="empty-state__title">No hay productos para las categorías configuradas.</span>
			</div>`
		)
		return
	}

	const html = sections
		.map(({ category }) => {
			const categoryName = escapeHtml(category.name || 'Categoría')
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
	const blogPostsPromise = loadBlogPosts()

	const configuredIds = Array.isArray(storefrontConfig.homeCategoryIds)
		? storefrontConfig.homeCategoryIds
		: []
	const configuredListIds = Array.isArray(storefrontConfig.homeListCategoryIds)
		? storefrontConfig.homeListCategoryIds
		: []

	if (configuredIds.length === 0 && configuredListIds.length === 0) {
		renderHomeState(
			`<div class="empty-state">
				<i data-lucide="layout-grid"></i>
				<span class="empty-state__title">No hay categorías configuradas para la portada.</span>
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

		if (configuredListIds.length > 0) {
			const listCategories = configuredListIds
				.map(categoryId => categoryById.get(Number(categoryId)))
				.filter(Boolean)
			renderHomeCategories(listCategories)
		} else {
			renderHomeCategories([])
		}

		if (configuredIds.length === 0) {
			renderHomeState('')
		} else {
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
		}
	} catch (error) {
		console.error('[Home] Error loading data:', error)
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderHomeState(
			`<div class="empty-state">
				<i data-lucide="alert-circle"></i>
				<span class="empty-state__title">Error al cargar las categorías de portada: ${escapeHtml(message)}</span>
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
