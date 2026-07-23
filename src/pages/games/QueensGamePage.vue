<template>
  <div class="yuemu-retro-queens-universe" :class="{ 'is-mobile': isMobile, 'is-shaking': isShaking }" @touchmove.prevent>
    <div class="arcade-handheld">

      <div class="handheld-header">
        <div class="brand"> {{ t('pages.games.queensGamePage.eightQueens') }} <span>{{ t('pages.games.queensGamePage.logic8') }}</span></div>
        <div class="speaker-grill">
          <div v-for="i in 12" :key="i" class="dot"></div>
        </div>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass crt-effect">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.queensGamePage.target') }}</span>
              <span class="hud-val">08</span>
            </div>
            <div class="hud-item center-item">
              <span class="hud-label">{{ t('pages.games.queensGamePage.placed') }}</span>
              <span class="hud-val highlight">{{ placedQueens }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.queensGamePage.status') }}</span>
              <span class="hud-val" :class="statusClass">{{ statusText }}</span>
            </div>
          </div>

          <div class="stage-container" ref="stageContainer">
            <div class="chess-board-pixel">
              <div v-for="(row, i) in board" :key="i" class="board-row">
                <div
                  v-for="(cell, j) in row"
                  :key="j"
                  class="board-cell"
                  :class="{
                    'cell-dark': (i + j) % 2 === 1,
                    'cell-light': (i + j) % 2 === 0,
                    'has-queen': cell === 1,
                    'is-conflict': conflictPos && conflictPos.r === i && conflictPos.c === j
                  }"
                  @click="handleCellClick(i, j)"
                >
                  <Transition name="queen-pop">
                    <div v-if="cell === 1" class="queen-sprite">♛</div>
                  </Transition>
                  <div class="cell-shadow"></div>
                </div>
              </div>
            </div>

            <div v-if="placedQueens === 8 && !isConflict" class="screen-overlay success-overlay">
              <div class="pixel-box">
                <h2 class="blink">{{ t('pages.games.queensGamePage.victoryExclamation') }}</h2>
                <p>{{ t('pages.games.queensGamePage.puzzleSolved') }}</p>
                <button class="retro-btn" @click="startNewGame">{{ t('pages.games.queensGamePage.restartAgain') }}</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 极客诊断通道按钮 (防挤压街机控制，纯中文) -->
      <div class="yuemu-diagnostic-trigger-bar">
        <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
          <span class="yuemu-sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.queensGamePage.leaderboardBracket') }}</span>
        </button>
        <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
          <span class="yuemu-sys-icon"><i class="fas fa-history"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.queensGamePage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">
        <div class="d-pad-section">
          <div class="d-pad">
            <div class="d-up"></div>
            <div class="d-left"></div>
            <div class="d-center"></div>
            <div class="d-right"></div>
            <div class="d-down"></div>
          </div>
          <span class="label">{{ t('pages.games.queensGamePage.move') }}</span>
        </div>

        <div class="system-section">
          <button class="sys-btn start" @click="startNewGame">
            <div class="pill"></div>
            <span>{{ t('pages.games.queensGamePage.reset') }}</span>
          </button>
          <button class="sys-btn solve" @click="autoSolve" :disabled="solving">
            <div class="pill"></div>
            <span>{{ t('pages.games.queensGamePage.auto') }}</span>
          </button>
          <button class="sys-btn sound" @click="toggleSound">
            <div class="pill" :class="{ 'off': !isSoundEnabled }"></div>
            <span>{{ t('pages.games.queensGamePage.sound') }}</span>
          </button>
        </div>

        <div class="action-section">
          <button class="action-btn a-btn" @click="goBack">B</button>
          <button class="action-btn b-btn">A</button>
          <span class="label">{{ t('pages.games.queensGamePage.action') }}</span>
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
          <span class="model-name terminal-title">{{ t('pages.games.queensGamePage.monitorDiagnosticQ08') }}</span>
          <div class="tab-buttons">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'ranking' }"
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.queensGamePage.rankBracket') }}
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'history' }"
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.queensGamePage.historyBracket') }}
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
              <span class="filter-label">{{ t('pages.games.queensGamePage.filterParams') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.queensGamePage.standardBoard') }}</option>
              </select>
            </div>

            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.queensGamePage.ranking') }}</span>
              <span>{{ t('pages.games.queensGamePage.matchTerminal') }}</span>
              <span>{{ t('pages.games.queensGamePage.highestScoreLabel') }}</span>
              <span>{{ t('pages.games.queensGamePage.accessTime') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.queensGamePage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.queensGamePage.noFlightLog') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.queensGamePage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.queensGamePage.scorePoints', { score: item.score }) }}</span>
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
                {{ t('pages.games.queensGamePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button
                class="paging-btn"
                :disabled="rankPage >= totalRankPages"
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.queensGamePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.queensGamePage.accessTime') }}</span>
              <span>{{ t('pages.games.queensGamePage.assaultDifficulty') }}</span>
              <span>{{ t('pages.games.queensGamePage.scoreRecord') }}</span>
              <span>{{ t('pages.games.queensGamePage.status') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.queensGamePage.readingPhysicsArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.queensGamePage.noFlightLog') }}记录
              </div>
              <div
                v-else
                v-for="item in historyRecords"
                :key="item.id"
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.queensGamePage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.queensGamePage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val success">{{ t('pages.games.queensGamePage.success') }}</span>
              </div>
            </div>

            <!-- 历史记录分页器 -->
            <div class="pagination-footer">
              <button
                class="paging-btn"
                :disabled="historyPage <= 1"
                @click="changeHistoryPage(-1)"
              >
                {{ t('pages.games.queensGamePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button
                class="paging-btn"
                :disabled="historyPage >= totalHistoryPages"
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.queensGamePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.queensGamePage.closeDiagTerminal') }}
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
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)

const isMobile = ref(false)
const isShaking = ref(false)
const solving = ref(false)
const conflictPos = ref<{r:number, c:number} | null>(null)

// --- 排行榜 & 历史记录诊断微端状态 ---
const isTerminalOpen = ref(false)
const activeTab = ref<'ranking' | 'history'>('ranking')

const rankings = ref<any[]>([])
const rankingLoading = ref(false)
const rankPage = ref(1)
const totalRankPages = ref(1)
const selectedRankLevel = ref('')
const levelOptions = [t('pages.games.queensGamePage.standardBoard')]

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
      gameType: 'queens',
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
    console.error(t('pages.games.queensGamePage.getQueensRankError'), err)
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
      gameType: 'queens',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.queensGamePage.getQueensHistoryError'), err)
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
    console.warn(t('pages.games.queensGamePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'queens',
      level: t('pages.games.queensGamePage.standardBoard'),
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.queensGamePage.reportQueensScoreError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.queensGamePage.unknown')
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// --- 游戏逻辑 ---
type Board = (0 | 1)[][]
const board = ref<Board>(Array.from({ length: 8 }, () => Array(8).fill(0)))

const placedQueens = computed(() => board.value.flat().filter(cell => cell === 1).length)
const isConflict = ref(false)

const statusText = computed(() => {
  if (solving.value) return t('pages.games.queensGamePage.running')
  if (isConflict.value) return t('pages.games.queensGamePage.error')
  if (placedQueens.value === 8) return t('pages.games.queensGamePage.complete')
  return t('pages.games.queensGamePage.standby')
})

const statusClass = computed(() => ({
  'text-danger': isConflict.value,
  'text-success': placedQueens.value === 8 && !isConflict.value,
  'text-info': solving.value
}))

// --- 音效系统 ---
const isSoundEnabled = ref(true)
const sounds = {
  place: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  remove: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  error: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href),
  win: new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href),
  reset: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  autoSolve: new Audio(new URL('@/assets/sounds/rotate.MP3', import.meta.url).href),
  step: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href)
}

// 设置音量
sounds.place.volume = 0.3
sounds.remove.volume = 0.25
sounds.error.volume = 0.4
sounds.win.volume = 0.6
sounds.reset.volume = 0.5
sounds.autoSolve.volume = 0.4
sounds.step.volume = 0.15

const playSfx = (name: keyof typeof sounds) => {
  if (!isSoundEnabled.value) return
  sounds[name].currentTime = 0
  sounds[name].play().catch(() => {})
}

// --- 核心方法 ---
function isValidPosition(row: number, col: number, currentBoard: Board): boolean {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (currentBoard[i][j] === 1) {
        if (i === row || j === col || Math.abs(row - i) === Math.abs(col - j)) return false
      }
    }
  }
  return true
}

function handleCellClick(r: number, c: number) {
  if (solving.value) return

  if (board.value[r][c] === 1) {
    board.value[r][c] = 0
    playSfx('remove')
    checkGlobalConflict()
    return
  }

  if (placedQueens.value >= 8) {
    triggerError(t('pages.games.queensGamePage.limitReached'))
    return
  }

  // 尝试放置
  if (isValidPosition(r, c, board.value)) {
    board.value[r][c] = 1
    playSfx('place')
    if (placedQueens.value === 8) {
      setTimeout(() => {
        playSfx('win')
        saveScore(1000)
      }, 200)
    }
  } else {
    conflictPos.value = { r, c }
    triggerError(t('pages.games.queensGamePage.conflict'))
  }
}

function triggerError(msg: string) {
  isConflict.value = true
  isShaking.value = true
  playSfx('error')
  setTimeout(() => {
    isShaking.value = false
    isConflict.value = false
    conflictPos.value = null
  }, 500)
}

function checkGlobalConflict() {
  // 手动放置模式下的全局检测（略，主要由 isValidPosition 拦截）
}

function startNewGame() {
  board.value = Array.from({ length: 8 }, () => Array(8).fill(0))
  isConflict.value = false
  playSfx('reset')
}

// 可视化自动求解
async function autoSolve() {
  solving.value = true
  board.value = Array.from({ length: 8 }, () => Array(8).fill(0))

  // 播放开始自动求解音效
  playSfx('autoSolve')

  const solve = async (row: number): Promise<boolean> => {
    if (row >= 8) return true
    for (let col = 0; col < 8; col++) {
      if (isValidPosition(row, col, board.value)) {
        board.value[row][col] = 1
        playSfx('step') // 每一步播放轻微音效
        await new Promise(r => setTimeout(r, 80)); // 动画延时
        if (await solve(row + 1)) return true
        board.value[row][col] = 0
      }
    }
    return false
  }

  await solve(0)
  solving.value = false
  playSfx('win')
}

const toggleSound = () => isSoundEnabled.value = !isSoundEnabled.value
const goBack = () => router.push({ name: 'Games' })
const checkMobile = () => isMobile.value = window.innerWidth <= 768

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
</script>

<style scoped>
@font-face {
  font-family: 'PressStart2P';
  src: url('https://fonts.cdnfonts.com/s/14227/PressStart2P-Regular.woff') format('woff');
}

.yuemu-retro-queens-universe {
  position: fixed; inset: 0;
  background-color: var(--background);
  display: flex; flex-direction: column;
  font-family: 'PressStart2P', Consolas, monospace;
  overflow-y: auto; overflow-x: hidden; padding: 15px;
}

/* 震动反馈 */
.is-shaking { animation: shake 0.2s ease-in-out infinite; }
@keyframes shake {
  0%, 100% { transform: translate(0,0); }
  25% { transform: translate(-4px, 2px); }
  75% { transform: translate(4px, -2px); }
}

/* 掌机外壳 */
.arcade-handheld {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 20px 20px 60px 20px;
  width: 100%; max-width: 500px; height: 95vh; max-height: 850px; margin: auto; flex-shrink: 0;
  display: flex; flex-direction: column; padding: 20px;
  box-shadow: 15px 15px 0 var(--shadow-color), inset 2px 2px 0 rgba(255,255,255,0.1);
}

.handheld-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px; flex-shrink: 0;
}
.brand { font-size: 14px; color: var(--text-primary); font-weight: bold; }
.brand span { font-size: 10px; opacity: 0.6; }
.speaker-grill { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; transform: rotate(15deg); }
.speaker-grill .dot { width: 4px; height: 4px; background: var(--border-color); border-radius: 50%; }

/* 屏幕区域 */
.screen-bezel {
  flex: 1; background: var(--console-body);
  padding: 15px; border-radius: 10px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.4);
  display: flex; flex-direction: column; min-height: 0;
}

.screen-glass {
  flex: 1; background: #9da87d; /* 经典绿屏 LCD */
  border: 4px solid #444; border-radius: 4px;
  position: relative; overflow: hidden; display: flex; flex-direction: column;
}
@media (prefers-color-scheme: dark) { .screen-glass { background: #1a1c12; } }

.crt-effect::after {
  content: " "; display: block; position: absolute; inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
  background-size: 100% 4px; z-index: 50; pointer-events: none;
}

/* HUD */
.hud-bar {
  display: flex; justify-content: space-between; padding: 10px;
  background: rgba(0,0,0,0.1); border-bottom: 2px solid rgba(0,0,0,0.2);
}
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.hud-label { font-size: 8px; color: #444; }
.hud-val { font-size: 12px; color: #000; font-weight: bold; }
@media (prefers-color-scheme: dark) { .hud-val { color: #8bac0f; } }
.highlight { color: #8b0000; }
.text-danger { color: #ff0000 !important; }
.text-success { color: #006400 !important; }

/* 棋盘 */
.stage-container { flex: 1; display: flex; justify-content: center; align-items: center; padding: 10px; position: relative; }
.chess-board-pixel {
  width: 100%; aspect-ratio: 1; max-width: 60vh; margin: auto;
  display: flex; flex-direction: column;
  background: #757575; border: 2px solid #000;
}
.board-row { display: flex; flex: 1; }
.board-cell {
  flex: 1; position: relative; cursor: pointer;
  display: flex; justify-content: center; align-items: center;
}
.cell-light { background: #eee4da; }
.cell-dark { background: #bbada0; }
.cell-shadow { position: absolute; inset: 0; box-shadow: inset 2px 2px 0 rgba(255,255,255,0.2), inset -2px -2px 0 rgba(0,0,0,0.1); }

.board-cell.has-queen .cell-shadow { box-shadow: inset -2px -2px 0 rgba(255,255,255,0.4), inset 2px 2px 0 rgba(0,0,0,0.3); }
.is-conflict { background: #ff4d4d !important; }

.queen-sprite {
  font-size: 24px; z-index: 2; color: #2c3e50;
  text-shadow: 2px 2px 0 rgba(0,0,0,0.2);
}

/* 覆盖层 */
.screen-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.8);
  z-index: 100; display: flex; flex-direction: column; justify-content: center; align-items: center;
  color: #8bac0f; text-align: center; padding: 20px;
}
.pixel-box { border: 4px solid #8bac0f; padding: 20px; background: #000; }
.pixel-title { font-size: 18px; margin-bottom: 20px; }

/* 控制面板 */
.control-panel {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 0; flex-shrink: 0;
}

/* 十字键 */
.d-pad {
  position: relative; width: 80px; height: 80px;
  background: #333; border-radius: 10px;
}
.d-up, .d-down, .d-left, .d-right {
  position: absolute; background: #222;
  box-shadow: inset 1px 1px 0 rgba(255,255,255,0.1);
}
.d-up { top: 5px; left: 27px; width: 26px; height: 30px; border-radius: 4px 4px 0 0; }
.d-down { bottom: 5px; left: 27px; width: 26px; height: 30px; border-radius: 0 0 4px 4px; }
.d-left { left: 5px; top: 27px; width: 30px; height: 26px; border-radius: 4px 0 0 4px; }
.d-right { right: 5px; top: 27px; width: 30px; height: 26px; border-radius: 0 4px 4px 0; }
.d-center { position: absolute; inset: 27px; background: #222; z-index: 2; }

/* 系统键 */
.system-section { display: flex; gap: 15px; transform: rotate(-15deg); }
.sys-btn { background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
.sys-btn span { font-size: 8px; color: var(--text-secondary); font-weight: bold; }
.pill { width: 40px; height: 12px; background: var(--border-color); border-radius: 10px; box-shadow: 0 4px 0 rgba(0,0,0,0.2); }
.pill.off { opacity: 0.4; }

/* A/B 键 */
.action-section { display: flex; gap: 15px; transform: rotate(-15deg); }
.action-btn {
  width: 45px; height: 45px; border-radius: 50%; border: none;
  background: #ff4757; color: rgba(0,0,0,0.3); font-weight: bold;
  box-shadow: 2px 4px 0 #c4323f; cursor: pointer;
}
.action-btn:active { transform: translate(1px, 2px); box-shadow: 1px 2px 0 #c4323f; }

.label { font-size: 8px; color: var(--text-secondary); margin-top: 10px; display: block; text-align: center;}

.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

.queen-pop-enter-active { animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }

@media (max-width: 480px) {
  .arcade-handheld { height: 100vh; width: 100vw; max-height: none; border: none; border-radius: 0; padding: 15px; }
  .control-panel { transform: scale(0.8); }
  .queen-sprite { font-size: 18px; }
}

/* 极客诊断通道按钮 (防挤压街机控制，纯中文) */
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
  display: flex;
  flex-direction: column;
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
  font-size: 114px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 2px 6px;
}
.tab-btn.active, .tab-btn:hover {
  color: #00FF41;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
}

/* 终端屏幕内部 */
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
  background: radial-gradient(circle, transparent 70%, rgba(0,0,0,0.5) 100%);
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
  font-size: 14px;
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
  padding: 2px 6px;
  outline: none;
  cursor: pointer;
}

.panel-header {
  display: grid;
  padding: 14px 6px;
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
  color: #00FF41;
  font-size: 14px;
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
  font-size: 14px;
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
.time-val { color: rgba(100, 255, 130, 0.9); }

.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  color: rgba(0, 255, 65, 0.5);
  font-size: 14px;
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
  font-size: 12px;
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

/* 移动端减负：隐藏纯装饰的手柄按钮，并大幅压缩外壳边距 */
@media (max-width: 768px) {
  .yuemu-retro-queens-universe { padding: 0; }
  .arcade-handheld { 
    height: 100dvh !important; min-height: 100dvh; 
    border-width: 0; border-radius: 0; padding: 15px 10px; box-shadow: none;
    margin: 0; display: flex; flex-direction: column;
  }
  .handheld-header { margin-bottom: 0; }
  .screen-bezel { margin-top: auto; padding: 8px; border-radius: 6px; }
  .yuemu-diagnostic-trigger-bar { margin: 15px 0; gap: 10px; }
  .d-pad-section, .action-section { display: none !important; }
  .control-panel { margin-bottom: auto; flex-wrap: wrap; justify-content: center; transform: none !important; padding: 5px 0; }
  .system-section { width: 100%; justify-content: center; transform: none; margin-bottom: 0; }
  .sys-btn span { font-size: 10px; }
}

/* PC端原生左右布局重构 */
@media screen and (min-width: 769px) {
  .arcade-handheld {
    max-width: 900px;
    height: auto;
    min-height: 85vh;
    max-height: none;
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto auto 1fr;
    grid-template-areas: 
      "header header"
      "screen triggers"
      "screen controls";
    gap: 15px 30px;
    padding: 30px;
  }
  
  .handheld-header { grid-area: header; }
  .screen-bezel { grid-area: screen; margin-bottom: 0; }
  
  .yuemu-diagnostic-trigger-bar { 
    grid-area: triggers; 
    flex-direction: column; 
    gap: 10px;
    margin: 0;
  }
  
  .control-panel { 
    grid-area: controls; 
    flex-direction: column; 
    justify-content: flex-end; 
    padding: 0;
    gap: 20px;
  }
  .system-section { transform: none; margin: 15px 0;}
  .action-section { transform: none; align-self: center; }
  .d-pad-section { align-self: center; }
}
</style>
