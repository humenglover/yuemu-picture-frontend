<template>
  <div id="AboutPage">
    <!-- ==================== 1. HERO 商业巨幕区 (带 ParticleBackground 动态粒子) ==================== -->
    <section class="hero-section">
      <ParticleBackground />

      <div class="hero-container">
        <h1 class="hero-title">
          {{ $t('pages.aboutPage.title') }}
        </h1>

        <p class="hero-subtitle">
          {{ $t('pages.aboutPage.subtitle') }}
        </p>

        <div class="hero-buttons">
          <router-link :to="{ name: 'Discovery' }" class="btn-brand-primary">
            <span>{{ $t('pages.aboutPage.exploreBtn') }}</span>
            <div class="btn-icon-circle">
              <i class="fa-solid fa-arrow-right icon-arrow"></i>
            </div>
          </router-link>
          <router-link :to="{ name: 'UserLogin' }" class="btn-brand-secondary">
            <span>{{ $t('pages.aboutPage.startBtn') }}</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ==================== 2. 中间简约高级双重圆角 (Doppelrand) Bento 矩阵 ==================== -->
    <section class="matrix-section reveal-on-scroll">
      <div class="section-container">
        <div class="section-header text-center">
          <h2 class="section-title">{{ $t('pages.aboutPage.matrixTitle') }}</h2>
          <p class="section-sub">{{ $t('pages.aboutPage.matrixSub') }}</p>
        </div>

        <div class="bento-grid">
          <!-- Card 1: AI 视觉与无缝扩图 (2/3 宽度) -->
          <div class="bento-card col-span-2 outer-shell">
            <div
              class="inner-card ai-suite-card"
              style="background-image: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%), url(https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80)"
            >
              <div class="card-top-row">
                <span class="pill-badge blue-pill">
                  <i class="fa-solid fa-wand-magic-sparkles mr-1"></i> {{ $t('pages.aboutPage.badgeAi') }}
                </span>
                <span class="pill-badge ghost-pill">FLUX.1-SDXL</span>
              </div>

              <div class="card-bottom-content">
                <h3 class="card-title">{{ $t('pages.aboutPage.aiSuiteTitle') }}</h3>
                <p class="card-desc">{{ $t('pages.aboutPage.aiSuiteDesc') }}</p>
                <div class="mock-prompt-bar">
                  <i class="fa-solid fa-sparkles text-blue-400 mr-2"></i>
                  <span>{{ $t('pages.aboutPage.aiPrompt') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: 数字著作权与区块链确权 (1/3 宽度) -->
          <div class="bento-card col-span-1 outer-shell">
            <div class="inner-card shield-card">
              <div class="card-top-row">
                <span class="pill-badge emerald-pill">
                  <i class="fa-solid fa-shield-halved mr-1"></i> {{ $t('pages.aboutPage.badgeShield') }}
                </span>
              </div>

              <div class="shield-body text-center">
                <div class="wax-stamp-circle">
                  <i class="fa-solid fa-award"></i>
                </div>
                <h3 class="card-title">{{ $t('pages.aboutPage.shieldTitle') }}</h3>
                <p class="card-desc">{{ $t('pages.aboutPage.shieldDesc') }}</p>
                <div class="hash-tag-chip">{{ $t('pages.aboutPage.shieldHash') }}</div>
              </div>
            </div>
          </div>

          <!-- Card 3: 团队协同与 50GB 空间 (1/3 宽度) -->
          <div class="bento-card col-span-1 outer-shell">
            <div class="inner-card space-card">
              <div class="card-top-row">
                <span class="pill-badge purple-pill">
                  <i class="fa-solid fa-folder-closed mr-1"></i> {{ $t('pages.aboutPage.badgeSpace') }}
                </span>
              </div>

              <div class="space-body">
                <h3 class="card-title">{{ $t('pages.aboutPage.spaceTitle') }}</h3>
                <p class="card-desc">{{ $t('pages.aboutPage.spaceDesc') }}</p>

                <div class="space-widget-box">
                  <div class="quota-text-row">
                    <span>{{ $t('pages.aboutPage.spaceQuota') }}</span>
                  </div>
                  <div class="progress-bg">
                    <div class="progress-bar-fill" style="width: 65%;"></div>
                  </div>
                  <div class="avatars-online-row">
                    <div class="avatar-circle a1">A</div>
                    <div class="avatar-circle a2">B</div>
                    <div class="avatar-circle a3">C</div>
                    <span class="online-tag">{{ $t('pages.aboutPage.spaceOnline') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: 创作者聚光灯画廊 (2/3 宽度) -->
          <div class="bento-card col-span-2 outer-shell">
            <div class="inner-card spotlight-bento-card">
              <div class="card-top-row">
                <span class="pill-badge amber-pill">
                  <i class="fa-solid fa-camera mr-1"></i> {{ $t('pages.aboutPage.badgeCommunity') }}
                </span>
              </div>

              <h3 class="card-title">{{ $t('pages.aboutPage.spotlightTitle') }}</h3>
              <p class="card-desc">{{ $t('pages.aboutPage.spotlightSub') }}</p>

              <div class="creators-mini-grid">
                <div v-for="(creator, idx) in creatorList" :key="idx" class="creator-mini-item">
                  <div
                    class="creator-mini-img"
                    :style="{ backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), url(' + creator.imgUrl + ')' }"
                  >
                    <div class="mini-art-title">{{ creator.artTitle }}</div>
                  </div>
                  <div class="creator-mini-meta">
                    <div class="c-name">{{ creator.name }}</div>
                    <div class="c-role">{{ creator.role }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ==================== 3. 平台维度优势对比 Matrix (新增) ==================== -->
    <section class="compare-section reveal-on-scroll">
      <div class="section-container">
        <div class="section-header text-center">
          <h2 class="section-title">{{ $t('pages.aboutPage.compareTitle') }}</h2>
          <p class="section-sub">{{ $t('pages.aboutPage.compareSub') }}</p>
        </div>

        <div class="compare-card-container">
          <div class="compare-table">
            <div class="table-header-row">
              <div class="col-feature">{{ $t('pages.aboutPage.compareColFeature') }}</div>
              <div class="col-traditional">{{ $t('pages.aboutPage.compareColTraditional') }}</div>
              <div class="col-yuemu">{{ $t('pages.aboutPage.compareColYuemu') }}</div>
            </div>

            <div v-for="(row, rIdx) in compareList" :key="rIdx" class="table-body-row">
              <div class="col-feature">{{ row.feature }}</div>
              <div class="col-traditional">
                <i class="fa-solid fa-xmark text-red-500 font-bold mr-2"></i>
                <span>{{ row.traditional }}</span>
              </div>
              <div class="col-yuemu">
                <i class="fa-solid fa-check text-emerald-600 font-bold mr-2"></i>
                <span>{{ row.yuemu }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 4. 8 图美学社区作品瀑布流 (新增) ==================== -->
    <section class="stream-section reveal-on-scroll">
      <div class="section-container">
        <div class="section-header text-center">
          <h2 class="section-title">{{ $t('pages.aboutPage.streamTitle') }}</h2>
          <p class="section-sub">{{ $t('pages.aboutPage.streamSub') }}</p>
        </div>

        <div class="stream-gallery-grid">
          <div
            v-for="(art, aIdx) in streamGalleryList"
            :key="aIdx"
            class="stream-art-card"
            :style="{ backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%), url(' + art.imgUrl + ')' }"
          >
            <div class="stream-card-top">
              <span class="stream-tag-chip">{{ art.tag }}</span>
            </div>
            <div class="stream-card-bottom">
              <div class="stream-art-title">{{ art.title }}</div>
              <div class="stream-art-stats">
                <span><i class="fa-solid fa-download mr-1"></i>{{ art.downloads }}</span>
                <span><i class="fa-solid fa-heart mr-1"></i>{{ art.likes }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 5. 简单三步使用流程 Flow ==================== -->
    <section class="process-section reveal-on-scroll">
      <div class="section-container">
        <div class="section-header text-center">
          <h2 class="section-title">{{ $t('pages.aboutPage.process.title') }}</h2>
          <p class="section-sub">{{ $t('pages.aboutPage.process.sub') }}</p>
        </div>

        <div class="steps-flow-container">
          <div class="step-card">
            <div class="step-badge">01</div>
            <h4 class="step-title">{{ $t('pages.aboutPage.process.step1') }}</h4>
            <p class="step-desc">{{ $t('pages.aboutPage.process.step1Desc') }}</p>
          </div>

          <div class="dashed-connector">
            <i class="fa-solid fa-angle-right arrow-icon pc-only"></i>
            <i class="fa-solid fa-angle-down arrow-icon mobile-only"></i>
          </div>

          <div class="step-card">
            <div class="step-badge">02</div>
            <h4 class="step-title">{{ $t('pages.aboutPage.process.step2') }}</h4>
            <p class="step-desc">{{ $t('pages.aboutPage.process.step2Desc') }}</p>
          </div>

          <div class="dashed-connector">
            <i class="fa-solid fa-angle-right arrow-icon pc-only"></i>
            <i class="fa-solid fa-angle-down arrow-icon mobile-only"></i>
          </div>

          <div class="step-card">
            <div class="step-badge">03</div>
            <h4 class="step-title">{{ $t('pages.aboutPage.process.step3') }}</h4>
            <p class="step-desc">{{ $t('pages.aboutPage.process.step3Desc') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 6. 硬核技术与安全基础设施蓝图 (新增) ==================== -->
    <section class="tech-section reveal-on-scroll">
      <div class="section-container">
        <div class="section-header text-center">
          <h2 class="section-title">{{ $t('pages.aboutPage.techTitle') }}</h2>
          <p class="section-sub">{{ $t('pages.aboutPage.techSub') }}</p>
        </div>

        <div class="tech-badges-grid">
          <div v-for="(badge, bIdx) in techBadgesList" :key="bIdx" class="tech-badge-card">
            <div class="tech-icon-box">
              <i class="fa-solid fa-microchip"></i>
            </div>
            <div class="tech-info">
              <h4 class="tech-name">{{ badge.name }}</h4>
              <p class="tech-desc">{{ badge.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 6.5 技术栈星系网络图 (100% 匹配截图美学) ==================== -->
    <section class="echarts-tech-section reveal-on-scroll">
      <div class="section-container">
        <div class="section-header text-center">
          <h2 class="section-title">{{ $t('pages.aboutPage.techStackTitle') }}</h2>
          <p class="section-sub">{{ $t('pages.aboutPage.techStackSub') }}</p>
        </div>

        <TechConstellation />
      </div>
    </section>

    <!-- ==================== 7. 商业合规保障 Shield ==================== -->
    <section class="security-section reveal-on-scroll">
      <div class="section-container">
        <div class="security-box">
          <div class="security-header text-center">
            <h2 class="security-title">{{ $t('pages.aboutPage.securityTitle') }}</h2>
            <p class="security-sub">{{ $t('pages.aboutPage.securitySub') }}</p>
          </div>

          <div class="security-grid">
            <div v-for="(sec, index) in securityList" :key="index" class="security-card-item">
              <div class="sec-check-icon">
                <i class="fa-solid fa-check"></i>
              </div>
              <div>
                <h4 class="sec-item-title">{{ sec.title }}</h4>
                <p class="sec-item-desc">{{ sec.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 8. 6 大深度 FAQ 手风琴 ==================== -->
    <section class="faq-section reveal-on-scroll">
      <div class="section-container">
        <div class="section-header text-center">
          <h2 class="section-title">{{ $t('pages.aboutPage.faqTitle') }}</h2>
          <p class="section-sub">{{ $t('pages.aboutPage.faqSub') }}</p>
        </div>

        <div class="faq-container">
          <div
            v-for="(faq, index) in faqList"
            :key="index"
            class="faq-item"
            :class="{ active: openFaqIndex === index }"
          >
            <button class="faq-question-btn" @click="toggleFaq(index)">
              <span class="faq-q-text">{{ faq.q }}</span>
              <i class="fa-solid fa-chevron-down faq-arrow"></i>
            </button>
            <div class="faq-answer-wrapper">
              <p class="faq-answer-text">{{ faq.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 9. 极简商业转化 CTA ==================== -->
    <section class="cta-section reveal-on-scroll">
      <div class="section-container">
        <div class="cta-banner">
          <h2 class="cta-title">{{ $t('pages.aboutPage.ctaTitle') }}</h2>
          <p class="cta-sub">{{ $t('pages.aboutPage.ctaSub') }}</p>
          <router-link :to="{ name: 'UserLogin' }" class="btn-brand-primary btn-cta-large">
            <span>{{ $t('pages.aboutPage.ctaActionBtn') }}</span>
            <div class="btn-icon-circle">
              <i class="fa-solid fa-arrow-right icon-arrow"></i>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import ParticleBackground from '@/components/ParticleBackground.vue'
import TechConstellation from '@/components/TechConstellation.vue'

const { tm, rt } = useI18n()

const openFaqIndex = ref<number | null>(0)

const toggleFaq = (index: number) => {
  if (openFaqIndex.value === index) {
    openFaqIndex.value = null
  } else {
    openFaqIndex.value = index
  }
}

let observer: IntersectionObserver | null = null

const resetScrollTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const initObserver = () => {
  const elements = document.querySelectorAll('.reveal-on-scroll')
  if ('IntersectionObserver' in window) {
    if (observer) observer.disconnect()
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer?.unobserve(entry.target)
        }
      })
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    })

    elements.forEach(el => observer?.observe(el))
  } else {
    elements.forEach(el => el.classList.add('is-visible'))
  }
}

onMounted(() => {
  resetScrollTop()
  nextTick(() => {
    resetScrollTop()
    initObserver()
  })
  setTimeout(resetScrollTop, 50)
  setTimeout(resetScrollTop, 150)
})

onActivated(() => {
  resetScrollTop()
  nextTick(() => {
    resetScrollTop()
    initObserver()
  })
  setTimeout(resetScrollTop, 50)
  setTimeout(resetScrollTop, 150)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

const creatorList = computed(() => {
  const list = tm('pages.aboutPage.creators')
  if (Array.isArray(list)) {
    return list.map(item => ({
      name: typeof item.name === 'string' ? item.name : rt(item.name),
      role: typeof item.role === 'string' ? item.role : rt(item.role),
      stats: typeof item.stats === 'string' ? item.stats : rt(item.stats),
      artTitle: typeof item.artTitle === 'string' ? item.artTitle : rt(item.artTitle),
      artMeta: typeof item.artMeta === 'string' ? item.artMeta : rt(item.artMeta),
      imgUrl: typeof item.imgUrl === 'string' ? item.imgUrl : (item.imgUrl ? rt(item.imgUrl) : '')
    }))
  }
  return []
})

const compareList = computed(() => {
  const list = tm('pages.aboutPage.comparison')
  if (Array.isArray(list)) {
    return list.map(item => ({
      feature: typeof item.feature === 'string' ? item.feature : rt(item.feature),
      traditional: typeof item.traditional === 'string' ? item.traditional : rt(item.traditional),
      yuemu: typeof item.yuemu === 'string' ? item.yuemu : rt(item.yuemu)
    }))
  }
  return []
})

const streamGalleryList = computed(() => {
  const list = tm('pages.aboutPage.streamGallery')
  if (Array.isArray(list)) {
    return list.map(item => ({
      title: typeof item.title === 'string' ? item.title : rt(item.title),
      tag: typeof item.tag === 'string' ? item.tag : rt(item.tag),
      downloads: typeof item.downloads === 'string' ? item.downloads : rt(item.downloads),
      likes: typeof item.likes === 'string' ? item.likes : rt(item.likes),
      imgUrl: typeof item.imgUrl === 'string' ? item.imgUrl : (item.imgUrl ? rt(item.imgUrl) : '')
    }))
  }
  return []
})

const techBadgesList = computed(() => {
  const list = tm('pages.aboutPage.techBadges')
  if (Array.isArray(list)) {
    return list.map(item => ({
      name: typeof item.name === 'string' ? item.name : rt(item.name),
      desc: typeof item.desc === 'string' ? item.desc : rt(item.desc)
    }))
  }
  return []
})

const securityList = computed(() => {
  const list = tm('pages.aboutPage.securityItems')
  if (Array.isArray(list)) {
    return list.map(item => ({
      title: typeof item.title === 'string' ? item.title : rt(item.title),
      desc: typeof item.desc === 'string' ? item.desc : rt(item.desc)
    }))
  }
  return []
})

const faqList = computed(() => {
  const list = tm('pages.aboutPage.faqList')
  if (Array.isArray(list)) {
    return list.map(item => ({
      q: typeof item.q === 'string' ? item.q : rt(item.q),
      a: typeof item.a === 'string' ? item.a : rt(item.a)
    }))
  }
  return []
})
</script>

<style scoped>
/* ==================== 极简黑白灰高级品牌规范 ==================== */
#AboutPage {
  min-height: 100vh;
  height: auto !important;
  background: var(--background, #ffffff);
  color: var(--text-primary, #111113);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", "Inter", "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow: visible !important;
}

/* 仅在关于界面生效：为外层容器解除次级滚动条拦截，100% 限制在 AboutPage.vue */
:global(#AboutPage) {
  overflow-y: visible !important;
}
:global(.yuemu-content:has(#AboutPage)),
:global(.yuemu-basic-layout:has(#AboutPage) .yuemu-content) {
  overflow: visible !important;
}

.section-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ==================== 1. HERO 商业巨幕区 (粒子背景) ==================== */
.hero-section {
  position: relative;
  padding: 140px 24px 100px 24px;
  background: #09090b;
  color: #ffffff;
  text-align: center;
  overflow: hidden;
}

.hero-container {
  position: relative;
  z-index: 10;
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 19px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.65;
  margin-bottom: 44px;
  max-width: 740px;
  margin-left: auto;
  margin-right: auto;
}

.hero-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.btn-brand-primary {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 28px;
  background: #ffffff;
  color: #111113;
  border-radius: 980px;
  font-size: 15.5px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-brand-primary:hover {
  transform: translateY(-2px);
  background: #e4e4e7;
  color: #111113;
}

.btn-icon-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: transform 0.25s ease;
}

.btn-brand-primary:hover .btn-icon-circle {
  transform: translateX(3px);
}

.btn-brand-secondary {
  display: inline-flex;
  align-items: center;
  padding: 14px 30px;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border-radius: 980px;
  font-size: 15.5px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease;
}

.btn-brand-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* ==================== 通用 Section Header & Scroll Reveal ==================== */
.section-header { margin-bottom: 50px; }

.section-title {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary, #111113);
  margin-bottom: 12px;
}

.section-sub {
  font-size: 17px;
  color: var(--text-secondary, #66666e);
}

.reveal-on-scroll {
  opacity: 0;
  transform: translate3d(0, 20px, 0);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  /* 优化性能：移除 will-change 避免创建过多 GPU 图层引发滚动卡顿 */
}

.reveal-on-scroll.is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

/* ==================== 2. 中间简约 Bento 矩阵 ==================== */
.matrix-section { padding: 90px 0; }
.bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.col-span-2 { grid-column: span 2 / span 2; }
.col-span-1 { grid-column: span 1 / span 1; }

.outer-shell { background: rgba(0, 0, 0, 0.04); padding: 6px; border-radius: 32px; border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05)); }
.inner-card { height: 100%; min-height: 280px; border-radius: calc(32px - 6px); padding: 32px; background: var(--card-background, #fbfbfd); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; border: 1px solid var(--border-color, rgba(0,0,0,0.04)); }
.card-top-row { display: flex; gap: 8px; margin-bottom: 20px; }
.pill-badge { padding: 4px 12px; border-radius: 980px; font-size: 12px; font-weight: 700; }
.blue-pill { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
.emerald-pill { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
.purple-pill { background: rgba(168, 85, 247, 0.1); color: #9333ea; }
.amber-pill { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.ghost-pill { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); color: #ffffff; }

.card-title { font-size: 22px; font-weight: 800; color: var(--text-primary, #111113); margin-bottom: 8px; letter-spacing: -0.015em; }
.card-desc { font-size: 14.5px; color: var(--text-secondary, #66666e); line-height: 1.6; margin-bottom: 16px; }

.ai-suite-card { background-size: cover; background-position: center; color: #ffffff; }
.ai-suite-card .card-title { color: #ffffff; }
.ai-suite-card .card-desc { color: rgba(255, 255, 255, 0.8); }
.mock-prompt-bar { padding: 10px 16px; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; font-size: 12.5px; color: rgba(255, 255, 255, 0.9); }

.shield-body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
.wax-stamp-circle { width: 56px; height: 56px; border-radius: 50%; background: rgba(34, 197, 94, 0.1); color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 14px; }
.hash-tag-chip { font-size: 11.5px; font-family: monospace; color: #16a34a; background: rgba(34, 197, 94, 0.08); padding: 4px 10px; border-radius: 6px; }

.space-widget-box { background: var(--background, #ffffff); padding: 16px; border-radius: 16px; border: 1px solid var(--border-color, rgba(0,0,0,0.06)); margin-top: auto; }
.quota-text-row { font-size: 12.5px; font-weight: 700; color: var(--text-primary, #111113); margin-bottom: 8px; }
.progress-bg { height: 6px; background: #f4f4f6; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
.progress-bar-fill { height: 100%; background: #9333ea; }
.avatars-online-row { display: flex; align-items: center; gap: 4px; }
.avatar-circle { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #ffffff; border: 2px solid #ffffff; }
.avatar-circle.a1 { background: #3b82f6; }
.avatar-circle.a2 { background: #22c55e; }
.avatar-circle.a3 { background: #f59e0b; }
.online-tag { font-size: 11.5px; font-weight: 600; color: #9333ea; margin-left: 6px; }

.creators-mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 14px; }
.creator-mini-item { background: var(--background, #ffffff); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color, rgba(0,0,0,0.06)); }
.creator-mini-img { height: 110px; background-size: cover; background-position: center; padding: 10px; display: flex; align-items: flex-end; }
.mini-art-title { font-size: 11.5px; font-weight: 700; color: #ffffff; }
.creator-mini-meta { padding: 10px; }
.c-name { font-size: 13px; font-weight: 700; color: var(--text-primary, #111113); }
.c-role { font-size: 11px; color: var(--text-secondary, #66666e); }

/* ==================== 3. 维度对比矩阵卡片 (高清晰度增强) ==================== */
.compare-section { padding: 70px 0; }
.compare-card-container {
  background: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.05);
}
.compare-table { display: flex; flex-direction: column; gap: 8px; }
.table-header-row, .table-body-row {
  display: grid;
  grid-template-columns: 1.3fr 2fr 2fr;
  gap: 20px;
  padding: 18px 24px;
  border-radius: 16px;
  align-items: center;
  font-size: 15px;
}
.table-header-row {
  background: var(--card-background-elevated, rgba(15, 23, 42, 0.04));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}
.table-header-row .col-feature { color: var(--text-primary, #0f172a); font-weight: 800; font-size: 15.5px; }
.table-header-row .col-traditional { color: #475569; font-weight: 700; }
.table-header-row .col-yuemu { color: #2563eb; font-weight: 800; }

.table-body-row {
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.table-body-row:hover {
  background: rgba(59, 130, 246, 0.04);
}
.table-body-row:last-child {
  border-bottom: none;
}
.col-feature {
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}
.col-traditional {
  color: #334155;
  font-weight: 500;
  line-height: 1.5;
}
.col-yuemu {
  color: var(--text-primary, #0f172a);
  font-weight: 600;
  line-height: 1.5;
}

/* ==================== 4. 8 图美学社区作品瀑布流 (新增) ==================== */
.stream-section { padding: 70px 0; }
.stream-gallery-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.stream-art-card { height: 260px; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; background-size: cover; background-position: center; border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08)); transition: transform 0.3s ease; }
.stream-art-card:hover { transform: translateY(-4px); }
.stream-tag-chip { padding: 4px 10px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); border-radius: 6px; font-size: 11px; font-weight: 700; color: #ffffff; width: fit-content; }
.stream-art-title { font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 4px; }
.stream-art-stats { display: flex; gap: 12px; font-size: 11.5px; color: rgba(255,255,255,0.7); }

/* ==================== 5. 简单三步使用流程 Flow ==================== */
.process-section { padding: 70px 0; }
.steps-flow-container { display: flex; align-items: center; justify-content: center; gap: 20px; }
.step-card { flex: 1; padding: 36px 28px; background: var(--card-background, #fbfbfd); border: 1px solid var(--border-color, rgba(0, 0, 0, 0.06)); border-radius: 28px; text-align: center; }
.step-badge { width: 52px; height: 52px; border-radius: 50%; background: rgba(59, 130, 246, 0.1); color: #2563eb; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px auto; }
.step-title { font-size: 20px; font-weight: 700; color: var(--text-primary, #111113); margin-bottom: 8px; }
.step-desc { font-size: 14.5px; color: var(--text-secondary, #66666e); }
.dashed-connector { color: var(--border-color, rgba(0, 0, 0, 0.2)); font-size: 22px; padding: 0 10px; }
.mobile-only { display: none; }

/* ==================== 6. 硬核技术与安全基础设施蓝图 (新增) ==================== */
.tech-section { padding: 70px 0; }
.tech-badges-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.tech-badge-card { display: flex; align-items: center; gap: 14px; padding: 20px; background: var(--card-background, #fbfbfd); border: 1px solid var(--border-color, rgba(0, 0, 0, 0.06)); border-radius: 18px; }
.tech-icon-box { width: 42px; height: 42px; border-radius: 12px; background: #111113; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.tech-name { font-size: 14.5px; font-weight: 700; color: var(--text-primary, #111113); margin-bottom: 2px; }
.tech-desc { font-size: 12px; color: var(--text-secondary, #66666e); }

/* ==================== 7. 商业合规保障 Shield ==================== */
.security-section { padding: 70px 0; }
.security-box { padding: 60px 40px; background: var(--card-background, #fbfbfd); border: 1px solid var(--border-color, rgba(0, 0, 0, 0.06)); border-radius: 32px; }
.security-title { font-size: 32px; font-weight: 800; color: var(--text-primary, #111113); margin-bottom: 10px; }
.security-sub { font-size: 16px; color: var(--text-secondary, #66666e); margin-bottom: 40px; }
.security-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.security-card-item { display: flex; gap: 16px; padding: 24px; background: var(--background, #ffffff); border: 1px solid var(--border-color, rgba(0, 0, 0, 0.06)); border-radius: 20px; }
.sec-check-icon { width: 32px; height: 32px; border-radius: 50%; background: rgba(34, 197, 94, 0.1); color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.sec-item-title { font-size: 16px; font-weight: 700; color: var(--text-primary, #111113); margin-bottom: 4px; }
.sec-item-desc { font-size: 13.5px; color: var(--text-secondary, #66666e); line-height: 1.55; }

/* ==================== 8. FAQ 手风琴 ==================== */
.faq-section { padding: 70px 0; }
.faq-container { max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.faq-item { background: var(--card-background, #fbfbfd); border: 1px solid var(--border-color, rgba(0, 0, 0, 0.06)); border-radius: 20px; overflow: hidden; }
.faq-item.active { border-color: rgba(37, 99, 235, 0.4); }
.faq-question-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 22px 28px; background: transparent; border: none; cursor: pointer; text-align: left; }
.faq-q-text { font-size: 17px; font-weight: 700; color: var(--text-primary, #111113); }
.faq-item.active .faq-q-text { color: #2563eb; }
.faq-arrow { font-size: 16px; color: var(--text-secondary, #66666e); transition: transform 0.35s ease; }
.faq-item.active .faq-arrow { transform: rotate(180deg); color: #2563eb; }
.faq-answer-wrapper { max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.35s ease; padding: 0 28px; }
.faq-item.active .faq-answer-wrapper { max-height: 220px; padding: 0 28px 22px 28px; }
.faq-answer-text { font-size: 15px; color: var(--text-secondary, #66666e); line-height: 1.65; }

/* ==================== 9. 极简商业转化 CTA ==================== */
.cta-section { padding: 70px 0 120px 0; text-align: center; }
.cta-banner { padding: 80px 40px; background: #111113; color: #ffffff; border-radius: 32px; }
.cta-title { font-size: 36px; font-weight: 800; margin-bottom: 14px; letter-spacing: -0.025em; color: #ffffff; }
.cta-sub { font-size: 17px; color: rgba(255, 255, 255, 0.7); margin-bottom: 36px; }
.btn-cta-large { padding: 16px 36px; font-size: 16px; background: #ffffff; color: #111113; }
.btn-cta-large:hover { background: #e4e4e7; color: #111113; }
.btn-cta-large .btn-icon-circle { background: rgba(0, 0, 0, 0.1); }

/* ==================== 响应式移动端适配 (PC 端 > 1024px 100% 保持不动) ==================== */
@media (max-width: 1024px) {
  /* Bento 矩阵在移动端/平板端一律强制 100% 优雅单栏 */
  .bento-grid {
    grid-template-columns: 1fr !important;
    gap: 20px !important;
  }
  .col-span-2, .col-span-1 {
    grid-column: span 1 / span 1 !important;
  }
  .inner-card {
    min-height: auto !important;
    padding: 24px !important;
  }
  .creators-mini-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 12px !important;
  }
  .compare-card-container {
    overflow-x: auto;
    padding: 20px;
  }
  .compare-table {
    min-width: 600px;
  }
  .stream-gallery-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .tech-badges-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .security-grid {
    grid-template-columns: 1fr !important;
  }
  .steps-flow-container {
    flex-direction: column !important;
  }
  .pc-only { display: none !important; }
  .mobile-only { display: block !important; }
}

@media (max-width: 640px) {
  .hero-section {
    padding: 100px 16px 60px 16px !important;
  }
  .hero-title {
    font-size: 34px !important;
    line-height: 1.2 !important;
  }
  .hero-subtitle {
    font-size: 15px !important;
    margin-bottom: 30px !important;
  }
  .hero-buttons {
    flex-direction: column !important;
    width: 100% !important;
  }
  .btn-brand-primary, .btn-brand-secondary {
    width: 100% !important;
    justify-content: center !important;
  }
  .creators-mini-grid {
    grid-template-columns: 1fr !important;
  }
  .stream-gallery-grid, .tech-badges-grid {
    grid-template-columns: 1fr !important;
  }
  .section-title {
    font-size: 26px !important;
  }
  .section-sub {
    font-size: 14.5px !important;
  }
  .cta-title {
    font-size: 24px !important;
  }
}

/* ==================== 6.5 ECharts 力导向技术星系图 (100% 匹配截图) ==================== */
.echarts-tech-section {
  padding: 70px 0;
}

.constellation-chart-card {
  background: #09090b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 32px;
  padding: 32px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.chart-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chart-card-title {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
}

.constellation-container {
  width: 100%;
  height: 480px;
}

@media (max-width: 768px) {
  .constellation-chart-card {
    padding: 20px 16px;
    border-radius: 24px;
  }
  .constellation-container {
    height: 380px;
  }
}
</style>
