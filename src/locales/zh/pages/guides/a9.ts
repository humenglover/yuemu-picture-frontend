export default {
  id: 'a9',
  categoryKey: 'frontend',
  tag: '前端工程',
  icon: 'fas fa-code',
  title: '2026 CSS 新特性完全指南：滚动动画、视图过渡与原生弹窗',
  desc: '深入掌握 Scroll-driven Animations、View Transitions API、Popover API 与 Anchor Positioning 四大浏览器原生能力。',
  readTimeVal: '20 分钟',
  date: '2026-07-22',
  content: `说出来你可能不信——2026 年的 CSS，已经能干五年前必须上 JavaScript 库才能干的事了。

滚动驱动的动画？纯 CSS。页面切换的丝滑过渡？纯 CSS。弹窗、下拉菜单、Tooltip？纯 CSS。一股"我当初学 JS 到底是为了啥"的恍惚感。

我第一次认真读完 2026 CSS 新特性清单的时候，反应大概是这样：

![被现代 CSS 震撼](/gifs/a9_flex.gif)
*▲ 图：看完 2026 CSS 新特性清单——这还是我认识的那个 CSS 吗？*

Chrome 130+、Safari 18+、Firefox 130+，四大新特性全浏览器稳定支持。不需要 polyfill，不需要等，直接用。先看一眼全局地图：

\`\`\`
 ┌─────────────────────────────────────────────────────────┐
 │              2026 CSS 四大新特性全景图                      │
 ├─────────────────┬───────────────────────────────────────┤
 │ 滚动驱动动画      │ scroll() / view() timeline            │
 │ Scroll-Driven    │ → 干掉 IntersectionObserver + rAF     │
 ├─────────────────┼───────────────────────────────────────┤
 │ 视图过渡 API      │ startViewTransition() / @view-transition │
 │ View Transitions │ → 干掉 Framer Motion 页面切换          │
 ├─────────────────┼───────────────────────────────────────┤
 │ 弹出层 API        │ popover 属性 / ::backdrop 伪元素       │
 │ Popover API      │ → 干掉 z-index 地狱 + 焦点管理噩梦      │
 ├─────────────────┼───────────────────────────────────────┤
 │ 锚点定位          │ anchor() / position-try-fallbacks     │
 │ Anchor Positioning│ → 干掉 Popper.js / Floating UI        │
 └─────────────────┴───────────────────────────────────────┘
\`\`\`

今天就一个一个拆给你看，每个都带完整代码。

## 一、滚动驱动动画（Scroll-Driven Animations）

这绝对是 CSS 史上最大的突破之一。旧世界 vs 新世界的架构对比：

\`\`\`
 旧世界（JavaScript）                          新世界（纯 CSS）
 ┌──────────────────────┐                ┌──────────────────────┐
 │ scroll 事件监听        │                │ animation-timeline:   │
 │   ↓                   │                │   scroll() / view()  │
 │ requestAnimationFrame │                │        ↓              │
 │   ↓                   │                │ 浏览器合成器线程       │
 │ 手动计算百分比         │                │ 自动计算进度           │
 │   ↓                   │                │        ↓              │
 │ JS 改 style/class     │                │ @keyframes 自动执行    │
 │   ↓                   │                │        ↓              │
 │ ⚠ 主线程可能卡顿       │                │ ✅ 60fps 稳如老狗      │
 └──────────────────────┘                └──────────────────────┘
\`\`\`

### scroll() 时间线 — 阅读进度条

最简单的例子：页面顶部那条阅读进度条。零 JS。

\`\`\`css
.progress-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: oklch(70% 0.2 250);
  transform-origin: left;
  animation: grow-progress linear;
  animation-timeline: scroll();     /* ← 就这一行，取代所有 JS */
}

@keyframes grow-progress {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
\`\`\`

浏览器在合成器线程上直接算滚动进度，主线程纹丝不动。

### view() 时间线 — 元素进入视口自动动画

卡片从底部淡入的效果，旧世界用 Intersection Observer，新世界：

\`\`\`css
.card {
  opacity: 0;
  translate: 0 32px;
  animation: reveal linear both;
  animation-timeline: view();       /* ← 时间线 = 元素在视口中的位置 */
  animation-range: entry 0% entry 100%;
}

@keyframes reveal {
  to { opacity: 1; translate: 0 0; }
}
\`\`\`

### animation-range 精确控制区间

这是微调动画触发时机的关键属性。四个区间值的含义：

\`\`\`
  视口顶部 ═══════════════════════════════════
          │  ← entry（元素正在进入视口）
          │
     ┌────┴────┐
     │  元素    │  ← contain（元素完全在视口内）
     └────┬────┘
          │
          │  ← exit（元素正在离开视口）
  视口底部 ═══════════════════════════════════
          │
          ▼  cover（元素覆盖/超出整个视口）
\`\`\`

实战用法——进入时淡入，离开时淡出：

\`\`\`css
.reveal-element {
  animation: reveal linear both;
  animation-timeline: view();
  /* 三段区间接力：进入→停留→离开 */
  animation-range: entry 0% entry 30%,    /* 进入阶段 */
                  entry 30% exit 70%,      /* 停留阶段 */
                  exit 70% exit 100%;      /* 离开阶段 */
}
\`\`\`

### 命名时间线 + 视差效果

想要远近景不同速度？旧世界要手动算 scrollTop，现在：

\`\`\`css
.hero-section {
  scroll-timeline-name: --hero-scroll;   /* 给滚动区域起个名字 */
  scroll-timeline-axis: block;
  overflow-y: auto;
  height: 100svh;
}

.layer-back  { animation: drift      linear; animation-timeline: --hero-scroll; }
.layer-front { animation: drift-fast linear; animation-timeline: --hero-scroll; }

@keyframes drift      { to { translate: 0 -40px;  } }  /* 远景慢动 */
@keyframes drift-fast  { to { translate: 0 -160px; } }  /* 近景快动 */
\`\`\`

\`\`\`
  ┌─────────────────────────────────────┐
  │        视差滚动示意                   │
  │                                     │
  │  🌄 远景层 ── translateY: -40px     │  ← 动得慢，有深度感
  │  🏔 中景层 ── translateY: -100px    │
  │  🏠 近景层 ── translateY: -160px    │  ← 动得快，有临场感
  │  👤 固定层 ── 不动                   │
  └─────────────────────────────────────┘
\`\`\`

### 别忘了无障碍

\`\`\`css
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .card {
      animation: reveal linear both;
      animation-timeline: view();
    }
  }
}
\`\`\`

基础样式 = 完整可见，动画只加在 \`@supports\` + 用户不排斥动效的嵌套里。渐进增强，优雅降级。

## 二、视图过渡 API（View Transitions API）

如果说滚动动画是"锦上添花"，那 View Transitions 就是"雪中送炭"。

### 伪元素树 —— 理解过渡机制的关键

浏览器在过渡时创建的快照层级：

\`\`\`
 ::view-transition                    ← 根覆盖层（z-index 最高）
   └─ ::view-transition-group(root)   ← 分组容器
        └─ ::view-transition-image-pair(root)  ← 隔离混合层
             ├─ ::view-transition-old(root)    ← 旧页面截图（静态）
             └─ ::view-transition-new(root)    ← 新页面实时渲染
\`\`\`

### 同文档过渡（SPA）—— 一个函数搞定

\`\`\`js
function updatePage(newContent) {
  if (!document.startViewTransition) {
    renderContent(newContent);   // 不支持就降级
    return;
  }
  document.startViewTransition(() => renderContent(newContent));
}
\`\`\`

\`\`\`css
::view-transition-old(root) { animation: fade-out 200ms ease-out; }
::view-transition-new(root) { animation: fade-in  200ms ease-in;  }

@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in  { from { opacity: 0; } }
\`\`\`

### 跨文档过渡（MPA）—— 这才叫革命

**多页面应用（MPA）也能有 SPA 级别的过渡动画。**

\`\`\`
  旧页面                              新页面
 ┌──────────┐      点击 <a> 链接      ┌──────────┐
 │ .hero    │ ─────────────────────→ │ .hero    │
 │ image    │   浏览器自动截屏旧页面     │ image    │
 │          │   在新页面上做过渡动画     │          │
 └──────────┘                        └──────────┘

  只需要两行 CSS：
  @view-transition { navigation: auto; }
  .hero-image { view-transition-name: hero; }
\`\`\`

\`\`\`css
/* 两个页面都加这段 —— 就这么简单 */
@view-transition {
  navigation: auto;
}

.hero-image {
  view-transition-name: hero;   /* 同名元素自动过渡 */
}
\`\`\`

**为什么这个重要？** 过去十年我们选 SPA 最大的理由就是"页面切换要流畅"。跨文档 View Transitions 直接把这个理由干掉了——普通的 \`<a>\` 标签点击，浏览器帮你做原生级的过渡动画。

### 命名过渡 —— Hero 动画

\`\`\`css
.product-card .image {
  view-transition-name: product-image;   /* 给这个元素命名 */
}

/* 单独控制这个元素的过渡时长 */
::view-transition-old(product-image),
::view-transition-new(product-image) {
  animation-duration: 400ms;
}
\`\`\`

产品列表卡片图 → 详情页大图，自动做 Hero 共享元素动画，零 JS 库。

### 注意事项速查

\`\`\`
 ✅ 过渡时间控制在 200-300ms
 ✅ 必须给 prefers-reduced-motion: reduce 降级
 ⚠ view-transition-name 同一页面内必须唯一
 ✅ Firefox 144+ 已支持，2026 跨浏览器覆盖
\`\`\`

## 三、Popover API —— 原生弹窗，告别 z-index 地狱

先看对比——旧世界的弹窗有多痛：

\`\`\`
 旧世界弹窗的痛点                          Popover API 的解法
 ┌────────────────────────┐          ┌──────────────────────────┐
 │ ❌ z-index: 99999 还叠不住│          │ ✅ 浏览器顶层（Top Layer）  │
 │ ❌ 焦点管理全靠手写       │          │ ✅ 焦点自动进出             │
 │ ❌ ESC 关闭要监听 keydown │          │ ✅ ESC 原生支持            │
 │ ❌ 外部点击关闭要 backdrop │          │ ✅ 点击外部自动关闭         │
 │ ❌ aria-* 属性经常漏      │          │ ✅ 语义化无障碍内置          │
 │ ❌ body 滚动锁定要手写    │          │ ✅ 自动处理                 │
 └────────────────────────┘          └──────────────────────────┘
\`\`\`

Popover API 就一个属性解决所有：

\`\`\`html
<button popovertarget="my-popover">打开菜单</button>

<div id="my-popover" popover>
  <p>菜单内容</p>
  <button popovertarget="my-popover" popovertargetaction="hide">关闭</button>
</div>
\`\`\`

### 两种模式对比

\`\`\`
 auto（默认）                          manual
 ┌────────────────────┐          ┌────────────────────┐
 │ ESC 关闭     ✅     │          │ ESC 关闭     ❌     │
 │ 外部点击关闭  ✅     │          │ 外部点击关闭  ❌     │
 │ 另一个popover✅     │          │ 另一个popover❌     │
 │ 打开时自动关闭       │          │ 不会自动关闭         │
 ├────────────────────┤          ├────────────────────┤
 │ 适合：菜单、下拉     │          │ 适合：Tooltip、     │
 │ 选择器、弹出面板     │          │ Toast、通知提示     │
 └────────────────────┘          └────────────────────┘
\`\`\`

### 遮罩层样式

\`\`\`css
[popover]::backdrop {
  background: oklch(0% 0 0 / 0.5);
  backdrop-filter: blur(4px);
}
\`\`\`

### Popover vs \`<dialog>\` 怎么选？

\`\`\`
            轻量场景                          重量场景
        ┌──────────────┐              ┌──────────────────┐
        │   Popover    │              │    <dialog>       │
        │   任何元素    │              │   form 集成        │
        │   菜单/Tip    │              │   showModal()     │
        │   下拉/面板    │              │   表单/确认框      │
        └──────────────┘              └──────────────────┘
               ← 更简单                       更正式 →
\`\`\`

## 四、锚点定位（Anchor Positioning）—— Tooltip 再不需要 Popper.js

### 旧世界的痛 vs 新世界的爽

\`\`\`
 旧世界：Floating UI (Popper.js)              新世界：Anchor Positioning
 ┌────────────────────────────┐           ┌──────────────────────┐
 │ npm install @floating-ui   │           │ anchor-name: --btn;   │
 │ import { computePosition } │           │ position-anchor: --btn│
 │ 检测视口碰撞               │           │ top: anchor(bottom);  │
 │ 监听 resize               │           │ 浏览器自动跟踪位置     │
 │ 监听 scroll               │           │ 自动碰撞检测           │
 │ 来回来去算 offset          │           │ 四行 CSS 搞定 ✅      │
 │ ~500 行 JS 配置            │           │                       │
 └────────────────────────────┘           └──────────────────────┘
\`\`\`

### 基础用法

\`\`\`css
#trigger-btn {
  anchor-name: --my-button;        /* 定义锚点 */
}

#tooltip {
  position: fixed;
  position-anchor: --my-button;    /* 绑定到锚点 */
  top: anchor(bottom);             /* 定位在锚点下方 */
  left: anchor(center);            /* 水平居中 */
  translate: -50% 0;
}
\`\`\`

### 锚点定位的 9 宫格模型

anchor() 函数可以引用锚点元素的任意边：

\`\`\`
      anchor(top)
          ↓
  ┌───────────────┐
  │               │ ← anchor(start) / anchor(end)
  │   锚点元素     │
  │               │
  └───────────────┘
          ↓
      anchor(bottom)

  可用值：top / bottom / left / right / center / start / end
  百分比：anchor(50%) = 锚点宽度的 50%
\`\`\`

### 自动碰撞检测 —— 真正的杀手锏

\`\`\`css
#tooltip {
  position-anchor: --my-button;
  position-area: bottom;                       /* 默认放下面 */
  position-try-fallbacks: top, right, left;    /* 不够就自动换位置！ */
}
\`\`\`

\`\`\`
 默认：下方   空间不够？  自动尝试上方   还不行？  试右方   还不行？  试左方
 ┌──────┐     ┌──────┐     ┌──────┐     ┌──────┐     ┌──────────┐
 │ btn  │     │ btn  │     │ tip  │     │ btn  │     │ tip  btn │
 └──────┘     └──────┘     │ btn  │     └──┬───┘     └──────────┘
    ↓            ↓         └──────┘        ↓
  ┌──────┐     ⚠空间不够              ┌──────────┐
  │ tip  │    自动换位 →                │    tip   │
  └──────┘                             └──────────┘
\`\`\`

Floating UI 80% 的核心逻辑，现在四行 CSS。剩下的 20% 复杂场景（箭头自动定位、嵌套浮动）该用库还能用。

## 五、Container Queries —— 组件级响应式

Media Queries vs Container Queries 的本质区别：

\`\`\`
 Media Queries                         Container Queries
 ┌─────────────────────────┐          ┌─────────────────────────┐
 │ 问："窗口多宽？"          │          │ 问："我的容器多宽？"       │
 │                         │          │                         │
 │ ┌─────┐ ┌─────┐ ┌─────┐│          │ ┌─────┐ ┌─────┐ ┌─────┐ │
 │ │卡片 │ │卡片 │ │卡片 ││          │ │卡片 │ │卡片 │ │卡片 │ │
 │ │竖版 │ │竖版 │ │竖版 ││          │ │竖版 │ │横版 │ │竖版 │ │
 │ └─────┘ └─────┘ └─────┘│          │ └─────┘ └─────┘ └─────┘ │
 │       ↗ 全部一样         │          │   ↗ 各自独立响应容器宽度！  │
 │   600px 宽屏但三栏挤     │          │  同一页面同一组件          │
 │   每个卡片都很窄         │          │  不同容器不同布局          │
 └─────────────────────────┘          └─────────────────────────┘
\`\`\`

实战代码：

\`\`\`css
.card-wrapper {
  container-type: inline-size;      /* 声明为容器 */
  container-name: card;             /* 给容器命名 */
}

@container card (min-width: 400px) {
  .card {
    grid-template-columns: 200px 1fr;   /* 宽容器 → 图文并排 */
  }
}

@container card (max-width: 399px) {
  .card {
    flex-direction: column;             /* 窄容器 → 上下堆叠 */
  }
}
\`\`\`

同一个卡片组件，放在主内容区自动变横版，放在侧边栏自动变竖版。真正的一次写，到处自适应。

## 六、其他值得关注的新特性速览

### CSS Nesting（原生嵌套）

\`\`\`css
.card {
  background: white;

  & .title { font-size: 1.5rem; }          /* 子元素 */
  &:hover  { box-shadow: 0 4px 12px ...; } /* 伪类 */

  @container card (min-width: 400px) {      /* 嵌套 Container Query */
    grid-template-columns: 200px 1fr;
  }
}
\`\`\`

### :has() — 父选择器

\`\`\`css
.card:has(img)                 { /* 包含图片的卡片 */ }
.form-group:has(input:invalid) { /* 包含非法输入的表单组 */ }
section:has(video)             { /* 包含视频的 section */ }
\`\`\`

CSS 历史上被请求最多的特性，终于落地。

### @starting-style — 弹出动画终于能做 enter 过渡了

\`\`\`css
.popover {
  transition: opacity 0.3s, transform 0.3s;
  opacity: 1;
  transform: scale(1);

  @starting-style {            /* ← 首次渲染的起始状态 */
    opacity: 0;
    transform: scale(0.9);
  }
}
\`\`\`

弹出层出现时自动从 0.9 缩放到 1、从透明到不透明。Popover API 的最佳搭档，再也不用 setTimeout hack 做 enter 动画了。

## 七、终极对比：旧时代 vs 新时代

\`\`\`
 需求                 旧方式                            2026 原生 CSS
 ──────────────────────────────────────────────────────────────────────────
 滚动进度条     scroll 事件 + rAF + 手算%           animation-timeline: scroll()
 元素淡入       IntersectionObserver + class       animation-timeline: view()
 视差滚动       JS 监听 scrollTop                  命名 scroll-timeline
 页面过渡       SPA / Framer Motion                @view-transition
 弹窗/菜单      Popper.js + 手写焦点管理            Popover API
 Tooltip        Floating UI + resize 监听          anchor() + try-fallbacks
 组件响应式     Media Queries                      Container Queries
 父选择器       JS class 切换                       :has()
 Enter 动画     JS 强制 reflow + setTimeout         @starting-style
\`\`\`

2026 年的 CSS 已经不是那个"只会画盒子"的 CSS 了。它更快（合成器线程）、更轻（零 JS 依赖）、更声明式（代码量缩水 80%）。

最后一句：别急着把 JS 全删了换 CSS。这些新特性消灭的是那 80% 的简单场景——剩下 20% 的复杂场景，该用 JS 还是用 JS。**真正的护城河不是"我会用 CSS"或"我会用 JS"，而是知道什么时候该用什么。**
`
};
