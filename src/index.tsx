import { Hono } from 'hono'
// single source of truth: the same shell is served statically (Vercel / any static host) and by the worker (Cloudflare Pages)
import page from '../public/index.html?raw'

const app = new Hono()
app.get('/', (c) => c.html(page))

export default app
