// @ts-nocheck

const TOAST_ANIMATION_MS = 200

class TienduToastStack extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
		this._toasts = []
		this._nextId = 1
	}

	connectedCallback() {
		this.render()
	}

	showWarning(message, duration = 5000) {
		this.show(message, { tone: 'warning', duration })
	}

	showError(message, duration = 5000) {
		this.show(message, { tone: 'error', duration })
	}

	showSuccess(message, duration = 5000) {
		this.show(message, { tone: 'success', duration })
	}

	show(message, { tone = 'warning', duration = 5000 } = {}) {
		const id = this._nextId++
		const toast = {
			id,
			message: String(message || ''),
			tone: tone === 'success' ? 'success' : tone === 'error' ? 'error' : 'warning',
			state: 'open',
			closeTimer: null,
			removeTimer: null
		}

		this._toasts.push(toast)
		this.render()

		toast.closeTimer = window.setTimeout(() => {
			this.dismiss(id)
		}, Math.max(0, Number(duration) || 5000))
	}

	dismiss(id) {
		const toast = this._toasts.find(item => item.id === id)
		if (!toast || toast.state === 'closing') return

		toast.state = 'closing'
		if (toast.closeTimer) {
			window.clearTimeout(toast.closeTimer)
			toast.closeTimer = null
		}

		this.render()

		toast.removeTimer = window.setTimeout(() => {
			this._toasts = this._toasts.filter(item => item.id !== id)
			this.render()
		}, TOAST_ANIMATION_MS)
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					position: fixed;
					left: 50%;
					top: 1rem;
					transform: translateX(-50%);
					z-index: 110;
					pointer-events: none;
				}

				.stack {
					display: grid;
					gap: 0.5rem;
					width: min(94vw, 460px);
				}

				.toast {
					display: grid;
					grid-template-columns: auto 1fr;
					align-items: start;
					gap: 0.5rem;
					padding: 0.95rem 1rem 0.95rem 0.85rem;
					border-radius: 12px;
					background: #fef2f2;
					border: 4px solid #dc2626;
					box-shadow: 0 14px 28px rgba(127, 29, 29, 0.2);
					color: #dc2626;
					pointer-events: auto;
					transform-origin: top center;
				}

				.toast[data-tone='success'] {
					background: #f0fdf4;
					border-color: #16a34a;
					box-shadow: 0 14px 28px rgba(21, 128, 61, 0.2);
					color: #16a34a;
				}

				.toast[data-tone='error'] {
					background: #fef2f2;
					border-color: #dc2626;
					box-shadow: 0 14px 28px rgba(127, 29, 29, 0.2);
					color: #dc2626;
				}

				.toast[data-tone='warning'] {
					background: #fef2f2;
					border-color: #dc2626;
					box-shadow: 0 14px 28px rgba(127, 29, 29, 0.2);
					color: #dc2626;
				}

				.toast[data-state='open'] {
					opacity: 0;
					transform: translateY(8px) scale(0.98);
					animation: toast-in ${TOAST_ANIMATION_MS}ms ease forwards;
				}

				.toast[data-state='closing'] {
					opacity: 1;
					transform: translateY(0) scale(1);
					animation: toast-out ${TOAST_ANIMATION_MS}ms ease forwards;
				}

				.icon {
					width: 22px;
					height: 22px;
					display: inline-flex;
					align-items: center;
					justify-content: center;
					color: currentColor;
				}

				.icon svg {
					width: 18px;
					height: 18px;
				}

				.message {
					font-size: 0.96rem;
					line-height: 1.35;
					font-weight: 700;
					margin-top: 0.05rem;
				}

				@media (max-width: 640px) {
					:host {
						top: 0.75rem;
					}

					.stack {
						width: min(96vw, 460px);
					}

					.toast {
						padding: 1rem 1rem;
					}
				}

				@keyframes toast-in {
					from {
						opacity: 0;
						transform: translateY(8px) scale(0.98);
					}
					to {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
				}

				@keyframes toast-out {
					from {
						opacity: 1;
						transform: translateY(0) scale(1);
					}
					to {
						opacity: 0;
						transform: translateY(8px) scale(0.98);
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.toast[data-state='open'],
					.toast[data-state='closing'] {
						animation: none;
						opacity: 1;
						transform: none;
					}
				}
			</style>
			<div class="stack" aria-live="polite" aria-atomic="false">
				${this._toasts
					.map(
						toast => `
							<div class="toast" data-state="${toast.state}" data-tone="${toast.tone}" role="status">
								<span class="icon" aria-hidden="true">
									${
										toast.tone === 'success'
											? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>'
											: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>'
									}
								</span>
								<div class="message">${toast.message}</div>
							</div>
						`
					)
					.join('')}
			</div>
		`
	}
}

if (!customElements.get('tiendu-toast-stack')) {
	customElements.define('tiendu-toast-stack', TienduToastStack)
}

export {}
