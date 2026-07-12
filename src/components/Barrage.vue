<template>
  <div class="yuemu-barrage-container">
    <div class="yuemu-barrage-stage" ref="barrageStage">
      <div
        v-for="barrage in activeBarrages"
        :key="barrage.key"
        class="yuemu-barrage-wrapper"
        :style="{
          top: `${barrage.top}px`,
          transform: `translateX(${barrage.currentX}px)`,
          zIndex: barrage.paused ? 10 : 1
        }"
        @mouseenter="handleBarrageHover(barrage)"
        @mouseleave="handleBarrageLeave(barrage)"
        @touchstart="handleBarrageHover(barrage)"
        @touchend="handleBarrageLeave(barrage)"
      >
        <div
          class="yuemu-barrage-item"
          :class="{
            'is-paused': barrage.paused,
            'is-current-user': barrage.isCurrentUser
          }"
        >
          <img :src="barrage.avatar" class="yuemu-barrage-avatar" alt="avatar" />
          <span class="yuemu-barrage-text">{{ barrage.content }}</span>
        </div>
      </div>
    </div>

    <div class="yuemu-message-in" :class="{ 'is-show': showInput }">
      <div class="yuemu-input-mask">
        <div class="yuemu-input-box">
          <input
            v-model="inputContent"
            :placeholder="t('components.barrage.inputPlaceholder')"
            maxlength="60"
            class="yuemu-message-input"
            @keyup.enter="sendBarrage"
          />
          <button
            @click="sendBarrage"
            :disabled="!inputContent.trim()"
            class="yuemu-send-btn"
            :class="{ 'is-disabled': !inputContent.trim() }"
          >
            {{ t('components.barrage.send') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { sendMessageUsingPost, listMessageByPageUsingPost } from '@/api/messageController'
import { getDefaultAvatar } from '@/utils/userUtils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  speed?: number,
  showInput?: boolean
}>()

const emit = defineEmits(['send'])

// 核心状态
const inputContent = ref('')
const showInput = ref(props.showInput ?? true)
const activeBarrages = ref<any[]>([])
const barrageSpeed = ref(props.speed || 8000)
const maxBarragesCount = 100
const barrageStage = ref<HTMLElement | null>(null)
const currentPage = ref(1)
const pageSize = ref(100)
const loading = ref(false)
const hasMore = ref(true)
const queryTimer = ref<any>(null)
const messageCache = ref<any[]>([])
const isPageVisible = ref(true)

// 动画控制相关
let animationFrameId: number | null = null

// 视窗尺寸
const viewportHeight = ref(window.innerHeight)
const viewportWidth = ref(window.innerWidth)

// 计算查询间隔
const queryInterval = computed(() => {
  const baseInterval = barrageSpeed.value / 10
  return Math.min(Math.max(baseInterval, 500), 1200)
})

// 获取随机垂直位置
const getRandomTopPosition = () => {
  return 20 + Math.random() * (viewportHeight.value - 80)
}

// 监听窗口大小变化
const handleResize = () => {
  viewportHeight.value = window.innerHeight
  viewportWidth.value = window.innerWidth
}

// 监听页面可见性
const handleVisibilityChange = () => {
  isPageVisible.value = document.visibilityState === 'visible'
  if (isPageVisible.value) {
    lastUpdateTime = Date.now() // 切回页面时重置时间，防止计算出巨大差值
    startQueryTimer()
  } else {
    stopQueryTimer()
  }
}

// 获取历史弹幕
const fetchHistoryBarrages = async () => {
  if (!isPageVisible.value || loading.value) return

  try {
    loading.value = true

    if (messageCache.value.length > 0) {
      const batchSize = Math.min(12, messageCache.value.length)
      const batch = messageCache.value.splice(0, batchSize)

      batch.forEach((msg, index) => {
        setTimeout(() => {
          if (activeBarrages.value.length < maxBarragesCount) {
            addBarrage({
              id: msg.id,
              content: msg.content
            })
          } else {
            messageCache.value.unshift(msg)
          }
        }, index * 250)
      })

      if (messageCache.value.length < 20) {
        await fetchNextPage()
      }
    } else {
      await fetchNextPage()
    }
  } catch (error) {
    console.error('获取历史弹幕失败:', error)
  } finally {
    loading.value = false
  }
}

// 添加弹幕
const addBarrage = (barrage: any) => {
  if (activeBarrages.value.length >= maxBarragesCount) {
    activeBarrages.value.shift()
  }

  const top = getRandomTopPosition()
  const avatar = getDefaultAvatar(barrage.content.substring(0, 2))

  const newBarrage = {
    ...barrage,
    key: Date.now() + Math.random(),
    top,
    avatar,
    paused: false,
    resumeTimer: null, // 恢复滚动定时器
    isCurrentUser: !!barrage.isCurrentUser,
    currentX: viewportWidth.value + 50,
    speed: (viewportWidth.value + 400) / (barrageSpeed.value / 1000)
  }

  activeBarrages.value.push(newBarrage)
}

// 发送弹幕
const sendBarrage = async () => {
  if (!inputContent.value.trim()) return

  try {
    const res = await sendMessageUsingPost({
      content: inputContent.value
    })

    if (res.data.code === 0) {
      addBarrage({
        id: Date.now(),
        content: inputContent.value,
        isCurrentUser: true
      })
      inputContent.value = ''
      message.success(t('components.barrage.sendSuccess'))
    } else {
      message.error(t('components.barrage.sendFailedPrefix') + (res.data.msg || t('components.barrage.serverError')))
    }
  } catch (error) {
    console.error('发送弹幕失败:', error)
    message.error(t('components.barrage.sendFailedNetwork'))
  }
}

// 获取下一页弹幕数据
const fetchNextPage = async () => {
  try {
    const res = await listMessageByPageUsingPost({
      current: currentPage.value,
      pageSize: pageSize.value,
      sortField: 'createTime',
      sortOrder: 'descend'
    })

    if (res.data.data?.records) {
      const messages = res.data.data.records
      hasMore.value = messages.length === pageSize.value
      messageCache.value.push(...messages)

      if (hasMore.value) {
        currentPage.value++
      } else {
        currentPage.value = 1
      }
    }
  } catch (error) {
    console.error('获取下一页弹幕失败:', error)
  }
}

// 启动定时查询弹幕
const startQueryTimer = () => {
  stopQueryTimer()
  fetchHistoryBarrages()
  queryTimer.value = setInterval(fetchHistoryBarrages, queryInterval.value)
}

const stopQueryTimer = () => {
  if (queryTimer.value) {
    clearInterval(queryTimer.value)
    queryTimer.value = null
  }
}

// === 完美的悬停交互逻辑 ===
const handleBarrageHover = (barrage: any) => {
  barrage.paused = true
  if (barrage.resumeTimer) {
    clearTimeout(barrage.resumeTimer)
    barrage.resumeTimer = null
  }
}

const handleBarrageLeave = (barrage: any) => {
  // 给一个小延迟，防止鼠标不小心滑出时弹幕瞬间跑掉
  barrage.resumeTimer = setTimeout(() => {
    const index = activeBarrages.value.findIndex(b => b.key === barrage.key)
    if (index !== -1) {
      activeBarrages.value[index].paused = false
    }
  }, 300)
}

// === 核心动画循环 ===
let lastUpdateTime = Date.now()

const updateBarragePositions = () => {
  const now = Date.now()
  let deltaTime = (now - lastUpdateTime) / 1000

  // 修复：如果切后台太久，限制最大跳跃时间，防止弹幕瞬间消失
  if (deltaTime > 0.1) deltaTime = 0.016

  lastUpdateTime = now

  activeBarrages.value.forEach((barrage, index) => {
    if (!barrage.paused) {
      barrage.currentX -= barrage.speed * deltaTime
    }
  })

  // 清理飞出屏幕的弹幕
  activeBarrages.value = activeBarrages.value.filter(b => b.currentX > -500)

  animationFrameId = requestAnimationFrame(updateBarragePositions)
}

// 监听props变化
watch(() => props.speed, (newValue) => {
  if (typeof newValue === 'number') {
    barrageSpeed.value = newValue
  }
}, { immediate: true })

watch(() => props.showInput, (newValue) => {
  if (typeof newValue === 'boolean') {
    showInput.value = newValue
  }
}, { immediate: true })

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  startQueryTimer()

  lastUpdateTime = Date.now()
  animationFrameId = requestAnimationFrame(updateBarragePositions)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopQueryTimer()

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

defineExpose({
  addBarrage,
  updateSpeed: (speed: number) => barrageSpeed.value = speed,
  updateShowInput: (show: boolean) => showInput.value = show
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600&display=swap');

/* 全屏弹幕容器 */
.yuemu-barrage-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  user-select: none;
  animation: yuemu-hide-to-show 1.5s ease;
  overflow: hidden;
  font-family: 'Noto Sans SC', sans-serif;
  z-index: 10;
}

/* 弹幕舞台：全屏覆盖 */
.yuemu-barrage-stage {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 外层解耦器：只做位移，绝对不写 transition 否则会跟 JS 卡顿打架 */
.yuemu-barrage-wrapper {
  position: absolute;
  left: 0;
  will-change: transform;
  pointer-events: auto;
}

/* 弹幕项基础样式 (毛玻璃质感) - 负责视觉和动画 */
.yuemu-barrage-item {
  display: flex;
  align-items: center;
  padding: 4px 16px 4px 6px;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  color: #ffffff;
  font-size: 15px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  gap: 10px;
  letter-spacing: 0.5px;
  font-weight: 500;
  max-height: 44px;
  box-sizing: border-box;
  cursor: pointer;
  /* 仅针对外观样式做过渡，绝不包含 transform X 位移 */
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
  background 0.3s ease,
  box-shadow 0.3s ease;
}

/* 当前用户发送的消息 - 翠绿渐变背景 */
.yuemu-barrage-item.is-current-user {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.75) 0%, rgba(5, 150, 105, 0.65) 100%);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
}

/* 悬停/暂停状态 - 暖橙发光并放大，不会再贴边了！ */
.yuemu-barrage-item.is-paused {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.85) 0%, rgba(217, 119, 6, 0.75) 100%);
  border-color: rgba(245, 158, 11, 0.6);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
  transform: scale(1.1); /* 单纯的放大，不影响外层的 X 轴坐标 */
}

/* 弹幕头像 */
.yuemu-barrage-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  object-fit: cover;
}

.yuemu-barrage-text {
  line-height: 1.4;
  max-width: calc(100vw - 120px);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================== 输入框区域 ================== */
.yuemu-message-in {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  width: min(90vw, 600px);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.yuemu-message-in.is-show {
  opacity: 1;
  pointer-events: auto;
}

/* 输入框遮罩层：防止弹幕穿透交互 + 呼吸边框底座 */
.yuemu-input-mask {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 36px;
  padding: 6px;
  pointer-events: auto;
  position: relative;
}

/* 输入框呼吸边框动画 (利用 filter: blur 制造发光感) */
.yuemu-input-mask::before {
  content: '';
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  border-radius: 38px;
  background: linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6);
  background-size: 200% 200%;
  z-index: -1;
  filter: blur(8px);
  opacity: 0.6;
  animation: yuemu-breath-border 4s ease-in-out infinite;
}

/* 输入框本体 */
.yuemu-input-box {
  width: 100%;
  height: 60px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 30px;
  padding: 8px 12px 8px 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.yuemu-input-box:focus-within {
  background: rgba(15, 23, 42, 0.85);
  border-color: rgba(255, 255, 255, 0.2);
}

.yuemu-message-input {
  flex: 1;
  height: 44px;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.5px;
  outline: none;
  box-sizing: border-box;
}

.yuemu-message-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-size: 15px;
}

/* 发送按钮 */
.yuemu-send-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 22px;
  background: linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%);
  border: none;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  cursor: pointer;
}

.yuemu-send-btn:not(.is-disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  filter: brightness(1.05);
}

.yuemu-send-btn:not(.is-disabled):active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.yuemu-send-btn.is-disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  box-shadow: none;
  cursor: not-allowed;
}

/* ================== 动画定义 ================== */
@keyframes yuemu-hide-to-show {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes yuemu-breath-border {
  0% {
    background-position: 0% 50%;
    opacity: 0.4;
    filter: blur(8px);
  }
  50% {
    background-position: 100% 50%;
    opacity: 0.8;
    filter: blur(12px);
  }
  100% {
    background-position: 0% 50%;
    opacity: 0.4;
    filter: blur(8px);
  }
}

/* ================== 移动端适配 ================== */
@media screen and (max-width: 768px) {
  .yuemu-barrage-item {
    padding: 4px 12px 4px 4px;
    font-size: 14px;
    max-height: 40px;
    gap: 8px;
  }

  .yuemu-barrage-avatar {
    width: 28px;
    height: 28px;
  }

  .yuemu-barrage-text {
    max-width: calc(100vw - 80px);
  }

  .yuemu-input-mask {
    padding: 4px;
    border-radius: 30px;
  }

  .yuemu-input-mask::before {
    border-radius: 32px;
  }

  .yuemu-input-box {
    height: 52px;
    padding: 4px 8px 4px 16px;
    border-radius: 26px;
  }

  .yuemu-message-input {
    height: 38px;
    font-size: 15px;
  }

  .yuemu-send-btn {
    height: 38px;
    padding: 0 18px;
    font-size: 14px;
  }
}
</style>
