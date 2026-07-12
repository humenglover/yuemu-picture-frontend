<p align="center">
  <img src="https://raw.githubusercontent.com/humenglover/yuemu-picture-frontend/main/public/logo.png" alt="悦木图库" width="120" height="120" />
</p>

<h1 align="center">🌳 悦木图库 · Yuemu Gallery</h1>

<p align="center">
  <strong>发现、分享、创造美好瞬间</strong>
</p>

<p align="center">
  <a href="https://www.yuemutuku.com"><img src="https://img.shields.io/badge/website-yuemutuku.com-2563eb?style=flat-square" alt="Website" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vuedotjs" alt="Vue 3" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite" alt="Vite" /></a>
  <a href="#"><img src="https://img.shields.io/badge/license-private-red?style=flat-square" alt="License" /></a>
</p>

---

## ✨ 简介

悦木图库是一个**全栈式创意社区平台**，集图片分享、社交互动、AI 创作、休闲娱乐于一体。用户在这里可以上传作品、建立兴趣空间、与创作者交流，也可以使用 AI 绘画工具挥洒灵感，或在摸鱼专区畅玩各种小游戏。

> 🎯 定位：不只是图库，更是一个**有温度的创作者社区**。

---

## 🚀 功能矩阵

<table>
<tr>
<td width="50%">

### 🖼️ 图片 & 创作
- 📤 图片上传（单张 / 批量）
- 🔍 多维度搜索 & 分类浏览
- 🖼️ 作品详情页（PC + 移动端双端适配）
- ©️ 版权登记 & 溯源查询
- 📊 作品数据分析仪表盘

### 👥 社交 & 社区
- 💬 评论互动 & 点赞分享
- 📮 私信聊天 & 空间群聊
- 📢 弹幕墙、论坛帖子
- 👀 关注系统 & 交互足迹
- 🏆 作者排行榜

### 🌌 空间系统
- 🏠 创建个人/团队空间
- 👥 成员管理 & 权限控制
- 📊 空间数据分析（标签/分类/用户画像）
- 🎉 空间活动管理

</td>
<td width="50%">

### 🤖 AI 能力
- 🎨 AI 绘画（DeepSeek + 阿里通义）
- 🏷️ AI 智能打标签
- 💬 AI 对话助手
- 📝 AI 帖子生成

### 🎮 休闲娱乐
贪吃蛇 · 2048 · 扫雷 · 俄罗斯方块 · 连连看 · 数独 · 跳一跳 · 迷宫 · 坦克大战 · 飞机大战 · 消消乐 · 打砖块 · 翻牌记忆 · 滑动拼图 · 色感挑战 · 神经猫 · 八皇后 · 恐龙快跑 · SBTI 人格测试……

### 🛠️ 百宝箱
计算器 · 番茄钟 · 倒计时 · 取色器 · 屏幕标尺 · 密码生成 · 进制转换 · 单位换算 · 文本处理 · 命运大转盘 · 便签墙

</td>
</tr>
</table>

---

## 🛠️ 技术栈

| 领域 | 技术 |
|------|------|
| 核心框架 | Vue 3 (Composition API) |
| 开发语言 | TypeScript |
| 构建工具 | Vite 6 |
| 路由 | Vue Router 4 |
| 状态管理 | Pinia |
| HTTP 客户端 | Axios |
| UI 框架 | Ant Design Vue (PC) + Vant (移动端) |
| CSS 方案 | SCSS + CSS Variables (暗黑模式) |
| 代码规范 | ESLint + Prettier |
| 富文本编辑 | ByteMD (Markdown) + VueQuill (编辑器) |
| 动画 | Lottie + @vueuse/motion |

---

## 📁 项目结构

```
yuemu-picture-frontend/
├── public/                  # 静态资源
│   ├── robots.txt           # 爬虫规则
│   ├── sitemap.xml          # 静态路由 sitemap
│   └── sitemap-combined.xml # 完整 sitemap（静态+动态）
├── scripts/
│   └── generate-sitemap.mjs # 动态 sitemap 生成脚本
├── src/
│   ├── api/                 # API 接口层（自动生成）
│   ├── assets/              # 图片/字体/图标
│   ├── components/          # 公共组件
│   ├── composables/         # 组合式函数
│   ├── constants/           # 常量定义
│   ├── layouts/             # 布局组件
│   ├── pages/               # 页面组件 (~80+ 路由)
│   ├── request/             # Axios 封装
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia 状态
│   ├── styles/              # 全局样式
│   ├── types/               # TS 类型声明
│   ├── utils/               # 工具函数
│   └── views/               # 视图组件
├── .env.development         # 开发环境变量
├── .env.production          # 生产环境变量
├── .env.staging             # 预发布环境变量
├── vite.config.ts           # Vite 配置
└── package.json
```

---

## 🏃 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev                    # 默认代理到 www.yuemutuku.com

# 3. 构建
npm run build:prod             # 生产构建
npm run build:staging          # 预发布构建

# 4. 预览构建结果
npm run preview
```

### 环境配置

修改 `vite.config.ts` 中的代理目标指向你的后端：

```ts
let apiTarget = 'http://localhost:8123'   // 本地后端
// 或
let apiTarget = 'https://www.yuemutuku.com'  // 线上后端
```

修改 `.env.production` 配置 WebSocket 地址：

```env
VITE_WS_URL=wss://www.yuemutuku.com
```

---

## 📇 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 默认构建 |
| `npm run build:prod` | 生产构建 |
| `npm run build:staging` | 预发布构建 |
| `npm run preview` | 预览构建结果 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 格式化 |
| `npm run sitemap:generate` | 从后端 API 生成动态 sitemap |
| `npm run sitemap:generate:staging` | 生成 staging 环境的 sitemap |

---

## 🔍 SEO

- `robots.txt` — 允许搜索引擎抓取公开页面，禁止后台/私密路径
- `sitemap.xml` — 静态路由 sitemap（~60 个公开页面）
- `sitemap-combined.xml` — 完整 sitemap（静态 + 动态路由）
- `scripts/generate-sitemap.mjs` — 定时从后端拉取新内容生成动态路由

每次构建时会自动将 `public/` 下的文件复制到 `dist/`，可直接提交到 Google Search Console。

---

## 📝 License

私有项目，保留所有权利。© 悦木团队
