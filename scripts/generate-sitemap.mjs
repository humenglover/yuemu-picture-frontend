/**
 * 完整 Sitemap 生成脚本
 *
 * 功能：
 * 1. 生成所有静态路由的双语 sitemap 条目（zh + en，带 hreflang）
 * 2. 自动注入指南文章（从 articles 目录发现）
 * 3. 从后端 API 拉取动态内容（图片、空间、用户、帖子、活动等）
 * 4. 输出完整的 public/sitemap.xml
 *
 * 使用方式：
 *   node scripts/generate-sitemap.mjs                 # 完整生成（静态 + 动态）
 *   node scripts/generate-sitemap.mjs --static-only   # 仅静态路由 + 指南文章
 *
 * 建议在 CI/CD 中定时运行（如每天一次），确保新内容被搜索引擎收录。
 */

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverArticles } from './guide-articles.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

// ==================== 配置 ====================
const CONFIG = {
  apiBase: process.env.API_BASE || 'https://www.yuemutuku.com',
  siteUrl: 'https://www.yuemutuku.com',
  maxPerType: 5000,
  requestDelay: 200,
  outputDir: resolve(PROJECT_ROOT, 'public'),
  outputPath: resolve(PROJECT_ROOT, 'public', 'sitemap.xml'),
}

// ==================== 静态路由定义 ====================
// { path, changefreq, priority } — path 不含 locale 前缀，脚本自动生成 zh/en 两条
const STATIC_ROUTES = [
  // 首页
  { path: '/', changefreq: 'hourly', priority: '1.0' },
  { path: '/home', changefreq: 'hourly', priority: '0.9' },

  // 发现 & 搜索
  { path: '/discovery', changefreq: 'daily', priority: '0.9' },
  { path: '/search', changefreq: 'daily', priority: '0.8' },
  { path: '/search_picture', changefreq: 'daily', priority: '0.8' },
  { path: '/guess_you_like', changefreq: 'daily', priority: '0.8' },

  // 社区
  { path: '/forum', changefreq: 'hourly', priority: '0.9' },
  { path: '/ranking', changefreq: 'daily', priority: '0.8' },
  { path: '/barrage', changefreq: 'hourly', priority: '0.6' },

  // 创作入口
  { path: '/add_picture', changefreq: 'weekly', priority: '0.6' },
  { path: '/add_picture/batch', changefreq: 'weekly', priority: '0.5' },
  { path: '/add_space', changefreq: 'weekly', priority: '0.6' },

  // 版权
  { path: '/picture/copyright/trace', changefreq: 'weekly', priority: '0.6' },
  { path: '/picture/copyright/register', changefreq: 'weekly', priority: '0.6' },

  // 邀请 & 创作者
  { path: '/invite', changefreq: 'weekly', priority: '0.6' },
  { path: '/creator/analytics', changefreq: 'weekly', priority: '0.6' },

  // AI 资源
  { path: '/ai_resource', changefreq: 'daily', priority: '0.7' },

  // 恋爱画板
  { path: '/loveboard', changefreq: 'daily', priority: '0.7' },
  { path: '/loveboard/list', changefreq: 'daily', priority: '0.7' },

  // 工具
  { path: '/tools', changefreq: 'weekly', priority: '0.6' },
  { path: '/tools/calculator', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/timer', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/food-wheel', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/sticky-wall', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/pomodoro', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/random', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/base-converter', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/unit-converter', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/text-lab', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/vault-key', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/grid-ruler', changefreq: 'monthly', priority: '0.4' },
  { path: '/tools/color-picker', changefreq: 'monthly', priority: '0.4' },

  // 用户（公开页）
  { path: '/user/login', changefreq: 'monthly', priority: '0.3' },
  { path: '/user/register', changefreq: 'monthly', priority: '0.3' },

  // 友情链接
  { path: '/friend-links', changefreq: 'weekly', priority: '0.6' },

  // 关于 & 指南 & 联系 & 隐私
  { path: '/about', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy-center', changefreq: 'monthly', priority: '0.5' },

  // 游戏
  { path: '/games', changefreq: 'weekly', priority: '0.5' },
  { path: '/games/snake', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/2048', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/queens', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/tetris', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/sliding-puzzle', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/color-challenge', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/link-link', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/brick', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/dino', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/memory-card', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/minesweeper', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/sbti', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/aa-game', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/sudoku', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/box-jump', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/maze-runner', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/tank-battle', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/cat-trap', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/whack-mole', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/plane-war', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/draw-line', changefreq: 'monthly', priority: '0.3' },
  { path: '/games/fruit-slice', changefreq: 'monthly', priority: '0.3' },
]

// ==================== HTTP 工具 ====================
async function apiGet(path) {
  const url = `${CONFIG.apiBase}${path}`
  console.log(`  GET ${url}`)
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) { console.error(`  ⚠ 请求失败: ${res.status}`); return null }
  return res.json()
}

async function apiPost(path, body = {}) {
  const url = `${CONFIG.apiBase}${path}`
  console.log(`  POST ${url}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) { console.error(`  ⚠ 请求失败: ${res.status}`); return null }
  return res.json()
}

// ==================== 数据拉取 ====================
async function fetchAllPages(fetchFn, pageSize = 100) {
  const items = []
  let current = 1
  let hasMore = true
  while (hasMore && items.length < CONFIG.maxPerType) {
    try {
      const data = await fetchFn(current, pageSize)
      if (!data) break
      const records = data?.data?.records || data?.records || data?.data || []
      const total = data?.data?.total || data?.total || 0
      if (records.length === 0) break
      items.push(...records)
      console.log(`    已获取 ${items.length}/${Math.min(total, CONFIG.maxPerType)} 条`)
      if (items.length >= total || records.length < pageSize) { hasMore = false }
      else { current++; await sleep(CONFIG.requestDelay) }
    } catch (err) { console.error(`    分页拉取出错: ${err.message}`); break }
  }
  return items
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchPictures() {
  console.log('\n📷 拉取公开图片...')
  return fetchAllPages((current, size) =>
    apiPost('/api/picture/list/page/vo/cache', { current, size, sortField: 'createTime', sortOrder: 'desc' }))
}
async function fetchSpaces() {
  console.log('\n🌌 拉取公开空间...')
  return fetchAllPages((current, size) =>
    apiPost('/api/space/list/page', { current, size, sortField: 'createTime', sortOrder: 'desc' }))
}
async function fetchUsers() {
  console.log('\n👤 拉取用户...')
  return fetchAllPages((current, size) =>
    apiPost('/api/user/list/page/vo', { current, size, sortField: 'id', sortOrder: 'desc' }))
}
async function fetchPosts() {
  console.log('\n📝 拉取公开帖子...')
  return fetchAllPages((current, size) =>
    apiPost('/api/post/list/page', { current, size, sortField: 'createTime', sortOrder: 'desc' }))
}
async function fetchActivities() {
  console.log('\n🎉 拉取活动...')
  return fetchAllPages((current, size) =>
    apiPost('/api/activity/list/page', { current, size, sortField: 'createTime', sortOrder: 'desc' }))
}
async function fetchLoveBoards() {
  console.log('\n💕 拉取恋爱画板...')
  return fetchAllPages((current, size) =>
    apiGet(`/api/love-board/list/public?current=${current}&size=${size}`))
}
async function fetchTimeAlbums() {
  console.log('\n📸 拉取时光相册...')
  return fetchAllPages((current, size) =>
    apiGet(`/api/timeAlbum/list?current=${current}&size=${size}`))
}

// ==================== XML 工具 ====================
function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** 生成一个页面的双语 sitemap 条目（zh + en，带 hreflang） */
function makeBilingualEntries({ zhLoc, enLoc, changefreq, priority, lastmod, imageXml }) {
  const lastmodStr = lastmod ? new Date(lastmod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  const hreflang = [
    `<xhtml:link rel="alternate" hreflang="zh-CN" href="${escapeXml(zhLoc)}"/>`,
    `<xhtml:link rel="alternate" hreflang="en-US" href="${escapeXml(enLoc)}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(zhLoc)}"/>`,
  ].join('')

  const zhEntry = imageXml
    ? `  <url><loc>${escapeXml(zhLoc)}</loc>${hreflang}<lastmod>${lastmodStr}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority>${imageXml}</url>`
    : `  <url><loc>${escapeXml(zhLoc)}</loc>${hreflang}<lastmod>${lastmodStr}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`

  const enEntry = imageXml
    ? `  <url><loc>${escapeXml(enLoc)}</loc>${hreflang}<lastmod>${lastmodStr}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority>${imageXml}</url>`
    : `  <url><loc>${escapeXml(enLoc)}</loc>${hreflang}<lastmod>${lastmodStr}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`

  return `${zhEntry}\n${enEntry}`
}

/** 生成完整 sitemap XML */
function wrapSitemap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`
}

// ==================== 静态路由条目生成 ====================
function generateStaticEntries() {
  return STATIC_ROUTES.flatMap(r => {
    const cleanPath = r.path === '/' ? '/' : r.path
    return [makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh${cleanPath}`,
      enLoc: `${CONFIG.siteUrl}/en${cleanPath}`,
      changefreq: r.changefreq,
      priority: r.priority,
    })]
  })
}

// ==================== 指南文章条目生成 ====================
function generateGuideEntries() {
  const articles = discoverArticles()
  if (articles.length === 0) {
    console.log('  ⚠ 未发现指南文章')
    return []
  }
  return articles.flatMap(a => {
    const lastmod = a.date || new Date().toISOString().split('T')[0]
    return [makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh/guides/${a.id}`,
      enLoc: `${CONFIG.siteUrl}/en/guides/${a.id}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod,
    })]
  })
}

// ==================== 动态内容条目生成 ====================
function generateDynamicEntries({ pictures, spaces, users, posts, activities, loveBoards, timeAlbums }) {
  const entries = []

  // 图片（带 image:image 子标签，提升 Google 图片搜索收录）
  for (const pic of pictures) {
    const lastmod = pic.updateTime || pic.createTime
    let imageXml = ''
    if (pic.url) {
      const imageLoc = pic.url.startsWith('http') ? pic.url : `${CONFIG.siteUrl}${pic.url}`
      const title = pic.name || pic.title || ''
      const caption = pic.introduction || pic.description || ''
      imageXml = `<image:image><image:loc>${escapeXml(imageLoc)}</image:loc>`
      if (title) imageXml += `<image:title>${escapeXml(title)}</image:title>`
      if (caption) imageXml += `<image:caption>${escapeXml(caption.substring(0, 200))}</image:caption>`
      imageXml += `</image:image>`
    }
    entries.push(makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh/picture/${pic.id}`,
      enLoc: `${CONFIG.siteUrl}/en/picture/${pic.id}`,
      changefreq: 'weekly', priority: '0.8', lastmod, imageXml,
    }))
  }

  // 空间
  for (const item of spaces) {
    entries.push(makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh/space/${item.id}`,
      enLoc: `${CONFIG.siteUrl}/en/space/${item.id}`,
      changefreq: 'daily', priority: '0.7',
      lastmod: item.updateTime || item.createTime,
    }))
  }

  // 用户
  for (const item of users) {
    entries.push(makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh/user/${item.id}`,
      enLoc: `${CONFIG.siteUrl}/en/user/${item.id}`,
      changefreq: 'weekly', priority: '0.5',
      lastmod: item.updateTime || item.createTime,
    }))
  }

  // 帖子
  for (const item of posts) {
    entries.push(makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh/post/${item.id}`,
      enLoc: `${CONFIG.siteUrl}/en/post/${item.id}`,
      changefreq: 'daily', priority: '0.7',
      lastmod: item.updateTime || item.createTime || item.editTime,
    }))
  }

  // 活动
  for (const item of activities) {
    entries.push(makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh/activity/detail/${item.id}`,
      enLoc: `${CONFIG.siteUrl}/en/activity/detail/${item.id}`,
      changefreq: 'daily', priority: '0.7',
      lastmod: item.updateTime || item.createTime,
    }))
  }

  // 恋爱画板
  for (const item of loveBoards) {
    entries.push(makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh/loveboard/${item.id}`,
      enLoc: `${CONFIG.siteUrl}/en/loveboard/${item.id}`,
      changefreq: 'weekly', priority: '0.6',
      lastmod: item.updateTime || item.createTime,
    }))
  }

  // 时光相册
  for (const item of timeAlbums) {
    entries.push(makeBilingualEntries({
      zhLoc: `${CONFIG.siteUrl}/zh/time-album/${item.id}`,
      enLoc: `${CONFIG.siteUrl}/en/time-album/${item.id}`,
      changefreq: 'weekly', priority: '0.6',
      lastmod: item.updateTime || item.createTime,
    }))
  }

  return entries
}

// ==================== 主流程 ====================
async function main() {
  const staticOnly = process.argv.includes('--static-only')

  console.log('🚀 开始生成 Sitemap...\n')
  console.log(`   网站域名: ${CONFIG.siteUrl}`)

  // 1. 静态路由条目
  console.log('\n📋 生成静态路由条目...')
  const staticEntries = generateStaticEntries()
  console.log(`   ✅ ${STATIC_ROUTES.length} 个静态路由 → ${staticEntries.length} 条双语条目（每个 zh+en 各一条）`)

  // 2. 指南文章条目
  console.log('\n📚 生成指南文章条目...')
  const guideEntries = generateGuideEntries()
  const articleCount = guideEntries.length
  console.log(`   ✅ ${articleCount} 篇文章 → ${articleCount} 条双语条目（每个 zh+en 各一条）`)

  let allEntries = [...staticEntries, ...guideEntries]

  // 3. 动态内容（非 --static-only 模式）
  if (!staticOnly) {
    console.log(`\n📡 拉取动态内容（每类型上限 ${CONFIG.maxPerType} 条）...`)

    const [pictures, spaces, users, posts, activities, loveBoards, timeAlbums] =
      await Promise.all([
        fetchPictures(), fetchSpaces(), fetchUsers(), fetchPosts(),
        fetchActivities(), fetchLoveBoards(), fetchTimeAlbums(),
      ])

    const dynamicEntries = generateDynamicEntries({
      pictures, spaces, users, posts, activities, loveBoards, timeAlbums,
    })
    console.log(`\n   ✅ 动态内容 → ${dynamicEntries.length} 条双语条目`)
    allEntries = [...allEntries, ...dynamicEntries]

    console.log('\n📊 统计数据:')
    console.log(`   图片:      ${pictures.length} 条`)
    console.log(`   空间:      ${spaces.length} 条`)
    console.log(`   用户:      ${users.length} 条`)
    console.log(`   帖子:      ${posts.length} 条`)
    console.log(`   活动:      ${activities.length} 条`)
    console.log(`   恋爱画板:  ${loveBoards.length} 条`)
    console.log(`   时光相册:  ${timeAlbums.length} 条`)
  }

  // 4. 写入 sitemap.xml
  const sitemap = wrapSitemap(allEntries)
  writeFileSync(CONFIG.outputPath, sitemap, 'utf-8')
  console.log(`\n✅ Sitemap 已保存: ${CONFIG.outputPath}`)
  console.log(`   总计: ${allEntries.length} 条 URL 条目`)
  console.log(`   提交到 Google Search Console: ${CONFIG.siteUrl}/sitemap.xml`)
  console.log('🎉 生成完毕!')
}

main().catch(err => {
  console.error('❌ 生成 sitemap 失败:', err)
  process.exit(1)
})
