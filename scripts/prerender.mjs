/**
 * SEO Prerender Script
 *
 * Builds the app, starts a local server, and uses a headless browser
 * to capture static HTML for key routes. Output goes into dist/ so
 * each route gets its own index.html that search engines can index.
 *
 * Usage:
 *   node scripts/prerender.mjs              # after `npm run build`
 *   node scripts/prerender.mjs --routes /,/forum,/discovery
 *
 * Requires: puppeteer-core (npm i -D puppeteer-core)
 */

import { promises as fs } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const DIST = resolve(PROJECT_ROOT, 'dist')
const DIST_INDEX = resolve(DIST, 'index.html')

// Safety checks
if (!existsSync(DIST_INDEX)) {
  console.error(`❌ dist/index.html not found at ${DIST_INDEX}. Run "npm run build" first.`)
  process.exit(1)
}
console.log(`  Dist: ${DIST}`)

// ── Config ──
const ROUTES = process.argv.includes('--routes')
  ? process.argv[process.argv.indexOf('--routes') + 1].split(',')
  : [
      '/',
      '/home',
      '/discovery',
      '/forum',
      '/ranking',
      '/search',
      '/friend-links',
      '/contact',
      '/privacy',
      '/privacy-center',
      '/games',
      '/tools',
      '/ai_resource',
      '/loveboard',
      '/loveboard/list',
    ]

// ── Browser path ──
const BROWSER_PATHS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  process.env.CHROME_PATH,
  process.env.EDGE_PATH,
].filter(Boolean)

async function findBrowser() {
  for (const p of BROWSER_PATHS) {
    if (existsSync(p)) return p
  }
  throw new Error('No browser found. Install Chrome or Edge.')
}

// ── Static file server ──
function startServer(port = 4173) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const serve = (status, type, data) => {
        if (!res.headersSent) {
          res.writeHead(status, { 'Content-Type': type })
          res.end(data)
        }
      }
      try {
        const url = (req.url || '/').split('?')[0].split('#')[0]
        const filePath = url === '/' ? '/index.html' : url
        const cleanPath = filePath.replace(/^\//, '').replace(/\/$/, '') || 'index.html'
        const fullPath = resolve(DIST, cleanPath)

        if (existsSync(fullPath) && statSync(fullPath).isFile()) {
          serve(200, getContentType(fullPath), readFileSync(fullPath))
          return
        }
      } catch { /* fall through to SPA fallback */ }
      // SPA fallback for any unmatched route
      serve(200, 'text/html', readFileSync(DIST_INDEX))
    })
    server.listen(port, () => {
      console.log(`  Local server: http://localhost:${port}`)
      resolve(server)
    })
    server.on('error', reject)
  })
}

function getContentType(file) {
  const ext = file.split('.').pop()
  const map = { html: 'text/html', js: 'application/javascript', css: 'text/css', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', json: 'application/json', woff2: 'font/woff2' }
  return map[ext] || 'application/octet-stream'
}

// ── Main ──
async function main() {
  console.log('🚀 Starting prerender...\n')

  // Find browser
  const browserPath = await findBrowser()
  console.log(`  Browser: ${browserPath}`)

  // Start local server
  const server = await startServer()
  const BASE = 'http://localhost:4173'
  const puppeteer = await import('puppeteer-core')

  // Launch browser
  const browser = await puppeteer.default.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  let count = 0
  try {
    for (const route of ROUTES) {
      const url = `${BASE}${route}`
      console.log(`  📄 ${route}`)
      const page = await browser.newPage()

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        // Wait a bit for Vue to render
        await new Promise(r => setTimeout(r, 2000))

        const html = await page.content()
        // Inject prerender signal meta so Google knows this is static
        const finalHtml = html.replace('</head>', '<meta name="prerender-status" content="true">\n</head>')

        // Write to dist/{route}/index.html
        const dir = resolve(DIST, route.replace(/^\//, ''))
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(resolve(dir, 'index.html'), finalHtml, 'utf-8')
        count++
      } catch (err) {
        console.error(`    ⚠ Failed: ${err.message}`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
    server.close()
  }

  console.log(`\n✅ Prerendered ${count}/${ROUTES.length} routes → dist/`)
  console.log('   Googlebot / Bing / Baidu can now index each page as static HTML.')
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
