<template>
  <div class="yuemu-retro-game-universe" @touchmove.prevent>
    <div class="arcade-console">

      <div class="console-header">
        <div class="brand">
          <span class="brand-name">{{ t('pages.games.catTrapPage.catTrap') }}</span>
          <span class="brand-model">{{ t('pages.games.catTrapPage.geekClassicEdition') }}</span>
        </div>
        <div class="speaker-grill">
          <div class="dot" v-for="i in 12" :key="i"></div>
        </div>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.catTrapPage.stepsUsed') }}</span>
              <span class="hud-val">{{ steps }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.catTrapPage.containmentStatus') }}</span>
              <span class="hud-val" :class="statusColor">{{ statusText }}</span>
            </div>
          </div>

          <div class="canvas-container crt-effect">
            <canvas
              ref="gameCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="game-canvas"
              @click="handleCanvasClick"
              @touchstart.prevent="handleCanvasClick"
            ></canvas>

            <div v-if="!gameStarted && !showGameOverModal" class="screen-overlay menu-overlay">
              <h1 class="pixel-title">{{ t('pages.games.catTrapPage.catTrap') }}</h1>
              <div class="action-hints">
                <p class="blink">{{ t('pages.games.catTrapPage.clickOrPressStart') }}</p>
                <p class="desc">{{ t('pages.games.catTrapPage.cutOffEscapeRoute') }}</p>
              </div>
            </div>

            <div v-if="showGameOverModal" class="screen-overlay game-over-overlay">
              <h1 class="pixel-title" :class="isWin ? 'text-win' : 'text-lose'">
                {{ isWin ? t('pages.games.catTrapPage.captureSuccessExclamation') : t('pages.games.catTrapPage.catEscapedExclamation') }}
              </h1>
              <div class="results">
                <p>{{ t('pages.games.catTrapPage.totalSteps', { steps: stepCount }) }}</p>
                <p v-if="isWin" class="score-display"> {{ t('pages.games.catTrapPage.scoreObtainedLabel') }} <span class="neon-green-text">{{ Math.max(10, 200 - steps * 5) }}</span> {{ t('pages.games.catTrapPage.points') }} </p>
                <p class="desc" v-if="isWin">{{ t('pages.games.catTrapPage.cutOffComplete') }}</p>
              </div>
              <div class="action-hints">
                <p class="blink clickable-hint" @click="startGame">{{ t('pages.games.catTrapPage.pressStartToRetryBracket') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 辅助诊断条 (界面纯中文设计，极客双按键样式，移动端不压迫机台按键) -->
      <div class="diagnostic-trigger-bar">
        <button class="sys-btn mini-diag-btn" @click="openTerminal('ranking')">
          <span class="sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="sys-text">{{ t('pages.games.catTrapPage.leaderboardBracket') }}</span>
        </button>
        <button class="sys-btn mini-diag-btn" @click="openTerminal('history')">
          <span class="sys-icon"><i class="fas fa-history"></i></span>
          <span class="sys-text">{{ t('pages.games.catTrapPage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">

        <div class="d-pad-section">
          <div class="d-pad">
            <div class="d-row">
              <button class="d-btn up" @touchstart.prevent="handleDirection('up')" @mousedown="handleDirection('up')">
                <i class="d-icon"><i class="fas fa-caret-up"></i></i>
              </button>
            </div>
            <div class="d-row center-row">
              <button class="d-btn left" @touchstart.prevent="handleDirection('left')" @mousedown="handleDirection('left')">
                <i class="d-icon"><i class="fas fa-caret-left"></i></i>
              </button>
              <div class="d-center">
                <div class="d-center-dent"></div>
              </div>
              <button class="d-btn right" @touchstart.prevent="handleDirection('right')" @mousedown="handleDirection('right')">
                <i class="d-icon"><i class="fas fa-caret-right"></i></i>
              </button>
            </div>
            <div class="d-row">
              <button class="d-btn down" @touchstart.prevent="handleDirection('down')" @mousedown="handleDirection('down')">
                <i class="d-icon"><i class="fas fa-caret-down"></i></i>
              </button>
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
              <span class="sys-label">{{ t('pages.games.catTrapPage.sound') }}</span>
            </button>
            <button class="sys-btn start-btn" @click="startGame">
              <div class="pill">
                <span class="pill-icon"><i class="fas fa-play"></i></span>
              </div>
              <span class="sys-label">{{ t('pages.games.catTrapPage.start') }}</span>
            </button>
          </div>
        </div>

        <div class="action-section">
          <div class="action-buttons">
            <div class="btn-wrapper">
              <button class="a-btn b-btn" @click="startGame">B</button>
            </div>
            <div class="btn-wrapper">
              <button class="a-btn a-btn-main" @click="handleAPress">A</button>
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
          <span class="model-name terminal-title">{{ t('pages.games.catTrapPage.crackTerminalC04') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.catTrapPage.leaderboardBracketRight') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.catTrapPage.historyLogBracketRight') }}
            </button>
          </div>
        </div>

        <div class="terminal-screen">
          <div class="scanlines"></div>
          <div class="crt-flicker"></div>
          <div class="screen-vignette"></div>

          <!-- 1. 排行榜面板 -->
          <div v-if="activeTab === 'ranking'" class="terminal-panel">
            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.catTrapPage.ranking') }}</span>
              <span>{{ t('pages.games.catTrapPage.crackTerminal') }}</span>
              <span>{{ t('pages.games.catTrapPage.maxScore') }}</span>
              <span>{{ t('pages.games.catTrapPage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.catTrapPage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.catTrapPage.noCrackRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.catTrapPage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.catTrapPage.scorePoints', { score: item.score }) }}</span>
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
                {{ t('pages.games.catTrapPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.catTrapPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.catTrapPage.saveTime') }}</span>
              <span>{{ t('pages.games.catTrapPage.testLevelLabel') }}</span>
              <span>{{ t('pages.games.catTrapPage.achievedScore') }}</span>
              <span>{{ t('pages.games.catTrapPage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.catTrapPage.readingLocalArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.catTrapPage.noLocalArchive') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.catTrapPage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.catTrapPage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.catTrapPage.captureSuccess') : t('pages.games.catTrapPage.notInitiated') }}
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
                {{ t('pages.games.catTrapPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.catTrapPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.catTrapPage.closeDiagTerminal') }}
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'

// --- 账户与监控弹窗 ---
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)
const router = useRouter()

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

// --- 游戏物理参数 ---
const ROWS = 11
const COLS = 11
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(400)
const canvasHeight = ref(400)

// --- 状态管理 ---
const gameStarted = ref(false)
const showGameOverModal = ref(false)
const isWin = ref(false)
const steps = ref(0)

const grid = ref<number[][]>([]) // 0:空地, 1:墙壁
const catPos = ref({ r: 5, c: 5 })
const cursorPos = ref({ r: 5, c: 5 })

// 动画状态管理
const animState = ref({
  active: false,
  progress: 0,
  startX: 0, startY: 0,
  targetX: 0, targetY: 0,
  dirX: 1, // 1 面向右, -1 面向左
  nextPos: { r: 5, c: 5 }
})

const isTrapped = ref(false)
let renderLoop: number | null = null

// 状态文本
const statusText = computed(() => {
  if (!gameStarted.value) return t('pages.games.catTrapPage.standby')
  if (showGameOverModal.value) return isWin.value ? t('pages.games.catTrapPage.captured') : t('pages.games.catTrapPage.escaped')
  return isTrapped.value ? t('pages.games.catTrapPage.deadEnd') : t('pages.games.catTrapPage.pathfinding')
})

const statusColor = computed(() => {
  if (showGameOverModal.value) return isWin.value ? 'color-win' : 'color-lose'
  if (isTrapped.value) return 'color-win'
  return ''
})

// --- 音效系统 ---
const isSoundEnabled = ref(true)

const sounds = {
  place: new Audio(new URL('@/assets/sounds/move.MP3', import.meta.url).href),
  catJump: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  win: new Audio(new URL('@/assets/sounds/powerup.MP3', import.meta.url).href),
  lose: new Audio(new URL('@/assets/sounds/gameover.MP3', import.meta.url).href),
  select: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href),
  error: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href)
}

sounds.place.volume = 0.3
sounds.catJump.volume = 0.4
sounds.start.volume = 0.5
sounds.win.volume = 0.6
sounds.lose.volume = 0.6
sounds.select.volume = 0.3
sounds.error.volume = 0.4

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

// --- 六边形网格坐标计算 ---
const getGridMath = () => {
  const w = canvasWidth.value
  const h = canvasHeight.value
  const stepX = w / (COLS + 0.5 + 1)
  const radius = stepX * 0.55
  const stepY = stepX * 0.866
  const offsetX = stepX * 1.0
  const offsetY = (h - (ROWS - 1) * stepY) / 2
  return { stepX, stepY, radius, offsetX, offsetY }
}

const getCoordinates = (r: number, c: number) => {
  const { stepX, stepY, offsetX, offsetY } = getGridMath()
  const cx = offsetX + c * stepX + (r % 2 !== 0 ? stepX / 2 : 0)
  const cy = offsetY + r * stepY
  return { cx, cy }
}

// --- 游戏引擎初始化 ---
const initGame = () => {
  steps.value = 0
  isWin.value = false
  isTrapped.value = false
  showGameOverModal.value = false
  catPos.value = { r: 5, c: 5 }
  cursorPos.value = { r: 5, c: 5 }
  animState.value.active = false
  animState.value.dirX = 1

  const newGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  let wallsCount = Math.floor(Math.random() * 6) + 8

  while (wallsCount > 0) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (Math.abs(r - 5) + Math.abs(c - 5) > 2 && newGrid[r][c] === 0) {
      newGrid[r][c] = 1
      wallsCount--
    }
  }
  grid.value = newGrid
}

const startGame = () => {
  initGame()
  gameStarted.value = true
  playSound('start')
}

const getNeighbors = (r: number, c: number) => {
  const isOdd = r % 2 !== 0
  const neighbors = [
    [r, c - 1], [r, c + 1],
    [r - 1, isOdd ? c + 1 : c], [r - 1, isOdd ? c : c - 1],
    [r + 1, isOdd ? c + 1 : c], [r + 1, isOdd ? c : c - 1]
  ]
  return neighbors.filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS)
}

const isEdge = (r: number, c: number) => {
  return r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1
}

const endGame = (win: boolean) => {
  isWin.value = win
  gameStarted.value = false
  showGameOverModal.value = true
  playSound(win ? 'win' : 'lose')

  // 若成功捕获，结算分值并自动上报 (步数越少评分越高)
  if (win) {
    const finalScore = Math.max(10, 200 - steps.value * 5)
    saveScore(finalScore)
  }
}

// 广度优先搜索 (BFS) 寻找出逃路线
const findCatPath = () => {
  const startR = catPos.value.r
  const startC = catPos.value.c

  const queue = [[startR, startC]]
  const visited = new Set([`${startR},${startC}`])
  const parent = new Map<string, string>()
  let edgeNode: number[] | null = null

  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    if (isEdge(r, c)) { edgeNode = [r, c]; break }

    const neighbors = getNeighbors(r, c).sort(() => Math.random() - 0.5)
    for (const [nr, nc] of neighbors) {
      const key = `${nr},${nc}`
      if (grid.value[nr][nc] === 0 && !visited.has(key)) {
        visited.add(key)
        parent.set(key, `${r},${c}`)
        queue.push([nr, nc])
      }
    }
  }

  if (edgeNode) {
    let curr = `${edgeNode[0]},${edgeNode[1]}`
    const startKey = `${startR},${startC}`
    const path = []
    while (curr !== startKey) {
      path.push(curr)
      curr = parent.get(curr)!
    }
    const nextStep = path[path.length - 1]
    const [nr, nc] = nextStep.split(',').map(Number)
    return { r: nr, c: nc }
  }
  return null
}

const triggerCatAnimation = (nextStep: {r: number, c: number}) => {
  const startCoords = getCoordinates(catPos.value.r, catPos.value.c)
  const targetCoords = getCoordinates(nextStep.r, nextStep.c)

  animState.value = {
    active: true,
    progress: 0,
    startX: startCoords.cx, startY: startCoords.cy,
    targetX: targetCoords.cx, targetY: targetCoords.cy,
    dirX: targetCoords.cx >= startCoords.cx ? 1 : -1,
    nextPos: nextStep
  }
  playSound('catJump')
}

const processTurn = (r: number, c: number) => {
  if (grid.value[r][c] === 1 || (catPos.value.r === r && catPos.value.c === c) || animState.value.active) {
    playSound('error')
    return
  }

  grid.value[r][c] = 1
  steps.value++
  playSound('place')

  if (isEdge(catPos.value.r, catPos.value.c)) {
    return endGame(false)
  }

  const nextStep = findCatPath()

  if (nextStep) {
    triggerCatAnimation(nextStep)
  } else {
    isTrapped.value = true
    setTimeout(() => { endGame(true) }, 600)
  }
}

// --- 渲染逻辑 (Canvas 2D) ---
const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) => {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = x + r * Math.cos(angle)
    const py = y + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

const drawElegantCat = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, progress: number, dirX: number) => {
  const jumpHeight = Math.sin(progress * Math.PI) * (r * 0.8)
  const cy = y - jumpHeight
  const time = Date.now() / 200

  // 1. 地面阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  const shadowR = r * 0.6 * (1 - Math.sin(progress * Math.PI) * 0.3)
  ctx.ellipse(x, y + r * 0.4, shadowR, shadowR * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(x, cy)

  const bounce = progress === 0 ? Math.sin(time) * 2 : 0
  ctx.translate(0, bounce)
  if (dirX < 0) ctx.scale(-1, 1)

  const catColor = '#f59e0b'
  const bellyColor = '#fef3c7'

  // 2. 尾巴
  const tailSway = Math.sin(time * 0.8) * 0.4
  ctx.save()
  ctx.translate(-r * 0.5, 0)
  ctx.rotate(tailSway - 0.3)
  ctx.fillStyle = catColor
  ctx.beginPath()
  ctx.ellipse(-r*0.1, -r*0.3, r*0.15, r*0.5, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 3. 腿部
  const legStretch = Math.sin(progress * Math.PI) * r * 0.3
  ctx.fillStyle = catColor
  ctx.beginPath()
  ctx.ellipse(-r*0.25 - legStretch, r*0.35, r*0.12, r*0.25, 0.3, 0, Math.PI*2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(r*0.25 + legStretch, r*0.35, r*0.12, r*0.25, -0.3, 0, Math.PI*2)
  ctx.fill()

  // 4. 身体
  ctx.fillStyle = catColor
  ctx.beginPath()
  ctx.ellipse(0, 0, r*0.6, r*0.5, 0, 0, Math.PI*2)
  ctx.fill()
  ctx.fillStyle = bellyColor
  ctx.beginPath()
  ctx.ellipse(0, r*0.15, r*0.4, r*0.3, 0, 0, Math.PI*2)
  ctx.fill()

  // 5. 头部
  ctx.translate(r*0.3, -r*0.25)
  ctx.fillStyle = catColor
  ctx.beginPath()
  ctx.arc(0, 0, r*0.4, 0, Math.PI*2)
  ctx.fill()

  // 6. 耳朵
  ctx.beginPath()
  ctx.moveTo(-r*0.2, -r*0.2)
  ctx.lineTo(-r*0.3, -r*0.6)
  ctx.lineTo(r*0.0, -r*0.3)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(r*0.1, -r*0.3)
  ctx.lineTo(r*0.3, -r*0.6)
  ctx.lineTo(r*0.3, -r*0.1)
  ctx.fill()

  // 7. 眼部
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(r*0.1, r*0.05, r*0.15, 0, Math.PI*2)
  ctx.arc(r*0.3, r*0.05, r*0.12, 0, Math.PI*2)
  ctx.fill()

  ctx.strokeStyle = '#111'
  ctx.lineWidth = 2
  if (isTrapped.value) {
    ctx.beginPath(); ctx.moveTo(r*0.05, 0); ctx.lineTo(r*0.15, r*0.1); ctx.moveTo(r*0.15, 0); ctx.lineTo(r*0.05, r*0.1); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(r*0.25, 0); ctx.lineTo(r*0.35, r*0.1); ctx.moveTo(r*0.35, 0); ctx.lineTo(r*0.25, r*0.1); ctx.stroke()
    ctx.fillStyle = '#60a5fa'
    ctx.beginPath(); ctx.arc(-r*0.2, -r*0.1, r*0.08, 0, Math.PI*2); ctx.fill()
  } else {
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(r*0.12, r*0.05, r*0.06, 0, Math.PI*2)
    ctx.arc(r*0.32, r*0.05, r*0.05, 0, Math.PI*2)
    ctx.fill()
  }

  // 鼻
  ctx.fillStyle = '#fca5a5'
  ctx.beginPath()
  ctx.arc(r*0.23, r*0.15, r*0.03, 0, Math.PI*2)
  ctx.fill()

  ctx.restore()
}

const render = () => {
  const ctx = gameCanvas.value?.getContext('2d')
  if (!ctx) return

  const w = canvasWidth.value
  const h = canvasHeight.value
  const { radius } = getGridMath()

  const style = getComputedStyle(document.body)
  const bgColor = style.getPropertyValue('--screen-bg').trim() || '#0b1021'
  const pathColor = '#24283b'
  const wallColor = style.getPropertyValue('--pixel-highlight').trim() || '#ff007c'
  const cursorColor = style.getPropertyValue('--pixel-color').trim() || '#00ffcc'

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)

  // 绘制网格
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const { cx, cy } = getCoordinates(r, c)

      if (grid.value[r]?.[c] === 1) {
        drawHexagon(ctx, cx, cy, radius * 0.9, wallColor, '#ffffff')
      } else {
        drawHexagon(ctx, cx, cy, radius * 0.85, pathColor)
      }

      if (gameStarted.value && !animState.value.active && r === cursorPos.value.r && c === cursorPos.value.c) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 150) * 0.5
        drawHexagon(ctx, cx, cy, radius * 0.95, 'transparent', cursorColor)
        ctx.globalAlpha = 1.0
      }
    }
  }

  let catVisualX = 0, catVisualY = 0
  if (animState.value.active) {
    animState.value.progress += 0.08
    if (animState.value.progress >= 1) {
      animState.value.active = false
      catPos.value = animState.value.nextPos
      if (isEdge(catPos.value.r, catPos.value.c)) endGame(false)
    } else {
      const p = animState.value.progress
      catVisualX = animState.value.startX + (animState.value.targetX - animState.value.startX) * p
      catVisualY = animState.value.startY + (animState.value.targetY - animState.value.startY) * p
    }
  }

  if (gameStarted.value || showGameOverModal.value) {
    if (!animState.value.active) {
      const { cx, cy } = getCoordinates(catPos.value.r, catPos.value.c)
      catVisualX = cx
      catVisualY = cy
    }
    drawElegantCat(ctx, catVisualX, catVisualY, radius, animState.value.progress, animState.value.dirX)
  }

  renderLoop = requestAnimationFrame(render)
}

// --- 事件监听 ---
const handleAPress = () => {
  if (!gameStarted.value) return startGame()
  if (showGameOverModal.value) return startGame()
  processTurn(cursorPos.value.r, cursorPos.value.c)
}

const handleDirection = (dir: string) => {
  if (!gameStarted.value || animState.value.active) return
  playSound('select')
  let { r, c } = cursorPos.value
  const isOdd = r % 2 !== 0

  switch (dir) {
    case 'up': r = Math.max(0, r - 1); c = isOdd ? Math.min(COLS - 1, c + 1) : c; break;
    case 'down': r = Math.min(ROWS - 1, r + 1); c = isOdd ? Math.min(COLS - 1, c + 1) : c; break;
    case 'left': c = Math.max(0, c - 1); break;
    case 'right': c = Math.min(COLS - 1, c + 1); break;
  }
  cursorPos.value = { r, c }
}

const handleCanvasClick = (e: MouseEvent | TouchEvent) => {
  if (!gameStarted.value) return startGame()
  if (animState.value.active || showGameOverModal.value) return

  const rect = gameCanvas.value!.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

  const x = (clientX - rect.left) * (canvasWidth.value / rect.width)
  const y = (clientY - rect.top) * (canvasHeight.value / rect.height)

  const { radius } = getGridMath()

  let minR = -1, minC = -1, minDist = Infinity
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const { cx, cy } = getCoordinates(r, c)
      const dist = Math.hypot(x - cx, y - cy)
      if (dist < minDist) {
        minDist = dist
        minR = r
        minC = c
      }
    }
  }

  if (minDist < radius * 1.2) {
    cursorPos.value = { r: minR, c: minC }
    processTurn(minR, minC)
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
  switch (e.key) {
    case 'ArrowUp': case 'w': handleDirection('up'); break
    case 'ArrowDown': case 's': handleDirection('down'); break
    case 'ArrowLeft': case 'a': handleDirection('left'); break
    case 'ArrowRight': case 'd': handleDirection('right'); break
    case 'Enter': case ' ': handleAPress(); break
    case 'Escape': case 'b': case 'B': startGame(); break
  }
}

// --- 弹窗与后端拉取接口 (纯中文界面) ---
const openTerminal = (tab: 'ranking' | 'history') => {
  if (gameStarted.value && !showGameOverModal.value && !animState.value.active) {
    // 弹窗时静默处于无动画待机
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
      gameType: 'cat_trap',
      current: rankPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.catTrapPage.getRankingsError'), err)
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

// 获取个人历史记录
const fetchHistory = async () => {
  if (!currentUserId.value) return
  historyLoading.value = true
  try {
    const res = await getMyHistoryRecordsUsingPost({
      gameType: 'cat_trap',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.catTrapPage.getHistoryError'), err)
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

// 保存最终得分
const saveScore = async (finalScore: number) => {
  if (finalScore <= 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.catTrapPage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'cat_trap',
      level: t('pages.games.catTrapPage.default'),
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.catTrapPage.reportFinalRatingError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.catTrapPage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

// --- 生命周期 ---
onMounted(() => {
  initGame()
  renderLoop = requestAnimationFrame(render)
  window.addEventListener('keydown', handleKeydown, { passive: false })

  // 预加载数据，保障秒开体验
  fetchRankings()
  fetchHistory()
})

onUnmounted(() => {
  if (renderLoop) cancelAnimationFrame(renderLoop)
  window.removeEventListener('keydown', handleKeydown)
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
  --screen-bg: #0b1021;
  --pixel-color: #00ffcc;
  --pixel-highlight: #ff007c;
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
    --pixel-highlight: #ff007c;
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
  --pixel-highlight: #ff007c;
  --text-main: #a9b1d6;

  --btn-primary: #ff007c;
  --btn-secondary: #1a1b26;
  --btn-system: #565f89;
}

* {
  user-select: none;
  -webkit-touch-callout: none;
  box-sizing: border-box;
}

.yuemu-retro-game-universe {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh; height: 100dvh;
  background-color: var(--background, #2c2c2c);
  display: flex; justify-content: center; align-items: center;
  font-family: 'PressStart2P', 'Courier New', monospace;
  overflow: auto;
  padding: 20px 10px;
}

.arcade-console {
  background: var(--console-body);
  border: 4px solid var(--console-border);
  border-radius: 20px 20px 60px 20px;
  padding: 20px;
  display: flex; flex-direction: column; gap: 15px;
  box-shadow:
    10px 10px 0px rgba(0,0,0,0.3),
    inset 4px 4px 10px rgba(255,255,255,0.2),
    inset -4px -4px 10px rgba(0,0,0,0.2);
  max-width: 500px; width: 100%;
  min-height: 800px;
  margin: auto;
}

.console-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 10px; }
.brand { display: flex; flex-direction: column; }
.brand-name { font-size: 16px; font-weight: bold; color: var(--btn-primary); font-style: italic; letter-spacing: 1px;}
.brand-model { font-size: 8px; color: var(--text-main); margin-top: 4px; }

.speaker-grill { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; transform: rotate(15deg); }
.speaker-grill .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--console-detail); box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5); }

.screen-bezel {
  background: var(--screen-bezel);
  padding: 20px 30px 40px 30px;
  border-radius: 12px 12px 40px 12px;
  box-shadow: inset 2px 2px 10px rgba(0,0,0,0.8);
}

.screen-glass {
  background: var(--screen-bg); border: 2px solid rgba(0,0,0,0.5); border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.4), 0 0 15px var(--screen-bg);
  position: relative; overflow: hidden; display: flex; flex-direction: column;
}

.crt-effect::before {
  content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%); background-size: 100% 4px;
  z-index: 10; pointer-events: none;
}
.crt-effect::after {
  content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
  background: rgba(255,255,255,0.02); z-index: 10; pointer-events: none; animation: flicker 0.15s infinite;
}
@keyframes flicker { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

.hud-bar {
  display: flex; justify-content: space-between; padding: 8px 10px;
  border-bottom: 2px solid var(--pixel-color); background: rgba(0,0,0,0.05);
}
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 4px;}
.hud-label { font-size: 8px; color: var(--pixel-color); opacity: 0.8; }
.hud-val { font-size: 12px; color: var(--pixel-color); }
.color-win { color: #10b981; text-shadow: 0 0 5px #10b981; }
.color-lose { color: var(--pixel-highlight); text-shadow: 0 0 5px var(--pixel-highlight); }

.canvas-container { position: relative; display: flex; justify-content: center; align-items: center; padding: 10px; aspect-ratio: 1 / 1; }
.game-canvas { width: 100%; height: auto; max-width: 400px; cursor: crosshair;}

.screen-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(11, 16, 33, 0.85);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 20; color: #fff; text-align: center; padding: 20px;
  backdrop-filter: blur(2px);
}

.pixel-title { font-size: 20px; margin-bottom: 20px; text-shadow: 2px 2px 0px rgba(0,0,0,0.2); }
.text-win { color: #10b981; text-shadow: 2px 2px 0px rgba(0,0,0,0.5), 0 0 15px #10b981; }
.text-lose { color: var(--pixel-highlight); text-shadow: 2px 2px 0px rgba(0,0,0,0.5), 0 0 15px var(--pixel-highlight); }

.action-hints { margin-top: auto; display: flex; flex-direction: column; gap: 10px; font-size: 10px; }
.action-hints .desc { opacity: 0.6; line-height: 1.5; margin-top: -5px;}
.clickable-hint { cursor: pointer; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;}
.clickable-hint:active { transform: scale(0.95); }

.results { margin: 20px 0; display: flex; flex-direction: column; gap: 10px; font-size: 12px; text-align: center; }
.score-display { font-size: 14px; font-weight: bold; }
.neon-green-text { color: #10b981; text-shadow: 0 0 10px #10b981; }

.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* === 极客诊断通道按钮 (防挤压街机控制，纯中文) === */
.diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
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

/* === 控制面板区 === */
.control-panel {
  flex: 1; display: flex; flex-direction: row; justify-content: space-between; align-items: center; padding: 10px 0;
}

.d-pad-section { order: 1; flex: 1; display: flex; justify-content: flex-start; }
.system-section { order: 2; display: flex; align-items: flex-end; padding-bottom: 20px; }
.action-section { order: 3; flex: 1; display: flex; justify-content: flex-end; }

.d-pad {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(0,0,0,0.05); padding: 10px; border-radius: 50%;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1);
}
.d-row { display: flex; }
.d-btn {
  width: 35px; height: 35px; background: var(--console-body); border: none;
  display: flex; justify-content: center; align-items: center;
  box-shadow: inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.4), 2px 2px 4px rgba(0,0,0,0.3);
}
.d-icon { color: rgba(255,255,255,0.4); font-size: 10px; font-style: normal; display: flex; align-items: center; justify-content: center; }
.d-center { width: 35px; height: 35px; background: var(--console-body); position: relative; }
.d-center-dent {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 15px; height: 15px; border-radius: 50%;
  background: rgba(0,0,0,0.3); box-shadow: inset 1px 1px 3px rgba(0,0,0,0.8);
}
.d-btn.up { border-radius: 4px 4px 0 0; }
.d-btn.down { border-radius: 0 0 4px 4px; }
.d-btn.left { border-radius: 4px 0 0 4px; }
.d-btn.right { border-radius: 0 4px 4px 0; }
.d-btn:active { background: #111; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.8); }

.sys-btn-group { display: flex; gap: 20px; transform: rotate(-15deg); }
.sys-btn {
  background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; transition: transform 0.1s;
}
.sys-btn:active { transform: scale(0.95); }

.pill {
  width: 60px; height: 18px; background: var(--btn-system); border-radius: 12px;
  box-shadow: 3px 3px 6px rgba(0,0,0,0.3), inset 2px 2px 3px rgba(255,255,255,0.4);
  display: flex; align-items: center; justify-content: center; position: relative;
}
.pill-icon { font-size: 11px; color: #fff; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;}
.sys-btn:active .pill { transform: translate(1px, 1px); box-shadow: inset 2px 2px 4px rgba(0,0,0,0.6); }
.sys-label { font-size: 10px; color: var(--text-main); font-weight: bold; letter-spacing: 1px; }

.sound-btn.active .pill { background: linear-gradient(135deg, #34c759, #b4ec51); box-shadow: 0 0 8px rgba(52, 199, 89, 0.5), 2px 2px 4px rgba(0,0,0,0.3); }
.start-btn .pill { background: linear-gradient(135deg, #007aff, #00c6ff); box-shadow: 0 0 8px rgba(0, 122, 255, 0.5), 2px 2px 4px rgba(0,0,0,0.3); }

.action-buttons {
  display: flex; gap: 15px; transform: rotate(-15deg); background: rgba(0,0,0,0.05); padding: 15px 25px; border-radius: 40px;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1);
}
.btn-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.a-btn {
  width: 45px; height: 45px; border-radius: 50%; border: none; background: var(--btn-primary);
  display: flex; justify-content: center; align-items: center; color: rgba(255,255,255,0.7);
  font-family: Arial, sans-serif; font-size: 18px; font-weight: 900; text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
  box-shadow: 2px 4px 0 rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.4);
}
.a-btn:active { transform: translate(2px, 4px); box-shadow: inset 2px 2px 6px rgba(0,0,0,0.6); color: rgba(255,255,255,0.5); }

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
.terminal-title {
  color: var(--text-main);
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
  color: var(--text-main);
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
@keyframes flicker { 0% { opacity: 0.8; } 50% { opacity: 1; } 100% { opacity: 0.8; } }

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

  .diagnostic-trigger-bar { 
    grid-area: diag; 
    flex-direction: column; 
    justify-content: flex-start; 
    padding: 0; 
    margin-top: 20px; 
    width: 100%;
  }
}

/* === 移动端响应式布局 === */
@media screen and (max-width: 768px) {
  .yuemu-retro-game-universe { 
    padding: 0; min-height: 100dvh; overflow: hidden; display: flex; align-items: center; justify-content: center;
    background-color: var(--console-body); 
  }
  .arcade-console { 
    border-radius: 0; border: none; box-shadow: none; 
    padding: 10px 5px; gap: 5px; height: 100%; max-height: 100dvh; min-height: unset; width: 100%; justify-content: center;
  }
  .screen-bezel { padding: 10px; border-radius: 8px; flex-shrink: 1; min-height: 0; display: flex; align-items: center; justify-content: center; width: 100%; max-width: 100%; margin: 0; }

  /* 游戏屏幕自适应压缩 */
  .screen-glass { flex: 1; aspect-ratio: 1 / 1; min-height: 0; display: flex; justify-content: center; align-items: center; width: 100%; max-width: 100%; }
  .canvas-container { flex: 1; width: 100%; height: 100%; padding: 5px; display: flex; justify-content: center; align-items: center; }
  .game-canvas { width: 100%; height: 100%; object-fit: contain; }

  .control-panel {
    flex-direction: row;
    flex-wrap: nowrap; /* 强行挤在一行 */
    padding: 0 2px 5px 2px;
    gap: 5px;
    justify-content: space-between;
    align-items: center;
  }

  /* 隐藏非必要的系统文本标签 */
  .sys-label { display: none !important; }

  /* 1. 系统键居中，竖排节省横向空间 */
  .system-section {
    order: 2;
    width: auto;
    justify-content: center;
    padding-bottom: 0;
  }
  .sys-btn-group {
    transform: none;
    gap: 10px;
    flex-direction: column;
  }
  .pill {
    width: 45px;
    height: 35px;
    border-radius: 8px;
  }
  .pill-icon { font-size: 14px; }

  /* 2. 左侧十字方向键适度大小 */
  .d-pad-section {
    order: 1;
    flex: unset;
  }
  .d-pad {
    padding: 3px; 
  }
  .d-btn, .d-center {
    width: 36px;
    height: 36px;
  }
  .d-icon { font-size: 12px; }

  /* 3. 右侧动作按键相应缩小 */
  .action-section {
    order: 3;
    flex: unset;
  }
  .action-buttons {
    padding: 8px;
    gap: 8px;
    border-radius: 20px;
    transform: rotate(-10deg);
  }
  .a-btn {
    width: 38px;
    height: 38px;
    font-size: 14px;
  }
  
  .terminal-chassis {
    padding: 15px;
    border-radius: 12px;
    min-height: 480px;
  }
}

@media screen and (max-width: 360px) {
  /* 对于特小屏幕 (如 iPhone SE) 做微调防止越界 */
  .d-btn, .d-center { width: 32px; height: 32px; }
  .a-btn { width: 34px; height: 34px; font-size: 14px; }
  .sys-btn-group { gap: 8px; }
  .pill { width: 40px; height: 32px; }
  .pill-icon { font-size: 12px; }
}
</style>
