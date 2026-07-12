<template>
  <div class="search-page">
    <div class="search-header-sticky">
      <div class="layout-center-800">

        <div class="apple-search-bar">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon"></i>
            <input
              v-model="searchText"
              type="text"
              class="search-input"
              maxlength="50"
              :placeholder="$t('pages.searchPage.searchPlaceholder')"
              @input="handleInput"
              @keyup.enter="doSearch()"
              ref="searchInput"
            />

            <!-- 极简版智能语义搜索切换 (内置于输入框) -->
            <div
              v-if="searchType === 'picture'"
              class="semantic-icon-btn"
              :class="{ 'is-active': enableSemanticSearch }"
              @click="toggleSemanticSearch"
              :title="$t('pages.searchPage.aiTitle')"
            >
              <i class="fas" :class="enableSemanticSearch ? 'fa-brain' : 'fa-magic'"></i>
            </div>

            <i
              v-show="searchText"
              class="fas fa-times-circle clear-icon"
              @mousedown.prevent="searchText = ''; handleInput()"
            ></i>
          </div>
          <button class="search-action-text" @click="doSearch()">{{ $t('pages.searchPage.searchBtn') }}</button>
        </div>

        <div class="apple-tabs">
          <div
            class="tab-item"
            :class="{ active: searchType === 'picture' }"
            @click="handleTypeChange('picture')"
          >
            <span>{{ $t('pages.searchPage.tabs.pic') }}</span>
            <span class="count-badge" v-if="totalElementsMap.picture > 0">{{ totalElementsMap.picture }}</span>
          </div>
          <div
            class="tab-item"
            :class="{ active: searchType === 'post' }"
            @click="handleTypeChange('post')"
          >
            <span>{{ $t('pages.searchPage.tabs.post') }}</span>
            <span class="count-badge" v-if="totalElementsMap.post > 0">{{ totalElementsMap.post }}</span>
          </div>
          <div
            class="tab-item"
            :class="{ active: searchType === 'space' }"
            @click="handleTypeChange('space')"
          >
            <span>{{ $t('pages.searchPage.tabs.space') }}</span>
            <span class="count-badge" v-if="totalElementsMap.space > 0">{{ totalElementsMap.space }}</span>
          </div>
          <div
            class="tab-item"
            :class="{ active: searchType === 'user' }"
            @click="handleTypeChange('user')"
          >
            <span>{{ $t('pages.searchPage.tabs.user') }}</span>
            <span class="count-badge" v-if="totalElementsMap.user > 0">{{ totalElementsMap.user }}</span>
          </div>
        </div>

      </div>
    </div>

    <div class="search-content-wrapper">

      <div v-if="(!searchText || !searched) && !loading" class="search-suggestions layout-center-800">

        <div class="suggestion-section" v-if="searchHistory.length > 0">
          <div class="section-header">
            <h3 class="section-title">{{ $t('pages.searchPage.sections.history') }}</h3>
            <i class="fas fa-trash-alt delete-btn" @click="clearHistory"></i>
          </div>
          <div class="tag-cloud">
            <div
              class="tag-pill"
              v-for="item in searchHistory"
              :key="item"
              @click="searchByTag(item)"
            >
              {{ item }}
            </div>
          </div>
        </div>

        <div class="suggestion-section" v-if="guessSearches.length > 0">
          <div class="section-header">
            <h3 class="section-title">{{ $t('pages.searchPage.sections.guess') }}</h3>
          </div>
          <div class="tag-cloud">
            <div
              class="tag-pill guess-pill"
              v-for="item in guessSearches"
              :key="typeof item === 'string' ? item : item.keyword"
              @click="searchByTag(typeof item === 'string' ? item : item.keyword)"
            >
              <i class="fas fa-search"></i>
              <span>{{ typeof item === 'string' ? item : item.keyword }}</span>
            </div>
          </div>
        </div>

        <div class="suggestion-section hot-ranking-section">
          <div class="section-header">
            <h3 class="section-title">{{ $t('pages.searchPage.sections.hot') }}</h3>
            <span class="rule-hint" @click="showHotScoreExplanation">{{ $t('pages.searchPage.sections.hotRule') }} <i class="fas fa-info-circle"></i></span>
          </div>

          <div class="ranking-list">
            <div
              v-for="(item, index) in hotSearches"
              :key="typeof item === 'string' ? item : item.keyword"
              class="ranking-item"
              @click="searchByTag(typeof item === 'string' ? item : item.keyword)"
            >
              <div class="rank-left">
                <span class="rank-number" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
                <span class="rank-keyword">{{ typeof item === 'string' ? item : item.keyword }}</span>
                <span class="hot-badge" v-if="index < 3">{{ $t('pages.searchPage.hotBadge') }}</span>
              </div>
              <div class="rank-right" v-if="typeof item !== 'string'">
                {{ Math.round(item.score || 0) }}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div v-else class="search-results">

        <div v-if="loading && searchParams.current === 1" class="global-loading">
          <i class="fas fa-circle-notch fa-spin"></i>
          <p>{{ $t('pages.searchPage.status.searching') }}</p>
        </div>

        <template v-else>
          <div v-if="searchType === 'picture'" class="result-block layout-center-1400">
            <BigPictureList
              v-if="pictureList.length > 0"
              :dataList="pictureList"
              :loading="loading"
              :streamLayout="'waterfall'"
            />
            <div v-else class="modern-empty-state">
              <img :src="emptyImage" :alt="$t('pages.searchPage.empty.picAlt')" />
              <p>{{ $t('pages.searchPage.empty.pic') }}</p>
            </div>
          </div>

          <div v-else-if="searchType === 'post'" class="result-block layout-center-1400">
            <PostList
              v-if="postList.length > 0"
              :dataList="postList"
              :loading="loading"
              :showStatus="false"
            />
            <div v-else class="modern-empty-state">
              <img :src="emptyImage" :alt="$t('pages.searchPage.empty.picAlt')" />
              <p>{{ $t('pages.searchPage.empty.post') }}</p>
            </div>
          </div>

          <div v-else-if="searchType === 'space'" class="result-block layout-center-1400 space-grid">
            <template v-if="spaceList.length > 0">
              <SpaceInfoCard
                v-for="space in spaceList"
                :key="space.id"
                :spaceInfo="space"
                @click="goToSpaceDetail(space)"
              />
            </template>
            <div v-else class="modern-empty-state" style="grid-column: 1 / -1;">
              <img :src="emptyImage" :alt="$t('pages.searchPage.empty.picAlt')" />
              <p>{{ $t('pages.searchPage.empty.space') }}</p>
            </div>
          </div>

          <div v-else class="result-block layout-center-800 user-list-container">
            <template v-if="userList.length > 0">
              <div v-for="user in userList" :key="user.id" class="modern-user-row" @click="handleUserClick(user)">
                <a-avatar :src="user.userAvatar" :size="56" class="user-avatar-shadow" />
                <div class="user-main-info">
                  <div class="user-name-line">
                    <span class="user-name">{{ user.userName }}</span>
                  </div>
                  <p class="user-desc">{{ user.userProfile || $t('pages.searchPage.empty.userDesc') }}</p>
                  <div class="user-data-tags">
                    <span class="data-tag">{{ $t('pages.searchPage.userData.fans', { count: user.fansCount || 0 }) }}</span>
                    <span class="data-tag">{{ $t('pages.searchPage.userData.follows', { count: user.followCount || 0 }) }}</span>
                  </div>
                </div>
                <div class="user-action">
                  <i class="fas fa-chevron-right"></i>
                </div>
              </div>
            </template>
            <div v-else class="modern-empty-state">
              <img :src="emptyImage" :alt="$t('pages.searchPage.empty.userAlt')" />
              <p>{{ $t('pages.searchPage.empty.user') }}</p>
            </div>
          </div>
        </template>
      </div>

      <div v-if="searchText && searched" class="pagination-footer">
        <div v-if="loading && searchParams.current > 1" class="loading-more">
          <i class="fas fa-circle-notch fa-spin"></i> {{ $t('pages.searchPage.status.loadingMore') }} </div>
        <div v-if="isEndOfData && (pictureList.length > 0 || postList.length > 0 || spaceList.length > 0 || userList.length > 0)" class="no-more">
          <span class="text">{{ $t('pages.searchPage.status.end') }}</span>
        </div>
      </div>

    </div>

    <SpaceDetailModal
      v-model="spaceDetailVisible"
      :space-detail="selectedSpace"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, nextTick, watch, onUnmounted, onActivated, onDeactivated } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter, useRoute } from 'vue-router'
import { searchAllUsingPost, getHotSearchKeywordsUsingGet, getGuessYouWantToSearchUsingGet } from '@/api/searchController'
import BigPictureList from '@/components/BigPictureList.vue'
import PostList from '@/components/PostList.vue'
import SpaceInfoCard from '@/components/SpaceInfoCard.vue'
import SpaceDetailModal from '@/components/SpaceDetailModal.vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import { debounce } from 'lodash-es'
import emptyImage from '@/assets/illustrations/empty.png'

const router = useRouter()
const route = useRoute()
const searchInput = ref()
const searchText = ref('')
const searchType = ref('picture')
const loading = ref(false)
const isEndOfData = ref(false)
const searched = ref(false)
const enableSemanticSearch = ref(false)

const toggleSemanticSearch = () => {
  enableSemanticSearch.value = !enableSemanticSearch.value
  if (searchText.value) {
    doSearch(searchText.value, false)
  }
}

const searchParams = ref({ current: 1, pageSize: 20 })

interface PictureUser { userId: number; userName: string; userAvatar: string; }
interface PictureVO { id: number; url: string; description: string; thumbNum: number; commentCount: number; isThumb: boolean; user: PictureUser; }

const pictureList = ref<PictureVO[]>([])
const userList = ref<API.UserVO[]>([])
const postList = ref<API.Post[]>([])
const spaceList = ref<API.SpaceVO[]>([])
const totalElementsMap = ref<Record<string, number>>({ picture: 0, post: 0, space: 0, user: 0 })
const spaceDetailVisible = ref(false)
const selectedSpace = ref<API.SpaceVO | null>(null)

const searchHistory = ref<string[]>([])
const hotSearches = ref([])
const guessSearches = ref([])

const fetchHotSearches = async (type: string) => {
  try {
    const res = await getHotSearchKeywordsUsingGet({ type, size: 10 })
    if (res.data?.code === 0) hotSearches.value = res.data.data
  } catch (error) {
    console.error(t('pages.searchPage.msgs.getHotFail'), error)
  }
}

const fetchGuessSearches = async (type: string) => {
  try {
    const res = await getGuessYouWantToSearchUsingGet({ type, size: 8 })
    if (res.data?.code === 0) guessSearches.value = res.data.data
  } catch (error) {
    console.error(t('pages.searchPage.msgs.getGuessFail'), error)
  }
}

const initFromRoute = () => {
  if (route.path === '/search') {
    const queryType = (route.query.type || 'picture') as string
    searchType.value = queryType

    const queryText = (route.query.q || route.query.searchText || '') as string
    if (queryText.trim()) {
      searchText.value = queryText
      searchParams.value.current = 1
      isEndOfData.value = false
      loading.value = true
      executeSearch(queryText, false)
    } else {
      searchText.value = ''
      clearResults()
    }

    fetchHotSearches(queryType)
    fetchGuessSearches(queryType)
  }
}

onMounted(() => {
  const history = localStorage.getItem('searchHistory')
  if (history) searchHistory.value = JSON.parse(history)

  nextTick(() => { searchInput.value?.focus() })
  window.addEventListener('scroll', handleScroll)
  initFromRoute()
})

onActivated(() => {
  window.addEventListener('scroll', handleScroll)
  localStorage.setItem('streamLayout', 'waterfall')
})

onDeactivated(() => {
  window.removeEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  handleScroll.cancel()
  window.removeEventListener('scroll', handleScroll)
})

watch(
  () => route.fullPath,
  () => {
    initFromRoute()
  }
)

const doSearch = async (text = searchText.value, isAppend = false) => {
  if (!text.trim()) {
    message.warning(t('pages.searchPage.msgs.inputEmpty'))
    return
  }
  if (isAppend) {
    if (loading.value || isEndOfData.value) return
    searchParams.value.current += 1
  } else {
    searchParams.value.current = 1
    isEndOfData.value = false
    loading.value = true
  }
  await executeSearch(text, isAppend)
}

const executeSearch = async (text: string, isAppend: boolean) => {
  try {
    const res = await searchAllUsingPost({
      searchText: text,
      type: searchType.value,
      current: searchParams.value.current,
      pageSize: searchParams.value.pageSize,
      enableSemanticSearch: enableSemanticSearch.value
    })

    if (res.data.code === 0) {
      const newData = res.data.data.content || []
      updateListByType(newData, isAppend)
      totalElementsMap.value[searchType.value] = Number(res.data.data.totalElements || 0)
      isEndOfData.value = newData.length < searchParams.value.pageSize
      if (!isAppend) {
        addToHistory(text)
        searched.value = true
      }
    } else {
      message.error(t('pages.searchPage.msgs.searchFailPrefix') + res.data.message)
    }
  } catch (error) {
    message.error(t('pages.searchPage.msgs.searchError'))
  } finally {
    if (!isAppend) loading.value = false
  }
}

const updateListByType = (newData: any[], isAppend: boolean) => {
  switch (searchType.value) {
    case 'picture': pictureList.value = isAppend ? [...pictureList.value, ...newData] : newData; break;
    case 'post': postList.value = isAppend ? [...postList.value, ...newData] : newData; break;
    case 'space': spaceList.value = isAppend ? [...spaceList.value, ...newData] : newData; break;
    case 'user': userList.value = isAppend ? [...userList.value, ...newData] : newData; break;
  }
}

const clearResults = () => {
  pictureList.value = []
  userList.value = []
  postList.value = []
  spaceList.value = []
  totalElementsMap.value = { picture: 0, post: 0, space: 0, user: 0 }
  isEndOfData.value = false
  searched.value = false
}

const handleScroll = debounce(() => {
  if (!searchText.value || loading.value || isEndOfData.value) return
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const scrollHeight = document.documentElement.scrollHeight
  if (scrollHeight - scrollTop - windowHeight <= 200) {
    doSearch(searchText.value, true)
  }
}, 200)

const handleInput = () => {
  if (!searchText.value) {
    clearResults()
  }
}

const handleTypeChange = (type: string) => {
  searchType.value = type
  clearResults()
  fetchHotSearches(type)
  fetchGuessSearches(type)
  if (searchText.value && searchText.value.trim() !== '') {
    doSearch(searchText.value, false)
  }
}

const addToHistory = (text: string) => {
  const index = searchHistory.value.indexOf(text)
  if (index > -1) searchHistory.value.splice(index, 1)
  searchHistory.value.unshift(text)
  if (searchHistory.value.length > 15) searchHistory.value.pop()
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

const showHotScoreExplanation = () => {
  message.info({ content: t('pages.searchPage.msgs.hotRuleHint'), duration: 4 });
}

const searchByTag = (text: string) => {
  searchText.value = text
  doSearch(text)
}

const handleUserClick = (user: any) => {
  if (!user) return
  router.push({
    path: `/user/${user.id}`,
    query: { userName: user.userName, userAvatar: user.userAvatar, userAccount: user.userAccount, userProfile: user.userProfile }
  })
}

const goToSpaceDetail = (space: API.SpaceVO) => {
  if (!space || !space.id) return
  router.push(`/space/${space.id}`)
}
</script>

<style scoped>
/* ================= 基础布局与变量 ================= */
.search-page {
  min-height: 88vh;
  background-color: var(--background, #ffffff);
  color: var(--text-primary, #1d1d1f);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;

}

/* 核心布局容器定义 */
.layout-center-800 {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.layout-center-1400 {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 768px) {
  .layout-center-800, .layout-center-1400 {
    padding: 0 12px;
  }
}

/* ================= 1. 吸顶头部 (完全居中对齐) ================= */
.search-header-sticky {
  position: sticky;
  background: var(--background, rgba(255, 255, 255, 0.98));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  padding-top: 16px;
}
@media (max-width: 768px) {
  .search-header-sticky { top: 0; padding-top: 12px; }
}

/* 极简搜索框：宽度占满 800px 容器 */
.apple-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  width: 100%;
}

.search-input-wrapper {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 48px; /* 稍微加高，显得更大气 */
  background: var(--hover-background, #f2f3f5);
  border-radius: 24px;
  padding: 0 16px;
  transition: all 0.2s ease;
}
.search-input-wrapper:focus-within {
  background: var(--hover-background, #eef0f2);
}

.search-icon {
  color: #a1a1aa;
  font-size: 15px;
}

.search-input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  border: none;
  background: transparent;
  outline: none;
  padding: 0 12px;
  font-size: 16px;
  color: var(--text-primary, #1d1d1f);
}
.search-input::placeholder { color: #a1a1aa; }

.clear-icon {
  color: #caced1;
  cursor: pointer;
  font-size: 18px;
  transition: color 0.2s;
}
.clear-icon:hover { color: #9ca3af; }

.search-action-text {
  font-size: 15px;
  font-weight: 600;
  color: #1677ff;
  background: #e6f4ff;
  border: none;
  padding: 0 24px;
  height: 48px;
  border-radius: 24px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 1px;
}
.search-action-text:hover {
  background: #bae0ff;
  transform: translateY(-1px);
}
.search-action-text:active {
  transform: translateY(1px);
}

/* 极简语义按钮（内置于输入框） */
.semantic-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 4px;
}

.semantic-icon-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #6b7280;
}

.semantic-icon-btn.is-active {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.semantic-icon-btn.is-active i {
  animation: semantic-pulse 2s infinite;
}

@keyframes semantic-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .apple-search-bar {
    gap: 8px;
  }
  .search-input-wrapper {
    height: 40px;
    padding: 0 12px;
  }
  .search-input {
    font-size: 14px;
    padding: 0 8px;
  }
  .search-action-text {
    height: 40px;
    padding: 0 16px;
    font-size: 14px;
  }
  .search-action-text {
    height: 40px;
    padding: 0 16px;
    font-size: 14px;
  }
}

/* 极简 Tab 导航：宽度占满 800px 容器，左对齐 */
.apple-tabs {
  display: flex;
  gap: 32px;
  overflow-x: auto;
  scrollbar-width: none;
  width: 100%;
}
.apple-tabs::-webkit-scrollbar { display: none; }

.tab-item {
  position: relative;
  font-size: 16px;
  color: var(--text-secondary, #86868b);
  padding-bottom: 12px;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.tab-item:hover { color: var(--text-primary, #1d1d1f); }

.tab-item.active {
  font-weight: 600;
  color: var(--text-primary, #1d1d1f);
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  background: #2563eb;
  border-radius: 2px;
}

.count-badge {
  margin-left: 6px;
  font-size: 12px;
  background: #eef2ff;
  color: #2563eb;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 500;
}

/* ================= 2. 内容区 ================= */
.search-content-wrapper {
  padding-top: 12px;
  padding-bottom: 60px;
}

/* --- 搜索建议区 (使用 layout-center-800 自动居中) --- */
.suggestion-section { margin-bottom: 32px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1d1d1f);
  margin: 0;
}

.delete-btn {
  color: #caced1;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
}
.delete-btn:hover { color: #9ca3af; }

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-pill {
  background: var(--hover-background, #f5f5f7);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary, #1d1d1f);
  cursor: pointer;
  transition: background 0.2s;
  white-space: normal;
  word-break: break-all;
}
.tag-pill:hover { background: #e5e5ea; }

.guess-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  white-space: normal;
  word-break: break-all;
}
.guess-pill:hover { background: rgba(59, 130, 246, 0.15); }
.guess-pill i { font-size: 12px; color: #a1a1aa; }

/* 热门榜单 */
.hot-ranking-section { margin-top: 48px; }
.rule-hint { font-size: 12px; color: #a1a1aa; cursor: pointer; }

.ranking-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 768px) {
  .ranking-list { grid-template-columns: 1fr 1fr; gap: 16px 40px; }
}

.ranking-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 6px 0;
  border-radius: 8px;
  transition: background 0.2s;
}
.ranking-item:hover .rank-keyword { color: #2563eb; }

.rank-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  overflow: hidden;
}

.rank-number {
  font-size: 16px;
  font-weight: 700;
  color: #d1d5db;
  width: 20px;
  text-align: center;
}
.rank-1 { color: #ef4444; }
.rank-2 { color: #f97316; }
.rank-3 { color: #eab308; }

.rank-keyword {
  font-size: 15px;
  color: var(--text-primary, #1d1d1f);
  white-space: normal;
  word-break: break-all;
  transition: color 0.2s;
}

.hot-badge {
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 4px;
  margin-top: 1px;
}

.rank-right {
  font-size: 13px;
  color: #a1a1aa;
  margin-left: 12px;
}

/* ================= 3. 搜索结果区 ================= */
.global-loading {
  text-align: center;
  padding: 100px 0;
  color: #a1a1aa;
  font-size: 14px;
}
.global-loading i { font-size: 24px; margin-bottom: 16px; color: #d1d5db;}

.result-block { margin-top: 4px; }

/* 空间卡片网格 (1400px居中) */
.space-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media (min-width: 600px) { .space-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .space-grid { grid-template-columns: repeat(3, 1fr); } }

/* 横向用户列表 (800px居中) */
.user-list-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 768px) { .user-list-container { grid-template-columns: 1fr 1fr; } }

.modern-user-row {
  display: flex;
  align-items: center;
  background: var(--card-background, #fff);
  padding: 16px;
  border-radius: 12px;
  gap: 16px;
  border: 1px solid var(--border-color, #f5f5f5);
  cursor: pointer;
  transition: background 0.2s;
  overflow: hidden;
}
.modern-user-row:hover { background: var(--hover-background, #fafafa); }

.user-avatar-shadow { border: 1px solid rgba(0,0,0,0.04); flex-shrink: 0; }

.user-main-info { flex: 1; min-width: 0; overflow: hidden; }
.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-desc {
  font-size: 13px;
  color: var(--text-secondary, #86868b);
  margin: 0 0 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-data-tags { display: flex; gap: 12px; flex-wrap: wrap; }
.data-tag { font-size: 12px; color: #a1a1aa; white-space: nowrap; }

.user-action { color: #d1d5db; font-size: 14px; flex-shrink: 0; }

/* 高级空状态 */
.modern-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
  color: #a1a1aa;
}
.modern-empty-state img { width: 140px; margin-bottom: 20px; opacity: 0.6; }
.modern-empty-state p { font-size: 14px; }

/* 底部加载指示 */
.pagination-footer {
  padding: 40px 0;
  text-align: center;
}
.loading-more { color: #a1a1aa; font-size: 13px; }
.no-more { color: #d1d5db; font-size: 12px; letter-spacing: 1px; }
</style>
