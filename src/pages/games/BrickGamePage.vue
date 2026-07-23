<template>
  <div class="yuemu-retro-brick-universe" :class="{ 'is-mobile': isMobile }" @touchmove.prevent>
    <div class="arcade-console">

      <div class="marquee" @click="quitGame">
        <span class="back-btn"><i class="fas fa-arrow-left"></i> {{ t('pages.games.brickGamePage.return') }} </span>
        <h1 class="game-title">{{ t('pages.games.brickGamePage.brickGame') }}</h1>
        <span class="version">{{ t('pages.games.brickGamePage.classicEdition') }}</span>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass crt-effect">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.brickGamePage.score') }}</span>
              <span class="hud-val highlight">{{ score }}</span>
            </div>
            <div class="hud-item center-item">
              <span class="hud-label">{{ t('pages.games.brickGamePage.lives') }}</span>
              <div class="lives-box">
                <span v-for="n in Math.max(0, lives)" :key="n" class="life-heart">
                  <i class="fas fa-heart"></i>
                </span>
              </div>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.brickGamePage.highScore') }}</span>
              <span class="hud-val">{{ bestScore }}</span>
            </div>
          </div>

          <div class="stage-container" ref="stageContainer">
            <canvas
              ref="gameCanvas"
              class="game-canvas"
              @mousemove="handleMouseMove"
              @touchmove="handleCanvasTouch"
            ></canvas>

            <div v-if="gameState === 'start'" class="screen-overlay menu-overlay">
              <h1 class="pixel-title">{{ t('pages.games.brickGamePage.brickGame') }}</h1>
              <div class="rules">
                <p>{{ t('pages.games.brickGamePage.destroyAllBricks') }}</p>
                <p>{{ t('pages.games.brickGamePage.dontDropBall') }}</p>
              </div>
              <p class="blink hint-text"> {{ t('pages.games.brickGamePage.pressStartButton') }} <i class="fas fa-caret-down"></i></p>
            </div>

            <div v-if="gameState === 'paused'" class="screen-overlay pause-overlay">
              <h1 class="pixel-title blink">{{ t('pages.games.brickGamePage.paused') }}</h1>
              <p class="hint-text">{{ t('pages.games.brickGamePage.pressStartToContinue') }}</p>
            </div>

            <div v-if="gameState === 'gameover'" class="screen-overlay gameover-overlay">
              <h1 class="pixel-title danger">{{ t('pages.games.brickGamePage.gameOver') }}</h1>
              <div class="results-box">
                <p> {{ t('pages.games.brickGamePage.finalScoreLabel') }} <span>{{ score }}</span></p>
                <p> {{ t('pages.games.brickGamePage.brokenBricksLabel') }} <span>{{ bricksDestroyed }}</span></p>
                <p> {{ t('pages.games.brickGamePage.timeUsedLabel') }} <span>{{ formatTime(gameTime) }}</span></p>
              </div>
              <p class="blink hint-text"> {{ t('pages.games.brickGamePage.pressStartRetry') }} <i class="fas fa-caret-down"></i></p>
            </div>

            <div v-if="gameState === 'win'" class="screen-overlay win-overlay">
              <h1 class="pixel-title win-text">{{ t('pages.games.brickGamePage.levelPassed') }}</h1>
              <div class="results-box">
                <p> {{ t('pages.games.brickGamePage.finalScoreLabel') }} <span>{{ score }}</span></p>
                <p> {{ t('pages.games.brickGamePage.lifeBonusLabel') }} <span>+{{ lives * 500 }}</span></p>
              </div>
              <p class="blink hint-text">{{ t('pages.games.brickGamePage.pressStartNextLevel') }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="control-panel">

        <!-- 辅助监控诊断按钮区（双通道极客风格，不挤压原操作键，极其适配移动端） -->
        <div class="diagnostic-trigger-bar">
          <button class="sys-btn mini-diag-btn" @click="openTerminal('ranking')">
            <span class="sys-icon"><i class="fas fa-trophy"></i></span>
            <span class="sys-text">{{ t('pages.games.brickGamePage.ranks') }}</span>
          </button>
          <button class="sys-btn mini-diag-btn" @click="openTerminal('history')">
            <span class="sys-icon"><i class="fas fa-history"></i></span>
            <span class="sys-text">{{ t('pages.games.brickGamePage.logs') }}</span>
          </button>
        </div>

        <div class="action-section">
          <button class="sys-btn" @click="handleMainAction">
            <span class="sys-icon">
              <play-circle-outlined v-if="gameState === 'start' || gameState === 'gameover' || gameState === 'win' || gameState === 'paused'"/>
              <pause-circle-outlined v-else />
            </span>
            <span class="sys-text">{{ (gameState === 'start' || gameState === 'gameover' || gameState === 'win') ? t('pages.games.brickGamePage.start') : (gameState === 'paused' ? t('pages.games.brickGamePage.continue') : t('pages.games.brickGamePage.pause')) }}</span>
          </button>

          <button class="sys-btn" @click="restartGame" :disabled="gameState === 'start'">
            <span class="sys-icon"><redo-outlined /></span>
            <span class="sys-text">{{ t('pages.games.brickGamePage.restart') }}</span>
          </button>

          <button class="sys-btn" @click="toggleSound">
            <span class="sys-icon">
              <sound-filled v-if="isSoundEnabled" />
              <sound-outlined v-else />
            </span>
            <span class="sys-text">{{ t('pages.games.brickGamePage.soundEffect') }}</span>
          </button>
        </div>

        <div class="slider-section" v-show="isMobile">
          <div class="touch-slider"
               ref="touchSlider"
               @touchstart="handleSliderTouch"
               @touchmove="handleSliderTouch"
          >
            <div class="slider-track">
              <div class="slider-thumb" :style="{ left: sliderThumbPos + '%' }">|||</div>
            </div>
            <div class="slider-hint">{{ t('pages.games.brickGamePage.slideControl') }}</div>
          </div>
        </div>

      </div>
    </div>

    <!-- 悬浮复古数据监控诊断终端 (街机显示器浮窗，移动端与桌面端自适应) -->
    <div class="retro-modal-overlay" v-if="isTerminalOpen" @click.self="closeTerminal">
      <div class="terminal-chassis">
        <div class="screw top-left"></div>
        <div class="screw top-right"></div>
        <div class="screw bottom-left"></div>
        <div class="screw bottom-right"></div>

        <div class="brand-plate flex-column-mobile">
          <span class="model-name terminal-title">{{ t('pages.games.brickGamePage.crackTerminalB03') }}</span>
          <div class="tab-buttons">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'ranking' }"
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.brickGamePage.rankBracket') }}
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'history' }"
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.brickGamePage.historyBracket') }}
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
              <span>#</span>
              <span>{{ t('pages.games.brickGamePage.crackTerminal') }}</span>
              <span>{{ t('pages.games.brickGamePage.highestScore') }}</span>
              <span>{{ t('pages.games.brickGamePage.accessTime') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.brickGamePage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.brickGamePage.noCrackRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.brickGamePage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ item.score }} PTS</span>
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
                {{ t('pages.games.brickGamePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button
                class="paging-btn"
                :disabled="rankPage >= totalRankPages"
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.brickGamePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.brickGamePage.saveTime') }}</span>
              <span>{{ t('pages.games.brickGamePage.testLevel') }}</span>
              <span>{{ t('pages.games.brickGamePage.achievedScore') }}</span>
              <span>{{ t('pages.games.brickGamePage.status') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.brickGamePage.readingLocalArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.brickGamePage.noLocalArchive') }}
              </div>
              <div
                v-else
                v-for="item in historyRecords"
                :key="item.id"
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.brickGamePage.default') }}</span>
                <span class="score-val text-neon-green">{{ item.score }} PTS</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.brickGamePage.testPassed') : t('pages.games.brickGamePage.notInitiated') }}
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
                {{ t('pages.games.brickGamePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button
                class="paging-btn"
                :disabled="historyPage >= totalHistoryPages"
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.brickGamePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.brickGamePage.closeMonitor') }}
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  RedoOutlined,
  SoundOutlined,
  SoundFilled,
} from '@ant-design/icons-vue'

const router = useRouter()

// --- 账户仓与监测弹窗状态 ---
const loginUserStore = useLoginUserStore()
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0)

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

// --- 游戏物理状态 ---
const isMobile = ref(false)
const gameState = ref<'start' | 'playing' | 'paused' | 'gameover' | 'win'>('start')
const score = ref(0)
const bestScore = ref(parseInt(localStorage.getItem('brickGameBestScore') || '0'))
const lives = ref(3)
const bricksDestroyed = ref(0)
const gameTime = ref(0)

const stageContainer = ref<HTMLElement | null>(null)
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const touchSlider = ref<HTMLElement | null>(null)

let timeInterval: number | null = null
let animationFrameId: number | null = null

// --- 音效配置 ---
const isSoundEnabled = ref(true)
const hitSound = new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href)
const breakSound = new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href)
const gameOverSound = new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href)

hitSound.volume = 0.3
breakSound.volume = 0.4
gameOverSound.volume = 0.5

const playSound = (sound: HTMLAudioElement) => {
  if (!isSoundEnabled.value) return
  sound.currentTime = 0
  sound.play().catch(() => {})
}

const toggleSound = () => { isSoundEnabled.value = !isSoundEnabled.value }

// --- 游戏物理与渲染配置 ---
const config = {
  paddleWidth: 80,
  paddleHeight: 12,
  ballSize: 8,
  brickRowCount: 6,
  brickColumnCount: 8,
  brickWidth: 0,
  brickHeight: 18,
  brickPadding: 4,
  brickOffsetTop: 30,
  ballBaseSpeed: 2.5,
}

const paddle = ref({ x: 0 })
const ball = ref({ x: 0, y: 0, dx: 0, dy: 0 })
const bricks = ref<any[][]>([])
const sliderThumbPos = ref(50)

// --- 核心物理引擎与游戏逻辑 ---
const initBricks = () => {
  if (!gameCanvas.value) return
  const availableWidth = gameCanvas.value.width - (config.brickPadding * (config.brickColumnCount + 1))
  config.brickWidth = Math.floor(availableWidth / config.brickColumnCount)

  const retroColors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#32ADE6', '#007AFF']

  for (let c = 0; c < config.brickColumnCount; c++) {
    bricks.value[c] = []
    for (let r = 0; r < config.brickRowCount; r++) {
      bricks.value[c][r] = {
        x: 0, y: 0, status: 1,
        color: retroColors[r % retroColors.length]
      }
    }
  }
}

const resetBall = () => {
  if (!gameCanvas.value) return
  ball.value.x = gameCanvas.value.width / 2
  ball.value.y = gameCanvas.value.height - 50
  ball.value.dx = config.ballBaseSpeed * (Math.random() > 0.5 ? 1 : -1)
  ball.value.dy = -config.ballBaseSpeed

  paddle.value.x = (gameCanvas.value.width - config.paddleWidth) / 2
  sliderThumbPos.value = 50
}

const startGame = () => {
  gameState.value = 'playing'
  score.value = 0
  lives.value = 3
  bricksDestroyed.value = 0
  gameTime.value = 0
  initBricks()
  resetBall()

  if (timeInterval) clearInterval(timeInterval)
  timeInterval = window.setInterval(() => {
    if (gameState.value === 'playing') gameTime.value++
  }, 1000)

  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  draw()
}

const handleMainAction = () => {
  if (gameState.value === 'start' || gameState.value === 'gameover' || gameState.value === 'win') {
    startGame()
  } else if (gameState.value === 'playing') {
    gameState.value = 'paused'
  } else if (gameState.value === 'paused') {
    gameState.value = 'playing'
    draw()
  }
}

const restartGame = () => {
  if (gameState.value !== 'start') startGame()
}

const quitGame = () => {
  router.push({ name: 'Games' })
}

// --- 渲染引擎 ---
const drawRect = (x: number, y: number, w: number, h: number, color: string, isRetroBrick = false) => {
  if (!ctx.value) return
  ctx.value.fillStyle = color
  ctx.value.fillRect(x, y, w, h)

  if (isRetroBrick) {
    ctx.value.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.value.fillRect(x, y, w, 2)
    ctx.value.fillRect(x, y, 2, h)
    ctx.value.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.value.fillRect(x, y + h - 2, w, 2)
    ctx.value.fillRect(x + w - 2, y, 2, h)
  }
}

const drawBricks = () => {
  const offsetX = (gameCanvas.value!.width - (config.brickColumnCount * (config.brickWidth + config.brickPadding) - config.brickPadding)) / 2

  for (let c = 0; c < config.brickColumnCount; c++) {
    for (let r = 0; r < config.brickRowCount; r++) {
      const b = bricks.value[c][r]
      if (b.status === 1) {
        const brickX = offsetX + c * (config.brickWidth + config.brickPadding)
        const brickY = config.brickOffsetTop + r * (config.brickHeight + config.brickPadding)
        b.x = brickX
        b.y = brickY
        drawRect(brickX, brickY, config.brickWidth, config.brickHeight, b.color, true)
      }
    }
  }
}

const collisionDetection = () => {
  for (let c = 0; c < config.brickColumnCount; c++) {
    for (let r = 0; r < config.brickRowCount; r++) {
      const b = bricks.value[c][r]
      if (b.status === 1) {
        if (
          ball.value.x + config.ballSize > b.x &&
          ball.value.x < b.x + config.brickWidth &&
          ball.value.y + config.ballSize > b.y &&
          ball.value.y < b.y + config.brickHeight
        ) {
          ball.value.dy = -ball.value.dy
          b.status = 0
          score.value += 10
          bricksDestroyed.value++
          playSound(breakSound)

          // 通关判定
          if (bricksDestroyed.value === config.brickRowCount * config.brickColumnCount) {
            gameState.value = 'win'
            if (score.value > bestScore.value) {
              bestScore.value = score.value
              localStorage.setItem('brickGameBestScore', score.value.toString())
            }
            saveScore(score.value)
          }
        }
      }
    }
  }
}

const draw = () => {
  if (!ctx.value || !gameCanvas.value || gameState.value !== 'playing') return

  const cw = gameCanvas.value.width
  const ch = gameCanvas.value.height

  ctx.value.clearRect(0, 0, cw, ch)

  drawBricks()

  const paddleY = ch - config.paddleHeight - 30;

  drawRect(paddle.value.x, paddleY, config.paddleWidth, config.paddleHeight, '#007AFF', true)
  drawRect(ball.value.x, ball.value.y, config.ballSize, config.ballSize, '#FFF', false)

  collisionDetection()

  // 碰壁检测
  if (ball.value.x + ball.value.dx > cw - config.ballSize || ball.value.x + ball.value.dx < 0) {
    ball.value.dx = -ball.value.dx
    playSound(hitSound)
  }
  if (ball.value.y + ball.value.dy < 0) {
    ball.value.dy = -ball.value.dy
    playSound(hitSound)
  }

  // 碰挡板检测
  if (ball.value.y + config.ballSize + ball.value.dy >= paddleY && ball.value.y < paddleY) {
    if (ball.value.x + config.ballSize > paddle.value.x && ball.value.x < paddle.value.x + config.paddleWidth) {
      const hitPoint = (ball.value.x + config.ballSize/2) - (paddle.value.x + config.paddleWidth/2)
      ball.value.dx = hitPoint * 0.1
      ball.value.dy = -Math.abs(config.ballBaseSpeed * 1.05)
      playSound(hitSound)
    }
  } else if (ball.value.y > ch) {
    // 掉落死亡
    lives.value--
    playSound(gameOverSound)
    if (lives.value <= 0) {
      gameState.value = 'gameover'
      if (score.value > bestScore.value) {
        bestScore.value = score.value
        localStorage.setItem('brickGameBestScore', score.value.toString())
      }
      saveScore(score.value)
    } else {
      resetBall()
      gameState.value = 'paused'
      setTimeout(() => { if (gameState.value === 'paused') gameState.value = 'playing'; draw() }, 1000)
    }
  }

  ball.value.x += ball.value.dx
  ball.value.y += ball.value.dy

  if (gameState.value === 'playing') {
    animationFrameId = requestAnimationFrame(draw)
  }
}

// --- 操作控制 ---
const handleMouseMove = (e: MouseEvent) => {
  if (!gameCanvas.value || gameState.value !== 'playing' || isMobile.value) return
  const rect = gameCanvas.value.getBoundingClientRect()
  const relativeX = e.clientX - rect.left
  updatePaddlePosition(relativeX)
}

const handleCanvasTouch = (e: TouchEvent) => {
  if (gameState.value !== 'playing' || !gameCanvas.value) return
  e.preventDefault()
  const touch = e.touches[0]
  const rect = gameCanvas.value.getBoundingClientRect()
  const relativeX = touch.clientX - rect.left
  updatePaddlePosition(relativeX)
}

const handleSliderTouch = (e: TouchEvent) => {
  if (gameState.value !== 'playing' || !touchSlider.value || !gameCanvas.value) return
  e.preventDefault()

  const touch = e.touches[0]
  const rect = touchSlider.value.getBoundingClientRect()
  let relativeX = touch.clientX - rect.left

  if (relativeX < 0) relativeX = 0
  if (relativeX > rect.width) relativeX = rect.width

  const ratio = relativeX / rect.width
  const canvasTargetX = ratio * gameCanvas.value.width
  updatePaddlePosition(canvasTargetX)
}

const updatePaddlePosition = (targetX: number) => {
  if (!gameCanvas.value) return
  let newX = targetX - config.paddleWidth / 2
  if (newX < 0) newX = 0
  if (newX > gameCanvas.value.width - config.paddleWidth) newX = gameCanvas.value.width - config.paddleWidth

  paddle.value.x = newX
  sliderThumbPos.value = (newX / (gameCanvas.value.width - config.paddleWidth)) * 100
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const resizeCanvas = () => {
  nextTick(() => {
    isMobile.value = window.innerWidth <= 768
    if (!gameCanvas.value || !stageContainer.value) return
    const rect = stageContainer.value.getBoundingClientRect()

    gameCanvas.value.width = rect.width
    gameCanvas.value.height = rect.height

    if (gameState.value !== 'playing') {
      config.paddleWidth = rect.width * (isMobile.value ? 0.3 : 0.2)
      resetBall()
      initBricks()
    }
  })
}

// --- 数据上报与终端监控定义 ---
const openTerminal = (tab: 'ranking' | 'history') => {
  if (gameState.value === 'playing') {
    gameState.value = 'paused'
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
      gameType: 'brick',
      current: rankPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.brickGamePage.getRankingsError'), err)
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
      gameType: 'brick',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.brickGamePage.getHistoryArchiveError'), err)
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

// 保存最终得分
const saveScore = async (finalScore: number) => {
  if (finalScore <= 0) return
  if (!currentUserId.value) {
    console.warn(t('pages.games.brickGamePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'brick',
      level: t('pages.games.brickGamePage.levelOne'),
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.brickGamePage.reportFinalScoreError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.brickGamePage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

// --- 生命周期 ---
onMounted(() => {
  ctx.value = gameCanvas.value?.getContext('2d') || null
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // 预加载数据缓存，保证瞬开体验
  fetchRankings()
  fetchHistory()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (timeInterval) clearInterval(timeInterval)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
@font-face {
  font-family: 'PressStart2P';
  src: url('https://fonts.cdnfonts.com/s/14227/PressStart2P-Regular.woff') format('woff');
  font-display: swap;
}

* {
  user-select: none;
  -webkit-touch-callout: none;
  box-sizing: border-box;
}

/* 宇宙底板锁死滚动 */
.yuemu-retro-brick-universe {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh; height: 100dvh;
  background-color: var(--background);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'PressStart2P', Consolas, monospace;
  overflow: hidden;
}

/* 街机外壳 */
.arcade-console {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-width: 600px;
  height: 100%;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px var(--shadow-color);
}

/* 顶灯 */
.marquee {
  background: #111;
  border-bottom: 4px solid var(--border-color);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  cursor: pointer;
}
.back-btn {
  font-size: 10px;
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 4px;
  background: #222;
  box-shadow: 0 2px 0 var(--border-color);
  transition: all 0.1s;
}
.back-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--border-color);
}
.game-title {
  font-size: 18px;
  font-weight: bold;
  color: #00ffcc;
  text-shadow: 0 0 10px #00ffcc;
  margin: 0;
}
.version { font-size: 8px; color: #ff3366; }

/* 显像管屏幕框 */
.screen-bezel {
  flex: 1;
  background: #1a1a1a;
  padding: 15px;
  border-bottom: 4px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 30px #000;
}

.screen-glass {
  flex: 1;
  background: #050505;
  border: 4px solid #333;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 50px rgba(0,0,0,0.9);
}

/* CRT 模拟特效 */
.crt-effect::after {
  content: " ";
  display: block;
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 4px, 6px 100%;
  z-index: 99;
  pointer-events: none;
}

/* 顶部 HUD */
.hud-bar {
  background: #000;
  border-bottom: 2px dashed #333;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}
.hud-item { display: flex; flex-direction: column; gap: 4px; }
.hud-item.center-item { align-items: center; }
.hud-label { font-size: 8px; color: var(--text-secondary); }
.hud-val { font-size: 14px; color: var(--text-primary); }
.hud-val.highlight { color: #00ffcc; text-shadow: 0 0 5px #00ffcc; }

.lives-box { display: flex; gap: 4px; }
.life-heart { color: #ff3366; font-size: 12px; animation: heartBeat 1.2s infinite alternate; }

@keyframes heartBeat {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}

/* 游戏视界容器 */
.stage-container {
  flex: 1;
  position: relative;
  width: 100%;
  background: #0a0a0d;
}

.game-canvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: block;
}

/* 遮罩面板 */
.screen-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 80;
  text-align: center;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.pixel-title {
  font-size: 20px;
  color: #00ffcc;
  text-shadow: 0 0 10px #00ffcc;
  margin-bottom: 30px;
}
.pixel-title.danger { color: #ff3366; text-shadow: 0 0 10px #ff3366; }
.pixel-title.win-text { color: #34C759; text-shadow: 0 0 10px #34C759; }

.rules, .results-box { margin-bottom: 30px; display: flex; flex-direction: column; gap: 15px; font-size: 10px; color: #ccc; text-align: left; }
.results-box span { color: #00ffcc; font-weight: bold; margin-left: 10px; }

.hint-text { font-size: 10px; color: #fff; margin-top: 20px; }
.blink { animation: stepBlink 1s step-end infinite; }
@keyframes stepBlink { 50% { opacity: 0; } }

/* 底部控制台 */
.control-panel {
  background: var(--card-background);
  border-top: 2px solid var(--border-color);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
}

/* 极客诊断通道按钮 */
.diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
}
.mini-diag-btn {
  padding: 10px 8px !important;
  box-shadow: 0 3px 0 var(--border-color) !important;
}
.mini-diag-btn:active {
  transform: translateY(3px) !important;
  box-shadow: 0 0 0 var(--border-color) !important;
}

/* 系统操作键 */
.action-section {
  display: flex;
  gap: 15px;
  flex-wrap: nowrap;
  justify-content: center;
  width: 100%;
}

.sys-btn {
  flex: 1;
  background: var(--console-body);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--border-color);
  transition: all 0.1s;
}
.sys-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--border-color);
}
.sys-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.sys-icon { font-size: 16px; color: var(--text-main); display: flex; align-items: center; justify-content: center;}
.sys-text { font-size: 8px; color: var(--text-secondary); font-family: inherit; }

/* 移动端专属滑轨 (Touch Slider) */
.slider-section {
  width: 100%;
  padding: 5px 0;
}
.touch-slider {
  width: 100%;
  height: 44px;
  background: var(--console-body);
  border: 2px solid var(--border-color);
  border-radius: 22px;
  position: relative;
  box-shadow: inset 0 4px 8px var(--shadow-color);
  display: flex;
  justify-content: center;
  align-items: center;
}
.slider-track {
  width: calc(100% - 44px);
  height: 100%;
  position: relative;
}
.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 32px;
  background: var(--text-primary);
  border-radius: 16px;
  color: var(--background);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
}
.slider-hint {
  position: absolute;
  font-size: 8px;
  color: var(--text-secondary);
  pointer-events: none;
  opacity: 0.5;
}

/* ================= 悬浮复古弹窗数据监控终端 ================= */
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
  background: #0d1510;
  border: 4px solid #1a3324;
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
  color: #00FF41;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.4);
}

.tab-buttons {
  display: flex;
  gap: 10px;
}

.tab-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
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
  font-size: 11px;
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
  font-size: 11px;
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
  font-size: 10px;
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
  padding: 6px 12px;
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
  padding: 12px 0;
  font-size: 12px;
  background: transparent;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
}

.danger-btn {
  color: #FF2A2A;
  border: 2px solid #FF2A2A;
  box-shadow: 3px 3px 0px #FF2A2A;
}

.danger-btn:active {
  box-shadow: 0px 0px 0px #FF2A2A;
}

/* ================= 响应式调整 ================= */
@media screen and (max-width: 768px) {
  .yuemu-retro-brick-universe { padding: 0; }
  .arcade-console {
    border-radius: 0; border: none; box-shadow: none;
    padding: 10px 10px max(15px, env(safe-area-inset-bottom)) 10px;
    justify-content: space-between;
  }

  .marquee { padding: 10px; }
  .game-title { font-size: 14px; }
  .screen-bezel { padding: 5px; border: none; box-shadow: none; }

  .hud-bar { padding: 8px; }
  .hud-label { font-size: 7px; }
  .hud-val { font-size: 12px; }

  .control-panel {
    padding: 10px 5px;
    border: none;
    background: transparent;
    gap: 12px;
  }

  .action-section { gap: 8px; }
  .sys-btn { padding: 10px 4px; }

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

/* PC 端左右宽屏分栏布局重构 */
@media (min-width: 769px) {
  .arcade-console {
    max-width: 960px;
    height: 85vh;
    max-height: 900px;
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto 1fr;
    border-radius: 16px;
    gap: 0;
    padding: 0;
    overflow: hidden;
  }
  .marquee {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    border-right: 4px solid var(--border-color);
  }
  .screen-bezel {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
    border-right: 4px solid var(--border-color);
    border-radius: 0;
    box-shadow: none;
    padding: 15px;
    background: transparent;
  }
  .control-panel {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    flex-direction: column;
    justify-content: center;
    border-top: none;
    padding: 30px 20px;
    gap: 25px;
  }
  .diagnostic-trigger-bar, .action-section {
    flex-direction: column;
    gap: 15px;
  }
  .sys-btn {
    flex-direction: row;
    width: 100%;
    justify-content: flex-start;
    padding: 15px 20px;
  }
  .sys-text {
    font-size: 14px;
    margin-left: 15px;
  }
}
</style>
