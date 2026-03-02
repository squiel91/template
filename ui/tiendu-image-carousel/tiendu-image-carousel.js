// @ts-nocheck

import '/ui/tiendu-image-carousel/tiendu-image-lightbox.js'
import '/ui/app-button/app-button.js'

const STYLE_ID = 'tiendu-image-carousel-styles'
const FALLBACK_IMAGE_SRC = '/public/no-image.svg'
const SWIPE_PROGRESS_THRESHOLD = 0.25
const DEFAULT_AUTOPLAY_INTERVAL = 6500

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const escapeHtml = value =>
	String(value ?? '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')

const resolveImageUrl = input => {
	if (!input) return ''
	if (typeof input === 'string') return input.trim()
	if (typeof input === 'object' && typeof input.url === 'string') return input.url.trim()
	return ''
}

const normalizeProductImage = image => {
	if (!image || typeof image !== 'object') return null
	const url = typeof image.url === 'string' && image.url.trim() ? image.url.trim() : null
	if (!url) return null

	const numericId = Number(image.id)
	const id = Number.isFinite(numericId) ? numericId : null
	const alt = typeof image.alt === 'string' ? image.alt : ''

	return {
		id,
		url,
		desktopUrl: '',
		alt,
		title: '',
		description: '',
		ctaText: '',
		href: '',
		newTab: false
	}
}

const normalizeHeroSlide = (slide, index) => {
	if (!slide || typeof slide !== 'object') return null

	const title = typeof slide.title === 'string' ? slide.title.trim() : ''
	const description = typeof slide.description === 'string' ? slide.description.trim() : ''
	const mobileImage = resolveImageUrl(slide.mobileImage || slide.image || slide.url)
	const desktopImage = resolveImageUrl(slide.desktopImage)
	const imageUrl = mobileImage || desktopImage
	const imageAlt =
		typeof slide.imageAlt === 'string' && slide.imageAlt.trim()
			? slide.imageAlt.trim()
			: title || `Slide ${index + 1}`

	const ctaText = typeof slide.ctaText === 'string' ? slide.ctaText.trim() : ''
	const directHref = typeof slide.href === 'string' ? slide.href.trim() : ''
	const ctaPath = typeof slide.ctaPath === 'string' ? slide.ctaPath.trim() : ''
	const ctaUrl = typeof slide.ctaUrl === 'string' ? slide.ctaUrl.trim() : ''

	let href = ''
	if (/^https?:\/\//i.test(directHref) || directHref.startsWith('/')) {
		href = directHref
	} else if (/^https?:\/\//i.test(ctaUrl)) {
		href = ctaUrl
	} else if (/^https?:\/\//i.test(ctaPath)) {
		href = ctaPath
	} else if (ctaPath.startsWith('/')) {
		href = ctaPath
	}

	const hasContent = Boolean(title || description || imageUrl)
	if (!hasContent) return null

	const numericId = Number(slide.id)
	const id = Number.isFinite(numericId) ? numericId : null

	return {
		id,
		url: imageUrl,
		desktopUrl: desktopImage,
		alt: imageAlt,
		title,
		description,
		ctaText,
		href,
		newTab: Boolean(slide.ctaNewTab) || Boolean(slide.newTab) || /^https?:\/\//i.test(href)
	}
}

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return

	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		tiendu-image-carousel {
			display: block;
		}

		tiendu-image-carousel[mode='hero'] {
			height: 100%;
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
		.tiendu-carousel__thumbs[hidden],
		.tiendu-carousel__dots[hidden] {
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

		.tiendu-carousel--hero {
			height: 100%;
			gap: 0;
		}

		.tiendu-carousel--hero .tiendu-carousel__stage {
			height: 100%;
		}

		.tiendu-carousel--hero .tiendu-carousel__viewport {
			aspect-ratio: auto;
			height: 100%;
			min-height: inherit;
			border-radius: inherit;
			background: transparent;
		}

		.tiendu-carousel__slide--hero {
			position: relative;
		}

		.tiendu-carousel__hero-media,
		.tiendu-carousel__hero-media img {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.tiendu-carousel__hero-media--empty {
			background: radial-gradient(circle at 20% 20%, #e5d6bf 0, #d8c6a9 45%, #ccb496 100%);
		}

		.tiendu-carousel__hero-overlay {
			position: absolute;
			inset: 0;
			background:
				linear-gradient(90deg, rgba(23, 27, 23, 0.74) 0%, rgba(23, 27, 23, 0.58) 24%, rgba(23, 27, 23, 0.26) 46%, rgba(23, 27, 23, 0.08) 60%, rgba(23, 27, 23, 0) 72%),
				linear-gradient(0deg, rgba(23, 27, 23, 0.28) 0%, rgba(23, 27, 23, 0.12) 26%, rgba(23, 27, 23, 0) 50%);
		}

		.tiendu-carousel__hero-content {
			position: relative;
			z-index: 1;
			height: 100%;
			width: 100%;
		}

		.tiendu-carousel__hero-content .container {
			height: 100%;
			display: flex;
		}

		.tiendu-carousel__hero-content-inner {
			width: 100%;
			max-width: 760px;
			padding: var(--space-12, 3rem) 0;
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			gap: var(--space-5, 1.25rem);
			color: #fff;
		}

		.tiendu-carousel__hero-title {
			font-family: 'Suez One', serif;
			font-size: clamp(1.75rem, 4.4vw, 3.25rem);
			line-height: 1.16;
			font-weight: 400;
			letter-spacing: 0;
			max-width: 18ch;
		}

		.tiendu-carousel__hero-subtitle {
			font-size: clamp(1rem, 2.2vw, 1.2rem);
			line-height: 1.6;
			max-width: 56ch;
			color: rgba(255, 255, 255, 0.94);
		}

		.tiendu-carousel__hero-cta {
			display: inline-flex;
			width: fit-content;
		}

		.tiendu-carousel__hero-cta button,
		.tiendu-carousel__hero-cta a {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: var(--space-2, 0.5rem);
			padding: var(--space-4, 1rem) var(--space-8, 2rem);
			font-family: 'Bebas Neue', sans-serif;
			font-size: var(--text-lg, 1.125rem);
			font-weight: 400;
			letter-spacing: 0;
			border-radius: var(--radius-xl, 1rem);
			background: var(--home-olive, var(--color-primary, #4f6344));
			border-color: var(--home-olive, var(--color-primary, #4f6344));
			color: #ffffff;
			text-decoration: none;
			white-space: nowrap;
			transition: all var(--transition-fast, 0.15s ease);
		}

		.tiendu-carousel__hero-cta button:hover:not(:disabled),
		.tiendu-carousel__hero-cta a:hover {
			background: #405138;
			border-color: #405138;
			transform: translateY(-2px);
			box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1));
			text-decoration: none;
			color: #ffffff;
		}

		.tiendu-carousel__hero-controls {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			bottom: var(--space-5, 1.25rem);
			z-index: 2;
			display: inline-flex;
			align-items: center;
			gap: var(--space-2, 0.5rem);
			pointer-events: none;
		}

		.tiendu-carousel--hero .tiendu-carousel__nav {
			position: static;
			transform: none;
			pointer-events: auto;
			width: 24px;
			height: 24px;
			min-width: 24px;
			background: transparent;
			border: 0;
			box-shadow: none;
			color: rgba(255, 255, 255, 0.82);
		}

		.tiendu-carousel--hero .tiendu-carousel__nav svg {
			width: 16px;
			height: 16px;
		}

		.tiendu-carousel--hero .tiendu-carousel__nav:hover:not(:disabled) {
			background: transparent;
			box-shadow: none;
			color: #ffffff;
		}

		.tiendu-carousel__dots {
			pointer-events: auto;
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 0;
			background: transparent;
			backdrop-filter: none;
		}

		.tiendu-carousel__dot {
			width: 8px;
			height: 8px;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.5);
			border: 1px solid transparent;
			padding: 0;
		}

		.tiendu-carousel__dot.is-active {
			background: #ffffff;
			transform: scale(1.08);
		}

		@media (max-width: 768px) {
			.tiendu-carousel__thumbs {
				display: none;
			}

			.tiendu-carousel__hero-content-inner {
				padding: var(--space-8, 2rem) var(--space-6, 1.5rem) var(--space-10, 2.5rem);
				max-width: 100%;
			}

			.tiendu-carousel__hero-controls {
				bottom: var(--space-3, 0.75rem);
			}
		}
	`

	document.head.appendChild(style)
}

class TienduImageCarousel extends HTMLElement {
	constructor() {
		super()
		this._slides = []
		this._currentIndex = 0
		this._drag = {
			active: false,
			pointerId: null,
			startX: 0,
			offsetX: 0
		}
		this._suppressClick = false
		this._canOpenLightbox = false
		this._autoplayTimer = null

		this._boundPointerDown = this.handlePointerDown.bind(this)
		this._boundPointerMove = this.handlePointerMove.bind(this)
		this._boundPointerEnd = this.handlePointerEnd.bind(this)
		this._boundOpenClick = this.handleOpenClick.bind(this)
		this._boundNavClick = this.handleNavClick.bind(this)
		this._boundThumbClick = this.handleThumbClick.bind(this)
		this._boundDotClick = this.handleDotClick.bind(this)
		this._boundPauseAutoplay = this.pauseAutoplay.bind(this)
		this._boundResumeAutoplay = this.resumeAutoplay.bind(this)

		this._resizeObserver = null

		this._track = null
		this._viewport = null
		this._openButton = null
		this._thumbs = null
		this._dots = null
		this._prevButton = null
		this._nextButton = null
		this._lightbox = null
	}

	get isHeroMode() {
		return String(this.getAttribute('mode') || '').toLowerCase() === 'hero'
	}

	get maxIndex() {
		return Math.max(0, this._slides.length - 1)
	}

	get slideWidth() {
		return this._viewport?.clientWidth || 1
	}

	get autoplayInterval() {
		const parsed = Number(this.getAttribute('autoplay-interval'))
		return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AUTOPLAY_INTERVAL
	}

	connectedCallback() {
		ensureStyles()
		this.renderBase()
		this.bindEvents()
		this.refreshView()

		this._resizeObserver = new ResizeObserver(() => {
			this.updateTrack({ animate: false })
		})
		if (this._viewport) this._resizeObserver.observe(this._viewport)
	}

	disconnectedCallback() {
		this.unbindEvents()
		this._resizeObserver?.disconnect()
		this._resizeObserver = null
		this.stopAutoplay()
	}

	clampIndex(index) {
		return clamp(index, 0, this.maxIndex)
	}

	setImages(images) {
		const normalized = Array.isArray(images)
			? images.map(normalizeProductImage).filter(Boolean)
			: []

		this._canOpenLightbox = normalized.length > 0
		this._slides = this._canOpenLightbox
			? normalized
			: [
				{
					id: null,
					url: FALLBACK_IMAGE_SRC,
					desktopUrl: '',
					alt: 'Sin imagen',
					title: '',
					description: '',
					ctaText: '',
					href: '',
					newTab: false
				}
			]
		this._currentIndex = this.clampIndex(this._currentIndex)
		this.refreshView()
	}

	setSlides(slides) {
		const normalized = Array.isArray(slides)
			? slides.map((slide, index) => normalizeHeroSlide(slide, index)).filter(Boolean)
			: []

		this._canOpenLightbox = false
		this._slides = normalized
		this._currentIndex = this.clampIndex(this._currentIndex)
		this.refreshView()
	}

	setCurrentImageById(imageId) {
		if (imageId == null) return
		const index = this._slides.findIndex(image => image.id === Number(imageId))
		if (index < 0) return
		this.goTo(index, { animate: true })
	}

	refreshView() {
		if (!this.isConnected) return

		this.renderSlides()
		this.syncThumbs()
		this.syncDots()
		this.syncControls()
		this.syncLightbox()
		this.updateTrack({ animate: false })

		if (this.isHeroMode) {
			this.startAutoplay()
		} else {
			this.stopAutoplay()
		}
	}

	goTo(index, { animate = true, emit = true, force = false } = {}) {
		const nextIndex = this.clampIndex(index)
		if (nextIndex === this._currentIndex && !this._drag.active && !force) return

		this._currentIndex = nextIndex
		this.syncThumbs()
		this.syncDots()
		this.syncControls()
		this.updateTrack({ animate })

		if (emit) {
			this.dispatchEvent(
				new CustomEvent('image-change', {
					bubbles: true,
					composed: true,
					detail: {
						index: this._currentIndex,
						imageId: this._slides[this._currentIndex]?.id ?? null
					}
				})
			)
		}
	}

	next() {
		if (this._slides.length < 2) return
		if (this.isHeroMode) {
			this.goTo((this._currentIndex + 1) % this._slides.length, { animate: true, force: true })
			return
		}
		this.goTo(this._currentIndex + 1, { animate: true })
	}

	prev() {
		if (this._slides.length < 2) return
		if (this.isHeroMode) {
			this.goTo((this._currentIndex - 1 + this._slides.length) % this._slides.length, {
				animate: true,
				force: true
			})
			return
		}
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
		if (this._slides.length < 2) return
		if (event.button !== undefined && event.button !== 0) return

		this._drag.active = true
		this._drag.pointerId = event.pointerId
		this._drag.startX = event.clientX
		this._drag.offsetX = 0
		this._viewport?.setPointerCapture?.(event.pointerId)
		if (this._viewport) this._viewport.dataset.dragging = 'true'

		if (this.isHeroMode) {
			this.pauseAutoplay()
		}

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

		if (this.isHeroMode) {
			this.resumeAutoplay()
		}
	}

	handleOpenClick(event) {
		if (this.isHeroMode) return

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

		if (this.isHeroMode) {
			this.resumeAutoplay()
		}
	}

	handleThumbClick(event) {
		const button = event.target instanceof Element ? event.target.closest('[data-thumb-index]') : null
		if (!(button instanceof HTMLButtonElement)) return

		const index = Number(button.dataset.thumbIndex)
		if (!Number.isFinite(index)) return

		this.goTo(index, { animate: true })
	}

	handleDotClick(event) {
		const button = event.target instanceof Element ? event.target.closest('[data-dot-index]') : null
		if (!(button instanceof HTMLButtonElement)) return

		const index = Number(button.dataset.dotIndex)
		if (!Number.isFinite(index)) return

		this.goTo(index, { animate: true })
		this.resumeAutoplay()
	}

	pauseAutoplay() {
		this.stopAutoplay()
	}

	resumeAutoplay() {
		this.startAutoplay()
	}

	startAutoplay() {
		this.stopAutoplay()
		if (!this.isHeroMode) return
		if (this._slides.length < 2) return

		this._autoplayTimer = window.setInterval(() => {
			this.next()
		}, this.autoplayInterval)
	}

	stopAutoplay() {
		if (!this._autoplayTimer) return
		window.clearInterval(this._autoplayTimer)
		this._autoplayTimer = null
	}

	renderBase() {
		if (this.isHeroMode) {
			this.innerHTML = `
				<div class="tiendu-carousel tiendu-carousel--hero">
					<div class="tiendu-carousel__stage">
						<div class="tiendu-carousel__viewport" data-role="viewport" data-dragging="false">
							<div class="tiendu-carousel__track" data-role="track"></div>
						</div>
						<div class="tiendu-carousel__hero-controls" data-role="hero-controls" aria-label="Controles del carrusel principal">
							<button class="tiendu-carousel__nav tiendu-carousel__action-surface" type="button" data-role="prev-image" aria-label="Slide anterior">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
							</button>
							<div class="tiendu-carousel__dots" data-role="dots" role="tablist" aria-label="Slides del hero"></div>
							<button class="tiendu-carousel__nav tiendu-carousel__action-surface" type="button" data-role="next-image" aria-label="Slide siguiente">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
							</button>
						</div>
					</div>
				</div>
			`
		} else {
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
		}

		this._track = this.querySelector('[data-role="track"]')
		this._viewport = this.querySelector('[data-role="viewport"]')
		this._openButton = this.querySelector('[data-role="open-lightbox"]')
		this._thumbs = this.querySelector('[data-role="thumbs"]')
		this._dots = this.querySelector('[data-role="dots"]')
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

		if (!this.isHeroMode) {
			this._viewport.addEventListener('click', this._boundOpenClick)
		}

		this._prevButton?.addEventListener('click', this._boundNavClick)
		this._nextButton?.addEventListener('click', this._boundNavClick)
		this._thumbs?.addEventListener('click', this._boundThumbClick)
		this._dots?.addEventListener('click', this._boundDotClick)

		if (this.isHeroMode) {
			this.addEventListener('mouseenter', this._boundPauseAutoplay)
			this.addEventListener('mouseleave', this._boundResumeAutoplay)
			this.addEventListener('focusin', this._boundPauseAutoplay)
			this.addEventListener('focusout', this._boundResumeAutoplay)
		}
	}

	unbindEvents() {
		this._viewport?.removeEventListener('pointerdown', this._boundPointerDown)
		this._viewport?.removeEventListener('pointermove', this._boundPointerMove)
		this._viewport?.removeEventListener('pointerup', this._boundPointerEnd)
		this._viewport?.removeEventListener('pointercancel', this._boundPointerEnd)
		this._viewport?.removeEventListener('click', this._boundOpenClick)

		this._prevButton?.removeEventListener('click', this._boundNavClick)
		this._nextButton?.removeEventListener('click', this._boundNavClick)
		this._thumbs?.removeEventListener('click', this._boundThumbClick)
		this._dots?.removeEventListener('click', this._boundDotClick)

		this.removeEventListener('mouseenter', this._boundPauseAutoplay)
		this.removeEventListener('mouseleave', this._boundResumeAutoplay)
		this.removeEventListener('focusin', this._boundPauseAutoplay)
		this.removeEventListener('focusout', this._boundResumeAutoplay)
	}

	renderSlides() {
		if (!this._track) return

		if (this.isHeroMode) {
			this._track.innerHTML = this._slides
				.map((slide, index) => {
					const hasImage = Boolean(slide.url)
					const desktopSource =
						slide.desktopUrl && slide.desktopUrl !== slide.url
							? `<source media="(min-width: 768px)" srcset="${escapeHtml(slide.desktopUrl)}" />`
							: ''
					const media = hasImage
						? `<picture class="tiendu-carousel__hero-media">${desktopSource}<img src="${escapeHtml(slide.url)}" alt="${escapeHtml(slide.alt || 'Slide')}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" /></picture>`
						: '<div class="tiendu-carousel__hero-media tiendu-carousel__hero-media--empty" aria-hidden="true"></div>'

					const cta =
						slide.ctaText && slide.href
							? `<tiendu-button class="tiendu-carousel__hero-cta" variant="primary" label="${escapeHtml(slide.ctaText)}" href="${escapeHtml(slide.href)}" aria-label="${escapeHtml(slide.ctaText)}" ${slide.newTab ? 'new-tab' : ''}></tiendu-button>`
							: ''

					const headingTag = index === 0 ? 'h1' : 'h2'

					return `
						<div class="tiendu-carousel__slide tiendu-carousel__slide--hero">
							${media}
							<div class="tiendu-carousel__hero-overlay"></div>
							<div class="tiendu-carousel__hero-content">
								<div class="container">
									<div class="tiendu-carousel__hero-content-inner">
										${slide.title ? `<${headingTag} class="tiendu-carousel__hero-title">${escapeHtml(slide.title)}</${headingTag}>` : ''}
										${slide.description ? `<p class="tiendu-carousel__hero-subtitle">${escapeHtml(slide.description)}</p>` : ''}
										${cta}
									</div>
								</div>
							</div>
						</div>
					`
				})
				.join('')
		} else {
			this._track.innerHTML = this._slides
				.map(
					slide =>
						`<div class="tiendu-carousel__slide"><img src="${escapeHtml(slide.url || FALLBACK_IMAGE_SRC)}" alt="${escapeHtml(slide.alt || '')}" loading="eager" /></div>`
				)
				.join('')
		}

		const hasMultiple = this._slides.length > 1

		if (this._prevButton) this._prevButton.hidden = !hasMultiple
		if (this._nextButton) this._nextButton.hidden = !hasMultiple

		if (this.isHeroMode) {
			if (!this._dots) return
			if (!hasMultiple) {
				this._dots.hidden = true
				this._dots.innerHTML = ''
				return
			}

			this._dots.hidden = false
			this._dots.innerHTML = this._slides
				.map(
					(_, index) =>
						`<button type="button" class="tiendu-carousel__dot ${index === this._currentIndex ? 'is-active' : ''}" data-dot-index="${index}" role="tab" aria-label="Ir al slide ${index + 1}" aria-selected="${index === this._currentIndex ? 'true' : 'false'}"></button>`
				)
				.join('')
			return
		}

		if (!this._thumbs) return
		this._thumbs.hidden = !hasMultiple

		if (!hasMultiple) {
			this._thumbs.innerHTML = ''
			return
		}

		this._thumbs.innerHTML = this._slides
			.map(
				(slide, index) =>
					`<button class="tiendu-carousel__thumb" type="button" data-thumb-index="${index}" aria-current="${index === this._currentIndex ? 'true' : 'false'}" aria-label="Ver imagen ${index + 1}"><img src="${escapeHtml(slide.url || FALLBACK_IMAGE_SRC)}" alt="${escapeHtml(slide.alt || '')}" loading="lazy" /></button>`
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

	syncDots() {
		if (!this._dots) return
		for (const button of this._dots.querySelectorAll('[data-dot-index]')) {
			const index = Number(button.getAttribute('data-dot-index'))
			const isActive = index === this._currentIndex
			button.classList.toggle('is-active', isActive)
			button.setAttribute('aria-selected', isActive ? 'true' : 'false')
		}
	}

	syncControls() {
		const hasMultiple = this._slides.length > 1

		if (this._prevButton) this._prevButton.hidden = !hasMultiple
		if (this._nextButton) this._nextButton.hidden = !hasMultiple

		if (this._prevButton) {
			this._prevButton.disabled = this.isHeroMode ? !hasMultiple : !hasMultiple || this._currentIndex === 0
		}
		if (this._nextButton) {
			this._nextButton.disabled = this.isHeroMode ? !hasMultiple : !hasMultiple || this._currentIndex === this.maxIndex
		}

		if (this._openButton) {
			this._openButton.disabled = !this._canOpenLightbox
		}
	}

	syncLightbox() {
		if (!this._lightbox || typeof this._lightbox.setImages !== 'function') return
		if (this.isHeroMode) {
			this._lightbox.setImages([])
			return
		}

		this._lightbox.setImages(
			this._slides.map(slide => ({
				id: slide.id,
				url: slide.url,
				alt: slide.alt
			}))
		)
	}
}

if (!customElements.get('tiendu-image-carousel')) {
	customElements.define('tiendu-image-carousel', TienduImageCarousel)
}

export {}
