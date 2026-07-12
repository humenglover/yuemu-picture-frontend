<template>
  <div class="yuemu-tetris-retro-universe" :class="{ 'is-mobile': isMobile }" @touchmove.prevent>
    <div class="retro-console">

      <div class="mobile-top-bar" v-if="isMobile">
        <div class="m-stat-box">
          <span class="m-label">{{ t('pages.games.tetrisPage.score') }}</span>
          <span class="m-val">{{ score }}</span>
        </div>
        <div class="m-stat-box">
          <span class="m-label">{{ t('pages.games.tetrisPage.grade') }}</span>
          <span class="m-val">{{ level }}</span>
        </div>
        <div class="m-stat-box" style="flex-direction: row; gap: 10px; align-items: center;">
          <button class="sound-btn-mobile" @click="showHelp = true">
            <i class="fas fa-question-circle"></i>
          </button>
          <button class="sound-btn-mobile" @click="toggleGame">
            <i class="fas" :class="!isPlaying || isPaused ? 'fa-play' : 'fa-pause'"></i>
          </button>
          <button class="sound-btn-mobile" @click="toggleSound" :title="isSoundEnabled ? t('pages.games.tetrisPage.turnOffSound') : t('pages.games.tetrisPage.turnOnSound')">
            <i class="fas" :class="isSoundEnabled ? 'fa-volume-up' : 'fa-volume-mute'"></i>
          </button>
        </div>
        <div class="m-stat-box mini-next">
          <div class="mini-stage">
            <template v-if="nextPiece">
              <template v-for="(row, y) in nextPiece.shape" :key="'mp-r-'+y">
                <template v-for="(val, x) in row" :key="'mp-c-'+x">
                  <div v-if="val !== 0"
                       class="retro-block"
                       :class="'color-' + nextPiece.type"
                       :style="{
                         transform: `translate(${(x + nextPiece.offsetX) * 100}%, ${(y + nextPiece.offsetY) * 100}%)`
                       }">
                  </div>
                </template>
              </template>
            </template>
          </div>
        </div>
      </div>

      <div class="console-body">

        <div class="side-panel left-panel" v-if="!isMobile">
          <div class="lcd-box">
            <span class="lcd-label">{{ t('pages.games.tetrisPage.score') }}</span>
            <span class="lcd-value">{{ score }}</span>
          </div>
          <div class="lcd-box">
            <span class="lcd-label">{{ t('pages.games.tetrisPage.highScore') }}</span>
            <span class="lcd-value">{{ highScore }}</span>
          </div>
          <div class="lcd-box">
            <span class="lcd-label">{{ t('pages.games.tetrisPage.grade') }}</span>
            <span class="lcd-value">{{ level }}</span>
          </div>
          <div class="lcd-box">
            <span class="lcd-label">{{ t('pages.games.tetrisPage.lines') }}</span>
            <span class="lcd-value">{{ lines }}</span>
          </div>
          <button class="sound-btn-pc" @click="showHelp = true" style="margin-bottom: 10px;" title="Help">
            <i class="fas fa-question-circle"></i>
          </button>
          <button class="sound-btn-pc" @click="toggleSound" :title="isSoundEnabled ? t('pages.games.tetrisPage.turnOffSound') : t('pages.games.tetrisPage.turnOnSound')">
            <i class="fas" :class="isSoundEnabled ? 'fa-volume-up' : 'fa-volume-mute'"></i>
          </button>
        </div>

        <div class="screen-bezel">
          <div class="game-stage" :style="{ width: stageWidth, height: stageHeight }" @touchstart.passive="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @click="handleStageClick">

            <div class="grid-layer">
              <div v-for="r in BOARD_ROWS" :key="'bg-r-'+r" class="grid-row">
                <div v-for="c in BOARD_COLS" :key="'bg-c-'+c" class="grid-cell"></div>
              </div>
            </div>

            <div class="matrix-layer">
              <template v-for="(row, y) in board" :key="'m-r-'+y">
                <template v-for="(cell, x) in row" :key="'m-c-'+x">
                  <div v-if="cell !== 0"
                       class="retro-block"
                       :class="'color-' + cell"
                       :style="{ transform: `translate(${x * 100}%, ${y * 100}%)` }">
                  </div>
                </template>
              </template>
            </div>

            <div class="ghost-layer" v-if="isPlaying && !isPaused && !isGameOver">
              <template v-for="(row, y) in currentPiece.shape" :key="'g-r-'+y">
                <template v-for="(val, x) in row" :key="'g-c-'+x">
                  <div v-if="val !== 0"
                       class="retro-block ghost-block"
                       :style="{ transform: `translate(${(currentPiece.x + x) * 100}%, ${(ghostY + y) * 100}%)` }">
                  </div>
                </template>
              </template>
            </div>

            <div class="active-layer" v-if="isPlaying && !isGameOver">
              <template v-for="(row, y) in currentPiece.shape" :key="'a-r-'+y">
                <template v-for="(val, x) in row" :key="'a-c-'+x">
                  <div v-if="val !== 0"
                       class="retro-block"
                       :class="'color-' + currentPiece.type"
                       :style="{ transform: `translate(${(currentPiece.x + x) * 100}%, ${(currentPiece.y + y) * 100}%)` }">
                  </div>
                </template>
              </template>
            </div>

            <div v-if="!isPlaying || isPaused || isGameOver" class="screen-overlay">
              <div class="overlay-text blink" v-if="isGameOver">{{ t('pages.games.tetrisPage.gameOver') }}</div>
              <div class="overlay-text" v-else-if="isPaused">{{ t('pages.games.tetrisPage.pause') }}</div>
              <div class="overlay-text blink" v-else>{{ t('pages.games.tetrisPage.pressStartKey') }}</div>
            </div>
          </div>
        </div>

        <div class="side-panel right-panel" v-if="!isMobile">
          <div class="lcd-box next-box">
            <span class="lcd-label">{{ t('pages.games.tetrisPage.next') }}</span>
            <div class="pc-next-stage">
              <template v-if="nextPiece">
                <template v-for="(row, y) in nextPiece.shape" :key="'p-r-'+y">
                  <template v-for="(val, x) in row" :key="'p-c-'+x">
                    <div v-if="val !== 0"
                         class="retro-block"
                         :class="'color-' + nextPiece.type"
                         :style="{
                           transform: `translate(${(x + nextPiece.offsetX) * 100}%, ${(y + nextPiece.offsetY) * 100}%)`
                         }">
                    </div>
                  </template>
                </template>
              </template>
            </div>
          </div>
          <div class="controls-hint">
            <p>{{ t('pages.games.tetrisPage.arrowRotate') }}</p>
            <p>{{ t('pages.games.tetrisPage.arrowMove') }}</p>
            <p>{{ t('pages.games.tetrisPage.arrowSoftDrop') }}</p>
            <p>{{ t('pages.games.tetrisPage.spaceHardDrop') }}</p>
          </div>
          <button class="retro-btn" @click="toggleGame">
            {{ isPlaying ? (isPaused ? t('pages.games.tetrisPage.continue') : t('pages.games.tetrisPage.pause')) : t('pages.games.tetrisPage.start') }}
          </button>
        </div>
      </div>

      <!-- 移动端手柄控件已彻底移除，由全屏滑动手势接管 -->

      <!-- 极客双通道诊断控制区 (防挤压，防冲突) -->
      <div class="diagnostic-trigger-bar">
        <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
          <span class="yuemu-sys-icon"><i class="fas fa-trophy" style="color: #ffd700;"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.tetrisPage.leaderboardBracket') }}</span>
        </button>
        <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
          <span class="yuemu-sys-icon"><i class="fas fa-history" style="color: #00ffcc;"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.tetrisPage.historyLogBracket') }}</span>
        </button>
      </div>

    </div>

    <!-- 悬浮复古数据监控诊断终端 (街机荧光显示器遮罩弹窗) -->
    <div v-if="isTerminalOpen" class="retro-modal-overlay" @click.self="closeTerminal">
      <div class="terminal-chassis">
        <!-- 悬浮控制台防抖螺丝 -->
        <div class="screw top-left"></div>
        <div class="screw top-right"></div>
        <div class="screw bottom-left"></div>
        <div class="screw bottom-right"></div>

        <div class="brand-plate">
          <span class="model-name text-red">MONITOR S-89</span>
          <span class="terminal-title">{{ t('pages.games.tetrisPage.diagnosticTerminal') }}</span>
        </div>

        <div class="tab-buttons">
          <button class="tab-btn" :class="{ active: activeTab === 'ranking' }" @click="switchTab('ranking')">
            {{ t('pages.games.tetrisPage.playerRankingBracket') }}
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'history' }" @click="switchTab('history')">
            {{ t('pages.games.tetrisPage.personalHistoryBracket') }}
          </button>
        </div>

        <div class="terminal-screen">
          <div class="scanlines"></div>
          <div class="crt-flicker"></div>
          <div class="screen-vignette"></div>

          <!-- 排行榜面板 -->
          <div v-if="activeTab === 'ranking'" class="terminal-panel">
            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.tetrisPage.ranking') }}</span>
              <span>{{ t('pages.games.tetrisPage.player') }}</span>
              <span>{{ t('pages.games.tetrisPage.highestScoreLabel') }}</span>
              <span>{{ t('pages.games.tetrisPage.achievedTime') }}</span>
            </div>

            <div v-if="rankingLoading" class="panel-content scrollable">
              <div class="data-row blink text-center" style="display: block;">{{ t('pages.games.tetrisPage.loadingDiagnosticData') }}</div>
            </div>
            <div v-else-if="rankings.length === 0" class="panel-content scrollable">
              <div class="data-row text-center" style="display: block;">{{ t('pages.games.tetrisPage.noPlayerRecord') }}</div>
            </div>
            <div v-else class="panel-content scrollable">
              <div
                v-for="(item, idx) in rankings"
                :key="idx"
                class="data-row ranking-layout-row"
                :class="{ 'my-row': item.userId === currentUserId }"
              >
                <span class="rank-num">#{{ (rankPage - 1) * 8 + idx + 1 }}</span>
                <span class="user-name clickable" @click="handleUserClick(item)">
                  {{ item.userName || t('pages.games.tetrisPage.unknownVisitor') }}
                </span>
                <span class="score-val highlight">{{ t('pages.games.tetrisPage.scorePoints', { score: item.score }) }}</span>
                <span class="time-stamp">{{ formatDate(item.createTime) }}</span>
              </div>
            </div>

            <!-- 分页器 -->
            <div class="pagination">
              <button class="pag-btn" :disabled="rankPage === 1" @click="changeRankPage(-1)">&lt;</button>
              <span class="pag-text">{{ rankPage }} / {{ totalRankPages }}</span>
              <button class="pag-btn" :disabled="rankPage === totalRankPages" @click="changeRankPage(1)">&gt;</button>
            </div>
          </div>

          <!-- 历史日志面板 -->
          <div v-else class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.tetrisPage.reportDate') }}</span>
              <span>{{ t('pages.games.tetrisPage.level') }}</span>
              <span>{{ t('pages.games.tetrisPage.gameRecord') }}</span>
              <span>{{ t('pages.games.tetrisPage.diagnosticResult') }}</span>
            </div>

            <div v-if="historyLoading" class="panel-content scrollable">
              <div class="data-row blink text-center" style="display: block;">{{ t('pages.games.tetrisPage.loadingDiagnosticData') }}</div>
            </div>
            <div v-else-if="historyRecords.length === 0" class="panel-content scrollable">
              <div class="data-row text-center" style="display: block;">{{ t('pages.games.tetrisPage.noCloudHistory') }}</div>
            </div>
            <div v-else class="panel-content scrollable">
              <div v-for="(item, idx) in historyRecords" :key="idx" class="data-row history-layout-row">
                <span class="time-stamp">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.tetrisPage.unknown') }}</span>
                <span class="score-val highlight">{{ t('pages.games.tetrisPage.scorePoints', { score: item.score }) }}</span>
                <span class="status-ok text-green">PASS</span>
              </div>
            </div>

            <!-- 分页器 -->
            <div class="pagination">
              <button class="pag-btn" :disabled="historyPage === 1" @click="changeHistoryPage(-1)">&lt;</button>
              <span class="pag-text">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button class="pag-btn" :disabled="historyPage === totalHistoryPages" @click="changeHistoryPage(1)">&gt;</button>
            </div>
          </div>

        </div>

        <button class="close-btn" @click="closeTerminal">{{ t('pages.games.tetrisPage.closeDiagnosticSystem') }}</button>
      </div>
    </div>


    <!-- 玩法说明弹窗 -->
    <div v-if="showHelp" class="retro-modal-overlay" @click.self="showHelp = false" style="z-index: 9999;">
      <div class="terminal-chassis" style="min-height: auto; max-width: 320px; padding: 20px;">
        <div class="brand-plate" style="margin-bottom: 20px;">
          <span class="model-name text-red">MANUAL S-89</span>
          <span class="terminal-title">{{ t('pages.games.tetrisPage.helpModalTitle') }}</span>
        </div>
        <div class="terminal-screen" style="padding: 15px; color: #00FF41; font-size: 14px; line-height: 1.8;">
          <div class="scanlines"></div><div class="crt-flicker"></div>
          <p style="margin-top: 0; font-weight: bold; border-bottom: 1px dashed #00FF41; padding-bottom: 10px;">{{ isMobile ? t('pages.games.tetrisPage.mobileControls') : t('pages.games.tetrisPage.pcControls') }}</p>
          <ul style="padding-left: 20px; margin-bottom: 0;" v-if="isMobile">
            <li><b>{{ t('pages.games.tetrisPage.swipeLeftRight') }}</b>: {{ t('pages.games.tetrisPage.swipeMoveBlock') }}</li>
            <li><b>{{ t('pages.games.tetrisPage.swipeDown') }}</b>: {{ t('pages.games.tetrisPage.swipeFastDrop') }}</li>
            <li><b>{{ t('pages.games.tetrisPage.tapScreen') }}</b>: {{ t('pages.games.tetrisPage.tapRotateBlock') }}</li>
            <li><b>{{ t('pages.games.tetrisPage.longSwipeDown') }}</b>: {{ t('pages.games.tetrisPage.hardDropBlock') }}</li>
          </ul>
          <ul style="padding-left: 20px; margin-bottom: 0;" v-else>
            <li><b>{{ t('pages.games.tetrisPage.arrowMove') }}</b></li>
            <li><b>{{ t('pages.games.tetrisPage.arrowRotate') }}</b></li>
            <li><b>{{ t('pages.games.tetrisPage.arrowSoftDrop') }}</b></li>
            <li><b>{{ t('pages.games.tetrisPage.spaceHardDrop') }}</b></li>
          </ul>
        </div>
        <button class="close-btn" style="margin-top: 20px; font-size: 12px; padding: 10px;" @click="showHelp = false">{{ t('pages.games.tetrisPage.understoodCloseBtn') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// --- 悬浮复古数据监控诊断终端 (街机显示器弹窗) ---
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

const openTerminal = (tab: 'ranking' | 'history') => {
  if (isPlaying.value && !isPaused.value) {
    isPaused.value = true
    clearInterval(dropInterval!)
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
}

// 获取排行榜列表
const fetchRankings = async () => {
  rankingLoading.value = true
  try {
    const res = await getRankingListUsingPost({
      gameType: 'tetris',
      current: rankPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.tetrisPage.getRankingsError'), err)
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

// 获取历史记录
const fetchHistory = async () => {
  if (!currentUserId.value) return
  historyLoading.value = true
  try {
    const res = await getMyHistoryRecordsUsingPost({
      gameType: 'tetris',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.tetrisPage.getHistoryArchiveError'), err)
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
  router.push(`/user/${item.userId}`)
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.tetrisPage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

const BOARD_ROWS = 20
const BOARD_COLS = 10
const BASE_SPEED = 800

const TETROMINOS = {
  1: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], type: 1, offsetX: 0, offsetY: -0.5 },
  2: { shape: [[1,1],[1,1]],                             type: 2, offsetX: 1, offsetY: 1 },
  3: { shape: [[0,1,0],[1,1,1],[0,0,0]],                 type: 3, offsetX: 0.5, offsetY: 0.5 },
  4: { shape: [[0,0,1],[1,1,1],[0,0,0]],                 type: 4, offsetX: 0.5, offsetY: 0.5 },
  5: { shape: [[1,0,0],[1,1,1],[0,0,0]],                 type: 5, offsetX: 0.5, offsetY: 0.5 },
  6: { shape: [[0,1,1],[1,1,0],[0,0,0]],                 type: 6, offsetX: 0.5, offsetY: 0.5 },
  7: { shape: [[1,1,0],[0,1,1],[0,0,0]],                 type: 7, offsetX: 0.5, offsetY: 0.5 }
}

const isMobile = ref(false)
const cellSize = ref(24)
const isPlaying = ref(false)
const isPaused = ref(false)
const isGameOver = ref(false)
const isSoundEnabled = ref(true)
const showHelp = ref(false)

const stageWidth = computed(() => `${cellSize.value * BOARD_COLS}px`)
const stageHeight = computed(() => `${cellSize.value * BOARD_ROWS}px`)

const score = ref(0)
const highScore = ref(0)
const level = ref(1)
const lines = ref(0)

// --- 音效系统 ---
const sounds = {
  move: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href),
  rotate: new Audio(new URL('@/assets/sounds/rotate.MP3', import.meta.url).href),
  drop: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  lock: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  lineClear: new Audio(new URL('@/assets/sounds/clear.MP3', import.meta.url).href),
  tetris: new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href),
  levelUp: new Audio(new URL('@/assets/sounds/powerup.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  pause: new Audio(new URL('@/assets/sounds/move.MP3', import.meta.url).href),
  gameover: new Audio(new URL('@/assets/sounds/gameover.MP3', import.meta.url).href),
  click: new Audio(new URL('@/assets/sounds/coin.MP3', import.meta.url).href)
}

// 设置音量
sounds.move.volume = 0.2
sounds.rotate.volume = 0.3
sounds.drop.volume = 0.4
sounds.lock.volume = 0.4
sounds.lineClear.volume = 0.5
sounds.tetris.volume = 0.6
sounds.levelUp.volume = 0.5
sounds.start.volume = 0.5
sounds.pause.volume = 0.3
sounds.gameover.volume = 0.6
sounds.click.volume = 0.2

const playSound = (type: keyof typeof sounds) => {
  if (!isSoundEnabled.value) return
  const audio = sounds[type]
  audio.currentTime = 0
  audio.play().catch(() => {})
}

const toggleSound = () => {
  isSoundEnabled.value = !isSoundEnabled.value
  if (isSoundEnabled.value) {
    playSound('click')
  }
}

const board = ref<number[][]>(createEmptyBoard())
let bag: number[] = []

const currentPiece = ref({ shape: [] as number[][], type: 0, x: 0, y: 0 })
const nextPiece = ref<any>(null)
let dropInterval: number | null = null

function createEmptyBoard() {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0))
}

function getNextTetromino() {
  if (bag.length === 0) {
    bag = [1, 2, 3, 4, 5, 6, 7]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]]
    }
  }
  return TETROMINOS[bag.pop() as keyof typeof TETROMINOS]
}

function spawnPiece() {
  if (!nextPiece.value) nextPiece.value = getNextTetromino()
  const template = nextPiece.value
  nextPiece.value = getNextTetromino()

  currentPiece.value = {
    shape: JSON.parse(JSON.stringify(template.shape)),
    type: template.type,
    x: Math.floor((BOARD_COLS - template.shape[0].length) / 2),
    y: 0
  }

  if (checkCollision(0, 0, currentPiece.value.shape)) handleGameOver()
}

function checkCollision(offsetX: number, offsetY: number, shape = currentPiece.value.shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const newX = currentPiece.value.x + x + offsetX
        const newY = currentPiece.value.y + y + offsetY
        if (newX < 0 || newX >= BOARD_COLS || newY >= BOARD_ROWS || (newY >= 0 && board.value[newY][newX] !== 0)) {
          return true
        }
      }
    }
  }
  return false
}

const ghostY = computed(() => {
  if (!isPlaying.value || !currentPiece.value.shape.length) return 0
  let dropY = 0
  while (!checkCollision(0, dropY + 1)) dropY++
  return currentPiece.value.y + dropY
})

function rotate() {
  if (!isPlaying.value || isPaused.value || isGameOver.value) return
  const shape = currentPiece.value.shape
  const N = shape.length
  const rotated = shape.map((row, i) => row.map((val, j) => shape[N - 1 - j][i]))

  if (!checkCollision(0, 0, rotated)) {
    currentPiece.value.shape = rotated
    playSound('rotate')
  }
  else if (!checkCollision(-1, 0, rotated)) {
    currentPiece.value.shape = rotated
    currentPiece.value.x--
    playSound('rotate')
  }
  else if (!checkCollision(1, 0, rotated)) {
    currentPiece.value.shape = rotated
    currentPiece.value.x++
    playSound('rotate')
  }
}

function move(dir: number) {
  if (!isPlaying.value || isPaused.value || isGameOver.value) return
  if (!checkCollision(dir, 0)) {
    currentPiece.value.x += dir
    playSound('move')
  }
}

function moveDown() {
  if (!isPlaying.value || isPaused.value || isGameOver.value) return
  if (!checkCollision(0, 1)) {
    currentPiece.value.y++
    // 下降过程不播放音效
  }
  else lockPiece()
}

function hardDrop() {
  if (!isPlaying.value || isPaused.value || isGameOver.value) return
  let dropY = 0
  while (!checkCollision(0, dropY + 1)) dropY++
  currentPiece.value.y += dropY
  // 硬降也不播放音效
  lockPiece()
}

function lockPiece() {
  const { shape, x, y, type } = currentPiece.value
  shape.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val !== 0 && y + r >= 0) board.value[y + r][x + c] = type
    })
  })
  playSound('lock')
  clearLines()
  spawnPiece()
}

function clearLines() {
  let linesCleared = 0
  const prevLevel = level.value

  for (let y = BOARD_ROWS - 1; y >= 0; y--) {
    if (board.value[y].every(cell => cell !== 0)) {
      board.value.splice(y, 1)
      board.value.unshift(Array(BOARD_COLS).fill(0))
      linesCleared++
      y++
    }
  }

  if (linesCleared > 0) {
    lines.value += linesCleared
    const basePoints = [0, 100, 300, 500, 800]
    score.value += basePoints[linesCleared] * level.value
    level.value = Math.floor(lines.value / 10) + 1

    // 播放消除音效
    const clearSounds: (keyof typeof sounds)[] = ['clear1', 'clear2', 'clear3', 'clear4']
    playSound(clearSounds[linesCleared - 1])

    // 升级音效
    if (level.value > prevLevel) {
      setTimeout(() => playSound('levelUp'), 300)
    }

    if (score.value > highScore.value) {
      highScore.value = score.value
      localStorage.setItem('tetris-retro-best', String(highScore.value))
    }
    resetInterval()
  }
}

function gameLoop() { moveDown() }

function resetInterval() {
  if (dropInterval) clearInterval(dropInterval)
  const currentSpeed = Math.max(100, BASE_SPEED - (level.value - 1) * 60)
  dropInterval = window.setInterval(gameLoop, currentSpeed)
}

function toggleGame() {
  if (isGameOver.value) {
    board.value = createEmptyBoard()
    score.value = 0; lines.value = 0; level.value = 1; bag = []
    isGameOver.value = false; isPlaying.value = true; isPaused.value = false
    spawnPiece()
    resetInterval()
    playSound('start')
  } else if (isPlaying.value) {
    isPaused.value = !isPaused.value
    if (isPaused.value) {
      clearInterval(dropInterval!)
      playSound('pause')
    }
    else {
      resetInterval()
      playSound('start')
    }
  } else {
    isPlaying.value = true
    spawnPiece()
    resetInterval()
    playSound('start')
  }
}

const saveScore = async (finalScore: number) => {
  if (finalScore <= 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.tetrisPage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'tetris',
      level: `t('pages.games.tetrisPage.gradeValueText', { level: level })`,
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.tetrisPage.reportFinalScoreError'), err)
  }
}

function handleGameOver() {
  isGameOver.value = true
  isPlaying.value = false
  clearInterval(dropInterval!)
  playSound('gameover')
  saveScore(score.value)
}

function handleKeydown(e: KeyboardEvent) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault()
  }
  if (e.key === 'Escape' || e.key === 'p') { toggleGame(); return }
  if (!isPlaying.value || isPaused.value || isGameOver.value) return

  switch (e.key) {
    case 'ArrowLeft': move(-1); break
    case 'ArrowRight': move(1); break
    case 'ArrowDown': moveDown(); break
    case 'ArrowUp': rotate(); break
    case ' ': hardDrop(); break
  }
}

let touchStartX = 0
let touchStartY = 0
let lastTouchX = 0
let lastTouchY = 0
let touchStartTime = 0

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  lastTouchX = touchStartX
  lastTouchY = touchStartY
  touchStartTime = Date.now()
}

function handleTouchMove(e: TouchEvent) {
  if (!isPlaying.value || isPaused.value || isGameOver.value) return
  
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  
  const dx = currentX - lastTouchX
  const dy = currentY - lastTouchY
  
  // 左右拖拽移动阈值（每滑出 25px 移动一格）
  if (Math.abs(dx) > 25) {
    if (dx > 0) move(1)
    else move(-1)
    lastTouchX = currentX
    lastTouchY = currentY // 同步 Y，防止斜向误触累加
  }
  
  // 向下拖拽加速（每滑下 20px 加速下降一格）
  if (dy > 20) {
    moveDown()
    lastTouchY = currentY
    lastTouchX = currentX
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (!isPlaying.value || isPaused.value || isGameOver.value) return
  const totalDx = e.changedTouches[0].clientX - touchStartX
  const totalDy = e.changedTouches[0].clientY - touchStartY
  const timeElapsed = Date.now() - touchStartTime
  
  // 如果短时间内、长距离下拉（没发生太大的横向偏移），则判定为硬降 (Hard Drop)
  if (totalDy > 80 && Math.abs(totalDx) < 60 && timeElapsed < 350) {
    hardDrop()
  }
}

function handleStageClick() {
  if (!isPlaying.value || isPaused.value || isGameOver.value) {
    toggleGame()
  } else {
    rotate()
  }
}

function checkResize() {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    // 增加至 340px 预留空间，以完美容纳底座极客诊断面板，防止手柄与面板挤压重叠
    const availableHeight = window.innerHeight - 150
    const availableWidth = window.innerWidth - 40
    const cellH = Math.floor(availableHeight / BOARD_ROWS)
    const cellW = Math.floor(availableWidth / BOARD_COLS)
    cellSize.value = Math.min(cellH, cellW)
  } else {
    // PC 端固定大尺寸
    cellSize.value = 24
  }
}

onMounted(() => {
  board.value = createEmptyBoard()
  checkResize()
  window.addEventListener('resize', checkResize)
  window.addEventListener('keydown', handleKeydown)

  const savedHi = localStorage.getItem('tetris-retro-best')
  if (savedHi) highScore.value = parseInt(savedHi)

  // 预载排行榜与历史记录诊断信息
  fetchRankings()
  fetchHistory()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkResize)
  window.removeEventListener('keydown', handleKeydown)
  if (dropInterval) clearInterval(dropInterval)
})
</script>

<style scoped>
@font-face {
  font-family: 'PressStart2P';
  src: local('Courier New');
}

* {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.yuemu-tetris-retro-universe {
  /* PC 端基础设置，保证居中 */
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--background);
  font-family: 'PressStart2P', Consolas, "Courier New", monospace;
  padding: 40px 20px;
  box-sizing: border-box;
}

.retro-console {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow:
    6px 6px 0px var(--shadow-color),
    inset 2px 2px 0px rgba(255,255,255,0.1),
    inset -2px -2px 0px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.console-body {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: stretch;
}

.screen-bezel {
  background: var(--background);
  padding: 10px;
  border-radius: 8px;
  border: 4px inset var(--border-color);
  box-shadow: inset 0 0 15px rgba(0,0,0,0.3);
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.game-stage {
  position: relative;
  background-color: var(--hover-background);
  border: 2px solid var(--text-secondary);
  overflow: hidden;
}

.grid-layer, .matrix-layer, .active-layer, .ghost-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
}

.grid-layer {
  display: grid;
  grid-template-rows: repeat(20, 1fr);
  width: 100%; height: 100%;
}
.grid-row {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
}
.grid-cell {
  border: 1px dotted rgba(128, 128, 128, 0.15);
  box-sizing: border-box;
}

.retro-block {
  position: absolute;
  width: 10%;
  height: 5%;
  box-sizing: border-box;
  border: 3px solid;
  border-top-color: rgba(255, 255, 255, 0.6);
  border-left-color: rgba(255, 255, 255, 0.6);
  border-bottom-color: rgba(0, 0, 0, 0.4);
  border-right-color: rgba(0, 0, 0, 0.4);
  will-change: transform;
}

.ghost-block {
  border: 2px dashed var(--text-secondary);
  background: transparent !important;
  opacity: 0.4;
}

.color-1 { background-color: #00E5FF; }
.color-2 { background-color: #FFEA00; }
.color-3 { background-color: #AA00FF; }
.color-4 { background-color: #FF6D00; }
.color-5 { background-color: #2962FF; }
.color-6 { background-color: #00E676; }
.color-7 { background-color: #FF1744; }

.screen-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 10;
}
.overlay-text {
  color: #FFEA00; font-size: 16px; font-weight: bold;
  text-shadow: 2px 2px 0px #000; letter-spacing: 1px;
}
.blink { animation: blinker 1s step-end infinite; }
@keyframes blinker { 50% { opacity: 0; } }

/* PC 面板 */
.side-panel { display: flex; flex-direction: column; gap: 20px; width: 120px; }
.lcd-box {
  background: var(--console-body); border: 2px solid var(--border-color);
  padding: 10px; text-align: center; border-radius: 4px;
}
.lcd-label { color: var(--text-secondary); font-size: 10px; margin-bottom: 8px; font-weight: bold; display: block; }
.lcd-value { color: var(--text-primary); font-size: 14px; font-weight: bold; }

.next-box .pc-next-stage { position: relative; width: 80px; height: 80px; margin: 0 auto; }
.pc-next-stage .retro-block { width: 20px; height: 20px; }
.controls-hint { color: var(--text-secondary); font-size: 10px; line-height: 2; margin-top: auto; }

.retro-btn {
  background: var(--link-color); color: white; border: none; padding: 12px 0;
  font-family: inherit; font-weight: bold; cursor: pointer; border-radius: 4px;
  box-shadow: 0 4px 0px var(--link-hover-color);
}
.retro-btn:active { transform: translateY(4px); box-shadow: none; }

.sound-btn-pc {
  background: var(--card-background);
  border: 2px solid var(--border-color);
  color: var(--text-primary);
  font-size: 1.2rem;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 2px 2px 0px var(--shadow-color);
  transition: all 0.1s;
  margin-top: auto;
}

.sound-btn-pc:active {
  transform: translate(2px, 2px);
  box-shadow: 0px 0px 0px var(--shadow-color);
}

.sound-btn-mobile {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: var(--text-primary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}


/* ====================================================
   移动端专属样式覆盖 (严格限定于屏幕小于 768px 时)
   ==================================================== */
@media screen and (max-width: 768px) {
  .terminal-chassis { max-width: 95vw !important; height: 85vh; padding: 15px; }
  .panel-header { font-size: 12px !important; }
  .data-row { font-size: 12px !important; }
  .tab-btn { font-size: 12px !important; }
  .close-btn { font-size: 14px !important; }
  .ranking-layout-header, .ranking-layout-row { grid-template-columns: 0.8fr 2fr 1fr 1fr; }

  .yuemu-tetris-retro-universe {
    height: 100vh;
    height: 100dvh;
    padding: 0;
    overflow: hidden;
  }

  .retro-console {
    width: 100vw;
    height: 100%;
    border: none;
    border-radius: 0;
    padding: 10px 10px max(20px, env(safe-area-inset-bottom)) 10px;
    gap: 12px;
    box-shadow: none;
    justify-content: space-between;
  }

  .mobile-top-bar {
    display: flex; justify-content: space-between;
    background: var(--console-body); border: 2px solid var(--border-color);
    border-radius: 6px; padding: 8px 12px; height: 50px; flex-shrink: 0;
  }
  .m-stat-box { display: flex; flex-direction: column; justify-content: center; }
  .m-label { font-size: 10px; color: var(--text-secondary); margin-bottom: 4px; }
  .m-val { font-size: 16px; color: var(--text-primary); font-weight: bold; }

  .mini-next { width: 40px; position: relative; }
  .mini-stage { position: absolute; top: -5px; right: 0; width: 40px; height: 40px; }
  .mini-stage .retro-block { width: 10px; height: 10px; border-width: 1px; }

  .console-body {
    flex: 1;
    min-height: 0;
    align-items: center;
    justify-content: center;
  }

  .screen-bezel { padding: 6px; }
  

  /* 移动端手柄区域 */
  .mobile-gamepad {
    flex-shrink: 0;
    height: 160px;
    display: flex; flex-direction: column; gap: 10px;
  }

  .sys-btn-row { display: flex; justify-content: center; }
  .sys-btn { background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .pill { width: 40px; height: 12px; background: var(--text-secondary); border-radius: 10px; box-shadow: 0 2px 0 rgba(0,0,0,0.3); }
  .sys-btn:active .pill { transform: translateY(2px); box-shadow: none; }
  .sys-btn span { font-size: 10px; color: var(--text-secondary); font-weight: bold; }

  .main-controls-row { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; }

  /* 十字方向键 (D-Pad) */
  .d-pad { display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.05); border-radius: 50%; padding: 10px; }
  .d-row { display: flex; }
  .d-btn {
    width: 42px; height: 42px;
    background: var(--text-primary); border: none;
    box-shadow: inset 0 0 10px rgba(255,255,255,0.2);
    display: flex; justify-content: center; align-items: center;
  }
  .d-icon { color: var(--background); font-size: 14px; opacity: 0.8; }

  .d-center { width: 42px; height: 42px; background: var(--text-primary); }
  .d-btn.up { border-radius: 8px 8px 0 0; }
  .d-btn.down { border-radius: 0 0 8px 8px; }
  .d-btn.left { border-radius: 8px 0 0 8px; }
  .d-btn.right { border-radius: 0 8px 8px 0; }
  .d-btn:active { background: var(--text-secondary); }

  /* 动作键 (A/B) */
  .action-pad { display: flex; gap: 15px; transform: rotate(-15deg); }
  .action-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .a-btn {
    width: 52px; height: 52px; border-radius: 50%; border: none;
    display: flex; justify-content: center; align-items: center;
  }
  .primary-btn { background: var(--link-color); box-shadow: 0 4px 0 var(--link-hover-color); }
  .secondary-btn { background: var(--text-secondary); box-shadow: 0 4px 0 rgba(0,0,0,0.4); }
  .a-icon { color: white; font-size: 18px; font-weight: bold; font-family: Arial, sans-serif; }

  .a-btn:active { transform: translateY(4px); box-shadow: none; }
  .btn-label { font-size: 10px; color: var(--text-secondary); font-weight: bold; }
}

@media screen and (max-width: 360px) {
  .d-btn, .d-center { width: 36px; height: 36px; }
  .a-btn { width: 46px; height: 46px; }
  .mobile-gamepad { height: 140px; }
}

/* ================= 极客辅助监控诊断控制面板 ================= */
.diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
  margin-top: 15px;
  padding: 0 10px;
}

/* 移动端专属自适应极度紧凑排版，防冲突 */
@media screen and (max-width: 768px) {
  .diagnostic-trigger-bar {
    margin-top: 4px !important;
    gap: 8px !important;
    padding: 0 4px !important;
  }
  .yuemu-mini-diag-btn {
    padding: 6px 4px !important;
    border-radius: 6px !important;
  }
  .yuemu-mini-diag-btn .yuemu-sys-text {
    font-size: 7px !important;
  }
}

.yuemu-mini-diag-btn {
  flex: 1;
  background: var(--btn-secondary, #222);
  border: 2px solid var(--console-border, #444);
  border-radius: 8px;
  padding: 10px 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--console-border, #444);
  transition: all 0.1s;
}

.yuemu-mini-diag-btn:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--console-border, #444);
}

.yuemu-mini-diag-btn .yuemu-sys-icon {
  font-size: 14px;
}

.yuemu-mini-diag-btn .yuemu-sys-text {
  font-size: 8px;
  color: #ffffff;
  font-family: inherit;
  font-weight: bold;
  letter-spacing: 1px;
}

/* ================= 悬浮复古数据监控诊断终端 ================= */
.retro-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(2, 6, 3, 0.85);
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
  background: var(--console-body, #e0e0e0);
  border: 4px solid var(--console-border, #b0b0b0);
  border-radius: 16px;
  padding: 25px 20px;
  box-shadow: 0 10px 30px rgba(0, 255, 65, 0.15);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 520px;
  font-family: monospace;
  animation: modal-scale 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modal-scale {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.screw {
  position: absolute; width: 12px; height: 12px;
  background: var(--console-border, #b0b0b0); border: 2px solid var(--console-border, #b0b0b0); border-radius: 50%;
}
.screw::after {
  content: ''; position: absolute; top: 50%; left: 2px; right: 2px; height: 2px;
  background: var(--console-border, #b0b0b0); transform: translateY(-50%) rotate(45deg);
}
.top-left { top: 12px; left: 12px; }
.top-right { top: 12px; right: 12px; }
.bottom-left { bottom: 12px; left: 12px; }
.bottom-right { bottom: 12px; right: 12px; }

.brand-plate {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 2px solid var(--console-border, #b0b0b0); padding-bottom: 8px;
}
.model-name {
  font-family: inherit; font-weight: 900; font-size: 10px; letter-spacing: 1px;
}
.terminal-title {
  color: var(--pixel-color, #0f380f);
  font-size: 10px;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.4);
}

.tab-buttons {
  display: flex;
  gap: 10px;
}

.tab-btn {
  background: none;
  border: none;
  color: var(--text-main, #333);
  font-family: inherit;
  font-weight: bold;
  font-size: 8px;
  cursor: pointer;
  padding: 6px 8px;
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
  color: var(--pixel-color, #0f380f);
}

.terminal-screen {
  position: relative;
  flex: 1;
  background-color: #020603;
  border: 4px solid var(--console-border, #b0b0b0);
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

.terminal-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
  z-index: 30;
}

.panel-header {
  font-family: inherit;
  font-size: 8px;
  font-weight: bold;
  color: #00FF41;
  border-bottom: 2px solid rgba(0, 255, 65, 0.3);
  padding-bottom: 8px;
  margin-bottom: 10px;
  text-shadow: 0 0 4px rgba(0, 255, 65, 0.4);
  display: grid;
}

.ranking-layout-header,
.ranking-layout-row {
  grid-template-columns: 0.6fr 1.6fr 1.2fr 1.6fr;
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
  max-height: 220px;
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
  font-size: 8px;
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

.user-name.clickable {
  cursor: pointer;
  text-decoration: underline;
}
.user-name.clickable:hover {
  color: #ffffff;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}

.score-val.highlight {
  color: #00ffcc;
  text-shadow: 0 0 5px #00ffcc;
}

.time-stamp {
  opacity: 0.7;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  border-top: 2px solid rgba(0, 255, 65, 0.2);
  padding-top: 10px;
}

.pag-btn {
  background: none;
  border: 1px solid rgba(0, 255, 65, 0.4);
  color: #00FF41;
  font-family: inherit;
  font-size: 8px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
}

.pag-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pag-text {
  font-size: 8px;
  color: #00FF41;
}

.close-btn {
  background: var(--btn-primary, #a11);
  border: none;
  color: white;
  font-family: inherit;
  font-size: 8px;
  font-weight: bold;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 0 rgba(0,0,0,0.4);
  transition: all 0.1s;
  text-align: center;
}

.close-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 rgba(0,0,0,0.4);
}

.text-center {
  text-align: center;
}
</style>
