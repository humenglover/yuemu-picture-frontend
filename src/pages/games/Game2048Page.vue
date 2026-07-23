<template>
  <div class="yuemu-retro-2048-universe" :class="{ 'is-mobile': isMobile }" @touchmove="handleRootTouchMove">

    <div class="arcade-console">

      <div class="marquee" @click="quitGame">
        <span class="back-btn">{{ t('pages.games.game2048Page.returnBack') }}</span>
        <h1 class="game-title">{{ t('pages.games.game2048Page.game2048Classic') }}</h1>
        <span class="version">V1.0</span>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass crt-effect">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.game2048Page.score') }}</span>
              <span class="hud-val highlight">{{ score }}</span>
            </div>
            <div class="hud-item center-item">
              <span class="hud-label">{{ t('pages.games.game2048Page.time') }}</span>
              <span class="hud-val">{{ formatTime(gameTime) }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.game2048Page.highScore') }}</span>
              <span class="hud-val">{{ bestScore }}</span>
            </div>
          </div>

          <div class="action-section">
            <button class="sys-btn" @click="newGame">
              <span class="sys-icon"><redo-outlined /></span>
              <span class="sys-text">{{ t('pages.games.game2048Page.newGame') }}</span>
            </button>
            <button class="sys-btn" @click="toggleRankingModal" :class="{ 'active': showRankingModal }">
              <span class="sys-icon"><trophy-outlined /></span>
              <span class="sys-text">{{ t('pages.games.game2048Page.rank') }}</span>
            </button>
            <button class="sys-btn" @click="toggleHistoryModal" :class="{ 'active': showHistoryModal }">
              <span class="sys-icon"><history-outlined /></span>
              <span class="sys-text">{{ t('pages.games.game2048Page.history') }}</span>
            </button>
            <button class="sys-btn" @click="toggleSound">
          <span class="sys-icon">
            <sound-filled v-if="isSoundEnabled" />
            <sound-outlined v-else />
          </span>
              <span class="sys-text">{{ t('pages.games.game2048Page.sound') }}</span>
            </button>
          </div>

          <div class="stage-wrapper">
            <div
              class="stage-container"
              @touchstart="handleTouchStart"
              @touchmove="handleTouchMove"
              @touchend="handleTouchEnd"
            >
              <div class="grid-layer">
                <div v-for="row in 4" :key="'row-'+row" class="grid-row">
                  <div v-for="col in 4" :key="'cell-'+row+'-'+col" class="grid-cell"></div>
                </div>
              </div>

              <div class="tiles-layer">
                <div
                  v-for="tile in tiles"
                  :key="tile.id"
                  class="retro-tile"
                  :class="{
                    [`tile-${tile.value}`]: true,
                    'tile-new': tile.isNew,
                    'tile-merged': tile.mergedFrom
                  }"
                  :style="{
                    transform: `translate(calc(${tile.y * 100}% + ${tile.y * 2}%), calc(${tile.x * 100}% + ${tile.x * 2}%))`
                  }"
                >
                  <div class="tile-inner">{{ tile.value }}</div>
                </div>
              </div>

              <div v-if="showRankingModal" class="screen-overlay list-overlay" @touchmove.stop>
                <h2 class="pixel-subtitle">{{ t('pages.games.game2048Page.leaderboard') }}</h2>
                <div class="scroll-list">
                  <div v-for="(record, index) in rankingList" :key="index" class="lb-row" @click="handleUserClick(record)">
                    <span class="lb-rank">{{ index + 1 }}</span>
                    <div class="lb-user">
                      <img :src="record.userAvatar || getDefaultAvatar(record.userName)" class="avatar-mini" />
                      <span class="lb-name">{{ record.userName || t('pages.games.game2048Page.anonymous') }}</span>
                    </div>
                    <span class="lb-score">{{ record.score }}</span>
                  </div>
                  <div v-if="rankingList.length === 0" class="empty-hint">{{ t('pages.games.game2048Page.noRecord') }}</div>
                </div>
                <p class="blink hint-text" @click="toggleRankingModal">{{ t('pages.games.game2048Page.pressCloseReturn') }}</p>
              </div>

              <div v-if="showHistoryModal" class="screen-overlay list-overlay" @touchmove.stop>
                <h2 class="pixel-subtitle">{{ t('pages.games.game2048Page.historyRecord') }}</h2>
                <div class="scroll-list">
                  <div v-for="(record, index) in historyList" :key="index" class="history-row">
                    <div class="h-top">
                      <span class="h-score">{{ t('pages.games.game2048Page.scoreUnit', { score: record.score }) }}</span>
                      <span class="h-tile">{{ t('pages.games.game2048Page.maxTileIs', { max: record.maxTile }) }}</span>
                    </div>
                    <div class="h-bottom">
                      <span>{{ formatTime(record.gameTime) }}</span>
                      <span>{{ formatDate(record.createTime) }}</span>
                    </div>
                  </div>
                  <div v-if="historyList.length === 0" class="empty-hint">{{ t('pages.games.game2048Page.noHistory') }}</div>
                </div>
                <p class="blink hint-text" @click="toggleHistoryModal">{{ t('pages.games.game2048Page.pressCloseReturn') }}</p>
              </div>

              <div v-if="gameOver || (won && !keepPlaying)" class="screen-overlay game-over-overlay">
                <h1 class="pixel-title" :class="{ 'win-text': won }">{{ won ? t('pages.games.game2048Page.youWin') : t('pages.games.game2048Page.gameOver') }}</h1>
                <div class="results-box">
                  <p> {{ t('pages.games.game2048Page.finalScoreLabel') }} <span>{{ score }}</span></p>
                  <p> {{ t('pages.games.game2048Page.maxTileLabel') }} <span>{{ getMaxTile() }}</span></p>
                  <p> {{ t('pages.games.game2048Page.timeUsedLabel') }} <span>{{ formatTime(gameTime) }}</span></p>
                </div>
                <div class="action-hints">
                  <p v-if="won && !keepPlaying" class="clickable-hint" @click="keepPlaying = true">{{ t('pages.games.game2048Page.continueGameArrow') }}</p>
                  <p class="clickable-hint" @click="newGame">{{ t('pages.games.game2048Page.restartArrow') }}</p>
                  <p class="clickable-hint" @click="quitGame">{{ t('pages.games.game2048Page.exitArrow') }}</p>
                </div>
              </div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getUserHighestScoreUsingGet, getRankingListUsingGet, saveGame2048RecordUsingPost, getUserGameHistoryUsingGet } from '@/api/game2048Controller'
import { getDefaultAvatar } from '@/utils/userUtils'
import {
  SoundOutlined,
  SoundFilled,
  RedoOutlined,
  TrophyOutlined,
  HistoryOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()

// === 核心类定义 (简化版，无逻辑变化) ===
class Grid {
  size: number
  cells: any[][]
  constructor(size: number, previousState?: any) {
    this.size = size
    this.cells = previousState ? this.fromState(previousState) : this.empty()
  }
  empty() {
    const cells = []
    for (let x = 0; x < this.size; x++) {
      const row = cells[x] = []
      for (let y = 0; y < this.size; y++) row.push(null)
    }
    return cells
  }
  fromState(state: any) {
    const cells = []
    for (let x = 0; x < this.size; x++) {
      const row = cells[x] = []
      for (let y = 0; y < this.size; y++) {
        const tile = state[x][y]
        row.push(tile ? new Tile(tile.position, tile.value) : null)
      }
    }
    return cells
  }
  randomAvailableCell() {
    const cells = this.availableCells()
    if (cells.length) return cells[Math.floor(Math.random() * cells.length)]
  }
  availableCells() {
    const cells = []
    this.eachCell((x: number, y: number, tile: any) => { if (!tile) cells.push({ x, y }) })
    return cells
  }
  eachCell(callback: (x: number, y: number, tile: any) => void) {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) callback(x, y, this.cells[x][y])
    }
  }
  cellsAvailable() { return !!this.availableCells().length }
  cellAvailable(cell: { x: number, y: number }) { return !this.cellOccupied(cell) }
  cellOccupied(cell: { x: number, y: number }) { return !!this.cellContent(cell) }
  cellContent(cell: { x: number, y: number }) {
    if (this.withinBounds(cell)) return this.cells[cell.x][cell.y]
    return null
  }
  insertTile(tile: any) { this.cells[tile.x][tile.y] = tile }
  removeTile(tile: any) { this.cells[tile.x][tile.y] = null }
  withinBounds(position: { x: number, y: number }) {
    return position.x >= 0 && position.x < this.size && position.y >= 0 && position.y < this.size
  }
}

class Tile {
  x: number
  y: number
  value: number
  previousPosition: any
  mergedFrom: any
  constructor(position: { x: number, y: number }, value: number) {
    this.x = position.x
    this.y = position.y
    this.value = value || 2
    this.previousPosition = null
    this.mergedFrom = null
  }
  savePosition() { this.previousPosition = { x: this.x, y: this.y } }
  updatePosition(position: { x: number, y: number }) {
    this.x = position.x
    this.y = position.y
  }
}

class GameManager {
  size: number
  grid: Grid
  score: number
  over: boolean
  won: boolean
  keepPlaying: boolean

  constructor(size: number) {
    this.size = size; this.score = 0; this.over = false; this.won = false; this.keepPlaying = false;
    this.grid = new Grid(size); this.addStartTiles()
  }
  restart() {
    this.grid = new Grid(this.size); this.score = 0; this.over = false; this.won = false; this.keepPlaying = false;
    this.addStartTiles()
  }
  keepPlayingGame() { this.keepPlaying = true }
  isGameTerminated() { return this.over || (this.won && !this.keepPlaying) }
  addStartTiles() { for (let i = 0; i < 2; i++) this.addRandomTile() }
  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      const tile = new Tile(this.grid.randomAvailableCell(), Math.random() < 0.9 ? 2 : 4)
      this.grid.insertTile(tile)
    }
  }
  prepareTiles() {
    this.grid.eachCell((x: number, y: number, tile: any) => {
      if (tile) { tile.mergedFrom = null; tile.savePosition() }
    })
  }
  moveTile(tile: any, cell: { x: number, y: number }) {
    this.grid.cells[tile.x][tile.y] = null; this.grid.cells[cell.x][cell.y] = tile; tile.updatePosition(cell)
  }
  getVector(direction: string) {
    const map: { [key: string]: { x: number, y: number } } = { 'up': { x: -1, y: 0 }, 'right': { x: 0, y: 1 }, 'down': { x: 1, y: 0 }, 'left': { x: 0, y: -1 } }
    return map[direction]
  }
  buildTraversals(vector: { x: number, y: number }) {
    const traversals = { x: [], y: [] }
    for (let pos = 0; pos < this.size; pos++) { traversals.x.push(pos); traversals.y.push(pos) }
    if (vector.x === 1) traversals.x.reverse()
    if (vector.y === 1) traversals.y.reverse()
    return traversals
  }
  findFarthestPosition(cell: { x: number, y: number }, vector: { x: number, y: number }) {
    let previous
    do {
      previous = cell
      cell = { x: previous.x + vector.x, y: previous.y + vector.y }
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell))
    return { farthest: previous, next: cell }
  }
  move(direction: string) {
    if (this.isGameTerminated()) return
    const vector = this.getVector(direction)
    const traversals = this.buildTraversals(vector)
    let moved = false
    this.prepareTiles()
    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        const cell = { x: x, y: y }
        const tile = this.grid.cellContent(cell)
        if (tile) {
          const positions = this.findFarthestPosition(cell, vector)
          const next = this.grid.cellContent(positions.next)
          if (next && next.value === tile.value && !next.mergedFrom) {
            const merged = new Tile(positions.next, tile.value * 2)
            merged.mergedFrom = [tile, next]
            this.grid.insertTile(merged); this.grid.removeTile(tile); tile.updatePosition(positions.next)
            this.score += merged.value
            if (merged.value === 2048) this.won = true
          } else {
            this.moveTile(tile, positions.farthest)
          }
          if (!this.positionsEqual(cell, tile)) moved = true
        }
      })
    })
    if (moved) this.addRandomTile()
    if (!this.movesAvailable()) this.over = true
  }
  positionsEqual(first: { x: number, y: number }, second: { x: number, y: number }) {
    return first.x === second.x && first.y === second.y
  }
  movesAvailable() { return this.grid.cellsAvailable() || this.tileMatchesAvailable() }
  tileMatchesAvailable() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const tile = this.grid.cellContent({ x: x, y: y })
        if (tile) {
          const right = this.grid.cellContent({ x: x, y: y + 1 })
          if (right && right.value === tile.value) return true
          const down = this.grid.cellContent({ x: x + 1, y: y })
          if (down && down.value === tile.value) return true
        }
      }
    }
    return false
  }
}

// === Vue 状态 ===
const isMobile = ref(false)
const gameManager = ref<GameManager | null>(null)
const score = ref(0)
const bestScore = ref(parseInt(localStorage.getItem('game2048BestScore') || '0'))
const gameTime = ref(0)
const gameOver = ref(false)
const won = ref(false)
const keepPlaying = ref(false)
const tiles = ref<any[]>([])
const timeInterval = ref<any>(null)
const moveCount = ref(0)

const showRankingModal = ref(false)
const rankingList = ref<any[]>([])
const showHistoryModal = ref(false)
const historyList = ref<any[]>([])

// 弹窗开关控制
const toggleRankingModal = () => {
  showRankingModal.value = !showRankingModal.value
  if (showRankingModal.value) showHistoryModal.value = false
}

const toggleHistoryModal = () => {
  showHistoryModal.value = !showHistoryModal.value
  if (showHistoryModal.value) showRankingModal.value = false
}

// 触摸
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)

// 音效
const isSoundEnabled = ref(true)
const moveSound = new Audio(new URL('@/assets/sounds/move.MP3', import.meta.url).href)
const mergeSound = new Audio(new URL('@/assets/sounds/merge.MP3', import.meta.url).href)
const gameStartSound = new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href)
const gameOverSound = new Audio(new URL('@/assets/sounds/gameover.MP3', import.meta.url).href)

moveSound.volume = 0.3
mergeSound.volume = 0.4
gameStartSound.volume = 0.5
gameOverSound.volume = 0.5

const playSound = (sound: HTMLAudioElement) => {
  if (!isSoundEnabled.value) return
  if (sound.paused) {
    sound.currentTime = 0; sound.play().catch(() => {})
  } else {
    sound.currentTime = 0
  }
}

const toggleSound = () => {
  isSoundEnabled.value = !isSoundEnabled.value
  const volume = isSoundEnabled.value ? 0.3 : 0
  moveSound.volume = volume
  mergeSound.volume = volume * 1.33
  gameStartSound.volume = volume * 1.67
  gameOverSound.volume = volume * 1.67
}

const debounce = (fn: Function, delay: number) => {
  let timer: any = null
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { fn.apply(this, args) }, delay)
  }
}

const debouncedSaveGameRecord = debounce(async () => {
  try {
    const request = { score: score.value, maxTile: getMaxTile(), gameTime: gameTime.value, moveCount: moveCount.value }
    await saveGame2048RecordUsingPost(request)
  } catch (error) { /* ignore */ }
}, 1000)

const handleKeydown = (e: KeyboardEvent) => {
  if (!gameManager.value || showRankingModal.value || showHistoryModal.value) return
  const keyMap: { [key: string]: string } = {
    'ArrowUp': 'up', 'ArrowRight': 'right', 'ArrowDown': 'down', 'ArrowLeft': 'left',
    'w': 'up', 'd': 'right', 's': 'down', 'a': 'left',
    'W': 'up', 'D': 'right', 'S': 'down', 'A': 'left'
  }
  const direction = keyMap[e.key]
  if (direction) {
    e.preventDefault()
    handleMove(direction)
  }
}

const initGame = () => {
  gameManager.value = new GameManager(4)
  gameTime.value = 0
  startTimer()
  updateGameState()
}

const updateGameState = () => {
  if (!gameManager.value) return
  score.value = gameManager.value.score
  gameOver.value = gameManager.value.over
  won.value = gameManager.value.won
  keepPlaying.value = gameManager.value.keepPlaying

  if (gameOver.value || (won.value && !keepPlaying.value)) {
    if (timeInterval.value) { clearInterval(timeInterval.value); timeInterval.value = null }
  }

  const newTiles: any[] = []
  gameManager.value.grid.eachCell((x: number, y: number, tile: any) => {
    if (tile) {
      newTiles.push({
        id: `${x}-${y}-${tile.value}-${Math.random()}`,
        x, y, value: tile.value,
        isNew: !tile.previousPosition && !tile.mergedFrom,
        mergedFrom: tile.mergedFrom
      })
    }
  })
  tiles.value = newTiles

  if (score.value > bestScore.value) {
    bestScore.value = score.value
    localStorage.setItem('game2048BestScore', score.value.toString())
  }
}

const handleMove = (direction: string) => {
  if (!gameManager.value || showRankingModal.value || showHistoryModal.value) return
  const previousScore = gameManager.value.score
  const previousState = JSON.stringify(gameManager.value.grid.cells)
  gameManager.value.move(direction)
  const currentState = JSON.stringify(gameManager.value.grid.cells)
  const moved = previousState !== currentState
  updateGameState()

  if (gameManager.value.score > previousScore) {
    playSound(mergeSound)
    moveCount.value++
  } else if (moved) {
    playSound(moveSound)
  }

  if (gameOver.value || (won.value && !keepPlaying.value)) {
    playSound(gameOverSound)
    debouncedSaveGameRecord()
  }
}

const newGame = () => {
  if (!gameManager.value) return
  showHistoryModal.value = false
  showRankingModal.value = false
  gameManager.value.restart()
  gameTime.value = 0
  moveCount.value = 0
  startTimer()
  updateGameState()
  playSound(gameStartSound)
}

const getMaxTile = () => {
  if (!gameManager.value) return 0
  let max = 0
  gameManager.value.grid.eachCell((x, y, tile) => { if (tile) max = Math.max(max, tile.value) })
  return max
}

const startTimer = () => {
  if (timeInterval.value) { clearInterval(timeInterval.value); timeInterval.value = null }
  gameTime.value = 0
  timeInterval.value = setInterval(() => {
    if (!gameOver.value && !(won.value && !keepPlaying.value)) gameTime.value++
  }, 1000)
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const quitGame = () => { router.push({ name: 'Games' }) }

const fetchUserHighestScore = async () => {
  try {
    const res = await getUserHighestScoreUsingGet()
    if (res.data) bestScore.value = res.data.data === null ? 0 : res.data.data
  } catch (e) {}
}

const getRankingData = async () => {
  try {
    const res = await getRankingListUsingGet({ limit: 100 })
    if (res?.data?.data) {
      const uniqueMap = new Map()
      res.data.data.forEach((r: any) => {
        const key = `${r.userId}_${r.score}`
        if (!uniqueMap.has(key) || uniqueMap.get(key).score < r.score) uniqueMap.set(key, r)
      })
      rankingList.value = Array.from(uniqueMap.values()).sort((a:any, b:any) => b.score - a.score).slice(0, 100)
    }
  } catch (e) {}
}

const getHistoryData = async () => {
  try {
    const res = await getUserGameHistoryUsingGet({ current: 1, pageSize: 50 })
    if (res?.data?.data?.records) {
      const uniqueMap = new Map()
      res.data.data.records.forEach((r: any) => {
        const key = `${r.score}_${r.maxTile}`
        if (!uniqueMap.has(key) || new Date(uniqueMap.get(key).createTime) < new Date(r.createTime)) uniqueMap.set(key, r)
      })
      historyList.value = Array.from(uniqueMap.values()).sort((a:any, b:any) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    }
  } catch (e) {}
}

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}
const handleTouchMove = (e: TouchEvent) => { e.preventDefault() }
const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].clientX
  touchEndY.value = e.changedTouches[0].clientY
  const deltaX = touchEndX.value - touchStartX.value
  const deltaY = touchEndY.value - touchStartY.value
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) > 30) deltaX > 0 ? handleMove('right') : handleMove('left')
  } else {
    if (Math.abs(deltaY) > 30) deltaY > 0 ? handleMove('down') : handleMove('up')
  }
}

const handleRootTouchMove = (e: TouchEvent) => {
  // 如果触摸事件发生在滚动列表内，允许滚动
  const target = e.target as HTMLElement
  const scrollList = target.closest('.scroll-list')
  if (scrollList) {
    // 允许滚动列表内的滚动
    return
  }
  // 其他区域阻止默认滚动
  e.preventDefault()
}

const handleUserClick = (record: any) => {
  if (!record) return
  router.push({ name: 'UserDetail', params: { id: record.userId }, query: { userName: record.userName, userAvatar: record.userAvatar }})
}

const checkMobile = () => { isMobile.value = window.innerWidth <= 768 }

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  getRankingData()
  fetchUserHighestScore()
  getHistoryData()
  window.addEventListener('keydown', handleKeydown)
  initGame()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  if (timeInterval.value) clearInterval(timeInterval.value)
  window.removeEventListener('keydown', handleKeydown)
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

/* 全局锁定容器 */
.yuemu-retro-2048-universe {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh; height: 100dvh;
  background-color: var(--background);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'PressStart2P', Consolas, monospace;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
}

.yuemu-retro-2048-universe.is-mobile {
  overflow-y: auto;
  align-items: center;
  padding: 0;
}

/* 街机外壳 */
.arcade-console {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-width: 500px;
  height: 100%;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow:
    12px 12px 0 rgba(0,0,0,0.3),
    inset 2px 2px 0 rgba(255,255,255,0.05);
}

.is-mobile .arcade-console {
  height: auto;
  min-height: 100vh;
  min-height: 100dvh;
}

/* 招牌 */
.marquee {
  background: var(--hover-background);
  border-bottom: 4px solid var(--border-color);
  padding: 15px 10px;
  text-align: center;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.back-btn { font-size: 10px; color: var(--text-secondary); }
.marquee:hover .back-btn { color: var(--text-primary); }
.game-title { margin: 0; font-size: 18px; color: var(--text-primary); text-shadow: 2px 2px 0 var(--shadow-color); }
.version { font-size: 8px; color: var(--text-secondary); }

/* CRT 屏幕外框 */
.screen-bezel {
  background: var(--hover-background);
  padding: 20px;
  border-bottom: 4px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 10px 20px var(--shadow-color);
  flex: 1;
  min-height: 0;
}

/* 屏幕发光面板 */
.screen-glass {
  flex: 1;
  background: var(--background);
  border: 4px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px var(--shadow-color);
}

/* CRT 扫描线特效 */
.crt-effect::after {
  content: " "; display: block; position: absolute; inset: 0;
  background: linear-gradient(rgba(0,0,0,0) 50%, var(--shadow-color) 50%);
  background-size: 100% 4px; z-index: 50; pointer-events: none; opacity: 0.3;
}

/* 顶部 HUD */
.hud-bar {
  display: flex;
  justify-content: space-between;
  background: var(--card-background);
  border-bottom: 2px solid var(--border-color);
  padding: 10px 15px;
}
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.center-item { flex: 1; }
.hud-label { color: var(--text-secondary); font-size: 8px; }
.hud-val { color: var(--text-primary); font-size: 14px; font-weight: bold; }
.highlight { color: var(--link-color); text-shadow: 1px 1px 0 var(--shadow-color); }

/* ==== 2048 舞台包装器 ==== */
.stage-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  min-height: 0;
  width: 100%;
}

.stage-container {
  position: relative;
  aspect-ratio: 1 / 1;
  max-width: 100%;
  max-height: 100%;
  width: 100%;
}

.grid-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--border-color);
  padding: 2%;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 2%;
}
.grid-row { display: flex; flex: 1; gap: 2%; }
.grid-cell { flex: 1; background: var(--card-background); opacity: 0.3; border-radius: 2px; }

.tiles-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  padding: 2%;
  border-radius: 4px;
}

.retro-tile {
  position: absolute;
  width: 23.5%;
  height: 23.5%;
  transition: transform 150ms ease-in-out;
  z-index: 10;
}

.tile-inner {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--card-background);
  color: var(--text-primary);
  font-size: clamp(14px, 4vw, 24px);
  font-weight: bold;
  text-shadow: 1px 1px 0 var(--shadow-color);
  border-radius: 2px;
  border: 2px solid;
  border-top-color: rgba(255,255,255,0.4);
  border-left-color: rgba(255,255,255,0.4);
  border-bottom-color: rgba(0,0,0,0.3);
  border-right-color: rgba(0,0,0,0.3);
  box-shadow: inset 1px 1px 0 rgba(255,255,255,0.2), 2px 2px 5px var(--shadow-color);
}

.tile-new .tile-inner { animation: appear 200ms ease-in-out; }
.tile-merged .tile-inner { z-index: 20; animation: pop 200ms ease-in-out; }
@keyframes appear { 0% { opacity: 0; transform: scale(0); } 100% { opacity: 1; transform: scale(1); } }
@keyframes pop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }

/* 复古配色 */
.tile-2 .tile-inner { background: #3b82f6; color: #fff; }
.tile-4 .tile-inner { background: #10b981; color: #fff; }
.tile-8 .tile-inner { background: #f59e0b; color: #111; }
.tile-16 .tile-inner { background: #f97316; color: #fff; }
.tile-32 .tile-inner { background: #ef4444; color: #fff; }
.tile-64 .tile-inner { background: #ec4899; color: #fff; }
.tile-128 .tile-inner { background: #8b5cf6; color: #fff; font-size: clamp(10px, 3vw, 18px); }
.tile-256 .tile-inner { background: #6366f1; color: #fff; font-size: clamp(10px, 3vw, 18px); box-shadow: 0 0 10px #6366f1; }
.tile-512 .tile-inner { background: #14b8a6; color: #fff; font-size: clamp(10px, 3vw, 18px); box-shadow: 0 0 10px #14b8a6; }
.tile-1024 .tile-inner { background: #eab308; color: #111; font-size: clamp(8px, 2.5vw, 14px); box-shadow: 0 0 15px #eab308; }
.tile-2048 .tile-inner { background: #fbbf24; color: #111; font-size: clamp(8px, 2.5vw, 14px); box-shadow: 0 0 20px #fbbf24; border-color: #fff; }

/* 屏幕内 UI 覆盖层 */
.screen-overlay {
  position: absolute; inset: 0;
  background: var(--ios-modal-bg);
  backdrop-filter: blur(8px);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 40; padding: 20px; text-align: center;
}

.pixel-title { font-size: 24px; color: #FF3B30; margin-bottom: 20px; text-shadow: 2px 2px 0 var(--shadow-color); }
.win-text { color: #34C759; }
.pixel-subtitle { font-size: 16px; color: var(--text-primary); margin-bottom: 15px; border-bottom: 2px dashed var(--border-color); padding-bottom: 10px;}

.results-box { margin-bottom: 30px; display: flex; flex-direction: column; gap: 15px; font-size: 12px; color: var(--text-secondary); text-align: left; }
.results-box span { color: var(--text-primary); font-weight: bold; margin-left: 10px; }

.action-hints { display: flex; flex-direction: column; gap: 15px; font-size: 10px; text-align: left; margin-top: 20px; }
.clickable-hint { cursor: pointer; color: var(--text-primary); transition: color 0.2s; }
.clickable-hint:hover, .clickable-hint:active { color: var(--link-color); }

/* 滚动列表 UI */
.scroll-list {
  width: 100%; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;
  padding-right: 5px;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
  overscroll-behavior: contain; /* 防止滚动穿透 */
}
.scroll-list::-webkit-scrollbar { width: 4px; }
.scroll-list::-webkit-scrollbar-thumb { background: var(--border-color); }

.lb-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-color); padding: 5px 0; font-size: 10px; cursor: pointer; }
.lb-rank { width: 25px; text-align: left; color: var(--text-secondary); }
.lb-user { flex: 1; display: flex; align-items: center; gap: 8px; text-align: left; }
.avatar-mini { width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--border-color); }
.lb-name { color: var(--text-primary); }
.lb-score { width: 60px; text-align: right; color: var(--link-color); font-weight: bold; }

.history-row { display: flex; flex-direction: column; gap: 6px; border-bottom: 1px dashed var(--border-color); padding: 8px 0; font-size: 9px; }
.h-top, .h-bottom { display: flex; justify-content: space-between; }
.h-score { color: var(--link-color); font-weight: bold; }
.h-tile { color: var(--text-primary); }
.h-bottom { color: var(--text-secondary); }

.empty-hint { margin-top: 20px; color: var(--text-secondary); font-size: 12px; }
.hint-text { font-size: 10px; color: var(--text-primary); cursor: pointer; }

/* === 控制按钮区域 === */
.action-section {
  background: var(--card-background);
  border-top: 2px solid var(--border-color);
  border-bottom: 2px solid var(--border-color);
  padding: 20px;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.sys-btn {
  background: var(--hover-background);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--border-color);
  transition: all 0.1s;
}
.sys-btn.active {
  background: var(--border-color);
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--border-color);
}
.sys-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--border-color);
}
.sys-icon { font-size: 18px; color: var(--text-primary); }
.sys-text { font-size: 8px; color: var(--text-secondary); font-family: inherit; }

/* PC 端隐藏 D-Pad */
.d-pad-section {
  display: none;
  background: var(--card-background);
  padding: 20px;
  justify-content: center;
  align-items: center;
}

/* === PC端横向聚合布局 (右侧按键列) === */
@media screen and (min-width: 769px) {
  .arcade-console {
    max-width: 800px;
  }
  .screen-glass {
    display: grid;
    grid-template-columns: 1fr 140px;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      "hud actions"
      "stage actions";
    gap: 15px 20px;
  }
  .hud-bar { grid-area: hud; margin-bottom: 0; }
  .stage-wrapper { grid-area: stage; margin: 0 auto; align-self: center; }
  .action-section { 
    grid-area: actions; 
    flex-direction: column; 
    margin: 0; 
    height: 100%;
    justify-content: center;
    gap: 15px; 
    border-top: none;
    padding-top: 0;
  }
  .sys-btn { width: 100%; height: 75px; flex: none; border-radius: 12px; }
}

/* === 移动端排版 === */
@media screen and (max-width: 768px) {
  .yuemu-retro-2048-universe { padding: 0; }
  .arcade-console {
    border-radius: 0; border: none; box-shadow: none;
    padding: 0;
    justify-content: flex-start;
  }

  .marquee {
    padding: 10px;
    padding-top: 10px;
  }
  .game-title { font-size: 14px; }
  .screen-bezel {
    padding: 10px 5px;
    border: none;
    box-shadow: none;
    flex: 1;
    justify-content: center;
  }
  .hud-bar { padding: 8px; }
  .hud-label { font-size: 7px; }
  .hud-val { font-size: 12px; }

  .stage-wrapper { padding: 5px 0; }
  .tile-inner { font-size: clamp(14px, 5vw, 24px); border-width: 1px; }

  /* 系统功能键，横向平分并排 */
  .action-section {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 5px;
    border-top: 2px solid var(--border-color);
    border-bottom: none;
  }
  .sys-btn {
    flex: 1;
    padding: 10px 4px;
    gap: 4px;
  }
  .sys-icon { font-size: 16px; }
  .sys-text { font-size: 8px; letter-spacing: -0.5px; }

  /* D-Pad 方向键，放大并居中 */
  .d-pad-section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 10px 5px;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    border-top: 2px solid var(--border-color);
  }

  .d-pad {
    display: flex; flex-direction: column; align-items: center;
    background: rgba(0,0,0,0.05); padding: 10px; border-radius: 50%;
    transform: scale(1.15); /* 放十字键 */
  }
  .d-row { display: flex; }
  .d-btn {
    width: 45px; height: 45px; background: var(--text-primary); border: none;
    display: flex; justify-content: center; align-items: center;
    box-shadow: inset 0 0 8px rgba(255,255,255,0.2);
  }
  .d-icon { font-size: 14px; color: var(--background); opacity: 0.8; font-style: normal; }
  .d-center { width: 45px; height: 45px; background: var(--text-primary); position: relative; }
  .d-dent { position: absolute; top:50%; left:50%; transform:translate(-50%,-50%); width: 14px; height:14px; border-radius:50%; background:rgba(0,0,0,0.3); }

  .d-btn.up { border-radius: 8px 8px 0 0; }
  .d-btn.down { border-radius: 0 0 8px 8px; }
  .d-btn.left { border-radius: 8px 0 0 8px; }
  .d-btn.right { border-radius: 0 8px 8px 0; }
  .d-btn:active { background: var(--text-secondary); }

  .swipe-hint {
    margin-top: 20px;
    font-size: 8px;
    color: var(--text-secondary);
    opacity: 0.6;
    letter-spacing: 1px;
  }
}

@media screen and (max-width: 360px) {
  .d-pad { transform: scale(1.0); }
  .d-btn, .d-center { width: 40px; height: 40px; }
  .sys-btn { padding: 6px 2px; }
}
</style>
