<template>
  <div class="yuemu-vintage-tool-page">
    <div class="typewriter-machine">
      <div class="roller-bar">
        <div class="roller-knob left"></div>
        <div class="roller-paper-guide">{{ t('pages.tools.textLab.textLab') }}</div>
        <div class="roller-knob right"></div>
      </div>

      <div class="stats-board">
        <div class="stat-item">
          <span class="stat-label">{{ t('pages.tools.textLab.charCount') }}</span>
          <span class="stat-value">{{ stats.chars }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">{{ t('pages.tools.textLab.wordCount') }}</span>
          <span class="stat-value">{{ stats.words }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">{{ t('pages.tools.textLab.lineCount') }}</span>
          <span class="stat-value">{{ stats.lines }}</span>
        </div>
      </div>

      <div class="paper-container">
        <textarea
          v-model="text"
          class="paper-textarea"
          :placeholder="t('pages.tools.textLab.pleaseTypeHere')"
        ></textarea>
      </div>

      <div class="action-keyboard">
        <div class="keyboard-group">
          <div class="group-title">{{ t('pages.tools.textLab.formatConvert') }}</div>
          <div class="keys">
            <button class="mech-key" @click="transform('upper')">{{ t('pages.tools.textLab.uppercase') }}</button>
            <button class="mech-key" @click="transform('lower')">{{ t('pages.tools.textLab.lowercase') }}</button>
            <button class="mech-key" @click="transform('title')">{{ t('pages.tools.textLab.capitalize') }}</button>
          </div>
        </div>

        <div class="keyboard-group">
          <div class="group-title">{{ t('pages.tools.textLab.textTypesetting') }}</div>
          <div class="keys">
            <button class="mech-key" @click="transform('trim')">{{ t('pages.tools.textLab.clearIndent') }}</button>
            <button class="mech-key" @click="transform('unique')">{{ t('pages.tools.textLab.removeDuplicateLines') }}</button>
            <button class="mech-key" @click="transform('sort')">{{ t('pages.tools.textLab.sortText') }}</button>
          </div>
        </div>

        <div class="keyboard-group">
          <div class="group-title">{{ t('pages.tools.textLab.charConvert') }}</div>
          <div class="keys">
            <button class="mech-key" @click="transform('s2t')">{{ t('pages.tools.textLab.simpToTrad') }}</button>
            <button class="mech-key" @click="transform('t2s')">{{ t('pages.tools.textLab.tradToSimp') }}</button>
          </div>
        </div>

        <div class="keyboard-group">
          <div class="group-title">{{ t('pages.tools.textLab.sysOperation') }}</div>
          <div class="keys">
            <button class="mech-key action-clear" @click="text = ''">{{ t('pages.tools.textLab.clearPaper') }}</button>
            <button class="mech-key action-copy" @click="copyText">
              {{ copyStatus }}
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
import { ref, computed } from 'vue';

const text = ref('');
const copyStatus = ref(t('pages.tools.textLab.copyAll'));

// 实时统计逻辑
const stats = computed(() => {
  const chars = text.value.length;
  // 匹配中文字符或连续的英文字母数字作为一个单词
  const words = (text.value.match(/[\u4e00-\u9fa5]|\b[a-zA-Z0-9]+\b/g) || []).length;
  const lines = text.value === '' ? 0 : text.value.split('\n').length;
  return { chars, words, lines };
});

// 简繁体基础映射字典 (为了前端轻量化，提取了最常用的几百个字，完整版可引入库)
const s2tDict: Record<string, string> = {"发":"發","对":"對","国":"國","关":"關","这":"這","个":"個","说":"說","开":"開","时":"時","机":"機","会":"會","动":"動","学":"學","觉":"覺","后":"後","里":"裡","为":"為","出":"齣","与":"與","电":"電","当":"當","点":"點","车":"車","应":"應","万":"萬","体":"體","无":"無","现":"現","实":"實","气":"氣","长":"長","见":"見","边":"邊","理":"理","东":"東","门":"門","风":"風","书":"書","马":"馬","飞":"飛","让":"讓","吗":"嗎","听":"聽","认":"認","过":"過","还":"還","写":"寫","网":"網","传":"傳","变":"變","业":"業","总":"總","题":"題","样":"樣","问":"問","头":"頭","处":"處","区":"區","设":"设","线":"線","报":"報","图":"圖","号":"號","确":"確","录":"錄","统":"統","数":"數","观":"觀","计":"計","类":"類","仅":"僅","产":"產","结":"結","质":"質","导":"導","强":"強","创":"創","制":"製","队":"隊","证":"證","展":"展","击":"擊","离":"離","广":"廣","历":"歷","视":"視","联":"聯","带":"帶","价":"價","众":"眾","态":"態","术":"術","单":"單","备":"備"};
const t2sDict: Record<string, string> = Object.fromEntries(Object.entries(s2tDict).map(([k, v]) => [v, k]));

// 核心转换逻辑
const transform = (type: string) => {
  if (!text.value) return;
  let lines = text.value.split('\n');

  switch (type) {
    case 'upper':
      text.value = text.value.toUpperCase();
      break;
    case 'lower':
      text.value = text.value.toLowerCase();
      break;
    case 'title':
      text.value = text.value.replace(/\b[a-z]/g, c => c.toUpperCase());
      break;
    case 'trim':
      text.value = lines.map(line => line.replace(/^\s+/, '')).join('\n');
      break;
    case 'unique':
      text.value = [...new Set(lines)].join('\n');
      break;
    case 'sort':
      text.value = lines.sort((a, b) => a.localeCompare(b, 'zh-CN')).join('\n');
      break;
    case 's2t':
      text.value = text.value.split('').map(c => s2tDict[c] || c).join('');
      break;
    case 't2s':
      text.value = text.value.split('').map(c => t2sDict[c] || c).join('');
      break;
  }
};

// 复制到剪贴板
const copyText = async () => {
  if (!text.value) return;
  try {
    await navigator.clipboard.writeText(text.value);
    copyStatus.value = t('pages.tools.textLab.copied');
    setTimeout(() => { copyStatus.value = t('pages.tools.textLab.copyAll'); }, 2000);
  } catch (err) {
    copyStatus.value = t('pages.tools.textLab.copyFailed');
    setTimeout(() => { copyStatus.value = t('pages.tools.textLab.copyAll'); }, 2000);
  }
};
</script>

<style scoped>
/* 引入等宽字体以增强打字机效果 */
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

.yuemu-vintage-tool-page {
  /* 移动端友好 & 垂直居中 */
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  background-color: var(--background);
  transition: var(--theme-transition);
}

/* 主机体容器 */
.typewriter-machine {
  width: 100%;
  max-width: 900px;
  background: var(--card-background);
  border: 4px solid var(--text-primary);
  border-radius: 8px;
  padding: 10px 20px 30px;
  box-shadow: 12px 12px 0px var(--shadow-color),
  inset 0 0 0 2px var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部打字机滚筒 */
.roller-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  background: var(--text-primary);
  border-radius: 20px;
  margin-top: 10px;
  position: relative;
}

.roller-knob {
  width: 30px;
  height: 30px;
  background: var(--card-background);
  border: 3px solid var(--text-primary);
  border-radius: 50%;
}

.roller-knob.left { margin-left: -15px; }
.roller-knob.right { margin-right: -15px; }

.roller-paper-guide {
  color: var(--background);
  font-weight: 900;
  letter-spacing: 4px;
  font-size: 1.1rem;
}

/* 统计数据面板 */
.stats-board {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  background: var(--hover-background);
  border: 2px solid var(--border-color);
  padding: 10px;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: bold;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-primary);
  font-family: 'Courier Prime', Courier, monospace;
}

.stat-divider {
  width: 2px;
  height: 30px;
  background: var(--border-color);
}

/* 纸张输入区 */
.paper-container {
  position: relative;
  width: 100%;
}

.paper-textarea {
  width: 100%;
  height: 300px;
  resize: vertical;
  padding: 20px;
  box-sizing: border-box;
  background-color: var(--card-background);
  color: var(--text-primary);
  border: 2px solid var(--text-primary);
  border-radius: 4px;
  font-family: 'Courier Prime', 'Consolas', 'SimHei', monospace;
  font-size: 1.1rem;
  line-height: 1.8;
  outline: none;
  /* 纸张横线效果 */
  background-image: repeating-linear-gradient(
    transparent,
    transparent 31px,
    var(--border-color) 31px,
    var(--border-color) 32px
  );
  background-attachment: local;
  box-shadow: inset 4px 4px 10px rgba(0,0,0,0.02);
}

.paper-textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

/* 机械键盘控制区 */
.action-keyboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.keyboard-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-title {
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--text-secondary);
}

.keys {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 10px;
}

/* 机械按键样式 */
.mech-key {
  background: var(--card-background);
  color: var(--text-primary);
  border: 2px solid var(--text-primary);
  padding: 10px 5px;
  font-weight: bold;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 6px;
  box-shadow: 3px 3px 0px var(--text-primary);
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.mech-key:hover {
  background: var(--hover-background);
}

.mech-key:active {
  transform: translate(3px, 3px);
  box-shadow: 0px 0px 0px var(--text-primary);
}

/* 特殊按键颜色 */
.action-clear {
  color: #d32f2f;
  border-color: #d32f2f;
  box-shadow: 3px 3px 0px #d32f2f;
}
.action-clear:active {
  box-shadow: 0px 0px 0px #d32f2f;
}

.action-copy {
  color: #00aeec;
  border-color: #00aeec;
  box-shadow: 3px 3px 0px #00aeec;
}
.action-copy:active {
  box-shadow: 0px 0px 0px #00aeec;
}

/* 移动端细微调整 */
@media (max-width: 600px) {
  .yuemu-vintage-tool-page {
    padding: 10px;
  }

  .typewriter-machine {
    padding: 10px 10px 20px;
  }

  .roller-paper-guide {
    font-size: 0.9rem;
    letter-spacing: 2px;
  }

  .paper-textarea {
    height: 250px;
    font-size: 1rem;
  }

  .keys {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
