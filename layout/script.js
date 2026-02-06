// @ts-nocheck

import '/ui/page-loading-overlay/page-loading-overlay.js'
import '/ui/storefront-search/storefront-search.js'
import { tiendu } from '/shared/tiendu-client.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const overlay = document.getElementById('page-transition-overlay')

const showOverlay = () => {
	if (overlay && typeof overlay.show === 'function') overlay.show()
}

const hideOverlay = () => {
	if (overlay && typeof overlay.hide === 'function') overlay.hide()
}

const renderMenuLinks = (targetId, items, emptyText, buildLabel, buildHref) => {
	const list = document.getElementById(targetId)
	if (!list) return

	if (!Array.isArray(items) || items.length === 0) {
		list.innerHTML = `<li><span>${escapeHtml(emptyText)}</span></li>`
		return
	}

	list.innerHTML = items
		.map(
			item =>
				`<li><a href="${escapeHtml(buildHref(item))}">${escapeHtml(buildLabel(item))}</a></li>`
		)
		.join('')
}

const initMenuData = async () => {
	try {
		const [categories, pages] = await Promise.all([
			tiendu.categories.list(),
			tiendu.pages.list()
		])

		renderMenuLinks(
			'category-list',
			categories,
			'Sin categorias disponibles',
			category => category.name,
			category => `/categorias/${category.id}/${urlSafe(category.name)}`
		)
		renderMenuLinks(
			'page-list',
			pages,
			'Sin paginas disponibles',
			page => page.title || 'Pagina',
			page => `/paginas/${page.id}/${urlSafe(page.title || 'pagina')}`
		)
	} catch {
		renderMenuLinks('category-list', [], 'No se pudieron cargar categorias', () => '', () => '#')
		renderMenuLinks('page-list', [], 'No se pudieron cargar paginas', () => '', () => '#')
	}

	refreshIcons()
}

const initFooter = () => {
	const yearNode = document.getElementById('footer-year')
	if (yearNode) yearNode.textContent = String(new Date().getFullYear())
}

const initSideMenu = () => {
	const sideMenu = document.getElementById('side-menu')
	const menuToggle = document.getElementById('menu-toggle')
	const menuClose = document.getElementById('menu-close')
	const menuBackdrop = document.getElementById('menu-backdrop')

	if (!sideMenu || !menuToggle || !menuClose || !menuBackdrop) return

	const openMenu = () => {
		sideMenu.setAttribute('data-open', 'true')
		sideMenu.setAttribute('aria-hidden', 'false')
		document.body.style.overflow = 'hidden'
	}

	const closeMenu = () => {
		sideMenu.removeAttribute('data-open')
		sideMenu.setAttribute('aria-hidden', 'true')
		document.body.style.overflow = ''
	}

	menuToggle.addEventListener('click', openMenu)
	menuClose.addEventListener('click', closeMenu)
	menuBackdrop.addEventListener('click', closeMenu)
	sideMenu.addEventListener('click', event => {
		const link = event.target instanceof Element ? event.target.closest('a') : null
		if (link) closeMenu()
	})
	window.addEventListener('keydown', event => {
		if (event.key === 'Escape') closeMenu()
	})
}

const initCartButton = async () => {
	const button = document.getElementById('open-cart-button')
	const quantityNode = document.getElementById('cart-quantity')
	if (!(button instanceof HTMLButtonElement)) return

	const syncQuantity = async () => {
		try {
			const { quantity } = await tiendu.cart.getQuantity()
			if (quantityNode) quantityNode.textContent = String(quantity)
		} catch {
			if (quantityNode) quantityNode.textContent = '0'
		}
	}

	button.addEventListener('click', () => {
		tiendu.cart.open(({ updatedCartItemsQuantity }) => {
			if (quantityNode) {
				quantityNode.textContent = String(updatedCartItemsQuantity)
			}
		})
	})

	await syncQuantity()
}

const initPageTransitionOverlay = () => {
	document.addEventListener('click', event => {
		const target = event.target instanceof Element ? event.target.closest('a') : null
		if (!(target instanceof HTMLAnchorElement)) return
		if (target.target === '_blank' || target.hasAttribute('download')) return
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
		const href = target.getAttribute('href')
		if (!href || href.startsWith('#') || href.startsWith('mailto:')) return

		const nextUrl = new URL(target.href, window.location.origin)
		if (nextUrl.origin !== window.location.origin) return

		event.preventDefault()
		showOverlay()
		window.setTimeout(() => {
			window.location.href = target.href
		}, 120)
	})

	window.addEventListener('pageshow', hideOverlay)
	window.addEventListener('load', hideOverlay)

	document.addEventListener('submit', event => {
		const form = event.target
		if (!(form instanceof HTMLFormElement)) return
		if ((form.method || 'get').toLowerCase() !== 'get') return
		showOverlay()
	})
}

initMenuData()
initSideMenu()
initFooter()
initCartButton()
initPageTransitionOverlay()
refreshIcons()

export {}
