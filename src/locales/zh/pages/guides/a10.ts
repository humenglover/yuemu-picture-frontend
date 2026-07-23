export default {
  id: 'a10',
  categoryKey: 'design',
  tag: '视觉设计',
  icon: 'fas fa-cubes',
  title: '设计系统从零搭建完全指南：Design Tokens 到组件库工程化',
  desc: '从三层 Token 架构、Figma Variables 实操到 CI/CD 自动同步，一套可落地的设计系统工程化方案。',
  readTimeVal: '18 分钟',
  date: '2026-07-22',
  content: `做过三个以上项目的前端应该都有这种体验：每个项目颜色不一样、间距不一样、圆角不一样，甚至同一个按钮在各个页面长得都不一样。设计师换了三轮，设计稿里光蓝色就有 #2563eb、#1d4ed8、#3b82f6、#2083f2 四种——没人分得清哪个才是"品牌蓝"。

![设计系统混乱现场](/gifs/a10_chaos.gif)
*▲ 图：没有设计系统的团队日常——每个页面颜色都不一样，每次改个按钮要改二十个文件*

这就是没有设计系统的下场。今天聊的，就是怎么从零搭一套能真正落地、能跟代码同步、不会烂尾的设计系统。

## 一、Design Tokens 三层架构 —— 设计的"变量系统"

设计系统最底层的概念就是 Design Tokens——把颜色、间距、字号、圆角这些"设计决策"变成命名变量。但直接甩一堆变量名出来没用，得有层级。

### 标准三层架构

\`\`\`
 ┌─────────────────────────────────────────────────────┐
 │                  Design Token 三层架构                 │
 │                                                     │
 │  Layer 3: 组件 Token（Component-specific）            │
 │  ┌─────────────────────────────────────────────┐    │
 │  │ button-primary-bg → color.brand.primary      │    │
 │  │ card-padding      → spacing.section.lg       │    │
 │  │ 用途：组件直接引用，换品牌不改组件              │    │
 │  └─────────────────────────────────────────────┘    │
 │                      ↑ 引用                           │
 │  Layer 2: 语义 Token（Semantic）                      │
 │  ┌─────────────────────────────────────────────┐    │
 │  │ color.brand.primary  → blue.500              │    │
 │  │ color.text.primary   → neutral.900           │    │
 │  │ spacing.section.lg   → 48px                  │    │
 │  │ 用途：表达"意图"，不表达"具体值"               │    │
 │  └─────────────────────────────────────────────┘    │
 │                      ↑ 引用                           │
 │  Layer 1: 原始 Token（Primitive / Global）            │
 │  ┌─────────────────────────────────────────────┐    │
 │  │ blue.500    → #2563eb                        │    │
 │  │ neutral.900 → #111827                        │    │
 │  │ space.12    → 48px                           │    │
 │  │ 用途：定义原子值，不直接用于组件                │    │
 │  └─────────────────────────────────────────────┘    │
 └─────────────────────────────────────────────────────┘
\`\`\`

**为什么必须分三层？** 假设你的品牌色从蓝变绿——只改 Layer 1 的 \`blue.500\` 到 \`green.500\`，Layer 2 的 \`color.brand.primary\` 自动跟着变，所有组件不需要动一行代码。不分层的话，每个组件的颜色都得手动改一遍。

### Token 命名规范

\`\`\`
 ✅ color.brand.primary          ← 按"语义"命名，换了颜色名不变
 ❌ color.blue.500               ← 按"值"命名，换颜色名就得改

 ✅ spacing.section.xl           ← 表达用途
 ❌ spacing.48px                 ← 绑定具体值

 命名结构：{类别}.{属性}.{变体}.{状态}
 示例：    color . text . primary . hover
\`\`\`

## 二、Figma Variables —— 把 Token 落到设计工具里

Figma Variables 是 Figma 原生实现 Design Tokens 的机制。2026 年支持的类型：Color、Number、String、Boolean。

### 变量集合（Collections）实操

\`\`\`
 Figma Variables 集合结构（推荐）

 ┌──────────────────────────────────────────────────────┐
 │  Collection 1: Primitives（原始值）                    │
 │  ┌──────────────────────────────────────────────────┐ │
 │  │ blue/500    #2563eb    neutral/50    #f9fafb     │ │
 │  │ blue/600    #1d4ed8    neutral/900   #111827     │ │
 │  │ space/4     16px       radius/md     8px         │ │
 │  │ space/8     32px       font/xl       32px        │ │
 │  └──────────────────────────────────────────────────┘ │
 │                                                      │
 │  Collection 2: Semantic（语义层）                      │
 │  ┌──────────────────────────────────────────────────┐ │
 │  │ color/brand/primary  → blue/500    ← alias!     │ │
 │  │ color/text/primary   → neutral/900 ← alias!     │ │
 │  │ spacing/section/xl   → space/8     ← alias!     │ │
 │  │                                     全部用 alias   │ │
 │  └──────────────────────────────────────────────────┘ │
 │                                                      │
 │  Collection 3: Components（组件层，可选）               │
 │  ┌──────────────────────────────────────────────────┐ │
 │  │ button/primary/bg     → color/brand/primary       │ │
 │  │ card/padding/x        → spacing/section/lg        │ │
 │  └──────────────────────────────────────────────────┘ │
 └──────────────────────────────────────────────────────┘
\`\`\`

关键操作：Semantic 层的值全部用 **alias（别名引用）**，不要直接填色值。这样换品牌时只改 Primitives，Semantic 自动跟随。

### Modes 做主题切换

\`\`\`
 同一个 Semantic Token，不同 Mode 映射不同值

 Token: color/bg/primary

  ┌────────────┬──────────────┬──────────────┐
  │  Light Mode │  Dark Mode   │  HighContrast │
  ├────────────┼──────────────┼──────────────┤
  │  #FFFFFF   │  neutral/900 │  #000000      │
  └────────────┴──────────────┴──────────────┘

  设计师在 Figma 里切换 Mode → 整页自动换肤
  前端在代码里切换 data-theme → CSS 变量自动换值
\`\`\`

做到这一步，你的设计稿和代码共享同一套变量体系了。这是设计系统和代码同步的基础。

## 三、组件库搭建 —— 先做 10 个核心组件

别一上来就想做 50 个组件。V1 只做这 10 个：

\`\`\`
 核心 10 组件（按优先级排序）
 ┌────────┬────────┬────────┬────────┬────────┐
 │ Button │ Input  │ Select │ Modal  │ Card   │
 ├────────┼────────┼────────┼────────┼────────┤
 │Badge   │Avatar  │Toast   │Tabs    │Table   │
 └────────┴────────┴────────┴────────┴────────┘
\`\`\`

### 组件构建原则

\`\`\`
 1. 所有视觉属性引用 Token，禁止硬编码
    ✅ background: var(--color-brand-primary)
    ❌ background: #2563eb

 2. 先定义所有状态，再设计默认状态
    default → hover → active → focus → disabled → loading → error

 3. Figma 组件名 = 代码组件名
    Type=Primary, Size=Medium, State=Hover
    → <Button variant="primary" size="md" />

 4. 用 Auto Layout 做间距，别手动拖像素
\`\`\`

### 避坑指南

\`\`\`
 ❌ 不要过早 token 化 —— 单页活动站用 CSS 变量就够了
 ❌ 不要跳过 Semantic 层 —— 直接从 Primitive 到 Component
    换品牌时每个组件都得手动改
 ❌ 不要一次做 50 个组件 —— V1 只做 10 个核心的，用了再迭代
 ✅ 用"detach 测试"验证 —— 设计师宁愿 detach 组件也要改，
    说明组件设计有问题，不是人的问题
\`\`\`

## 四、工程化同步 —— Figma ↔ Code 的自动化管线

设计系统最大的敌人不是"做不出来"，是"设计改了代码没改"。

![设计代码同步](/gifs/a10_sync.gif)
*▲ 图：设计系统 CI/CD 管线——Figma 变量更新 → Git Push → Style Dictionary 构建 → npm 发布，一条龙自动同步*

### 推荐同步架构

\`\`\`
  Figma Variables                Git Repository               Applications
  ┌──────────────┐          ┌──────────────────────┐        ┌──────────┐
  │ Tokens Studio │ ─push─→ │ tokens/               │        │ Web App  │
  │ (Figma Plugin)│          │  primitives.json      │        │ (CSS     │
  └──────────────┘          │  semantic.json        │        │  Vars)   │
        │                   │        ↓               │        └──────────┘
        │                   │ Style Dictionary       │        ┌──────────┐
        │                   │  → CSS Variables       │──npm──→│ iOS App  │
        │                   │  → Swift Constants     │ publish│ (Swift)  │
        │                   │  → Kotlin Objects      │        └──────────┘
        │                   └──────────────────────┘        ┌──────────┐
        │                                                  │ Android  │
        └──────────────── CI/CD Pipeline ─────────────────→│ (Kotlin) │
                                                           └──────────┘
\`\`\`

### Style Dictionary 配置示例

\`\`\`js
// tokens.config.js
module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
      }],
    },
    swift: {
      transformGroup: 'swift',
      buildPath: 'dist/ios/',
      files: [{
        destination: 'DesignTokens.swift',
        format: 'ios-swift/class.swift',
      }],
    },
  },
};
\`\`\`

\`\`\`css
/* 构建产物：dist/css/variables.css */
:root {
  --color-brand-primary: #2563eb;
  --color-text-primary: #111827;
  --spacing-section-xl: 48px;
}

[data-theme="dark"] {
  --color-brand-primary: #60a5fa;
  --color-text-primary: #f9fafb;
}
\`\`\`

### CI/CD 流程

\`\`\`
 设计师改 Figma Variable
       ↓
 Tokens Studio 插件 Push → Git Repo
       ↓
 GitHub Action 触发 Style Dictionary Build
       ↓
 生成 CSS / Swift / Kotlin 产物
       ↓
 自动 npm publish / CocoaPods push
       ↓
 前端/移动端 npm update 即生效

 全程设计师不需要碰代码，前端不需要手动改 CSS 变量
\`\`\`

## 五、多品牌 / 多主题扩展

当你需要维护多套品牌（主品牌 + 子品牌）或多套主题（Light + Dark + High Contrast）：

\`\`\`
  Semantic Token 保持不变，只换 Primitive 映射

            Semantic Layer（不变）
  ┌─────────────────────────────────────────┐
  │  color/brand/primary                    │
  │  color/bg/primary                       │
  │  font/heading                           │
  └──────────┬──────────┬───────────────────┘
             │          │
    ┌────────┴──┐  ┌───┴────────┐
    │ Brand A   │  │ Brand B    │   ← 不同品牌换 Primitive
    │ blue/500  │  │ green/500  │
    │ white     │  │ cream      │
    └───────────┘  └────────────┘

  Figma 做法：Extended Collections
  - Parent Collection：共享 Semantic Token
  - Child Collection A：Brand A 的 Primitive
  - Child Collection B：Brand B 的 Primitive
  - 改 Parent → 所有 Child 自动更新
  - 改单个 Child → 只影响那个品牌
\`\`\`

## 六、衡量设计系统是否成功的三个指标

\`\`\`
 1. 组件使用率
    → Figma 中组件实例数 / 总元素数
    → 低于 80% = 组件不够用 or 设计师不知道有组件

 2. Detach 率
    → 设计师 detach（解除组件关联）的比例
    → 高于 20% = 组件设计有问题，不能覆盖真实场景

 3. 3 分钟测试
    → 一个新设计师能不能在 3 分钟内找到、放置、配置一个按钮？
    → 做不到 = 你的组件库太难用了
\`\`\`

## 七、总结：设计系统的本质

![设计系统搭建完成](/gifs/a10_build.gif)
*▲ 图：设计系统不是"做一套好看的组件文档"——它是让你的设计决策变成可复用、可同步、可追溯的代码资产*

\`\`\`
  设计系统 = 设计决策 × 工程化

  ┌──────────────────┐     ┌──────────────────┐
  │  Design Tokens   │ ←→ │  CSS Variables    │
  │  (设计语言)       │     │  (代码实现)       │
  ├──────────────────┤     ├──────────────────┤
  │  Figma Variables │ ←→ │  Style Dictionary │
  │  (设计工具)       │     │  (构建工具)       │
  ├──────────────────┤     ├──────────────────┤
  │  Components      │ ←→ │  Component Lib    │
  │  (设计资产)       │     │  (代码资产)       │
  └──────────────────┘     └──────────────────┘
          ↕  CI/CD 自动同步  ↕
\`\`\`

最后一句大实话：**设计系统最大的价值不是"统一了颜色和间距"，而是让你的团队不再为"这个按钮到底该长什么样"开会。** 省下来的时间，拿去打磨真正重要的东西。`
};
