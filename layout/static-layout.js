// @ts-nocheck

import '/ui/app-button/app-button.js'
import '/ui/storefront-search/storefront-search.js'
import '/ui/toast-stack/toast-stack.js'
import { tiendu } from '/shared/tiendu-client.js'
import { refreshIcons } from '/shared/icons.js'
import { urlSafe } from '/shared/url-safe.js'

const CART_BUTTON_LOADING_TIMEOUT_MS = 4000
const PAGE_NAVIGATION_DELAY_MS = 110
const MENU_CATEGORY_LIMIT = 6
const FOOTER_INFO_PAGE_LIMIT = 6
const NEWSLETTER_SUCCESS_MESSAGE =
	'¡Enviado el email de confirmación! Suscribite al confirmar tu correo.'
const NEWSLETTER_INVALID_EMAIL_MESSAGE = 'Ingresá un email válido para suscribirte.'
const NEWSLETTER_ERROR_MESSAGE = 'No pudimos suscribirte. Intentá nuevamente.'

const overlay = document.getElementById('boot-page-overlay')

const ensureToastStack = () => {
	let toastStack = document.getElementById('global-toast-stack')
	if (toastStack instanceof HTMLElement) return toastStack

	toastStack = document.createElement('tiendu-toast-stack')
	toastStack.id = 'global-toast-stack'
	document.body.appendChild(toastStack)
	return toastStack
}

const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const showOverlay = () => {
	if (window.__tienduPageOverlay && typeof window.__tienduPageOverlay.show === 'function') {
		window.__tienduPageOverlay.show({ animate: true })
		return
	}
	if (!overlay) return
	overlay.dataset.open = 'true'
	overlay.dataset.state = 'open'
	overlay.dataset.animateIn = 'false'
}

const hideOverlay = () => {
	if (window.__tienduPageOverlay && typeof window.__tienduPageOverlay.hide === 'function') {
		window.__tienduPageOverlay.hide()
		return
	}
	if (!overlay) return
	overlay.dataset.open = 'false'
	overlay.dataset.state = 'closed'
	overlay.dataset.animateIn = 'false'
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

const initFooter = () => {
	const yearNode = document.getElementById('footer-year')
	if (!yearNode) return
	yearNode.textContent = String(new Date().getFullYear())
}

const initNewsletterSubscription = () => {
	const form = document.querySelector('.footer-subscribe-form')
	if (!(form instanceof HTMLFormElement)) return

	const emailInput = form.querySelector('input[type="email"]')
	const submitButton = form.querySelector('button[type="submit"]')
	if (
		!(emailInput instanceof HTMLInputElement) ||
		!(submitButton instanceof HTMLButtonElement)
	) {
		return
	}

	const toastStack = ensureToastStack()
	let hasSubscribed = false

	const setSubmitting = isSubmitting => {
		emailInput.disabled = isSubmitting || hasSubscribed
		submitButton.disabled = isSubmitting || hasSubscribed
		submitButton.setAttribute('aria-busy', isSubmitting ? 'true' : 'false')
		submitButton.toggleAttribute('data-loading', isSubmitting)
	}

	form.addEventListener('submit', async event => {
		event.preventDefault()

		const email = emailInput.value.trim()
		if (!isValidEmail(email)) {
			if (toastStack && typeof toastStack.showError === 'function') {
				toastStack.showError(NEWSLETTER_INVALID_EMAIL_MESSAGE, 5000)
			}
			return
		}

		setSubmitting(true)
		try {
			await tiendu.subscribers.add(email)
			hasSubscribed = true
			if (toastStack && typeof toastStack.showSuccess === 'function') {
				toastStack.showSuccess(NEWSLETTER_SUCCESS_MESSAGE, 5000)
			}
		} catch {
			if (toastStack && typeof toastStack.showError === 'function') {
				toastStack.showError(NEWSLETTER_ERROR_MESSAGE, 5000)
			}
		} finally {
			setSubmitting(false)
		}
	})
}

const getCategoryHref = category =>
	`/colecciones/${category.id}/${urlSafe(category.name || 'coleccion')}`

const normalizeCategories = categories => {
	const source = Array.isArray(categories) ? categories : categories?.data
	if (!Array.isArray(source)) return []

	return source
		.filter(category => Number.isFinite(Number(category?.id)) && String(category?.name || '').trim().length > 0)
		.slice()
		.sort((a, b) => Number(b.productCount || 0) - Number(a.productCount || 0))
		.slice(0, MENU_CATEGORY_LIMIT)
}

const normalizePages = pages => {
	const source = Array.isArray(pages) ? pages : pages?.data
	if (!Array.isArray(source)) return []

	return source
		.filter(page => Number.isFinite(Number(page?.id)) && String(page?.title || '').trim().length > 0)
		.slice(0, FOOTER_INFO_PAGE_LIMIT)
}

const getPageHref = page =>
	`/paginas/${page.id}/${urlSafe(page.title || 'pagina')}`

const renderHeaderCategoryLinks = categories => {
	const container = document.getElementById('header-category-links')
	if (!(container instanceof HTMLElement)) return

	container.innerHTML = ''
	for (const category of categories) {
		const link = document.createElement('a')
		link.href = getCategoryHref(category)
		link.textContent = String(category.name || '').trim()
		container.appendChild(link)
	}
}

const renderSideMenuCategoryLinks = categories => {
	const container = document.getElementById('side-menu-category-links')
	if (!(container instanceof HTMLElement)) return

	container.innerHTML = ''
	for (const category of categories) {
		const link = document.createElement('a')
		link.href = getCategoryHref(category)
		link.textContent = String(category.name || '').trim()
		container.appendChild(link)
	}
}

const renderFooterFragranceLinks = categories => {
	const list = document.getElementById('footer-fragrance-links')
	if (!(list instanceof HTMLElement)) return

	list.innerHTML = ''
	for (const category of categories) {
		const item = document.createElement('li')
		const link = document.createElement('a')
		link.href = getCategoryHref(category)
		link.textContent = String(category.name || '').trim()
		item.appendChild(link)
		list.appendChild(item)
	}

	if (categories.length === 0) {
		list.innerHTML = '<li><a href="/colecciones">Ver colecciones</a></li>'
	}
}

const renderFooterInfoLinks = pages => {
	const list = document.getElementById('footer-info-links')
	if (!(list instanceof HTMLElement)) return

	list.innerHTML = ''
	for (const page of pages) {
		const item = document.createElement('li')
		const link = document.createElement('a')
		link.href = getPageHref(page)
		link.textContent = String(page.title || '').trim()
		item.appendChild(link)
		list.appendChild(item)
	}

	if (pages.length === 0) {
		list.innerHTML = '<li><a href="/paginas">Ver páginas</a></li>'
	}
}

const initCategoryNavigation = async () => {
	try {
		const [categoriesResponse, pagesResponse] = await Promise.all([
			tiendu.categories.list(),
			tiendu.pages.list()
		])
		const categories = normalizeCategories(categoriesResponse)
		const pages = normalizePages(pagesResponse)
		renderHeaderCategoryLinks(categories)
		renderSideMenuCategoryLinks(categories)
		renderFooterFragranceLinks(categories)
		renderFooterInfoLinks(pages)
	} catch {
		renderHeaderCategoryLinks([])
		renderSideMenuCategoryLinks([])
		renderFooterFragranceLinks([])
		renderFooterInfoLinks([])
	}
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

		tiendu.cart
			.open(({ updatedCartItemsQuantity }) => {
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
		if (event.defaultPrevented) return
		if ('button' in event && event.button !== 0) return
		const target = event.target instanceof Element ? event.target.closest('a') : null
		if (!(target instanceof HTMLAnchorElement)) return
		if (target.target === '_blank' || target.hasAttribute('download')) return
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

		const href = target.getAttribute('href')
		if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
			return
		}

		const nextUrl = new URL(target.href, window.location.origin)
		if (nextUrl.origin !== window.location.origin) return

		event.preventDefault()
		showOverlay()
		window.setTimeout(() => {
			window.location.href = target.href
		}, PAGE_NAVIGATION_DELAY_MS)
	})
}

const init = () => {
	initSideMenu()
	initFooter()
	initNewsletterSubscription()
	void initCategoryNavigation()
	initCartButton()
	initPageTransitionOverlay()
	refreshIcons()
	hideOverlay()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init)
} else {
	init()
}

window.addEventListener('load', () => {
	hideOverlay()
})

export {}
