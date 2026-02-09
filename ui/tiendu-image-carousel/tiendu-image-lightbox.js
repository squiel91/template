// @ts-nocheck

const STYLE_ID = 'tiendu-image-lightbox-styles'
const FALLBACK_IMAGE_SRC = '/public/no-image.svg'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		tiendu-image-lightbox {
			display: contents;
		}

		.tiendu-lightbox {
			position: fixed;
			inset: 0;
			z-index: 100;
		}

		.tiendu-lightbox__backdrop {
			position: absolute;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			opacity: 0;
			animation: tiendu-lightbox-fade-in 220ms ease forwards;
		}

		.tiendu-lightbox__content {
			position: relative;
			z-index: 1;
			width: 100%;
			height: 100%;
			display: grid;
			place-items: center;
			padding: 1.25rem;
		}

		.tiendu-lightbox__image {
			max-width: min(92vw, 980px);
			max-height: 90vh;
			object-fit: contain;
			user-select: none;
			-webkit-user-drag: none;
			opacity: 0;
			transform: scale(0.75);
			animation: tiendu-lightbox-zoom-in 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
		}

		.tiendu-lightbox[data-state='closing'] .tiendu-lightbox__backdrop {
			animation: tiendu-lightbox-fade-out 180ms ease forwards;
		}

		.tiendu-lightbox[data-state='closing'] .tiendu-lightbox__image {
			animation: tiendu-lightbox-zoom-out 180ms ease forwards;
		}

		.tiendu-lightbox__close {
			position: absolute;
			top: 0.75rem;
			right: 0.75rem;
			width: 38px;
			height: 38px;
			border-radius: 999px;
			border: 1px solid rgba(226, 232, 240, 0.45);
			background: rgba(15, 23, 42, 0.68);
			color: #f8fafc;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.tiendu-lightbox__close svg {
			width: 18px;
			height: 18px;
		}

		@keyframes tiendu-lightbox-fade-in {
			from { opacity: 0; }
			to { opacity: 1; }
		}

		@keyframes tiendu-lightbox-fade-out {
			from { opacity: 1; }
			to { opacity: 0; }
		}

		@keyframes tiendu-lightbox-zoom-in {
			from {
				opacity: 0;
				transform: scale(0.75);
			}
			to {
				opacity: 1;
				transform: scale(1);
			}
		}

		@keyframes tiendu-lightbox-zoom-out {
			from {
				opacity: 1;
				transform: scale(1);
			}
			to {
				opacity: 0;
				transform: scale(0.75);
			}
		}
	`
	document.head.appendChild(style)
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

class TienduImageLightbox extends HTMLElement {
	constructor() {
		super()
		this._open = false
		this._closing = false
		this._images = []
		this._index = 0
		this._closeTimer = null
		this._boundKeydown = this.handleKeydown.bind(this)
	}

	connectedCallback() {
		ensureStyles()
		document.addEventListener('keydown', this._boundKeydown)
		this.render()
	}

	disconnectedCallback() {
		document.removeEventListener('keydown', this._boundKeydown)
		if (this._closeTimer) {
			clearTimeout(this._closeTimer)
			this._closeTimer = null
		}
		if (this._open) document.body.style.overflow = ''
	}

	setImages(images) {
		this._images = Array.isArray(images) && images.length > 0
			? images
			: [{ id: 'fallback', url: FALLBACK_IMAGE_SRC, alt: 'Sin imagen' }]
		this._index = clamp(this._index, 0, Math.max(0, this._images.length - 1))
		if (this._open) this.render()
	}

	openAt(index = 0) {
		if (this._closeTimer) {
			clearTimeout(this._closeTimer)
			this._closeTimer = null
		}
		this._index = clamp(Number(index) || 0, 0, Math.max(0, this._images.length - 1))
		this._open = true
		this._closing = false
		document.body.style.overflow = 'hidden'
		this.render()
	}

	close() {
		if (!this._open || this._closing) return
		this._closing = true
		this.render()
		if (this._closeTimer) clearTimeout(this._closeTimer)
		this._closeTimer = window.setTimeout(() => {
			this._open = false
			this._closing = false
			this._closeTimer = null
			document.body.style.overflow = ''
			this.render()
		}, 180)
	}

	handleKeydown(event) {
		if (!this._open || this._closing) return
		if (event.key === 'Escape') this.close()
	}

	render() {
		if (!this._open && !this._closing) {
			this.innerHTML = ''
			return
		}

		const current = this._images[this._index] || { url: FALLBACK_IMAGE_SRC, alt: 'Sin imagen' }

		this.innerHTML = `
			<div class="tiendu-lightbox" data-state="${this._closing ? 'closing' : 'open'}" role="dialog" aria-modal="true" aria-label="Imagen ampliada del producto">
				<div class="tiendu-lightbox__backdrop" data-role="backdrop"></div>
				<div class="tiendu-lightbox__content" data-role="content">
					<button class="tiendu-lightbox__close" type="button" data-role="close-lightbox" aria-label="Cerrar imagen ampliada">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 6-12 12"></path><path d="m6 6 12 12"></path></svg>
					</button>
					<img class="tiendu-lightbox__image" src="${current.url || FALLBACK_IMAGE_SRC}" alt="${current.alt || ''}" loading="eager" />
				</div>
			</div>
		`

		this.querySelector('[data-role="backdrop"]')?.addEventListener('click', () => this.close())
		this.querySelector('[data-role="close-lightbox"]')?.addEventListener('click', () => this.close())
		this.querySelector('[data-role="content"]')?.addEventListener('click', event => {
			if (event.target === event.currentTarget) this.close()
		})
	}
}

if (!customElements.get('tiendu-image-lightbox')) {
	customElements.define('tiendu-image-lightbox', TienduImageLightbox)
}

export {}
