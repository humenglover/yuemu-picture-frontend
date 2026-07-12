<template>
  <div class="yuemu-browse-history-page">
    <div class="yuemu-page-container">

      <div class="yuemu-page-header">
        <h1 class="yuemu-header-title">{{ $t('pages.browseHistoryPage.title') }}</h1>
        <div class="yuemu-header-actions">
          <button
            class="yuemu-delete-selected-btn"
            @click="deleteSelected"
            :class="{ 'is-disabled': selectedIds.length === 0 }"
          >
            <i class="fas fa-trash-alt"></i> {{ $t('pages.browseHistoryPage.deleteSelected') }}
          </button>
        </div>
      </div>

      <div class="yuemu-filter-bar">
        <div class="yuemu-filter-tabs">
          <div
            class="yuemu-filter-tab"
            :class="{ active: activeFilter === 'all' }"
            @click="changeFilter('all')"
          >{{ $t('pages.browseHistoryPage.allTraces') }}</div>
          <div
            class="yuemu-filter-tab"
            :class="{ active: activeFilter === 'image' }"
            @click="changeFilter('image')"
          >{{ $t('pages.browseHistoryPage.pictures') }}</div>
          <div
            class="yuemu-filter-tab"
            :class="{ active: activeFilter === 'post' }"
            @click="changeFilter('post')"
          >{{ $t('pages.browseHistoryPage.posts') }}</div>
        </div>
        <button class="yuemu-refresh-btn" @click="refreshList" :title="$t('pages.browseHistoryPage.refresh')">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading && searchParams.current === 1 }"></i>
        </button>
      </div>

      <div class="yuemu-history-grid" ref="gridRef">

        <div class="yuemu-empty-state" v-if="!loading && filteredList.length === 0">
          <div class="yuemu-empty-icon">
            <i class="fas fa-history"></i>
          </div>
          <p class="yuemu-empty-text">{{ $t('pages.browseHistoryPage.emptyTitle') }}</p>
          <p class="yuemu-empty-desc">{{ $t('pages.browseHistoryPage.emptyDesc') }}</p>
        </div>

        <template v-if="loading && filteredList.length === 0">
          <div class="yuemu-history-card skeleton" v-for="i in 8" :key="`skel-${i}`">
            <div class="yuemu-card-cover yuemu-skeleton-anim" style="height: 200px;"></div>
            <div class="yuemu-card-info">
              <div class="yuemu-skeleton-line long yuemu-skeleton-anim"></div>
              <div class="yuemu-info-footer">
                <div class="yuemu-skeleton-avatar yuemu-skeleton-anim"></div>
                <div class="yuemu-skeleton-line short yuemu-skeleton-anim" style="margin:0;"></div>
              </div>
            </div>
          </div>
        </template>

        <div
          class="yuemu-history-card"
          v-for="record in filteredList"
          :key="record.id"
          :class="{ 'is-selected': selectedIds.includes(record.id as string) }"
          @click="handleCardClick(record)"
        >
          <div class="yuemu-card-checkbox" @click.stop="toggleSelect(record.id as string)">
            <i class="fas fa-check" v-show="selectedIds.includes(record.id as string)"></i>
          </div>

          <div class="yuemu-card-cover">
            <div class="yuemu-thumb-placeholder yuemu-skeleton-anim" v-show="!loadedCovers[record.id as string]"></div>

            <img
              class="yuemu-cover-image"
              :class="{ 'is-loaded': loadedCovers[record.id as string] }"
              :src="getRecordCover(record)"
              :alt="record.targetTitle || $t('pages.browseHistoryPage.title')"
              @load="onCoverLoad(record.id as string)"
              @error="onCoverError(record)"
            />

            <div class="yuemu-cover-overlay">
              <div class="yuemu-type-label">
                <i class="fas" :class="record.targetType === 1 ? 'fa-image' : 'fa-file-alt'"></i>
                {{ record.targetType === 1 ? $t('pages.browseHistoryPage.pictures') : $t('pages.browseHistoryPage.posts') }}
              </div>
              <div class="yuemu-duration-label" v-if="record.viewDuration">
                <i class="fas fa-stopwatch"></i> {{ formatDuration(record.viewDuration) }}
              </div>
            </div>
          </div>

          <div class="yuemu-card-info">
            <h3 class="yuemu-content-title" :title="record.targetTitle || $t('pages.browseHistoryPage.untitled')">
              {{ record.targetTitle || $t('pages.browseHistoryPage.untitled') }}
            </h3>

            <div class="yuemu-info-footer">
              <div class="yuemu-author-info">
                <img
                  class="yuemu-author-avatar"
                  :src="getAuthorAvatar(record)"
                  :alt="$t('pages.browseHistoryPage.author')"
                  @error="handleAvatarError($event, record)"
                />
                <span class="yuemu-author-name">{{ record.targetAuthorUsername || $t('pages.browseHistoryPage.anonymous') }}</span>
              </div>
              <span class="yuemu-view-time">{{ formatTime(record.createTime) }}</span>
            </div>
          </div>

          <button class="yuemu-card-delete-btn" @click.stop="deleteRecord(record.id as string)" :title="$t('pages.browseHistoryPage.clearRecord')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <div class="yuemu-load-more-area" ref="loadMoreRef" v-if="filteredList.length > 0">
        <div v-if="loading" class="yuemu-loading-more">
          <i class="fas fa-circle-notch fa-spin"></i> <span>{{ $t('pages.browseHistoryPage.loading') }}</span>
        </div>
        <div v-else-if="!hasMore" class="yuemu-no-more">
          - 所有的历史都在这里了 -
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n';
import { listMyViewRecordByPageUsingPost, deleteViewRecordUsingPost } from '@/api/viewRecordController';
import { getDefaultAvatar } from '@/utils/userUtils';
import { formatTime } from '@/utils/dateUtils';
import { getTextCover } from '@/utils/textCoverGenerator';

interface ViewRecordVO {
  id?: string;
  userId?: string;
  targetId?: string;
  targetType?: number;
  viewDuration?: number;
  createTime?: string;
  targetTitle?: string;
  targetCover?: string;
  targetAuthorUsername?: string;
  targetAuthorAvatar?: string;
}

const router = useRouter()
const { t } = useI18n();

const loading = ref(false);
const hasMore = ref(true);
const selectedIds = ref<string[]>([]);
const viewRecordList = ref<ViewRecordVO[]>([]);
const activeFilter = ref('all');
const gridRef = ref(null);
const loadMoreRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

// ==========================================
// 核心修复：独立维护封面图的加载状态，杜绝响应式丢失
// ==========================================
const loadedCovers = ref<Record<string, boolean>>({});

const onCoverLoad = (id: string) => {
  loadedCovers.value[id] = true;
};

const onCoverError = (record: ViewRecordVO) => {
  if (record.id) {
    loadedCovers.value[record.id] = true; // 即便报错，也要关掉骨架屏
  }
  record.targetCover = getDefaultAvatar(record.targetTitle || 'Unknown Content');
  if (record.targetTitle && record.id && !loadingCovers.value.has(record.id)) {
    generateTextCoverForRecord(record);
  }
};

const textCoverCache = ref<Record<string, string>>({});
const loadingCovers = ref(new Set());

const searchParams = reactive({
  current: 1,
  pageSize: 20,
  targetType: null as number | null,
});

const filteredList = computed(() => {
  if (activeFilter.value === 'all') return viewRecordList.value;
  if (activeFilter.value === 'image') return viewRecordList.value.filter(item => item.targetType === 1);
  if (activeFilter.value === 'post') return viewRecordList.value.filter(item => item.targetType === 2);
  return viewRecordList.value;
});

const fetchViewRecords = async (loadMore = false) => {
  if (loading.value) return;
  try {
    loading.value = true;
    const response = await listMyViewRecordByPageUsingPost({
      current: searchParams.current,
      pageSize: searchParams.pageSize,
      targetType: searchParams.targetType || undefined,
    });
    if (response.data.code === 0 && response.data) {
      const newRecords = response.data.data.records || [];

      viewRecordList.value = loadMore
        ? [...viewRecordList.value, ...newRecords]
        : newRecords;

      const total = response.data.data.total || 0;
      hasMore.value = viewRecordList.value.length < total;

      nextTick(() => {
        newRecords.forEach((record: any) => {
          if (!record.targetCover && record.targetTitle) {
            generateTextCoverForRecord(record);
          }
        });
      });
    } else {
      if (!loadMore) {
        viewRecordList.value = [];
        hasMore.value = false;
      }
    }
  } catch (error: any) {
    if (!loadMore) { viewRecordList.value = []; hasMore.value = false; }
  } finally {
    loading.value = false;
  }
};

const refreshList = () => {
  searchParams.current = 1;
  selectedIds.value = [];
  fetchViewRecords();
};

const loadMoreRecords = () => {
  if (!hasMore.value || loading.value) return;
  searchParams.current += 1;
  fetchViewRecords(true);
};

const deleteRecord = async (id: string) => {
  try {
    const response = await deleteViewRecordUsingPost([id.toString()]);
    if (response.data.code === 0) {
      viewRecordList.value = viewRecordList.value.filter(item => item.id !== id);
      selectedIds.value = selectedIds.value.filter(item => item !== id);
    }
  } catch (error: any) {}
};

const deleteSelected = async () => {
  if (selectedIds.value.length === 0) return;
  try {
    const response = await deleteViewRecordUsingPost(selectedIds.value.map(id => id.toString()));
    if (response.data.code === 0) {
      viewRecordList.value = viewRecordList.value.filter(
        item => !selectedIds.value.includes(item.id!)
      );
      selectedIds.value = [];
    }
  } catch (error: any) {}
};

const toggleSelect = (id: string) => {
  const index = selectedIds.value.indexOf(id);
  index > -1 ? selectedIds.value.splice(index, 1) : selectedIds.value.push(id);
};

const changeFilter = (type: string) => {
  activeFilter.value = type;
  if (type === 'image') searchParams.targetType = 1;
  else if (type === 'post') searchParams.targetType = 2;
  else searchParams.targetType = null;
  searchParams.current = 1;
  fetchViewRecords();
};

const handleCardClick = (record: ViewRecordVO) => {
  if (!record.targetId) return;
  router.push(record.targetType === 1 ? `/picture-redirect/${record.targetId}` : `/post/${record.targetId}`);
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m${secs}s`;
};

const handleAvatarError = (e: Event, record: ViewRecordVO) => {
  const target = e.target as HTMLImageElement;
  target.src = getDefaultAvatar(record.targetAuthorUsername || 'Unknown User');
};

const getAuthorAvatar = (record: ViewRecordVO) => {
  if (record.targetAuthorAvatar) return record.targetAuthorAvatar;
  return getDefaultAvatar(record.targetAuthorUsername || 'Unknown User');
};

// ==========================================
// 修复生成封面时也要触发布尔状态
// ==========================================
const generateTextCoverForRecord = async (record: ViewRecordVO) => {
  if (!record.targetTitle || !record.id || loadingCovers.value.has(record.id)) return;

  const cacheKey = `text_cover_${record.id}_${record.targetTitle}`;
  if (textCoverCache.value[cacheKey]) {
    record.targetCover = textCoverCache.value[cacheKey];
    loadedCovers.value[record.id] = true;
    return;
  }

  try {
    loadingCovers.value.add(record.id);
    const cover = await getTextCover(record.targetTitle, 300, 400);
    textCoverCache.value[cacheKey] = cover;
    record.targetCover = cover;
    loadedCovers.value[record.id] = true; // 生成成功强制关闭骨架图
  } catch (error) {
    record.targetCover = getDefaultAvatar(record.targetTitle || 'Unknown Content');
    loadedCovers.value[record.id] = true; // 生成失败也要关闭骨架图
  } finally {
    loadingCovers.value.delete(record.id);
  }
};

const getRecordCover = (record: ViewRecordVO) => {
  if (record.targetCover) return record.targetCover;
  if (record.targetTitle) {
    const cacheKey = `text_cover_${record.id}_${record.targetTitle}`;
    if (textCoverCache.value[cacheKey]) return textCoverCache.value[cacheKey];
    generateTextCoverForRecord(record);
  }
  return getDefaultAvatar(record.targetTitle || 'Unknown Content');
};

const setupIntersectionObserver = () => {
  if (observer) observer.disconnect();
  if (!loadMoreRef.value) return;

  observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry.isIntersecting && hasMore.value && !loading.value) {
      loadMoreRecords();
    }
  }, { rootMargin: '100px', threshold: 0.1 });

  observer.observe(loadMoreRef.value);
};

onMounted(() => { fetchViewRecords(); });

watch(() => loadMoreRef.value, (newVal) => {
  if (newVal) nextTick(() => setupIntersectionObserver());
}, { immediate: true });

watch(() => filteredList.value.length, () => {
  nextTick(() => { if (loadMoreRef.value && !observer) setupIntersectionObserver(); });
});

onUnmounted(() => { if (observer) { observer.disconnect(); observer = null; } });
</script>

<style scoped lang="scss">
/* ================= 全局容器与重置 ================= */
.yuemu-browse-history-page {
  width: 100%; min-height: 100vh;
  background-color: var(--background, #f5f5f5);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
}

.yuemu-page-container {
  max-width: 1400px; margin: 0 auto; padding: 24px;
  @media (max-width: 768px) { padding: 16px 6px; }
}

/* ================= 头部导航与动作栏 ================= */
.yuemu-page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px;
}
.yuemu-header-title {
  font-size: 24px; font-weight: 700; margin: 0; color: var(--text-primary); letter-spacing: 0.5px;
  @media (max-width: 768px) { font-size: 20px; }
}

.yuemu-delete-selected-btn {
  padding: 8px 16px; border: none; border-radius: 20px; font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s;
  background-color: rgba(239, 68, 68, 0.1); color: #ef4444;
}
.yuemu-delete-selected-btn:not(.is-disabled):hover { background-color: #ef4444; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
.yuemu-delete-selected-btn.is-disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }

/* ================= 筛选工具栏 ================= */
.yuemu-filter-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; padding: 12px 20px;
  background: var(--card-background); border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid var(--border-color);
}

.yuemu-filter-tabs { display: flex; gap: 24px; }
.yuemu-filter-tab {
  font-size: 15px; font-weight: 500; color: var(--text-secondary); cursor: pointer;
  position: relative; padding: 4px 0; transition: color 0.2s;
}
.yuemu-filter-tab.active { color: #1677ff; font-weight: 600; }
.yuemu-filter-tab.active::after {
  content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 16px; height: 3px; background-color: #1677ff; border-radius: 2px;
}
.yuemu-filter-tab:hover:not(.active) { color: var(--text-primary); }

.yuemu-refresh-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--hover-background);
  color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; font-size: 14px;
}
.yuemu-refresh-btn:hover { background: #1677ff; color: #fff; transform: rotate(30deg); }

/* ================= 高级自适应瀑布流网格 ================= */
.yuemu-history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px; margin-bottom: 30px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
}

/* ================= 历史卡片设计 ================= */
.yuemu-history-card {
  background: var(--card-background); border-radius: 16px; overflow: hidden;
  position: relative; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  display: flex; flex-direction: column;
}
.yuemu-history-card:not(.skeleton):hover {
  transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); border-color: transparent;
}

/* 选中高亮态 */
.yuemu-history-card.is-selected {
  border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

/* 勾选框 - 隐藏在左上，极简交互 */
.yuemu-card-checkbox {
  position: absolute; top: 12px; left: 12px; z-index: 10;
  width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.25); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; transition: 0.2s;
}
.yuemu-history-card.is-selected .yuemu-card-checkbox {
  background: #1677ff; border-color: #1677ff;
}
.yuemu-card-checkbox i { color: #fff; font-size: 12px; }

/* 封面区 */
.yuemu-card-cover {
  position: relative; width: 100%; aspect-ratio: 4/3;
  background: var(--hover-background); overflow: hidden;
  @media (max-width: 600px) { aspect-ratio: 0.85/1; }
}

/* 骨架底座，真实图片加载后消失 */
.yuemu-thumb-placeholder { position: absolute; inset: 0; z-index: 1; }
.yuemu-cover-image {
  width: 100%; height: 100%; object-fit: cover; display: block;
  opacity: 0; transition: opacity 0.4s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative; z-index: 2;
}
.yuemu-cover-image.is-loaded { opacity: 1; }
.yuemu-history-card:not(.skeleton):hover .yuemu-cover-image { transform: scale(1.05); }

/* 封面内的悬浮标签 */
.yuemu-cover-overlay {
  position: absolute; inset: 0; pointer-events: none; z-index: 3;
  display: flex; flex-direction: column; justify-content: space-between; padding: 12px;
}
.yuemu-type-label {
  align-self: flex-end;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); color: #fff;
  padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 500; display: flex; gap: 4px; align-items: center;
}
.yuemu-duration-label {
  align-self: flex-end; margin-top: auto;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); color: #fff;
  padding: 4px 8px; border-radius: 8px; font-size: 11px; display: flex; gap: 4px; align-items: center;
}

/* 信息内容区 */
.yuemu-card-info { padding: 14px; flex: 1; display: flex; flex-direction: column; }
.yuemu-content-title {
  font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 12px 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;
}

.yuemu-info-footer {
  display: flex; justify-content: space-between; align-items: center; margin-top: auto;
}
.yuemu-author-info { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.yuemu-author-avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border-color); }
.yuemu-author-name { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.yuemu-view-time { font-size: 11px; color: var(--text-secondary); opacity: 0.8; font-family: monospace; }

/* 悬浮删除按钮 */
.yuemu-card-delete-btn {
  position: absolute; bottom: 12px; right: 12px; z-index: 10;
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: rgba(255, 255, 255, 0.9); color: #ef4444; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex; align-items: center; justify-content: center; font-size: 13px;
  cursor: pointer; opacity: 0; transform: translateY(10px); transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.yuemu-history-card:not(.skeleton):hover .yuemu-card-delete-btn { opacity: 1; transform: translateY(0); }
.yuemu-card-delete-btn:hover { background: #ef4444; color: #fff; }

/* ================= 空状态与加载动画 ================= */
.yuemu-empty-state {
  grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 100px 20px; color: var(--text-secondary); background: var(--card-background); border-radius: 16px; border: 1px dashed var(--border-color);
}
.yuemu-empty-icon { font-size: 48px; margin-bottom: 20px; opacity: 0.3; color: var(--text-secondary); }
.yuemu-empty-text { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px 0; }
.yuemu-empty-desc { font-size: 14px; opacity: 0.8; }

.yuemu-load-more-area {
  display: flex; justify-content: center; align-items: center; padding: 30px 0; color: var(--text-secondary); font-size: 14px;
}
.yuemu-loading-more { display: flex; align-items: center; gap: 8px; color: #1677ff; font-weight: 500;}
.yuemu-no-more { opacity: 0.5; letter-spacing: 2px; }

/* ====== 骨架屏 ====== */
@keyframes yuemuShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.yuemu-skeleton-anim {
  background: linear-gradient(90deg, var(--hover-background) 25%, var(--border-color) 50%, var(--hover-background) 75%);
  background-size: 400% 100%; animation: yuemuShimmer 1.5s infinite ease-in-out; border-radius: inherit;
}
.yuemu-skeleton-line { height: 16px; border-radius: 4px; margin-bottom: 12px; }
.yuemu-skeleton-line.long { width: 80%; }
.yuemu-skeleton-line.short { width: 40%; }
.yuemu-skeleton-avatar { width: 22px; height: 22px; border-radius: 50%; }

/* 深色模式兼容 */
@media (prefers-color-scheme: dark) { .yuemu-browse-history-page .yuemu-skeleton-anim {
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 400% 100%;
} }
@media (prefers-color-scheme: dark) { .yuemu-history-card { background: #1e1e1e; border-color: rgba(255,255,255,0.05); } }
@media (prefers-color-scheme: dark) { .yuemu-filter-bar { background: #1a1a1a; } }
</style>
