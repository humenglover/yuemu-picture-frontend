<template>
  <div id="SearchCategoryPage">
    <div class="search-header">
      <div class="searchbar-wrapper">
        <div class="searchbar">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="searchText"
            type="text"
            class="search-input"
            :placeholder="$t('pages.myPostsPage.searchPlaceholder')"
            @keyup.enter="handleSearch"
          />
          <div class="clear-btn" v-if="searchText" @click="searchText = ''">
            <i class="fas fa-times"></i>
          </div>
        </div>
        <div class="search-btn" @click="handleSearch">{{ $t('pages.myPostsPage.search') }}</div>
      </div>
    </div>

    <div class="category-grid">
      <div
        class="category-item"
        :class="{ active: activeCategory === 'picture' }"
        @click="handleCategoryChange('picture')"
      >
        <i class="fas fa-image category-icon"></i>
        <span class="category-text">{{ $t('pages.myPostsPage.picture') }}</span>
      </div>
      <div
        class="category-item"
        :class="{ active: activeCategory === 'post' }"
        @click="handleCategoryChange('post')"
      >
        <i class="fas fa-file-alt category-icon"></i>
        <span class="category-text">{{ $t('pages.myPostsPage.post') }}</span>
      </div>
    </div>

    <div class="content-area" v-if="hasSearched">
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin loading-icon-large"></i>
        <p class="loading-text">{{ $t('pages.myPostsPage.searching') }}</p>
      </div>

      <template v-else>
        <div v-if="activeCategory === 'picture'">
          <BigPictureList
            v-if="dataList.length > 0"
            :dataList="dataList"
            :showOp="true"
            :isMyPosts="true"
          />
          <div v-else class="empty-container">
            <div class="empty-icon">
              <i class="fas fa-image"></i>
            </div>
            <p class="empty-text">{{ $t('pages.myPostsPage.noPicFound') }}</p>
            <div class="empty-tip">{{ $t('pages.myPostsPage.tryOtherKeyword') }}</div>
          </div>
        </div>

        <div v-else>
          <PostList
            v-if="dataList.length > 0"
            :dataList="dataList"
            :showOp="true"
            :isMyPosts="true"
            :showStatus="true"
          />
          <div v-else class="empty-container">
            <div class="empty-icon">
              <i class="fas fa-file-alt"></i>
            </div>
            <p class="empty-text">{{ $t('pages.myPostsPage.noPostFound') }}</p>
            <div class="empty-tip">{{ $t('pages.myPostsPage.tryOtherKeyword') }}</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { listPictureVoByPageUsingPost } from '@/api/pictureController'
import { listMyPostsUsingPost } from '@/api/postController'
import MobilePictureList from '@/components/MobilePictureList.vue'
import BigPictureList from '@/components/BigPictureList.vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const { t } = useI18n();

const router = useRouter()
const loginUserStore = useLoginUserStore()

const activeCategory = ref('picture')
const searchText = ref('')
const dataList = ref<any[]>([])
const loading = ref(false)
const hasSearched = ref(false)

const handleCategoryChange = (category: 'picture' | 'post') => {
  activeCategory.value = category
}

const handleSearch = async () => {
  if (!searchText.value.trim()) {
    message.warning(t('pages.myPostsPage.emptyKeyword'))
    return
  }

  hasSearched.value = true
  loading.value = true

  try {
    const params = {
      current: 1,
      pageSize: 36,
      userId: loginUserStore.loginUser?.id,
      searchText: searchText.value.trim()
    }

    let res
    if (activeCategory.value === 'picture') {
      res = await listPictureVoByPageUsingPost({
        ...params,
        reviewStatus: undefined,
        enableSemanticSearch: true
      })
    } else {
      res = await listMyPostsUsingPost(params)
    }

    if (res.data.code === 0) {
      dataList.value = res.data.data?.records || []
    } else {
      message.error(t('pages.myPostsPage.searchFail').replace('{msg}', res.data.message))
      dataList.value = []
    }
  } catch (e: any) {
    message.error(t('pages.myPostsPage.searchFail').replace('{msg}', e.message))
    dataList.value = []
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.back()
}
</script>

<style scoped>
#SearchCategoryPage {
  background-color: var(--background);
  max-width: 1400px;
  margin: auto;
  box-sizing: border-box;
  padding: 0 8px;
  transition: var(--theme-transition);
}

.search-header {
  padding: 10px 0;
  max-width: 1000px;
  margin: auto;
  margin-top: 16px;
  border-bottom: 1px solid var(--header-border);
}

.searchbar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.searchbar {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--search-btn-bg);
  border: 1px solid var(--search-btn-border);
  border-radius: 30px;
  padding: 8px 16px;
  height: 36px;
  transition: var(--theme-transition);
  min-width: 0;
}

.searchbar:focus-within {
  background-color: var(--hover-background);
}

.search-icon {
  color: var(--text-secondary);
  font-size: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 15px;
  color: var(--text-primary);
  height: 100%;
  line-height: 1;
  width: 100%;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--text-secondary);
  font-size: 15px;
}

.clear-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--hover-background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  transition: var(--theme-transition);
}

.clear-btn:hover {
  background-color: var(--border-color);
}

.search-btn {
  color: var(--text-other);
  background-color: var(--nav-item-active-text);
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--theme-transition);
  border: 1px solid var(--search-btn-border);
  white-space: nowrap;
}

.search-btn:hover {
  background-color: var(--link-hover-color);
  transform: scale(1.02);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px 0;
  max-width: 1000px;
  margin: 0 auto;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100px;
  background-color: var(--card-background);
  border-radius: 16px;
  cursor: pointer;
  transition: var(--theme-transition);
  box-shadow: 0 2px 4px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.category-item.active {
  background-color: var(--nav-item-active);
  color: var(--nav-item-active-text);
  box-shadow: 0 4px 8px var(--shadow-color);
}

.category-icon {
  font-size: 28px;
}

.category-text {
  font-size: 16px;
  font-weight: 500;
}

.content-area {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.loading-icon-large {
  font-size: 28px;
  color: var(--nav-item-active-text);
}

.loading-text {
  margin-top: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.empty-icon {
  font-size: 64px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  opacity: 0.3;
}

.empty-text {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-tip {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
