<template>
  <div class="yuemu-vintage-game-page" @contextmenu.prevent>
    <div class="yuemu-blueprint-chassis">
      <div class="yuemu-rivet yuemu-top-left"></div>
      <div class="yuemu-rivet yuemu-top-right"></div>
      <div class="yuemu-rivet yuemu-bottom-left"></div>
      <div class="yuemu-rivet yuemu-bottom-right"></div>



      <div class="yuemu-control-panel">
        <div class="yuemu-setting-group">
          <label>{{ t('pages.games.mazeRunnerPage.gridScale') }}</label>
          <div class="yuemu-size-display">{{ t('pages.games.mazeRunnerPage.mazeSector', { size: mazeSize }) }}</div>
        </div>
        <button class="yuemu-sound-toggle-btn" @click="toggleSound" :title="isSoundEnabled ? t('pages.games.mazeRunnerPage.disableSound') : t('pages.games.mazeRunnerPage.enableSound')">
          <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
        </button>
      </div>

      <div class="yuemu-action-btn-group">
        <button class="yuemu-mech-btn yuemu-auto-btn" @click="visualizeAutoSolve" :disabled="gameState !== 'playing'">
          {{ t('pages.games.mazeRunnerPage.aiDeepAnalysis') }}
        </button>
        <button class="yuemu-mech-btn" @click="restartLevel">
          {{ t('pages.games.mazeRunnerPage.resetFloorPlan') }}
        </button>
      </div>

      <!-- 极客诊断通道按钮 (防挤压街机控制，纯中文) -->
      <div class="yuemu-diagnostic-trigger-bar">
        <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
          <span class="yuemu-sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.mazeRunnerPage.leaderboardBracket') }}</span>
        </button>
        <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
          <span class="yuemu-sys-icon"><i class="fas fa-history"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.mazeRunnerPage.historyLogBracket') }}</span>
        </button>
      </div>

      <div class="yuemu-maze-screen-wrapper" @touchstart="handleTouchStart" @touchmove.prevent="handleTouchMove" @touchend="handleTouchEnd">
        <div class="yuemu-blueprint-grid"></div>
        <div class="yuemu-maze-container">
          <div
            class="yuemu-maze-board"
            :style="{
              gridTemplateColumns: `repeat(${mazeSize}, 1fr)`,
              gridTemplateRows: `repeat(${mazeSize}, 1fr)`
            }"
          >
            <div
              v-for="(cell, index) in mazeData"
              :key="index"
              class="yuemu-maze-cell"
              :class="{
                'yuemu-wall': cell === 1,
                'yuemu-path': cell === 0,
                'yuemu-start': isStart(index),
                'yuemu-end': isEnd(index),
                'yuemu-visited': visited.has(index) && cell === 0,
                'yuemu-bfs-explored': bfsExplored.has(index) && cell === 0,
                'yuemu-bfs-frontier': bfsFrontier.has(index) && cell === 0
              }"
            >
              <div class="yuemu-player-dot" v-if="playerPos === index"></div>
            </div>
          </div>
        </div>

        <div class="yuemu-board-overlay" v-if="gameState === 'victory'">
          <div class="yuemu-overlay-content">
            <h2 class="yuemu-text-success">{{ t('pages.games.mazeRunnerPage.escapeSuccessLevel', { level: currentLevel }) }}</h2>
            <p class="yuemu-desc-text">{{ t('pages.games.mazeRunnerPage.exitPathResolved') }}</p>
            <button class="yuemu-mech-btn yuemu-mt-4 yuemu-next-level-btn" @click="nextLevel">
              {{ t('pages.games.mazeRunnerPage.proceedToNextLevel', { level: currentLevel + 1 }) }}
            </button>
          </div>
        </div>
      </div>

      <div class="yuemu-dpad-container">
        <div class="yuemu-dpad-row">
          <button class="yuemu-dpad-btn" @click="move(0, -1)" :disabled="gameState !== 'playing'"><i class="fas fa-chevron-up"></i></button>
        </div>
        <div class="yuemu-dpad-row">
          <button class="yuemu-dpad-btn" @click="move(-1, 0)" :disabled="gameState !== 'playing'"><i class="fas fa-chevron-left"></i></button>
          <button class="yuemu-dpad-btn yuemu-center-btn" @click="showHint" :disabled="gameState !== 'playing'">?</button>
          <button class="yuemu-dpad-btn" @click="move(1, 0)" :disabled="gameState !== 'playing'"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="yuemu-dpad-row">
          <button class="yuemu-dpad-btn" @click="move(0, 1)" :disabled="gameState !== 'playing'"><i class="fas fa-chevron-down"></i></button>
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
          <span class="model-name terminal-title">{{ t('pages.games.mazeRunnerPage.monitorDiagnosticR09') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.mazeRunnerPage.rankBracket') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.mazeRunnerPage.historyBracket') }}
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
              <span class="filter-label">{{ t('pages.games.mazeRunnerPage.difficultyFilter') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.mazeRunnerPage.allLevels') }}</option>
                <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>

            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.mazeRunnerPage.ranking') }}</span>
              <span>{{ t('pages.games.mazeRunnerPage.matchTerminal') }}</span>
              <span>{{ t('pages.games.mazeRunnerPage.maxFloor') }}</span>
              <span>{{ t('pages.games.mazeRunnerPage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.mazeRunnerPage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.mazeRunnerPage.noEscapeRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.mazeRunnerPage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">Level {{ item.score }}</span>
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
                {{ t('pages.games.mazeRunnerPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.mazeRunnerPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.mazeRunnerPage.accessTime') }}</span>
              <span>{{ t('pages.games.mazeRunnerPage.escapeDifficulty') }}</span>
              <span>{{ t('pages.games.mazeRunnerPage.finalDepth') }}</span>
              <span>{{ t('pages.games.mazeRunnerPage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.mazeRunnerPage.readingPhysicsArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.mazeRunnerPage.noLocalEscapeLog') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.mazeRunnerPage.default') }}</span>
                <span class="score-val text-neon-green">Level {{ item.score }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.mazeRunnerPage.parseSuccess') : t('pages.games.mazeRunnerPage.notInitiated') }}
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
                {{ t('pages.games.mazeRunnerPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.mazeRunnerPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.mazeRunnerPage.closeDiagTerminal') }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLoginUserStore } from '@/stores/useLoginUserStore';
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController';

const router = useRouter();
const loginUserStore = useLoginUserStore();
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0);

// --- 排行榜 & 历史记录诊断微端状态 ---
const isTerminalOpen = ref(false);
const activeTab = ref<'ranking' | 'history'>('ranking');

const rankings = ref<any[]>([]);
const rankingLoading = ref(false);
const rankPage = ref(1);
const totalRankPages = ref(1);
const selectedRankLevel = ref('');
const levelOptions = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'];

const onRankLevelChange = () => {
  rankPage.value = 1;
  fetchRankings();
};

const historyRecords = ref<any[]>([]);
const historyLoading = ref(false);
const historyPage = ref(1);
const totalHistoryPages = ref(1);

const openTerminal = (tab: 'ranking' | 'history') => {
  activeTab.value = tab;
  isTerminalOpen.value = true;
  if (tab === 'ranking') {
    fetchRankings();
  } else {
    fetchHistory();
  }
};

const switchTab = (tab: 'ranking' | 'history') => {
  activeTab.value = tab;
  if (tab === 'ranking') {
    fetchRankings();
  } else {
    fetchHistory();
  }
};

const closeTerminal = () => {
  isTerminalOpen.value = false;
};

const fetchRankings = async () => {
  rankingLoading.value = true;
  try {
    const params: any = {
      gameType: 'maze_runner',
      current: rankPage.value,
      pageSize: 8
    };
    if (selectedRankLevel.value) {
      params.level = selectedRankLevel.value;
    }
    const res = await getRankingListUsingPost(params);
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || [];
      const total = res.data.data?.total || 0;
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1);
    }
  } catch (err) {
    console.error(t('pages.games.mazeRunnerPage.getRankingsError'), err);
  } finally {
    rankingLoading.value = false;
  }
};

const changeRankPage = (delta: number) => {
  const target = rankPage.value + delta;
  if (target >= 1 && target <= totalRankPages.value) {
    rankPage.value = target;
    fetchRankings();
  }
};

const fetchHistory = async () => {
  if (!currentUserId.value) return;
  historyLoading.value = true;
  try {
    const res = await getMyHistoryRecordsUsingPost({
      gameType: 'maze_runner',
      current: historyPage.value,
      pageSize: 8
    });
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || [];
      const total = res.data.data?.total || 0;
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1);
    }
  } catch (err) {
    console.error(t('pages.games.mazeRunnerPage.getHistoryArchiveError'), err);
  } finally {
    historyLoading.value = false;
  }
};

const changeHistoryPage = (delta: number) => {
  const target = historyPage.value + delta;
  if (target >= 1 && target <= totalHistoryPages.value) {
    historyPage.value = target;
    fetchHistory();
  }
};

const handleUserClick = (item: any) => {
  if (!item || !item.userId) return;
  router.push(`/user/${item.userId}`);
};

const saveScore = async (levelNum: number) => {
  if (levelNum < 1) return;
  if (!currentUserId.value) {
    console.warn(t('pages.games.mazeRunnerPage.notLoggedInSave'));
    return;
  }
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'maze_runner',
      level: 'Level ' + levelNum,
      score: levelNum
    });
    if (res.data?.code === 0) {
      fetchRankings();
      fetchHistory();
    }
  } catch (err) {
    console.error(t('pages.games.mazeRunnerPage.reportEscapeScoreError'), err);
  }
};

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.mazeRunnerPage.unknown');
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// --- 游戏核心状态 (逻辑保持不变) ---
type GameState = 'idle' | 'generating' | 'playing' | 'ai-thinking' | 'auto-playing' | 'victory';

const gameState = ref<GameState>('idle');
const currentLevel = ref(1);
const mazeSize = computed(() => Math.min(7 + currentLevel.value * 4, 35));
const mazeData = ref<number[]>([]);
const visited = ref<Set<number>>(new Set());
const bfsExplored = ref<Set<number>>(new Set());
const bfsFrontier = ref<Set<number>>(new Set());

const getIndex = (x: number, y: number) => y * mazeSize.value + x;
const getXY = (index: number) => ({ x: index % mazeSize.value, y: Math.floor(index / mazeSize.value) });

const startPos = computed(() => getIndex(1, 1));
const endPos = computed(() => getIndex(mazeSize.value - 2, mazeSize.value - 2));
const playerPos = ref(0);

let autoPlayTimer: number | null = null;

const isSoundEnabled = ref(true);
const createAudio = (src: string) => {
  try { return new Audio(new URL(src, import.meta.url).href); }
  catch (e) { return { play: () => Promise.resolve(), currentTime: 0, volume: 1 } as any; }
};

const sfx = {
  move: createAudio('@/assets/sounds/move.MP3'),
  wall: createAudio('@/assets/sounds/mismatch.MP3'),
  hint: createAudio('@/assets/sounds/select.MP3'),
  win: createAudio('@/assets/sounds/win.MP3'),
  start: createAudio('@/assets/sounds/start.MP3'),
  generate: createAudio('@/assets/sounds/rotate.MP3'),
  visited: createAudio('@/assets/sounds/drop.MP3'),
  levelUp: createAudio('@/assets/sounds/powerup.MP3'),
  radar: createAudio('@/assets/sounds/flip.MP3')
};

sfx.move.volume = 0.2; sfx.wall.volume = 0.3; sfx.hint.volume = 0.4; sfx.win.volume = 0.6;
sfx.start.volume = 0.5; sfx.generate.volume = 0.4; sfx.visited.volume = 0.15; sfx.levelUp.volume = 0.6; sfx.radar.volume = 0.1;

const playSound = (name: keyof typeof sfx) => {
  if (!isSoundEnabled.value) return;
  const sound = sfx[name];
  sound.currentTime = 0;
  sound.play().catch(() => {});
};

const toggleSound = () => isSoundEnabled.value = !isSoundEnabled.value;
const isStart = (index: number) => index === startPos.value;
const isEnd = (index: number) => index === endPos.value;

const statusText = computed(() => {
  if (gameState.value === 'generating') return t('pages.games.mazeRunnerPage.renderingBlueprint');
  if (gameState.value === 'playing') return t('pages.games.mazeRunnerPage.findWayToExit');
  if (gameState.value === 'ai-thinking') return t('pages.games.mazeRunnerPage.bfsSearching');
  if (gameState.value === 'auto-playing') return t('pages.games.mazeRunnerPage.aiTakingOver');
  if (gameState.value === 'victory') return t('pages.games.mazeRunnerPage.pathResolved');
  return t('pages.games.mazeRunnerPage.systemStandby');
});

const generateMaze = () => {
  gameState.value = 'generating';
  playSound('generate');
  const size = mazeSize.value;
  const grid = new Array(size * size).fill(1);
  for (let i = 0; i < size; i++) {
    grid[getIndex(i, 0)] = 1; grid[getIndex(i, size - 1)] = 1;
    grid[getIndex(0, i)] = 1; grid[getIndex(size - 1, i)] = 1;
  }
  const dirs = [{ dx: 0, dy: -2 }, { dx: 0, dy: 2 }, { dx: -2, dy: 0 }, { dx: 2, dy: 0 }];
  const carve = (x: number, y: number) => {
    grid[getIndex(x, y)] = 0;
    const shuffledDirs = [...dirs].sort(() => Math.random() - 0.5);
    for (const dir of shuffledDirs) {
      const nx = x + dir.dx; const ny = y + dir.dy;
      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[getIndex(nx, ny)] === 1) {
        grid[getIndex(x + dir.dx / 2, y + dir.dy / 2)] = 0;
        carve(nx, ny);
      }
    }
  };
  carve(1, 1);
  grid[endPos.value] = 0;
  mazeData.value = grid;
  playerPos.value = startPos.value;
  visited.value.clear(); bfsExplored.value.clear(); bfsFrontier.value.clear();
  visited.value.add(playerPos.value);
  gameState.value = 'playing';
};

const restartLevel = () => {
  if (autoPlayTimer) { clearInterval(autoPlayTimer); autoPlayTimer = null; }
  generateMaze();
  playSound('start');
};

const nextLevel = () => { currentLevel.value++; playSound('levelUp'); restartLevel(); };

const move = (dx: number, dy: number) => {
  if (gameState.value !== 'playing') return;
  const current = getXY(playerPos.value);
  const nx = current.x + dx; const ny = current.y + dy;
  if (nx >= 0 && nx < mazeSize.value && ny >= 0 && ny < mazeSize.value) {
    const nextIndex = getIndex(nx, ny);
    if (mazeData.value[nextIndex] === 0) {
      const wasVisited = visited.value.has(nextIndex);
      playerPos.value = nextIndex;
      visited.value.add(nextIndex);
      if (wasVisited) playSound('move'); else playSound('visited');
      if (playerPos.value === endPos.value) {
        gameState.value = 'victory';
        playSound('win');
        saveScore(currentLevel.value);
      }
    } else playSound('wall');
  } else playSound('wall');
};

const visualizeAutoSolve = () => {
  if (gameState.value !== 'playing') return;
  gameState.value = 'ai-thinking';
  bfsExplored.value.clear(); bfsFrontier.value.clear();
  playSound('generate');
  const queue = [playerPos.value];
  const parentMap = new Map<number, number>();
  const bfsVisited = new Set<number>([playerPos.value]);
  const nodesPerTick = Math.max(1, Math.floor(mazeSize.value / 3));

  autoPlayTimer = window.setInterval(() => {
    if (queue.length > 0 && Math.random() > 0.5) playSound('radar');
    for (let i = 0; i < nodesPerTick; i++) {
      if (queue.length === 0) { clearInterval(autoPlayTimer!); return; }
      const current = queue.shift()!;
      bfsFrontier.value.delete(current);
      bfsExplored.value.add(current);
      if (current === endPos.value) {
        clearInterval(autoPlayTimer!);
        const path = []; let curr = endPos.value;
        while (curr !== playerPos.value) { path.push(curr); curr = parentMap.get(curr)!; }
        path.reverse();
        setTimeout(() => executeFinalPath(path), 500);
        return;
      }
      const { x, y } = getXY(current);
      const dirs = [{dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}];
      for (const dir of dirs) {
        const nx = x + dir.dx; const ny = y + dir.dy;
        if (nx >= 0 && nx < mazeSize.value && ny >= 0 && ny < mazeSize.value) {
          const nextIndex = getIndex(nx, ny);
          if (mazeData.value[nextIndex] === 0 && !bfsVisited.has(nextIndex)) {
            bfsVisited.add(nextIndex); parentMap.set(nextIndex, current);
            queue.push(nextIndex); bfsFrontier.value.add(nextIndex);
          }
        }
      }
    }
  }, 30);
};

const executeFinalPath = (path: number[]) => {
  gameState.value = 'auto-playing'; playSound('hint');
  bfsExplored.value.clear(); bfsFrontier.value.clear();
  let step = 0;
  const speed = Math.max(30, 80 - currentLevel.value * 2);
  autoPlayTimer = window.setInterval(() => {
    if (step >= path.length) { clearInterval(autoPlayTimer!); gameState.value = 'victory'; playSound('win'); return; }
    const nextPos = path[step]; const wasVisited = visited.value.has(nextPos);
    playerPos.value = nextPos; visited.value.add(nextPos);
    if (wasVisited) playSound('move'); else playSound('visited');
    step++;
  }, speed);
};

const handleKeydown = (e: KeyboardEvent) => {
  if (gameState.value !== 'playing') return;
  if (['ArrowUp', 'w'].includes(e.key)) move(0, -1);
  if (['ArrowDown', 's'].includes(e.key)) move(0, 1);
  if (['ArrowLeft', 'a'].includes(e.key)) move(-1, 0);
  if (['ArrowRight', 'd'].includes(e.key)) move(1, 0);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
};

const showHint = () => {
  if (gameState.value !== 'playing') return;
  playSound('hint');
  const current = getXY(playerPos.value);
  const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
  for (const dir of dirs) {
    const nx = current.x + dir.dx; const ny = current.y + dir.dy; const nIdx = getIndex(nx, ny);
    if (mazeData.value[nIdx] === 0 && !visited.value.has(nIdx)) {
      const cell = document.querySelector(`.yuemu-maze-cell:nth-child(${nIdx + 1})`);
      if (cell) { cell.classList.add('yuemu-hint-flash'); setTimeout(() => cell.classList.remove('yuemu-hint-flash'), 500); }
      break;
    }
  }
};

onMounted(() => { restartLevel(); window.addEventListener('keydown', handleKeydown, { passive: false }); });
onUnmounted(() => { if (autoPlayTimer) clearInterval(autoPlayTimer); window.removeEventListener('keydown', handleKeydown); });
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
};

const handleTouchMove = (e: TouchEvent) => {
  // 仅在Vue模板层阻止了默认事件(@touchmove.prevent)
};

const handleTouchEnd = (e: TouchEvent) => {
  if (gameState.value !== 'playing' || e.changedTouches.length === 0) return;
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  
  if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) move(1, 0);
      else move(-1, 0);
    } else {
      if (dy > 0) move(0, 1);
      else move(0, -1);
    }
  }
};
</script>

<style scoped>
.yuemu-vintage-game-page {
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: var(--theme-transition);
}

.yuemu-blueprint-chassis {
  position: relative;
  width: 100%;
  max-width: 500px;
  background: var(--card-background);
  border: 4px solid var(--text-primary);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 8px 8px 0px var(--shadow-color), inset 0 0 0 2px var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.yuemu-rivet {
  position: absolute; width: 10px; height: 10px;
  background: var(--text-primary); border-radius: 50%;
  box-shadow: inset 2px 2px 0 rgba(255,255,255,0.3);
}
.yuemu-top-left { top: 10px; left: 10px; }
.yuemu-top-right { top: 10px; right: 10px; }
.yuemu-bottom-left { bottom: 10px; left: 10px; }
.yuemu-bottom-right { bottom: 10px; right: 10px; }

.yuemu-brand-plate {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  border-bottom: 2px dashed var(--border-color); padding-bottom: 15px; margin-top: 5px;
}

.yuemu-model-name {
  font-family: 'SimHei', sans-serif; font-size: 1.5rem; font-weight: 900;
  letter-spacing: 4px; color: var(--text-primary);
}

.yuemu-status-indicator {
  font-family: 'Space Mono', 'SimHei', monospace;
  font-weight: bold; font-size: 0.8rem; color: #3b82f6;
}

.yuemu-maze-screen-wrapper {
  position: relative; width: 100%; aspect-ratio: 1 / 1;
  background-color: #1e3a5f; border: 4px solid var(--text-primary);
  box-sizing: border-box; overflow: hidden;
}

.yuemu-blueprint-grid {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px; pointer-events: none;
}

.yuemu-maze-container {
  position: absolute; top: 5%; left: 5%; width: 90%; height: 90%;
  display: flex; justify-content: center; align-items: center;
}

.yuemu-maze-board { width: 100%; height: 100%; display: grid; }
.yuemu-maze-cell { position: relative; display: flex; align-items: center; justify-content: center; }

.yuemu-wall {
  background-color: #1e3a5f; border: 1px solid rgba(255,255,255,0.8);
  background-image: repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255, 255, 255, 0.2) 3px, rgba(255, 255, 255, 0.2) 6px);
  z-index: 2;
}

.yuemu-path { background-color: #2c4b75; }
.yuemu-bfs-explored { background-color: rgba(59, 130, 246, 0.3); transition: background-color 0.1s; }
.yuemu-bfs-frontier { background-color: #00ffcc !important; box-shadow: 0 0 10px #00ffcc; z-index: 5; }
.yuemu-visited { background-color: #3b608f; }

.yuemu-start {
  background-color: rgba(74, 222, 128, 0.2) !important;
  box-shadow: inset 0 0 10px rgba(74, 222, 128, 0.4);
}
.yuemu-start::after {
  content: ''; position: absolute; width: 40%; height: 40%; 
  background: #4ade80; border-radius: 50%; opacity: 0.5;
}

.yuemu-end {
  background-color: rgba(248, 113, 113, 0.2) !important;
  animation: yuemu-portal-pulse 1s infinite alternate;
}
.yuemu-end::after {
  content: ''; position: absolute; width: 50%; height: 50%; 
  background: #f87171; transform: rotate(45deg); 
  box-shadow: 0 0 10px #f87171;
}

@keyframes yuemu-portal-pulse {
  0% { box-shadow: inset 0 0 5px rgba(248, 113, 113, 0.4); }
  100% { box-shadow: inset 0 0 25px rgba(248, 113, 113, 1); }
}

.yuemu-player-dot {
  position: absolute; width: 85%; height: 85%;
  background: radial-gradient(circle at 30% 30%, #fde047, #eab308);
  border-radius: 50%;
  box-shadow: 0 0 12px #eab308, inset -2px -2px 4px rgba(0,0,0,0.2);
  z-index: 10; transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.yuemu-hint-flash) { animation: yuemu-flash-bg 0.5s; }
@keyframes yuemu-flash-bg { 0%, 100% { background-color: #2c4b75; } 50% { background-color: #fbbf24; } }

.yuemu-board-overlay {
  position: absolute; inset: 0; background: rgba(30, 58, 95, 0.9);
  backdrop-filter: blur(2px); display: flex; justify-content: center; align-items: center; z-index: 20;
}
.yuemu-overlay-content {
  text-align: center; background: var(--card-background);
  padding: 20px; border: 4px solid var(--text-primary);
  box-shadow: 6px 6px 0px var(--shadow-color);
}
.yuemu-text-success { color: #10b981; font-family: 'SimHei', monospace; margin-bottom: 10px;}
.yuemu-desc-text { color: var(--text-secondary); font-size: 0.9rem;}

.yuemu-control-panel {
  display: flex; justify-content: space-between; align-items: flex-end;
  border-top: 2px dashed var(--border-color); padding-top: 15px; gap: 10px;
}

.yuemu-setting-group { display: flex; flex-direction: column; gap: 5px; flex: 1; }
.yuemu-setting-group label { font-family: 'SimHei', sans-serif; font-weight: bold; font-size: 0.85rem; color: var(--text-secondary); }
.yuemu-size-display { font-family: 'Space Mono', monospace; font-size: 1.1rem; font-weight: bold; color: var(--text-primary); }

.yuemu-sound-toggle-btn {
  padding: 10px 14px; background: var(--console-body); color: var(--text-primary);
  border: 3px solid var(--text-primary); font-size: 1.3rem; cursor: pointer;
  border-radius: 6px; box-shadow: 4px 4px 0px var(--shadow-color);
  display: flex; align-items: center; justify-content: center;
}

.yuemu-action-btn-group { display: flex; gap: 10px; }
.yuemu-mech-btn {
  flex: 1; padding: 10px 18px; background: var(--console-body);
  color: var(--text-primary); border: 3px solid var(--text-primary);
  font-family: 'SimHei', sans-serif; font-weight: 900; font-size: 0.95rem;
  cursor: pointer; border-radius: 6px; box-shadow: 4px 4px 0px var(--shadow-color);
}
.yuemu-mech-btn:active:not(:disabled) { transform: translate(4px, 4px); box-shadow: 0px 0px 0px var(--shadow-color); }
.yuemu-mech-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.yuemu-auto-btn { background: #e0f2fe; border-color: #0284c7; color: #0284c7; }
.yuemu-next-level-btn { background: #10b981; border-color: #047857; color: white; width: 100%; }

.yuemu-mt-4 { margin-top: 1rem; }

.yuemu-dpad-container { display: flex; flex-direction: column; align-items: center; gap: 5px; margin-top: 5px; }
.yuemu-dpad-row { display: flex; gap: 5px; }
.yuemu-dpad-btn {
  width: 50px; height: 50px; background: var(--console-body);
  color: var(--text-primary); border: 3px solid var(--text-primary);
  font-size: 1.3rem; font-weight: bold; display: flex; align-items: center;
  justify-content: center; cursor: pointer; border-radius: 8px;
  box-shadow: 0 5px 0px var(--shadow-color);
}
.yuemu-dpad-btn:active:not(:disabled) { transform: translateY(5px); box-shadow: 0 0px 0px var(--shadow-color); }
.yuemu-center-btn { font-family: 'Space Mono', monospace; color: #3b82f6; }

@media (max-width: 400px) {
  .yuemu-blueprint-chassis { padding: 15px 10px; border-radius: 12px; }
  .yuemu-dpad-btn { width: 45px; height: 45px; }
}
.yuemu-diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
}
.yuemu-mini-diag-btn {
  flex: 1;
  background: var(--console-body);
  border: 3px solid var(--text-primary);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 4px 4px 0px var(--shadow-color);
  transition: all 0.1s;
}
.yuemu-mini-diag-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--shadow-color);
}
.yuemu-mini-diag-btn .yuemu-sys-icon { font-size: 12px; color: var(--text-main); display: flex; align-items: center; justify-content: center; }
.yuemu-mini-diag-btn .yuemu-sys-text { font-size: 8px; color: var(--text-primary); font-weight: bold; font-family: 'SimHei', sans-serif; }

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

/* Emojis in end overlay */
.yuemu-win-icon { color: #ffd700; font-size: 36px; }
.yuemu-lose-icon { color: #ff3366; font-size: 36px; }

/* ================= 字体覆盖修复与移动端适配 ================= */
.terminal-title, .tab-btn, .filter-label, .retro-select, .panel-header, .data-row, .loading-state, .empty-state, .paging-btn, .page-indicator, .close-btn { font-size: 12px !important; }
.time-val { font-size: 11px !important; }
@media (max-width: 768px) {
  .yuemu-vintage-game-page { height: 100vh; padding: 10px; overflow: hidden; }
  .yuemu-blueprint-chassis { height: 100%; padding: 10px; gap: 10px; }
  .yuemu-maze-screen-wrapper { flex: 1; min-height: 0; max-height: 100%; margin: 0 auto; }
  .yuemu-dpad-container { display: none !important; }
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


@media (min-width: 769px) {
  .yuemu-blueprint-chassis { max-width: 900px; height: 90vh; max-height: 800px; display: grid; grid-template-columns: 1fr 280px; grid-template-rows: auto auto 1fr auto; padding: 30px; gap: 30px; align-items: stretch; }
  .yuemu-brand-plate { display: none; }
  .yuemu-maze-screen-wrapper { grid-column: 1 / 2; grid-row: 1 / 5; width: 100%; height: 100%; container-type: size; position: relative; background: transparent !important; border: none !important; margin: 0; padding: 0; box-sizing: border-box; }
  .yuemu-maze-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100cqmin !important; height: 100cqmin !important; max-width: none; max-height: none; aspect-ratio: unset; background-color: #1e3a5f; border: 4px solid var(--text-primary); box-sizing: border-box; overflow: hidden; }
  .yuemu-control-panel { grid-column: 2 / 3; grid-row: 1 / 2; flex-direction: column; align-items: stretch; border-top: none; padding-top: 0; padding-bottom: 0; }
  .yuemu-action-btn-group { grid-column: 2 / 3; grid-row: 2 / 3; flex-direction: column; gap: 15px; border-bottom: 2px dashed var(--border-color); padding-bottom: 20px; }
  .yuemu-dpad-container { grid-column: 2 / 3; grid-row: 3 / 4; justify-content: center; margin-top: auto; margin-bottom: auto; }
  .yuemu-diagnostic-trigger-bar { grid-column: 2 / 3; grid-row: 4 / 5; flex-direction: column; justify-content: flex-end; }
}
</style>
