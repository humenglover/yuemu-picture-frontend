export default {
  id: 'a4',
  categoryKey: 'performance',
  tag: '性能优化',
  icon: 'fas fa-tachometer-alt',
  title: 'Web 媒体性能优化指南',
  desc: '从 WebP/AVIF 转换到响应式图片与 LCP 极速加载策略。',
  readTimeVal: '14 分钟',
  date: '2026-07-10',
  content: `先给你看一组我亲身经历的血泪数据。去年接了个图库项目，首屏 LCP——**8.4 秒**。8.4 秒什么概念？Google 的研究数据摆在那：加载超过 3 秒，53% 的移动用户直接关页面走人。你的页面加载了 8.4 秒，等于超过一半的用户根本没看到你的内容长什么样就已经走了。一股"辛辛苦苦做半年，一秒回到解放前"的感觉。

看到 Lighthouse 跑出来 8.4 秒的那一刻，屏幕前所有人的反应：

![看着无压缩原图导致 8.4 秒的 LCP 加载卡顿时的现场写真](/gifs/lcp_rage.gif)
*▲ 图：看到 LCP 8.4 秒那一刻，想把整个 assets 文件夹删了重来的冲动*

三周之后，LCP 压到了 1.2 秒——降了 85%。跳出率断崖式下降。那个酸爽，比任何设计改版带来的数据提升都过瘾。

今天就聊聊这些东西——都不是什么高深理论，全是能直接复制的实操。

## 一、图片格式选型——WebP 还是 AVIF？别纠结了

### 先说结论：AVIF 给最好的体验，WebP 当保底，JPEG 做最后兜底

- **AVIF**：比 JPEG 小 30-50%，同等质量下体积断崖式下降。2026 年全球浏览器覆盖率 94%，主流浏览器全支持。唯一的毛病是编码慢——比 JPEG 慢 8-10 倍。所以别想着运行时转码，一定是**构建时或者 CDN 边缘节点提前转好的**。另外 AVIF 还没有渐进式解码，大图加载是一下子蹦出来的，没有那种"从模糊到清晰"的过渡。
- **WebP**：比 JPEG 小 25-34%，覆盖率 97%。最稳妥的选择。没有 HDR 支持，但日常场景完全够用。如果你只能选一个格式，选 WebP——兼容性就是王道。
- **JPEG XL**：Safari 17+ 原生支持，Chrome 145 在 2026 年 2 月重新加回了支持（虽然还在 flag 后面）。前景很好但目前别当主力——当个归档格式挺好的。
- **JPEG / PNG**：最后的兜底。永远保留一套，以防万一。

### \`<picture>\` 标签的正确姿势

\`\`\`html
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="首屏大图" width="1200" height="630" />
</picture>
\`\`\`

浏览器从上往下读，认识 AVIF 就用 AVIF，不认识就看 WebP，两个都不认识就老老实实 JPEG。优雅降级，就这么简单。

## 二、响应式图片——别让 5 寸屏去下载一张 4K 原图

你花了好大劲压了一张 AVIF 到 200KB，结果手机端的 375px 宽度还是下载了这张 1920px 宽的图——这不是白压了吗？

### srcset + sizes 的正确用法

\`\`\`html
<img
  srcset="
    photo-400w.jpg  400w,
    photo-800w.jpg  800w,
    photo-1200w.jpg 1200w,
    photo-1920w.jpg 1920w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  "
  src="photo-1200w.jpg"
  alt="展示图"
  width="1920"
  height="1080"
/>
\`\`\`

两个关键点：第一，**sizes 不能省**——不写的话浏览器默认按 100vw 选图，你的 srcset 等于白写，移动端照样下载桌面大图。第二，用 w 描述符而不是具体的 1x/2x——浏览器会根据设备像素比和网络状况自己选最优的那张。

### 最大的坑：Layout Shift

你是不是遇到过——正看得好好的，突然一张图加载出来把整个页面往下蹬了三屏？

![未预留尺寸导致的 CLS 布局剧烈跳跃](/gifs/cls_shake.gif)
*▲ 图：图片加载完页面疯狂跳动——CLS 直接飙红*

解法简单到离谱：**给所有 img 标签加 width 和 height 属性。** 浏览器会自动根据这两个属性计算出宽高比，在图片加载前就把位置给你预留好。配合 CSS 的 \`width: 100%; height: auto;\`，响应式和防抖动一举两得。那个古老的 padding-bottom hack 可以彻底扔进历史垃圾桶了。

## 三、LCP 极速加载——这几招是真的要命

### 第一招：首屏大图，别用 lazy loading

这可能是性能优化里最反直觉的一条规则。\`loading="lazy"\` 是好东西——**但不能用在 LCP 图片上**。你的首屏最大图如果挂了 lazy，浏览器要等到布局算完才决定加载它，白白浪费好几秒。

LCP 图片 vs 折叠线以下图片的处理策略是完全相反的：

| 属性 | LCP 首屏图 | 折叠线以下的图 |
|---|---|---|
| \`loading\` | \`eager\`（默认） | \`lazy\` |
| \`fetchpriority\` | \`high\` | \`auto\` |
| \`decoding\` | \`sync\` | \`async\` |

记住一句话：**整站最多一张图加 \`fetchpriority="high"\`**。所有图都是高优先级 = 没有图是高优先级。浏览器的优先级系统就这么简单粗暴。

### 第二招：preload 首屏图——但别瞎 preload

如果你首屏大图是通过 CSS background 或者 JS 动态加载的，浏览器发现它的时候已经晚了。这时候用 link preload 抢跑：

\`\`\`html
<link
  rel="preload"
  as="image"
  imagesrcset="hero-800w.avif 800w, hero-1600w.avif 1600w"
  imagesizes="100vw"
  fetchpriority="high"
/>
\`\`\`

preload 的图一定要带 \`imagesrcset\` 和 \`imagesizes\`，不然移动端也 preload 一张 1600px 的图，你的 AVIF 又白压了。而且 preload 是优先级最高的资源提示——用多了反而会挤掉其他关键资源的带宽。只 preload 你的 LCP 图，别的别碰。

### 第三招：格式谁做主，CDN 说了算

手动给每张图转 AVIF、WebP、JPEG 三套格式太反人类了。现代的方案是**让 CDN 或图片服务自动判断 Accept 头**，用户浏览器支持什么就返回什么格式和尺寸。你只保存最高质量的原图，剩下的全交给 CDN 边缘节点实时处理。imgix、Cloudinary、Cloudflare Images——随便选一个，都比你自己手动管理强一百倍。

把这些骚操作全部配置完的那一刻：

![黑客级性能优化操作](/gifs/hacker.gif)
*▲ 图：AVIF、srcset、fetchpriority 一套连招，感觉自己像个性能黑客*

Lighthouse 跑分飙到 98 分的那个瞬间：

![Lighthouse 跑分 98 分狂欢](/gifs/celebrate.gif)
*▲ 图：LCP 1.2 秒、跑分 98——那一刻的快乐，懂的都懂*

## 四、最后说一嘴

性能优化这玩意吧，最魔幻的地方在于——**用户不会因为你快而夸你，但一定会因为慢而骂你。** 做得好是空气，做得不好是毒气。

别追求完美。先把上面这三个优先级最高的搞定：**首屏图优先加载、响应式图片别让手机下桌面图、所有图片加宽高防抖动。** 这三板斧下去，你的 LCP 和 CLS 就已经赢了 80% 的网站。

优化不是一锤子买卖。代码上线之后，盯着 Lighthouse Report 和最慢的几条真实用户数据（CrUX / RUM），看一次改一次。性能这玩意，是磨出来的。`
};
