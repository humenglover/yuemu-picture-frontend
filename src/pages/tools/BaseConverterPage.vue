<template>
  <div class="yuemu-retro-converter-page">
    <div class="vintage-machine">
      <div class="machine-header">
        <div class="screw left-screw">+</div>
        <div class="title-container">
          <h2 class="machine-title">DATA FORMAT CONVERTER</h2>
          <div class="machine-subtitle">SYS-VER. 1.0.4 // REG. NO. 0991</div>
        </div>
        <div class="screw right-screw">+</div>
      </div>

      <div class="machine-panel">

        <div class="control-section">
          <div class="section-label">
            <span class="label-text">{{ t('pages.tools.baseConverterPage.inputSettings') }}</span>
            <div class="dotted-line"></div>
          </div>

          <div class="base-selector">
            <button
              v-for="b in [2, 8, 10, 16]"
              :key="b"
              :class="['retro-btn base-btn', { active: inputBase === b }]"
              @click="setInputBase(b)"
            >
              BASE-{{ b }}
            </button>
          </div>
        </div>

        <div class="screen-section">
          <div class="retro-screen" :class="{ 'has-error': inputError }">
            <div class="screen-glass"></div>
            <div class="scanlines"></div>
            <div class="screen-content">
              <span class="prompt-symbol">></span>
              <input
                ref="inputRef"
                v-model="inputValue"
                @input="handleInput"
                :placeholder="getPlaceholder(inputBase)"
                class="screen-input"
                spellcheck="false"
                autocomplete="off"
              />
            </div>
          </div>
          <div class="error-text" v-if="inputError">
            [ERR]: {{ inputError }}
          </div>
        </div>

        <div class="control-section mt-4">
          <div class="section-label">
            <span class="label-text">{{ t('pages.tools.baseConverterPage.outputResults') }}</span>
            <div class="dotted-line"></div>
          </div>

          <div class="output-grid">
            <div class="output-slot" v-for="base in outputBases" :key="base">
              <div class="slot-header">
                <span class="slot-badge">SYS-{{ base }}</span>
                <button
                  class="retro-btn icon-btn"
                  @click="copyResult(base)"
                  :disabled="!getResult(base) || getResult(base) === '-'"
                  title="Copy to clipboard"
                >
                  <CopyOutlined />
                </button>
              </div>
              <div class="slot-display">
                <div class="slot-value" :class="{ 'long-value': getResult(base).length > 12 }">
                  {{ getResult(base) }}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="machine-footer">
        <button class="retro-btn action-btn" @click="showReferenceTable = true">
          <TableOutlined /> {{ t('pages.tools.baseConverterPage.refTable') }}
        </button>
      </div>
    </div>


      <div v-if="showReferenceTable" class="retro-modal-overlay" @click="showReferenceTable = false">
        <div class="retro-modal-content" @click.stop>
          <div class="modal-header">
            <h3>REFERENCE TABLE . SYS-DATA</h3>
            <button class="close-btn" @click="showReferenceTable = false">✖</button>
          </div>
          <div class="modal-body">
            <div class="retro-table-wrapper">
              <table class="retro-table">
                <thead>
                <tr>
                  <th>DEC (10)</th>
                  <th>BIN (2)</th>
                  <th>OCT (8)</th>
                  <th>HEX (16)</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="n in 16" :key="n-1">
                  <td>{{ n-1 }}</td>
                  <td>{{ (n-1).toString(2).padStart(4, '0') }}</td>
                  <td>{{ (n-1).toString(8) }}</td>
                  <td>{{ (n-1).toString(16).toUpperCase() }}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, computed } from 'vue'
import { CopyOutlined, TableOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const inputBase = ref(10)
const inputValue = ref('')
const inputError = ref('')
const showReferenceTable = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const outputBases = [2, 8, 10, 16]

const getPlaceholder = (base: number) => {
  const examples: Record<number, string> = {
    2: 'e.g. 101011',
    8: 'e.g. 752',
    10: 'e.g. 1024',
    16: 'e.g. A5F2'
  }
  return examples[base]
}

const setInputBase = (b: number) => {
  inputBase.value = b
  // 切换进制时重新验证当前输入
  if (inputValue.value) {
    handleInput()
  }
  inputRef.value?.focus()
}

const validateInput = (value: string, base: number) => {
  value = value.trim()
  if (value === '') return true
  switch (base) {
    case 2: return /^[01]+$/.test(value)
    case 8: return /^[0-7]+$/.test(value)
    case 10: return /^[0-9]+$/.test(value)
    case 16: return /^[0-9A-Fa-f]+$/.test(value)
    default: return false
  }
}

const handleInput = () => {
  const val = inputValue.value
  if (!val || val.trim() === '') {
    inputError.value = ''
    return
  }

  if (!validateInput(val, inputBase.value)) {
    inputError.value = `INVALID FORMAT FOR BASE-${inputBase.value}`
    return
  }

  try {
    const decimal = parseInt(val, inputBase.value)
    if (isNaN(decimal)) {
      inputError.value = 'CORRUPTED DATA'
      return
    }
    if (decimal < 0) {
      inputError.value = 'NEGATIVE VALUES NOT SUPPORTED'
      return
    }
    if (decimal > Number.MAX_SAFE_INTEGER) {
      inputError.value = 'DATA OVERFLOW'
      return
    }
    inputError.value = ''
  } catch (e) {
    inputError.value = 'SYSTEM ERROR'
  }
}

const convertBase = (value: string, fromBase: number, toBase: number): string => {
  if (!value || value.trim() === '' || inputError.value) return '-'
  try {
    const decimal = parseInt(value.trim(), fromBase)
    if (isNaN(decimal) || decimal < 0) return '-'
    return decimal.toString(toBase).toUpperCase()
  } catch {
    return '-'
  }
}

const getResult = (base: number) => {
  return convertBase(inputValue.value, inputBase.value, base)
}

const copyResult = async (base: number) => {
  const result = getResult(base)
  if (result === '-') return

  try {
    await navigator.clipboard.writeText(result)
    message.success(`COPIED BASE-${base} DATA`)
  } catch {
    message.error('COPY FAILED')
  }
}
</script>

<style scoped>
/* 核心复古变量定义 - 利用你网站自带的牛皮纸(kraft)主题 */
.yuemu-retro-converter-page {
  /* 亮色模式变量 */
  --retro-bg: var(--edit-box-kraft-bg, #f5f0e8);
  --retro-border: var(--edit-box-kraft-text, #5d4037);
  --retro-text: var(--edit-box-kraft-text, #5d4037);
  --retro-highlight: #d35400;

  /* 屏幕颜色：老式计算机的幽灵绿 */
  --screen-bg: #111827;
  --screen-text: #4ade80;
  --screen-glow: rgba(74, 222, 128, 0.4);

  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  font-family: 'Courier New', Courier, monospace; /* 强制复古等宽字体 */
}

/* 适配你全局的 .dark-theme */
@media (prefers-color-scheme: dark) { .yuemu-retro-converter-page,
@media (prefers-color-scheme: dark) { .retro-modal-content { /* 暗色模式变量 */
  --retro-bg: var(--edit-box-kraft-bg-dark, #3d2b1f);
  --retro-border: var(--edit-box-kraft-text-dark, #e8d9c4);
  --retro-text: var(--edit-box-kraft-text-dark, #e8d9c4);
  --retro-highlight: #e67e22;

  /* 暗色下屏幕变为琥珀黄 (Amber CRT) */
  --screen-bg: #0f0a00;
  --screen-text: #fbbf24;
  --screen-glow: rgba(251, 191, 36, 0.4); } } }

/* 机器外壳 */
.vintage-machine {
  width: 100%;
  max-width: 760px;
  background-color: var(--retro-bg);
  border: 4px solid var(--retro-border);
  border-radius: 4px;
  box-shadow: 8px 8px 0 var(--retro-border);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s ease;
}

/* 铭牌头部 */
.machine-header {
  border-bottom: 4px solid var(--retro-border);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0,0,0,0.03) 10px,
    rgba(0,0,0,0.03) 20px
  );
}

.title-container {
  text-align: center;
}

.machine-title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: var(--retro-text);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.machine-subtitle {
  font-size: 12px;
  font-weight: bold;
  color: var(--retro-text);
  opacity: 0.7;
  margin-top: 4px;
}

.screw {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--retro-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--retro-border);
  font-size: 14px;
  font-weight: bold;
}
.left-screw { transform: rotate(45deg); }
.right-screw { transform: rotate(-15deg); }

/* 主控面板 */
.machine-panel {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.mt-4 {
  margin-top: 16px;
}

/* 标签分割线 */
.section-label {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.label-text {
  font-weight: bold;
  color: var(--retro-text);
  font-size: 14px;
}

.dotted-line {
  flex: 1;
  border-bottom: 2px dashed var(--retro-border);
  opacity: 0.5;
}

/* 按钮通用复古样式 */
.retro-btn {
  background: transparent;
  border: 2px solid var(--retro-border);
  color: var(--retro-text);
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--retro-border);
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.retro-btn:hover:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 var(--retro-border);
}

.retro-btn:active:not(:disabled),
.retro-btn.active {
  background: var(--retro-text);
  color: var(--retro-bg);
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 var(--retro-border);
}

.retro-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 进制选择器 */
.base-selector {
  display: flex;
  gap: 12px;
}

.base-btn {
  flex: 1;
  padding: 10px;
  font-size: 16px;
}

/* 老式屏幕 */
.screen-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.retro-screen {
  background-color: var(--screen-bg);
  border: 4px inset var(--retro-border);
  padding: 16px;
  position: relative;
  overflow: hidden;
  height: 80px;
  display: flex;
  align-items: center;
}

.retro-screen.has-error {
  border-color: #ef4444;
}

/* 扫描线效果 */
.scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0),
    rgba(255,255,255,0) 50%,
    rgba(0,0,0,0.1) 50%,
    rgba(0,0,0,0.1)
  );
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 2;
}

.screen-glass {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
  pointer-events: none;
  z-index: 3;
}

.screen-content {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 4;
}

.prompt-symbol {
  color: var(--screen-text);
  font-size: 24px;
  font-weight: bold;
  margin-right: 12px;
  animation: blink 1s step-end infinite;
}

.screen-input {
  background: transparent;
  border: none;
  color: var(--screen-text);
  font-family: 'Courier New', Courier, monospace;
  font-size: 24px;
  font-weight: bold;
  width: 100%;
  outline: none;
  text-shadow: 0 0 8px var(--screen-glow);
}

.screen-input::placeholder {
  color: var(--screen-text);
  opacity: 0.3;
}

.error-text {
  color: #ef4444;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
}

/* 结果插槽 */
.output-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.output-slot {
  border: 2px solid var(--retro-border);
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--retro-border);
  padding-bottom: 4px;
}

.slot-badge {
  font-size: 12px;
  font-weight: bold;
  background: var(--retro-text);
  color: var(--retro-bg);
  padding: 2px 6px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  box-shadow: 2px 2px 0 var(--retro-border);
}

.slot-display {
  min-height: 32px;
  display: flex;
  align-items: center;
}

.slot-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--retro-text);
  word-break: break-all;
}

.slot-value.long-value {
  font-size: 14px;
}

/* 底部区域 */
.machine-footer {
  border-top: 4px solid var(--retro-border);
  padding: 16px;
  display: flex;
  justify-content: center;
  background: rgba(0,0,0,0.02);
}

.action-btn {
  padding: 10px 24px;
  font-size: 14px;
  gap: 8px;
}

/* --- 复古模态框 --- */
.retro-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.retro-modal-content {
  background: var(--retro-bg);
  border: 4px solid var(--retro-border);
  box-shadow: 12px 12px 0 rgba(0,0,0,0.8);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', Courier, monospace;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 4px solid var(--retro-border);
  background: var(--retro-text);
  color: var(--retro-bg);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: var(--retro-bg);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--retro-bg);
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.close-btn:hover {
  transform: scale(1.2);
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.retro-table-wrapper {
  border: 2px solid var(--retro-border);
}

.retro-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.retro-table th,
.retro-table td {
  padding: 10px;
  border: 1px solid var(--retro-border);
  color: var(--retro-text);
  font-weight: bold;
}

.retro-table th {
  background: rgba(0,0,0,0.05);
}

/* 动画 */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .yuemu-retro-converter-page {
    padding: 12px;
  }

  .machine-header {
    padding: 12px;
  }

  .machine-title {
    font-size: 18px;
  }

  .machine-panel {
    padding: 16px;
    gap: 16px;
  }

  .base-selector {
    flex-wrap: wrap;
    gap: 8px;
  }

  .base-btn {
    flex: calc(50% - 4px); /* 2x2 网格 */
    font-size: 14px;
    padding: 8px;
  }

  .output-grid {
    grid-template-columns: 1fr; /* 结果变为单列 */
    gap: 12px;
  }

  .screen-input {
    font-size: 18px;
  }

  .prompt-symbol {
    font-size: 18px;
  }

  .retro-table th,
  .retro-table td {
    padding: 6px;
    font-size: 12px;
  }
}
</style>
