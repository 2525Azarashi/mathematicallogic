import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = await readFile(resolve(root, 'src/index.tsx'), 'utf8')
const match = source.match(/const page = `([\s\S]*?)`\s*\napp\.get\(/)
if (!match) throw new Error('Could not find the HTML shell in src/index.tsx')

const output = resolve(root, 'dist')
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(resolve(root, 'public/static'), resolve(output, 'static'), { recursive: true })
const html = match[1].replaceAll('href="/static/', 'href="./static/').replaceAll('src="/static/', 'src="./static/')
await writeFile(resolve(output, 'index.html'), `${html}\n`, 'utf8')
console.log('Generated GitHub Pages site in dist/')
