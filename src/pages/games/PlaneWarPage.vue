<template>
  <div class="yuemu-retro-snake-universe" @touchmove.prevent>
    <div class="arcade-console">

      <div class="console-header">
        <div class="brand">
          <span class="brand-name">{{ t('pages.games.planeWarPage.starAssault') }}</span>
          <span class="brand-model">STRIKER-89</span>
        </div>
        <div class="speaker-grill">
          <div class="dot" v-for="i in 12" :key="i"></div>
        </div>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.planeWarPage.highScore') }}</span>
              <span class="hud-val">{{ bestScore }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.planeWarPage.score') }}</span>
              <span class="hud-val">{{ score }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.planeWarPage.levelLives') }}</span>
              <span class="hud-val flex-hearts">Lv{{ level }} <i v-for="i in Math.max(0, lives)" :key="i" class="fas fa-heart text-red"></i></span>
            </div>
          </div>

          <div class="canvas-container crt-effect">
            <canvas
              ref="gameCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="game-canvas"
              :class="{ 'blur-effect': gameStatus !== 'playing' }"
              @mousedown="handlePointerDown"
              @mousemove="handlePointerMove"
              @mouseup="handlePointerUp"
              @mouseleave="handlePointerUp"
              @touchstart.prevent="handlePointerDown"
              @touchmove.prevent="handlePointerMove"
              @touchend.prevent="handlePointerUp"
            ></canvas>

            <div v-if="gameStatus === 'ready'" class="screen-overlay menu-overlay">
              <h1 class="pixel-title neon-cyan">{{ t('pages.games.planeWarPage.planeWar') }}</h1>
              <div class="action-hints">
                <p class="desc">{{ t('pages.games.planeWarPage.dragOrArrowKeys') }}</p>
                <p class="desc mt-2">{{ t('pages.games.planeWarPage.autoShootPickProps') }}</p>
                <p class="blink mt-4 clickable-hint" @click="startGame">{{ t('pages.games.planeWarPage.pressStartGame') }}</p>
              </div>
            </div>

            <div v-if="gameStatus === 'gameover'" class="screen-overlay game-over-overlay">
              <h1 class="pixel-title neon-red">{{ t('pages.games.planeWarPage.gameOver') }}</h1>
              <div class="results">
                <p> {{ t('pages.games.planeWarPage.finalScoreLabel') }} <span class="neon-cyan">{{ score }}</span></p>
                <p>{{ t('pages.games.planeWarPage.arrivedLevel', { level: level }) }}</p>
                <p>{{ t('pages.games.planeWarPage.enemiesDestroyedCount', { enemies: enemiesDestroyed }) }}</p>
              </div>
              <div class="action-hints">
                <p class="blink clickable-hint" @click="startGame">{{ t('pages.games.planeWarPage.pressStartToRetryBracket') }}</p>
                <p class="clickable-hint" @click="backToMenu">{{ t('pages.games.planeWarPage.pressBReturnMenu') }}</p>
              </div>
            </div>

            <div v-if="gameStatus === 'paused'" class="screen-overlay pause-overlay">
              <h1 class="pixel-title blink neon-yellow">{{ t('pages.games.planeWarPage.pause') }}</h1>
              <div class="action-hints">
                <p class="clickable-hint mt-4" @click="handleStartPause">{{ t('pages.games.planeWarPage.pressStartContinue') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 极客诊断通道按钮 (防挤压街机控制，纯中文) -->
      <div class="yuemu-diagnostic-trigger-bar">
        <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
          <span class="yuemu-sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.planeWarPage.leaderboardBracket') }}</span>
        </button>
        <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
          <span class="yuemu-sys-icon"><i class="fas fa-history"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.planeWarPage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">

        <div class="d-pad-section">
          <div class="d-pad">
            <div class="d-row">
              <button class="d-btn up"><i class="d-icon"><i class="fas fa-caret-up"></i></i></button>
            </div>
            <div class="d-row center-row">
              <button class="d-btn left" @touchstart.prevent="handleButtonMove(-1)" @touchend.prevent="handleButtonMove(0)" @mousedown="handleButtonMove(-1)" @mouseup="handleButtonMove(0)" @mouseleave="handleButtonMove(0)">
                <i class="d-icon"><i class="fas fa-caret-left"></i></i>
              </button>
              <div class="d-center"><div class="d-center-dent"></div></div>
              <button class="d-btn right" @touchstart.prevent="handleButtonMove(1)" @touchend.prevent="handleButtonMove(0)" @mousedown="handleButtonMove(1)" @mouseup="handleButtonMove(0)" @mouseleave="handleButtonMove(0)">
                <i class="d-icon"><i class="fas fa-caret-right"></i></i>
              </button>
            </div>
            <div class="d-row">
              <button class="d-btn down"><i class="d-icon"><i class="fas fa-caret-down"></i></i></button>
            </div>
          </div>
        </div>

        <div class="system-section">
          <div class="sys-btn-group">
            <button class="sys-btn sound-btn" @click="toggleSound" :class="{ 'active': isSoundEnabled }">
              <div class="pill">
                <span class="pill-icon">
                  <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
                </span>
              </div>
              <span class="sys-label">{{ t('pages.games.planeWarPage.sound') }}</span>
            </button>
            <button class="sys-btn start-btn" @click="handleStartPause">
              <div class="pill">
                <span class="pill-icon">
                  <i :class="gameStatus === 'playing' ? 'fas fa-pause' : 'fas fa-play'"></i>
                </span>
              </div>
              <span class="sys-label">{{ gameStatus === 'playing' ? t('pages.games.planeWarPage.pause') : t('pages.games.planeWarPage.start') }}</span>
            </button>
          </div>
        </div>

        <div class="action-section">
          <div class="action-buttons">
            <div class="btn-wrapper">
              <button class="a-btn b-btn" @click="handleBPress">B</button>
            </div>
            <div class="btn-wrapper">
              <button class="a-btn a-btn-main" @click="handleStartPause">A</button>
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
          <span class="model-name terminal-title">{{ t('pages.games.planeWarPage.monitorDiagnosticR09') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.planeWarPage.rankBracket') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.planeWarPage.historyBracket') }}
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
              <span class="filter-label">{{ t('pages.games.planeWarPage.levelFilterArrow') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.planeWarPage.allLevels') }}</option>
                <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>

            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.planeWarPage.ranking') }}</span>
              <span>{{ t('pages.games.planeWarPage.matchTerminal') }}</span>
              <span>{{ t('pages.games.planeWarPage.highestScoreLabel') }}</span>
              <span>{{ t('pages.games.planeWarPage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.planeWarPage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.planeWarPage.noFlightLog') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.planeWarPage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.planeWarPage.scorePoints', { score: item.score }) }}</span>
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
                {{ t('pages.games.planeWarPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.planeWarPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.planeWarPage.accessTime') }}</span>
              <span>{{ t('pages.games.planeWarPage.assaultDifficulty') }}</span>
              <span>{{ t('pages.games.planeWarPage.scoreRecord') }}</span>
              <span>{{ t('pages.games.planeWarPage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.planeWarPage.readingPhysicsArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.planeWarPage.noFlightLog') }}记录
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.planeWarPage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.planeWarPage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.planeWarPage.assaultSuccess') : t('pages.games.planeWarPage.crashed') }}
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
                {{ t('pages.games.planeWarPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.planeWarPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.planeWarPage.closeDiagTerminal') }}
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

// --- 游戏状态管理 ---
type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover'
const gameStatus = ref<GameStatus>('ready')

const gameCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(400)
const canvasHeight = ref(400) // 保持 1:1 比例与原容器兼容

const score = ref(0)
const bestScore = ref(0)
const level = ref(1)
const lives = ref(3)
const enemiesDestroyed = ref(0)

const router = useRouter()
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)

// --- 排行榜 & 历史记录诊断微端状态 ---
const isTerminalOpen = ref(false)
const activeTab = ref<'ranking' | 'history'>('ranking')

const rankings = ref<any[]>([])
const rankingLoading = ref(false)
const rankPage = ref(1)
const totalRankPages = ref(1)
const selectedRankLevel = ref('')
const levelOptions = ['Lv.1', 'Lv.2', 'Lv.3', 'Lv.4', 'Lv.5', 'Lv.6']

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
      gameType: 'plane_war',
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
    console.error(t('pages.games.planeWarPage.getPlaneWarRankError'), err)
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
      gameType: 'plane_war',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.planeWarPage.getPlaneWarHistoryError'), err)
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

const saveScore = async () => {
  if (score.value <= 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.planeWarPage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'plane_war',
      level: `Lv.${level.value}`,
      score: score.value
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.planeWarPage.reportPlaneWarScoreError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.planeWarPage.unknown')
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// --- 音效系统 (原生 Audio) ---
const isSoundEnabled = ref(true)
const sounds = {
  shoot: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  explode: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href),
  score: new Audio(new URL('@/assets/sounds/match.MP3', import.meta.url).href),
  powerup: new Audio(new URL('@/assets/sounds/powerup.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  gameover: new Audio(new URL('@/assets/sounds/gameover.MP3', import.meta.url).href),
  btn: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href)
}

sounds.shoot.volume = 0.05
sounds.explode.volume = 0.3
sounds.score.volume = 0.3
sounds.powerup.volume = 0.3
sounds.start.volume = 0.3
sounds.gameover.volume = 0.3
sounds.btn.volume = 0.2

const playSound = (audio: HTMLAudioElement) => {
  if (!isSoundEnabled.value) return
  audio.currentTime = 0
  audio.play().catch(() => {})
}
const toggleSound = () => { isSoundEnabled.value = !isSoundEnabled.value; playSound(sounds.btn) }

// --- 物理实体定义 ---
interface Rect { x: number, y: number, w: number, h: number }
interface Star { x: number, y: number, size: number, speed: number, alpha: number }
interface Bullet extends Rect { speed: number, isEnemy: boolean, color: string }
interface Enemy extends Rect { type: 'small'|'medium'|'large', hp: number, maxHp: number, speed: number, pts: number, color: string }
interface Prop extends Rect { type: 'shield'|'double'|'life', color: string, speed: number }
interface Particle { x: number, y: number, vx: number, vy: number, life: number, decay: number, color: string, size: number }

const player = ref({
  x: 185, y: 350, w: 30, h: 30, speed: 6,
  fireTimer: 0, fireRate: 15,
  doubleFireTime: 0, shieldTime: 0,
  moveDir: 0 // -1: left, 1: right (用于按钮控制)
})

const bullets = ref<Bullet[]>([])
const enemies = ref<Enemy[]>([])
const props = ref<Prop[]>([])
const particles = ref<Particle[]>([])
const stars = ref<Star[]>([])

let gameLoopId: number | null = null
let lastTime = 0
let enemySpawnTimer = 0

// --- 物理与碰撞 ---
const checkCollision = (r1: Rect, r2: Rect) => {
  // 添加2像素的容错空间，避免过于敏感的碰撞
  const margin = 2
  return r1.x + margin < r2.x + r2.w - margin &&
    r1.x + r1.w - margin > r2.x + margin &&
    r1.y + margin < r2.y + r2.h - margin &&
    r1.y + r1.h - margin > r2.y + margin
}

const spawnExplosion = (x: number, y: number, color: string, count: number = 15) => {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 4 + 1
    particles.value.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0, decay: Math.random() * 0.05 + 0.02, color,
      size: Math.random() * 3 + 1
    })
  }
}

// --- 核心逻辑 ---
const initStars = () => {
  stars.value = []
  for (let i = 0; i < 40; i++) {
    stars.value.push({
      x: Math.random() * canvasWidth.value,
      y: Math.random() * canvasHeight.value,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1
    })
  }
}

const startGame = () => {
  score.value = 0
  level.value = 1
  lives.value = 3
  enemiesDestroyed.value = 0

  player.value.x = canvasWidth.value / 2 - player.value.w / 2
  player.value.y = canvasHeight.value - player.value.h - 10
  player.value.doubleFireTime = 0
  player.value.shieldTime = 180 // 出生无敌保护 (3秒)

  bullets.value = []
  enemies.value = []
  props.value = []
  particles.value = []

  initStars()
  gameStatus.value = 'playing'
  playSound(sounds.start)

  lastTime = performance.now()
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
  gameLoopId = requestAnimationFrame(gameLoop)
}

const hitPlayer = () => {
  if (player.value.shieldTime > 0) return
  playSound(sounds.explode)
  spawnExplosion(player.value.x + player.value.w/2, player.value.y + player.value.h/2, '#00ffcc', 30)

  lives.value--
  if (lives.value <= 0) {
    gameStatus.value = 'gameover'
    playSound(sounds.gameover)
    if (score.value > bestScore.value) {
      bestScore.value = score.value
      localStorage.setItem('retroShooterBest', bestScore.value.toString())
    }
    saveScore()
  } else {
    player.value.shieldTime = 180 // 受伤保护 (3秒)
    player.value.doubleFireTime = 0
  }
}

const spawnEnemy = () => {
  const rand = Math.random()
  let type: 'small'|'medium'|'large', w, h, hp, speed, pts, color

  const medChance = Math.min(0.2 + level.value * 0.05, 0.4)
  const lrgChance = Math.min(0.05 + level.value * 0.02, 0.15)

  if (rand < lrgChance) {
    type = 'large'; w = 40; h = 40; hp = 10 + level.value; speed = 0.8; pts = 5; color = '#ef4444' // 红
  } else if (rand < medChance + lrgChance) {
    type = 'medium'; w = 26; h = 26; hp = 3 + Math.floor(level.value/2); speed = 1.5; pts = 3; color = '#f97316' // 橙
  } else {
    type = 'small'; w = 18; h = 18; hp = 1; speed = 2.5 + level.value * 0.2; pts = 1; color = '#d946ef' // 紫
  }

  enemies.value.push({
    x: Math.random() * (canvasWidth.value - w),
    y: -h, w, h, type, hp, maxHp: hp, speed, pts, color
  })
}

const spawnProp = (x: number, y: number) => {
  if (Math.random() > 0.12) return // 12% 掉落率
  const types: ('shield'|'double'|'life')[] = ['shield', 'double', 'life']
  const type = types[Math.floor(Math.random() * types.length)]
  let color = '#00ffcc'
  if (type === 'double') color = '#f0abfc'
  if (type === 'life') color = '#10b981'

  props.value.push({ x, y, w: 18, h: 18, type, color, speed: 1.5 })
}

const updatePhysics = () => {
  const p = player.value

  // 1. 玩家移动
  if (keys['ArrowLeft'] || p.moveDir === -1) p.x -= p.speed
  if (keys['ArrowRight'] || p.moveDir === 1) p.x += p.speed
  p.x = Math.max(0, Math.min(canvasWidth.value - p.w, p.x))

  // 2. 玩家自动射击
  p.fireTimer++
  if (p.fireTimer >= Math.max(8, p.fireRate - level.value)) { // 射速随关卡略微提升
    p.fireTimer = 0
    playSound(sounds.shoot)
    if (p.doubleFireTime > 0) {
      bullets.value.push({ x: p.x + 2, y: p.y, w: 4, h: 12, speed: 8, isEnemy: false, color: '#00ffcc' })
      bullets.value.push({ x: p.x + p.w - 6, y: p.y, w: 4, h: 12, speed: 8, isEnemy: false, color: '#00ffcc' })
    } else {
      bullets.value.push({ x: p.x + p.w/2 - 2, y: p.y, w: 4, h: 12, speed: 8, isEnemy: false, color: '#00ffcc' })
    }
  }

  // 状态衰减
  if (p.shieldTime > 0) p.shieldTime--
  if (p.doubleFireTime > 0) p.doubleFireTime--

  // 尾焰粒子
  if (Math.random() < 0.6) {
    particles.value.push({
      x: p.x + p.w/2 + (Math.random()*8 - 4), y: p.y + p.h,
      vx: 0, vy: Math.random() * 2 + 2, life: 1, decay: 0.1, color: '#00ffcc', size: 2
    })
  }

  // 3. 星空背景
  stars.value.forEach(star => {
    star.y += star.speed
    if (star.y > canvasHeight.value) {
      star.y = 0; star.x = Math.random() * canvasWidth.value
    }
  })

  // 4. 生成敌机
  enemySpawnTimer++
  const spawnThreshold = Math.max(40, 120 - level.value * 8)
  if (enemySpawnTimer > spawnThreshold) {
    enemySpawnTimer = 0; spawnEnemy()
  }

  // 5. 更新子弹
  for (let i = bullets.value.length - 1; i >= 0; i--) {
    const b = bullets.value[i]
    b.y += b.isEnemy ? b.speed : -b.speed
    if (b.y < -50 || b.y > canvasHeight.value + 50) {
      bullets.value.splice(i, 1); continue
    }
    // 敌方子弹打玩家
    if (b.isEnemy && checkCollision(b, p)) {
      bullets.value.splice(i, 1); hitPlayer()
    }
  }

  // 6. 更新道具
  for (let i = props.value.length - 1; i >= 0; i--) {
    const pr = props.value[i]
    pr.y += pr.speed
    if (pr.y > canvasHeight.value + 50) {
      props.value.splice(i, 1); continue
    }
    if (checkCollision(pr, p)) {
      playSound(sounds.powerup)
      if (pr.type === 'shield') p.shieldTime = 300
      if (pr.type === 'double') p.doubleFireTime = 400
      if (pr.type === 'life') lives.value = Math.min(5, lives.value + 1)
      props.value.splice(i, 1)
    }
  }

  // 7. 更新敌机与碰撞
  for (let i = enemies.value.length - 1; i >= 0; i--) {
    const e = enemies.value[i]
    e.y += e.speed

    // 敌机发子弹 (中大型)
    if (e.type !== 'small' && Math.random() < 0.008 + level.value * 0.002) {
      bullets.value.push({ x: e.x + e.w/2 - 2, y: e.y + e.h, w: 4, h: 8, speed: 4, isEnemy: true, color: '#fca5a5' })
    }

    // 撞击玩家 - 修复：只有在护盾失效时才销毁敌机
    if (checkCollision(e, p)) {
      const hadShield = p.shieldTime > 0
      hitPlayer()
      if (!hadShield) {
        // 没有护盾时，敌机撞毁但不给分
        spawnExplosion(e.x + e.w/2, e.y + e.h/2, e.color, 15)
        enemies.value.splice(i, 1)
        continue
      }
      // 有护盾时，敌机反弹
    }

    // 玩家子弹打敌机
    for (let j = bullets.value.length - 1; j >= 0; j--) {
      const b = bullets.value[j]
      if (!b.isEnemy && checkCollision(b, e)) {
        e.hp--; bullets.value.splice(j, 1)
        spawnExplosion(b.x, b.y, '#fff', 3)
        if (e.hp <= 0) break
      }
    }

    // 死亡处理
    if (e.y > canvasHeight.value + 50) {
      enemies.value.splice(i, 1)
    } else if (e.hp <= 0) {
      playSound(sounds.score)
      spawnExplosion(e.x + e.w/2, e.y + e.h/2, e.color, e.w === 40 ? 30 : 15)
      spawnProp(e.x + e.w/2 - 9, e.y + e.h/2 - 9)

      score.value += e.pts
      enemiesDestroyed.value++
      if (enemiesDestroyed.value % 20 === 0) {
        level.value++; playSound(sounds.powerup)
      }
      enemies.value.splice(i, 1)
    }
  }

  // 8. 更新粒子
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const pt = particles.value[i]
    pt.x += pt.vx; pt.y += pt.vy; pt.life -= pt.decay
    if (pt.life <= 0) particles.value.splice(i, 1)
  }
}

// --- 渲染引擎 (Canvas 2D) ---
const render = () => {
  const ctx = gameCanvas.value?.getContext('2d')
  if (!ctx) return

  const w = canvasWidth.value
  const h = canvasHeight.value

  // 获取外壳的主题色变量
  const style = getComputedStyle(document.body)
  const uiBgColor = style.getPropertyValue('--screen-bg').trim() || '#8bac0f'
  // 但是对于内部画布，我们强制使用深色星空，因为霓虹效果在亮色下看不见
  ctx.fillStyle = '#0B1021'
  ctx.fillRect(0, 0, w, h)

  // 1. 星空
  ctx.fillStyle = '#ffffff'
  stars.value.forEach(star => {
    ctx.globalAlpha = star.alpha
    ctx.fillRect(star.x, star.y, star.size, star.size)
  })
  ctx.globalAlpha = 1.0

  // 2. 粒子
  particles.value.forEach(pt => {
    ctx.globalAlpha = Math.max(0, pt.life)
    ctx.fillStyle = pt.color
    ctx.shadowBlur = 8
    ctx.shadowColor = pt.color
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size)
  })
  ctx.globalAlpha = 1.0; ctx.shadowBlur = 0

  // 3. 道具
  props.value.forEach(pr => {
    ctx.strokeStyle = pr.color; ctx.lineWidth = 2
    ctx.shadowBlur = 8; ctx.shadowColor = pr.color
    ctx.strokeRect(pr.x, pr.y, pr.w, pr.h)

    ctx.fillStyle = pr.color; ctx.font = '10px Arial'; ctx.textAlign = 'center'
    let icon = 'S'
    if (pr.type === 'double') icon = 'D'
    if (pr.type === 'life') icon = '♥'
    ctx.fillText(icon, pr.x + pr.w/2, pr.y + pr.h/2 + 3)
  })
  ctx.shadowBlur = 0

  // 4. 子弹
  bullets.value.forEach(b => {
    ctx.fillStyle = b.color
    ctx.shadowBlur = 5; ctx.shadowColor = b.color
    ctx.fillRect(b.x, b.y, b.w, b.h)
  })
  ctx.shadowBlur = 0

  // 5. 敌机
  enemies.value.forEach(e => {
    ctx.fillStyle = e.color
    ctx.shadowBlur = 10; ctx.shadowColor = e.color

    ctx.save(); ctx.translate(e.x + e.w/2, e.y + e.h/2)
    ctx.beginPath()
    if (e.type === 'small') { // 倒三角
      ctx.moveTo(0, e.h/2); ctx.lineTo(-e.w/2, -e.h/2); ctx.lineTo(e.w/2, -e.h/2)
    } else if (e.type === 'medium') { // 菱形
      ctx.moveTo(0, -e.h/2); ctx.lineTo(e.w/2, 0); ctx.lineTo(0, e.h/2); ctx.lineTo(-e.w/2, 0)
    } else { // 六边形
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i
        ctx.lineTo(Math.cos(angle) * e.w/2, Math.sin(angle) * e.h/2)
      }
    }
    ctx.closePath(); ctx.fill(); ctx.restore()

    if (e.type === 'large') {
      ctx.fillStyle = '#444'; ctx.fillRect(e.x, e.y - 6, e.w, 3)
      ctx.fillStyle = '#10b981'; ctx.fillRect(e.x, e.y - 6, e.w * (e.hp / e.maxHp), 3)
    }
  })
  ctx.shadowBlur = 0

  // 6. 玩家
  const p = player.value
  if (gameStatus.value === 'playing' || gameStatus.value === 'gameover') {
    if (p.shieldTime > 0 && Math.floor(performance.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }

    ctx.save(); ctx.translate(p.x + p.w/2, p.y + p.h/2)
    ctx.shadowBlur = 15; ctx.shadowColor = '#00ffcc'

    // 机身
    ctx.fillStyle = '#00ffcc'
    ctx.beginPath()
    ctx.moveTo(0, -p.h/2)
    ctx.lineTo(-p.w/2, p.h/2)
    ctx.lineTo(0, p.h/4)
    ctx.lineTo(p.w/2, p.h/2)
    ctx.closePath(); ctx.fill()

    // 核心
    ctx.fillStyle = '#0B1021'
    ctx.beginPath(); ctx.moveTo(0, -p.h/4); ctx.lineTo(-3, 0); ctx.lineTo(3, 0)
    ctx.closePath(); ctx.fill()
    ctx.restore()
    ctx.globalAlpha = 1.0

    // 护盾光圈
    if (p.shieldTime > 0) {
      ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(p.x + p.w/2, p.y + p.h/2, p.w * 0.8, 0, Math.PI * 2); ctx.stroke()
    }
  }
}

const gameLoop = (timestamp: number) => {
  if (gameStatus.value === 'playing') {
    updatePhysics()
  }
  render()
  if (gameStatus.value !== 'ready') {
    gameLoopId = requestAnimationFrame(gameLoop)
  }
}

// --- 交互控制 (键盘 & 触控拖拽) ---
const keys: Record<string, boolean> = {}
const handleKeydown = (e: KeyboardEvent) => {
  if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
  keys[e.key] = true
  if (e.key === ' ' || e.key === 'Enter') handleStartPause()
}
const handleKeyup = (e: KeyboardEvent) => { keys[e.key] = false }

// 虚拟按钮
const handleButtonMove = (dir: number) => { player.value.moveDir = dir }
const handleStartPause = () => {
  playSound(sounds.btn)
  if (gameStatus.value === 'ready' || gameStatus.value === 'gameover') startGame()
  else if (gameStatus.value === 'playing') gameStatus.value = 'paused'
  else if (gameStatus.value === 'paused') {
    gameStatus.value = 'playing'
    lastTime = performance.now()
    gameLoopId = requestAnimationFrame(gameLoop)
  }
}
const handleBPress = () => {
  playSound(sounds.btn)
  if (gameStatus.value === 'paused' || gameStatus.value === 'gameover') backToMenu()
}

const backToMenu = () => {
  gameStatus.value = 'ready'
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
  gameLoopId = null
}

// 拖拽逻辑 - 优化触控跟手性
let isDragging = false
const handlePointerDown = (e: MouseEvent | TouchEvent) => {
  if (gameStatus.value !== 'playing') return
  isDragging = true
  updatePlayerPosByPointer(e)
}
const handlePointerMove = (e: MouseEvent | TouchEvent) => {
  if (gameStatus.value !== 'playing') return
  // 触摸事件始终响应，鼠标事件需要按下
  if ('touches' in e || isDragging) {
    updatePlayerPosByPointer(e)
  }
}
const handlePointerUp = () => { isDragging = false }

const updatePlayerPosByPointer = (e: MouseEvent | TouchEvent) => {
  const rect = gameCanvas.value!.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const scale = canvasWidth.value / rect.width
  // 直接设置位置而非累加，提高跟手性
  let newX = (clientX - rect.left) * scale - player.value.w / 2
  player.value.x = Math.max(0, Math.min(canvasWidth.value - player.value.w, newX))
}

onMounted(() => {
  bestScore.value = parseInt(localStorage.getItem('neonStrikerBest') || '0')
  initStars()
  render()
  window.addEventListener('keydown', handleKeydown, { passive: false })
  window.addEventListener('keyup', handleKeyup)
})

onUnmounted(() => {
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
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

.yuemu-retro-snake-universe {
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
.hud-item.right { align-items: flex-end; }
.hud-label { font-size: 8px; color: var(--pixel-color); opacity: 0.8; }
.hud-val { font-size: 12px; color: var(--pixel-color); }
.text-cyan { color: #00ffcc; text-shadow: 0 0 5px #00ffcc;}
.text-magenta { color: #d946ef; text-shadow: 0 0 5px #d946ef;}
.text-yellow { color: #fbbf24; text-shadow: 0 0 5px #fbbf24;}
.text-red { color: #ef4444; }

.canvas-container { position: relative; display: flex; justify-content: center; align-items: center; padding: 10px; aspect-ratio: 1 / 1; }
.game-canvas { image-rendering: pixelated; width: 100%; height: auto; max-width: 400px; touch-action: none; cursor: crosshair;}
.blur-effect { filter: blur(2px) brightness(0.6); transition: filter 0.3s; }

.screen-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(11, 16, 33, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 20; color: #fff; text-align: center; padding: 20px; backdrop-filter: blur(2px);
}

.pixel-logo { margin-bottom: 20px; animation: float 2s ease-in-out infinite; }
.neon-triangle { width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-bottom: 35px solid #00ffcc; filter: drop-shadow(0 0 10px #00ffcc); }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.pixel-title { font-size: 24px; margin-bottom: 15px; text-shadow: 2px 2px 0px rgba(0,0,0,0.5); }
.neon-cyan { color: #00ffcc; text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc;}
.neon-red { color: #ef4444; text-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444;}
.neon-yellow { color: #fbbf24; text-shadow: 0 0 10px #fbbf24, 0 0 20px #fbbf24;}

.best-score { font-size: 10px; color: #fbbf24; margin-bottom: 10px; }
.action-hints { margin-top: auto; display: flex; flex-direction: column; gap: 10px; font-size: 10px; line-height: 1.6;}
.desc { opacity: 0.7; font-family: 'SimHei', sans-serif;}

.arcade-start-btn {
  background: transparent; border: 2px solid #00ffcc; color: #00ffcc; padding: 12px 20px;
  font-family: inherit; font-size: 12px; cursor: pointer; box-shadow: 0 0 10px rgba(0,255,204,0.3), inset 0 0 10px rgba(0,255,204,0.3);
  border-radius: 4px; transition: all 0.2s;
}
.arcade-start-btn:active { transform: scale(0.95); background: rgba(0,255,204,0.2); }

.clickable-hint { cursor: pointer; padding: 10px; border-radius: 4px; background: rgba(255,255,255,0.1);}
.clickable-hint:active { transform: scale(0.95); }

.results { margin: 20px 0; display: flex; flex-direction: column; gap: 12px; font-size: 12px; text-align: left; width: 80%; max-width: 250px;}
.res-row { display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.2); padding-bottom: 5px;}

.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
.mt-2 { margin-top: 10px; }
.mt-4 { margin-top: 20px; }

/* === 控制面板区 === */
.control-panel { flex: 1; display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 10px 0; }
.d-pad-section { order: 1; flex: 1; display: flex; justify-content: flex-start; }
.system-section { order: 2; display: flex; align-items: flex-end; padding-bottom: 20px; }
.action-section { order: 3; flex: 1; display: flex; justify-content: flex-end; }

.d-pad { display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 50%; box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1); }
.d-row { display: flex; }
.d-btn { width: 35px; height: 35px; background: var(--console-body); border: none; display: flex; justify-content: center; align-items: center; box-shadow: inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.4), 2px 2px 4px rgba(0,0,0,0.3); }
.d-icon { font-family: Arial, sans-serif; color: rgba(255,255,255,0.2); font-size: 12px; font-style: normal; text-shadow: -1px -1px 0 rgba(0,0,0,0.8); }
.d-center { width: 35px; height: 35px; background: var(--console-body); position: relative; }
.d-center-dent { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 15px; height: 15px; border-radius: 50%; background: rgba(0,0,0,0.3); box-shadow: inset 1px 1px 3px rgba(0,0,0,0.8); }
.d-btn.up { border-radius: 4px 4px 0 0; } .d-btn.down { border-radius: 0 0 4px 4px; } .d-btn.left { border-radius: 4px 0 0 4px; } .d-btn.right { border-radius: 0 4px 4px 0; }
.d-btn:active { background: #111; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.8); }

.sys-btn-group { display: flex; gap: 20px; transform: rotate(-15deg); }
.sys-btn { background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.1s; }
.sys-btn:active { transform: scale(0.95); }
.pill { width: 60px; height: 18px; background: var(--btn-system); border-radius: 12px; box-shadow: 3px 3px 6px rgba(0,0,0,0.3), inset 2px 2px 3px rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; position: relative; }
.pill-icon { font-size: 14px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.sys-btn:active .pill { transform: translate(1px, 1px); box-shadow: inset 2px 2px 4px rgba(0,0,0,0.6); }
.sys-label { font-size: 10px; color: var(--text-main); font-weight: bold; letter-spacing: 1px; }

.sound-btn.active .pill { background: linear-gradient(135deg, #34c759, #b4ec51); box-shadow: 0 0 8px rgba(52, 199, 89, 0.5), 2px 2px 4px rgba(0,0,0,0.3); }
.start-btn .pill { background: linear-gradient(135deg, #007aff, #00c6ff); box-shadow: 0 0 8px rgba(0, 122, 255, 0.5), 2px 2px 4px rgba(0,0,0,0.3); }

.action-buttons { display: flex; gap: 15px; transform: rotate(-15deg); background: rgba(0,0,0,0.05); padding: 15px 25px; border-radius: 40px; box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1); }
.btn-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.a-btn { width: 45px; height: 45px; border-radius: 50%; border: none; background: var(--btn-primary); display: flex; justify-content: center; align-items: center; color: rgba(255,255,255,0.7); font-family: Arial, sans-serif; font-size: 18px; font-weight: 900; text-shadow: 1px 1px 1px rgba(0,0,0,0.5); box-shadow: 2px 4px 0 rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.4); cursor: pointer;}
.a-btn.b-btn { background: #eab308; }
.a-btn:active { transform: translate(2px, 4px); box-shadow: inset 2px 2px 6px rgba(0,0,0,0.6); color: rgba(255,255,255,0.5); }
.btn-label { font-size: 8px; color: var(--text-main); font-family: sans-serif; font-weight: bold;}

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
  
  .d-pad-section { grid-area: d-pad; justify-content: center; align-items: flex-end; padding-bottom: 10px; }
  .action-section { grid-area: actions; justify-content: center; align-items: center; }
  .system-section { grid-area: sys; justify-content: center; align-items: flex-start; padding-top: 10px; }
  
  .sys-btn-group { transform: none; gap: 30px; }

  .yuemu-diagnostic-trigger-bar { 
    grid-area: diag; 
    flex-direction: column; 
    justify-content: flex-start; 
    padding: 0; 
    margin-top: 20px; 
    width: 100%;
  }
}

@media screen and (max-width: 768px) {
  .yuemu-retro-snake-universe { padding: 10px 5px; }
  .arcade-console { border-radius: 0; border: none; box-shadow: none; padding: 10px 5px; gap: 10px; height: 100%; max-height: 100dvh; min-height: unset; width: 100%; justify-content: center; }
  .screen-bezel { padding: 10px 15px 15px 15px; border-radius: 8px 8px 20px 8px; }

  .control-panel { flex-direction: row; flex-wrap: wrap; padding: 0 5px 10px 5px; gap: 10px 0; align-items: flex-end; }
  .system-section { order: 1; width: 100%; justify-content: center; padding-bottom: 10px; }
  .sys-btn-group { transform: none; gap: 80px; }
  .pill { width: 70px; height: 20px; border-radius: 14px; }
  .pill-icon { font-size: 16px; }
  .sys-label { font-size: 11px; opacity: 0.9; }

  .d-pad-section { order: 2; flex: 1; }
  .d-pad { padding: 5px; }
  .d-btn, .d-center { width: 48px; height: 48px; }
  .d-icon { font-size: 16px; }

  .action-section { order: 3; flex: 1; }
  .action-buttons { padding: 10px; gap: 12px; }
  .a-btn { width: 48px; height: 48px; font-size: 18px; }
}

@media screen and (max-width: 360px) {
  .d-btn, .d-center { width: 42px; height: 42px; }
  .a-btn { width: 42px; height: 42px; font-size: 16px; }
  .sys-btn-group { gap: 60px; }
  .pill { width: 60px; height: 18px; }
  .pill-icon { font-size: 14px; }
  .sys-label { font-size: 10px; }
}
.flex-hearts {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
}

.yuemu-diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
}
.yuemu-mini-diag-btn {
  flex: 1;
  background: var(--console-body);
  border: 3px solid var(--text-main);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 4px 4px 0px var(--console-border);
  transition: all 0.1s;
}
.yuemu-mini-diag-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--console-border);
}
.yuemu-mini-diag-btn .yuemu-sys-icon { font-size: 12px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.yuemu-mini-diag-btn .yuemu-sys-text { font-size: 8px; color: var(--text-main); font-weight: bold; font-family: 'SimHei', sans-serif; }

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
  font-size: 8px;
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

.panel-header {
  display: grid;
  padding: 8px 6px;
  background: rgba(0, 255, 65, 0.08);
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
  font-size: 8px;
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
  padding: 10px 6px;
  border-bottom: 1px solid rgba(0, 255, 65, 0.15);
  font-size: 8px;
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
.time-val { color: rgba(0, 255, 65, 0.5); font-size: 7.5px; }

/* 提示状态 */
.loading-state, .empty-state {
  text-align: center;
  padding: 40px 10px;
  font-size: 8px;
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
  font-size: 7px;
  font-weight: bold;
  padding: 4px 8px;
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
  font-size: 7px;
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
</style>
