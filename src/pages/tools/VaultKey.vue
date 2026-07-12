<template>
  <div class="yuemu-vintage-tool-page">
    <div class="telegram-wrapper">
      <div class="secret-stamp">{{ t('pages.tools.vaultKey.topSecret') }}</div>

      <div class="doc-header">
        <h1 class="tool-title">{{ t('pages.tools.vaultKey.vaultKeyTerminal') }} </h1>
        <div class="doc-meta">
          <span>{{ t('pages.tools.vaultKey.securityLevel5') }}</span>
          <span>{{ t('pages.tools.vaultKey.issueDate', { date: currentDate }) }}</span>
          <span>{{ t('pages.tools.vaultKey.authPersonnelSysAdmin') }}</span>
        </div>
        <div class="header-line-dashed"></div>
      </div>

      <div class="output-section">
        <label class="section-label">{{ t('pages.tools.vaultKey.decryptionOutputArea') }}</label>
        <div class="password-display" :class="{ 'error-text': isError }">
          <span class="password-text">{{ password || t('pages.tools.vaultKey.waitingGenCmd') }}</span>
          <button
            class="copy-btn"
            @click="copyToClipboard"
            :disabled="!password || isError"
          >
            {{ copyStatus }}
          </button>
        </div>

        <div class="strength-meter-container">
          <span class="strength-label">{{ t('pages.tools.vaultKey.antiCrackStrength', { strength: strengthLabel }) }}</span>
          <div class="strength-bars">
            <div
              v-for="n in 4"
              :key="n"
              class="bar"
              :class="{ 'active': strengthScore >= n, [`level-${strengthScore}`]: strengthScore >= n }"
            ></div>
          </div>
        </div>
      </div>

      <div class="header-line-solid"></div>

      <div class="config-section">
        <label class="section-label">{{ t('pages.tools.vaultKey.coreParamConfig') }}</label>

        <div class="length-control">
          <div class="length-header">
            <span>{{ t('pages.tools.vaultKey.keyLength8to64') }}</span>
            <span class="length-value">[{{ config.length }}]</span>
          </div>
          <input
            type="range"
            v-model="config.length"
            min="8"
            max="64"
            class="retro-slider"
            @input="generatePassword"
          />
        </div>

        <div class="options-grid">
          <label class="retro-checkbox" v-for="(opt, key) in optionsMap" :key="key">
            <input type="checkbox" v-model="config[key]" @change="generatePassword" />
            <span class="check-mark">[{{ config[key] ? 'X' : ' ' }}]</span>
            <span class="check-label">{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <div class="action-section">
        <button class="generate-btn" @click="generatePassword">
          <span class="btn-text">{{ t('pages.tools.vaultKey.execOverrideGenKey') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, computed, onMounted } from 'vue';

// 基础状态
const password = ref('');
const copyStatus = ref(t('pages.tools.vaultKey.copyKeyFallback'));
const isError = ref(false);

const currentDate = new Date().toISOString().split('T')[0];

// 配置状态
const config = ref({
  length: 16,
  upper: true,
  lower: true,
  numbers: true,
  symbols: true,
  exclude: false
});

// 选项映射，用于循环渲染复古多选框
const optionsMap = {
  upper: { label: t('pages.tools.vaultKey.incUpper') },
  lower: { label: t('pages.tools.vaultKey.incLower') },
  numbers: { label: t('pages.tools.vaultKey.incNumbers') },
  symbols: { label: t('pages.tools.vaultKey.incSymbols') },
  exclude: { label: t('pages.tools.vaultKey.excConfusing') }
};

// 密码强度计算 (基于信息熵)
const strengthScore = computed(() => {
  if (!password.value || isError.value) return 0;

  let poolSize = 0;
  if (config.value.upper) poolSize += 26;
  if (config.value.lower) poolSize += 26;
  if (config.value.numbers) poolSize += 10;
  if (config.value.symbols) poolSize += 30; // 近似特殊字符数量

  if (poolSize === 0) return 0;

  // 熵值公式：E = L * log2(R)
  const entropy = config.value.length * Math.log2(poolSize);

  if (entropy < 40) return 1; // 弱
  if (entropy < 60) return 2; // 中等
  if (entropy < 80) return 3; // 强
  return 4; // 极强 (Vault Level)
});

const strengthLabel = computed(() => {
  const labels = [t('pages.tools.vaultKey.notReady'), t('pages.tools.vaultKey.extremelyVulnerable'), t('pages.tools.vaultKey.standardDefense'), t('pages.tools.vaultKey.highSecurity'), t('pages.tools.vaultKey.unbreakable')];
  return labels[strengthScore.value];
});

// 密码生成核心逻辑
const generatePassword = () => {
  isError.value = false;

  let charset = '';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+~|}{[]:;?><,./:-="';

  if (config.value.upper) charset += upperChars;
  if (config.value.lower) charset += lowerChars;
  if (config.value.numbers) charset += numberChars;
  if (config.value.symbols) charset += symbolChars;

  // 排除易混淆字符
  if (config.value.exclude) {
    charset = charset.replace(/[0OlI1]/g, '');
  }

  // 校验是否有可用字符
  if (!charset) {
    password.value = t('pages.tools.vaultKey.sysWarnNoCharset');
    isError.value = true;
    return;
  }

  // 使用安全的随机数生成器
  const randomValues = new Uint32Array(config.value.length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < config.value.length; i++) {
    result += charset[randomValues[i] % charset.length];
  }

  password.value = result;
};

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!password.value || isError.value) return;

  try {
    await navigator.clipboard.writeText(password.value);
    copyStatus.value = t('pages.tools.vaultKey.copied');
    setTimeout(() => {
      copyStatus.value = t('pages.tools.vaultKey.copyKeyFallback');
    }, 2000);
  } catch (err) {
    copyStatus.value = t('pages.tools.vaultKey.copyFailed');
    setTimeout(() => {
      copyStatus.value = t('pages.tools.vaultKey.copyKeyFallback');
    }, 2000);
  }
};

// 初始化生成一次
onMounted(() => {
  generatePassword();
});
</script>

<style scoped>
/* 中文字体优化：优先使用黑体/宋体等系统默认字体，配合等宽英文字体 */
.yuemu-vintage-tool-page {
  min-height: 100vh;
  background-color: var(--background);
  color: var(--text-primary);
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  transition: var(--theme-transition);
}

/* 电报单主体 */
.telegram-wrapper {
  position: relative;
  width: 100%;
  max-width: 700px;
  background: var(--card-background);
  border: 3px solid var(--text-primary);
  padding: 40px;
  box-shadow: 8px 8px 0px var(--text-primary);
  font-family: 'Courier New', Courier, 'SimHei', 'Microsoft YaHei', monospace;
  overflow: hidden;
}

/* 绝密印章 */
.secret-stamp {
  position: absolute;
  top: 30px;
  right: 20px;
  font-size: 26px;
  font-weight: 900;
  color: #d32f2f;
  border: 4px solid #d32f2f;
  padding: 5px 15px;
  transform: rotate(-15deg);
  opacity: 0.7;
  letter-spacing: 4px;
  pointer-events: none;
  border-radius: 4px;
  text-shadow: 0 0 2px rgba(211, 47, 47, 0.3);
  font-family: 'SimSun', 'STSong', serif; /* 印章使用宋体更有复古感 */
}

/* 头部信息 */
.doc-header {
  margin-bottom: 30px;
}

.tool-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  letter-spacing: 2px;
}

.doc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-weight: bold;
}

.header-line-dashed {
  height: 2px;
  border-bottom: 2px dashed var(--text-primary);
  opacity: 0.5;
}

.header-line-solid {
  height: 2px;
  background-color: var(--text-primary);
  margin: 30px 0;
}

.section-label {
  display: block;
  font-weight: 700;
  margin-bottom: 15px;
  font-size: 1rem;
  color: var(--text-secondary);
}

/* 输出区域 */
.output-section {
  margin-bottom: 30px;
}

.password-display {
  display: flex;
  align-items: stretch;
  background: var(--code-background);
  border: 2px solid var(--text-primary);
  min-height: 60px;
  margin-bottom: 15px;
}

.password-text {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 10px 20px;
  font-size: 1.5rem;
  font-weight: 700;
  word-break: break-all;
  color: var(--text-primary);
  font-family: Consolas, Monaco, monospace; /* 密码本身还是用纯等宽英文字体更好辨认 */
}

.error-text .password-text {
  color: #d32f2f;
  font-size: 1.1rem;
  font-family: inherit;
}

.copy-btn {
  background: var(--text-primary);
  color: var(--background);
  border: none;
  padding: 0 25px;
  font-family: inherit;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 2px solid var(--text-primary);
}

.copy-btn:hover:not(:disabled) {
  background: var(--hover-background);
  color: var(--text-primary);
}

.copy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 强度指示器 */
.strength-meter-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--hover-background);
  border: 1px solid var(--border-color);
  padding: 10px 15px;
}

.strength-label {
  font-size: 0.95rem;
  font-weight: 700;
}

.strength-bars {
  display: flex;
  gap: 5px;
}

.bar {
  width: 20px;
  height: 10px;
  border: 1px solid var(--text-primary);
  background: transparent;
  transition: all 0.3s ease;
}

/* 强度颜色映射 */
.bar.active.level-1 { background: #ff4d4f; border-color: #ff4d4f; }
.bar.active.level-2 { background: #faad14; border-color: #faad14; }
.bar.active.level-3 { background: #52c41a; border-color: #52c41a; }
.bar.active.level-4 { background: #00aeec; border-color: #00aeec; box-shadow: 0 0 8px #00aeec; }

/* 配置区域 */
.config-section {
  margin-bottom: 30px;
}

.length-control {
  margin-bottom: 25px;
}

.length-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 700;
}

/* 复古滑块 */
.retro-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: var(--text-primary);
  outline: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.retro-slider:hover {
  opacity: 1;
}

.retro-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 24px;
  background: var(--card-background);
  border: 2px solid var(--text-primary);
  cursor: pointer;
}

.retro-slider::-moz-range-thumb {
  width: 16px;
  height: 24px;
  background: var(--card-background);
  border: 2px solid var(--text-primary);
  cursor: pointer;
}

/* 复古复选框 */
.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.retro-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}

.retro-checkbox input {
  display: none;
}

.check-mark {
  display: inline-block;
  width: 40px;
  font-weight: 700;
  color: var(--text-primary);
}

.check-label {
  color: var(--text-primary);
}

.retro-checkbox:hover .check-label {
  text-decoration: underline;
  text-decoration-style: dashed;
}

/* 生成按钮 */
.action-section {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.generate-btn {
  width: 100%;
  padding: 15px;
  background: var(--card-background);
  border: 3px solid var(--text-primary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.1s;
  box-shadow: 4px 4px 0px var(--text-primary);
  letter-spacing: 2px;
}

.generate-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px var(--text-primary);
  background: var(--hover-background);
}

.generate-btn:active {
  transform: translate(4px, 4px);
  box-shadow: 0px 0px 0px var(--text-primary);
}

/* 适配移动端 */
@media (max-width: 600px) {
  .telegram-wrapper {
    padding: 20px;
  }

  .tool-title {
    font-size: 1.5rem;
  }

  .password-text {
    font-size: 1.2rem;
    padding: 10px;
  }

  .secret-stamp {
    font-size: 16px;
    top: 10px;
    right: 10px;
  }
}
</style>
