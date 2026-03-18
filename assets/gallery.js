// @ts-nocheck

const SWIPE_PROGRESS_THRESHOLD = 0.25

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export const createProductGallery = root => {
	if (!(root instanceof HTMLElement)) return null

	const viewport = root.querySelector('[data-role="viewport"]')
	const track = root.querySelector('[data-role="track"]')
	const openButton = root.querySelector('[data-role="open-lightbox"]')
	const thumbs = root.querySelector('[data-role="thumbs"]')
	const prevButton = root.querySelector('[data-role="prev-image"]')
	const nextButton = root.querySelector('[data-role="next-image"]')
	const lightbox = document.getElementById('product-gallery-lightbox')
	const lightboxImage = lightbox?.querySelector('[data-role="lightbox-image"]')
	const backdrop = lightbox?.querySelector('[data-role="backdrop"]')
	const content = lightbox?.querySelector('[data-role="content"]')
	const closeButton = lightbox?.querySelector('[data-role="close-lightbox"]')
	const slides = Array.from(track?.querySelectorAll('[data-product-gallery-slide]') || [])
	const images = slides.map(slide => {
		const image = slide.querySelector('img')
		return {
			id: Number(slide.dataset.imageId) || null,
			url: image?.getAttribute('src') || '',
			alt: image?.getAttribute('alt') || ''
		}
	})

	if (!(viewport instanceof HTMLElement) || !(track instanceof HTMLElement) || images.length === 0) {
		return null
	}

	let currentIndex = 0
	let closeTimer = null
	let suppressClick = false
	const drag = {
		active: false,
		pointerId: null,
		startX: 0,
		offsetX: 0
	}

	const maxIndex = Math.max(0, images.length - 1)
	const slideWidth = () => viewport.clientWidth || 1
	const canOpenLightbox = images.some(image => image.url)

	const syncThumbs = () => {
		if (!(thumbs instanceof HTMLElement)) return
		for (const button of thumbs.querySelectorAll('[data-thumb-index]')) {
			const index = Number(button.getAttribute('data-thumb-index'))
			button.setAttribute('aria-current', index === currentIndex ? 'true' : 'false')
		}
	}

	const syncControls = () => {
		const hasMultiple = images.length > 1
		if (prevButton instanceof HTMLButtonElement) {
			prevButton.hidden = !hasMultiple
			prevButton.disabled = !hasMultiple || currentIndex === 0
		}
		if (nextButton instanceof HTMLButtonElement) {
			nextButton.hidden = !hasMultiple
			nextButton.disabled = !hasMultiple || currentIndex === maxIndex
		}
		if (thumbs instanceof HTMLElement) thumbs.hidden = !hasMultiple
		if (openButton instanceof HTMLButtonElement) openButton.disabled = !canOpenLightbox
	}

	const updateTrack = ({ animate }) => {
		const baseTranslate = -currentIndex * slideWidth()
		const dragOffset = drag.active ? drag.offsetX : 0
		track.style.transition = animate && !drag.active ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none'
		track.style.transform = `translate3d(${baseTranslate + dragOffset}px, 0, 0)`
	}

	const syncLightboxImage = () => {
		if (!(lightboxImage instanceof HTMLImageElement)) return
		const current = images[currentIndex]
		if (!current) return
		lightboxImage.src = current.url
		lightboxImage.alt = current.alt
	}

	const goTo = (index, { animate = true, force = false } = {}) => {
		const nextIndex = clamp(index, 0, maxIndex)
		if (nextIndex === currentIndex && !drag.active && !force) return
		currentIndex = nextIndex
		syncThumbs()
		syncControls()
		updateTrack({ animate })
		syncLightboxImage()
	}

	const resolveReleaseIndex = offsetX => {
		const threshold = Math.max(slideWidth(), 1) * SWIPE_PROGRESS_THRESHOLD
		if (Math.abs(offsetX) < threshold) return currentIndex
		if (offsetX < 0) return clamp(currentIndex + 1, 0, maxIndex)
		if (offsetX > 0) return clamp(currentIndex - 1, 0, maxIndex)
		return currentIndex
	}

	const openLightbox = () => {
		if (!(lightbox instanceof HTMLElement) || !canOpenLightbox) return
		if (closeTimer) {
			clearTimeout(closeTimer)
			closeTimer = null
		}
		syncLightboxImage()
		lightbox.hidden = false
		lightbox.dataset.state = 'open'
		document.body.style.overflow = 'hidden'
	}

	const closeLightbox = () => {
		if (!(lightbox instanceof HTMLElement) || lightbox.hidden || lightbox.dataset.state === 'closing') return
		lightbox.dataset.state = 'closing'
		if (closeTimer) clearTimeout(closeTimer)
		closeTimer = window.setTimeout(() => {
			lightbox.hidden = true
			delete lightbox.dataset.state
			document.body.style.overflow = ''
			closeTimer = null
		}, 180)
	}

	const handlePointerDown = event => {
		if (images.length < 2) return
		if (event.button !== undefined && event.button !== 0) return
		drag.active = true
		drag.pointerId = event.pointerId
		drag.startX = event.clientX
		drag.offsetX = 0
		viewport.setPointerCapture?.(event.pointerId)
		viewport.dataset.dragging = 'true'
		updateTrack({ animate: false })
	}

	const handlePointerMove = event => {
		if (!drag.active) return
		if (drag.pointerId !== null && event.pointerId !== drag.pointerId) return
		const rawDelta = event.clientX - drag.startX
		let delta = rawDelta
		if ((currentIndex === 0 && rawDelta > 0) || (currentIndex === maxIndex && rawDelta < 0)) {
			delta = rawDelta * 0.35
		}
		drag.offsetX = delta
		updateTrack({ animate: false })
	}

	const handlePointerEnd = event => {
		if (!drag.active) return
		if (drag.pointerId !== null && event.pointerId !== drag.pointerId) return
		viewport.releasePointerCapture?.(event.pointerId)
		viewport.dataset.dragging = 'false'
		const moved = Math.abs(drag.offsetX)
		const nextIndex = resolveReleaseIndex(drag.offsetX)
		drag.active = false
		drag.pointerId = null
		drag.offsetX = 0
		suppressClick = moved > 6
		goTo(nextIndex, { animate: true, force: true })
	}

	const handleOpenClick = event => {
		if (suppressClick) {
			event.preventDefault()
			event.stopPropagation()
			suppressClick = false
			return
		}
		openLightbox()
	}

	viewport.addEventListener('pointerdown', handlePointerDown)
	viewport.addEventListener('pointermove', handlePointerMove)
	viewport.addEventListener('pointerup', handlePointerEnd)
	viewport.addEventListener('pointercancel', handlePointerEnd)
	viewport.addEventListener('click', handleOpenClick)
	prevButton?.addEventListener('click', () => goTo(currentIndex - 1, { animate: true }))
	nextButton?.addEventListener('click', () => goTo(currentIndex + 1, { animate: true }))
	thumbs?.addEventListener('click', event => {
		const button = event.target instanceof Element ? event.target.closest('[data-thumb-index]') : null
		if (!(button instanceof HTMLButtonElement)) return
		const index = Number(button.dataset.thumbIndex)
		if (!Number.isFinite(index)) return
		goTo(index, { animate: true })
	})
	backdrop?.addEventListener('click', closeLightbox)
	closeButton?.addEventListener('click', closeLightbox)
	content?.addEventListener('click', event => {
		if (event.target === event.currentTarget) closeLightbox()
	})
	document.addEventListener('keydown', event => {
		if (event.key === 'Escape') closeLightbox()
	})
	new ResizeObserver(() => updateTrack({ animate: false })).observe(viewport)

	syncThumbs()
	syncControls()
	syncLightboxImage()
	updateTrack({ animate: false })

	return {
		setCurrentImageById(imageId) {
			if (imageId == null) return
			const index = images.findIndex(image => image.id === Number(imageId))
			if (index < 0) return
			goTo(index, { animate: true })
		}
	}
}
