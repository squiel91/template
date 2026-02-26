// @ts-nocheck

import '/ui/tiendu-image-carousel/tiendu-image-lightbox.js'

const STYLE_ID = 'tiendu-image-carousel-styles'
const FALLBACK_IMAGE_SRC = '/public/no-image.svg'
const SWIPE_PROGRESS_THRESHOLD = 0.25

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		tiendu-image-carousel {
			display: block;
		}

		.tiendu-carousel {
			display: grid;
			gap: var(--space-4, 1rem);
		}

		.tiendu-carousel__stage {
			position: relative;
		}

		.tiendu-carousel__viewport {
			position: relative;
			aspect-ratio: 1 / 1;
			border-radius: var(--radius-2xl, 1.25rem);
			overflow: hidden;
			background: var(--bg-secondary, #f1f5f9);
			touch-action: pan-y;
			cursor: grab;
		}

		.tiendu-carousel__viewport[data-dragging='true'] {
			cursor: grabbing;
		}

		.tiendu-carousel__track {
			display: flex;
			will-change: transform;
			height: 100%;
			transform: translate3d(0, 0, 0);
		}

		.tiendu-carousel__slide {
			flex: 0 0 100%;
			display: block;
			height: 100%;
		}

		.tiendu-carousel__slide img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			user-select: none;
			-webkit-user-drag: none;
		}

		.tiendu-carousel__open {
			position: absolute;
			inset: 0;
			background: transparent;
			border: none;
			padding: 0;
		}

		.tiendu-carousel__action-surface {
			width: 40px;
			height: 40px;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.96);
			color: #0f172a;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
			transition: background-color 0.15s ease, box-shadow 0.15s ease;
		}

		.tiendu-carousel__open-indicator {
			position: absolute;
			top: 0.75rem;
			right: 0.75rem;
			opacity: 0;
			transition: opacity 0.2s ease;
			pointer-events: none;
		}

		.tiendu-carousel__open-indicator svg {
			width: 18px;
			height: 18px;
		}

		.tiendu-carousel__viewport:hover .tiendu-carousel__open-indicator,
		.tiendu-carousel__viewport:focus-within .tiendu-carousel__open-indicator {
			opacity: 1;
		}

		.tiendu-carousel__open[disabled] {
			pointer-events: none;
		}

		.tiendu-carousel__open[disabled] .tiendu-carousel__open-indicator {
			display: none;
		}

		.tiendu-carousel__nav[hidden],
		.tiendu-carousel__thumbs[hidden] {
			display: none !important;
		}

		.tiendu-carousel__nav {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			border: none;
			padding: 0;
			cursor: pointer;
		}

		.tiendu-carousel__nav:hover:not(:disabled) {
			background: rgba(255, 255, 255, 1);
			box-shadow: 0 6px 14px rgba(15, 23, 42, 0.16);
		}

		.tiendu-carousel__nav:disabled {
			opacity: 0.45;
			cursor: not-allowed;
		}

		.tiendu-carousel__nav:disabled:hover {
			background: rgba(255, 255, 255, 0.88);
		}

		.tiendu-carousel__nav svg {
			width: 18px;
			height: 18px;
		}

		.tiendu-carousel__nav--prev {
			left: 0.75rem;
		}

		.tiendu-carousel__nav--next {
			right: 0.75rem;
		}

		.tiendu-carousel__thumbs {
			display: flex;
			flex-wrap: wrap;
			gap: var(--space-3, 0.75rem);
		}

		.tiendu-carousel__thumb {
			width: 72px;
			height: 72px;
			border-radius: var(--radius-lg, 0.75rem);
			overflow: hidden;
			border: 3px solid transparent;
			padding: 0;
			background: transparent;
			transition: border-color 0.15s ease;
		}

		.tiendu-carousel__thumb:hover {
			border-color: var(--border-medium, #cbd5e1);
		}

		.tiendu-carousel__thumb[aria-current='true'] {
			border-color: var(--color-primary, #0f172a);
		}

		.tiendu-carousel__thumb img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		@media (max-width: 768px) {
			.tiendu-carousel__thumbs {
				display: none;
			}
		}
	`
	document.head.appendChild(style)
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const normalizeImage = image => {
	if (!image || typeof image !== 'object') return null
	const url = typeof image.url === 'string' && image.url.trim() ? image.url : null
	if (!url) return null
	const id = typeof image.id === 'number' ? image.id : null
	const alt = typeof image.alt === 'string' ? image.alt : ''
	return { id, url, alt }
}

class TienduImageCarousel extends HTMLElement {
	constructor() {
		super()
		this._images = []
		this._currentIndex = 0
		this._drag = {
			active: false,
			pointerId: null,
			startX: 0,
			offsetX: 0
		}
		this._suppressClick = false
		this._canOpenLightbox = false
		this._boundPointerDown = this.handlePointerDown.bind(this)
		this._boundPointerMove = this.handlePointerMove.bind(this)
		this._boundPointerEnd = this.handlePointerEnd.bind(this)
		this._boundOpenClick = this.handleOpenClick.bind(this)
		this._boundNavClick = this.handleNavClick.bind(this)
		this._boundThumbClick = this.handleThumbClick.bind(this)
		this._resizeObserver = null

		this._track = null
		this._viewport = null
		this._openButton = null
		this._thumbs = null
		this._prevButton = null
		this._nextButton = null
		this._lightbox = null
	}

	connectedCallback() {
		ensureStyles()
		this.renderBase()
		this.bindEvents()
		this.setImages(this._images)

		this._resizeObserver = new ResizeObserver(() => {
			this.updateTrack({ animate: false })
		})
		if (this._viewport) this._resizeObserver.observe(this._viewport)
	}

	disconnectedCallback() {
		if (this._viewport) {
			this._viewport.removeEventListener('pointerdown', this._boundPointerDown)
			this._viewport.removeEventListener('pointermove', this._boundPointerMove)
			this._viewport.removeEventListener('pointerup', this._boundPointerEnd)
			this._viewport.removeEventListener('pointercancel', this._boundPointerEnd)
			this._viewport.removeEventListener('click', this._boundOpenClick)
		}
		this._openButton?.removeEventListener('click', this._boundOpenClick)
		this._prevButton?.removeEventListener('click', this._boundNavClick)
		this._nextButton?.removeEventListener('click', this._boundNavClick)
		this._thumbs?.removeEventListener('click', this._boundThumbClick)
		this._resizeObserver?.disconnect()
		this._resizeObserver = null
	}

	get maxIndex() {
		return Math.max(0, this._images.length - 1)
	}

	get slideWidth() {
		return this._viewport?.clientWidth || 1
	}

	clampIndex(index) {
		return clamp(index, 0, this.maxIndex)
	}

	setImages(images) {
		const normalized = Array.isArray(images)
			? images.map(normalizeImage).filter(Boolean)
			: []

		this._canOpenLightbox = normalized.length > 0

		this._images = this._canOpenLightbox
			? normalized
			: [{ id: null, url: FALLBACK_IMAGE_SRC, alt: 'Sin imagen' }]
		this._currentIndex = this.clampIndex(this._currentIndex)
		this.renderSlides()
		this.syncThumbs()
		this.syncControls()
		this.syncLightbox()
		this.updateTrack({ animate: false })
	}

	setCurrentImageById(imageId) {
		if (imageId == null) return
		const index = this._images.findIndex(image => image.id === Number(imageId))
		if (index < 0) return
		this.goTo(index, { animate: true })
	}

	goTo(index, { animate = true, emit = true, force = false } = {}) {
		const nextIndex = this.clampIndex(index)
		if (nextIndex === this._currentIndex && !this._drag.active && !force) return
		this._currentIndex = nextIndex
		this.syncThumbs()
		this.syncControls()
		this.updateTrack({ animate })

		if (emit) {
			this.dispatchEvent(
				new CustomEvent('image-change', {
					bubbles: true,
					composed: true,
					detail: {
						index: this._currentIndex,
						imageId: this._images[this._currentIndex]?.id ?? null
					}
				})
			)
		}
	}

	next() {
		if (this._images.length < 2) return
		this.goTo(this._currentIndex + 1, { animate: true })
	}

	prev() {
		if (this._images.length < 2) return
		this.goTo(this._currentIndex - 1, { animate: true })
	}

	resolveReleaseIndex(offsetX) {
		const threshold = Math.max(this.slideWidth, 1) * SWIPE_PROGRESS_THRESHOLD
		if (Math.abs(offsetX) < threshold) {
			return this._currentIndex
		}

		if (offsetX < 0) {
			return this.clampIndex(this._currentIndex + 1)
		}

		if (offsetX > 0) {
			return this.clampIndex(this._currentIndex - 1)
		}

		return this._currentIndex
	}

	handlePointerDown(event) {
		if (this._images.length < 2) return
		if (event.button !== undefined && event.button !== 0) return

		this._drag.active = true
		this._drag.pointerId = event.pointerId
		this._drag.startX = event.clientX
		this._drag.offsetX = 0
		this._viewport?.setPointerCapture?.(event.pointerId)
		if (this._viewport) this._viewport.dataset.dragging = 'true'
		this.updateTrack({ animate: false })
	}

	handlePointerMove(event) {
		if (!this._drag.active) return
		if (this._drag.pointerId !== null && event.pointerId !== this._drag.pointerId) return

		const rawDelta = event.clientX - this._drag.startX
		let delta = rawDelta
		if ((this._currentIndex === 0 && rawDelta > 0) || (this._currentIndex === this.maxIndex && rawDelta < 0)) {
			delta = rawDelta * 0.35
		}

		this._drag.offsetX = delta
		this.updateTrack({ animate: false })
	}

	handlePointerEnd(event) {
		if (!this._drag.active) return
		if (this._drag.pointerId !== null && event.pointerId !== this._drag.pointerId) return

		this._viewport?.releasePointerCapture?.(event.pointerId)
		if (this._viewport) this._viewport.dataset.dragging = 'false'

		const moved = Math.abs(this._drag.offsetX)
		const nextIndex = this.resolveReleaseIndex(this._drag.offsetX)

		this._drag.active = false
		this._drag.pointerId = null
		this._drag.offsetX = 0
		this._suppressClick = moved > 6

		this.goTo(nextIndex, { animate: true, force: true })
	}

	handleOpenClick(event) {
		if (!this._canOpenLightbox) {
			event.preventDefault()
			event.stopPropagation()
			return
		}

		if (this._suppressClick) {
			event.preventDefault()
			event.stopPropagation()
			this._suppressClick = false
			return
		}

		if (this._lightbox && typeof this._lightbox.openAt === 'function') {
			this._lightbox.openAt(this._currentIndex)
		}
	}

	handleNavClick(event) {
		const target = event.currentTarget
		if (!(target instanceof HTMLButtonElement)) return
		if (target.dataset.role === 'prev-image') this.prev()
		if (target.dataset.role === 'next-image') this.next()
	}

	handleThumbClick(event) {
		const button = event.target instanceof Element ? event.target.closest('[data-thumb-index]') : null
		if (!(button instanceof HTMLButtonElement)) return
		const index = Number(button.dataset.thumbIndex)
		if (!Number.isFinite(index)) return
		this.goTo(index, { animate: true })
	}

	renderBase() {
		this.innerHTML = `
			<div class="tiendu-carousel">
				<div class="tiendu-carousel__stage">
					<div class="tiendu-carousel__viewport" data-role="viewport" data-dragging="false">
						<div class="tiendu-carousel__track" data-role="track"></div>
						<button class="tiendu-carousel__open" type="button" data-role="open-lightbox" aria-label="Ampliar imagen">
							<span class="tiendu-carousel__open-indicator tiendu-carousel__action-surface" aria-hidden="true">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
							</span>
						</button>
					</div>
					<button class="tiendu-carousel__nav tiendu-carousel__nav--prev tiendu-carousel__action-surface" type="button" data-role="prev-image" aria-label="Imagen anterior">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
					</button>
					<button class="tiendu-carousel__nav tiendu-carousel__nav--next tiendu-carousel__action-surface" type="button" data-role="next-image" aria-label="Imagen siguiente">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
					</button>
				</div>
				<div class="tiendu-carousel__thumbs" data-role="thumbs" aria-label="Selector de imagenes"></div>
			</div>
			<tiendu-image-lightbox data-role="lightbox"></tiendu-image-lightbox>
		`

		this._track = this.querySelector('[data-role="track"]')
		this._viewport = this.querySelector('[data-role="viewport"]')
		this._openButton = this.querySelector('[data-role="open-lightbox"]')
		this._thumbs = this.querySelector('[data-role="thumbs"]')
		this._prevButton = this.querySelector('[data-role="prev-image"]')
		this._nextButton = this.querySelector('[data-role="next-image"]')
		this._lightbox = this.querySelector('[data-role="lightbox"]')
	}

	bindEvents() {
		if (!this._viewport) return
		this._viewport.addEventListener('pointerdown', this._boundPointerDown)
		this._viewport.addEventListener('pointermove', this._boundPointerMove)
		this._viewport.addEventListener('pointerup', this._boundPointerEnd)
		this._viewport.addEventListener('pointercancel', this._boundPointerEnd)
		this._viewport.addEventListener('click', this._boundOpenClick)
		this._prevButton?.addEventListener('click', this._boundNavClick)
		this._nextButton?.addEventListener('click', this._boundNavClick)
		this._thumbs?.addEventListener('click', this._boundThumbClick)
	}

	renderSlides() {
		if (!this._track || !this._thumbs) return

		this._track.innerHTML = this._images
			.map(
				image => `<div class="tiendu-carousel__slide"><img src="${image.url || FALLBACK_IMAGE_SRC}" alt="${image.alt || ''}" loading="eager" /></div>`
			)
			.join('')

		const hasMultiple = this._images.length > 1
		this._thumbs.hidden = !hasMultiple
		this._prevButton.hidden = !hasMultiple
		this._nextButton.hidden = !hasMultiple

		if (!hasMultiple) {
			this._thumbs.innerHTML = ''
			return
		}

		this._thumbs.innerHTML = this._images
			.map(
				(image, index) =>
					`<button class="tiendu-carousel__thumb" type="button" data-thumb-index="${index}" aria-current="${index === this._currentIndex ? 'true' : 'false'}" aria-label="Ver imagen ${index + 1}"><img src="${image.url || FALLBACK_IMAGE_SRC}" alt="${image.alt || ''}" loading="lazy" /></button>`
			)
			.join('')
	}

	updateTrack({ animate }) {
		if (!this._track) return
		const baseTranslate = -this._currentIndex * this.slideWidth
		const dragOffset = this._drag.active ? this._drag.offsetX : 0
		const translate = baseTranslate + dragOffset

		this._track.style.transition =
			animate && !this._drag.active
				? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)'
				: 'none'
		this._track.style.transform = `translate3d(${translate}px, 0, 0)`
	}

	syncThumbs() {
		if (!this._thumbs) return
		for (const button of this._thumbs.querySelectorAll('[data-thumb-index]')) {
			const index = Number(button.getAttribute('data-thumb-index'))
			button.setAttribute('aria-current', index === this._currentIndex ? 'true' : 'false')
		}
	}

	syncControls() {
		const hasMultiple = this._images.length > 1
		if (this._prevButton) this._prevButton.hidden = !hasMultiple
		if (this._nextButton) this._nextButton.hidden = !hasMultiple
		if (this._prevButton) this._prevButton.disabled = !hasMultiple || this._currentIndex === 0
		if (this._nextButton) this._nextButton.disabled = !hasMultiple || this._currentIndex === this.maxIndex
		if (this._openButton) this._openButton.disabled = !this._canOpenLightbox
	}

	syncLightbox() {
		if (this._lightbox && typeof this._lightbox.setImages === 'function') {
			this._lightbox.setImages(this._images)
		}
	}
}

if (!customElements.get('tiendu-image-carousel')) {
	customElements.define('tiendu-image-carousel', TienduImageCarousel)
}

export {}
