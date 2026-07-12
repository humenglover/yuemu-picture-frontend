<template>
  <div class="ai-resource-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="$router.back()" :title="$t('pages.aiResourcePage.back')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h2><i class="fas fa-folder-open"></i> {{ $t('pages.aiResourcePage.title') }}</h2>
        <p>{{ $t('pages.aiResourcePage.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <div class="filter-tabs">
          <button
            :class="{ active: queryParams.resourceType === undefined }"
            @click="setFilter(undefined)">{{ $t('pages.aiResourcePage.all') }}</button>
          <button
            :class="{ active: queryParams.resourceType === 'image' }"
            @click="setFilter('image')">{{ $t('pages.aiResourcePage.images') }}</button>
          <button
            :class="{ active: queryParams.resourceType === 'audio' }"
            @click="setFilter('audio')">{{ $t('pages.aiResourcePage.audios') }}</button>
        </div>
      </div>
    </div>

    <div class="resource-container" v-if="!loading || resourceList.length > 0">
      <div v-if="resourceList.length === 0" class="empty-state">
        <i class="far fa-folder-open"></i>
        <p>{{ $t('pages.aiResourcePage.emptyTitle') }}</p>
        <span class="empty-hint">{{ $t('pages.aiResourcePage.emptyDesc') }}</span>
      </div>

      <div v-else class="resource-masonry">
        <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="masonry-column">
          <div
            v-for="item in column"
            :key="item.id"
            class="resource-card"
          >
            <div class="card-media">
              <!-- 类型角标 -->
              <div class="resource-type-badge" :class="item.resourceType" :title="item.resourceType === 'image' ? $t('pages.aiResourcePage.badgeImage') : $t('pages.aiResourcePage.badgeAudio')">
                <i :class="item.resourceType === 'image' ? 'fas fa-image' : 'fas fa-volume-up'"></i>
              </div>

              <!-- 图片资源 -->
              <div v-if="item.resourceType === 'image'" class="media-image" :class="{ 'is-error': imageErrors[item.id] }">
                <img v-show="!imageErrors[item.id]" :src="item.resourceUrl" :alt="$t('pages.aiResourcePage.imageAlt')" loading="lazy" @error="imageErrors[item.id] = true" @click="previewImage(item.resourceUrl)" />
                <div v-show="imageErrors[item.id]" class="fallback-placeholder">
                  <i class="fas fa-image"></i>
                  <span>{{ $t('pages.aiResourcePage.resourceExpired') }}</span>
                </div>
              </div>

              <!-- 音频资源 -->
              <div v-else-if="item.resourceType === 'audio'" class="media-audio">
                <i class="fas fa-music audio-icon"></i>
                <audio :src="item.resourceUrl" controls class="custom-audio"></audio>
              </div>

              <div class="card-overlay">
                <button class="delete-btn" @click.stop="handleDelete(item.id)" :title="$t('pages.aiResourcePage.deleteTitle')">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>

            <div class="card-footer">
              <!-- 预留长标题或名称显示 -->
              <span class="time">{{ formatDate(item.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div class="load-more-wrapper" v-if="hasMore" ref="loadMoreRef">
        <button class="load-more-btn" @click="loadMore" :disabled="loading">
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          {{ loading ? $t('pages.aiResourcePage.loading') : $t('pages.aiResourcePage.loadMore') }}
        </button>
      </div>
    </div>

    <div v-else class="loading-state">
      <i class="fas fa-circle-notch fa-spin"></i>
      <p>{{ $t('pages.aiResourcePage.loading') }}</p>
    </div>

    <!-- 图片全屏预览 -->
    <ImagePreview
      v-model:visible="previewVisible"
      :images="previewImages"
      :initial-index="previewInitialIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { listMyAiResourceByPageUsingGet, deleteAiResourceUsingPost } from '@/api/aiResourceController'
import dayjs from 'dayjs'
import ImagePreview from '@/components/ImagePreview.vue'

const { t } = useI18n();

const loading = ref(false)
const resourceList = ref<any[]>([])
const hasMore = ref(false)
const imageErrors = ref<Record<string, boolean>>({})

const queryParams = ref({
  current: 1,
  pageSize: 12,
  resourceType: undefined as string | undefined
})

const windowWidth = ref(window.innerWidth)

const getColumnCount = () => {
  if (windowWidth.value >= 1200) return 4
  if (windowWidth.value >= 992) return 3
  if (windowWidth.value >= 768) return 2
  return 2 // 移动端也保持一行两列
}

const columns = computed(() => {
  const count = getColumnCount()
  const cols = Array.from({ length: count }, () => [] as any[])
  resourceList.value.forEach((item, index) => {
    cols[index % count].push(item)
  })
  return cols
})

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewInitialIndex = ref(0)

const fetchResources = async (isAppend = false) => {
  loading.value = true
  try {
    const res = await listMyAiResourceByPageUsingGet({
      current: queryParams.value.current,
      pageSize: queryParams.value.pageSize,
      resourceType: queryParams.value.resourceType
    })

    if (res.data?.code === 0) {
      const records = res.data.data?.records || []
      const total = res.data.data?.total || 0

      if (isAppend) {
        resourceList.value = [...resourceList.value, ...records]
      } else {
        resourceList.value = records
      }

      hasMore.value = resourceList.value.length < total
    } else {
      message.error('' + (res.data?.message || 'Error'))
    }
  } catch (err: any) {
    message.error('' + err.message)
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  if (loading.value || !hasMore.value) return
  queryParams.value.current += 1
  fetchResources(true)
}

const setFilter = (type?: string) => {
  if (queryParams.value.resourceType === type) return
  queryParams.value.resourceType = type
  queryParams.value.current = 1
  fetchResources(false)
}

const handleDelete = async (id: string) => {
  if (!confirm(t('pages.aiResourcePage.confirmDelete'))) return

  try {
    const res = await deleteAiResourceUsingPost({ id })
    if (res.data?.code === 0) {
      message.success(t('pages.aiResourcePage.deleteSuccess'))
      resourceList.value = resourceList.value.filter(item => item.id !== id)
    } else {
      message.error('' + res.data?.message)
    }
  } catch (err: any) {
    message.error('' + err.message)
  }
}

const formatDate = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const previewImage = (url: string) => {
  const images = resourceList.value
    .filter(item => item.resourceType === 'image')
    .map(item => item.resourceUrl)
  const index = images.indexOf(url)
  previewImages.value = images.length > 0 ? images : [url]
  previewInitialIndex.value = index >= 0 ? index : 0
  previewVisible.value = true
}

const loadMoreRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loading.value) {
      loadMore()
    }
  }, {
    root: null,
    rootMargin: '100px', // 提前 100px 触发加载
    threshold: 0.1
  })
}

// 监听 DOM 元素挂载
const observeElement = () => {
  if (observer && loadMoreRef.value) {
    observer.observe(loadMoreRef.value)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  fetchResources(false)
  setupObserver()
  // 稍微延迟一下等待第一次渲染完成
  setTimeout(observeElement, 500)
})

// 数据更新时也需要重新绑定观察者（因为 v-if 可能会销毁重建 DOM）
watch(hasMore, (newVal) => {
  if (newVal) {
    setTimeout(observeElement, 200)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped lang="less">
.ai-resource-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 60px 24px;
  min-height: calc(100vh - 64px);
  background: var(--background);
  color: var(--text-primary);
  transition: var(--theme-transition);

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-color);

    .header-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      position: relative;
      padding-left: 56px;

      .back-btn {
        position: absolute;
        left: 0;
        top: 2px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
        background: var(--card-background);
        color: var(--text-secondary);
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: var(--hover-background);
          color: var(--link-color);
          border-color: var(--link-color);
          transform: translateX(-2px);
        }
      }

      h2 {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 12px;
        i {
          color: var(--link-color);
        }
      }
      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 15px;
      }
    }

    .filter-tabs {
      display: flex;
      background: var(--hover-background);
      padding: 4px;
      border-radius: 12px;
      gap: 4px;

      button {
        border: none;
        background: transparent;
        padding: 8px 20px;
        border-radius: 8px;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          color: var(--text-primary);
        }

        &.active {
          background: var(--card-background);
          color: var(--link-color);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
      }
    }
  }

  .resource-masonry {
    display: flex;
    gap: 24px;
    width: 100%;
    align-items: flex-start;
  }

  .masonry-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }

  .resource-card {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px var(--shadow-color);
      border-color: var(--link-color);

      .card-overlay {
        opacity: 1;
      }
    }

    .card-media {
      position: relative;
      background: var(--hover-background);
      overflow: hidden;

      .resource-type-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        font-size: 14px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);

        &.image {
          background: rgba(59, 130, 246, 0.85);
          backdrop-filter: blur(4px);
          color: #fff;
        }
        &.audio {
          background: rgba(16, 185, 129, 0.85);
          backdrop-filter: blur(4px);
          color: #fff;
        }
      }

      .media-image {
        width: 100%;
        display: block;
        cursor: zoom-in;
        min-height: 150px;
        background: var(--hover-background);

        &.is-error {
          cursor: default;
        }

        img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.5s;
        }
        &:hover img {
          transform: scale(1.05);
        }

        .fallback-placeholder {
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          gap: 12px;

          i {
            font-size: 32px;
            opacity: 0.4;
          }
          span {
            font-size: 13px;
          }
        }
      }

      .media-audio {
        width: 100%;
        height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));

        .audio-icon {
          font-size: 48px;
          color: var(--link-color);
          opacity: 0.8;
        }

        .custom-audio {
          width: 85%;
          height: 40px;
          border-radius: 20px;
          outline: none;
        }
      }

      .card-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 12px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);
        opacity: 0;
        transition: opacity 0.3s;
        display: flex;
        justify-content: flex-end;

        .delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: #ff4d4f;
            transform: scale(1.1);
          }
        }
      }
    }

    .card-footer {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      word-wrap: break-word;
      word-break: break-all;
      white-space: normal;

      .time {
        font-size: 13px;
        color: var(--text-tertiary);
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    color: var(--text-secondary);

    i {
      font-size: 64px;
      margin-bottom: 24px;
      opacity: 0.5;
    }
    p {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px;
      color: var(--text-primary);
    }
    .empty-hint {
      font-size: 14px;
      opacity: 0.8;
    }
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 0;
    color: var(--link-color);

    i {
      font-size: 40px;
      margin-bottom: 16px;
    }
    p {
      color: var(--text-secondary);
      font-size: 15px;
    }
  }

  .load-more-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 40px;

    .load-more-btn {
      padding: 12px 32px;
      background: var(--card-background);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 24px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;

      &:hover:not(:disabled) {
        border-color: var(--link-color);
        color: var(--link-color);
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }


}

@media (max-width: 768px) {
  .ai-resource-page {
    padding: 16px 8px 60px 8px;

    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 0;
      margin-bottom: 16px;

      .header-content h2 {
        font-size: 24px;
      }

      .filter-tabs {
        width: 100%;
        button {
          flex: 1;
        }
      }
    }

    .resource-masonry {
      gap: 8px;
    }

    .masonry-column {
      gap: 8px;
    }
  }
}
</style>
