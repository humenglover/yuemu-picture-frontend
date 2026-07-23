<template>
  <div class="yuemu-love-board-list">
    <div class="yuemu-main-container">
      <!-- Compact Dashboard Header -->
      <header class="modern-dashboard-header">
        <div class="header-top-row">
          <h1 class="main-title">{{ $t('pages.loveBoardListView.title') }}</h1>
          <div class="header-actions">
            <button v-if="loginUserStore.loginUser?.id" class="modern-cta-btn" @click="goToMyBoard">
              {{ $t('pages.loveBoardListView.myBoard') }}
            </button>
            <button v-else class="modern-cta-btn" @click="router.push({ name: 'LoveBoard' })">
              {{ $t('pages.loveBoardListView.createBoard') }}
            </button>
          </div>
        </div>
        <div class="header-search-row">
          <div class="modern-search-capsule">
            <i class="fa-solid fa-magnifying-glass search-icon" @click="handleSearch"></i>
            <input v-model="searchForm.manName" :placeholder="$t('pages.loveBoardListView.defaultMale')" class="ghost-input" @keyup.enter="handleSearch" @input="!searchForm.manName && handleSearch()" />
            <span class="search-divider"></span>
            <input v-model="searchForm.womanName" :placeholder="$t('pages.loveBoardListView.defaultFemale')" class="ghost-input" @keyup.enter="handleSearch" @input="!searchForm.womanName && handleSearch()" />
          </div>
        </div>
      </header>

      <section class="yuemu-board-gallery">
        <div class="modern-gallery-grid">
          <div v-for="board in boardList" :key="board.id" class="modern-love-card" @click="goBoardDetail(board.id)">
            <div class="card-cover-area">
              <img :src="board.bgCover || defaultBg" :alt="$t('pages.loveBoardListView.title')" class="card-cover-img" />
              <div class="card-cover-gradient"></div>
              
              <div class="card-avatars-float">
                <img :src="board.manCover || defaultAvatar" class="avatar-img" />
                <i class="fa-solid fa-heart avatar-heart"></i>
                <img :src="board.womanCover || defaultAvatar" class="avatar-img" />
              </div>
            </div>
            <div class="card-info-area">
              <h3 class="couple-names">
                {{ board.manName || $t('pages.loveBoardListView.he') }} & {{ board.womanName || $t('pages.loveBoardListView.she') }}
              </h3>
              <div class="meta-info">
                <span class="meta-item"><i class="fa-regular fa-eye"></i> {{ board.viewCount || 0 }}</span>
                <span class="meta-dot">·</span>
                <span class="meta-item">{{ formatDate(board.createTime) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loading && boardList.length === 0" class="yuemu-empty-state yuemu-glass-panel">
          <div class="yuemu-empty-icon"><i class="fa-solid fa-box-open"></i></div>
          <h3 class="yuemu-empty-title">{{ $t('pages.loveBoardListView.emptyTitle') }}</h3>
          <p class="yuemu-empty-desc">
        {{ $t('pages.loveBoardListView.emptyDesc') }}
      </p>
          <a-button type="primary" shape="round" class="yuemu-empty-cta" @click="router.push({ name: 'LoveBoard' })">
        {{ $t('pages.loveBoardListView.createMyBoard') }}
      </a-button>
        </div>

        <div v-if="loading" class="yuemu-loading-state">
          <div class="yuemu-loading-spinner"></div>
          <p>
            {{ $t('pages.loveBoardListView.loading') }}
          </p>
        </div>
      </section>

      <div class="yuemu-load-more-footer">
        <div v-if="loadingMore" class="yuemu-loading-more">
          <div class="yuemu-loading-spinner yuemu-small"></div>
          <span>
            {{ $t('pages.loveBoardListView.loadMore') }}
          </span>
        </div>
        <div v-else-if="!hasMore && boardList.length > 0" class="yuemu-no-more">
          <span>
            —— {{ $t('pages.loveBoardListView.noMore') }} ——
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { listPublicLoveBoardsUsingGet, getMyLoveBoardUsingGet } from '@/api/loveBoardController'
import dayjs from 'dayjs'

const router = useRouter()
const loginUserStore = useLoginUserStore()

const defaultAvatar = 'https://img.yuemuchat.com/avatar/default-couple-love.png'
const defaultBg = 'https://img.yuemuchat.com/loveboard/bg-soft-romantic.jpg'

const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const boardList = ref<API.LoveBoardVO[]>([])
const searchForm = reactive({ manName: '', womanName: '' })
const infinitePagination = reactive({ current: 1, pageSize: 20, total: 0 })

const loadBoardList = async (reset = true) => {
  if (reset) {
    loading.value = true
    infinitePagination.current = 1
  } else {
    loadingMore.value = true
  }
  try {
    const res = await listPublicLoveBoardsUsingGet({
      current: infinitePagination.current,
      size: infinitePagination.pageSize,
      manName: searchForm.manName?.trim() || undefined,
      womanName: searchForm.womanName?.trim() || undefined
    })
    if (res.data) {
      if (reset) boardList.value = res.data.data.records || []
      else boardList.value = [...boardList.value, ...(res.data.data.records || [])]
      infinitePagination.total = res.data.data.total || 0
      hasMore.value = (res.data.data.records || []).length === infinitePagination.pageSize && boardList.value.length < infinitePagination.total
    }
  } catch (err: any) {
    message.error(t('pages.loveBoardListView.loadFail') + (err.message || t('pages.loveBoardListView.unknownError')))
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const handleSearch = () => {
  infinitePagination.current = 1
  hasMore.value = true
  loadBoardList()
}

const goBoardDetail = (id: number) => router.push({ name: 'LoveBoardShare', params: { id: id } })

const goToMyBoard = async () => {
  try {
    const res = await getMyLoveBoardUsingGet()
    if (res.data?.id) router.push({ name: 'LoveBoardDetail', params: { id: res.data.id } })
    else router.push({ name: 'LoveBoard' })
  } catch (err: any) {
    message.error(t('pages.loveBoardListView.msgs.fetchFail') + (err.message || t('pages.loveBoardListView.unknownError')))
  }
}

const formatDate = (dateStr: string) => dayjs(dateStr).format('YYYY.MM.DD')

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  infinitePagination.current += 1
  await loadBoardList(false)
}

const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const clientHeight = document.documentElement.clientHeight
  const scrollHeight = document.documentElement.scrollHeight
  if (scrollHeight - scrollTop - clientHeight < 200) loadMore()
}

onMounted(() => {
  loadBoardList()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.yuemu-love-board-list {
  background-color: var(--background, #f8fafc);
  color: var(--text-primary);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  --love-primary: #F472B6; /* 降低饱和度，更高级的粉色 */
}

.yuemu-main-container {
  max-width: 1200px; margin: 0 auto; padding: 24px 24px 64px;
}

/* ================= 极简头部 ================= */
.modern-dashboard-header {
  margin-bottom: 32px;
}

.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.main-title {
  font-size: 28px; font-weight: 800; margin: 0; color: var(--text-primary);
}

.modern-cta-btn {
  background: var(--love-primary); color: #fff; border: none; border-radius: 20px;
  height: 36px; padding: 0 20px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: 0.2s;
  &:hover { opacity: 0.9; transform: scale(0.98); }
}

.header-search-row {
  display: flex;
  justify-content: center;
}

.modern-search-capsule {
  display: flex; align-items: center; background: var(--card-background, #fff);
  border-radius: 24px; height: 48px; padding: 0 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03); width: 100%; max-width: 500px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.modern-search-capsule:focus-within, .modern-search-capsule:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-1px);
}
[data-theme='dark'] .modern-search-capsule { background: #1e293b; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }

.search-icon { color: #94a3b8; font-size: 16px; margin-right: 12px; cursor: pointer; }

.ghost-input {
  flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: 15px;
  outline: none; min-width: 0;
  &::placeholder { color: #94a3b8; }
}

.search-divider {
  width: 1px; height: 20px; background: #e2e8f0; margin: 0 12px;
}
[data-theme='dark'] .search-divider { background: #334155; }

/* ================= Apple & Pinterest 风卡片 ================= */
.modern-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.modern-love-card {
  background: var(--card-background, #fff);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.02);
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.08);
    .card-cover-img { transform: scale(1.05); }
  }
}
[data-theme='dark'] .modern-love-card { background: #1e293b; border-color: rgba(255,255,255,0.05); }

.card-cover-area {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.card-cover-img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.card-cover-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%);
}

.card-avatars-float {
  position: absolute; bottom: 16px; left: 20px;
  display: flex; align-items: center; gap: 8px;
}

.avatar-img {
  width: 44px; height: 44px; border-radius: 50%; object-fit: cover;
  border: 2px solid rgba(255,255,255,0.8);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.avatar-heart {
  color: var(--love-primary); font-size: 14px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.card-info-area {
  padding: 16px 20px 20px;
}

.couple-names {
  font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.meta-info {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #64748b; font-weight: 500;
}
[data-theme='dark'] .meta-info { color: #94a3b8; }

.meta-dot { color: #cbd5e1; }
[data-theme='dark'] .meta-dot { color: #475569; }

/* ================= 状态组件 ================= */
.yuemu-empty-state {
  padding: 80px 20px; text-align: center; border-radius: 24px;
  background: var(--card-background, #fff);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  .yuemu-empty-icon { font-size: 48px; margin-bottom: 16px; color: #cbd5e1;}
  .yuemu-empty-title { color: var(--text-primary); font-size: 18px; font-weight: 600; margin: 0 0 8px;}
  .yuemu-empty-desc { color: #94a3b8; margin-bottom: 24px;}
  .yuemu-empty-cta { background: var(--text-primary); border: none; color: var(--background); height: 40px; padding: 0 24px; border-radius: 20px; font-weight: 600;}
}

.yuemu-loading-state {
  padding: 60px 0; text-align: center; color: #94a3b8;
  .yuemu-loading-spinner {
    width: 32px; height: 32px; border: 2px solid #e2e8f0; border-top-color: var(--text-primary);
    border-radius: 50%; animation: yuemu-spin 0.8s linear infinite; margin: 0 auto 12px;
  }
}

.yuemu-load-more-footer {
  padding: 30px 0; text-align: center; color: #94a3b8; font-size: 13px; margin-top: 24px;
  .yuemu-loading-more { display: flex; justify-content: center; align-items: center; gap: 8px; .yuemu-small { width: 14px; height: 14px; border-width: 2px; border-top-color: var(--text-primary); border-radius: 50%; animation: yuemu-spin 0.8s linear infinite;} }
}
@keyframes yuemu-spin { to { transform: rotate(360deg); } }

/* ================= 移动端适配 ================= */
@media (max-width: 768px) {
  .yuemu-main-container { padding: 16px; }

  .modern-dashboard-header { margin-bottom: 24px; }
  .header-top-row { margin-bottom: 16px; }
  .main-title { font-size: 24px; }
  .modern-cta-btn { height: 32px; padding: 0 16px; font-size: 13px; }

  .modern-search-capsule { height: 44px; padding: 0 12px; border-radius: 22px; }
  .ghost-input { font-size: 14px; }
  .search-icon { font-size: 15px; margin-right: 8px; }

  .modern-gallery-grid {
    grid-template-columns: 1fr; /* 移动端改为单列，极具视觉冲击力 */
    gap: 20px;
  }

  .card-cover-area { aspect-ratio: 16/10; } /* 移动端封面比例稍宽 */
  
  .avatar-img { width: 40px; height: 40px; }
  .card-info-area { padding: 16px; }
}
</style>
