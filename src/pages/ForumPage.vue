<template>
  <div id="forumPage">
    <div class="page-container" @scroll="handleScroll" ref="pcContainer">
      <div class="content-wrapper">
        <div class="mobile-header" v-if="device === DEVICE_TYPE_ENUM.MOBILE" :class="{ 'header-expanded': showCategoryDropdown }">
          <div class="mobile-nav-bar">
            <div class="tab-container">
              <van-tabs background="transparent"
                :active="activeTab"
                style="width: 100%"
                :duration="0.3"
                title-inactive-color="var(--text-secondary)"
                title-active-color="var(--text-primary)"
                color="var(--text-primary)"
                :line-width="20"
                @click-tab="({ name }) => name === 'ranking' ? goToRanking() : handleTabChange(name)"
              >
                <van-tab name="all">
                  <template #title>
                    <div class="tab-content">
                      <span>{{ $t('pages.homePage.all') }}</span>
                    </div>
                  </template>
                </van-tab>
                <van-tab name="following">
                  <template #title>
                    <div class="tab-content">
                      <span>{{ $t('pages.homePage.follow') }}</span>
                    </div>
                  </template>
                </van-tab>
                <van-tab name="ranking">
                  <template #title>
                    <div class="tab-content">
                      <span>{{ $t('pages.homePage.rank') }}</span>
                    </div>
                  </template>
                </van-tab>
              </van-tabs>
            </div>

            <div class="mobile-search" @click="handleSearchClick">
              <button class="search-button">
                <div class="search-content">
                  <i class="fas fa-search search-icon"></i>
                  <span class="search-divider">|</span>
                  <span class="search-text">{{ $t('pages.forumPage.search') }}</span>
                </div>
              </button>
            </div>
          </div>
          <div v-if="activeTab === 'all'" class="mobile-category-nav">
            <div class="mobile-category-bar-wrapper">
              <div class="mobile-category-bar" ref="mobileCategoryBar">
                <div
                  class="mobile-category-item"
                  v-for="category in categories"
                  :key="category"
                  :class="{ active: selectedCategory === category }"
                  @click="handleMobileCategoryChange(category)"
                >
                  {{ getForumCategoryI18n(category) }}
                </div>
              </div>
              <div class="category-expand-btn" @click="toggleCategoryDropdown">
                <i class="fas fa-chevron-down" :class="{ rotated: showCategoryDropdown }"></i>
              </div>
            </div>

            <transition name="fade">
              <div class="category-dropdown-overlay" v-show="showCategoryDropdown" @click="showCategoryDropdown = false"></div>
            </transition>
          </div>
          <div v-if="activeTab === 'following'" class="mobile-follow-users-container">
            <div v-if="followUsersLoading" class="follow-users-loading">
              <i class="fas fa-spinner fa-spin loading-icon-small"></i>
              <span class="loading-text">{{ $t('pages.forumPage.loadingFollows') }}</span>
            </div>
            <div v-else-if="followUsers.length === 0" class="follow-users-empty">
              <p class="empty-text">{{ $t('pages.forumPage.emptyFollows') }}</p>
            </div>
            <div v-else class="follow-users-container">
              <div class="follow-users-list">
                <div
                  v-for="user in followUsers"
                  :key="user.id"
                  class="follow-user-item-horizontal"
                  @click="$router.push(`/user/${user.id}`)"
                >
                  <img :src="user.userAvatar || getDefaultAvatar(user.userName)" :alt="user.userName" class="follow-user-avatar" />
                  <span class="follow-user-name">{{ user.userName }}</span>
                </div>
                <div class="follow-user-item-horizontal view-more-item" @click="$router.push('/follow-list')">
                  <div class="view-more-avatar">
                    <i class="fas fa-plus"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="nav-category-wrapper" v-else>
          <div class="hero-banner-section">
            <div class="banner-container">
              <img
                :src="currentSeasonBanner"
                class="hero-banner-img"
                :class="{ loaded: bannerLoaded }"
                @load="bannerLoaded = true"
              />
              <div class="banner-overlay"></div>
            </div>
            <div class="hero-content">
              <div class="glass-nav-container">
                <div class="nav-upper">
                  <div class="tab-pill-group">
                    <div
                      class="tab-pill"
                      :class="{ active: activeTab === 'all' }"
                      @click="handleTabChange('all')"
                    >
                      {{ $t('pages.forumPage.discover') }}
                    </div>
                    <div
                      class="tab-pill"
                      @click="goToRanking"
                    >
                      {{ $t('pages.forumPage.rank') }}
                    </div>
                    <div
                      class="tab-pill"
                      :class="{ active: activeTab === 'following' }"
                      @click="handleTabChange('following')"
                    >
                      {{ $t('pages.forumPage.follow') }}
                    </div>
                  </div>
                </div>

                <div class="nav-lower">
                  <!-- PC 发现页分类：推荐 + 更多 -->
                  <div v-if="activeTab === 'all'" class="pc-category-dashboard">
                    <div class="category-grid-inline">
                      <div
                        v-for="category in topCategories"
                        :key="category"
                        class="category-item-pill"
                        :class="{ active: selectedCategory === category }"
                        @click="handleCategoryChange(category)"
                      >
                        {{ getForumCategoryI18n(category) }}
                      </div>

                      <!-- 更多分类 Popover -->
                      <a-popover
                        v-if="remainingCategories.length > 0"
                        v-model:visible="moreCategoriesVisible"
                        placement="bottomRight"
                        trigger="click"
                        overlayClassName="apple-category-popover"
                      >
                        <template #content>
                          <div class="more-category-grid">
                            <div
                              v-for="category in remainingCategories"
                              :key="category"
                              class="more-category-item"
                              :class="{ active: selectedCategory === category }"
                              @click="handleCategoryChange(category); moreCategoriesVisible = false"
                            >
                              {{ getForumCategoryI18n(category) }}
                            </div>
                          </div>
                        </template>
                        <div class="category-item-pill more-trigger">
                          <AppstoreOutlined />
                          <span>{{ $t('pages.forumPage.more') }}</span>
                        </div>
                      </a-popover>
                    </div>
                  </div>

                  <div v-if="activeTab === 'following'" class="pc-follow-wrapper">
                    <div v-if="followUsersLoading" class="follow-users-loading">
                      <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div v-else-if="followUsers.length === 0" class="follow-users-empty-mini">
                      {{ $t('pages.forumPage.noFollows') }}
                    </div>
                    <div v-else class="pc-follow-list">
                      <div
                        v-for="user in followUsers"
                        :key="user.id"
                        class="pc-follow-user"
                        @click="$router.push(`/user/${user.id}`)"
                        ::title="$t('pages.forumPage.recommend')"
                      >
                        <img :src="user.userAvatar || getDefaultAvatar(user.userName)" class="mini-avatar" />
                      </div>
                      <div class="pc-follow-user add-follow" @click="$router.push('/follow-list')">
                        <i class="fas fa-plus mini-icon"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="content-main">
          <div class="posts-container">
            <div class="custom-pull-refresh"
                 :style="{ transform: `translateY(${pullDownDistance}px)`, transition: pullDownDistance ? 'none' : 'transform 0.3s' }"
                 @touchstart="handleTouchStart"
                 @touchmove="handleTouchMove"
                 @touchend="handleTouchEnd"
                 @touchcancel="handleTouchEnd">
              <div class="refresh-indicator" :class="{ 'refreshing': isRefreshing, 'pulled': pullDownDistance >= refreshThreshold }"
                   :style="{ opacity: Math.min(pullDownDistance / refreshThreshold, 1) }">
                <div class="refresh-icon">
                  <i v-if="isRefreshing" class="fas fa-spinner fa-spin refresh-icon-fa"></i>
                  <i v-else class="fas fa-arrow-down refresh-icon-fa"
                     :style="{ transform: `rotate(${Math.min(180, (pullDownDistance / refreshThreshold) * 180)}deg)` }"></i>
                </div>
                <span class="refresh-text">{{ isRefreshing ? $t('pages.forumPage.refreshing') : pullDownDistance >= refreshThreshold ? $t('pages.forumPage.releaseToRefresh') : $t('pages.forumPage.pullToRefresh') }}</span>
              </div>

              <!-- 帖子列表 - 始终显示，通过 loading 属性控制加载状?-->
              <post-list
                v-show="posts.length > 0 || loading || isInitialLoading || !hasLoadedOnce"
                class="post-list-container"
                :loading="isInitialLoading"
                :data-list="posts"
                :show-empty-state="false"
              />

              <!-- 空状?- 只在加载完成且确实没有数据时显示 -->
              <div v-if="posts.length === 0 && !loading && !isInitialLoading && hasLoadedOnce" class="empty-following">
                <div class="custom-empty-state">
                  <img :src="emptyImage" :alt="$t('pages.forumPage.noData')" class="empty-illustration" />
                  <p class="empty-desc">{{ activeTab === 'following' ? $t('pages.forumPage.noFollowPosts') : $t('pages.forumPage.noData') }}</p>
                  <p class="empty-subdesc">{{ activeTab === 'following' ? $t('pages.forumPage.goDiscover') : $t('pages.forumPage.noContent') }}</p>
                  <a-button v-if="activeTab === 'following'" type="primary" class="go-discover-btn" @click="handleTabChange('all')">{{ $t('pages.forumPage.btnGoDiscover') }}</a-button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="isLoadingMore && posts.length > 0" class="loading-more">
            <i class="fas fa-spinner fa-spin loading-icon"></i>
            <span>{{ $t('pages.forumPage.loading') }}</span>
          </div>
          <div v-if="!hasMore && posts.length > 0" class="no-more-data">
            {{ $t('pages.forumPage.noMoreData') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端分类展开弹窗 (移至最外层以解决 z-index 遮挡问题) -->
    <transition name="fade">
      <div class="category-dropdown-overlay" v-show="showCategoryDropdown" @click="showCategoryDropdown = false"></div>
    </transition>
    <transition name="slide-down">
      <div class="category-dropdown-panel" v-show="showCategoryDropdown">
        <div class="dropdown-header">
          <span class="dropdown-title">{{ $t('pages.forumPage.allCategories') }}</span>
          <div class="close-btn-wrapper" @click="showCategoryDropdown = false">
            <i class="fas fa-times"></i>
          </div>
        </div>
        <div class="dropdown-grid">
          <div
            class="dropdown-category-item"
            v-for="category in categories"
            :key="category"
            :class="{ active: selectedCategory === category }"
            @click="handleMobileCategoryChange(category)"
          >
            {{ getForumCategoryI18n(category) }}
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FORUM_CATEGORY_MAP } from '@/constants/category';

const { t, locale } = useI18n()

const getForumCategoryI18n = (category: string) => {
  return FORUM_CATEGORY_MAP[category] || category
};

import { ref, onMounted, watch, onUnmounted, onActivated, onDeactivated, computed, provide } from 'vue'

// 在论坛页启用所有广告，但受全局环境变量控制
provide('enableAds', typeof __ENABLE_ADS__ !== 'undefined' ? __ENABLE_ADS__ : true)
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { listPostByPageUsingPost, getFollowPostsUsingPost, listPostTagCategoryUsingGet, listPostVoByRecommendUsingPost } from '@/api/postController'
import { getFollowOrFanListUsingPost } from '@/api/userFollowsController'
import PostList from '@/components/PostList.vue'
import { POST_STATUS_ENUM } from '@/constants/post'
import { message } from 'ant-design-vue'
import { throttle, debounce } from 'lodash-es'
import { getDefaultAvatar } from '@/utils/userUtils'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { getDeviceType } from '@/utils/device'
import { AppstoreOutlined, DownOutlined, FireOutlined } from '@ant-design/icons-vue'

import springBanner from '@/assets/season/spring.png'
import summerBanner from '@/assets/season/summer.png'
import autumnBanner from '@/assets/season/autumn.png'
import winterBanner from '@/assets/season/winter.png'
import emptyImage from '@/assets/illustrations/empty.png'

const router = useRouter()
const loginUserStore = useLoginUserStore()

const device = ref<string>('')
const activeTab = ref('all')
const selectedCategory = ref('推荐') // will be handled dynamically or in dictionary, actually we can just use the key or map it
const categories = ref<string[]>(["推荐","最新","交流","构图","摄技","手机摄影","点评","写真","修图","光影","器材","单反","微距","布光","风光攻略","调色","滤镜","抠图","合成教程","胶片","约拍","外景","内景","季节拍摄","夜景技巧","逆光","慢门","全景","延时","证件照","古风教程","宠物","美食布光","摆拍","花卉拍摄","扫街","软件","插件","预设","后期","精修","风光调色","黑白摄影","灵感","投稿","版权","避坑","翻新","书单"])
const posts = ref<Post[]>([])
const followUsers = ref<any[]>([])

// PC 端分类数据
const topCategoriesCount = computed(() => locale.value.includes('en') ? 4 : 8)
const topCategories = computed(() => categories.value.slice(0, topCategoriesCount.value))
const remainingCategories = computed(() => categories.value.slice(topCategoriesCount.value))
const showMoreCategories = ref(false)
const moreCategoriesVisible = ref(false)

const isInitialLoading = ref(false)
const isLoadingMore = ref(false)
const loading = computed(() => isInitialLoading.value || isLoadingMore.value)
const followUsersLoading = ref(false)
const hasMore = ref(true)
const isLoadingLocked = ref(false)
const hasLoadedOnce = ref(false) // 增加标志是否已经加载过一次

const currentPage = ref(1)
const pageSize = ref(15)
const isDesktop = computed(() => device.value === DEVICE_TYPE_ENUM.PC)

const getDeviceTypeAsync = async () => await getDeviceType()

const isRefreshing = ref(false)
const pullDownDistance = ref(0)
const startY = ref(0)
const isTouching = ref(false)
const refreshThreshold = 80
const isAtTop = ref(true)
const scrollPosition = ref(0)

const showCategoryDropdown = ref(false)

const bannerImages = { spring: springBanner, summer: summerBanner, autumn: autumnBanner, winter: winterBanner }
const getCurrentSeason = () => {
  const month = new Date().getMonth()+1
  return month >=3 && month <=5 ? 'spring' : month >=6 && month <=8 ? 'summer' : month >=9 && month <=11 ? 'autumn' : 'winter'
}
const currentSeason = ref(getCurrentSeason())
const currentSeasonBanner = ref(bannerImages[currentSeason.value])
const bannerLoaded = ref(false)

const fetchCategories = async () => {
  try {
    const res = await listPostTagCategoryUsingGet()
    if (res.data?.code === 0 && res.data.data) {
      categories.value = ['推荐', '最新', ...(res.data.data.categoryList || [])]
    }
  } catch (error) {
    console.error(t('pages.forumPage.failGetCategory') + ':', error)
    message.error(t('pages.forumPage.failGetCategory'))
  }
}

const fetchDiscoveryPosts = async (reset = false) => {
  if (isLoadingLocked.value) return
  if (!reset && !hasMore.value) return // 关键：非重置模式下，没有更多数据直接返回
  isLoadingLocked.value = true

  if (reset) {
    currentPage.value = 1
    posts.value = []
    hasMore.value = true
    isInitialLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  try {
    const params = {
      current: currentPage.value,
      pageSize: pageSize.value,
      status: POST_STATUS_ENUM.PASS,
      category: (selectedCategory.value === '推荐' || selectedCategory.value === '最新' || selectedCategory.value === 'all') ? undefined : selectedCategory.value
    }

    let res;
    if (selectedCategory.value === '推荐') {
      res = await listPostVoByRecommendUsingPost(params)
    } else {
      res = await listPostByPageUsingPost({
        ...params,
        sortField: 'createTime',
        sortOrder: 'desc'
      })
    }

    if (res.data?.data?.records) {
      const newPosts = res.data.data.records
      const uniqueNewPosts = newPosts.filter((n: any) => !posts.value.some(o => o.id === n.id))
      posts.value = reset ? newPosts : [...posts.value, ...uniqueNewPosts]
      const { current, pages } = res.data.data
      hasMore.value = Number(current) < Number(pages)
    } else {
      hasMore.value = false
    }

    hasLoadedOnce.value = true // 不管失败也标记加载过
  } catch (error) {
    console.error(t('pages.forumPage.failGetPosts') + ':', error)
    message.error(t('pages.forumPage.failGetPosts'))
    hasMore.value = false
    hasLoadedOnce.value = true // 不管失败也标记加载过
  } finally {
    isInitialLoading.value = false
    isLoadingMore.value = false
    isLoadingLocked.value = false
  }
}

const fetchFollowPosts = async (reset = false) => {
  if (isLoadingLocked.value) return
  if (!reset && !hasMore.value) return // 关键：非重置模式下，没有更多数据直接返回
  isLoadingLocked.value = true

  if (reset) {
    currentPage.value = 1
    posts.value = []
    hasMore.value = true
    isInitialLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  try {
    const res = await getFollowPostsUsingPost({
      current: currentPage.value,
      pageSize: pageSize.value,
      sortField: 'createTime',
      sortOrder: 'desc'
    })

    if (res.data?.data?.records) {
      const newPosts = res.data.data.records
      const uniqueNewPosts = newPosts.filter((n: any) => !posts.value.some(o => o.id === n.id))
      posts.value = reset ? newPosts : [...posts.value, ...uniqueNewPosts]
      const { current, pages } = res.data.data
      hasMore.value = Number(current) < Number(pages)
    } else {
      hasMore.value = false
    }

    hasLoadedOnce.value = true // 不管失败也标记加载过
  } catch (error) {
    console.error(t('pages.forumPage.failGetFollowPosts') + ':', error)
    message.error(t('pages.forumPage.failGetFollowPosts'))
    hasMore.value = false
    hasLoadedOnce.value = true // 不管失败也标记加载过
  } finally {
    isInitialLoading.value = false
    isLoadingMore.value = false
    isLoadingLocked.value = false
  }
}

// 跳转到排行榜
const goToRanking = () => {
  router.push({ path: '/ranking', query: { type: 'post' } })
}

const fetchFollowUsers = async () => {
  if (followUsersLoading.value) return
  followUsersLoading.value = true

  try {
    const res = await getFollowOrFanListUsingPost({
      current: 1,
      pageSize: 20,
      searchType: 0,
      followerId: loginUserStore.loginUser?.id
    })

    if (res.data?.code === 0 && res.data.data?.records) {
      followUsers.value = res.data.data.records
    }
  } catch (error) {
    console.error('获取关注用户失败:', error)
  } finally {
    followUsersLoading.value = false
  }
}

const loadMore = async () => {
  if (loading.value || !hasMore.value) return // 双重保险

  currentPage.value++
  if (activeTab.value === 'all') {
    await fetchDiscoveryPosts(false)
  } else if (activeTab.value === 'following') {
    await fetchFollowPosts(false)
  }
}

const handleRefresh = async () => {
  if (isRefreshing.value) return

  isRefreshing.value = true
  pullDownDistance.value = refreshThreshold

  try {
    if (activeTab.value === 'all') {
      await fetchDiscoveryPosts(true)
    } else if (activeTab.value === 'following') {
      await fetchFollowPosts(true)
      await fetchFollowUsers()
    }
  } catch (error) {
    message.error(t('pages.forumPage.refreshFail'))
  } finally {
    isRefreshing.value = false
    pullDownDistance.value = 0

    setTimeout(() => {
      const headerEl = document.querySelector('.mobile-header') || document.querySelector('.nav-category-wrapper')
      if (headerEl) {
        headerEl.style.display = 'none'
        void headerEl.offsetWidth
        headerEl.style.display = ''
      }

      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('scroll'))
    }, 100)
  }
}

const handleScroll = throttle((e?: Event) => {
  let scrollTop = 0
  let scrollHeight = 0
  let clientHeight = 0

  const target = e?.target as HTMLElement | undefined
  if (target && typeof target.scrollTop === 'number' && target.nodeName !== '#document') {
    scrollTop = target.scrollTop || 0
    scrollHeight = target.scrollHeight || 0
    clientHeight = target.clientHeight || 0
  } else {
    scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0
    clientHeight = window.innerHeight || document.documentElement.clientHeight || 0
  }

  isAtTop.value = scrollTop <= 0

  if (!loading.value && hasMore.value && (scrollTop + clientHeight) >= (scrollHeight - 100)) {
    loadMore()
  }

  // 增加滚动时自动关闭分类弹窗（移动端体验优化）
  if (showCategoryDropdown.value && scrollTop > 10) {
    showCategoryDropdown.value = false;
  }

  scrollPosition.value = scrollTop
}, 200)

const handleTouchStart = (e: TouchEvent) => {
  if (isDesktop.value) return

  if (isAtTop.value) {
    startY.value = e.touches[0].clientY
    isTouching.value = true
    pullDownDistance.value = 0
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isTouching.value || isDesktop.value || isRefreshing.value) return

  const distance = e.touches[0].clientY - startY.value
  if (distance > 0) {
    pullDownDistance.value = Math.min(distance / 2, 120)
    if (e.cancelable) e.preventDefault()
  } else {
    pullDownDistance.value = 0
  }
}

const handleTouchEnd = () => {
  if (!isTouching.value || isDesktop.value) return

  isTouching.value = false
  if (pullDownDistance.value >= refreshThreshold) {
    handleRefresh()
  } else {
    pullDownDistance.value = 0
  }
}

const handleTabChange = (key: string) => {
  if (activeTab.value === key) return

  activeTab.value = key
  currentPage.value = 1
  posts.value = []
  hasMore.value = true
  hasLoadedOnce.value = false // 切换标签时重置加载标志

  window.scrollTo({ top: 0, behavior: 'auto' })
  if (key === 'following') {
    fetchFollowPosts(true)
    fetchFollowUsers()
  } else {
    fetchDiscoveryPosts(true)
  }
}

const handleCategoryChange = (category: string) => {
  if (selectedCategory.value === category) return

  selectedCategory.value = category
  hasLoadedOnce.value = false // 切换分类时重置加载标志
  fetchDiscoveryPosts(true)
  window.scrollTo({ top: 0, behavior: 'auto' })
}

const handleMobileCategoryChange = (category: string) => {
  if (selectedCategory.value === category) {
    showCategoryDropdown.value = false;
    return;
  }
  selectedCategory.value = category;
  showCategoryDropdown.value = false;
  hasLoadedOnce.value = false; // 切换分类时重置加载标志

  // 置顶逻辑
  const index = categories.value.indexOf(category);
  if (index > -1) {
    const item = categories.value.splice(index, 1)[0];
    categories.value.unshift(item);
  }

  fetchDiscoveryPosts(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleCategoryDropdown = () => {
  showCategoryDropdown.value = !showCategoryDropdown.value;
};

// 废弃 PC 弹窗逻辑
// const toggleCategoryDropdown = () => {
//   showCategoryDropdown.value = !showCategoryDropdown.value
// }

const handleSearchClick = () => {
  router.push({ path: '/search', query: { type: 'post' } })
}

const saveScrollPosition = () => {
  scrollPosition.value = window.pageYOffset || document.documentElement.scrollTop
}

const restoreScrollPosition = () => {
  window.scrollTo({ top: scrollPosition.value, behavior: 'auto' })
}

const handleResize = debounce(() => {}, 200)

onMounted(async () => {
  currentSeason.value = getCurrentSeason()
  currentSeasonBanner.value = bannerImages[currentSeason.value]

  device.value = await getDeviceType()
  await fetchCategories()

  // 根据登录状态设置默认分类
  if (loginUserStore.loginUser && loginUserStore.loginUser.id) {
    selectedCategory.value = '推荐'
} else {
    selectedCategory.value = '最新'
  }

  await fetchDiscoveryPosts(true)

  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleResize)
  const container = document.getElementById('forumPage')
  if (container) {
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  const container = document.getElementById('forumPage')
  if (container) {
    container.removeEventListener('touchstart', handleTouchStart)
    container.removeEventListener('touchmove', handleTouchMove)
    container.removeEventListener('touchend', handleTouchEnd)
  }
})

onActivated(async () => {
  device.value = await getDeviceTypeAsync()
  restoreScrollPosition()
  const container = document.getElementById('forumPage')
  if (container) {
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)
  }
  window.addEventListener('scroll', handleScroll)
})

onDeactivated(() => {
  saveScrollPosition()
  const container = document.getElementById('forumPage')
  if (container) {
    container.removeEventListener('touchstart', handleTouchStart)
    container.removeEventListener('touchmove', handleTouchMove)
    container.removeEventListener('touchend', handleTouchEnd)
  }
  window.removeEventListener('scroll', handleScroll)
})

interface Post {
  id: number; title: string; content: string; userId: number; category: string;
  createTime: string; updateTime: string; status: number; [key: string]: any
}
</script>

<style scoped>
#forumPage {
  min-height: 100vh;
  padding: 0;
  overflow-x: hidden;
  max-width: 1400px;
  margin: 0 auto;
}

.page-container {
  width: 100%;
  min-height: 100vh;
  overflow: auto;
  padding: 12px 0;
}

.content-wrapper {
  margin: 0 auto;
  width: 100%;
  padding: 0;
}

.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  color: var(--text-other);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: var(--ios-bg-blur);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.mobile-header.header-expanded {
  background: var(--background);
  box-shadow: none;
}

@media screen and (max-width: 768px) {
  .content-main {
    padding-top: 102px;
  }
}

.mobile-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
}

.tab-container {
  display: flex;
  width: 100%;
  justify-content: flex-start;
  gap: 24px;
}

.mobile-tab-item {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  padding: 0 8px;
  height: 100%;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
}

.mobile-tab-item.active {
  color: var(--text-primary);
}

.mobile-search {
  padding-top: 0;
  color: var(--text-primary);
  position: relative;
  z-index: 0;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-search-fixed {
  z-index: 4;
  position: absolute !important;
  right: 16px;
  width: 96px !important;
  height: 32px !important;
  padding: 0 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  background: transparent !important;
  transform: translateY(0) !important;
  opacity: 1 !important;
}

.search-button {
  border: none;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 16px;
  width: 100%;
  height: 32px;
  transition: all 0.3s ease;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.search-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.search-button:hover .search-icon {
  transform: rotate(-5deg) scale(1.1);
}

.search-button:hover .search-text {
  transform: translateX(2px);
}

.search-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.1);
}

.search-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  position: relative;
  z-index: 1;
}

.search-icon {
  color: #2563eb;
  font-size: 16px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.search-divider {
  color: rgba(37, 99, 235, 0.3);
  font-size: 14px;
  transform: scale(0.9);
  margin: 0 -1px;
}

.search-text {
  color: #2563eb;
  font-size: 13px;
  opacity: 0.8;
  transition: all 0.3s ease;
  font-weight: 500;
}

.mobile-category-nav {
  position: relative;
  width: 100%;
}

.mobile-category-bar-wrapper {
  padding: 8px 0 10px 0;
  background: transparent;
  width: 100%;
  display: flex;
  align-items: center;
}

.mobile-category-bar-wrapper.is-expanded .category-expand-btn {
  position: absolute;
  top: 8px;
  right: 4px;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.mobile-category-bar {
  flex: 1;
  display: flex;
  overflow-x: auto;
  padding: 0 16px;
  gap: 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* 增加遮罩渐变提示可以滚动 */
  mask-image: linear-gradient(to right, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
}

.mobile-category-bar::-webkit-scrollbar {
  display: none;
}

.mobile-category-item {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 18px;
  font-size: 14px;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  white-space: nowrap;
  border: 1px solid transparent;
}

.mobile-category-item.active {
  background: var(--text-primary);
  color: var(--background);
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(0, 102, 179, 0.25);
  transform: scale(1.05);
}

.mobile-category-item:active {
  transform: scale(0.95);
}

.category-expand-btn {
  width: 44px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ios-bg-blur);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 10;
  margin-right: 4px;
  border-radius: 8px;
  color: #888;
  box-shadow: -10px 0 15px -5px var(--background);
}

.category-expand-btn .fas {
  transition: transform 0.3s ease;
  font-size: 14px;
}

.category-expand-btn .rotated {
  transform: rotate(180deg);
}

.category-dropdown-overlay {
  position: fixed;
  top: 94px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1500;
}

.category-dropdown-panel {
  position: fixed;
  top: 94px;
  left: 0;
  right: 0;
  background: var(--background,0.85);
  border-radius: 0 0 24px 24px;
  z-index: 2000;
  padding: 16px 20px 24px 20px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.dropdown-header {
  display: none;
}

.dropdown-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.close-btn-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
  font-size: 16px;
  transition: all 0.3s;
}

.close-btn-wrapper:active {
  transform: scale(0.9);
  background: rgba(0, 0, 0, 0.1);
}

.dropdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 12px;
}

.dropdown-category-item {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: var(--ios-bg-blur);
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.3s;
  border: 1px solid transparent;
}

.dropdown-category-item.active {
  background: var(--primary-color);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}


/* 过渡动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); opacity: 0.5; }



.follow-users-loading, .follow-users-empty {
  padding: 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 12px;
}

.follow-users-container {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.follow-users-container::-webkit-scrollbar {
  display: none;
}

.follow-users-list {
  display: flex;
  gap: 12px;
}

.follow-user-item-horizontal {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--card-background, #ffffff);
  padding: 4px 12px 4px 5px;
  border-radius: 40px;
  border: 1px solid var(--border-color, #eee);
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease;
}

.follow-user-item-horizontal:active {
  transform: scale(0.95);
  background: #f9f9f9;
}

.follow-user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #fff;
}

.follow-user-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-more-item {
  padding: 4px;
  width: 40px;
  justify-content: center;
}

.view-more-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.dropdown-category-item.active {
  background: var(--text-primary);
  color: var(--background);
}

/* PC 端 Apple 风格极简菜单 */
  .nav-category-wrapper {
  padding: 0 4px;
}

.hero-banner-section {
  position: relative;
  width: 100%;
  height: 120px; /* 调整高度?120px */
  margin-bottom: 24px;
  /* 移除 overflow: hidden 以便显示外溢的光?*/
  border-radius: 20px;
  background: transparent;
  box-shadow: 0 2px 24px rgba(0, 0, 0, 0.06);
  z-index: 1;
}

/* 细线条七彩描边与光影效果 */
.hero-banner-section::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  z-index: -1;
  background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
  background-size: 200%; /* 缩减背景大小，提高颜色密?*/
  border-radius: 21px;
  opacity: 1;
  filter: blur(2px); /* 极大减小模糊度，呈现细线?*/
  animation: rainbowGlow 8s linear infinite; /* 加快一点速度，增加动?*/
}

@keyframes rainbowGlow {
  0% { background-position: 0 0; }
  100% { background-position: 200% 0; }
}

.banner-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  /* 内部容器负责剪裁图片 */
  overflow: hidden;
  border-radius: 20px;
}

.hero-banner-img {
  display: block;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1s ease, transform 1s ease-out;
}

.hero-banner-img.loaded {
  opacity: 1;
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%);
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
}

.glass-nav-container {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 28px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  max-width: 95%;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-upper {
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  padding-right: 20px;
}

.tab-pill-group {
  display: flex;
  background: rgba(0, 0, 0, 0.04);
  padding: 6px;
  border-radius: 18px;
  gap: 4px;
}

.tab-pill {
  padding: 8px 26px;
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-pill:hover {
  color: #000;
}

.tab-pill.active {
  background: #fff;
  color: #000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav-lower {
  flex: 1;
  overflow: hidden;
}

.pc-category-dashboard {
  width: 100%;
}

.category-grid-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.category-item-pill {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 12px;
  color: #444;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.02);
}

.category-item-pill:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.category-item-pill.active {
  background: #000;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.more-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-secondary);
}

.more-trigger:hover {
  background: rgba(0, 0, 0, 0.06);
}

/* Apple 风格弹出面板 */
:deep(.apple-category-popover .ant-popover-inner) {

  padding: 16px;
  border-radius: 20px !important;
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(40px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(40px) saturate(200%) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;

}

:deep(.apple-category-popover .ant-popover-arrow) {

  display: none !important;

}

.more-category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  min-width: 240px;
  max-height: 300px; /* 设置最大高?*/
  overflow-y: auto; /* 内容过多时上下滚?*/
  padding-right: 4px; /* 为滚动条留出一点空?*/
}

.more-category-item {
  padding: 10px 14px;
  border-radius: 12px;
  color: #555;
  font-size: 13px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.02);
}

.more-category-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #000;
}

.more-category-item.active {
  background: #000;
  color: #fff;
}

.pc-follow-list {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pc-follow-user {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.add-follow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.add-follow:hover {
  border-color: #000;
  color: #000;
}

/* 移动端样式兼?*/
@media screen and (max-width: 768px) {
  .page-container { padding: 0; }
  .content-main { padding-top: 102px; }
}

.posts-container {
  margin: 0 2px;
}

.post-list-container {
  min-height: calc(100vh - 300px);
}

.custom-pull-refresh {
  position: relative;
  width: 100%;
}

.refresh-indicator {
  position: absolute;
  left: 0;
  right: 0;
  top: -60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.refresh-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-icon-fa {
  font-size: 20px;
  color: #2563eb;
  transition: transform 0.2s ease;
}

.refresh-text {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.empty-following {
  padding: 100px 0;
  text-align: center;
}

.custom-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: emptyFadeIn 0.8s ease-out;

  .empty-illustration {
    width: 160px;
    height: 160px; /* 添加固定高度，保持正方形比例 */
    object-fit: contain; /* 保持图片原始比例 */
    opacity: 0.8;
    margin-bottom: 8px;
  }

  .empty-desc {
    font-size: 16px;
    color: var(--text-primary);
    margin-bottom: 4px;
    font-weight: 500;
  }

  .empty-subdesc {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }
}

.go-discover-btn {
  border-radius: 20px;
  padding: 0 24px;
}

@keyframes emptyFadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-more, .no-more-data {
  padding: 40px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 24px;
}

/* 极致隐藏滚动?*/
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

*::-webkit-scrollbar {
  display: none;
}

/* 榜单相关样式 */
.mobile-ranking-nav {
  padding: 8px 16px 8px 8px;
}

.m-ranking-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.m-ranking-tabs::-webkit-scrollbar {
  display: none;
}

.m-ranking-tab-item {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.m-ranking-tab-item.active {
  background: var(--text-primary);
  color: var(--background);
  font-weight: 500;
  box-shadow: 0 4px 8px rgba(0, 102, 179, 0.2);
}

.pc-ranking-bar-v3 {
  display: flex;
  align-items: center;
}

.ranking-wrapper-v3 {
  display: flex;
  gap: 10px;
}

.ranking-item-v3 {
  padding: 6px 16px;
  border-radius: 12px;
  color: #444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.02);
}

.ranking-item-v3:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.ranking-item-v3.active {
  background: #000;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Video Dark Mode 增强 */
@media (prefers-color-scheme: dark) { .m-ranking-tab-item {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
} }

@media (prefers-color-scheme: dark) { .m-ranking-tab-item.active {
  background: #3b82f6;
  color: #fff;
} }

@media (prefers-color-scheme: dark) { .ranking-item-v3 {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
} }

@media (prefers-color-scheme: dark) { .ranking-item-v3.active {
  background: #3b82f6;
  color: #fff;
} }

.mobile-follow-users-container {
  width: 100%;
  height: auto;
  padding: 6px 16px;
  background: transparent;
}

/* =========================================
   Video Dark Mode 增强 (Cinematic Enhancements)
   ========================================= */
@media (prefers-color-scheme: dark) { #forumPage {
  --background: #0a0a0a;
  --card-background: #141414;
  --text-primary: #f0f0f0;
  --text-secondary: #94a3b8;
  --border-color: rgba(255, 255, 255, 0.06);
  --header-background: rgba(10, 10, 10, 0.8);
  --nav-item-active-text: #3b82f6;
  --search-bg: rgba(255, 255, 255, 0.08);
  --hover-bg: rgba(255, 255, 255, 0.12);
  --active-bg: rgba(255, 255, 255, 0.16);
  background-color: var(--background);
} }

@media (prefers-color-scheme: dark) { .mobile-header {
  background: rgba(10, 10, 10, 0.8) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
} }

@media (prefers-color-scheme: dark) { .mobile-tab-item {
  color: #64748b;
} }

@media (prefers-color-scheme: dark) { .mobile-tab-item.active {
  color: #3b82f6;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
} }

@media (prefers-color-scheme: dark) { .search-button {
  background: rgba(255, 255, 255, 0.05);
} }

@media (prefers-color-scheme: dark) { .search-icon,
@media (prefers-color-scheme: dark) { .search-text { color: #3b82f6; } } }

@media (prefers-color-scheme: dark) { .hero-banner-section {
  background: #0f172a;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
} }

@media (prefers-color-scheme: dark) { .banner-overlay {
  background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(10,10,10,1) 100%);
} }

@media (prefers-color-scheme: dark) { .glass-nav-container {
  background: rgba(30, 30, 30, 0.6);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
} }

@media (prefers-color-scheme: dark) { .tab-pill-group {
  background: rgba(255, 255, 255, 0.05);
} }

@media (prefers-color-scheme: dark) { .tab-pill {
  color: #94a3b8;
} }

@media (prefers-color-scheme: dark) { .tab-pill.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
} }

@media (prefers-color-scheme: dark) { .category-item-pill {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
} }

@media (prefers-color-scheme: dark) { .category-item-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
} }

@media (prefers-color-scheme: dark) { .category-item-pill.active {
  background: #3b82f6;
  color: #fff;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
} }

@media (prefers-color-scheme: dark) { .category-dropdown-panel {
  background: #1e1e1e;
} }

@media (prefers-color-scheme: dark) { .dropdown-category-item {
  background: rgba(255, 255, 255, 0.05);
} }

@media (prefers-color-scheme: dark) { .dropdown-category-item.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #3b82f6;
} }

@media (prefers-color-scheme: dark) { .category-expand-btn {
  background: rgba(30, 30, 30, 0.8);
  box-shadow: -10px 0 15px -5px #0a0a0a;
} }

@media (prefers-color-scheme: dark) { .follow-user-item-horizontal {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.05);
} }

@media (prefers-color-scheme: dark) { .follow-user-name {
  color: #e2e8f0;
} }

@media (prefers-color-scheme: dark) { .view-more-avatar {
  background: #262626;
  color: #94a3b8;
} }

/* ---- 同步 HomePage 的移动端导航、{{ $t('pages.forumPage.search') }}、ONE分类风格样式 ---- */
.mobile-nav-bar :deep(.van-tabs__nav) { background-color: transparent !important; }
.mobile-nav-bar :deep(.van-tab) {
  background-color: transparent !important;
  flex: none;
  min-width: 72px;
  font-size: 18px;
  color: #64748b;
  position: relative;
  transition: all 0.3s ease;
}
.mobile-nav-bar :deep(.van-tabs__wrap) { padding: 0; }
.mobile-nav-bar :deep(.van-tab--active) {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 18px;
  transform: scale(1.02);
}
.tab-content { display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.3s ease; }
.tab-content span { display: flex; align-items: center; gap: 4px; font-size: 16px; }
.mobile-nav-bar :deep(.van-tabs__content) { transition: transform 0.3s cubic-bezier(0.645, 0.045, 0.355, 1); }
.mobile-nav-bar :deep(.van-tabs__track) { transition: transform 0.3s cubic-bezier(0.645, 0.045, 0.355, 1); }

/* {{ $t('pages.forumPage.search') }}框线条风?*/
.mobile-search { flex-shrink: 0; min-width: 90px; }
.search-button {
  border: 1px solid transparent !important;
  background: var(--search-bg, #f8f9fa) !important;
  border-radius: 20px !important;
  width: 100% !important;
  height: 34px !important;
  transition: all 0.3s ease;
  padding: 0 12px !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
}
.search-content { white-space: nowrap; flex-direction: row; }
.search-button:hover { background: var(--hover-bg, #f1f5f9) !important; }
.search-button:active { background: var(--active-bg, #e2e8f0) !important; }
.search-icon { color: var(--text-primary, #333) !important; font-size: 14px; opacity: 0.8; }
.search-divider { color: var(--border-color, #e2e8f0) !important; font-size: 12px; margin: 0 4px; }
.search-text { color: var(--text-primary, #333) !important; font-size: 13px; font-weight: 400; opacity: 0.8; }

/* 分类标签 ONE 线条风格 */
.mobile-category-item {
  padding: 4px 16px !important;
  font-size: 14px !important;
  color: var(--text-secondary) !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  border-radius: 20px !important;
  box-shadow: none !important;
}
.mobile-category-item.active {
  color: var(--text-primary) !important;
  font-weight: 600 !important;
  border: 1px solid var(--text-primary) !important;
  transform: scale(1.02);
}
.dropdown-category-item {
  background: transparent !important;
  border: 1px solid transparent !important;
  border-radius: 18px !important;
  color: var(--text-secondary) !important;
}
.dropdown-category-item.active {
  color: var(--text-primary) !important;
  font-weight: 600 !important;
  border: 1px solid var(--text-primary) !important;
}

/* 深色模式兼容 */
@media (prefers-color-scheme: dark) { .mobile-category-item,
@media (prefers-color-scheme: dark) { .dropdown-category-item { border-color: rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.6) !important; } } }
@media (prefers-color-scheme: dark) { .mobile-category-item.active,
@media (prefers-color-scheme: dark) { .dropdown-category-item.active { color: rgba(255, 255, 255, 0.95) !important; } } }
@media (prefers-color-scheme: dark) { .search-button { border-color: rgba(255, 255, 255, 0.2) !important; background: transparent !important; } }
@media (prefers-color-scheme: dark) { .search-icon, @media (prefers-color-scheme: dark) { .search-text { color: rgba(255, 255, 255, 0.7) !important; } } }
@media (prefers-color-scheme: dark) { .search-divider { color: rgba(255, 255, 255, 0.2) !important; } }
</style>



