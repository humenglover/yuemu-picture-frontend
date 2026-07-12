<template>
  <div class="yuemu-retro-lab-body" :class="{ 'dark-theme': isDark }">
    <div class="crt-overlay"></div>

    <div class="terminal-chassis">
      <header class="chassis-header">
        <div class="brand-area">
          <div class="logo">{{ t('pages.tools.randomPage.randomLabel') }}</div>
          <div class="model-info">
            <span class="m-num">{{ t('pages.tools.randomPage.modelRT2026') }}</span>
            <span class="m-desc">{{ t('pages.tools.randomPage.highEntropyGenerator') }}</span>
          </div>
        </div>
        <div class="power-toggle" @click="toggleTheme">
          <span class="toggle-label">{{ isDark ? t('pages.tools.randomPage.darkMode') : t('pages.tools.randomPage.lightMode') }}</span>
          <div class="toggle-switch" :class="{ on: isDark }">
            <div class="switch-handle"></div>
          </div>
        </div>
      </header>

      <main class="main-console">
        <section class="screen-module">
          <div class="screen-bezel">
            <div class="screen-content">
              <div class="crt-glow"></div>
              <div class="data-view" :class="{ flickering: isAnimating }">
                <template v-if="currentMode === 'single'">
                  <div class="lcd-big-num">{{ result || '000' }}</div>
                </template>
                <template v-else-if="currentMode === 'list'">
                  <div class="terminal-text">
                    <p class="prompt">{{ t('pages.tools.randomPage.systemReadyMsg') }}</p>
                    <p class="prompt">{{ t('pages.tools.randomPage.readingDatabase') }}</p>
                    <h2 v-if="result" class="winner-flash">>> {{ result[0] }}</h2>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div class="status-leds">
            <div class="led red" :class="{ active: isAnimating }"><span>{{ t('pages.tools.randomPage.calculating') }}</span></div>
            <div class="led green" :class="{ active: !isAnimating }"><span>{{ t('pages.tools.randomPage.standbyText') }}</span></div>
          </div>
        </section>

        <aside class="control-bay">
          <div class="bay-section">
            <label class="section-tag">{{ t('pages.tools.randomPage.modeSwitch') }}</label>
            <div class="knob-group">
              <div
                v-for="m in modes" :key="m.value"
                class="knob-option"
                :class="{ active: currentMode === m.value }"
                @click="currentMode = m.value"
              >
                <div class="indicator-dot"></div>
                <span class="opt-label">{{ m.label }}</span>
              </div>
            </div>
          </div>

          <div class="bay-section">
            <label class="section-tag">{{ t('pages.tools.randomPage.paramSetting') }}</label>
            <div class="param-input">
              <span class="prefix">{{ t('pages.tools.randomPage.upperLimit') }}</span>
              <input type="number" v-model="singleMax" class="nixie-input" />
            </div>
          </div>

          <div class="trigger-area">
            <button class="big-red-button" @click="handleGenerate" :disabled="isAnimating">
              <span class="btn-top">{{ t('pages.tools.randomPage.startCalc') }}</span>
            </button>
            <p class="btn-hint">{{ t('pages.tools.randomPage.pressForRandomCalc') }}</p>
          </div>
        </aside>
      </main>

      <footer class="printer-output">
        <div class="paper-feed">
          <div class="paper-edge"></div>
          <div class="print-content">
            <div v-for="(h, i) in history.slice(0, 3)" :key="i" class="log-line">
              * {{ t('pages.tools.randomPage.logLine', { time: h.time, result: h.result }) }}
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref } from 'vue';

const isDark = ref(false);
const isAnimating = ref(false);
const currentMode = ref('single');
const singleMax = ref(100);
const result = ref(null);
const history = ref([]);

const modes = [
  { label: t('pages.tools.randomPage.singleGen'), value: 'single' },
  { label: t('pages.tools.randomPage.listDraw'), value: 'list' }
];

const toggleTheme = () => isDark.value = !isDark.value;

const handleGenerate = () => {
  if (isAnimating.value) return;
  isAnimating.value = true;

  let timer = null;
  let counter = 0;
  
  // 模拟机械演算的跳动感
  timer = setInterval(() => {
    if (currentMode.value === 'single') {
      result.value = Math.floor(Math.random() * (singleMax.value + 1));
    } else {
      result.value = Math.floor(Math.random() * 9999);
    }
    
    counter++;
    if (counter > 20) { // 滚动 20 次
      clearInterval(timer);
      
      // 生成最终结果
      if (currentMode.value === 'single') {
        result.value = Math.floor(Math.random() * (singleMax.value + 1));
      } else {
        result.value = [t('pages.tools.randomPage.zhangSan')]; // 名单逻辑自行扩展
      }
      
      history.value.unshift({
        result: result.value,
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
      });
      isAnimating.value = false;
    }
  }, 40); // 每 40 毫秒跳动一次
};
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Share+Tech+Mono&family=VT323&display=swap');

.yuemu-retro-lab-body {
  /* 基础复古变量 */
  --case-bg: #d4d4d2;
  --case-border: #999;
  --screen-color: #ffb100; /* 琥珀色荧光 */
  --screen-bg: #1a1a1a;
  --text-main: #333;
  --paper-bg: #f5f5f5;

  &.dark-theme {
    --case-bg: #2a2a2a;
    --case-border: #111;
    --screen-color: #00ff41; /* 暗色模式变更为经典的黑客绿 */
    --text-main: #eee;
    --paper-bg: #333;
  }

  width: 100vw;
  min-height: 100vh;
  background: radial-gradient(circle, #444 0%, #111 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Share Tech Mono', 'ZCOOL KuaiLe', sans-serif;
  overflow-x: hidden;
  padding: 15px;
}

/* CRT 扫描线遮罩 */
.crt-overlay {
  position: fixed; inset: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
  background-size: 100% 4px;
  pointer-events: none; z-index: 1000;
}

/* 机械外壳：移动端宽度自适应 */
.terminal-chassis {
  background: var(--case-bg);
  border: 6px solid var(--case-border);
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  padding: 20px;
  box-shadow: 20px 20px 0 rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部铭牌 */
.chassis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--case-border);
  padding-bottom: 12px;

  .brand-area {
    display: flex; gap: 12px;
    .logo {
      font-size: 24px; font-weight: bold; background: #333; color: #fff;
      padding: 4px 8px; border-radius: 4px;
    }
    .model-info {
      .m-num { display: block; font-size: 12px; font-weight: bold; }
      .m-desc { font-size: 10px; opacity: 0.6; }
    }
  }
}

/* 主操作台：核心适配 */
.main-console {
  display: flex;
  flex-direction: column; /* 移动端默认垂直排列 */
  gap: 30px;
}

@media (min-width: 768px) {
  .main-console { flex-direction: row; }
}

/* 屏幕显示模块 */
.screen-module {
  flex: 1.5;
  .screen-bezel {
    background: #111; padding: 12px; border-radius: 10px;
    box-shadow: inset 0 0 20px #000;
  }
  .screen-content {
    background: var(--screen-bg);
    height: 200px; border-radius: 4px;
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #333;
  }
  .data-view {
    color: var(--screen-color);
    font-family: 'VT323', monospace;
    text-shadow: 0 0 12px var(--screen-color);
    text-align: center;
    .lcd-big-num { font-size: 100px; line-height: 1; }
    .terminal-text { font-size: 20px; text-align: left; }
  }
}

/* 物理按钮与居中控制区 */
.control-bay {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center; /* 垂直居中 */

  .bay-section {
    background: rgba(0,0,0,0.05);
    padding: 15px; border-radius: 8px;
    text-align: center; /* 内容居中 */
  }

  .section-tag {
    display: block; font-size: 12px; font-weight: bold;
    margin-bottom: 10px; color: var(--text-main);
    opacity: 0.8;
  }
}

/* 名单/模式选择居中 */
.knob-group {
  display: flex;
  justify-content: center;
  gap: 15px;

  .knob-option {
    cursor: pointer; display: flex; align-items: center; gap: 6px;
    font-size: 14px; color: var(--text-main);

    .indicator-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #999; border: 2px solid rgba(0,0,0,0.1);
    }

    &.active {
      font-weight: bold;
      .indicator-dot { background: var(--screen-color); box-shadow: 0 0 8px var(--screen-color); }
    }
  }
}

/* 核心启动按钮：居中与交互 */
.trigger-area {
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平居中 */
  margin-top: 10px;

  .big-red-button {
    background: #900; border: none; border-radius: 50%;
    width: 90px; height: 90px; padding: 0; cursor: pointer;
    box-shadow: 0 6px 0 #500, 0 10px 20px rgba(0,0,0,0.4);
    transition: all 0.1s;

    .btn-top {
      display: block; width: 100%; height: 100%;
      background: #e74c3c; border-radius: 50%;
      line-height: 90px; color: #fff; font-size: 20px; font-weight: bold;
      border: 3px solid rgba(255,255,255,0.2);
    }

    &:active {
      transform: translateY(4px);
      box-shadow: 0 2px 0 #500, 0 5px 10px rgba(0,0,0,0.4);
    }

    &:disabled { opacity: 0.8; cursor: wait; }
  }

  .btn-hint { font-size: 10px; margin-top: 12px; opacity: 0.5; font-weight: bold; }
}

/* 打印纸效果 */
.printer-output {
  .paper-feed {
    background: var(--paper-bg);
    min-height: 80px; padding: 15px;
    border-radius: 4px; border: 1px solid var(--case-border);
    position: relative;
    box-shadow: inset 0 5px 10px rgba(0,0,0,0.1);

    &::before {
      content: ''; position: absolute; top: -10px; left: 0; right: 0;
      height: 10px; background: repeating-linear-gradient(90deg, transparent, transparent 10px, var(--case-bg) 10px, var(--case-bg) 20px);
    }
  }
  .log-line { font-size: 12px; color: var(--text-main); display: block; margin-bottom: 4px; }
}

/* 拨动开关 */
.toggle-switch {
  width: 50px; height: 26px; background: #bbb;
  border-radius: 13px; position: relative; cursor: pointer;
  .switch-handle {
    width: 20px; height: 20px; background: #fff;
    position: absolute; left: 3px; top: 3px;
    border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: 0.3s cubic-bezier(0.18, 0.89, 0.35, 1.15);
  }
  &.on {
    background: var(--screen-color);
    .switch-handle { left: 27px; }
  }
}

/* 状态灯 */
.status-leds {
  display: flex; gap: 15px; justify-content: center; margin-top: 10px;
  .led {
    display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: bold;
    color: var(--text-main); opacity: 0.4;
    &::before {
      content: ''; width: 8px; height: 8px; border-radius: 50%; background: #555;
    }
    &.active {
      opacity: 1;
      &.red::before { background: #ff4d4f; box-shadow: 0 0 10px #ff4d4f; }
      &.green::before { background: #52c41a; box-shadow: 0 0 10px #52c41a; }
    }
  }
}

/* 动画效果 */
.flickering { animation: flicker 0.15s infinite; }
@keyframes flicker {
  0% { opacity: 0.85; }
  100% { opacity: 1; }
}

/* 输入框优化 */
.nixie-input {
  background: #111; color: var(--screen-color); border: 1px solid #333;
  width: 80px; padding: 4px 8px; font-family: 'VT323'; font-size: 20px;
  text-align: center; border-radius: 4px;
}
</style>
