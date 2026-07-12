<template>
  <div class="yuemu-retro-snake-universe" @touchmove.prevent>
    <div class="arcade-console">

      <div class="console-header">
        <div class="brand">
          <span class="brand-name">SNAKE</span>
          <span class="brand-model">CLASSIC-89</span>
        </div>
        <div class="speaker-grill">
          <div class="dot" v-for="i in 12" :key="i"></div>
        </div>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass">
          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.snakeGamePage.highScore') }}</span>
              <span class="hud-val">{{ highestScores[currentMode] || 0 }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.snakeGamePage.score') }}</span>
              <span class="hud-val">{{ score }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.snakeGamePage.time') }}</span>
              <span class="hud-val">{{ formatTime(gameTime) }}</span>
            </div>
          </div>

          <div class="canvas-container crt-effect">
            <canvas
              ref="gameCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              class="game-canvas"
            ></canvas>

            <div v-if="!gameStarted && !showRankingModal && !showGameOverModal" class="screen-overlay menu-overlay">
              <h1 class="pixel-title">{{ t('pages.games.snakeGamePage.snakeGame') }}</h1>
              <div class="menu-list">
                <div
                  v-for="(mode, index) in gameModes"
                  :key="mode.id"
                  class="menu-item"
                  :class="{ 'selected': currentMode === mode.id }"
                  @click="selectMode(mode.id)"
                >
                  <span class="cursor" v-show="currentMode === mode.id">▶</span>
                  {{ mode.name }}
                </div>
              </div>
              <div class="action-hints">
                <p class="blink">{{ t('pages.games.snakeGamePage.pressStartGame') }}</p>
                <p @click="showRankingModal = true; playSound('select')" class="clickable-hint">{{ t('pages.games.snakeGamePage.leaderboardL') }}</p>
              </div>
            </div>

            <div v-if="showRankingModal" class="screen-overlay leaderboard-overlay">
              <h2 class="pixel-subtitle">{{ t('pages.games.snakeGamePage.leaderboard') }}</h2>
              <div class="leaderboard-tabs">
                <span
                  v-for="mode in gameModes"
                  :key="mode.id"
                  :class="{ 'active': rankingMode === mode.id }"
                  @click="rankingMode = mode.id; playSound('select')"
                >
                  {{ mode.name.replace(t('pages.games.snakeGamePage.mode'), '') }}
                </span>
              </div>
              <div class="leaderboard-list">
                <div v-for="(record, index) in rankingList.slice(0, 5)" :key="record.id" class="lb-row">
                  <span class="lb-rank">{{ index + 1 }}</span>
                  <span class="lb-name">{{ record.userName || 'AAA' }}</span>
                  <span class="lb-score">{{ record.score }}</span>
                </div>
                <div v-if="rankingList.length === 0" class="lb-empty">{{ t('pages.games.snakeGamePage.noRecord') }}</div>
              </div>
              <p class="blink clickable-hint" @click="showRankingModal = false; playSound('select')">{{ t('pages.games.snakeGamePage.pressBReturn') }}</p>
            </div>

            <div v-if="showGameOverModal" class="screen-overlay game-over-overlay">
              <h1 class="pixel-title">{{ t('pages.games.snakeGamePage.gameOver') }}</h1>
              <div class="results">
                <p>{{ t('pages.games.snakeGamePage.scoreIs', { score: score }) }}</p>
                <p>{{ t('pages.games.snakeGamePage.snakeLengthVal', { length: snakeLength }) }}</p>
                <p>{{ t('pages.games.snakeGamePage.timeFormatTime', { time: formatTime(gameTime) }) }}</p>
              </div>
              <div class="action-hints">
                <p class="blink clickable-hint" @click="restartGame">{{ t('pages.games.snakeGamePage.pressStartToRetryBracket') }}</p>
                <p class="clickable-hint" @click="backToMode">{{ t('pages.games.snakeGamePage.pressBReturnMenu') }}</p>
              </div>
            </div>

            <div v-if="isPaused && gameStarted" class="screen-overlay pause-overlay">
              <h1 class="pixel-title blink">{{ t('pages.games.snakeGamePage.pause') }}</h1>
            </div>
          </div>
        </div>
      </div>

      <div class="control-panel">

        <div class="d-pad-section">
          <div class="d-pad">
            <div class="d-row">
              <button class="d-btn up" @touchstart.prevent="handleDirection('up')" @mousedown="handleDirection('up')">
                <i class="d-icon">▲</i>
              </button>
            </div>
            <div class="d-row center-row">
              <button class="d-btn left" @touchstart.prevent="handleDirection('left')" @mousedown="handleDirection('left')">
                <i class="d-icon">◀</i>
              </button>
              <div class="d-center">
                <div class="d-center-dent"></div>
              </div>
              <button class="d-btn right" @touchstart.prevent="handleDirection('right')" @mousedown="handleDirection('right')">
                <i class="d-icon">▶</i>
              </button>
            </div>
            <div class="d-row">
              <button class="d-btn down" @touchstart.prevent="handleDirection('down')" @mousedown="handleDirection('down')">
                <i class="d-icon">▼</i>
              </button>
            </div>
          </div>
        </div>

        <div class="system-section">
          <div class="sys-btn-group">
            <button class="sys-btn sound-btn" @click="toggleSound" :class="{ 'active': isSoundEnabled }">
              <div class="pill">
                <span class="pill-icon"><i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i></span>
              </div>
              <span class="sys-label">{{ t('pages.games.snakeGamePage.sound') }}</span>
            </button>
            <button class="sys-btn start-btn" @click="handleStartPause">
              <div class="pill">
                <span class="pill-icon"><i :class="gameStarted && !isPaused ? 'fas fa-pause' : 'fas fa-play'"></i></span>
              </div>
              <span class="sys-label">{{ gameStarted && !isPaused ? t('pages.games.snakeGamePage.pause') : t('pages.games.snakeGamePage.start') }}</span>
            </button>
          </div>
        </div>

        <div class="action-section">
          <div class="action-buttons">
            <div class="btn-wrapper">
              <button class="a-btn b-btn" @click="handleBPress">B</button>
            </div>
            <div class="btn-wrapper">
              <button class="a-btn a-btn-main" @click="handleAPress">A</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

// 假设这些是你之前的 API 接口，保持不变
import {
  getSnakeRankingListUsingPost,
  saveSnakeGameRecordUsingPost,
  getUserAllHighestScoresUsingGet
} from '@/api/snakeGameController'

// --- 游戏常量 ---
const GRID_SIZE = 20
const GAME_SPEED = 180
const SPEED_INCREMENT = 5

// --- 游戏模式 ---
const gameModes = [
  { id: 1, name: t('pages.games.snakeGamePage.classicMode'), desc: t('pages.games.snakeGamePage.dieOnWall') },
  { id: 2, name: t('pages.games.snakeGamePage.noWallMode'), desc: t('pages.games.snakeGamePage.teleportWall') },
  { id: 3, name: t('pages.games.snakeGamePage.speedMode'), desc: t('pages.games.snakeGamePage.threeMinLimit') }
]

// --- 状态管理 ---
const gameStarted = ref(false)
const isPaused = ref(false)
const showGameOverModal = ref(false)
const showRankingModal = ref(false)

const score = ref(0)
const snakeLength = ref(3)
const gameTime = ref(0)
const currentMode = ref(1)
const direction = ref('right')
const nextDirection = ref('right')
const currentSpeed = ref(GAME_SPEED)

const snake = ref<{x: number, y: number}[]>([])
const food = ref({ x: 0, y: 0 })
const obstacles = ref<{x: number, y: number}[]>([])
const OBSTACLE_COUNT = 5

let gameLoop: number | null = null
let timeInterval: number | null = null

// --- 画布与渲染 ---
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(400)
const canvasHeight = ref(400)
const cellSize = computed(() => canvasWidth.value / GRID_SIZE)

// 排行榜数据
const rankingMode = ref(1)
const rankingList = ref<any[]>([])
const highestScores = ref<Record<number, number>>({ 1: 0, 2: 0, 3: 0 })

// 音效系统
const isSoundEnabled = ref(true)

const sounds = {
  move: new Audio(new URL('@/assets/sounds/move.MP3', import.meta.url).href),
  eat: new Audio(new URL('@/assets/sounds/coin.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  gameOver: new Audio(new URL('@/assets/sounds/gameover.MP3', import.meta.url).href),
  select: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href),
  pause: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  resume: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  modeSwitch: new Audio(new URL('@/assets/sounds/rotate.MP3', import.meta.url).href),
  speedUp: new Audio(new URL('@/assets/sounds/powerup.MP3', import.meta.url).href)
}

// 设置音量
sounds.move.volume = 0.15
sounds.eat.volume = 0.5
sounds.start.volume = 0.5
sounds.gameOver.volume = 0.6
sounds.select.volume = 0.3
sounds.pause.volume = 0.3
sounds.resume.volume = 0.4
sounds.modeSwitch.volume = 0.3
sounds.speedUp.volume = 0.4

const playSound = (type: keyof typeof sounds) => {
  if (!isSoundEnabled.value) return
  const audio = sounds[type]
  audio.currentTime = 0
  audio.play().catch(() => {})
}

const toggleSound = () => {
  isSoundEnabled.value = !isSoundEnabled.value
  if (isSoundEnabled.value) {
    playSound('select')
  }
}

// --- 核心逻辑 ---
const initSnake = () => {
  const startX = Math.floor(GRID_SIZE / 2)
  const startY = Math.floor(GRID_SIZE / 2)
  snake.value = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ]
  direction.value = 'right'
  nextDirection.value = 'right'
}

const generateFood = () => {
  let newFood
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    }
  } while (
    snake.value.some(s => s.x === newFood.x && s.y === newFood.y) ||
    obstacles.value.some(obs => obs.x === newFood.x && obs.y === newFood.y)
    )
  food.value = newFood
}

const generateObstacles = () => {
  obstacles.value = []
  if (currentMode.value !== 1) return

  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    let obs
    do {
      obs = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (
      snake.value.some(s => s.x === obs.x && s.y === obs.y) ||
      (food.value && food.value.x === obs.x && food.value.y === obs.y) ||
      obstacles.value.some(o => o.x === obs.x && o.y === obs.y) ||
      (Math.abs(obs.x - snake.value[0].x) <= 3 && Math.abs(obs.y - snake.value[0].y) <= 3)
      )
    obstacles.value.push(obs)
  }
}

const initGame = () => {
  score.value = 0
  gameTime.value = 0
  snakeLength.value = 3
  currentSpeed.value = GAME_SPEED
  initSnake()
  generateObstacles()
  generateFood()
}

const startGame = () => {
  gameStarted.value = true
  showGameOverModal.value = false
  initGame()
  playSound('start')
  startTimer()

  if (gameLoop) cancelAnimationFrame(gameLoop)
  let lastTime = 0
  let lastSpeed = currentSpeed.value

  const loop = (timestamp: number) => {
    if (!isPaused.value && gameStarted.value) {
      if (!lastTime || timestamp - lastTime >= currentSpeed.value) {
        moveSnake()
        drawGame()
        lastTime = timestamp

        if (currentMode.value === 3) {
          const newSpeed = Math.max(50, GAME_SPEED - Math.floor(gameTime.value / 10) * SPEED_INCREMENT)
          if (newSpeed < lastSpeed && newSpeed % 30 === 0) {
            playSound('speedUp')
          }
          currentSpeed.value = newSpeed
          lastSpeed = newSpeed
        }
      }
    } else {
      lastTime = 0
    }
    gameLoop = requestAnimationFrame(loop)
  }
  gameLoop = requestAnimationFrame(loop)
}

const moveSnake = () => {
  if (!snake.value.length) return

  direction.value = nextDirection.value
  const head = { ...snake.value[0] }

  switch (direction.value) {
    case 'up': head.y -= 1; break
    case 'down': head.y += 1; break
    case 'left': head.x -= 1; break
    case 'right': head.x += 1; break
  }

  if (currentMode.value === 2) {
    if (head.x >= GRID_SIZE) head.x = 0
    if (head.x < 0) head.x = GRID_SIZE - 1
    if (head.y >= GRID_SIZE) head.y = 0
    if (head.y < 0) head.y = GRID_SIZE - 1
  } else if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    endGame()
    return
  }

  if (
    snake.value.some(s => s.x === head.x && s.y === head.y) ||
    (currentMode.value === 1 && obstacles.value.some(o => o.x === head.x && o.y === head.y))
  ) {
    endGame()
    return
  }

  snake.value.unshift(head)

  if (head.x === food.value.x && head.y === food.value.y) {
    playSound('eat')
    score.value += 10
    snakeLength.value = snake.value.length
    generateFood()
  } else {
    snake.value.pop()
    // 移动时不播放声音
  }
}

const drawGame = () => {
  const ctx = gameCanvas.value?.getContext('2d')
  if (!ctx) return

  const w = canvasWidth.value
  const h = canvasHeight.value
  const cs = cellSize.value

  const style = getComputedStyle(document.body)
  const bgColor = style.getPropertyValue('--screen-bg').trim() || '#8bac0f'
  const pixelColor = style.getPropertyValue('--pixel-color').trim() || '#0f380f'
  const highlightColor = style.getPropertyValue('--pixel-highlight').trim() || '#306230'

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = pixelColor
  ctx.globalAlpha = 0.05
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      ctx.fillRect(i * cs + 1, j * cs + 1, cs - 2, cs - 2)
    }
  }
  ctx.globalAlpha = 1.0

  if (currentMode.value === 1) {
    ctx.fillStyle = pixelColor
    obstacles.value.forEach(obs => {
      ctx.fillRect(obs.x * cs + 1, obs.y * cs + 1, cs - 2, cs - 2)
      ctx.clearRect(obs.x * cs + 3, obs.y * cs + 3, cs - 6, cs - 6)
      ctx.fillRect(obs.x * cs + 5, obs.y * cs + 5, cs - 10, cs - 10)
    })
  }

  if (food.value) {
    const time = Date.now()
    if (Math.floor(time / 200) % 2 === 0) {
      ctx.fillStyle = highlightColor
    } else {
      ctx.fillStyle = pixelColor
    }
    ctx.fillRect(food.value.x * cs + 2, food.value.y * cs + 2, cs - 4, cs - 4)
  }

  snake.value.forEach((segment, index) => {
    ctx.fillStyle = pixelColor
    if (index === 0) {
      ctx.fillRect(segment.x * cs, segment.y * cs, cs, cs)
      ctx.fillStyle = bgColor
      ctx.fillRect(segment.x * cs + cs/4, segment.y * cs + cs/4, cs/4, cs/4)
    } else {
      ctx.fillRect(segment.x * cs + 1, segment.y * cs + 1, cs - 2, cs - 2)
    }
  })
}

// --- 控制器方法 ---
const selectMode = (id: number) => {
  currentMode.value = id
  playSound('modeSwitch')
}

const handleStartPause = () => {
  if (showGameOverModal.value) {
    restartGame()
  } else if (!gameStarted.value) {
    startGame()
  } else {
    isPaused.value = !isPaused.value
    playSound(isPaused.value ? 'pause' : 'resume')
  }
}

const handleAPress = () => {
  if (!gameStarted.value && !showRankingModal.value) {
    startGame()
  } else {
    playSound('select')
  }
}

const handleBPress = () => {
  if (showRankingModal.value) {
    showRankingModal.value = false
    playSound('select')
  } else if (showGameOverModal.value || isPaused.value) {
    backToMode()
    playSound('select')
  }
}

const handleDirection = (dir: string) => {
  if (!gameStarted.value || isPaused.value) {
    if (!gameStarted.value && !showRankingModal.value && !showGameOverModal.value) {
      if (dir === 'up') {
        currentMode.value = currentMode.value === 1 ? 3 : currentMode.value - 1
        playSound('modeSwitch')
      }
      if (dir === 'down') {
        currentMode.value = currentMode.value === 3 ? 1 : currentMode.value + 1
        playSound('modeSwitch')
      }
    }
    return
  }

  if (dir === 'up' && direction.value !== 'down') nextDirection.value = 'up'
  if (dir === 'down' && direction.value !== 'up') nextDirection.value = 'down'
  if (dir === 'left' && direction.value !== 'right') nextDirection.value = 'left'
  if (dir === 'right' && direction.value !== 'left') nextDirection.value = 'right'
}

const handleKeydown = (e: KeyboardEvent) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault()
  }

  switch (e.key) {
    case 'ArrowUp': handleDirection('up'); break
    case 'ArrowDown': handleDirection('down'); break
    case 'ArrowLeft': handleDirection('left'); break
    case 'ArrowRight': handleDirection('right'); break
    case 'Enter':
    case ' ': handleStartPause(); break
    case 'Escape':
    case 'b':
    case 'B': handleBPress(); break
    case 'a':
    case 'A': handleAPress(); break
    case 'l':
    case 'L': if(!gameStarted.value) showRankingModal.value = true; break
  }
}

const startTimer = () => {
  if (timeInterval) clearInterval(timeInterval)
  timeInterval = window.setInterval(() => {
    if (!isPaused.value) {
      gameTime.value++
      if (currentMode.value === 3 && gameTime.value >= 180) {
        endGame()
      }
    }
  }, 1000)
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const endGame = async () => {
  gameStarted.value = false
  showGameOverModal.value = true
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (timeInterval) clearInterval(timeInterval)
  playSound('gameOver')

  try {
    await saveSnakeGameRecordUsingPost({
      score: score.value,
      foodCount: Math.floor(score.value / 10),
      gameTime: gameTime.value,
      snakeLength: snakeLength.value,
      gameMode: currentMode.value
    })
    await getUserHighestScores()
  } catch (error) {
    // Ignore api error in frontend demo
  }
}

const restartGame = () => {
  showGameOverModal.value = false
  startGame()
}

const backToMode = () => {
  showGameOverModal.value = false
  isPaused.value = false
  gameStarted.value = false
  drawMenuBackground()
}

const drawMenuBackground = () => {
  const ctx = gameCanvas.value?.getContext('2d')
  if (!ctx) return
  const style = getComputedStyle(document.body)
  ctx.fillStyle = style.getPropertyValue('--screen-bg').trim() || '#8bac0f'
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
}

const getUserHighestScores = async () => {
  try {
    const res = await getUserAllHighestScoresUsingGet()
    if (res?.data?.data) {
      highestScores.value = {
        1: res.data.data.classicModeScore || 0,
        2: res.data.data.noWallModeScore || 0,
        3: res.data.data.speedModeScore || 0
      }
    }
  } catch (e) {}
}

const getRankingData = async () => {
  try {
    const res = await getSnakeRankingListUsingPost({ gameMode: rankingMode.value, limit: 10 })
    if (res?.data?.data) {
      rankingList.value = res.data.data
    }
  } catch (e) {}
}

watch(rankingMode, getRankingData)
watch(showRankingModal, (val) => {
  if (val) { rankingMode.value = currentMode.value; getRankingData() }
})

const resizeCanvas = () => {
  const screenW = window.innerWidth
  const screenH = window.innerHeight
  // 在移动端，为下方虚拟按键留出约 180px 的安全高度，避免画布太大把按键挤出屏幕
  const containerW = screenW > 768 ? 400 : Math.min(screenW - 20, screenH - 180)

  const size = Math.floor(containerW / GRID_SIZE) * GRID_SIZE
  canvasWidth.value = Math.max(200, size) // 至少给一个下限防止崩溃
  canvasHeight.value = Math.max(200, size)

  if (gameStarted.value && !isPaused.value) {
    drawGame()
  } else if (!gameStarted.value) {
    drawMenuBackground()
  }
}

onMounted(() => {
  resizeCanvas()
  getUserHighestScores()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', handleKeydown)
  setTimeout(drawMenuBackground, 100)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeydown)
  if (gameLoop) cancelAnimationFrame(gameLoop)
  if (timeInterval) clearInterval(timeInterval)
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
  --pixel-highlight: #306230;
  --text-main: #4a4a4a;

  /* 恢复经典红白机/Gameboy的按键色彩 */
  --btn-primary: #B22222;    /* 经典深红色 (A/B键) */
  --btn-secondary: #333333;  /* 经典碳黑色 (十字键) */
  --btn-system: #888888;     /* 经典灰色 (Start/Select) */
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

.yuemu-retro-snake-universe {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100dvh;
  background-color: var(--background, #2c2c2c);
  display: flex; flex-direction: column;
  font-family: 'PressStart2P', 'Courier New', monospace;
  overflow: hidden;
  padding: 10px;
}

.arcade-console {
  background: var(--console-body);
  border: 4px solid var(--console-border);
  border-radius: 20px 20px 60px 20px;
  padding: 20px;
  display: flex; flex-direction: column; gap: 20px;
  box-shadow:
    10px 10px 0px rgba(0,0,0,0.3),
    inset 4px 4px 10px rgba(255,255,255,0.2),
    inset -4px -4px 10px rgba(0,0,0,0.2);
  max-width: 500px; width: 100%;
  min-height: 800px; /* 设置最小高度 */
  margin: auto; /* 居中 */
}

.console-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 10px; }
.brand { display: flex; flex-direction: column; }
.brand-name { font-size: 18px; font-weight: bold; color: var(--btn-primary); font-style: italic; letter-spacing: 2px;}
.brand-model { font-size: 11px; color: var(--text-main); margin-top: 4px; }

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
.hud-label { font-size: 11px; color: var(--pixel-color); opacity: 0.8; }
.hud-val { font-size: 12px; color: var(--pixel-color); }

.canvas-container { position: relative; display: flex; justify-content: center; align-items: center; padding: 10px; aspect-ratio: 1 / 1; }
.game-canvas { image-rendering: pixelated; }

.screen-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(var(--screen-bg-rgb, 139,172,15), 0.95);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 20; color: var(--pixel-color); text-align: center; padding: 20px;
}
@media (prefers-color-scheme: dark) { .screen-overlay { background: rgba(11, 16, 33, 0.95); } }
@media (prefers-color-scheme: dark) { .screen-overlay { background: rgba(11, 16, 33, 0.95); } }

.pixel-title { font-size: 24px; margin-bottom: 20px; text-shadow: 2px 2px 0px rgba(0,0,0,0.2); }
.pixel-subtitle { font-size: 14px; margin-bottom: 15px; }

.menu-list { display: flex; flex-direction: column; gap: 12px; width: 100%; align-items: flex-start; padding-left: 20%; margin-bottom: 20px;}
.menu-item { font-size: 12px; cursor: pointer; position: relative; }
.menu-item .cursor { position: absolute; left: -16px; animation: blink 1s infinite; }

.action-hints { margin-top: auto; display: flex; flex-direction: column; gap: 10px; font-size: 10px; }
.clickable-hint { cursor: pointer; }
.clickable-hint:active { transform: scale(0.95); }

.leaderboard-tabs { display: flex; gap: 10px; font-size: 12px; margin-bottom: 15px; border-bottom: 1px solid var(--pixel-color); padding-bottom: 5px; }
.leaderboard-tabs span { cursor: pointer; opacity: 0.5; }
.leaderboard-tabs span.active { opacity: 1; font-weight: bold; }
.leaderboard-list { width: 100%; display: flex; flex-direction: column; gap: 8px; font-size: 10px; margin-bottom: 20px; }
.lb-row { display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(0,0,0,0.2); padding-bottom: 4px;}
.lb-rank { width: 20px; text-align: left; }
.lb-name { flex: 1; text-align: left; }
.lb-score { width: 40px; text-align: right; }
.lb-empty { text-align: center; margin-top: 20px; opacity: 0.5; }

.results { margin: 20px 0; display: flex; flex-direction: column; gap: 10px; font-size: 12px; text-align: left; }
.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* === 控制面板区 (采用 Flexbox 实现 PC 端与 Mobile 端的无缝切换) === */
.control-panel {
  flex: 1;
  display: flex;
  flex-direction: row; /* 默认 PC 布局为一行 */
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

/* Flex Order 控制 PC 端的左右中顺序 */
.d-pad-section { order: 1; flex: 1; display: flex; justify-content: flex-start; }
.system-section { order: 2; display: flex; align-items: flex-end; padding-bottom: 20px; }
.action-section { order: 3; flex: 1; display: flex; justify-content: flex-end; }

/* 十字键 (D-Pad) */
.d-pad {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(0,0,0,0.05); padding: 10px; border-radius: 50%;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1);
}
.d-row { display: flex; }
.d-btn {
  width: 35px; height: 35px;
  background: var(--btn-secondary);
  border: none;
  display: flex; justify-content: center; align-items: center;
  box-shadow:
    inset 2px 2px 4px rgba(255,255,255,0.2),
    inset -2px -2px 4px rgba(0,0,0,0.4),
    2px 2px 4px rgba(0,0,0,0.3);
}
/* 给方向键刻上凹陷的箭头 */
.d-icon {
  font-family: Arial, sans-serif;
  color: rgba(255,255,255,0.2);
  font-size: 12px;
  font-style: normal;
  text-shadow: -1px -1px 0 rgba(0,0,0,0.8);
}

.d-center { width: 35px; height: 35px; background: var(--btn-secondary); position: relative; }
.d-center-dent {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 15px; height: 15px; border-radius: 50%;
  background: rgba(0,0,0,0.3); box-shadow: inset 1px 1px 3px rgba(0,0,0,0.8);
}
.d-btn.up { border-radius: 4px 4px 0 0; }
.d-btn.down { border-radius: 0 0 4px 4px; }
.d-btn.left { border-radius: 4px 0 0 4px; }
.d-btn.right { border-radius: 0 4px 4px 0; }

.d-btn:active {
  background: #111;
  box-shadow: inset 2px 2px 6px rgba(0,0,0,0.8);
}

/* 系统键 (Start/Sound) */
.sys-btn-group { display: flex; gap: 20px; transform: rotate(-15deg); }
.sys-btn {
  background: transparent; border: none;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer;
  transition: transform 0.1s;
}
.sys-btn:active { transform: scale(0.95); }

.pill {
  width: 60px; height: 18px;
  background: var(--btn-system); border-radius: 12px;
  box-shadow: 3px 3px 6px rgba(0,0,0,0.3), inset 2px 2px 3px rgba(255,255,255,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.pill-icon {
  font-size: 14px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.sys-btn:active .pill { transform: translate(1px, 1px); box-shadow: inset 2px 2px 4px rgba(0,0,0,0.6); }
.sys-label { font-size: 10px; color: var(--text-main); font-weight: bold; letter-spacing: 1px; }

/* 声音按钮特殊样式 */
.sound-btn.active .pill {
  background: linear-gradient(135deg, #34c759, #b4ec51);
  box-shadow: 0 0 8px rgba(52, 199, 89, 0.5), 2px 2px 4px rgba(0,0,0,0.3);
}

/* 开始按钮特殊样式 */
.start-btn .pill {
  background: linear-gradient(135deg, #007aff, #00c6ff);
  box-shadow: 0 0 8px rgba(0, 122, 255, 0.5), 2px 2px 4px rgba(0,0,0,0.3);
}

/* 动作键 (A/B) */
.action-buttons {
  display: flex; gap: 15px;
  transform: rotate(-15deg);
  background: rgba(0,0,0,0.05); padding: 15px 25px; border-radius: 40px;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1);
}
.btn-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.a-btn {
  width: 45px; height: 45px; border-radius: 50%; border: none;
  background: var(--btn-primary);
  display: flex; justify-content: center; align-items: center;
  /* 凸起 A/B 字样质感 */
  color: rgba(255,255,255,0.7);
  font-family: Arial, sans-serif;
  font-size: 18px;
  font-weight: 900;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
  box-shadow:
    2px 4px 0 rgba(0,0,0,0.5),
    inset 2px 2px 4px rgba(255,255,255,0.4);
}
.a-btn:active {
  transform: translate(2px, 4px);
  box-shadow: inset 2px 2px 6px rgba(0,0,0,0.6);
  color: rgba(255,255,255,0.5);
}


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
      "screen d-pad"
      "screen actions"
      "screen sys";
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
  
  /* 魔法：使控制面板的直接子元素成为 arcade-console 的 grid item */
  .control-panel { display: contents; }
  
  .d-pad-section { grid-area: d-pad; justify-content: center; align-items: flex-end; padding-bottom: 10px; }
  .action-section { grid-area: actions; justify-content: center; align-items: center; }
  .system-section { grid-area: sys; justify-content: center; align-items: flex-start; padding-top: 10px; }
  
  .sys-btn-group { transform: none; gap: 30px; }
}

/* =========================================
   响应式调整 (Mobile 移动端专属布局)
   - 核心：把系统键、方向键、动作键挤在一行，防止整体高度溢出屏幕导致上下滚动
   ========================================= */
@media screen and (max-width: 768px) {
  .yuemu-retro-snake-universe { padding: 0; background-color: var(--console-body); }
  .arcade-console { border-radius: 0; border: none; box-shadow: none; padding: 10px 5px; gap: 5px; height: 100%; max-height: 100dvh; min-height: unset; width: 100%; justify-content: center; }
  .screen-bezel { padding: 10px; border-radius: 8px; flex-shrink: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }

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
    transform: none; /* 取消倾斜 */
    gap: 10px;       /* 缩小距离 */
    flex-direction: column; /* 上下排列 Start 和 Sound 节省横向空间 */
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
