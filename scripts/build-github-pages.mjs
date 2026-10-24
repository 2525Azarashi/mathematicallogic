import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The HTML shell lives in public/index.html (shared by Vercel, Cloudflare worker, and GitHub Pages).
// GitHub Pages serves under /<repo>/, so rewrite absolute /static/ paths to relative ./static/.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = await readFile(resolve(root, 'public/index.html'), 'utf8')

const output = resolve(root, 'dist')
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(resolve(root, 'public/static'), resolve(output, 'static'), { recursive: true })
const html = source.replaceAll('href="/static/', 'href="./static/').replaceAll('src="/static/', 'src="./static/')
await writeFile(resolve(output, 'index.html'), html, 'utf8')
await writeFile(resolve(output, '.nojekyll'), '', 'utf8')
console.log('Generated GitHub Pages site in dist/')
