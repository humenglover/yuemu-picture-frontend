<template>
  <div class="yuemu-vintage-calculator-page" :class="{ 'dark-theme': isDark }">
    <div class="calc-chassis">

      <div class="calc-branding">
        <div class="brand-text">
          <span class="model-name">PRO-CALC</span>
          <span class="model-number">{{ t('pages.tools.calculatorPage.v3Scientific') }}</span>
        </div>
        <button class="history-toggle" @click="showHistory = !showHistory" :class="{ 'active': showHistory }" :title="t('pages.tools.calculatorPage.viewHistoryReceipt')">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
        </button>
      </div>

      <div class="screen-bezel">
        <div class="lcd-screen">
          <div class="expression-line">
            <span v-for="(char, i) in displayExpression" :key="i"
                  :class="{ 'op-text': isOperator(char) }">
              {{ char }}
            </span>
            <span class="cursor">_</span>
          </div>
          <div class="result-line">{{ realTimeResult }}</div>
        </div>
      </div>

      <div class="mechanical-keypad">
        <div class="sci-row">
          <button class="v-key v-key-sci" @click="append('sin(')">sin</button>
          <button class="v-key v-key-sci" @click="append('cos(')">cos</button>
          <button class="v-key v-key-sci" @click="append('log(')">log</button>
          <button class="v-key v-key-sci" @click="append('^')">xʸ</button>
          <button class="v-key v-key-sci" @click="append('Math.PI')">π</button>
        </div>

        <div class="main-grid">
          <button class="v-key v-key-func" @click="clearAll">AC</button>
          <button class="v-key v-key-func" @click="backspace">DEL</button>
          <button class="v-key v-key-op" @click="append('(')">(</button>
          <button class="v-key v-key-op" @click="append(')')">)</button>

          <button class="v-key v-key-num" v-for="num in ['7','8','9']" :key="num" @click="append(num)">{{ num }}</button>
          <button class="v-key v-key-op" @click="append('/')">÷</button>

          <button class="v-key v-key-num" v-for="num in ['4','5','6']" :key="num" @click="append(num)">{{ num }}</button>
          <button class="v-key v-key-op" @click="append('*')">×</button>

          <button class="v-key v-key-num" v-for="num in ['1','2','3']" :key="num" @click="append(num)">{{ num }}</button>
          <button class="v-key v-key-op" @click="append('-')">-</button>

          <button class="v-key v-key-num zero-key" @click="append('0')">0</button>
          <button class="v-key v-key-num" @click="append('.')">.</button>
          <button class="v-key v-key-op" @click="append('+')">+</button>

          <button class="v-key v-key-equal" @click="confirmCalculate">=</button>
        </div>
      </div>

      <Transition name="paper-slide">
        <div v-show="showHistory" class="paper-roll-history">
          <div class="paper-header">
            <span>{{ t('pages.tools.calculatorPage.calcReceipt') }}</span>
            <button class="close-paper-btn" @click="showHistory = false" title="Close">×</button>
          </div>
          <div class="history-list">
            <div v-if="history.length === 0" class="empty-state">{{ t('pages.tools.calculatorPage.blankReceipt') }}</div>
            <div v-for="(item, i) in history" :key="i" class="history-item" @click="reuseHistory(item)">
              <div class="h-expr">{{ item.expr }}</div>
              <div class="h-res">{{ item.res }}</div>
            </div>
          </div>
          <div class="paper-jagged-edge"></div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, computed, watch } from 'vue';

// 假设 isDark 通过外部注入或 store 控制，这里保持你的 ref 结构
const isDark = ref(false);
const expression = ref('');
const history = ref<{expr: string, res: string}[]>([]);
const showHistory = ref(false);

const isOperator = (char: string) => ['+', '-', '×', '÷', '(', ')', '^'].includes(char);

const displayExpression = computed(() => {
  return expression.value
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/Math\.PI/g, 'π')
    .split('');
});

const realTimeResult = ref('0');

const safeEval = (str: string) => {
  if (!str) return '0';
  try {
    let context = str
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/\^/g, '**');

    const leftCount = (context.match(/\(/g) || []).length;
    const rightCount = (context.match(/\)/g) || []).length;
    if (leftCount > rightCount) context += ')'.repeat(leftCount - rightCount);

    const res = Function(`"use strict"; return (${context})`)();
    if (isNaN(res) || !isFinite(res)) return 'Error';
    return Number.isInteger(res) ? res.toString() : res.toFixed(6).replace(/\.?0+$/, '');
  } catch { return '...'; }
};

watch(expression, (v) => { realTimeResult.value = safeEval(v); });

const append = (v: string) => { expression.value += v; };
const clearAll = () => { expression.value = ''; };
const backspace = () => { expression.value = expression.value.slice(0, -1); };
const confirmCalculate = () => {
  const res = safeEval(expression.value);
  if (res !== 'Error' && res !== '...') {
    history.value.unshift({ expr: expression.value, res });
    expression.value = res;
    if (history.value.length > 20) history.value.pop();
  }
};
const reuseHistory = (item: any) => {
  expression.value = item.res;
  showHistory.value = false;
};
</script>

<style scoped>
/* 定义组件专属的复古变量（受外部明暗主题类名控制） */
.yuemu-vintage-calculator-page {
  --calc-chassis-bg: #e2dfd8;
  --calc-chassis-border: #b8b5ac;
  --calc-chassis-shadow: 10px 15px 30px rgba(0, 0, 0, 0.15), inset 2px 2px 5px #ffffff;

  --lcd-bg: #9eb798;
  --lcd-text: #2b3a2a;
  --lcd-shadow: inset 2px 3px 6px rgba(0, 0, 0, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 0.5);

  --key-bg: #f4f2ed;
  --key-text: #4a4543;
  --key-border: #dcd8cf;
  --key-shadow: 0 4px 0 #c4bfb4, 0 5px 5px rgba(0,0,0,0.1);
  --key-active-shadow: 0 0px 0 #c4bfb4, 0 1px 1px rgba(0,0,0,0.1);

  --key-op-bg: #3b82f6;
  --key-op-text: #ffffff;
  --key-op-shadow: 0 4px 0 #2563eb, 0 5px 5px rgba(59, 130, 246, 0.2);

  --key-func-bg: #ef4444;
  --key-func-text: #ffffff;
  --key-func-shadow: 0 4px 0 #dc2626, 0 5px 5px rgba(239, 68, 68, 0.2);

  --paper-bg: #fdfbf7;
  --paper-text: #5d4037;
  --paper-border: rgba(187, 146, 94, 0.3);

  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--background);
  transition: background-color 0.3s ease;
  padding: 20px;
  font-family: var(--font-family-base);
}

/* 暗色主题变量覆写 */
.yuemu-vintage-calculator-page.dark-theme,
@media (prefers-color-scheme: dark) { .yuemu-vintage-calculator-page {
  --calc-chassis-bg: #2a2c30;
  --calc-chassis-border: #1a1b1d;
  --calc-chassis-shadow: 10px 15px 40px rgba(0, 0, 0, 0.5), inset 2px 2px 5px rgba(255, 255, 255, 0.05);

  --lcd-bg: #141714;
  --lcd-text: #4ade80; /* 霓虹绿 */
  --lcd-shadow: inset 2px 3px 8px rgba(0, 0, 0, 0.6), 0 0 10px rgba(74, 222, 128, 0.1);

  --key-bg: #383a40;
  --key-text: #e2e8f0;
  --key-border: #2d2f34;
  --key-shadow: 0 4px 0 #202225, 0 5px 5px rgba(0,0,0,0.3);
  --key-active-shadow: 0 0px 0 #202225, 0 1px 1px rgba(0,0,0,0.3);

  --key-op-bg: #1e3a8a;
  --key-op-shadow: 0 4px 0 #172554, 0 5px 5px rgba(0,0,0,0.3);

  --key-func-bg: #991b1b;
  --key-func-shadow: 0 4px 0 #7f1d1d, 0 5px 5px rgba(0,0,0,0.3);

  --paper-bg: #252321;
  --paper-text: #e8d9c4;
  --paper-border: #4a4138;
} }

/* 计算器外壳机身 */
.calc-chassis {
  width: 100%;
  max-width: 400px;
  background-color: var(--calc-chassis-bg);
  border: 1px solid var(--calc-chassis-border);
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--calc-chassis-shadow);
  position: relative;
  transition: all 0.3s ease;
}

/* 顶部铭牌 */
.calc-branding {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.brand-text { display: flex; flex-direction: column; }
.model-name {
  font-family: Impact, "Arial Black", sans-serif;
  font-size: 18px;
  letter-spacing: 1px;
  color: var(--text-primary);
  opacity: 0.8;
}
.model-number {
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 2px;
  color: var(--text-secondary);
}

.history-toggle {
  background: transparent;
  border: 2px solid var(--text-secondary);
  color: var(--text-secondary);
  border-radius: 6px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.6;
}
.history-toggle:hover, .history-toggle.active {
  opacity: 1;
  background: var(--text-secondary);
  color: var(--calc-chassis-bg);
}

/* LCD 显示屏边框及屏幕 */
.screen-bezel {
  background-color: #1a1a1a;
  padding: 8px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 1px rgba(255,255,255,0.2);
}

.lcd-screen {
  background-color: var(--lcd-bg);
  box-shadow: var(--lcd-shadow);
  border-radius: 6px;
  padding: 16px 12px;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: right;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
/* 屏幕防眩光反光条 */
.lcd-screen::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 40%);
  pointer-events: none;
}

.expression-line {
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  color: var(--lcd-text);
  opacity: 0.8;
  word-wrap: break-word;
  min-height: 20px;
}

.result-line {
  font-family: 'Courier New', Courier, monospace;
  font-size: clamp(32px, 8vw, 42px);
  font-weight: bold;
  color: var(--lcd-text);
  letter-spacing: -1px;
}

.op-text { opacity: 0.6; margin: 0 2px; }
.cursor { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* 机械键盘区 */
.mechanical-keypad {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部科学计算小按钮 */
.sci-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.v-key-sci {
  flex: 1;
  height: 38px;
  font-size: 13px;
  border-radius: 6px;
}

/* 主键盘区 */
.main-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 14px;
}

/* 机械按键基础样式 */
.v-key {
  border: 1px solid var(--key-border);
  background-color: var(--key-bg);
  color: var(--key-text);
  font-family: 'Arial', sans-serif;
  font-weight: bold;
  font-size: 18px;
  height: 52px;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  box-shadow: var(--key-shadow);
  transform: translateY(0);
  transition: transform 0.1s cubic-bezier(0.0, 0.0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.0, 0.0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
.v-key:active {
  transform: translateY(4px);
  box-shadow: var(--key-active-shadow);
}

/* 按键修饰色 */
.v-key-op {
  background-color: var(--key-op-bg);
  color: var(--key-op-text);
  box-shadow: var(--key-op-shadow);
  border-color: transparent;
  font-size: 22px;
}
.v-key-func {
  background-color: var(--key-func-bg);
  color: var(--key-func-text);
  box-shadow: var(--key-func-shadow);
  border-color: transparent;
  font-size: 16px;
}
.v-key-equal {
  grid-column: span 4;
  background-color: var(--key-op-bg);
  color: var(--key-op-text);
  box-shadow: var(--key-op-shadow);
  border-color: transparent;
  height: 56px;
  font-size: 24px;
  margin-top: 4px;
}

/* 打印纸卷样式历史记录 */
.paper-roll-history {
  position: absolute;
  top: -10px; /* 从顶部弹出 */
  left: 30px;
  right: 30px;
  height: 380px;
  background-color: var(--paper-bg);
  border: 1px solid var(--paper-border);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 20px 15px;
  font-family: 'Courier New', Courier, monospace; /* 打印机字体 */
  border-radius: 4px 4px 0 0;
}

.paper-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  color: var(--paper-text);
  border-bottom: 2px dashed var(--paper-border);
  padding-bottom: 10px;
  margin-bottom: 15px;
  font-weight: bold;
  letter-spacing: 1px;
}

.close-paper-btn {
  position: absolute;
  right: 0;
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  color: var(--paper-border);
  cursor: pointer;
  padding: 0 5px;
  transition: color 0.2s;
}

.close-paper-btn:hover {
  color: #e74c3c;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
}
/* 自定义滚动条隐去或复古化 */
.history-list::-webkit-scrollbar { width: 4px; }
.history-list::-webkit-scrollbar-thumb { background: var(--paper-border); }

.history-item {
  padding: 8px 0;
  border-bottom: 1px dashed rgba(187, 146, 94, 0.2);
  cursor: pointer;
  text-align: right;
}
.history-item:hover { background-color: rgba(0,0,0,0.03); }
.h-expr { font-size: 12px; color: var(--paper-text); opacity: 0.7; }
.h-res { font-size: 16px; font-weight: bold; color: var(--paper-text); margin-top: 4px; }
.empty-state { text-align: center; color: var(--paper-text); opacity: 0.5; margin-top: 40px; }

/* 纸张底部锯齿效果 */
.paper-jagged-edge {
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 10px;
  background-image: radial-gradient(circle at 5px 0, transparent 6px, var(--paper-bg) 6px);
  background-size: 10px 10px;
  background-repeat: repeat-x;
}

/* 动画 */
.paper-slide-enter-active, .paper-slide-leave-active { transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.3s; }
.paper-slide-enter-from, .paper-slide-leave-to { transform: translateY(-100%); opacity: 0; }

/* ===== 移动端专门适配 ===== */
@media screen and (max-width: 480px) {
  .yuemu-vintage-calculator-page { padding: 10px; align-items: flex-start; display: flex;
    justify-content: center; /* 水平居中 */
    align-items: center;     /* 垂直居中 */

    /* 使用 dvh (Dynamic Viewport Height) 适配移动端浏览器工具栏 */
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;

    background-color: var(--background);
    transition: background-color 0.3s ease;
    padding: 20px;
    box-sizing: border-box; /* 确保 padding 不撑开容器 */}

  .calc-chassis {
    padding: 16px;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }

  .main-grid { gap: 10px; }

  .v-key { height: 48px; font-size: 16px; }
  .v-key-op { font-size: 20px; }
  .v-key-equal { height: 50px; margin-top: 0; }
  .v-key-sci { height: 34px; font-size: 12px; }

  .lcd-screen { min-height: 90px; padding: 12px 10px; }
  .result-line { font-size: clamp(28px, 10vw, 36px); }

  .paper-roll-history { left: 15px; right: 15px; height: 320px; }
}
</style>
