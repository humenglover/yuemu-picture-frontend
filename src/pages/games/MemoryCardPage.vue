<template>
  <div class="yuemu-retro-memory-universe" :class="{ 'is-mobile': isMobile }" @touchmove.prevent>
    <div class="arcade-handheld">

      <div class="handheld-header">
        <div class="brand"> {{ t('pages.games.memoryCardPage.memoryTerminal') }} <span>{{ t('pages.games.memoryCardPage.eightBit') }}</span></div>
        <div class="speaker">
          <div v-for="i in 8" :key="i" class="dot"></div>
        </div>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass crt-effect">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.memoryCardPage.timeSpent') }}</span>
              <span class="hud-val">{{ formatTime(gameState.time) }}</span>
            </div>
            <div class="hud-item center-item">
              <span class="hud-label">{{ t('pages.games.memoryCardPage.flipCard') }}</span>
              <span class="hud-val highlight">{{ gameState.flips }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.memoryCardPage.bestRecordLabel') }}</span>
              <span class="hud-val">{{ formatTime(gameState.bestTime || 0) }}</span>
            </div>
          </div>

          <div class="stage-container" :class="`grid-${difficulty}`">

            <div v-for="(card, index) in cards"
                 :key="index"
                 class="memory-card"
                 :class="{ 'flipped': card.isFlipped, 'matched': card.isMatched }"
                 @click="handleCardClick(index)">
              <div class="card-inner">
                <div class="card-front">
                  <span class="card-icon"><i :class="card.icon"></i></span>
                </div>
                <div class="card-back">
                  <div class="pixel-pattern"></div>
                </div>
              </div>
            </div>

            <div v-if="gameState.isGameOver" class="screen-overlay result-overlay">
              <div class="trophy">
                <i class="fas fa-trophy win-trophy"></i>
              </div>
              <h2 class="pixel-title">{{ t('pages.games.memoryCardPage.levelCompleted') }}</h2>
              <div class="final-stats">
                <p>{{ t('pages.games.memoryCardPage.finalTime', { time: formatTime(gameState.time) }) }}</p>
                <p>{{ t('pages.games.memoryCardPage.flipCount', { flips: gameState.flips }) }}</p>
              </div>
              <div v-if="isNewRecord" class="new-record-tag">{{ t('pages.games.memoryCardPage.newRecord') }}</div>
              <p class="blink hint-text">{{ t('pages.games.memoryCardPage.pressStartRetryDown') }}</p>
            </div>

            <div v-if="!isPlaying && !gameState.isGameOver" class="screen-overlay menu-overlay">
              <h1 class="pixel-title">{{ t('pages.games.memoryCardPage.selectDifficulty') }}</h1>
              <div class="difficulty-menu">
                <div v-for="d in ['beginnerLevel', 'beginner', 'intermediate', 'advanced', 'expertLevel', 'masterLevel']"
                     :key="d"
                     class="menu-item"
                     :class="{ 'active': difficulty === d }"
                     @click="difficulty = d">
                  <span class="arrow" v-if="difficulty === d"><i class="fas fa-caret-right"></i></span> {{ t('pages.games.memoryCardPage.' + d) }}
                </div>
              </div>
              <p class="blink hint-text">{{ t('pages.games.memoryCardPage.pressStartPlayDown') }}</p>
            </div>
          </div>

        </div>
      </div>

      <!-- 极客诊断通道按钮 -->
      <div class="yuemu-diagnostic-trigger-bar">
        <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
          <span class="yuemu-sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.memoryCardPage.leaderboardBracket') }}</span>
        </button>
        <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
          <span class="yuemu-sys-icon"><i class="fas fa-history"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.memoryCardPage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">
        <div class="btn-section left">
          <button class="sys-btn round" @click="toggleSound">
            <div class="inner-circle">
              <AudioMutedOutlined v-if="gameState.isMuted" />
              <SoundOutlined v-else />
            </div>
            <span>{{ t('pages.games.memoryCardPage.soundEffect') }}</span>
          </button>
        </div>

        <div class="btn-section center">
          <button class="sys-btn start-btn" @click="handleStartButton">
            <div class="pill"></div>
            <span>{{ t('pages.games.memoryCardPage.startRestart') }}</span>
          </button>
        </div>

        <div class="btn-section right">
          <button class="sys-btn round" @click="goBack">
            <div class="inner-circle"><i class="fas fa-arrow-left"></i></div>
            <span>{{ t('pages.games.memoryCardPage.return') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 悬浮复古数据监控诊断终端 -->
    <div class="retro-modal-overlay" v-if="isTerminalOpen" @click.self="closeTerminal">
      <div class="terminal-chassis">
        <div class="screw top-left"></div>
        <div class="screw top-right"></div>
        <div class="screw bottom-left"></div>
        <div class="screw bottom-right"></div>

        <div class="brand-plate flex-column-mobile">
          <span class="model-name terminal-title">{{ t('pages.games.memoryCardPage.monitorDiagnosticR09') }}</span>
          <div class="tab-buttons">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'ranking' }"
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.memoryCardPage.rankBracket') }}
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'history' }"
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.memoryCardPage.historyBracket') }}
            </button>
          </div>
        </div>

        <div class="terminal-screen">
          <div class="scanlines"></div>
          <div class="crt-flicker"></div>
          <div class="screen-vignette"></div>

          <!-- 1. 排行榜面板 -->
          <div v-if="activeTab === 'ranking'" class="terminal-panel">
            <div class="rank-filter-bar">
              <span class="filter-label">{{ t('pages.games.memoryCardPage.difficultyFilter') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.memoryCardPage.allLevels') }}</option>
                <option v-for="l in levelOptions" :key="l" :value="l">{{ t('pages.games.memoryCardPage.' + l) }}</option>
              </select>
            </div>

            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.memoryCardPage.ranking') }}</span>
              <span>{{ t('pages.games.memoryCardPage.matchTerminal') }}</span>
              <span>{{ t('pages.games.memoryCardPage.shortestTime') }}</span>
              <span>{{ t('pages.games.memoryCardPage.accessTime') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.memoryCardPage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.memoryCardPage.noMatchRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.memoryCardPage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ formatRankTime(item.score) }}</span>
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
                {{ t('pages.games.memoryCardPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button
                class="paging-btn"
                :disabled="rankPage >= totalRankPages"
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.memoryCardPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.memoryCardPage.accessTime') }}</span>
              <span>{{ t('pages.games.memoryCardPage.matchDifficultyLabel') }}</span>
              <span>{{ t('pages.games.memoryCardPage.clearTime') }}</span>
              <span>{{ t('pages.games.memoryCardPage.status') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.memoryCardPage.readingPhysicsArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.memoryCardPage.noLocalPairLog') }}
              </div>
              <div
                v-else
                v-for="item in historyRecords"
                :key="item.id"
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ ['beginnerLevel', 'beginner', 'intermediate', 'advanced', 'expertLevel', 'masterLevel'].includes(item.level) ? t('pages.games.memoryCardPage.' + item.level) : (item.level || t('pages.games.memoryCardPage.default')) }}</span>
                <span class="score-val text-neon-green">{{ formatRankTime(item.score) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.memoryCardPage.matchSuccess') : t('pages.games.memoryCardPage.notInitiated') }}
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
                {{ t('pages.games.memoryCardPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button
                class="paging-btn"
                :disabled="historyPage >= totalHistoryPages"
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.memoryCardPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.memoryCardPage.closeDiagTerminal') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { SoundOutlined, AudioMutedOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'

const { t } = useI18n();
const router = useRouter()
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)

// --- 补全缺失的核心状态变量 ---
const difficulty = ref('beginnerLevel')
const isPlaying = ref(false)
const isNewRecord = ref(false)
const timer = ref<number | null>(null)
const flippedCards = ref<number[]>([])

interface Card {
  icon: string
  isFlipped: boolean
  isMatched: boolean
}
const cards = ref<Card[]>([])

// 游戏难度与对应卡片对数配置
const config = {
  beginnerLevel: { pairs: 6 },
  beginner: { pairs: 8 },
  intermediate: { pairs: 10 },
  advanced: { pairs: 12 },
  expertLevel: { pairs: 15 },
  masterLevel: { pairs: 18 }
}

const gameState = reactive({
  time: 0,
  flips: 0,
  isGameOver: false,
  isMuted: false,
  bestTime: null as number | null
})

// --- 排行榜 & 历史记录诊断微端状态 ---
const isTerminalOpen = ref(false)
const activeTab = ref<'ranking' | 'history'>('ranking')

const rankings = ref<any[]>([])
const rankingLoading = ref(false)
const rankPage = ref(1)
const totalRankPages = ref(1)
const selectedRankLevel = ref('')
const levelOptions = ['beginnerLevel', 'beginner', 'intermediate', 'advanced', 'expertLevel', 'masterLevel']

const onRankLevelChange = () => {
  rankPage.value = 1
  fetchRankings()
}

const historyRecords = ref<any[]>([])
const historyLoading = ref(false)
const historyPage = ref(1)
const totalHistoryPages = ref(1)

const openTerminal = (tab: 'ranking' | 'history') => {
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
}

const fetchRankings = async () => {
  rankingLoading.value = true
  try {
    const params: any = {
      gameType: 'memory_card',
      current: rankPage.value,
      pageSize: 8
    }
    if (selectedRankLevel.value) {
      params.level = selectedRankLevel.value
    }
    const res = await getRankingListUsingPost(params)
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.memoryCardPage.getRankingsError'), err)
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

const fetchHistory = async () => {
  if (!currentUserId.value) return
  historyLoading.value = true
  try {
    const res = await getMyHistoryRecordsUsingPost({
      gameType: 'memory_card',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.memoryCardPage.getHistoryArchiveError'), err)
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

const saveScore = async (finalTime: number) => {
  if (finalTime <= 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.memoryCardPage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'memory_card',
      level: difficulty.value,
      score: finalTime
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.memoryCardPage.reportFlipScoreError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.memoryCardPage.unknown')
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatRankTime = (seconds: number) => {
  if (!seconds) return t('pages.games.memoryCardPage.unknown')
  const m = Math.floor(seconds / 60); const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const isMobile = ref(false)

const allIcons = ['fas fa-gamepad', 'fas fa-dice', 'fas fa-bullseye', 'fas fa-palette', 'fas fa-theater-masks', 'fas fa-campground', 'fas fa-ticket-alt', 'fas fa-film', 'fas fa-music', 'fas fa-keyboard', 'fas fa-space-shuttle', 'fas fa-rocket', 'fas fa-star', 'fas fa-rainbow', 'fas fa-fire', 'fas fa-gem', 'fas fa-mushroom', 'fas fa-ice-cream']

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60); const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const handleStartButton = () => {
  if (gameState.isGameOver || !isPlaying.value) {
    startGame()
  } else {
    initGame()
    startTimer()
  }
}

const startGame = () => {
  isPlaying.value = true
  initGame()
  startTimer()
  playSfx('start')
}

const initGame = () => {
  const cfg = (config as any)[difficulty.value]
  const selectedIcons = allIcons.slice(0, cfg.pairs)
  const icons = [...selectedIcons, ...selectedIcons]
  const shuffled = icons.sort(() => Math.random() - 0.5)

  cards.value = shuffled.map(icon => ({ icon, isFlipped: false, isMatched: false }))
  gameState.time = 0
  gameState.flips = 0
  gameState.isGameOver = false
  flippedCards.value = []
  isNewRecord.value = false

  const saved = localStorage.getItem(`memoryBest_${difficulty.value}`)
  gameState.bestTime = saved ? parseInt(saved) : null

  // 切换难度时播放选择音效
  if (!isPlaying.value) {
    playSfx('select')
  }
}

const handleCardClick = (index: number) => {
  if (!isPlaying.value || flippedCards.value.length === 2) return
  if (cards.value[index].isMatched || cards.value[index].isFlipped) return

  cards.value[index].isFlipped = true
  flippedCards.value.push(index)
  playSfx('flip')

  if (flippedCards.value.length === 2) {
    gameState.flips++
    setTimeout(checkMatch, 600)
  }
}

const checkMatch = () => {
  const [first, second] = flippedCards.value
  const match = cards.value[first].icon === cards.value[second].icon

  if (match) {
    cards.value[first].isMatched = true
    cards.value[second].isMatched = true

    // 根据连续匹配数播放不同音效
    const matchedCount = cards.value.filter(c => c.isMatched).length
    if (matchedCount % 6 === 0) {
      playSfx('combo') // 每3对播放连击音效
    } else {
      playSfx('match')
    }

    if (cards.value.every(card => card.isMatched)) endGame()
  } else {
    cards.value[first].isFlipped = false
    cards.value[second].isFlipped = false
    playSfx('mismatch') // 不匹配音效
  }
  flippedCards.value = []
}

const endGame = () => {
  isPlaying.value = false
  gameState.isGameOver = true
  stopTimer()

  if (!gameState.bestTime || gameState.time < gameState.bestTime) {
    gameState.bestTime = gameState.time
    localStorage.setItem(`memoryBest_${difficulty.value}`, gameState.time.toString())
    isNewRecord.value = true
  }
  playSfx('win')
  saveScore(gameState.time)
}

const startTimer = () => {
  stopTimer()
  timer.value = window.setInterval(() => gameState.time++, 1000) as unknown as number
}
const stopTimer = () => { 
  if (timer.value !== null) { 
    clearInterval(timer.value)
    timer.value = null 
  } 
}

const toggleSound = () => {
  gameState.isMuted = !gameState.isMuted
}

// 采用安全加载机制，修复可能的大小写引发的资源加载404问题
const sfx: Record<string, HTMLAudioElement | null> = {
  flip: null, match: null, mismatch: null, win: null, start: null, select: null, combo: null
}

try {
  sfx.flip = new Audio(new URL('@/assets/sounds/flip.mp3', import.meta.url).href)
  sfx.match = new Audio(new URL('@/assets/sounds/match.mp3', import.meta.url).href)
  sfx.mismatch = new Audio(new URL('@/assets/sounds/mismatch.mp3', import.meta.url).href)
  sfx.win = new Audio(new URL('@/assets/sounds/win.mp3', import.meta.url).href)
  sfx.start = new Audio(new URL('@/assets/sounds/start.mp3', import.meta.url).href)
  sfx.select = new Audio(new URL('@/assets/sounds/select.mp3', import.meta.url).href)
  sfx.combo = new Audio(new URL('@/assets/sounds/combo.mp3', import.meta.url).href)

  sfx.flip.volume = 0.3
  sfx.match.volume = 0.5
  sfx.mismatch.volume = 0.4
  sfx.win.volume = 0.6
  sfx.start.volume = 0.5
  sfx.select.volume = 0.3
  sfx.combo.volume = 0.5
} catch (e) {
  console.warn(t('pages.games.memoryCardPage.audioLoadFailedSilent'));
}

const playSfx = (type: keyof typeof sfx) => {
  if (gameState.isMuted || !sfx[type]) return
  const sound = sfx[type]!
  sound.currentTime = 0
  sound.play().catch(() => {})
}

const goBack = () => router.push({ name: 'Games' })

const checkResize = () => { isMobile.value = window.innerWidth <= 768 }

onMounted(() => {
  checkResize()
  window.addEventListener('resize', checkResize)
})
onUnmounted(() => {
  stopTimer()
  window.removeEventListener('resize', checkResize)
})
</script>

<style scoped>
/* 使用系统等宽或黑体作为复古风中文字体 */
.yuemu-retro-memory-universe {
  position: fixed;
  inset: 0;
  background-color: var(--background);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'SimHei', 'Microsoft YaHei', Consolas, monospace;
  overflow: hidden;
  touch-action: none;
}

/* 掌机外壳 */
.arcade-handheld {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 20px 20px 60px 20px;
  padding: 20px;
  width: 100%;
  max-width: 500px;
  height: 92vh;
  max-height: 850px;
  display: flex;
  flex-direction: column;
  box-shadow: 12px 12px 0 var(--shadow-color), inset 2px 2px 0 rgba(255,255,255,0.1);
  gap: 15px;
}

.handheld-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}
.brand { font-size: 14px; color: var(--text-primary); font-weight: 900; letter-spacing: 2px;}
.speaker { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.speaker .dot { width: 4px; height: 4px; background: var(--border-color); border-radius: 50%; }

/* 屏幕区域 */
.screen-bezel {
  flex: 1;
  background: var(--console-body);
  padding: 12px;
  border-radius: 8px;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.3);
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.screen-glass {
  flex: 1;
  background: #1a1a1a;
  border: 3px solid #333;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.crt-effect::after {
  content: " "; display: block; position: absolute; inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
  background-size: 100% 4px; z-index: 50; pointer-events: none; opacity: 0.3;
}

/* HUD */
.hud-bar {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0,0,0,0.4);
  border-bottom: 2px solid #444;
  flex-shrink: 0;
}
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.hud-label { font-size: 10px; color: #aaa; font-weight: bold;}
.hud-val { font-size: 14px; color: #fff; font-family: Consolas, monospace; font-weight: bold;}
.highlight { color: var(--link-color); }

/* 舞台容器 */
.stage-container {
  flex: 1;
  padding: 10px;
  display: grid;
  gap: 8px;
  min-height: 0;
  position: relative;
  align-content: center;
}

/* 网格布局定义 */
.grid-beginnerLevel { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, 1fr); }
.grid-beginner { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); }
.grid-intermediate { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(5, 1fr); }
.grid-advanced { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(6, 1fr); }
.grid-expertLevel { grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(6, 1fr); }
.grid-masterLevel { grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr); }

/* 卡片样式 */
.memory-card {
  width: 100%;
  height: 100%;
  perspective: 600px;
  cursor: pointer;
  min-height: 0;
}
.card-inner {
  position: relative;
  width: 100%; height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.memory-card.flipped .card-inner { transform: rotateY(180deg); }

.card-front, .card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.2);
}

.card-front {
  background: #eee;
  transform: rotateY(180deg);
}

.card-back {
  background: var(--link-color);
  border: 2px solid rgba(255,255,255,0.2);
}

.card-icon {
  font-size: clamp(14px, 4.5cqw, 32px);
}

.pixel-pattern {
  width: 60%; height: 60%;
  border: 1px solid rgba(255,255,255,0.1);
  background-image: radial-gradient(rgba(255,255,255,0.2) 20%, transparent 20%);
  background-size: 4px 4px;
}

.memory-card.matched {
  opacity: 0.4;
  cursor: default;
  transform: scale(0.92);
}

/* 屏幕内遮罩 UI */
.screen-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.9);
  z-index: 60;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  padding: 15px;
  text-align: center;
}

.pixel-title { font-size: 22px; color: var(--link-color); margin-bottom: 25px; text-shadow: 2px 2px 0 #000; font-weight: 900;}
.difficulty-menu {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 双列布局防止菜单过长 */
  gap: 20px 40px;
  align-items: center;
}
.menu-item { font-size: 16px; cursor: pointer; color: #888; position: relative; font-weight: bold;}
.menu-item.active { color: #fff; }
.menu-item .arrow { position: absolute; left: -22px; color: var(--link-color); animation: blink 1s infinite; }

.final-stats { margin: 15px 0; font-size: 14px; line-height: 2; color: #a8e6cf; font-weight: bold;}
.new-record-tag { color: #ffd700; font-size: 14px; margin-bottom: 10px; font-weight: bold; animation: bounce 1s infinite; }
.hint-text { font-size: 12px; margin-top: auto; font-weight: bold; color: #aaa;}
.blink { animation: blink 1s step-end infinite; }

/* 底部按钮 */
.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  flex-shrink: 0;
}
.sys-btn {
  background: transparent; border: none;
  display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer;
}
.sys-btn span { font-size: 12px; color: var(--text-secondary); font-weight: 900; }
.inner-circle {
  width: 45px; height: 45px;
  background: var(--border-color);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: var(--text-primary);
  box-shadow: 0 4px 0 var(--shadow-color);
}
.sys-btn:active .inner-circle, .sys-btn:active .pill { transform: translateY(2px); box-shadow: 0 1px 0 var(--shadow-color); }
.start-btn .pill {
  width: 110px; height: 28px;
  background: #ff4757; border-radius: 15px;
  box-shadow: 0 4px 0 #c4323f;
}

@keyframes blink { 50% { opacity: 0; } }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

/* 移动端适配 */
@media (max-width: 768px) {
  .arcade-handheld {
    height: 100dvh; max-height: none; width: 100vw; border: none; border-radius: 0; padding: 12px; gap: 10px;
  }
  .screen-bezel { padding: 8px; }
  .stage-container { gap: 4px; padding: 5px; }

  .grid-expertLevel, .grid-masterLevel { gap: 2px; } /* 高难度下缩小卡片间距 */
  .grid-expertLevel .card-icon, .grid-masterLevel .card-icon { font-size: 18px; }

  .difficulty-menu { gap: 15px 30px; }
  .menu-item { font-size: 14px; }
  .sys-btn span { font-size: 10px; }
  .inner-circle { width: 40px; height: 40px; }
  .start-btn .pill { width: 90px; height: 24px; }
}

@media (max-height: 600px) {
  .handheld-header { display: none; }
  .hud-bar { padding: 4px 10px; }
  .stage-container { padding: 4px; }
}
.yuemu-diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
}
.yuemu-mini-diag-btn {
  flex: 1;
  background: var(--console-body);
  border: 3px solid var(--text-primary);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 4px 4px 0px var(--shadow-color);
  transition: all 0.1s;
}
.yuemu-mini-diag-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--shadow-color);
}
.yuemu-mini-diag-btn .yuemu-sys-icon { font-size: 12px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.yuemu-mini-diag-btn .yuemu-sys-text { font-size: 8px; color: var(--text-primary); font-weight: bold; font-family: 'SimHei', sans-serif; }

/* ================= 悬浮复古弹窗数据监控诊断终端 ================= */
.retro-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 5, 2, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

.terminal-chassis {
  background: #0d1510;
  border: 4px solid #1a3324;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  min-height: 520px;
  padding: 24px;
  box-shadow: 0 0 30px rgba(0, 255, 65, 0.15), inset 0 0 15px rgba(0, 0, 0, 0.8);
  position: relative;
  font-family: 'PressStart2P', Consolas, monospace;
}

/* 装饰用螺丝钉 */
.screw {
  position: absolute; width: 8px; height: 8px;
  background: #2a3a30; border-radius: 50%;
  box-shadow: inset 1px 1px 2px #000;
}
.screw::after {
  content: ''; position: absolute; top: 3px; left: 0; width: 8px; height: 2px; background: #121c15;
}
.screw.top-left { top: 8px; left: 8px; }
.screw.top-right { top: 8px; right: 8px; }
.screw.bottom-left { bottom: 8px; left: 8px; }
.screw.bottom-right { bottom: 8px; right: 8px; }

/* 品牌装饰面板 */
.brand-plate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px dashed rgba(0, 255, 65, 0.3);
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.terminal-title {
  font-family: inherit;
  font-size: 10px;
  font-weight: bold;
  color: #00FF41;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
}

.tab-buttons {
  display: flex;
  gap: 8px;
}
.tab-btn {
  background: transparent;
  border: 1px solid rgba(0, 255, 65, 0.4);
  border-radius: 4px;
  color: rgba(0, 255, 65, 0.6);
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.active, .tab-btn:hover {
  background: rgba(0, 255, 65, 0.1);
  color: #00FF41;
  border-color: #00FF41;
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.3);
}

/* 拟真 CRT 荧光屏幕 */
.terminal-screen {
  background: #020603;
  border: 3px solid #122418;
  border-radius: 8px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.9);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.scanlines {
  position: absolute; inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 3px, 6px 100%;
  z-index: 100;
  pointer-events: none;
}

.crt-flicker {
  position: absolute; inset: 0;
  background: rgba(18, 16, 16, 0.02);
  opacity: 0.15;
  z-index: 99;
  pointer-events: none;
  animation: crt-flicker-anim 0.15s infinite;
}
@keyframes crt-flicker-anim {
  0% { opacity: 0.15; }
  50% { opacity: 0.18; }
  100% { opacity: 0.15; }
}

.screen-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(circle, transparent 60%, rgba(0,0,0,0.8) 100%);
  z-index: 101;
  pointer-events: none;
}

/* 数据展示面板布局 */
.terminal-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 关卡选择过滤栏 */
.rank-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  background: rgba(0, 255, 65, 0.05);
  border: 1px dashed rgba(0, 255, 65, 0.3);
  padding: 6px 10px;
  border-radius: 4px;
}

.filter-label {
  font-family: inherit;
  font-size: 12px;
  color: #00FF41;
  font-weight: bold;
}

.retro-select {
  background: #020603;
  border: 2px solid rgba(0, 255, 65, 0.6);
  border-radius: 4px;
  color: #00FF41;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 10px;
  outline: none;
  cursor: pointer;
}

.retro-select option {
  background: #020603;
  color: #00FF41;
  font-family: inherit;
}

.panel-header {
  display: grid;
  padding: 10px 6px;
  background: rgba(0, 255, 65, 0.08);
  border-bottom: 2px solid rgba(0, 255, 65, 0.3);
  font-size: 11px;
  font-weight: bold;
  color: #00FF41;
  text-transform: uppercase;
}

.ranking-layout-header,
.ranking-layout-row {
  grid-template-columns: 0.6fr 1.6fr 1.3fr 1.5fr;
  align-items: center;
}

.history-layout-header,
.history-layout-row {
  grid-template-columns: 1.4fr 1.0fr 1.0fr 1.2fr;
  align-items: center;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  margin-bottom: 8px;
}

.scrollable::-webkit-scrollbar {
  width: 4px;
}
.scrollable::-webkit-scrollbar-track {
  background: rgba(0, 255, 65, 0.05);
}
.scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 65, 0.4);
  border-radius: 2px;
}

.data-row {
  display: grid;
  padding: 12px 6px;
  border-bottom: 1px solid rgba(0, 255, 65, 0.15);
  font-size: 11px;
  color: rgba(0, 255, 65, 0.85);
  transition: background 0.1s;
}
.data-row:hover {
  background: rgba(0, 255, 65, 0.05);
}
.my-row {
  background: rgba(0, 255, 65, 0.08);
  border-left: 2px solid #00FF41;
}

.rank-num { font-weight: bold; color: #00FF41; }
.username { display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.avatar-img { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0, 255, 65, 0.5); object-fit: cover; }
.name-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clickable { cursor: pointer; }
.clickable:hover .name-text { text-decoration: underline; color: #00FF41; }
.score-val { font-family: inherit; font-weight: bold; }
.text-neon-green { color: #00FF41; }
.time-val { color: rgba(0, 255, 65, 0.5); font-size: 10px; }

/* 提示状态 */
.loading-state, .empty-state {
  text-align: center;
  padding: 40px 10px;
  font-size: 12px;
  color: rgba(0, 255, 65, 0.5);
  font-family: inherit;
}

/* 分页器 */
.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed rgba(0, 255, 65, 0.3);
  padding-top: 8px;
  margin-bottom: 4px;
}

.paging-btn {
  background: transparent;
  border: 1px solid rgba(0, 255, 65, 0.6);
  border-radius: 3px;
  color: #00FF41;
  font-family: inherit;
  font-size: 11px;
  font-weight: bold;
  padding: 6px 12px;
  cursor: pointer;
  box-shadow: 2px 2px 0px rgba(0, 255, 65, 0.4);
  transition: all 0.1s;
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
  padding: 10px 15px 0 15px;
  background-color: #020603;
  border-top: 2px dashed rgba(0, 255, 65, 0.3);
  margin-top: auto;
}

.close-btn {
  width: 100%;
  text-align: center;
  padding: 12px 0;
  font-size: 12px;
}

.danger-btn {
  color: #FF2A2A;
  border-color: #FF2A2A;
  box-shadow: 3px 3px 0px #FF2A2A;
}
.danger-btn:active {
  box-shadow: 0px 0px 0px #FF2A2A;
}

.mech-btn {
  background: transparent;
  border: 2px solid rgba(0, 255, 65, 0.6);
  border-radius: 4px;
  color: #00FF41;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 3px 3px 0px rgba(0, 255, 65, 0.6);
  transition: all 0.1s;
}
.mech-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 transparent;
}

.win-trophy {
  color: #ffd700;
  font-size: 24px;
  animation: bounce 1s infinite;
}

/* ================= 移动端响应式调整 ================= */
@media (max-width: 450px) {
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

/* PC 端左右宽屏分栏布局重构 */
@media (min-width: 769px) {
  .arcade-handheld {
    max-width: 960px;
    height: 85vh;
    max-height: 900px;
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto auto 1fr;
    border-radius: 16px;
    gap: 0;
    padding: 0;
    overflow: hidden;
  }
  .handheld-header {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    padding: 20px;
    border-right: 4px solid var(--border-color);
    border-bottom: 4px solid var(--border-color);
    background: var(--console-body);
  }
  .screen-bezel {
    grid-column: 1 / 2;
    grid-row: 2 / 4;
    border-right: 4px solid var(--border-color);
    border-radius: 0;
    box-shadow: none;
    padding: 20px;
    background: transparent;
  }
  .yuemu-diagnostic-trigger-bar {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    flex-direction: column;
    justify-content: center;
    padding: 20px;
    border-bottom: 4px solid var(--border-color);
    gap: 15px;
  }
  .control-panel {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    flex-direction: column;
    justify-content: space-around;
    padding: 30px 20px;
  }
  .sys-btn {
    flex-direction: row;
    width: 100%;
    justify-content: flex-start;
    padding: 0 20px;
  }
  .sys-btn span {
    font-size: 14px;
    margin-left: 15px;
  }
}
</style>