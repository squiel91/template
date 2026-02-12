// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { renderContentBlocks } from '/shared/content-blocks.js'

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

		document.title = `${title} | Blog`

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
