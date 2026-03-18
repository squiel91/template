// @ts-nocheck

const TOAST_ANIMATION_MS = 200

let toastStack = null
let nextToastId = 1
let toasts = []

const getToastIcon = tone => {
	if (tone === 'success') {
		return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>'
	}

	return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>'
}

const ensureToastStack = () => {
	if (toastStack instanceof HTMLElement) return toastStack

	toastStack = document.createElement('div')
	toastStack.id = 'global-toast-stack'
	toastStack.className = 'toast-stack'
	document.body.appendChild(toastStack)
	return toastStack
}

const renderToasts = () => {
	const stack = ensureToastStack()
	stack.innerHTML = `
		<div class="toast-stack__inner" aria-live="polite" aria-atomic="false">
			${toasts
				.map(
					toast => `
						<div class="toast" data-state="${toast.state}" data-tone="${toast.tone}" role="status">
							<span class="toast__icon" aria-hidden="true">${getToastIcon(toast.tone)}</span>
							<div class="toast__message">${toast.message}</div>
						</div>
					`
				)
				.join('')}
		</div>
	`
}

const dismissToast = id => {
	const toast = toasts.find(item => item.id === id)
	if (!toast || toast.state === 'closing') return

	toast.state = 'closing'
	if (toast.closeTimer) {
		window.clearTimeout(toast.closeTimer)
		toast.closeTimer = null
	}

	renderToasts()

	toast.removeTimer = window.setTimeout(() => {
		toasts = toasts.filter(item => item.id !== id)
		renderToasts()
	}, TOAST_ANIMATION_MS)
}

export const showToast = (message, { tone = 'warning', duration = 5000 } = {}) => {
	const id = nextToastId++
	const toast = {
		id,
		message: String(message || ''),
		tone: tone === 'success' ? 'success' : tone === 'error' ? 'error' : 'warning',
		state: 'open',
		closeTimer: null,
		removeTimer: null
	}

	toasts.push(toast)
	renderToasts()

	toast.closeTimer = window.setTimeout(() => {
		dismissToast(id)
	}, Math.max(0, Number(duration) || 5000))
}

export const showWarningToast = (message, duration = 5000) => {
	showToast(message, { tone: 'warning', duration })
}

export const showErrorToast = (message, duration = 5000) => {
	showToast(message, { tone: 'error', duration })
}

export const showSuccessToast = (message, duration = 5000) => {
	showToast(message, { tone: 'success', duration })
}

export {}
