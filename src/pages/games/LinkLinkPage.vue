<template>
  <div class="yuemu-retro-link-universe" :class="{ 'yuemu-is-mobile': isMobile, 'yuemu-shake-screen': isShaking }" @touchmove.prevent>
    <div class="yuemu-arcade-console">

      <div class="yuemu-marquee" @click="quitGame">
        <span class="yuemu-back-btn"><i class="fas fa-arrow-left"></i> {{ t('pages.games.linkLinkPage.exit') }} </span>
        <h1 class="yuemu-game-title">{{ t('pages.games.linkLinkPage.linkLink') }}</h1>
        <span class="yuemu-version">{{ t('pages.games.linkLinkPage.osV3GeekEdition') }}</span>
      </div>

      <div class="yuemu-screen-bezel">
        <div class="yuemu-screen-glass yuemu-crt-effect">

          <div class="yuemu-hud-bar">
            <div class="yuemu-hud-item">
              <span class="yuemu-hud-label">{{ t('pages.games.linkLinkPage.score') }}</span>
              <span class="yuemu-hud-val yuemu-highlight">{{ score }}</span>
            </div>
            <div class="yuemu-hud-item yuemu-center-item">
              <span class="yuemu-hud-label">{{ t('pages.games.linkLinkPage.time') }}</span>
              <span class="yuemu-hud-val" :class="{ 'yuemu-danger-blink': timeLeft < 20 }">{{ formatTime(timeLeft) }}</span>
            </div>
            <div class="yuemu-hud-item">
              <span class="yuemu-hud-label">{{ t('pages.games.linkLinkPage.best') }}</span>
              <span class="yuemu-hud-val">{{ bestScore }}</span>
            </div>
          </div>

          <div class="yuemu-stage-container" ref="stageContainer">
            <div class="yuemu-game-board" :style="{
              gridTemplateColumns: `repeat(${currentCfg.cols}, 1fr)`,
              gridTemplateRows: `repeat(${currentCfg.rows}, 1fr)`,
              '--tile-font-size': currentCfg.cols > 8 ? '13px' : currentCfg.cols > 6 ? '18px' : '26px',
              '--tile-border-width': currentCfg.cols > 8 ? '1px' : '2px',
              '--tile-border-radius': currentCfg.cols > 8 ? '4px' : '8px',
              '--tile-padding': currentCfg.cols > 8 ? '1px' : '2px'
            }">
              <div
                v-for="cell in flatBoard"
                :key="`${cell.y}-${cell.x}`"
                class="yuemu-tile-wrapper"
                :style="{ padding: 'var(--tile-padding)' }"
                @click="handleCellClick(cell.x, cell.y)"
              >
                <div
                  v-if="!cell.matched"
                  class="yuemu-tile"
                  :class="{
                    'yuemu-selected': isSelected(cell.x, cell.y),
                    'yuemu-error': isError(cell.x, cell.y),
                    'yuemu-hinted': cell.isHinted
                  }"
                >
                  <i :class="cell.icon" class="yuemu-tile-icon"></i>
                </div>
              </div>
            </div>

            <canvas ref="gameCanvas" class="yuemu-line-canvas"></canvas>

            <div v-if="errorMsg" class="yuemu-error-toast">{{ errorMsg }}</div>

            <div v-if="!isPlaying && !showEndModal" class="yuemu-screen-overlay yuemu-menu-overlay">
              <h1 class="yuemu-pixel-title">{{ t('pages.games.linkLinkPage.neonLinkLink') }}</h1>
              <div class="yuemu-difficulty-select">
                <span v-for="d in [t('pages.games.linkLinkPage.beginner'), t('pages.games.linkLinkPage.intermediate'), t('pages.games.linkLinkPage.advanced')]"
                      :key="d"
                      :class="{ 'yuemu-active': difficulty === d }"
                      @click.stop="difficulty = d">
                  {{ d }}
                </span>
              </div>
              <button class="yuemu-arcade-start-btn" @click.stop="startGame">{{ t('pages.games.linkLinkPage.pressStartKey') }}</button>
            </div>

            <div v-if="showEndModal" class="yuemu-screen-overlay yuemu-result-overlay">
              <div class="yuemu-trophy">
                <i :class="isWin ? 'fas fa-trophy yuemu-win-icon' : 'fas fa-dizzy yuemu-lose-icon'"></i>
              </div>
              <h1 class="yuemu-pixel-title" :class="{ 'yuemu-win-text': isWin }">{{ isWin ? t('pages.games.linkLinkPage.levelPassedStatus') : t('pages.games.linkLinkPage.timeOut') }}</h1>
              <div class="yuemu-stats-grid">
                <div class="yuemu-s-item">{{ t('pages.games.linkLinkPage.scoreIs', { score: score }) }}</div>
                <div class="yuemu-s-item">{{ t('pages.games.linkLinkPage.matchedPairsIs', { pairs: matchedPairs }) }}</div>
              </div>
              <div class="yuemu-action-hints">
                <p class="yuemu-blink yuemu-clickable" @click.stop="startGame">[ <i class="fas fa-redo"></i> {{ t('pages.games.linkLinkPage.retryBracket') }} </p>
                <p class="yuemu-clickable" @click.stop="quitGame">[ <i class="fas fa-sign-out-alt"></i> {{ t('pages.games.linkLinkPage.exitBracket') }} </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="yuemu-control-panel">
        <div class="yuemu-tools-row">
          <button v-for="(tool, key) in tools" :key="key"
                  class="yuemu-tool-button"
                  @click="useTool(key as string)"
                  :disabled="!tool.available || !isPlaying">
            <span class="yuemu-t-icon">
              <i :class="key === 'bomb' ? 'fas fa-bomb' : key === 'refresh' ? 'fas fa-sync' : 'fas fa-lightbulb'"></i>
            </span>
            <span class="yuemu-t-name">{{ key === 'bomb' ? t('pages.games.linkLinkPage.bomb') : key === 'refresh' ? t('pages.games.linkLinkPage.refresh') : t('pages.games.linkLinkPage.hint') }}</span>
            <div class="yuemu-t-cd" :style="{ height: tool.available ? '0%' : '100%' }"></div>
          </button>
        </div>

        <!-- 极客诊断通道按钮 (防挤压街机控制，纯中文) -->
        <div class="yuemu-diagnostic-trigger-bar">
          <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
            <span class="yuemu-sys-icon"><i class="fas fa-trophy"></i></span>
            <span class="yuemu-sys-text">{{ t('pages.games.linkLinkPage.leaderboardBracket') }}</span>
          </button>
          <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
            <span class="yuemu-sys-icon"><i class="fas fa-history"></i></span>
            <span class="yuemu-sys-text">{{ t('pages.games.linkLinkPage.historyLogBracket') }}</span>
          </button>
        </div>

        <div class="yuemu-sys-row">
          <button class="yuemu-round-btn yuemu-snd" @click="toggleSound">
            <div class="yuemu-btn-cap">
              <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
            </div>
            <span>{{ t('pages.games.linkLinkPage.sound') }}</span>
          </button>
          <button class="yuemu-round-btn yuemu-rst" @click="startGame">
            <div class="yuemu-btn-cap"><i class="fas fa-sync-alt"></i></div>
            <span>{{ t('pages.games.linkLinkPage.reset') }}</span>
          </button>
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
          <span class="model-name terminal-title">{{ t('pages.games.linkLinkPage.monitorDiagnosticR09') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.linkLinkPage.rankBracket') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.linkLinkPage.historyBracket') }}
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
              <span class="filter-label">{{ t('pages.games.linkLinkPage.difficultyFilter') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.linkLinkPage.allLevels') }}</option>
                <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>

            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.linkLinkPage.ranking') }}</span>
              <span>{{ t('pages.games.linkLinkPage.matchTerminal') }}</span>
              <span>{{ t('pages.games.linkLinkPage.highestScoreLabel') }}</span>
              <span>{{ t('pages.games.linkLinkPage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.linkLinkPage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.linkLinkPage.noMatchRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.linkLinkPage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">{{ t('pages.games.linkLinkPage.scorePoints', { score: item.score }) }}</span>
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
                {{ t('pages.games.linkLinkPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.linkLinkPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.linkLinkPage.accessTime') }}</span>
              <span>{{ t('pages.games.linkLinkPage.matchDifficulty') }}</span>
              <span>{{ t('pages.games.linkLinkPage.finalRating') }}</span>
              <span>{{ t('pages.games.linkLinkPage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.linkLinkPage.readingPhysicsArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.linkLinkPage.noLocalMatchLog') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.linkLinkPage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.linkLinkPage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.linkLinkPage.matchSuccess') : t('pages.games.linkLinkPage.notInitiated') }}
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
                {{ t('pages.games.linkLinkPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.linkLinkPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.linkLinkPage.closeDiagTerminal') }}
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
import { ref, onMounted, onUnmounted, reactive, computed, watch } from 'vue'
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

// --- 排行榜 & 历史记录弹窗状态管理 ---
const isTerminalOpen = ref(false)
const activeTab = ref<'ranking' | 'history'>('ranking')

const rankings = ref<any[]>([])
const rankingLoading = ref(false)
const rankPage = ref(1)
const totalRankPages = ref(1)
const selectedRankLevel = ref('')
const levelOptions = [t('pages.games.linkLinkPage.beginner'), t('pages.games.linkLinkPage.intermediate'), t('pages.games.linkLinkPage.advanced')]

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
      gameType: 'link_link',
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
    console.error(t('pages.games.linkLinkPage.getRankingsError'), err)
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
      gameType: 'link_link',
      current: historyPage.value,
      pageSize: 8
    })
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || []
      const total = res.data.data?.total || 0
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1)
    }
  } catch (err) {
    console.error(t('pages.games.linkLinkPage.getHistoryArchiveError'), err)
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
    console.warn(t('pages.games.linkLinkPage.notLoggedInSave'))
    return
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'link_link',
      level: difficulty.value,
      score: finalScore
    })
    if (res.data?.code === 0) {
      fetchRankings()
      fetchHistory()
    }
  } catch (err) {
    console.error(t('pages.games.linkLinkPage.reportLinkLinkScoreError'), err)
  }
}

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.linkLinkPage.unknown')
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// --- 核心配置 ---
const difficulty = ref(t('pages.games.linkLinkPage.beginner'))
const config = {
  [t('pages.games.linkLinkPage.beginner')]: { rows: 6, cols: 6, iconCount: 8, timeLimit: 120 },
  [t('pages.games.linkLinkPage.intermediate')]: { rows: 8, cols: 8, iconCount: 12, timeLimit: 180 },
  [t('pages.games.linkLinkPage.advanced')]: { rows: 10, cols: 10, iconCount: 16, timeLimit: 240 }
}

// 统一使用 FontAwesome 矢量图标，避免 Emoji 锯齿且与整体极客街机风对齐
const emojis = [
  'fas fa-ghost',
  'fas fa-heart',
  'fas fa-star',
  'fas fa-gem',
  'fas fa-crown',
  'fas fa-dragon',
  'fas fa-fire',
  'fas fa-skull',
  'fas fa-bolt',
  'fas fa-rocket',
  'fas fa-trophy',
  'fas fa-gamepad',
  'fas fa-shield-alt',
  'fas fa-anchor',
  'fas fa-magnet',
  'fas fa-key'
]

// --- 状态管理 ---
const isMobile = ref(false)
const isPlaying = ref(false)
const score = ref(0)
const bestScore = ref(parseInt(localStorage.getItem('linkGameBestScore') || '0'))
const timeLeft = ref(0)
const matchedPairs = ref(0)
const showEndModal = ref(false)
const isWin = ref(false)
const isShaking = ref(false)
const errorMsg = ref('')

const stageContainer = ref<HTMLElement | null>(null)
const gameCanvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

interface Cell { icon: string; matched: boolean; x: number; y: number; isHinted?: boolean }
const board = ref<Cell[][]>([])
const flatBoard = computed(() => board.value.flat())
const selected = ref<{x: number, y: number}[]>([])
const errorState = ref<{x: number, y: number}[]>([])
const connectionLine = ref<{path: {x: number, y: number}[]} | null>(null)

let gameTimer: any = null

const tools = reactive({
  bomb: { icon: '<i class="fas fa-bomb"></i>', available: true, cooldown: 20000 },
  refresh: { icon: '<i class="fas fa-random"></i>', available: true, cooldown: 15000 },
  hint: { icon: '<i class="fas fa-lightbulb"></i>', available: true, cooldown: 10000 }
})

// --- 音效系统 ---
const isSoundEnabled = ref(true)
const sfx = {
  select: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href),
  match: new Audio(new URL('@/assets/sounds/match.MP3', import.meta.url).href),
  combo: new Audio(new URL('@/assets/sounds/combo.MP3', import.meta.url).href),
  error: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href),
  win: new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href),
  lose: new Audio(new URL('@/assets/sounds/lose.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  refresh: new Audio(new URL('@/assets/sounds/rotate.MP3', import.meta.url).href),
  bomb: new Audio(new URL('@/assets/sounds/clear.MP3', import.meta.url).href),
  hint: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href)
}
Object.values(sfx).forEach(audio => audio.volume = 0.4)
sfx.win.volume = 0.6; sfx.combo.volume = 0.5;

const playSound = (name: keyof typeof sfx) => {
  if (!isSoundEnabled.value) return
  const sound = sfx[name]
  sound.currentTime = 0
  sound.play().catch(() => {})
}

const currentCfg = computed(() => (config as any)[difficulty.value])

// --- 核心寻路引擎 ---
const isClear = (x: number, y: number) => {
  const { rows, cols } = currentCfg.value
  if (x < 0 || x >= cols || y < 0 || y >= rows) return true // 外围通道永远畅通
  return board.value[y][x].matched
}

const checkStraightLine = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
  if (p1.x !== p2.x && p1.y !== p2.y) return false
  if (p1.x === p2.x) {
    const min = Math.min(p1.y, p2.y), max = Math.max(p1.y, p2.y)
    for (let y = min + 1; y < max; y++) if (!isClear(p1.x, y)) return false
  } else {
    const min = Math.min(p1.x, p2.x), max = Math.max(p1.x, p2.x)
    for (let x = min + 1; x < max; x++) if (!isClear(x, p1.y)) return false
  }
  return true
}

const findPath = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
  if (p1.x === p2.x && p1.y === p2.y) return null
  if (board.value[p1.y][p1.x].icon !== board.value[p2.y][p2.x].icon) return null

  // 0折点：直线直达
  if (checkStraightLine(p1, p2)) return [p1, p2]

  // 1折点：L型
  const c1 = {x: p1.x, y: p2.y}, c2 = {x: p2.x, y: p1.y}
  if (isClear(c1.x, c1.y) && checkStraightLine(p1, c1) && checkStraightLine(c1, p2)) return [p1, c1, p2]
  if (isClear(c2.x, c2.y) && checkStraightLine(p1, c2) && checkStraightLine(c2, p2)) return [p1, c2, p2]

  // 2折点：U型或Z型 (向外扫描射线)
  const { rows, cols } = currentCfg.value
  // X轴双向扫描
  for (let dir of [-1, 1]) {
    for (let x = p1.x + dir; x >= -1 && x <= cols; x += dir) {
      if (!isClear(x, p1.y)) break
      const corner1 = {x, y: p1.y}, corner2 = {x, y: p2.y}
      if (isClear(corner2.x, corner2.y) && checkStraightLine(corner1, corner2) && checkStraightLine(corner2, p2)) {
        return [p1, corner1, corner2, p2]
      }
    }
  }
  // Y轴双向扫描
  for (let dir of [-1, 1]) {
    for (let y = p1.y + dir; y >= -1 && y <= rows; y += dir) {
      if (!isClear(p1.x, y)) break
      const corner1 = {x: p1.x, y}, corner2 = {x: p2.x, y}
      if (isClear(corner2.x, corner2.y) && checkStraightLine(corner1, corner2) && checkStraightLine(corner2, p2)) {
        return [p1, corner1, corner2, p2]
      }
    }
  }
  return null
}

// --- 游戏主逻辑 ---
const startGame = () => {
  isPlaying.value = true
  showEndModal.value = false
  score.value = 0
  matchedPairs.value = 0
  selected.value = []; errorState.value = []; errorMsg.value = ''; connectionLine.value = null
  timeLeft.value = currentCfg.value.timeLimit

  Object.values(tools).forEach(t => t.available = true)
  playSound('start')

  const { rows, cols, iconCount } = currentCfg.value
  let pool: string[] = []
  for (let i = 0; i < (rows * cols) / 2; i++) {
    const icon = emojis[i % Math.min(iconCount, emojis.length)]
    pool.push(icon, icon)
  }
  pool.sort(() => Math.random() - 0.5)

  board.value = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({ icon: pool[y * cols + x], matched: false, x, y }))
  )

  if (gameTimer) clearInterval(gameTimer)
  gameTimer = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--
    else endGame(false)
  }, 1000)

  resizeCanvas()
}

const isSelected = (x: number, y: number) => selected.value.some(p => p.x === x && p.y === y)
const isError = (x: number, y: number) => errorState.value.some(p => p.x === x && p.y === y)

const handleCellClick = (x: number, y: number) => {
  if (!isPlaying.value || board.value[y][x].matched) return

  if (selected.value.length === 1 && selected.value[0].x === x && selected.value[0].y === y) {
    selected.value = []; return
  }

  selected.value.push({ x, y })
  playSound('select')

  if (selected.value.length === 2) {
    const p1 = selected.value[0], p2 = selected.value[1]
    const path = findPath(p1, p2)

    if (path) {
      connectionLine.value = { path }
      if (matchedPairs.value > 0 && matchedPairs.value % 5 === 0) playSound('combo')
      else playSound('match')

      setTimeout(() => {
        board.value[p1.y][p1.x].matched = true
        board.value[p2.y][p2.x].matched = true
        matchedPairs.value++
        score.value += 100
        selected.value = []; connectionLine.value = null

        if (matchedPairs.value === (currentCfg.value.rows * currentCfg.value.cols) / 2) {
          endGame(true)
        } else {
          checkDeadlock() // 消除后立刻检查死锁
        }
      }, 250)
    } else {
      errorState.value = [p1, p2]
      isShaking.value = true
      errorMsg.value = board.value[p1.y][p1.x].icon !== board.value[p2.y][p2.x].icon ? t('pages.games.linkLinkPage.patternMismatch') : t('pages.games.linkLinkPage.routeBlocked')
      playSound('error')
      setTimeout(() => {
        errorMsg.value = ''; isShaking.value = false; errorState.value = []
      }, 600)
      selected.value = []
    }
  }
}

// --- 高级功能：防死锁与道具 ---
const getValidMatch = () => {
  const { rows, cols } = currentCfg.value
  for (let y1 = 0; y1 < rows; y1++) {
    for (let x1 = 0; x1 < cols; x1++) {
      if (board.value[y1][x1].matched) continue
      for (let y2 = 0; y2 < rows; y2++) {
        for (let x2 = 0; x2 < cols; x2++) {
          if (board.value[y2][x2].matched || (x1 === x2 && y1 === y2)) continue
          const path = findPath({x:x1, y:y1}, {x:x2, y:y2})
          if (path) return { p1: {x:x1, y:y1}, p2: {x:x2, y:y2}, path }
        }
      }
    }
  }
  return null
}

const checkDeadlock = () => {
  if (!getValidMatch()) {
    errorMsg.value = t('pages.games.linkLinkPage.deadlockShuffle')
    playSound('refresh')
    setTimeout(() => {
      shuffleBoard()
      errorMsg.value = ""
    }, 1000)
  }
}

const forceCreateMatch = () => {
  const unmatched = flatBoard.value.filter(c => !c.matched)
  if (unmatched.length < 2) return

  // 尝试在未消格子中找到两个相邻的格子，使它们具有相同图标
  for (let i = 0; i < unmatched.length; i++) {
    for (let j = i + 1; j < unmatched.length; j++) {
      const c1 = unmatched[i]
      const c2 = unmatched[j]
      if (Math.abs(c1.x - c2.x) + Math.abs(c1.y - c2.y) === 1) {
        c2.icon = c1.icon
        return
      }
    }
  }

  // 如果没有相邻的，强行把前两个未消格子设为相同图标，保障能够畅通消除
  const c1 = unmatched[0]
  const c2 = unmatched[1]
  c2.icon = c1.icon
}

const shuffleBoard = (attempt = 0) => {
  const pool: string[] = []
  board.value.forEach(row => row.forEach(c => { if (!c.matched) pool.push(c.icon) }))
  pool.sort(() => Math.random() - 0.5)
  let i = 0
  board.value.forEach(row => row.forEach(c => { if (!c.matched) c.icon = pool[i++] }))
  
  // 确保洗完牌有解，但加入尝试上限打破死锁，避免递归溢出导致界面卡死崩溃
  if (!getValidMatch() && pool.length > 0) {
    if (attempt < 15) {
      shuffleBoard(attempt + 1)
    } else {
      forceCreateMatch()
    }
  }
}

const useTool = (name: string) => {
  const t = (tools as any)[name]; if(!t.available) return
  t.available = false

  const match = getValidMatch()

  if (name === 'refresh') {
    playSound('refresh')
    shuffleBoard()
  } else if (name === 'hint' && match) {
    playSound('hint')
    board.value[match.p1.y][match.p1.x].isHinted = true
    board.value[match.p2.y][match.p2.x].isHinted = true
    setTimeout(() => {
      board.value[match.p1.y][match.p1.x].isHinted = false
      board.value[match.p2.y][match.p2.x].isHinted = false
    }, 2000)
  } else if (name === 'bomb' && match) {
    playSound('bomb')
    connectionLine.value = { path: match.path }
    setTimeout(() => {
      board.value[match.p1.y][match.p1.x].matched = true
      board.value[match.p2.y][match.p2.x].matched = true
      matchedPairs.value++
      score.value += 100
      connectionLine.value = null
      if (matchedPairs.value === (currentCfg.value.rows * currentCfg.value.cols) / 2) endGame(true)
      else checkDeadlock()
    }, 300)
  }

  setTimeout(() => { t.available = true }, t.cooldown)
}

const endGame = (win: boolean) => {
  isPlaying.value = false; isWin.value = win; showEndModal.value = true
  playSound(win ? 'win' : 'lose')
  if (win && score.value > bestScore.value) {
    bestScore.value = score.value
    localStorage.setItem('linkGameBestScore', score.value.toString())
  }
  if (gameTimer) clearInterval(gameTimer)
  saveScore(score.value)
}

// --- Canvas 高清渲染连线 ---
const resizeCanvas = () => {
  if (!stageContainer.value || !gameCanvas.value) return
  const rect = stageContainer.value.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  gameCanvas.value.width = rect.width * dpr
  gameCanvas.value.height = rect.height * dpr
  ctx.value = gameCanvas.value.getContext('2d')
  ctx.value?.scale(dpr, dpr)
}

watch(connectionLine, (newVal) => {
  if (!ctx.value || !gameCanvas.value) return
  const rect = stageContainer.value!.getBoundingClientRect()
  ctx.value.clearRect(0, 0, rect.width, rect.height)

  if (newVal) {
    const { cols, rows } = currentCfg.value
    
    // 动态解析容器 padding，确保内部棋盘网格尺寸计算绝对精准
    const computedStyle = window.getComputedStyle(stageContainer.value!)
    const padL = parseFloat(computedStyle.paddingLeft) || 0
    const padR = parseFloat(computedStyle.paddingRight) || 0
    const padT = parseFloat(computedStyle.paddingTop) || 0
    const padB = parseFloat(computedStyle.paddingBottom) || 0
    
    const boardW = rect.width - padL - padR
    const boardH = rect.height - padT - padB

    // 计算每个格子在真实 DOM 中的宽度与高度
    const cw = boardW / cols
    const ch = boardH / rows

    ctx.value.save()
    ctx.value.beginPath()
    ctx.value.strokeStyle = '#00f2ff'; ctx.value.lineWidth = 4; ctx.value.lineJoin = 'round'
    ctx.value.shadowBlur = 12; ctx.value.shadowColor = '#00f2ff'

    newVal.path.forEach((p, i) => {
      // 常规内部连线，计算中心点
      let lx = p.x * cw + cw / 2 + padL
      let ly = p.y * ch + ch / 2 + padT
      
      // 外围借道专用：直接行走于安全 Padding 缓冲区中轴线上，绝对防止 Canvas 裁切
      if (p.x === -1) lx = padL / 2
      if (p.x === cols) lx = rect.width - padR / 2
      if (p.y === -1) ly = padT / 2
      if (p.y === rows) ly = rect.height - padB / 2

      if (i === 0) ctx.value!.moveTo(lx, ly)
      else ctx.value!.lineTo(lx, ly)
    })

    ctx.value.stroke()
    ctx.value.strokeStyle = '#fff'; ctx.value.lineWidth = 1.5; ctx.value.stroke()
    ctx.value.restore()
  }
})

const toggleSound = () => isSoundEnabled.value = !isSoundEnabled.value
const quitGame = () => router.push('/games')
const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768
    resizeCanvas()
  })
})

onUnmounted(() => {
  if (gameTimer) clearInterval(gameTimer)
})
</script>

<style scoped>
@font-face {
  font-family: 'PressStart2P';
  src: url('https://fonts.cdnfonts.com/s/14227/PressStart2P-Regular.woff') format('woff');
  font-display: swap;
}

.yuemu-retro-link-universe {
  position: fixed; inset: 0;
  background-color: var(--background);
  display: flex; justify-content: center; align-items: center;
  font-family: 'PressStart2P', Consolas, monospace;
  overflow: hidden; touch-action: none;
}

.yuemu-shake-screen { animation: yuemu-shake 0.3s ease-in-out both; }
@keyframes yuemu-shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.yuemu-arcade-console {
  background: var(--card-background);
  border: 4px solid var(--border-color);
  border-radius: 20px 20px 0 0;
  width: 100%; max-width: 500px; height: 100%; max-height: 900px;
  display: flex; flex-direction: column; box-shadow: 10px 10px 0 var(--shadow-color);
}

.yuemu-marquee {
  background: var(--console-body); padding: 15px;
  border-bottom: 4px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center; cursor: pointer;
}
.yuemu-game-title { font-size: 16px; color: var(--text-primary); margin: 0; text-shadow: 2px 2px 0 var(--shadow-color); }
.yuemu-back-btn, .yuemu-version { font-size: 12px; color: var(--text-secondary); }

.yuemu-screen-bezel { padding: 10px; background: var(--console-body); flex: 1; min-height: 0; display: flex; flex-direction: column;}
.yuemu-screen-glass { flex: 1; background: #0b0b1a; border-radius: 8px; display: flex; flex-direction: column; position: relative; overflow: hidden; }

.yuemu-crt-effect::after {
  content: " "; display: block; position: absolute; inset: 0;
  background: linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.1) 50%);
  background-size: 100% 4px; z-index: 50; pointer-events: none;
}

.yuemu-hud-bar { display: flex; justify-content: space-between; padding: 10px; background: #111; border-bottom: 2px solid #333; z-index: 10;}
.yuemu-hud-item { display: flex; flex-direction: column; align-items: center;}
.yuemu-hud-label { font-size: 12px; color: #888; margin-bottom: 4px;}
.yuemu-hud-val { font-size: 14px; color: #fff; }
.yuemu-highlight { color: #00f2ff; }
.yuemu-danger-blink { color: #ff3366; animation: yuemu-blink 1s infinite; }

.yuemu-stage-container { flex: 1; position: relative; padding: 35px; }

/* 纯DOM方块渲染系统 */
.yuemu-game-board {
  display: grid; width: 100%; height: 100%;
}
.yuemu-tile-wrapper {
  padding: 2px; /* 方块间距 */
  box-sizing: border-box; display: flex; justify-content: center; align-items: center;
}
.yuemu-tile {
  width: 100%; height: 100%; background: #2a2a35;
  border: var(--tile-border-width, 2px) solid #444;
  border-radius: var(--tile-border-radius, 8px);
  display: flex; justify-content: center; align-items: center;
  font-size: var(--tile-font-size, 22px); color: #fff; cursor: pointer;
  transition: all 0.1s; position: relative; z-index: 2;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
}
.yuemu-tile-icon {
  font-size: inherit;
  color: #00f2ff;
  text-shadow: 0 0 8px rgba(0,242,255,0.6);
}
.yuemu-tile.yuemu-selected { border-color: #3b82f6; background: #1e3a8a; box-shadow: 0 0 15px #3b82f6; transform: scale(0.95); }
.yuemu-tile.yuemu-error { border-color: #ff3366; background: #600f20; }
.yuemu-tile.yuemu-hinted { border-color: #ffeb3b; background: #5c5513; animation: yuemu-pulse 1s infinite; }

/* 专职渲染连线的画布 */
.yuemu-line-canvas {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 10;
}

.yuemu-error-toast {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  color: #ff3366; font-size: 14px; z-index: 120;
  text-shadow: 2px 2px 0 #000; padding: 10px 20px; border-radius: 8px;
  background: rgba(0,0,0,0.8); border: 2px solid #ff3366; pointer-events: none;
}

.yuemu-screen-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  z-index: 100; color: #fff; text-align: center; backdrop-filter: blur(4px);
}
.yuemu-pixel-title { font-size: 24px; margin-bottom: 20px; color: #00f2ff; text-shadow: 3px 3px 0 #ff00ff; }
.yuemu-win-text { color: #34c759; text-shadow: 3px 3px 0 #005a1b; }

.yuemu-arcade-start-btn {
  background: #ff00ff; border: none; padding: 15px 30px; color: #fff;
  font-family: inherit; font-size: 14px; box-shadow: 0 6px 0 #8b008b; cursor: pointer;
  pointer-events: auto; border-radius: 8px; transition: transform 0.1s;
}
.yuemu-arcade-start-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 #8b008b; }

.yuemu-difficulty-select { margin-bottom: 30px; display: flex; gap: 15px; }
.yuemu-difficulty-select span {
  font-size: 14px; cursor: pointer; opacity: 0.5; padding: 8px 12px; pointer-events: auto;
  border: 1px solid transparent; border-radius: 4px;
}
.yuemu-difficulty-select span.yuemu-active { opacity: 1; color: #00f2ff; border-color: #00f2ff; background: rgba(0,242,255,0.1);}

.yuemu-trophy { font-size: 50px; margin-bottom: 20px; color: #ffd700; font-family: "Apple Color Emoji", "Segoe UI Emoji", sans-serif; }
.yuemu-stats-grid { margin-bottom: 30px; font-size: 12px; line-height: 2; color: #ccc;}
.yuemu-action-hints { font-size: 14px; display: flex; flex-direction: column; gap: 15px;}

.yuemu-control-panel { background: var(--card-background); border-top: 4px solid var(--border-color); padding: 15px; }
.yuemu-tools-row { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 15px; }
.yuemu-tool-button {
  flex: 1; background: var(--console-body); border: 2px solid var(--border-color);
  padding: 10px 0; border-radius: 8px; display: flex; flex-direction: column; align-items: center;
  position: relative; overflow: hidden; cursor: pointer; gap: 4px; color: var(--text-primary);
}
.yuemu-tool-button:disabled { opacity: 0.5; cursor: not-allowed; }
.yuemu-t-icon { font-size: 20px; font-family: "Apple Color Emoji", "Segoe UI Emoji", sans-serif; }
.yuemu-t-name { font-size: 12px; }
.yuemu-t-cd {
  position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(0,0,0,0.5);
  transition: height 0.3s linear; pointer-events: none;
}

.yuemu-sys-row { display: flex; justify-content: center; gap: 30px; }
.yuemu-round-btn { background: transparent; border: none; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; color: var(--text-secondary); font-size: 9px; }
.yuemu-btn-cap {
  width: 44px; height: 44px; background: var(--border-color); border-radius: 50%; color: var(--text-primary);
  display: flex; align-items: center; justify-content: center; font-size: 18px;
  box-shadow: 0 4px 0 var(--shadow-color); transition: all 0.1s;
  font-family: "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
}
.yuemu-round-btn:active .yuemu-btn-cap { transform: translateY(3px); box-shadow: 0 1px 0 var(--shadow-color); }

.yuemu-blink { animation: yuemu-blink 1s step-end infinite; }
@keyframes yuemu-blink { 50% { opacity: 0; } }
@keyframes yuemu-pulse { 50% { transform: scale(0.9); box-shadow: 0 0 20px #ffeb3b; } }

/* === PC端横向聚合布局 (右侧控制面板) === */
@media screen and (min-width: 769px) {
  .yuemu-arcade-console {
    max-width: 850px;
    height: 600px;
    display: grid;
    grid-template-columns: 1fr 200px;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      "header header"
      "screen panel";
  }
  .yuemu-marquee { grid-area: header; }
  .yuemu-screen-bezel { grid-area: screen; border: none; border-bottom: none; min-height: 500px; padding: 15px; }
  .yuemu-control-panel {
    grid-area: panel;
    border-top: none;
    border-left: 4px solid var(--border-color);
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .yuemu-tools-row { flex-direction: column; gap: 15px; margin-bottom: 20px; }
  .yuemu-diagnostic-trigger-bar { flex-direction: column; gap: 15px; margin-bottom: 20px; }
  .yuemu-sys-row { margin-top: auto; padding-top: 20px; border-top: 2px dashed var(--border-color); }
}

@media screen and (max-width: 768px) {
  .yuemu-version { display: none; }
  .yuemu-arcade-console { max-width: 100vw; height: 100dvh; border: none; border-radius: 0; position: relative; }
  .yuemu-screen-bezel { padding: 5px; flex: 1; min-height: 0; }
  
  /* 移动端控制面板：两排绝排版 */
  .yuemu-control-panel { padding: 10px; display: flex; flex-wrap: wrap; gap: 10px; }
  .yuemu-tools-row { flex: 0 0 100%; margin-bottom: 0; gap: 8px; }
  .yuemu-tool-button { padding: 8px 0; border-width: 1px; }
  .yuemu-diagnostic-trigger-bar { flex: 1; margin-bottom: 0; gap: 8px; width: auto; }
  .yuemu-mini-diag-btn { padding: 8px 0; border-width: 1px; flex: 1; font-size: 14px; }
  
  /* 将音频和重置移到右上角，脱离底部布局流 */
  .yuemu-sys-row { position: absolute; top: 24px; transform: translateY(-50%); right: 15px; flex: 0 0 auto; gap: 15px; margin: 0; padding: 0; border: none; z-index: 100; }
  .yuemu-sys-row .yuemu-round-btn span { display: none; }
  .yuemu-sys-row .yuemu-btn-cap { width: 30px; height: 30px; font-size: 14px; background: transparent; color: var(--text-primary); border: 2px solid var(--border-color); }
  .yuemu-sys-text { display: none; }
  
  .yuemu-btn-cap { width: 32px; height: 32px; font-size: 14px; }
  .yuemu-pixel-title { font-size: 18px; }
  
  /* 防止标题在移动端因为 right 元素隐藏而被挤到最右侧，并与右侧绝对定位的按钮重叠 */
  .yuemu-game-title { position: absolute; left: 50%; transform: translateX(-50%); }
}
.yuemu-diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
  margin-bottom: 15px;
}
.yuemu-mini-diag-btn {
  flex: 1;
  background: var(--console-body);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--shadow-color);
  transition: all 0.1s;
}
.yuemu-mini-diag-btn:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--shadow-color);
}
.yuemu-mini-diag-btn .yuemu-sys-icon { font-size: 12px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.yuemu-mini-diag-btn .yuemu-sys-text { font-size: 12px; color: var(--text-primary); font-weight: bold; }

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
  font-size: 14px;
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
  font-size: 12px;
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
  background: #111a14;
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
  background: rgba(0,0,0,0);
  background-size: 100% 3px, 6px 100%;
  z-index: 100;
  pointer-events: none;
}

.crt-flicker {
  position: absolute; inset: 0;
  background: rgba(18, 16, 16, 0.02);
  opacity: 0.05;
  z-index: 99;
  pointer-events: none;
  animation: crt-flicker-anim 0.15s infinite;
}
@keyframes crt-flicker-anim {
  0% { opacity: 0.05; }
  50% { opacity: 0.18; }
  100% { opacity: 0.05; }
}

.screen-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(circle, transparent 70%, rgba(0,0,0,0.4) 100%);
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
  font-size: 12px;
  color: #00FF41;
  font-weight: bold;
}

.retro-select {
  background: #111a14;
  border: 2px solid rgba(0, 255, 65, 0.6);
  border-radius: 4px;
  color: #00FF41;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  outline: none;
  cursor: pointer;
}

.retro-select option {
  background: #111a14;
  color: #00FF41;
  font-family: inherit;
}

.panel-header {
  display: grid;
  padding: 8px 6px;
  background: rgba(0, 255, 65, 0.08);
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
  font-size: 12px;
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
  font-size: 12px;
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
.time-val { color: rgba(0, 255, 65, 0.5); font-size: 11px; }

/* 提示状态 */
.loading-state, .empty-state {
  text-align: center;
  padding: 40px 10px;
  font-size: 12px;
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
  font-size: 11px;
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
  font-size: 11px;
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

/* Emojis in end overlay */
.yuemu-win-icon { color: #ffd700; font-size: 36px; animation: yuemu-pulse 1s infinite; }
.yuemu-lose-icon { color: #ff3366; font-size: 36px; }

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
