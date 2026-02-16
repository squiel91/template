// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { renderContentBlocks } from '/shared/content-blocks.js'

const renderMessage = message => {
	const container = document.getElementById('page')
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
	const params = /** @type {{ pageId?: string }} */ (
		/** @type {any} */ (window).PARAMS ?? {}
	)
	const pageId = Number(params.pageId)

	if (!Number.isFinite(pageId) || pageId < 1) {
		renderMessage('Página no válida.')
		return
	}

	try {
		const page = await tiendu.pages.get(pageId)
		const title = page.title || 'Página'

		const breadcrumbNode = document.getElementById('page-breadcrumbs')
		if (breadcrumbNode && typeof breadcrumbNode.setCurrentLabel === 'function') {
			breadcrumbNode.setCurrentLabel(title)
		}

		document.title = `${title} | Tienda Genérica`

		const container = document.getElementById('page')
		if (!container) return
		renderContentBlocks(container, page.content)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderMessage(`Error al cargar la página: ${message}`)
	}
}

void withPageLoading(init)

export {}
