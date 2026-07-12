<template>
  <div class="yuemu-audio-bubble" :class="{ 'is-self': isSelf }" @click="debouncedTogglePlay">
    <div class="yuemu-audio-content">
      <div class="yuemu-play-btn">
        <i class="fas fa-play-circle" v-if="!isPlaying"></i>
        <i class="fas fa-pause-circle" v-else></i>
      </div>
      <div class="yuemu-audio-info">
        <div class="yuemu-wave-container">
          <div ref="waveformRef" class="yuemu-waveform"></div>

          <div class="yuemu-wave-group" v-show="!isWaveformReady">
            <div v-for="i in 4" :key="i" class="yuemu-wave-bar" :class="{ 'active': isPlaying }"
                 :style="{ animationDelay: `${i * 0.15}s` }">
            </div>
          </div>
        </div>
        <div class="yuemu-time-info">
          <span class="yuemu-duration">{{ audioDuration }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { debounce } from 'lodash-es'
import WaveSurfer from 'wavesurfer.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  url: string
  isSelf: boolean
}>()

const isPlaying = ref(false)
const duration = ref<number>(0)
const isLoading = ref(true)
const waveformRef = ref<HTMLElement | null>(null)
const wavesurfer = ref<WaveSurfer | null>(null)
const isWaveformReady = ref(false)

// 格式化音频时长
const audioDuration = computed(() => {
  if (isLoading.value) {
    return t('components.aiChat.loading')
  }
  if (!duration.value || isNaN(duration.value)) {
    return '0:00'
  }
  const minutes = Math.floor(duration.value / 60)
  const seconds = Math.floor(duration.value % 60)
  const paddedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`
  return `${minutes}:${paddedSeconds}`
})

// 停止所有其他音频播放
const stopAllOtherAudio = () => {
  document.querySelectorAll('audio').forEach(a => a.pause())
  document.querySelectorAll('wavesurfer').forEach((ws: any) => {
    if (ws !== wavesurfer.value) {
      ws.pause()
    }
  })
}

// 音频播放切换
const togglePlay = async () => {
  if (!wavesurfer.value || isLoading.value) return

  try {
    if (isPlaying.value) {
      wavesurfer.value.pause()
    } else {
      stopAllOtherAudio()
      if (wavesurfer.value.isPlaying()) {
        wavesurfer.value.pause()
      }
      wavesurfer.value.play()
    }
  } catch (error) {
    console.error('音频播放失败:', error)
    isPlaying.value = false
  }
}

// 防抖处理
const debouncedTogglePlay = debounce(togglePlay, 100)

// 初始化 WaveSurfer
const initWaveSurfer = () => {
  if (!waveformRef.value) return

  if (wavesurfer.value) {
    try {
      if (wavesurfer.value.isPlaying()) wavesurfer.value.pause()
    } catch (e) {}
    wavesurfer.value.destroy()
  }

  try {
    wavesurfer.value = WaveSurfer.create({
      container: waveformRef.value,
      // 动态适配自身和对方的波形颜色规范 (采用高雅的紫/灰调)
      waveColor: props.isSelf ? 'rgba(255, 255, 255, 0.4)' : 'rgba(114, 46, 209, 0.2)',
      progressColor: props.isSelf ? '#ffffff' : '#722ed1',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 24,
      normalize: true,
      interact: false,
      // @ts-ignore (兼容部分旧版 wavesurfer 类型)
      responsive: true,
      partialRender: true,
      forceDecode: false,
      xhr: {
        cache: 'default',
        timeout: 10000,
        headers: [
          ['Accept', 'audio/*']
        ]
      }
    })

    wavesurfer.value.on('ready', () => {
      isLoading.value = false
      isWaveformReady.value = true
      duration.value = wavesurfer.value?.getDuration() || 0
    })

    wavesurfer.value.on('play', () => { isPlaying.value = true })
    wavesurfer.value.on('pause', () => { isPlaying.value = false })
    wavesurfer.value.on('finish', () => { isPlaying.value = false })
    wavesurfer.value.on('error', (error) => {
      console.error('WaveSurfer 错误:', error)
      isLoading.value = false
      duration.value = 0
    })

    // 超时处理
    const loadTimeout = setTimeout(() => {
      if (isLoading.value) {
        isLoading.value = false
      }
    }, 15000)

    wavesurfer.value.load(props.url)

    wavesurfer.value.on('ready', () => clearTimeout(loadTimeout))
    wavesurfer.value.on('error', () => clearTimeout(loadTimeout))
  } catch (error) {
    console.error('初始化WaveSurfer失败:', error)
    isLoading.value = false
    duration.value = 0
  }
}

onMounted(() => {
  initWaveSurfer()

  const handlePauseOthers = () => {
    if (wavesurfer.value && isPlaying.value) {
      try { wavesurfer.value.pause() } catch (e) {}
    }
  }

  window.addEventListener('pauseOtherAudios', handlePauseOthers)

  onUnmounted(() => {
    window.removeEventListener('pauseOtherAudios', handlePauseOthers)
  })
})

onUnmounted(() => {
  if (wavesurfer.value) {
    try {
      if (wavesurfer.value.isPlaying()) wavesurfer.value.pause()
    } catch (e) {}
    wavesurfer.value.destroy()
    wavesurfer.value = null
  }
  isLoading.value = false
  isPlaying.value = false
})
</script>

<style lang="scss" scoped>
.yuemu-audio-bubble {
  display: inline-flex;
  padding: 10px 16px;
  border-radius: 2px 16px 16px 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 140px;
  max-width: 240px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }

  &:active {
    transform: translateY(0);
  }

  /* 发送方 (自己) 样式 */
  &.is-self {
    background: linear-gradient(135deg, #722ed1, #9254de);
    border-radius: 16px 2px 16px 16px;
    box-shadow: 0 4px 12px rgba(114, 46, 209, 0.2);

    .yuemu-play-btn {
      color: rgba(255, 255, 255, 0.95);
      &:hover { color: #fff; transform: scale(1.05); }
    }

    .yuemu-wave-bar { background: rgba(255, 255, 255, 0.4); }
    .yuemu-wave-bar.active { background: #fff; }

    .yuemu-time-info { color: rgba(255, 255, 255, 0.9); }
    .yuemu-waveform { opacity: 1; }
  }

  /* 接收方 (对方) 样式 */
  &:not(.is-self) {
    background: var(--card-background, #fff);
    border: 1px solid var(--border-color, rgba(0,0,0,0.06));

    .yuemu-play-btn {
      color: #722ed1;
      &:hover { color: #531dab; transform: scale(1.05); }
    }

    .yuemu-wave-bar { background: rgba(114, 46, 209, 0.2); }
    .yuemu-wave-bar.active { background: #722ed1; }

    .yuemu-time-info { color: var(--text-secondary, #666); }
  }

  /* 内部布局 */
  .yuemu-audio-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .yuemu-play-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;

    i { font-size: 26px; }
  }

  .yuemu-audio-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    justify-content: center;
  }

  .yuemu-wave-container {
    height: 24px;
    display: flex;
    align-items: center;
    position: relative;
    width: 100px; /* 给一个固定宽度或者 flex-grow，保证波形图有空间渲染 */
  }

  .yuemu-waveform {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
  }

  /* 模拟加载波形 */
  .yuemu-wave-group {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 100%;
    width: 100%;
  }

  .yuemu-wave-bar {
    width: 3px;
    height: 16px;
    border-radius: 2px;
    transition: all 0.2s ease;

    &.active {
      animation: yuemuWaveAnim 1s ease-in-out infinite;

      @for $i from 1 through 4 {
        &:nth-child(#{$i}) {
          animation-delay: #{$i * 0.15}s;
        }
      }
    }
  }

  .yuemu-time-info {
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    line-height: 1;
  }

  .yuemu-duration {
    font-variant-numeric: tabular-nums;
  }
}

/* 波形动画 */
@keyframes yuemuWaveAnim {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}

/* 深色模式兼容 (对方发来的气泡) */
@media (prefers-color-scheme: dark) { .yuemu-audio-bubble:not(.is-self) { background: #1f1f1f;
  border-color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

  .yuemu-play-btn { color: #9254de; } }
  .yuemu-wave-bar { background: rgba(146, 84, 222, 0.2); }
  .yuemu-wave-bar.active { background: #9254de; }
  .yuemu-time-info { color: #aaa; }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-audio-bubble:active, .yuemu-audio-bubble:hover,
  .yuemu-audio-bubble:active *, .yuemu-audio-bubble:hover *,
  .yuemu-play-btn:active, .yuemu-play-btn:hover,
  .yuemu-play-btn:active *, .yuemu-play-btn:hover *,
  .is-self:active, .is-self:hover,
  .is-self:active *, .is-self:hover * {
    transform: none !important;
  }
}
</style>
