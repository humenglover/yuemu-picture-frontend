/**
 * 动态 Sitemap 生成脚本
 *
 * 功能：
 * 1. 从后端 API 拉取所有公开的动态内容（图片、空间、用户、帖子、活动、时光相册、恋爱画板）
 * 2. 生成 sitemap-dynamic.xml（动态路由条目）
 * 3. 与 public/sitemap.xml（静态路由）合并为完整的 sitemap
 *
 * 使用方式：
 *   node scripts/generate-sitemap.mjs
 *   node scripts/generate-sitemap.mjs --output public/sitemap.xml  # 生成完整 sitemap
 *
 * 建议在 CI/CD 中定时运行（如每天一次），确保新内容被搜索引擎收录。
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

// ==================== 配置 ====================
const CONFIG = {
  // 后端 API 地址（根据环境调整）
  apiBase: process.env.API_BASE || 'https://www.yuemutuku.com',
  // 网站域名
  siteUrl: 'https://www.yuemutuku.com',
  // 每个类型最多拉取条数（避免 sitemap 过大，Google 限制单文件 50000 条）
  maxPerType: 5000,
  // 请求间隔（ms），避免打爆服务器
  requestDelay: 200,
  // 输出路径
  outputDir: resolve(PROJECT_ROOT, 'public'),
}

// ==================== HTTP 工具 ====================
async function apiGet(path) {
  const url = `${CONFIG.apiBase}${path}`
  console.log(`  GET ${url}`)
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) {
    console.error(`  ⚠ 请求失败: ${res.status} ${res.statusText}`)
    return null
  }
  return res.json()
}

async function apiPost(path, body = {}) {
  const url = `${CONFIG.apiBase}${path}`
  console.log(`  POST ${url}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    console.error(`  ⚠ 请求失败: ${res.status} ${res.statusText}`)
    return null
  }
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

      // 适配不同的后端响应格式
      const records = data?.data?.records || data?.records || data?.data || []
      const total = data?.data?.total || data?.total || 0

      if (records.length === 0) break

      items.push(...records)
      console.log(`    已获取 ${items.length}/${Math.min(total, CONFIG.maxPerType)} 条`)

      if (items.length >= total || records.length < pageSize) {
        hasMore = false
      } else {
        current++
        // 请求间隔
        await sleep(CONFIG.requestDelay)
      }
    } catch (err) {
      console.error(`    分页拉取出错: ${err.message}`)
      break
    }
  }

  return items
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ==================== 各类型数据拉取 ====================

/** 拉取公开图片 */
async function fetchPictures() {
  console.log('\n📷 拉取公开图片...')
  return fetchAllPages((current, size) =>
    apiPost('/api/picture/list/page/vo/cache', {
      current,
      size,
      sortField: 'createTime',
      sortOrder: 'desc',
    })
  )
}

/** 拉取公开空间 */
async function fetchSpaces() {
  console.log('\n🌌 拉取公开空间...')
  return fetchAllPages((current, size) =>
    apiPost('/api/space/list/page', {
      current,
      size,
      sortField: 'createTime',
      sortOrder: 'desc',
    })
  )
}

/** 拉取用户 */
async function fetchUsers() {
  console.log('\n👤 拉取用户...')
  return fetchAllPages((current, size) =>
    apiPost('/api/user/list/page/vo', {
      current,
      size,
      sortField: 'id',
      sortOrder: 'desc',
    })
  )
}

/** 拉取公开帖子 */
async function fetchPosts() {
  console.log('\n📝 拉取公开帖子...')
  return fetchAllPages((current, size) =>
    apiPost('/api/post/list/page', {
      current,
      size,
      sortField: 'createTime',
      sortOrder: 'desc',
    })
  )
}

/** 拉取活动 */
async function fetchActivities() {
  console.log('\n🎉 拉取活动...')
  return fetchAllPages((current, size) =>
    apiPost('/api/activity/list/page', {
      current,
      size,
      sortField: 'createTime',
      sortOrder: 'desc',
    })
  )
}

/** 拉取公开恋爱画板 */
async function fetchLoveBoards() {
  console.log('\n💕 拉取恋爱画板...')
  return fetchAllPages((current, size) =>
    apiGet(`/api/love-board/list/public?current=${current}&size=${size}`)
  )
}

/** 拉取时光相册 */
async function fetchTimeAlbums() {
  console.log('\n📸 拉取时光相册...')
  return fetchAllPages((current, size) =>
    apiGet(`/api/timeAlbum/list?current=${current}&size=${size}`)
  )
}

// ==================== Sitemap 生成 ====================

/** 生成单个 URL 条目 */
function urlEntry(loc, { changefreq = 'weekly', priority = '0.6', lastmod } = {}) {
  const lastmodStr = lastmod
    ? new Date(lastmod).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmodStr}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** 生成完整 sitemap XML */
function generateSitemapXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`
}

/** 从 items 生成指定类型的 sitemap entries */
function makeEntries(items, pathPrefix, { changefreq = 'weekly', priority = '0.6' } = {}) {
  return items.map(item => {
    const id = item.id
    const loc = `${CONFIG.siteUrl}${pathPrefix}${id}`
    return urlEntry(loc, {
      changefreq,
      priority,
      lastmod: item.updateTime || item.createTime || item.editTime,
    })
  })
}

// ==================== 主流程 ====================

async function main() {
  console.log('🚀 开始生成动态 Sitemap...\n')
  console.log(`   后端 API: ${CONFIG.apiBase}`)
  console.log(`   网站域名: ${CONFIG.siteUrl}`)
  console.log(`   每类型上限: ${CONFIG.maxPerType} 条`)

  // 并行拉取所有类型的数据
  const [
    pictures,
    spaces,
    users,
    posts,
    activities,
    loveBoards,
    timeAlbums,
  ] = await Promise.all([
    fetchPictures(),
    fetchSpaces(),
    fetchUsers(),
    fetchPosts(),
    fetchActivities(),
    fetchLoveBoards(),
    fetchTimeAlbums(),
  ])

  // 生成动态 sitemap entries
  const dynamicEntries = [
    ...makeEntries(pictures, '/picture/', { changefreq: 'daily', priority: '0.8' }),
    ...makeEntries(spaces, '/space/', { changefreq: 'daily', priority: '0.7' }),
    ...makeEntries(users, '/user/', { changefreq: 'weekly', priority: '0.5' }),
    ...makeEntries(posts, '/post/', { changefreq: 'daily', priority: '0.7' }),
    ...makeEntries(activities, '/activity/detail/', { changefreq: 'daily', priority: '0.7' }),
    ...makeEntries(loveBoards, '/loveboard/', { changefreq: 'weekly', priority: '0.6' }),
    ...makeEntries(timeAlbums, '/time-album/', { changefreq: 'weekly', priority: '0.6' }),
  ]

  console.log(`\n📊 共生成 ${dynamicEntries.length} 条动态路由`)

  // 生成动态 sitemap 文件
  const dynamicSitemap = generateSitemapXml(dynamicEntries)
  const dynamicPath = resolve(CONFIG.outputDir, 'sitemap-dynamic.xml')
  writeFileSync(dynamicPath, dynamicSitemap, 'utf-8')
  console.log(`✅ 动态 Sitemap 已保存: ${dynamicPath}`)

  // 尝试合并静态 + 动态为完整 sitemap
  const staticPath = resolve(CONFIG.outputDir, 'sitemap.xml')
  const combinedPath = resolve(CONFIG.outputDir, 'sitemap-combined.xml')

  if (existsSync(staticPath)) {
    console.log('\n📋 合并静态 & 动态 Sitemap...')

    const staticContent = readFileSync(staticPath, 'utf-8')
    // 提取静态 sitemap 中的 <url> 条目
    const staticUrlMatch = staticContent.match(/<url>[\s\S]*?<\/url>/g) || []

    // 合并（静态在前，动态在后）
    const allEntries = [...staticUrlMatch, ...dynamicEntries]
    const combinedSitemap = generateSitemapXml(allEntries)
    writeFileSync(combinedPath, combinedSitemap, 'utf-8')

    console.log(`✅ 完整 Sitemap 已保存: ${combinedPath}`)
    console.log(`   总计 ${allEntries.length} 条 URL`)

    if (allEntries.length > 50000) {
      console.warn(`\n⚠️ 警告: 总 URL 数 (${allEntries.length}) 超过 Google 单文件上限 (50,000)!`)
      console.warn('   建议拆分为多个 sitemap 文件并使用 sitemap index。')
    }
  }

  // 打印统计
  console.log('\n📊 统计数据:')
  console.log(`   图片:      ${pictures.length} 条`)
  console.log(`   空间:      ${spaces.length} 条`)
  console.log(`   用户:      ${users.length} 条`)
  console.log(`   帖子:      ${posts.length} 条`)
  console.log(`   活动:      ${activities.length} 条`)
  console.log(`   恋爱画板:  ${loveBoards.length} 条`)
  console.log(`   时光相册:  ${timeAlbums.length} 条`)

  console.log('\n🎉 Sitemap 生成完毕!')
  console.log('   提交到 Google Search Console: https://www.yuemutuku.com/sitemap.xml')
}

main().catch(err => {
  console.error('❌ 生成 sitemap 失败:', err)
  process.exit(1)
})
