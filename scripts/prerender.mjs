/**
 * Static HTML Prerender — injects page-specific TDK into dist for each route.
 *
 * Unlike puppeteer-based approaches, this reads locale files directly and
 * generates proper <title>, <meta>, <link> tags WITHOUT executing JS.
 * Baidu, Bing, Google all get correct metadata instantly.
 *
 * Usage: node scripts/prerender.mjs   (after npm run build)
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverArticles } from './guide-articles.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const DIST = resolve(PROJECT_ROOT, 'dist')
const DIST_INDEX = resolve(DIST, 'index.html')

if (!existsSync(DIST_INDEX)) {
  console.error('dist/index.html not found. Run "npm run build" first.')
  process.exit(1)
}

const BASE_URL = 'https://www.yuemutuku.com'
const TEMPLATE = readFileSync(DIST_INDEX, 'utf-8')

// ── Per-locale SEO data (matches src/locales/{zh,en}/common.ts seo section) ──
const SEO = {
  zh: {
    lang: 'zh-CN', ogLocale: 'zh_CN',
    siteName: '悦木图库 · yuemutuku',
    defaultTitle: '悦木图库 - 发现、分享、创造美好瞬间',
    description: '悦木图库是一个充满活力的创意社区平台，汇聚海量高清图片素材与设计灵感。在这里，您可以发现美好瞬间、分享生活点滴、与志同道合的创作者交流互动，还可以使用在线工具编辑图片、管理作品版权、创建个人空间展示作品集。加入悦木图库，开启您的创意之旅，探索无限美好可能。',
    keywords: '悦木图库,yuemutuku,创意社区,图片分享,设计素材,高清图片,灵感创作,版权登记,在线图片编辑,创作者社区,作品集展示',
  },
  en: {
    lang: 'en', ogLocale: 'en_US',
    siteName: 'yuemutuku',
    defaultTitle: 'yuemutuku - Discover, Share, Create Beautiful Moments',
    description: 'yuemutuku is a vibrant creative community platform with a vast collection of high-quality images and design inspiration. Discover beautiful moments, share your life, connect with fellow creators, and use online tools to edit images, manage copyrights, and build your personal portfolio.',
    keywords: 'yuemutuku, creative community, image sharing, design assets, high-quality images, art inspiration, copyright registration, online image editor, creator community, portfolio showcase',
  },
}

// ── Page title mapping (route name → title per locale) ──
// These match src/locales/{zh,en}/pageTitles.ts
const PAGE_TITLES = {
  zh: {
    Home: '首页 - 发现美好瞬间',
    MyHome: '首页 - 发现美好瞬间',
    About: '关于我们 - 悦木图库',
    Guides: '设计与创作者指南 - 悦木图库',
    Discovery: '漫游指南 - 发现大千世界',
    Forum: '叽叽喳喳 - 悦木社区',
    Ranking: '风云榜单 - 看看谁最火',
    Search: '全站探索 - 寻找你的热爱',
    SearchPicture: '大海捞图 - 图片搜索',
    Contact: '电波发射 - 联系我们',
    Privacy: '隐私政策 - 悦木图库',
    PrivacyCenter: '隐私中心 - Privacy Center',
    Games: '摸鱼专区 - 欢乐小游戏',
    Tools: '次元百宝箱 - 实用工具',
    AiResource: 'AI 资源库 - 你的数字资产',
    LoveBoard: '心动频率 - 恋爱专属画板',
    LoveBoardList: '浪漫广场 - 恋爱画板展厅',
    FriendLinks: '星际邻居 - 友情链接',
    AddPicture: '发布创作 - 留下光影足迹',
    AddSpace: '开辟空间 - 创建你的小宇宙',
    Barrage: '畅所欲言 - 灵感弹幕墙',
    UserLogin: '登录 - 欢迎回到悦木',
    UserRegister: '注册 - 开启创作者之旅',
    CopyrightTrace: '时光追溯 - 版权查询',
    CopyrightRegister: '版权卫士 - 登记大厅',
    InvitePage: '邀请计划 - 会员中心',
    CreatorAnalytics: '创作者中心 - 数据罗盘',
  },
  en: {
    Home: 'Home - Discover Beautiful Moments',
    MyHome: 'Home - Discover Beautiful Moments',
    About: 'About Us - yuemutuku',
    Guides: 'Design & Creator Guides - yuemutuku',
    Discovery: 'Discovery Guide - Explore the World',
    Forum: 'Community - Yuemu Forum',
    Ranking: 'Leaderboard',
    Search: 'Explore - Find Your Passion',
    SearchPicture: 'Search Pictures - Find Treasures',
    Contact: 'Contact Us - Reach Out',
    Privacy: 'Privacy Policy - yuemutuku',
    PrivacyCenter: 'Privacy Center',
    Games: 'Game Zone - Fun Mini Games',
    Tools: 'Toolbox - Utility Tools',
    AiResource: 'AI Resources - Digital Assets',
    LoveBoard: 'Heartbeat - Love Board',
    LoveBoardList: 'Romance Square - Love Board Gallery',
    FriendLinks: 'Neighbors - Friend Links',
    AddPicture: 'Upload - Leave Your Mark',
    AddSpace: 'Create Space - Your Universe',
    Barrage: 'Barrage Wall - Speak Freely',
    UserLogin: 'Login - Welcome to yuemutuku',
    UserRegister: 'Sign Up - Start Creating',
    CopyrightTrace: 'Copyright Trace',
    CopyrightRegister: 'Copyright Register',
    InvitePage: 'Invite - Membership',
    CreatorAnalytics: 'Creator Center',
  },
}

// ── Path → route name mapping ──
function pathToRouteName(path) {
  const m = {
    '/': 'Home', '/home': 'MyHome', '/about': 'About', '/guides': 'Guides',
    '/discovery': 'Discovery', '/forum': 'Forum', '/ranking': 'Ranking',
    '/search': 'Search', '/search_picture': 'SearchPicture', '/contact': 'Contact',
    '/privacy': 'Privacy', '/privacy-center': 'PrivacyCenter',
    '/games': 'Games', '/tools': 'Tools', '/ai_resource': 'AiResource',
    '/loveboard': 'LoveBoard', '/loveboard/list': 'LoveBoardList',
    '/friend-links': 'FriendLinks', '/add_picture': 'AddPicture',
    '/add_space': 'AddSpace', '/barrage': 'Barrage',
    '/user/login': 'UserLogin', '/user/register': 'UserRegister',
    '/picture/copyright/trace': 'CopyrightTrace',
    '/picture/copyright/register': 'CopyrightRegister',
    '/invite': 'InvitePage', '/creator/analytics': 'CreatorAnalytics',
  }
  return m[path] || null
}

// ── Generate one static HTML ──
function generateHTML(locale, path) {
  const seo = SEO[locale]
  const routeName = pathToRouteName(path)
  const title = (routeName && PAGE_TITLES[locale][routeName]) || seo.defaultTitle
  const desc = `${title} | ${seo.description}`
  const cleanPath = path === '/' ? '' : path
  const canonical = `${BASE_URL}/${locale}${cleanPath}`

  const otherLocale = locale === 'zh' ? 'en' : 'zh'
  const otherPath = `${BASE_URL}/${otherLocale}${cleanPath}`
  const zhPath = `${BASE_URL}/zh${cleanPath}`
  const enPath = `${BASE_URL}/en${cleanPath}`

  // Extract h1 text from title: "首页 - 发现美好瞬间" → "首页"
  const h1Text = escapeXml(title.includes(' - ') ? title.split(' - ')[0].trim() : title)

  // Replace existing title + description + h1 + inject SEO block before </head>
  let html = TEMPLATE
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeXml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeXml(desc)}">`)
    .replace(/<h1>[^<]*<\/h1>/, `<h1>${h1Text}</h1>`)

  const seoBlock = [
    `<meta name="keywords" content="${escapeXml(seo.keywords)}">`,
    `<meta property="og:title" content="${escapeXml(title)}">`,
    `<meta property="og:description" content="${escapeXml(desc)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:site_name" content="${escapeXml(seo.siteName)}">`,
    `<meta property="og:locale" content="${seo.ogLocale}">`,
    `<meta name="twitter:title" content="${escapeXml(title)}">`,
    `<meta name="twitter:description" content="${escapeXml(desc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="alternate" hreflang="zh-CN" href="${zhPath}">`,
    `<link rel="alternate" hreflang="en-US" href="${enPath}">`,
    `<link rel="alternate" hreflang="x-default" href="${zhPath}">`,
    `<meta name="prerender-status" content="true">`,
  ].join('\n')

  return html
    .replace('</head>', `${seoBlock}\n</head>`)
    .replace(/<html lang="[^"]*">/, `<html lang="${seo.lang}">`)
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Main ──
const LOCALES = ['zh', 'en']
const STATIC_PATHS = [
  '/', '/home', '/about', '/guides', '/discovery', '/forum', '/ranking',
  '/search', '/search_picture', '/contact', '/privacy', '/privacy-center',
  '/games', '/tools', '/ai_resource', '/loveboard', '/loveboard/list',
  '/friend-links', '/add_picture', '/add_space', '/barrage',
  '/user/login', '/user/register',
  '/picture/copyright/trace', '/picture/copyright/register',
  '/invite', '/creator/analytics',
]

const guideArticles = discoverArticles()
let count = 0

console.log(`Generating static HTML for ${LOCALES.length} locales × ${STATIC_PATHS.length + guideArticles.length} pages...\n`)

for (const locale of LOCALES) {
  for (const path of STATIC_PATHS) {
    const routePath = path === '/' ? '' : path
    const fullPath = `/${locale}${routePath}`
    const dir = resolve(DIST, fullPath.replace(/^\//, ''))
    mkdirSync(dir, { recursive: true })
    writeFileSync(resolve(dir, 'index.html'), generateHTML(locale, path), 'utf-8')
    console.log(`  ${fullPath}`)
    count++
  }
  // Guide articles
  for (const article of guideArticles) {
    const path = `/guides/${article.id}`
    const fullPath = `/${locale}${path}`
    const dir = resolve(DIST, fullPath.replace(/^\//, ''))
    mkdirSync(dir, { recursive: true })
    // Guide pages use the guides title
    const html = generateHTML(locale, '/guides').replace(
      `<link rel="canonical" href="${BASE_URL}/${locale}/guides">`,
      `<link rel="canonical" href="${BASE_URL}/${locale}${path}">`
    )
    writeFileSync(resolve(dir, 'index.html'), html, 'utf-8')
    console.log(`  ${fullPath}`)
    count++
  }
}

console.log(`\nGenerated ${count} static HTML files -> dist/`)
console.log('Each has proper <title>, <meta>, hreflang, canonical for its locale.')
console.log('Google / Baidu / Bing all see correct TDK without executing JS.')
