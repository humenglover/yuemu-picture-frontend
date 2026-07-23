<template>
  <div class="yuemu-admin-layout-wrapper">
    <div class="yuemu-admin-layout-container">

      <div class="yuemu-mobile-header">
        <span class="yuemu-logo-text">{{ t('pages.admin.adminManagePage.titleAdminManage') }}</span>
        <a-button @click="toggleMobileMenu" type="text" size="small" class="yuemu-mobile-toggle-btn">
          <template #icon>
            <MenuUnfoldOutlined v-if="!isMobileMenuOpen" />
            <MenuFoldOutlined v-else />
          </template>
        </a-button>
      </div>

      <transition name="yuemu-fade">
        <div
          class="yuemu-mobile-mask"
          v-if="isMobileMenuOpen"
          @click="toggleMobileMenu"
        ></div>
      </transition>

      <div
        class="yuemu-admin-sider"
        :class="{
          'is-collapsed': isCollapsed && !isMobile,
          'is-mobile-active': isMobileMenuOpen,
          'sider-on-right': adminSiderSide === 'right' && !isMobile,
          'sider-on-left': adminSiderSide === 'left' && !isMobile
        }"
      >
        <div class="yuemu-sider-header">
          <h2 class="yuemu-sider-title" v-show="!isCollapsed || isMobileMenuOpen">
            <span class="yuemu-logo-dot"></span>{{ t('pages.admin.adminManagePage.titleAdminManage') }}</h2>
          <a-button
            @click="toggleCollapsed"
            type="text"
            class="yuemu-collapse-btn"
            v-show="!isMobile"
          >
            <template #icon>
              <MenuFoldOutlined v-if="!isCollapsed" />
              <MenuUnfoldOutlined v-else />
            </template>
          </a-button>
        </div>

        <a-menu
          mode="inline"
          v-model:selectedKeys="selectedKey"
          class="yuemu-admin-menu"
          :inline-collapsed="isCollapsed && !isMobileMenuOpen"
          :style="{ fontSize: isMobile ? '13px' : '14px' }"
        >
          <a-menu-item key="dashboard" @click="handleMenuClick('dashboard')" class="yuemu-menu-item-compact">
            <template #icon><DashboardOutlined /></template>
            <span v-show="!isCollapsed || isMobileMenuOpen">{{ t('pages.admin.adminManagePage.menuDashboard') }}</span>
          </a-menu-item>

          <a-menu-item key="knowledgeGraph" @click="handleMenuClick('knowledgeGraph')" class="yuemu-menu-item-compact">
            <template #icon><AppstoreOutlined /></template>
            <span v-show="!isCollapsed || isMobileMenuOpen">{{ t('pages.admin.adminManagePage.menuKnowledgeGraph') }}</span>
          </a-menu-item>

          <a-sub-menu key="user" class="yuemu-submenu-compact" v-if="hasSubMenu('user')">
            <template #icon><UserOutlined /></template>
            <template #title>{{ t('pages.admin.adminManagePage.menuUser') }}</template>
            <a-menu-item key="userManage" @click="handleMenuClick('userManage')" class="yuemu-menu-item-compact">
              <template #icon><UserOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuUserManage') }}</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="content" class="yuemu-submenu-compact" v-if="hasSubMenu('content')">
            <template #icon><FileTextOutlined /></template>
            <template #title>{{ t('pages.admin.adminManagePage.menuContent') }}</template>
            <a-menu-item key="pictureManage" @click="handleMenuClick('pictureManage')" class="yuemu-menu-item-compact">
              <template #icon><PictureOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuPictureManage') }}</a-menu-item>
            <a-menu-item key="postManage" @click="handleMenuClick('postManage')" class="yuemu-menu-item-compact">
              <template #icon><FileTextOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuPostManage') }}</a-menu-item>
            <a-menu-item key="audioManage" @click="handleMenuClick('audioManage')" class="yuemu-menu-item-compact">
              <template #icon><SoundOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuAudioManage') }}</a-menu-item>
            <a-menu-item key="commentManage" @click="handleMenuClick('commentManage')" class="yuemu-menu-item-compact">
              <template #icon><CommentOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuCommentManage') }}</a-menu-item>
            <a-menu-item key="messageManage" @click="handleMenuClick('messageManage')" class="yuemu-menu-item-compact">
              <template #icon><MessageOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuMessageManage') }}</a-menu-item>
            <a-menu-item key="knowledgeFileManage" @click="handleMenuClick('knowledgeFileManage')" class="yuemu-menu-item-compact">
              <template #icon><FileTextOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuKnowledgeFileManage') }}</a-menu-item>
            <a-menu-item key="reportManage" @click="handleMenuClick('reportManage')" class="yuemu-menu-item-compact">
              <template #icon><ExclamationCircleOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuReportManage') }}</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="space" class="yuemu-submenu-compact" v-if="hasSubMenu('space')">
            <template #icon><AppstoreOutlined /></template>
            <template #title>{{ t('pages.admin.adminManagePage.menuSpace') }}</template>
            <a-menu-item key="spaceManage" @click="handleMenuClick('spaceManage')" class="yuemu-menu-item-compact">
              <template #icon><AppstoreOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuSpaceManage') }}</a-menu-item>
            <a-menu-item key="loveBoardManage" @click="handleMenuClick('loveBoardManage')" class="yuemu-menu-item-compact">
              <template #icon><HeartOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuLoveBoardManage') }}</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="system" class="yuemu-submenu-compact" v-if="hasSubMenu('system')">
            <template #icon><SettingOutlined /></template>
            <template #title>{{ t('pages.admin.adminManagePage.menuSystem') }}</template>
            <a-menu-item key="tagManage" @click="handleMenuClick('tagManage')" class="yuemu-menu-item-compact">
              <template #icon><TagsOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuTagManage') }}</a-menu-item>
            <a-menu-item key="categoryManage" @click="handleMenuClick('categoryManage')" class="yuemu-menu-item-compact">
              <template #icon><FolderOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuCategoryManage') }}</a-menu-item>
            <a-menu-item key="appManage" @click="handleMenuClick('appManage')" class="yuemu-menu-item-compact">
              <template #icon><AppstoreOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuAppManage') }}</a-menu-item>
            <a-menu-item key="activityManage" @click="handleMenuClick('activityManage')" class="yuemu-menu-item-compact">
              <template #icon><CalendarOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuActivityManage') }}</a-menu-item>
            <a-menu-item key="friendLinkManage" @click="handleMenuClick('friendLinkManage')" class="yuemu-menu-item-compact">
              <template #icon><LinkOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuFriendLinkManage') }}</a-menu-item>
            <a-menu-item key="systemNotifyManage" @click="handleMenuClick('systemNotifyManage')" class="yuemu-menu-item-compact">
              <template #icon><BellOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuSystemNotifyManage') }}</a-menu-item>
            <a-menu-item key="redisMonitor" @click="handleMenuClick('redisMonitor')" class="yuemu-menu-item-compact">
              <template #icon><DatabaseOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuRedisMonitor') }}</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="interaction" class="yuemu-submenu-compact" v-if="hasSubMenu('interaction')">
            <template #icon><MessageOutlined /></template>
            <template #title>{{ t('pages.admin.adminManagePage.menuInteraction') }}</template>
            <a-menu-item key="chatManage" @click="handleMenuClick('chatManage')" class="yuemu-menu-item-compact">
              <template #icon><MessageOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuChatManage') }}</a-menu-item>
            <a-menu-item key="sessionManage" @click="handleMenuClick('sessionManage')" class="yuemu-menu-item-compact">
              <template #icon><MessageOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuSessionManage') }}</a-menu-item>
            <a-menu-item key="likeManage" @click="handleMenuClick('likeManage')" class="yuemu-menu-item-compact">
              <template #icon><LikeOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuLikeManage') }}</a-menu-item>
            <a-menu-item key="shareManage" @click="handleMenuClick('shareManage')" class="yuemu-menu-item-compact">
              <template #icon><ShareAltOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuShareManage') }}</a-menu-item>
          </a-sub-menu>

          <a-sub-menu key="ai" class="yuemu-submenu-compact" v-if="hasSubMenu('ai')">
            <template #icon><RobotOutlined /></template>
            <template #title>{{ t('pages.admin.adminManagePage.menuAi') }}</template>
            <a-menu-item key="aiChatManage" @click="handleMenuClick('aiChatManage')" class="yuemu-menu-item-compact">
              <template #icon><RobotOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuAiChatManage') }}</a-menu-item>
            <a-menu-item key="vectorSync" @click="showVectorSyncModal = true" class="yuemu-menu-item-compact">
              <template #icon><DatabaseOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuVectorSync') }}</a-menu-item>
            <a-menu-item key="deepseek" @click="handleAIManageClick" class="yuemu-menu-item-compact">
              <template #icon><RobotOutlined /></template>
              {{ t('pages.admin.adminManagePage.menuDeepSeek') }}</a-menu-item>
          </a-sub-menu>

          <a-menu-item key="blog" @click="handleBlogManageClick" class="yuemu-menu-item-compact">
            <template #icon><BookOutlined /></template>
            <span v-show="!isCollapsed || isMobileMenuOpen">{{ t('pages.admin.adminManagePage.menuBlog') }}</span>
          </a-menu-item>
        </a-menu>
      </div>

      <div class="yuemu-admin-content">
        <div class="yuemu-content-header yuemu-fade-in">
          <div class="yuemu-title-wrap">
            <div class="yuemu-title-decorator"></div>
            <h1 class="yuemu-content-title">{{ pageTitle }}</h1>
          </div>
          <a-button type="primary" @click="refreshData" class="yuemu-refresh-btn">
            <template #icon><ReloadOutlined /></template>
            <span v-show="!isMobile">{{ t('pages.admin.adminManagePage.btnRefreshData') }}</span>
            <span v-show="isMobile">{{ t('pages.admin.adminManagePage.btnRefresh') }}</span>
          </a-button>
        </div>

        <div class="yuemu-stats-container" v-if="selectedKey[0] === 'dashboard'">
          <div class="yuemu-stats-grid">
            <div
              class="yuemu-stats-card yuemu-fade-in-up"
              v-for="(item, index) in statsList"
              :key="index"
              :style="{ 'animation-delay': `${index * 0.03}s` }"
              :class="{ 'is-clickable': item.route }"
              @click="handleStatsCardClick(item.route)"
            >
              <div class="yuemu-card-head">
                <div class="yuemu-card-title">
                  <component :is="item.icon" class="yuemu-card-icon" />
                  {{ item.title }}
                </div>
              </div>
              <div class="yuemu-card-body">
                <span class="yuemu-stats-number">{{ dashboardStats[item.key] || '0' }}</span>
                <span v-if="item.route" class="yuemu-card-link-icon"><ArrowRightOutlined /></span>
              </div>
            </div>
          </div>

          <div class="yuemu-charts-container yuemu-fade-in-up" style="animation-delay: 0.2s">
            <div class="yuemu-chart-row">
              <div class="yuemu-chart-item">
                <div class="yuemu-chart-title">{{ t('pages.admin.adminManagePage.chartUserRadar') }}</div>
                <div id="radarChart" class="yuemu-chart yuemu-compact-chart"></div>
              </div>
              <div class="yuemu-chart-item">
                <div class="yuemu-chart-title">{{ t('pages.admin.adminManagePage.chartPicCategoryPie') }}</div>
                <div id="pieChart" class="yuemu-chart yuemu-compact-chart"></div>
              </div>
              <div class="yuemu-chart-item">
                <div class="yuemu-chart-title">{{ t('pages.admin.adminManagePage.chartPostStackedBar') }}</div>
                <div id="stackedBarChart" class="yuemu-chart yuemu-compact-chart"></div>
              </div>
            </div>
            <div class="yuemu-chart-row">
              <div class="yuemu-chart-item is-full-width">
                <div class="yuemu-chart-title">{{ t('pages.admin.adminManagePage.chartSpaceTrendArea') }}</div>
                <div id="areaChart" class="yuemu-chart yuemu-compact-chart yuemu-chart-large"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="yuemu-knowledge-graph-container yuemu-fade-in-up" v-else-if="selectedKey[0] === 'knowledgeGraph'">
          <div class="yuemu-knowledge-graph-content">
            <KnowledgeGraph />
          </div>
        </div>

        <div class="yuemu-page-placeholder yuemu-fade-in-up" v-else>
          <div class="yuemu-placeholder-content">
            <component :is="menuComponentMap[selectedKey[0]] || 'div'">
              <div class="yuemu-placeholder-icon"><SettingOutlined spin /></div>
              <h2>{{ t('pages.admin.adminManagePage.msgPageUnderDev', { pageTitle }) }}</h2>
              <p>{{ t('pages.admin.adminManagePage.msgSwitchMenu') }}</p>
            </component>
          </div>
        </div>
      </div>
    </div>

    <!-- 全量图库向量化同步弹窗 -->
    <VectorSyncModal v-model:visible="showVectorSyncModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useLayoutStore } from '@/stores/useLayoutStore'
import {
  TeamOutlined, PictureOutlined, EyeOutlined, AppstoreOutlined, FileTextOutlined, LinkOutlined,
  UserOutlined, TagsOutlined, FolderOutlined, CalendarOutlined, CommentOutlined, SoundOutlined,
  RobotOutlined, MessageOutlined, HeartOutlined, LikeOutlined, ShareAltOutlined, DatabaseOutlined,
  BellOutlined, DashboardOutlined, SettingOutlined, BookOutlined, ReloadOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, ExclamationCircleOutlined, ArrowRightOutlined
} from '@ant-design/icons-vue'
import { getDashboardStatsUsingGet, getChartStatsUsingGet } from '@/api/dashboardController'
import * as echarts from 'echarts'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import VectorSyncModal from '@/components/VectorSyncModal.vue'

const router = useRouter()
const { t } = useI18n()
const layoutStore = useLayoutStore()

const showVectorSyncModal = ref(false)

const isCollapsed = ref(false)
const isMobileMenuOpen = ref(false)
const isMobile = ref(false)
const selectedKey = ref(['dashboard'])
const dashboardStats = ref<API.DashboardVO>({
  newUsers: 0, newPictures: 0, newPosts: 0, newSpaces: 0, newActivities: 0,
  newLoveBoards: 0, newFriendLinks: 0, newMessages: 0, totalViews: 0,
  newAudioFiles: 0, newReports: 0, newChatMessages: 0
})

const adminSiderSide = computed(() => layoutStore.siderSide === 'left' ? 'right' : 'left')

const chartData = ref<API.ChartVO>({
  radarChartData: null, pieChartData: null, stackedBarChartData: null
} as API.ChartVO)

const statsList = computed(() => [
  { title: isMobile.value ? t('pages.admin.adminManagePage.statUser') : t('pages.admin.adminManagePage.statNewUser'), key: 'newUsers', icon: TeamOutlined, route: 'AdminUserManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statPic') : t('pages.admin.adminManagePage.statNewPic'), key: 'newPictures', icon: PictureOutlined, route: 'AdminPictureManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statView') : t('pages.admin.adminManagePage.statNewView'), key: 'totalViews', icon: EyeOutlined, route: '' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statSpace') : t('pages.admin.adminManagePage.statNewSpace'), key: 'newSpaces', icon: AppstoreOutlined, route: 'AdminSpaceManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statPost') : t('pages.admin.adminManagePage.statNewPost'), key: 'newPosts', icon: FileTextOutlined, route: 'AdminPostManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statFriendLink') : t('pages.admin.adminManagePage.statNewFriendLink'), key: 'newFriendLinks', icon: LinkOutlined, route: '/admin/friendLinkManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statLoveBoard') : t('pages.admin.adminManagePage.statNewLoveBoard'), key: 'newLoveBoards', icon: HeartOutlined, route: '/admin/loveBoardManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statMessage') : t('pages.admin.adminManagePage.statNewMessage'), key: 'newMessages', icon: MessageOutlined, route: '/admin/messageManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statActivity') : t('pages.admin.adminManagePage.statNewActivity'), key: 'newActivities', icon: CalendarOutlined, route: 'AdminActivityManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statAudio') : t('pages.admin.adminManagePage.statNewAudio'), key: 'newAudioFiles', icon: SoundOutlined, route: '/admin/audioManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statReport') : t('pages.admin.adminManagePage.statNewReport'), key: 'newReports', icon: ExclamationCircleOutlined, route: 'AdminReportManage' },
  { title: isMobile.value ? t('pages.admin.adminManagePage.statSession') : t('pages.admin.adminManagePage.statNewSession'), key: 'newChatMessages', icon: MessageOutlined, route: '/admin/sessionManage' }
])

const menuTitleMap = computed(() => ({
  dashboard: t('pages.admin.adminManagePage.menuDashboard'), userManage: t('pages.admin.adminManagePage.menuUserManage'), pictureManage: t('pages.admin.adminManagePage.menuPictureManage'), postManage: t('pages.admin.adminManagePage.menuPostManage'),
  audioManage: t('pages.admin.adminManagePage.menuAudioManage'), commentManage: t('pages.admin.adminManagePage.menuCommentManage'), messageManage: t('pages.admin.adminManagePage.menuMessageManage'), spaceManage: t('pages.admin.adminManagePage.menuSpaceManage'),
  loveBoardManage: t('pages.admin.adminManagePage.menuLoveBoardManage'), tagManage: t('pages.admin.adminManagePage.menuTagManage'), categoryManage: t('pages.admin.adminManagePage.menuCategoryManage'), appManage: t('pages.admin.adminManagePage.menuAppManage'),
  activityManage: t('pages.admin.adminManagePage.menuActivityManage'), friendLinkManage: t('pages.admin.adminManagePage.menuFriendLinkManage'), systemNotifyManage: t('pages.admin.adminManagePage.menuSystemNotifyManage'), redisMonitor: t('pages.admin.adminManagePage.menuRedisMonitor'),
  chatManage: t('pages.admin.adminManagePage.menuChatManage'), sessionManage: t('pages.admin.adminManagePage.menuSessionManage'), likeManage: t('pages.admin.adminManagePage.menuLikeManage'), shareManage: t('pages.admin.adminManagePage.menuShareManage'),
  aiChatManage: t('pages.admin.adminManagePage.menuAiChatManage'), deepseek: t('pages.admin.adminManagePage.menuDeepSeek'), blog: t('pages.admin.adminManagePage.menuBlog'), reportManage: t('pages.admin.adminManagePage.menuReportManage')
}))

const menuComponentMap = computed(() => ({
  userManage: 'UserManage', pictureManage: 'PictureManage', postManage: 'PostManage',
  sessionManage: 'SessionManage', reportManage: 'ReportManage'
}))

const pageTitle = computed(() => menuTitleMap.value[selectedKey.value[0]] || t('pages.admin.adminManagePage.menuDashboard'))

const hasSubMenu = (key: string) => {
  const subMenuMap = { user: true, content: true, space: true, system: true, interaction: true, ai: true }
  return subMenuMap[key as keyof typeof subMenuMap]
}

const toggleCollapsed = () => { isCollapsed.value = !isCollapsed.value }

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : 'auto'
}

const handleMenuClick = (route: string) => {
  selectedKey.value = [route]
  if (isMobile.value) {
    isMobileMenuOpen.value = false
    document.body.style.overflow = 'auto'
  }
  if (!['dashboard', 'deepseek', 'blog', 'knowledgeGraph'].includes(route)) {
    const name = 'Admin' + route.charAt(0).toUpperCase() + route.slice(1)
    router.push({ name })
  }
}

const handleStatsCardClick = (route: string) => {
  if (!route) return
  if (isMobile.value) {
    isMobileMenuOpen.value = false
    document.body.style.overflow = 'auto'
  }
  if (route.startsWith('/')) {
    router.push(route)
  } else {
    router.push({ name: route })
  }
  const routeKey = route.startsWith('/') ? route.replace('/admin/', '') : route.replace('Admin', '').replace(/^[A-Z]/, c => c.toLowerCase())
  if (menuTitleMap.value[routeKey]) {
    selectedKey.value = [routeKey]
  }
}

const handleAIManageClick = () => {
  selectedKey.value = ['deepseek']
  window?.open('https://platform.deepseek.com/top_up', '_blank')
}

const handleBlogManageClick = () => {
  selectedKey.value = ['blog']
  window?.open('http://yuemustory.fun/wp-admin', '_blank')
}

const refreshData = () => { fetchDashboardStats(); fetchChartStats(); }

const fetchDashboardStats = async () => {
  try {
    const response = await getDashboardStatsUsingGet()
    if (response.data) dashboardStats.value = response.data.data
  } catch (error) {}
}

const fetchChartStats = async () => {
  try {
    const response = await getChartStatsUsingGet()
    if (response.data) {
      chartData.value = response.data.data
      await nextTick()
      renderCharts()
    }
  } catch (error) {}
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    isCollapsed.value = true
    isMobileMenuOpen.value = false
  } else {
    isMobileMenuOpen.value = false
    document.body.style.overflow = 'auto'
  }
  statsList.value[0].title = isMobile.value ? t('pages.admin.adminManagePage.statUser') : t('pages.admin.adminManagePage.statNewUser')
  statsList.value[1].title = isMobile.value ? t('pages.admin.adminManagePage.statPic') : t('pages.admin.adminManagePage.statNewPic')
  statsList.value[2].title = isMobile.value ? t('pages.admin.adminManagePage.statView') : t('pages.admin.adminManagePage.statNewView')
  statsList.value[3].title = isMobile.value ? t('pages.admin.adminManagePage.statSpace') : t('pages.admin.adminManagePage.statNewSpace')
  statsList.value[4].title = isMobile.value ? t('pages.admin.adminManagePage.statPost') : t('pages.admin.adminManagePage.statNewPost')
  statsList.value[5].title = isMobile.value ? t('pages.admin.adminManagePage.statFriendLink') : t('pages.admin.adminManagePage.statNewFriendLink')
  statsList.value[6].title = isMobile.value ? '恋爱空间' : '今日新增恋爱空间'
  statsList.value[7].title = isMobile.value ? t('pages.admin.adminManagePage.statMessage') : t('pages.admin.adminManagePage.statNewMessage')
  statsList.value[8].title = isMobile.value ? t('pages.admin.adminManagePage.statActivity') : t('pages.admin.adminManagePage.statNewActivity')
  statsList.value[9].title = isMobile.value ? t('pages.admin.adminManagePage.statAudio') : t('pages.admin.adminManagePage.statNewAudio')
  statsList.value[10].title = isMobile.value ? t('pages.admin.adminManagePage.statReport') : t('pages.admin.adminManagePage.statNewReport')
  statsList.value[11].title = isMobile.value ? t('pages.admin.adminManagePage.statSession') : t('pages.admin.adminManagePage.statNewSession')
  renderCharts()
}

const renderCharts = () => {
  renderRadarChart()
  renderPieChart()
  renderStackedBarChart()
  renderAreaChart()
}

const renderRadarChart = () => {
  if (!chartData.value.radarChartData) return
  const chartDom = document.getElementById('radarChart')
  if (!chartDom) return
  const oldChart = echarts.getInstanceByDom(chartDom)
  if (oldChart) oldChart.dispose()

  const myChart = echarts.init(chartDom)
  const option = {
    backgroundColor: 'transparent',
    tooltip: {},
    radar: {
      indicator: chartData.value.radarChartData.indicator?.map(item => ({ name: item })) || [],
      axisName: { color: 'var(--text-secondary)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'var(--border-color)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'var(--border-color)' } }
    },
    series: [{
      name: t('pages.admin.adminManagePage.chartUserStats'), type: 'radar',
      data: chartData.value.radarChartData.data || [],
      itemStyle: { color: '#2563eb', borderColor: '#2563eb' },
      areaStyle: { opacity: 0.2 }
    }]
  }
  myChart.setOption(option)
}

const renderPieChart = () => {
  if (!chartData.value.pieChartData) return
  const chartDom = document.getElementById('pieChart')
  if (!chartDom) return
  const oldChart = echarts.getInstanceByDom(chartDom)
  if (oldChart) oldChart.dispose()

  const myChart = echarts.init(chartDom)
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', textStyle: { fontSize: 10 } },
    legend: { orient: 'vertical', left: 'left', textStyle: { color: 'var(--text-primary)', fontSize: 10 } },
    series: [{
      name: t('pages.admin.adminManagePage.chartPicCategory'), type: 'pie', radius: ['45%', '75%'], center: ['55%', '50%'],
      data: chartData.value.pieChartData.labels?.map((label, index) => ({
        name: label, value: chartData.value.pieChartData.values?.[index] || 0
      })) || [],
      itemStyle: {
        borderRadius: 4, borderColor: 'var(--card-background)', borderWidth: 2,
        color: (params: any) => ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][params.dataIndex % 5]
      },
      label: { show: false }
    }]
  }
  myChart.setOption(option)
}

const renderStackedBarChart = () => {
  if (!chartData.value.stackedBarChartData) return
  const chartDom = document.getElementById('stackedBarChart')
  if (!chartDom) return
  const oldChart = echarts.getInstanceByDom(chartDom)
  if (oldChart) oldChart.dispose()

  const myChart = echarts.init(chartDom)
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontSize: 10 } },
    legend: { textStyle: { color: 'var(--text-primary)', fontSize: 10 } },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category', data: chartData.value.stackedBarChartData.xaxisData || [],
      axisLabel: { color: 'var(--text-secondary)', fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: 'var(--border-color)' } }
    },
    yAxis: {
      type: 'value', axisLabel: { color: 'var(--text-secondary)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }
    },
    series: chartData.value.stackedBarChartData.series?.map(item => ({
      name: item.name || '', type: 'bar', stack: 'total', barWidth: '40%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: (params: any) => ['#2563eb', '#10b981', '#f59e0b'][params.seriesIndex % 3]
      },
      data: item.data || []
    })) || []
  }
  myChart.setOption(option)
}

const renderAreaChart = () => {
  if (!chartData.value.areaChartData) return
  const chartDom = document.getElementById('areaChart')
  if (!chartDom) return
  const oldChart = echarts.getInstanceByDom(chartDom)
  if (oldChart) oldChart.dispose()

  const myChart = echarts.init(chartDom)
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', textStyle: { fontSize: 10 } },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category', boundaryGap: false, data: chartData.value.areaChartData.xaxisData || [],
      axisLabel: { color: 'var(--text-secondary)', fontSize: 10 },
      axisLine: { lineStyle: { color: 'var(--border-color)' } }
    },
    yAxis: {
      type: 'value', axisLabel: { color: 'var(--text-secondary)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }
    },
    series: chartData.value.areaChartData.series?.map(item => ({
      name: item.name || '', type: 'line', smooth: true, symbol: 'none',
      areaStyle: { opacity: 0.2, color: '#2563eb' },
      lineStyle: { color: '#2563eb', width: 3 },
      data: item.data || []
    })) || []
  }
  myChart.setOption(option)
}

watch(chartData, () => { nextTick(() => { renderCharts() }) }, { deep: true })

let refreshInterval: number | undefined

onMounted(() => {
  fetchDashboardStats()
  fetchChartStats()
  refreshInterval = setInterval(() => { fetchDashboardStats(); fetchChartStats() }, 60000)
  window.addEventListener('resize', handleResize)
  handleResize()

  watch(
    () => router.currentRoute.value.path,
    (path) => {
      const route = path.replace('/admin/', '') || 'dashboard'
      if (menuTitleMap.value[route]) {
        selectedKey.value = [route]
        if (route === 'dashboard') {
          nextTick(() => renderCharts())
        }
      }
    },
    { immediate: true }
  )
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  window.removeEventListener('resize', handleResize)
  document.body.style.overflow = 'auto'
  const chartIds = ['radarChart', 'pieChart', 'stackedBarChart', 'areaChart']
  chartIds.forEach(id => {
    const dom = document.getElementById(id)
    if (dom) {
      const chart = echarts.getInstanceByDom(dom)
      if (chart) chart.dispose()
    }
  })
})
</script>

<style scoped>
/* ==============================================
   核心全局变量与大框架：现代 SaaS 扁平风 (使用 yuemu- 前缀)
============================================== */
.yuemu-admin-layout-wrapper {
  --admin-primary: #2563eb;
  --admin-primary-hover: #1d4ed8;
  --admin-primary-light: rgba(37, 99, 235, 0.08);
  --admin-radius-lg: 16px;
  --admin-radius-md: 12px;
  --admin-radius-sm: 8px;
  --admin-shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  --admin-shadow-hover: 0 10px 20px rgba(0, 0, 0, 0.08);

  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh;
  background-color: var(--background, #f8fafc);
  z-index: 100;
  overflow: hidden;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.yuemu-admin-layout-container {
  display: flex; width: 100%; height: 100%;
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ================= 移动端顶部 Header ================= */
.yuemu-mobile-header {
  display: none;
  align-items: center; justify-content: space-between;
  padding: 0 20px; height: 56px;
  background: var(--card-background, #ffffff);
  border-bottom: 1px solid var(--border-color, #f1f5f9);
  z-index: 1010;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}
.yuemu-logo-text { font-size: 18px; font-weight: 700; color: var(--admin-primary); letter-spacing: 0.5px; }

.yuemu-mobile-mask {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
  z-index: 1000; backdrop-filter: blur(4px);
}

/* ================= 左侧侧边栏 (Sider) ================= */
.yuemu-admin-sider {
  width: 240px;
  flex-shrink: 0;
  display: flex; flex-direction: column;
  background: var(--card-background, #ffffff);
  border-right: 1px solid var(--border-color, #f1f5f9);
  transition:
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    order 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1005; height: 100%;
  box-sizing: border-box;
  order: 1;
  will-change: order, border;
}

.yuemu-admin-sider.sider-on-right {
  order: 2;
  border-right: none;
  border-left: 1px solid var(--border-color, #f1f5f9);
}

.yuemu-admin-sider.sider-on-left {
  order: 1;
  border-left: none;
  border-right: 1px solid var(--border-color, #f1f5f9);
}

.yuemu-admin-sider.is-collapsed { width: 72px; }

/* 侧边栏头部 */
.yuemu-sider-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 68px; padding: 0 20px;
  flex-shrink: 0; overflow: hidden;
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.yuemu-logo-dot {
  display: inline-block; width: 10px; height: 10px; border-radius: 5px;
  background: var(--admin-primary); margin-right: 6px;
  box-shadow: 0 0 8px var(--admin-primary);
}
.yuemu-sider-title {
  margin: 0; font-size: 18px; font-weight: 700; color: var(--text-primary);
  display: flex; align-items: center; white-space: nowrap;
}
.yuemu-collapse-btn { color: var(--text-secondary); padding: 6px; border-radius: var(--admin-radius-sm); transition: all 0.2s; }
.yuemu-collapse-btn:hover { color: var(--admin-primary); background: var(--admin-primary-light); }

/* 胶囊菜单列表 (Pill Menu) */
.yuemu-admin-menu {
  flex: 1; border-right: none;
  padding: 12px 0; background: transparent;
  overflow-y: auto; overflow-x: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.yuemu-menu-item-compact, .yuemu-submenu-compact :deep(.ant-menu-submenu-title) {
  height: 44px !important; line-height: 44px !important;
  margin: 4px 12px !important; width: calc(100% - 24px) !important;
  border-radius: var(--admin-radius-sm) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-secondary); font-weight: 500;
}
.yuemu-admin-menu :deep(.ant-menu-item:hover), .yuemu-admin-menu :deep(.ant-menu-submenu-title:hover) {
  color: var(--text-primary); background: var(--hover-background, #f8fafc) !important;
}
.yuemu-admin-menu :deep(.ant-menu-item-selected) {
  background: var(--admin-primary-light) !important;
  color: var(--admin-primary) !important; font-weight: 600;
}
.yuemu-admin-menu :deep(.ant-menu-submenu-empty) { display: none; }

/* ================= 右侧内容区 ================= */
.yuemu-admin-content {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  background: var(--background, #f8fafc);
  height: 100%; overflow-y: auto; overflow-x: hidden;
  padding: 24px 32px; scroll-behavior: smooth;
  box-sizing: border-box;
  order: 2;
  transition: order 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: order;
}

.yuemu-admin-sider.sider-on-right ~ .yuemu-admin-content {
  order: 1;
}

/* 内容头部 */
.yuemu-content-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 28px; padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  flex-shrink: 0;
}
.yuemu-title-wrap { display: flex; align-items: center; gap: 12px; }
.yuemu-title-decorator {
  width: 6px; height: 20px; border-radius: 3px; background: var(--admin-primary);
}
.yuemu-content-title {
  margin: 0; font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: 0.5px;
}

/* 微发光刷新按钮 */
.yuemu-refresh-btn {
  background: var(--admin-primary); border: none; color: #fff;
  border-radius: var(--admin-radius-sm); font-weight: 500;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  height: 38px; padding: 0 20px; display: flex; align-items: center; gap: 6px;
}
.yuemu-refresh-btn:hover {
  background: var(--admin-primary-hover); transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}
.yuemu-refresh-btn:active { transform: translateY(0); }

/* ================= 数据统计卡片 ================= */
.yuemu-stats-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px; margin-bottom: 32px;
}

.yuemu-stats-card {
  background: var(--card-background, #ffffff);
  border-radius: var(--admin-radius-md); border: 1px solid var(--border-color, #e2e8f0);
  padding: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; flex-direction: column; justify-content: space-between;
  height: 110px; box-shadow: var(--admin-shadow-soft);
  position: relative; box-sizing: border-box; overflow: hidden;
}
.yuemu-stats-card.is-clickable { cursor: pointer; }
.yuemu-stats-card.is-clickable:hover {
  transform: translateY(-4px);
  box-shadow: var(--admin-shadow-hover);
  border-color: var(--admin-primary-light);
}

.yuemu-card-head { display: flex; align-items: center; margin-bottom: 12px; }
.yuemu-card-title {
  font-size: 14px; color: var(--text-secondary); font-weight: 600;
  display: flex; align-items: center; gap: 8px; z-index: 2;
}
.yuemu-card-icon {
  color: var(--admin-primary); font-size: 16px;
  background: var(--admin-primary-light); padding: 6px; border-radius: 8px;
}

.yuemu-card-body { position: relative; z-index: 2; display: flex; align-items: baseline; justify-content: space-between;}
.yuemu-stats-number {
  font-size: 28px; font-weight: 800; color: var(--text-primary); line-height: 1; letter-spacing: -0.5px;
}
.yuemu-card-link-icon {
  color: var(--admin-primary); font-size: 16px; opacity: 0; transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.yuemu-stats-card.is-clickable:hover .yuemu-card-link-icon { opacity: 1; transform: translateX(0); }

/* ================= 图表区域 ================= */
.yuemu-charts-container { display: flex; flex-direction: column; gap: 20px; width: 100%; box-sizing: border-box;}
.yuemu-chart-row { display: flex; gap: 20px; width: 100%; flex-wrap: nowrap;}
.yuemu-chart-item {
  flex: 1; min-width: 0; background: var(--card-background, #ffffff);
  border-radius: var(--admin-radius-lg); padding: 24px; border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: var(--admin-shadow-soft); box-sizing: border-box;
  transition: box-shadow 0.3s ease;
}
.yuemu-chart-item:hover { box-shadow: var(--admin-shadow-hover); }
.yuemu-chart-item.is-full-width { flex: 100%; }

.yuemu-chart-title {
  font-size: 16px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
}
.yuemu-chart-title::before {
  content: ''; display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; background: var(--admin-primary);
  box-shadow: 0 0 6px var(--admin-primary);
}

.yuemu-compact-chart { width: 100%; height: 280px; }
.yuemu-chart-large { height: 340px; }

/* ================= 占位与动画 ================= */
.yuemu-page-placeholder {
  display: flex; align-items: center; justify-content: center;
  height: calc(100vh - 200px); background: var(--card-background, #ffffff);
  border-radius: var(--admin-radius-lg); border: 1px dashed var(--border-color, #cbd5e1);
}
.yuemu-placeholder-content { text-align: center; color: var(--text-secondary); }
.yuemu-placeholder-icon { font-size: 48px; color: var(--admin-primary); margin-bottom: 20px; opacity: 0.8; }
.yuemu-placeholder-content h2 { font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 10px;}

.yuemu-knowledge-graph-content { width: 100%; height: 100%; }

/* 优雅的入场动画 */
.yuemu-fade-in { animation: yuemuFadeIn 0.5s ease-out forwards; }
.yuemu-fade-in-up { animation: yuemuFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
@keyframes yuemuFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes yuemuFadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.yuemu-fade-enter-active, .yuemu-fade-leave-active { transition: opacity 0.3s; }
.yuemu-fade-enter-from, .yuemu-fade-leave-to { opacity: 0; }

/* 滚动条美化 */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(107, 114, 128, 0.8); }

/* ================= 移动端极致紧凑适配 ================= */
@media screen and (max-width: 1024px) {
  .yuemu-chart-row { flex-wrap: wrap; }
  .yuemu-chart-item { flex: 0 0 calc(50% - 10px) !important; }
}

@media screen and (max-width: 768px) {
  .yuemu-mobile-header { display: flex; position: fixed; top: 0; width: 100%; }

  .yuemu-admin-sider {
    position: fixed; left: 0; top: 0; height: 100vh;
    width: 260px; transform: translateX(-100%); z-index: 1015;
    box-shadow: 10px 0 30px rgba(0,0,0,0.1); border-radius: 0;
    padding-top: 20px;
  }
  .yuemu-admin-sider.is-mobile-active { transform: translateX(0); }

  .yuemu-admin-content {
    margin-left: 0 !important; margin-right: 0 !important;
    margin-top: 56px; padding: 16px !important;
    width: 100%; box-sizing: border-box;
  }

  .yuemu-content-header { margin-bottom: 16px !important; padding-bottom: 12px !important; }
  .yuemu-content-title { font-size: 18px !important; }
  .yuemu-refresh-btn { padding: 0 12px; height: 32px; font-size: 13px; }

  .yuemu-stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important; margin-bottom: 20px !important;
  }
  .yuemu-stats-card {
    height: 90px !important; padding: 16px !important; border-radius: var(--admin-radius-md) !important;
  }
  .yuemu-card-title { font-size: 13px !important; }
  .yuemu-card-icon { font-size: 14px !important; padding: 4px; }
  .yuemu-stats-number { font-size: 22px !important; margin-top: 4px !important; }

  .yuemu-chart-row { flex-direction: column !important; gap: 12px !important; margin-bottom: 12px !important; }
  .yuemu-chart-item { padding: 16px !important; border-radius: var(--admin-radius-md) !important; flex: 100% !important; }
  .yuemu-chart-title { font-size: 15px !important; margin-bottom: 16px !important; }
  .yuemu-compact-chart { height: 220px !important; }
  .yuemu-chart-large { height: 260px !important; }
}

@media screen and (max-width: 360px) {
  .yuemu-card-title { font-size: 12px !important; }
  .yuemu-stats-number { font-size: 20px !important; }
  .yuemu-stats-card { padding: 12px !important; }
}

/* =========================================================
   深色模式全局覆盖 (Scoped 下尽量不干涉外部)
   ========================================================= */
@media (prefers-color-scheme: dark) { .yuemu-admin-layout-wrapper {
  --admin-primary-light: rgba(37, 99, 235, 0.2);
  --admin-shadow-soft: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --admin-shadow-hover: 0 10px 20px rgba(0, 0, 0, 0.6);
} }

@media (prefers-color-scheme: dark) { .ant-menu,
@media (prefers-color-scheme: dark) { .ant-menu-sub { background: transparent !important; } } }

@media (prefers-color-scheme: dark) { .ant-menu-item-selected {
  background: rgba(37, 99, 235, 0.2) !important;
} }
</style>
