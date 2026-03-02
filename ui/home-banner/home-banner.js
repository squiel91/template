// @ts-nocheck

import '/ui/app-button/app-button.js'

const STYLE_ID = 'home-banner-styles'

const ensureStyles = () => {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `
		home-banner {
			display: block;
		}

		.home-banner {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: var(--space-8);
			align-items: stretch;
			background: var(--home-beige-soft);
			border: 1px solid #ebe1d1;
			border-radius: var(--radius-2xl);
			overflow: hidden;
		}

		.home-banner.is-empty {
			background: linear-gradient(140deg, var(--home-beige-soft) 0%, #ece5d8 100%);
		}

		.home-banner__media-wrap {
			position: relative;
			min-height: 280px;
		}

		.home-banner__media {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.home-banner__content {
			padding: clamp(1.25rem, 3vw, 2.2rem);
			display: grid;
			align-content: center;
			gap: var(--space-4);
			color: var(--home-ink);
		}

		.home-banner__eyebrow {
			font-size: var(--text-xs);
			font-weight: 700;
			letter-spacing: 0.09em;
			text-transform: uppercase;
			color: var(--home-earth);
		}

		.home-banner__content h2 {
			font-family: 'Suez One', serif;
			font-weight: 400;
			font-size: clamp(1.45rem, 2.5vw, 2rem);
			line-height: 1.25;
			color: var(--home-ink);
		}

		.home-banner__content p {
			color: #3f3f36;
			max-width: 56ch;
		}

		.home-banner__cta {
			justify-self: start;
		}

		@media (max-width: 768px) {
			.home-banner {
				grid-template-columns: minmax(0, 1fr);
				gap: 0;
			}

			.home-banner__media-wrap {
				min-height: 220px;
			}
		}
	`
	document.head.appendChild(style)
}

const FALLBACK_IMAGE_SRC = '/public/no-image.svg'

class HomeBanner extends HTMLElement {
	constructor() {
		super()
		this._data = null
	}

	connectedCallback() {
		ensureStyles()
		this.render()
	}

	setData(data) {
		this._data = data && typeof data === 'object' ? data : null
		this.render()
	}

	render() {
		const data = this._data
		if (!data || !data.title) {
			this.innerHTML = ''
			return
		}

		const imageUrl =
			(typeof data.image === 'string' ? data.image.trim() : data.image?.url?.trim()) || ''
		const imageAlt = data.image?.alt?.trim() || data.title
		const tag = typeof data.tag === 'string' ? data.tag.trim() : ''
		const description = typeof data.description === 'string' ? data.description.trim() : ''
		const ctaText = typeof data.ctaText === 'string' ? data.ctaText.trim() : ''

		let href = ''
		const path = typeof data.ctaPath === 'string' ? data.ctaPath.trim() : ''
		const url = typeof data.ctaUrl === 'string' ? data.ctaUrl.trim() : ''
		if (/^https?:\/\//i.test(url)) {
			href = url
		} else if (path.startsWith('/')) {
			href = path
		} else if (/^https?:\/\//i.test(path)) {
			href = path
		}

		const section = document.createElement('section')
		section.className = imageUrl ? 'home-banner' : 'home-banner is-empty'

		const mediaWrap = document.createElement('div')
		mediaWrap.className = 'home-banner__media-wrap'

		const img = document.createElement('img')
		img.className = 'home-banner__media'
		img.src = imageUrl || FALLBACK_IMAGE_SRC
		img.alt = imageAlt
		img.loading = 'lazy'
		img.decoding = 'async'

		mediaWrap.appendChild(img)
		section.appendChild(mediaWrap)

		const content = document.createElement('div')
		content.className = 'home-banner__content'

		if (tag) {
			const eyebrow = document.createElement('p')
			eyebrow.className = 'home-banner__eyebrow'
			eyebrow.textContent = tag
			content.appendChild(eyebrow)
		}

		const title = document.createElement('h2')
		title.textContent = data.title
		content.appendChild(title)

		if (description) {
			const desc = document.createElement('p')
			desc.textContent = description
			content.appendChild(desc)
		}

		if (ctaText && href) {
			const cta = document.createElement('tiendu-button')
			cta.className = 'home-banner__cta'
			cta.setAttribute('variant', 'primary')
			cta.setAttribute('size', 'xl')
			cta.setAttribute('label', ctaText)
			cta.setAttribute('href', href)
			if (/^https?:\/\//i.test(href)) {
				cta.setAttribute('new-tab', '')
			}
			content.appendChild(cta)
		}

		section.appendChild(content)
		this.innerHTML = ''
		this.appendChild(section)
	}
}

if (!customElements.get('home-banner')) {
	customElements.define('home-banner', HomeBanner)
}

export {}
