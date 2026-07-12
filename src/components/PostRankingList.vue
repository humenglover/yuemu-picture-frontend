<template>
  <div class="yuemu-article-ranking-waterfall">
    <div v-if="loading && (!dataList || dataList.length === 0)" class="yuemu-masonry-grid">
      <div v-for="colIndex in columnCount" :key="'skeleton-col-' + colIndex" class="yuemu-masonry-column">
        <div v-for="itemIndex in 3" :key="'skeleton-item-' + itemIndex" class="yuemu-ranking-item yuemu-skeleton-card">
          <div class="yuemu-note-card">
            <div class="yuemu-aspect-ratio-box yuemu-skeleton-anim" :style="{ paddingTop: `${getRandomPaddingTop()}%` }"></div>
            <div class="yuemu-note-info">
              <div class="yuemu-skeleton-line yuemu-long yuemu-skeleton-anim"></div>
              <div class="yuemu-skeleton-line yuemu-short yuemu-skeleton-anim" style="margin-bottom: 12px;"></div>
              <div class="yuemu-post-meta">
                <div class="yuemu-author-section">
                  <div class="yuemu-skeleton-avatar yuemu-skeleton-anim"></div>
                  <div class="yuemu-skeleton-line yuemu-short yuemu-skeleton-anim" style="margin-bottom: 0; width: 60px;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="dataList && dataList.length > 0" class="yuemu-masonry-grid" ref="gridRef">
      <div
        v-for="(column, colIndex) in masonryColumns"
        :key="colIndex"
        class="yuemu-masonry-column"
      >
        <div
          v-for="item in column"
          :key="item.id"
          class="yuemu-ranking-item"
          @click="goToPostDetail(item.id)"
        >
          <div class="yuemu-note-card">
            <div class="yuemu-note-image-wrapper">
              <div class="yuemu-aspect-ratio-box" :style="{ paddingTop: `${getPaddingTop(item)}%` }">
                <div class="yuemu-rank-badge" :class="item._rankIndex < 3 ? `yuemu-top-${item._rankIndex + 1}` : 'yuemu-top-other'">
                  <CrownOutlined class="yuemu-badge-icon" v-if="item._rankIndex < 3" />
                  <span class="rank-num">{{ item._rankIndex + 1 }}</span>
                </div>
                <template v-if="item.coverUrl">
                  <div class="yuemu-thumb-placeholder yuemu-skeleton-anim" v-show="!loadedImages[item.id]"></div>
                  <img
                    :src="item.coverUrl"
                    :alt="item.title"
                    class="yuemu-note-image yuemu-real-img"
                    :class="{ 'yuemu-is-loaded': loadedImages[item.id] }"
                    loading="lazy"
                    @load="onImageLoad(item, $event)"
                    @error="onImageLoad(item, $event)"
                  />
                </template>
                <div v-else class="yuemu-text-cover-placeholder">
                  <FileTextOutlined class="yuemu-placeholder-icon" />
                  <span class="yuemu-placeholder-text">{{ t('components.postRankingList.plainTextThinking') }}</span>
                </div>
              </div>
            </div>
            <div class="yuemu-note-info">
              <div class="yuemu-note-title">
                <span class="yuemu-category-tag" v-if="item.category">#{{ item.category }}</span>
                {{ item.title || t('components.postRankingList.untitledThought') }}
              </div>
              <div class="yuemu-post-meta">
                <div class="yuemu-author-section" @click.stop="goToUserPage(item.userId)">
                  <img
                    class="yuemu-author-avatar"
                    :src="item.user?.userAvatar || getDefaultAvatar(item.user?.userName)"
                    :alt="item.user?.userName"
                  />
                  <span class="yuemu-author-name">{{ item.user?.userName || t('components.postRankingList.mysteryVisitor') }}</span>
                </div>
                <div class="yuemu-stats-section">
                  <span class="yuemu-stat-item" :title="t('components.postRankingList.viewCount')"><EyeOutlined /> {{ formatNumber(item.viewCount) }}</span>
                  <span class="yuemu-stat-item" :title="t('components.postRankingList.likeCount')"><LikeOutlined /> {{ formatNumber(item.likeCount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="yuemu-empty-state">
      <div class="yuemu-empty-text">
        <h3>{{ t('components.postRankingList.silenceIsBetterThanSound') }}</h3>
        <p>{{ t('components.postRankingList.noPostsOnRanking') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();


import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { throttle } from "lodash-es";
import { EyeOutlined, LikeOutlined, CrownOutlined, FileTextOutlined } from '@ant-design/icons-vue';
import { getDefaultAvatar } from "@/utils/userUtils";
interface Props {
  dataList: any[];
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false
});
const router = useRouter();
const gridRef = ref<HTMLElement | null>(null);
const windowWidth = ref(window.innerWidth);
const loadedImages = ref<Record<string, boolean>>({});
const aspectRatios = ref<Record<string, number>>({});
const triggerUpdate = ref(0);
const getRandomPaddingTop = () => {
  return Math.floor(Math.random() * (130 - 75 + 1)) + 75;
};
const getAspectRatio = (item: any) => {
  return aspectRatios.value[item.id] || item.imageAspectRatio || 1.33;
};
const getPaddingTop = (item: any) => {
  if (!item.coverUrl) return 60;
  const ratio = Math.max(0.5, Math.min(getAspectRatio(item), 2.0));
  return (1 / ratio) * 100;
};
const onImageLoad = (item: any, event: Event) => {
  loadedImages.value[String(item.id)] = true;
  const img = event.target as HTMLImageElement;
  if (img && img.naturalWidth && img.naturalHeight) {
    const ratio = img.naturalWidth / img.naturalHeight;
    if (Math.abs((aspectRatios.value[item.id] || 0) - ratio) > 0.05) {
      aspectRatios.value[item.id] = ratio;
      triggerUpdate.value++;
    }
  }
};
const updateWidth = throttle(() => { windowWidth.value = window.innerWidth; }, 200);
onMounted(() => { window.addEventListener('resize', updateWidth); });
onUnmounted(() => { window.removeEventListener('resize', updateWidth); });
const columnCount = computed(() => {
  if (windowWidth.value >= 1200) return 4;
  if (windowWidth.value >= 768) return 3;
  return 2;
});
const masonryColumns = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  triggerUpdate.value;
  const colCount = columnCount.value;
  const cols: any[][] = Array.from({ length: colCount }, () => []);
  const columnHeights = new Array(colCount).fill(0);
  if (props.dataList && props.dataList.length > 0) {
    props.dataList.forEach((item, index) => {
      const postWithRank = { ...item, _rankIndex: index };
      let minHeightIndex = 0;
      for (let i = 1; i < colCount; i++) {
        if (columnHeights[i] < columnHeights[minHeightIndex]) {
          minHeightIndex = i;
        }
      }
      cols[minHeightIndex].push(postWithRank);
      let itemHeight = 120;
      if (item.coverUrl) {
        const ratio = Math.max(0.5, Math.min(getAspectRatio(item), 2.0));
        itemHeight += 100 / ratio;
      } else {
        itemHeight += 60;
      }
      columnHeights[minHeightIndex] += itemHeight;
    });
  }
  return cols;
});
const formatNumber = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === '') return '0';
  const n = typeof num === "string" ? parseInt(num, 10) : num;
  if (isNaN(n)) return '0';
  if (n >= 10000) return (n / 10000).toFixed(1) + "w";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
};
const goToPostDetail = (id: string) => router.push(`/post/${id}`);
const goToUserPage = (userId: string) => router.push(`/user/${userId}`);
</script>
<style scoped lang="scss">.yuemu-article-ranking-waterfall {
  width: 100%;
  z-index: 0;
  .yuemu-masonry-grid {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
    box-sizing: border-box;
    @media (max-width: 600px) { gap: 2px; }
  }
  .yuemu-masonry-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    @media (max-width: 600px) { gap: 8px; }
  }
  .yuemu-ranking-item {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    background: var(--card-background, #fff);
    box-sizing: border-box;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
    @media (hover: hover) and (pointer: fine) {
      &:hover:not(.yuemu-skeleton-card) {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        z-index: 2;
        .yuemu-note-image { transform: scale(1.04); }
      }
    }
  }
  .yuemu-note-card {
    display: flex;
    flex-direction: column;
  }
  .yuemu-note-image-wrapper {
    width: 100%;
    position: relative;
    background: var(--hover-background, #f5f5f5);
    overflow: hidden;
  }
  .yuemu-aspect-ratio-box {
    position: relative;
    width: 100%;
    height: 0;
    overflow: hidden;
  }
  .yuemu-note-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s cubic-bezier(0.33, 1, 0.68, 1);
  }
  .yuemu-text-cover-placeholder {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    background: linear-gradient(135deg, var(--hover-background) 0%, var(--border-color) 100%);
    .yuemu-placeholder-icon { font-size: 32px; color: var(--text-secondary); opacity: 0.4; }
    .yuemu-placeholder-text { font-size: 13px; color: var(--text-secondary); font-weight: 500; opacity: 0.6; letter-spacing: 2px; }
  }
  .yuemu-rank-badge {
    position: absolute;
    top: -1px;
    left: -1px;
    width: 54px;
    height: 58px;
    padding: 4px 14px 14px 0; /* right=14, bottom=14 for the transparent curve area */
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    z-index: 10;
    color: #fff;
    @media (max-width: 600px) {
      width: 44px;
      height: 48px;
      padding: 3px 12px 12px 0;
    }
    .yuemu-badge-icon {
      font-size: 14px;
      @media (max-width: 600px) { font-size: 11px; }
    }
    .rank-num {
      font-size: 18px;
      font-weight: 900;
      font-family: 'Arial Black', Impact, sans-serif;
      line-height: 1;
      @media (max-width: 600px) { font-size: 15px; }
    }
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background: rgba(0, 0, 0, 0.4);
      mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 54 58' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 0 L 54 0 A 14 14 0 0 0 40 14 L 40 32 A 12 12 0 0 1 28 44 L 14 44 A 14 14 0 0 0 0 58 Z'/%3E%3C/svg%3E");
      mask-size: 100% 100%;
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 54 58' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 0 L 54 0 A 14 14 0 0 0 40 14 L 40 32 A 12 12 0 0 1 28 44 L 14 44 A 14 14 0 0 0 0 58 Z'/%3E%3C/svg%3E");
      -webkit-mask-size: 100% 100%;
    }
    &.yuemu-top-1::before {
      background: linear-gradient(135deg, #FFD000 0%, #FF8A00 100%);
    }
    &.yuemu-top-2 {
      color: #2563eb;
    }
    &.yuemu-top-2::before {
      background: linear-gradient(135deg, #e2ebff 0%, #c1d5ff 100%);
    }
    &.yuemu-top-3::before {
      background: linear-gradient(135deg, #eab07f 0%, #c8864f 100%);
    }
    &.yuemu-top-other::before {
      background: rgba(0, 0, 0, 0.5);
    }
  }
  .yuemu-note-info {
    padding: 12px; display: flex; flex-direction: column;
    @media (max-width: 600px) { padding: 10px 8px; }
  }
  .yuemu-note-title {
    font-size: 14px; font-weight: 600; color: var(--text-primary); line-height: 1.5; margin-bottom: 12px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    @media (max-width: 600px) { font-size: 13px; margin-bottom: 8px; }
    .yuemu-category-tag { color: #0066B3; background: rgba(0, 102, 179, 0.1); padding: 1px 6px; border-radius: 4px; font-size: 11px; margin-right: 4px; font-weight: 500; }
  }
  .yuemu-post-meta { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
  .yuemu-author-section { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; }
  .yuemu-author-avatar { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); flex-shrink: 0; }
  .yuemu-author-name { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.2s; }
  .yuemu-author-section:hover .yuemu-author-name { color: var(--link-color, #1890ff); }
  .yuemu-stats-section { display: flex; align-items: center; gap: 8px; flex-shrink: 0; .yuemu-stat-item { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--text-secondary); opacity: 0.8; } }
  .yuemu-skeleton-anim {
    background: linear-gradient(90deg,
      rgba(150, 150, 150, 0.05) 25%,
      rgba(150, 150, 150, 0.12) 50%,
      rgba(150, 150, 150, 0.05) 75%
    );
    background-size: 400% 100%;
    animation: yuemu-shimmer 3s infinite linear;
  }
  @keyframes yuemu-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  .yuemu-thumb-placeholder { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; }
  .yuemu-real-img { opacity: 0; transition: opacity 0.4s ease-in-out; position: absolute; z-index: 2; &.yuemu-is-loaded { opacity: 1; } }
  .yuemu-skeleton-card { pointer-events: none; .yuemu-skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 8px; } .yuemu-long { width: 85%; } .yuemu-skeleton-avatar { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; } }
  .yuemu-empty-state { padding: 60px 20px; text-align: center; background: var(--card-background); border-radius: 12px; border: 1px solid var(--border-color); .yuemu-empty-text h3 { font-size: 16px; color: var(--text-primary); margin-bottom: 4px; } .yuemu-empty-text p { font-size: 13px; color: var(--text-secondary); } }
}
/* 深色模式兼容 */
@media (prefers-color-scheme: dark) { .yuemu-article-ranking-waterfall { .yuemu-ranking-item { background: #1e1e1e; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); @media (hover: hover) and (pointer: fine) { &:hover:not(.yuemu-skeleton-card) { box-shadow: 0 12px 24px rgba(0, 0, 0, 0.6); } } } }
  .yuemu-note-title { color: rgba(255, 255, 255, 0.95); }
  .yuemu-author-name { color: rgba(255, 255, 255, 0.65); }
  .yuemu-stat-item { color: rgba(255, 255, 255, 0.45); }
  .yuemu-category-tag { background: rgba(56, 189, 248, 0.1); color: #38bdf8; }
  .yuemu-text-cover-placeholder { background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%); }
  .yuemu-skeleton-anim { background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%); }
  .yuemu-empty-state { background: #111; .yuemu-empty-text h3 { color: #e2e8f0; } .yuemu-empty-text p { color: #64748b; } }
}
/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-article-ranking-waterfall:active, .yuemu-article-ranking-waterfall:hover,
  .yuemu-article-ranking-waterfall:active *, .yuemu-article-ranking-waterfall:hover *,
  .yuemu-author-section:active, .yuemu-author-section:hover,
  .yuemu-author-section:active *, .yuemu-author-section:hover *,
  .yuemu-ranking-item:active, .yuemu-ranking-item:hover,
  .yuemu-ranking-item:active *, .yuemu-ranking-item:hover * {
    transform: none !important;
  }
}</style>
