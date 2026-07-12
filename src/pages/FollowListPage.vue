<template>
  <div class="modern-page-wrapper">
    <header class="blur-header">
      <div class="header-inner">
        <div class="nav-left">
          <button class="icon-btn back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>

        <div class="segmented-control">
          <div class="segment-item" :class="{ active: activeTab === 'follow' }" @click="activeTab = 'follow'">
            <span>{{ $t('pages.followListPage.follow') }}</span>
            <span class="count-badge">{{ followCount }}</span>
          </div>
          <div class="segment-item" :class="{ active: activeTab === 'fans' }" @click="activeTab = 'fans'">
            <span>{{ $t('pages.followListPage.fans') }}</span>
            <span class="count-badge">{{ fansCount }}</span>
          </div>
          <div class="segment-slider" :class="activeTab"></div>
        </div>

        <div class="nav-right">
          <button class="fancy-btn" @click="openGraphModal">
            <i class="fas fa-meteor"></i>
            <span class="hide-on-mobile">{{ $t('pages.followListPage.starGraph') }}</span>
          </button>
        </div>
      </div>

      <div class="search-container">
        <div class="modern-search-bar">
          <a-select v-model:value="searchType" :bordered="false" class="type-selector">
            <a-select-option value="id">{{ $t('pages.followListPage.searchOptions.id') }}</a-select-option>
            <a-select-option value="name">{{ $t('pages.followListPage.searchOptions.name') }}</a-select-option>
            <a-select-option value="account">{{ $t('pages.followListPage.searchOptions.account') }}</a-select-option>
            <a-select-option value="profile">{{ $t('pages.followListPage.searchOptions.profile') }}</a-select-option>
          </a-select>
          <div class="separator"></div>
          <i class="fas fa-search placeholder-icon"></i>
          <input
            type="text"
            :placeholder="getSearchPlaceholder()"
            v-model="searchText"
            @input="handleSearch"
            class="input-field"
          />
          <button class="clear-btn" v-if="searchText" @click="handleClear">
            <i class="fas fa-times-circle"></i>
          </button>
        </div>
      </div>
    </header>

    <main class="main-viewport">
      <div v-if="userList.length > 0" class="user-cards-grid">
        <div v-for="user in userList" :key="user.id" class="compact-user-card" @click="goToUserSpace(user)">
          <div class="card-left">
            <img :src="user.userAvatar || getDefaultAvatar(user.userName)" class="round-avatar" />
            <div class="user-text">
              <h3 class="user-name">{{ user.userName }}</h3>
              <p class="user-id">ID: {{ user.id }}</p>
            </div>
          </div>

          <div class="card-right" @click.stop>
            <button v-if="activeTab === 'follow'" class="action-pill btn-muted" @click="handleUnfollow(user)">
              {{ $t('pages.followListPage.unfollow') }}
            </button>
            <button v-else class="action-pill" :class="user.isFollowing ? 'btn-secondary' : 'btn-primary'" @click="toggleFollow(user)">
              <i :class="user.isFollowing ? 'fas fa-check' : 'fas fa-plus'"></i>
              {{ user.isFollowing ? $t('pages.followListPage.following') : $t('pages.followListPage.toFollow') }}
            </button>
          </div>
        </div>
      </div>

      <div class="status-view" v-if="loading && userList.length === 0">
        <div class="modern-spinner"></div>
        <p>{{ $t('pages.followListPage.readingCoords') }}</p>
      </div>

      <div class="status-view empty-view" v-if="!loading && userList.length === 0">
        <div class="empty-icon-wrap">
          <i :class="activeTab === 'follow' ? 'fas fa-compass' : 'fas fa-star'" class="gradient-icon"></i>
        </div>
        <h3 class="empty-title">{{ activeTab === 'follow' ? $t('pages.followListPage.emptyFollowTitle') : $t('pages.followListPage.emptyFansTitle') }}</h3>
        <p class="empty-desc">{{ activeTab === 'follow' ? $t('pages.followListPage.emptyFollowDesc') : $t('pages.followListPage.emptyFansDesc') }}</p>
        <button class="fancy-btn primary-solid" @click="goToHome">{{ $t('pages.followListPage.startExplore') }}</button>
      </div>

      <div v-if="loadingMore" class="load-more-status">
        <div class="modern-spinner mini"></div> <span>{{ $t('pages.followListPage.loading') }}</span>
      </div>
      <div v-if="!hasMore && dataList.length > 0" class="load-more-status end-text">
        {{ $t('pages.followListPage.endOfUniverse') }}
      </div>
    </main>

    <transition name="modal-fade">
      <div class="galaxy-modal-overlay" v-show="graphModalVisible" @click="closeGraphModal">
        <div class="galaxy-modal-window" @click.stop>
          <div class="window-header">
            <div class="header-title">
              <i class="fas fa-meteor text-glow"></i>
              <span>{{ isViewingSelf ? (activeTab === 'follow' ? $t('pages.followListPage.graphTitle.myFollow') : $t('pages.followListPage.graphTitle.myFans')) : (activeTab === 'follow' ? $t('pages.followListPage.graphTitle.taFollow') : $t('pages.followListPage.graphTitle.taFans')) }}</span>
            </div>
            <button class="window-close-btn" @click="closeGraphModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="window-body starry-sky">
            <div class="stars-layer-1"></div>
            <div class="stars-layer-2"></div>
            <div ref="graphRef" class="echarts-canvas" style="min-height: 500px; width: 100%; height: 100%;"></div>

            <div class="graph-floating-actions">
              <button
                v-if="!finished"
                class="cyber-btn"
                @click="handleGraphLoadMore"
                :disabled="loadingMoreGraph"
              >
                <i v-if="loadingMoreGraph" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-satellite-dish"></i>
                {{ loadingMoreGraph ? $t('pages.followListPage.scanning') : $t('pages.followListPage.detectMore') }}
              </button>
              <div v-else class="cyber-text-muted">{{ $t('pages.followListPage.allNodesFound') }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { message } from 'ant-design-vue'
import { getFollowOrFanListUsingPost, addUserFollowsUsingPost } from '@/api/userFollowsController'
import * as echarts from 'echarts'

const { t } = useI18n();

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()
const activeTab = ref(route.query.tab?.toString() || 'follow')
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = 20
const userList = ref<any[]>([])
const followCount = ref(0)
const fansCount = ref(0)
const searchType = ref('id')
const searchText = ref('')
const searchDebounceTimer = ref<number | null>(null)

const graphModalVisible = ref(false)
const graphRef = ref<HTMLElement | null>(null)
let graphChart: echarts.ECharts | null = null

const targetUserId = ref(route.query.userId?.toString() || loginUserStore.loginUser?.id)
const isViewingSelf = ref(!route.query.userId || route.query.userId === loginUserStore.loginUser?.id)
const dataList = ref<any[]>([])

const getSearchPlaceholder = () => {
  const target = activeTab.value === 'follow' ? t('pages.followListPage.follow') : t('pages.followListPage.fans')
  const map: any = { id: 'ID', name: t('pages.followListPage.searchOptions.name'), account: t('pages.followListPage.searchOptions.account'), profile: t('pages.followListPage.searchOptions.profile') }
  return t('pages.followListPage.searchPlaceholder', { target, type: map[searchType.value] })
}

watch(searchType, () => { if (searchText.value) handleSearch() })

const fetchCounts = async () => {
  if (!targetUserId.value) return
  try {
    const [followRes, fansRes] = await Promise.all([
      getFollowOrFanListUsingPost({ current: 1, pageSize: 1, searchType: 0, followerId: targetUserId.value }),
      getFollowOrFanListUsingPost({ current: 1, pageSize: 1, searchType: 1, followingId: targetUserId.value })
    ])
    if (followRes.data.code === 0) followCount.value = followRes.data.data.total || 0
    if (fansRes.data.code === 0) fansCount.value = fansRes.data.data.total || 0
  } catch (error) {
    console.error(t('pages.followListPage.statFail'), error)
  }
}

const loadingMore = ref(false)
const hasMore = ref(true)

const loadMore = async () => {
  if (refreshing.value) { userList.value = []; refreshing.value = false; }
  if (loading.value || finished.value || loadingMore.value) return

  if (currentPage.value === 1) loading.value = true
  else loadingMore.value = true

  try {
    const params: any = { current: currentPage.value, pageSize: pageSize, searchType: activeTab.value === 'follow' ? 0 : 1 }

    if (activeTab.value === 'follow') {
      params.followerId = targetUserId.value
      if (searchText.value?.trim()) {
        const val = searchText.value.trim()
        if (searchType.value === 'id') params.followingId = val
        if (searchType.value === 'name') params.userNameKeyword = val
        if (searchType.value === 'account') params.userAccountKeyword = val
        if (searchType.value === 'profile') params.userProfileKeyword = val
      }
    } else {
      params.followingId = targetUserId.value
      if (searchText.value?.trim()) {
        const val = searchText.value.trim()
        if (searchType.value === 'id') params.followerId = val
        if (searchType.value === 'name') params.userNameKeyword = val
        if (searchType.value === 'account') params.userAccountKeyword = val
        if (searchType.value === 'profile') params.userProfileKeyword = val
      }
    }

    const res = await getFollowOrFanListUsingPost(params)
    if (res.data.code === 0) {
      const newUsers = res.data.data.records || []
      const total = res.data.data.total || 0
      if (activeTab.value === 'follow') followCount.value = total
      else fansCount.value = total

      userList.value.push(...newUsers)
      dataList.value = userList.value

      hasMore.value = userList.value.length < total
      if (newUsers.length === 0 || userList.value.length >= total) finished.value = true
      else currentPage.value++
    }
  } catch (error) {
    message.error(t('pages.followListPage.loadFail'))
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const toggleFollow = async (user: any) => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.followListPage.pleaseLogin'))
  user.loading = true
  try {
    const res = await addUserFollowsUsingPost({
      followerId: loginUserStore.loginUser.id, followingId: user.id, followingName: user.userName,
      followerName: loginUserStore.loginUser.userName, followStatus: user.isFollowing ? 0 : 1
    })
    if (res.data?.code === 0) {
      user.isFollowing = !user.isFollowing
      message.success(user.isFollowing ? t('pages.followListPage.followSuccess') : t('pages.followListPage.cancelFollow'))
      if (graphModalVisible.value) updateGraphData() // 状态改变，热更新图谱
    }
  } finally { user.loading = false }
}

const handleUnfollow = async (user: any) => {
  if (!loginUserStore.loginUser?.id) return message.warning(t('pages.followListPage.pleaseLogin'))
  try {
    const res = await addUserFollowsUsingPost({
      followerId: loginUserStore.loginUser.id, followingId: user.id, followingName: user.userName,
      followerName: loginUserStore.loginUser.userName, followStatus: 0
    })
    if (res.data?.code === 0) {
      message.success(t('pages.followListPage.unfollowSuccess'))
      currentPage.value = 1; userList.value = []; loadMore();
      if (graphModalVisible.value) {
        // 重置时需要清空重新渲染
        if (graphChart) graphChart.dispose()
        setTimeout(() => { initUserGraph() }, 100)
      }
    }
  } catch (error) { message.error(t('pages.followListPage.actionFail')) }
}

const goToUserSpace = (user: any) => { router.push({ path: `/user/${user.id}`, query: { userName: user.userName, userAvatar: user.userAvatar } }) }
const getDefaultAvatar = (userName: string) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userName || 'Guest')}&backgroundColor=0f172a`
const goBack = () => router.go(-1)
const goToHome = () => router.push('/')
const handleClear = () => { searchText.value = ''; handleSearch() }

const handleSearch = () => {
  if (searchDebounceTimer.value) clearTimeout(searchDebounceTimer.value)
  searchDebounceTimer.value = setTimeout(() => {
    if (searchType.value === 'id' && searchText.value && !/^\d+$/.test(searchText.value)) { message.error(t('pages.followListPage.invalidId')); return; }
    currentPage.value = 1; userList.value = []; finished.value = false; loadMore()
  }, 500)
}

const handleScroll = () => {
  if (loading.value || finished.value || loadingMore.value) return
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollHeight = document.documentElement.scrollHeight
  const clientHeight = window.innerHeight
  if (scrollHeight - scrollTop - clientHeight < 200) loadMore()
}

// ============================================================================
// 核心优化：彻底解决正方形头像 & 随机长度连线 & 动态加载更多节点
// ============================================================================

// 【新增】：图片缓存 Map，防止触底加载时重复处理已处理过的图片，提升性能
const avatarCache = new Map<string, string>()

const getCircularAvatar = async (url: string): Promise<string> => {
  if (!url) return ''
  if (avatarCache.has(url)) return avatarCache.get(url)!

  let finalUrl = url
  if (url.includes('dicebear.com') && !url.includes('radius=')) {
    finalUrl = url.includes('?') ? `${url}&radius=50` : `${url}?radius=50`
    avatarCache.set(url, finalUrl)
    return finalUrl
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 120
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        avatarCache.set(url, url)
        return resolve(url)
      }
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      const scale = Math.max(size / img.width, size / img.height)
      const x = (size - img.width * scale) / 2
      const y = (size - img.height * scale) / 2
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
      const base64 = canvas.toDataURL('image/png')
      avatarCache.set(url, base64)
      resolve(base64)
    }
    img.onerror = () => {
      avatarCache.set(url, url)
      resolve(url)
    }
    img.src = url
  })
}

// 【新增】：分离数据更新逻辑，支持图谱无缝插入新节点
const updateGraphData = async () => {
  if (!graphChart) return

  const currentUser = isViewingSelf.value ? loginUserStore.loginUser : {
    id: targetUserId.value,
    userName: route.query.userName?.toString() || t('pages.followListPage.centerNode'),
    userAvatar: route.query.userAvatar?.toString() || getDefaultAvatar(t('pages.followListPage.centerNode'))
  }

  const colorCenter = '#00f2fe'
  const colorTarget = activeTab.value === 'follow' ? '#00ff87' : '#f857a6'

  const centerAvatarRound = await getCircularAvatar(currentUser.userAvatar || getDefaultAvatar(currentUser.userName))

  const nodes: any[] = [{
    id: String(currentUser.id),
    name: currentUser.userName,
    category: 0,
    symbolSize: 80,
    itemStyle: { color: 'transparent', borderColor: 'transparent' },
    label: {
      show: true,
      position: 'inside',
      formatter: '{avatar|}\n{name|{b}}',
      distance: 0,
      rich: {
        avatar: {
          backgroundColor: { image: centerAvatarRound },
          width: 76, height: 76, borderRadius: 38,
          borderWidth: 2, borderColor: '#fff',
          shadowBlur: 30, shadowColor: colorCenter
        },
        name: { color: '#ffffff', fontSize: 13, padding: [8, 0, 0, 0], textShadowColor: '#000', textShadowBlur: 4 }
      }
    }
  }]

  const links: any[] = []

  // 并发处理图片裁剪 (得益于缓存，已经渲染过的瞬间返回)
  const avatarPromises = userList.value.map(user => getCircularAvatar(user.userAvatar || getDefaultAvatar(user.userName)))
  const childAvatarsRound = await Promise.all(avatarPromises)

  userList.value.forEach((user, index) => {
    // 根据 ID 哈希生成伪随机大小和距离，确保每次重绘时该星球大小和连线长度固定
    const pseudoRandom = (parseInt(user.id) % 100) / 100
    const randSize = 36 + pseudoRandom * 24;

    nodes.push({
      id: String(user.id),
      name: user.userName,
      category: 1,
      symbolSize: randSize + 16,
      itemStyle: { color: 'transparent', borderColor: 'transparent' },
      label: {
        show: true,
        position: 'inside',
        formatter: '{avatar|}\n{name|{b}}',
        distance: 0,
        rich: {
          avatar: {
            backgroundColor: { image: childAvatarsRound[index] },
            width: randSize, height: randSize, borderRadius: randSize / 2,
            borderWidth: 1, borderColor: '#ffffff',
            shadowBlur: 15, shadowColor: colorTarget
          },
          name: { color: '#94a3b8', fontSize: 11, padding: [4, 0, 0, 0], textShadowColor: '#000', textShadowBlur: 2 }
        }
      }
    })

    links.push({
      source: String(currentUser.id),
      target: String(user.id),
      value: pseudoRandom * 150 + 50, // 基于 ID 固定的排斥距离
      lineStyle: {
        width: 1,
        curveness: 0.15 + pseudoRandom * 0.25,
        opacity: 0.3 + pseudoRandom * 0.5,
        color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: colorCenter },
          { offset: 1, color: colorTarget }
        ])
      }
    })
  })

  // 直接注入新数据，ECharts 会根据 ID 自动识别新增节点并平滑入场
  graphChart.setOption({
    series: [{
      data: nodes,
      links: links
    }]
  })
}

// 【新增】：点击加载更多图谱节点
const loadingMoreGraph = ref(false)
const handleGraphLoadMore = async () => {
  if (finished.value || loadingMoreGraph.value) return
  loadingMoreGraph.value = true

  await loadMore()         // 触发接口拉取新一页数据并追加进 userList
  await updateGraphData()  // 热更新注入图谱

  loadingMoreGraph.value = false
}

const openGraphModal = () => {
  graphModalVisible.value = true
  document.body.style.overflow = 'hidden'
  setTimeout(() => { initUserGraph() }, 300)
}

const closeGraphModal = () => {
  graphModalVisible.value = false
  document.body.style.overflow = ''
}

const initUserGraph = async () => {
  if (!graphRef.value) return
  if (graphChart) graphChart.dispose()

  graphChart = echarts.init(graphRef.value, 'dark')

  // 建立基础星系配置
  const option = {
    backgroundColor: 'transparent',
    tooltip: { show: false },
    series: [{
      type: 'graph',
      layout: 'force',
      data: [],
      links: [],
      roam: true,
      force: {
        repulsion: [200, 600],
        edgeLength: [60, 200],
        gravity: 0.08,
        layoutAnimation: true
      },
      emphasis: { focus: 'adjacency', lineStyle: { width: 3, opacity: 1 } }
    }]
  }

  graphChart.setOption(option)
  graphChart.showLoading({ text: t('pages.followListPage.buildingGalaxy'), color: '#00f2fe', textColor: '#cbd5e1', maskColor: 'rgba(3, 7, 18, 0.8)' })

  // 注入数据
  await updateGraphData()

  graphChart.hideLoading()
  nextTick(() => graphChart?.resize())
}

const handleGraphResize = () => { if (graphModalVisible.value && graphChart) graphChart.resize() }

watch(() => route.query.tab, (newTab) => { if (newTab) activeTab.value = newTab.toString() })
watch(() => route.query.userId, (newUserId) => {
  const newTarget = newUserId?.toString() || loginUserStore.loginUser?.id
  if (newTarget !== targetUserId.value) {
    targetUserId.value = newTarget
    isViewingSelf.value = !newUserId || newUserId === loginUserStore.loginUser?.id
    searchText.value = ''; searchType.value = 'id'; currentPage.value = 1; userList.value = [];
    finished.value = false; loading.value = false;
    fetchCounts(); loadMore();
  }
})

watch(activeTab, () => {
  searchText.value = ''; searchType.value = 'id'; currentPage.value = 1; userList.value = [];
  finished.value = false; loading.value = false; window.scrollTo(0,0); loadMore();
})

onMounted(async () => {
  if (!loginUserStore.loginUser?.id) return router.replace('/user/login')
  targetUserId.value = route.query.userId?.toString() || loginUserStore.loginUser?.id
  isViewingSelf.value = !route.query.userId || route.query.userId === loginUserStore.loginUser?.id
  loadMore(); fetchCounts();
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleGraphResize)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleGraphResize)
  if (graphChart) { graphChart.dispose(); graphChart = null }
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* ==================================================
   Modern UI / 移动端高密度极简布局
================================================== */
.modern-page-wrapper {
  min-height: 100vh;
  background: var(--background, #f8fafc);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding-bottom: 40px;
}

/* --- 1. 悬浮导航栏 --- */
.blur-header {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  padding: 12px 24px;
}
.dark-theme .blur-header { background: rgba(15, 23, 42, 0.85); border-bottom-color: rgba(255,255,255,0.08); }

.header-inner {
  max-width: 1000px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
}

.icon-btn {
  width: 36px; height: 36px; border-radius: 12px;
  background: var(--card-background); border: 1px solid var(--border-color);
  color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}
.icon-btn:hover { color: var(--text-primary); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.segmented-control {
  display: flex; background: var(--hover-background); border-radius: 12px;
  padding: 4px; position: relative; border: 1px solid var(--border-color);
}
.segment-item {
  position: relative; z-index: 2; padding: 6px 20px; font-size: 14px; font-weight: 600;
  color: var(--text-secondary); cursor: pointer; transition: color 0.3s;
  display: flex; align-items: center; gap: 6px;
}
.segment-item.active { color: var(--text-primary); }
.count-badge { background: rgba(0,0,0,0.06); padding: 2px 8px; border-radius: 10px; font-size: 12px; }
.dark-theme .count-badge { background: rgba(255,255,255,0.1); }

.segment-slider {
  position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px);
  background: var(--card-background); border-radius: 8px; z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.segment-slider.follow { transform: translateX(0); }
.segment-slider.fans { transform: translateX(100%); }

.fancy-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 12px;
  background: linear-gradient(135deg, #0f172a, #334155);
  color: #fff; border: none; font-weight: 600; font-size: 14px;
  cursor: pointer; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); transition: all 0.2s;
}
.dark-theme .fancy-btn { background: linear-gradient(135deg, #3b82f6, #6366f1); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
.fancy-btn:hover { transform: translateY(-2px); opacity: 0.9; }
.fancy-btn.primary-solid { background: var(--text-primary); color: var(--background); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }

/* --- 2. 精致搜索框 --- */
.search-container { max-width: 600px; margin: 12px auto 0; }
.modern-search-bar {
  display: flex; align-items: center;
  background: var(--card-background); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 2px 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); transition: all 0.3s ease;
}
.modern-search-bar:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.type-selector { width: 100px; font-weight: 500; }
.separator { width: 1px; height: 16px; background: var(--border-color); margin: 0 10px; }
.placeholder-icon { color: #94a3b8; margin-right: 8px; font-size: 13px; }
.input-field { flex: 1; border: none; background: transparent; color: var(--text-primary); outline: none; font-size: 14px; padding: 8px 0; }
.clear-btn { background: transparent; border: none; color: #94a3b8; cursor: pointer; }

/* --- 3. 紧凑型卡片网格 (移动端高密度) --- */
.main-viewport { max-width: 1000px; margin: 0 auto; padding: 24px; }

.user-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.compact-user-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.compact-user-card:hover { transform: translateY(-2px); border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 8px 20px rgba(0,0,0,0.04); }

.card-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.round-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); }
.user-text { display: flex; flex-direction: column; min-width: 0; }
.user-name { font-size: 15px; font-weight: 700; margin: 0 0 2px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-id { font-size: 11px; color: var(--text-secondary); margin: 0; font-family: monospace; }

.card-right { flex-shrink: 0; }
.action-pill {
  padding: 6px 14px; border-radius: 100px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s;
  display: flex; align-items: center; gap: 4px;
}
.btn-primary { background: var(--text-primary); color: var(--background); }
.btn-primary:hover { opacity: 0.8; transform: scale(0.96); }
.btn-secondary { background: var(--hover-background); color: var(--text-secondary); border: 1px solid var(--border-color); }
.btn-muted { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); }

/* --- 4. 状态反馈 --- */
.status-view { display: flex; flex-direction: column; align-items: center; padding: 60px 0; color: var(--text-secondary); text-align: center; }
.modern-spinner { width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s ease-in-out infinite; margin-bottom: 16px; }
.modern-spinner.mini { width: 16px; height: 16px; margin-bottom: 0; border-width: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon-wrap { width: 64px; height: 64px; background: var(--card-background); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.04); border: 1px solid var(--border-color); }
.gradient-icon { font-size: 28px; background: linear-gradient(135deg, #94a3b8, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.empty-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.empty-desc { font-size: 13px; margin-bottom: 24px; }

.load-more-status { display: flex; justify-content: center; align-items: center; gap: 8px; padding: 20px 0; color: var(--text-secondary); font-size: 13px; }
.end-text { letter-spacing: 1px; }

/* --- 5. 纯净星空图谱 (CSS Starry Sky) --- */
.galaxy-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(3, 7, 18, 0.95);
  display: flex; align-items: center; justify-content: center;
}
.galaxy-modal-window {
  width: 98vw; height: 95vh; max-width: 1400px;
  background: transparent;
  display: flex; flex-direction: column;
}
.window-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; z-index: 10;
}
.header-title { display: flex; align-items: center; gap: 10px; color: #f8fafc; font-size: 18px; font-weight: 600; letter-spacing: 1px; }
.text-glow { color: #00f2fe; font-size: 20px; text-shadow: 0 0 12px rgba(0, 242, 254, 0.8); }

.window-close-btn {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;
  width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
  transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.window-close-btn:hover { background: rgba(255,255,255,0.1); transform: rotate(90deg); }

/* 宇宙图层与悬浮操作 */
.window-body { flex: 1; position: relative; overflow: hidden; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); background: #020617; }
.echarts-canvas { width: 100%; height: 100%; min-height: 500px; position: relative; z-index: 5; }

/* 【新增】：图内悬浮加载更多按钮 */
.graph-floating-actions {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); z-index: 20;
}
.cyber-btn {
  background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.4); color: #00f2fe;
  padding: 10px 24px; border-radius: 30px; font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  backdrop-filter: blur(8px); box-shadow: 0 0 15px rgba(0, 242, 254, 0.2); transition: all 0.3s ease;
}
.cyber-btn:hover:not(:disabled) { background: rgba(0, 242, 254, 0.2); box-shadow: 0 0 25px rgba(0, 242, 254, 0.4); transform: translateY(-2px); }
.cyber-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.cyber-text-muted {
  color: rgba(255,255,255,0.5); font-size: 13px; letter-spacing: 1px;
  background: rgba(0,0,0,0.5); padding: 8px 20px; border-radius: 20px; backdrop-filter: blur(4px);
}

/* CSS 星空背景 */
.starry-sky { position: relative; }
.stars-layer-1, .stars-layer-2 { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.stars-layer-1 {
  background-image:
    radial-gradient(1.5px 1.5px at 20px 30px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 40px 70px, rgba(255,255,255,0.6), rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 120px 160px, rgba(255,255,255,0.9), rgba(0,0,0,0)),
    radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.5), rgba(0,0,0,0));
  background-repeat: repeat; background-size: 200px 200px;
  animation: twinkle 4s infinite linear;
}
.stars-layer-2 {
  background-image:
    radial-gradient(2px 2px at 150px 150px, rgba(0, 242, 254, 0.4), rgba(0,0,0,0)),
    radial-gradient(1.5px 1.5px at 60px 110px, rgba(248, 87, 166, 0.4), rgba(0,0,0,0));
  background-repeat: repeat; background-size: 250px 250px;
  animation: twinkle 6s infinite reverse;
}
@keyframes twinkle { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

/* 模态框渐变动画 */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* --- 移动端极限紧凑适配 --- */
@media (max-width: 768px) {
  .blur-header { padding: 10px 16px; }
  .segmented-control { flex: 1; margin: 0 8px; }
  .segment-item { padding: 4px 12px; font-size: 13px; }
  .hide-on-mobile { display: none; }
  .fancy-btn { padding: 6px 10px; }
  .search-container { max-width: 100%; margin-top: 8px; }
  .modern-search-bar { border-radius: 10px; padding: 2px 12px; }
  .type-selector { width: 85px; }

  .main-viewport { padding: 12px; }
  .user-cards-grid { grid-template-columns: 1fr; gap: 10px; }
  .compact-user-card { padding: 12px 14px; border-radius: 12px; }

  .round-avatar { width: 40px; height: 40px; }
  .user-name { font-size: 14px; }
  .user-id { font-size: 11px; }
  .action-pill { padding: 4px 12px; font-size: 11px; }

  .galaxy-modal-window { width: 100vw; height: 100vh; border-radius: 0; }
  .window-body { border-radius: 0; border: none; }
  .graph-floating-actions { bottom: 20px; }
}
/* --- 修复：强制 1:1 平分与绝对居中 --- */
.segmented-control {
  display: flex;
  background: var(--hover-background);
  border-radius: 12px;
  padding: 4px;
  position: relative;
  border: 1px solid var(--border-color);
  min-width: 220px; /* 给一个最小宽度，让里面有空间平分 */
}

.segment-item {
  flex: 1; /* 核心修复1：不管文字多长，强制两个按钮 1:1 绝对平分空间 */
  position: relative;
  z-index: 2;
  padding: 6px 0; /* 取消左右固定的 padding，释放空间 */
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center; /* 核心修复2：让文字和数字在自己的半区里绝对居中 */
  gap: 6px;
}

.segment-item.active {
  color: var(--text-primary);
}

.count-badge {
  background: rgba(0,0,0,0.06);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}
.dark-theme .count-badge { background: rgba(255,255,255,0.1); }

/* --- 修复：精准锁定滑块位置 --- */
.segment-slider {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px; /* 核心修复3：锁死初始左边界 */
  width: calc(50% - 4px); /* 严格占据 50% 的内部空间 */
  background: var(--card-background);
  border-radius: 8px;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 滑块移动 100% 的自身宽度，完美扣合右侧半区 */
.segment-slider.follow { transform: translateX(0); }
.segment-slider.fans { transform: translateX(100%); }
</style>
