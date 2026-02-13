// @ts-nocheck

import '/ui/app-button/app-button.js'
import '/ui/storefront-search/storefront-search.js'
import '/ui/store-breadcrumbs/store-breadcrumbs.js'
import '/ui/toast-stack/toast-stack.js'
import { tiendu } from '/shared/tiendu-client.js'
import { PAGE_READY_EVENT, isPageReady } from '/shared/page-loading.js'
import { refreshIcons } from '/shared/icons.js'
import { escapeHtml } from '/shared/sanitize.js'
import { urlSafe } from '/shared/url-safe.js'

const CART_BUTTON_LOADING_TIMEOUT_MS = 4000
const PAGE_NAVIGATION_DELAY_MS = 120
const PAGE_OVERLAY_MAX_WAIT_MS = 2000
const NEWSLETTER_SUCCESS_MESSAGE =
	'¡Enviado el email de confirmación! Suscribite al confirmar tu correo.'
const NEWSLETTER_INVALID_EMAIL_MESSAGE = 'Ingresá un email válido para suscribirte.'
const NEWSLETTER_ERROR_MESSAGE = 'No pudimos suscribirte. Intentá nuevamente.'
const NEWSLETTER_ICON_MAIL =
	'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg>'
const NEWSLETTER_ICON_LOADER =
	'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>'

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

const setSectionVisibility = (list, isVisible) => {
	const sideMenuSection = list.closest('.side-menu__section')
	if (sideMenuSection instanceof HTMLElement) {
		sideMenuSection.hidden = !isVisible
	}

	const footerSection = list.closest('.footer-column')
	if (footerSection instanceof HTMLElement) {
		footerSection.hidden = !isVisible
	}
}

const renderLinkList = (targetId, items, buildLabel, buildHref) => {
	const list = document.getElementById(targetId)
	if (!list) return

	if (!Array.isArray(items) || items.length === 0) {
		list.innerHTML = ''
		setSectionVisibility(list, false)
		return
	}

	list.innerHTML = items
		.map(
			item =>
				`<li><a href="${escapeHtml(buildHref(item))}">${escapeHtml(buildLabel(item))}</a></li>`
		)
		.join('')
	setSectionVisibility(list, true)
}

const initMenuData = async () => {
	try {
		const [categories, pages] = await Promise.all([
			tiendu.categories.list(),
			tiendu.pages.list()
		])

		renderLinkList(
			'category-list',
			categories,
			category => category.name,
			category => `/categorias/${category.id}/${urlSafe(category.name)}`
		)
		renderLinkList(
			'page-list',
			pages,
			page => page.title || 'Página',
			page => `/paginas/${page.id}/${urlSafe(page.title || 'pagina')}`
		)

		renderLinkList(
			'footer-category-list',
			categories,
			category => category.name,
			category => `/categorias/${category.id}/${urlSafe(category.name)}`
		)
		renderLinkList(
			'footer-page-list',
			pages,
			page => page.title || 'Página',
			page => `/paginas/${page.id}/${urlSafe(page.title || 'pagina')}`
		)
	} catch {
		renderLinkList('category-list', [], () => '', () => '#')
		renderLinkList('page-list', [], () => '', () => '#')
		renderLinkList('footer-category-list', [], () => '', () => '#')
		renderLinkList('footer-page-list', [], () => '', () => '#')
	}

	refreshIcons()
}

const initFooter = () => {
	const yearNode = document.getElementById('footer-year')
	if (yearNode) yearNode.textContent = String(new Date().getFullYear())
}

const initNewsletterSubscription = () => {
	const form = document.querySelector('.footer-subscribe-form')
	if (!(form instanceof HTMLFormElement)) return

	const emailInput = form.querySelector('input[type="email"]')
	const submitButton = form.querySelector('button[type="submit"]')
	const iconNode = form.querySelector('#footer-subscribe-icon')
	if (
		!(emailInput instanceof HTMLInputElement) ||
		!(submitButton instanceof HTMLButtonElement) ||
		!(iconNode instanceof HTMLElement)
	) {
		return
	}

	const toastStack = ensureToastStack()
	let hasSubscribed = false

	const setIconLoading = isLoading => {
		iconNode.innerHTML = isLoading ? NEWSLETTER_ICON_LOADER : NEWSLETTER_ICON_MAIL
		iconNode.classList.toggle('inline-form-control__icon--loading', isLoading)
	}

	const setSubmitting = isSubmitting => {
		emailInput.disabled = isSubmitting || hasSubscribed
		submitButton.disabled = isSubmitting || hasSubscribed
		setIconLoading(isSubmitting)
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
		if (event.defaultPrevented) return
		if ('button' in event && event.button !== 0) return
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
initNewsletterSubscription()
initCartButton()
initPageTransitionOverlay()
refreshIcons()

export {}
