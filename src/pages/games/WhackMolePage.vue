<template>
  <div class="yuemu-retro-arcade-universe" @touchmove.prevent>
    <div class="arcade-console">

      <div class="console-header">
        <div class="brand">
          <span class="brand-name">WHACK-A-MOLE</span>
          <span class="brand-model">SYS-99</span>
        </div>
        <div class="speaker-grill">
          <div class="dot" v-for="i in 12" :key="i"></div>
        </div>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass">
          <!-- HUD -->
          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.whackMolePage.score') }}</span>
              <span class="hud-val text-cyan">{{ score.toString().padStart(4, '0') }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.whackMolePage.time') }}</span>
              <span class="hud-val" :class="{'text-danger': timeLeft <= 10}">{{ timeLeft.toString().padStart(2, '0') }}</span>
            </div>
            <div class="hud-item right">
              <span class="hud-label">HIGH</span>
              <span class="hud-val text-yellow">{{ bestScore.toString().padStart(4, '0') }}</span>
            </div>
          </div>

          <div class="canvas-container crt-effect">
            <canvas
              ref="gameCanvas"
              :width="canvasSize"
              :height="canvasSize"
              class="game-canvas"
              :class="{ 'blur-effect': gameStatus !== 'playing' }"
              @mousedown="handleHit"
              @touchstart.prevent="handleHit"
            ></canvas>

            <div v-if="combo >= 3 && gameStatus === 'playing'" class="combo-badge">
              {{ t('pages.games.whackMolePage.comboX', { combo: combo }) }}
            </div>

            <!-- Overlays -->
            <div v-if="gameStatus === 'ready'" class="screen-overlay menu-overlay">
              <div class="geometric-logo">
                <div class="shape-mole"></div>
                <div class="shape-bomb"></div>
              </div>
              <h1 class="pixel-title neon-text">{{ t('pages.games.whackMolePage.whackMole') }}</h1>
              <p class="desc mt-4">{{ t('pages.games.whackMolePage.clickGreenAvoidRed') }}</p>
              <p class="blink mt-4 clickable-hint" @click="startGame">{{ t('pages.games.whackMolePage.startGame') }}</p>
            </div>

            <div v-if="gameStatus === 'gameover'" class="screen-overlay result-overlay">
              <h1 class="pixel-title neon-text-red" :class="timeLeft <= 0 ? 'text-danger' : ''">{{ t('pages.games.whackMolePage.timesUp') }}</h1>
              <div class="results">
                <p>{{ t('pages.games.whackMolePage.score') }}: {{ score }}</p>
                <p>{{ t('pages.games.whackMolePage.hit') }}: {{ hits }}</p>
                <p>{{ t('pages.games.whackMolePage.maxComboLabel') }}: {{ maxCombo }}</p>
              </div>
              <p class="blink mt-4 clickable-hint" @click="startGame">{{ t('pages.games.whackMolePage.restartAgain') }}</p>
            </div>

            <div v-if="gameStatus === 'paused'" class="screen-overlay pause-overlay">
              <h1 class="pixel-title blink">{{ t('pages.games.whackMolePage.hasPaused') }}</h1>
              <p class="desc">{{ t('pages.games.whackMolePage.gameIsPaused') }}</p>
              <p class="blink mt-4 clickable-hint" @click="handleStartPause">{{ t('pages.games.whackMolePage.continueGame') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 辅助监控诊断按钮区 -->
      <div class="diagnostic-trigger-bar">
        <button class="sys-btn mini-diag-btn" @click="openTerminal('ranking')">
          <span class="sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="sys-text">{{ t('pages.games.whackMolePage.leaderboardBracket') }}</span>
        </button>
        <button class="sys-btn mini-diag-btn" @click="openTerminal('history')">
          <span class="sys-icon"><i class="fas fa-history"></i></span>
          <span class="sys-text">{{ t('pages.games.whackMolePage.historyLogBracket') }}</span>
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
              <span class="sys-label">{{ t('pages.games.whackMolePage.soundEffect') }}</span>
            </button>
            <button class="sys-btn start-btn" @click="handleStartPause">
              <div class="pill">
                <MenuOutlined class="pill-icon" />
              </div>
              <span class="sys-label">{{ t('pages.games.whackMolePage.pause') }}</span>
            </button>
          </div>
        </div>

        <div class="action-section">
          <div class="action-buttons">
            <div class="btn-wrapper">
              <button class="a-btn b-btn" disabled>B</button>
              <span class="btn-label">HOLD</span>
            </div>
            <div class="btn-wrapper">
              <button class="a-btn a-btn-main" disabled>A</button>
              <span class="btn-label">HIT</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮复古数据监控诊断终端 -->
    <div v-if="isTerminalOpen" class="retro-modal-overlay" @click.self="closeTerminal">
      <div class="terminal-chassis">
        <div class="screw top-left"></div>
        <div class="screw top-right"></div>
        <div class="screw bottom-left"></div>
        <div class="screw bottom-right"></div>

        <div class="brand-plate">
          <span class="model-name text-red">MONITOR S-89</span>
          <span class="terminal-title">{{ t('pages.games.whackMolePage.diagnosticTerminal') }}</span>
        </div>

        <div class="tab-buttons">
          <button class="tab-btn" :class="{ active: activeTab === 'ranking' }" @click="switchTab('ranking')">
            {{ t('pages.games.whackMolePage.playerRankingBracket') }}
          </button>
          <button class="tab-btn" :class="{ active: activeTab === 'history' }" @click="switchTab('history')">
            {{ t('pages.games.whackMolePage.personalHistoryBracket') }}
          </button>
        </div>

        <div class="terminal-screen">
          <div class="scanlines"></div>
          <div class="crt-flicker"></div>
          <div class="screen-vignette"></div>

          <!-- 排行榜面板 -->
          <div v-if="activeTab === 'ranking'" class="terminal-panel">
            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.whackMolePage.ranking') }}</span>
              <span>{{ t('pages.games.whackMolePage.player') }}</span>
              <span>{{ t('pages.games.whackMolePage.highestScoreLabel') }}</span>
              <span>{{ t('pages.games.whackMolePage.achievedTime') }}</span>
            </div>

            <div v-if="rankingLoading" class="panel-content scrollable">
              <div class="data-row blink text-center" style="display: block;">{{ t('pages.games.whackMolePage.loadingDiagnosticData') }}</div>
            </div>
            <div v-else-if="rankings.length === 0" class="panel-content scrollable">
              <div class="data-row text-center" style="display: block;">{{ t('pages.games.whackMolePage.noPlayerRecord') }}</div>
            </div>
            <div v-else class="panel-content scrollable">
              <div v-for="(item, idx) in rankings" :key="idx" class="data-row ranking-layout-row" :class="{ 'my-row': item.userId === currentUserId }">
                <span class="rank-num">#{{ (rankPage - 1) * 8 + idx + 1 }}</span>
                <span class="user-name clickable" @click="handleUserClick(item)">
                  {{ item.userName || t('pages.games.whackMolePage.unknownVisitor') }}
                </span>
                <span class="score-val highlight">{{ t('pages.games.whackMolePage.scorePoints', { score: item.score }) }}</span>
                <span class="time-stamp">{{ formatDate(item.createTime) }}</span>
              </div>
            </div>

            <!-- 分页器 -->
            <div class="pagination">
              <button class="pag-btn" :disabled="rankPage === 1" @click="changeRankPage(-1)">&lt;</button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button class="pag-btn" :disabled="rankPage === totalRankPages" @click="changeRankPage(1)">&gt;</button>
            </div>
          </div>

          <!-- 历史日志面板 -->
          <div v-else class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.whackMolePage.reportDate') }}</span>
              <span>{{ t('pages.games.whackMolePage.level') }}</span>
              <span>{{ t('pages.games.whackMolePage.gameRecord') }}</span>
              <span>{{ t('pages.games.whackMolePage.diagnosticResult') }}</span>
            </div>

            <div v-if="historyLoading" class="panel-content scrollable">
              <div class="data-row blink text-center" style="display: block;">{{ t('pages.games.whackMolePage.loadingDiagnosticData') }}</div>
            </div>
            <div v-else-if="historyRecords.length === 0" class="panel-content scrollable">
              <div class="data-row text-center" style="display: block;">{{ t('pages.games.whackMolePage.noCloudHistory') }}</div>
            </div>
            <div v-else class="panel-content scrollable">
              <div v-for="(item, idx) in historyRecords" :key="idx" class="data-row history-layout-row">
                <span class="time-stamp">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.whackMolePage.unknown') }}</span>
                <span class="score-val highlight">{{ t('pages.games.whackMolePage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val success">PASS</span>
              </div>
            </div>

            <!-- 分页器 -->
            <div class="pagination">
              <button class="pag-btn" :disabled="historyPage === 1" @click="changeHistoryPage(-1)">&lt;</button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button class="pag-btn" :disabled="historyPage === totalHistoryPages" @click="changeHistoryPage(1)">&gt;</button>
            </div>
          </div>
        </div>

        <button class="close-btn danger-btn mt-4" @click="closeTerminal">{{ t('pages.games.whackMolePage.closeDiagnosticSystem') }}</button>
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
  if (gameStatus.value === 'playing') {
    gameStatus.value = 'paused'
    if (countdownTimer) clearInterval(countdownTimer)
    if (spawnTimer) clearTimeout(spawnTimer)
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
      gameType: 'whack_mole',
      current: rankPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.whackMolePage.getRankingsError'), err)
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
      gameType: 'whack_mole',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.whackMolePage.getHistoryArchiveError'), err)
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
  if (!dateStr) return t('pages.games.whackMolePage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

// --- 核心配色体系 (高级色块风) ---
const THEME = {
  bg: '#0F172A',         // 深邃灰蓝 (Slate 900)
  gridBg: '#1E293B',     // 轨道底色 (Slate 800)
  gridBorder: '#334155', // 轨道边框 (Slate 700)
  mole: '#10B981',       // 翡翠绿 (Emerald 500)
  moleDark: '#047857',   // 翡翠绿阴影
  bomb: '#EF4444',       // 珊瑚红 (Red 500)
  bombDark: '#B91C1C',   // 珊瑚红阴影
  tapRipple: '#F8FAFC'   // 点击波纹
}

type EntityType = 'mole' | 'bomb'
type EntityState = 'rising' | 'idle' | 'falling' | 'hit'

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; life: number; color: string; shape: 'square' | 'triangle';
  angle: number; vAngle: number;
}

interface Ripple {
  x: number; y: number; radius: number; life: number;
}

interface Entity {
  type: EntityType; state: EntityState;
  progress: number; appearTime: number; duration: number;
  particles: Particle[];
}

interface Tile {
  id: number; x: number; y: number; size: number;
  entity: Entity | null;
}

const GRID_SIZE = 3
const canvasSize = ref(600) // 内部渲染分辨率，CSS控制实际大小
const gameCanvas = ref<HTMLCanvasElement | null>(null)

// 状态
const gameStatus = ref<'ready' | 'playing' | 'paused' | 'gameover'>('ready')
const score = ref(0)
const timeLeft = ref(60)
const combo = ref(0)
const maxCombo = ref(0)
const hits = ref(0)
const bestScore = ref(0)

const tiles: Tile[] = []
const ripples: Ripple[] = []

let countdownTimer: number | null = null
let spawnTimer: number | null = null
let renderLoop: number | null = null

// --- 音效系统 ---
const isSoundEnabled = ref(true)

const sounds = {
  spawn: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  hit: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  bomb: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href),
  combo: new Audio(new URL('@/assets/sounds/powerup.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  gameover: new Audio(new URL('@/assets/sounds/gameover.MP3', import.meta.url).href),
  button: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href)
}

sounds.spawn.volume = 0.2
sounds.hit.volume = 0.4
sounds.bomb.volume = 0.5
sounds.combo.volume = 0.3
sounds.start.volume = 0.3
sounds.gameover.volume = 0.3
sounds.button.volume = 0.2

const playSound = (audio: HTMLAudioElement) => {
  if (!isSoundEnabled.value) return
  audio.currentTime = 0
  audio.play().catch(() => {})
}
const toggleSound = () => { isSoundEnabled.value = !isSoundEnabled.value; playSound(sounds.button) }

// --- 缓动函数 (赋予物体物理回弹感) ---
const easeOutBack = (x: number): number => {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
const easeInQuad = (x: number): number => x * x

// --- 初始化与逻辑 ---
const initTiles = () => {
  tiles.length = 0
  const padding = canvasSize.value * 0.05
  const availableWidth = canvasSize.value - padding * 2
  const tileSize = availableWidth / GRID_SIZE
  const gap = tileSize * 0.1
  const actualTileSize = tileSize - gap

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      tiles.push({
        id: r * GRID_SIZE + c,
        x: padding + c * tileSize + gap / 2,
        y: padding + r * tileSize + gap / 2,
        size: actualTileSize,
        entity: null
      })
    }
  }
}

const getDifficultyFactor = () => (60 - timeLeft.value) / 60

const spawnEntity = () => {
  if (gameStatus.value !== 'playing') return
  const emptyTiles = tiles.filter(t => !t.entity)
  if (emptyTiles.length > 0) {
    const spawnCount = Math.random() < getDifficultyFactor() * 0.6 ? 2 : 1
    for(let i = 0; i < spawnCount; i++) {
      if(emptyTiles.length === 0) break
      const idx = Math.floor(Math.random() * emptyTiles.length)
      const tile = emptyTiles.splice(idx, 1)[0]

      const progress = getDifficultyFactor()
      const isBomb = Math.random() < 0.15 + (progress * 0.20)

      tile.entity = {
        type: isBomb ? 'bomb' : 'mole',
        state: 'rising', progress: 0, appearTime: 0,
        duration: Math.random() * (1000 - progress * 500) + (500 - progress * 200),
        particles: []
      }
    }
    playSound(sounds.spawn)
  }
  const progress = getDifficultyFactor()
  const interval = Math.random() * (800 - progress * 400) + (300 - progress * 100)
  spawnTimer = window.setTimeout(spawnEntity, interval)
}

const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = window.setInterval(() => {
    if (gameStatus.value === 'playing') {
      timeLeft.value--
      if (timeLeft.value <= 0) endGame()
    }
  }, 1000)
}

const startGame = () => {
  score.value = 0; timeLeft.value = 60; combo.value = 0; maxCombo.value = 0; hits.value = 0;
  initTiles()
  gameStatus.value = 'playing'
  playSound(sounds.start)
  if (spawnTimer) clearTimeout(spawnTimer)
  startCountdown()
  spawnEntity()
}

const saveScore = async (finalScore: number) => {
  if (finalScore <= 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.whackMolePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'whack_mole',
      level: `t('pages.games.whackMolePage.maxComboText', { combo: maxCombo })`,
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.whackMolePage.reportFinalScoreError'), err)
  }
}

const endGame = () => {
  gameStatus.value = 'gameover'
  playSound(sounds.gameover)
  if (countdownTimer) clearInterval(countdownTimer)
  if (spawnTimer) clearTimeout(spawnTimer)
  tiles.forEach(t => { if (t.entity && t.entity.state !== 'hit') t.entity = null })
  if (score.value > bestScore.value) {
    bestScore.value = score.value
    localStorage.setItem('tileChaseBest', bestScore.value.toString())
  }
  saveScore(score.value)
}

const handleStartPause = () => {
  playSound(sounds.button)
  if (gameStatus.value === 'ready' || gameStatus.value === 'gameover') startGame()
  else if (gameStatus.value === 'playing') {
    gameStatus.value = 'paused'
    if (countdownTimer) clearInterval(countdownTimer)
    if (spawnTimer) clearTimeout(spawnTimer)
  } else if (gameStatus.value === 'paused') {
    gameStatus.value = 'playing'
    startCountdown()
    spawnTimer = window.setTimeout(spawnEntity, 400)
  }
}

// --- 交互处理 (纯触控) ---
const handleHit = (e: MouseEvent | TouchEvent) => {
  if (gameStatus.value !== 'playing') return
  const rect = gameCanvas.value!.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

  const scale = canvasSize.value / rect.width
  const x = (clientX - rect.left) * scale
  const y = (clientY - rect.top) * scale

  // 添加点击涟漪
  ripples.push({ x, y, radius: 0, life: 1 })

  // 判定碰撞
  for (const tile of tiles) {
    if (x > tile.x && x < tile.x + tile.size && y > tile.y && y < tile.y + tile.size) {
      checkHit(tile)
      break
    }
  }
}

const checkHit = (tile: Tile) => {
  const ent = tile.entity
  if (!ent || ent.state === 'hit' || ent.state === 'falling') return

  ent.state = 'hit'
  ent.progress = 1.0

  if (ent.type === 'mole') {
    const reaction = Date.now() - ent.appearTime
    const points = reaction < 400 ? 20 : 10
    score.value += points
    combo.value++
    hits.value++
    if (combo.value > maxCombo.value) maxCombo.value = combo.value

    if (combo.value >= 3) {
      score.value += 5
      playSound(sounds.combo)
    } else {
      playSound(sounds.hit)
    }
    ent.particles = createParticles(tile.x + tile.size/2, tile.y + tile.size/2, THEME.mole, 'square')
  } else if (ent.type === 'bomb') {
    score.value = Math.max(0, score.value - 15)
    combo.value = 0
    playSound(sounds.bomb)
    ent.particles = createParticles(tile.x + tile.size/2, tile.y + tile.size/2, THEME.bomb, 'triangle')
  }
}

const createParticles = (x: number, y: number, color: string, shape: 'square' | 'triangle') => {
  const particles: Particle[] = []
  for (let i = 0; i < 12; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      size: Math.random() * 15 + 10,
      life: 1.0, color, shape,
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.5
    })
  }
  return particles
}

// --- 纯粹的高级色块 Canvas 渲染 ---
const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
}

const render = () => {
  const ctx = gameCanvas.value?.getContext('2d')
  if (!ctx) return
  const now = Date.now()

  // 背景
  ctx.fillStyle = THEME.bg
  ctx.fillRect(0, 0, canvasSize.value, canvasSize.value)

  // 绘制网格与实体
  tiles.forEach(tile => {
    // 基础坑位底座
    ctx.fillStyle = THEME.gridBg
    drawRoundRect(ctx, tile.x, tile.y, tile.size, tile.size, 16)
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = THEME.gridBorder
    ctx.stroke()

    const ent = tile.entity
    if (ent) {
      // 状态机
      if (ent.state === 'rising') {
        ent.progress += 0.12
        if (ent.progress >= 1) { ent.progress = 1; ent.state = 'idle'; ent.appearTime = now }
      } else if (ent.state === 'idle') {
        if (now - ent.appearTime > ent.duration) ent.state = 'falling'
      } else if (ent.state === 'falling') {
        ent.progress -= 0.15
        if (ent.progress <= 0) {
          if (ent.type === 'mole') combo.value = 0 // 错过断连击
          tile.entity = null
        }
      } else if (ent.state === 'hit') {
        ent.progress -= 0.1 // 被击碎瞬间消失
        if (ent.progress <= 0) tile.entity = null
      }

      if (tile.entity && ent.state !== 'hit') {
        ctx.save()
        // 剪裁防止溢出底座
        drawRoundRect(ctx, tile.x, tile.y, tile.size, tile.size, 16)
        ctx.clip()

        const scale = easeOutBack(ent.progress)
        const size = tile.size * 0.7
        const cx = tile.x + tile.size / 2
        const cy = tile.y + tile.size / 2 + (tile.size * 0.8) * (1 - scale) // 从底部滑出

        ctx.translate(cx, cy)

        if (ent.type === 'mole') {
          // 极简绿方块 (目标)
          ctx.fillStyle = THEME.mole
          drawRoundRect(ctx, -size/2, -size/2, size, size, 12)
          ctx.fill()
          // 内部几何纹理 (简单的折线暗面)
          ctx.fillStyle = THEME.moleDark
          ctx.beginPath()
          ctx.moveTo(-size/2, size/2); ctx.lineTo(size/2, size/2); ctx.lineTo(size/2, 0); ctx.closePath()
          ctx.fill()
        } else {
          // 极简红菱形 (炸弹)
          ctx.fillStyle = THEME.bomb
          ctx.beginPath()
          ctx.moveTo(0, -size/2 - 10)
          ctx.lineTo(size/2 + 10, 0)
          ctx.lineTo(0, size/2 + 10)
          ctx.lineTo(-size/2 - 10, 0)
          ctx.closePath()
          ctx.fill()
          // 暗面
          ctx.fillStyle = THEME.bombDark
          ctx.beginPath()
          ctx.moveTo(0, size/2 + 10); ctx.lineTo(size/2 + 10, 0); ctx.lineTo(0, 0); ctx.closePath()
          ctx.fill()
          // 警告交叉
          ctx.strokeStyle = THEME.bg; ctx.lineWidth = 6; ctx.lineCap = 'round'
          ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke()
        }
        ctx.restore()
      }

      // 绘制粒子碎片
      if (ent.particles.length > 0) {
        ent.particles.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.angle += p.vAngle; p.life -= 0.05
          if (p.life > 0) {
            ctx.save()
            ctx.globalAlpha = easeInQuad(p.life)
            ctx.translate(p.x, p.y)
            ctx.rotate(p.angle)
            ctx.fillStyle = p.color
            if (p.shape === 'square') {
              drawRoundRect(ctx, -p.size/2, -p.size/2, p.size, p.size, 4)
              ctx.fill()
            } else {
              ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.lineTo(p.size, p.size); ctx.lineTo(-p.size, p.size); ctx.fill()
            }
            ctx.restore()
          }
        })
        ent.particles = ent.particles.filter(p => p.life > 0)
      }
    }
  })

  // 3. 绘制点击涟漪
  ripples.forEach(rip => {
    rip.radius += 8
    rip.life -= 0.05
    if (rip.life > 0) {
      ctx.beginPath()
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2)
      ctx.strokeStyle = THEME.tapRipple
      ctx.lineWidth = rip.life * 4
      ctx.globalAlpha = rip.life
      ctx.stroke()
      ctx.globalAlpha = 1.0
    }
  })
  while (ripples.length > 0 && ripples[0].life <= 0) ripples.shift()

  renderLoop = requestAnimationFrame(render)
}

onMounted(() => {
  bestScore.value = parseInt(localStorage.getItem('tileChaseBest') || '0')
  initTiles()
  renderLoop = requestAnimationFrame(render)

  // 预载排行榜与历史记录诊断数据
  fetchRankings()
  fetchHistory()
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (spawnTimer) clearTimeout(spawnTimer)
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
  .yuemu-retro-arcade-universe { padding: 0; background-color: var(--console-body); }
  .arcade-console { border-radius: 0; border: none; box-shadow: none; padding: 10px 5px; gap: 5px; height: 100%; max-height: 100dvh; min-height: unset; width: 100%; justify-content: flex-start; }
  
  .console-header { display: none; } /* 移动端隐藏顶部标志以节省空间 */
  .screen-bezel { padding: 5px; border-radius: 8px; flex-shrink: 1; min-height: 0; display: flex; flex-direction: column; align-items: stretch; justify-content: center; flex: 1; }
  
  .screen-glass { flex: 1; min-height: 0; display: flex; flex-direction: column; width: 100%; max-width: 100%; }
  .canvas-container { flex: 1; width: 100%; height: 100%; padding: 5px; display: flex; justify-content: center; align-items: center; aspect-ratio: unset; min-height: 0; }
  .game-canvas { width: 100%; height: 100%; object-fit: contain; }

  .control-panel { 
    flex-direction: row; 
    flex-wrap: nowrap; 
    padding: 0; 
    align-items: center; 
    justify-content: center;
    margin-top: 5px;
  }

  .deco-section, .action-section { 
    display: none !important; 
  }

  .system-section { 
    width: 100%; 
    justify-content: center; 
    padding-bottom: 5px;
  }
  
  .sys-btn-group { 
    transform: none; 
    gap: 20px; 
    justify-content: center;
  }
  
  .diagnostic-trigger-bar {
    padding: 0 10px;
    margin-top: 0;
  }
}

@media screen and (max-width: 360px) {
  .sys-btn-group { gap: 15px; }
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


.geometric-logo { display: flex; gap: 10px; margin-bottom: 20px; align-items: flex-end; justify-content: center; }
.shape-mole { width: 30px; height: 30px; background: #10B981; border-radius: 6px; }
.shape-bomb { width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-bottom: 30px solid #EF4444; }
.combo-badge {
  position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
  background: rgba(255,0,124,0.9); color: white; padding: 6px 16px; border-radius: 20px;
  font-weight: bold; font-size: 16px; font-family: 'PressStart2P', 'Courier New', monospace;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 15px rgba(255,0,124,0.5); pointer-events: none; z-index: 10;
}
@keyframes popIn { 0% { transform: translate(-50%, 20px) scale(0.5); opacity: 0; } 100% { transform: translate(-50%, 0) scale(1); opacity: 1; } }

</style>
