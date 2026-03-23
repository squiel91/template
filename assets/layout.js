// @ts-nocheck

import { Tiendu } from '/assets/tiendu-sdk.js'
import { showErrorToast, showSuccessToast } from '/assets/toast.js'
import { initHeaderSearch } from '/assets/search.js'

const tiendu = Tiendu()

const CART_BUTTON_LOADING_TIMEOUT_MS = 4000
const NEWSLETTER_SUCCESS_MESSAGE =
	'¡Enviado el email de confirmación! Suscribite al confirmar tu correo.'
const NEWSLETTER_INVALID_EMAIL_MESSAGE = 'Ingresá un email válido para suscribirte.'
const NEWSLETTER_ERROR_MESSAGE = 'No pudimos suscribirte. Intentá nuevamente.'
const NEWSLETTER_ICON_MAIL =
	'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg>'
const NEWSLETTER_ICON_LOADER =
	'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>'

const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const setButtonState = (button, { label, icon, loading = false } = {}) => {
	if (!(button instanceof HTMLButtonElement)) return
	button.dataset.loading = loading ? 'true' : 'false'
	const labelNode = button.querySelector('.button__label')
	if (labelNode && label) labelNode.textContent = label
	const nextIcon = loading
		? button.dataset.loadingIcon || 'loader-2'
		: icon || button.dataset.icon || 'shopping-cart'
	for (const iconNode of button.querySelectorAll('[data-button-icon]')) {
		if (!(iconNode instanceof HTMLElement)) continue
		iconNode.hidden = iconNode.dataset.buttonIcon !== nextIcon
	}
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
			showErrorToast(NEWSLETTER_INVALID_EMAIL_MESSAGE, 5000)
			return
		}

		setSubmitting(true)
		try {
			await tiendu.subscribers.add(email)
			hasSubscribed = true
			showSuccessToast(NEWSLETTER_SUCCESS_MESSAGE, 5000)
		} catch {
			showErrorToast(NEWSLETTER_ERROR_MESSAGE, 5000)
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
	if (!(button instanceof HTMLButtonElement)) return

	let loadingTimeout = null

	const setLoading = isLoading => {
		setButtonState(button, { label: 'Carrito', icon: button.dataset.icon || 'shopping-cart', loading: isLoading })
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
			const quantityNode = document.getElementById('cart-quantity')
			if (quantityNode) quantityNode.textContent = String(quantity)
		} catch {
			const quantityNode = document.getElementById('cart-quantity')
			if (quantityNode) quantityNode.textContent = '0'
		}
	}

	button.addEventListener('click', () => {
		if (button.disabled) return
		startLoading()

		tiendu.cart.open(({ updatedCartItemsQuantity }) => {
			const quantityNode = document.getElementById('cart-quantity')
			if (quantityNode) quantityNode.textContent = String(updatedCartItemsQuantity)
			stopLoading()
		})
			.catch(() => {
				stopLoading()
			})
	})

	await syncQuantity()
}

initHeaderSearch()
initSideMenu()
initFooter()
initNewsletterSubscription()
initCartButton()

export {}
