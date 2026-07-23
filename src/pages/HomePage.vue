<template>
  <div id="homePage">
    <!-- 移动端搜索区域 -->
    <div
      v-if="device !== DEVICE_TYPE_ENUM.PC"
      class="mobile-search mobile-search-fixed"
      :class="{ 'mobile-search-transitioning': isSearchTransitioning, 'search-expanded': showCategoryDropdown }"
      @click="handleSearchClick"
    >
      <a-button class="search-button">
        <div class="search-content">
          <i class="fas fa-search search-icon"></i>
          <span class="search-divider">|</span>
          <span class="search-text">{{ $t('pages.homePage.search') }}</span>
        </div>
      </a-button>
    </div>

    <!-- 移动端顶部导航 -->
    <div v-if="device !== DEVICE_TYPE_ENUM.PC" class="mobile-nav" :class="{ 'nav-expanded': showCategoryDropdown }">
      <van-tabs
        v-model:active="activeTab"
        style="width: 76%; background: transparent;"
        background="transparent"
        :duration="0.3"
        title-inactive-color="var(--text-secondary)"
        title-active-color="var(--text-primary)"
        color="var(--text-primary)"
        :line-width="20"
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
        <van-tab name="ranking" @click="goToRanking">
          <template #title>
            <div class="tab-content">
              <span>{{ $t('pages.homePage.rank') }}</span>
            </div>
          </template>
        </van-tab>
      </van-tabs>
      <div class="m-filter-section" v-if="activeTab == 'all'" >
        <div class="mobile-category-nav">
          <div class="mobile-category-bar-wrapper">
            <!-- 加载状态骨架屏 -->
            <div v-if="loading && categoryList.length === 0" class="mobile-category-bar skeleton-bar">
              <div v-for="i in 6" :key="i" class="category-skeleton-item"></div>
            </div>
            <!-- 正常内容 -->
            <div v-else class="mobile-category-bar">
              <div
                class="mobile-category-item"
                v-for="category in categoryList"
                :key="category"
                :class="{ active: selectedCategory === category }"
                @click="handleMobileCategoryChange(category)"
              >
                {{ getCategoryI18n(category) }}
              </div>
            </div>
            <div class="category-expand-btn" @click="toggleCategoryDropdown">
              <i class="fas fa-chevron-down" :class="{ rotated: showCategoryDropdown }"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端顶部避空占位 (防止 Fixed 导航遮挡) -->
    <div v-if="device !== DEVICE_TYPE_ENUM.PC && (activeTab !== 'all' || (carouselActivities && carouselActivities.length === 0))"
         :style="{ height: activeTab == 'following' ? '74px' : activeTab == 'ranking' ? '92px' : 0, width: '100%' }"></div>

    <!-- 关注用户头像叠层 (移动端内置 - 移出下拉刷新以固化位置) -->
    <div v-if="device !== DEVICE_TYPE_ENUM.PC && activeTab === 'following'" class="m-follow-users-inline">
      <FollowUserList
        :users="followUsers"
        :loading="followUsersLoading"
        mode="stack"
        :maxCount="6"
        @item-click="id => $router.push({ name: 'UserDetail', params: { id } })"
        @more-click="$router.push({ name: 'FollowList' })"
      />
    </div>

    <div v-if="device !== DEVICE_TYPE_ENUM.PC && activeTab === 'all' " class="activity-carousel">
      <!-- 轮播图骨架屏 -->
      <div v-if="loading && carouselActivities.length === 0" class="carousel-skeleton"></div>
      <!-- 轮播图正常内容 -->
      <van-swipe v-else class="carousel-container" :autoplay="4000" @change="currentActivityIndex = $event" :height="200">
        <van-swipe-item v-for="activity in (carouselActivities as any[])"
                        :key="(activity as any).id"
                        class="carousel-item"
                        @click="handleActivityClick((activity as any).id)">
          <div class="carousel-item-content">
            <img :src="`${(activity as any).coverUrl}?t=${new Date().getTime()}`"
                 :alt="(activity as any).title"
                 class="carousel-image"
                 referrerpolicy="no-referrer-when-downgrade"
                 loading="lazy" />
            <div class="carousel-info">
              <h3 class="carousel-title">{{ (activity as any).title }}</h3>
              <div class="carousel-meta">
                <span class="carousel-status"
                      :class="{ 'expired': (activity as any).isExpired === 1 }">
                  {{ (activity as any).isExpired === 1 ? $t('pages.homePage.ended') : $t('pages.homePage.ongoing') }}
                </span>
                <span class="carousel-date">{{ formatTime((activity as any).expireTime) }} {{ $t('pages.homePage.deadline') }}</span>
              </div>
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>

    <div v-if="device === DEVICE_TYPE_ENUM.PC">
      <!-- PC端顶部布局：全宽轮播图 -->
      <div class="pc-top-layout-full">
        <div class="pc-carousel-section-full">
          <CustomPcCarousel
            :activities="carouselActivities"
            :autoplay="true"
            :autoplay-interval="4000"
            @activity-click="handleActivityClick"
            @image-error="handleImageError"
          />
        </div>
      </div>

      <!-- V3 新增：全宽层级化过滤中心 -->
      <div class="pc-filter-center">
        <!-- 第一层：主切客 与 刷新控制 -->
        <div class="main-tabs-toolbar-v3">
          <div class="main-tabs-row">
            <div class="main-tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">{{ $t('pages.homePage.allWorks') }}</div>
            <div class="main-tab-item" :class="{ active: activeTab === 'following' }" @click="activeTab = 'following'">{{ $t('pages.homePage.myFollow') }}</div>
            <div class="main-tab-item" @click="goToRanking">{{ $t('pages.homePage.hotRank') }}</div>
          </div>
          <!-- 优雅纯净版发光“能量藤蔓”独立组件 -->
          <GlowingVine />

          <div class="pc-refresh-control-v3">
            <a-button type="text" class="pc-refresh-btn" @click="onRefresh" :loading="loading">
              <template #icon><ReloadOutlined :class="{ 'spin-active': loading }" /></template>
              {{ $t('pages.homePage.refresh') }}
            </a-button>
          </div>
        </div>

        <!-- 第二层：次级过滤器 -->
        <div class="sub-filter-row">
          <!-- 全部状态下的分类云 -->
          <div v-if="activeTab === 'all'" class="pc-category-bar-v3" :class="{ 'is-expanded': isCategoryExpanded }">
            <div class="category-wrapper-v3">
              <div class="category-pill-v3" v-for="category in categoryList" :key="category" :class="{ active: selectedCategory === category }" @click="() => handleCategoryClick(category)">{{ getCategoryI18n(category) }}</div>

              <!-- 展开状态下，自然跟随在最后的收起按钮 -->
              <div v-if="isCategoryExpanded && categoryList.length > 15" class="category-pill-v3 collapse-btn" @click="isCategoryExpanded = false">
                {{ $t('pages.homePage.collapse') }} <i class="fas fa-chevron-up" style="margin-left: 6px;"></i>
              </div>
            </div>

            <!-- 未展开状态下，固定在最右侧的展开按钮 -->
            <div v-if="!isCategoryExpanded && categoryList.length > 15" class="category-more-toggle" @click="isCategoryExpanded = true">
              {{ $t('pages.homePage.expandAll') }} <i class="fas fa-chevron-down" style="margin-left: 6px;"></i>
            </div>
          </div>

          <!-- 关注状态下的二级过滤器：组件封装版 -->
          <div v-if="activeTab === 'following'" class="pc-following-bar-v3">
            <FollowUserList
              :users="followUsers"
              mode="stack"
              :maxCount="12"
              @item-click="id => $router.push({ name: 'UserDetail', params: { id } })"
              @more-click="$router.push({ name: 'FollowList' })"
            />
          </div>
        </div>
      </div>

      <!-- PC端瀑布流组件（复用移动端数据） -->
      <div class="pc-waterfall-section">
        <BigPictureList
          :dataList="mobileDataList"
          :loading="loading"
        />
        <!-- 加载更多提示 -->
        <div v-if="!isEndOfData && !loading && mobileDataList.length > 0" class="pc-loading-more">
          <svg class="loading-camera" viewBox="0 0 100 100">
            <path class="camera-body" d="M25,30H75a8,8,0,0,1,8,8V70a8,8,0,0,1-8,8H25a8,8,0,0,1-8-8V38A8,8,0,0,1,25,30Zm5-10H70a2,2,0,0,1,2,2v4a2,2,0,0,1-2,2H30a2,2,0,0,1-2-2V22A2,2,0,0,1,30,20Z"/>
            <circle class="camera-lens" cx="50" cy="54" r="15"/>
            <circle class="camera-flash" cx="72" cy="42" r="4"/>
          </svg>
        </div>
        <!-- 没有更多数据 -->
        <div v-if="isEndOfData && mobileDataList.length > 0" class="pc-no-more-data">
          <img src="@/assets/empty.png" style="width: 36px;" alt="logo" class="logo-image" />{{ $t('pages.homePage.noMoreData') }}
        </div>
      </div>
    </div>
    <div v-else>
      <div class="custom-pull-refresh"
           :style="[
             { transform: `translateY(${refreshDistance}px)`, transition: refreshDistance ? 'none' : 'transform 0.3s' }
           ]"
           @touchstart="handleTouchStart"
           @touchmove="handleTouchMove"
           @touchend="handleTouchEnd"
           @touchcancel="handleTouchEnd">

        <!-- 刷新指示器 -->
        <div class="refresh-indicator" :class="{ 'refreshing': isRefreshing, 'pulled': refreshDistance >= refreshThreshold }"
             :style="{ opacity: Math.min(refreshDistance / refreshThreshold, 1) }">
          <div class="refresh-icon">
            <i v-if="isRefreshing" class="fas fa-spinner fa-spin loading-icon"></i>
            <div v-else class="pull-arrow" :style="{ transform: `rotate(${Math.min(180, (refreshDistance / refreshThreshold) * 180)}deg)` }">
              ↓
            </div>
          </div>
          <span class="refresh-text">{{ isRefreshing ? $t('pages.homePage.refreshing') : refreshDistance >= refreshThreshold ? $t('pages.homePage.releaseToRefresh') : $t('pages.homePage.pullToRefresh') }}</span>
        </div>

        <div class="mobile-list-container"
             style="margin-top: 0"
             :class="{ 'container-hidden': !isContainerVisible, 'container-visible': isContainerVisible }">
          <!-- 修改关注页面空状态 -->
          <div v-if="activeTab === 'following' && mobileDataList.length === 0 && !loading" class="empty-following">
            <van-empty
              class="custom-empty"
              image="search"
              :description="$t('pages.homePage.noFollowContent')"
            >
              <template #description>
                <p class="empty-desc">{{ $t('pages.homePage.followCreatorsDesc') }}</p>
              </template>
              <template #default>
                <a-button type="primary" class="discover-btn" @click="activeTab = 'all'">
                  {{ $t('pages.homePage.goDiscover') }}
                </a-button>
              </template>
            </van-empty>
          </div>

          <BigPictureList style="margin-top: 4px;" :dataList="mobileDataList" :loading="loading" />

          <!-- 加载更多提示 -->
          <div v-if="!isEndOfData && !loading && mobileDataList.length > 0" class="pc-loading-more">
            <svg class="loading-camera" viewBox="0 0 100 100">
              <path class="camera-body" d="M25,30H75a8,8,0,0,1,8,8V70a8,8,0,0,1-8,8H25a8,8,0,0,1-8-8V38A8,8,0,0,1,25,30Zm5-10H70a2,2,0,0,1,2,2v4a2,2,0,0,1-2,2H30a2,2,0,0,1-2-2V22A2,2,0,0,1,30,20Z"/>
              <circle class="camera-lens" cx="50" cy="54" r="15"/>
              <circle class="camera-flash" cx="72" cy="42" r="4"/>
            </svg>
          </div>
          <div v-if="isEndOfData && mobileDataList.length > 0" class="no-more-data-tip"><img src="@/assets/empty.png" style="width: 36px;" alt="logo" class="logo-image" />{{ $t('pages.homePage.noMoreData') }}</div>
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
          <span class="dropdown-title">{{ $t('pages.homePage.allCategories') }}</span>
          <div class="close-btn-wrapper" @click="showCategoryDropdown = false">
            <i class="fas fa-times"></i>
          </div>
        </div>
        <div class="dropdown-grid">
          <div
            class="dropdown-category-item"
            v-for="category in categoryList"
            :key="category"
            :class="{ active: selectedCategory === category }"
            @click="handleMobileCategoryChange(category)"
          >
            {{ getCategoryI18n(category) }}
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CATEGORY_MAP } from '@/constants/category';

const { t, locale } = useI18n();

const getCategoryI18n = (category: string) => {
  return CATEGORY_MAP[category] || category
}

import { onMounted, reactive, ref, onUnmounted, onActivated, onDeactivated, watch, nextTick, computed, provide } from 'vue'
provide('enableAds', typeof __ENABLE_ADS__ !== 'undefined' ? __ENABLE_ADS__ : true)
import {
  getFollowPictureUsingPost,
  getTop100PictureUsingGet,
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
  getFeaturePictureUsingPost,
  listPictureVoByRecommendUsingPost
} from '@/api/pictureController'
import { message } from 'ant-design-vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { useRoute, useRouter } from 'vue-router'
import { SearchOutlined, PlusOutlined, UploadOutlined, CalendarOutlined, TrophyOutlined, HeartOutlined, ClockCircleOutlined, StarOutlined, FireOutlined, AppstoreOutlined, LinkOutlined, CameraOutlined, UserOutlined, HomeOutlined, HistoryOutlined, RedditOutlined, BranchesOutlined, BorderOuterOutlined, ContactsOutlined, ApartmentOutlined, SmileOutlined } from '@ant-design/icons-vue'
import { debounce } from 'lodash-es'
import BigPictureList from '@/components/BigPictureList.vue'
import { listCarouselActivitiesUsingPost } from '@/api/activityController'
import { formatTime } from '@/utils/time'
import { CommentOutlined } from '@ant-design/icons-vue'
import { getFollowOrFanListUsingPost } from '@/api/userFollowsController'
import { getDefaultAvatar } from '@/utils/userUtils.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import CustomPcCarousel from '@/components/CustomPcCarousel.vue'
import FollowUserList from '@/components/FollowUserList.vue'
import GlowingVine from '@/components/GlowingVine.vue'
import { useStructuredData } from '@/composables/useStructuredData'

// ── SEO: Organization JSON-LD ──
useStructuredData({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: '悦木图库',
  alternateName: 'yuemutuku',
  url: 'https://www.yuemutuku.com',
  logo: 'https://www.yuemutuku.com/logo.png',
  sameAs: [
    'https://github.com/WangShengQiang/yuemu-picture-frontend',
  ],
})

// 关注用户列表相关状态
const followUsers = ref<any[]>([])
const followUsersLoading = ref(false)
const router = useRouter()
const route = useRoute()
const isEndOfData = ref(false)
const loginUserStore = useLoginUserStore()
const showCategoryDropdown = ref(false)

// 各大 Tab 的状态持久化缓存 (全标签秒开核心)
const tabStates = reactive<Record<string, { list: any[], page: number, isEndOfData: boolean }>>({
  'all': { list: [], page: 1, isEndOfData: false },
  'following': { list: [], page: 1, isEndOfData: false }
})

// 设备类型
const device = ref<string>('')

// 标签和分类
const categoryList = ref<string[]>([])
const selectedCategory = ref<string>(loginUserStore.loginUser?.id ? '推荐' : '最新')
const tagList = ref<string[]>([])
const selectedTagList = ref<boolean[]>([])

// 搜索条件（统一复用）
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 36,
})

// 分页（统一复用移动端分页）
const page = ref(1)

// 统一数据列表（移动端和PC端共用）
const loading = ref(true)
const mobileDataList = ref<API.PictureVO[]>([])
// 添加加载进度状态
const loadingProgress = ref(0)
// 进度条定时器引用（核心新增）
const progressIntervalRef = ref<NodeJS.Timeout | null>(null)
// 添加容器可见性控制（替代直接操作DOM）
const isContainerVisible = ref(true)

// 统一标签（移动端和PC端共用）
const activeTab = ref('all')

// 轮播图
const carouselActivities = ref<API.Activity[]>([])
const currentActivityIndex = ref(0)
const autoplayInterval = ref(null)
const translateX = ref(0)
const containerWidth = ref(0)


// 分类展开收起逻辑
const isCategoryExpanded = ref(false)
const displayedCategoryList = computed(() => {
  if (isCategoryExpanded.value) return categoryList.value
  return categoryList.value.slice(0, 28)
})

// 搜索过渡
const isSearchTransitioning = ref(false)

// 下拉刷新（仅移动端生效，PC端忽略）
const startY = ref(0)
const currentY = ref(0)
const refreshDistance = ref(0)
const isRefreshing = ref(false)
const maxPullDistance = 100
const refreshThreshold = 80

// 滚动位置
const scrollPosition = ref(0)

// 添加滚动方向判断
const lastScrollTop = ref(0)
const isScrollingDown = ref(true)

// 初始化标志
const isInitialized = ref(false)

// 添加刷新标识（在其他 ref 声明附近）
const isRefreshingFlag = ref(false)
// 添加可见图片跟踪
const visiblePictures = ref<Set<string>>(new Set())

// 分类图标映射
const categoryIconMap = {
  '推荐': 'fas fa-th-large',
  '关注': 'fas fa-heart',
  '风光': 'fas fa-mountain',
  '人文': 'fas fa-user-friends',
  '建筑': 'fas fa-building',
  '纪实': 'fas fa-history',
  '动物': 'fas fa-paw',
  '植物': 'fas fa-leaf',
  '抽象': 'fas fa-cube',
  '人像': 'fas fa-user',
  '城市': 'fas fa-city',
  '漫画感': 'fas fa-theater-masks',
  '风景': 'fas fa-tree',
  '美食': 'fas fa-utensils',
  '时尚': 'fas fa-tshirt',
  '运动': 'fas fa-running',
  '科技': 'fas fa-microchip',
  '旅行': 'fas fa-plane',
  '艺术': 'fas fa-palette',
  '生活': 'fas fa-home',
  '创意': 'fas fa-lightbulb',
  '自然': 'fas fa-feather',
  '星空': 'fas fa-star',
  '海洋': 'fas fa-water',
  '沙漠': 'fas fa-wind'
}

// 获取分类图标CSS类名
const getCategoryIconClass = (category) => {
  // "关注"不显示图标
  if (category === '关注') {
    return ''
  }
  return categoryIconMap[category] || 'fas fa-tag'
}

// 核心新增：启动加载进度条
const startLoadingProgress = () => {
  // 先清除已有定时器，避免叠加
  if (progressIntervalRef.value) {
    clearInterval(progressIntervalRef.value)
  }
  loadingProgress.value = 0 // 重置进度
  let progress = 0

  progressIntervalRef.value = setInterval(() => {
    if (progress < 80) {
      progress += 10
      loadingProgress.value = progress
    } else {
      clearInterval(progressIntervalRef.value!)
      progressIntervalRef.value = null
    }
  }, 80)
}

// 核心新增：终止加载进度条（接口返回时调用）
const stopLoadingProgress = () => {
  if (progressIntervalRef.value) {
    clearInterval(progressIntervalRef.value)
    progressIntervalRef.value = null
  }
  loadingProgress.value = 100 // 直接置为100%，表示加载完成
}

// 获取轮播图活动数据
const fetchCarouselActivities = async () => {
  try {
    const res = await listCarouselActivitiesUsingPost({
      pageSize: 36,
      current: 1,
    })
    if (res.data?.code === 0 && res.data.data) {
      carouselActivities.value = res.data.data.records || []
    }
  } catch (error) {
    console.error('获取轮播活动失败:', error)
  }
}

// 获取标签分类选项
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    tagList.value = res.data.data.tagList ?? []
    categoryList.value = ['推荐', '最新', '精选', ...(res.data.data?.categoryList || [])]
  }
}

// 获取关注用户列表
const fetchFollowUsers = async () => {
  // 如果已有数据且不是正在刷新，则不重新加载
  if (followUsers.value.length > 0 && !isRefreshingFlag.value) return
  if (followUsersLoading.value) return
  followUsersLoading.value = true
  try {
    const res = await getFollowOrFanListUsingPost({
      current: 1,
      pageSize: 36,
      searchType: 0,
      followerId: loginUserStore.loginUser?.id
    })
    if (res.data?.code === 0 && res.data.data?.records) {
      followUsers.value = res.data.data.records
    }
  } catch (error) {
    console.error('获取关注用户列表失败:', error)
  } finally {
    followUsersLoading.value = false
  }
}

// 统一数据加载函数（移动端和PC端共用）
const fetchData = async () => {
  const isFirstPage = page.value === 1;
  if (isFirstPage) {
    loading.value = true
    startLoadingProgress() // 启动进度条
  }

  try {
    let res = null
    if (activeTab.value === 'all') {
      if (selectedCategory.value === '精选') {
        // 精选接口统一加载20张（根据后端逻辑，每页最多20张）
        res = await getFeaturePictureUsingPost({
          ...searchParams,
          pageSize: 20
        })
      } else if (selectedCategory.value === '推荐') {
        // 推荐接口统一加载20张（根据后端逻辑，每页最多20张）
        res = await listPictureVoByRecommendUsingPost({
          ...searchParams,
          pageSize: 20
        })
      } else if (selectedCategory.value === '最新') {
        // 最新接口统一加载36张
        res = await listPictureVoByPageUsingPost({
          ...searchParams,
          pageSize: 36,
          sortField: 'createTime',
          sortOrder: 'desc'
        })
      } else {
        // 普通分类接口统一加载36张
        res = await listPictureVoByPageUsingPost({
          ...searchParams,
          pageSize: 36,
          category: selectedCategory.value === 'all' ? undefined : selectedCategory.value
        })
      }
    } else if (activeTab.value === 'following') {
      // 关注接口统一加载36张
      res = await getFollowPictureUsingPost({
        ...searchParams,
        current: page.value,
        pageSize: 36
      })
    }

    // 接口返回成功，立即终止进度条
    stopLoadingProgress()

    if (res?.data.code === 0) {
      const newData = res.data.data?.records || []

      // 处理图片加载状态
      const processedData = newData.map((item) => ({
        ...item,
        loaded: false,
        imageLoaded: false,
        avatarLoaded: false
      }))

      // 分页加载：追加数据；切换标签/分类：替换数据
      // 修改这里：当下拉刷新时也替换数据而不是追加
      if (page.value > 1 && !isRefreshingFlag.value) {
        mobileDataList.value = [...mobileDataList.value, ...processedData]
      } else {
        mobileDataList.value = processedData
      }

      // 优化：使用后端返回的分页信息判断是否还有更多数据
      const { current, pages } = res.data.data
      isEndOfData.value = Number(current) >= Number(pages)
    }
  } catch (error) {
    // 接口失败也终止进度条
    stopLoadingProgress()
    console.error('数据加载失败:', error)
  }
}

// 新增触底加载专属独立锁，防止重复发起请求
const loadingMore = ref(false)

// 统一触底加载更多（移动端和PC端共用）
const handleScrollLoad = async () => {
  if (loading.value || loadingMore.value || isEndOfData.value) return

  loadingMore.value = true
  page.value += 1
  searchParams.current = page.value

  try {
    await fetchData()
  } finally {
    loadingMore.value = false
  }
}

// 绑定滚动事件（区分设备，但逻辑统一）
const bindScrollEvent = () => {
  let ticking = false;

  const updateScrollPosition = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const clientHeight = window.innerHeight || document.documentElement.clientHeight;

    isScrollingDown.value = scrollTop > lastScrollTop.value;
    lastScrollTop.value = scrollTop;

    // 滚动时自动关闭分类弹窗
    if (showCategoryDropdown.value) {
      showCategoryDropdown.value = false;
    }

    // 提前 400px 触发加载更多
    const bottomOfWindow = scrollHeight > clientHeight && (scrollHeight - scrollTop - clientHeight <= 400);
    if (bottomOfWindow && isScrollingDown.value) {
      handleScrollLoad();
    }

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollPosition);
      ticking = true;
    }
  };

  window.onscroll = onScroll;
}

// 自动播放轮播图
const startAutoplay = () => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value)
  }
  autoplayInterval.value = setInterval(() => {
    if (carouselActivities.value.length > 0) {
      const currentItem = document.querySelector(`.carousel-item:nth-child(${currentActivityIndex.value + 1})`)
      currentItem?.classList.remove('active')
      currentActivityIndex.value = (currentActivityIndex.value + 1) % carouselActivities.value.length
      translateX.value = -(currentActivityIndex.value * containerWidth.value)
      setTimeout(() => {
        const newItem = document.querySelector(`.carousel-item:nth-child(${currentActivityIndex.value + 1})`)
        newItem?.classList.add('active')
      }, 50)
    }
  }, 4000)
}

// 统一初始化函数
const initializeData = async () => {
  if (isInitialized.value) return
  isInitialized.value = true

  // 初始化时启动进度条
  startLoadingProgress()

  // 1. 并行获取公共基础数据
  const baseDataPromise = Promise.all([
    fetchCarouselActivities(),
    getTagCategoryOptions()
  ])

  // 2. 并行加载首屏数据
  const screenDataPromise = fetchData()

  // 3. 如果是关注标签，加载关注用户列表
  const followUsersPromise = activeTab.value === 'following' ? fetchFollowUsers() : Promise.resolve()

  try {
    // 并行执行所有初始化请求
    await Promise.all([baseDataPromise, screenDataPromise, followUsersPromise])
    // 初始化完成终止进度条
    stopLoadingProgress()
  } catch (error) {
    // 初始化失败也终止进度条
    stopLoadingProgress()
    console.error('初始化失败:', error)
    message.error(t('pages.homePage.errInit'))
  } finally {
    loading.value = false
  }
}

// 生命周期钩子
onMounted(async () => {

  // 必须先获取设备类型
  device.value = await getDeviceType()

  // 执行统一初始化
  await initializeData()

  // 启动轮播
  if (carouselActivities.value.length > 0) {
    startAutoplay()
  }

  // 为第一个轮播项添加active类
  setTimeout(() => {
    document.querySelector('.carousel-item:first-child')?.classList.add('active')
  }, 50)

  // 绑定滚动加载事件（移动端和PC端都绑定，逻辑统一）
  bindScrollEvent()

  // 时间更新定时器
  const timer = setInterval(updateTime, 1000)
  onUnmounted(() => clearInterval(timer))

  // 添加 Intersection Observer 来实现图片懒加载
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pictureId = entry.target.getAttribute('data-pic-id');
          if (pictureId) {
            visiblePictures.value.add(pictureId);
          }
        }
      });
    }, {
      rootMargin: '200px' // 提前200px加载图片
    });

    // 观察所有图片元素
    const observeImages = () => {
      document.querySelectorAll('[data-pic-id]').forEach(el => {
        observer.observe(el);
      });
    };

    // 初始观察
    observeImages();

    // 在数据更新后重新观察
    watch(mobileDataList, () => {
      nextTick(() => {
        observeImages();
      });
    });
  }
})

onActivated(() => {
  // 强制恢复容器可见性，防止缓存导致的透明问题
  isContainerVisible.value = true

  if (device.value !== DEVICE_TYPE_ENUM.PC) {
    nextTick(() => {
      window.scrollTo({ top: scrollPosition.value, behavior: 'instant' })
    })
  }
  // 延迟 500ms 重新绑定滚动事件，确保页面 DOM 渲染展开以及滚动位置完全恢复稳定后，再响应触底事件
  setTimeout(() => {
    bindScrollEvent()
  }, 500)
})

onDeactivated(() => {
  scrollPosition.value = window.pageYOffset || document.documentElement.scrollTop
  // 解绑滚动事件
  window.onscroll = null
})

onUnmounted(() => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value)
  }
  window.onscroll = null
  // 清除进度条定时器，防止内存泄漏
  if (progressIntervalRef.value) {
    clearInterval(progressIntervalRef.value)
  }
})

// 监听activeTab变化（统一处理标签切换）
watch(activeTab, async (newTab, oldTab) => {
  // 如果点击榜单tab，跳转到榜单页面并恢复之前的tab
  if (newTab === 'ranking') {
    // 恢复到之前的tab，防止切换
    activeTab.value = oldTab || 'all'
    // 跳转到榜单页面
    router.push({ name: 'Ranking', query: { type: 'picture' } })
    return
  }

  // 如果是下拉刷新触发的变更，直接返回避免重复加载
  if (isRefreshingFlag.value) return

  // 1. 保存当前状态到旧 Tab 缓存
  if (oldTab && tabStates[oldTab]) {
    tabStates[oldTab].list = [...mobileDataList.value]
    tabStates[oldTab].page = page.value
    tabStates[oldTab].isEndOfData = isEndOfData.value
  }

  // 2. 尝试从缓存恢复新状态
  if (tabStates[newTab] && tabStates[newTab].list.length > 0) {
    mobileDataList.value = tabStates[newTab].list
    page.value = tabStates[newTab].page
    searchParams.current = tabStates[newTab].page
    isEndOfData.value = tabStates[newTab].isEndOfData
    // 如果是关注标签，静默确保作者列表已加载
    if (newTab === 'following') {
      fetchFollowUsers()
    }
    return // 直接从快照恢复，不发起网络加载
  }

  // 3. 第一次进入该 Tab，执行初始化加载
  page.value = 1
  searchParams.current = 1
  isEndOfData.value = false
  mobileDataList.value = []

  loading.value = true
  startLoadingProgress()

  // 使用响应式变量控制可见性，避免直接操作DOM
  if (device.value !== DEVICE_TYPE_ENUM.PC) {
    isContainerVisible.value = false
  }

  try {
    await fetchData();
    if (newTab === 'following') {
      fetchFollowUsers()
    }

    // 使用 nextTick 确保 DOM 更新后再显示
    if (device.value !== DEVICE_TYPE_ENUM.PC) {
      await nextTick()
      setTimeout(() => {
        isContainerVisible.value = true
      }, 50)
    }
  } catch (error) {
    stopLoadingProgress()
    console.error('切换标签失败:', error)
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 300);
  }
})

// 修改 selectedCategory 监听器
// 监听分类变化（统一处理）
watch(selectedCategory, async (newCategory) => {
  // 如果是下拉刷新触发的变更，直接返回避免重复加载
  if (isRefreshingFlag.value) return

  // 重置分页
  page.value = 1
  searchParams.current = 1
  isEndOfData.value = false
  // 清空数据列表，确保显示加载状态
  mobileDataList.value = []

  // 立即显示loading状态和启动进度条
  loading.value = true
  startLoadingProgress()

  try {
    await fetchData()
  } catch (error) {
    // 兜底终止进度条
    stopLoadingProgress()
    console.error('切换分类失败:', error)
  } finally {
    // 延迟关闭loading状态，确保用户能看到完成状态
    setTimeout(() => {
      loading.value = false;
    }, 300);
  }
})

// 其他监听器
watch(
  () => route.query.refresh,
  async (newVal) => {
    if (newVal === 'true') {
      page.value = 1
      searchParams.current = 1
      isEndOfData.value = false
      mobileDataList.value = []

      // 启动进度条
      startLoadingProgress()
      try {
        await fetchData()
      } finally {
        // 终止进度条
        stopLoadingProgress()
      }
    }
  },
)

watch(currentActivityIndex, (newIndex) => {
  if (containerWidth.value === 0) {
    containerWidth.value = document.querySelector('.carousel-container')?.clientWidth || 0
  }
  translateX.value = -(newIndex * containerWidth.value)
})

watch(() => route.path, () => {
  isSearchTransitioning.value = false
})

// 事件处理函数（统一逻辑）
const handleCategoryClick = (category: string) => {
  if (selectedCategory.value === category) return
  selectedCategory.value = category
  window.scrollTo({ top: 0, behavior: 'auto' })
}

const handleMobileCategoryChange = (category: string) => {
  if (selectedCategory.value === category) {
    showCategoryDropdown.value = false;
    return;
  }
  selectedCategory.value = category;
  showCategoryDropdown.value = false;

  // 置顶逻辑：将选中的分类移到数组首位
  const index = categoryList.value.indexOf(category);
  if (index > -1) {
    const item = categoryList.value.splice(index, 1)[0];
    categoryList.value.unshift(item);
  }

  // 触发业务逻辑加载 (通过 API 或 Watcher 触发，此处只需改状态)
  page.value = 1;
  searchParams.current = 1;
  // 平滑滚动回顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleCategoryDropdown = () => {
  showCategoryDropdown.value = !showCategoryDropdown.value;
};

const handleSearchClick = () => {
  isSearchTransitioning.value = true
  const searchBar = document.querySelector('.search-bar') as HTMLElement
  const searchWrapper = document.querySelector('.search-wrapper') as HTMLElement

  if (searchBar && searchWrapper) {
    searchBar.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    searchBar.style.transform = 'scale(0.9) translateY(-20px)'
    searchBar.style.opacity = '0.8'
    searchWrapper.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    searchWrapper.style.transform = 'scaleY(0.8)'
    searchWrapper.style.opacity = '0.6'
  }

  setTimeout(() => {
    if (searchBar && searchWrapper) {
      searchBar.style.transform = 'scale(0.8) translateY(-40px)'
      searchBar.style.opacity = '0'
      searchWrapper.style.transform = 'scaleY(0)'
      searchWrapper.style.opacity = '0'
    }
    router.push({ name: 'Search' })
  }, 300)
}

// 跳转到榜单页面
const goToRanking = () => {
  router.push({ name: 'Ranking', query: { type: 'picture' } })
}

const handleActivityClick = (id: string) => {
  router.push({ name: 'ActivityDetail', params: { id } })
}

const handleImageError = (e) => {
  e.target.src = 'https://static.yuemutuku.com/public/1910505702887313409/2025-04-13_zK4t9VyYPvzKfLOk.webp'
}


// 统一刷新函数
// 下拉刷新处理函数
const onRefresh = async () => {
  // 设置刷新标识
  isRefreshingFlag.value = true
  loading.value = true;
  // 启动进度条
  startLoadingProgress()

  try {
    // 重置搜索参数
    searchParams.searchText = '';
    searchParams.current = 1;
    searchParams.pageSize = 36;
    page.value = 1;

    // 刷新逻辑交由 fetchData 接管第一页的 loading 状态
    await fetchData();
  } catch (error) {
    // 终止进度条
    stopLoadingProgress()
    console.error('刷新数据出错:', error);
    message.error(t('pages.homePage.errRefresh'));
  } finally {
    loading.value = false;
    // 重置刷新标识
    isRefreshingFlag.value = false;
  }
}

// 下拉刷新相关（仅移动端生效）
const handleTouchStart = (e: TouchEvent) => {
  if (device.value === DEVICE_TYPE_ENUM.PC) return
  startY.value = e.touches[0].clientY
  currentY.value = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  if (device.value === DEVICE_TYPE_ENUM.PC || isRefreshing.value) return
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop > 0) return
  currentY.value = e.touches[0].clientY
  const distance = currentY.value - startY.value
  if (distance > 0) {
    e.preventDefault()
    refreshDistance.value = Math.min(distance * 0.5, maxPullDistance)
  }
}

const handleTouchEnd = async () => {
  if (device.value === DEVICE_TYPE_ENUM.PC) return
  if (refreshDistance.value >= refreshThreshold && !isRefreshing.value) {
    isRefreshing.value = true
    await onRefresh()
    isRefreshing.value = false
  }
  refreshDistance.value = 0
}

// 时间更新
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 时间显示
const currentTime = ref(new Date().toLocaleTimeString())
</script>

<style scoped>
#homePage {
  color: var(--text-primary);
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 4px;
}

@media screen and (min-width: 768px) {
  #homePage {
    margin: auto;
    margin-top: -16px;
    padding: 0 16px; /* 侧边增加边距，防止第一列光效被遮挡 */
  }
}

:deep(.ant-input-search) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.ant-input-search .ant-input) {
  margin: auto;
  height: 28px;
  font-size: 14px;
  padding: 0 12px;
}

:deep(.ant-input-search .ant-input-group-addon:last-child) {
  inset-inline-start: 0;
  padding: 0;
  border: 0;
}

:deep(.ant-input-search .ant-btn) {
  height: 36px;
  font-size: 14px;
  background: #2563eb;
  border-color: #2563eb;
  box-shadow: none;
}

:deep(.ant-input-search .ant-btn:hover) {
  background: #3b82f6;
  border-color: #3b82f6;
}

.search-icon {
  color: #2563eb;
  font-size: 16px;
}


.m-filter-section{
  padding-left: 6px;
  padding-top: 1px;
  padding-right: 6px;
  color: var(--text-primary);
  background: var(--post-background);
}

.pc-empty .empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.pc-empty .empty-desc {
  font-size: 14px;
  opacity: 0.8;
}

.pc-loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  margin-bottom: 32px;
}

.pc-no-more-data {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  color: #8b9eb0;
  font-size: 14px;
  gap: 8px;
}

/* 分类标签样式 */
.category-tabs {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 8px;
  padding: 8px 0;
  padding-top: 12px;
  -webkit-overflow-scrolling: touch;
  /* 美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(37, 99, 235, 0.3) transparent;
}

/* 美化WebKit浏览器的滚动条 */
.category-tabs::-webkit-scrollbar {
  height: 3px;
}

.category-tabs::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.category-tabs::-webkit-scrollbar-thumb {
  background: rgba(37, 99, 235, 0.3);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.category-tabs::-webkit-scrollbar-thumb:hover {
  background: rgba(37, 99, 235, 0.5);
}

.category-tab-item {
  padding: 4px 12px;
  font-size: 12px;
  color: #64748b;
  transition: all 0.3s ease;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto; /* 确保项目不会缩小 */
  white-space: nowrap; /* 防止文字换行 */
}

.category-tab-item.active {
  background: rgba(37, 99, 235, 0.1);
  border-radius: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.category-tab-item i {
  font-size: 10px;
}

:deep(.category-tabs .ant-tabs-nav) {
  margin: 0 0 8px 0;
}

:deep(.category-tabs .ant-tabs-tab) {
  padding: 4px 12px;
  margin: 0 4px;
  font-size: 12px;
  color: #64748b;
  transition: all 0.3s ease;
  border-radius: 12px;
  /* 移除所有边框 */
  border: none !important;
  /* 去除默认边框相关样式 */
  border-width: 0 !important;
}

/* 额外：清除tabs默认的底部边框（如果需要） */
:deep(.category-tabs .ant-tabs-nav::before) {
  border-bottom: none !important;
}

:deep(.category-tabs .ant-tabs-tab-active) {
  background: rgba(37, 99, 235, 0.1);
  border-radius: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

:deep(.category-tabs .ant-tabs-tab-btn) {
  color: inherit;
}

:deep(.category-tabs .ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: var(--text-primary);
}

:deep(.category-tabs .ant-tabs-ink-bar) {
  display: none;
}


:deep(.ant-tag-checkable-checked) {
  background: rgba(37, 99, 235, 0.1);
  color: var(--text-primary);
}

/* 移动端搜索框样式 */
.mobile-search {
  padding-top: 0;
  background: var(--header-background);
  color: var(--text-primary);
  margin-top: -12px;
  margin-right: -40px;
  position: relative;
  z-index: 0;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-search .search-bar {
  width: 100%;
}

.mobile-search :deep(.ant-btn-icon-only){
  width: 78px;
}

/* 固定状态的搜索框样式 */
.mobile-search-fixed {
  z-index: 4;
  position: fixed !important;
  top: 10px !important;
  right: 48px !important;
  height: 64px !important;
  padding: 0 4px !important;
  padding-right: 12px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  background: transparent !important;
  transform: translateY(0) !important;
  opacity: 1 !important;
}
.mobile-search-fixed :deep(.ant-btn-icon-only){
  width: 28px;
}
/* 搜索框过渡动画 */
.mobile-search {
  transform: translateX(0) scale(1);
  opacity: 1;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mobile-search.mobile-search-fixed {
  transform: translateX(calc(50vw - 50%)) scale(0.9);
}


/* 搜索框样式 */
.mobile-search :deep(.ant-input-search) {
  border: none !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 32px !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 2px 4px rgba(37, 99, 235, 0.05) !important;
  backdrop-filter: blur(8px) !important;
  border: 1px solid rgba(37, 99, 235, 0.1) !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  width: 100% !important;

  /* 移除输入框聚焦时的蓝色边框 */
  .ant-input-wrapper {
    .ant-input:focus {
      box-shadow: none !important;
      outline: none !important;
    }

    .ant-input-group-addon {
      border: none !important;
      background: transparent !important;
    }
  }
}

/* 固定状态时的搜索框样式 */
.mobile-search-fixed :deep(.ant-input-search) {
  transform: scale(1) !important;
  height: 32px;
  line-height: 32px;
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(37, 99, 235, 0.08) !important;
  border: 1px solid rgba(37, 99, 235, 0.15) !important;
  /* 修改搜索图标颜色 */
  .anticon-search {
    color: #fff !important;
    font-size: 20px !important;
    opacity: 0.9 !important;
  }
}

.mobile-search :deep(.ant-input) {
  height: 32px !important;
  font-size: 13px !important;
  padding: 0 12px !important;
  background: transparent !important;
  border: none !important;
  text-align: center !important;
  color: #1a1a1a !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

/* 添加动画效果 */
.mobile-search :deep(.ant-input-search) {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.mobile-search :deep(.ant-input-search:active) {
  transform: scale(0.95) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  box-shadow:
    0 2px 8px rgba(37, 99, 235, 0.12),
    0 1px 4px rgba(0, 0, 0, 0.04) !important;
}

/* 占位符样式 */
.mobile-search :deep(.ant-input::placeholder) {
  color: #94a3b8 !important;
  font-size: 13px !important;
}

@keyframes spinner-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 修改无更多数据提示样式 */
.no-more-data-tip {
  margin: auto;
  text-align: center;
  padding: 16px;
  color: #c4947e;
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 64px;
}


/* 移除静态间距，改为动态注入或占位符控制 */
.mobile-list-container {
  /* margin-top: 90px; */
}
/* PC 端过滤中心二级导航增强 */
.main-tabs-toolbar-v3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 4px 0;
}
.pc-refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  background: #f8fafc;
  border-radius: 10px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}
.pc-refresh-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
  border-color: #cbd5e1;
}
.spin-active {
  animation: reload-spin 0.8s linear infinite;
}
@keyframes reload-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
/* 移动端作者列表行内容器 */
.m-follow-users-inline {
  padding: 0;
  border-radius: 12px;
  margin: -8px 12px 8px;
  margin-bottom: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
}

/* 移动端顶部导航样式 */
.mobile-nav {
  position: fixed !important;
  top: 10px !important;
  left: 0 !important;
  width: 100%;
  height: 64px !important;
  padding-top: 16px;
  transform: translateY(0) !important;
  opacity: 1 !important;
  margin: -16px 0;
  padding-bottom: 10px;
  background: var(--background);
  color: var(--text-primary);
  z-index: 2;
}

.mobile-nav.nav-expanded {
  z-index: 2000 !important;
}

.mobile-search-fixed.search-expanded {
  z-index: 2001 !important;
}

.mobile-nav :deep(.van-tabs__nav) {
  background-color: transparent !important;
}

.mobile-nav :deep(.van-tab) {
  background-color: transparent !important;
}

.mobile-nav :deep(.van-tabs__wrap) {
  padding: 0 16px;
}

.mobile-nav :deep(.van-tab) {
  flex: none;
  min-width: 72px;
  font-size: 18px;
  color: #64748b;
  position: relative;
  transition: all 0.3s ease;
}

.mobile-nav :deep(.van-tab--active) {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 18px;
  transform: scale(1.02);
}

.tab-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.tab-content span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
}

/* 优化滑动切换动画 */
.mobile-nav :deep(.van-tabs__content) {
  transition: transform 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.mobile-nav :deep(.van-tabs__track) {
  transition: transform 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.empty-following {
  padding: 40px 20px;
  text-align: center;
}

.custom-empty {
  padding: 32px 0;
}

.empty-desc {
  margin: 8px 0 16px;
  color: #94a3b8;
  font-size: 14px;
}

.discover-btn {
  width: 120px;
  height: 36px;
  border-radius: 18px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  border: none;
  background: var(--header-background);
  color: var(--text-primary);
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  transition: all 0.3s ease;
}

.discover-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.discover-btn:active {
  transform: translateY(1px);
}



/* 移动端搜索框过渡动画 */
.mobile-search {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-search-transitioning {
  transform: scale(1.1) translateY(-10px);
  opacity: 0;
}

:deep(.ant-input-search) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: scale(0.98);
  }
}

/* 移动端搜索框样式优化 */
.mobile-search {
  &:active {
    transform: scale(0.95);
  }

  :deep(.ant-input-search) {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: scale(0.95);
      background: var(--header-background);
      color: var(--text-primary);
      box-shadow:
        0 2px 8px rgba(37, 99, 235, 0.12),
        0 1px 4px rgba(0, 0, 0, 0.04) !important;
    }
  }
}

/* 搜索按钮样式 (线条风格) */
.search-button {
  border: 1px solid #e8e8e8;
  background: transparent;
  border-radius: 20px;
  width: 100%;
  height: 34px;
  transition: all 0.3s ease;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
    .search-icon {
      transform: rotate(-5deg) scale(1.1);
    }
    .search-text {
      transform: translateX(2px);
    }
  }

  &:active {
    background: rgba(0, 0, 0, 0.05);
  }
}

.search-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.search-icon {
  color: var(--text-primary);
  font-size: 14px;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.search-divider {
  color: #e8e8e8;
  font-size: 12px;
  transform: scale(0.9);
  margin: 0 4px;
}

.search-text {
  color: var(--text-primary);
  font-size: 13px;
  opacity: 0.8;
  transition: all 0.3s ease;
  font-weight: 400;
}

/* 深色模式兼容：搜索框线条 */
@media (prefers-color-scheme: dark) { .search-button {
  border-color: rgba(255, 255, 255, 0.2);
} }
@media (prefers-color-scheme: dark) { .search-divider {
  color: rgba(255, 255, 255, 0.2);
} }


/* 移动端活动轮播图样式 */
.activity-carousel {
  margin-top: 104px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.carousel-container {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.carousel-item {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
}

.carousel-item-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 16px 24px 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  color: white;
}

.carousel-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.carousel-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.carousel-status {
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 11px;
}

.carousel-status.expired {
  border-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.6);
}

.carousel-date {
  opacity: 0.9;
}

:deep(.van-swipe__indicators) {
  left: auto;
  right: 16px;
  transform: none;
  bottom: 16px;
}

:deep(.van-swipe__indicator) {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  opacity: 1;
  transition: all 0.3s;
}

:deep(.van-swipe__indicator--active) {
  width: 14px;
  border-radius: 3px;
  background: white;
  transform: none;
}

/* PC端全宽顶部布局 (V4) */
.pc-top-layout-full {
  max-width: 1400px;
  margin: 0 auto;
  margin-top: 20px;
  margin-bottom: 30px;
  /* 增加一个极其微妙的背景深度，使轮播图“嵌”进去 */
  padding: 10px 0;
  background: radial-gradient(circle at top, rgba(37, 99, 235, 0.03) 0%, transparent 70%);
  border-radius: 24px;
}

.pc-carousel-section-full {
  width: 100%;
  border-radius: 32px;
  overflow: hidden;
  /* 极致立体感系列：分层软阴影 */
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.05),
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 20px 60px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  background: var(--card-background);
}

.pc-carousel-section-full:hover {
  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.08),
    0 20px 50px rgba(0, 0, 0, 0.12),
    0 30px 100px rgba(0, 0, 0, 0.1);
}

.pc-carousel-section-full :deep(.modern-carousel),
.pc-carousel-section-full :deep(.carousel-swipe),
.pc-carousel-section-full :deep(.carousel-slide),
.pc-carousel-section-full :deep(.slide-card),
.pc-carousel-section-full :deep(img) {
  height: 100%;
  border-radius: 0 !important; /* 移除内层圆角，统一由外层裁剪，消除白边 */
}

/* 全宽层级过滤中心 V3 */
.pc-filter-center {
  max-width: 1400px;
  margin: 0 auto;
}

/* 顶部标签和控制按钮包裹层，移交底部描边和布局权给外部控制层 */
.main-tabs-toolbar-v3 {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 24px;
}

.main-tabs-row {
  display: flex;
  gap: 32px;
}

.pc-refresh-control-v3 {
  flex-shrink: 0;
}

.pc-refresh-btn {
  color: var(--text-secondary);
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  padding: 6px 16px;
  background: var(--hover-background);
}

.pc-refresh-btn:hover {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  transform: translateY(-1px);
}

.spin-active {
  animation: a-spin 1s linear infinite;
}



.main-tab-item {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  padding: 8px 0;
  transition: var(--theme-transition);
}

.main-tab-item:hover {
  color: var(--text-primary);
}

.main-tab-item.active {
  color: var(--text-primary);
}

.main-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--text-primary);
  border-radius: 2px;
}

.sub-filter-row {
  min-height: 60px; /* 保持基本高度，防止切换时抖动 */
}

/* 分类云 V3 */
.pc-category-bar-v3 {
  animation: fadeIn 0.3s ease;
  position: relative;
  padding-right: 100px;
  max-height: 38px;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding-right 0.3s ease;
}

.pc-category-bar-v3.is-expanded {
  max-height: 600px;
  padding-right: 0; /* 展开时取消右侧预留空白，让内容铺满全宽 */
  padding-bottom: 24px; /* 展开时增加底部间距，防止内容贴近瀑布流 */
}

.category-wrapper-v3 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-pill-v3 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 16px;
  background: var(--hover-background);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--theme-transition);
  font-weight: 600;
  border: 1px solid var(--border-color);
  box-sizing: border-box;
  flex-shrink: 0;
}

.category-pill-v3:hover {
  background: var(--border-color);
  transform: translateY(-2px);
}

.category-pill-v3.active {
  background: var(--text-primary);
  color: var(--background);
  border-color: var(--text-primary);
}

.category-pill-v3.collapse-btn {
  background: transparent;
  border: 1px dashed var(--border-color);
  color: var(--text-secondary);
}

.category-pill-v3.collapse-btn:hover {
  background: var(--hover-background);
  color: var(--text-primary);
  border-color: var(--text-primary);
}

.category-more-toggle {
  position: absolute;
  right: 0;
  top: 0;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  background: var(--background);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  z-index: 10;
  transition: color 0.2s;
}
.category-more-toggle:hover {
  color: var(--link-color);
}
.category-more-toggle::before {
  content: '';
  position: absolute;
  left: -40px;
  top: 0;
  width: 40px;
  height: 38px;
  background: linear-gradient(to right, transparent, var(--background));
  pointer-events: none;
}

/* 关注提示 V3 */
.following-tip-v3 {
  font-size: 14px;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 12px;
  display: inline-block;
  animation: fadeIn 0.3s ease;
}

/* 关注状态下的二级过滤器基础容器 */
.pc-following-bar-v3 {
  animation: fadeIn 0.3s ease;
  padding: 10px 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 确保最后一个元素没有底部边距 */
.scrollable-content > *:last-child {
  margin-bottom: 0;
}

/* 自定义滚动条样式 */
.scrollable-content::-webkit-scrollbar {
  width: 4px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: rgba(37, 99, 235, 0.1);
  border-radius: 2px;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: rgba(37, 99, 235, 0.3);
  border-radius: 2px;
  transition: background 0.3s ease;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
  background: rgba(37, 99, 235, 0.5);
}

/* 移动端专用动画及样式由下方继续保留 */

/* 作者列表相关样式已移除，统一由 FollowUserList 组件控制 */



/* 悬浮图标辅助样式保留 */

.floating-icon:nth-child(1) {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.floating-icon:nth-child(2) {
  top: 60%;
  right: 15%;
  animation-delay: -2s;
}

.floating-icon:nth-child(3) {
  bottom: 20%;
  left: 20%;
  animation-delay: -4s;
}


@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

.nav-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(241, 245, 249, 0.7);
  border-radius: 14px;
  position: relative;
  margin-bottom: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);
  height: 48px;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.nav-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #64748b;
  cursor: pointer;
  border-radius: 11px;
  transition:
    color 0.3s ease,
    background 0.3s ease,
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;
  position: relative;
  z-index: 1;
  font-weight: 600;
  letter-spacing: 0.3px;
  user-select: none;

  span {
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 2;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &:hover {
    color: #2563eb;
    background: rgba(255, 255, 255, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  }

  &.active {
    color: #fff;
    background: linear-gradient(135deg, #60a5fa, #2563eb);
    box-shadow:
      0 4px 16px rgba(37, 99, 235, 0.35),
      inset 0 1px 0 rgba(255,255,255,0.3);
    transform: translateY(-2px) scale(1.04);
  }

  &:active {
    transform: scale(0.93);
  }
}
/* 移动端适配 */
@media screen and (max-width: 768px) {
  /* 移除作者列表相关覆盖样式 */
}

.category-section {
  padding: 8px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(241, 245, 249, 0.8);
  position: relative;
  z-index: 1;
  overflow-y: hidden;  /* 强制禁用垂直滚动条 */
  overflow-x: hidden;  /* 防止内容溢出 */
}

.category-list {
  display: flex;
  flex-wrap: wrap;  /* 允许换行 */
  gap: 10px;
  position: relative;
  z-index: 2;
}

.category-item {
  padding: 8px 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition:
    color 0.3s ease,
    background 0.3s ease,
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  border: 1px solid rgba(226, 232, 240, 0.7);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  white-space: nowrap;
  flex-shrink: 0;
  /* stagger 动画 */
  animation: categoryFadeIn 0.4s ease both;

  &:hover {
    color: #2563eb;
    background: #fff;
    border-color: rgba(37, 99, 235, 0.5);
    transform: translateY(-3px) scale(1.04);
    box-shadow:
      0 8px 20px rgba(37, 99, 235, 0.15),
      0 2px 6px rgba(37, 99, 235, 0.08);
  }

  &.active {
    color: #fff;
    background: linear-gradient(135deg, #60a5fa, #2563eb);
    border-color: transparent;
    box-shadow:
      0 6px 20px rgba(37, 99, 235, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transform: translateY(-2px) scale(1.06);
  }

  &:active {
    transform: scale(0.93);
  }
}

/* 每个 category-item 按顺序延迟进场 */
.category-item:nth-child(1)  { animation-delay: 0.0s; }
.category-item:nth-child(2)  { animation-delay: 0.04s; }
.category-item:nth-child(3)  { animation-delay: 0.08s; }
.category-item:nth-child(4)  { animation-delay: 0.12s; }
.category-item:nth-child(5)  { animation-delay: 0.16s; }
.category-item:nth-child(6)  { animation-delay: 0.20s; }
.category-item:nth-child(7)  { animation-delay: 0.24s; }
.category-item:nth-child(8)  { animation-delay: 0.28s; }
.category-item:nth-child(n+9){ animation-delay: 0.32s; }
@keyframes categoryFadeIn {
  from { opacity: 0; transform: translateY(6px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}

/* PC端分类列表样式优化 */
.category-section {
  width: 100%;
  overflow: hidden;

  .category-list {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    overflow-x: auto;
    padding-top: 12px;
    padding-bottom: 4px;
    margin: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    white-space: nowrap;
    gap: 8px;
  }

  /* 谷歌/Edge 滚动条美化 */
  .category-list::-webkit-scrollbar {
    height: 2px;
  }

  .category-list::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }

  .category-list::-webkit-scrollbar-thumb {
    background: rgba(37, 99, 235, 0.3);
    border-radius: 3px;
    transition: background 0.3s ease;
  }

  .category-list::-webkit-scrollbar-thumb:hover {
    background: rgba(37, 99, 235, 0.5);
  }

  /* 火狐滚动条兼容 */
  .category-list {
    scrollbar-width: thin;
    scrollbar-color: rgba(37, 99, 235, 0.3) transparent;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 添加动态文字效果 */
.quote-text.playful span {
  display: inline-block;
  animation: float 1s ease-in-out infinite;
  animation-play-state: paused;
  transition: color 0.3s ease;
}

.quote-text-wrapper:hover .playful span {
  animation-play-state: running;
}

.quote-text.playful span:hover {
  color: #2563eb;
  transform: translateY(-5px) rotate(10deg) scale(1.1);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes typing {
  from { width: 0 }
  to { width: 100% }
}

@keyframes blink-caret {
  from, to { border-color: transparent }
  50% { border-color: #2563eb }
}
.nav-item span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 优化标签切换动画 */
.mobile-nav :deep(.van-tabs__content) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-nav :deep(.van-tabs__track) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 添加内容切换动画 */
.mobile-list-container {
  margin-top: 94px;
  transform: translateY(0);
  opacity: 1;
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 强制硬件加速，防止iOS Safari内存层丢弃 */
  will-change: opacity, transform;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* 容器隐藏状态 */
.mobile-list-container.container-hidden {
  opacity: 0;
  transform: translateY(20px);
}

/* 容器可见状态 */
.mobile-list-container.container-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 优化移动端导航栏动画 */
.mobile-nav :deep(.van-tab) {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-nav :deep(.van-tab--active) {
  transform: scale(1.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-nav :deep(.van-tabs__line) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 优化分类标签切换动画 */
.m-filter-section :deep(.ant-tabs-ink-bar) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.m-filter-section :deep(.ant-tabs-tab) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.m-filter-section :deep(.ant-tabs-tab-active) {
  transform: scale(1.05);
  color: #000 !important;
}

@keyframes spinner-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spinner-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 加载动画关键帧 */
@keyframes slide {
  0%, 100% { bottom: -35px }
  25%, 75% { bottom: -2px }
  20%, 80% { bottom: 2px }
}

@keyframes rotate {
  0% { transform: rotate(-15deg) }
  25%, 75% { transform: rotate(0deg) }
  100% { transform: rotate(25deg) }
}

/* 极速淡入动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 标题淡入动画 */
@keyframes titleFade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 加载器显示动画 */
@keyframes loaderShow {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}


.follow-users-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  flex-direction: column;
  gap: 8px;
}

.loading-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.follow-users-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  text-align: center;
}

.empty-text {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.loading-camera {
  width: 40px;
  height: 40px;
  animation: camera-bounce 1s ease-in-out infinite;
}

.camera-body {
  fill: none;
  stroke: #2563eb;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: camera-draw 3s ease-in-out infinite;
}

.camera-lens {
  fill: none;
  stroke: #2563eb;
  stroke-width: 4;
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: camera-draw 3s ease-in-out infinite 0.5s;
}

.camera-flash {
  fill: #2563eb;
  opacity: 0;
  animation: flash-blink 3s ease-in-out infinite;
}

@keyframes camera-draw {
  0% {
    stroke-dashoffset: 200;
  }
  30% {
    stroke-dashoffset: 0;
  }
  80% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -200;
  }
}

@keyframes flash-blink {
  0%, 20% {
    opacity: 0;
  }
  25%, 35% {
    opacity: 1;
  }
  40%, 100% {
    opacity: 0;
  }
}

@keyframes camera-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.custom-pull-refresh {
  position: relative;
  width: 100%;
  will-change: transform;
  touch-action: pan-y;
}

.refresh-indicator {
  position: absolute;
  left: 0;
  right: 0;
  top: -50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;

  .refresh-icon {
    margin-right: 8px;
  }

  .pull-arrow {
    transition: transform 0.3s;
  }

}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mobile-list-container {
  min-height: 100vh;
}

/* 移动端高性能分类导航组件样式 */
.mobile-category-nav {
  position: relative;
  background: var(--background);
  z-index: 100;
  margin-bottom: 8px;
}

.mobile-category-bar-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  height: 48px; /* 增加高度确保容错 */
  padding-right: 48px;
  overflow: hidden;
}

.mobile-category-bar {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0 12px;
  gap: 12px;
  flex: 1;
  scrollbar-width: none; /* 隐藏滚动条 */
  mask-image: linear-gradient(to right, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
}

.mobile-category-bar::-webkit-scrollbar {
  display: none;
}

.mobile-category-item {
  padding: 4px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 20px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.mobile-category-item.active {
  background: transparent;
  color: var(--text-primary);
  font-weight: 600;
  border: 1px solid var(--text-primary);
  transform: scale(1.02);
  box-shadow: none;
}

.category-expand-btn {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background);
  z-index: 10;
  color: var(--text-secondary);
  font-size: 14px;
  /* 强力左侧渐变，模拟切断效果 */
  box-shadow: -15px 0 20px -8px var(--background);
}

.category-expand-btn i {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.category-expand-btn i.rotated {
  transform: rotate(180deg);
}

/* 宫格下拉弹窗沉浸式样式 */
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
  letter-spacing: 0.5px;
}

.close-btn-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: 14px;
}

.dropdown-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
  padding-bottom: 10px;
}

.dropdown-category-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  font-size: 13px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 18px;
  color: var(--text-secondary);
  transition: all 0.2s;
  text-align: center;
  padding: 0 4px;
}

.dropdown-category-item.active {
  background: transparent;
  color: var(--text-primary);
  font-weight: 600;
  border: 1px solid var(--text-primary);
  box-shadow: none;
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); opacity: 0.5; }


/* 骨架屏动画 */
@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.skeleton-loading-base {
  background: linear-gradient(
    90deg,
    rgba(190, 190, 190, 0.2) 25%,
    rgba(129, 129, 129, 0.24) 37%,
    rgba(190, 190, 190, 0.2) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

/* 轮播图骨架屏 */
.carousel-skeleton {
  width: 100% ;
  height: 200px;
  border-radius: 12px;
  margin: 0 auto;
  display: block;
  background: linear-gradient(
    90deg,
    rgba(190, 190, 190, 0.2) 25%,
    rgba(129, 129, 129, 0.24) 37%,
    rgba(190, 190, 190, 0.2) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

/* 移动端分类骨架屏 */
.skeleton-bar {
  display: flex !important;
  gap: 12px;
  padding: 4px 16px;
  overflow: hidden;
  background: transparent;
}

.category-skeleton-item {
  width: 60px;
  height: 30px;
  border-radius: 15px;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(190, 190, 190, 0.2) 25%,
    rgba(129, 129, 129, 0.24) 37%,
    rgba(190, 190, 190, 0.2) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

/* 暗色模式兼容 */
@media (prefers-color-scheme: dark) { .mobile-category-item,
@media (prefers-color-scheme: dark) { .dropdown-category-item { background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6); } } }

@media (prefers-color-scheme: dark) { .mobile-category-item.active,
@media (prefers-color-scheme: dark) { .dropdown-category-item.active { background: transparent;
  border-color:  var(--background);
  color: rgba(255, 255, 255, 0.95); } } }

@media (prefers-color-scheme: dark) { .category-expand-btn {
  background: rgba(30, 30, 30, 0.85);
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.2);
} }

@media (prefers-color-scheme: dark) { .category-dropdown-panel {
  background: #1e1e1e;
} }

@media (prefers-color-scheme: dark) { .close-btn-wrapper {
  background: rgba(255, 255, 255, 0.1);
} }
</style>



