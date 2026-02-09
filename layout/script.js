// @ts-nocheck

import '/ui/app-button/app-button.js'
import '/ui/storefront-search/storefront-search.js'
import '/ui/store-breadcrumbs/store-breadcrumbs.js'
import { tiendu } from '/shared/tiendu-client.js'
import { PAGE_READY_EVENT, isPageReady } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const CART_BUTTON_LOADING_TIMEOUT_MS = 4000
const PAGE_NAVIGATION_DELAY_MS = 120
const PAGE_OVERLAY_MAX_WAIT_MS = 3000

const overlay = document.getElementById('boot-page-overlay')

const showOverlay = () => {
	if (window.__tienduPageOverlay && typeof window.__tienduPageOverlay.show === 'function') {
		window.__tienduPageOverlay.show({ animate: true })
		return
	}
	if (overlay) {
		overlay.dataset.open = 'true'
		overlay.dataset.state = 'open'
		overlay.dataset.animateIn = 'false'
	}
}

const hideOverlayImmediately = () => {
	if (overlay) {
		overlay.dataset.open = 'false'
		overlay.dataset.state = 'closed'
		overlay.dataset.animateIn = 'false'
	}
}

const hideOverlay = () => {
	if (window.__tienduPageOverlay && typeof window.__tienduPageOverlay.hide === 'function') {
		window.__tienduPageOverlay.hide()
		return
	}
	if (overlay) {
		overlay.dataset.open = 'false'
		overlay.dataset.state = 'closed'
		overlay.dataset.animateIn = 'false'
	}
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

const renderFooterLinks = (targetId, items, emptyText, buildLabel, buildHref) => {
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

		renderFooterLinks(
			'footer-category-list',
			categories,
			'Sin categorias disponibles',
			category => category.name,
			category => `/categorias/${category.id}/${urlSafe(category.name)}`
		)
		renderFooterLinks(
			'footer-page-list',
			pages,
			'Sin paginas disponibles',
			page => page.title || 'Pagina',
			page => `/paginas/${page.id}/${urlSafe(page.title || 'pagina')}`
		)
	} catch {
		renderMenuLinks('category-list', [], 'No se pudieron cargar categorias', () => '', () => '#')
		renderMenuLinks('page-list', [], 'No se pudieron cargar paginas', () => '', () => '#')
		renderFooterLinks(
			'footer-category-list',
			[],
			'No se pudieron cargar categorias',
			() => '',
			() => '#'
		)
		renderFooterLinks(
			'footer-page-list',
			[],
			'No se pudieron cargar paginas',
			() => '',
			() => '#'
		)
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
	if (!(button instanceof HTMLElement)) return

	let loadingTimeout = null

	const setLoading = isLoading => {
		if (typeof button.startLoading === 'function' && typeof button.stopLoading === 'function') {
			if (isLoading) button.startLoading()
			else button.stopLoading()
		} else {
			if (isLoading) button.setAttribute('data-loading', 'true')
			else button.removeAttribute('data-loading')
		}
		refreshIcons()
	}

	const stopLoading = () => {
		if (loadingTimeout) {
			window.clearTimeout(loadingTimeout)
			loadingTimeout = null
		}
		setLoading(false)
	}

	const startLoading = () => {
		stopLoading()
		setLoading(true)
		loadingTimeout = window.setTimeout(() => {
			stopLoading()
		}, CART_BUTTON_LOADING_TIMEOUT_MS)
	}

	const syncQuantity = async () => {
		try {
			const { quantity } = await tiendu.cart.getQuantity()
			if (typeof button.setBadge === 'function') {
				button.setBadge(quantity)
			} else {
				const quantityNode = document.getElementById('cart-quantity')
				if (quantityNode) quantityNode.textContent = String(quantity)
			}
		} catch {
			if (typeof button.setBadge === 'function') {
				button.setBadge(0)
			} else {
				const quantityNode = document.getElementById('cart-quantity')
				if (quantityNode) quantityNode.textContent = '0'
			}
		}
	}

	button.addEventListener('app-click', () => {
		if (button.disabled) return
		startLoading()

		tiendu.cart.open(({ updatedCartItemsQuantity }) => {
			if (typeof button.setBadge === 'function') {
				button.setBadge(updatedCartItemsQuantity)
			} else {
				const quantityNode = document.getElementById('cart-quantity')
				if (quantityNode) quantityNode.textContent = String(updatedCartItemsQuantity)
			}
			stopLoading()
		})
			.catch(() => {
				stopLoading()
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
		}, PAGE_NAVIGATION_DELAY_MS)
	})

	if (isPageReady()) {
		hideOverlay()
	} else {
		window.addEventListener(
			PAGE_READY_EVENT,
			() => {
				hideOverlay()
			},
			{ once: true }
		)
	}

	window.setTimeout(() => {
		hideOverlay()
	}, PAGE_OVERLAY_MAX_WAIT_MS)

	window.addEventListener('pageshow', event => {
		if (event.persisted) {
			hideOverlayImmediately()
		}
	})

	document.addEventListener('submit', event => {
		const form = event.target
		if (!(form instanceof HTMLFormElement)) return
		if (event.defaultPrevented) return
		if (form.hasAttribute('data-skip-overlay')) return
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
