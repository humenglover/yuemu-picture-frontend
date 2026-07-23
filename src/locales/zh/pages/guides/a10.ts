export default {
  id: 'a10',
  categoryKey: 'design',
  tag: '视觉设计',
  icon: 'fas fa-cubes',
  title: '设计系统从零搭建完全指南：Design Tokens 到组件库工程化',
  desc: '从三层 Token 架构、Figma Variables 实操到 CI/CD 自动同步，一套可落地的设计系统工程化方案。',
  readTimeVal: '18 分钟',
  date: '2026-07-05',
  content: `做过三个以上项目的前端应该都有这种体验：每个项目颜色不一样、间距不一样、圆角不一样，甚至同一个按钮在各个页面长得都不一样。设计师换了三轮，设计稿里光蓝色就有 #2563eb、#1d4ed8、#3b82f6、#2083f2 四种——没人分得清哪个才是"品牌蓝"。

![设计系统混乱现场](/webm/a10_chaos.webm)
*▲ 图：没有设计系统的团队日常——每个页面颜色都不一样，每次改个按钮要改二十个文件*

这就是没有设计系统的下场。今天聊的，就是怎么从零搭一套能真正落地、能跟代码同步、不会烂尾的设计系统。

## 一、Design Tokens 三层架构 —— 设计的"变量系统"

设计系统最底层的概念就是 Design Tokens——把颜色、间距、字号、圆角这些"设计决策"变成命名变量。但直接甩一堆变量名出来没用，得有层级。

### 三层架构说明

**Layer 1 — 原始 Token（Primitive / Global）**

定义原子值，不直接用于组件。例如：blue.500 = #2563eb，neutral.900 = #111827，space.12 = 48px。

**Layer 2 — 语义 Token（Semantic）**

用"意图"而非"具体值"来表达。例如：color.brand.primary 引用 blue.500，color.text.primary 引用 neutral.900，spacing.section.xl 引用 space.12。这一层的值全部使用 alias（别名引用），不直接填色值。

**Layer 3 — 组件 Token（Component-specific）**

组件直接引用这一层。例如：button.primary.bg 引用 color.brand.primary，card.padding.x 引用 spacing.section.lg。换品牌时，只改 Layer 1，Layer 2 和 Layer 3 自动跟随，所有组件不需要动一行代码。

**为什么必须分三层？** 假设你的品牌色从蓝变绿——只改 Layer 1 的 blue.500 映射到 green.500，Layer 2 的 color.brand.primary 自动跟着变，所有组件自动刷新。不分层的话，每个组件的颜色都得手动改一遍。

### Token 命名规范

- \`color.brand.primary\`：以语义命名，换了颜色名不变
- 不要用 \`color.blue.500\`：以值命名，换颜色名就得全局搜索替换
- \`spacing.section.xl\`：表达用途
- 不要用 \`spacing.48px\`：绑定具体值
- 推荐结构：\`{类别}.{属性}.{变体}.{状态}\`，例如 \`color.text.primary.hover\`

## 二、Figma Variables —— 把 Token 落到设计工具里

Figma Variables 是 Figma 原生实现 Design Tokens 的机制。2026 年支持的类型包括 Color、Number、String、Boolean。

### 变量集合（Collections）推荐结构

**Collection 1: Primitives（原始值）**：直接定义原子值。blue/500 = #2563eb，neutral/50 = #f9fafb，neutral/900 = #111827，space/4 = 16px，space/8 = 32px，radius/md = 8px，font/xl = 32px。

**Collection 2: Semantic（语义层）**：所有值都用 alias 引用 Primitives。color/brand/primary → blue/500，color/text/primary → neutral/900，spacing/section/xl → space/8。这是最关键的一层——换品牌时只改 Primitives 的映射关系，Semantic 层完全不用动。

**Collection 3: Components（组件层，可选）**：button/primary/bg → color/brand/primary，card/padding/x → spacing/section/lg。企业级多品牌场景才需要这一层，小团队做到 Semantic 就够。

### Modes 做主题切换

同一个 Semantic Token，在不同 Mode 下映射到不同的 Primitive 值。以 \`color/bg/primary\` 为例：

| Mode | 映射值 |
|---|---|
| Light | #FFFFFF |
| Dark | neutral/900 |
| High Contrast | #000000 |

设计师在 Figma 里切换 Mode，整页自动换肤。前端在代码里切换 \`data-theme\`，CSS 变量自动换值。做到这一步，设计稿和代码共享同一套变量体系了。

## 三、组件库搭建 —— 先做 10 个核心组件

别一上来就想做 50 个组件。V1 阶段只做这 10 个核心的：Button、Input、Select、Modal、Card、Badge、Avatar、Toast、Tabs、Table。用了再迭代。

### 组件构建原则

**第一，所有视觉属性引用 Token，禁止硬编码。** 用 \`var(--color-brand-primary)\` 而不是 \`#2563eb\`。

**第二，先定义所有状态，再设计默认状态。** 覆盖 default → hover → active → focus → disabled → loading → error，七种状态一个不能少。

**第三，Figma 组件命名和代码组件命名保持一致。** 比如 Figma 中 \`Type=Primary, Size=Medium, State=Hover\` 应对应代码中 \`<Button variant="primary" size="md" />\`。

**第四，用 Auto Layout 做间距。** 别手动拖像素。

### 常见陷阱

- 不要过早 token 化——单页活动站用 CSS 变量就够，不需要完整三层架构
- 不要跳过 Semantic 层——直接从 Primitive 到 Component，换品牌时每个组件都得手动改
- 不要一次做 50 个组件——V1 只做 10 个核心的
- 用 detach 测试验证——设计师宁愿解除组件关联也要改，说明组件设计有问题，不是人的问题

## 四、工程化同步 —— Figma 到 Code 的自动化管线

设计系统最大的敌人不是"做不出来"，是"设计改了代码没改"。

![设计代码同步](/webm/a10_sync.webm)
*▲ 图：设计系统 CI/CD 管线——Figma 变量更新后自动推送到 Git，触发构建，发布到 npm*

### 推荐同步架构

整条管线分四步：

**第一步**：设计师在 Figma 中通过 Tokens Studio 插件修改变量后 push 到 Git 仓库。

**第二步**：GitHub Action 检测到 token 文件变更，触发 Style Dictionary 构建。

**第三步**：Style Dictionary 读取 JSON 格式的 token 定义，生成多平台产物——CSS Variables（Web）、Swift Constants（iOS）、Kotlin Objects（Android）。

**第四步**：构建产物自动发布到 npm / CocoaPods，前端和移动端各自更新依赖即可生效。

全程设计师不需要碰代码，前端不需要手动改 CSS 变量。一次修改，全平台同步。

### Style Dictionary 配置示例

\`\`\`js
module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{ destination: 'variables.css', format: 'css/variables' }],
    },
    swift: {
      transformGroup: 'swift',
      buildPath: 'dist/ios/',
      files: [{ destination: 'DesignTokens.swift', format: 'ios-swift/class.swift' }],
    },
  },
};
\`\`\`

构建产物示例：

\`\`\`css
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

## 五、多品牌 / 多主题扩展

当需要维护多套品牌（主品牌 + 子品牌）或多套主题时，Semantic Layer 保持稳定不变，只换不同品牌/主题下 Primitive 的映射。例如 color/brand/primary 在 Brand A 下映射 blue/500，在 Brand B 下映射 green/500。

Figma 的做法是使用 Extended Collections：Parent Collection 存放共享的 Semantic Token，Child Collection A 存放 Brand A 的 Primitive，Child Collection B 存放 Brand B 的 Primitive。编辑 Parent 时所有 Child 自动更新，编辑单个 Child 时只影响那个品牌。

## 六、衡量设计系统是否成功的三个指标

**组件使用率**：Figma 中组件实例数占总元素数的比例。低于 80% 意味着组件不够用，或者设计师根本不知道有这些组件。

**Detach 率**：设计师解除组件关联的比例。高于 20% 意味着组件设计不能覆盖真实场景，需要重新审视组件设计。

**3 分钟测试**：一个新加入的设计师能否在 3 分钟内找到、放置、配置一个按钮？做不到，说明组件库太难用。

## 七、总结

![设计系统搭建完成](/webm/a10_build.webm)
*▲ 图：设计系统不是"做一套好看的组件文档"——它是让你的设计决策变成可复用、可同步、可追溯的代码资产*

设计系统 = 设计决策 × 工程化。Design Tokens 对应 CSS Variables，Figma Variables 对应 Style Dictionary，Components 对应 Component Library，中间由 CI/CD 管线自动同步。

最后一句大实话：**设计系统最大的价值不是"统一了颜色和间距"，而是让你的团队不再为"这个按钮到底该长什么样"开会。** 省下来的时间，拿去做真正重要的事。`
};
