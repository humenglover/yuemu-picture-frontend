<template>
  <div class="yuemu-retro-slice-universe" @touchmove.prevent>
    <div class="arcade-console">

      <div class="console-header">
        <div class="brand">
          <span class="brand-name">{{ t('pages.games.fruitSlicePage.boxSliceMaster') }}</span>
          <span class="brand-model">SLICER-89</span>
        </div>
        <div class="speaker-grill">
          <div class="dot" v-for="i in 12" :key="i"></div>
        </div>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.fruitSlicePage.highScore') }}</span>
              <span class="hud-val">{{ bestScore }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.fruitSlicePage.score') }}</span>
              <span class="hud-val">{{ score }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.fruitSlicePage.level') }}</span>
              <span class="hud-val">Lv.{{ level }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.fruitSlicePage.lives') }}</span>
              <span class="hud-val" style="display: flex; gap: 2px;">
                <i 
                  v-for="i in Math.max(0, lives)" 
                  :key="i" 
                  class="fas fa-heart" 
                  style="color: #ef4444;"
                ></i>
              </span>
            </div>
          </div>

          <div class="canvas-container crt-effect">
            <canvas
              ref="gameCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="game-canvas"
              :class="{ 'blur-effect': gameStatus !== 'playing', 'shake': isShaking }"
              @mousedown="handleSliceStart"
              @mousemove="handleSliceMove"
              @mouseup="handleSliceEnd"
              @mouseleave="handleSliceEnd"
              @touchstart.prevent="handleSliceStart"
              @touchmove.prevent="handleSliceMove"
              @touchend.prevent="handleSliceEnd"
            ></canvas>

            <div v-if="comboCount >= 2" class="combo-display" :class="'combo-' + comboCount">
              <span class="combo-text">{{ t('pages.games.fruitSlicePage.comboCountExclaim', { combo: comboCount }) }}</span>
            </div>


            <div v-if="gameStatus === 'ready'" class="screen-overlay menu-overlay">
              <h1 class="pixel-title neon-cyan">{{ t('pages.games.fruitSlicePage.boxSliceMaster') }}</h1>
              <div class="action-hints">
                <p class="desc">{{ t('pages.games.fruitSlicePage.slideSliceScore') }}</p>
                <p class="desc mt-2">{{ t('pages.games.fruitSlicePage.avoidBombsDontMiss') }}</p>
                <p class="desc mt-2 warning-text">
                  <i class="fas fa-exclamation-triangle" style="color: #fbbf24; margin-right: 4px;"></i>
                  {{ t('pages.games.fruitSlicePage.missBoxDeductLife') }}
                </p>
                <p class="blink mt-4 clickable-hint" @click="startGame">{{ t('pages.games.fruitSlicePage.pressStartGame') }}</p>
              </div>
            </div>

            <div v-if="gameStatus === 'gameover'" class="screen-overlay game-over-overlay">
              <h1 class="pixel-title neon-red">{{ t('pages.games.fruitSlicePage.gameOver') }}</h1>
              <div class="results">
                <p> {{ t('pages.games.fruitSlicePage.finalScoreLabel') }} <span class="neon-cyan">{{ score }}</span></p>
                <p>{{ t('pages.games.fruitSlicePage.arrivedLevel', { level: level }) }}</p>
                <p>{{ t('pages.games.fruitSlicePage.maxComboReached', { combo: maxCombo }) }}</p>
              </div>
              <div class="action-hints">
                <p class="blink clickable-hint" @click="startGame">{{ t('pages.games.fruitSlicePage.pressStartToRetryBracket') }}</p>
                <p class="clickable-hint" @click="backToMenu">{{ t('pages.games.fruitSlicePage.pressBReturnMenu') }}</p>
              </div>
            </div>

            <div v-if="gameStatus === 'paused'" class="screen-overlay pause-overlay">
              <h1 class="pixel-title blink neon-yellow">{{ t('pages.games.fruitSlicePage.pause') }}</h1>
              <div class="action-hints">
                <p class="clickable-hint mt-4" @click="handleStartPause">{{ t('pages.games.fruitSlicePage.pressStartContinue') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 辅助监控诊断按钮区（界面纯中文设计，不挤压原操作键，极其适配移动端） -->
      <div class="diagnostic-trigger-bar">
        <button class="sys-btn mini-diag-btn" @click="openTerminal('ranking')">
          <span class="sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="sys-text">{{ t('pages.games.fruitSlicePage.leaderboardBracket') }}</span>
        </button>
        <button class="sys-btn mini-diag-btn" @click="openTerminal('history')">
          <span class="sys-icon"><i class="fas fa-history"></i></span>
          <span class="sys-text">{{ t('pages.games.fruitSlicePage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">
        <div class="system-section">
          <div class="sys-btn-group">
            <button class="sys-btn sound-btn" @click="toggleSound" :class="{ 'active': isSoundEnabled }">
              <div class="pill">
                <span class="pill-icon">
                  <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
                </span>
              </div>
              <span class="sys-label">{{ t('pages.games.fruitSlicePage.sound') }}</span>
            </button>
            <button class="sys-btn start-btn" @click="handleStartPause">
              <div class="pill">
                <span class="pill-icon">
                  <i :class="gameStatus === 'playing' ? 'fas fa-pause' : 'fas fa-play'"></i>
                </span>
              </div>
              <span class="sys-label">{{ gameStatus === 'playing' ? t('pages.games.fruitSlicePage.pause') : t('pages.games.fruitSlicePage.start') }}</span>
            </button>
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
          <span class="model-name terminal-title">{{ t('pages.games.fruitSlicePage.monitorDiagnosticR09') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.fruitSlicePage.leaderboardBracketRight') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.fruitSlicePage.historyLogBracketRight') }}
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
              <span class="filter-label">{{ t('pages.games.fruitSlicePage.levelFilter') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.fruitSlicePage.allLevels') }}</option>
                <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>
            
            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.fruitSlicePage.ranking') }}</span>
              <span>{{ t('pages.games.fruitSlicePage.sliceTerminal') }}</span>
              <span>{{ t('pages.games.fruitSlicePage.maxScore') }}</span>
              <span>{{ t('pages.games.fruitSlicePage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.fruitSlicePage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.fruitSlicePage.noSliceRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.fruitSlicePage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.fruitSlicePage.scorePoints', { score: item.score }) }}</span>
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
                {{ t('pages.games.fruitSlicePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.fruitSlicePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.fruitSlicePage.saveTime') }}</span>
              <span>{{ t('pages.games.fruitSlicePage.achievedProgress') }}</span>
              <span>{{ t('pages.games.fruitSlicePage.achievedScore') }}</span>
              <span>{{ t('pages.games.fruitSlicePage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.fruitSlicePage.readingLocalArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.fruitSlicePage.noLocalArchive') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.fruitSlicePage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.fruitSlicePage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.fruitSlicePage.clearSuccess') : t('pages.games.fruitSlicePage.notInitiated') }}
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
                {{ t('pages.games.fruitSlicePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.fruitSlicePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.fruitSlicePage.closeDiagTerminal') }}
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
const levelOptions = [t('pages.games.fruitSlicePage.level1'), t('pages.games.fruitSlicePage.level2'), t('pages.games.fruitSlicePage.level3'), t('pages.games.fruitSlicePage.level4'), t('pages.games.fruitSlicePage.level5'), t('pages.games.fruitSlicePage.level6'), t('pages.games.fruitSlicePage.level7'), t('pages.games.fruitSlicePage.level8')]

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
      gameType: 'fruit_slice',
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
    console.error(t('pages.games.fruitSlicePage.getRankingsError'), err)
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
      gameType: 'fruit_slice',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.fruitSlicePage.getHistoryRecordError'), err)
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
  if (!dateStr) return t('pages.games.fruitSlicePage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

const saveScore = async (finalScore: number) => {
  if (finalScore < 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.fruitSlicePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'fruit_slice',
      level: '关卡 ' + level.value,
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.fruitSlicePage.reportFinalScoreResultError'), err)
  }
}

// --- 游戏状态管理 ---
type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover'
const gameStatus = ref<GameStatus>('ready')

const gameCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(400)
const canvasHeight = ref(500)

const score = ref(0)
const bestScore = ref(0)
const level = ref(1)
const lives = ref(5) // 增加初始生命值
const comboCount = ref(0)
const maxCombo = ref(0)
const isShaking = ref(false)

// --- 音效系统 ---
const isSoundEnabled = ref(true)
const sounds = {
  slice: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  bomb: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href),
  combo: new Audio(new URL('@/assets/sounds/powerup.MP3', import.meta.url).href),
  score: new Audio(new URL('@/assets/sounds/match.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  gameover: new Audio(new URL('@/assets/sounds/gameover.MP3', import.meta.url).href),
  btn: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href)
}

sounds.slice.volume = 0.3
sounds.bomb.volume = 0.4
sounds.combo.volume = 0.3
sounds.score.volume = 0.2
sounds.start.volume = 0.3
sounds.gameover.volume = 0.3
sounds.btn.volume = 0.2

const playSound = (audio: HTMLAudioElement) => {
  if (!isSoundEnabled.value) return
  audio.currentTime = 0
  audio.play().catch(() => {})
}
const toggleSound = () => { isSoundEnabled.value = !isSoundEnabled.value; playSound(sounds.btn) }

// --- 游戏实体定义 ---
interface Point { x: number, y: number }
interface Box {
  x: number, y: number, w: number, h: number
  vx: number, vy: number, rotation: number, rotSpeed: number
  type: 'cyan' | 'magenta' | 'yellow' | 'rainbow' | 'bomb'
  color: string, points: number, sliced: boolean
}
interface Particle {
  x: number, y: number, vx: number, vy: number
  rotation: number, rotSpeed: number
  life: number, decay: number, color: string, size: number
}
interface TrailPoint extends Point { life: number }

const boxes = ref<Box[]>([])
const particles = ref<Particle[]>([])
const sliceTrail = ref<TrailPoint[]>([])
const gridLines = ref<{ x: number, y: number, vx: number, vy: number }[]>([])

let gameLoopId: number | null = null
let spawnTimer = 0
let isSlicing = false
let comboTimer = 0

const GRAVITY = 0.25 // 降低重力，让盒子飞得更高更久
const COMBO_TIMEOUT = 180 // 3秒内连击有效


// --- 初始化 ---
const initGridLines = () => {
  gridLines.value = []
  for (let i = 0; i < 15; i++) {
    gridLines.value.push({
      x: Math.random() * canvasWidth.value,
      y: Math.random() * canvasHeight.value,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    })
  }
}

const spawnBox = () => {
  const rand = Math.random()
  let type: Box['type'], color: string, points: number

  const bombChance = 0.1 + level.value * 0.01
  const rainbowChance = 0.05

  if (rand < bombChance) {
    type = 'bomb'; color = '#ef4444'; points = -5
  } else if (rand < bombChance + rainbowChance) {
    type = 'rainbow'; color = '#a855f7'; points = 5
  } else if (rand < 0.4) {
    type = 'cyan'; color = '#00ffcc'; points = 1
  } else if (rand < 0.7) {
    type = 'magenta'; color = '#d946ef'; points = 2
  } else {
    type = 'yellow'; color = '#fbbf24'; points = 3
  }

  const size = type === 'bomb' ? 35 : 30
  const x = Math.random() * (canvasWidth.value - size * 2) + size
  const speedMultiplier = 1 + level.value * 0.1 // 降低关卡速度增长
  const vx = (Math.random() - 0.5) * 3 * speedMultiplier // 减小横向速度
  const vy = -(12 + Math.random() * 6) * speedMultiplier // 大幅增加向上初速度

  boxes.value.push({
    x, y: canvasHeight.value + size, w: size, h: size,
    vx, vy, rotation: 0, rotSpeed: (Math.random() - 0.5) * 0.08, // 减慢旋转
    type, color, points, sliced: false
  })
}

const spawnExplosion = (x: number, y: number, color: string, count: number = 10) => {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 6 + 2
    particles.value.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      life: 1.0, decay: 0.015, color,
      size: Math.random() * 6 + 4
    })
  }
}

const sliceBox = (box: Box) => {
  if (box.sliced) return
  box.sliced = true

  if (box.type === 'bomb') {
    playSound(sounds.bomb)
    lives.value--
    comboCount.value = 0
    comboTimer = 0
    isShaking.value = true
    setTimeout(() => isShaking.value = false, 200)
    spawnExplosion(box.x + box.w/2, box.y + box.h/2, box.color, 20)
    if (lives.value <= 0) {
      gameStatus.value = 'gameover'
      playSound(sounds.gameover)
      if (score.value > bestScore.value) {
        bestScore.value = score.value
        localStorage.setItem('retroSlicerBest', bestScore.value.toString())
      }
      saveScore(score.value)
    }
  } else {
    playSound(sounds.slice)
    comboCount.value++
    comboTimer = COMBO_TIMEOUT

    if (comboCount.value > maxCombo.value) {
      maxCombo.value = comboCount.value
    }

    let multiplier = 1
    if (comboCount.value >= 5) multiplier = 3
    else if (comboCount.value >= 3) multiplier = 2
    else if (comboCount.value >= 2) multiplier = 1.5

    const earnedPoints = Math.floor(box.points * multiplier)
    score.value += earnedPoints

    if (comboCount.value >= 2) {
      playSound(sounds.combo)
    } else {
      playSound(sounds.score)
    }

    spawnExplosion(box.x + box.w/2, box.y + box.h/2, box.color, 12)

    // 关卡升级：每60分升级（给玩家更多时间）
    if (score.value >= level.value * 60) {
      level.value++
      playSound(sounds.combo)
    }
  }
}


// --- 碰撞检测 ---
const lineIntersectsBox = (p1: Point, p2: Point, box: Box): boolean => {
  const boxCenterX = box.x + box.w / 2
  const boxCenterY = box.y + box.h / 2
  const dist = pointToLineDistance(boxCenterX, boxCenterY, p1, p2)
  return dist < box.w / 2
}

const pointToLineDistance = (px: number, py: number, p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return Math.sqrt((px - p1.x) ** 2 + (py - p1.y) ** 2)

  const t = Math.max(0, Math.min(1, ((px - p1.x) * dx + (py - p1.y) * dy) / (len * len)))
  const projX = p1.x + t * dx
  const projY = p1.y + t * dy
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2)
}

// --- 游戏逻辑 ---
const startGame = () => {
  score.value = 0
  level.value = 1
  lives.value = 5 // 增加初始生命值
  comboCount.value = 0
  maxCombo.value = 0

  boxes.value = []
  particles.value = []
  sliceTrail.value = []

  initGridLines()
  gameStatus.value = 'playing'
  playSound(sounds.start)

  if (gameLoopId) cancelAnimationFrame(gameLoopId)
  gameLoopId = requestAnimationFrame(gameLoop)
}

const updatePhysics = () => {
  // 1. 更新网格线
  gridLines.value.forEach(line => {
    line.x += line.vx
    line.y += line.vy
    if (line.x < 0 || line.x > canvasWidth.value) line.vx *= -1
    if (line.y < 0 || line.y > canvasHeight.value) line.vy *= -1
  })

  // 2. 生成盒子
  spawnTimer++
  const spawnInterval = Math.max(80, 150 - level.value * 5) // 增加生成间隔，降低难度
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0
    const count = Math.min(2, 1 + Math.floor(level.value / 5)) // 减少同时生成数量
    for (let i = 0; i < count; i++) {
      if (Math.random() < 0.6) spawnBox() // 降低生成概率
    }
  }

  // 3. 更新盒子
  for (let i = boxes.value.length - 1; i >= 0; i--) {
    const box = boxes.value[i]
    box.vy += GRAVITY
    box.x += box.vx
    box.y += box.vy
    box.rotation += box.rotSpeed

    // 盒子掉出屏幕
    if (box.y > canvasHeight.value + 100) {
      if (!box.sliced && box.type !== 'bomb') {
        lives.value--
        comboCount.value = 0
        comboTimer = 0
        // 添加视觉反馈
        isShaking.value = true
        setTimeout(() => isShaking.value = false, 200)
        playSound(sounds.bomb) // 播放失误音效
        if (lives.value <= 0) {
          gameStatus.value = 'gameover'
          playSound(sounds.gameover)
          if (score.value > bestScore.value) {
            bestScore.value = score.value
            localStorage.setItem('retroSlicerBest', bestScore.value.toString())
          }
          saveScore(score.value)
        }
      }
      boxes.value.splice(i, 1)
      continue
    }

    // 检测切割
    if (!box.sliced && sliceTrail.value.length >= 2) {
      for (let j = 1; j < sliceTrail.value.length; j++) {
        if (lineIntersectsBox(sliceTrail.value[j-1], sliceTrail.value[j], box)) {
          sliceBox(box)
          break
        }
      }
    }
  }

  // 4. 更新粒子
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i]
    p.vy += GRAVITY * 0.5
    p.x += p.vx
    p.y += p.vy
    p.rotation += p.rotSpeed
    p.life -= p.decay
    if (p.life <= 0) particles.value.splice(i, 1)
  }

  // 5. 更新切割轨迹
  for (let i = sliceTrail.value.length - 1; i >= 0; i--) {
    sliceTrail.value[i].life -= 0.05
    if (sliceTrail.value[i].life <= 0) sliceTrail.value.splice(i, 1)
  }

  // 6. 连击计时
  if (comboTimer > 0) {
    comboTimer--
    if (comboTimer === 0) comboCount.value = 0
  }
}


// --- 渲染引擎 ---
const render = () => {
  const ctx = gameCanvas.value?.getContext('2d')
  if (!ctx) return

  const w = canvasWidth.value
  const h = canvasHeight.value

  // 背景
  ctx.fillStyle = '#0B1021'
  ctx.fillRect(0, 0, w, h)

  // 网格线
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)'
  ctx.lineWidth = 1
  gridLines.value.forEach(line => {
    ctx.beginPath()
    ctx.moveTo(line.x - 20, line.y)
    ctx.lineTo(line.x + 20, line.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(line.x, line.y - 20)
    ctx.lineTo(line.x, line.y + 20)
    ctx.stroke()
  })

  // 粒子
  particles.value.forEach(p => {
    ctx.save()
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.fillStyle = p.color
    ctx.shadowBlur = 8
    ctx.shadowColor = p.color
    ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size)
    ctx.restore()
  })
  ctx.shadowBlur = 0

  // 盒子
  boxes.value.forEach(box => {
    if (box.sliced) return

    ctx.save()
    ctx.translate(box.x + box.w/2, box.y + box.h/2)
    ctx.rotate(box.rotation)

    // 盒子主体
    ctx.fillStyle = box.color
    ctx.strokeStyle = box.color
    ctx.lineWidth = 3
    ctx.shadowBlur = 15
    ctx.shadowColor = box.color

    if (box.type === 'rainbow') {
      const gradient = ctx.createLinearGradient(-box.w/2, -box.h/2, box.w/2, box.h/2)
      gradient.addColorStop(0, '#00ffcc')
      gradient.addColorStop(0.5, '#d946ef')
      gradient.addColorStop(1, '#fbbf24')
      ctx.fillStyle = gradient
      ctx.strokeStyle = gradient
    }

    ctx.strokeRect(-box.w/2, -box.h/2, box.w, box.h)
    ctx.fillRect(-box.w/2 + 3, -box.h/2 + 3, box.w - 6, box.h - 6)

    // 炸弹标记
    if (box.type === 'bomb') {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(-8, -8)
      ctx.lineTo(8, 8)
      ctx.moveTo(8, -8)
      ctx.lineTo(-8, 8)
      ctx.stroke()
    }

    ctx.restore()
  })
  ctx.shadowBlur = 0

  // 切割轨迹
  if (sliceTrail.value.length >= 2) {
    ctx.strokeStyle = '#00ffcc'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowBlur = 15
    ctx.shadowColor = '#00ffcc'

    ctx.beginPath()
    ctx.moveTo(sliceTrail.value[0].x, sliceTrail.value[0].y)
    for (let i = 1; i < sliceTrail.value.length; i++) {
      ctx.globalAlpha = sliceTrail.value[i].life
      ctx.lineTo(sliceTrail.value[i].x, sliceTrail.value[i].y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1.0
  }
  ctx.shadowBlur = 0
}

const gameLoop = () => {
  if (gameStatus.value === 'playing') {
    updatePhysics()
  }
  render()
  if (gameStatus.value !== 'ready') {
    gameLoopId = requestAnimationFrame(gameLoop)
  }
}


// --- 交互控制 ---
const handleSliceStart = (e: MouseEvent | TouchEvent) => {
  if (gameStatus.value !== 'playing') return
  isSlicing = true
  sliceTrail.value = []
  addTrailPoint(e)
}

const handleSliceMove = (e: MouseEvent | TouchEvent) => {
  if (!isSlicing || gameStatus.value !== 'playing') return
  addTrailPoint(e)
}

const handleSliceEnd = () => {
  isSlicing = false
}

const addTrailPoint = (e: MouseEvent | TouchEvent) => {
  const rect = gameCanvas.value!.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
  const scaleX = canvasWidth.value / rect.width
  const scaleY = canvasHeight.value / rect.height

  sliceTrail.value.push({
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
    life: 1.0
  })

  // 限制轨迹长度
  if (sliceTrail.value.length > 20) {
    sliceTrail.value.shift()
  }
}

const handleStartPause = () => {
  playSound(sounds.btn)
  if (gameStatus.value === 'ready' || gameStatus.value === 'gameover') {
    startGame()
  } else if (gameStatus.value === 'playing') {
    gameStatus.value = 'paused'
  } else if (gameStatus.value === 'paused') {
    gameStatus.value = 'playing'
    gameLoopId = requestAnimationFrame(gameLoop)
  }
}

const backToMenu = () => {
  playSound(sounds.btn)
  gameStatus.value = 'ready'
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
  gameLoopId = null
}

onMounted(() => {
  bestScore.value = parseInt(localStorage.getItem('retroSlicerBest') || '0')
  initGridLines()
  render()
  fetchRankings()
  fetchHistory()
})

onUnmounted(() => {
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
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
  --btn-system: #565f89;
}

* { user-select: none; -webkit-touch-callout: none; box-sizing: border-box; }

.yuemu-retro-slice-universe {
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

.hud-bar { display: flex; justify-content: space-between; padding: 8px 10px; border-bottom: 2px solid var(--pixel-color); background: rgba(0,0,0,0.4); }
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 4px;}
.hud-label { font-size: 8px; color: var(--pixel-color); opacity: 0.8; }
.hud-val { font-size: 12px; color: var(--pixel-color); }

.canvas-container { position: relative; display: flex; justify-content: center; align-items: center; padding: 10px; }
.game-canvas { image-rendering: pixelated; width: 100%; height: auto; max-width: 400px; touch-action: none; cursor: crosshair;}
.blur-effect { filter: blur(2px) brightness(0.6); transition: filter 0.3s; }

.shake { animation: shake 0.2s; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}


.combo-display {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 15; pointer-events: none;
  animation: comboPopup 0.5s ease-out;
}

@keyframes comboPopup {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.combo-text {
  font-size: 24px; color: #fbbf24; text-shadow: 0 0 20px #fbbf24, 2px 2px 0 rgba(0,0,0,0.5);
  display: block; white-space: nowrap;
}

.combo-3 .combo-text { font-size: 28px; color: #d946ef; text-shadow: 0 0 25px #d946ef, 2px 2px 0 rgba(0,0,0,0.5); }
.combo-5 .combo-text { font-size: 32px; color: #00ffcc; text-shadow: 0 0 30px #00ffcc, 2px 2px 0 rgba(0,0,0,0.5); }

.screen-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(11, 16, 33, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 20; color: #fff; text-align: center; padding: 20px; backdrop-filter: blur(2px);
}

.pixel-title { font-size: 24px; margin-bottom: 15px; text-shadow: 2px 2px 0px rgba(0,0,0,0.5); }
.neon-cyan { color: #00ffcc; text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc;}
.neon-red { color: #ef4444; text-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444;}
.neon-yellow { color: #fbbf24; text-shadow: 0 0 10px #fbbf24, 0 0 20px #fbbf24;}

.action-hints { margin-top: auto; display: flex; flex-direction: column; gap: 10px; font-size: 10px; line-height: 1.6;}
.desc { opacity: 0.7; font-family: 'SimHei', sans-serif;}
.warning-text { color: #fbbf24; opacity: 1; font-weight: bold; }

.clickable-hint { cursor: pointer; padding: 10px; border-radius: 4px; background: rgba(255,255,255,0.1);}
.clickable-hint:active { transform: scale(0.95); }

.results { margin: 20px 0; display: flex; flex-direction: column; gap: 12px; font-size: 12px; text-align: left; width: 80%; max-width: 250px;}

.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
.mt-2 { margin-top: 10px; }
.mt-4 { margin-top: 20px; }

.control-panel { flex: 1; display: flex; justify-content: center; align-items: flex-end; padding: 10px 0; }

/* =========================================
   PC 端右侧聚合控制台布局 (屏幕在左，按键在右)
   ========================================= */
@media screen and (min-width: 769px) {
  .arcade-console {
    display: grid;
    grid-template-columns: 1fr 220px;
    grid-template-rows: auto min-content min-content 1fr;
    grid-template-areas:
      "header header"
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
  
  .system-section { grid-area: sys; justify-content: center; align-items: flex-start; padding-top: 10px; }
  
  .sys-btn-group { transform: none; gap: 30px; }

  .diagnostic-trigger-bar { 
    grid-area: diag; 
    flex-direction: column; 
    justify-content: flex-start; 
    padding: 0; 
    margin-top: 20px; 
    width: 100%;
    margin-bottom: 0;
  }
}

.system-section { display: flex; align-items: flex-end; padding-bottom: 20px; }
.sys-btn-group { display: flex; gap: 20px; transform: rotate(-15deg); }
.sys-btn { background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.1s; }
.sys-btn:active { transform: scale(0.95); }
.pill { width: 60px; height: 18px; background: var(--btn-system); border-radius: 12px; box-shadow: 3px 3px 6px rgba(0,0,0,0.3), inset 2px 2px 3px rgba(255,255,255,0.4); position: relative; display: flex; align-items: center; justify-content: center; }
.pill-icon { font-size: 14px; }
.sys-btn:active .pill { transform: translate(1px, 1px); box-shadow: inset 2px 2px 4px rgba(0,0,0,0.6); }
.sys-label { font-size: 10px; color: var(--text-main); font-weight: bold; letter-spacing: 1px; }

.sound-btn.active .pill { background: linear-gradient(135deg, #34c759, #b4ec51); box-shadow: 0 0 8px rgba(52, 199, 89, 0.5), 2px 2px 4px rgba(0,0,0,0.3); }
.start-btn .pill { background: linear-gradient(135deg, #007aff, #00c6ff); box-shadow: 0 0 8px rgba(0, 122, 255, 0.5), 2px 2px 4px rgba(0,0,0,0.3); }

@media screen and (max-width: 768px) {
  .yuemu-retro-slice-universe { padding: 10px 5px; }
  .arcade-console { border-radius: 0; border: none; box-shadow: none; padding: 10px 5px; gap: 10px; height: 100%; max-height: 100dvh; min-height: unset; width: 100%; justify-content: center; }
  .screen-bezel { padding: 10px 15px 15px 15px; border-radius: 8px 8px 20px 8px; }

  .control-panel { padding: 0 5px 10px 5px; }
  .sys-btn-group { transform: none; gap: 80px; }
  .pill { width: 70px; height: 20px; border-radius: 14px; }
  .pill-icon { font-size: 16px; }
  .sys-label { font-size: 11px; opacity: 0.9; }
}

@media screen and (max-width: 360px) {
  .sys-btn-group { gap: 60px; }
  .pill { width: 60px; height: 18px; }
  .pill-icon { font-size: 14px; }
  .sys-label { font-size: 10px; }
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

/* === 极客诊断通道按钮 (防挤压街机控制，纯中文) === */
.diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
  padding: 0 30px;
  margin-bottom: 10px;
}
.mini-diag-btn {
  flex: 1;
  background: var(--console-detail);
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
.mini-diag-btn .sys-icon { font-size: 14px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.mini-diag-btn .sys-text { font-size: 8px; color: var(--text-main); font-weight: bold; }

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
  background: var(--console-border); border: 2px solid var(--console-border); border-radius: 50%;
}
.screw::after {
  content: ''; position: absolute; top: 50%; left: 2px; right: 2px; height: 2px;
  background: var(--console-body); transform: translateY(-50%) rotate(45deg);
}
.top-left { top: 12px; left: 12px; }
.top-right { top: 12px; right: 12px; }
.bottom-left { bottom: 12px; left: 12px; }
.bottom-right { bottom: 12px; right: 12px; }

.brand-plate {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 2px solid var(--console-border); padding-bottom: 8px;
}
.model-name {
  font-family: inherit; font-weight: 900; font-size: 10px; letter-spacing: 1px;
}
.terminal-title {
  color: var(--pixel-color);
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
  font-size: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.tab-btn.active {
  color: var(--pixel-color);
  background-color: rgba(0, 255, 204, 0.1);
  border: 1px solid rgba(0, 255, 204, 0.3);
  text-shadow: 0 0 8px rgba(0, 255, 204, 0.6);
}

.tab-btn:hover {
  color: var(--pixel-color);
}

.terminal-screen {
  position: relative;
  flex: 1;
  background-color: #020603;
  border: 4px solid var(--console-border);
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
  font-size: 7px;
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
  font-size: 7px;
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
  font-size: 7px;
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
  font-size: 8px;
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
  font-size: 7px;
  font-weight: bold;
  padding: 4px 10px;
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
  font-size: 7px;
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
  padding: 8px 0;
  font-size: 8px;
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
</style>
