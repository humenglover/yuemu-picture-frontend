<template>
  <div
    class="yuemu-luxury-carousel"
    :class="{ 'has-pip': activities.length > 3 }"
    @mouseenter="stopTimer"
    @mouseleave="startTimer"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="yuemu-carousel-bg-layer">
      <transition name="yuemu-fade-bg">
        <div
          v-if="currentActivity"
          :key="currentActivity.id"
          class="yuemu-bg-blur-item"
          :style="{ backgroundImage: `url(${currentActivity.coverUrl ? currentActivity.coverUrl : defaultActivityImg})` }"
        ></div>
      </transition>
    </div>

    <div class="yuemu-main-wrapper">
      <div class="yuemu-slide-view">
        <div
          v-for="(activity, idx) in visibleDisplayList"
          :key="activity.id"
          class="yuemu-carousel-item"
          :class="{ 'yuemu-is-loaded': imageStatus[activity.id] }"
          :style="{ backgroundImage: imageStatus[activity.id] ? `url(${activity.coverUrl ? activity.coverUrl : defaultActivityImg})` : 'none' }"
          @click="handleItemClick(idx, activity.id)"
        >
          <img :src="activity.coverUrl ? activity.coverUrl : defaultActivityImg"
               referrerpolicy="no-referrer-when-downgrade"
               @load="handleImgLoad(activity.id)"
               class="yuemu-hidden-preload-img" />

          <div v-if="!imageStatus[activity.id]" class="yuemu-carousel-skeleton">
            <div class="yuemu-shimmer"></div>
          </div>

          <div class="yuemu-item-overlay"></div>

          <transition name="yuemu-fade-content">
            <div class="yuemu-item-content" v-if="idx === 0">
              <h1 class="yuemu-content-title">{{ activity.title || t('components.pcCarousel.defaultTitle') }}</h1>
              <p class="yuemu-content-desc">{{ t('components.pcCarousel.defaultDesc') }}</p>

              <div class="yuemu-content-actions">
                <div class="yuemu-timer-badge">
                  <i class="far fa-clock"></i> {{ formatTime(activity.expireTime) }} {{ t('components.pcCarousel.deadline') }}
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div class="yuemu-nav-controls" v-if="displayList.length > 1">
        <button class="yuemu-nav-btn yuemu-prev" @click="prev">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="yuemu-nav-btn yuemu-next" @click="next">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div class="yuemu-progress-bar-container">
        <div
          v-for="(_, index) in activities"
          :key="index"
          class="yuemu-progress-segment"
          :class="{ 'yuemu-active': currentRealIndex === index }"
          @click="jumpTo(index)"
        >
          <div class="yuemu-segment-fill"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, reactive, type Ref } from 'vue'
import { formatTime } from '@/utils/time'
import defaultActivityImg from '@/assets/images/default_activity.png'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Activity {
  id: string
  coverUrl: string
  title: string
  isExpired: number
  expireTime: string
}

const props = defineProps<{ activities: Activity[] }>()
const emit = defineEmits<{ (e: 'activityClick', id: string): void }>()

const displayList: Ref<Activity[]> = ref([])
const timer = ref<any>(null)

const MAX_VISIBLE_CARDS = 4
const visibleDisplayList = computed(() => displayList.value.slice(0, MAX_VISIBLE_CARDS))

const currentActivity = computed(() => displayList.value.length > 0 ? displayList.value[0] : null)

const currentRealIndex = computed(() => {
  if (!props.activities.length || !currentActivity.value) return 0
  const firstId = currentActivity.value.id
  return props.activities.findIndex(a => a.id === firstId)
})

const initDisplayList = () => {
  if (props.activities.length > 0) {
    displayList.value = [...props.activities]
  }
}

const next = () => {
  if (displayList.value.length < 2) return
  const first = displayList.value.shift()
  if (first) displayList.value.push(first)
}

const prev = () => {
  if (displayList.value.length < 2) return
  const last = displayList.value.pop()
  if (last) displayList.value.unshift(last)
}

const jumpTo = (targetRealIndex: number) => {
  const targetId = props.activities[targetRealIndex].id
  const idxInDisplay = displayList.value.findIndex(a => a.id === targetId)
  if (idxInDisplay > 0) {
    const moved = displayList.value.splice(0, idxInDisplay)
    displayList.value.push(...moved)
  }
}

const imageStatus = reactive<Record<string, boolean>>({})
const handleImgLoad = (id: string) => {
  imageStatus[id] = true
}

const handleItemClick = (idx: number, id: string) => {
  if (idx === 0) {
    emit('activityClick', id)
    return
  }
  const moved = displayList.value.splice(0, idx)
  displayList.value.push(...moved)
}

const startTimer = () => {
  if (props.activities.length <= 1) return
  stopTimer()
  timer.value = setInterval(next, 5000)
}

const stopTimer = () => {
  if (timer.value) clearInterval(timer.value)
}

const touchStartX = ref(0)
const touchEndX = ref(0)

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].clientX
  const swipeDistance = touchStartX.value - touchEndX.value
  if (Math.abs(swipeDistance) > 50) {
    if (swipeDistance > 0) {
      next()
    } else {
      prev()
    }
  }
}

onMounted(() => {
  initDisplayList()
  startTimer()
})

onUnmounted(stopTimer)

watch(() => props.activities, (newVal) => {
  if (newVal.length > 0) {
    initDisplayList()
    startTimer()
  }
}, { deep: true })

</script>

<style scoped>
.yuemu-luxury-carousel {
  position: relative;
  width: 100%;
  height: 240px;
  background: var(--card-background, #f1f5f9);
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 15px 40px var(--shadow-color, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--border-color, #fff);
  perspective: 1200px;
  touch-action: pan-y;
}

.yuemu-carousel-bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
.yuemu-bg-blur-item {
  position: absolute;
  inset: -20px;
  background-size: cover;
  background-position: center;
  filter: blur(50px) brightness(0.4) saturate(1.4);
  transform: scale(1.1);
}
.yuemu-fade-bg-enter-active, .yuemu-fade-bg-leave-active { transition: opacity 0.8s ease; }
.yuemu-fade-bg-enter-from, .yuemu-fade-bg-leave-to { opacity: 0; }

.yuemu-main-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.yuemu-carousel-item {
  width: 130px;
  height: 180px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 20px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  z-index: 1;
  cursor: pointer;
  opacity: 0;
  will-change: transform, opacity, left;
}

.yuemu-carousel-item.yuemu-is-loaded {
  opacity: 1;
}

.yuemu-hidden-preload-img {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.yuemu-carousel-skeleton {
  position: absolute;
  inset: 0;
  background: var(--hover-background, #e2e8f0);
  border-radius: inherit;
  overflow: hidden;
  z-index: -1;
}

.yuemu-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: yuemu-luxShimmer 1.8s infinite;
}

@keyframes yuemu-luxShimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.yuemu-carousel-item:hover {
  filter: brightness(1.1) contrast(1.1);
}

.yuemu-item-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.1) 0%, transparent 60%);
  border-radius: 18px;
}

.yuemu-carousel-item:nth-child(1) {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
  transform: translate(0, 0);
  box-shadow: none;
  border: none;
  filter: none;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.yuemu-carousel-item:nth-child(1) .yuemu-item-overlay {
  background: linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.05) 50%, rgba(255,255,255,0.1) 100%);
  border-radius: 0;
}

.yuemu-carousel-item:nth-child(n + 2) {
  display: none;
}

.has-pip .yuemu-carousel-item:nth-child(2) {
  display: block;
  left: 68%;
  z-index: 10;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.has-pip .yuemu-carousel-item:nth-child(3) {
  display: block;
  left: calc(68% + 90px);
  transform: translateY(-50%) scale(0.92);
  opacity: 0.75;
  z-index: 9;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.05s;
}

.has-pip .yuemu-carousel-item:nth-child(4) {
  display: block;
  left: calc(68% + 170px);
  transform: translateY(-50%) scale(0.85);
  opacity: 0.5;
  z-index: 8;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
}

.has-pip .yuemu-carousel-item:nth-child(n + 5) {
  display: none;
}

.yuemu-item-content {
  position: absolute;
  top: 50%;
  left: 60px;
  width: 600px;
  transform: translateY(-50%);
  color: #fff;
  z-index: 20;
}

.yuemu-content-title {
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 12px;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0,0,0,0.3);
  letter-spacing: 0.5px;
}

.yuemu-content-desc {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 20px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  max-width: 400px;
}

.yuemu-content-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.yuemu-btn-prime {
  height: 42px;
  padding: 0 26px;
  background: #fff;
  color: #0f172a !important;
  border: none;
  font-weight: 600;
  font-size: 15px;
  border-radius: 21px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.yuemu-btn-prime:hover {
  transform: scale(1.03) translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  background: #f8fafc;
}

.yuemu-timer-badge {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 6px;
}

.yuemu-nav-controls {
  position: absolute;
  bottom: 20px;
  right: 40px;
  display: flex;
  gap: 10px;
  z-index: 30;
}

.yuemu-nav-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.yuemu-nav-btn:hover {
  background: #fff;
  color: #0f172a;
  border-color: #fff;
  transform: translateY(-1px);
}

.yuemu-progress-bar-container {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 40;
}

.yuemu-progress-segment {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  cursor: pointer;
  overflow: hidden;
  transition: width 0.4s ease;
}

.yuemu-progress-segment.yuemu-active {
  width: 60px;
  background: rgba(255, 255, 255, 0.3);
}

.yuemu-progress-segment.yuemu-active .yuemu-segment-fill {
  width: 100%;
  height: 100%;
  background: #fff;
  animation: yuemu-progressFill 5s linear forwards;
}

@keyframes yuemu-progressFill {
  from { width: 0; }
  to { width: 100%; }
}

.yuemu-fade-content-enter-active {
  transition: opacity 0.6s ease 0.2s;
}
.yuemu-fade-content-leave-active {
  transition: opacity 0.3s ease;
}
.yuemu-fade-content-enter-from, .yuemu-fade-content-leave-to {
  opacity: 0;
}

@media screen and (max-width: 1200px) {
  .yuemu-item-content { left: 40px; width: 400px; }
  .yuemu-nav-controls { right: 40px; }
  .yuemu-content-title { font-size: 42px; }
}

@media screen and (max-width: 768px) {
  .yuemu-luxury-carousel {
    height: 180px;
    border-radius: 12px;
  }
  .yuemu-carousel-bg-layer {
    display: none;
  }
  .yuemu-carousel-item:nth-child(n + 2) {
    display: none;
  }
  .yuemu-carousel-item:nth-child(1) {
    border-radius: 12px;
  }
  .yuemu-carousel-item:nth-child(1) .yuemu-item-overlay {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.3) 60%, transparent 100%);
  }
  .yuemu-item-content {
    left: 16px;
    bottom: 24px;
    top: auto;
    width: calc(100% - 32px);
    transform: none;
  }
  .yuemu-content-title {
    font-size: 20px;
    margin-bottom: 8px;
  }
  .yuemu-content-desc {
    font-size: 12px;
    line-height: 1.4;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .yuemu-content-actions {
    gap: 8px;
  }
  .yuemu-timer-badge {
    font-size: 12px;
  }
  .yuemu-nav-controls {
    display: none;
  }
  .yuemu-progress-bar-container {
    bottom: 20px;
  }
  .yuemu-progress-segment {
    width: 24px;
  }
  .yuemu-progress-segment.yuemu-active {
    width: 36px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-btn-prime:active, .yuemu-btn-prime:hover,
  .yuemu-btn-prime:active *, .yuemu-btn-prime:hover *,
  .yuemu-carousel-item:active, .yuemu-carousel-item:hover,
  .yuemu-carousel-item:active *, .yuemu-carousel-item:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-nav-btn:active, .yuemu-nav-btn:hover,
  .yuemu-nav-btn:active *, .yuemu-nav-btn:hover * {
    transform: none !important;
  }
}
</style>
