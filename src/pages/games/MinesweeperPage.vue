<template>
  <div class="yuemu-retro-mines-universe" :class="{ 'is-mobile': isMobile, 'is-shaking': isShaking }" @touchmove.prevent>
    <div class="arcade-handheld">

      <div class="handheld-marquee" @click="goBack">
        <span class="back-btn"><i class="fas fa-arrow-left"></i> {{ t('pages.games.minesweeperPage.exit') }} </span>
        <h1 class="game-title"> {{ t('pages.games.minesweeperPage.minesweeper') }} <span v-if="!isMobile">{{ t('pages.games.minesweeperPage.eightBit') }}</span></h1>
        <span class="version" v-if="!isMobile">OS.V2</span>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass crt-effect">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.minesweeperPage.mines') }}</span>
              <span class="hud-val highlight">{{ minesLeft }}</span>
            </div>
            <div class="hud-item center-item">
              <div class="face-btn" @click="restartGame">
                <i :class="gameState.isGameOver ? (gameState.isWin ? 'fas fa-grin-cool' : 'fas fa-dizzy') : 'fas fa-smile'"></i>
              </div>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.minesweeperPage.time') }}</span>
              <span class="hud-val">{{ formatTime(gameState.time) }}</span>
            </div>
          </div>

          <div class="stage-container" ref="stageContainer">
            <div
              class="mines-grid"
              :class="`grid-${currentDifficulty}`"
              @contextmenu.prevent
            >
              <div
                v-for="(row, r) in board"
                :key="r"
                class="grid-row"
              >
                <div
                  v-for="(cell, c) in row"
                  :key="c"
                  class="retro-cell"
                  :class="{
                    'revealed': cell.isRevealed,
                    'is-mine': cell.isMine && cell.isRevealed,
                    'is-flagged': cell.isFlagged,
                    'is-exploded': cell.isExploded,
                    'wrong-flag': cell.isFlagged && !cell.isMine && gameState.isGameOver
                  }"
                  @mousedown="handleMouseDown(r, c)"
                  @touchstart="handleTouchStart(r, c)"
                  @touchend="handleTouchEnd(r, c)"
                  @click="revealCell(r, c)"
                  @contextmenu.prevent="toggleFlag(r, c)"
                >
                  <template v-if="cell.isRevealed && !cell.isMine">
                    <span v-if="cell.neighborMines > 0" :class="`num-${cell.neighborMines}`">
                      {{ cell.neighborMines }}
                    </span>
                  </template>
                  <i v-else-if="cell.isFlagged" class="fas fa-flag pixel-flag"></i>
                  <i v-else-if="cell.isRevealed && cell.isMine" class="fas fa-bomb pixel-mine"></i>
                </div>
              </div>
            </div>

            <div v-if="gameState.isGameOver" class="screen-overlay result-overlay">
              <div class="trophy">
                <i :class="gameState.isWin ? 'fas fa-trophy win-trophy' : 'fas fa-bomb lose-bomb'"></i>
              </div>
              <h2 class="pixel-title">{{ gameState.isWin ? t('pages.games.minesweeperPage.victory') : t('pages.games.minesweeperPage.defeat') }}</h2>
              <div class="final-stats">
                <p> {{ t('pages.games.minesweeperPage.timeUsedLabel') }} <span>{{ formatTime(gameState.time) }}</span></p>
                <p> {{ t('pages.games.minesweeperPage.bestLabel') }} <span>{{ formatTime(gameState.bestTimes[currentDifficulty] || 0) }}</span></p>
              </div>
              <button class="pixel-action-btn" @click="restartGame">{{ t('pages.games.minesweeperPage.playAgain') }}</button>
            </div>
          </div>

        </div>
      </div>

      <!-- 极客诊断通道按钮 (防挤压街机控制，纯中文) -->
      <div class="yuemu-diagnostic-trigger-bar">
        <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
          <span class="yuemu-sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.minesweeperPage.leaderboardBracket') }}</span>
        </button>
        <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
          <span class="yuemu-sys-icon"><i class="fas fa-history"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.minesweeperPage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">
        <div class="difficulty-selectors">
          <button
            v-for="level in difficultyLevels"
            :key="level.name"
            class="mode-btn"
            :class="{ active: currentDifficulty === level.name }"
            @click="changeDifficulty(level)"
          >
            {{ level.label }}
          </button>
        </div>

        <div class="system-buttons">
          <button class="sys-btn circle" @click="toggleSound">
            <div class="inner">
              <component :is="gameState.isMuted ? AudioMutedOutlined : SoundFilled" />
            </div>
          </button>

          <button class="sys-btn start" @click="restartGame">
            <div class="pill">{{ t('pages.games.minesweeperPage.startReset') }}</div>
          </button>

          <button class="sys-btn circle" @click="goBack">
            <div class="inner"><i class="fas fa-arrow-left"></i></div>
          </button>
        </div>
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
          <span class="model-name terminal-title">{{ t('pages.games.minesweeperPage.monitorDiagnosticR09') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.minesweeperPage.rankBracket') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.minesweeperPage.historyBracket') }}
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
              <span class="filter-label">{{ t('pages.games.minesweeperPage.difficultyFilter') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.minesweeperPage.allLevels') }}</option>
                <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>

            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.minesweeperPage.ranking') }}</span>
              <span>{{ t('pages.games.minesweeperPage.matchTerminal') }}</span>
              <span>{{ t('pages.games.minesweeperPage.shortestTime') }}</span>
              <span>{{ t('pages.games.minesweeperPage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.minesweeperPage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.minesweeperPage.noMineRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.minesweeperPage.anonymousTerminal') }}</span>
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
                {{ t('pages.games.minesweeperPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.minesweeperPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.minesweeperPage.accessTime') }}</span>
              <span>{{ t('pages.games.minesweeperPage.minesweeperDifficulty') }}</span>
              <span>{{ t('pages.games.minesweeperPage.clearTime') }}</span>
              <span>{{ t('pages.games.minesweeperPage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.minesweeperPage.readingPhysicsArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.minesweeperPage.noLocalMineLog') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.minesweeperPage.default') }}</span>
                <span class="score-val text-neon-green">{{ formatRankTime(item.score) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.minesweeperPage.clearSuccessMinesweeper') : t('pages.games.minesweeperPage.notInitiated') }}
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
                {{ t('pages.games.minesweeperPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.minesweeperPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.minesweeperPage.closeDiagTerminal') }}
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { SoundFilled, AudioMutedOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'

// --- 逻辑部分保持原有的稳定性并优化性能 ---
interface Cell { isMine: boolean; isRevealed: boolean; isFlagged: boolean; neighborMines: number; isExploded: boolean; }
const difficultyLevels = [
  { name: 'easy', label: t('pages.games.minesweeperPage.beginner'), rows: 9, cols: 9, mines: 10 },
  { name: 'medium', label: t('pages.games.minesweeperPage.intermediate'), rows: 12, cols: 12, mines: 30 },
  { name: 'hard', label: t('pages.games.minesweeperPage.advanced'), rows: 15, cols: 15, mines: 50 }
]

const router = useRouter()
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)

const isMobile = ref(window.innerWidth <= 768)
const isShaking = ref(false)
const isPlaying = ref(false)
const board = ref<Cell[][]>([])
const currentDifficulty = ref('easy')
const minesLeft = ref(10)
const stageContainer = ref<HTMLElement | null>(null)

// --- 排行榜 & 历史记录诊断微端状态 ---
const isTerminalOpen = ref(false)
const activeTab = ref<'ranking' | 'history'>('ranking')

const rankings = ref<any[]>([])
const rankingLoading = ref(false)
const rankPage = ref(1)
const totalRankPages = ref(1)
const selectedRankLevel = ref('')
const levelOptions = [t('pages.games.minesweeperPage.beginner'), t('pages.games.minesweeperPage.intermediate'), t('pages.games.minesweeperPage.advanced')]

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
      gameType: 'minesweeper',
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
    console.error(t('pages.games.minesweeperPage.getMinesweeperRankError'), err)
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
      gameType: 'minesweeper',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.minesweeperPage.getMinesweeperHistoryError'), err)
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
    console.warn(t('pages.games.minesweeperPage.notLoggedInSave'))
    return
  }
  const levelLabel = difficultyLevels.find(l => l.name === currentDifficulty.value)?.label || t('pages.games.minesweeperPage.beginner')
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'minesweeper',
      level: levelLabel,
      score: finalTime
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.minesweeperPage.reportMinesweeperScoreError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.minesweeperPage.unknown')
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatRankTime = (seconds: number) => {
  if (!seconds) return t('pages.games.minesweeperPage.unknown')
  const m = Math.floor(seconds / 60); const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const gameState = reactive({
  isGameOver: false, isWin: false,
  time: 0, isMuted: false,
  bestTimes: {} as Record<string, number>
})

let timerInterval: any = null
let longPressTimer: any = null

const initBoard = (rows: number, cols: number) => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0, isExploded: false
    }))
  )
}

const generateMines = (clickR: number, clickC: number) => {
  const diff = difficultyLevels.find(l => l.name === currentDifficulty.value)!
  const rows = diff.rows
  const cols = diff.cols
  const mines = diff.mines

  let placed = 0
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    
    // 确保雷不在第一次点击的格子，且最好不在第一次点击格子的周围 3x3 区域内以形成安全空地
    const isFirstClickOrNeighbor = Math.abs(r - clickR) <= 1 && Math.abs(c - clickC) <= 1
    
    if (!board.value[r][c].isMine && !isFirstClickOrNeighbor) {
      board.value[r][c].isMine = true
      placed++
    }
  }

  // 极端边缘情况：如果雷数太多，导致周围 3x3 装不下（或者剩余格子不够雷数），降级为“只需不是第一次点击的格子”
  if (placed < mines) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        board.value[r][c].isMine = false
      }
    }
    placed = 0
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows)
      const c = Math.floor(Math.random() * cols)
      if (!board.value[r][c].isMine && !(r === clickR && c === clickC)) {
        board.value[r][c].isMine = true
        placed++
      }
    }
  }

  // 重新计算 neighborMines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board.value[r][c].isMine) {
        let count = 0
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const nr = r + i, nc = c + j
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board.value[nr][nc].isMine) count++
          }
        }
        board.value[r][c].neighborMines = count
      }
    }
  }
}

const revealCell = (r: number, c: number) => {
  if (gameState.isGameOver || board.value[r][c].isFlagged || board.value[r][c].isRevealed) return
  if (!isPlaying.value) {
    isPlaying.value = true
    generateMines(r, c) // 第一次点击：动态雷区布局，保证首发绝对安全
    startTimer()
    playSfx('start')
  }

  const cell = board.value[r][c]
  if (cell.isMine) {
    cell.isExploded = true
    isShaking.value = true; setTimeout(() => isShaking.value = false, 500)
    endGame(false); return
  }

  let revealedCount = 0
  const reveal = (row: number, col: number) => {
    if (row < 0 || row >= board.value.length || col < 0 || col >= board.value[0].length) return
    const target = board.value[row][col]
    if (target.isRevealed || target.isFlagged) return
    target.isRevealed = true
    revealedCount++

    if (target.neighborMines === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) reveal(row + i, col + j)
      }
    }
  }
  reveal(r, c)

  // 根据揭开的格子数量播放不同音效
  if (revealedCount > 5) {
    playSfx('cascade') // 连锁揭开音效
  } else if (cell.neighborMines > 0) {
    playSfx('click') // 数字格音效
  } else {
    playSfx('reveal') // 普通揭开音效
  }

  checkWin()
}

const toggleFlag = (r: number, c: number) => {
  if (gameState.isGameOver || board.value[r][c].isRevealed) return
  const wasFlagged = board.value[r][c].isFlagged
  board.value[r][c].isFlagged = !board.value[r][c].isFlagged
  minesLeft.value += board.value[r][c].isFlagged ? -1 : 1

  // 插旗和取消插旗播放不同音效
  playSfx(board.value[r][c].isFlagged ? 'flag' : 'unflag')
}

const checkWin = () => {
  const diff = difficultyLevels.find(l => l.name === currentDifficulty.value)!
  let revealed = 0
  board.value.forEach(row => row.forEach(c => { if (c.isRevealed) revealed++ }))
  if (revealed === diff.rows * diff.cols - diff.mines) endGame(true)
}

const endGame = (win: boolean) => {
  gameState.isGameOver = true; gameState.isWin = win; isPlaying.value = false
  clearInterval(timerInterval)
  if (!win) {
    board.value.forEach(row => row.forEach(c => { if (c.isMine) c.isRevealed = true }))
    playSfx('explosion')
  } else {
    playSfx('win')
    const best = gameState.bestTimes[currentDifficulty.value]
    if (!best || gameState.time < best) {
      gameState.bestTimes[currentDifficulty.value] = gameState.time
      localStorage.setItem('minesweeperBestTimes', JSON.stringify(gameState.bestTimes))
    }
    saveScore(gameState.time)
  }
}

const handleTouchStart = (r: number, c: number) => {
  longPressTimer = setTimeout(() => {
    toggleFlag(r, c)
    if (window.navigator.vibrate) window.navigator.vibrate(50)
    longPressTimer = null
  }, 450)
}
const handleTouchEnd = () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null } }

const restartGame = () => {
  const diff = difficultyLevels.find(l => l.name === currentDifficulty.value)!
  board.value = initBoard(diff.rows, diff.cols)
  minesLeft.value = diff.mines; gameState.isGameOver = false; gameState.time = 0; isPlaying.value = false
  clearInterval(timerInterval)

  // 重新开始时播放音效
  if (!gameState.isGameOver) {
    playSfx('start')
  }
}

const changeDifficulty = (level: any) => {
  currentDifficulty.value = level.name
  restartGame()
}
const startTimer = () => { timerInterval = setInterval(() => gameState.time++, 1000) }
const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
const toggleSound = () => { gameState.isMuted = !gameState.isMuted }
const goBack = () => router.push({ name: 'Games' })

// 音效系统
const sfx = {
  reveal: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  flag: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href),
  unflag: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  explosion: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href),
  win: new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  click: new Audio(new URL('@/assets/sounds/move.MP3', import.meta.url).href),
  cascade: new Audio(new URL('@/assets/sounds/clear.MP3', import.meta.url).href)
}

// 设置音量
sfx.reveal.volume = 0.2
sfx.flag.volume = 0.3
sfx.unflag.volume = 0.25
sfx.explosion.volume = 0.5
sfx.win.volume = 0.6
sfx.start.volume = 0.5
sfx.click.volume = 0.15
sfx.cascade.volume = 0.3

const playSfx = (type: keyof typeof sfx) => {
  if (gameState.isMuted) return
  const sound = sfx[type]
  sound.currentTime = 0
  sound.play().catch(() => {})
}

onMounted(() => {
  const saved = localStorage.getItem('minesweeperBestTimes')
  if (saved) gameState.bestTimes = JSON.parse(saved)
  restartGame()
})
</script>

<style scoped>
@font-face {
  font-family: 'PressStart2P';
  src: url('https://fonts.cdnfonts.com/s/14227/PressStart2P-Regular.woff') format('woff');
}

.yuemu-retro-mines-universe {
  position: fixed; inset: 0;
  background-color: var(--background);
  display: flex; justify-content: center; align-items: center;
  font-family: 'PressStart2P', Consolas, monospace;
  overflow: hidden; touch-action: none;
}

.is-shaking { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* 掌机外壳 - 移动端自适应关键 */
.arcade-handheld {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 20px 20px 60px 20px;
  width: 100%; max-width: 500px; height: 96vh;
  display: flex; flex-direction: column; padding: 15px;
  box-shadow: 12px 12px 0 var(--shadow-color), inset 2px 2px 0 rgba(255,255,255,0.1);
}

.handheld-marquee {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 10px; cursor: pointer; flex-shrink: 0;
}
.game-title { font-size: 14px; color: var(--text-primary); }
.back-btn { font-size: 10px; color: var(--text-secondary); }

/* 屏幕区域 - 移动端最大化 */
.screen-bezel {
  flex: 1; background: var(--console-body);
  padding: 10px; border-radius: 10px;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.3);
  display: flex; flex-direction: column; min-height: 0; /* 允许内部元素撑开 */
}

.screen-glass {
  flex: 1; background: #9da87d;
  border: 4px solid #444; border-radius: 4px;
  position: relative; overflow: hidden; display: flex; flex-direction: column;
}
@media (prefers-color-scheme: dark) { .screen-glass { background: #2a311b; } }

.crt-effect::after {
  content: " "; display: block; position: absolute; inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.05) 50%);
  background-size: 100% 4px; z-index: 50; pointer-events: none;
}

/* HUD */
.hud-bar {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(0,0,0,0.1); padding: 8px 12px;
  border-bottom: 2px solid rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.hud-label { font-size: 7px; color: #444; margin-bottom: 2px; display: block; }
.hud-val { font-size: 12px; color: #000; font-weight: bold; }
@media (prefers-color-scheme: dark) { .hud-val { color: #eee; } }
.highlight { color: #8b0000; }
.face-btn {
  font-size: 20px; cursor: pointer; padding: 2px 6px;
  background: #bdbdbd; border: 2px solid;
  border-top-color: #eee; border-left-color: #eee;
  border-bottom-color: #555; border-right-color: #555;
}

/* 棋盘格子 - 核心自适应逻辑 */
.stage-container {
  flex: 1; display: flex; justify-content: center; align-items: center;
  position: relative; overflow: hidden; padding: 5px;
}

.mines-grid {
  display: flex; flex-direction: column; gap: 2px;
  background: rgba(0,0,0,0.2); padding: 4px;
  /* 移动端让棋盘尽可能占满屏幕 */
  max-width: 100%; max-height: 100%;
}

.grid-row { display: flex; gap: 2px; flex: 1; }

.retro-cell {
  /* 动态计算格子大小 */
  width: min(8vw, 36px); height: min(8vw, 36px);
  background: #bdbdbd; border: 3px solid;
  border-top-color: #eee; border-left-color: #eee;
  border-bottom-color: #555; border-right-color: #555;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; cursor: pointer;
  flex-shrink: 0;
}

/* 针对难度动态调整格子大小 */
.grid-medium .retro-cell { width: min(6.5vw, 30px); height: min(6.5vw, 30px); font-size: 12px; border-width: 2px;}
.grid-hard .retro-cell { width: min(5.5vw, 24px); height: min(5.5vw, 24px); font-size: 10px; border-width: 2px;}

.retro-cell.revealed {
  border: 1px solid #999; background: #d0d0d0;
  border-top-color: #777; border-left-color: #777;
  border-bottom: none; border-right: none;
}
.retro-cell.is-mine { background: #ff5252; }
.retro-cell.is-exploded { background: #ff1744; }

.num-1 { color: #0000ff; } .num-2 { color: #008000; } .num-3 { color: #ff0000; }
.num-4 { color: #000080; } .num-5 { color: #800000; }

/* 结算遮罩 */
.screen-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 100; color: #fff; text-align: center;
}
.pixel-action-btn {
  background: #ff4757; border: none; padding: 10px 20px;
  color: #fff; font-family: inherit; font-size: 12px;
  box-shadow: 0 4px 0 #c4323f; cursor: pointer;
}

/* 底部面板 */
.control-panel {
  padding: 10px 0; display: flex; flex-direction: column; gap: 10px; flex-shrink: 0;
}
.difficulty-selectors { display: flex; justify-content: space-between; gap: 5px; }
.mode-btn {
  flex: 1; background: var(--console-body); border: 2px solid var(--border-color);
  padding: 6px; font-family: inherit; font-size: 9px; color: var(--text-secondary);
  box-shadow: 0 3px 0 var(--shadow-color);
}
.mode-btn.active { background: var(--nav-item-active); color: var(--nav-item-active-text); box-shadow: 0 1px 0 var(--shadow-color); transform: translateY(2px); }

.system-buttons { display: flex; justify-content: space-between; align-items: center; gap: 10px;}
.sys-btn { background: transparent; border: none; display: flex; flex-direction: column; align-items: center; cursor: pointer; }
.inner {
  width: 36px; height: 36px; background: var(--border-color);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--text-primary);
  box-shadow: 0 4px 0 rgba(0,0,0,0.2);
}
.pill {
  width: 100%; min-width: 140px; height: 30px; background: #ff4757;
  border-radius: 15px; box-shadow: 0 4px 0 #c4323f;
  color: white; font-size: 9px; display: flex; align-items: center; justify-content: center;
}
.sys-btn:active .inner, .sys-btn:active .pill { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.2); }

@media (max-width: 768px) {
  .arcade-handheld { height: 100dvh; border: none; border-radius: 0; padding: 10px; width: 100vw; max-width: none;}
  .screen-bezel { padding: 5px; }
  .hud-bar { padding: 5px 8px; }
  .control-panel { gap: 8px; }
  .mines-grid { gap: 1px; }
  .grid-row { gap: 1px; }
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
  font-size: 18px;
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
  color: rgba(100, 255, 130, 0.9);
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  padding: 4px 8px;
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
  background: radial-gradient(circle, transparent 70%, rgba(0,0,0,0.5) 100%);
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

.lose-bomb {
  color: #ff1744;
  font-size: 24px;
  animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
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

/* PC端原生左右布局重构 */
@media screen and (min-width: 769px) {
  .arcade-handheld {
    max-width: 900px;
    height: 85vh;
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto auto 1fr;
    grid-template-areas: 
      "marquee marquee"
      "screen triggers"
      "screen controls";
    gap: 15px 30px;
    padding: 30px;
  }
  
  .handheld-marquee { grid-area: marquee; }
  .screen-bezel { grid-area: screen; margin-bottom: 0; }
  
  .yuemu-diagnostic-trigger-bar { 
    grid-area: triggers; 
    flex-direction: column; 
    gap: 10px;
  }
  
  .control-panel { 
    grid-area: controls; 
    justify-content: flex-end; 
    padding: 0;
  }
}
</style>
