<template>
  <div class="search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-bar">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索用户或图片..."
          enter-button
          @search="doSearch"
          @input="handleInput"
          ref="searchInput"
          class="apple-search"
          autofocus
        >
          <template #prefix>
            <SearchOutlined class="search-icon" />
          </template>
        </a-input-search>
      </div>
    </div>

    <!-- 搜索类型切换 -->
    <div class="search-type">
      <div class="type-buttons">
        <div
          class="type-button"
          :class="{ active: searchType === 'picture' }"
          @click="() => handleTypeChange('picture')"
        >
          <PictureOutlined class="icon" :class="{ inactive: searchType !== 'picture' }" />
          <span>图片</span>
        </div>
        <div
          class="type-button"
          :class="{ active: searchType === 'user' }"
          @click="() => handleTypeChange('user')"
        >
          <UserOutlined class="icon" :class="{ inactive: searchType !== 'user' }" />
          <span>用户</span>
        </div>
      </div>
    </div>

    <!-- 搜索历史和热门搜索 -->
    <div v-if="!searchText" class="search-suggestions">
      <div class="suggestions-content">
        <!-- 搜索历史 -->
        <div class="search-history" v-if="searchHistory.length > 0">
          <div class="section-header">
            <span class="section-title">搜索历史</span>
            <a-button type="link" @click="clearHistory">清空</a-button>
          </div>
          <div class="history-tags">
            <a-tag
              v-for="item in searchHistory"
              :key="item"
              @click="searchByTag(item)"
              class="custom-tag"
            >
              {{ item }}
            </a-tag>
          </div>
        </div>

        <!-- 热门搜索 -->
        <div class="hot-searches">
          <div class="section-header">
            <span class="section-title">热门搜索</span>
          </div>
          <div class="hot-list">
            <div
              v-for="(item, index) in hotSearches"
              :key="item"
              class="hot-item"
              @click="searchByTag(item)"
            >
              <span class="hot-rank" :class="{ 'top3': index < 3 }">{{ index + 1 }}</span>
              <span class="hot-text">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-else class="search-results">
      <template v-if="loading">
        <div class="loading-container">
          <a-spin />
        </div>
      </template>
      <template v-else>
        <div v-if="searchType === 'picture'">
          <!-- PC端图片列表 -->
          <WaterfallPictureList
            v-if="!isMobile && pictureList.length > 0"
            :dataList="pictureList"
            :loading="loading"
          />
          <!-- 移动端列表 -->
          <MobilePictureList
            v-else-if="pictureList.length > 0"
            :dataList="pictureList"
            :loading="loading"
          />
          <a-empty v-else description="暂无搜索结果" />
        </div>
        <div v-else class="user-results">
          <div v-if="userList.length > 0" class="user-list">
            <div v-for="user in userList" :key="user.id" class="user-card">
              <div @click.stop="handleUserClick(user)" class="user-link">
                <a-avatar :size="48" :src="user.userAvatar" />
                <div class="user-info">
                  <div class="user-name">{{ user.userName }}</div>
                  <div class="user-profile">{{ user.userProfile || '这个人很懒，什么都没写~' }}</div>
                </div>
              </div>
            </div>
          </div>
          <a-empty v-else description="暂无搜索结果" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { SearchOutlined, PictureOutlined, UserOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { searchAllUsingPost } from '@/api/searchController'
import MobilePictureList from '@/components/MobilePictureList.vue'
import PictureList from '@/components/PictureList.vue'
import { getDeviceType } from '@/utils/device'
import { DEVICE_TYPE_ENUM } from '@/constants/device'
import WaterfallPictureList from '@/components/WaterfallPictureList.vue'

const router = useRouter()
const searchInput = ref()
const searchText = ref('')
const searchType = ref('picture')
const loading = ref(false)

// 添加类型声明
interface PictureUser {
  userId: number;
  userName: string;
  userAvatar: string;
}

interface PictureVO {
  id: number;
  url: string;
  description: string;
  thumbNum: number;
  commentCount: number;
  isThumb: boolean;
  user: PictureUser;
}

// 修改类型声明
const pictureList = ref<PictureVO[]>([])
const userList = ref<API.UserVO[]>([])

// 搜索历史
const searchHistory = ref<string[]>([])
// 模拟热门搜索数据
const hotSearches = ref(['风景', '动漫', '美食', '旅行', '人物', '建筑', '动物', '植物', '艺术'])

// 判断是否为移动端
const isMobile = ref(getDeviceType() !== DEVICE_TYPE_ENUM.PC)

onMounted(() => {
  // 从localStorage加载搜索历史
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }

  // 自动聚焦搜索框
  nextTick(() => {
    searchInput.value?.focus()
  })
})

// 执行搜索
const doSearch = async (text = searchText.value) => {
  if (!text.trim()) {
    message.warning('请输入搜索内容')
    return
  }

  loading.value = true

  try {
    const res = await searchAllUsingPost({
      searchText: text,
      type: searchType.value,
      current: 1,
      pageSize: 20
    })

    if (res.data.code === 0) {
      if (searchType.value === 'picture') {
        pictureList.value = res.data.data.content || []
      } else {
        userList.value = res.data.data.content || []
      }
      // 添加到搜索历史
      addToHistory(text)
    } else {
      message.error('搜索失败：' + res.data.message)
    }
  } catch (error) {
    message.error('搜索出错，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理搜索类型切换
const handleTypeChange = (type: string) => {
  searchType.value = type
  if (searchText.value) {
    doSearch()
  }
}

// 添加到搜索历史
const addToHistory = (text: string) => {
  if (!searchHistory.value.includes(text)) {
    searchHistory.value.unshift(text)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  }
}

// 清空搜索历史
const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

// 点击标签搜索
const searchByTag = (text: string) => {
  searchText.value = text
  doSearch(text)
}

// 处理输入框内容变化
const handleInput = () => {
  if (!searchText.value) {
    pictureList.value = []
    userList.value = []
  }
}

// 处理图片点击
const handlePictureClick = (item: API.PictureVO) => {
  router.push(`/picture/${item.id}`)
}

// 处理用户点击
// 处理用户点击
const handleUserClick = (user) => {
  if (!user) return
  // console.log('用户点击', user)
  router.push({
    path: `/user/${user.id}`,
    query: {
      userName: user.userName,
      userAvatar: user.userAvatar,
      userAccount: user.userAccount,
      userProfile: user.userProfile,
      userRole: user.userRole,
      createTime: user.createTime
    }
  })
}
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #fff;
  padding: 24px 4px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 32px;
}

.search-bar {
  flex: 1;
  max-width: 680px;
  margin: 0 auto;
  position: relative;
  height: 40px;
}

/* 苹果风格搜索框 */
:deep(.apple-search) {
  position: absolute;
  width: 100%;

  .ant-input-wrapper {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    height: 40px;
  }

  .ant-input-affix-wrapper {
    height: 40px;
    padding-top: 0;
    padding-bottom: 0;
    display: flex;
    align-items: center;
    border: 1px solid #d9d9d9;

    &:hover,
    &:focus,
    &-focused {
      border-color: #ff8e53;
      box-shadow: 0 0 0 2px rgba(255, 142, 83, 0.1);
    }
  }

  .ant-input {
    height: 40px;
    font-size: 16px;
    padding-left: 16px;
    line-height: 40px;
  }

  .ant-input-search-button {
    height: 40px;
    background: #ff8e53;
    border-color: #ff8e53;
    line-height: 40px;

    &:hover {
      background: #ff7a33;
      border-color: #ff7a33;
    }
  }
}

.search-type {
  text-align: center;
  margin: 12px 0;  /* 调整搜索类型切换按钮的上下间距 */
}

.type-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.type-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;  /* 添加适当的内边距 */
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  color: #666;

  &:hover {
    color: #ff8e53;
    background: #fff0eb;
  }

  &.active {
    color: #ff8e53;
    background: #fff0eb;
    font-weight: 500;
  }

  .icon {
    font-size: 18px;
    transition: opacity 0.3s ease;
  }

  .inactive {
    opacity: 0.6;
  }
}

.suggestions-content {
  max-width: 680px;
  margin: 0 auto;
}

.search-suggestions {
  padding: 0 4px;
  margin-top: 12px;  /* 调整搜索建议区域的上边距 */
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  color: #999;
  letter-spacing: 0.5px;
}

.custom-tag {
  cursor: pointer;
  border: none;
  background: #f5f5f7;
  color: #666;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: #fff0eb;
    color: #ff8e53;
  }
}

.hot-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f5f5f7;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fff0eb;
    transform: translateY(-1px);
  }
}

.hot-rank {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #999;
}

.hot-rank.top3 {
  color: #ff8e53;
  font-weight: bold;
}

.hot-text {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 680px;
  margin: 0 auto;
  padding: 0 4px;
}

.user-card {
  padding: 12px;
  background: #f5f5f7;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #fff0eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(255, 142, 83, 0.1);
  }
}

.user-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.user-profile {
  font-size: 14px;
  color: #666;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;
}

.search-results {
  width: 100%;
  max-width: 100%;
  padding: 0;
}
</style>
