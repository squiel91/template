// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { renderContentBlocks } from '/shared/content-blocks.js'

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

const renderMessage = message => {
	const container = document.getElementById('blog-post-content')
	if (!container) return
	container.innerHTML = `
		<div class="empty-state">
			<i data-lucide="file-warning"></i>
			<span class="empty-state__title">${escapeHtml(message)}</span>
		</div>
	`
	refreshIcons()
}

const init = async () => {
	const params = /** @type {{ blogPostId?: string }} */ (
		/** @type {any} */ (window).PARAMS ?? {}
	)
	const blogPostId = Number(params.blogPostId)

	if (!Number.isFinite(blogPostId) || blogPostId < 1) {
		renderMessage('Articulo no valido.')
		return
	}

	try {
		const post = await tiendu.blogPosts.get(blogPostId)
		const title = post?.title || 'Articulo'

		const titleNode = document.getElementById('blog-post-title')
		if (titleNode) titleNode.textContent = title

		const breadcrumbNode = document.getElementById('blog-post-breadcrumbs')
		if (breadcrumbNode && typeof breadcrumbNode.setItems === 'function') {
			breadcrumbNode.setItems([
				{ label: 'Inicio', href: '/' },
				{ label: 'Blog', href: '/blog' }
			])
		}
		if (breadcrumbNode && typeof breadcrumbNode.setCurrentLabel === 'function') {
			breadcrumbNode.setCurrentLabel(title)
		}

		const excerptNode = document.getElementById('blog-post-excerpt')
		if (excerptNode) excerptNode.textContent = post?.excerpt || ''

		const metaNode = document.getElementById('blog-post-meta')
		if (metaNode) {
			const pieces = [
				formatDate(post?.createdAt),
				post?.manager?.name || ''
			].filter(Boolean)
			metaNode.textContent = pieces.join(' - ')
		}

		document.title = `${title} | Blog`

		const coverContainer = document.getElementById('blog-post-cover')
		if (coverContainer) {
			if (post?.coverImage?.url) {
				coverContainer.innerHTML = `<img src="${escapeHtml(post.coverImage.url)}" alt="${escapeHtml(title)}" loading="eager" />`
				coverContainer.style.display = ''
			} else {
				coverContainer.innerHTML = ''
				coverContainer.style.display = 'none'
			}
		}

		const contentContainer = document.getElementById('blog-post-content')
		if (!contentContainer) return
		renderContentBlocks(contentContainer, post?.content)
		refreshIcons()
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderMessage(`Error al cargar el articulo: ${message}`)
	}
}

void withPageLoading(init)

export {}
