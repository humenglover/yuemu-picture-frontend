<template>
  <div class="yuemu-retro-arcade-universe" @touchmove.prevent>
    <div class="arcade-console">

      <div class="console-header">
        <div class="brand">
          <span class="brand-name">NEON RIDER</span>
          <span class="brand-model">PHYSICS-V1</span>
        </div>
        <div class="speaker-grill">
          <div class="dot" v-for="i in 12" :key="i"></div>
        </div>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.drawLinePage.level') }}</span>
              <span class="hud-val text-cyan">Lv.{{ currentLevel + 1 }}</span>
            </div>
            <div class="hud-item ink-container">
              <span class="hud-label">{{ t('pages.games.drawLinePage.remainingInk') }}</span>
              <div class="ink-bar-bg">
                <div class="ink-bar-fill" :style="{ width: inkPercentage + '%', backgroundColor: inkColor }"></div>
              </div>
            </div>
            <div class="hud-item right">
              <span class="hud-label">{{ t('pages.games.drawLinePage.totalStars') }}</span>
              <span class="hud-val text-yellow">★ × {{ stars }}</span>
            </div>
          </div>

          <div class="canvas-container crt-effect">
            <canvas
              ref="gameCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="game-canvas"
              :class="{ 'blur-effect': gameStatus !== 'playing' && gameStatus !== 'drawing' }"
              @mousedown="startDrawing"
              @mousemove="draw"
              @mouseup="stopDrawing"
              @mouseleave="stopDrawing"
              @touchstart.prevent="startDrawing"
              @touchmove.prevent="draw"
              @touchend.prevent="stopDrawing"
            ></canvas>

            <div v-if="gameStatus === 'ready'" class="screen-overlay menu-overlay">
              <h1 class="pixel-title neon-text">NEON RIDER</h1>
              <div class="level-selector">
                <p class="desc">{{ t('pages.games.drawLinePage.drawLineGuide') }}</p>
                <div class="level-grid">
                  <button
                    v-for="(lvl, index) in levels"
                    :key="index"
                    class="level-btn"
                    :class="{ 'locked': index > unlockedLevel, 'current': index === currentLevel }"
                    @click="selectLevel(index)"
                  >
                    {{ index + 1 }}
                  </button>
                </div>
              </div>
              <p class="blink mt-4 clickable-hint" @click="enterLevel">{{ t('pages.games.drawLinePage.clickStartLevel') }}</p>
            </div>

            <div v-if="gameStatus === 'win'" class="screen-overlay result-overlay">
              <h1 class="pixel-title text-success neon-text-green" v-if="currentLevel < levels.length - 1">{{ t('pages.games.drawLinePage.clearSuccessExclamation') }}</h1>
              <h1 class="pixel-title text-success neon-text-green" v-else>{{ t('pages.games.drawLinePage.allClear') }}</h1>
              <div class="stars-display">
                <span v-for="i in 3" :key="i" class="star" :class="{ 'earned': i <= levelStars }">★</span>
              </div>
              <div class="results">
                <p>{{ t('pages.games.drawLinePage.timeSpentS', { time: (playTime / 1000).toFixed(1) }) }}</p>
                <p>{{ t('pages.games.drawLinePage.inkLeft', { ink: Math.floor(inkPercentage) }) }}</p>
              </div>
              <p class="blink mt-4 clickable-hint" @click="nextLevel">
                {{ currentLevel < levels.length - 1 ? t('pages.games.drawLinePage.clickContinue') : t('pages.games.drawLinePage.returnToMenu') }}
              </p>
            </div>

            <div v-if="gameStatus === 'lose'" class="screen-overlay result-overlay">
              <h1 class="pixel-title text-danger neon-text-red">{{ t('pages.games.drawLinePage.challengeFailed') }}</h1>
              <p class="desc mt-4">{{ failReason }}</p>
              <p class="blink mt-4 clickable-hint" @click="retryLevel">{{ t('pages.games.drawLinePage.clickRetry') }}</p>
            </div>

            <div v-if="gameStatus === 'paused'" class="screen-overlay pause-overlay">
              <h1 class="pixel-title blink">{{ t('pages.games.drawLinePage.pause') }}</h1>
            </div>
          </div>
        </div>
      </div>

      <!-- 辅助监控诊断按钮区（界面纯中文设计，不挤压原操作键，极其适配移动端） -->
      <div class="diagnostic-trigger-bar">
        <button class="sys-btn mini-diag-btn" @click="openTerminal('ranking')">
          <span class="sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="sys-text">{{ t('pages.games.drawLinePage.leaderboardBracket') }}</span>
        </button>
        <button class="sys-btn mini-diag-btn" @click="openTerminal('history')">
          <span class="sys-icon"><i class="fas fa-history"></i></span>
          <span class="sys-text">{{ t('pages.games.drawLinePage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">

        <div class="d-pad-section deco-section">
          <div class="vent-grill">
            <div class="vent-line" v-for="i in 5" :key="i"></div>
          </div>
          <div class="coin-text">INSERT COIN</div>
        </div>

        <div class="system-section">
          <div class="sys-btn-group">
            <button class="sys-btn sound-btn" @click="toggleSound" :class="{ 'active': isSoundEnabled }">
              <div class="pill">
                <span class="pill-icon"><i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i></span>
              </div>
              <span class="sys-label">{{ t('pages.games.drawLinePage.sound') }}</span>
            </button>
            <button class="sys-btn start-btn" @click="returnToMenu">
              <div class="pill">
                <MenuOutlined class="pill-icon" />
              </div>
              <span class="sys-label">{{ t('pages.games.drawLinePage.menu') }}</span>
            </button>
          </div>
        </div>

        <div class="action-section">
          <div class="action-buttons">
            <div class="btn-wrapper">
              <button
                class="a-btn b-btn"
                :disabled="gameStatus !== 'drawing'"
                @mousedown="clearLines"
                @touchstart.prevent="clearLines"
              >B</button>
              <span class="btn-label">{{ t('pages.games.drawLinePage.clear') }}</span>
            </div>
            <div class="btn-wrapper">
              <button
                class="a-btn a-btn-main"
                :disabled="gameStatus !== 'drawing'"
                @mousedown="dropBall"
                @touchstart.prevent="dropBall"
              >A</button>
              <span class="btn-label">{{ t('pages.games.drawLinePage.release') }}</span>
            </div>
          </div>
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
          <span class="model-name terminal-title">{{ t('pages.games.drawLinePage.monitorDiagnosticR07') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.drawLinePage.leaderboardBracketRight') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.drawLinePage.historyLogBracketRight') }}
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
              <span class="filter-label">{{ t('pages.games.drawLinePage.levelFilter') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.drawLinePage.allLevels') }}</option>
                <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>
            
            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.drawLinePage.ranking') }}</span>
              <span>{{ t('pages.games.drawLinePage.crackTerminal') }}</span>
              <span>{{ t('pages.games.drawLinePage.maxScore') }}</span>
              <span>{{ t('pages.games.drawLinePage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.drawLinePage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.drawLinePage.noCrackRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.drawLinePage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.drawLinePage.itemScoreStars', { score: item.score }) }}</span>
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
                {{ t('pages.games.drawLinePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.drawLinePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.drawLinePage.saveTime') }}</span>
              <span>{{ t('pages.games.drawLinePage.levelProgress') }}</span>
              <span>{{ t('pages.games.drawLinePage.achievedScore') }}</span>
              <span>{{ t('pages.games.drawLinePage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.drawLinePage.readingLocalArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.drawLinePage.noLocalArchive') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.drawLinePage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.drawLinePage.itemScoreStars', { score: item.score }) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.drawLinePage.clearSuccess') : t('pages.games.drawLinePage.notInitiated') }}
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
                {{ t('pages.games.drawLinePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.drawLinePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.drawLinePage.closeDiagTerminal') }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { MenuOutlined } from '@ant-design/icons-vue'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)

const isTerminalOpen = ref(false)
const activeTab = ref<'ranking' | 'history'>('ranking')

const rankings = ref<any[]>([])
const rankingLoading = ref(false)
const rankPage = ref(1)
const totalRankPages = ref(1)
const selectedRankLevel = ref('')
const levelOptions = [t('pages.games.drawLinePage.level1'), t('pages.games.drawLinePage.level2'), t('pages.games.drawLinePage.level3'), t('pages.games.drawLinePage.level4'), t('pages.games.drawLinePage.level5')]

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
      gameType: 'draw_line',
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
    console.error(t('pages.games.drawLinePage.getRankingsError'), err)
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
      gameType: 'draw_line',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.drawLinePage.getHistoryArchiveError'), err)
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

const saveScore = async (finalScore: number) => {
  if (finalScore < 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.drawLinePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'draw_line',
      level: t('pages.games.drawLinePage.levelPlus1', { level: currentLevel.value + 1 }),
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.drawLinePage.reportStarScoreError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.drawLinePage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

// --- 基础类型定义 ---
interface Point { x: number; y: number }
interface Line { points: Point[]; length: number }
interface Obstacle { x: number; y: number; w: number; h: number; type: 'kill' | 'bounce'; moveSpeed?: number; startX?: number; range?: number }
interface LevelConfig {
  start: Point; target: Point;
  maxInk: number;
  obstacles: Obstacle[];
}

// --- 游戏状态管理 ---
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(400)
const canvasHeight = ref(400)

type GameStatus = 'ready' | 'drawing' | 'playing' | 'win' | 'lose' | 'paused'
const gameStatus = ref<GameStatus>('ready')
const currentLevel = ref(0)
const unlockedLevel = ref(0)
const stars = ref(0)
const levelStars = ref(0)
const playTime = ref(0)
const failReason = ref('')

// --- 音效系统 ---
const isSoundEnabled = ref(true)
const sounds = {
  draw: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  bounce: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  win: new Audio(new URL('@/assets/sounds/match.MP3', import.meta.url).href),
  lose: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  btn: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href)
}

sounds.draw.volume = 0.05
sounds.bounce.volume = 0.3
sounds.win.volume = 0.3
sounds.lose.volume = 0.3
sounds.start.volume = 0.3
sounds.btn.volume = 0.2

const playSound = (audio: HTMLAudioElement) => {
  if (!isSoundEnabled.value) return
  audio.currentTime = 0
  audio.play().catch(() => {})
}
const toggleSound = () => { isSoundEnabled.value = !isSoundEnabled.value; playSound(sounds.btn) }

// --- 关卡数据设计 ---
const levels: LevelConfig[] = [
  { // 1. 简单斜坡教学
    start: { x: 50, y: 50 }, target: { x: 350, y: 350 }, maxInk: 600,
    obstacles: []
  },
  { // 2. 绕过障碍物
    start: { x: 50, y: 50 }, target: { x: 350, y: 320 }, maxInk: 800,
    obstacles: [{ x: 150, y: 200, w: 100, h: 15, type: 'kill' }]
  },
  { // 3. 利用弹跳平台
    start: { x: 50, y: 80 }, target: { x: 350, y: 80 }, maxInk: 700,
    obstacles: [
      { x: 100, y: 280, w: 80, h: 15, type: 'bounce' },
      { x: 250, y: 180, w: 80, h: 15, type: 'bounce' }
    ]
  },
  { // 4. 峡谷跳跃
    start: { x: 50, y: 100 }, target: { x: 350, y: 100 }, maxInk: 900,
    obstacles: [
      { x: 0, y: 200, w: 150, h: 15, type: 'kill' },
      { x: 250, y: 200, w: 150, h: 15, type: 'kill' },
      { x: 170, y: 300, w: 60, h: 15, type: 'bounce' }
    ]
  },
  { // 5. 移动障碍挑战
    start: { x: 50, y: 50 }, target: { x: 350, y: 350 }, maxInk: 1000,
    obstacles: [
      { x: 100, y: 200, w: 60, h: 15, type: 'kill', moveSpeed: 80, startX: 100, range: 120 },
      { x: 200, y: 300, w: 80, h: 15, type: 'bounce' }
    ]
  }
]

// --- 物理与绘图状态 ---
const lines = ref<Line[]>([])
const currentInk = ref(0)
const isDrawing = ref(false)
let currentLine: Line | null = null

const ball = ref({ x: 0, y: 0, vx: 0, vy: 0, r: 8, active: false })
const particles: any[] = []
const MAX_SPEED = 18
const STUCK_THRESHOLD = 1.0 // 速度阈值（提高阈值，更容易判定为卡住）
const STUCK_TIME = 2500 // 2.5秒不动判定为卡住（缩短时间）

let lastTime = 0
let renderLoop: number | null = null
let dropStartTime = 0
let stuckTimer = 0
let lastBallPos = { x: 0, y: 0 }

// 计算属性
const activeLevel = computed(() => levels[currentLevel.value])
const inkPercentage = computed(() => {
  if (!activeLevel.value) return 100
  return Math.max(0, 100 - (currentInk.value / activeLevel.value.maxInk) * 100)
})
const inkColor = computed(() => {
  const p = inkPercentage.value
  if (p > 50) return '#00ffcc'
  if (p > 20) return '#fbbf24'
  return '#ef4444'
})

// --- 绘图逻辑 ---
const getPointerPos = (e: MouseEvent | TouchEvent): Point => {
  const rect = gameCanvas.value!.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  return {
    x: (clientX - rect.left) * (canvasWidth.value / rect.width),
    y: (clientY - rect.top) * (canvasHeight.value / rect.height)
  }
}

const startDrawing = (e: MouseEvent | TouchEvent) => {
  if (gameStatus.value !== 'drawing') return
  const pos = getPointerPos(e)
  currentLine = { points: [pos], length: 0 }
  lines.value.push(currentLine)
  isDrawing.value = true
}

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || !currentLine || gameStatus.value !== 'drawing') return
  const pos = getPointerPos(e)
  const pts = currentLine.points
  const lastPos = pts[pts.length - 1]

  const dx = pos.x - lastPos.x
  const dy = pos.y - lastPos.y
  const dist = Math.hypot(dx, dy)

  if (dist > 4) { // 采样阈值，过小会消耗太多性能
    if (currentInk.value + dist > activeLevel.value.maxInk) {
      stopDrawing() // 墨水耗尽
      return
    }
    pts.push(pos)
    currentLine.length += dist
    currentInk.value += dist
    if (Math.random() < 0.1) playSound(sounds.draw) // 抽样播放声音
  }
}

const stopDrawing = () => {
  isDrawing.value = false
  currentLine = null
}

const clearLines = () => {
  if (gameStatus.value !== 'drawing') return
  playSound(sounds.btn)
  lines.value = []
  currentInk.value = 0
}

// --- 游戏流程 ---
const selectLevel = (idx: number) => {
  if (idx > unlockedLevel.value) return
  playSound(sounds.btn)
  currentLevel.value = idx
}

const enterLevel = () => {
  playSound(sounds.start)
  lines.value = []
  currentInk.value = 0
  resetBall()
  gameStatus.value = 'drawing'
  stuckTimer = 0
}

const resetBall = () => {
  const lvl = activeLevel.value
  ball.value = { x: lvl.start.x, y: lvl.start.y, vx: 0, vy: 0, r: 8, active: false }
}

const dropBall = () => {
  if (gameStatus.value !== 'drawing') return
  if (lines.value.length === 0) {
    // 没有画线，不能释放小球
    return
  }
  playSound(sounds.btn)
  ball.value.active = true
  gameStatus.value = 'playing'
  dropStartTime = Date.now()
  stuckTimer = 0
  lastBallPos.x = ball.value.x
  lastBallPos.y = ball.value.y
}

const returnToMenu = () => {
  playSound(sounds.btn)
  lines.value = []
  currentInk.value = 0
  resetBall()
  gameStatus.value = 'ready'
}

const retryLevel = () => {
  playSound(sounds.btn)
  lines.value = []
  currentInk.value = 0
  resetBall()
  gameStatus.value = 'drawing'
  stuckTimer = 0
}

const nextLevel = () => {
  playSound(sounds.btn)
  if (currentLevel.value < levels.length - 1) {
    currentLevel.value++
    enterLevel()
  } else {
    // 全部通关，返回菜单
    currentLevel.value = 0
    returnToMenu()
  }
}

// --- 物理引擎 (自定义实现) ---
const closestPointOnSegment = (p: Point, a: Point, b: Point) => {
  const ab = { x: b.x - a.x, y: b.y - a.y }
  let t = ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / (ab.x * ab.x + ab.y * ab.y)
  t = Math.max(0, Math.min(1, t))
  return { x: a.x + t * ab.x, y: a.y + t * ab.y }
}

const updatePhysics = (dt: number, time: number) => {
  const lvl = activeLevel.value

  // 更新移动障碍物
  lvl.obstacles.forEach(obs => {
    if (obs.moveSpeed && obs.startX !== undefined && obs.range) {
      obs.x = obs.startX + Math.sin(time / 1000 * (obs.moveSpeed / 50)) * obs.range
    }
  })

  if (!ball.value.active) return

  const b = ball.value

  // 检测小球是否卡住不动（更敏感的检测）
  const distMoved = Math.hypot(b.x - lastBallPos.x, b.y - lastBallPos.y)
  const speed = Math.hypot(b.vx, b.vy)

  // 速度很小且位移很小时累积卡住时间
  if (speed < STUCK_THRESHOLD && distMoved < 1.0) {
    stuckTimer += dt
    if (stuckTimer > STUCK_TIME) {
      failReason.value = t('pages.games.drawLinePage.ballStuck')
      gameStatus.value = 'lose'
      playSound(sounds.lose)
      b.active = false
      ball.value.x = lvl.start.x
      ball.value.y = lvl.start.y
      ball.value.vx = 0
      ball.value.vy = 0
      stuckTimer = 0
      return
    }
  } else {
    // 有明显移动就重置计时器
    stuckTimer = 0
  }

  lastBallPos.x = b.x
  lastBallPos.y = b.y

  const steps = 4 // 提高物理精度防穿模
  const subDt = (dt / 1000) / steps
  const gravity = 900 // 重力

  for (let s = 0; s < steps; s++) {
    b.vy += gravity * subDt

    // 速度限制
    const speed = Math.hypot(b.vx, b.vy)
    if (speed > MAX_SPEED / subDt) {
      b.vx = (b.vx / speed) * (MAX_SPEED / subDt)
      b.vy = (b.vy / speed) * (MAX_SPEED / subDt)
    }

    b.x += b.vx * subDt
    b.y += b.vy * subDt

    // --- 1. 与画线的连续碰撞检测 ---
    for (const line of lines.value) {
      for (let i = 0; i < line.points.length - 1; i++) {
        const p1 = line.points[i]
        const p2 = line.points[i + 1]
        const closest = closestPointOnSegment(b, p1, p2)

        const dx = b.x - closest.x
        const dy = b.y - closest.y
        const dist = Math.hypot(dx, dy)

        if (dist < b.r && dist > 0) {
          // 法线
          const nx = dx / dist
          const ny = dy / dist

          // 位置修正
          const penetration = b.r - dist
          b.x += nx * penetration
          b.y += ny * penetration

          // 速度分解
          const dot = b.vx * nx + b.vy * ny
          if (dot < 0) {
            const restitution = 0.5 // 弹性（提高弹性）
            b.vx -= (1 + restitution) * dot * nx
            b.vy -= (1 + restitution) * dot * ny

            // 摩擦力（减小摩擦）
            const tx = -ny
            const ty = nx
            const friction = 0.98 // 降低摩擦力
            const tangentVel = b.vx * tx + b.vy * ty
            b.vx -= tx * tangentVel * (1 - friction)
            b.vy -= ty * tangentVel * (1 - friction)

            // 发出轻微碰撞声
            if (Math.abs(dot) > 150 && Math.random() < 0.1) playSound(sounds.bounce)
          }
        }
      }
    }

    // --- 2. 与障碍物 AABB 碰撞 ---
    for (const obs of lvl.obstacles) {
      const closestX = Math.max(obs.x, Math.min(b.x, obs.x + obs.w))
      const closestY = Math.max(obs.y, Math.min(b.y, obs.y + obs.h))
      const dx = b.x - closestX
      const dy = b.y - closestY

      if (Math.hypot(dx, dy) < b.r) {
        if (obs.type === 'kill') {
          failReason.value = t('pages.games.drawLinePage.ballHitLaser')
          gameStatus.value = 'lose'
          playSound(sounds.lose)
          createParticles(b.x, b.y, '#ef4444', 30)
          b.active = false
          ball.value.x = lvl.start.x
          ball.value.y = lvl.start.y
          ball.value.vx = 0
          ball.value.vy = 0
          return
        } else if (obs.type === 'bounce') {
          // 强力弹跳效果
          const bounceForce = 800 // 增强弹跳力
          b.vy = -bounceForce
          b.y = obs.y - b.r - 2 // 确保小球在平台上方
          playSound(sounds.bounce)
          createParticles(b.x, b.y, '#10b981', 15)
        }
      }
    }

    // --- 3. 掉出屏幕 ---
    if (b.y > canvasHeight.value + 20 || b.x < -20 || b.x > canvasWidth.value + 20) {
      failReason.value = t('pages.games.drawLinePage.ballLostInVoid')
      gameStatus.value = 'lose'
      playSound(sounds.lose)
      b.active = false
      ball.value.x = lvl.start.x
      ball.value.y = lvl.start.y
      ball.value.vx = 0
      ball.value.vy = 0
      return
    }

    // --- 4. 到达终点 ---
    const distToTarget = Math.hypot(b.x - lvl.target.x, b.y - lvl.target.y)
    if (distToTarget < 20) {
      triggerWin()
      return
    }
  }

  // 小球拖尾
  if (Math.random() < 0.4) {
    particles.push({
      x: b.x, y: b.y, vx: 0, vy: 0, life: 1, color: '#f0abfc'
    })
  }
}

const triggerWin = () => {
  ball.value.active = false
  gameStatus.value = 'win'
  playSound(sounds.win)
  playTime.value = Date.now() - dropStartTime
  createParticles(activeLevel.value.target.x, activeLevel.value.target.y, '#fcd34d', 50)

  // 评价系统：默认1星，省墨水+1星，速度快+1星
  let s = 1
  if (inkPercentage.value > 30) s++
  if (playTime.value < 6000) s++
  levelStars.value = s
  stars.value += s

  // 解锁
  if (currentLevel.value === unlockedLevel.value && currentLevel.value < levels.length - 1) {
    unlockedLevel.value++
    localStorage.setItem('neonRiderUnlock', unlockedLevel.value.toString())
  }

  // 保存累计星数并上报后端最终累计总星数作为最高记录
  localStorage.setItem('neonRiderStars', stars.value.toString())
  saveScore(stars.value)
}

const createParticles = (x: number, y: number, color: string, count: number = 15) => {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150,
      life: 1, color
    })
  }
}

// --- Canvas 渲染引擎 ---
const render = (time: number) => {
  const dt = lastTime ? time - lastTime : 0
  lastTime = time

  if (gameStatus.value === 'playing') {
    updatePhysics(dt, time)
  } else if (gameStatus.value === 'drawing') {
    // drawing状态也要更新移动障碍物
    const lvl = activeLevel.value
    if(lvl) {
      lvl.obstacles.forEach(obs => {
        if (obs.moveSpeed && obs.startX !== undefined && obs.range) {
          obs.x = obs.startX + Math.sin(time / 1000 * (obs.moveSpeed / 50)) * obs.range
        }
      })
    }
  }

  const ctx = gameCanvas.value?.getContext('2d')
  if (!ctx) {
    renderLoop = requestAnimationFrame(render)
    return
  }

  const w = canvasWidth.value
  const h = canvasHeight.value
  const style = getComputedStyle(document.body)
  const bgColor = style.getPropertyValue('--screen-bg').trim() || '#0b1021'

  // 清理画布 (带微弱拖影)
  ctx.fillStyle = 'rgba(11, 16, 33, 0.6)'
  ctx.fillRect(0, 0, w, h)

  // 绘制深色网格
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for(let i=0; i<w; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i,h) }
  for(let i=0; i<h; i+=40) { ctx.moveTo(0,i); ctx.lineTo(w,i) }
  ctx.stroke()

  const lvl = activeLevel.value
  if (!lvl) {
    renderLoop = requestAnimationFrame(render)
    return
  }

  // 1. 绘制障碍物
  lvl.obstacles.forEach(obs => {
    ctx.shadowBlur = 15
    if (obs.type === 'kill') {
      ctx.shadowColor = '#ef4444'
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'
      ctx.strokeStyle = '#ef4444'
    } else {
      // 弹跳平台 - 绿色发光
      ctx.shadowColor = '#10b981'
      ctx.shadowBlur = 20
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)'
      ctx.strokeStyle = '#10b981'
    }
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h)
    ctx.lineWidth = 3
    ctx.strokeRect(obs.x, obs.y, obs.w, obs.h)

    // 内部纹理
    if (obs.type === 'kill') {
      ctx.beginPath()
      for(let i=0; i<obs.w; i+=15) {
        ctx.moveTo(obs.x+i, obs.y);
        ctx.lineTo(obs.x+i-10, obs.y+obs.h)
      }
      ctx.stroke()
    } else {
      // 弹跳平台的弹簧纹理
      ctx.strokeStyle = '#34d399'
      ctx.lineWidth = 2
      ctx.beginPath()
      for(let i=0; i<obs.w; i+=10) {
        const wave = Math.sin(time / 200 + i / 5) * 2
        ctx.moveTo(obs.x+i, obs.y + obs.h/2 + wave)
        ctx.lineTo(obs.x+i+5, obs.y + obs.h/2 - wave)
      }
      ctx.stroke()
    }
  })

  // 2. 绘制起点和终点
  ctx.shadowBlur = 20
  // 起点 (青色光晕脉冲)
  ctx.shadowColor = '#00ffcc'
  ctx.strokeStyle = '#00ffcc'
  const pulse = 15 + Math.sin(time / 200) * 3
  ctx.beginPath(); ctx.arc(lvl.start.x, lvl.start.y, pulse, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.stroke()
  ctx.fillStyle = '#00ffcc'; ctx.beginPath(); ctx.arc(lvl.start.x, lvl.start.y, 4, 0, Math.PI * 2); ctx.fill()

  // 终点 (黄色旋转方块)
  ctx.shadowColor = '#fcd34d'
  ctx.strokeStyle = '#fcd34d'
  ctx.save()
  ctx.translate(lvl.target.x, lvl.target.y)
  ctx.rotate(time / 500)
  ctx.beginPath(); ctx.rect(-15, -15, 30, 30); ctx.lineWidth = 3; ctx.stroke()
  ctx.rotate(Math.PI / 4)
  ctx.beginPath(); ctx.rect(-10, -10, 20, 20); ctx.stroke()
  ctx.restore()

  // 3. 绘制霓虹画线
  ctx.shadowBlur = 15
  ctx.shadowColor = '#0ea5e9' // 天蓝色发光
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  lines.value.forEach(line => {
    if (line.points.length < 2) return
    ctx.beginPath()
    ctx.moveTo(line.points[0].x, line.points[0].y)
    for (let i = 1; i < line.points.length; i++) {
      ctx.lineTo(line.points[i].x, line.points[i].y)
    }
    ctx.stroke()

    // 绘制内部白线增强霓虹感
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  })

  // 4. 绘制小球
  if (ball.value.active || gameStatus.value === 'drawing') {
    ctx.shadowBlur = 20
    ctx.shadowColor = '#f472b6' // 品红发光
    ctx.fillStyle = '#fbcfe8'
    ctx.beginPath()
    ctx.arc(ball.value.x, ball.value.y, ball.value.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 5. 粒子特效
  ctx.shadowBlur = 10
  particles.forEach((p, idx) => {
    p.x += p.vx * (dt/1000)
    p.y += p.vy * (dt/1000)
    p.life -= dt / 1000
    if (p.life <= 0) {
      particles.splice(idx, 1)
    } else {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill()
    }
  })
  ctx.globalAlpha = 1.0

  renderLoop = requestAnimationFrame(render)
}

onMounted(() => {
  unlockedLevel.value = parseInt(localStorage.getItem('neonRiderUnlock') || '0')
  stars.value = parseInt(localStorage.getItem('neonRiderStars') || '0')
  resetBall()
  renderLoop = requestAnimationFrame(render)

  // 预读取网络排行和本地日志，实现秒开弹窗
  fetchRankings()
  fetchHistory()
})

onUnmounted(() => {
  if (renderLoop) cancelAnimationFrame(renderLoop)
})
</script>

<style scoped>
@font-face {
  font-family: 'PressStart2P';
  src: url('https://fonts.cdnfonts.com/s/14227/PressStart2P-Regular.woff') format('woff');
  font-display: swap;
}

:root {
  --console-body: #e0e0e0;
  --console-border: #999;
  --console-detail: #b0b0b0;
  --screen-bezel: #555;
  --screen-bg: #8bac0f;
  --pixel-color: #0f380f;
  --text-main: #4a4a4a;
  --btn-primary: #B22222;
  --btn-secondary: #333333;
  --btn-system: #888888;
}

@media (prefers-color-scheme: dark) {
  :root {
    --console-body: #1a1b26;
    --console-border: #111;
    --console-detail: #24283b;
    --screen-bezel: #000;
    --screen-bg: #0b1021;
    --pixel-color: #00ffcc;
    --text-main: #a9b1d6;
    --btn-primary: #ff007c;
    --btn-secondary: #1a1b26;
    --btn-system: #565f89;
  }
}

@media (prefers-color-scheme: dark) {
  --console-body: #1a1b26;
  --console-border: #111;
  --console-detail: #24283b;
  --screen-bezel: #000;
  --screen-bg: #0b1021;
  --pixel-color: #00ffcc;
  --text-main: #a9b1d6;
  --btn-primary: #ff007c;
  --btn-secondary: #1a1b26;
  --btn-system: #565f89;
}

* { user-select: none; -webkit-touch-callout: none; box-sizing: border-box; }

.yuemu-retro-arcade-universe {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh; height: 100dvh;
  background-color: var(--background, #2c2c2c);
  display: flex; justify-content: center; align-items: center;
  font-family: 'PressStart2P', 'Courier New', monospace;
  overflow: auto; padding: 20px 10px;
}

.arcade-console {
  background: var(--console-body); border: 4px solid var(--console-border);
  border-radius: 20px 20px 60px 20px; padding: 20px;
  display: flex; flex-direction: column; gap: 20px;
  box-shadow: 10px 10px 0px rgba(0,0,0,0.3), inset 4px 4px 10px rgba(255,255,255,0.2), inset -4px -4px 10px rgba(0,0,0,0.2);
  max-width: 500px; width: 100%; min-height: 800px; margin: auto;
}

.console-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 10px; }
.brand { display: flex; flex-direction: column; }
.brand-name { font-size: 18px; font-weight: bold; color: var(--btn-primary); font-style: italic; letter-spacing: 2px;}
.brand-model { font-size: 8px; color: var(--text-main); margin-top: 4px; }
.speaker-grill { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; transform: rotate(15deg); }
.speaker-grill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--console-detail); box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5); }

.screen-bezel { background: var(--screen-bezel); padding: 20px 30px 40px 30px; border-radius: 12px 12px 40px 12px; box-shadow: inset 2px 2px 10px rgba(0,0,0,0.8); }

.screen-glass {
  background: var(--screen-bg); border: 2px solid rgba(0,0,0,0.5); border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.4), 0 0 15px var(--screen-bg);
  position: relative; overflow: hidden; display: flex; flex-direction: column;
}

.crt-effect::before { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%); background-size: 100% 4px; z-index: 10; pointer-events: none; }
.crt-effect::after { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: rgba(255,255,255,0.02); z-index: 10; pointer-events: none; animation: flicker 0.15s infinite; }
@keyframes flicker { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

.hud-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 2px solid rgba(0,255,204,0.3); background: rgba(0,0,0,0.6); }
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 4px;}
.hud-item.right { align-items: flex-end; }
.hud-label { font-size: 8px; color: var(--pixel-color); opacity: 0.8; }
.hud-val { font-size: 12px; font-weight: bold; text-shadow: 0 0 5px currentColor; color: #fff;}
.text-cyan { color: #00ffcc; text-shadow: 0 0 8px #00ffcc;}
.text-yellow { color: #fbbf24; text-shadow: 0 0 8px #fbbf24;}
.text-success { color: #10b981; }
.text-danger { color: #ef4444; }

.ink-container { width: 40%; }
.ink-bar-bg { width: 100%; height: 8px; background: #1E293B; border-radius: 4px; overflow: hidden; margin-top: 4px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); border: 1px solid rgba(0,255,204,0.3);}
.ink-bar-fill { height: 100%; transition: width 0.1s linear, background-color 0.3s; box-shadow: 0 0 8px currentColor;}

.canvas-container { position: relative; display: flex; justify-content: center; align-items: center; padding: 0; aspect-ratio: 1 / 1; }
.game-canvas { width: 100%; height: 100%; max-width: 400px; touch-action: none; cursor: crosshair;}
.blur-effect { filter: blur(3px) brightness(0.5); transition: filter 0.3s; }

.screen-overlay {
  position: absolute; inset: 0; background: rgba(15, 23, 42, 0.8);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 20; color: #fff; text-align: center; padding: 20px; backdrop-filter: blur(4px);
}
.pixel-title { font-size: 24px; margin-bottom: 10px; line-height: 1.4;}
.neon-text { text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc; color: #fff; }
.neon-text-green { text-shadow: 0 0 10px #10b981, 0 0 20px #10b981; color: #fff; }
.neon-text-red { text-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444; color: #fff; }

.desc { font-size: 10px; color: #cbd5e1; margin-bottom: 20px; line-height: 1.5; opacity: 0.8;}
.mt-4 { margin-top: 20px; }
.clickable-hint { font-size: 10px; cursor: pointer; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);}
.clickable-hint:active { transform: scale(0.95); }
.results { margin: 20px 0; display: flex; flex-direction: column; gap: 12px; font-size: 12px; text-align: center; }
.stars-display { font-size: 24px; color: #333; margin: 10px 0; letter-spacing: 5px;}
.star.earned { color: #fbbf24; text-shadow: 0 0 15px #fbbf24; }
.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

.level-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 15px; }
.level-btn {
  width: 40px; height: 40px; background: rgba(0,255,204,0.1); border: 2px solid #00ffcc; color: #00ffcc;
  font-family: inherit; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: inset 0 0 10px rgba(0,255,204,0.2);
}
.level-btn.locked { background: rgba(255,255,255,0.05); border-color: #555; color: #555; cursor: not-allowed; box-shadow: none; }
.level-btn.current { background: #00ffcc; color: #000; box-shadow: 0 0 15px #00ffcc; }

/* === 控制面板区 === */
.control-panel { flex: 1; display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 10px 0; }

/* 装饰性占位 */
.deco-section { order: 1; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; opacity: 0.6;}
.vent-grill { display: flex; flex-direction: column; gap: 4px; }
.vent-line { width: 50px; height: 4px; background: #111; border-radius: 2px; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.8), 1px 1px 1px rgba(255,255,255,0.1); }
.coin-text { font-size: 8px; color: var(--text-main); font-weight: bold; letter-spacing: 1px; }

/* 隐藏原本贪吃蛇的十字键样式，只保留框架 */
.d-pad-section { display: none; }
.deco-section { display: flex; }

.system-section { order: 2; display: flex; align-items: flex-end; padding-bottom: 20px; }
.sys-btn-group { display: flex; gap: 20px; transform: rotate(-15deg); }
.sys-btn { background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.1s; }
.sys-btn:active { transform: scale(0.95); }
.pill { width: 60px; height: 18px; background: var(--btn-system); border-radius: 12px; box-shadow: 3px 3px 6px rgba(0,0,0,0.3), inset 2px 2px 3px rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; position: relative; }
.pill-icon { font-size: 14px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.sys-btn:active .pill { transform: translate(1px, 1px); box-shadow: inset 2px 2px 4px rgba(0,0,0,0.6); }
.sys-label { font-size: 10px; color: var(--text-main); font-weight: bold; letter-spacing: 1px; }
.sound-btn.active .pill { background: linear-gradient(135deg, #34c759, #b4ec51); box-shadow: 0 0 8px rgba(52, 199, 89, 0.5), 2px 2px 4px rgba(0,0,0,0.3); }
.start-btn .pill { background: linear-gradient(135deg, #007aff, #00c6ff); box-shadow: 0 0 8px rgba(0, 122, 255, 0.5), 2px 2px 4px rgba(0,0,0,0.3); }

.action-section { order: 3; flex: 1; display: flex; justify-content: flex-end; }
.action-buttons { display: flex; gap: 15px; transform: rotate(-15deg); background: rgba(0,0,0,0.05); padding: 15px 25px; border-radius: 40px; box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1); }
.btn-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.a-btn { width: 45px; height: 45px; border-radius: 50%; border: none; background: var(--btn-primary); display: flex; justify-content: center; align-items: center; color: rgba(255,255,255,0.7); font-family: Arial, sans-serif; font-size: 18px; font-weight: 900; text-shadow: 1px 1px 1px rgba(0,0,0,0.5); box-shadow: 2px 4px 0 rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.4); cursor: pointer;}
.a-btn.b-btn { background: #eab308; }
.a-btn:active { transform: translate(2px, 4px); box-shadow: inset 2px 2px 6px rgba(0,0,0,0.6); color: rgba(255,255,255,0.5); }
.a-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.a-btn:disabled:active { transform: none; box-shadow: 2px 4px 0 rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.4); }
.btn-label { font-size: 8px; color: var(--text-main); font-weight: bold;}

/* =========================================
   PC 端右侧聚合控制台布局 (屏幕在左，按键在右)
   ========================================= */
@media screen and (min-width: 769px) {
  .arcade-console {
    display: grid;
    grid-template-columns: 1fr 220px;
    grid-template-rows: auto min-content min-content min-content 1fr;
    grid-template-areas:
      "header header"
      "screen d-pad"
      "screen actions"
      "screen sys"
      "screen diag";
    gap: 15px 25px;
    max-width: 800px;
    height: auto;
    min-height: 400px;
    border-radius: 20px;
    margin: auto; flex-shrink: 0;
  }
  .console-header { grid-area: header; padding: 0 10px; }
  .screen-bezel { grid-area: screen; margin: 0; min-height: 0; display: flex; flex-direction: column; }
  .screen-glass { flex: 1; }
  .canvas-container { flex: 1; }
  
  .control-panel { display: contents; }
  
  .deco-section { grid-area: d-pad; justify-content: center; align-items: flex-end; padding-bottom: 10px; }
  .action-section { grid-area: actions; justify-content: center; align-items: center; }
  .system-section { grid-area: sys; justify-content: center; align-items: flex-start; padding-top: 10px; }
  
  .sys-btn-group { transform: none; gap: 30px; }

  .diagnostic-trigger-bar { 
    grid-area: diag; 
    flex-direction: column; 
    justify-content: flex-start; 
    padding: 0; 
    margin-top: 20px; 
    width: 100%;
  }
}

@media screen and (max-width: 768px) {

  .yuemu-retro-arcade-universe { padding: 10px 5px; }
  .arcade-console { border-radius: 0; border: none; box-shadow: none; padding: 10px 5px; gap: 10px; height: 100%; max-height: 100dvh; min-height: unset; width: 100%; justify-content: center; }
  .screen-bezel { padding: 10px 15px 15px 15px; border-radius: 8px 8px 20px 8px; }

  .control-panel { flex-direction: row; flex-wrap: wrap; padding: 0 5px 10px 5px; gap: 10px 0; align-items: flex-end; }
  .system-section { order: 1; width: 100%; justify-content: center; padding-bottom: 10px; }
  .sys-btn-group { transform: none; gap: 80px; }
  .pill { width: 70px; height: 20px; border-radius: 14px; }
  .pill-icon { font-size: 16px; }
  .sys-label { font-size: 11px; opacity: 0.9; }

  .deco-section { order: 2; flex: 1; }

  .action-section { order: 3; flex: 1; }
  .action-buttons { padding: 10px; gap: 12px; }
  .a-btn { width: 48px; height: 48px; font-size: 18px; }
}
@media screen and (max-width: 360px) {
  .a-btn { width: 42px; height: 42px; font-size: 16px; }
  .sys-btn-group { gap: 60px; }
  .pill { width: 60px; height: 18px; }
  .pill-icon { font-size: 14px; }
  .sys-label { font-size: 10px; }
}

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
  border: 2px solid var(--console-border);
  border-radius: 8px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--console-border);
  transition: all 0.1s;
}
.mini-diag-btn:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--console-border);
}
.mini-diag-btn .sys-icon { font-size: 18px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.mini-diag-btn .sys-text { font-size: 11px; color: var(--text-main); font-weight: bold; }

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
  max-width: 600px;
  background: var(--console-body);
  border: 4px solid var(--console-border);
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
  color: var(--text-primary);
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.4);
}

.tab-buttons {
  display: flex;
  gap: 10px;
}

.tab-btn {
  background: none;
  border: none;
  color: var(--text-main);
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
  font-size: 12px;
  font-weight: bold;
  color: #00FF41;
  border-bottom: 2px solid rgba(0, 255, 65, 0.3);
  padding-bottom: 12px;
  margin-bottom: 15px;
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
  padding: 10px 8px;
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
  font-size: 11px;
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
  font-size: 12px;
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
  padding: 6px 14px;
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

/* === 响应式调整 === */
@media screen and (max-width: 768px) {
  .diagnostic-trigger-bar {
    padding: 0 15px;
  }
  
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

.retro-select option {
  background: #020603;
  color: #00FF41;
  font-family: inherit;
}
</style>
