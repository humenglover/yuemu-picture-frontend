<template>
  <div id="GuideDetailPage">
    <div v-if="article" class="detail-page-wrapper">
      
      <!-- 1. 左侧独立 DIV 智能悬浮目录 -->
      <aside class="fixed-left-toc-aside">
        <div class="toc-card-inner">
          <div class="toc-header-row">
            <i class="fas fa-list-ul"></i>
            <h4 class="toc-title">{{ $t('pages.guidesPage.toc') }}</h4>
          </div>
          <nav class="toc-list-nav">
            <a
              v-for="item in tocList"
              :key="item.id"
              class="toc-item-link"
              :class="{
                'level-1': item.level === 1,
                'level-2': item.level === 2,
                active: activeTocId === item.id
              }"
              @click.prevent="scrollToHeading(item.id)"
            >
              {{ item.text }}
            </a>
          </nav>
        </div>
      </aside>

      <!-- 2. 中间居中正文阅读大 DIV 容器 -->
      <main class="center-article-read-container">
        <!-- 返回导航 -->
        <nav class="top-back-nav">
          <a class="back-text-btn" @click="$router.push('/guides')">
            <i class="fas fa-arrow-left"></i>
            <span>{{ $t('pages.guidesPage.backToCatalog') }}</span>
          </a>
        </nav>

        <!-- 文章 Header -->
        <header class="article-hero-header">
          <h1 class="main-article-title">{{ article.title }}</h1>
          <div class="main-article-meta">
            <span class="meta-item"><i class="far fa-calendar-alt"></i> {{ article.date }}</span>
            <span class="meta-item"><i class="far fa-clock"></i> {{ article.readTimeVal }}</span>
            <span class="meta-item"><i class="fas fa-tag"></i> {{ article.tag }}</span>
          </div>
        </header>

        <!-- 正文内容 -->
        <article class="article-body-content">
          <template v-for="(block, idx) in formattedBlocksWithId" :key="idx">
            <h2 v-if="block.type === 'h2'" :id="block.id" class="article-h2" v-html="block.html"></h2>
            <h3 v-else-if="block.type === 'h3'" :id="block.id" class="article-h3" v-html="block.html"></h3>
            
            <!-- 代码块与 ASCII 架构图支持 -->
            <div v-else-if="block.type === 'code'" class="code-block-wrapper">
              <div class="code-block-header">
                <span class="code-lang-tag">{{ block.lang || 'CODE' }}</span>
                <button class="copy-code-btn" @click="copyCode(block.code || '')">
                  <i class="far fa-copy mr-1"></i>
                  <span>{{ copyStatusMap[block.code || ''] ? 'Copied!' : 'Copy' }}</span>
                </button>
              </div>
              <pre class="article-pre-code"><code>{{ block.code }}</code></pre>
            </div>

            <!-- Markdown 表格支持 -->
            <div v-else-if="block.type === 'table'" class="article-table-container">
              <table class="article-table">
                <thead v-if="block.headers">
                  <tr>
                    <th v-for="(h, hIdx) in block.headers" :key="hIdx" v-html="parseInlineMarkdown(h)"></th>
                  </tr>
                </thead>
                <tbody v-if="block.rows">
                  <tr v-for="(r, rIdx) in block.rows" :key="rIdx">
                    <td v-for="(c, cIdx) in r" :key="cIdx" v-html="parseInlineMarkdown(c)"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 实时交互效果演示卡片 (Live Interactive Feature Demo) -->
            <div v-else-if="block.type === 'demo'" class="article-interactive-demo-card">
              <!-- Demo 1: Scroll-driven animations -->
              <div v-if="block.demoId === 'scroll-driven'" class="demo-box scroll-driven-demo">
                <div class="demo-header">
                  <span class="demo-badge"><i class="fas fa-play-circle mr-1.5"></i> 实时交互效果演示：Scroll-driven Animations</span>
                </div>
                <div class="demo-scroll-container">
                  <div class="demo-scroll-content">
                    <p class="demo-tip"><i class="fas fa-hand-pointer text-blue-500 mr-1.5"></i> 试着在下框中向下滑动，观察滚动时间线驱动的流畅交互：</p>
                    <div v-for="n in 5" :key="n" class="demo-scroll-card">
                      <div class="demo-card-icon"><i class="fas fa-cubes text-blue-500"></i></div>
                      <div class="demo-card-text">
                        <strong>滚动渲染节点 #{{ n }}</strong>
                        <p>60fps 合成器线程硬件加速，零 JS 算力依赖</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Demo 2: View transitions -->
              <div v-else-if="block.demoId === 'view-transitions'" class="demo-box view-transition-demo">
                <div class="demo-header">
                  <span class="demo-badge"><i class="fas fa-play-circle mr-1.5"></i> 实时交互效果演示：View Transitions 视图切换</span>
                </div>
                <div class="demo-body">
                  <div class="demo-actions">
                    <button class="demo-btn" :class="{ active: demoLayout === 'grid' }" @click="toggleDemoLayout('grid')">
                      <i class="fas fa-th-large mr-1.5"></i> 网格模式 (Grid)
                    </button>
                    <button class="demo-btn" :class="{ active: demoLayout === 'list' }" @click="toggleDemoLayout('list')">
                      <i class="fas fa-list mr-1.5"></i> 列表模式 (List)
                    </button>
                  </div>
                  <div class="demo-cards-grid" :class="demoLayout">
                    <div v-for="n in 3" :key="n" class="demo-vt-card">
                      <div class="demo-vt-img"><i class="fas fa-image"></i></div>
                      <div class="demo-vt-info">
                        <h5>组件节点 #{{ n }}</h5>
                        <p>原生视图快照平滑过渡</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Demo 3: Popover API -->
              <div v-else-if="block.demoId === 'popover'" class="demo-box popover-demo">
                <div class="demo-header">
                  <span class="demo-badge"><i class="fas fa-play-circle mr-1.5"></i> 实时交互效果演示：Popover API 原生顶层弹窗</span>
                </div>
                <div class="demo-body text-center">
                  <p class="demo-sub-text">点击下方按钮触发原生 Popover 弹出层（位于 Top Layer 隔离层，支持 ESC 与外部点击自动闭合）：</p>
                  <div class="demo-actions justify-center">
                    <button class="demo-btn primary-gradient" @click="showDemoPopover = !showDemoPopover">
                      <i class="fas fa-window-restore mr-1.5"></i> 触发 Popover (Auto 模式)
                    </button>
                  </div>

                  <!-- Popover 模拟浮层 -->
                  <div v-if="showDemoPopover" class="demo-popover-backdrop" @click="showDemoPopover = false">
                    <div class="demo-popover-content" @click.stop>
                      <div class="popover-head">
                        <h4><i class="fas fa-shield-alt text-blue-500 mr-2"></i> 原生 Popover 弹出面板</h4>
                        <button class="close-icon" @click="showDemoPopover = false"><i class="fas fa-times"></i></button>
                      </div>
                      <p class="popover-body-p">此面板直接运行于浏览器 Top Layer，无视父节点 z-index 与 overflow: hidden 约束。</p>
                      <button class="demo-btn outline mt-3" @click="showDemoPopover = false">关闭窗口 (Esc)</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Demo 4: Anchor Positioning -->
              <div v-else-if="block.demoId === 'anchor-positioning'" class="demo-box anchor-demo">
                <div class="demo-header">
                  <span class="demo-badge"><i class="fas fa-play-circle mr-1.5"></i> 实时交互效果演示：Anchor Positioning 锚点定位与碰撞回退</span>
                </div>
                <div class="demo-body text-center">
                  <p class="demo-sub-text">切换下方定位方向，观察浮层相对于锚点目标的位置追踪：</p>
                  <div class="demo-actions justify-center mb-4">
                    <button v-for="pos in ['bottom', 'top', 'right']" :key="pos" class="demo-btn" :class="{ active: demoAnchorPos === pos }" @click="demoAnchorPos = pos">
                      定位方向: {{ pos }}
                    </button>
                  </div>
                  <div class="demo-anchor-stage">
                    <div class="demo-anchor-target">
                      <i class="fas fa-bullseye text-blue-500 mr-1.5"></i> 锚点目标 (#target-btn)
                      <div class="demo-anchor-tooltip" :class="`pos-${demoAnchorPos}`">
                        <i class="fas fa-info-circle text-blue-400 mr-1"></i> Tooltip (position-anchor: --target-btn; position-area: {{ demoAnchorPos }})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ul v-else-if="block.type === 'ul'" class="article-ul">
              <li v-for="(itemHtml, iIdx) in block.items" :key="iIdx" class="article-li" v-html="itemHtml"></li>
            </ul>
            <ol v-else-if="block.type === 'ol'" class="article-ol">
              <li v-for="(itemHtml, iIdx) in block.items" :key="iIdx" class="article-li" v-html="itemHtml"></li>
            </ol>
            <blockquote v-else-if="block.type === 'quote'" class="article-quote" v-html="block.html"></blockquote>
            <div v-else-if="block.type === 'image'" class="article-img-container">
              <img :src="block.src" :alt="block.alt" class="article-img-element" loading="lazy" referrerpolicy="no-referrer" @error="handleImgError" />
              <p v-if="block.caption" class="article-img-caption">
                <i class="fas fa-camera text-blue-500 mr-1.5"></i>{{ block.caption }}
              </p>
            </div>
            <p v-else class="article-p" v-html="block.html"></p>
          </template>
        </article>

        <!-- 底部版权及翻页 -->
        <footer class="bottom-footer-section">
          <div class="copyright-notice-bar">
            <i class="fas fa-shield-alt notice-icon"></i>
            <div>
              <strong>{{ $t('pages.guidesPage.copyrightTitle') }}</strong>
              <p>{{ $t('pages.guidesPage.copyrightDesc') }}</p>
            </div>
          </div>

          <div class="prev-next-nav-row">
            <div v-if="prevArticle" class="nav-btn-box" @click="goArticle(prevArticle.id)">
              <span class="nav-dir">← {{ $t('pages.guidesPage.prevArticle') }}</span>
              <span class="nav-name">{{ prevArticle.title }}</span>
            </div>
            <div v-if="nextArticle" class="nav-btn-box text-right" @click="goArticle(nextArticle.id)">
              <span class="nav-dir">{{ $t('pages.guidesPage.nextArticle') }} →</span>
              <span class="nav-name">{{ nextArticle.title }}</span>
            </div>
          </div>
        </footer>
      </main>

      <!-- 移动端：左侧 FAB 悬浮按钮 & 完整左侧边抽屉 (Side Drawer) -->
      <button class="mobile-toc-fab" @click="mobileTocOpen = true" title="目录">
        <i class="fas fa-list-ul"></i>
      </button>

      <div v-if="mobileTocOpen" class="mobile-toc-modal-mask" @click="mobileTocOpen = false">
        <div class="mobile-side-drawer" @click.stop>
          <div class="drawer-header">
            <h3>{{ $t('pages.guidesPage.toc') }}</h3>
            <div class="close-icon-btn" @click="mobileTocOpen = false">
              <i class="fas fa-times"></i>
            </div>
          </div>
          <nav class="drawer-toc-list">
            <a
              v-for="item in tocList"
              :key="item.id"
              class="drawer-toc-item"
              :class="{
                'level-1': item.level === 1,
                'level-2': item.level === 2,
                active: activeTocId === item.id
              }"
              @click.prevent="scrollToHeading(item.id)"
            >
              {{ item.text }}
            </a>
          </nav>
        </div>
      </div>

    </div>

    <!-- 404 / 未找到文章 -->
    <div v-else class="not-found-card">
      <h2>{{ $t('pages.guidesPage.notFoundTitle') }}</h2>
      <router-link to="/guides" class="btn-primary">{{ $t('pages.guidesPage.backToCatalog') }}</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { tm, rt } = useI18n()

const activeTocId = ref<string>('')
const mobileTocOpen = ref(false)

const articles = computed(() => {
  const raw = tm('pages.guidesPage.articles')
  if (Array.isArray(raw)) {
    return raw.map(item => ({
      id: typeof item.id === 'string' ? item.id : rt(item.id),
      categoryKey: typeof item.categoryKey === 'string' ? item.categoryKey : rt(item.categoryKey),
      tag: typeof item.tag === 'string' ? item.tag : rt(item.tag),
      icon: typeof item.icon === 'string' ? item.icon : rt(item.icon),
      title: typeof item.title === 'string' ? item.title : rt(item.title),
      desc: typeof item.desc === 'string' ? item.desc : rt(item.desc),
      content: typeof item.content === 'string' ? item.content : rt(item.content),
      readTimeVal: typeof item.readTimeVal === 'string' ? item.readTimeVal : rt(item.readTimeVal),
      date: typeof item.date === 'string' ? item.date : rt(item.date)
    }))
  }
  return []
})

const articleIndex = computed(() => {
  const currentId = route.params.id || 'a1'
  return articles.value.findIndex(a => a.id === currentId)
})

const article = computed(() => {
  if (articleIndex.value !== -1) {
    return articles.value[articleIndex.value]
  }
  return articles.value[0] || null
})

const prevArticle = computed(() => {
  if (articleIndex.value > 0) {
    return articles.value[articleIndex.value - 1]
  }
  return null
})

const nextArticle = computed(() => {
  if (articleIndex.value !== -1 && articleIndex.value < articles.value.length - 1) {
    return articles.value[articleIndex.value + 1]
  }
  return null
})

const copyStatusMap = ref<Record<string, boolean>>({})
const demoLayout = ref<'grid' | 'list'>('grid')
const showDemoPopover = ref(false)
const demoAnchorPos = ref<string>('bottom')

const toggleDemoLayout = (mode: 'grid' | 'list') => {
  demoLayout.value = mode
}

const copyCode = (codeText: string) => {
  if (!codeText) return
  navigator.clipboard.writeText(codeText).then(() => {
    copyStatusMap.value[codeText] = true
    setTimeout(() => {
      copyStatusMap.value[codeText] = false
    }, 2000)
  })
}

const parseInlineMarkdown = (text: string): string => {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener" class="article-inline-link">$1</a>')
  return html
}

interface MarkdownBlockItem {
  id?: string
  type: 'h2' | 'h3' | 'ul' | 'ol' | 'quote' | 'image' | 'code' | 'p' | 'table' | 'demo'
  text: string
  html?: string
  items?: string[]
  src?: string
  alt?: string
  caption?: string
  lang?: string
  code?: string
  demoId?: string
  headers?: string[]
  rows?: string[][]
}

const parseNormalMarkdownText = (rawText: string, result: MarkdownBlockItem[]) => {
  const rawBlocks = rawText.split(/\n\n+/).filter(Boolean)

  rawBlocks.forEach(rawBlock => {
    const trimmed = rawBlock.trim()
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean)

    if (lines.length === 0) return

    // 检查 :::demo xxx ::: 演示块
    const demoMatch = trimmed.match(/^:::demo\s+([\w\-]+)\s*:::$/)
    if (demoMatch) {
      result.push({
        type: 'demo',
        text: trimmed,
        demoId: demoMatch[1]
      })
      return
    }

    // 检查 Markdown 表格
    if (lines.length >= 2 && lines[0].includes('|') && lines[1].includes('|') && /^[\|\s\-\:]+$/.test(lines[1])) {
      const parseRow = (rowStr: string) => rowStr.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      const headers = parseRow(lines[0])
      const rows = lines.slice(2).map(parseRow).filter(r => r.length > 0)
      result.push({
        type: 'table',
        text: trimmed,
        headers,
        rows
      })
      return
    }

    // 检查图片块
    const firstLine = lines[0] || ''
    const singleImgMatch = firstLine.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (singleImgMatch) {
      let captionText: string | undefined = undefined
      if (lines.length > 1) {
        const secondLine = lines.slice(1).join(' ')
        captionText = secondLine.replace(/^\*+\s*▲?\s*图[：:]\s*/, '').replace(/\*+$/, '').trim()
      } else if (singleImgMatch[1]) {
        captionText = singleImgMatch[1].trim()
      }

      result.push({
        type: 'image',
        text: trimmed,
        alt: singleImgMatch[1] || '',
        src: singleImgMatch[2] || '',
        caption: captionText || undefined
      })
      return
    }

    // 检查混在段落中的图片
    if (trimmed.includes('![') && trimmed.includes('](')) {
      const parts = trimmed.split(/(!\[.*?\]\(.*?\))/g)
      parts.forEach(part => {
        const pTrimmed = part.trim()
        if (!pTrimmed) return
        const subMatch = pTrimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
        if (subMatch) {
          result.push({
            type: 'image',
            text: pTrimmed,
            alt: subMatch[1] || '',
            src: subMatch[2] || '',
            caption: subMatch[1] ? subMatch[1].trim() : undefined
          })
        } else if (!pTrimmed.startsWith('*▲') && !pTrimmed.startsWith('*图')) {
          result.push({
            type: 'p',
            text: pTrimmed,
            html: parseInlineMarkdown(pTrimmed)
          })
        }
      })
      return
    }

    // 无序列表
    if (lines.every(l => /^[\-\*]\s+/.test(l))) {
      const items = lines.map(l => parseInlineMarkdown(l.replace(/^[\-\*]\s+/, '')))
      result.push({ type: 'ul', text: trimmed, items })
      return
    }

    // 有序列表
    if (lines.every(l => /^\d+\.\s+/.test(l))) {
      const items = lines.map(l => parseInlineMarkdown(l.replace(/^\d+\.\s+/, '')))
      result.push({ type: 'ol', text: trimmed, items })
      return
    }

    // H2 标题
    if (trimmed.startsWith('## ')) {
      const cleanText = trimmed.replace(/^##\s*/, '')
      result.push({ type: 'h2', text: cleanText, html: parseInlineMarkdown(cleanText) })
      return
    }
    if (trimmed.length < 60 && /^(Chapter\s+[I|V|X\d]+|[一二三四五六七八九十]+|Part\s+\d+)\s*[\.\、\:]?/.test(trimmed)) {
      result.push({ type: 'h2', text: trimmed, html: parseInlineMarkdown(trimmed) })
      return
    }

    // H3 标题
    if (trimmed.startsWith('### ')) {
      const cleanText = trimmed.replace(/^###\s*/, '')
      result.push({ type: 'h3', text: cleanText, html: parseInlineMarkdown(cleanText) })
      return
    }
    if (trimmed.length < 60 && /^\d+\s*[\.\-]\s*/.test(trimmed) && !trimmed.endsWith('.')) {
      result.push({ type: 'h3', text: trimmed, html: parseInlineMarkdown(trimmed) })
      return
    }

    // 引用块
    if (trimmed.startsWith('>') || trimmed.startsWith('Note:') || trimmed.startsWith('注：') || trimmed.startsWith('注意：')) {
      const cleanText = trimmed.replace(/^>\s*/, '')
      result.push({ type: 'quote', text: cleanText, html: parseInlineMarkdown(cleanText) })
      return
    }

    // 混入无序列表的处理
    if (lines.some(l => /^[\-\*]\s+/.test(l))) {
      let currentUlItems: string[] = []
      lines.forEach(l => {
        if (/^[\-\*]\s+/.test(l)) {
          currentUlItems.push(parseInlineMarkdown(l.replace(/^[\-\*]\s+/, '')))
        } else {
          if (currentUlItems.length > 0) {
            result.push({ type: 'ul', text: '', items: [...currentUlItems] })
            currentUlItems = []
          }
          result.push({ type: 'p', text: l, html: parseInlineMarkdown(l) })
        }
      })
      if (currentUlItems.length > 0) {
        result.push({ type: 'ul', text: '', items: currentUlItems })
      }
      return
    }

    // 普通段落
    result.push({ type: 'p', text: trimmed, html: parseInlineMarkdown(trimmed) })
  })
}

const formattedBlocks = computed<MarkdownBlockItem[]>(() => {
  if (!article.value || !article.value.content) return []

  const content = article.value.content
  const result: MarkdownBlockItem[] = []

  const codeBlockRegex = /(?:```|\\`\\`\\`)(\w*)\r?\n([\s\S]*?)(?:```|\\`\\`\\`)/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index)
    if (textBefore.trim()) {
      parseNormalMarkdownText(textBefore, result)
    }

    const lang = match[1] ? match[1].trim() : 'code'
    const code = match[2]

    result.push({
      type: 'code',
      text: code,
      lang: lang || 'code',
      code: code
    })

    lastIndex = match.index + match[0].length
  }

  const textAfter = content.substring(lastIndex)
  if (textAfter.trim()) {
    parseNormalMarkdownText(textAfter, result)
  }

  return result
})

const formattedBlocksWithId = computed(() => {
  return formattedBlocks.value.map((block, idx) => {
    if (block.type === 'h2' || block.type === 'h3') {
      return { ...block, id: `heading-${idx}` }
    }
    return block
  })
})

const tocList = computed(() => {
  const list: { id: string; text: string; level: number }[] = []
  formattedBlocksWithId.value.forEach(block => {
    if (block.type === 'h2' || block.type === 'h3') {
      list.push({
        id: block.id,
        text: block.text,
        level: block.type === 'h2' ? 1 : 2
      })
    }
  })
  return list
})

const scrollToHeading = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.pageYOffset - 80
    window.scrollTo({ top, behavior: 'smooth' })
    activeTocId.value = id
    mobileTocOpen.value = false
  }
}

const handleScroll = () => {
  const headings = formattedBlocksWithId.value
    .filter(b => b.type === 'h2' || b.type === 'h3')
    .map(b => document.getElementById(b.id))
    .filter(Boolean) as HTMLElement[]

  const scrollPosition = window.pageYOffset + 120

  for (let i = headings.length - 1; i >= 0; i--) {
    const el = headings[i]
    if (el.offsetTop <= scrollPosition) {
      activeTocId.value = el.id
      break
    }
  }
}

onMounted(() => {
  window.scrollTo(0, 0)
  window.addEventListener('scroll', handleScroll, { passive: true })
  if (tocList.value.length > 0) {
    activeTocId.value = tocList.value[0].id
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

const handleImgError = (evt: Event) => {
  const target = evt.target as HTMLImageElement
  if (target && !target.dataset.fallbackTried) {
    target.dataset.fallbackTried = 'true'
    target.src = 'https://media.tenor.com/images/362a74c42416b772c8428807d9b93223/tenor.gif'
  }
}

const goArticle = (id: string) => {
  router.push(`/guides/${id}`)
  window.scrollTo(0, 0)
}
</script>

<style scoped>
#GuideDetailPage {
  min-height: 100vh;
  background: var(--background, #ffffff);
  color: var(--text-primary, #0f172a);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  padding: 40px 24px 100px;
  -webkit-font-smoothing: antialiased;
}

.detail-page-wrapper {
  position: relative;
  width: 100%;
}

/* ==================== 1. PC 端：独立侧边 DIV 智能固定目录 ==================== */
.fixed-left-toc-aside {
  position: fixed;
  top: 100px;
  left: max(24px, calc((100vw - 860px) / 2 - 280px));
  width: 250px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  z-index: 40;
}

.toc-card-inner {
  padding-right: 18px;
  border-right: 1px solid var(--border-color, #e2e8f0);
}

.toc-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--text-primary, #0f172a);
}

.toc-header-row i {
  font-size: 14px;
  color: var(--link-color, #2563eb);
}

.toc-title {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.toc-list-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toc-item-link {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 6px 10px;
  border-radius: 8px;
  display: block;
}

.toc-item-link.level-1 {
  font-weight: 600;
}

.toc-item-link.level-2 {
  padding-left: 20px;
  font-size: 12.5px;
  color: var(--text-tertiary, #94a3b8);
}

.toc-item-link:hover {
  color: var(--text-primary, #0f172a);
  background: var(--hover-background, #f1f5f9);
}

.toc-item-link.active {
  color: var(--link-color, #2563eb);
  background: rgba(37, 99, 235, 0.08);
  font-weight: 700;
}

/* ==================== 2. 中间居中正文阅读大 DIV 容器 ==================== */
.center-article-read-container {
  max-width: 860px;
  margin: 0 auto;
}

.top-back-nav {
  margin-bottom: 24px;
}

.back-text-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-text-btn:hover {
  color: var(--text-primary, #0f172a);
}

.article-hero-header {
  margin-bottom: 40px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.main-article-title {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--text-primary, #000000);
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.main-article-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
  color: var(--text-secondary, #64748b);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 沉浸式正文主体 */
.article-body-content {
  font-size: 16.5px;
  line-height: 1.85;
  color: var(--text-primary, #1e293b);
  margin-bottom: 60px;
}

.article-h2 {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
  margin: 36px 0 18px;
  padding-top: 8px;
  letter-spacing: -0.01em;
}

.article-h3 {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 24px 0 12px;
}

.article-p {
  margin-bottom: 22px;
}

.article-ul, .article-ol {
  margin: 16px 0 24px 0;
  padding-left: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.article-ul {
  list-style-type: disc;
}

.article-ol {
  list-style-type: decimal;
}

.article-li {
  font-size: 16px;
  line-height: 1.75;
  color: var(--text-primary, #334155);
}

.article-body-content :deep(strong) {
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.article-body-content :deep(.inline-code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13.5px;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  padding: 3px 7px;
  border-radius: 6px;
  border: 1px solid rgba(37, 99, 235, 0.15);
}

.article-quote {
  margin: 24px 0;
  padding: 16px 20px;
  border-left: 4px solid var(--link-color, #2563eb);
  background: var(--hover-background, #f8fafc);
  border-radius: 0 12px 12px 0;
  font-size: 15px;
  color: var(--text-secondary, #475569);
  line-height: 1.7;
}

/* 代码块与 ASCII 架构图的高级视觉排版 */
.code-block-wrapper {
  margin: 28px 0;
  border-radius: 16px;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.code-lang-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  padding: 3px 8px;
  border-radius: 4px;
}

.copy-code-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.copy-code-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.article-pre-code {
  margin: 0;
  padding: 20px 24px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 13.5px;
  line-height: 1.65;
  color: #f1f5f9;
  white-space: pre;
  tab-size: 2;
}

.article-pre-code code {
  font-family: inherit;
  background: none;
  padding: 0;
  color: inherit;
}

/* Markdown 表格排版 */
.article-table-container {
  margin: 28px 0;
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.article-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14.5px;
  text-align: left;
}

.article-table th {
  background: var(--hover-background, #f8fafc);
  padding: 12px 18px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.article-table td {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
  color: var(--text-primary, #334155);
}

.article-table tr:last-child td {
  border-bottom: none;
}

/* 动图与图片卡片容器 */
.article-img-container {
  margin: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.article-img-element {
  max-width: 100%;
  max-height: 480px;
  border-radius: 20px;
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-img-element:hover {
  transform: scale(1.01);
}

.article-img-caption {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  margin-top: 12px;
  font-style: italic;
  text-align: center;
}

/* 底部版权及翻页 */
.bottom-footer-section {
  border-top: 1px solid var(--border-color, #e2e8f0);
  padding-top: 36px;
}

.copyright-notice-bar {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 24px;
  background: var(--hover-background, #f8fafc);
  border-radius: 16px;
  border: 1px solid var(--border-color, #e2e8f0);
  margin-bottom: 36px;
  font-size: 13.5px;
  color: var(--text-secondary, #64748b);
}

.notice-icon {
  font-size: 18px;
  color: var(--link-color, #2563eb);
  margin-top: 2px;
}

.copyright-notice-bar strong {
  color: var(--text-primary, #0f172a);
  display: block;
  margin-bottom: 4px;
}

.prev-next-nav-row {
  display: flex;
  gap: 20px;
}

.nav-btn-box {
  flex: 1;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--card-background, #ffffff);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn-box:hover {
  border-color: var(--link-color, #2563eb);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}

.nav-dir {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary, #94a3b8);
  display: block;
  margin-bottom: 6px;
}

.nav-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.text-right {
  text-align: right;
}

/* ==================== 移动端：完整左侧边抽屉 (Side Drawer) ==================== */
.mobile-toc-fab {
  display: none;
  position: fixed;
  bottom: 80px;
  left: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--link-color, #2563eb);
  color: #ffffff;
  border: none;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
  font-size: 18px;
  cursor: pointer;
  z-index: 99;
}

.mobile-toc-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
}

.mobile-side-drawer {
  width: 82%;
  max-width: 320px;
  height: 100%;
  background: var(--card-background, #ffffff);
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.15);
  padding: 24px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slideInLeft 0.25s ease-out;
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.drawer-header h3 {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
}

.close-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--hover-background, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
}

.drawer-toc-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-toc-item {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary, #64748b);
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.drawer-toc-item.level-1 {
  font-weight: 600;
}

.drawer-toc-item.level-2 {
  padding-left: 26px;
  font-size: 13px;
}

.drawer-toc-item.active {
  color: var(--link-color, #2563eb);
  background: rgba(37, 99, 235, 0.08);
  font-weight: 700;
}

/* ==================== 响应式设计 (Mobile / Narrow Screens) ==================== */
@media screen and (max-width: 1400px) {
  .fixed-left-toc-aside {
    display: none; /* 中窄屏自适应隐藏固定目录，引导使用移动端 FAB 或大平阅读 */
  }
}

@media screen and (max-width: 900px) {
  #GuideDetailPage {
    padding: 20px 16px 80px;
  }

  .mobile-toc-fab {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .main-article-title {
    font-size: 26px;
    margin-bottom: 12px;
  }

  .main-article-meta {
    font-size: 12.5px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .article-body-content {
    font-size: 15.5px;
  }

  .article-h2 {
    font-size: 20px;
    margin: 32px 0 14px;
  }

  .prev-next-nav-row {
    flex-direction: column;
  }
}
</style>
