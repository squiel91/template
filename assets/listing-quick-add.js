// @ts-nocheck

import { tiendu } from '/assets/tiendu-client.js'

const BUTTON_SELECTOR = '[data-product-card-add]'

const syncCartBadge = quantity => {
	const cartButton = document.getElementById('open-cart-button')
	if (cartButton && typeof cartButton.setBadge === 'function') {
		cartButton.setBadge(quantity)
		return
	}

	const badge = document.getElementById('cart-quantity')
	if (badge) badge.textContent = String(quantity)
}

const setButtonLoading = (button, isLoading) => {
	button.disabled = isLoading
	button.classList.toggle('is-loading', isLoading)
}

const handleQuickAdd = async button => {
	if (!(button instanceof HTMLButtonElement)) return
	if (button.disabled) return

	const variantId = Number(button.dataset.variantId)
	if (!Number.isFinite(variantId) || variantId < 1) return

	setButtonLoading(button, true)

	try {
		await tiendu.cart.addProductVariant(
			{ id: variantId },
			1,
			({ updatedCartItemsQuantity }) => {
				syncCartBadge(updatedCartItemsQuantity)
			}
		)
	} catch {
		// noop
	} finally {
		setButtonLoading(button, false)
	}
}

document.addEventListener('click', event => {
	const target = event.target instanceof Element ? event.target.closest(BUTTON_SELECTOR) : null
	if (!(target instanceof HTMLButtonElement)) return
	event.preventDefault()
	event.stopPropagation()
	void handleQuickAdd(target)
})

export {}
