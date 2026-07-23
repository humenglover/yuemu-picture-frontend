<template>
  <div class="yuemu-chroma-retro-universe" @touchmove.prevent>

    <div class="arcade-machine">

      <div class="marquee" @click="router.push({ name: 'Games' })">
        <div class="back-btn"><i class="fas fa-arrow-left"></i> {{ t('pages.games.colorChallengePage.return') }} </div>
        <h1 class="game-title">{{ t('pages.games.colorChallengePage.colorHunter') }}</h1>
        <div class="version">V 2.0</div>
      </div>

      <div class="screen-bezel">
        <div class="game-screen crt-effect">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="label">{{ t('pages.games.colorChallengePage.level') }}</span>
              <span class="value">{{ currentLevel }}</span>
            </div>
            <div class="hud-item center-item">
              <span class="label">{{ t('pages.games.colorChallengePage.score') }}</span>
              <span class="value highlight">{{ score }}</span>
            </div>
            <div class="hud-item">
              <span class="label">{{ t('pages.games.colorChallengePage.timeLimit') }}</span>
              <span class="value">{{ formatTime(Math.max(0, 300 - timeElapsed)) }}</span>
            </div>
          </div>

          <div class="stage-wrapper" ref="stageWrapperRef">
            <div
              class="pixel-grid"
              :style="{ width: stageSize + 'px', height: stageSize + 'px', ...gridStyle }"
              v-if="gameState === 'playing'"
            >
              <div
                v-for="(block, index) in blocks"
                :key="index"
                class="color-block"
                :style="{ backgroundColor: block.color }"
                @click="handleBlockClick(block.isTarget, $event)"
              ></div>
            </div>

            <TransitionGroup name="float">
              <div
                v-for="msg in floatMessages"
                :key="msg.id"
                class="float-msg"
                :class="msg.type"
                :style="{ left: msg.x + 'px', top: msg.y + 'px' }"
              >
                {{ msg.text }}
              </div>
            </TransitionGroup>

            <div v-if="gameState === 'start'" class="screen-overlay">
              <h2 class="subtitle">{{ t('pages.games.colorChallengePage.insertCoinStart') }}</h2>
              <div class="rules">
                <p>{{ t('pages.games.colorChallengePage.findUniqueColor') }}</p>
                <p>{{ t('pages.games.colorChallengePage.hitTargetScore') }}</p>
                <p>{{ t('pages.games.colorChallengePage.missTargetScore') }}</p>
                <p>{{ t('pages.games.colorChallengePage.challengeTimeLimit') }}</p>
              </div>
              <p class="blink hint-text"> {{ t('pages.games.colorChallengePage.pressStartButton') }} <i class="fas fa-caret-down"></i></p>
            </div>

            <div v-if="gameState === 'lost'" class="screen-overlay">
              <h2 class="subtitle danger">{{ t('pages.games.colorChallengePage.gameOver') }}</h2>
              <div class="stats">
                <p>{{ t('pages.games.colorChallengePage.reachedLevel', { level: currentLevel }) }}</p>
                <p>{{ t('pages.games.colorChallengePage.finalScorePts', { score: score }) }}</p>
                <p>{{ t('pages.games.colorChallengePage.raceTime', { time: formatTime(timeElapsed) }) }}</p>
              </div>
              <div class="rank">
                猎人评级: <span>{{ playerRank }}</span>
              </div>
              <p class="blink hint-text"> {{ t('pages.games.colorChallengePage.pressStartRetry') }} <i class="fas fa-caret-down"></i></p>
            </div>
          </div>

        </div>
      </div>

      <!-- 辅助监控诊断按钮区（界面纯中文设计，不挤压原操作键，极其适配移动端） -->
      <div class="diagnostic-trigger-bar">
        <button class="sys-btn mini-diag-btn" @click="openTerminal('ranking')">
          <span class="sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="sys-text">{{ t('pages.games.colorChallengePage.leaderboardBracket') }}</span>
        </button>
        <button class="sys-btn mini-diag-btn" @click="openTerminal('history')">
          <span class="sys-icon"><i class="fas fa-history"></i></span>
          <span class="sys-text">{{ t('pages.games.colorChallengePage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">
        <div class="coin-slot">
          <div class="slot"></div>
          <span>25¢</span>
        </div>

        <button
          class="sound-toggle-btn"
          @click="toggleSound"
          :title="isSoundEnabled ? t('pages.games.colorChallengePage.disableSound') : t('pages.games.colorChallengePage.enableSound')"
        >
          <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
        </button>

        <button
          class="arcade-start-btn"
          :class="{ 'pressed': isBtnPressed }"
          @mousedown="isBtnPressed = true"
          @mouseup="handleMainAction"
          @mouseleave="isBtnPressed = false"
          @touchstart.prevent="isBtnPressed = true"
          @touchend.prevent="handleMainAction"
        >
          <div class="btn-cap" :class="{ 'btn-stop': gameState === 'playing' }">
            {{ gameState === 'playing' ? t('pages.games.colorChallengePage.stop') : t('pages.games.colorChallengePage.start') }}
          </div>
        </button>
      </div>

    </div>

    <!-- 悬浮复古数据监控诊断终端 (街机显示器纯中文弹窗，移动端与桌面端自适应) -->
    <div class="retro-modal-overlay" v-if="isTerminalOpen" @click.self="closeTerminal">
      <div class="terminal-chassis">
        <div class="screw top-left"></div>
        <div class="screw top-right"></div>
        <div class="screw bottom-left"></div>
        <div class="screw bottom-right"></div>

        <div class="brand-plate flex-column-mobile">
          <span class="model-name terminal-title">{{ t('pages.games.colorChallengePage.crackTerminalS05') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.colorChallengePage.leaderboardBracketRight') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.colorChallengePage.historyLogBracketRight') }}
            </button>
          </div>
        </div>

        <div class="terminal-screen">
          <div class="scanlines"></div>
          <div class="crt-flicker"></div>
          <div class="screen-vignette"></div>

          <!-- 1. 排行榜面板 -->
          <div v-if="activeTab === 'ranking'" class="terminal-panel">
            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.colorChallengePage.ranking') }}</span>
              <span>{{ t('pages.games.colorChallengePage.crackTerminal') }}</span>
              <span>{{ t('pages.games.colorChallengePage.maxScore') }}</span>
              <span>{{ t('pages.games.colorChallengePage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.colorChallengePage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.colorChallengePage.noCrackRecord') }}
              </div>
              <div 
                v-else 
                v-for="(item, index) in rankings" 
                :key="item.id" 
                class="data-row ranking-layout-row"
                :class="{ 'my-row': item.userId === currentUserId }"
              >
                <span class="rank-num">{{ (rankPage - 1) * 8 + index + 1 }}</span>
                <span class="username clickable" @click="handleUserClick(item)">
                  <img 
                    :src="item.userAvatar || 'https://cube.elemecdn.com/3/c2/f0e8e5a243d89771698f4902d0cfgif.gif'" 
                    class="avatar-img" 
                  />
                  <span class="name-text">{{ item.userName || t('pages.games.colorChallengePage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.colorChallengePage.scorePoints', { score: item.score }) }}</span>
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
              </div>
            </div>

            <!-- 排行榜分页器 -->
            <div class="pagination-footer">
              <button 
                class="paging-btn" 
                :disabled="rankPage <= 1" 
                @click="changeRankPage(-1)"
              >
                {{ t('pages.games.colorChallengePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.colorChallengePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.colorChallengePage.saveTime') }}</span>
              <span>{{ t('pages.games.colorChallengePage.levelProgress') }}</span>
              <span>{{ t('pages.games.colorChallengePage.achievedScore') }}</span>
              <span>{{ t('pages.games.colorChallengePage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.colorChallengePage.readingLocalArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.colorChallengePage.noLocalArchive') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.colorChallengePage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.colorChallengePage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.colorChallengePage.huntPassed') : t('pages.games.colorChallengePage.notInitiated') }}
                </span>
              </div>
            </div>

            <!-- 历史记录分页器 -->
            <div class="pagination-footer">
              <button 
                class="paging-btn" 
                :disabled="historyPage <= 1" 
                @click="changeHistoryPage(-1)"
              >
                {{ t('pages.games.colorChallengePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.colorChallengePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.colorChallengePage.closeDiagTerminal') }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'

const router = useRouter()

// === 账户与诊断弹窗状态 ===
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)

const isTerminalOpen = ref(false)
const activeTab = ref<'ranking' | 'history'>('ranking')

const rankings = ref<any[]>([])
const rankingLoading = ref(false)
const rankPage = ref(1)
const totalRankPages = ref(1)

const historyRecords = ref<any[]>([])
const historyLoading = ref(false)
const historyPage = ref(1)
const totalHistoryPages = ref(1)

// 关卡网格配置：从 2x2 开始，最高到 20x20
const GRID_PROGRESSION = [
  2, 2, 2,
  3, 3, 3,
  4, 4, 4,
  5, 5, 5,
  6, 6, 6,
  7, 7, 7,
  8, 8, 8,
  9, 9, 9,
  10, 10, 10,
  11, 11, 11,
  12, 12, 12,
  13, 13, 13,
  14, 14, 14,
  15, 15, 15,
  16, 16, 16,
  17, 17, 17,
  18, 18, 18,
  19, 19, 19,
  20, 20, 20
]

// === 核心状态 ===
const gameState = ref<'start' | 'playing' | 'lost'>('start')
const currentLevel = ref(1)
const score = ref(0)
const timeElapsed = ref(0)
const blocks = ref<any[]>([])
let timer: number | null = null

const stageWrapperRef = ref<HTMLElement | null>(null)
const stageSize = ref(300)

const isBtnPressed = ref(false)
const floatMessages = ref<{id: number, text: string, x: number, y: number, type: 'good'|'bad'}[]>([])
let msgIdCounter = 0

// === 音效系统 ===
const isSoundEnabled = ref(true)
const correctSound = new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href)
const wrongSound = new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href)
const gameOverSound = new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href)
const levelUpSound = new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href)

correctSound.volume = 0.4
wrongSound.volume = 0.3
gameOverSound.volume = 0.5
levelUpSound.volume = 0.3

const playSound = (sound: HTMLAudioElement) => {
  if (!isSoundEnabled.value) return
  sound.currentTime = 0
  sound.play().catch(() => {})
}

const toggleSound = () => {
  isSoundEnabled.value = !isSoundEnabled.value
}

// === 计算属性 ===
const gridSize = computed(() => {
  const index = Math.min(currentLevel.value - 1, GRID_PROGRESSION.length - 1)
  return GRID_PROGRESSION[index]
})

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${gridSize.value}, 1fr)`,
  gridTemplateRows: `repeat(${gridSize.value}, 1fr)`,
  gap: gridSize.value > 10 ? '1px' : '3px'
}))

const playerRank = computed(() => {
  if (score.value < 1000) return 'D'
  if (score.value < 3000) return 'C'
  if (score.value < 8000) return 'B'
  if (score.value < 15000) return 'A'
  if (score.value < 30000) return 'S'
  return 'SS'
})

// === 核心逻辑 ===
function generateLevelData() {
  const size = gridSize.value
  const total = size * size

  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(Math.random() * 40) + 50
  const l = Math.floor(Math.random() * 40) + 30
  const baseColor = `hsl(${h}, ${s}%, ${l}%)`

  let diff: number
  if (currentLevel.value <= 10) {
    diff = Math.max(15, 20 - currentLevel.value * 0.5)
  } else if (currentLevel.value <= 30) {
    diff = Math.max(8, 15 - (currentLevel.value - 10) * 0.35)
  } else if (currentLevel.value <= 50) {
    diff = Math.max(4, 8 - (currentLevel.value - 30) * 0.2)
  } else {
    diff = Math.max(3, 4 - (currentLevel.value - 50) * 0.02)
  }

  const sign = Math.random() > 0.5 ? 1 : -1
  let targetL = l + (diff * sign)
  if (targetL > 90) targetL = l - diff
  if (targetL < 10) targetL = l + diff

  const targetColor = `hsl(${h}, ${s}%, ${targetL}%)`
  const targetIndex = Math.floor(Math.random() * total)

  const tempBlocks = []
  for (let i = 0; i < total; i++) {
    tempBlocks.push({
      color: i === targetIndex ? targetColor : baseColor,
      isTarget: i === targetIndex
    })
  }
  blocks.value = tempBlocks
}

function handleMainAction() {
  isBtnPressed.value = false
  if (gameState.value === 'start' || gameState.value === 'lost') {
    startGame()
  } else if (gameState.value === 'playing') {
    endGame() // 游戏中途点击“开始”按钮可以直接手动结束并结算！
  }
}

function startGame() {
  currentLevel.value = 1
  score.value = 0
  timeElapsed.value = 0
  gameState.value = 'playing'
  generateLevelData()
  startTimer()
}

function startTimer() {
  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    timeElapsed.value++
    // 竞速限制：5分钟一到立刻强制结算并终局！
    if (timeElapsed.value >= 300) {
      endGame()
    }
  }, 1000)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function showFloatingText(text: string, type: 'good'|'bad', e: MouseEvent | TouchEvent) {
  if (!stageWrapperRef.value) return
  const rect = stageWrapperRef.value.getBoundingClientRect()

  let clientX, clientY
  if (window.TouchEvent && e instanceof TouchEvent) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = (e as MouseEvent).clientX
    clientY = (e as MouseEvent).clientY
  }

  const msg = {
    id: msgIdCounter++,
    text, type,
    x: clientX - rect.left - 10,
    y: clientY - rect.top - 30
  }
  floatMessages.value.push(msg)
  setTimeout(() => {
    floatMessages.value = floatMessages.value.filter(m => m.id !== msg.id)
  }, 800)
}

function handleBlockClick(isTarget: boolean, e: Event) {
  if (gameState.value !== 'playing') return

  if (isTarget) {
    const baseScore = 100
    const stageMultiplier = 1 + (currentLevel.value * 0.1)
    const earnedScore = Math.floor(baseScore * stageMultiplier)
    score.value += earnedScore

    showFloatingText(`+${earnedScore}`, 'good', e as MouseEvent | TouchEvent)
    playSound(correctSound)

    currentLevel.value++
    if (currentLevel.value % 5 === 0) {
      playSound(levelUpSound)
    }
    generateLevelData()
  } else {
    const penalty = 50
    score.value = Math.max(0, score.value - penalty)
    showFloatingText(`-${penalty}`, 'bad', e as MouseEvent | TouchEvent)
    playSound(wrongSound)
  }
}

function endGame() {
  if (timer) clearInterval(timer)
  gameState.value = 'lost'
  playSound(gameOverSound)

  // 保存成绩到后台
  saveScore(score.value)
}

// 核心自适应逻辑
function resizeStage() {
  nextTick(() => {
    if (!stageWrapperRef.value) return
    const rect = stageWrapperRef.value.getBoundingClientRect()
    stageSize.value = Math.floor(Math.min(rect.width, rect.height) - 10)
  })
}

// --- 弹窗及数据接口 (纯中文界面) ---
const openTerminal = (tab: 'ranking' | 'history') => {
  if (gameState.value === 'playing') {
    // 弹窗拉起时挂起计时器，提供人性化游玩缓冲
    if (timer) clearInterval(timer)
  }
  activeTab.value = tab
  isTerminalOpen.value = true
  if (tab === 'ranking') {
    fetchRankings()
  } else {
    fetchHistory()
  }
}

const switchTab = (tab: 'ranking' | 'history') => {
  activeTab.value = tab
  if (tab === 'ranking') {
    fetchRankings()
  } else {
    fetchHistory()
  }
}

const closeTerminal = () => {
  isTerminalOpen.value = false
  // 弹窗关闭后，若在游玩状态，则重启动态物理计时
  if (gameState.value === 'playing') {
    startTimer()
  }
}

// 获取排行榜列表
const fetchRankings = async () => {
  rankingLoading.value = true
  try {
    const res = await getRankingListUsingPost({
      gameType: 'color_challenge',
      current: rankPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.colorChallengePage.getRankingsError'), err)
  } finally {
    rankingLoading.value = false
  }
}

const changeRankPage = (delta: number) => {
  const target = rankPage.value + delta
  if (target >= 1 && target <= totalRankPages.value) {
    rankPage.value = target
    fetchRankings()
  }
}

// 获取个人历史记录
const fetchHistory = async () => {
  if (!currentUserId.value) return
  historyLoading.value = true
  try {
    const res = await getMyHistoryRecordsUsingPost({
      gameType: 'color_challenge',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.colorChallengePage.getArchiveError'), err)
  } finally {
    historyLoading.value = false
  }
}

const changeHistoryPage = (delta: number) => {
  const target = historyPage.value + delta
  if (target >= 1 && target <= totalHistoryPages.value) {
    historyPage.value = target
    fetchHistory()
  }
}

const handleUserClick = (item: any) => {
  if (!item || !item.userId) return
  router.push({ name: 'UserDetail', params: { id: item.userId } })
}

// 保存最终得分
const saveScore = async (finalScore: number) => {
  if (finalScore < 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.colorChallengePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'color_challenge',
      level: `${currentLevel.value}关`,
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.colorChallengePage.reportFinalResultError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.colorChallengePage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

onMounted(() => {
  resizeStage()
  window.addEventListener('resize', resizeStage)

  // 预加载，保障秒开体验
  fetchRankings()
  fetchHistory()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('resize', resizeStage)
})
</script>

<style scoped>
/* 引入复古像素字体，如果加载失败则回退到代码字体 */
@font-face {
  font-family: 'PressStart2P';
  src: url('https://fonts.cdnfonts.com/s/14227/PressStart2P-Regular.woff') format('woff');
  font-display: swap;
}

/* 彻底锁定移动端滚动与误触 */
* {
  user-select: none;
  -webkit-touch-callout: none;
  box-sizing: border-box;
}

.yuemu-chroma-retro-universe {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh; height: 100dvh;
  background-color: var(--background);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'PressStart2P', Consolas, monospace;
  overflow: hidden;
}

/* 机台外壳完全继承 var(--card-background) */
.arcade-machine {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 500px;
  height: 100%;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow:
    10px 10px 0 var(--shadow-color),
    inset 2px 2px 0 rgba(255,255,255,0.05);
}

/* 招牌区域 */
.marquee {
  background: var(--console-body);
  border-bottom: 4px solid var(--border-color);
  padding: 15px;
  text-align: center;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.back-btn { font-size: 10px; color: var(--text-secondary); transition: color 0.2s;}
.marquee:hover .back-btn { color: var(--text-primary); }
.game-title {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  text-shadow: 2px 2px 0 var(--shadow-color);
  letter-spacing: 1px;
}
.version { font-size: 10px; color: var(--text-secondary); }

/* 屏幕包裹边框 */
.screen-bezel {
  flex: 1;
  background: var(--console-body);
  padding: 20px;
  border-bottom: 4px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 10px 20px var(--shadow-color);
  min-height: 0;
}

/* 核心屏幕 */
.game-screen {
  flex: 1;
  background: var(--background);
  border: 4px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px var(--shadow-color);
}

/* 轻微复古扫描线 */
.crt-effect::after {
  content: " "; display: block; position: absolute; inset: 0;
  background: linear-gradient(rgba(0, 0, 0, 0) 50%, var(--shadow-color) 50%);
  background-size: 100% 4px; z-index: 50; pointer-events: none;
  opacity: 0.3;
}

/* 顶部 HUD */
.hud-bar {
  display: flex;
  justify-content: space-between;
  background: var(--card-background);
  border-bottom: 2px solid var(--border-color);
  padding: 12px 15px;
}
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.center-item { flex: 1; }
.label { color: var(--text-secondary); font-size: 10px; }
.value { color: var(--text-primary); font-size: 16px; font-weight: bold; }
.highlight { color: var(--link-color); text-shadow: 1px 1px 0 var(--shadow-color); }

/* 游戏舞台容器 */
.stage-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  min-height: 0;
  min-width: 0;
}

/* 方格矩阵 */
.pixel-grid {
  background: var(--border-color);
  border: 2px solid var(--border-color);
  box-shadow: 0 4px 15px var(--shadow-color);
  /* 确保正方形网格不会超出容器 */
  max-width: 100%;
  max-height: 100%;
}

.color-block {
  width: 100%;
  height: 100%;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow:
    inset 2px 2px 0 rgba(255,255,255,0.2),
    inset -2px -2px 0 rgba(0,0,0,0.1);
}
.color-block:active {
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.3);
}

/* 浮动文字 */
.float-msg {
  position: absolute;
  font-size: 16px;
  font-weight: bold;
  pointer-events: none;
  z-index: 60;
  text-shadow: 2px 2px 0 var(--background);
}
.float-msg.good { color: var(--link-color); }
.float-msg.bad { color: #FF3B30; }
.float-enter-active, .float-leave-active { transition: all 0.6s ease-out; }
.float-enter-from { opacity: 1; transform: translateY(0); }
.float-leave-to { opacity: 0; transform: translateY(-30px); }

/* 屏幕内菜单层 */
.screen-overlay {
  position: absolute; inset: 0;
  background: var(--ios-modal-bg);
  backdrop-filter: blur(10px);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 40; padding: 20px; text-align: center;
  border-radius: inherit;
}
.subtitle { font-size: 18px; color: var(--text-primary); margin-bottom: 20px; }
.subtitle.danger { color: #FF3B30; }

.rules, .stats { margin-bottom: 30px; display: flex; flex-direction: column; gap: 15px; font-size: 10px; color: var(--text-secondary); text-align: left; }
.stats { text-align: center; }
.rank { font-size: 14px; color: var(--text-primary); margin-bottom: 30px; }
.rank span { font-size: 24px; color: var(--link-color); margin-left: 10px; }

.hint-text { font-size: 10px; color: var(--text-primary); margin-top: auto; }
.blink { animation: stepBlink 1s step-end infinite; }
@keyframes stepBlink { 50% { opacity: 0; } }

/* === 极客诊断通道按钮 (防挤压街机控制，纯中文) === */
.diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
  padding: 0 30px;
}
.mini-diag-btn {
  flex: 1;
  background: var(--console-body);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--border-color);
  transition: all 0.1s;
}
.mini-diag-btn:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--border-color);
}
.mini-diag-btn .sys-icon { font-size: 14px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.mini-diag-btn .sys-text { font-size: 8px; color: var(--text-secondary); font-weight: bold; }

/* 底部投币与按键区 */
.control-panel {
  background: var(--card-background);
  border-top: 2px solid var(--border-color);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 120px;
  width: 100%;
}

/* 投币孔装饰 */
.coin-slot {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  background: var(--console-body); padding: 15px 12px; border-radius: 8px;
  border: 3px solid var(--border-color);
  box-shadow:
    inset 0 2px 4px var(--shadow-color),
    0 2px 8px rgba(0,0,0,0.1);
}
.slot {
  width: 6px; height: 24px;
  background: linear-gradient(to bottom, var(--text-primary) 0%, var(--text-secondary) 100%);
  border-radius: 2px;
  box-shadow:
    inset 2px 2px 3px rgba(0,0,0,0.4),
    0 1px 2px rgba(255,255,255,0.1);
}
.coin-slot span {
  font-size: 11px;
  color: var(--text-primary);
  font-weight: bold;
  text-shadow: 1px 1px 0 var(--shadow-color);
}

/* 音效开关按钮 */
.sound-toggle-btn {
  background: var(--console-body);
  border: 3px solid var(--border-color);
  border-radius: 8px;
  width: 50px;
  height: 50px;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--text-primary);
  box-shadow: 0 4px 0 var(--shadow-color);
  transition: all 0.1s;
}
.sound-toggle-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--shadow-color);
}

/* 街机按钮 */
.arcade-start-btn {
  background: var(--console-body);
  border: 4px solid var(--border-color);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow:
    0 6px 0 var(--shadow-color),
    inset 0 2px 5px rgba(255,255,255,0.1);
  padding: 0;
  outline: none;
}

.btn-cap {
  background: var(--link-color);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  box-shadow:
    0 4px 0 var(--link-hover-color),
    inset 0 4px 5px rgba(255,255,255,0.2),
    inset 0 -2px 5px rgba(0,0,0,0.2);
  transition: all 0.1s;
}

.btn-cap.btn-stop {
  background: #ff3b30 !important;
  box-shadow:
    0 4px 0 #b3241d !important,
    inset 0 4px 5px rgba(255,255,255,0.2),
    inset 0 -2px 5px rgba(0,0,0,0.2) !important;
}
.arcade-start-btn.pressed .btn-cap.btn-stop {
  transform: translateY(4px);
  box-shadow:
    0 0 0 #b3241d,
    inset 0 2px 3px rgba(255,255,255,0.2) !important;
}

.arcade-start-btn.pressed {
  transform: translateY(4px);
  box-shadow: 0 2px 0 var(--shadow-color);
}
.arcade-start-btn.pressed .btn-cap {
  transform: translateY(4px);
  box-shadow:
    0 0 0 var(--link-hover-color),
    inset 0 2px 3px rgba(255,255,255,0.2);
}

/* ================= 悬浮复古弹窗数据监控终端 (界面纯中文设计) ================= */
.retro-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(2, 6, 3, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  padding: 15px;
  animation: overlay-fade 0.25s ease-out;
}

@keyframes overlay-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.terminal-chassis {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: #0d1510;
  border: 4px solid #1a3324;
  border-radius: 16px;
  padding: 25px 20px;
  box-shadow: 0 10px 30px rgba(0, 255, 65, 0.15);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 520px;
  animation: modal-scale 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modal-scale {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.screw {
  position: absolute; width: 12px; height: 12px;
  background: var(--border-color); border: 2px solid var(--border-color); border-radius: 50%;
}
.screw::after {
  content: ''; position: absolute; top: 50%; left: 2px; right: 2px; height: 2px;
  background: var(--border-color); transform: translateY(-50%) rotate(45deg);
}
.top-left { top: 12px; left: 12px; }
.top-right { top: 12px; right: 12px; }
.bottom-left { bottom: 12px; left: 12px; }
.bottom-right { bottom: 12px; right: 12px; }

.brand-plate {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 2px solid var(--border-color); padding-bottom: 8px;
}
.model-name {
  font-family: inherit; font-weight: 900; font-size: 10px; letter-spacing: 1px;
}
.terminal-title {
  color: #00FF41;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.4);
}

.tab-buttons {
  display: flex;
  gap: 10px;
}

.tab-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #00FF41;
  background-color: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
}

.tab-btn:hover {
  color: var(--text-primary);
}

.terminal-screen {
  position: relative;
  flex: 1;
  background-color: #020603;
  border: 4px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(0, 255, 65, 0.1);
  display: flex;
  flex-direction: column;
}

.scanlines {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.3) 50%);
  background-size: 100% 4px; z-index: 50; pointer-events: none;
}
.crt-flicker {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(100, 181, 246, 0.02);
  z-index: 51; pointer-events: none; animation: flicker 0.12s infinite;
}
.screen-vignette {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  box-shadow: inset 0 0 120px rgba(0,0,0,0.9); pointer-events: none; z-index: 49;
}
@keyframes flicker { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.9; } }

.terminal-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
  z-index: 30;
}

.panel-header {
  font-family: inherit;
  font-size: 11px;
  font-weight: bold;
  color: #00FF41;
  border-bottom: 2px solid rgba(0, 255, 65, 0.3);
  padding-bottom: 8px;
  margin-bottom: 10px;
  text-shadow: 0 0 4px rgba(0, 255, 65, 0.4);
  display: grid;
}

/* 字段布局结构 */
.ranking-layout-header,
.ranking-layout-row {
  grid-template-columns: 0.6fr 1.8fr 1.2fr 1.6fr;
}

.history-layout-header,
.history-layout-row {
  grid-template-columns: 1.6fr 1.2fr 1.2fr 1.2fr;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
}

.scrollable::-webkit-scrollbar {
  width: 4px;
}
.scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 65, 0.3);
  border-radius: 2px;
}

.data-row {
  align-items: center;
  font-family: inherit;
  font-size: 11px;
  color: rgba(0, 255, 65, 0.85);
  padding: 6px 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: grid;
}

.data-row:hover {
  background: rgba(0, 255, 65, 0.08);
}

.data-row.my-row {
  background: rgba(0, 255, 65, 0.12);
  border: 1px solid rgba(0, 255, 65, 0.4);
  color: #00FF41;
  font-weight: bold;
}

.rank-num {
  font-weight: 900;
  color: #00FF41;
  text-shadow: 0 0 3px rgba(0, 255, 65, 0.5);
}

.username {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.username.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}
.username.clickable:hover {
  opacity: 0.85;
  text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
}

.avatar-img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #00FF41;
  background-color: #000;
  object-fit: cover;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-val {
  font-weight: bold;
}

.text-neon-green {
  color: #00FF41;
  text-shadow: 0 0 3px rgba(0, 255, 65, 0.4);
}

.time-val {
  font-size: 10px;
  opacity: 0.8;
}

.status-val.success {
  color: #00FF41;
  text-shadow: 0 0 3px rgba(0, 255, 65, 0.4);
}

.status-val.error {
  color: #FF2A2A;
  text-shadow: 0 0 3px rgba(255, 42, 42, 0.4);
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-family: inherit;
  font-size: 11px;
  color: rgba(0, 255, 65, 0.6);
  text-align: center;
  padding: 40px 0;
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 2px solid rgba(0, 255, 65, 0.3);
  margin-top: 10px;
}

.paging-btn {
  background: none;
  border: 2px solid rgba(0, 255, 65, 0.6);
  border-radius: 4px;
  color: #00FF41;
  font-family: inherit;
  font-size: 11px;
  font-weight: bold;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 2px 2px 0px rgba(0, 255, 65, 0.6);
}

.paging-btn:hover:not(:disabled) {
  background: rgba(0, 255, 65, 0.1);
  box-shadow: 1px 1px 0px rgba(0, 255, 65, 0.6);
  transform: translate(1px, 1px);
}

.paging-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  box-shadow: none;
}

.page-indicator {
  font-family: inherit;
  font-size: 11px;
  color: #00FF41;
  font-weight: bold;
}

.modal-footer {
  display: flex;
  justify-content: center;
  padding: 10px 15px;
  background-color: #020603;
  border-top: 2px dashed rgba(0, 255, 65, 0.3);
}

.close-btn {
  width: 100%;
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
  background: transparent;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
}

.danger-btn {
  color: #FF2A2A;
  border: 2px solid #FF2A2A;
  box-shadow: 3px 3px 0px #FF2A2A;
}

.danger-btn:active {
  box-shadow: 0px 0px 0px #FF2A2A;
}

/* === 响应式调整 === */
@media screen and (max-width: 768px) {
  .yuemu-chroma-retro-universe { padding: 0; }
  .arcade-machine { border-radius: 0; border: none; box-shadow: none; }

  .marquee { padding: 12px 10px; }
  .game-title { font-size: 14px; }
  .screen-bezel { padding: 10px; border: none; box-shadow: none; }

  .hud-bar { padding: 10px; }
  .label { font-size: 8px; }
  .value { font-size: 14px; }

  .diagnostic-trigger-bar {
    padding: 0 15px;
  }

  .control-panel {
    height: 100px;
    padding: 10px 20px;
  }
  .sound-toggle-btn { width: 45px; height: 45px; font-size: 1rem; }
  .arcade-start-btn { width: 70px; height: 70px; }
  .btn-cap { width: 54px; height: 54px; font-size: 8px; }
  
  .flex-column-mobile {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 10px;
  }
  
  .terminal-chassis {
    padding: 15px;
    border-radius: 12px;
    min-height: 480px;
  }
}

@media screen and (max-width: 360px) {
  .rules { font-size: 8px; }
  .subtitle { font-size: 14px; }
  .coin-slot { padding: 10px 8px; }
}

/* 响应式重构：PC端左右分栏街机化 */
@media (min-width: 769px) {
  .arcade-machine {
    max-width: 960px;
    height: 85vh;
    max-height: 900px;
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto auto 1fr;
    /* 取消 grid-template-areas，直接用行列跨度分配 */
    border-radius: 16px;
  }
  .marquee { 
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    border-right: 4px solid var(--border-color); 
  }
  .screen-bezel { 
    grid-column: 1 / 2;
    grid-row: 2 / 4;
    border-bottom: none; 
    border-right: 4px solid var(--border-color); 
    padding: 15px; 
  }
  .diagnostic-trigger-bar { 
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    flex-direction: column; 
    justify-content: center; 
    padding: 15px; 
    border-bottom: 4px solid var(--border-color); 
    gap: 15px; 
  }
  .control-panel { 
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    flex-direction: column; 
    height: 100%; 
    border-top: none; 
    padding: 30px 20px; 
    justify-content: space-around; 
  }
}

/* 响应式重构：移动端极限减负 */
@media (max-width: 768px) {
  .arcade-machine {
    border: none;
    border-radius: 0;
    max-height: 100dvh;
    box-shadow: none;
  }
}
</style>
