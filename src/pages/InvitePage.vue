<template>
  <div id="yuemu-invite-page">

    <header class="yuemu-header">
      <button class="yuemu-icon-btn" @click="router.back()">
        <i class="fas fa-chevron-left"></i>
      </button>
      <h2 class="yuemu-header-title">{{ $t('pages.invitePage.title') }}</h2>
      <button class="yuemu-icon-btn" @click="showRules">
        <i class="fas fa-question-circle"></i>
      </button>
    </header>

    <main class="yuemu-main-content">
      <div class="yuemu-invite-hero">
        <h3 class="yuemu-hero-title">{{ $t('pages.invitePage.myCode') }}</h3>
        <div class="yuemu-code-container">
          <div v-if="inviteCode" class="yuemu-code-display">
            <span class="yuemu-code-text">{{ inviteCode }}</span>
            <button class="yuemu-copy-btn" @click="copyCode">{{ $t('pages.invitePage.copyLink') }}</button>
          </div>
          <div v-else-if="loadingCode" class="yuemu-code-loading">
            <i class="fas fa-circle-notch fa-spin"></i> 生成中...
          </div>
          <div v-else class="yuemu-code-error" @click="fetchInviteCode">
            <i class="fas fa-redo-alt"></i> 加载失败，点击重试
          </div>
        </div>
        <p class="yuemu-hero-desc">{{ $t('pages.invitePage.inviteDesc') }}</p>
      </div>

      <div class="yuemu-segmented-wrapper">
        <div class="yuemu-segmented-control">
          <div
            class="yuemu-segment-item"
            :class="{ 'yuemu-active': activeTab === 'records' }"
            @click="switchTab('records')"
          >
            {{ $t('pages.invitePage.inviteDetails') }}
          </div>
          <div
            class="yuemu-segment-item"
            :class="{ 'yuemu-active': activeTab === 'leaderboard' }"
            @click="switchTab('leaderboard')"
          >
            {{ $t('pages.invitePage.leaderboard') }}
          </div>
        </div>
      </div>

      <div class="yuemu-list-container">

        <template v-if="activeTab === 'records'">
          <div class="yuemu-empty-state" v-if="records.length === 0 && !loadingRecords">
            <i class="fas fa-inbox"></i>
            <p>{{ $t('pages.invitePage.emptyInvite') }}</p>
          </div>

          <div class="yuemu-list-item" v-for="record in records" :key="record.id">
            <img :src="record.inviteeAvatar || getDefaultAvatar(record.inviteeName)" alt="avatar" class="yuemu-avatar" />
            <div class="yuemu-item-info">
              <div class="yuemu-item-name">{{ record.inviteeName || $t('pages.invitePage.unknownUser') }}</div>
              <div class="yuemu-item-time">{{ formatDate(record.createTime) }}</div>
            </div>
            <div class="yuemu-item-status">
              <span class="yuemu-badge yuemu-badge-success" v-if="record.status === 1">{{ $t('pages.invitePage.valid') }}</span>
              <span class="yuemu-badge yuemu-badge-normal" v-else>{{ $t('pages.invitePage.invalid') }}</span>
            </div>
          </div>
        </template>

        <template v-if="activeTab === 'leaderboard'">
          <div class="yuemu-empty-state" v-if="leaderboard.length === 0 && !loadingLeaderboard">
            <i class="fas fa-trophy"></i>
            <p>{{ $t('pages.invitePage.emptyRank') }}</p>
          </div>

          <div class="yuemu-list-item" v-for="(item, index) in leaderboard" :key="item.userId">
            <div class="yuemu-rank-num" :class="getRankClass(index)">{{ index + 1 }}</div>
            <img :src="item.userAvatar || getDefaultAvatar(item.userName)" alt="avatar" class="yuemu-avatar" />
            <div class="yuemu-item-info">
              <div class="yuemu-item-name">{{ item.userName }}</div>
            </div>
            <div class="yuemu-rank-score">
              <span class="yuemu-highlight-num">{{ item.inviteCount }}</span> 人
            </div>
          </div>
        </template>

        <div class="yuemu-load-more" ref="loadMoreSentinel" v-show="records.length > 0 || leaderboard.length > 0">
          <span v-if="isFetchingMore"><i class="fas fa-spinner fa-spin"></i> {{ $t('pages.invitePage.loading') }}</span>
          <span v-else-if="!hasMore[activeTab]" class="yuemu-no-more">{{ $t('pages.invitePage.noMore') }}</span>
        </div>

      </div>
    </main>

    <MemberMechanismModal ref="memberMechanismModalRef" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import MemberMechanismModal from '@/components/MemberMechanismModal.vue'
import { generateInviteCodeUsingGet } from '@/api/userController'
import { getLeaderboardUsingGet, listMyInviteRecordsUsingGet } from '@/api/inviteController'

const { t } = useI18n();

const router = useRouter()
const memberMechanismModalRef = ref()
const activeTab = ref<'records' | 'leaderboard'>('records')

const inviteCode = ref('')
const loadingCode = ref(true)

const records = ref<any[]>([])
const leaderboard = ref<any[]>([])
const loadingRecords = ref(false)
const loadingLeaderboard = ref(false)
const isFetchingMore = ref(false)

const pagination = reactive({
  records: { current: 1, size: 20 },
  leaderboard: { current: 1, size: 20 }
})

const hasMore = reactive({
  records: true,
  leaderboard: true
})

const loadMoreSentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const showRules = () => memberMechanismModalRef.value?.openModal()

const copyCode = () => {
  if (inviteCode.value) {
    const inviteLink = `${window.location.origin}/user/register?inviteCode=${inviteCode.value}`
    navigator.clipboard.writeText(inviteLink).then(() => {
      message.success(t('pages.invitePage.copySuccess'))
    })
  }
}

const getDefaultAvatar = (userName: string) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userName || 'Guest')}&backgroundColor=ffd5dc,ffdfbf,ffd5dc`

const formatDate = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getRankClass = (index: number) => {
  if (index === 0) return 'yuemu-top1'
  if (index === 1) return 'yuemu-top2'
  if (index === 2) return 'yuemu-top3'
  return ''
}

const fetchInviteCode = async () => {
  loadingCode.value = true
  try {
    const res = await generateInviteCodeUsingGet()
    if (res.data.code === 0) inviteCode.value = res.data.data
  } catch (e) {
    message.error(t('pages.invitePage.errGetCode'))
  } finally {
    loadingCode.value = false
  }
}

const loadRecords = async (isLoadMore = false) => {
  if (!hasMore.records || (loadingRecords.value && !isLoadMore)) return
  if (isLoadMore) isFetchingMore.value = true
  else loadingRecords.value = true

  try {
    const res = await listMyInviteRecordsUsingGet({ current: pagination.records.current, size: pagination.records.size })
    if (res.data.code === 0 && res.data.data) {
      const newData = res.data.data.records || []
      if (isLoadMore) records.value.push(...newData)
      else records.value = newData
      hasMore.records = newData.length >= pagination.records.size
      if (hasMore.records) pagination.records.current++
    }
  } finally {
    loadingRecords.value = false
    isFetchingMore.value = false
  }
}

const loadLeaderboard = async (isLoadMore = false) => {
  if (!hasMore.leaderboard || (loadingLeaderboard.value && !isLoadMore)) return
  if (isLoadMore) isFetchingMore.value = true
  else loadingLeaderboard.value = true

  try {
    const res = await getLeaderboardUsingGet({ current: pagination.leaderboard.current, limit: pagination.leaderboard.size })
    if (res.data.code === 0 && res.data.data) {
      const newData = res.data.data || []
      if (isLoadMore) leaderboard.value.push(...newData)
      else leaderboard.value = newData
      hasMore.leaderboard = newData.length >= pagination.leaderboard.size
      if (hasMore.leaderboard) pagination.leaderboard.current++
    }
  } finally {
    loadingLeaderboard.value = false
    isFetchingMore.value = false
  }
}

const switchTab = (tab: 'records' | 'leaderboard') => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (tab === 'records' && records.value.length === 0) loadRecords()
  if (tab === 'leaderboard' && leaderboard.value.length === 0) loadLeaderboard()
}

const setupIntersectionObserver = () => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isFetchingMore.value) {
      if (activeTab.value === 'records' && hasMore.records) loadRecords(true)
      else if (activeTab.value === 'leaderboard' && hasMore.leaderboard) loadLeaderboard(true)
    }
  }, { rootMargin: '50px' })

  nextTick(() => {
    if (loadMoreSentinel.value) observer?.observe(loadMoreSentinel.value)
  })
}

onMounted(() => {
  fetchInviteCode()
  loadRecords()
  setupIntersectionObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
/* 基础容器 */
#yuemu-invite-page {
  min-height: 100vh;
  /* 回归标准背景色，不再强行写死导致暗色模式下大块泛白 */
  background-color: var(--background);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  display: flex;
  flex-direction: column;
}

/* 顶部无缝导航 */
.yuemu-header {
  position: sticky;
  top: 0;
  z-index: 50;
  box-sizing: border-box; /* 解决高度和 padding 叠加产生的巨大空隙 */
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
  background: var(--header-background);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--border-color); /* 增加统一边界线 */
}

.yuemu-header-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.yuemu-icon-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  font-size: 20px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
}

.yuemu-icon-btn:active { opacity: 0.5; }

/* 主内容区 */
.yuemu-main-content {
  flex: 1;
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

/* 邀请码极简卡片 */
.yuemu-invite-hero {
  background: var(--card-background);
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  margin-bottom: 24px;
  border: 1px solid var(--border-color); /* 增加微妙的轮廓感 */
}

.yuemu-hero-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.yuemu-code-container {
  background: var(--hover-background, #f2f2f7); /* 略深一号的内嵌区域 */
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  /* 去除边框，纯靠色彩层级区分 */
  border: none;
}

.yuemu-code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.yuemu-code-text {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--link-color);
}

.yuemu-copy-btn {
  background: var(--link-color, #007aff);
  color: #fff;
  border: none;
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s;
}

.yuemu-copy-btn:active { transform: scale(0.95); }

.yuemu-code-loading, .yuemu-code-error {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 8px 0;
}
.yuemu-code-error { color: #ff3b30; cursor: pointer; }

.yuemu-hero-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

/* 选项卡容器：避免紧贴，留出呼吸感 */
.yuemu-segmented-wrapper {
  margin-bottom: 12px;
  padding: 0 4px;
}

/* iOS 风格分段选择器 */
.yuemu-segmented-control {
  display: flex;
  background: rgba(142, 142, 147, 0.12); /* 标准苹果分段底色 */
  border-radius: 9px;
  padding: 2px;
}

.yuemu-segment-item {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.yuemu-segment-item.yuemu-active {
  background: var(--card-background);
  box-shadow: 0 3px 8px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.04); /* 选项卡滑块保留微弱的光学投影 */
}

/* 列表区：增加微弱边框 */
.yuemu-list-container {
  background: var(--card-background);
  border-radius: 16px;
  padding: 0 16px;
  border: 1px solid var(--border-color);
}

.yuemu-empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-secondary);
}
.yuemu-empty-state i {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.4;
}
.yuemu-empty-state p { margin: 0; font-size: 14px; }

/* 列表项的内部分割线依然保留，确保信息易读 */
.yuemu-list-item {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 0.5px solid var(--ios-modal-divider, rgba(60,60,67,0.1));
}
.yuemu-list-item:last-of-type {
  border-bottom: none;
}

.yuemu-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  background: var(--hover-background);
}

.yuemu-item-info {
  flex: 1;
  min-width: 0;
}

.yuemu-item-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.yuemu-item-time {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 标签圆角处理得更柔和 */
.yuemu-badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
}
.yuemu-badge-success { background: rgba(52, 199, 89, 0.1); color: #34c759; }
.yuemu-badge-normal { background: var(--ios-search-bg); color: var(--text-secondary); }

/* {{ $t('pages.invitePage.leaderboard') }} */
.yuemu-rank-num {
  width: 32px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-secondary);
  text-align: center;
  margin-right: 4px;
}
.yuemu-top1 { color: #ffcc00; font-size: 20px; }
.yuemu-top2 { color: #a9a9a9; font-size: 18px; }
.yuemu-top3 { color: #cd7f32; font-size: 17px; }

.yuemu-rank-score {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}
.yuemu-highlight-num {
  font-size: 17px;
  font-weight: 700;
  color: var(--link-color);
}

.yuemu-load-more {
  text-align: center;
  padding: 20px 0;
  font-size: 13px;
  color: var(--text-secondary);
}
.yuemu-no-more { opacity: 0.6; }
</style>
