<template>
  <div class="yuemu-retro-puzzle-universe">
    <div class="game-core" :class="{ 'won': isGameWon }">

      <div class="console-header">
        <div class="brand">
          <span class="logo">PUZZLE</span>
          <div class="power-indicator" :class="{ 'on': !isShuffling }"></div>
        </div>
        <div class="stats-screen">
          <div class="lcd-panel">
            <span class="lcd-label">{{ t('pages.games.slidingPuzzlePage.move') }}</span>
            <span class="lcd-value">{{ moves.toString().padStart(3, '0') }}</span>
          </div>
          <div class="lcd-panel best">
            <span class="lcd-label">{{ t('pages.games.slidingPuzzlePage.best') }}</span>
            <span class="lcd-value">{{ bestScore === Infinity ? '---' : bestScore.toString().padStart(3, '0') }}</span>
          </div>
        </div>
      </div>

      <div class="board-bezel">
        <div class="board-interior">
          <TransitionGroup name="tile-flip" tag="div" class="puzzle-grid">
            <div
              v-for="(number, index) in board"
              :key="number"
              class="retro-tile"
              :class="{
                'is-empty': number === 0,
                'can-move': canMoveTile(index),
                'correct-pos': isTileInPlace(number, index)
              }"
              :style="getTileStyle(number, index)"
              @click="moveTile(index)"
            >
              <div v-if="number !== 0" class="tile-surface">
                <span class="num-glitch">{{ number }}</span>
              </div>
              <div v-if="number !== 0" class="tile-depth"></div>
            </div>
          </TransitionGroup>

          <div v-if="isGameWon" class="win-overlay" @click="startNewGame">
            <div class="win-banner">
              <h2 class="shimmer-text">{{ t('pages.games.slidingPuzzlePage.taskCompleted') }}</h2>
              <p>{{ t('pages.games.slidingPuzzlePage.clickToRestart') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 鏋佸璇婃柇閫氶亾鎸夐挳 (闃叉尋鍘嬭鏈烘帶鍒讹紝绾腑鏂? -->
      <div class="yuemu-diagnostic-trigger-bar">
        <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
          <span class="yuemu-sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.slidingPuzzlePage.leaderboardBracket') }}</span>
        </button>
        <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
          <span class="yuemu-sys-icon"><i class="fas fa-history"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.slidingPuzzlePage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="console-footer">
        <button class="arcade-btn reboot" @click="startNewGame" :disabled="isShuffling">
          <ReloadOutlined :spin="isShuffling" />
          <span>{{ t('pages.games.slidingPuzzlePage.restartAgain') }}</span>
        </button>
        <button class="arcade-btn audio" @click="toggleSound(); playSound('click')">
          <span><i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i></span>
        </button>
      </div>

      <button class="guide-trigger" @click="showGuide = true">?</button>
    </div>

    <!-- 悬浮复古数据监控诊断终端 (街机显示器纯中文弹窗，移动端与桌面端自适应) -->
    <div class="retro-modal-overlay" v-if="isTerminalOpen" @click.self="closeTerminal">
      <div class="terminal-chassis">
        <div class="screw top-left"></div>
        <div class="screw top-right"></div>
        <div class="screw bottom-left"></div>
        <div class="screw bottom-right"></div>

        <div class="brand-plate flex-column-mobile">
          <span class="model-name terminal-title">{{ t('pages.games.slidingPuzzlePage.monitorDiagnosticP15') }}</span>
          <div class="tab-buttons">
            <button class="tab-btn" :class="{ active: activeTab === 'ranking' }" @click="switchTab('ranking')">
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.slidingPuzzlePage.rankBracket') }}
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'history' }" @click="switchTab('history')">
              [ <i class="fas fa-history"></i> {{ t('pages.games.slidingPuzzlePage.historyBracket') }}
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
              <span class="filter-label">{{ t('pages.games.slidingPuzzlePage.filterParams') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.slidingPuzzlePage.standardBoard') }}</option>
              </select>
            </div>

            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.slidingPuzzlePage.ranking') }}</span>
              <span>{{ t('pages.games.slidingPuzzlePage.matchTerminal') }}</span>
              <span>{{ t('pages.games.slidingPuzzlePage.bestSteps') }}</span>
              <span>{{ t('pages.games.slidingPuzzlePage.accessTime') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.slidingPuzzlePage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.slidingPuzzlePage.noFlightLog') }}
              </div>
              <div v-else v-for="(item, index) in rankings" :key="item.id" class="data-row ranking-layout-row" :class="{ 'my-row': item.userId === currentUserId }">
                <span class="rank-num">{{ (rankPage - 1) * 8 + index + 1 }}</span>
                <span class="username clickable" @click="handleUserClick(item)">
                  <img :src="item.userAvatar || 'https://cube.elemecdn.com/3/c2/f0e8e5a243d89771698f4902d0cfgif.gif'" class="avatar-img" />
                  <span class="name-text">{{ item.userName || t('pages.games.slidingPuzzlePage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.slidingPuzzlePage.stepsLeft', { steps: 1000 - item.score }) }}</span>
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
              </div>
            </div>

            <div class="pagination-footer">
              <button class="paging-btn" :disabled="rankPage <= 1" @click="changeRankPage(-1)">
                {{ t('pages.games.slidingPuzzlePage.prevPage') }}
              </button>
              <span class="page-indicator">[{{ rankPage }}/{{ totalRankPages }}]</span>
              <button class="paging-btn" :disabled="rankPage >= totalRankPages" @click="changeRankPage(1)">
                {{ t('pages.games.slidingPuzzlePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史日志面板 -->
          <div v-else-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.slidingPuzzlePage.matchTerminal') }}</span>
              <span>{{ t('pages.games.slidingPuzzlePage.bestSteps') }}</span>
              <span>{{ t('pages.games.slidingPuzzlePage.accessTime') }}</span>
              <span>{{ t('pages.games.slidingPuzzlePage.status') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.slidingPuzzlePage.readingLocalLog') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.slidingPuzzlePage.noFlightLog') }}
              </div>
              <div v-else v-for="(item, index) in historyRecords" :key="item.id" class="data-row history-layout-row">
                <span class="username">
                  <span class="name-text">{{ item.level }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.slidingPuzzlePage.stepsLeft', { steps: 1000 - item.score }) }}</span>
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="time-val" style="color: #00FF41">OK</span>
              </div>
            </div>

            <div class="pagination-footer">
              <button class="paging-btn" :disabled="historyPage <= 1" @click="changeHistoryPage(-1)">
                {{ t('pages.games.slidingPuzzlePage.prevPage') }}
              </button>
              <span class="page-indicator">[{{ historyPage }}/{{ totalHistoryPages }}]</span>
              <button class="paging-btn" :disabled="historyPage >= totalHistoryPages" @click="changeHistoryPage(1)">
                {{ t('pages.games.slidingPuzzlePage.nextPage') }}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="mech-btn danger-btn" @click="closeTerminal">
            [ {{ t('pages.games.slidingPuzzlePage.forceCloseConnection') }} ]
          </button>
        </div>
      </div>
    </div>

    <a-modal
      v-model:open="showGuide"
      :title="t('pages.games.slidingPuzzlePage.systemManual')"
      :footer="null"
      centered
      class="retro-modal"
    >
      <div class="manual-content">
        <p>{{ t('pages.games.slidingPuzzlePage.puzzleRule1') }}</p>
        <p>{{ t('pages.games.slidingPuzzlePage.puzzleRule2') }}</p>
        <p>{{ t('pages.games.slidingPuzzlePage.puzzleRule3') }}</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)

const board = ref<number[]>([])
const moves = ref(0)
const bestScore = ref(Infinity)
const showGuide = ref(false)
const isShuffling = ref(false)
const isSoundEnabled = ref(true)

// --- 鎺掕姒?& 鍘嗗彶璁板綍璇婃柇寰鐘舵€?---
const isTerminalOpen = ref(false)
const activeTab = ref<'ranking' | 'history'>('ranking')

const rankings = ref<any[]>([])
const rankingLoading = ref(false)
const rankPage = ref(1)
const totalRankPages = ref(1)
const selectedRankLevel = ref('')
const levelOptions = [t('pages.games.slidingPuzzlePage.standardBoard')]

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
      gameType: 'sliding_puzzle',
      current: rankPage.value,
      pageSize: 8
    }
    const res = await getRankingListUsingPost(params)
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.slidingPuzzlePage.getPuzzleRankError'), err)
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
      gameType: 'sliding_puzzle',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.slidingPuzzlePage.getPuzzleHistoryError'), err)
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

const saveScore = async (finalScore: number) => {
  if (finalScore <= 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.slidingPuzzlePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'sliding_puzzle',
      level: t('pages.games.slidingPuzzlePage.standardBoard'),
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.slidingPuzzlePage.reportPuzzleScoreError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.slidingPuzzlePage.unknown')
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 闊虫晥绯荤粺
const sounds = {
  move: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href),
  correct: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  shuffle: new Audio(new URL('@/assets/sounds/rotate.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  win: new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href),
  combo: new Audio(new URL('@/assets/sounds/combo.MP3', import.meta.url).href),
  click: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href)
}

// 璁剧疆闊抽噺
sounds.move.volume = 0.3
sounds.correct.volume = 0.5
sounds.shuffle.volume = 0.4
sounds.start.volume = 0.5
sounds.win.volume = 0.6
sounds.combo.volume = 0.5
sounds.click.volume = 0.2

const playSound = (type: keyof typeof sounds) => {
  if (!isSoundEnabled.value) return
  const audio = sounds[type]
  audio.currentTime = 0
  audio.play().catch(() => {})
}

const toggleSound = () => { isSoundEnabled.value = !isSoundEnabled.value }

// 鍔ㄦ€佹牱寮忥細鎷煎鏃舵柟鍧椾細鍙戝厜锛屽苟鍛堢幇娓愬彉鑹?
const getTileStyle = (num: number, index: number) => {
  if (num === 0) return {}
  const percent = (num - 1) / 14
  const hue = 190 + (percent * 150) // 190钃濆埌340绾?
  const isInPlace = isTileInPlace(num, index)

  return {
    '--tile-color': `hsl(${hue}, 70%, ${isInPlace ? '65%' : '50%'})`,
    '--tile-glow': isInPlace ? `hsla(${hue}, 80%, 70%, 0.6)` : 'transparent'
  }
}

const isGameWon = computed(() => {
  if (board.value.length === 0) return false
  return board.value.every((num, index) =>
    index === 15 ? num === 0 : num === index + 1
  )
})

const isTileInPlace = (num: number, index: number) => num !== 0 && num === index + 1
const canMoveTile = (index: number) => {
  const emptyIndex = board.value.indexOf(0)
  const r = Math.floor(index / 4), c = index % 4
  const er = Math.floor(emptyIndex / 4), ec = emptyIndex % 4
  return (Math.abs(r - er) + Math.abs(c - ec)) === 1
}

const moveTile = (index: number) => {
  if (!canMoveTile(index) || isGameWon.value) return

  const tileNumber = board.value[index]
  const emptyIndex = board.value.indexOf(0)
  const newBoard = [...board.value]
  ;[newBoard[index], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[index]]

  // 妫€鏌ョЩ鍔ㄥ悗璇ユ柟鍧楁槸鍚﹀埌杈炬纭綅缃?
  const willBeCorrect = tileNumber === emptyIndex + 1

  board.value = newBoard
  moves.value++

  // 鏍规嵁鏄惁姝ｇ‘浣嶇疆鎾斁涓嶅悓闊虫晥
  if (willBeCorrect) {
    playSound('correct')
    // 姣?涓纭綅缃挱鏀綾ombo闊虫晥
    const correctCount = board.value.filter((num, idx) =>
      num !== 0 && num === idx + 1
    ).length
    if (correctCount % 5 === 0 && correctCount > 0) {
      setTimeout(() => playSound('combo'), 150)
    }
  } else {
    playSound('move')
  }

  if (isGameWon.value) {
    bestScore.value = Math.min(bestScore.value, moves.value)
    localStorage.setItem('puzzle-best', bestScore.value.toString())
    setTimeout(() => {
      playSound('win')
      saveScore(Math.max(0, 1000 - moves.value))
    }, 200)
  }
}

// 鍒ゅ畾鏄惁鍙В
const isSolvable = (arr: number[]) => {
  let inversions = 0
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 0) continue
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] !== 0 && arr[i] > arr[j]) inversions++
    }
  }
  const emptyRowFromBottom = 4 - Math.floor(arr.indexOf(0) / 4)
  return (inversions % 2 === 0) === (emptyRowFromBottom % 2 !== 0)
}

const startNewGame = () => {
  isShuffling.value = true
  moves.value = 0
  let numbers: number[]
  do {
    numbers = [...Array(16).keys()].sort(() => Math.random() - 0.5)
  } while (!isSolvable(numbers) || isGameWon.value)

  board.value = numbers
  playSound('shuffle')
  setTimeout(() => {
    playSound('start')
    isShuffling.value = false
  }, 400)
}

onMounted(() => {
  const saved = localStorage.getItem('puzzle-best')
  if (saved) bestScore.value = parseInt(saved)
  startNewGame()
})

const goBack = () => { window.history.back() }
</script>

<style scoped>
/* 鏍稿績瀹瑰櫒锛氬鍙ゆ帶鍒跺彴鎰?*/
.yuemu-retro-puzzle-universe {
  min-height: 100vh;
  background-color: var(--background);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  perspective: 1000px;
}

.game-core {
  background-color: var(--card-background);
  border: 8px solid var(--border-color);
  border-radius: 40px;
  padding: 30px;
  width: 100%;
  max-width: 440px;
  box-shadow: 20px 20px 0 var(--shadow-color);
  position: relative;
  transition: var(--theme-transition);
}

/* 椤堕儴灞忓箷鏄剧ず */
.console-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 25px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  font-family: var(--font-family-base);
  font-size: 24px;
  color: var(--text-primary);
  font-weight: bold;
}

.power-indicator {
  width: 8px; height: 8px;
  background-color: #330000;
  border-radius: 50%;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
}
.power-indicator.on {
  background-color: #ff0000;
  box-shadow: 0 0 8px #ff0000;
}

.stats-screen { display: flex; gap: 10px; }

.lcd-panel {
  background-color: #1a1c1a;
  padding: 5px 12px;
  border-radius: 4px;
  border: 2px solid #333;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.lcd-label {
  font-size: 9px;
  color: #4a4a4a;
  letter-spacing: 1px;
}

.lcd-value {
  font-family: 'Courier New', monospace;
  font-size: 22px;
  color: #00ff41; /* 缁忓吀榛戝缁?*/
  text-shadow: 0 0 5px #00ff41;
}

.best .lcd-value { color: #fcd34d; text-shadow: 0 0 5px #fcd34d; }

/* 妫嬬洏妗?*/
.board-bezel {
  background-color: var(--hover-background);
  padding: 12px;
  border-radius: 20px;
  box-shadow: inset 5px 5px 15px rgba(0,0,0,0.2);
  margin-bottom: 25px;
}

.board-interior {
  position: relative;
  background-color: rgba(0,0,0,0.1);
  border-radius: 12px;
  overflow: hidden;
}

.puzzle-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  aspect-ratio: 1;
}

/* 鏍稿績鏂瑰潡璁捐锛氱珛浣撴劅 */
.retro-tile {
  position: relative;
  cursor: pointer;
  transform: translateZ(0);
  transition: transform 0.1s;
  user-select: none;
}

.retro-tile.is-empty { visibility: hidden; }

.tile-surface {
  position: absolute;
  inset: 0;
  background-color: var(--tile-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  color: white;
  z-index: 2;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  border: 1px solid rgba(0,0,0,0.1);
}

.tile-depth {
  position: absolute;
  inset: 0;
  background-color: var(--tile-color);
  filter: brightness(0.6);
  border-radius: 8px;
  transform: translateY(6px);
  z-index: 1;
}

.retro-tile.correct-pos .tile-surface {
  box-shadow: inset 0 0 15px var(--tile-glow), 0 0 10px var(--tile-glow);
}

.retro-tile.can-move:active {
  transform: translateY(4px);
}
.retro-tile.can-move:active .tile-depth {
  transform: translateY(2px);
}

/* 搴曢儴鎿嶄綔鍖?*/
.console-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.arcade-btn {
  background-color: var(--border-color);
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  color: var(--text-primary);
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 5px 0 var(--shadow-color);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.1s, box-shadow 0.1s;
}

.arcade-btn:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 var(--shadow-color);
}



/* 鑳滃埄鏁堟灉 */
.win-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
}

.win-banner {
  text-align: center;
  transform: rotate(-5deg);
}

.shimmer-text {
  font-size: 32px;
  color: #fcd34d;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 鍔ㄧ敾鏁堟灉 */
.tile-flip-move {
  transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.guide-trigger {
  position: absolute;
  top: -15px; right: -15px;
  width: 35px; height: 35px;
  background: #3b82f6;
  border-radius: 50%;
  border: 4px solid var(--card-background);
  color: white;
  font-weight: bold;
  cursor: pointer;
}

/* 鍝嶅簲寮忛噸鏋勶細绉诲姩绔瀬闄愬噺璐燂紝PC 绔乏鍙冲灞忓垎甯?*/
@media (max-width: 768px) {
  .yuemu-retro-puzzle-universe { padding: 0; flex-direction: column; }
  .game-core { padding: 15px 10px; border-radius: 0; border: none; box-shadow: none; height: 100dvh; min-height: 100dvh; display: flex; flex-direction: column; max-width: 100%; }
  .console-header { margin-bottom: 0; flex-wrap: wrap; gap: 10px; } .logo { font-size: 18px; } .lcd-panel { padding: 4px 8px; } .lcd-value { font-size: 18px; }
  .board-bezel { margin-top: auto; padding: 10px; }
  .yuemu-diagnostic-trigger-bar { margin: 15px 0; gap: 10px; }
  .console-footer { margin-bottom: auto; }
  .tile-surface { font-size: 22px; }
  .lcd-value { font-size: 18px; }
}

@media (min-width: 769px) {
  .game-core { max-width: 900px; display: grid; grid-template-columns: 1fr 260px; grid-template-rows: auto 1fr; grid-template-areas: 'header triggers' 'board footer'; gap: 20px 40px; align-items: start; min-height: 500px; }
  .console-header { grid-area: header; margin-bottom: 0; }
  .board-bezel { grid-area: board; margin-bottom: 0; }
  .yuemu-diagnostic-trigger-bar { grid-area: triggers; flex-direction: column; justify-content: flex-end; height: 100%; margin: 0; gap: 15px; }
  .console-footer { grid-area: footer; flex-direction: column; justify-content: flex-end; align-items: stretch; gap: 30px; height: 100%; }
  .yuemu-mini-diag-btn { padding: 12px; }
  .arcade-btn { justify-content: center; }
}

.retro-modal :deep(.ant-modal-content) {
  background-color: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 20px;
}
.manual-content p {
  color: var(--text-primary);
  margin-bottom: 10px;
  font-weight: bold;
}

/* 鏋佸璇婃柇閫氶亾鎸夐挳 (闃叉尋鍘嬭鏈烘帶鍒讹紝绾腑鏂? */
.yuemu-diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 5px;
}
.yuemu-mini-diag-btn {
  flex: 1;
  background: var(--console-body);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--shadow-color);
  transition: all 0.1s;
}
.yuemu-mini-diag-btn:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--shadow-color);
}
.yuemu-mini-diag-btn .yuemu-sys-icon { font-size: 12px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.yuemu-mini-diag-btn .yuemu-sys-text { font-size: 8px; color: var(--text-primary); font-weight: bold; }

/* ================= 鎮诞澶嶅彜寮圭獥鏁版嵁鐩戞帶璇婃柇缁堢 ================= */
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
  display: flex;
  flex-direction: column;
}

/* 瑁呴グ鐢ㄨ灪涓濋拤 */
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

.brand-plate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #1a3324;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.flex-column-mobile { display: flex; }
.terminal-title {
  color: #00FF41;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
}

.tab-buttons {
  display: flex;
  gap: 8px;
}
.tab-btn {
  background: transparent;
  border: none;
  color: #1a3324;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 2px 6px;
}
.tab-btn.active, .tab-btn:hover {
  color: #00FF41;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
}

/* 缁堢灞忓箷鍐呴儴 */
.terminal-screen {
  flex: 1;
  background: #020603;
  border: 2px solid #1a3324;
  border-radius: 8px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.scanlines {
  position: absolute; inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
  background-size: 100% 3px;
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

.terminal-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

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
  font-size: 8px;
  color: #00FF41;
  font-weight: bold;
}
.retro-select {
  background: #020603;
  border: 2px solid rgba(0, 255, 65, 0.6);
  border-radius: 4px;
  color: #00FF41;
  font-family: inherit;
  font-size: 8px;
  font-weight: bold;
  padding: 2px 6px;
  outline: none;
  cursor: pointer;
}

.panel-header {
  display: grid;
  padding: 8px 6px;
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
  color: #00FF41;
  font-size: 8px;
  font-weight: bold;
}
.ranking-layout-header {
  grid-template-columns: 50px 1fr 90px 90px;
}
.history-layout-header {
  grid-template-columns: 1fr 90px 90px 60px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.scrollable::-webkit-scrollbar {
  width: 4px;
}
.scrollable::-webkit-scrollbar-track {
  background: rgba(0, 255, 65, 0.05);
}
.scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 65, 0.3);
  border-radius: 2px;
}

.data-row {
  display: grid;
  padding: 10px 6px;
  border-bottom: 1px dashed rgba(0, 255, 65, 0.1);
  color: rgba(0, 255, 65, 0.8);
  font-size: 8px;
  align-items: center;
}
.ranking-layout-row {
  grid-template-columns: 50px 1fr 90px 90px;
}
.history-layout-row {
  grid-template-columns: 1fr 90px 90px 60px;
}

.data-row.my-row {
  background: rgba(0, 255, 65, 0.1);
  border-left: 2px solid #00FF41;
}

.rank-num { font-weight: bold; }
.username {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.avatar-img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 65, 0.5);
  object-fit: cover;
}
.name-text {
  text-decoration: underline;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.score-val { font-weight: bold; }
.text-neon-green { color: #00FF41; }
.time-val { color: rgba(0, 255, 65, 0.6); }

.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  color: rgba(0, 255, 65, 0.5);
  font-size: 8px;
  border: 1px dashed rgba(0, 255, 65, 0.1);
  margin-top: 15px;
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 255, 65, 0.3);
  margin-top: auto;
}
.paging-btn {
  background: transparent;
  border: 1px solid rgba(0, 255, 65, 0.5);
  color: #00FF41;
  font-family: inherit;
  font-size: 8px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
}
.paging-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.page-indicator {
  color: #00FF41;
  font-size: 8px;
}

.modal-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}
.mech-btn {
  background: transparent;
  border: 2px solid var(--border-color);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  padding: 8px 16px;
  box-shadow: 0 4px 0 var(--shadow-color);
  transition: all 0.1s;
}
.mech-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--shadow-color);
}
.danger-btn {
  border-color: #ff3366;
  color: #ff3366;
  box-shadow: 0 4px 0 rgba(255, 51, 102, 0.3);
}
.danger-btn:active {
  box-shadow: 0 2px 0 rgba(255, 51, 102, 0.3);
}

@media (max-width: 768px) {
  .flex-column-mobile { flex-direction: column; gap: 8px; align-items: flex-start; }
}
</style>



