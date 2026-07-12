<template>
  <div class="yuemu-retro-color-station">
    <div class="hardware-chassis">

      <div class="crt-monitor" :style="{ '--active-color': currentColorWithAlpha }">
        <div class="screen-glass">
          <div class="scanlines"></div>
          <div class="color-preview" :style="{ backgroundColor: currentColorWithAlpha }"></div>
          <div class="osd-info" :class="{ 'text-dark': !isDarkColor, 'text-light': isDarkColor }">
            <div class="color-value">{{ currentColorString }}</div>
            <div class="mode-badge">{{ t('pages.tools.colorPickerPage.sysMode') }}{{ currentFormat }}</div>
          </div>
        </div>
      </div>

      <div class="control-deck">

        <div class="fader-bank">
          <div v-for="channel in ['r', 'g', 'b']" :key="channel" class="fader-channel">
            <div class="fader-label">{{ channel.toUpperCase() }}</div>
            <div class="fader-track-wrapper">
              <input type="range" v-model="rgb[channel]" min="0" max="255" class="fader-slider" :class="`slider-${channel}`" />
            </div>
            <input type="number" v-model="rgb[channel]" class="fader-readout" />
          </div>

          <div class="fader-channel alpha-channel">
            <div class="fader-label">ALP</div>
            <div class="fader-track-wrapper">
              <input type="range" v-model="alpha" min="0" max="100" class="fader-slider slider-alpha" />
            </div>
            <input type="number" v-model="alpha" class="fader-readout" />
          </div>
        </div>

        <div class="command-center">
          <div class="action-grid">
            <button @click="randomColor" class="tactile-btn btn-primary">{{ t('pages.tools.colorPickerPage.rndm') }}</button>
            <button @click="invertColor" class="tactile-btn btn-secondary">{{ t('pages.tools.colorPickerPage.invt') }}</button>
            <button @click="copyCurrentColor" class="tactile-btn btn-accent">{{ t('pages.tools.colorPickerPage.copy') }}</button>
            <button @click="resetColor" class="tactile-btn btn-danger">{{ t('pages.tools.colorPickerPage.rset') }}</button>
          </div>

          <div class="memory-bank">
            <div class="bank-label">{{ t('pages.tools.colorPickerPage.memoryBank') }}</div>
            <div class="led-array">
              <button
                v-for="(color, i) in colorHistory"
                :key="i"
                class="led-indicator"
                :style="{ '--led-color': color }"
                @click="loadFromHistory(color)"
                title="Load from memory"
              ></button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 颜色状态
const rgb = reactive({ r: 128, g: 128, b: 128 })
const alpha = ref(100)

// 初始提供一些默认的主题色彩，存入记忆库
const colorHistory = ref([
  'rgba(255, 77, 79, 1)',   // 红
  'rgba(82, 196, 26, 1)',   // 绿
  'rgba(64, 169, 255, 1)',  // 蓝
  'rgba(234, 179, 8, 1)',   // 黄
  'rgba(236, 72, 153, 1)',  // 粉红
  'rgba(255, 255, 255, 1)'  // 白
])

// 动态计算带透明度的 RGBA 字符串
const currentColorWithAlpha = computed(() => {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.value / 100})`
})

// 格式判定：透明度100时使用HEX，否则显示RGBA
const currentFormat = computed(() => {
  return alpha.value === 100 ? 'HEX' : 'RGBA'
})

// LCD屏幕展示的字符值
const currentColorString = computed(() => {
  if (alpha.value === 100) {
    const toHex = (n) => {
      const hex = Number(n).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
  }
  return currentColorWithAlpha.value
})

// 灰度计算：判断当前颜色是否为深色，用于切换屏幕文字亮暗色
const isDarkColor = computed(() => {
  // 基于人眼感知的亮度公式 (YIQ)
  const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  // 如果透明度太低（非常透明），也视为需要显示深色字
  return luminance < 128 && alpha.value > 50
})

// --- 核心方法 ---

const randomColor = () => {
  rgb.r = Math.floor(Math.random() * 256)
  rgb.g = Math.floor(Math.random() * 256)
  rgb.b = Math.floor(Math.random() * 256)
  alpha.value = 100
}

const invertColor = () => {
  rgb.r = 255 - rgb.r
  rgb.g = 255 - rgb.g
  rgb.b = 255 - rgb.b
}

const resetColor = () => {
  rgb.r = 128
  rgb.g = 128
  rgb.b = 128
  alpha.value = 100
}

const copyCurrentColor = async () => {
  try {
    await navigator.clipboard.writeText(currentColorString.value)

    // 如果不在历史记录中，则保存到历史记录，并维持最大容量为 8
    const snapshot = currentColorWithAlpha.value
    if (!colorHistory.value.includes(snapshot)) {
      if (colorHistory.value.length >= 8) {
        colorHistory.value.pop() // 移除最旧的
      }
      colorHistory.value.unshift(snapshot) // 插入最新的
    }
    // 你可以在这里调用一个 Toast 提示 "Copied!"
  } catch (err) {
    console.error('Copy failed: ', err)
  }
}

const loadFromHistory = (colorStr) => {
  // 解析 rgba() 字符串
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (rgbaMatch) {
    rgb.r = parseInt(rgbaMatch[1], 10)
    rgb.g = parseInt(rgbaMatch[2], 10)
    rgb.b = parseInt(rgbaMatch[3], 10)
    alpha.value = rgbaMatch[4] !== undefined ? Math.round(parseFloat(rgbaMatch[4]) * 100) : 100
  }
}
</script>

<style scoped>
/* =========================================
   全局容器 & 响应式基础
========================================= */
.yuemu-retro-color-station {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 20px 15px;
  font-family: 'Courier New', Courier, monospace;
  padding: 10px; align-items: flex-start; display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;     /* 垂直居中 */

  /* 使用 dvh (Dynamic Viewport Height) 适配移动端浏览器工具栏 */
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;

  background-color: var(--background);
  transition: background-color 0.3s ease;
  padding: 20px;
  box-sizing: border-box; /* 确保 padding 不撑开容器 */
}

/* =========================================
   硬件外壳 (完美接入全局暗/亮色主题变量)
========================================= */
.hardware-chassis {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 680px;
  box-shadow:
    0 12px 35px var(--shadow-color),
    inset 0 2px 0 rgba(255,255,255,0.08); /* 顶部边缘高光 */
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: var(--theme-transition);
}

/* =========================================
   CRT 监视器 (屏幕展示区)
========================================= */
.crt-monitor {
  position: relative;
  background: #050505; /* 屏幕底色永远是深色 */
  border-radius: 12px;
  border: 6px solid #1a1a1a;
  box-shadow:
    inset 0 0 30px #000,
    0 5px 15px var(--shadow-color);
  height: 150px;
  overflow: hidden;
}

.screen-glass {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* CRT 扫描线特效 */
.scanlines {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
    linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.04));
  background-size: 100% 4px, 3px 100%;
  pointer-events: none;
  z-index: 2;
}

.color-preview {
  position: absolute;
  inset: 0;
  z-index: 0;
  transition: background-color 0.15s ease;
}

.osd-info {
  position: relative;
  z-index: 1;
  text-align: center;
  transition: color 0.15s ease, text-shadow 0.15s ease;
}

/* 根据颜色亮度自动切换 OSD 字体颜色 */
.osd-info.text-light {
  color: #ffffff;
  text-shadow: 0 0 12px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.8);
}
.osd-info.text-dark {
  color: #111111;
  text-shadow: 0 0 12px rgba(0,0,0,0.3), 0 2px 4px rgba(255,255,255,0.4);
}

.color-value {
  font-size: clamp(1.8rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: 2px;
}
.mode-badge {
  font-size: 0.9rem;
  opacity: 0.8;
  letter-spacing: 3px;
  margin-top: 8px;
  font-weight: bold;
}

/* =========================================
   中控台布局 (网格适配移动端)
========================================= */
.control-deck {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 20px;
}

@media (max-width: 700px) {
  .control-deck {
    grid-template-columns: 1fr; /* 移动端垂直堆叠 */
  }
}

/* =========================================
   推子通道 (取代原先难用的竖向滑块)
========================================= */
.fader-bank {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--hover-background); /* 融入主题 */
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: var(--theme-transition);
}

.fader-channel {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fader-label {
  width: 36px;
  font-weight: bold;
  color: var(--text-primary);
  font-size: 14px;
}

.fader-track-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

/* 定制复古滑块 */
.fader-slider {
  -webkit-appearance: none;
  width: 100%;
  background: transparent;
  margin: 0;
}
.fader-slider:focus { outline: none; }
.fader-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
  background: #111; /* 滑槽颜色 */
  border-radius: 4px;
  border: 1px solid #333;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
}
.fader-slider::-webkit-slider-thumb {
  height: 24px;
  width: 18px;
  border-radius: 4px;
  background: var(--text-primary); /* 推子主色跟随主题 */
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -10px; /* (Track_height - Thumb_height)/2 */
  box-shadow: 0 3px 6px rgba(0,0,0,0.4), inset 0 2px 2px rgba(255,255,255,0.2);
  transition: transform 0.1s;
}
.fader-slider::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

/* 通道推子颜色标识 (融入些许赛博/RGB感) */
.slider-r::-webkit-slider-thumb { border-bottom: 3px solid #ff4d4f; }
.slider-g::-webkit-slider-thumb { border-bottom: 3px solid #52c41a; }
.slider-b::-webkit-slider-thumb { border-bottom: 3px solid #40a9ff; }
.slider-alpha::-webkit-slider-thumb { border-bottom: 3px solid var(--text-secondary); }

/* 数码管输入框 */
.fader-readout {
  width: 55px;
  height: 32px;
  background: #0f1011;
  color: #00ff41; /* 复古终端绿 */
  border: 2px solid #222;
  border-radius: 6px;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 14px;
  padding: 0;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
  -moz-appearance: textfield;
}
/* 隐藏数字输入框的上下箭头 */
.fader-readout::-webkit-outer-spin-button,
.fader-readout::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.fader-readout:focus {
  outline: none;
  border-color: #00ff41;
  box-shadow: 0 0 8px rgba(0,255,65,0.3);
}

/* =========================================
   指令矩阵 (机械按键)
========================================= */
.command-center {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.tactile-btn {
  background: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-bottom: 5px solid var(--border-color);
  border-radius: 8px;
  padding: 14px 10px;
  font-weight: bold;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.1s;
  text-transform: uppercase;
  box-shadow: 0 4px 6px var(--shadow-color);
}

/* 按压物理反馈 */
.tactile-btn:active {
  transform: translateY(4px);
  border-bottom-width: 1px;
  margin-bottom: 4px;
  box-shadow: 0 1px 2px var(--shadow-color);
}

.btn-primary { color: #eab308; } /* 警告黄 */
.btn-secondary { color: var(--link-color); } /* 主题蓝 */
.btn-accent { color: #ec4899; } /* 霓虹粉 */
.btn-danger { color: #ef4444; } /* 危险红 */

/* =========================================
   记忆库 (LED 灯阵列)
========================================= */
.memory-bank {
  background: var(--hover-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: var(--theme-transition);
}

.bank-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  letter-spacing: 1px;
  text-align: center;
  font-weight: bold;
}

.led-array {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  align-items: flex-start;
}

.led-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--led-color);
  border: 2px solid #111;
  box-shadow:
    0 0 10px var(--led-color),
    inset 0 3px 4px rgba(255,255,255,0.4); /* 玻璃反光感 */
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 0;
}

.led-indicator:hover {
  transform: scale(1.25);
}
</style>
