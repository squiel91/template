// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'

const renderMessage = message => {
	const container = document.getElementById('page')
	if (!container) return
	container.innerHTML = `<div class="empty-state"><i data-lucide="file-warning"></i><span>${escapeHtml(message)}</span></div>`
	refreshIcons()
}

const renderBlock = block => {
	if (!block || typeof block !== 'object') return null

	if (block.type === 'heading') {
		const level = Math.min(Math.max(Number(block.level) || 2, 1), 3)
		const heading = document.createElement(`h${level}`)
		heading.textContent = block.text || ''
		return heading
	}

	if (block.type === 'paragraph') {
		const paragraph = document.createElement('p')
		paragraph.textContent = block.text || ''
		return paragraph
	}

	if (block.type === 'image' && block.image?.url) {
		const figure = document.createElement('figure')
		if (block.align) figure.classList.add(`align-${block.align}`)
		if (block.size) figure.classList.add(`size-${block.size}`)
		const image = document.createElement('img')
		image.src = block.image.url
		image.alt = block.image.alt || ''
		image.loading = 'lazy'
		figure.appendChild(image)
		return figure
	}

	if (block.type === 'html' && block.code) {
		const wrapper = document.createElement('div')
		wrapper.innerHTML = block.code
		return wrapper
	}

	return null
}

const init = async () => {
	const params = /** @type {{ pageId?: string }} */ (
		/** @type {any} */ (window).PARAMS ?? {}
	)
	const pageId = Number(params.pageId)

	if (!Number.isFinite(pageId) || pageId < 1) {
		renderMessage('Pagina no valida.')
		return
	}

	try {
		const page = await tiendu.pages.get(pageId)
		const title = page.title || 'Pagina'

		const titleNode = document.getElementById('page-title')
		if (titleNode) titleNode.textContent = title

		document.title = `${title} | Tienda Genérica`

		const container = document.getElementById('page')
		if (!container) return
		container.innerHTML = ''

		if (Array.isArray(page.content)) {
			for (const block of page.content) {
				const node = renderBlock(block)
				if (node) container.appendChild(node)
			}
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderMessage(`Error al cargar la pagina: ${message}`)
	}
}

init()

export {}
