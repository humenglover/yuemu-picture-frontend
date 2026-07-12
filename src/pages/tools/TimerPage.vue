<template>
  <div class="yuemu-retro-timer-v3" :class="{ 'dark-theme': isDark }">
    <div class="paper-texture"></div>
    <div class="zen-glow"></div>

    <div class="timer-container">
      <div class="mode-switch-wrapper">
        <div class="mode-rail">
          <button
            :class="['mode-tab', { active: mode === 'stopwatch' }]"
            @click="switchMode('stopwatch')"
          >
            <span>{{ t('pages.tools.timerPage.stopwatchClock') }}</span>
          </button>
          <button
            :class="['mode-tab', { active: mode === 'countdown' }]"
            @click="switchMode('countdown')"
          >
            <span>{{ t('pages.tools.timerPage.countdownTimer') }}</span>
          </button>
        </div>
      </div>

      <div class="chronos-display">
        <div class="inner-border">
          <template v-if="mode === 'stopwatch'">
            <div class="main-time-text">{{ formatTime(stopwatchTime) }}</div>
          </template>

          <template v-else>
            <div class="countdown-inputs" v-if="!isRunning && countdownTime === 0">
              <input
                type="number"
                v-model="countdownMinutes"
                class="retro-input"
                min="0"
                max="99"
              ><span class="unit">{{ t('pages.tools.timerPage.minuteUnit') }}</span>
              <input
                type="number"
                v-model="countdownSeconds"
                class="retro-input"
                min="0"
                max="59"
              ><span class="unit">{{ t('pages.tools.timerPage.secondUnit') }}</span>
            </div>
            <div v-else class="main-time-text" :class="{ 'warning': countdownTime < 5000 && isRunning }">
              {{ formatTime(countdownTime) }}
            </div>
          </template>
        </div>
      </div>

      <div class="controls-grid">
        <template v-if="mode === 'stopwatch'">
          <button class="retro-btn start" @click="startStopwatch" v-if="!isRunning">{{ t('pages.tools.timerPage.text_a3e3b883') }}</button>
          <button class="retro-btn pause" @click="pauseStopwatch" v-else>{{ t('pages.tools.timerPage.text_8d63ef38') }}</button>
          <button class="retro-btn secondary" @click="lapStopwatch" :disabled="!isRunning">{{ t('pages.tools.timerPage.lap') }}</button>
          <button class="retro-btn secondary" @click="resetStopwatch">{{ t('pages.tools.timerPage.resetBtn') }}</button>
        </template>

        <template v-else>
          <button class="retro-btn start" @click="startCountdown" v-if="!isRunning">{{ t('pages.tools.timerPage.text_cc42dd31') }}</button>
          <button class="retro-btn pause" @click="pauseCountdown" v-else>{{ t('pages.tools.timerPage.pauseClock') }}</button>
          <button class="retro-btn secondary" @click="resetCountdown">{{ t('pages.tools.timerPage.resetBtn') }}</button>
        </template>
      </div>

      <div class="record-panel">
        <div class="panel-header">
          <span class="brush-icon"><i class="fas fa-scroll"></i></span>
          <h3>{{ mode === 'stopwatch' ? t('pages.tools.timerPage.lapArchive') : t('pages.tools.timerPage.historyTimer') }}</h3>
          <button class="clear-btn" @click="clearCurrentRecords">{{ t('pages.tools.timerPage.clearAll') }}</button>
        </div>

        <div class="record-list custom-scrollbar">
          <TransitionGroup name="list-fade">
            <template v-if="mode === 'stopwatch'">
              <div class="record-item" v-for="(lap, index) in laps" :key="`lap-${laps.length - index}`">
                <span class="idx">{{ t('pages.tools.timerPage.text_dcfe57bd').replace('{0}', String(laps.length - index)) }}</span>
                <span class="val">{{ formatTime(lap) }}</span>
              </div>
            </template>
            <template v-else>
              <div class="record-item history" v-for="(item, index) in timerHistory" :key="index" @click="useHistoryTime(item)">
                <div class="info">
                  <span class="val">{{ formatTime(item.duration) }}</span>
                  <span class="date">{{ formatDate(item.date) }}</span>
                </div>
                <span class="re-use">{{ t('pages.tools.timerPage.reuse') }}</span>
              </div>
            </template>
          </TransitionGroup>
        </div> </div> </div> </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface TimerHistoryItem { duration: number; date: number }

const isDark = ref(document.documentElement.classList.contains('dark-theme'))
const mode = ref<'stopwatch' | 'countdown'>('stopwatch')
const isRunning = ref(false)
const stopwatchTime = ref(0)
const countdownTime = ref(0)
const countdownMinutes = ref(0)
const countdownSeconds = ref(0)
const laps = ref<number[]>([])
const timerHistory = ref<TimerHistoryItem[]>([])
let intervalId: number | null = null

onMounted(() => {
  const savedHistory = localStorage.getItem('retro_timer_history')
  if (savedHistory) timerHistory.value = JSON.parse(savedHistory)

  // 监听暗色模式变化
  const obs = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark-theme')
  })
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const min = Math.floor(totalSeconds / 60)
  const sec = totalSeconds % 60
  const cs = Math.floor((ms % 1000) / 10)
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const switchMode = (newMode: 'stopwatch' | 'countdown') => {
  if (isRunning.value) stopTimer()
  mode.value = newMode
  resetTimer()
}

const startTimer = (callback: () => void) => {
  if (isRunning.value) return
  isRunning.value = true
  intervalId = window.setInterval(callback, 10)
}

const stopTimer = () => {
  if (intervalId !== null) { clearInterval(intervalId); intervalId = null }
  isRunning.value = false
}

const resetTimer = () => {
  stopTimer()
  if (mode.value === 'stopwatch') {
    stopwatchTime.value = 0
    laps.value = []
  } else {
    countdownTime.value = 0
  }
}

// Stopwatch
const startStopwatch = () => startTimer(() => { stopwatchTime.value += 10 })
const pauseStopwatch = () => stopTimer()
const resetStopwatch = () => resetTimer()
const lapStopwatch = () => { if (isRunning.value) laps.value.unshift(stopwatchTime.value) }

// Countdown
const startCountdown = () => {
  if (countdownTime.value === 0) {
    const duration = countdownMinutes.value * 60000 + countdownSeconds.value * 1000
    if (duration <= 0) return message.warning(t('pages.tools.timerPage.pleaseTurnDial'))
    countdownTime.value = duration
    // Add to history
    timerHistory.value.unshift({ duration, date: Date.now() })
    if (timerHistory.value.length > 10) timerHistory.value.pop()
    localStorage.setItem('retro_timer_history', JSON.stringify(timerHistory.value))
  }

  startTimer(() => {
    if (countdownTime.value > 0) {
      countdownTime.value -= 10
    } else {
      stopTimer()
      message.success(t('pages.tools.timerPage.timeIsUp'))
    }
  })
}

const pauseCountdown = () => stopTimer()
const resetCountdown = () => resetTimer()
const useHistoryTime = (item: TimerHistoryItem) => {
  if (isRunning.value) return
  countdownTime.value = item.duration
  message.info(t('pages.tools.timerPage.recoveredHistoryTime'))
}

const clearCurrentRecords = () => {
  if (mode.value === 'stopwatch') laps.value = []
  else {
    timerHistory.value = []
    localStorage.removeItem('retro_timer_history')
  }
}

onUnmounted(() => stopTimer())
</script>

<style scoped lang="scss">
.yuemu-retro-timer-v3 {
  --ink: #3d2b1f;
  --paper: #f5f0e8;
  --accent: #c62828;
  --border: rgba(187, 146, 94, 0.4);

  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: var(--background);
  transition: all 0.5s ease;
  overflow: hidden;
  position: relative;
}

/* 装饰纹理 */
.paper-texture {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.05;
  background-image: url('https://www.transparenttextures.com/patterns/old-paper.png');
}

.zen-glow {
  position: absolute; width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(187, 146, 94, 0.1) 0%, transparent 70%);
  filter: blur(50px);
  z-index: 0;
}

.timer-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: var(--edit-box-kraft-bg);
  border: 1px solid var(--edit-box-kraft-border);
  border-radius: 4px;
  padding: 30px;
  box-shadow: 10px 10px 0 var(--border-color);
}

/* 模式切换 */
.mode-switch-wrapper {
  margin-bottom: 40px;
  .mode-rail {
    display: flex;
    background: var(--edit-box-kraft-dark);
    padding: 4px;
    border-radius: 2px;
  }
  .mode-tab {
    flex: 1; border: none; background: transparent;
    padding: 10px; cursor: pointer;
    font-family: var(--font-family-base);
    color: var(--edit-box-kraft-text);
    opacity: 0.6; transition: all 0.3s;
    &.active {
      opacity: 1;
      background: var(--edit-box-kraft-bg);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
  }
}

/* 计时大屏 */
.chronos-display {
  background: #fff;
  padding: 10px;
  border: 2px solid var(--ink);
  margin-bottom: 30px;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.05);

  .inner-border {
    border: 1px solid var(--border);
    padding: 30px 10px;
    text-align: center;
  }
}

.main-time-text {
  font-size: 52px;
  font-family: "Monaco", monospace;
  color: var(--ink);
  font-weight: bold;
  &.warning { color: var(--accent); animation: shake 0.1s infinite; }
}

.countdown-inputs {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  .retro-input {
    width: 80px; font-size: 40px; border: none; border-bottom: 2px solid var(--ink);
    text-align: center; font-family: "Monaco", monospace; background: transparent;
    color: var(--ink);
    &:focus { outline: none; border-bottom-color: var(--accent); }
  }
  .unit { font-size: 18px; color: var(--ink); margin-top: 15px; }
}

/* 按钮组 */
.controls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.retro-btn {
  padding: 12px; border: none; border-radius: 4px;
  font-family: var(--font-family-base); font-size: 18px;
  cursor: pointer; transition: all 0.1s;
  box-shadow: 0 4px 0 rgba(0,0,0,0.1);

  &.start { background: var(--accent); color: white; box-shadow: 0 4px 0 #8e0000; grid-column: span 2; }
  &.pause { background: #5d4037; color: white; box-shadow: 0 4px 0 #3d2b1f; grid-column: span 2; }
  &.secondary { background: var(--edit-box-kraft-dark); color: var(--edit-box-kraft-text); }

  &:active { transform: translateY(3px); box-shadow: 0 1px 0 transparent; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

/* 记录列表 */
.record-panel {
  border-top: 1px dashed var(--border);
  padding-top: 20px;

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 15px;
    h3 { margin: 0; font-size: 18px; flex: 1; margin-left: 10px; color: var(--ink); }
    .clear-btn { background: transparent; border: 1px solid var(--border); font-size: 12px; cursor: pointer; }
  }
}

.record-list {
  max-height: 180px; overflow-y: auto; padding-right: 5px;
}

.record-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px; margin-bottom: 8px;
  background: rgba(255,255,255,0.5);
  border-left: 3px solid var(--ink);
  font-family: "Monaco", monospace;
  transition: all 0.3s;

  .idx { font-size: 12px; opacity: 0.6; }
  .val { font-weight: bold; color: var(--ink); }

  &.history {
    cursor: pointer;
    &:hover { background: #fff; transform: translateX(5px); }
    .date { display: block; font-size: 10px; opacity: 0.5; }
    .re-use { font-family: var(--font-family-base); color: var(--accent); font-size: 12px; }
  }
}

/* 暗色模式覆盖 */
.dark-theme {
  .chronos-display { background: #1a1a1a; border-color: var(--edit-box-kraft-border); }
  .main-time-text { color: var(--edit-box-kraft-text-dark); }
  .retro-input { color: var(--edit-box-kraft-text-dark); border-bottom-color: var(--edit-box-kraft-border); }
  .record-item { background: rgba(0,0,0,0.2); }
  .yuemu-retro-timer-v3 { background: #121212; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.custom-scrollbar {
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
}

.list-fade-enter-active, .list-fade-leave-active { transition: all 0.4s ease; }
.list-fade-enter-from { opacity: 0; transform: translateY(-10px); }
.list-fade-leave-to { opacity: 0; transform: translateX(20px); }
</style>
