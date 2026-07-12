<template>
  <div class="yuemu-vintage-game-page">
    
    <!-- 脉冲链路终端 (主游戏控制台) -->
    <div class="instrument-chassis">
      <div class="screw top-left"></div>
      <div class="screw top-right"></div>
      <div class="screw bottom-left"></div>
      <div class="screw bottom-right"></div>

      <div class="brand-plate">
        <span class="model-name">{{ t('pages.games.aAGamePage.pulseLinkTerminal') }}</span>
        <div class="status-indicator">
          <div class="led-light" :class="{ error: state === 'gameover', active: state === 'playing' }"></div>
          <span>{{ statusText }}</span>
        </div>
      </div>

      <div
        class="radar-screen"
        @click="shootNeedle"
        @touchstart.stop.prevent="shootNeedle"
        :class="{ 'shake-error': state === 'gameover', 'flash-success': state === 'victory' }"
      >
        <div class="scanlines"></div>
        <div class="crt-flicker"></div>
        <div class="screen-vignette"></div>

        <div class="hud-top">
          <div class="hud-item">
            <span>{{ t('pages.games.aAGamePage.encryptionLevel') }}</span>
            <strong>LV.{{ level }}</strong>
          </div>
          <div class="hud-item right">
            <span>{{ t('pages.games.aAGamePage.availablePulses') }}</span>
            <strong>{{ needlesLeft }}</strong>
          </div>
        </div>

        <div class="radar-center-point">
          <div class="radar-ring ring-lg"></div>
          <div class="radar-ring ring-md"></div>
          <div class="radar-ring ring-sm"></div>

          <div class="crosshair-h"></div>
          <div class="crosshair-v"></div>

          <div class="radar-sweep-wrapper">
            <div class="radar-sweep"></div>
          </div>

          <div
            class="core-container"
            :style="{ transform: `rotate(${rotation}deg)` }"
          >
            <div
              class="needle"
              v-for="n in attachedNeedles"
              :key="n.id"
              :style="{ transform: `rotate(${n.angle}deg)` }"
            >
              <div class="needle-line" :class="{ 'error-line': n.isError }"></div>
              <div class="needle-head" :class="{ 'error-head': n.isError }"></div>
            </div>

            <div class="core-node" :class="{ 'core-error': state === 'gameover' }">
              <span class="core-text">CORE</span>
            </div>
          </div>
        </div>

        <div class="shooting-queue">
          <div class="queue-laser"></div>
          <div class="queue-base">
            <div class="ready-pulse"></div>
          </div>
        </div>

        <div class="screen-overlay" v-if="state === 'gameover' || state === 'victory'">
          <h2 :class="state === 'gameover' ? 'text-danger' : 'text-success'">
            {{ state === 'gameover' ? t('pages.games.aAGamePage.linkCollision') : t('pages.games.aAGamePage.protocolCracked') }}
          </h2>
          <p class="desc-text">
            {{ state === 'gameover' ? t('pages.games.aAGamePage.dataOverflow') : t('pages.games.aAGamePage.prepareEnterDeepLayer', { level: level + 1 }) }}
          </p>
        </div>

        <div class="guide-text" v-if="level === 1 && state === 'playing' && needlesLeft > 0">
          {{ t('pages.games.aAGamePage.clickToShoot') }}
        </div>
      </div>

      <!-- 辅助监控诊断按钮区 -->
      <div class="terminal-trigger-bar">
        <button class="mech-btn mini-btn" @click="openTerminal('ranking')"><i class="fas fa-trophy"></i> {{ t('pages.games.aAGamePage.crackRanks') }}</button>
        <button class="mech-btn mini-btn" @click="openTerminal('history')"><i class="fas fa-history"></i> {{ t('pages.games.aAGamePage.historyLogs') }}</button>
      </div>

      <!-- 主控制面板 -->
      <div class="control-panel">
        <div class="panel-info">
          <div>{{ t('pages.games.aAGamePage.coreSpeed', { speed: speed.toFixed(1) }) }}</div>
          <div>{{ t('pages.games.aAGamePage.tolerance', { tolerance: collisionTolerance }) }}</div>
        </div>
        <div class="control-buttons">
          <button
            class="mech-btn sound-btn"
            :class="{ 'muted': !isSoundEnabled }"
            @click="toggleSound"
            :title="isSoundEnabled ? t('pages.games.aAGamePage.disableSound') : t('pages.games.aAGamePage.enableSound')"
          >
            <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
          </button>
          <button
            class="mech-btn"
            :class="{ 'danger-btn': state === 'gameover' }"
            @click="resetGame"
          >
            {{ state === 'playing' ? t('pages.games.aAGamePage.systemReboot') : t('pages.games.aAGamePage.forceRetry') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 悬浮复古数据监控诊断终端 (弹窗形式，移动端和桌面端皆完美适配) -->
    <div class="retro-modal-overlay" v-if="isTerminalOpen" @click.self="closeTerminal">
      <div class="terminal-chassis">
        <div class="screw top-left"></div>
        <div class="screw top-right"></div>
        <div class="screw bottom-left"></div>
        <div class="screw bottom-right"></div>

        <div class="brand-plate flex-column-mobile">
          <span class="model-name terminal-title">{{ t('pages.games.aAGamePage.dataTerminalD08') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.aAGamePage.rankBracket') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.aAGamePage.historyBracket') }}
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
              <span class="filter-label">{{ t('pages.games.aAGamePage.levelFilter') }}</span>
              <select v-model="selectedRankLevel" class="retro-select" @change="onRankLevelChange">
                <option value="">{{ t('pages.games.aAGamePage.allLevels') }}</option>
                <option v-for="l in levelOptions" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>
            
            <div class="panel-header ranking-layout-header">
              <span>#</span>
              <span>{{ t('pages.games.aAGamePage.crackTerminal') }}</span>
              <span>{{ t('pages.games.aAGamePage.maxDepth') }}</span>
              <span>{{ t('pages.games.aAGamePage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.aAGamePage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.aAGamePage.noCrackRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.aAGamePage.anonymousTerminal') }}</span>
                </span>
                <span class="score-val text-neon-green">LV.{{ item.score }}</span>
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
                {{ t('pages.games.aAGamePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.aAGamePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.aAGamePage.saveTime') }}</span>
              <span>{{ t('pages.games.aAGamePage.maxDepth') }}</span>
              <span>{{ t('pages.games.aAGamePage.decryptionLevel') }}</span>
              <span>{{ t('pages.games.aAGamePage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.aAGamePage.readingLocalArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.aAGamePage.noLocalArchive') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || 'LV.1' }}</span>
                <span class="score-val text-neon-green">LV.{{ item.score }}</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.aAGamePage.decryptionComplete') : t('pages.games.aAGamePage.coreConflict') }}
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
                {{ t('pages.games.aAGamePage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.aAGamePage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.aAGamePage.closeDiagnostic') }}
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
import { message } from 'ant-design-vue';
import { useLoginUserStore } from '@/stores/useLoginUserStore';
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController';

// --- 账户信息获取 ---
const loginUserStore = useLoginUserStore();
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0);
const router = useRouter();

// --- 游戏核心状态 ---
type GameState = 'idle' | 'playing' | 'gameover' | 'victory';

const state = ref<GameState>('idle');
const level = ref(1);
const rotation = ref(0);
const needlesLeft = ref(0);
const attachedNeedles = ref<{ id: number; angle: number; isError?: boolean }[]>([]);

// 游戏配置参数
const baseSpeed = 1.2;
const collisionTolerance = 12; // 碰撞角度阈值
let needleIdCounter = 0;
let animationFrameId: number;
let lastTime = 0;

// 音效系统
const isSoundEnabled = ref(true);
let shootSound: HTMLAudioElement | null = null;
let collisionSound: HTMLAudioElement | null = null;
let victorySound: HTMLAudioElement | null = null;
let startSound: HTMLAudioElement | null = null;

try {
  shootSound = new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href);
  collisionSound = new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href);
  victorySound = new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href);
  startSound = new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href);

  shootSound.volume = 0.4;
  collisionSound.volume = 0.5;
  victorySound.volume = 0.6;
  startSound.volume = 0.5;
} catch (e) {
  console.warn(t('pages.games.aAGamePage.audioLoadFailed'));
}

const playSound = (sound: HTMLAudioElement | null) => {
  if (!isSoundEnabled.value || !sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
};

const toggleSound = () => {
  isSoundEnabled.value = !isSoundEnabled.value;
};

// 动态计算难度
const targetNeedles = computed(() => 8 + Math.floor(level.value * 1.5));
const speed = computed(() => baseSpeed + level.value * 0.3);

// 状态文字指示
const statusText = computed(() => {
  if (state.value === 'playing') return t('pages.games.aAGamePage.pulseInjecting');
  if (state.value === 'gameover') return t('pages.games.aAGamePage.linkDisconnected');
  if (state.value === 'victory') return t('pages.games.aAGamePage.systemPrivilegeEscalation');
  return t('pages.games.aAGamePage.standby');
});

// --- 排行榜 & 历史记录弹窗状态管理 ---
const isTerminalOpen = ref(false);
const activeTab = ref<'ranking' | 'history'>('ranking');

const rankings = ref<any[]>([]);
const rankingLoading = ref(false);
const rankPage = ref(1);
const totalRankPages = ref(1);
const selectedRankLevel = ref('');
const levelOptions = ['LV.1', 'LV.2', 'LV.3', 'LV.4', 'LV.5', 'LV.6', 'LV.7', 'LV.8'];

const onRankLevelChange = () => {
  rankPage.value = 1;
  fetchRankings();
};

const historyRecords = ref<any[]>([]);
const historyLoading = ref(false);
const historyPage = ref(1);
const totalHistoryPages = ref(1);

// 打开弹窗终端
const openTerminal = (tab: 'ranking' | 'history') => {
  activeTab.value = tab;
  isTerminalOpen.value = true;
  if (tab === 'ranking') {
    fetchRankings();
  } else {
    fetchHistory();
  }
};

// 切换选项卡
const switchTab = (tab: 'ranking' | 'history') => {
  activeTab.value = tab;
  if (tab === 'ranking') {
    fetchRankings();
  } else {
    fetchHistory();
  }
};

// 关闭弹窗终端
const closeTerminal = () => {
  isTerminalOpen.value = false;
};

// 获取排行榜列表
const fetchRankings = async () => {
  rankingLoading.value = true;
  try {
    const params: any = {
      gameType: 'aa',
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
    console.error(t('pages.games.aAGamePage.getRankingsError'), err);
  } finally {
    rankingLoading.value = false;
  }
};

// 切换排行榜分页
const changeRankPage = (delta: number) => {
  const target = rankPage.value + delta;
  if (target >= 1 && target <= totalRankPages.value) {
    rankPage.value = target;
    fetchRankings();
  }
};

// 获取历史记录
const fetchHistory = async () => {
  if (!currentUserId.value) return;
  historyLoading.value = true;
  try {
    const res = await getMyHistoryRecordsUsingPost({
      gameType: 'aa',
      current: historyPage.value,
      pageSize: 8
    });
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || [];
      const total = res.data.data?.total || 0;
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1);
    }
  } catch (err) {
    console.error(t('pages.games.aAGamePage.getHistoryError'), err);
  } finally {
    historyLoading.value = false;
  }
};

// 切换历史记录分页
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

// --- 保存游戏成绩逻辑 ---
const isSaving = ref(false);
const saveScore = async (finalScore: number) => {
  if (finalScore <= 0) return;
  if (!currentUserId.value) {
    console.warn(t('pages.games.aAGamePage.notLoggedInUpload'));
    return;
  }
  isSaving.value = true;
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'aa',
      level: `LV.${level.value}`,
      score: finalScore
    });
    if (res.data?.code === 0) {
      // 成功保存后静默刷新底层数据缓存
      fetchRankings();
      fetchHistory();
    }
  } catch (err) {
    console.error(t('pages.games.aAGamePage.reportScoreError'), err);
  } finally {
    isSaving.value = false;
  }
};

// 时间戳格式化工具
const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.aAGamePage.unknownTime');
  const date = new Date(dateStr);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${m}-${d} ${hh}:${mm}`;
};

// --- 游戏内部逻辑 ---
const initLevel = (newLevel: number) => {
  level.value = newLevel;
  needlesLeft.value = targetNeedles.value;
  attachedNeedles.value = [];
  rotation.value = 0;

  // 预置初始障碍针
  const initialObstacles = Math.min(Math.floor(newLevel / 2), 6);
  const spacing = 360 / initialObstacles;
  for (let i = 0; i < initialObstacles; i++) {
    attachedNeedles.value.push({
      id: ++needleIdCounter,
      angle: i * spacing
    });
  }

  state.value = 'playing';
  playSound(startSound);
};

const resetGame = () => {
  initLevel(1);
};

const nextLevel = () => {
  initLevel(level.value + 1);
};

const getShortestAngle = (a: number, b: number) => {
  let diff = (a - b) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return Math.abs(diff);
};

const shootNeedle = () => {
  if (state.value !== 'playing' || needlesLeft.value <= 0) return;

  // 计算击中时的绝对角度
  let hitAngle = (180 - rotation.value) % 360;
  if (hitAngle < 0) hitAngle += 360;

  // 碰撞检测
  let isCollision = false;
  for (const n of attachedNeedles.value) {
    if (getShortestAngle(n.angle, hitAngle) < collisionTolerance) {
      isCollision = true;
      break;
    }
  }

  if (isCollision) {
    attachedNeedles.value.push({
      id: ++needleIdCounter,
      angle: hitAngle,
      isError: true
    });
    state.value = 'gameover';
    playSound(collisionSound);
    
    // 失败时上传本局的最高过关层数
    saveScore(level.value - 1);
  } else {
    attachedNeedles.value.push({
      id: ++needleIdCounter,
      angle: hitAngle
    });
    needlesLeft.value--;
    playSound(shootSound);

    // 检查是否通关
    if (needlesLeft.value === 0) {
      state.value = 'victory';
      playSound(victorySound);
      
      // 通关时直接上传记录
      saveScore(level.value);

      setTimeout(() => {
        if (state.value === 'victory') nextLevel();
      }, 1500);
    }
  }
};

// --- 核心渲染循环 ---
const gameLoop = (time: number) => {
  if (!lastTime) lastTime = time;
  const deltaTime = time - lastTime;
  lastTime = time;

  if (state.value === 'playing') {
    rotation.value = (rotation.value + speed.value * (deltaTime / 16)) % 360;
  }

  animationFrameId = requestAnimationFrame(gameLoop);
};

// --- 生命周期钩子 ---
onMounted(() => {
  initLevel(1);
  animationFrameId = requestAnimationFrame(gameLoop);
  
  // 预加载排行和历史，提升弹窗秒开的速度
  fetchRankings();
  fetchHistory();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
/* 引入等宽字体强化复古科技感 */
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

.yuemu-vintage-game-page {
  /* 仅居中展示单独的仪器外壳，彻底解决移动端宽度拥挤问题 */
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: var(--theme-transition);
}

/* ================= 仪器外壳 (主游戏控制台) ================= */
.instrument-chassis {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: var(--card-background);
  border: 4px solid var(--text-primary);
  border-radius: 16px;
  padding: 25px 20px;
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.05),
    12px 12px 0px var(--shadow-color);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 四角螺丝 */
.screw {
  position: absolute;
  width: 14px;
  height: 14px;
  background: var(--border-color);
  border: 2px solid var(--text-primary);
  border-radius: 50%;
}
.screw::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 2px;
  right: 2px;
  height: 2px;
  background: var(--text-primary);
  transform: translateY(-50%) rotate(45deg);
}
.top-left { top: 12px; left: 12px; }
.top-right { top: 12px; right: 12px; }
.bottom-left { bottom: 12px; left: 12px; }
.bottom-right { bottom: 12px; right: 12px; }

/* 铭牌 */
.brand-plate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--text-primary);
  padding-bottom: 10px;
  min-height: 42px;
}
.model-name {
  font-family: 'Space Mono', 'SimHei', monospace;
  font-weight: 900;
  font-size: 1.1rem;
  letter-spacing: 1px;
}
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'SimHei', monospace;
  font-size: 0.8rem;
  font-weight: bold;
}
.led-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #333;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
  transition: all 0.2s;
}
.led-light.active {
  background-color: #00FF41;
  box-shadow: 0 0 8px #00FF41;
}
.led-light.error {
  background-color: #FF2A2A;
  box-shadow: 0 0 10px #FF2A2A;
}

/* ================= 雷达屏幕 ================= */
.radar-screen {
  position: relative;
  width: 100%;
  height: 440px;
  background-color: #020603; /* 极暗深绿底色 */
  border: 4px solid var(--text-primary);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: inset 0 0 40px rgba(0, 255, 65, 0.1);
}

/* CRT 特效层 */
.scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.3) 50%);
  background-size: 100% 4px;
  z-index: 40;
  pointer-events: none;
}
.crt-flicker {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 255, 65, 0.02);
  z-index: 41;
  pointer-events: none;
  animation: flicker 0.12s infinite;
}
.screen-vignette {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  box-shadow: inset 0 0 80px rgba(0,0,0,0.9);
  z-index: 39;
  pointer-events: none;
}
@keyframes flicker {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.9; }
}

/* HUD 悬浮信息 */
.hud-top {
  position: absolute;
  top: 15px; left: 15px; right: 15px;
  display: flex;
  justify-content: space-between;
  z-index: 30;
  pointer-events: none;
}
.hud-item {
  display: flex;
  flex-direction: column;
  color: #00FF41;
  font-family: 'Space Mono', monospace;
  text-shadow: 0 0 5px rgba(0, 255, 65, 0.6);
}
.hud-item span { font-size: 0.7rem; opacity: 0.8; font-weight: bold;}
.hud-item strong { font-size: 1.4rem; line-height: 1; }
.hud-item.right { text-align: right; }

/* ================= 核心同心系统 ================= */
.radar-center-point {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 280px;
  height: 280px;
}

/* 环形刻度 */
.radar-ring {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  border: 1px dashed rgba(0, 255, 65, 0.25);
  border-radius: 50%;
}
.ring-sm { width: 80px; height: 80px; }
.ring-md { width: 160px; height: 160px; }
.ring-lg { width: 240px; height: 240px; }

/* 十字瞄准线 */
.crosshair-h, .crosshair-v {
  position: absolute;
  background-color: rgba(0, 255, 65, 0.15);
}
.crosshair-h {
  top: 50%; left: 10px; right: 10px; height: 1px;
  transform: translateY(-50%);
}
.crosshair-v {
  left: 50%; top: 10px; bottom: 10px; width: 1px;
  transform: translateX(-50%);
}

/* 雷达扫描余辉 */
.radar-sweep-wrapper {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  animation: radar-spin 8s linear infinite;
  pointer-events: none;
}
.radar-sweep {
  position: absolute;
  top: 50%; left: 50%;
  width: 120px;
  height: 120px;
  background: conic-gradient(from 0deg, rgba(0, 255, 65, 0.1) 0%, rgba(0, 255, 65, 0) 60%);
  transform-origin: top left;
  border-radius: 0 0 100% 0;
}
@keyframes radar-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 脉冲轴心圆环 */
.core-container {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  transform-origin: center center;
  transition: transform 0.05s linear;
}
.core-node {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background-color: #020603;
  border: 3px solid #00FF41;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 0 12px rgba(0, 255, 65, 0.5);
  transition: all 0.2s;
}
.core-node.core-error {
  border-color: #FF2A2A;
  box-shadow: 0 0 20px #FF2A2A;
}
.core-text {
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem;
  font-weight: 900;
  color: #00FF41;
  text-shadow: 0 0 3px rgba(0, 255, 65, 0.8);
}
.core-node.core-error .core-text {
  color: #FF2A2A;
  text-shadow: 0 0 3px rgba(255, 42, 42, 0.8);
}

/* 脉冲针样式 */
.needle {
  position: absolute;
  top: 50%; left: 50%;
  width: 120px;
  height: 2px;
  transform-origin: 0% 50%;
  z-index: 5;
}
.needle-line {
  position: absolute;
  left: 24px;
  width: 96px;
  height: 2px;
  background-color: #00FF41;
  box-shadow: 0 0 4px #00FF41;
}
.needle-head {
  position: absolute;
  right: 0;
  top: -4px;
  width: 10px;
  height: 10px;
  background-color: #00FF41;
  border-radius: 50%;
  box-shadow: 0 0 6px #00FF41;
}
.needle-line.error-line {
  background-color: #FF2A2A;
  box-shadow: 0 0 6px #FF2A2A;
}
.needle-head.error-head {
  background-color: #FF2A2A;
  box-shadow: 0 0 10px #FF2A2A;
  animation: pulse-error 0.5s infinite alternate;
}
@keyframes pulse-error {
  from { transform: scale(1); }
  to { transform: scale(1.3); }
}

/* 发射管激光队列 */
.shooting-queue {
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 110px;
  pointer-events: none;
}
.queue-laser {
  width: 100%;
  height: 80px;
  background: linear-gradient(to top, #00FF41, rgba(0,255,65,0));
  opacity: 0.5;
  box-shadow: 0 0 4px #00FF41;
}
.queue-base {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background-color: #00FF41;
  border-radius: 50%;
  box-shadow: 0 0 8px #00FF41;
}
.ready-pulse {
  position: absolute;
  top: -5px; left: -5px; right: -5px; bottom: -5px;
  border: 1px solid #00FF41;
  border-radius: 50%;
  animation: pulse-ready 1.2s infinite;
}
@keyframes pulse-ready {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
}

/* HUD 弹窗遮罩及导引 */
.screen-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(2, 6, 3, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 35;
  font-family: 'Space Mono', 'SimHei', monospace;
  animation: overlay-fade 0.3s ease-out;
}
@keyframes overlay-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.screen-overlay h2 {
  font-size: 1.8rem;
  font-weight: 900;
  margin-bottom: 10px;
  letter-spacing: 1px;
}
.screen-overlay p {
  font-size: 0.9rem;
  opacity: 0.9;
}
.text-danger {
  color: #FF2A2A;
  text-shadow: 0 0 10px rgba(255, 42, 42, 0.6);
}
.text-success {
  color: #00FF41;
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.6);
}
.desc-text {
  color: #00FF41;
}

.guide-text {
  position: absolute;
  bottom: 95px;
  left: 50%;
  transform: translateX(-50%);
  color: #00FF41;
  font-family: 'SimHei', monospace;
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 2px;
  pointer-events: none;
  animation: pulse-guide 2s infinite;
  white-space: nowrap;
  z-index: 30;
}

/* 震动与闪白特效 */
.shake-error { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
  40%, 60% { transform: translate3d(6px, 0, 0); }
}

.flash-success { animation: flash 1.5s ease-out; }
@keyframes flash {
  0% { box-shadow: inset 0 0 150px #00FF41; background-color: rgba(0, 255, 65, 0.4);}
  100% { box-shadow: inset 0 0 40px rgba(0, 255, 65, 0.1); background-color: #020603;}
}

/* ================= 辅助诊断条 (新增) ================= */
.terminal-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
}
.mini-btn {
  flex: 1;
  padding: 8px 10px;
  font-size: 0.8rem;
  font-family: 'Space Mono', 'SimHei', monospace;
  box-shadow: 2px 2px 0px var(--text-primary);
}
.mini-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0px 0px 0px var(--text-primary);
}

/* ================= 机械控制面板 ================= */
.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--hover-background);
  border: 2px solid var(--border-color);
  padding: 12px 15px;
  border-radius: 8px;
}

.panel-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: 'Space Mono', 'SimHei', monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: bold;
}

/* 控制按钮布局 */
.control-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 机械按钮 */
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
  transition: all 0.1s;
}
.mech-btn:active {
  transform: translate(3px, 3px);
  box-shadow: 0px 0px 0px var(--text-primary);
}

.danger-btn {
  color: #d32f2f;
  border-color: #d32f2f;
  box-shadow: 3px 3px 0px #d32f2f;
}
.danger-btn:active {
  box-shadow: 0px 0px 0px #d32f2f;
}

.sound-btn {
  padding: 8px 12px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sound-btn.muted {
  opacity: 0.6;
}

/* ================= 悬浮复古弹窗数据监控终端 (新增) ================= */
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

.terminal-screen {
  position: relative;
  flex: 1;
  background-color: #020603;
  border: 4px solid var(--text-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(0, 255, 65, 0.1);
  display: flex;
  flex-direction: column;
}

.terminal-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
  z-index: 30;
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
  color: var(--text-secondary);
  font-family: 'Space Mono', 'SimHei', monospace;
  font-weight: bold;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
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

.panel-header {
  font-family: 'Space Mono', 'SimHei', monospace;
  font-size: 12px;
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
  grid-template-columns: 0.6fr 2fr 1.2fr 1.6fr;
}

.history-layout-header,
.history-layout-row {
  grid-template-columns: 1.6fr 1fr 1fr 1.2fr;
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
  font-family: 'Space Mono', 'SimHei', monospace;
  font-size: 12px;
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
  width: 20px;
  height: 20px;
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

.text-neon-green {
  color: #00FF41;
  font-weight: bold;
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
  font-family: 'Space Mono', 'SimHei', monospace;
  font-size: 13px;
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
  font-family: 'SimHei', monospace;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 10px;
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
  font-family: 'Space Mono', monospace;
  font-size: 12px;
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
  padding: 8px 0;
  font-size: 0.9rem;
}

/* ================= 移动端响应式调整 ================= */
@media (max-width: 768px) {
  .yuemu-vintage-game-page {
    height: 100vh;
    padding: 10px;
    overflow: hidden;
  }
  
  .instrument-chassis {
    height: 100%;
    padding: 15px 10px;
    gap: 10px;
    border-radius: 12px;
  }

  .radar-screen {
    flex: 1;
    height: auto;
    min-height: 0;
  }
  
  .radar-center-point {
    transform: translate(-50%, -50%) scale(0.85);
  }
  
  .terminal-trigger-bar {
    margin: 5px 0;
  }

  .flex-column-mobile {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 10px;
  }
  
  .terminal-chassis {
    padding: 15px;
    border-radius: 12px;
  }

  .control-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  .panel-info {
    flex-direction: row;
    justify-content: space-between;
  }
  .control-buttons {
    width: 100%;
    justify-content: space-between;
  }
  .mech-btn {
    flex: 1;
    padding: 12px 10px;
    font-size: 0.95rem;
    text-align: center;
  }
  .sound-btn {
    flex: 0 0 50px;
  }
  
  .ranking-layout-header,
  .ranking-layout-row {
    grid-template-columns: 0.5fr 1.8fr 1.25fr 1.45fr;
  }

  .history-layout-header,
  .history-layout-row {
    grid-template-columns: 1.45fr 0.95fr 0.95fr 1.15fr;
  }
  
  .data-row {
    font-size: 12px;
  }
  .avatar-img {
    width: 16px;
    height: 16px;
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
  font-size: 12px;
  color: #00FF41;
  font-weight: bold;
}

.retro-select {
  background: #020603;
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
  background: #020603;
  color: #00FF41;
  font-family: inherit;
}
/* ================= PC 端横屏分栏重构 ================= */
@media (min-width: 769px) {
  .instrument-chassis {
    max-width: 960px;
    height: 90vh;
    max-height: 800px;
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: auto 1fr auto;
    padding: 30px;
    gap: 25px;
    align-items: stretch;
  }
  
  .brand-plate {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    border-bottom: 2px dashed rgba(0, 255, 65, 0.4);
    padding-bottom: 10px;
  }

  .radar-screen {
    grid-column: 1 / 2;
    grid-row: 2 / 4;
    height: auto;
    min-height: 0;
  }

  .terminal-trigger-bar {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
    flex-direction: column;
    justify-content: flex-start;
    height: 100%;
    gap: 20px;
  }
  
  .mini-btn {
    padding: 20px;
    font-size: 1rem;
    flex: 0 0 auto;
  }

  .control-panel {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    padding: 30px 20px;
  }
  
  .panel-info {
    flex-direction: column;
    text-align: center;
    gap: 10px;
    font-size: 1rem;
  }

  .control-buttons {
    flex-direction: column;
    width: 100%;
    gap: 15px;
  }
  
  .control-buttons .mech-btn {
    width: 100%;
    padding: 15px;
  }
}
</style>
