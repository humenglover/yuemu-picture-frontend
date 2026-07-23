<template>
  <Transition name="fade-page">
    <div class="trace-fullscreen-page">

      <header class="app-header">
        <div class="header-inner">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-chevron-left"></i>
            <span>{{ $t('pages.copyrightTracePage.back') }}</span>
          </button>
          <h1 class="nav-title">{{ $t('pages.copyrightTracePage.navTitle') }}</h1>
          <div class="header-placeholder"></div>
        </div>
      </header>

      <main class="app-scroll-body">
        <div class="content-wrapper">

          <div class="modern-search-module">
            <h2 class="module-title">{{ $t('pages.copyrightTracePage.moduleTitle') }}</h2>
            <div class="pill-search-bar" :class="{ 'is-focused': isSearchFocused }">
              <i class="fas fa-search search-icon"></i>
              <input
                v-model="copyrightCode"
                type="text"
                :placeholder="$t('pages.copyrightTracePage.searchPlaceholder')"
                @focus="isSearchFocused = true"
                @blur="isSearchFocused = false"
                @keyup.enter="handleSearch"
              />
              <button v-show="copyrightCode" class="clear-btn" @click="copyrightCode = ''">
                <i class="fas fa-times-circle"></i>
              </button>
              <button
                class="pill-submit-btn"
                @click="handleSearch"
                :disabled="searching || !copyrightCode.trim()"
              >
                <i class="fas fa-spinner fa-spin" v-if="searching"></i>
                <span v-else>{{ $t('pages.copyrightTracePage.verifyBtn') }}</span>
              </button>
            </div>
          </div>

          <Transition name="slide-up" mode="out-in">

            <div v-if="copyrightInfo" class="digital-pass-card" key="success">

              <div class="pass-header">
                <div class="pass-brand">
                  <div class="brand-icon"><i class="fas fa-shield-check"></i></div>
                  <span>{{ $t('pages.copyrightTracePage.certificate') }}</span>
                </div>
                <div class="pass-id">{{ copyrightInfo.copyrightCode }}</div>
                <div class="auth-stamp">{{ $t('pages.copyrightTracePage.verified') }}</div>
              </div>

              <div class="pass-body">
                <div class="asset-showcase">
                  <img :src="copyrightInfo.pictureUrl" :alt="copyrightInfo.pictureName" class="asset-cover" />
                  <div class="asset-core-info">
                    <h4 class="asset-name">{{ copyrightInfo.pictureName }}</h4>
                    <p class="asset-owner">
                      <span>{{ $t('pages.copyrightTracePage.owner') }}</span>
                      <strong>{{ copyrightInfo.copyrightOwner }}</strong>
                    </p>
                  </div>
                </div>

                <div class="pass-divider"></div>

                <div class="metadata-grid">
                  <div class="meta-item">
                    <span class="label">{{ $t('pages.copyrightTracePage.firstRegisterTime') }}</span>
                    <span class="value">{{ formatDate(copyrightInfo.createTime) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">{{ $t('pages.copyrightTracePage.traceCount') }}</span>
                    <span class="value">{{ $t('pages.copyrightTracePage.traceTimes', { count: copyrightInfo.traceCount }) }}</span>
                  </div>
                </div>

                <div class="meta-desc-box" v-if="copyrightInfo.copyrightDesc">
                  <span class="label">{{ $t('pages.copyrightTracePage.additionalDesc') }}</span>
                  <p class="value">{{ copyrightInfo.copyrightDesc }}</p>
                </div>

                <div class="permission-bar">
                  <div class="perm-badge" :class="copyrightInfo.allowCommercial === 1 ? 'is-allowed' : 'is-denied'">
                    <i class="fas" :class="copyrightInfo.allowCommercial === 1 ? 'fa-check-circle' : 'fa-ban'"></i>
                    {{ copyrightInfo.allowCommercial === 1 ? $t('pages.copyrightTracePage.allowCom') : $t('pages.copyrightTracePage.forbidCom') }}
                  </div>
                  <div class="perm-badge" :class="copyrightInfo.requireAttribution === 1 ? 'is-allowed' : 'is-normal'">
                    <i class="fas" :class="copyrightInfo.requireAttribution === 1 ? 'fa-signature' : 'fa-ghost'"></i>
                    {{ copyrightInfo.requireAttribution === 1 ? $t('pages.copyrightTracePage.reqAttr') : $t('pages.copyrightTracePage.noAttr') }}
                  </div>
                </div>
              </div>

              <div class="pass-footer" @click="viewPicture">
                <span>{{ $t('pages.copyrightTracePage.viewSource') }}</span>
                <i class="fas fa-arrow-right"></i>
              </div>
            </div>

            <div v-else-if="searched && !copyrightInfo" class="status-card empty-card" key="empty">
              <div class="status-icon"><i class="fas fa-search-minus"></i></div>
              <h3>{{ $t('pages.copyrightTracePage.noRecordTitle') }}</h3>
              <p>{{ $t('pages.copyrightTracePage.noRecordDesc') }}</p>
            </div>

            <div v-else class="status-card guide-card" key="guide">
              <div class="guide-header">
                <div class="guide-icon"><i class="fas fa-bolt"></i></div>
                <h3>{{ $t('pages.copyrightTracePage.howToTrace') }}</h3>
              </div>
              <ul class="clean-guide-list">
                <li><span>1</span> <span v-html="$t('pages.copyrightTracePage.step1')"></span></li>
                <li><span>2</span> {{ $t('pages.copyrightTracePage.step2') }}</li>
                <li><span>3</span> {{ $t('pages.copyrightTracePage.step3') }}</li>
              </ul>
            </div>
          </Transition>

        </div>
      </main>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { traceCopyrightUsingPost } from '@/api/pictureCopyrightController.ts'

const router = useRouter()
const route = useRoute()

const copyrightCode = ref('')
const searching = ref(false)
const searched = ref(false)
const isSearchFocused = ref(false)
const copyrightInfo = ref<API.CopyrightInfoVO | null>(null)

onMounted(() => {
  const codeFromRoute = route.query.code as string
  if (codeFromRoute) {
    copyrightCode.value = codeFromRoute
    handleSearch()
  }
})

const handleSearch = async () => {
  if (!copyrightCode.value.trim()) {
    message.warning(t('pages.copyrightTracePage.emptyCode'))
    return
  }

  searching.value = true
  searched.value = false
  copyrightInfo.value = null

  try {
    const res = await traceCopyrightUsingPost({ copyrightCode: copyrightCode.value.trim() })
    if (res.data.code === 0 && res.data.data) {
      copyrightInfo.value = res.data.data
      message.success(t('pages.copyrightTracePage.verifySuccess'))
    } else {
      message.error(res.data.message || t('pages.copyrightTracePage.codeNotFound'))
    }
  } catch (error: any) {
    message.error(error.message || t('pages.copyrightTracePage.networkError'))
  } finally {
    searching.value = false
    searched.value = true
  }
}

const viewPicture = () => {
  if (copyrightInfo.value?.pictureId) {
    router.push({ name: 'PictureRedirect', params: { id: String(copyrightInfo.value.pictureId) } })
  }
}

const goBack = () => {
  router.back()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
/* ================= 1. 全局视口与底座 ================= */
.trace-fullscreen-page {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--background, #f5f5f7);
  color: var(--text-primary);
  display: flex; flex-direction: column;
  height: 100vh; height: 100dvh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ================= 2. 顶部导航 (精修毛玻璃) ================= */
.app-header {
  height: 52px; flex-shrink: 0;
  background: var(--header-background);
  backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
  border-bottom: 1px solid var(--border-color);
  z-index: 50;
}
.header-inner {
  max-width: 680px; margin: 0 auto; height: 100%;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 16px; padding-top: 0;
}
.back-btn { background: none; border: none; color: var(--text-primary); font-size: 16px; display: flex; align-items: center; gap: 4px; cursor: pointer; font-weight: 500; }
.nav-title { font-size: 16px; font-weight: 600; margin: 0; position: absolute; left: 50%; transform: translateX(-50%); }
.header-placeholder { width: 60px; }

/* ================= 3. 滚动内容区 ================= */
.app-scroll-body {
  flex: 1; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch;
  padding: 20px 16px; padding-bottom: calc(40px + env(safe-area-inset-bottom));
}
.content-wrapper { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

/* ================= 4. 一体化胶囊搜索栏 (重构核心) ================= */
.modern-search-module {
  display: flex; flex-direction: column; gap: 12px;
}
.module-title { font-size: 15px; font-weight: 600; color: var(--text-secondary); margin: 0 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }

.pill-search-bar {
  display: flex; align-items: center;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 100px; /* 胶囊圆角 */
  height: 56px;
  padding: 4px 6px 4px 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.pill-search-bar.is-focused {
  border-color: var(--link-color);
  box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.1);
}

.search-icon { color: var(--text-secondary); font-size: 18px; margin-right: 12px; }
.pill-search-bar input {
  flex: 1; border: none; background: transparent; height: 100%;
  font-size: 15px; color: var(--text-primary); outline: none;
  font-family: 'Courier New', monospace; /* 保持溯源码专业感 */
  min-width: 0; /* 防止挤爆 flex */
}
.pill-search-bar input::placeholder { color: var(--text-secondary); opacity: 0.6; font-family: -apple-system, sans-serif; }

.clear-btn { background: none; border: none; color: #c8c8cc; font-size: 18px; padding: 8px; cursor: pointer; display: flex; align-items: center; }
.clear-btn:active { opacity: 0.6; }

.pill-submit-btn {
  height: 100%; padding: 0 24px;
  background: var(--text-primary); /* 深色按钮更高级 */
  color: var(--background);
  border: none; border-radius: 100px;
  font-size: 15px; font-weight: 600; cursor: pointer;
  transition: transform 0.1s;
  flex-shrink: 0; margin-left: 4px;
}
.pill-submit-btn:active:not(:disabled) { transform: scale(0.95); }
.pill-submit-btn:disabled { background: var(--border-color); color: var(--text-secondary); cursor: not-allowed; }


/* ================= 5. Wallet 风格数字凭证 ================= */
.digital-pass-card {
  background: var(--card-background);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0,0,0,0.08);
  border: 1px solid var(--border-color);
  position: relative;
}

/* 凭证顶部 */
.pass-header {
  background: linear-gradient(135deg, rgba(24,144,255,0.1) 0%, rgba(24,144,255,0.02) 100%);
  padding: 20px 24px;
  border-bottom: 1px dashed var(--border-color);
  position: relative;
}
.pass-brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.brand-icon { width: 24px; height: 24px; background: var(--link-color); color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; }
.pass-id { font-family: 'Courier New', monospace; font-size: 13px; color: var(--text-secondary); word-break: break-all; padding-right: 80px; }

/* 绝对定位印章 - 移动端完美适配 */
.auth-stamp {
  position: absolute; right: 20px; top: 20px;
  border: 2px solid #52c41a; color: #52c41a;
  padding: 4px 10px; border-radius: 6px;
  font-weight: 800; font-size: 13px; letter-spacing: 1px;
  transform: rotate(12deg); opacity: 0.85; pointer-events: none;
}

/* 凭证主体 */
.pass-body { padding: 24px; }

/* 资产信息 - 左右结构，移动端缩小图但不折行 */
.asset-showcase { display: flex; align-items: center; gap: 16px; }
.asset-cover { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex-shrink: 0; }
.asset-core-info { flex: 1; min-width: 0; }
.asset-name { margin: 0 0 8px; font-size: 17px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.asset-owner { margin: 0; display: flex; flex-direction: column; gap: 2px; }
.asset-owner span { font-size: 12px; color: var(--text-secondary); }
.asset-owner strong { font-size: 15px; color: var(--text-primary); font-weight: 600; }

.pass-divider { height: 1px; background: var(--border-color); margin: 24px 0; }

/* 详情网格 */
.metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.meta-item, .meta-desc-box { display: flex; flex-direction: column; gap: 4px; }
.meta-item .label, .meta-desc-box .label { font-size: 12px; color: var(--text-secondary); }
.meta-item .value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.meta-desc-box { margin-bottom: 20px; background: var(--hover-background); padding: 12px; border-radius: 8px; }
.meta-desc-box .value { font-size: 13px; line-height: 1.5; color: var(--text-primary); margin: 0; }

/* 授权标签 */
.permission-bar { display: flex; gap: 12px; }
.perm-badge { flex: 1; padding: 12px 8px; border-radius: 10px; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; }
.perm-badge.is-allowed { background: rgba(82, 196, 26, 0.1); color: #52c41a; }
.perm-badge.is-denied { background: rgba(255, 59, 48, 0.1); color: #ff3b30; }
.perm-badge.is-normal { background: var(--hover-background); color: var(--text-secondary); }

/* 凭证底部操作 */
.pass-footer {
  padding: 16px 24px; background: var(--hover-background); border-top: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
  font-size: 14px; font-weight: 500; color: var(--link-color); cursor: pointer; transition: background 0.2s;
}
.pass-footer:active { background: var(--border-color); }

/* ================= 6. 通用状态卡片 (空状态/指南) ================= */
.status-card {
  background: var(--card-background); border-radius: 20px; padding: 32px 24px;
  border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.04);
}
.empty-card { text-align: center; }
.status-icon { width: 56px; height: 56px; background: var(--hover-background); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: var(--text-secondary); margin: 0 auto 16px; }
.status-card h3 { font-size: 17px; font-weight: 600; margin: 0 0 8px; color: var(--text-primary); }
.status-card p { font-size: 14px; color: var(--text-secondary); margin: 0; line-height: 1.5; }

/* 引导页优化排版 */
.guide-header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 24px; }
.guide-icon { width: 48px; height: 48px; background: rgba(250, 173, 20, 0.15); color: #faad14; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 12px; }

.clean-guide-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 16px; }
.clean-guide-list li { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
.clean-guide-list li span:first-child { width: 22px; height: 22px; background: var(--hover-background); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: -2px; }
.clean-guide-list b { color: var(--text-primary); font-family: monospace; background: var(--hover-background); padding: 2px 6px; border-radius: 4px; }

/* ================= 7. 动画过渡 ================= */
.fade-page-enter-active, .fade-page-leave-active { transition: opacity 0.3s ease; }
.fade-page-enter-from, .fade-page-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(10px) scale(0.98); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px) scale(0.98); }

/* ================= 移动端终极打磨 ================= */
@media (max-width: 600px) {
  .pill-search-bar { height: 50px; padding-left: 16px; }
  .pill-submit-btn { padding: 0 16px; font-size: 14px; }

  /* 确保证书在小屏幕绝对不换行变形 */
  .asset-cover { width: 64px; height: 64px; }
  .asset-name { font-size: 16px; }
  .metadata-grid { gap: 12px; }
  .permission-bar { flex-direction: column; gap: 8px; } /* 只有授权标签在极小屏幕转纵向 */
}
</style>
