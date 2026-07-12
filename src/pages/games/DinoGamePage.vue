<template>
  <div class="yuemu-retro-dino-universe" :class="{ 'is-mobile': isMobile }" @touchmove.prevent>
    <div class="arcade-console">

      <div class="marquee" @click="quitGame">
        <span class="back-btn">{{ t('pages.games.dinoGamePage.backToLobby') }}</span>
        <h1 class="game-title">{{ t('pages.games.dinoGamePage.dinoRun') }}</h1>
        <span class="version">{{ t('pages.games.dinoGamePage.arcadeClassic') }}</span>
      </div>

      <div class="screen-bezel">
        <div class="screen-glass crt-effect">

          <div class="hud-bar">
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.dinoGamePage.highestRecord') }}</span>
              <span class="hud-val highlight">{{ String(bestScore).padStart(5, '0') }}</span>
            </div>
            <div class="hud-item center-item">
              <span class="hud-label">{{ t('pages.games.dinoGamePage.currentScoreLabel') }}</span>
              <span class="hud-val">{{ String(Math.floor(score)).padStart(5, '0') }}</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">{{ t('pages.games.dinoGamePage.collectCoins') }}</span>
              <span class="hud-val text-gold">{{ String(gameState.coinsCollected).padStart(3, '0') }}</span>
            </div>
          </div>

          <div class="stage-wrapper" ref="stageWrapper">
            <canvas ref="gameCanvas" class="game-canvas"></canvas>

            <div v-if="!gameState.isPlaying && !gameState.gameOver" class="screen-overlay menu-overlay">
              <h1 class="pixel-title">{{ t('pages.games.dinoGamePage.ready') }}</h1>
              <p class="blink hint-text">{{ t('pages.games.dinoGamePage.pleasePressStart') }}</p>
              <div class="menu-actions mt-4">
                <p class="instruction-text">{{ t('pages.games.dinoGamePage.pcControls') }}</p>
                <p class="instruction-text">{{ t('pages.games.dinoGamePage.mobileControls') }}</p>
                <p class="instruction-text highlight" style="margin-top: 10px;">{{ t('pages.games.dinoGamePage.jumpTip') }}</p>
              </div>
            </div>

            <div v-if="gameState.isPaused" class="screen-overlay pause-overlay">
              <h1 class="pixel-title">{{ t('pages.games.dinoGamePage.gamePaused') }}</h1>
              <p class="hint-text">{{ t('pages.games.dinoGamePage.pressContinueToResume') }}</p>
            </div>

            <div v-if="gameState.gameOver" class="screen-overlay gameover-overlay">
              <h1 class="pixel-title danger">{{ t('pages.games.dinoGamePage.gameOver') }}</h1>
              <div class="results-box">
                <p> {{ t('pages.games.dinoGamePage.thisScoreLabel') }} <span>{{ Math.floor(score) }}</span></p>
                <p> {{ t('pages.games.dinoGamePage.coinsObtainedLabel') }} <span>{{ gameState.coinsCollected }}</span></p>
              </div>
              <p class="blink hint-text">{{ t('pages.games.dinoGamePage.pressStartToChallenge') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 辅助监控诊断按钮区（界面纯中文设计，不挤压原操作键，极其适配移动端） -->
      <div class="diagnostic-trigger-bar">
        <button class="sys-btn mini-diag-btn" @click="openTerminal('ranking')">
          <span class="sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="sys-text">{{ t('pages.games.dinoGamePage.leaderboardBracket') }}</span>
        </button>
        <button class="sys-btn mini-diag-btn" @click="openTerminal('history')">
          <span class="sys-icon"><i class="fas fa-history"></i></span>
          <span class="sys-text">{{ t('pages.games.dinoGamePage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="control-panel">
        <div class="system-section">
          <button class="sys-btn" @click="handleMainAction">
            <div class="sys-icon-btn">
              {{ gameState.isPlaying && !gameState.gameOver ? (gameState.isPaused ? t('pages.games.dinoGamePage.continueGame') : t('pages.games.dinoGamePage.pauseGame')) : t('pages.games.dinoGamePage.startGame') }}
            </div>
          </button>
          <button class="sys-btn" @click="toggleSound">
            <div class="sys-icon-btn">音效: {{ isSoundEnabled ? '开' : t('pages.games.dinoGamePage.off') }}</div>
          </button>
        </div>

        <div class="arcade-buttons-section" v-if="isMobile">
          <div class="action-btn-group left-group">
            <button
              class="arcade-btn b-btn"
              @touchstart.stop.prevent="handleFastDrop"
              @touchend.stop.prevent="handleFastDropEnd"
              @touchcancel.stop.prevent="handleFastDropEnd"
            >
              <div class="btn-cap">B<br/><span>{{ t('pages.games.dinoGamePage.drop') }}</span></div>
            </button>
          </div>
          <div class="action-btn-group right-group">
            <button
              class="arcade-btn a-btn"
              @touchstart.stop.prevent="handleJumpPress"
              @touchend.stop.prevent="handleJumpRelease"
              @touchcancel.stop.prevent="handleJumpRelease"
            >
              <div class="btn-cap">A<br/><span>{{ t('pages.games.dinoGamePage.jump') }}</span></div>
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
          <span class="model-name terminal-title">{{ t('pages.games.dinoGamePage.monitorDiagnosticD06') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.dinoGamePage.leaderboardBracketRight') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.dinoGamePage.historyLogBracketRight') }}
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
              <span>{{ t('pages.games.dinoGamePage.ranking') }}</span>
              <span>{{ t('pages.games.dinoGamePage.crackTerminal') }}</span>
              <span>{{ t('pages.games.dinoGamePage.maxScore') }}</span>
              <span>{{ t('pages.games.dinoGamePage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.dinoGamePage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.dinoGamePage.noCrackRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.dinoGamePage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.dinoGamePage.scorePoints', { score: item.score }) }}</span>
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
                {{ t('pages.games.dinoGamePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.dinoGamePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.dinoGamePage.saveTime') }}</span>
              <span>{{ t('pages.games.dinoGamePage.levelProgress') }}</span>
              <span>{{ t('pages.games.dinoGamePage.achievedScore') }}</span>
              <span>{{ t('pages.games.dinoGamePage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.dinoGamePage.readingLocalArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.dinoGamePage.noLocalArchive') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.dinoGamePage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.dinoGamePage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.dinoGamePage.parkourSuccess') : t('pages.games.dinoGamePage.notInitiated') }}
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
                {{ t('pages.games.dinoGamePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.dinoGamePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.dinoGamePage.closeDiagTerminal') }}
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
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController'

const router = useRouter()
const isMobile = ref(false)

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
    const res = await getRankingListUsingPost({
      gameType: 'dino',
      current: rankPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.dinoGamePage.getRankingsError'), err)
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
      gameType: 'dino',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.dinoGamePage.getHistoryError'), err)
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
    console.warn(t('pages.games.dinoGamePage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'dino',
      level: t('pages.games.dinoGamePage.default'),
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.dinoGamePage.reportFinalResultError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.dinoGamePage.unknown')
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${m}-${d} ${hh}:${mm}`
}

// --- 游戏状态 ---
const score = ref(0)
const bestScore = ref(parseInt(localStorage.getItem('dinoRetroBestScore_CN') || '0'))
const gameState = ref({
  isPlaying: false,
  isPaused: false,       // 新增：暂停状态
  gameOver: false,
  coinsCollected: 0
})

// --- 物理引擎配置 ---
const config = {
  groundHeight: 25,
  gravity: 0.65,         // 重力
  jumpForce: 11.5,       // 起跳初始爆发力
  minJumpForce: 4,       // 松开按键时保留的最小向上的力
  fastDropForce: 16,     // 快速下坠的重力
  maxFallingSpeed: 14,

  // 难度曲线优化：从极慢开始，平滑增长
  baseSpeed: 2,          // 初始速度：极慢，新手超友好
  maxSpeed: 11,          // 最高速度：有挑战但可反应
  speedGrowth: 0.0006    // 速度增长率：极其缓慢的线性增长
}

// 玩家状态 (30宽, 32高)
const dino = ref({
  x: 40, y: 0,
  vy: 0,
  width: 30, height: 32,
  isJumping: false,
  isHoldingJump: false,
  isFastDropping: false,
  jumpCount: 0,
  animTimer: 0
})

const obstacles = ref<any[]>([])
const coins = ref<any[]>([])
const particles = ref<any[]>([])

const stageWrapper = ref<HTMLElement | null>(null)
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

let animationFrameId: number | null = null
let currentSpeed = config.baseSpeed
let groundOffset = 0

// --- 调色板 ---
const colors = {
  bg: '#111827',
  dino: '#4ade80',
  obstacle: '#f87171',
  coin: '#fbbf24',
  ground: '#475569'
}

// --- 音效系统 ---
const isSoundEnabled = ref(true)
const sfx: Record<string, HTMLAudioElement | null> = { jump: null, coin: null, over: null }
try {
  sfx.jump = new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href)
  sfx.coin = new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href)
  sfx.over = new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href)
  Object.values(sfx).forEach(a => { if(a) a.volume = 0.3 })
} catch (e) {
  console.warn(t('pages.games.dinoGamePage.soundLoadFailedSilent'));
}

const playSound = (name: string) => {
  if (!isSoundEnabled.value || !sfx[name]) return
  sfx[name]!.currentTime = 0; sfx[name]!.play().catch(()=>{})
}
const toggleSound = () => isSoundEnabled.value = !isSoundEnabled.value

// --- 控制交互 ---
const handleJumpPress = (e?: Event) => {
  if (e) e.preventDefault()
  if (!gameState.value.isPlaying || gameState.value.gameOver) {
    startGame()
    return
  }
  if (gameState.value.isPaused) return  // 暂停时不响应跳跃

  const canvasHeight = gameCanvas.value?.height || 250
  const groundY = canvasHeight - config.groundHeight - dino.value.height

  if (dino.value.y >= groundY - 2) {
    dino.value.isJumping = true
    dino.value.isHoldingJump = true
    dino.value.isFastDropping = false
    dino.value.vy = -config.jumpForce
    dino.value.jumpCount = 1
    playSound('jump')
    spawnParticles(dino.value.x + 15, groundY + dino.value.height, colors.ground, 5)
  }
  else if (dino.value.jumpCount < 2) {
    dino.value.isHoldingJump = true
    dino.value.isFastDropping = false
    // 二段跳力度增强：从 0.85 提升到 0.95
    dino.value.vy = -config.jumpForce * 0.95
    dino.value.jumpCount = 2
    playSound('jump')
    spawnParticles(dino.value.x + 15, dino.value.y + dino.value.height, '#ffffff', 5)
  }
}

const handleJumpRelease = (e?: Event) => {
  if (e) e.preventDefault()
  if (gameState.value.isPaused) return  // 暂停时不响应
  dino.value.isHoldingJump = false
  if (dino.value.vy < -config.minJumpForce) {
    dino.value.vy = -config.minJumpForce
  }
}

const handleFastDrop = (e?: Event) => {
  if (e) e.preventDefault()
  if (gameState.value.isPaused) return  // 暂停时不响应
  if (dino.value.isJumping) {
    dino.value.isFastDropping = true
    dino.value.isHoldingJump = false
  }
}
const handleFastDropEnd = (e?: Event) => {
  if (e) e.preventDefault()
  dino.value.isFastDropping = false
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') handleJumpPress(e)
  if (e.code === 'ArrowDown') handleFastDrop(e)
  if (e.code === 'KeyP' || e.code === 'Escape') {
    // P键或ESC键暂停/继续
    if (gameState.value.isPlaying && !gameState.value.gameOver) {
      handleMainAction()
    }
  }
}
const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') handleJumpRelease(e)
  if (e.code === 'ArrowDown') handleFastDropEnd(e)
}

// --- 游戏流程 ---
const handleMainAction = () => {
  if (!gameState.value.isPlaying || gameState.value.gameOver) {
    startGame()
  } else {
    // 暂停/继续切换
    gameState.value.isPaused = !gameState.value.isPaused
    if (!gameState.value.isPaused) {
      gameLoop()  // 继续游戏循环
    }
  }
}

const startGame = () => {
  if (!ctx.value) {
    ctx.value = gameCanvas.value?.getContext('2d') || null
  }

  gameState.value.isPlaying = true
  gameState.value.isPaused = false  // 确保开始时不是暂停状态
  gameState.value.gameOver = false
  score.value = 0
  gameState.value.coinsCollected = 0
  currentSpeed = config.baseSpeed
  obstacles.value = []
  coins.value = []
  particles.value = []

  const canvasHeight = gameCanvas.value?.height || 250
  const groundY = canvasHeight - config.groundHeight - dino.value.height
  dino.value.y = groundY
  dino.value.vy = 0
  dino.value.isJumping = false
  dino.value.jumpCount = 0

  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  gameLoop()
}

const gameOver = () => {
  gameState.value.gameOver = true
  gameState.value.isPlaying = false
  playSound('over')
  if (Math.floor(score.value) > bestScore.value) {
    bestScore.value = Math.floor(score.value)
    localStorage.setItem('dinoRetroBestScore_CN', bestScore.value.toString())
  }
  spawnParticles(dino.value.x + 15, dino.value.y + 15, colors.obstacle, 20)
  
  // 碰撞结束时，上报后端成绩
  saveScore(Math.floor(score.value))
}

// --- 渲染引擎 (Pixel Art) ---
const drawPixelArt = (x: number, y: number, pattern: string[], color: string, scale: number = 2) => {
  if (!ctx.value) return
  ctx.value.fillStyle = color
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === '1') {
        ctx.value.fillRect(Math.floor(x + c * scale), Math.floor(y + r * scale), scale, scale)
      }
    }
  }
}

// 恐龙: 15宽 x 16高
const dinoPattern1 = [
  "000000011111110",
  "000000011011111",
  "000000011111111",
  "000000011111111",
  "000000011111000",
  "000000011111110",
  "100000111110000",
  "110001111111000",
  "111011111111000",
  "111111111110000",
  "011111111100000",
  "001111111000000",
  "000111111000000",
  "000011011000000",
  "000011001100000",
  "000001100110000"
]
const dinoPattern2 = [
  "000000011111110",
  "000000011011111",
  "000000011111111",
  "000000011111111",
  "000000011111000",
  "000000011111110",
  "100000111110000",
  "110001111111000",
  "111011111111000",
  "111111111110000",
  "011111111100000",
  "001111111000000",
  "000111111000000",
  "000011011000000",
  "000000001100000",
  "000000000110000"
]
const cactusPattern = [
  "0011000",
  "0011000",
  "1111001",
  "1111011",
  "1111111",
  "0111110",
  "0011000",
  "0011000"
]
const birdPattern1 = [
  "00000110",
  "01111111",
  "11111111",
  "00011100"
]
const birdPattern2 = [
  "00111000",
  "01111100",
  "11111111",
  "00011100"
]

const spawnParticles = (x: number, y: number, color: string, count: number) => {
  for(let i=0; i<count; i++) {
    particles.value.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 1) * 8,
      life: 1,
      color
    })
  }
}

// --- 主循环 ---
const gameLoop = () => {
  if (!ctx.value || !gameCanvas.value) return
  if (gameState.value.gameOver) return
  if (gameState.value.isPaused) return  // 暂停时不更新游戏逻辑

  const cvs = gameCanvas.value
  const c = ctx.value

  c.fillStyle = colors.bg
  c.fillRect(0, 0, cvs.width, cvs.height)

  // 平滑的速度增长系统
  currentSpeed = Math.min(config.maxSpeed, currentSpeed + config.speedGrowth)

  // 得分系统：速度越快得分越高
  const scoreMultiplier = 1 + (currentSpeed - config.baseSpeed) / config.maxSpeed
  score.value += currentSpeed * 0.015 * scoreMultiplier

  groundOffset = (groundOffset + currentSpeed) % 40

  const groundY = cvs.height - config.groundHeight
  c.fillStyle = colors.ground
  c.fillRect(0, groundY, cvs.width, 2)
  for (let i = 0; i < cvs.width; i += 40) {
    c.fillRect(i - groundOffset, groundY + 6, 4, 2)
    c.fillRect(i - groundOffset + 15, groundY + 12, 2, 2)
  }

  // 物理
  if (dino.value.isJumping || dino.value.y < groundY - dino.value.height) {
    let currentGravity = config.gravity

    // 二段跳时减小重力，增加滞空时间和水平移动距离
    if (dino.value.jumpCount === 2 && dino.value.vy < 0) {
      currentGravity *= 0.5  // 二段跳上升时重力减半，飞得更远
    } else if (dino.value.isHoldingJump && dino.value.vy < 0) {
      currentGravity *= 0.6  // 长按跳跃时减小重力
    }

    if (dino.value.isFastDropping) currentGravity = config.fastDropForce

    dino.value.vy += currentGravity
    if (dino.value.vy > config.maxFallingSpeed) dino.value.vy = config.maxFallingSpeed
    dino.value.y += dino.value.vy

    if (dino.value.y >= groundY - dino.value.height) {
      dino.value.y = groundY - dino.value.height
      dino.value.isJumping = false
      dino.value.isFastDropping = false
      dino.value.vy = 0
      dino.value.jumpCount = 0
      spawnParticles(dino.value.x + 15, dino.value.y + dino.value.height, colors.ground, 3)
    }
  }

  // 绘制
  dino.value.animTimer++
  const runFrame = Math.floor(dino.value.animTimer / 10) % 2
  const currentPattern = dino.value.isJumping ? dinoPattern1 : (runFrame === 0 ? dinoPattern1 : dinoPattern2)
  drawPixelArt(dino.value.x, dino.value.y, currentPattern, colors.dino, 2)

  // 障碍物
  obstacles.value.forEach((obs) => {
    obs.x -= currentSpeed * (obs.isBird ? 1.3 : 1)

    if (obs.isBird) {
      const birdFrame = Math.floor(dino.value.animTimer / 15) % 2
      drawPixelArt(obs.x, obs.y, birdFrame ? birdPattern1 : birdPattern2, colors.obstacle, 3)
    } else {
      drawPixelArt(obs.x, obs.y, cactusPattern, colors.obstacle, 3)
    }

    const paddingX = 6; const paddingY = 6;
    if (
      dino.value.x + paddingX < obs.x + obs.w - paddingX &&
      dino.value.x + dino.value.width - paddingX > obs.x + paddingX &&
      dino.value.y + paddingY < obs.y + obs.h - paddingY &&
      dino.value.y + dino.value.height - paddingY > obs.y + paddingY
    ) {
      gameOver()
    }
  })
  obstacles.value = obstacles.value.filter(o => o.x + o.w > 0)

  // 障碍物生成：根据得分动态调整间距和难度
  const minGap = Math.max(280, 450 - score.value * 0.15)  // 障碍物最小间距：从450逐渐缩小到280
  const birdProbability = Math.min(0.35, 0.05 + score.value * 0.0003) // 飞鸟概率：从5%逐渐增加到35%

  if (obstacles.value.length === 0 || obstacles.value[obstacles.value.length - 1].x < cvs.width - minGap - Math.random() * 150) {
    const isBird = Math.random() < birdProbability && score.value > 100
    obstacles.value.push({
      x: cvs.width + 50,
      y: isBird ? groundY - 60 - Math.random() * 30 : groundY - 24,
      w: isBird ? 24 : 21,
      h: isBird ? 12 : 24,
      isBird
    })
  }

  // 金币
  coins.value.forEach(coin => {
    coin.x -= currentSpeed
    c.fillStyle = colors.coin
    c.fillRect(coin.x, coin.y, 12, 12)
    c.fillStyle = '#fff'
    c.fillRect(coin.x + 2, coin.y + 2, 4, 4)

    if (
      dino.value.x < coin.x + 12 && dino.value.x + dino.value.width > coin.x &&
      dino.value.y < coin.y + 12 && dino.value.y + dino.value.height > coin.y
    ) {
      coin.collected = true
      gameState.value.coinsCollected++
      score.value += 20
      playSound('coin')
      spawnParticles(coin.x + 6, coin.y + 6, colors.coin, 6)
    }
  })
  coins.value = coins.value.filter(c => c.x + 12 > 0 && !c.collected)

  // 金币生成：随得分增加而更频繁
  const coinProbability = Math.min(0.025, 0.01 + score.value * 0.00002)

  if (Math.random() < coinProbability && coins.value.length < 2 && obstacles.value.length > 0) {
    const lastObs = obstacles.value[obstacles.value.length - 1]
    if (lastObs.x < cvs.width - 100) {
      coins.value.push({ x: cvs.width + 50, y: groundY - 50 - Math.random() * 50 })
    }
  }

  // 粒子特效
  particles.value.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    p.life -= 0.03
    c.globalAlpha = Math.max(0, p.life)
    c.fillStyle = p.color
    c.fillRect(p.x, p.y, 4, 4)
  })
  c.globalAlpha = 1
  particles.value = particles.value.filter(p => p.life > 0)

  animationFrameId = requestAnimationFrame(gameLoop)
}

const quitGame = () => router.push('/games')

// --- 修正初始化：确保 ctx 获取并且正确绘制待机状态 ---
const resizeCanvas = () => {
  nextTick(() => {
    isMobile.value = window.innerWidth <= 768
    if (stageWrapper.value && gameCanvas.value) {
      // 关键修复：确保在缩放时拿到画笔
      if (!ctx.value) ctx.value = gameCanvas.value.getContext('2d')

      const rect = stageWrapper.value.getBoundingClientRect()
      gameCanvas.value.width = rect.width || 600
      gameCanvas.value.height = Math.max(rect.height, 250)

      if (!gameState.value.isPlaying) {
        dino.value.y = gameCanvas.value.height - config.groundHeight - dino.value.height
        drawIdleState()
      }
    }
  })
}

const drawIdleState = () => {
  if (!ctx.value || !gameCanvas.value) return
  const cvs = gameCanvas.value
  const c = ctx.value
  c.fillStyle = colors.bg
  c.fillRect(0, 0, cvs.width, cvs.height)

  const groundY = cvs.height - config.groundHeight
  c.fillStyle = colors.ground
  c.fillRect(0, groundY, cvs.width, 2)

  drawPixelArt(dino.value.x, dino.value.y, dinoPattern1, colors.dino, 2)
}

onMounted(() => {
  // 关键修复：组件挂载后立刻尝试绑定 ctx
  if (gameCanvas.value) {
    ctx.value = gameCanvas.value.getContext('2d')
  }

  resizeCanvas()
  setTimeout(resizeCanvas, 100)

  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  // 预加载排行和历史，提升弹窗秒开的速度
  fetchRankings()
  fetchHistory()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

* {
  user-select: none;
  -webkit-touch-callout: none;
  box-sizing: border-box;
}

.yuemu-retro-dino-universe {
  position: fixed; inset: 0;
  background-color: var(--background);
  display: flex; justify-content: center; align-items: center;
  font-family: 'SimHei', 'Press Start 2P', monospace;
  overflow: hidden;
}

.arcade-console {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 20px 20px 60px 20px;
  width: 100%; max-width: 760px; height: 90vh; max-height: 800px;
  display: flex; flex-direction: column;
  box-shadow: 15px 15px 0 var(--shadow-color), inset 2px 2px 0 rgba(255,255,255,0.1);
}

.marquee {
  border-bottom: 4px solid var(--border-color);
  padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;
  cursor: pointer; background: var(--console-body); border-radius: 16px 16px 0 0;
}
.back-btn { font-size: 14px; color: var(--text-secondary); font-weight: bold;}
.marquee:hover .back-btn { color: var(--text-primary); }
.game-title { margin: 0; font-size: 22px; color: var(--text-primary); font-weight: 900; letter-spacing: 2px;}
.version { font-size: 12px; color: var(--text-secondary); font-weight: bold;}

.screen-bezel {
  flex: 1; background: var(--console-body); padding: 25px;
  border-bottom: 4px solid var(--border-color);
  display: flex; flex-direction: column;
  box-shadow: inset 0 10px 25px rgba(0,0,0,0.2);
  min-height: 0;
}

.screen-glass {
  flex: 1; background: #111827;
  border: 4px solid var(--border-color); border-radius: 8px;
  display: flex; flex-direction: column; position: relative; overflow: hidden;
  box-shadow: inset 0 0 40px rgba(0,0,0,0.8);
}
.crt-effect::after {
  content: " "; position: absolute; inset: 0;
  background: linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%);
  background-size: 100% 4px; z-index: 50; pointer-events: none; opacity: 0.3;
}

.hud-bar {
  display: flex; justify-content: space-between;
  border-bottom: 2px dashed #334155; padding: 12px 20px; z-index: 10;
  background: rgba(17, 24, 39, 0.8);
}
.hud-item { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.center-item { flex: 1; }
.hud-label { color: #94a3b8; font-size: 12px; font-weight: bold;}
.hud-val { color: #f8fafc; font-size: 18px; font-family: 'Press Start 2P', monospace;}
.highlight { color: #4ade80; text-shadow: 2px 2px 0 rgba(74, 222, 128, 0.3); }
.text-gold { color: #fbbf24; text-shadow: 2px 2px 0 rgba(251, 191, 36, 0.3);}

.stage-wrapper {
  flex: 1; position: relative; width: 100%; height: 100%; min-height: 250px;
}
.game-canvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; z-index: 5;}

.screen-overlay {
  position: absolute; inset: 0; background: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(4px); display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 40; padding: 20px; text-align: center;
}
.pixel-title { font-size: 36px; color: #4ade80; margin-bottom: 10px; font-weight: 900; letter-spacing: 4px; text-shadow: 4px 4px 0 rgba(74, 222, 128, 0.3);}
.pixel-title.danger { color: #f87171; text-shadow: 4px 4px 0 rgba(248, 113, 113, 0.3);}
.instruction-text { font-size: 14px; color: #cbd5e1; line-height: 2; font-weight: bold;}
.instruction-text.highlight { color: #fbbf24; font-size: 16px; margin-top: 15px;}

.results-box { margin-bottom: 30px; font-size: 18px; color: #cbd5e1; text-align: left; line-height: 2.5;}
.results-box span { color: #f8fafc; font-weight: bold; margin-left: 15px; font-size: 22px;}
.hint-text { font-size: 16px; color: #4ade80; margin-top: 30px; font-weight: bold; letter-spacing: 2px;}
.blink { animation: stepBlink 1s step-end infinite; }
@keyframes stepBlink { 50% { opacity: 0; } }

.control-panel {
  padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
}

.system-section { display: flex; gap: 15px; }
.sys-btn {
  background: transparent; border: none; outline: none; cursor: pointer;
  transition: transform 0.1s; padding: 0;
}
.sys-icon-btn {
  padding: 12px 20px; background: var(--card-background); border: 4px solid var(--text-primary);
  border-radius: 8px; font-family: 'SimHei', sans-serif; font-size: 16px; font-weight: 900; color: var(--text-primary);
  box-shadow: 4px 4px 0 var(--text-primary);
}
.sys-btn:active .sys-icon-btn { transform: translateY(4px); box-shadow: 0 0 0 var(--text-primary); background: var(--console-body);}

.arcade-buttons-section { width: 100%; display: flex; justify-content: space-between; }
.arcade-btn {
  background: var(--console-body); border: 6px solid var(--border-color); border-radius: 50%;
  width: 95px; height: 95px; display: flex; justify-content: center; align-items: center;
  box-shadow: 0 6px 0 var(--shadow-color); outline: none; -webkit-tap-highlight-color: transparent;
}
.btn-cap {
  width: 75px; height: 75px; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center;
  color: #fff; font-size: 24px; font-weight: 900; font-family: Arial, sans-serif;
  box-shadow: inset 0 4px 10px rgba(255,255,255,0.4), inset 0 -4px 10px rgba(0,0,0,0.4);
  transition: all 0.1s;
}
.btn-cap span { font-size: 12px; margin-top: 4px; font-family: 'SimHei', sans-serif; font-weight: bold; letter-spacing: 2px;}

.a-btn .btn-cap { background: #ef4444; text-shadow: 2px 2px 0 #991b1b; box-shadow: 0 6px 0 #991b1b, inset 0 4px 10px rgba(255,255,255,0.4); }
.b-btn .btn-cap { background: #3b82f6; text-shadow: 2px 2px 0 #1e3a8a; box-shadow: 0 6px 0 #1e3a8a, inset 0 4px 10px rgba(255,255,255,0.4); }

.arcade-btn:active { transform: translateY(6px); box-shadow: 0 2px 0 var(--shadow-color); }
.arcade-btn:active .btn-cap { transform: translateY(4px); box-shadow: 0 0 0 transparent, inset 0 2px 5px rgba(255,255,255,0.2); }

@media screen and (max-width: 768px) {
  .yuemu-retro-dino-universe { padding: 0; }
  .arcade-console { border-radius: 0; border: none; box-shadow: none; padding: 0; justify-content: space-between; }

  .marquee { padding: 12px; border-radius: 0;}
  .game-title { font-size: 18px; }
  .screen-bezel { padding: 10px; border: none; box-shadow: none; }

  .hud-bar { padding: 10px; border-bottom: 2px dashed #334155;}
  .hud-label { font-size: 10px; }
  .hud-val { font-size: 14px; }

  .pixel-title { font-size: 28px; }
  .instruction-text { font-size: 12px; }

  .control-panel { flex-direction: column; gap: 25px; padding: 15px 25px 30px 25px; }
  .system-section { width: 100%; justify-content: space-between; }
  .sys-icon-btn { font-size: 14px; padding: 10px 15px;}
}

@media screen and (max-width: 360px) {
  .arcade-btn { width: 85px; height: 85px; }
  .btn-cap { width: 65px; height: 65px; font-size: 20px; }
  .btn-cap span { font-size: 10px; }
  .pixel-title { font-size: 24px; }
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
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--border-color);
  transition: all 0.1s;
}
.mini-diag-btn:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--border-color);
}
.mini-diag-btn .sys-icon { font-size: 14px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.mini-diag-btn .sys-text { font-size: 8px; color: var(--text-secondary); font-weight: bold; }

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
/* PC 端左右宽屏分栏布局重构 */
@media (min-width: 769px) {
  .arcade-console {
    max-width: 960px;
    height: 85vh;
    max-height: 900px;
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto auto 1fr;
    border-radius: 16px;
    gap: 0;
    padding: 0;
    overflow: hidden;
  }
  .marquee {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    border-right: 4px solid var(--border-color);
    border-radius: 0;
  }
  .screen-bezel {
    grid-column: 1 / 2;
    grid-row: 2 / 4;
    border-right: 4px solid var(--border-color);
    border-radius: 0;
    box-shadow: none;
    padding: 20px;
    background: transparent;
  }
  .diagnostic-trigger-bar {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    flex-direction: column;
    justify-content: center;
    padding: 20px;
    border-bottom: 4px solid var(--border-color);
    gap: 15px;
  }
  .control-panel {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    flex-direction: column;
    justify-content: flex-start;
    padding: 30px 20px;
    gap: 20px;
  }
  .system-section {
    flex-direction: column;
    width: 100%;
    gap: 20px;
  }
  .sys-btn {
    width: 100%;
  }
  .sys-icon-btn {
    font-size: 14px;
    padding: 15px;
  }
}
</style>
