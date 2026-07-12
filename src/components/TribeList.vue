<template>
  <div class="yuemu-tribe-list-container" ref="containerRef" @scroll="handleScroll">
    <div class="yuemu-public-spaces-header">
      <h3 class="yuemu-public-spaces-title">{{ t('components.tribeList.allTribes') }}</h3>
      <div class="yuemu-header-actions">
        <!-- 排序选择器 -->
        <a-dropdown placement="bottomRight" :trigger="['click']">
          <div class="yuemu-sort-selector">
            <span>{{ sortOptions.find(o => o.value === currentSort)?.label || t('components.tribeList.latestActive') }}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <template #overlay>
            <a-menu @click="handleSortChange" :selectedKeys="[currentSort]">
              <a-menu-item v-for="opt in sortOptions" :key="opt.value">
                {{ opt.label }}
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        
        <!-- 视图切换器 -->
        <div class="yuemu-view-toggles">
          <button 
            class="yuemu-toggle-btn" 
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            :title="t('components.tribeList.gridView')"
          >
            <i class="fas fa-th-large"></i>
          </button>
          <button 
            class="yuemu-toggle-btn" 
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            :title="t('components.tribeList.listView')"
          >
            <i class="fas fa-list"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="yuemu-public-spaces-wrapper" :class="`is-${viewMode}-view`">
      <div class="yuemu-public-spaces-grid">
        <div class="yuemu-masonry-column" v-for="(col, colIndex) in masonryColumns" :key="`col-${colIndex}`">
          <TeamSpaceCard
            v-for="space in col"
            :key="`public-${space.id}`"
            :space="space as API.SpaceVO"
          />
          
          <!-- 完美融入瀑布流底部的骨架屏：首屏显示3个，触底追加显示1个 -->
          <template v-if="loadingPublic">
            <div class="yuemu-skeleton-card" v-for="i in (isFirstLoad ? 3 : 1)" :key="`skel-${colIndex}-${i}`">
              <div class="yuemu-skeleton-cover"></div>
              <div class="yuemu-skeleton-content">
                <div class="yuemu-skeleton-title"></div>
                <div class="yuemu-skeleton-desc"></div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 状态提示放在独立容器中 -->
      <div class="yuemu-status-zone" v-if="isPublicSpacesLoaded && !publicHasMore && publicSpaces.length > 0">
        <div class="yuemu-list-bottom-tip">
          <div class="yuemu-tip-line">
            <span class="yuemu-line"></span>
            <span class="yuemu-text">{{ t('components.tribeList.reachedBottom') }}</span>
            <span class="yuemu-line"></span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isPublicSpacesLoaded && publicSpaces.length === 0 && !loadingPublic" class="yuemu-empty-state">
      <div class="yuemu-empty-icon">
        <svg viewBox="0 0 24 24" class="yuemu-empty-svg">
          <path fill="#2563eb" d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
        </svg>
      </div>
      <h3>{{ t('components.tribeList.noPublicTribes') }}</h3>
      <p>{{ t('components.tribeList.noPublicTribesDesc') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import TeamSpaceCard from '@/components/TeamSpaceCard.vue';
import { listSpaceVoByPageUsingPost, listRecommendedSpacesUsingGet } from '@/api/spaceController';
import { throttle } from 'lodash-es';

// 视图与排序状态
const viewMode = ref<'grid'|'list'>('grid');
const currentSort = ref('updateTime_desc');

const sortOptions = [
  { label: t('components.tribeList.latestActive'), value: 'updateTime_desc' },
  { label: t('components.tribeList.latestCreated'), value: 'createTime_desc' },
  { label: t('components.tribeList.hotTribes'), value: 'totalCount_desc' }
];

const handleSortChange = ({ key }: { key: string }) => {
  currentSort.value = key;
  getPublicSpaces(true);
};

const recommendedSpaces = ref<API.SpaceVO[]>([]);
const loadingRecommended = ref(false);

const publicSpaces = ref<API.SpaceVO[]>([]);
const loadingPublic = ref(false);
const currentPage = ref(1);
const publicHasMore = ref(true);
const isPublicSpacesLoaded = ref(false);
const isFirstLoad = ref(true);
const containerRef = ref<HTMLDivElement | null>(null);
const loadMoreThreshold = ref(200);

const handleScrollThrottled = throttle(handleScroll, 200);

const getRecommendedSpaces = async () => {
  if (loadingRecommended.value) return;
  try {
    loadingRecommended.value = true;
    const res = await listRecommendedSpacesUsingGet();
    if (res.data.code === 0) {
      recommendedSpaces.value = res.data.data || [];
    }
  } catch (error) {
    console.error(t('components.tribeList.fetchRecommendedTribesFailedColon'), error);
  } finally {
    loadingRecommended.value = false;
  }
};

const getPublicSpaces = async (isRefresh = false) => {
  if (loadingPublic.value || (!isRefresh && !publicHasMore.value)) return;
  try {
    loadingPublic.value = true;
    if (isRefresh) {
      currentPage.value = 1;
      publicSpaces.value = [];
      publicHasMore.value = true;
      isFirstLoad.value = true;
    }

    // 解析排序字段
    let sortField = 'updateTime';
    let sortOrder = 'descend';
    if (currentSort.value) {
      const parts = currentSort.value.split('_');
      sortField = parts[0];
      sortOrder = parts[1] === 'desc' ? 'descend' : 'ascend';
    }

    const res = await listSpaceVoByPageUsingPost({
      current: currentPage.value,
      pageSize: 10,
      spaceType: 1,
      sortField,
      sortOrder,
    });

    if (res.data.code === 0 && res.data.data) {
      const { records, total, hasMore } = res.data.data;
      const newRecords = records || [];
      if (isRefresh) {
        publicSpaces.value = newRecords;
      } else {
        publicSpaces.value = [...publicSpaces.value, ...newRecords];
      }
      const totalPages = total ? Math.ceil(total / 10) : 0;
      publicHasMore.value = currentPage.value < totalPages;
      if (hasMore !== undefined) publicHasMore.value = hasMore;
      if (isRefresh) {
        isPublicSpacesLoaded.value = true;
        isFirstLoad.value = false;
      }
    } else {
      if (isRefresh) {
        publicSpaces.value = [];
        isPublicSpacesLoaded.value = true;
        isFirstLoad.value = false;
      }
      publicHasMore.value = false;
    }
  } catch (error) {
    console.error(t('components.tribeList.fetchPublicTribesFailedColon'), error);
    if (isRefresh) {
      publicSpaces.value = [];
      isPublicSpacesLoaded.value = true;
      isFirstLoad.value = false;
    }
    publicHasMore.value = false;
  } finally {
    loadingPublic.value = false;
  }
};

const loadMorePublicSpaces = async () => {
  if (loadingPublic.value || !publicHasMore.value) return;
  currentPage.value++;
  await getPublicSpaces(false);
};

function handleScroll() {
  if (!containerRef.value) return;
  const container = containerRef.value;
  const { scrollTop, scrollHeight, clientHeight } = container;
  const isReachBottom = scrollTop + clientHeight + loadMoreThreshold.value >= scrollHeight;
  if (isReachBottom && !loadingPublic.value && publicHasMore.value && isPublicSpacesLoaded.value) {
    loadMorePublicSpaces();
  }
}

const refresh = async () => {
  await getPublicSpaces(true);
};

// 瀑布流列数动态计算
const numCols = ref(3);

const updateNumCols = () => {
  if (viewMode.value === 'list') {
    numCols.value = 1;
    return;
  }
  const width = containerRef.value ? containerRef.value.clientWidth : window.innerWidth;
  if (width <= 640) {
    numCols.value = 1;
  } else if (width <= 1024) {
    numCols.value = 2;
  } else {
    numCols.value = 3;
  }
};

watch(viewMode, () => {
  updateNumCols();
});

// 将数据分发到各个列中，实现从左到右、从上到下的顺序
const masonryColumns = computed(() => {
  const cols: API.SpaceVO[][] = Array.from({ length: numCols.value }, () => []);
  publicSpaces.value.forEach((space, index) => {
    cols[index % numCols.value].push(space);
  });
  return cols;
});

const initScrollListener = () => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScrollThrottled);
    // 监听容器宽度变化
    window.addEventListener('resize', updateNumCols);
    updateNumCols();
  }
};

const removeScrollListener = () => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScrollThrottled);
  }
  window.removeEventListener('resize', updateNumCols);
  handleScrollThrottled.cancel();
};

const init = async () => {
  await Promise.all([
    getRecommendedSpaces(),
    getPublicSpaces(true)
  ]);
  nextTick(() => {
    initScrollListener();
  });
};

defineExpose({
  init,
  refresh,
  loadMorePublicSpaces
});

onMounted(() => {
  init();
});

onUnmounted(() => {
  removeScrollListener();
});
</script>

<style scoped>
.yuemu-tribe-list-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--card-background);
  position: relative;
  
  /* 隐藏原生滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.yuemu-tribe-list-container::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.yuemu-public-spaces-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 16px 0;
  padding: 0 4px;
}

.yuemu-public-spaces-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.yuemu-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.yuemu-sort-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(0,0,0,0.06));
  background: var(--card-background);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.yuemu-sort-selector:hover {
  background: var(--hover-background);
}

.yuemu-sort-selector i {
  font-size: 10px;
  color: var(--text-secondary);
}

.yuemu-view-toggles {
  display: flex;
  align-items: center;
  gap: 4px;
}

.yuemu-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--hover-background);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.yuemu-toggle-btn:hover {
  background: rgba(0,0,0,0.06);
}

[data-theme='dark'] .yuemu-toggle-btn:hover {
  background: rgba(255,255,255,0.08);
}

.yuemu-toggle-btn.active {
  background: #eef2ff;
  color: #3b82f6;
}

[data-theme='dark'] .yuemu-toggle-btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.yuemu-public-spaces-wrapper {
  display: flex;
  flex-direction: column;
  min-height: calc(100% - 40px);
}

.yuemu-public-spaces-grid {
  display: flex;
  gap: 16px;
  align-items: flex-start; /* 防止列被拉伸等高 */
}

.yuemu-masonry-column {
  flex: 1;
  min-width: 0; /* 防止内容溢出撑开 */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.yuemu-status-zone {
  margin-top: 16px;
  padding-bottom: 24px;
}

.yuemu-loading-state,
.yuemu-loading-placeholder {
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding: 20px 0;
}

.yuemu-loading-item {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--card-background);
}

.yuemu-skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  background: var(--card-background);
  border-radius: 16px;
  padding: 16px;
  border: 1px dashed var(--border-color);
  box-shadow: 0 4px 16px rgba(0,0,0,0.02);
}

.yuemu-skeleton-cover {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: yuemu-loading 1.5s infinite;
}

[data-theme='dark'] .yuemu-skeleton-cover,
[data-theme='dark'] .yuemu-skeleton-title,
[data-theme='dark'] .yuemu-skeleton-desc {
  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
  background-size: 200% 100%;
}

.yuemu-skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.yuemu-skeleton-title {
  width: 70%;
  height: 20px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: yuemu-loading 1.5s infinite;
}

.yuemu-skeleton-desc {
  width: 90%;
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: yuemu-loading 1.5s infinite;
}

@keyframes yuemu-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.yuemu-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  grid-column: 1 / -1;
}

.yuemu-empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 8px;
}

.yuemu-empty-svg {
  width: 100%;
  height: 100%;
}

.yuemu-empty-state h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: var(--text-primary);
}

.yuemu-empty-state p {
  margin: 0;
  font-size: 14px;
}

.yuemu-list-bottom-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  color: var(--text-secondary);
  grid-column: 1 / -1;
}

.yuemu-tip-line {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.yuemu-line {
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.yuemu-text {
  white-space: nowrap;
  padding: 0 12px;
  font-size: 14px;
}
</style>
