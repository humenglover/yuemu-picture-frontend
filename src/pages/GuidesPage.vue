<template>
  <div id="GuidesPage">
    <div class="guides-container">

      <!-- 1. Hero 巨幕区（左文右 3D 玻璃板） -->
      <section class="guides-hero-section">
        <div class="hero-text-content">
          <h1 class="hero-main-title">{{ $t('pages.guidesPage.title') }}</h1>
          <p class="hero-sub-description">{{ $t('pages.guidesPage.subtitle') }}</p>
          <button class="hero-explore-btn" @click="scrollToContent">
            <span>{{ $t('pages.guidesPage.explore') }}</span>
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>

        <div class="hero-3d-visual" aria-hidden="true" @mouseleave="hoveredPlate = null">
          <div
            class="glass-plate plate-1"
            :class="{ active: hoveredPlate === 1, dimmed: hoveredPlate !== null && hoveredPlate !== 1 }"
            @mouseenter="hoveredPlate = 1"
          >
            <div class="plate-badge">
              <i class="fas fa-sparkles"></i>
              <span>{{ $t('pages.guidesPage.categories.design') }}</span>
            </div>
            <div class="plate-line-glow"></div>
            <div class="plate-footer-label">{{ $t('pages.guidesPage.title') }}</div>
          </div>
          <div
            class="glass-plate plate-2"
            :class="{ active: hoveredPlate === 2, dimmed: hoveredPlate !== null && hoveredPlate !== 2 }"
            @mouseenter="hoveredPlate = 2"
          >
            <div class="plate-circle-icon"><i class="fas fa-shield-alt"></i></div>
            <span class="plate-inner-text">{{ $t('pages.guidesPage.categories.copyright') }}</span>
          </div>
          <div
            class="glass-plate plate-3"
            :class="{ active: hoveredPlate === 3, dimmed: hoveredPlate !== null && hoveredPlate !== 3 }"
            @mouseenter="hoveredPlate = 3"
          >
            <div class="plate-circle-icon"><i class="fas fa-robot"></i></div>
            <span class="plate-inner-text">{{ $t('pages.guidesPage.categories.ai') }}</span>
          </div>
        </div>
      </section>

      <!-- 2. 精选指南 区域 Header & 分类 Pill 过滤 -->
      <section class="guides-section-header" id="guides-list-anchor">
        <div class="section-title-row">
          <h2 class="section-title">{{ $t('pages.guidesPage.featured') }}</h2>
          <button class="view-all-link" @click="activeCategory = 'all'">
            <span>{{ $t('pages.guidesPage.viewAll') }}</span>
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>

        <div class="category-tabs">
          <button
            v-for="cat in categoryList"
            :key="cat.key"
            class="pill-tab-item"
            :class="{ active: activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >
            {{ cat.label }}
          </button>
        </div>
      </section>

      <!-- 3. 文章宫格网格列表 -->
      <main class="guides-grid-container">
        <div
          v-for="article in filteredArticles"
          :key="article.id"
          class="guide-card-item"
          @click="goDetail(article.id)"
        >
          <div class="card-inner-left">
            <div class="card-icon-box">
              <i :class="article.icon || 'fas fa-newspaper'"></i>
            </div>
            <div class="card-main-info">
              <div class="card-tag-badge">{{ article.tag }}</div>
              <h3 class="card-article-title">{{ article.title }}</h3>
              <p class="card-article-desc">{{ article.desc }}</p>
              <div class="card-meta-bar">
                <span class="meta-item"><i class="far fa-clock"></i> {{ article.readTimeVal }}</span>
                <span class="meta-item"><i class="far fa-calendar-alt"></i> {{ article.date }}</span>
              </div>
            </div>
          </div>

          <div class="card-action-arrow">
            <div class="arrow-circle-btn">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { tm, rt, t } = useI18n()

const activeCategory = ref('all')
const hoveredPlate = ref<number | null>(null)

onMounted(() => {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
})

const categoryList = computed(() => [
  { key: 'all', label: t('pages.guidesPage.categories.all') },
  { key: 'copyright', label: t('pages.guidesPage.categories.copyright') },
  { key: 'design', label: t('pages.guidesPage.categories.design') },
  { key: 'ai', label: t('pages.guidesPage.categories.ai') },
  { key: 'performance', label: t('pages.guidesPage.categories.performance') },
  { key: 'typography', label: t('pages.guidesPage.categories.typography') },
  { key: 'accessibility', label: t('pages.guidesPage.categories.accessibility') },
  { key: 'trends', label: t('pages.guidesPage.categories.trends') },
  { key: 'branding', label: t('pages.guidesPage.categories.branding') }
])

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
      readTimeVal: typeof item.readTimeVal === 'string' ? item.readTimeVal : rt(item.readTimeVal),
      date: typeof item.date === 'string' ? item.date : rt(item.date)
    }))
  }
  return []
})

const filteredArticles = computed(() => {
  if (activeCategory.value === 'all') return articles.value
  return articles.value.filter(a => a.categoryKey === activeCategory.value)
})

const goDetail = (id: string) => {
  router.push({ name: 'GuideDetail', params: { id: id } })
}

const scrollToContent = () => {
  const el = document.getElementById('guides-list-anchor')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
#GuidesPage {
  min-height: 100vh;
  background: var(--background, #ffffff);
  color: var(--text-primary, #0f172a);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  padding: 40px 24px 100px 24px;
  -webkit-font-smoothing: antialiased;
}

.guides-container {
  max-width: 1160px;
  margin: 0 auto;
}

/* ==================== 1. Hero 巨幕区 ==================== */
.guides-hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  padding: 40px 0 60px;
  position: relative;
}

.hero-text-content {
  flex: 1;
  max-width: 600px;
}

.hero-main-title {
  font-size: 52px;
  font-weight: 800;
  line-height: 1.15;
  color: var(--text-primary, #000000);
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}

.hero-sub-description {
  font-size: 17px;
  line-height: 1.65;
  color: var(--text-secondary, #64748b);
  margin-bottom: 32px;
}

.hero-explore-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 28px;
  border-radius: 24px;
  background: #000000;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

:deep(.dark-theme) .hero-explore-btn {
  background: #ffffff;
  color: #000000;
}

.hero-explore-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.hero-explore-btn i {
  font-size: 13px;
  transition: transform 0.2s ease;
}

.hero-explore-btn:hover i {
  transform: translateX(4px);
}

/* 3D 悬浮透光玻璃图层 (收紧右侧多余边距) */
.hero-3d-visual {
  position: relative;
  width: 350px;
  height: 280px;
  perspective: 1000px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.glass-plate {
  position: absolute;
  top: 30px;
  left: 0;
  width: 170px;
  height: 215px;
  border-radius: 22px;
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  transform-style: preserve-3d;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  cursor: pointer;
}

/* 第一层（左/前）板 */
.plate-1 {
  transform: rotateY(-18deg) rotateX(10deg) translateZ(30px) translateX(0px);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(168, 85, 247, 0.12), rgba(255, 255, 255, 0.75));
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 24px 48px rgba(37, 99, 235, 0.18);
  z-index: 3;
}

:deep(.dark-theme) .plate-1 {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(168, 85, 247, 0.2), rgba(15, 23, 42, 0.8));
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
}

/* 第二层（中）板：精简步长 (translateX 75px)，紧凑且触控顺畅 */
.plate-2 {
  transform: rotateY(-18deg) rotateX(10deg) translateZ(10px) translateX(75px);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(59, 130, 246, 0.12), rgba(255, 255, 255, 0.65));
  border: 1.5px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 20px 40px rgba(6, 182, 212, 0.16);
  opacity: 0.95;
  z-index: 2;
}

:deep(.dark-theme) .plate-2 {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.15), rgba(15, 23, 42, 0.7));
  border-color: rgba(255, 255, 255, 0.2);
}

/* 第三层（右/后）板：精简步长 (translateX 150px)，消退右侧空白 */
.plate-3 {
  transform: rotateY(-18deg) rotateX(10deg) translateZ(-10px) translateX(150px);
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.14), rgba(168, 85, 247, 0.1), rgba(255, 255, 255, 0.55));
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 16px 36px rgba(236, 72, 153, 0.14);
  opacity: 0.9;
  z-index: 1;
}

:deep(.dark-theme) .plate-3 {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.12), rgba(15, 23, 42, 0.6));
  border-color: rgba(255, 255, 255, 0.15);
}

/* 板内艺术元件 */
.plate-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #2563eb;
  letter-spacing: 0.05em;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

.plate-line-glow {
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #2563eb, #a855f7, transparent);
  margin: 16px 0;
}

.plate-footer-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.1em;
}

.plate-circle-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #2563eb;
  margin: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.plate-inner-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  text-align: center;
  margin-top: 6px;
}

/* JS 悬停激活与降级样式，防抖平滑置顶 */
.glass-plate.active {
  z-index: 20 !important;
  opacity: 1 !important;
  transform: rotateY(-8deg) rotateX(4deg) translateZ(70px) scale(1.06) !important;
  box-shadow: 0 32px 64px rgba(37, 99, 235, 0.35) !important;
  border-color: rgba(255, 255, 255, 1) !important;
}

.glass-plate.dimmed {
  opacity: 0.7;
}

/* ==================== 2. 精选指南 区域 Header ==================== */
.guides-section-header {
  margin-bottom: 32px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
  letter-spacing: -0.02em;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.view-all-link:hover {
  color: var(--text-primary, #0f172a);
}

.view-all-link i {
  font-size: 12px;
  transition: transform 0.2s ease;
}
.view-all-link:hover i {
  transform: translateX(3px);
}

/* 分类 Filter 标签 */
.category-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;
}
.category-tabs::-webkit-scrollbar {
  display: none;
}

.pill-tab-item {
  flex-shrink: 0;
  padding: 8px 18px;
  border-radius: 99px;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--card-background, #f8fafc);
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill-tab-item:hover {
  background: var(--hover-background, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.pill-tab-item.active {
  background: var(--text-primary, #0f172a);
  color: var(--background, #ffffff);
  border-color: var(--text-primary, #0f172a);
  font-weight: 600;
}

/* ==================== 3. 文章卡片网格 ==================== */
.guides-grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* 基础指南卡片 */
.guide-card-item {
  background: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 24px;
  padding: 28px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.guide-card-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.12);
}

.card-inner-left {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex: 1;
}

/* 图标正方形圆角底框 */
.card-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: var(--hover-background, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--text-primary, #0f172a);
  flex-shrink: 0;
}

.featured-large-card .card-icon-box {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  font-size: 28px;
}

.card-main-info {
  flex: 1;
}

.card-tag-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
  margin-bottom: 8px;
}

.card-article-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  line-height: 1.35;
  margin-bottom: 8px;
  transition: color 0.2s ease;
}

.featured-large-card .card-article-title {
  font-size: 24px;
}

.guide-card-item:hover .card-article-title {
  color: var(--link-color, #2563eb);
}

.card-article-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary, #64748b);
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--text-tertiary, #94a3b8);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 右侧圆形箭号按钮 */
.card-action-arrow {
  flex-shrink: 0;
}

.arrow-circle-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--hover-background, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-primary, #0f172a);
  transition: all 0.25s ease;
}

.guide-card-item:hover .arrow-circle-btn {
  background: var(--text-primary, #0f172a);
  color: var(--background, #ffffff);
  border-color: var(--text-primary, #0f172a);
  transform: scale(1.08);
}

/* ==================== 响应式 / 移动端触控优化 (Mobile Friendly) ==================== */
@media screen and (max-width: 900px) {
  .hero-main-title { font-size: 38px; }
  .hero-3d-visual { width: 300px; height: 220px; }
  .glass-plate { width: 130px; height: 160px; }
}

@media screen and (max-width: 768px) {
  #GuidesPage {
    padding: 20px 16px 80px;
  }

  .guides-hero-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
    padding: 20px 0 36px;
  }

  .hero-main-title {
    font-size: 32px;
    margin-bottom: 12px;
  }

  .hero-sub-description {
    font-size: 15px;
    margin-bottom: 24px;
  }

  .hero-3d-visual {
    display: none;
  }

  .guides-grid-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .guide-card-item {
    padding: 20px 16px;
    border-radius: 20px;
    flex-direction: row;
    align-items: center;
  }

  .guide-card-item.featured-large-card {
    padding: 22px 18px;
  }

  .card-inner-left {
    gap: 14px;
  }

  .card-icon-box,
  .featured-large-card .card-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    font-size: 18px;
  }

  .card-article-title,
  .featured-large-card .card-article-title {
    font-size: 17px;
    margin-bottom: 6px;
  }

  .card-article-desc {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .card-meta-bar {
    font-size: 12px;
    gap: 12px;
  }

  .arrow-circle-btn {
    width: 36px;
    height: 36px;
    font-size: 12px;
  }
}
</style>
