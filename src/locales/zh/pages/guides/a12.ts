export default {
  id: 'a12',
  categoryKey: 'design',
  tag: '视觉设计',
  icon: 'fas fa-wand-magic-sparkles',
  title: '动效设计完全指南：缓动曲线、时长节奏与微交互',
  desc: '从 Disney 动画十二法则的 UI 化应用，到缓动曲线选型、时长 Token 体系与 reduced-motion 无障碍适配。',
  readTimeVal: '16 分钟',
  date: '2026-07-22',
  content: `一个按钮被点击时是死板地变色，还是轻微下压然后弹回来——这个差异，就是你产品的"体感"。用户不会说"这个动效好棒"，但他们会觉得"这个产品好用"。反过来，生硬的瞬间跳变会让产品一股廉价感。

动效不是装饰，是交互语言。今天聊聊怎么建立一套专业的动效体系。

![顺畅动效的快感](/gifs/a12_smooth.gif)
*▲ 图：精心调校的动效带来的体感——不是"好看"，是"对了"*

## 一、时长法则（The 100/300/500 Rule）

功能性越强，动画越短。这套阶梯是经过大量实际产品验证的：

| 时长 | 适用场景 | 示例 |
|---|---|---|
| 100-150ms | 即时反馈 | 按钮按下、开关切换、hover 变色 |
| 200-300ms | 状态变化 | 菜单展开、Tooltip 出现、模态框弹入 |
| 300-500ms | 布局变化 | 手风琴展开、抽屉滑出、页面过渡 |
| 500-800ms | 入场动画 | Hero 内容揭示、首次引导动画 |

三条补充规则：

- **退出动画约为进入动画的 75% 时长**——用户关心内容出现，不关心内容消失，别拖着。
- **80ms 以下大脑感知不到延迟**——低于这个阈值就是"瞬间"。
- **任何动画不超过 5 秒**——超过了必须提供暂停/停止/隐藏机制（WCAG 2.2 明确要求）。

### 交错延迟（Stagger）

列表项依次出现时，每项之间的延迟控制在 40-80ms，总交错时长不超过 800ms。

\`\`\`css
.menu-item {
  opacity: 0;
  animation: fade-in 200ms ease-out forwards;
}
.menu-item:nth-child(1) { animation-delay: 0ms; }
.menu-item:nth-child(2) { animation-delay: 50ms; }
.menu-item:nth-child(3) { animation-delay: 100ms; }
.menu-item:nth-child(4) { animation-delay: 150ms; }
.menu-item:nth-child(5) { animation-delay: 200ms; }
\`\`\`

## 二、缓动曲线（Easing）—— 动效的灵魂

**默认的 \`ease\` 关键字不要用。** 它是浏览器做的一个折中值，什么场景都不够好。\`linear\` 更是禁区——自然界不存在匀速运动，只有进度条和无限旋转才用它。

### 四条推荐曲线

| 曲线名 | cubic-bezier 值 | 适用场景 |
|---|---|---|
| ease-out-expo | `(0.16, 1, 0.3, 1)` | 入场动画：快速进入，缓缓停稳 |
| ease-out-quart | `(0.25, 1, 0.5, 1)` | 日常默认：比 expo 略柔和 |
| ease-in | `(0.5, 0, 0.75, 0)` | 退出动画：加速离开 |
| ease-in-out | `(0.65, 0, 0.35, 1)` | 状态切换：来回对称 |

![缓动曲线对比](/gifs/a12_easing.gif)
*▲ 图：同一位移、不同缓动——linear 像机器人，ease-out 像呼吸，bounce 像十年前的网页*

### 避坑

- 入场用 ease-in 会让界面感觉迟钝——加速意味着开头慢。
- bounce 和 elastic 曲线在 2015 年流行过，2026 年看就是一股"AI 生成痕迹"。
- 不要用 \`transition: all\`——只过渡你真正需要动画化的属性。

### Spring（弹簧动画）vs cubic-bezier

| 场景 | 推荐方案 |
|---|---|
| 可中断的手势交互（拖拽、滑动） | Spring（\`stiffness\` + \`damping\`） |
| 不可中断的进出场（模态框、Toast） | cubic-bezier（确定性强，不弹跳） |

推荐参数——Snappy：stiffness 700 / damping 38；Standard UI：stiffness 400 / damping 40。阻尼比控制在 0.7 以上，避免可见震荡。

## 三、微交互的四个要素

Dan Saffer 将微交互拆成四个部分。所有你能想到的动效都逃不出这个框架：

| 要素 | 定义 | 示例 |
|---|---|---|
| Trigger（触发器） | 谁启动的？用户操作还是系统状态？ | 点击按钮、滚动到位置、收到通知 |
| Rules（规则） | 触发后发生什么逻辑？ | 点赞数 +1、已读标记清除 |
| Feedback（反馈） | 用户怎么知道发生了什么？ | 按钮变色、数字弹跳、振动、音效 |
| Loops & Modes（循环与模式） | 重复发生时的行为变化 | 第二次点赞取消、长按进入编辑模式 |

**反馈必须在 100ms 内开始**——超过这个时间用户会觉得"没反应"，然后重复点击，然后出事。

## 四、只动画化 transform 和 opacity

这是动效性能的第一铁律。动画化不同 CSS 属性对性能的消耗天差地别：

| 属性 | 触发重排 | 触发重绘 | 触发合成 | 性能 |
|---|---|---|---|---|
| \`transform\` | 否 | 否 | 是 | 60fps |
| \`opacity\` | 否 | 否 | 是 | 60fps |
| \`color\` / \`background\` | 否 | 是 | 否 | 可用，次优 |
| \`width\` / \`height\` | 是 | 是 | 否 | 禁止动画化 |
| \`top\` / \`left\` / \`margin\` | 是 | 是 | 否 | 禁止动画化 |

需要展开/收起高度变化时，不要动画化 \`height\`，用 \`grid-template-rows\`：

\`\`\`css
.collapsible {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}
.collapsible.open {
  grid-template-rows: 1fr;
}
\`\`\`

\`will-change\` 只在动画即将开始时设置，不要把它挂在所有元素上——它会让浏览器预分配 GPU 内存，用多了反而卡。

## 五、Disney 十二法则在 UI 中的应用

Disney 的 Ollie Johnston 和 Frank Thomas 在 1981 年总结的动画原则，到今天仍然是教科书。挑最关键的六条说 UI 实战：

| 法则 | UI 应用 |
|---|---|
| Squash & Stretch | 按钮按下时 scaleX/scaleY 微调（0.95-1.05），赋予重量感 |
| Anticipation | 下拉刷新时的"蓄力"提示、hover 状态的预反馈 |
| Staging | 弹窗打开时背景变暗，把焦点舞台交给核心内容 |
| Follow Through | 开关过冲回弹、涟漪扩散、菜单项依次入场 |
| Slow In & Slow Out | 所有缓动曲线的基础——自然界没有匀速 |
| Exaggeration | 错误状态抖动 3-5px（不是 20px）、成功动效略微夸张 |

## 六、动效 Token 体系

像 Design Token 一样，动效也需要 Token 化。

| Token 类型 | 示例 | 说明 |
|---|---|---|
| Duration | \`--ms-150\`、\`--ms-300\`、\`--ms-500\` | 几何级数：50, 100, 150, 200, 300, 500, 800ms |
| Easing | \`--ease-out\`、\`--ease-in\`、\`--ease-in-out\` | 只定义 3-4 条，全站复用 |
| Semantic | \`--motion-toast-in\`、\`--motion-modal-out\` | 按意图命名，组件只引用这一层 |

\`\`\`css
:root {
  --ms-150: 150ms;
  --ms-300: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:  cubic-bezier(0.5, 0, 0.75, 0);

  --motion-toast-in:  var(--ms-300) var(--ease-out);
  --motion-toast-out: var(--ms-200) var(--ease-in);
}
\`\`\`

## 七、无障碍：prefers-reduced-motion 不是可选项

大约 35% 的 40 岁以上成年人有不同程度的前庭障碍。动画可能引起眩晕、恶心。

| 做法 | 说明 |
|---|---|
| 缩短时长 | 所有 duration Token 降到 100ms 以内 |
| 用 opacity 替代位移 | 淡入淡出代替滑动、弹跳 |
| 保留功能性动画 | 进度条、Loading Spinner 保留但降速 |
| 去除空间位移 | translate、parallax、spring overshoot 全部归零 |
| 禁用 auto-play | 自动播放的轮播、视频背景必须可暂停 |

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  :root {
    --ms-300: 100ms;
    --ms-500: 100ms;
    --motion-toast-in: var(--ms-100) var(--ease-out);
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
\`\`\`

## 八、总结

![微交互的愉悦](/gifs/a12_micro.gif)
*▲ 图：好的动效不说话，但它让你觉得"这个产品懂我"*

动效设计的核心就三句话：

**200-300ms 能解决的事别拖到 500ms。** 快的动效是工具，慢的动效是表演。工具要快，表演要克制。

**只动画化 transform 和 opacity。** 其他属性动画化 = 主线程卡顿 = 60fps 保不住。

**动效 Token 化。** 像颜色和间距一样，把时长和缓动做成变量。一个按钮的 hover 动效和另一个按钮的 hover 动效如果时长不一样，用户能感觉到——他说不出来，但他会觉得"这个产品不太对"。`
};
