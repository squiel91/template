#!/usr/bin/env node

import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const ROOT = path.resolve(process.cwd(), 'storefronts/30')
const PARTIALS_DIR = path.join(ROOT, 'snippets')

const args = process.argv.slice(2)
const command = args[0] || 'help'

const printHelp = () => {
	console.log(`Usage:
  node storefronts/30/scripts/discover-icons.mjs local
  node storefronts/30/scripts/discover-icons.mjs search <lucide|heroicons> <term>
  node storefronts/30/scripts/discover-icons.mjs tags <lucide|heroicons>
  node storefronts/30/scripts/discover-icons.mjs variants <lucide|heroicons>

Examples:
  node storefronts/30/scripts/discover-icons.mjs local
  node storefronts/30/scripts/discover-icons.mjs search lucide arrow
  node storefronts/30/scripts/discover-icons.mjs search heroicons user
  node storefronts/30/scripts/discover-icons.mjs tags lucide
  node storefronts/30/scripts/discover-icons.mjs variants heroicons
`)
}

const listLocalIcons = async () => {
	const entries = await readdir(PARTIALS_DIR)
	const icons = entries
		.filter(name => name.startsWith('icon-') && name.endsWith('.liquid'))
		.map(name => name.replace(/^icon-/, '').replace(/\.liquid$/, ''))
		.sort()

	console.log(`Local icon snippets in ${path.relative(process.cwd(), PARTIALS_DIR)}:`)
	for (const icon of icons) console.log(`- ${icon}`)
}

const runSis = sisArgs =>
	new Promise((resolve, reject) => {
		const child = spawn('npx', ['@ckreidl/sis', ...sisArgs], {
			stdio: 'inherit',
			shell: process.platform === 'win32'
		})

		child.on('exit', code => {
			if (code === 0) resolve()
			else reject(new Error(`sis exited with code ${code}`))
		})
	})

if (command === 'help' || command === '--help' || command === '-h') {
	printHelp()
	process.exit(0)
}

if (command === 'local') {
	await listLocalIcons()
	process.exit(0)
}

if (command === 'search') {
	const [library, term] = args.slice(1)
	if (!library || !term) {
		printHelp()
		process.exit(1)
	}
	await runSis(['search', library, term])
	process.exit(0)
}

if (command === 'tags') {
	const [library] = args.slice(1)
	if (!library) {
		printHelp()
		process.exit(1)
	}
	await runSis(['tags', library])
	process.exit(0)
}

if (command === 'variants') {
	const [library] = args.slice(1)
	if (!library) {
		printHelp()
		process.exit(1)
	}
	await runSis(['variants', library])
	process.exit(0)
}

printHelp()
process.exit(1)
