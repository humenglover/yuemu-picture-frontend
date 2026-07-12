<template>
  <div class="yuemu-vintage-tool-page">
    <div class="radar-chassis">
      <div class="screw top-left"></div>
      <div class="screw top-right"></div>
      <div class="screw bottom-left"></div>
      <div class="screw bottom-right"></div>

      <div class="brand-plate">
        <span class="model-name">{{ t('pages.tools.gridRuler.tacticalRadarT13') }}</span>
        <div class="status-indicator">
          <div class="led-light" :class="{ active: isTracking }"></div>
          <span>{{ t('pages.tools.gridRuler.trackingStatus') }}</span>
        </div>
      </div>

      <div
        class="radar-screen"
        ref="screenRef"
        @mousemove="onMouseMove"
        @mousedown="onMouseDown"
        @mouseleave="onMouseLeave"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
      >
        <div class="scanlines"></div>
        <div class="crt-flicker"></div>

        <div class="radar-sweep" v-show="radarActive"></div>

        <div
          class="grid-overlay"
          :style="{ backgroundSize: `${gridSize}px ${gridSize}px` }"
        ></div>

        <template v-if="isTracking">
          <div class="crosshair-x" :style="{ top: `${mouseY}px` }"></div>
          <div class="crosshair-y" :style="{ left: `${mouseX}px` }"></div>
        </template>

        <svg v-if="isMeasuring" class="measure-svg">
          <line
            :x1="startX" :y1="startY"
            :x2="mouseX" :y2="mouseY"
            stroke="#4ade80"
            stroke-width="2"
            stroke-dasharray="6,4"
          />
          <circle :cx="startX" :cy="startY" r="5" fill="#4ade80" />
          <circle :cx="startX" :cy="startY" r="12" stroke="#4ade80" stroke-width="1" fill="none" />
          <circle :cx="mouseX" :cy="mouseY" r="3" fill="#4ade80" />
        </svg>

        <div class="hud-panel top-left">
          <div class="hud-title">{{ t('pages.tools.gridRuler.realTimeCoordinates') }}</div>
          <div>{{ t('pages.tools.gridRuler.mouseX', { x: mouseX.toFixed(0) }) }}</div>
          <div>{{ t('pages.tools.gridRuler.mouseY', { y: mouseY.toFixed(0) }) }}</div>
        </div>

        
        <div class="hud-panel bottom-right" v-if="isMeasuring">
          <div class="hud-title">{{ t('pages.tools.gridRuler.measurementData') }}</div>
          <div>{{ t('pages.tools.gridRuler.startXY', { x: (startX || 0).toFixed(0), y: (startY || 0).toFixed(0) }) }}</div>
          <div class="highlight-text">{{ t('pages.tools.gridRuler.distanceStr', { d: distance.toFixed(1) }) }}</div>
        </div>

        <div class="center-prompt" v-if="!isTracking && !isMeasuring">
          {{ t('pages.tools.gridRuler.clickSetStartPoint') }}
        </div>
      </div>

      <div class="control-panel">
        <div class="control-group">
          <label>{{ t('pages.tools.gridRuler.gridDensity') }}</label>
          <div class="button-row">
            <button class="mech-btn" :class="{ active: gridSize === 20 }" @click="gridSize = 20">{{ t('pages.tools.gridRuler.high') }}</button>
            <button class="mech-btn" :class="{ active: gridSize === 50 }" @click="gridSize = 50">{{ t('pages.tools.gridRuler.medium') }}</button>
            <button class="mech-btn" :class="{ active: gridSize === 100 }" @click="gridSize = 100">{{ t('pages.tools.gridRuler.low') }}</button>
          </div>
        </div>

        <div class="control-group">
          <label>{{ t('pages.tools.gridRuler.radarScan') }}</label>
          <button class="mech-btn toggle-btn" :class="{ active: radarActive }" @click="radarActive = !radarActive">
            {{ radarActive ? t('pages.tools.gridRuler.running') : t('pages.tools.gridRuler.closed') }}
          </button>
        </div>

        <div class="control-group">
          <label>{{ t('pages.tools.gridRuler.measurementCommand') }}</label>
          <button class="mech-btn danger-btn" @click="resetMeasurement">{{ t('pages.tools.gridRuler.dataReset') }}</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, computed } from 'vue';
const screenRef = ref<HTMLElement | null>(null);

// 坐标与状态
const mouseX = ref(0);
const mouseY = ref(0);
const startX = ref(0);
const startY = ref(0);

const isTracking = ref(false);
const isMeasuring = ref(false);

// 配置项
const gridSize = ref(50);
const radarActive = ref(true);

// 计算坐标 (相对于雷达屏幕容器)
const updateCoordinates = (clientX: number, clientY: number) => {
  if (!screenRef.value) return;
  const rect = screenRef.value.getBoundingClientRect();

  // 计算相对坐标
  let x = clientX - rect.left;
  let y = clientY - rect.top;

  // 边界限制，防止溢出屏幕
  x = Math.max(0, Math.min(x, rect.width));
  y = Math.max(0, Math.min(y, rect.height));

  mouseX.value = x;
  mouseY.value = y;
};

// 勾股定理计算距离
const distance = computed(() => {
  const dx = mouseX.value - startX.value;
  const dy = mouseY.value - startY.value;
  return Math.sqrt(dx * dx + dy * dy);
});

// --- 鼠标事件 ---
const onMouseMove = (e: MouseEvent) => {
  isTracking.value = true;
  updateCoordinates(e.clientX, e.clientY);
};

const onMouseLeave = () => {
  isTracking.value = false;
};

// --- 触摸事件 (移动端支持) ---
const onTouchMove = (e: TouchEvent) => {
  isTracking.value = true;
  if (e.touches.length > 0) {
    updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
  }
};

// --- 核心交互：设置起点 ---
const setStartPoint = (clientX: number, clientY: number) => {
  updateCoordinates(clientX, clientY);
  isMeasuring.value = true;
  startX.value = mouseX.value;
  startY.value = mouseY.value;
};

const onMouseDown = (e: MouseEvent) => {
  setStartPoint(e.clientX, e.clientY);
};

const onTouchStart = (e: TouchEvent) => {
  isTracking.value = true;
  if (e.touches.length > 0) {
    setStartPoint(e.touches[0].clientX, e.touches[0].clientY);
  }
};

// 重置状态
const resetMeasurement = () => {
  isMeasuring.value = false;
  startX.value = 0;
  startY.value = 0;
};
</script>

<style scoped>
/* 引入等宽字体强化军工/科幻感 */
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

.yuemu-vintage-tool-page {
  /* 移动端友好 & 垂直居中 */
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

/* 仪器主体外壳 */
.radar-chassis {
  position: relative;
  width: 100%;
  max-width: 800px;
  background: var(--card-background);
  border: 4px solid var(--text-primary);
  border-radius: 12px;
  padding: 25px;
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
  padding-top: 5px;
}

.model-name {
  font-family: 'Space Mono', 'SimHei', monospace;
  font-weight: 900;
  font-size: 1.2rem;
  letter-spacing: 2px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'SimHei', monospace;
  font-weight: bold;
  font-size: 0.9rem;
}

.led-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #666;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
  transition: all 0.2s;
}
.led-light.active {
  background-color: #4ade80;
  box-shadow: 0 0 10px #4ade80, inset 0 0 5px #fff;
}

/* ================= 雷达显示屏区域 ================= */
.radar-screen {
  position: relative;
  width: 100%;
  height: 400px;
  background-color: #051008; /* 深军绿色背景 */
  border: 4px solid var(--text-primary);
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
  /* 禁止移动端手势滑动引发页面滚动 */
  touch-action: none;
  box-shadow: inset 0 0 30px rgba(0, 255, 0, 0.1);
}

/* 网格层 */
.grid-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    linear-gradient(rgba(74, 222, 128, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 222, 128, 0.2) 1px, transparent 1px);
  background-position: center center;
  z-index: 1;
  pointer-events: none;
  transition: background-size 0.3s ease;
}

/* 扫描线与闪烁滤镜 */
.scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(
    rgba(18, 16, 16, 0) 50%,
    rgba(0, 0, 0, 0.3) 50%
  );
  background-size: 100% 4px;
  z-index: 10;
  pointer-events: none;
}
.crt-flicker {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(74, 222, 128, 0.02);
  z-index: 11;
  pointer-events: none;
  animation: flicker 0.15s infinite;
}
@keyframes flicker {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.9; }
}

/* 旋转扫描动画 */
.radar-sweep {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 150%;
  height: 150%;
  background: conic-gradient(
    from 0deg,
    transparent 70%,
    rgba(74, 222, 128, 0.05) 90%,
    rgba(74, 222, 128, 0.4) 100%
  );
  transform-origin: center;
  transform: translate(-50%, -50%) rotate(0deg);
  animation: sweep 4s linear infinite;
  border-radius: 50%;
  z-index: 2;
  pointer-events: none;
}
@keyframes sweep {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* 十字瞄准线 */
.crosshair-x, .crosshair-y {
  position: absolute;
  background-color: #4ade80;
  z-index: 5;
  pointer-events: none;
  box-shadow: 0 0 5px #4ade80;
}
.crosshair-x {
  left: 0;
  width: 100%;
  height: 1px;
}
.crosshair-y {
  top: 0;
  height: 100%;
  width: 1px;
}

/* 测量连线 SVG */
.measure-svg {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 6;
  pointer-events: none;
}

/* HUD 数据显示面板 */
.hud-panel {
  position: absolute;
  background: rgba(5, 16, 8, 0.8);
  border: 1px solid #4ade80;
  padding: 10px;
  color: #4ade80;
  font-family: 'Space Mono', 'Consolas', monospace;
  font-size: 0.85rem;
  z-index: 20;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.2);
  border-radius: 4px;
}
.hud-panel.top-left {
  top: 15px;
  left: 15px;
}
.hud-panel.bottom-right {
  bottom: 15px;
  right: 15px;
  text-align: right;
}
.hud-title {
  font-weight: bold;
  border-bottom: 1px dashed #4ade80;
  margin-bottom: 5px;
  padding-bottom: 3px;
  opacity: 0.8;
}
.highlight-text {
  font-size: 1rem;
  font-weight: bold;
  margin-top: 5px;
  color: #fff;
  text-shadow: 0 0 5px #4ade80;
}

.center-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(74, 222, 128, 0.6);
  font-family: 'SimHei', monospace;
  font-size: 1rem;
  letter-spacing: 2px;
  z-index: 4;
  pointer-events: none;
  animation: pulse-text 2s infinite;
}
@keyframes pulse-text {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

/* ================= 机械控制面板 ================= */
.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
  background: var(--hover-background);
  border: 2px solid var(--border-color);
  padding: 15px;
  border-radius: 8px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 150px;
}

.control-group label {
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--text-secondary);
}

.button-row {
  display: flex;
  gap: 5px;
}

/* 机械按钮 */
.mech-btn {
  flex: 1;
  padding: 10px;
  background: var(--card-background);
  color: var(--text-primary);
  border: 2px solid var(--text-primary);
  font-family: 'SimHei', sans-serif;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 2px 2px 0px var(--text-primary);
  transition: all 0.1s;
}

.mech-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 0px 0px 0px var(--text-primary);
}

.mech-btn.active {
  background: var(--text-primary);
  color: var(--background);
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px var(--text-primary);
}

/* 危险/警告操作按钮 */
.danger-btn {
  color: #d32f2f;
  border-color: #d32f2f;
  box-shadow: 2px 2px 0px #d32f2f;
}
.danger-btn:hover {
  background: #ffebee;
}
.danger-btn:active {
  box-shadow: 0px 0px 0px #d32f2f;
}

/* 移动端适配 */
@media (max-width: 600px) {
  .radar-chassis {
    padding: 15px;
    gap: 15px;
  }
  .radar-screen {
    height: 300px;
  }
  .hud-panel {
    font-size: 0.75rem;
    padding: 8px;
  }
  .highlight-text {
    font-size: 0.9rem;
  }
  .center-prompt {
    font-size: 0.85rem;
  }
}
</style>
