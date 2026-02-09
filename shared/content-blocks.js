// @ts-nocheck

export const renderContentBlock = block => {
	if (!block || typeof block !== 'object') return null

	if (block.type === 'heading') {
		const level = Math.min(Math.max(Number(block.level) || 2, 1), 3)
		const heading = document.createElement(`h${level}`)
		heading.textContent = block.text || ''
		return heading
	}

	if (block.type === 'paragraph') {
		const paragraph = document.createElement('p')
		paragraph.textContent = block.text || ''
		return paragraph
	}

	if (block.type === 'image' && block.image?.url) {
		const figure = document.createElement('figure')
		if (block.align) figure.classList.add(`align-${block.align}`)
		if (block.size) figure.classList.add(`size-${block.size}`)
		const image = document.createElement('img')
		image.src = block.image.url
		image.alt = block.image.alt || ''
		image.loading = 'lazy'
		figure.appendChild(image)
		return figure
	}

	if (block.type === 'html' && block.code) {
		const wrapper = document.createElement('div')
		wrapper.innerHTML = block.code
		return wrapper
	}

	return null
}

export const renderContentBlocks = (container, blocks) => {
	if (!(container instanceof HTMLElement)) return
	container.innerHTML = ''

	if (!Array.isArray(blocks)) return

	for (const block of blocks) {
		const node = renderContentBlock(block)
		if (node) container.appendChild(node)
	}
}
