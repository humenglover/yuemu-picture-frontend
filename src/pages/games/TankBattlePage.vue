<template>
  <div class="yuemu-retro-game-universe" @contextmenu.prevent>
    <div class="arcade-console">

      <div class="console-header">
        <div class="brand">
          <span class="brand-name">{{ t('pages.games.tankBattlePage.tankBattle') }}</span>
          <span class="brand-model">{{ t('pages.games.tankBattlePage.classicEdition') }}</span>
        </div>
        <div class="speaker-grill">
          <div class="dot" v-for="i in 16" :key="i"></div>
        </div>
      </div>

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.tankBattlePage.score') }}</span>
              <span class="hud-val">{{ score }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.tankBattlePage.lives') }}</span>
              <span class="hud-val"><i class="fas fa-heart" style="color: #e11d48; margin-right: 2px;"></i> x{{ lives }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.tankBattlePage.level') }}</span>
              <span class="hud-val">{{ level }}</span>
            </div>
            <div class="hud-item speed-control">
              <span class="hud-label">{{ t('pages.games.tankBattlePage.speed') }}</span>
              <div class="speed-layout">
                <div class="mouse-wheel-frame">
                  <div class="mouse-wheel"
                       @wheel.prevent="handleWheel"
                       @touchstart.prevent="handleTouchStart"
                       @touchmove.prevent="handleTouchMove">
                    <div class="wheel-surface"></div>
                  </div>
                </div>
                <span class="speed-display">x{{ gameSpeed }}</span>
              </div>
            </div>
          </div>
      <div class="screen-bezel">
        <div class="screen-glass">


          <div class="canvas-container crt-effect">
            <canvas
              ref="gameCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="game-canvas"
            ></canvas>

            <div v-if="!gameStarted && !showGameOverModal" class="screen-overlay menu-overlay">
              <h1 class="pixel-title">{{ t('pages.games.tankBattlePage.tankBattle') }}</h1>
              <div class="action-hints">
                <p class="blink">{{ t('pages.games.tankBattlePage.pressStartOrEnter') }}</p>
              </div>
            </div>

            <div v-if="showGameOverModal" class="screen-overlay game-over-overlay">
              <h1 class="pixel-title text-red">{{ t('pages.games.tankBattlePage.gameOver') }}</h1>
              <div class="results">
                <p>{{ t('pages.games.tankBattlePage.finalScoreIs', { score: score }) }}</p>
                <p>{{ t('pages.games.tankBattlePage.enemiesDestroyedVal', { enemies: enemiesDestroyed }) }}</p>
              </div>
              <div class="action-hints">
                <p class="blink clickable-hint" @click="startGame">{{ t('pages.games.tankBattlePage.pressStartToRetryBracket') }}</p>
              </div>
            </div>

            <div v-if="isPaused && gameStarted" class="screen-overlay pause-overlay">
              <h1 class="pixel-title blink">{{ t('pages.games.tankBattlePage.pause') }}</h1>
            </div>
          </div>
        </div>
      </div>

      <div class="control-panel">

        <div class="d-pad-section">
          <div class="d-pad-cross">
            <div class="d-pad-row">
              <div class="d-pad-empty"></div>
              <button class="d-pad-btn up"
                      @touchstart.prevent="setMove('up', true)" @touchend.prevent="setMove('up', false)"
                      @mousedown="setMove('up', true)" @mouseup="setMove('up', false)" @mouseleave="setMove('up', false)">
                <span class="dir-arrow">▲</span>
              </button>
              <div class="d-pad-empty"></div>
            </div>
            <div class="d-pad-row">
              <button class="d-pad-btn left"
                      @touchstart.prevent="setMove('left', true)" @touchend.prevent="setMove('left', false)"
                      @mousedown="setMove('left', true)" @mouseup="setMove('left', false)" @mouseleave="setMove('left', false)">
                <span class="dir-arrow">◀</span>
              </button>
              <div class="d-pad-center">
                <div class="d-pad-dent"></div>
              </div>
              <button class="d-pad-btn right"
                      @touchstart.prevent="setMove('right', true)" @touchend.prevent="setMove('right', false)"
                      @mousedown="setMove('right', true)" @mouseup="setMove('right', false)" @mouseleave="setMove('right', false)">
                <span class="dir-arrow">▶</span>
              </button>
            </div>
            <div class="d-pad-row">
              <div class="d-pad-empty"></div>
              <button class="d-pad-btn down"
                      @touchstart.prevent="setMove('down', true)" @touchend.prevent="setMove('down', false)"
                      @mousedown="setMove('down', true)" @mouseup="setMove('down', false)" @mouseleave="setMove('down', false)">
                <span class="dir-arrow">▼</span>
              </button>
              <div class="d-pad-empty"></div>
            </div>
          </div>
        </div>

        <div class="system-section">
          <div class="sys-btn-group">
            <div class="sys-btn-wrapper">
              <button class="sys-btn sound-btn" @click="toggleSound" :class="{ 'active': isSoundEnabled }"></button>
              <span class="sys-label">{{ t('pages.games.tankBattlePage.soundEffect') }}</span>
            </div>
            <div class="sys-btn-wrapper">
              <button class="sys-btn start-btn" @click="handleStartPause"></button>
              <span class="sys-label">{{ t('pages.games.tankBattlePage.startPause') }}</span>
            </div>
          </div>
        </div>

        <div class="action-section">
          <div class="action-buttons">
            <div class="a-btn-group">
              <button class="a-btn" @click="handleBPress">
                <span class="btn-text">B</span>
              </button>
              <span class="a-label">B</span>
            </div>
            <div class="a-btn-group">
              <button class="a-btn a-btn-main" @touchstart.prevent="shoot" @mousedown.prevent="shoot">
                <span class="btn-text">A</span>
              </button>
              <span class="a-label">A</span>
            </div>
          </div>
        </div>

        <!-- 极客双通道诊断控制区 (防挤压，防冲突) -->
        <div class="diagnostic-trigger-bar">
          <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
            <span class="yuemu-sys-icon"><i class="fas fa-trophy" style="color: #ffd700;"></i></span>
            <span class="yuemu-sys-text">{{ t('pages.games.tankBattlePage.leaderboardBracket') }}</span>
          </button>
          <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
            <span class="yuemu-sys-icon"><i class="fas fa-history" style="color: #00ffcc;"></i></span>
            <span class="yuemu-sys-text">{{ t('pages.games.tankBattlePage.historyLogBracket') }}</span>
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
            <span class="terminal-title">{{ t('pages.games.tankBattlePage.diagnosticTerminal') }}</span>
          </div>

          <div class="tab-buttons">
            <button class="tab-btn" :class="{ active: activeTab === 'ranking' }" @click="switchTab('ranking')">
              {{ t('pages.games.tankBattlePage.playerRankingBracket') }}
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'history' }" @click="switchTab('history')">
              {{ t('pages.games.tankBattlePage.personalHistoryBracket') }}
            </button>
          </div>

          <div class="terminal-screen">
            <div class="scanlines"></div>
            <div class="crt-flicker"></div>
            <div class="screen-vignette"></div>

            <!-- 排行榜面板 -->
            <div v-if="activeTab === 'ranking'" class="terminal-panel">
              <div class="panel-header ranking-layout-header">
                <span>{{ t('pages.games.tankBattlePage.ranking') }}</span>
                <span>{{ t('pages.games.tankBattlePage.player') }}</span>
                <span>{{ t('pages.games.tankBattlePage.highestScoreLabel') }}</span>
                <span>{{ t('pages.games.tankBattlePage.achievedTime') }}</span>
              </div>

              <div v-if="rankingLoading" class="panel-content scrollable">
                <div class="data-row blink text-center" style="display: block;">{{ t('pages.games.tankBattlePage.loadingDiagnosticData') }}</div>
              </div>
              <div v-else-if="rankings.length === 0" class="panel-content scrollable">
                <div class="data-row text-center" style="display: block;">{{ t('pages.games.tankBattlePage.noPlayerRecord') }}</div>
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
                    {{ item.userName || t('pages.games.tankBattlePage.unknownVisitor') }}
                  </span>
                  <span class="score-val highlight">{{ t('pages.games.tankBattlePage.scorePoints', { score: item.score }) }}</span>
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
                <span>{{ t('pages.games.tankBattlePage.reportDate') }}</span>
                <span>{{ t('pages.games.tankBattlePage.level') }}</span>
                <span>{{ t('pages.games.tankBattlePage.gameRecord') }}</span>
                <span>{{ t('pages.games.tankBattlePage.diagnosticResult') }}</span>
              </div>

              <div v-if="historyLoading" class="panel-content scrollable">
                <div class="data-row blink text-center" style="display: block;">{{ t('pages.games.tankBattlePage.loadingDiagnosticData') }}</div>
              </div>
              <div v-else-if="historyRecords.length === 0" class="panel-content scrollable">
                <div class="data-row text-center" style="display: block;">{{ t('pages.games.tankBattlePage.noCloudHistory') }}</div>
              </div>
              <div v-else class="panel-content scrollable">
                <div v-for="(item, idx) in historyRecords" :key="idx" class="data-row history-layout-row">
                  <span class="time-stamp">{{ formatDate(item.createTime) }}</span>
                  <span class="level-val">{{ item.level || t('pages.games.tankBattlePage.unknown') }}</span>
                  <span class="score-val highlight">{{ t('pages.games.tankBattlePage.scorePoints', { score: item.score }) }}</span>
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

          <button class="close-btn" @click="closeTerminal">{{ t('pages.games.tankBattlePage.closeDiagnosticSystem') }}</button>
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
  if (gameStarted.value && !isPaused.value) {
    isPaused.value = true
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
      gameType: 'tank_battle',
      current: rankPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.tankBattlePage.getRankingsError'), err)
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
      gameType: 'tank_battle',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.tankBattlePage.getHistoryArchiveError'), err)
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

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.tankBattlePage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

// --- 画布与基础配置 ---
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(400)
const canvasHeight = ref(400)
const TILE_SIZE = 20
const MAP_SIZE = 20

// --- 游戏状态 ---
const gameStarted = ref(false)
const isPaused = ref(false)
const showGameOverModal = ref(false)
const score = ref(0)
const lives = ref(3)
const level = ref(1)
const enemiesDestroyed = ref(0)
const gameSpeed = ref(2) // 速度等级 1-5

// --- 音效系统 ---
const isSoundEnabled = ref(true)

const sounds = {
  shoot: new Audio(new URL('@/assets/sounds/move.MP3', import.meta.url).href),
  hit: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  explosion: new Audio(new URL('@/assets/sounds/match.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  gameOver: new Audio(new URL('@/assets/sounds/lose.MP3', import.meta.url).href),
  select: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href),
  pause: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  resume: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  levelUp: new Audio(new URL('@/assets/sounds/powerup.MP3', import.meta.url).href),
  baseHit: new Audio(new URL('@/assets/sounds/lose.MP3', import.meta.url).href),
  playerHit: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href)
}

// 设置音量
sounds.shoot.volume = 0.2
sounds.hit.volume = 0.3
sounds.explosion.volume = 0.5
sounds.start.volume = 0.5
sounds.gameOver.volume = 0.6
sounds.select.volume = 0.3
sounds.pause.volume = 0.3
sounds.resume.volume = 0.4
sounds.levelUp.volume = 0.6
sounds.baseHit.volume = 0.7
sounds.playerHit.volume = 0.5

const playSound = (type: keyof typeof sounds) => {
  if (!isSoundEnabled.value) return
  const audio = sounds[type]
  audio.currentTime = 0
  audio.play().catch(() => {})
}

const toggleSound = () => {
  isSoundEnabled.value = !isSoundEnabled.value
  if (isSoundEnabled.value) playSound('select')
}

// --- 控制器状态 ---
const inputState = ref({ up: false, down: false, left: false, right: false })

type Direction = 'up' | 'down' | 'left' | 'right'

interface Tank {
  x: number; y: number; w: number; h: number;
  dir: Direction; speed: number; isPlayer: boolean;
  cooldown: number; autoTurnTimer?: number;
}

interface Bullet {
  x: number; y: number; w: number; h: number;
  dir: Direction; speed: number; isPlayer: boolean; active: boolean;
}

let player = ref<Tank>({} as Tank)
let enemies = ref<Tank[]>([])
let bullets = ref<Bullet[]>([])
let mapGrid = ref<number[][]>([]) // 0:空, 1:砖块, 2:铁墙, 3:基地
let gameLoopId: number | null = null

// --- 初始化地图与实体 ---
const initMap = () => {
  const grid = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(0))
  for (let i = 2; i < MAP_SIZE - 2; i += 4) {
    for (let j = 2; j < MAP_SIZE - 2; j++) {
      if (j !== 9 && j !== 10) { grid[j][i] = 1; grid[j][i+1] = 1; }
    }
  }
  grid[17][8] = 2; grid[17][9] = 2; grid[17][10] = 2; grid[17][11] = 2;
  grid[18][8] = 2; grid[18][11] = 2;
  grid[19][8] = 2; grid[19][11] = 2;
  grid[19][9] = 3; grid[19][10] = 3;
  mapGrid.value = grid
}

const initPlayer = () => {
  const speedMult = gameSpeed.value * 0.5
  player.value = {
    x: 6 * TILE_SIZE, y: 19 * TILE_SIZE, w: TILE_SIZE * 0.8, h: TILE_SIZE * 0.8,
    dir: 'up', speed: 1.2 * speedMult, isPlayer: true, cooldown: 0
  }
}

const spawnEnemy = () => {
  const maxEnemies = Math.min(2 + Math.floor(level.value / 3), 5)
  if (enemies.value.length >= maxEnemies) return

  const spawnPoints = [0, 9 * TILE_SIZE, 19 * TILE_SIZE]
  const speedMult = gameSpeed.value * 0.5
  const enemySpeed = Math.min(0.5 + level.value * 0.08, 1.2) * speedMult

  enemies.value.push({
    x: spawnPoints[Math.floor(Math.random() * spawnPoints.length)], y: 0,
    w: TILE_SIZE * 0.8, h: TILE_SIZE * 0.8, dir: 'down',
    speed: enemySpeed, isPlayer: false, cooldown: 0, autoTurnTimer: 0
  })
}

// --- 核心更新 ---
const update = () => {
  if (!gameStarted.value || isPaused.value || showGameOverModal.value) return

  let dx = 0; let dy = 0;
  if (inputState.value.up) { dy = -player.value.speed; player.value.dir = 'up' }
  else if (inputState.value.down) { dy = player.value.speed; player.value.dir = 'down' }
  else if (inputState.value.left) { dx = -player.value.speed; player.value.dir = 'left' }
  else if (inputState.value.right) { dx = player.value.speed; player.value.dir = 'right' }

  if (dx !== 0 || dy !== 0) {
    player.value.x += dx; player.value.y += dy;
    handleWallCollision(player.value, dx, dy)
  }
  if (player.value.cooldown > 0) player.value.cooldown--

  enemies.value.forEach(enemy => {
    if (enemy.cooldown > 0) enemy.cooldown--
    enemy.autoTurnTimer! -= 1

    let edx = 0; let edy = 0;
    if (enemy.dir === 'up') edy = -enemy.speed
    if (enemy.dir === 'down') edy = enemy.speed
    if (enemy.dir === 'left') edx = -enemy.speed
    if (enemy.dir === 'right') edx = enemy.speed

    enemy.x += edx; enemy.y += edy;
    const collision = handleWallCollision(enemy, edx, edy)

    if (collision || enemy.autoTurnTimer! <= 0) {
      const dirs: Direction[] = ['up', 'down', 'left', 'right']
      enemy.dir = dirs[Math.floor(Math.random() * dirs.length)]
      enemy.autoTurnTimer = Math.random() * 60 + 30
    }
    const shootChance = Math.min(0.005 + level.value * 0.002, 0.015)
    if (enemy.cooldown <= 0 && Math.random() < shootChance) fireBullet(enemy)
  })

  bullets.value.forEach(b => {
    if (!b.active) return
    if (b.dir === 'up') b.y -= b.speed
    if (b.dir === 'down') b.y += b.speed
    if (b.dir === 'left') b.x -= b.speed
    if (b.dir === 'right') b.x += b.speed

    if (b.x < 0 || b.x > canvasWidth.value || b.y < 0 || b.y > canvasHeight.value) {
      b.active = false; return
    }

    const gridX = Math.floor((b.x + b.w/2) / TILE_SIZE)
    const gridY = Math.floor((b.y + b.h/2) / TILE_SIZE)
    if (gridY >= 0 && gridY < MAP_SIZE && gridX >= 0 && gridX < MAP_SIZE) {
      const cellType = mapGrid.value[gridY][gridX]
      if (cellType === 1) { mapGrid.value[gridY][gridX] = 0; b.active = false; return }
      if (cellType === 2) { b.active = false; playSound('hit'); return }
      if (cellType === 3) {
        if (!b.isPlayer) { playSound('baseHit'); gameOver() }
        b.active = false; return
      }
    }

    if (b.isPlayer) {
      enemies.value.forEach((enemy, index) => {
        if (checkRectCollision(b, enemy)) {
          b.active = false; enemies.value.splice(index, 1)
          score.value += 100; enemiesDestroyed.value++; playSound('explosion')
          if (enemiesDestroyed.value % 5 === 0) { level.value++; playSound('levelUp') }
        }
      })
    } else {
      if (checkRectCollision(b, player.value)) {
        b.active = false; playSound('explosion'); playerDead()
      }
    }
  })

  bullets.value = bullets.value.filter(b => b.active)
  const spawnChance = Math.min(0.001 + level.value * 0.0005, 0.003)
  if (Math.random() < spawnChance) spawnEnemy()
}

const checkRectCollision = (r1: any, r2: any) => {
  return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y
}

const handleWallCollision = (tank: Tank, dx: number, dy: number) => {
  let collided = false
  if (tank.x < 0) { tank.x = 0; collided = true }
  if (tank.y < 0) { tank.y = 0; collided = true }
  if (tank.x + tank.w > canvasWidth.value) { tank.x = canvasWidth.value - tank.w; collided = true }
  if (tank.y + tank.h > canvasHeight.value) { tank.y = canvasHeight.value - tank.h; collided = true }

  const offset = 2
  const startX = Math.floor((tank.x + offset) / TILE_SIZE)
  const endX = Math.floor((tank.x + tank.w - offset) / TILE_SIZE)
  const startY = Math.floor((tank.y + offset) / TILE_SIZE)
  const endY = Math.floor((tank.y + tank.h - offset) / TILE_SIZE)

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      if (y >= 0 && y < MAP_SIZE && x >= 0 && x < MAP_SIZE && mapGrid.value[y][x] !== 0) {
        tank.x -= dx; tank.y -= dy; return true
      }
    }
  }
  return collided
}

// --- 动作 ---
const shoot = () => {
  if (!gameStarted.value || isPaused.value || showGameOverModal.value) {
    if (!gameStarted.value) startGame(); return
  }
  fireBullet(player.value)
}

const fireBullet = (tank: Tank) => {
  if (tank.cooldown > 0) return
  tank.cooldown = 30
  let bx = tank.x + tank.w / 2 - 2; let by = tank.y + tank.h / 2 - 2;
  if (tank.dir === 'up') by = tank.y - 4
  else if (tank.dir === 'down') by = tank.y + tank.h
  else if (tank.dir === 'left') bx = tank.x - 4
  else if (tank.dir === 'right') bx = tank.x + tank.w

  const speedMult = gameSpeed.value * 0.5
  bullets.value.push({
    x: bx, y: by, w: 4, h: 4, dir: tank.dir,
    speed: tank.isPlayer ? 3 * speedMult : 2 * speedMult,
    isPlayer: tank.isPlayer, active: true
  })
  if (tank.isPlayer) playSound('shoot')
}

const playerDead = () => {
  lives.value -= 1; playSound('playerHit')
  if (lives.value <= 0) gameOver()
  else {
    player.value.x = 6 * TILE_SIZE; player.value.y = 19 * TILE_SIZE; player.value.dir = 'up'
  }
}

// --- 渲染 ---
const render = () => {
  const ctx = gameCanvas.value?.getContext('2d')
  if (!ctx) return
  const w = canvasWidth.value; const h = canvasHeight.value;

  const style = getComputedStyle(document.body)
  const bgColor = style.getPropertyValue('--screen-bg').trim() || '#8bac0f'
  const pixelColor = style.getPropertyValue('--pixel-color').trim() || '#0f380f'
  const highlightColor = style.getPropertyValue('--pixel-highlight').trim() || '#306230'

  ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = pixelColor
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (mapGrid.value[y][x] === 1) {
        ctx.fillRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2)
        ctx.clearRect(x * TILE_SIZE + 3, y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6)
        ctx.fillRect(x * TILE_SIZE + 5, y * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10)
      } else if (mapGrid.value[y][x] === 2) {
        ctx.fillStyle = '#8B4513'; ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        ctx.fillStyle = '#654321'; ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)
        ctx.fillStyle = pixelColor
      } else if (mapGrid.value[y][x] === 3) {
        ctx.fillStyle = '#FFD700'; ctx.fillRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)
        ctx.fillStyle = highlightColor; ctx.fillRect(x * TILE_SIZE + 6, y * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12)
        ctx.fillStyle = pixelColor
      }
    }
  }

  const drawTank = (t: Tank) => {
    ctx.fillStyle = t.isPlayer ? pixelColor : highlightColor
    const padding = (TILE_SIZE - t.w) / 2
    ctx.fillRect(t.x + padding, t.y + padding, t.w, t.h)

    ctx.fillStyle = pixelColor
    const bl = 8; const bw = 4;
    if (t.dir === 'up') ctx.fillRect(t.x + t.w/2 - bw/2 + padding, t.y - bl + padding + 4, bw, bl)
    if (t.dir === 'down') ctx.fillRect(t.x + t.w/2 - bw/2 + padding, t.y + t.h - 4 + padding, bw, bl)
    if (t.dir === 'left') ctx.fillRect(t.x - bl + padding + 4, t.y + t.h/2 - bw/2 + padding, bl, bw)
    if (t.dir === 'right') ctx.fillRect(t.x + t.w - 4 + padding, t.y + t.h/2 - bw/2 + padding, bl, bw)
  }

  enemies.value.forEach(drawTank)
  if (lives.value > 0) drawTank(player.value)

  ctx.fillStyle = pixelColor
  bullets.value.forEach(b => {
    ctx.beginPath(); ctx.arc(b.x + b.w/2, b.y + b.h/2, 2, 0, Math.PI * 2); ctx.fill()
  })
}

const loop = () => {
  update(); render();
  if (gameStarted.value) gameLoopId = requestAnimationFrame(loop)
}

const startGame = () => {
  gameStarted.value = true; isPaused.value = false; showGameOverModal.value = false;
  score.value = 0; lives.value = 3; level.value = 1; enemiesDestroyed.value = 0;
  bullets.value = []; enemies.value = [];
  initMap(); initPlayer();
  for(let i=0; i<2; i++) spawnEnemy()
  playSound('start')
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
  loop()
}

const saveScore = async (finalScore: number) => {
  if (finalScore <= 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.tankBattlePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'tank_battle',
      level: `t('pages.games.tankBattlePage.levelValueText', { level: level })`,
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.tankBattlePage.reportFinalScoreError'), err)
  }
}

const gameOver = () => {
  gameStarted.value = false; showGameOverModal.value = true;
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
  playSound('gameOver')
  saveScore(score.value)
}

const handleStartPause = () => {
  if (showGameOverModal.value || !gameStarted.value) startGame()
  else { isPaused.value = !isPaused.value; playSound(isPaused.value ? 'pause' : 'resume') }
}
const handleBPress = () => { if (showGameOverModal.value || gameStarted.value) playSound('select') }

// --- 滚轮与滑动控速 ---
const adjustSpeed = (delta: number) => {
  const newSpeed = Math.max(1, Math.min(5, gameSpeed.value + delta))
  if (newSpeed !== gameSpeed.value) {
    gameSpeed.value = newSpeed; playSound('select')
    if (gameStarted.value) {
      const speedMult = gameSpeed.value * 0.5
      player.value.speed = 1.2 * speedMult
      enemies.value.forEach(e => e.speed = Math.min(0.5 + level.value * 0.08, 1.2) * speedMult)
    }
  }
}

const handleWheel = (e: WheelEvent) => adjustSpeed(e.deltaY > 0 ? -1 : 1)

let touchStartY = 0
const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY }
const handleTouchMove = (e: TouchEvent) => {
  const touchY = e.touches[0].clientY
  const deltaY = touchStartY - touchY
  if (Math.abs(deltaY) > 15) {
    adjustSpeed(deltaY > 0 ? 1 : -1)
    touchStartY = touchY
  }
}

// --- 按键 ---
const setMove = (dir: Direction, isMoving: boolean) => { inputState.value[dir] = isMoving }

const handleKeydown = (e: KeyboardEvent) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
  switch (e.key.toLowerCase()) {
    case 'arrowup': case 'w': setMove('up', true); break;
    case 'arrowdown': case 's': setMove('down', true); break;
    case 'arrowleft': case 'a': setMove('left', true); break;
    case 'arrowright': case 'd': setMove('right', true); break;
    case ' ': case 'j': shoot(); break;
    case 'enter': handleStartPause(); break;
  }
}
const handleKeyup = (e: KeyboardEvent) => {
  switch (e.key.toLowerCase()) {
    case 'arrowup': case 'w': setMove('up', false); break;
    case 'arrowdown': case 's': setMove('down', false); break;
    case 'arrowleft': case 'a': setMove('left', false); break;
    case 'arrowright': case 'd': setMove('right', false); break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown, { passive: false })
  window.addEventListener('keyup', handleKeyup)
  setTimeout(() => render(), 100)

  // 预载排行榜与历史记录诊断信息，保障打开瞬显
  fetchRankings()
  fetchHistory()
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
})
</script>

<style scoped>
@font-face {
  font-family: 'PressStart2P';
  src: url('https://fonts.cdnfonts.com/s/14227/PressStart2P-Regular.woff') format('woff');
  font-display: swap;
}

/* 将所有固定的阴影、高光提炼为变量。
  亮色模式变量
*/
.yuemu-retro-game-universe {
  --game-bg: var(--background, #fbfcfc);
  --console-body: #e0e0e0;
  --console-border: #b0b0b0;
  --screen-bezel: #444;
  --screen-bg: #8bac0f;
  --pixel-color: #0f380f;
  --pixel-highlight: #306230;
  --text-main: var(--text-secondary, #666);
  --btn-primary: #a11;
  --btn-secondary: #333;
  --overlay-bg: rgba(0,0,0, 0.75);

  /* 立体交互的阴影与高光 (Light) */
  --console-shadow-outer: rgba(0, 0, 0, 0.3);
  --console-shadow-inner: rgba(0, 0, 0, 0.2);
  --console-highlight-inner: rgba(255, 255, 255, 0.6);
  --btn-shadow-outer: rgba(0, 0, 0, 0.4);
  --btn-shadow-inner: rgba(0, 0, 0, 0.6);
  --btn-highlight-inner: rgba(255, 255, 255, 0.3);

  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--game-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'PressStart2P', monospace;
  padding: 20px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  transition: background-color 0.3s ease;
}

@media (prefers-color-scheme: dark) {
  .yuemu-retro-game-universe {
    --console-body: var(--card-background, #2d2d2d);
    --console-border: var(--border-color, #404040);
    --screen-bezel: #111;
    --screen-bg: #0a110e;
    --pixel-color: #00ffcc;
    --pixel-highlight: #008f73;
    --text-main: var(--text-secondary, #94a3b8);
    --btn-primary: #e11d48;
    --btn-secondary: #1a1a1a;
    --overlay-bg: rgba(0,0,0, 0.85);

    /* 【关键修复】暗色主题下，大幅降低白色高光，加深阴影边界，杜绝发白和脏乱感 */
    --console-shadow-outer: rgba(0, 0, 0, 0.6);
    --console-shadow-inner: rgba(0, 0, 0, 0.8);
    --console-highlight-inner: rgba(255, 255, 255, 0.05);
    --btn-shadow-outer: rgba(0, 0, 0, 0.8);
    --btn-shadow-inner: rgba(0, 0, 0, 0.9);
    --btn-highlight-inner: rgba(255, 255, 255, 0.08);
  }
}

* { user-select: none; -webkit-touch-callout: none; box-sizing: border-box; }

.arcade-console {
  background: var(--console-body);
  border-radius: 15px 15px 60px 15px;
  padding: 25px 20px 40px 20px;
  display: flex; flex-direction: column; gap: 20px;
  /* 动态注入高光阴影变量 */
  box-shadow:
    15px 15px 30px var(--console-shadow-outer),
    inset 2px 5px 10px var(--console-highlight-inner),
    inset -5px -5px 15px var(--console-shadow-inner);
  max-width: 480px;
  width: 100%;
  margin: auto;
  border: 1px solid var(--console-border);
  transition: all 0.3s ease;
}

.console-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 10px; }
.brand { display: flex; flex-direction: column; }
.brand-name { font-size: 18px; font-weight: bold; color: var(--btn-primary); font-style: italic; letter-spacing: 1px; transition: color 0.3s ease;}
.brand-model { font-size: 8px; color: var(--text-main); margin-top: 5px; font-family: sans-serif; font-weight: bold;}
.speaker-grill { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; transform: rotate(15deg); }
.speaker-grill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--console-shadow-inner); box-shadow: inset 1px 1px 3px rgba(0,0,0,0.6), 1px 1px 1px var(--console-highlight-inner); }

.screen-bezel {
  background: var(--screen-bezel);
  padding: 25px 35px 45px 35px;
  border-radius: 12px 12px 40px 12px;
  box-shadow:
    inset 3px 3px 15px rgba(0,0,0,0.9),
    0 2px 2px var(--console-highlight-inner);
}

.screen-glass {
  background: var(--screen-bg);
  border: 3px solid #222;
  border-radius: 6px;
  box-shadow: inset 0 0 25px rgba(0,0,0,0.6);
  position: relative;
  overflow: hidden;
  display: flex; flex-direction: column;
}

/* CRT扫描线优化 */
.crt-effect::before {
  content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
  background-size: 100% 4px; z-index: 10; pointer-events: none;
}
.crt-effect::after {
  content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
  background: rgba(255,255,255,0.01); z-index: 10; pointer-events: none;
  animation: flicker 0.12s infinite;
}
@keyframes flicker { 0% { opacity: 0.9; } 50% { opacity: 1; } 100% { opacity: 0.9; } }

.hud-bar { 
  display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; 
  background: var(--screen-bezel); 
  border-radius: 8px; 
  box-shadow: inset 3px 3px 10px rgba(0,0,0,0.8), 0 2px 2px var(--console-highlight-inner);
  border: 2px solid #222;
  margin-bottom: 15px;
}
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 5px;}
.hud-label { font-size: 10px; color: var(--text-main); font-weight: bold; }
.hud-val { font-size: 12px; color: var(--pixel-color); font-weight: bold; text-shadow: 0 0 5px var(--pixel-highlight);}

/* --- 鼠标滚轮样式优化 --- */
.speed-control { flex-direction: row; gap: 8px; align-items: center; }
.speed-layout { display: flex; align-items: center; gap: 8px; }

.mouse-wheel-frame {
  width: 20px; height: 34px;
  background: #222;
  border-radius: 4px;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.9), 0 1px 1px var(--console-highlight-inner);
  padding: 3px 0;
  display: flex; justify-content: center; align-items: center;
}
.mouse-wheel {
  width: 14px; height: 100%;
  border-radius: 2px;
  background: repeating-linear-gradient(to bottom, #444, #444 2px, #666 2px, #666 4px);
  cursor: ns-resize;
  touch-action: pan-x;
  box-shadow: 0 0 5px rgba(0,0,0,0.8);
  border: 1px solid #111;
}
.mouse-wheel:active { filter: brightness(0.8); }
.speed-display { font-size: 12px; font-weight: bold; color: var(--pixel-color); pointer-events: none; }

.canvas-container { position: relative; display: flex; justify-content: center; align-items: center; padding: 8px; background: var(--screen-bg); }
.game-canvas { image-rendering: pixelated; width: 100%; height: auto; max-width: 400px; display: block;}

.screen-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: var(--overlay-bg); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 20; color: var(--pixel-color); text-align: center; padding: 20px; backdrop-filter: blur(2px);}
.text-red { color: #ff3333; }
.pixel-title { font-size: 20px; margin-bottom: 20px; text-shadow: 2px 2px 0px #000; color: #fff;}
.action-hints { margin-top: 20px; font-size: 10px; color: #fff; text-shadow: 1px 1px 0 #000;}
.results { display: flex; flex-direction: column; gap: 12px; font-size: 12px; color: #fff; text-shadow: 1px 1px 0 #000; text-align: left; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px;}
.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
.clickable-hint { cursor: pointer; padding: 10px; background: var(--btn-primary); border-radius: 4px; box-shadow: 0 4px 0 rgba(0,0,0,0.8);}
.clickable-hint:active { transform: translateY(4px); box-shadow: 0 0 0 rgba(0,0,0,0.8); }

/* === 控制面板区 === */
.control-panel { display: flex; flex-direction: row; justify-content: space-between; align-items: flex-end; padding: 15px 5px 0 5px; gap: 10px;}

.d-pad-section { flex: 1; display: flex; justify-content: flex-start; }
.d-pad-cross {
  display: flex; flex-direction: column;
  background: var(--console-body);
  padding: 4px; border-radius: 50%;
  box-shadow:
    0 8px 10px var(--console-shadow-outer),
    inset 2px 2px 5px var(--console-highlight-inner),
    inset -2px -2px 5px var(--console-shadow-inner);
}
.d-pad-row { display: flex; justify-content: center;}
.d-pad-empty { width: 32px; height: 32px; }
.d-pad-center { width: 32px; height: 32px; background: #222; display: flex; align-items: center; justify-content: center; z-index: 2;}
.d-pad-dent { width: 14px; height: 14px; border-radius: 50%; background: #1a1a1a; box-shadow: inset 1px 1px 3px #000; }
.d-pad-btn {
  width: 32px; height: 32px; background: #222; border: none;
  display: flex; justify-content: center; align-items: center;
  position: relative;
  box-shadow: inset 1px 1px 2px var(--btn-highlight-inner), inset -1px -1px 2px var(--btn-shadow-inner);
}
.d-pad-btn.up { border-radius: 8px 8px 0 0; }
.d-pad-btn.down { border-radius: 0 0 8px 8px; }
.d-pad-btn.left { border-radius: 8px 0 0 8px; }
.d-pad-btn.right { border-radius: 0 8px 8px 0; }
.dir-arrow { color: rgba(255,255,255,0.15); font-size: 14px; text-shadow: -1px -1px 0 #000; pointer-events: none;}
.d-pad-btn:active { background: #111; box-shadow: inset 2px 2px 6px #000; }
.d-pad-btn:active .dir-arrow { color: rgba(255,255,255,0.4); }

.system-section { flex: 1.5; display: flex; justify-content: center; padding-bottom: 20px;}
.sys-btn-group { display: flex; gap: 20px; transform: rotate(-20deg); }
.sys-btn-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px;}
.sys-btn {
  width: 45px; height: 14px; border-radius: 10px; border: none;
  background: #555; cursor: pointer;
  box-shadow: 2px 4px 5px var(--console-shadow-outer), inset 1px 1px 3px var(--btn-highlight-inner);
  transition: transform 0.1s, box-shadow 0.1s;
}
.sys-btn:active { transform: translate(1px, 2px); box-shadow: 0px 1px 2px rgba(0,0,0,0.5), inset 2px 2px 5px rgba(0,0,0,0.8); }
.sound-btn.active { background: #4caf50; box-shadow: 0 0 8px rgba(76,175,80,0.6), 2px 4px 5px var(--console-shadow-outer); }
.sys-label { font-size: 8px; color: var(--text-main); font-weight: bold; font-family: sans-serif;}

.action-section { flex: 1; display: flex; justify-content: flex-end; padding-bottom: 25px;}
.action-buttons { display: flex; gap: 15px; transform: rotate(-20deg); background: rgba(0,0,0,0.05); padding: 10px 20px; border-radius: 40px; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.1); }
.a-btn-group { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.a-btn {
  width: 44px; height: 44px; border-radius: 50%; border: none;
  background: var(--btn-primary);
  display: flex; justify-content: center; align-items: center;
  box-shadow:
    -2px -2px 6px var(--btn-highlight-inner) inset,
    2px 2px 6px var(--btn-shadow-inner) inset,
    2px 6px 0px var(--btn-shadow-inner),
    4px 8px 10px var(--btn-shadow-outer);
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.a-btn:active {
  transform: translateY(6px);
  box-shadow:
    -2px -2px 6px var(--btn-highlight-inner) inset,
    2px 2px 6px var(--btn-shadow-inner) inset,
    0px 0px 0px var(--btn-shadow-inner),
    1px 2px 3px var(--btn-shadow-outer);
}
.btn-text { color: rgba(255,255,255,0.8); font-family: sans-serif; font-weight: 900; font-size: 16px; text-shadow: 1px 1px 1px rgba(0,0,0,0.5); pointer-events: none;}
.a-label { font-size: 10px; color: var(--text-main); font-family: sans-serif; font-weight: bold;}

/* === 移动端响应式布局 === */
@media screen and (max-width: 768px) {
  .yuemu-retro-game-universe { 
    padding: 0; height: 100vh; height: 100dvh; overflow: hidden; 
    display: flex; align-items: center; justify-content: center; 
    background-color: var(--console-body); 
  }
  .arcade-console {
    border-radius: 0; border: none; box-shadow: none;
    padding: 10px 5px; gap: 15px; height: 100%; max-height: 100vh; min-height: unset;
    justify-content: center; width: 100%;
  }
  .screen-bezel { padding: 10px; border-radius: 8px; flex: unset; width: 100%; max-width: 100%; margin: 0 auto; }
  .screen-glass { flex: unset; aspect-ratio: 1 / 1; }
  .canvas-container { flex: unset; display: flex; align-items: center; justify-content: center; padding: 2px; height: 100%; width: 100%; }
  .game-canvas { width: 100%; height: 100%; object-fit: contain; }
  
  /* 隐藏所有多余的文本标签，释放极大的横向空间 */
  .sys-label, .a-label, .yuemu-sys-text { display: none !important; }

  .control-panel { flex-wrap: nowrap; padding: 5px 2px; gap: 5px; justify-content: space-between; align-items: center;}

  /* 极客面板（排行榜等）：变成左侧的两个紧凑方形按钮 */
  .diagnostic-trigger-bar { width: auto; flex-direction: column; gap: 8px; margin-top: 0; order: 0; padding: 0; }
  .yuemu-mini-diag-btn { padding: 0; flex: unset; width: 40px; height: 40px; justify-content: center; }
  .yuemu-mini-diag-btn .yuemu-sys-icon { font-size: 16px; margin: 0; }

  .d-pad-section { order: 1; flex: unset; justify-content: flex-start; }
  .d-pad-empty, .d-pad-center, .d-pad-btn { width: 34px; height: 34px; }
  .dir-arrow { font-size: 16px; }

  .system-section { order: 2; flex: unset; padding-bottom: 0; }
  .sys-btn-group { transform: none; gap: 15px; flex-direction: column; }
  .sys-btn { width: 45px; height: 14px; }

  .action-section { order: 3; flex: unset; justify-content: flex-end; padding-bottom: 0;}
  .action-buttons { padding: 5px; gap: 10px; flex-direction: row; transform: none; border-radius: 20px;}
  .a-btn { width: 45px; height: 45px; }
  .btn-text { font-size: 18px; }
}

/* ================= 极客辅助监控诊断控制面板 ================= */
.diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
  margin-top: 15px;
  padding: 0 10px;
}

.yuemu-mini-diag-btn {
  flex: 1;
  background: var(--console-body);
  border: 2px solid var(--console-border);
  border-radius: 8px;
  padding: 10px 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--console-border);
  transition: all 0.1s;
}

.yuemu-mini-diag-btn:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--console-border);
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
  background: var(--console-body);
  border: 4px solid var(--console-border);
  border-radius: 16px;
  padding: 25px 20px;
  box-shadow: 0 10px 30px rgba(0, 255, 65, 0.15);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 520px;
  font-family: 'PressStart2P', monospace;
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
  background: var(--console-border); transform: translateY(-50%) rotate(45deg);
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
  color: var(--text-main);
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
  background: var(--btn-primary);
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

@media (min-width: 769px) {
  .arcade-console {
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto 1fr;
    max-width: 900px;
    padding: 30px; gap: 20px 30px;
    align-items: stretch;
  }
  .console-header { grid-column: 1 / 3; grid-row: 1 / 2; padding: 0; }
  .screen-bezel { grid-column: 1 / 2; grid-row: 2 / 3; height: 100%; display: flex; flex-direction: column; }
  .control-panel { 
    grid-column: 2 / 3; grid-row: 2 / 3; 
    flex-direction: column; align-items: center; justify-content: space-around; 
    padding: 0; gap: 20px;
  }
  
  .system-section, .d-pad-section, .action-section { padding-bottom: 0; flex: unset; justify-content: center; width: 100%; }
  
  .sys-btn-group { transform: none; gap: 30px; justify-content: center; }
  .action-buttons { transform: none; padding: 20px; justify-content: center; }
  
  .screen-glass, .canvas-container { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .game-canvas { height: 100%; max-height: 100%; width: auto; max-width: 100%; object-fit: contain; }
}
</style>
