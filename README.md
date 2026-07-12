<p align="center">
  <img src="https://raw.githubusercontent.com/humenglover/yuemu-picture-frontend/main/public/logo.png" alt="悦木图库" width="100" />
</p>

<h1 align="center">悦木图库 · 前端</h1>

<p align="center">
  <strong>Yuemu Gallery Frontend — 一个创意社区平台的 Web 客户端</strong>
</p>

<p align="center">
  <a href="https://www.yuemutuku.com"><img src="https://img.shields.io/badge/在线地址-yuemutuku.com-2563eb?style=flat-square" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vuedotjs" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" /></a>
</p>

---

## 📖 关于项目

本项目是 [悦木图库](https://www.yuemutuku.com) 的**前端代码库**，基于 Vue 3 + TypeScript + Vite 构建，涵盖 PC 端与移动端。

悦木图库是一个创意社区平台，用户可以在上面分享图片作品、建立兴趣空间、使用 AI 绘画创作、与创作者交流互动，以及畅玩各种休闲小游戏。

> 🔗 后端代码库：[待补充]

---

## ✨ 功能概览

| 模块 | 说明 |
|------|------|
| 🖼️ **图片创作** | 上传/批量上传、分类浏览、多维搜索、版权登记 |
| 🌌 **空间系统** | 个人/团队空间、成员管理、数据仪表盘 |
| 💬 **社交互动** | 评论、点赞、私信、群聊、论坛帖子、弹幕墙 |
| 🤖 **AI 能力** | DeepSeek + 通义绘画、AI 打标签、AI 对话助手 |
| 🎮 **休闲游戏** | 贪吃蛇、俄罗斯方块、扫雷、数独、连连看等 22 款 |
| 🛠️ **百宝箱** | 计算器、番茄钟、取色器、密码生成、进制转换等 12 个工具 |
| 👤 **用户系统** | 登录注册、个人主页、关注、消息中心、浏览足迹 |

---

## 🛠️ 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 语言 | TypeScript |
| 构建 | Vite 6 |
| 路由 | Vue Router 4 |
| 状态管理 | Pinia |
| 网络请求 | Axios |
| UI 库 | Ant Design Vue (PC) · Vant (移动端) |
| 样式 | SCSS + CSS Variables（支持暗黑模式） |
| 富文本 | ByteMD (Markdown) · VueQuill (编辑器) |
| 动画 | Lottie · @vueuse/motion |
| 国际化 | vue-i18n（中 / 英） |
| 规范 | ESLint · Prettier |

---

## 📁 目录结构

```
yuemu-picture-frontend/
├── public/                  # 静态资源（构建时直接复制到 dist/）
│   ├── logo.png
│   ├── robots.txt
│   └── sitemap*.xml
├── scripts/
│   └── generate-sitemap.mjs # 动态 sitemap 生成
├── src/
│   ├── api/                 # 后端接口封装（自动生成）
│   ├── assets/              # 图片、字体、图标
│   ├── components/          # 公共组件
│   ├── composables/         # 组合式函数
│   ├── locales/             # 国际化文案
│   ├── pages/               # 页面组件（80+ 路由）
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

---

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
VITE_WS_URL=wss://www.yuemutuku.com
```

---

## 🔍 SEO

| 文件 | 用途 |
|------|------|
| `public/robots.txt` | 爬虫规则，禁止抓取后台/私密路径 |
| `public/sitemap.xml` | 静态路由 sitemap（~60 个公开页面） |
| `public/sitemap-combined.xml` | 完整版（静态 + 动态路由） |
| `scripts/generate-sitemap.mjs` | 动态 sitemap 生成脚本，从后端 API 拉取最新内容 |

运行 `npm run sitemap:generate` 即可刷新动态路由。构建时 `public/` 下文件自动输出到 `dist/`。

---

## 📄 License

私有项目 © 悦木团队
