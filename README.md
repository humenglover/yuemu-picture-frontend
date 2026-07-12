<p align="center">
  <img src="src/assets/logo.png" alt="悦木图库" width="100" />
</p>

<h1 align="center">悦木图库 · Yuemu Gallery</h1>

<p align="center">
  <strong>创意社区平台 — 发现、分享、创造美好瞬间</strong><br>
  <em>A Creative Community Platform — Discover, Share & Create Beautiful Moments</em>
</p>

<p align="center">
  <a href="https://www.yuemutuku.com"><strong>🌐 yuemutuku.com</strong></a> ·
  <a href="#english">English</a> ·
  <a href="#中文">中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vuedotjs" alt="Vue" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/i18n-zh_|_en-oklch(0.6_0.2_260)?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/license-private-red?style=flat-square" alt="License" />
</p>

---

# English

## ✨ Live Demo

**[yuemutuku.com](https://www.yuemutuku.com)** — Try it now, free to explore.

## 🧩 What is Yuemu Gallery?

Yuemu Gallery is a **creative community platform** where users can share artwork, build interest spaces, create with AI, interact with fellow creators, and enjoy casual games — all in one place.

This repository is the **frontend codebase**, built with Vue 3 + TypeScript + Vite, covering both desktop and mobile experiences.

> 🔗 **Related Repositories**:
> | Repo | Description |
> |------|-------------|
> | [yuemu-picture-backend](https://github.com/humenglover/yuemu-picture-backend) | Backend API — Spring Boot + MySQL + Redis + Meilisearch |
> | [yuemu-picture-frontend](https://github.com/humenglover/yuemu-picture-frontend) | Web client — Vue 3 + TypeScript + Vite |
> | [yuemu-picture-ai-service](https://github.com/humenglover/yuemu-picture-ai-service) | AI service — Python + RAG + Embeddings |
> | [yuemu-picture-official-docs](https://github.com/humenglover/yuemu-picture-official-docs) | Official documentation & website

## 🧰 Features

| Category | Description |
|----------|-------------|
| 🖼️ **Gallery** | Upload / batch upload, category browsing, multi-dimensional search, copyright registration |
| 🌌 **Spaces** | Personal & team spaces, member management, analytics dashboard |
| 💬 **Social** | Comments, likes, DMs, group chat, forum posts, barrage wall |
| 🤖 **AI** | DeepSeek + Tongyi image generation, AI auto-tagging, AI chat assistant |
| 🎮 **Games** | 22+ casual games: Snake, Tetris, Minesweeper, Sudoku, 2048, Dino, and more |
| 🛠️ **Toolbox** | 12+ utilities: Calculator, Pomodoro, Color Picker, Password Generator, Base Converter, and more |
| 👤 **User** | Login / register, profile, follows, notification center, browse history |
| 🌙 **Dark Mode** | Full dark mode support via CSS variables |
| 🌍 **i18n** | Chinese & English, extensible |

## 🛠 Tech Stack

| Category | Choice |
|----------|--------|
| Framework | Vue 3 (Composition API) |
| Language | TypeScript |
| Build | Vite 6 |
| Routing | Vue Router 4 |
| State | Pinia |
| HTTP | Axios |
| UI (Desktop) | Ant Design Vue |
| UI (Mobile) | Vant |
| Styling | SCSS + CSS Variables (dark mode) |
| Rich Text | ByteMD (Markdown) · VueQuill (WYSIWYG) |
| Charts | ECharts · vue-echarts |
| 3D | Three.js |
| Animation | Lottie · @vueuse/motion · Animate.css |
| i18n | vue-i18n |
| Linting | ESLint · Prettier |

## 📁 Project Structure

```
yuemu-picture-frontend/
├── public/                  # Static assets (copied to dist/ as-is)
│   ├── logo.png
│   ├── robots.txt
│   └── sitemap.xml          # Static sitemap
├── scripts/
│   ├── generate-sitemap.mjs # Dynamic sitemap generator
│   └── generate-api.mjs     # API client code generator (OpenAPI → TypeScript)
├── openapi.config.js        # Legacy OpenAPI config (referenced by generate-api.mjs)
├── sitemap-output/          # Generated dynamic sitemaps (git-ignored, backend-only)
├── src/
│   ├── api/                 # Auto-generated API client (from backend Swagger)
│   ├── assets/              # Images, fonts, icons
│   ├── components/          # Shared components
│   ├── composables/         # Composable functions
│   ├── locales/             # i18n strings (zh-CN / en-US)
│   ├── pages/               # Page components (110+ routes)
│   ├── request/             # Axios instance & interceptors
│   ├── router/              # Route config
│   ├── stores/              # Pinia stores
│   ├── styles/              # Global styles & theme variables
│   ├── utils/               # Utility functions
│   └── views/               # Standalone view components
├── .env.*                   # Environment variables
├── vite.config.ts
└── package.json
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server (HMR, proxied to backend)
npm run dev

# Production build
npm run build:prod

# Staging build
npm run build:staging

# Preview production build
npm run preview
```

### Switch Backend

Edit `vite.config.ts`:

```ts
let apiTarget = 'http://localhost:8123'          // Local backend
// let apiTarget = 'https://www.yuemutuku.com'   // Production backend
```

Edit `.env.production`:

```env
VITE_APP_API_URL=https://www.yuemutuku.com
```

## 📡 API Code Generation

`src/api/` contains auto-generated TypeScript API clients. To regenerate from the backend Swagger docs:

```bash
# Backend must be running at localhost:8123
npm run api:generate

# Use staging backend
npm run api:generate:staging
```

The script `scripts/generate-api.mjs`:
1. Fetches Swagger 2.0 JSON from the backend (`/api/v2/api-docs`)
2. Fixes unresolvable `$ref` references (Java generics like `List<T>`, `Map<K,V>`)
3. Runs `@umijs/openapi` to generate TypeScript service files into `src/api/`

> **Note:** The legacy `node openapi.config.js` no longer works due to broken `$ref` references in the backend Swagger docs. Use the npm script above instead.

## 🔍 SEO

| File | Purpose |
|------|---------|
| `public/robots.txt` | Crawler rules — blocks admin/private paths |
| `public/sitemap.xml` | Static sitemap (~60 public pages, copied to `dist/` on build) |
| `scripts/generate-sitemap.mjs` | Dynamic sitemap generator — fetches latest content from backend API |

**Sitemap strategy:**

- `public/sitemap.xml` — hand-maintained static routes. Included in the frontend build.
- Dynamic sitemaps (image/space/user/post detail pages) — generated to `sitemap-output/` via `npm run sitemap:generate`. These are **not** bundled into the frontend build — the backend serves them directly to Google Search Console.

```bash
# Refresh dynamic sitemaps (fetches latest content from backend)
npm run sitemap:generate

# Use staging backend
npm run sitemap:generate:staging
```

## 📦 Deployment

Static SPA, deploy anywhere:

| Platform | Setup |
|----------|-------|
| **Nginx** | Serve `dist/` with `try_files $uri /index.html` |
| **Vercel** | Auto-detected |
| **Netlify** | Build: `npm run build:prod` · Publish: `dist` |
| **Any Server** | Serve the `dist/` folder |

---

# 中文

## ✨ 在线体验

**[yuemutuku.com](https://www.yuemutuku.com)** — 免费使用，无需注册即可浏览。

## 🧩 关于悦木图库

悦木图库是一个**创意社区平台**，用户可以在此分享图片作品、建立兴趣空间、使用 AI 创作、与同好交流互动，还能畅玩各种休闲小游戏。

本仓库为**前端代码库**，基于 Vue 3 + TypeScript + Vite 构建，覆盖 PC 端与移动端。

> 🔗 **相关仓库**：
> | 仓库 | 说明 |
> |------|------|
> | [yuemu-picture-backend](https://github.com/humenglover/yuemu-picture-backend) | 后端 API — Spring Boot + MySQL + Redis + Meilisearch |
> | [yuemu-picture-frontend](https://github.com/humenglover/yuemu-picture-frontend) | Web 客户端 — Vue 3 + TypeScript + Vite |
> | [yuemu-picture-ai-service](https://github.com/humenglover/yuemu-picture-ai-service) | AI 服务 — Python + RAG + Embeddings |
> | [yuemu-picture-official-docs](https://github.com/humenglover/yuemu-picture-official-docs) | 官方文档 & 官网

## 🧰 功能一览

| 分类 | 说明 |
|------|------|
| 🖼️ **图片画廊** | 上传 / 批量上传、分类浏览、多维搜索、版权登记 |
| 🌌 **空间系统** | 个人 / 团队空间、成员管理、数据仪表盘 |
| 💬 **社交互动** | 评论、点赞、私信、群聊、论坛帖子、弹幕墙 |
| 🤖 **AI 能力** | DeepSeek + 通义绘画、AI 自动打标签、AI 对话助手 |
| 🎮 **休闲游戏** | 22+ 款：贪吃蛇、俄罗斯方块、扫雷、数独、2048、恐龙快跑等 |
| 🛠️ **百宝箱** | 12+ 个工具：计算器、番茄钟、取色器、密码生成、进制转换等 |
| 👤 **用户系统** | 登录注册、个人主页、关注、消息中心、浏览足迹 |
| 🌙 **暗黑模式** | CSS 变量驱动的完整暗色主题 |
| 🌍 **国际化** | 中文 / 英文双语，可扩展 |

## 🛠 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 语言 | TypeScript |
| 构建 | Vite 6 |
| 路由 | Vue Router 4 |
| 状态管理 | Pinia |
| 网络请求 | Axios |
| UI 库（PC） | Ant Design Vue |
| UI 库（移动） | Vant |
| 样式 | SCSS + CSS Variables（暗黑模式） |
| 富文本 | ByteMD (Markdown) · VueQuill (富文本编辑器) |
| 图表 | ECharts · vue-echarts |
| 3D | Three.js |
| 动画 | Lottie · @vueuse/motion · Animate.css |
| 国际化 | vue-i18n |
| 规范 | ESLint · Prettier |

## 📁 目录结构

```
yuemu-picture-frontend/
├── public/                  # 静态资源（构建时直接复制到 dist/）
│   ├── logo.png
│   ├── robots.txt
│   └── sitemap.xml          # 静态 sitemap
├── scripts/
│   ├── generate-sitemap.mjs # 动态 sitemap 生成
│   └── generate-api.mjs     # API 客户端代码生成（OpenAPI → TypeScript）
├── openapi.config.js        # OpenAPI 配置文件（generate-api.mjs 使用）
├── sitemap-output/          # 动态 sitemap 生成产物（git-ignore，仅供后端使用）
├── src/
│   ├── api/                 # 后端接口封装（自动生成）
│   ├── assets/              # 图片、字体、图标
│   ├── components/          # 公共组件
│   ├── composables/         # 组合式函数
│   ├── locales/             # 国际化文案（zh-CN / en-US）
│   ├── pages/               # 页面组件（110+ 路由）
│   ├── request/             # Axios 封装 & 拦截器
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia store
│   ├── styles/              # 全局样式 & 主题变量
│   ├── utils/               # 工具函数
│   └── views/               # 独立视图组件
├── .env.*                   # 环境变量
├── vite.config.ts
└── package.json
```

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（热更新，代理到后端）
npm run dev

# 生产构建
npm run build:prod

# 预发布构建
npm run build:staging

# 预览构建产物
npm run preview
```

### 切换后端地址

编辑 `vite.config.ts`：

```ts
let apiTarget = 'http://localhost:8123'          // 本地后端
// let apiTarget = 'https://www.yuemutuku.com'   // 线上后端
```

编辑 `.env.production`：

```env
VITE_APP_API_URL=https://www.yuemutuku.com
```

## 📡 API 代码生成

`src/api/` 目录包含自动生成的 TypeScript API 客户端代码。从后端 Swagger 文档重新生成：

```bash
# 后端需在 localhost:8123 运行
npm run api:generate

# 使用 staging 环境后端
npm run api:generate:staging
```

`scripts/generate-api.mjs` 的工作流程：
1. 从后端 `/api/v2/api-docs` 拉取 Swagger 2.0 JSON
2. 修复无法解析的 `$ref` 引用（Java 泛型如 `List<T>`、`Map<K,V>` 等）
3. 调用 `@umijs/openapi` 生成 TypeScript service 文件到 `src/api/`

> **注意：** 旧的 `node openapi.config.js` 因后端 Swagger 文档存在 `$ref` 引用缺陷已无法正常运行，请使用上面的 npm script。

## 🔍 SEO

| 文件 | 用途 |
|------|------|
| `public/robots.txt` | 爬虫规则，禁止抓取后台 / 私密路径 |
| `public/sitemap.xml` | 静态路由 sitemap（~60 个公开页面，构建时输出到 `dist/`） |
| `scripts/generate-sitemap.mjs` | 动态 sitemap 生成脚本，从后端 API 拉取最新内容 |

**Sitemap 策略：**

- `public/sitemap.xml` — 手动维护的静态路由，随前端打包发布
- 动态 sitemap（图片/空间/用户/帖子详情页）— 通过 `npm run sitemap:generate` 生成到 `sitemap-output/` 目录。**不进入前端打包产物**，由后端单独向 Google Search Console 提交

```bash
# 刷新动态 sitemap（从后端拉取最新内容）
npm run sitemap:generate

# 使用 staging 环境后端
npm run sitemap:generate:staging
```

## 📦 部署

纯静态 SPA，可部署到任意平台：

| 平台 | 配置 |
|------|------|
| **Nginx** | 托管 `dist/`，配置 `try_files $uri /index.html` |
| **Vercel** | 自动识别 |
| **Netlify** | 构建：`npm run build:prod` · 发布：`dist` |
| **任意服务器** | 托管 `dist/` 目录 |

---

## 📄 License

私有项目 © 悦木团队 · Private Project © Yuemu Team
