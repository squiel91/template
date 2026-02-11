// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import {
	withOriginQuery,
	getCurrentRelativeUrlWithoutOrigin
} from '/shared/navigation-origin.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const FALLBACK_IMAGE_SRC = '/public/no-image.svg'

const formatDate = value => {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	return new Intl.DateTimeFormat('es-UY', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(date)
}

const renderState = html => {
	const container = document.getElementById('blog-list')
	if (!container) return
	container.innerHTML = html
	refreshIcons()
}

const init = async () => {
	try {
		const blogPosts = await tiendu.blogPosts.list()

		if (!Array.isArray(blogPosts) || blogPosts.length === 0) {
			renderState(
				`<div class="empty-state"><i data-lucide="newspaper"></i><span class="empty-state__title">Todavia no hay articulos en el blog.</span></div>`
			)
			return
		}

		const sortedPosts = [...blogPosts].sort((a, b) => {
			const dateA = new Date(a?.createdAt || 0).getTime()
			const dateB = new Date(b?.createdAt || 0).getTime()
			return dateB - dateA
		})

		const featuredPost = sortedPosts[0]
		const remainingPosts = sortedPosts.slice(1)
		const origin = {
			url: getCurrentRelativeUrlWithoutOrigin(),
			title: 'Blog'
		}

		const featuredHtml = (() => {
			if (!featuredPost) return ''
			const title = escapeHtml(featuredPost?.title || 'Articulo')
			const excerpt = escapeHtml(featuredPost?.excerpt || '')
			const href = escapeHtml(
				withOriginQuery(
					`/blog/${featuredPost.id}/${urlSafe(featuredPost?.title || 'articulo')}`,
					origin
				)
			)
			const coverImage = featuredPost?.coverImage?.url
			const featuredCoverImageSrc = escapeHtml(coverImage || FALLBACK_IMAGE_SRC)
			const managerName = escapeHtml(featuredPost?.manager?.name || 'Equipo de la tienda')
			const dateLabel = escapeHtml(formatDate(featuredPost?.createdAt))

			return `
				<article class="blog-list-item blog-list-item--featured">
					<a class="blog-list-item__media" href="${href}">
						<img src="${featuredCoverImageSrc}" alt="${title}" loading="lazy" />
					</a>
					<div class="blog-list-item__body">
						<span class="blog-list-item__tag">Ultimo articulo</span>
						<p class="blog-list-item__meta">${dateLabel}${dateLabel ? ' - ' : ''}${managerName}</p>
						<h2><a href="${href}">${title}</a></h2>
						${excerpt ? `<p>${excerpt}</p>` : ''}
						<a class="section__action" href="${href}">Leer articulo <i data-lucide="arrow-right" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-left:2px;"></i></a>
					</div>
				</article>
			`
		})()

		const listHtml = remainingPosts
			.map(post => {
				const title = escapeHtml(post?.title || 'Articulo')
				const excerpt = escapeHtml(post?.excerpt || '')
				const href = escapeHtml(
					withOriginQuery(`/blog/${post.id}/${urlSafe(post?.title || 'articulo')}`, origin)
				)
				const coverImage = post?.coverImage?.url
				const postCoverImageSrc = escapeHtml(coverImage || FALLBACK_IMAGE_SRC)
				const managerName = escapeHtml(post?.manager?.name || 'Equipo de la tienda')
				const dateLabel = escapeHtml(formatDate(post?.createdAt))

				return `
					<article class="blog-list-item">
					<a class="blog-list-item__media" href="${href}">
						<img src="${postCoverImageSrc}" alt="${title}" loading="lazy" />
					</a>
						<div class="blog-list-item__body">
							<p class="blog-list-item__meta">${dateLabel}${dateLabel ? ' - ' : ''}${managerName}</p>
							<h2><a href="${href}">${title}</a></h2>
							${excerpt ? `<p>${excerpt}</p>` : ''}
							<a class="section__action" href="${href}">Leer articulo <i data-lucide="arrow-right" style="width:14px;height:14px;display:inline;vertical-align:middle;margin-left:2px;"></i></a>
						</div>
					</article>
				`
			})
			.join('')

		renderState(
			`${featuredHtml}${listHtml}`
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(
			`<div class="empty-state"><i data-lucide="alert-circle"></i><span class="empty-state__title">No pudimos cargar el blog: ${escapeHtml(message)}</span></div>`
		)
	}
}

void withPageLoading(init)

export {}
