// @ts-nocheck

import { tiendu } from '/shared/tiendu-client.js'
import { withPageLoading } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const getPreview = page => {
	const description = String(page?.description || '').trim()
	if (description) return description

	if (!Array.isArray(page?.content)) return ''
	for (const block of page.content) {
		if (block?.type === 'paragraph' && String(block.text || '').trim()) {
			return String(block.text).trim()
		}
	}

	return ''
}

const renderState = message => {
	const container = document.getElementById('pages-list')
	if (!(container instanceof HTMLElement)) return

	container.innerHTML = `
		<div class="empty-state">
			<i data-lucide="file-warning"></i>
			<span class="empty-state__title">${escapeHtml(message)}</span>
		</div>
	`
	refreshIcons()
}

const renderPages = pages => {
	const container = document.getElementById('pages-list')
	if (!(container instanceof HTMLElement)) return

	if (!Array.isArray(pages) || pages.length === 0) {
		renderState('No hay páginas publicadas por el momento.')
		return
	}

	container.innerHTML = `
		<div class="pages-directory">
			${pages
				.map(page => {
					const title = String(page?.title || '').trim() || 'Página'
					const href = `/paginas/${page.id}/${urlSafe(title || 'pagina')}`
					const preview = getPreview(page)
					return `
						<a class="page-directory-card" href="${escapeHtml(href)}">
							<h2>${escapeHtml(title)}</h2>
							${preview ? `<p>${escapeHtml(preview)}</p>` : ''}
							<span>Ver página <i data-lucide="arrow-right"></i></span>
						</a>
					`
				})
				.join('')}
		</div>
	`
	refreshIcons()
}

const init = async () => {
	document.title = 'Páginas | Euforia - Perfumes Árabes'

	const resultsSummary = document.getElementById('pages-results-summary')

	try {
		const response = await tiendu.pages.list()
		const pages = (Array.isArray(response) ? response : response?.data || [])
			.filter(page => Number.isFinite(Number(page?.id)) && String(page?.title || '').trim().length > 0)
			.sort((a, b) => String(a.title).localeCompare(String(b.title), 'es'))

		if (resultsSummary instanceof HTMLElement) {
			resultsSummary.textContent =
				pages.length === 1 ? '1 página publicada' : `${pages.length} páginas publicadas`
		}

		renderPages(pages)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error inesperado.'
		renderState(`No se pudieron cargar las páginas: ${message}`)
	}
}

void withPageLoading(init)

export {}
