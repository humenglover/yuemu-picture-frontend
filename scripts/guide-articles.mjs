/**
 * 指南文章发现工具
 *
 * 自动扫描 src/locales/zh/pages/guides/ 目录下的 a*.ts 文件，
 * 提取每篇文章的元数据（id, title, date, desc, categoryKey, readTimeVal）。
 *
 * 使用方式：
 *   import { discoverArticles } from './guide-articles.mjs'
 *   const articles = discoverArticles()
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const GUIDES_ZH_DIR = resolve(PROJECT_ROOT, 'src', 'locales', 'zh', 'pages', 'guides')

/**
 * 从单个文章 .ts 文件中提取元数据
 */
function parseArticleMeta(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')

    // 提取 id
    const idMatch = content.match(/id:\s*['"](\w+)['"]/)
    const id = idMatch ? idMatch[1] : basename(filePath, '.ts')

    // 提取标题
    const titleMatch = content.match(/title:\s*['"](.+?)['"]/)
    const title = titleMatch ? titleMatch[1] : id

    // 提取描述
    const descMatch = content.match(/desc:\s*['"](.+?)['"]/)
    const desc = descMatch ? descMatch[1] : ''

    // 提取日期
    const dateMatch = content.match(/date:\s*['"]([\d-]+)['"]/)
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0]

    // 提取分类
    const categoryMatch = content.match(/categoryKey:\s*['"](\w+)['"]/)
    const categoryKey = categoryMatch ? categoryMatch[1] : ''

    // 提取阅读时间
    const readTimeMatch = content.match(/readTimeVal:\s*['"](.+?)['"]/)
    const readTimeVal = readTimeMatch ? readTimeMatch[1] : ''

    return { id, title, desc, date, categoryKey, readTimeVal }
  } catch (err) {
    console.error(`  ⚠ 解析文章失败: ${filePath} — ${err.message}`)
    return null
  }
}

/**
 * 发现所有指南文章（按日期倒序排列）
 * 扫描 src/locales/zh/pages/guides/ 下的 a*.ts 文件
 */
export function discoverArticles() {
  if (!existsSync(GUIDES_ZH_DIR)) {
    console.error(`❌ 指南目录不存在: ${GUIDES_ZH_DIR}`)
    return []
  }

  const files = readdirSync(GUIDES_ZH_DIR)
    .filter(f => /^a\d+\.ts$/.test(f))  // 只匹配 a1.ts, a2.ts, ...
    .sort((a, b) => {
      const na = parseInt(a.match(/a(\d+)/)?.[1] || '0', 10)
      const nb = parseInt(b.match(/a(\d+)/)?.[1] || '0', 10)
      return na - nb
    })

  const articles = files
    .map(f => parseArticleMeta(resolve(GUIDES_ZH_DIR, f)))
    .filter(Boolean)
    // 按日期倒序
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  console.log(`📚 发现 ${articles.length} 篇指南文章:`)
  articles.forEach(a => console.log(`   /guides/${a.id} — ${a.title} (${a.date})`))

  return articles
}
