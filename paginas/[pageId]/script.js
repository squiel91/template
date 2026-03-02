// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { renderContentBlocks } from '/shared/content-blocks.js'

const normalizeText = value => String(value || '').trim().toLowerCase()

const stripLeadingPageHeaderBlocks = (blocks, title) => {
	if (!Array.isArray(blocks)) return []
	const filteredBlocks = [...blocks]
	const normalizedTitle = normalizeText(title)
	let removedTitle = false
	let removedImage = false

	while (filteredBlocks.length > 0) {
		const firstBlock = filteredBlocks[0]
		const isTitleHeading =
			!removedTitle &&
			firstBlock?.type === 'heading' &&
			normalizeText(firstBlock.text) === normalizedTitle
		const isCoverImage = !removedImage && firstBlock?.type === 'image'

		if (isTitleHeading) {
			filteredBlocks.shift()
			removedTitle = true
			continue
		}

		if (isCoverImage) {
			filteredBlocks.shift()
			removedImage = true
			continue
		}

		break
	}

	return filteredBlocks
}

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
		renderContentBlocks(container, stripLeadingPageHeaderBlocks(page.content, title))
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderMessage(`Error al cargar la página: ${message}`)
	}
}

void withPageLoading(init)

export {}
