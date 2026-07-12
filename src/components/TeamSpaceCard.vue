<template>
  <!-- Loading 骨架屏状态 -->
  <div v-if="isLoading" class="yuemu-team-space-card is-image-card">
    <div class="yuemu-card-cover yuemu-skeleton-cover-anim" style="aspect-ratio: 4 / 5;">
      <div class="yuemu-image-card-content">
        <div class="yuemu-image-card-info">
          <div class="yuemu-skeleton-line" style="width: 70%; height: 24px; margin-bottom: 8px;"></div>
          <div class="yuemu-skeleton-line" style="width: 40%; height: 16px;"></div>
        </div>
      </div>
    </div>
  </div>

  <div v-else
    class="yuemu-team-space-card" 
    :class="hasRealCover ? 'is-image-card' : 'is-text-card'"
    @click="space && handleTeamClick(space)"
  >
    <!-- 图片部落：文字悬浮在图片上方 -->
    <template v-if="hasRealCover && space">
      <div class="yuemu-card-cover" :style="{ aspectRatio: getAspect(space.id) }">
        <img
          :src="displayCover"
          :alt="t('components.teamSpaceCard.spaceCover')"
          class="yuemu-cover-img yuemu-img-loaded"
          loading="lazy"
          @error="handleCoverError"
        />
        <div class="yuemu-cover-overlay-dark"></div>
        <div class="yuemu-space-type-badge yuemu-private" v-if="space.spaceType === 0">{{ t('components.teamSpaceCard.privateSpace') }}</div>
        
        <div class="yuemu-image-card-content">
          <div class="yuemu-image-card-info">
            <h3 class="yuemu-space-title">{{ space.spaceName }}</h3>
            <p class="yuemu-space-desc">{{ space.spaceDesc || t('components.teamSpaceCard.recordBeautifulLife') }}</p>
          </div>
          <div class="yuemu-image-card-footer">
            <div class="yuemu-avatar-stack" v-if="recommendedMembers.length > 0">
              <img
                v-for="(member, index) in recommendedMembers.slice(0, 3)"
                :key="member.userId"
                :src="member.user?.userAvatar || defaultAvatar"
                class="yuemu-mini-avatar"
                :style="{ zIndex: 3 - index }"
                @click.stop="handleUserClick(member.user)"
              />
            </div>
            <div class="yuemu-member-count">{{ space.memberCount ?? space.recommendedUsers?.length ?? 0 }} {{ t('components.teamSpaceCard.membersCount') }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 文本部落：上边生成图，下边白色内容区 -->
    <template v-else-if="space">
      <div class="yuemu-card-cover" style="aspect-ratio: 16 / 10;">
        <img
          :src="displayCover"
          :alt="t('components.teamSpaceCard.spaceCover')"
          class="yuemu-cover-img yuemu-text-cover"
          :class="{ 'yuemu-img-loaded': coverLoaded }"
          loading="lazy"
          @load="coverLoaded = true"
          @error="handleCoverError"
        />
        <div v-if="!coverLoaded" class="yuemu-cover-skeleton"></div>
        <div class="yuemu-space-type-badge yuemu-private" v-if="space.spaceType === 0">{{ t('components.teamSpaceCard.privateSpace') }}</div>
      </div>

      <div class="yuemu-card-info">
        <h3 class="yuemu-space-title">{{ space.spaceName }}</h3>
        <p class="yuemu-space-desc">{{ space.spaceDesc || t('components.teamSpaceCard.noSpaceDesc') }}</p>
      </div>

      <div class="yuemu-card-footer">
        <div class="yuemu-text-card-members">
          <div class="yuemu-avatar-stack" v-if="recommendedMembers.length > 0">
            <img
              :src="recommendedMembers[0]?.user?.userAvatar || defaultAvatar"
              class="yuemu-single-avatar"
              @click.stop="handleUserClick(recommendedMembers[0]?.user)"
            />
          </div>
          <span class="yuemu-member-count">{{ space.memberCount ?? space.recommendedUsers?.length ?? 0 }} {{ t('components.teamSpaceCard.membersCount') }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getTextCover } from '@/utils/textCoverGenerator'
import defaultCover from '@/assets/images/default_space_cover.png'
import defaultAvatar from '@/assets/default.png'

const props = withDefaults(defineProps<{
  space?: API.SpaceVO
  isLoading?: boolean
}>(), {
  space: () => ({} as API.SpaceVO),
  isLoading: false
})

const router = useRouter()
const coverLoaded = ref(false)
const textCoverCache = ref<Record<string, string>>({})
const isLoadingTextCover = ref(false)

// 计算当前显示的封面链接
const displayCover = computed(() => {
  if (props.space.spaceCover) return props.space.spaceCover
  const cacheKey = `space_cover_${props.space.spaceName}_${props.space.id || ''}`
  return textCoverCache.value[cacheKey] || defaultCover
})

const handleCoverError = () => {
  coverLoaded.value = true
}

// 生成文字封面逻辑
const generateTextCoverForSpace = async () => {
  if (props.space.spaceCover || !props.space.spaceName || isLoadingTextCover.value) return

  const cacheKey = `space_cover_${props.space.spaceName}_${props.space.id || ''}`
  if (textCoverCache.value[cacheKey]) {
    coverLoaded.value = true
    return
  }

  try {
    isLoadingTextCover.value = true
    const cover = await getTextCover(props.space.spaceName, 400, 200)
    textCoverCache.value[cacheKey] = cover
    coverLoaded.value = true
  } catch (error) {
    console.error('生成团队空间文字封面失败:', error)
    coverLoaded.value = true
  } finally {
    isLoadingTextCover.value = false
  }
}

watch(() => props.space, (newSpace) => {
  if (newSpace && !newSpace.spaceCover && newSpace.spaceName) {
    generateTextCoverForSpace()
  }
}, { immediate: true, deep: true })

onMounted(() => {
  if (!props.space.spaceCover && props.space.spaceName) {
    generateTextCoverForSpace()
  }
})

const handleActivityClick = (activity: API.Activity) => {
  if (activity.id) {
    router.push(`/activity/detail/${activity.id}`)
  }
}

const handleTeamClick = (space: API.SpaceVO) => {
  if (space.id) {
    router.push(`/space/${space.id}`)
  }
}

const handleUserClick = (user: API.User) => {
  if (!user) return
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

const recommendedMembers = (props.space.recommendedUsers || []) as API.SpaceUserVO[]
const activities = (props.space.activities || []) as API.Activity[]

// 判断是否有真实的封面图片
const hasRealCover = computed(() => !!props.space.spaceCover);

// 根据 ID 伪随机生成一个宽高比，创造瀑布流的不规则美感
const getAspect = (id?: string) => {
  if (!id) return '1 / 1';
  const num = parseInt(id.slice(-3) || '0', 10);
  const aspects = ['1 / 1', '3 / 4', '4 / 3', '16 / 10'];
  return aspects[num % aspects.length];
};
</script>

<style scoped>
.yuemu-team-space-card {
  width: 100%;
  background: var(--card-background);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  break-inside: avoid; /* 防止瀑布流截断 */
  margin-bottom: 16px;
}

[data-theme='dark'] .yuemu-team-space-card {
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.yuemu-team-space-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}

.yuemu-card-cover {
  width: 100%;
  position: relative;
  background: var(--hover-background);
  overflow: hidden;
}

.is-text-card .yuemu-card-cover {
  border-radius: 20px 20px 0 0;
}

.is-image-card .yuemu-card-cover {
  border-radius: 20px;
}

.yuemu-cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.25, 1, 0.5, 1);
}

.yuemu-team-space-card:hover .yuemu-cover-img {
  transform: scale(1.03);
}

/* 文本卡片特有样式 */
.is-text-card .yuemu-card-info {
  padding: 16px 16px 8px;
}

.is-text-card .yuemu-space-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.is-text-card .yuemu-space-desc {
  margin: 0;
  font-size: 12px;
  color: #a0aec0;
}

.is-text-card .yuemu-card-footer {
  padding: 0 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.yuemu-text-card-members {
  display: flex;
  align-items: center;
  gap: 8px;
}

.yuemu-single-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

/* 图片卡片特有样式 */
.yuemu-cover-overlay-dark {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}

.yuemu-image-card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.yuemu-image-card-info .yuemu-space-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.yuemu-image-card-info .yuemu-space-desc {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
}

.yuemu-image-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.yuemu-avatar-stack {
  display: flex;
  align-items: center;
}

.yuemu-mini-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  margin-left: -6px;
  position: relative;
}

.yuemu-mini-avatar:first-child {
  margin-left: 0;
}

.yuemu-member-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
}

.is-text-card .yuemu-member-count {
  color: #94a3b8;
}

/* 标签样式 */
.yuemu-space-type-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  backdrop-filter: blur(8px);
  z-index: 3;
}
/* 骨架屏动画样式 */
.yuemu-skeleton-cover-anim {
  background: linear-gradient(90deg, var(--hover-background) 25%, rgba(0,0,0,0.05) 50%, var(--hover-background) 75%);
  background-size: 200% 100%;
  animation: yuemuSkeletonBlink 1.5s infinite;
}

[data-theme='dark'] .yuemu-skeleton-cover-anim {
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 200% 100%;
}

.yuemu-skeleton-line {
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
}

[data-theme='dark'] .yuemu-skeleton-line {
  background: rgba(255,255,255,0.1);
}

@keyframes yuemuSkeletonBlink {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
