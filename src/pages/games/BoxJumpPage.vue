<template>
  <div class="yuemu-vintage-game-page">
    <div class="instrument-chassis">
      <div class="screw top-left"></div>
      <div class="screw top-right"></div>
      <div class="screw bottom-left"></div>
      <div class="screw bottom-right"></div>

      <div class="brand-plate">
        <span class="model-name">{{ t('pages.games.boxJumpPage.jumpJumpTitle') }}</span>
        <div class="status-indicator">
          <div class="led-light" :class="{ error: state === 'gameover', active: state === 'idle' || state === 'charging' }"></div>
          <span>{{ statusText }}</span>
          <button
            class="sound-toggle-btn"
            @click="toggleSound"
            :title="isSoundEnabled ? t('pages.games.boxJumpPage.disableSound') : t('pages.games.boxJumpPage.enableSound')"
          >
            <i :class="isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
          </button>
        </div>
      </div>

      <div
        class="blueprint-screen"
        @mousedown="startCharge"
        @mouseup="releaseCharge"
        @mouseleave="cancelCharge"
        @touchstart.stop.prevent="startCharge"
        @touchend.stop.prevent="releaseCharge"
        :class="{ 'shake-error': state === 'gameover' }"
      >
        <div class="scanlines"></div>
        <div class="crt-flicker"></div>
        <div class="screen-vignette"></div>

        <div class="blueprint-grid"></div>

        <div class="hud-top">
          <div class="hud-item">
            <span>{{ t('pages.games.boxJumpPage.currentScore') }}</span>
            <strong>{{ score }}</strong>
          </div>
          <div class="hud-item right">
            <span>{{ t('pages.games.boxJumpPage.bestRecord') }}</span>
            <strong>{{ highScore }}</strong>
          </div>
        </div>

        <div class="combo-display" :class="{ 'show': showCombo }">
          <div class="combo-text">{{ t('pages.games.boxJumpPage.bullseye') }}</div>
          <div class="combo-multiplier">{{ t('pages.games.boxJumpPage.comboX', { combo: combo }) }}</div>
        </div>

        <div class="game-viewport">
          <div
            class="game-world"
            :style="{ transform: `translate(${-camera.x}px, ${camera.y}px)` }"
          >
            <div
              class="platform-cylinder"
              v-for="plat in platforms"
              :key="plat.id"
              :style="{
                left: `${getScreenX(plat.u)}px`,
                bottom: `${getScreenY(plat.u)}px`,
                zIndex: 1000 - plat.id // 远处的层级低
              }"
            >
              <div class="cylinder-body"></div>
              <div class="cylinder-top">
                <div class="target-center">
                  <div class="target-dot"></div>
                </div>
              </div>
            </div>

            <div
              class="player-capsule"
              :class="{ 'charging': state === 'charging', 'falling': state === 'gameover' }"
              :style="{
                left: `${getScreenX(player.u)}px`,
                bottom: `${getScreenY(player.u) + player.z}px`,
                zIndex: 2000,
                transform: `scaleY(${player.scaleY})`
              }"
            >
              <div class="capsule-body"></div>
              <div class="capsule-top"></div>
            </div>

          </div>
        </div>
        <div class="charge-meter">
          <div class="meter-track">
            <div class="meter-fill" :style="{ width: `${charge}%`, backgroundColor: chargeColor }"></div>
          </div>
        </div>

        <div class="screen-overlay" v-if="state === 'ready' || state === 'gameover'">
          <div class="overlay-content">
            <h2 :class="state === 'gameover' ? 'text-danger' : 'text-ready'">
              {{ state === 'gameover' ? t('pages.games.boxJumpPage.kineticControlLost') : t('pages.games.boxJumpPage.testSystemReady') }}
            </h2>
            <p class="desc-text">
              {{ state === 'gameover' ? t('pages.games.boxJumpPage.finalScoreScore', { score: score }) : t('pages.games.boxJumpPage.longPressTip') }}
            </p>
            <button
              class="mech-btn"
              @click.stop="initGame"
              @touchstart.stop.prevent="initGame"
            >
              {{ state === 'gameover' ? t('pages.games.boxJumpPage.regenerateModule') : t('pages.games.boxJumpPage.startTest') }}
            </button>
          </div>
        </div>

      </div>

      <!-- 辅助监控诊断按钮区 -->
      <div class="terminal-trigger-bar">
        <button class="mech-btn mini-btn" @click="openTerminal('ranking')"><i class="fas fa-trophy"></i> {{ t('pages.games.boxJumpPage.crackRanks') }}</button>
        <button class="mech-btn mini-btn" @click="openTerminal('history')"><i class="fas fa-history"></i> {{ t('pages.games.boxJumpPage.historyLogs') }}</button>
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
          <span class="model-name terminal-title">{{ t('pages.games.boxJumpPage.dataTerminalD09') }}</span>
          <div class="tab-buttons">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'ranking' }" 
              @click="switchTab('ranking')"
            >
              [ <i class="fas fa-trophy"></i> {{ t('pages.games.boxJumpPage.rankBracket') }}
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'history' }" 
              @click="switchTab('history')"
            >
              [ <i class="fas fa-history"></i> {{ t('pages.games.boxJumpPage.historyBracket') }}
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
              <span>{{ t('pages.games.boxJumpPage.crackTerminal') }}</span>
              <span>{{ t('pages.games.boxJumpPage.maxScore') }}</span>
              <span>{{ t('pages.games.boxJumpPage.accessTime') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="rankingLoading" class="loading-state">
                >{{ t('pages.games.boxJumpPage.searchingNodes') }}
              </div>
              <div v-else-if="rankings.length === 0" class="empty-state">
                >{{ t('pages.games.boxJumpPage.noCrackRecord') }}
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
                  <span class="name-text">{{ item.userName || t('pages.games.boxJumpPage.anonymousTerminal') }}</span>
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
                {{ t('pages.games.boxJumpPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ rankPage }} / {{ totalRankPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="rankPage >= totalRankPages" 
                @click="changeRankPage(1)"
              >
                {{ t('pages.games.boxJumpPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 2. 历史记录面板 -->
          <div v-if="activeTab === 'history'" class="terminal-panel">
            <div class="panel-header history-layout-header">
              <span>{{ t('pages.games.boxJumpPage.saveTime') }}</span>
              <span>{{ t('pages.games.boxJumpPage.testLevel') }}</span>
              <span>{{ t('pages.games.boxJumpPage.achievedScore') }}</span>
              <span>{{ t('pages.games.boxJumpPage.status') }}</span>
            </div>
            
            <div class="panel-content scrollable">
              <div v-if="historyLoading" class="loading-state">
                >{{ t('pages.games.boxJumpPage.readingLocalArchive') }}
              </div>
              <div v-else-if="historyRecords.length === 0" class="empty-state">
                >{{ t('pages.games.boxJumpPage.noLocalArchive') }}
              </div>
              <div 
                v-else 
                v-for="item in historyRecords" 
                :key="item.id" 
                class="data-row history-layout-row"
              >
                <span class="time-val">{{ formatDate(item.createTime) }}</span>
                <span class="level-val">{{ item.level || t('pages.games.boxJumpPage.default') }}</span>
                <span class="score-val text-neon-green">{{ item.score }} PTS</span>
                <span class="status-val" :class="item.score > 0 ? 'success' : 'error'">
                  {{ item.score > 0 ? t('pages.games.boxJumpPage.testPassed') : t('pages.games.boxJumpPage.notInitiated') }}
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
                {{ t('pages.games.boxJumpPage.prevPage') }}
              </button>
              <span class="page-indicator">{{ historyPage }} / {{ totalHistoryPages }}</span>
              <button 
                class="paging-btn" 
                :disabled="historyPage >= totalHistoryPages" 
                @click="changeHistoryPage(1)"
              >
                {{ t('pages.games.boxJumpPage.nextPage') }}
              </button>
            </div>
          </div>

          <!-- 关闭弹窗诊断底部 -->
          <div class="modal-footer">
            <button class="mech-btn danger-btn close-btn" @click="closeTerminal">
              [ <i class="fas fa-times-circle"></i> {{ t('pages.games.boxJumpPage.closeDiagnostic') }}
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useLoginUserStore } from '@/stores/useLoginUserStore';
import {
  saveGameRecordUsingPost,
  getMyHistoryRecordsUsingPost,
  getRankingListUsingPost
} from '@/api/gameRecordController';

// --- 账户与弹窗监控 ---
const loginUserStore = useLoginUserStore();
const currentUserId = computed(() => loginUserStore.loginUser?.id || 0);
const router = useRouter();

// --- 游戏核心状态 ---
type GameState = 'ready' | 'idle' | 'charging' | 'jumping' | 'gameover';

const state = ref<GameState>('ready');
const score = ref(0);
const highScore = ref(0);
const combo = ref(0);
const charge = ref(0);
const showCombo = ref(false);

// --- 音效系统 ---
const isSoundEnabled = ref(true);
const chargeSound = new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href);
const jumpSound = new Audio(new URL('@/assets/sounds/start.MP3', import.meta.url).href);
const landSound = new Audio(new URL('@/assets/sounds/win.MP3', import.meta.url).href);
const comboSound = new Audio(new URL('@/assets/sounds/select.MP3', import.meta.url).href);
const gameoverSound = new Audio(new URL('@/assets/sounds/mismatch.MP3', import.meta.url).href);

chargeSound.volume = 0.3;
jumpSound.volume = 0.4;
landSound.volume = 0.3;
comboSound.volume = 0.5;
gameoverSound.volume = 0.5;

const playSound = (sound: HTMLAudioElement) => {
  if (!isSoundEnabled.value) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
};

const toggleSound = () => {
  isSoundEnabled.value = !isSoundEnabled.value;
};

// --- 物理与空间系统 (1D 轴投影到 2.5D) ---
// u 是物理距离轴。玩家和平台都在 u 轴上移动。
const PLATFORM_D = 60; // 平台直径
const PLATFORM_H = 80; // 平台高度 (视觉)

const player = reactive({
  u: 0,
  z: PLATFORM_H, // z 是高度，站在平台上时 z = 平台高度
  vu: 0,
  vz: 0,
  scaleY: 1
});

const camera = reactive({ x: 0, y: 0, targetX: 0, targetY: 0 });
const platforms = ref<{ id: number; u: number }[]>([]);
let platformIdCounter = 0;
let lastTime = 0;
let animationFrameId: number;
let mainLoopId: number;

// --- 计算属性 ---
const statusText = computed(() => {
  if (state.value === 'ready') return t('pages.games.boxJumpPage.waitingForCommand');
  if (state.value === 'idle') return t('pages.games.boxJumpPage.monitoring');
  if (state.value === 'charging') return t('pages.games.boxJumpPage.energyPumping');
  if (state.value === 'jumping') return t('pages.games.boxJumpPage.transitioning');
  if (state.value === 'gameover') return t('pages.games.boxJumpPage.linkDisconnected');
  return t('pages.games.boxJumpPage.unknown');
});

const chargeColor = computed(() => {
  if (charge.value < 40) return '#4ade80';
  if (charge.value < 80) return '#fbbf24';
  return '#f87171';
});

// --- 渲染映射系统 ---
// 经典等距视角 (Isometric): 30度角向右上延伸
const COS_30 = 0.866;
const SIN_30 = 0.5;

const getScreenX = (u: number) => u * COS_30;
const getScreenY = (u: number) => u * SIN_30;

// --- 场景生成 ---
const generatePlatform = (lastU: number) => {
  const difficulty = Math.min(score.value / 30, 1);
  const minGap = 20 + difficulty * 30;
  const maxGap = 80 + difficulty * 50;

  // u 轴上的下一个坐标
  const gap = minGap + Math.random() * (maxGap - minGap);
  const nextU = lastU + PLATFORM_D + gap;

  platforms.value.push({ id: platformIdCounter++, u: nextU });
};

const initGame = () => {
  state.value = 'idle';
  score.value = 0;
  combo.value = 0;
  charge.value = 0;
  showCombo.value = false;
  platformIdCounter = 0;

  // 初始化物理位置
  player.u = 0;
  player.z = PLATFORM_H;
  player.scaleY = 1;

  // 初始化摄像机
  updateCameraTarget();
  camera.x = camera.targetX;
  camera.y = camera.targetY;

  // 生成平台
  platforms.value = [{ id: platformIdCounter++, u: 0 }];
  generatePlatform(platforms.value[0].u);
  generatePlatform(platforms.value[1].u);
  generatePlatform(platforms.value[2].u);
  generatePlatform(platforms.value[3].u);

  if(!mainLoopId) mainLoopId = requestAnimationFrame(engineLoop);
};

// 更新摄像机目标点，使其始终聚焦在玩家身上 (屏幕相对位置：左下角靠中)
const updateCameraTarget = () => {
  camera.targetX = getScreenX(player.u) - 80;
  camera.targetY = getScreenY(player.u) - 100;
};

// 全局平滑循环（处理摄像机跟随）
const engineLoop = () => {
  // 摄像机平滑插值 (Lerp)
  camera.x += (camera.targetX - camera.x) * 0.1;
  camera.y += (camera.targetY - camera.y) * 0.1;
  mainLoopId = requestAnimationFrame(engineLoop);
};

// --- 蓄力逻辑 ---
const startCharge = () => {
  if (state.value !== 'idle') return;
  state.value = 'charging';
  charge.value = 0;
  lastTime = performance.now();
  playSound(chargeSound);
  animationFrameId = requestAnimationFrame(chargeLoop);
};

const chargeLoop = (time: number) => {
  if (state.value !== 'charging') return;
  const dt = time - lastTime;
  lastTime = time;

  charge.value += dt * 0.15; // 蓄力速度
  if (charge.value > 100) charge.value = 100;

  // 弹性压缩：往下压扁
  player.scaleY = 1 - (charge.value / 100) * 0.4;

  animationFrameId = requestAnimationFrame(chargeLoop);
};

const cancelCharge = () => {
  if (state.value === 'charging') releaseCharge();
};

const releaseCharge = () => {
  if (state.value !== 'charging') return;
  state.value = 'jumping';
  cancelAnimationFrame(animationFrameId);

  // 抛物线参数：
  // 蓄力越满，水平速度 v_u 越大。垂直速度 vz 固定以保持跳跃高度一致。
  const p = charge.value / 100;
  player.vu = 2 + p * 8.5; // 向前推进的速度
  player.vz = 12; // 起跳初始向上速度
  const gravity = 0.7;

  charge.value = 0;
  player.scaleY = 1.2; // 瞬间拉伸特效
  lastTime = performance.now();
  playSound(jumpSound);

  const jumpLoop = () => {
    player.u += player.vu;
    player.z += player.vz;
    player.vz -= gravity;

    // 落地检测
    if (player.z <= PLATFORM_H && player.vz <= 0) {
      player.z = PLATFORM_H;
      player.scaleY = 1; // 恢复
      checkCollision();
    } else {
      // 动态调整形变恢复
      if (player.scaleY > 1) player.scaleY -= 0.05;
      animationFrameId = requestAnimationFrame(jumpLoop);
    }
  };

  animationFrameId = requestAnimationFrame(jumpLoop);
};

// --- 碰撞与结算 ---
const checkCollision = () => {
  // 寻找玩家落在了哪个平台上
  let landedPlat = null;
  const R = PLATFORM_D / 2;

  for (const plat of platforms.value) {
    // 判断 player.u 是否在 plat.u 的直径范围内
    if (player.u >= plat.u - R && player.u <= plat.u + R) {
      landedPlat = plat;
      break;
    }
  }

  if (landedPlat) {
    // 着陆成功
    // 如果跳到了以前的平台，不加分
    if (landedPlat.u <= platforms.value[0].u) {
      state.value = 'idle';
      return;
    }

    let points = 1;
    // 精准靶心判定 (误差 5 物理单位内算 Combo)
    if (Math.abs(player.u - landedPlat.u) < 5) {
      combo.value++;
      points += combo.value;

      // 吸附到正中心
      player.u = landedPlat.u;

      showCombo.value = false;
      setTimeout(() => { showCombo.value = true; }, 50);
      setTimeout(() => { showCombo.value = false; }, 1500);
      playSound(comboSound);
    } else {
      combo.value = 0;
      playSound(landSound);
    }

    score.value += points;
    if (score.value > highScore.value) {
      highScore.value = score.value;
      localStorage.setItem('vintageJumpHighScore_ISO', highScore.value.toString());
    }

    // 更新摄像机目标
    updateCameraTarget();

    // 清理旧平台，生成新平台
    setTimeout(() => {
      while (platforms.value.length > 0 && platforms.value[0].u < player.u - PLATFORM_D * 2) {
        platforms.value.shift();
      }
      while (platforms.value.length < 5) {
        const last = platforms.value[platforms.value.length - 1];
        generatePlatform(last.u);
      }
      state.value = 'idle';
    }, 100);

  } else {
    // 坠落判定
    state.value = 'gameover';
    combo.value = 0;
    playSound(gameoverSound);
    animateFall();

    // 保存分数至后端数据库 (极客排重排行榜)
    saveScore(score.value);
  }
};

const animateFall = () => {
  const fallLoop = () => {
    player.z += player.vz;
    player.vz -= 0.8;
    if (player.z > -300) { // 掉出屏幕底部
      animationFrameId = requestAnimationFrame(fallLoop);
    }
  };
  animationFrameId = requestAnimationFrame(fallLoop);
};

// --- 弹窗与后端拉取接口定义 ---
const isTerminalOpen = ref(false);
const activeTab = ref<'ranking' | 'history'>('ranking');

const rankings = ref<any[]>([]);
const rankingLoading = ref(false);
const rankPage = ref(1);
const totalRankPages = ref(1);

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

// 获取排行榜列表 (跳一跳)
const fetchRankings = async () => {
  rankingLoading.value = true;
  try {
    const res = await getRankingListUsingPost({
      gameType: 'box_jump',
      current: rankPage.value,
      pageSize: 8
    });
    if (res.data?.code === 0) {
      rankings.value = res.data.data?.records || [];
      const total = res.data.data?.total || 0;
      totalRankPages.value = Math.max(Math.ceil(total / 8), 1);
    }
  } catch (err) {
    console.error(t('pages.games.boxJumpPage.getRankingsError'), err);
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

// 获取个人解密历史 (跳一跳)
const fetchHistory = async () => {
  if (!currentUserId.value) return;
  historyLoading.value = true;
  try {
    const res = await getMyHistoryRecordsUsingPost({
      gameType: 'box_jump',
      current: historyPage.value,
      pageSize: 8
    });
    if (res.data?.code === 0) {
      historyRecords.value = res.data.data?.records || [];
      const total = res.data.data?.total || 0;
      totalHistoryPages.value = Math.max(Math.ceil(total / 8), 1);
    }
  } catch (err) {
    console.error(t('pages.games.boxJumpPage.getHistoryError'), err);
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

// 上报最终评分
const isSaving = ref(false);
const saveScore = async (finalScore: number) => {
  if (finalScore <= 0) return;
  if (!currentUserId.value) {
    console.warn(t('pages.games.boxJumpPage.notLoggedInUpload'));
    return;
  }
  isSaving.value = true;
  try {
    const res = await saveGameRecordUsingPost({
      gameType: 'box_jump',
      level: t('pages.games.boxJumpPage.default'),
      score: finalScore
    });
    if (res.data?.code === 0) {
      // 保存成功后静默拉取最新列表缓存
      fetchRankings();
      fetchHistory();
    }
  } catch (err) {
    console.error(t('pages.games.boxJumpPage.reportScoreError'), err);
  } finally {
    isSaving.value = false;
  }
};

// 日期格式化工具
const formatDate = (dateStr: string | number | Date | undefined) => {
  if (!dateStr) return t('pages.games.boxJumpPage.unknownTime');
  const date = new Date(dateStr);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${m}-${d} ${hh}:${mm}`;
};

// --- 生命周期 ---
onMounted(() => {
  highScore.value = parseInt(localStorage.getItem('vintageJumpHighScore_ISO') || '0');
  mainLoopId = requestAnimationFrame(engineLoop);
  
  // 静默预加载数据缓存，保证弹窗秒开体验
  fetchRankings();
  fetchHistory();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  cancelAnimationFrame(mainLoopId);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

.yuemu-vintage-game-page {
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  padding: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: var(--theme-transition);
}

/* 仪器外壳 */
.instrument-chassis {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: var(--card-background);
  border: 4px solid var(--text-primary);
  border-radius: 16px;
  padding: 20px 15px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05), 12px 12px 0px var(--shadow-color);
  display: flex; flex-direction: column; gap: 15px;
}

/* 螺丝装饰 */
.screw {
  position: absolute; width: 12px; height: 12px;
  background: var(--border-color); border: 2px solid var(--text-primary); border-radius: 50%;
}
.screw::after {
  content: ''; position: absolute; top: 50%; left: 2px; right: 2px; height: 2px;
  background: var(--text-primary); transform: translateY(-50%) rotate(45deg);
}
.top-left { top: 12px; left: 12px; }
.top-right { top: 12px; right: 12px; }
.bottom-left { bottom: 12px; left: 12px; }
.bottom-right { bottom: 12px; right: 12px; }

/* 铭牌 */
.brand-plate {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 2px solid var(--text-primary); padding-bottom: 8px;
}
.model-name {
  font-family: 'Space Mono', 'SimHei', monospace; font-weight: 900; font-size: 1.1rem; letter-spacing: 1px;
}
.status-indicator {
  display: flex; align-items: center; gap: 8px; font-family: 'SimHei', monospace; font-size: 0.8rem; font-weight: bold;
}
.led-light {
  width: 10px; height: 10px; border-radius: 50%; background-color: #333; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); transition: all 0.2s;
}
.led-light.active { background-color: #4ade80; box-shadow: 0 0 8px #4ade80; }
.led-light.error { background-color: #f87171; box-shadow: 0 0 10px #f87171; }

/* 控制栏 */
.control-bar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

.sound-toggle-btn {
  padding: 8px 16px;
  background: var(--card-background);
  color: var(--text-primary);
  border: 2px solid var(--text-primary);
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 3px 3px 0px var(--text-primary);
  transition: all 0.1s;
  min-width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sound-toggle-btn:active {
  transform: translate(3px, 3px);
  box-shadow: 0px 0px 0px var(--text-primary);
}

/* ================= 蓝图主屏幕 ================= */
.blueprint-screen {
  position: relative;
  width: 100%;
  height: 520px;
  background-color: #0d1b2a;
  border: 4px solid var(--text-primary);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  touch-action: none; user-select: none; -webkit-user-select: none;
  box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.6);
}

/* CRT 特效层 */
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

/* 蓝图网格背景 */
.blueprint-grid {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    linear-gradient(rgba(100, 181, 246, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 181, 246, 0.1) 1px, transparent 1px);
  background-size: 30px 30px; pointer-events: none; z-index: 1; opacity: 0.7;
}

/* HUD 信息 */
.hud-top {
  position: absolute; top: 15px; left: 15px; right: 15px;
  display: flex; justify-content: space-between; z-index: 45; pointer-events: none;
}
.hud-item {
  display: flex; flex-direction: column; color: #fff;
  font-family: 'Space Mono', 'SimHei', monospace; text-shadow: 0 2px 4px rgba(0,0,0,0.8);
}
.hud-item span { font-size: 0.75rem; opacity: 0.8; font-weight: bold;}
.hud-item strong { font-size: 1.7rem; line-height: 1; color: #4ade80;}
.hud-item.right { text-align: right; }

/* 连击提示特效 */
.combo-display {
  position: absolute; top: 35%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center;
  pointer-events: none; z-index: 60; opacity: 0; transition: opacity 0.2s;
}
.combo-display.show { opacity: 1; animation: pop-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.combo-text { font-family: 'SimHei', sans-serif; font-size: 1.3rem; font-weight: bold; color: #fbbf24; text-shadow: 0 0 15px rgba(251, 191, 36, 1);}
.combo-multiplier { font-family: 'Space Mono', monospace; font-size: 2.5rem; font-weight: 900; color: #fff; text-shadow: 0 0 20px #fbbf24;}
@keyframes pop-up { 0% { transform: translate(-50%, -30%) scale(0.5); opacity: 0; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }

/* ================= 2.5D 等距物理视界 ================= */
.game-viewport {
  position: absolute;
  /* 将视口的原点设在左下角偏内部，所有物品基于此定位 */
  bottom: 20%;
  left: 20%;
  width: 0; height: 0;
  z-index: 10;
}

.game-world {
  position: absolute;
  top: 0; left: 0; width: 0; height: 0;
  will-change: transform;
}

/* 立体圆柱体平台 */
.platform-cylinder {
  position: absolute;
  /* 使得坐标(left, bottom)正好落在圆柱体的底面中心 */
}

.cylinder-body {
  position: absolute;
  width: 60px; height: 80px;
  left: -30px; bottom: 0;
  background-color: #1e293b;
  border-left: 2px solid #3b82f6;
  border-right: 2px solid #3b82f6;
  border-bottom-left-radius: 30px 15px; /* 模拟 2.5D 圆柱底面弧度 */
  border-bottom-right-radius: 30px 15px;
  box-shadow: inset 10px 0 20px rgba(0,0,0,0.6);
}

.cylinder-top {
  position: absolute;
  width: 60px; height: 30px;
  left: -30px; bottom: 65px; /* 80(高) - 15(半径) */
  background-color: #334155;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  box-shadow: inset 0 0 15px rgba(59, 130, 246, 0.3);
}

.target-center {
  position: absolute;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 16px; height: 8px; /* 根据视角压扁成椭圆 */
  border: 2px dashed rgba(251, 191, 36, 0.6); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.target-dot { width: 4px; height: 2px; background-color: #fbbf24; border-radius: 50%; box-shadow: 0 0 8px #fbbf24;}

/* 玩家胶囊体 */
.player-capsule {
  position: absolute;
  transform-origin: center bottom; /* 底部中心变形 */
  transition: filter 0.2s;
}

.capsule-body {
  position: absolute;
  width: 16px; height: 26px;
  left: -8px; bottom: 0;
  background-color: #ef4444;
  border-left: 2px solid #fff;
  border-right: 2px solid #fff;
  border-bottom-left-radius: 8px 4px;
  border-bottom-right-radius: 8px 4px;
  box-shadow: inset -4px 0 8px rgba(0,0,0,0.5), 0 0 10px rgba(239, 68, 68, 0.8);
  transition: background-color 0.2s;
}

.capsule-top {
  position: absolute;
  width: 16px; height: 8px;
  left: -8px; bottom: 22px;
  background-color: #f87171;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: inset 0 0 5px rgba(255,255,255,0.8);
}

/* 蓄力和坠毁状态 */
.player-capsule.charging .capsule-body { background-color: #fbbf24; box-shadow: 0 0 20px #fbbf24;}
.player-capsule.charging .capsule-top { background-color: #fcd34d; }
.player-capsule.falling { filter: grayscale(1) opacity(0.5); }

/* ================= 底部蓄力能量条 ================= */
.charge-meter {
  position: absolute; bottom: 0; left: 0; right: 0; height: 8px; z-index: 40;
}
.meter-track { width: 100%; height: 100%; background: rgba(0,0,0,0.7); }
.meter-fill { height: 100%; transition: background-color 0.2s; box-shadow: 0 0 10px inset;}

/* 覆盖层 */
.screen-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.85); z-index: 70;
  display: flex; justify-content: center; align-items: center;
  backdrop-filter: blur(4px);
}
.overlay-content { text-align: center; padding: 20px; }
.text-danger { color: #f87171; text-shadow: 0 0 15px #f87171; font-family: 'SimHei', monospace; font-size: 1.4rem; margin-bottom: 10px;}
.text-ready { color: #4ade80; text-shadow: 0 0 15px #4ade80; font-family: 'SimHei', monospace; font-size: 1.4rem; margin-bottom: 10px;}
.desc-text { color: #cbd5e1; font-family: 'SimHei', monospace; font-size: 0.95rem; margin-bottom: 30px; line-height: 1.5;}

/* 机械按钮 */
.mech-btn {
  padding: 12px 28px; background: var(--card-background); color: var(--text-primary);
  border: 3px solid var(--text-primary); font-family: 'SimHei', sans-serif; font-weight: 900; font-size: 1.1rem;
  cursor: pointer; border-radius: 4px; box-shadow: 4px 4px 0px var(--text-primary); transition: all 0.1s;
}
.mech-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px var(--text-primary); }

/* 震动特效 */
.shake-error { animation: shake-3d 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake-3d {
  10%, 90% { transform: translate3d(-3px, -1px, 0); }
  20%, 80% { transform: translate3d(5px, 2px, 0); }
  30%, 50%, 70% { transform: translate3d(-7px, -3px, 0); }
  40%, 60% { transform: translate3d(7px, 3px, 0); }
}

/* ================= 辅助诊断条 (新增) ================= */
.terminal-trigger-bar {
  display: flex;
  gap: 15px;
  width: 100%;
}
.mini-btn {
  flex: 1;
  padding: 10px 10px;
  font-size: 0.8rem;
  font-family: 'Space Mono', 'SimHei', monospace;
  box-shadow: 2px 2px 0px var(--text-primary);
}
.mini-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0px 0px 0px var(--text-primary);
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

@keyframes overlay-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.terminal-chassis {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: var(--card-background);
  border: 4px solid var(--text-primary);
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
  font-size: 12px;
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
  font-family: 'Space Mono', 'SimHei', monospace;
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

.danger-btn {
  color: #FF2A2A;
  border-color: #FF2A2A;
  box-shadow: 3px 3px 0px #FF2A2A;
}

.danger-btn:active {
  box-shadow: 0px 0px 0px #FF2A2A;
}

/* ================= 移动端响应式调整 ================= */
@media (max-width: 480px) {
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
  
  .blueprint-screen {
    flex: 1;
    height: auto;
    min-height: 0;
  }
  
  .terminal-trigger-bar {
    margin: 5px 0;
  }

  .flex-column-mobile {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 10px;
  }
  
  .instrument-chassis,
  .terminal-chassis {
    padding: 15px;
    border-radius: 12px;
  }
  
  .blueprint-screen {
    height: 480px;
  }
  
  .terminal-chassis {
    min-height: 480px;
  }

  .mech-btn {
    padding: 12px 20px;
    font-size: 1rem;
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
    gap: 30px;
    align-items: stretch;
  }
  
  .brand-plate {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    border-bottom: 2px dashed rgba(0, 255, 65, 0.4);
    padding-bottom: 15px;
  }

  .blueprint-screen {
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

  .control-bar {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    padding: 30px 20px;
  }

  .sound-toggle-btn {
    width: 100%;
    padding: 15px;
  }
}
</style>
