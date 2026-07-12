<template>
  <div class="yuemu-recommended-spaces-container" @scroll="handleScroll">
    
    <!-- 推荐空间 -->
    <div class="yuemu-section" v-if="recommendedSpaces.length > 0">
      <div class="yuemu-section-header">
        <div class="header-left">
          <span class="header-icon">🔥</span>
          <h3 class="header-title">{{ t('components.recommendedSpacesList.recommendedSpaces') }}</h3>
        </div>
      </div>
      
      <div class="yuemu-squircle-list">
        <div 
          v-for="space in recommendedSpaces" 
          :key="space.id" 
          class="squircle-space-item"
          @click="handleTeamClick(space)"
        >
          <img :src="getSpaceCover(space)" class="squircle-avatar" />
          <div class="squircle-info">
            <div class="squircle-title">{{ space.spaceName }}</div>
            <div class="squircle-desc">{{ space.spaceDesc || t('components.recommendedSpacesList.noDesc') }}</div>
            <div class="squircle-meta">{{ space.totalCount || 0 }} {{ t('components.recommendedSpacesList.contentCount') }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="yuemu-divider" v-if="recommendedSpaces.length > 0 && latestSpaces.length > 0"></div>

    <!-- 最新创建 -->
    <div class="yuemu-section" v-if="latestSpaces.length > 0">
      <div class="yuemu-section-header">
        <div class="header-left">
          <span class="header-icon" style="color: #3b82f6;">🕒</span>
          <h3 class="header-title">{{ t('components.recommendedSpacesList.latestCreated') }}</h3>
        </div>
      </div>
      
      <div class="yuemu-squircle-list">
        <div 
          v-for="space in latestSpaces" 
          :key="space.id" 
          class="squircle-space-item"
          @click="handleTeamClick(space)"
        >
          <img :src="getSpaceCover(space)" class="squircle-avatar" />
          <div class="squircle-info">
            <div class="squircle-title">{{ space.spaceName }}</div>
            <div class="squircle-desc">{{ space.spaceDesc || t('components.recommendedSpacesList.justCreated') }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="loadingRecommended" class="yuemu-loading-state">
      <div class="squircle-skeleton-item" v-for="i in 3" :key="i">
        <div class="skeleton-squircle"></div>
        <div class="skeleton-info">
          <div class="skeleton-line-1"></div>
          <div class="skeleton-line-2"></div>
          <div class="skeleton-line-3"></div>
        </div>
      </div>
    </div>
    
    <div v-else class="yuemu-empty-state">
      {{ t('components.recommendedSpacesList.noMore') }}
    </div>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { listRecommendedSpacesUsingGet, listSpaceVoByPageUsingPost } from '@/api/spaceController';
import { getTextCover } from '@/utils/textCoverGenerator';

const router = useRouter();
const recommendedSpaces = ref<API.SpaceVO[]>([]);
const latestSpaces = ref<API.SpaceVO[]>([]);
const loadingRecommended = ref(false);
const textCoverCache = ref<Record<string, string>>({});

const getSpaces = async () => {
  if (loadingRecommended.value) return;

  try {
    loadingRecommended.value = true;
    
    // Fetch Recommended Spaces
    const resRecommended = await listRecommendedSpacesUsingGet();
    if (resRecommended.data.code === 0 && resRecommended.data.data) {
      recommendedSpaces.value = resRecommended.data.data || [];
      recommendedSpaces.value.forEach(space => {
        if (!space.spaceCover && space.spaceName) generateTextCoverForSpace(space);
      });
    }

    // Fetch Latest Spaces
    const resLatest = await listSpaceVoByPageUsingPost({
      current: 1,
      pageSize: 5,
      spaceType: 1,
      sortField: 'createTime',
      sortOrder: 'descend'
    });
    if (resLatest.data.code === 0 && resLatest.data.data?.records) {
      latestSpaces.value = resLatest.data.data.records || [];
      latestSpaces.value.forEach(space => {
        if (!space.spaceCover && space.spaceName) generateTextCoverForSpace(space);
      });
    }
    
  } catch (error) {
    console.error(t('components.recommendedSpacesList.fetchSpaceFailedColon'), error);
  } finally {
    loadingRecommended.value = false;
  }
};

const generateTextCoverForSpace = async (space: API.SpaceVO) => {
  const cacheKey = `space_cover_${space.id}`;
  if (textCoverCache.value[cacheKey]) return;
  try {
    const cover = await getTextCover(space.spaceName || t('components.recommendedSpacesList.defaultCoverText'), 120, 120);
    textCoverCache.value[cacheKey] = cover;
  } catch (e) {}
};

const getSpaceCover = (space: API.SpaceVO) => {
  if (space.spaceCover) return space.spaceCover;
  return textCoverCache.value[`space_cover_${space.id}`] || 'https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg';
};

const handleTeamClick = (space: API.SpaceVO) => {
  if (space.id) router.push(`/space/${space.id}`);
};

const init = async () => {
  await getSpaces();
};

const handleScroll = (event: Event) => {};

defineExpose({ init, refresh: init });
onMounted(() => init());
</script>

<style scoped>
.yuemu-recommended-spaces-container {
  padding: 16px 20px;
  height: 100%;
  overflow-y: auto;
  background: var(--card-background);
  
  /* 隐藏原生滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.yuemu-recommended-spaces-container::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.yuemu-section {
  margin-bottom: 24px;
}

.yuemu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.04);
  margin: 0 4px 24px 4px;
}

[data-theme='dark'] .yuemu-divider {
  background: rgba(255, 255, 255, 0.05);
}

.yuemu-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-icon {
  font-size: 16px;
}

.header-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.header-right:hover {
  color: var(--text-primary);
}

.header-right i {
  font-size: 10px;
}

.yuemu-squircle-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.squircle-space-item {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.squircle-space-item:hover {
  opacity: 0.85;
}

.squircle-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.03);
}

.squircle-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.squircle-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.2px;
}

.squircle-desc {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.squircle-meta {
  font-size: 12px;
  color: #8c8c8c;
}

/* Skeleton */
.yuemu-loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.squircle-skeleton-item {
  display: flex;
  gap: 14px;
}

.skeleton-squircle {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--hover-background);
  animation: pulse 1.5s infinite;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.skeleton-line-1 {
  width: 60%;
  height: 14px;
  border-radius: 4px;
  background: var(--hover-background);
  animation: pulse 1.5s infinite;
}

.skeleton-line-2 {
  width: 40%;
  height: 12px;
  border-radius: 4px;
  background: var(--hover-background);
  animation: pulse 1.5s infinite;
}

.skeleton-line-3 {
  width: 30%;
  height: 12px;
  border-radius: 4px;
  background: var(--hover-background);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.yuemu-loading-more {
  text-align: center;
  padding: 16px 0;
  color: var(--text-secondary);
}

.yuemu-empty-state {
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
