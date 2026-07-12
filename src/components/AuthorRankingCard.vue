<template>
  <div class="yuemu-c-end-creator-list">
    <div v-if="loading && current === 1" class="yuemu-creator-grid">
      <div v-for="n in 6" :key="n" class="yuemu-creator-card yuemu-skeleton-card">
        <div class="yuemu-card-header">
          <div class="yuemu-avatar-wrapper yuemu-skeleton-avatar yuemu-skeleton-anim"></div>
          <div class="yuemu-info-wrapper">
            <div class="yuemu-skeleton-line yuemu-short yuemu-skeleton-anim"></div>
            <div class="yuemu-skeleton-line yuemu-long yuemu-skeleton-anim"></div>
          </div>
          <div class="yuemu-skeleton-btn yuemu-skeleton-anim"></div>
        </div>
        <div class="yuemu-works-showcase">
          <div class="yuemu-showcase-track">
            <div v-for="i in 4" :key="i" class="yuemu-work-thumb yuemu-skeleton-anim"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="authorList.length > 0" class="yuemu-creator-grid">
      <div v-for="(author, index) in authorList" :key="author.userId" :class="['yuemu-creator-card', index < 3 ? `is-top-${index + 1}` : '']">

        <div class="yuemu-rank-badge" :class="index < 3 ? `yuemu-top-${index + 1}` : 'yuemu-top-other'">
          <i class="fas fa-crown" v-if="index === 0"></i>
          <span class="rank-num">{{ index + 1 }}</span>
        </div>

        <div class="yuemu-card-header" @click="goToUserPage(author.userId)">
          <div class="yuemu-avatar-wrapper">
            <div class="yuemu-thumb-placeholder yuemu-skeleton-anim" v-show="!author._avatarLoaded"></div>
            <img
              :src="author.user?.userAvatar || getDefaultAvatar(author.user?.userName)"
              class="yuemu-avatar yuemu-real-img"
              :class="{ 'yuemu-is-loaded': author._avatarLoaded }"
              @load="author._avatarLoaded = true"
              alt="avatar"
            />
          </div>

          <div class="yuemu-info-wrapper">
            <div class="yuemu-name-line">
              <span class="yuemu-name">{{ author.user?.userName || t('components.authorRanking.mysteriousCreator') }}</span>
              <i v-if="index <= 2" class="fas fa-check-circle yuemu-verified-icon"></i>
            </div>
            <div class="yuemu-stats-line">
              <span><b>{{ formatNumber(author.totalLikeCount) }}</b> {{ t('components.authorRanking.likes') }}</span>
              <span class="yuemu-divider"></span>
              <span><b>{{ author.contentCount || 0 }}</b> {{ t('components.authorRanking.works') }}</span>
            </div>
          </div>

          <button class="yuemu-follow-btn">{{ t('components.authorRanking.viewProfile') }}</button>
        </div>

        <div class="yuemu-works-showcase">
          <div class="yuemu-showcase-track" v-if="author.recentWorks && author.recentWorks.length > 0">
            <div
              v-for="work in author.recentWorks.slice(0, 4)"
              :key="work.id"
              class="yuemu-work-thumb"
              @click="goToWorkDetail(work)"
            >
              <div class="yuemu-thumb-placeholder yuemu-skeleton-anim" v-show="!work._isLoaded"></div>
              <img
                :src="getWorkThumbnail(work)"
                class="yuemu-real-img"
                :class="{ 'yuemu-is-loaded': work._isLoaded }"
                @load="work._isLoaded = true"
                alt="work-cover"
              />
            </div>
          </div>

          <div class="yuemu-showcase-empty" v-else>
            <div class="yuemu-empty-content">
              <i class="fas fa-seedling"></i>
              <span>{{ t('components.authorRanking.creating') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="loadMoreTrigger" class="yuemu-infinite-loading-trigger" v-show="authorList.length > 0">
      <div v-show="loadingMore" class="yuemu-spinner-box"><a-spin size="small" /> {{ t('components.authorRanking.loadingMore') }}</div>
      <div v-show="!hasMoreData && !loading" class="yuemu-end-message">{{ t('components.authorRanking.allStarsAppeared') }}</div>
    </div>

    <a-empty v-if="!loading && authorList.length === 0" :description="t('components.authorRanking.noStarsYet')" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { getPictureAuthorRankingUsingGet, getPostAuthorRankingUsingGet } from "@/api/authorRankingController";
import { getDefaultAvatar } from "@/utils/userUtils";
import { getTextCover } from "@/utils/textCoverGenerator";
import { message } from "ant-design-vue";
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props { type: "picture" | "post"; timeRange?: string; }
const props = withDefaults(defineProps<Props>(), { timeRange: "total" });

const router = useRouter();
const loading = ref(false);
const loadingMore = ref(false);
const authorList = ref<any[]>([]);

const current = ref(1);
const pageSize = ref(10);
const hasMoreData = ref(true);

const loadMoreTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const textCoverCache = ref<Record<string, string>>({});
const loadingCovers = ref(new Set<string>());

const formatNumber = (num: number | undefined) => {
  if (!num) return 0;
  return num >= 10000 ? (num / 10000).toFixed(1) + "w" : num;
};

const getWorkThumbnail = (work: any) => {
  if (props.type === "post" && !work.coverUrl && work.title) {
    return getPostTextCover(work);
  }
  return props.type === "picture" ? (work.thumbnailUrl || work.url) : (work.coverUrl || "/default-post-cover.jpg");
};

const goToUserPage = (userId: string) => router.push(`/user/${userId}`);
const goToWorkDetail = (work: any) => router.push(props.type === "picture" ? `/picture/${work.id}` : `/post/${work.id}`);

const getPostTextCover = (work: any) => {
  const cacheKey = `text_cover_${work.title || 'untitled'}`;

  if (textCoverCache.value[cacheKey]) {
    return textCoverCache.value[cacheKey];
  }

  if (loadingCovers.value.has(cacheKey)) {
    return getDefaultAvatar(work.title || 'Post');
  }

  if (work.title) {
    generateTextCoverForWork(work, cacheKey);
  }

  return getDefaultAvatar(work.title || 'Post');
};

const generateTextCoverForWork = async (work: any, cacheKey: string) => {
  if (!work.title || loadingCovers.value.has(cacheKey)) return;

  try {
    loadingCovers.value.add(cacheKey);
    const cover = await getTextCover(work.title, 300, 400);
    textCoverCache.value[cacheKey] = cover;

    nextTick(() => {
      authorList.value = [...authorList.value];
    });
  } catch (error) {
    console.error('生成文字封面失败:', error);
  } finally {
    loadingCovers.value.delete(cacheKey);
  }
};

const loadAuthorRanking = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true;
  } else {
    loading.value = true;
    current.value = 1;
    hasMoreData.value = true;
  }

  try {
    const api = props.type === "picture" ? getPictureAuthorRankingUsingGet : getPostAuthorRankingUsingGet;
    const res = await api({ timeRange: props.timeRange, current: current.value, pageSize: pageSize.value });

    if (res.data.code === 0 && res.data.data) {
      const newRecords = res.data.data.records || res.data.data;
      if (isLoadMore) {
        authorList.value.push(...newRecords);
      } else {
        authorList.value = newRecords;
      }

      if (!newRecords || newRecords.length < pageSize.value) {
        hasMoreData.value = false;
      }
    }
  } catch (error) {
    message.error(t('components.authorRanking.loadFailed'));
    hasMoreData.value = false;
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

const setupObserver = () => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !loading.value && !loadingMore.value && hasMoreData.value) {
      current.value++;
      loadAuthorRanking(true);
    }
  }, { rootMargin: "150px" });

  if (loadMoreTrigger.value) observer.observe(loadMoreTrigger.value);
};

onMounted(() => {
  loadAuthorRanking().then(() => {
    nextTick(() => setupObserver());
  });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<style scoped lang="scss">
.yuemu-c-end-creator-list {

  .yuemu-creator-grid {
    display: grid; gap: 24px; grid-template-columns: repeat(2, 1fr);
    @media (max-width: 1024px) { grid-template-columns: 1fr; gap: 16px; }
  }

  .yuemu-creator-card {
    background: var(--card-background); border-radius: 20px; border: 1px solid var(--border-color);
    box-shadow: 0 4px 12px rgba(0,0,0,0.02); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
    @media (max-width: 768px) { border-radius: 16px; }
    &:hover:not(.yuemu-skeleton-card) { box-shadow: 0 16px 32px var(--shadow-color); transform: translateY(-4px); border-color: transparent; }

    &.is-top-1 { border: 2px solid rgba(255, 208, 0, 0.5); box-shadow: 0 8px 24px rgba(255, 138, 0, 0.1); }
    &.is-top-2 { border: 2px solid rgba(193, 213, 255, 0.5); }
    &.is-top-3 { border: 2px solid rgba(234, 176, 127, 0.5); }
  }

  .yuemu-rank-badge {
    position: absolute;
    top: -1px;
    left: -1px;
    width: 46px;
    height: 52px;
    padding: 2px 12px 12px 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    z-index: 10;
    color: #fff;

    .fas { font-size: 12px; }
    .rank-num { font-size: 16px; font-weight: 900; font-family: 'Arial Black', Impact, sans-serif; line-height: 1; }

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

    &.yuemu-top-1::before { background: linear-gradient(135deg, #FFD000 0%, #FF8A00 100%); }
    &.yuemu-top-2 { color: #2563eb; }
    &.yuemu-top-2::before { background: linear-gradient(135deg, #e2ebff 0%, #c1d5ff 100%); }
    &.yuemu-top-3::before { background: linear-gradient(135deg, #eab07f 0%, #c8864f 100%); }
    &.yuemu-top-other::before { background: rgba(0, 0, 0, 0.2); }
  }

  .yuemu-card-header {
    display: flex; align-items: center; gap: 16px; cursor: pointer; margin-bottom: 20px;
    padding: 20px 20px 0 44px; /* Space for the top-left badge */
    @media (max-width: 768px) { gap: 12px; margin-bottom: 16px; padding: 16px 16px 0 36px; }

    .yuemu-avatar-wrapper {
      position: relative; flex-shrink: 0; width: 56px; height: 56px; border-radius: 50%; overflow: hidden;
      @media (max-width: 768px) { width: 44px; height: 44px; }
    }

    .yuemu-info-wrapper {
      flex: 1; min-width: 0;
      .yuemu-name-line { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; .yuemu-name { font-size: 16px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .yuemu-verified-icon { color: #3b82f6; font-size: 14px; flex-shrink: 0;} }
      .yuemu-stats-line { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; white-space: nowrap; b { color: var(--text-primary); } .yuemu-divider { width: 3px; height: 3px; border-radius: 50%; background: var(--text-secondary); margin: 0 8px; opacity: 0.5; } }
    }

    .yuemu-follow-btn { padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; color: var(--text-primary); background: var(--hover-background); border: none; cursor: pointer; flex-shrink: 0; transition: 0.2s; &:hover { background: var(--text-primary); color: var(--background); } }
  }

  .yuemu-works-showcase {
    width: 100%;
    padding: 0 20px 20px 20px;
    @media (max-width: 768px) { padding: 0 16px 16px 16px; }

    .yuemu-showcase-track {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
      @media (max-width: 768px) { gap: 8px; }
    }

    .yuemu-work-thumb {
      width: 100%; aspect-ratio: 1; border-radius: 12px; cursor: pointer; position: relative; overflow: hidden; transition: transform 0.3s ease;
      @media (max-width: 768px) { border-radius: 8px; }
      &::after { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.03); transition: background 0.3s; z-index: 2; pointer-events: none;}
      &:hover { transform: scale(1.05); z-index: 3; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
      &:hover::after { background: rgba(0,0,0,0); }
    }

    .yuemu-showcase-empty {
      width: 100%; height: 80px; background: var(--hover-background); border-radius: 12px; border: 1px dashed var(--border-color); display: flex; align-items: center; justify-content: center;
      @media (max-width: 768px) { height: 70px; border-radius: 8px; }
      .yuemu-empty-content { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--text-secondary); opacity: 0.6; i { font-size: 18px; } span { font-size: 12px; letter-spacing: 1px; } }
    }
  }

  /* ====== 图片淡入加载 & 骨架屏动画 ====== */
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .yuemu-skeleton-anim {
    background: linear-gradient(90deg, var(--hover-background) 25%, var(--border-color) 50%, var(--hover-background) 75%);
    background-size: 400% 100%;
    animation: shimmer 1.5s infinite ease-in-out;
  }

  .yuemu-thumb-placeholder {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    z-index: 1;
  }

  .yuemu-real-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.4s ease-in-out;
    position: relative;
    z-index: 2;
    &.yuemu-is-loaded {
      opacity: 1;
    }
  }

  .yuemu-skeleton-card {
    pointer-events: none;
    .yuemu-skeleton-avatar { border: none; overflow: visible; }
    .yuemu-skeleton-line { height: 14px; border-radius: 4px; margin-bottom: 10px; }
    .yuemu-short { width: 40%; }
    .yuemu-long { width: 70%; margin-bottom: 0;}
    .yuemu-skeleton-btn { width: 70px; height: 28px; border-radius: 100px; flex-shrink: 0;}
    .yuemu-work-thumb { border-radius: 12px; @media (max-width: 768px) { border-radius: 8px; } }
  }

  .yuemu-infinite-loading-trigger { height: 60px; display: flex; justify-content: center; align-items: center; margin-top: 20px; color: var(--text-secondary); font-size: 13px; .yuemu-spinner-box { display: flex; align-items: center; gap: 8px; } }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-follow-btn:active, .yuemu-follow-btn:hover,
  .yuemu-follow-btn:active *, .yuemu-follow-btn:hover * {
    transform: none !important;
  }
}
</style>
