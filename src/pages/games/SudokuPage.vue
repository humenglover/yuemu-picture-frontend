<template>
  <div class="yuemu-vintage-game-page">
    <div class="typewriter-chassis">
      <div class="screw top-left"></div>
      <div class="screw top-right"></div>
      <div class="screw bottom-left"></div>
      <div class="screw bottom-right"></div>

      <div class="archive-header">
        <div class="stamp-confidential">{{ t('pages.games.sudokuPage.logicTestArchive') }}</div>
        <!-- <h1 class="game-title">{{ t('pages.games.sudokuPage.sudokuTerminalSequence') }}</h1> -->

        <div class="status-bar">
          <div class="status-item">
            <span>{{ t('pages.games.sudokuPage.difficultyLabel') }}</span>
            <select v-model="currentDifficulty" @change="startNewGame(); playSound('modeChange')" class="retro-select">
              <option value="easy">{{ t('pages.games.sudokuPage.beginnerAnalysis') }}</option>
              <option value="medium">{{ t('pages.games.sudokuPage.intermediateDeduction') }}</option>
              <option value="hard">{{ t('pages.games.sudokuPage.advancedDecryption') }}</option>
              <option value="expert">{{ t('pages.games.sudokuPage.expertHack') }}</option>
            </select>
          </div>
          <div class="status-item">
            <button class="sound-toggle-btn" @click="toggleSound" :title="isSoundEnabled ? t('pages.games.sudokuPage.turnOffSound') : t('pages.games.sudokuPage.turnOnSound')">
              <i class="fas" :class="isSoundEnabled ? 'fa-volume-up' : 'fa-volume-mute'"></i>
            </button>
          </div>
          <div class="status-item">
            <span>{{ t('pages.games.sudokuPage.errorLabel') }}</span>
            <span class="error-count" :class="{ 'danger': mistakes > 2 }">{{ mistakes }} / 3</span>
          </div>
        </div>
      </div>

      <div class="sudoku-board-wrapper" :class="{ 'shake-error': shakeBoard }">
        <div class="sudoku-board">
          <div
            v-for="(row, rIndex) in grid"
            :key="`r-${rIndex}`"
            class="sudoku-row"
          >
            <div
              v-for="(cell, cIndex) in row"
              :key="`c-${cIndex}`"
              class="sudoku-cell"
              :class="{
                'thick-right': cIndex === 2 || cIndex === 5,
                'thick-bottom': rIndex === 2 || rIndex === 5,
                'selected': selectedCell.r === rIndex && selectedCell.c === cIndex,
                'related': isRelated(rIndex, cIndex),
                'same-number': isSameNumber(rIndex, cIndex),
                'fixed-number': initialGrid[rIndex][cIndex] !== 0,
                'error-number': grid[rIndex][cIndex] !== 0 && grid[rIndex][cIndex] !== solution[rIndex][cIndex]
              }"
              @click="selectCell(rIndex, cIndex)"
            >
              {{ cell !== 0 ? cell : '' }}
            </div>
          </div>
        </div>

        <div class="board-overlay" v-if="gameState !== 'playing'">
          <div class="overlay-content">
            <h2 :class="gameState === 'victory' ? 'text-success' : 'text-danger'">
              {{ gameState === 'victory' ? t('pages.games.sudokuPage.sequenceCracked') : t('pages.games.sudokuPage.logicConflictLocked') }}
            </h2>
            <button class="mech-btn mt-4" @click="startNewGame">
              {{ gameState === 'victory' ? t('pages.games.sudokuPage.loadNewSequence') : t('pages.games.sudokuPage.resetCurrentSequence') }}
            </button>
          </div>
        </div>
      </div>

      <div class="numpad-container">
        <div class="numpad-grid">
          <button
            v-for="n in 9"
            :key="n"
            class="mech-key"
            @click="inputNumber(n)"
          >
            {{ n }}
          </button>
          <button class="mech-key action-key" @click="inputNumber(0)">
            {{ t('pages.games.sudokuPage.erase') }}
          </button>
        </div>
      </div>

      <!-- 极客诊断通道按钮 (防挤压街机控制，纯中文) -->
      <div class="yuemu-diagnostic-trigger-bar">
        <button class="yuemu-mini-diag-btn" @click="openTerminal('ranking')">
          <span class="yuemu-sys-icon"><i class="fas fa-trophy"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.sudokuPage.leaderboardBracket') }}</span>
        </button>
        <button class="yuemu-mini-diag-btn" @click="openTerminal('history')">
          <span class="yuemu-sys-icon"><i class="fas fa-history"></i></span>
          <span class="yuemu-sys-text">{{ t('pages.games.sudokuPage.historyLogBracket') }}</span>
        </button>
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
          <span class="model-name terminal-title">{{ t('pages.games.sudokuPage.monitorDiagnosticS89') }}</span>
          <div class="tab-buttons">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'ranking' }"
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.sudokuPage.rankBracket') }}
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'history' }"
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.sudokuPage.historyBracket') }}
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
              <span class="filter-label">{{ t('pages.games.sudokuPage.filterDifficulty') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.sudokuPage.allDifficulty') }}</option>
                <option :value="t('pages.games.sudokuPage.beginner')">{{ t('pages.games.sudokuPage.beginnerAnalysis') }}</option>
                <option :value="t('pages.games.sudokuPage.intermediate')">{{ t('pages.games.sudokuPage.intermediateDeduction') }}</option>
                <option :value="t('pages.games.sudokuPage.advanced')">{{ t('pages.games.sudokuPage.advancedDecryption') }}</option>
                <option :value="t('pages.games.sudokuPage.expertLevel')">{{ t('pages.games.sudokuPage.expertHack') }}</option>
              </select>
            </div>

            <div class="panel-header ranking-layout-header">
              <span>{{ t('pages.games.sudokuPage.ranking') }}</span>
              <span>{{ t('pages.games.sudokuPage.matchTerminal') }}</span>
              <span>{{ t('pages.games.sudokuPage.difficulty') }}</span>
              <span>{{ t('pages.games.sudokuPage.score') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.sudokuPage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.sudokuPage.noFlightLog') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.sudokuPage.anonymousTerminal') }}</span>
                </span>
                <span class="level-val">{{ item.level || t('pages.games.sudokuPage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.sudokuPage.scorePoints', { score: item.score }) }}</span>
              </div>
            </div>

            <!-- 排行榜分页器 -->
            <div class="pagination-footer">
              <button
                class="paging-btn"
                :disabled="rankPage <= 1"
                @click="changeRankPage(-1)"
              >
                {{ t('pages.games.sudokuPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button
                class="paging-btn"
                :disabled="rankPage >= totalRankPages"
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.sudokuPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.sudokuPage.accessTime') }}</span>
              <span>{{ t('pages.games.sudokuPage.testLevel') }}</span>
              <span>{{ t('pages.games.sudokuPage.finalScore') }}</span>
              <span>{{ t('pages.games.sudokuPage.status') }}</span>
            </div>

            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.sudokuPage.readingPhysicsArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.sudokuPage.noBattleLog') }}
              </div>
              <div
                v-else
                v-for="item in historyRecords"
                :key="item.id"
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.sudokuPage.default') }}</span>
                <span class="score-val text-neon-green">{{ t('pages.games.sudokuPage.scorePoints', { score: item.score }) }}</span>
                <span class="status-val success">{{ t('pages.games.sudokuPage.success') }}</span>
              </div>
            </div>

            <!-- 历史记录分页器 -->
            <div class="pagination-footer">
              <button
                class="paging-btn"
                :disabled="historyPage <= 1"
                @click="changeHistoryPage(-1)"
              >
                {{ t('pages.games.sudokuPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button
                class="paging-btn"
                :disabled="historyPage >= totalHistoryPages"
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.sudokuPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.sudokuPage.closeDiagTerminal') }}
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

// --- 类型与状态定义 ---
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
type GameState = 'playing' | 'victory' | 'gameover';

const currentDifficulty = ref<Difficulty>('easy');
const gameState = ref<GameState>('playing');
const mistakes = ref(0);
const shakeBoard = ref(false);
const isSoundEnabled = ref(true);

// 盘面数据：9x9 二维数组
const grid = ref<number[][]>([]);
const initialGrid = ref<number[][]>([]);
const solution = ref<number[][]>([]);

// 选中的单元格
const selectedCell = ref({ r: -1, c: -1 });

// --- 排行榜 & 历史记录诊断微端状态 ---
const isTerminalOpen = ref(false);
const activeTab = ref<'ranking' | 'history'>('ranking');

const rankings = ref<any[]>([]);
const rankingLoading = ref(false);
const rankPage = ref(1);
const totalRankPages = ref(1);
const selectedRankLevel = ref('');

const levelMapping: Record<Difficulty, string> = {
  easy: t('pages.games.sudokuPage.beginner'),
  medium: t('pages.games.sudokuPage.intermediate'),
  hard: t('pages.games.sudokuPage.advanced'),
  expert: t('pages.games.sudokuPage.expertLevel')
};

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
      gameType: 'sudoku',
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
    console.error(t('pages.games.sudokuPage.getSudokuRankError'), err);
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
      gameType: 'sudoku',
      current: historyPage.value,
      pageSize: 8
    });
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || [];
      const total = res.data.data?.total || 0;
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1);
    }
  } catch (err) {
    console.error(t('pages.games.sudokuPage.getSudokuHistoryError'), err);
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
  router.push({ name: 'UserDetail', params: { id: item.userId } });
};

const getBaseScore = (diff: Difficulty) => {
  switch (diff) {
    case 'easy': return 1000;
    case 'medium': return 2000;
    case 'hard': return 3500;
    case 'expert': return 5000;
  }
};

const saveScore = async () => {
  if (!currentUserId.value) {
    console.warn(t('pages.games.sudokuPage.notLoggedInSave'));
    return;
  }
  const base = getBaseScore(currentDifficulty.value);
  const finalScore = Math.max(100, base - mistakes.value * 200);

  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'sudoku',
      level: levelMapping[currentDifficulty.value],
      score: finalScore
    });
    if (res.data?.code === 0) {
      fetchRankings();
      fetchHistory();
    }
  } catch (err) {
    console.error(t('pages.games.sudokuPage.reportSudokuScoreError'), err);
  }
};

const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.sudokuPage.unknown');
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// --- 音效系统 ---
const sounds = {
  select: new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href),
  input: new Audio(new URL('@/assets/sounds/drop.MP3', import.meta.url).href),
  correct: new Audio(new URL('@/assets/sounds/coin.MP3', import.meta.url).href),
  error: new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href),
  erase: new Audio(new URL('@/assets/sounds/flip.MP3', import.meta.url).href),
  win: new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href),
  gameover: new Audio(new URL('@/assets/sounds/gameover.MP3', import.meta.url).href),
  start: new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href),
  modeChange: new Audio(new URL('@/assets/sounds/rotate.MP3', import.meta.url).href),
  click: new Audio(new URL('@/assets/sounds/move.MP3', import.meta.url).href)
}

// 设置音量
sounds.select.volume = 0.3
sounds.input.volume = 0.4
sounds.correct.volume = 0.5
sounds.error.volume = 0.6
sounds.erase.volume = 0.3
sounds.win.volume = 0.6
sounds.gameover.volume = 0.6
sounds.start.volume = 0.5
sounds.modeChange.volume = 0.4
sounds.click.volume = 0.2

const playSound = (type: keyof typeof sounds) => {
  if (!isSoundEnabled.value) return
  const audio = sounds[type]
  audio.currentTime = 0
  audio.play().catch(() => {})
}

const toggleSound = () => {
  isSoundEnabled.value = !isSoundEnabled.value
  if (isSoundEnabled.value) {
    playSound('click')
  }
}

// --- 难度映射 (挖空数量) ---
const difficultyHoles: Record<Difficulty, number> = {
  easy: 30,
  medium: 40,
  hard: 50,
  expert: 60
};

// --- 数独核心生成算法 ---

// 校验数字是否可填入
const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }
  return true;
};

// 回溯法求解数独
const solveSudoku = (board: number[][]): boolean => {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        for (let n = 1; n <= 9; n++) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solveSudoku(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

// 生成全新数独盘面
const generatePuzzle = (holes: number) => {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  // 1. 随机填充对角线上的 3x3 宫格 (它们相互独立，可直接填)
  for (let i = 0; i < 9; i += 3) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        board[i + r][i + c] = nums[idx++];
      }
    }
  }

  // 2. 求解剩余空格得到完整答案
  const solved = solveSudoku(board);
  if (!solved) {
    // 兜底重试，确保绝对不会产生死锁或无效终盘
    generatePuzzle(holes);
    return;
  }

  solution.value = JSON.parse(JSON.stringify(board)); // 保存完整答案

  // 3. 随机挖空
  let count = holes;
  while (count > 0) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (board[r][c] !== 0) {
      board[r][c] = 0;
      count--;
    }
  }

  grid.value = JSON.parse(JSON.stringify(board));
  initialGrid.value = JSON.parse(JSON.stringify(board));
};

// --- 游戏交互逻辑 ---

const startNewGame = () => {
  mistakes.value = 0;
  gameState.value = 'playing';
  selectedCell.value = { r: -1, c: -1 };
  generatePuzzle(difficultyHoles[currentDifficulty.value]);
  playSound('start');
};

const selectCell = (r: number, c: number) => {
  if (gameState.value !== 'playing') return;
  selectedCell.value = { r, c };
  playSound('select');
};

// 样式辅助判定
const isRelated = (r: number, c: number) => {
  if (selectedCell.value.r === -1) return false;
  // 同行、同列、同宫格高亮
  const sameRow = r === selectedCell.value.r;
  const sameCol = c === selectedCell.value.c;
  const sameBox = Math.floor(r / 3) === Math.floor(selectedCell.value.r / 3) &&
    Math.floor(c / 3) === Math.floor(selectedCell.value.c / 3);
  return (sameRow || sameCol || sameBox) && !(sameRow && sameCol);
};

const isSameNumber = (r: number, c: number) => {
  if (selectedCell.value.r === -1 || grid.value[r][c] === 0) return false;
  const targetVal = grid.value[selectedCell.value.r][selectedCell.value.c];
  return targetVal !== 0 && targetVal === grid.value[r][c];
};

const checkWin = () => {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid.value[r][c] !== solution.value[r][c]) return;
    }
  }
  gameState.value = 'victory';
  setTimeout(() => playSound('win'), 200);
  saveScore();
};

const triggerShake = () => {
  shakeBoard.value = true;
  setTimeout(() => { shakeBoard.value = false; }, 400);
};

const inputNumber = (num: number) => {
  if (gameState.value !== 'playing') return;
  const { r, c } = selectedCell.value;
  if (r === -1 || c === -1) return;
  if (initialGrid.value[r][c] !== 0) return; // 固定数字不可改

  // UX 逻辑纠正：如果新填入的数字与当前已填写的相同，直接忽略，避免重复累加错误
  if (grid.value[r][c] === num) return;

  if (num === 0) {
    grid.value[r][c] = 0;
    playSound('erase');
    return;
  }

  // 填入数字
  grid.value[r][c] = num;
  playSound('input');

  // 检查对错
  if (num !== solution.value[r][c]) {
    mistakes.value++;
    triggerShake();
    setTimeout(() => playSound('error'), 100);
    if (mistakes.value >= 3) {
      gameState.value = 'gameover';
      setTimeout(() => playSound('gameover'), 300);
    }
  } else {
    setTimeout(() => playSound('correct'), 100);
    checkWin();
  }
};

// --- 物理键盘支持 ---
const handleKeydown = (e: KeyboardEvent) => {
  if (gameState.value !== 'playing') return;

  // 数字键 1-9
  if (e.key >= '1' && e.key <= '9') {
    inputNumber(parseInt(e.key));
  }
  // 删除/退格
  else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    inputNumber(0);
  }
  // 方向键移动
  else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    let { r, c } = selectedCell.value;
    if (r === -1) { r = 0; c = 0; }
    else {
      if (e.key === 'ArrowUp') r = (r - 1 + 9) % 9;
      if (e.key === 'ArrowDown') r = (r + 1) % 9;
      if (e.key === 'ArrowLeft') c = (c - 1 + 9) % 9;
      if (e.key === 'ArrowRight') c = (c + 1) % 9;
    }
    selectedCell.value = { r, c };
  }
};

onMounted(() => {
  startNewGame();
  window.addEventListener('keydown', handleKeydown);

  // 预热拉取诊断数据，实现瞬时数据渲染
  fetchRankings();
  fetchHistory();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* 引入复古打字机字体 */
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

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

/* 打字机档案外壳 */
.typewriter-chassis {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: var(--card-background);
  border: 4px solid var(--text-primary);
  border-radius: 8px;
  padding: 20px 15px;
  box-shadow:
    8px 8px 0px var(--shadow-color),
    inset 0 0 0 2px var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 15px;
  /* 添加轻微复古纸张纹理感 */
  background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 四角螺丝 */
.screw {
  position: absolute; width: 12px; height: 12px;
  background: var(--border-color); border: 2px solid var(--text-primary); border-radius: 50%;
}
.screw::after {
  content: ''; position: absolute; top: 50%; left: 2px; right: 2px; height: 2px;
  background: var(--text-primary); transform: translateY(-50%) rotate(45deg);
}
.top-left { top: 8px; left: 8px; }
.top-right { top: 8px; right: 8px; }
.bottom-left { bottom: 8px; left: 8px; }
.bottom-right { bottom: 8px; right: 8px; }

/* 头部信息 */
.archive-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border-bottom: 2px dashed var(--border-color);
  padding-bottom: 15px;
  margin-top: 10px;
}

.stamp-confidential {
  position: absolute;
  top: -10px;
  left: 0px;
  font-family: 'SimHei', monospace;
  font-weight: 900;
  font-size: 0.9rem;
  color: #d32f2f;
  border: 2px solid #d32f2f;
  padding: 2px 8px;
  transform: rotate(-10deg);
  opacity: 0.8;
  letter-spacing: 2px;
  pointer-events: none;
}

.game-title {
  font-family: 'SimHei', sans-serif;
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: 4px;
  margin: 0;
  color: var(--text-primary);
}

.status-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Space Mono', 'SimHei', monospace;
  font-weight: bold;
  font-size: 0.95rem;
}

.sound-toggle-btn {
  background: var(--card-background);
  border: 2px solid var(--text-primary);
  color: var(--text-primary);
  font-size: 1.2rem;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 2px 2px 0px var(--border-color);
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.sound-toggle-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0px 0px 0px var(--border-color);
}

.retro-select {
  background: var(--background);
  border: 2px solid var(--text-primary);
  color: var(--text-primary);
  font-family: inherit;
  font-weight: bold;
  padding: 2px 5px;
  outline: none;
  cursor: pointer;
  box-shadow: 2px 2px 0px var(--border-color);
}

.error-count {
  font-family: 'Space Mono', monospace;
  padding-left: 5px;
}
.error-count.danger {
  color: #d32f2f;
  animation: pulse-text 1s infinite;
}
@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ================= 数独盘面 ================= */
.sudoku-board-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
}

.sudoku-board {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 4px solid var(--text-primary);
  background-color: var(--card-background);
  box-sizing: border-box;
}

.sudoku-row {
  display: flex;
  flex: 1;
}

.sudoku-cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px dashed var(--border-color);
  border-bottom: 1px dashed var(--border-color);
  font-family: 'Courier Prime', 'Space Mono', monospace;
  font-size: clamp(1.2rem, 5vw, 1.8rem);
  font-weight: 700;
  color: #1d4ed8; /* 玩家填入数字使用墨水蓝 */
  cursor: pointer;
  transition: background-color 0.1s;
  user-select: none;
}

.sudoku-cell:last-child { border-right: none; }
.sudoku-row:last-child .sudoku-cell { border-bottom: none; }

/* 3x3 粗边框分隔 */
.thick-right { border-right: 3px solid var(--text-primary) !important; }
.thick-bottom { border-bottom: 3px solid var(--text-primary) !important; }

/* 单元格状态高亮 */
.fixed-number {
  color: var(--text-primary); /* 固定数字使用主色调(黑色) */
  font-weight: 900;
}
.error-number {
  color: #d32f2f; /* 错误红 */
  text-shadow: 0 0 5px rgba(211, 47, 47, 0.3);
}

/* 交互高亮 */
.related {
  background-color: var(--hover-background);
}
.same-number {
  background-color: rgba(59, 130, 246, 0.15); /* 浅蓝色关联提示 */
}
.selected {
  background-color: rgba(251, 191, 36, 0.3) !important; /* 选中黄 */
  box-shadow: inset 0 0 0 2px var(--text-primary);
}

/* 震动特效 */
.shake-error { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(3px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-5px, 0, 0); }
  40%, 60% { transform: translate3d(5px, 0, 0); }
}

/* 游戏结束遮罩 */
.board-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(var(--card-background), 0.9);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}
.overlay-content {
  text-align: center;
  background: var(--card-background);
  padding: 20px;
  border: 4px solid var(--text-primary);
  box-shadow: 8px 8px 0px var(--shadow-color);
}
.text-danger { color: #d32f2f; font-family: 'SimHei', monospace; margin-bottom: 15px;}
.text-success { color: #10b981; font-family: 'SimHei', monospace; margin-bottom: 15px;}

/* ================= 底部机械小键盘 ================= */
.numpad-container {
  margin-top: 5px;
}

.numpad-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

/* 机械按钮 */
.mech-key {
  aspect-ratio: 1 / 1;
  background: var(--card-background);
  color: var(--text-primary);
  border: 2px solid var(--text-primary);
  font-family: 'Courier Prime', 'Space Mono', monospace;
  font-weight: 900;
  font-size: 1.2rem;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 3px 3px 0px var(--text-primary);
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mech-key:active {
  transform: translate(3px, 3px);
  box-shadow: 0px 0px 0px var(--text-primary);
  background: var(--console-body);
}

.action-key {
  grid-column: span 5;
  aspect-ratio: auto;
  padding: 12px;
  font-family: 'SimHei', sans-serif;
  letter-spacing: 4px;
}

.mech-btn {
  padding: 10px 20px;
  background: var(--card-background);
  color: var(--text-primary);
  border: 2px solid var(--text-primary);
  font-family: 'SimHei', sans-serif;
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 3px 3px 0px var(--text-primary);
}
.mech-btn:active {
  transform: translate(3px, 3px);
  box-shadow: 0px 0px 0px var(--text-primary);
}
.mt-4 { margin-top: 1rem; }

/* 极客诊断通道按钮 (防挤压街机控制，纯中文) */
.yuemu-diagnostic-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 5px;
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
  display: flex;
  flex-direction: column;
}

.brand-plate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #1a3324;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.flex-column-mobile { display: flex; }
.terminal-title {
  color: #00FF41;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
}

.tab-buttons {
  display: flex;
  gap: 8px;
}
.tab-btn {
  background: transparent;
  border: none;
  color: #1a3324;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 2px 6px;
}
.tab-btn.active, .tab-btn:hover {
  color: #00FF41;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
}

/* 终端屏幕内部 */
.terminal-screen {
  flex: 1;
  background: #020603;
  border: 2px solid #1a3324;
  border-radius: 8px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.scanlines {
  position: absolute; inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
  background-size: 100% 3px;
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

.terminal-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

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
  font-size: 12px;
  color: #00FF41;
  font-weight: bold;
}

.panel-header {
  display: grid;
  padding: 8px 6px;
  border-bottom: 1px solid rgba(0, 255, 65, 0.3);
  color: #00FF41;
  font-size: 12px;
  font-weight: bold;
}
.ranking-layout-header {
  grid-template-columns: 50px 1fr 90px 90px;
}
.history-layout-header {
  grid-template-columns: 1fr 90px 90px 60px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.scrollable::-webkit-scrollbar {
  width: 4px;
}
.scrollable::-webkit-scrollbar-track {
  background: rgba(0, 255, 65, 0.05);
}
.scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 65, 0.3);
  border-radius: 2px;
}

.data-row {
  display: grid;
  padding: 10px 6px;
  border-bottom: 1px dashed rgba(0, 255, 65, 0.1);
  color: rgba(0, 255, 65, 0.8);
  font-size: 12px;
  align-items: center;
}
.ranking-layout-row {
  grid-template-columns: 50px 1fr 90px 90px;
}
.history-layout-row {
  grid-template-columns: 1fr 90px 90px 60px;
}

.data-row.my-row {
  background: rgba(0, 255, 65, 0.1);
  border-left: 2px solid #00FF41;
}

.rank-num { font-weight: bold; }
.username {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.avatar-img {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 65, 0.5);
  object-fit: cover;
}
.name-text {
  text-decoration: underline;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.score-val { font-weight: bold; }
.text-neon-green { color: #00FF41; }
.time-val { color: rgba(0, 255, 65, 0.6); }
.level-val { color: rgba(0, 255, 65, 0.8); }

.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  color: rgba(0, 255, 65, 0.5);
  font-size: 12px;
  border: 1px dashed rgba(0, 255, 65, 0.1);
  margin-top: 15px;
}

.pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 255, 65, 0.3);
  margin-top: auto;
}
.paging-btn {
  background: transparent;
  border: 1px solid rgba(0, 255, 65, 0.5);
  color: #00FF41;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
}
.paging-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.page-indicator {
  color: #00FF41;
  font-size: 12px;
}

.modal-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}
.danger-btn {
  border-color: #ff3366;
  color: #ff3366;
  box-shadow: 0 4px 0 rgba(255, 51, 102, 0.3);
}
.danger-btn:active {
  box-shadow: 0 2px 0 rgba(255, 51, 102, 0.3);
}

@media (max-width: 768px) {
  .flex-column-mobile { flex-direction: column; gap: 8px; align-items: flex-start; }
  .yuemu-vintage-game-page {
    height: 100vh;
    padding: 10px;
    overflow: hidden;
  }
  .typewriter-chassis {
    height: 100%;
    padding: 10px;
    gap: 8px;
    display: flex;
    flex-direction: column;
  }
  .archive-header {
    margin-top: 0;
    padding-bottom: 5px;
    gap: 5px;
  }
  .game-title {
    font-size: 1.3rem;
  }
  .sudoku-board-wrapper {
    flex: 1;
    min-height: 0;
    aspect-ratio: 1 / 1;
    max-height: 100%;
    margin: 0 auto;
  }
  .sudoku-cell {
    font-size: 1.2rem;
  }
  .numpad-container {
    margin-top: auto;
  }
  .numpad-grid {
    gap: 6px;
  }
  .mech-key {
    font-size: 1rem;
  }
  .action-key {
    padding: 8px;
  }
  .yuemu-diagnostic-trigger-bar {
    margin-top: 5px;
  }
}

/* 移动端细微调整 */
@media (max-width: 400px) {
  .typewriter-chassis { padding: 15px 10px; border-radius: 12px; }
  .game-title { font-size: 1.5rem; }
  .numpad-grid { gap: 6px; }
  .mech-key { font-size: 1.1rem; }
}
/* ================= PC 端横屏分栏重构 ================= */
@media (min-width: 769px) {
  .typewriter-chassis {
    max-width: 900px;
    height: 90vh;
    max-height: 800px;
    display: grid;
    grid-template-columns: 1fr 300px;
    grid-template-rows: auto 1fr auto;
    padding: 30px;
    gap: 30px;
  }
  
  .archive-header {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    margin-top: 0;
  }
  
  .sudoku-board-wrapper {
    grid-column: 1 / 2;
    grid-row: 2 / 4;
    width: 100%;
    height: 100%;
    max-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
  }
  
  .sudoku-board {
    height: 100%;
    max-height: 500px;
    width: auto;
    aspect-ratio: 1 / 1;
  }
  
  .numpad-container {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-top: 0;
  }
  
  .numpad-grid {
    grid-template-columns: repeat(3, 1fr); /* 右侧数字键盘采用九宫格形式布局 */
    gap: 15px;
  }

  .mech-key {
    font-size: 1.5rem;
  }

  .action-key {
    grid-column: span 3;
    padding: 20px;
    font-size: 1.2rem;
  }

  .yuemu-diagnostic-trigger-bar {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    flex-direction: column;
    justify-content: flex-end;
    margin-top: auto;
  }

  .yuemu-mini-diag-btn {
    padding: 15px;
  }
  
  .yuemu-mini-diag-btn .yuemu-sys-text {
    font-size: 14px !important;
  }
}
</style>
