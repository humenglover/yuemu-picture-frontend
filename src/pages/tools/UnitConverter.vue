<template>
  <div class="yuemu-vintage-tool-page">
    <div class="instrument-chassis">
      <div class="screw top-left"></div>
      <div class="screw top-right"></div>
      <div class="screw bottom-left"></div>
      <div class="screw bottom-right"></div>

      <div class="brand-plate">
        <span class="model-name">{{ t('pages.tools.unitConverter.metricConverter84') }}</span>
        <div class="power-indicator">
          <div class="led-light pulsing"></div>
          <span>{{ t('pages.tools.unitConverter.power') }}</span>
        </div>
      </div>

      <div class="mode-selector">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="mode-btn"
          :class="{ active: currentCategory === cat.id }"
          @click="setCategory(cat.id)"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="crt-display">
        <div class="scanlines"></div>

        <div class="display-row input-row">
          <span class="prefix">{{ t('pages.tools.unitConverter.inputArrow') }}</span>
          <input
            type="number"
            v-model="inputValue"
            class="digital-input"
            placeholder="0"
          />
          <span class="unit-text">{{ fromUnitObj?.symbol || '...' }}</span>
        </div>

        <div class="display-row output-row">
          <span class="prefix">{{ t('pages.tools.unitConverter.outputArrow') }}</span>
          <div class="digital-output" :class="{ 'error': isError }">
            {{ formattedOutput }}
          </div>
          <span class="unit-text">{{ toUnitObj?.symbol || '...' }}</span>
        </div>
      </div>

      <div class="control-panel">
        <div class="knob-group">
          <label>{{ t('pages.tools.unitConverter.srcUnit') }}</label>
          <div class="select-wrapper">
            <select v-model="fromUnit" class="retro-select">
              <option v-for="u in currentUnits" :key="u.id" :value="u.id">
                {{ u.name }} ({{ u.symbol }})
              </option>
            </select>
          </div>
        </div>

        <button class="swap-btn" @click="swapUnits" :title="t('pages.tools.unitConverter.swapUnits')">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M7 10L3 6l4-4M21 18l-4 4-4-4M3 6h14M7 18h14" />
          </svg>
        </button>

        <div class="knob-group">
          <label>{{ t('pages.tools.unitConverter.dstUnit') }}</label>
          <div class="select-wrapper">
            <select v-model="toUnit" class="retro-select">
              <option v-for="u in currentUnits" :key="u.id" :value="u.id">
                {{ u.name }} ({{ u.symbol }})
              </option>
            </select>
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

// --- 数据字典与配置 ---
type CategoryId = 'length' | 'weight' | 'temperature' | 'storage';

interface Unit {
  id: string;
  name: string;
  symbol: string;
  ratio: number; // 相对于基准单位的比例 (温度除外)
}

const categories = [
  { id: 'length', label: t('pages.tools.unitConverter.length') },
  { id: 'weight', label: t('pages.tools.unitConverter.weight') },
  { id: 'temperature', label: t('pages.tools.unitConverter.temperature') },
  { id: 'storage', label: t('pages.tools.unitConverter.storage') }
] as const;

// 各分类的单位定义
const unitsConfig: Record<CategoryId, Unit[]> = {
  length: [
    { id: 'm', name: t('pages.tools.unitConverter.meter'), symbol: 'm', ratio: 1 },
    { id: 'km', name: t('pages.tools.unitConverter.kilometer'), symbol: 'km', ratio: 1000 },
    { id: 'cm', name: t('pages.tools.unitConverter.centimeter'), symbol: 'cm', ratio: 0.01 },
    { id: 'mm', name: t('pages.tools.unitConverter.millimeter'), symbol: 'mm', ratio: 0.001 },
    { id: 'in', name: t('pages.tools.unitConverter.inch'), symbol: 'in', ratio: 0.0254 },
    { id: 'ft', name: t('pages.tools.unitConverter.foot'), symbol: 'ft', ratio: 0.3048 },
    { id: 'yd', name: t('pages.tools.unitConverter.yard'), symbol: 'yd', ratio: 0.9144 },
    { id: 'mi', name: t('pages.tools.unitConverter.mile'), symbol: 'mi', ratio: 1609.344 },
  ],
  weight: [
    { id: 'kg', name: t('pages.tools.unitConverter.kilogram'), symbol: 'kg', ratio: 1 },
    { id: 'g', name: t('pages.tools.unitConverter.gram'), symbol: 'g', ratio: 0.001 },
    { id: 'mg', name: t('pages.tools.unitConverter.milligram'), symbol: 'mg', ratio: 0.000001 },
    { id: 't', name: t('pages.tools.unitConverter.ton'), symbol: 't', ratio: 1000 },
    { id: 'lb', name: t('pages.tools.unitConverter.pound'), symbol: 'lb', ratio: 0.45359237 },
    { id: 'oz', name: t('pages.tools.unitConverter.ounce'), symbol: 'oz', ratio: 0.02834952 },
  ],
  storage: [
    { id: 'B', name: t('pages.tools.unitConverter.byte'), symbol: 'B', ratio: 1 },
    { id: 'KB', name: t('pages.tools.unitConverter.kilobyte'), symbol: 'KB', ratio: 1024 },
    { id: 'MB', name: t('pages.tools.unitConverter.megabyte'), symbol: 'MB', ratio: Math.pow(1024, 2) },
    { id: 'GB', name: t('pages.tools.unitConverter.gigabyte'), symbol: 'GB', ratio: Math.pow(1024, 3) },
    { id: 'TB', name: t('pages.tools.unitConverter.terabyte'), symbol: 'TB', ratio: Math.pow(1024, 4) },
  ],
  temperature: [
    { id: 'C', name: t('pages.tools.unitConverter.celsius'), symbol: '°C', ratio: 0 },
    { id: 'F', name: t('pages.tools.unitConverter.fahrenheit'), symbol: '°F', ratio: 0 },
    { id: 'K', name: t('pages.tools.unitConverter.kelvin'), symbol: 'K', ratio: 0 },
  ]
};

// --- 状态管理 ---
// 增加 null 与 string 支持，应对原生的清空行为
const currentCategory = ref<CategoryId>('length');
const inputValue = ref<number | string | null>(1);
const fromUnit = ref<string>('m');
const toUnit = ref<string>('cm');

const currentUnits = computed(() => unitsConfig[currentCategory.value]);
const fromUnitObj = computed(() => currentUnits.value.find(u => u.id === fromUnit.value));
const toUnitObj = computed(() => currentUnits.value.find(u => u.id === toUnit.value));

// --- 核心校验与换算逻辑 ---
// 提取独立的错误校验（不造成副作用）
const isError = computed(() => {
  const val = inputValue.value;
  if (val === '' || val === null || val === undefined) return false;
  return isNaN(Number(val));
});

const convertTemperature = (val: number, from: string, to: string): number => {
  if (from === to) return val;
  let celsius = val;

  // 先统一转为摄氏度
  if (from === 'F') celsius = (val - 32) * 5 / 9;
  else if (from === 'K') celsius = val - 273.15;

  // 再从摄氏度转为目标单位
  if (to === 'C') return celsius;
  if (to === 'F') return celsius * 9 / 5 + 32;
  if (to === 'K') return celsius + 273.15;

  return val;
};

// 计算内部纯数值
const outputValue = computed(() => {
  const rawVal = inputValue.value;
  // 拦截空值或不合法值
  if (rawVal === '' || rawVal === null || rawVal === undefined) return 0;

  const val = Number(rawVal);
  if (isNaN(val)) return 0;

  // 避免在切换分类的瞬间（字典还没重置好）报错
  if (!fromUnitObj.value || !toUnitObj.value) return 0;

  if (currentCategory.value === 'temperature') {
    return convertTemperature(val, fromUnit.value, toUnit.value);
  }

  const baseValue = val * fromUnitObj.value.ratio;
  return baseValue / toUnitObj.value.ratio;
});

// 计算用于显示的格式化结果
const formattedOutput = computed(() => {
  if (isError.value) return t('pages.tools.unitConverter.errorWord');

  const rawVal = inputValue.value;
  // 如果用户清空了输入框，则优雅地显示一个占位符，而不是 0 或报错
  if (rawVal === '' || rawVal === null || rawVal === undefined) return '-';

  const out = outputValue.value;
  if (out === 0) return '0';

  // 拦截无穷大等溢出情况
  if (!isFinite(out)) return t('pages.tools.unitConverter.dataOverflowWord');

  return parseFloat(out.toPrecision(10)).toString();
});

// --- 交互操作 ---
const setCategory = (catId: CategoryId) => {
  currentCategory.value = catId;
  const units = unitsConfig[catId];
  fromUnit.value = units[0].id;
  toUnit.value = units[1] ? units[1].id : units[0].id;
};

const swapUnits = () => {
  const temp = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = temp;
};

</script>

<style scoped>
/* 引入等宽字体强化复古感 */
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

.yuemu-vintage-tool-page {
  /* 关键修改：实现全局上下居中并适应页面 */
  min-height: 100vh;
  box-sizing: border-box;
  background-color: var(--background);
  color: var(--text-primary);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center; /* 控制垂直居中 */
  transition: var(--theme-transition);
}

/* 仪器外壳 */
.instrument-chassis {
  position: relative;
  width: 100%;
  max-width: 600px;
  background: var(--card-background);
  border: 4px solid var(--text-primary);
  border-radius: 12px;
  padding: 30px;
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.05),
    10px 10px 0px var(--shadow-color);
}

/* 螺丝钉装饰 */
.screw {
  position: absolute;
  width: 12px;
  height: 12px;
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
.top-left { top: 10px; left: 10px; }
.top-right { top: 10px; right: 10px; }
.bottom-left { bottom: 10px; left: 10px; }
.bottom-right { bottom: 10px; right: 10px; }

/* 铭牌区域 */
.brand-plate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 10px;
}
.model-name {
  font-family: 'Space Mono', 'SimHei', monospace;
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 1.1rem;
}
.power-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Space Mono', 'SimHei', monospace;
  font-size: 0.8rem;
  font-weight: bold;
}
.led-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ff3333;
  box-shadow: 0 0 8px #ff3333;
}
.led-light.pulsing {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { opacity: 0.6; box-shadow: 0 0 4px #ff3333; }
  50% { opacity: 1; box-shadow: 0 0 12px #ff3333; }
  100% { opacity: 0.6; box-shadow: 0 0 4px #ff3333; }
}

/* 模式选择按钮群 */
.mode-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}
.mode-btn {
  flex: 1;
  min-width: 100px;
  padding: 10px 5px;
  background: var(--background);
  border: 2px solid var(--text-primary);
  color: var(--text-primary);
  font-family: 'Space Mono', 'SimHei', monospace;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 4px 0 var(--text-primary);
  transition: all 0.1s;
}
.mode-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--text-primary);
}
.mode-btn.active {
  background: var(--text-primary);
  color: var(--background);
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--border-color);
}

/* 液晶屏幕 (固定暗色调以保持复古发光感) */
.crt-display {
  position: relative;
  background-color: #0f1c11; /* 经典深绿灰 */
  border: 4px solid var(--text-primary);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
  overflow: hidden;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.8);
}
.scanlines {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(
    rgba(18, 16, 16, 0) 50%,
    rgba(0, 0, 0, 0.25) 50%
  );
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 1;
}
.display-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 15px;
  font-family: 'Space Mono', 'SimHei', monospace;
  color: #4ade80; /* 发光绿 */
  text-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  position: relative;
  z-index: 2;
}
.display-row:last-child {
  margin-bottom: 0;
}
.prefix {
  font-size: 1.1rem;
  width: 70px;
  opacity: 0.8;
  font-weight: bold;
}
.digital-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 2px dashed #4ade80;
  color: #4ade80;
  font-family: 'Space Mono', monospace;
  font-size: 2rem;
  text-align: right;
  padding: 0 10px;
  outline: none;
  width: 100%;
}
.digital-input::placeholder {
  color: rgba(74, 222, 128, 0.3);
}
.digital-output {
  flex: 1;
  font-family: 'Space Mono', monospace;
  font-size: 2rem;
  text-align: right;
  padding: 0 10px;
  overflow-x: auto;
  white-space: nowrap;
}
.digital-output.error {
  color: #f87171;
  text-shadow: 0 0 8px rgba(248, 113, 113, 0.6);
}
.unit-text {
  font-family: 'Space Mono', monospace;
  font-size: 1.2rem;
  width: 50px;
  text-align: left;
  padding-left: 10px;
  opacity: 0.9;
}

/* 底部控制面板 */
.control-panel {
  display: flex;
  align-items: flex-end;
  gap: 15px;
}
.knob-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.knob-group label {
  font-family: 'Space Mono', 'SimHei', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-secondary);
}
.select-wrapper {
  position: relative;
}
.select-wrapper::after {
  content: '▼';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 0.8rem;
  color: var(--text-primary);
}
.retro-select {
  width: 100%;
  appearance: none;
  background: var(--background);
  border: 2px solid var(--text-primary);
  color: var(--text-primary);
  padding: 12px 30px 12px 12px;
  font-family: 'Space Mono', 'SimHei', monospace;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--border-color);
}
.retro-select:focus {
  outline: none;
  border-color: var(--link-color);
}

.swap-btn {
  background: var(--hover-background);
  border: 2px solid var(--text-primary);
  color: var(--text-primary);
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--border-color);
  transition: all 0.1s;
}
.swap-btn:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 var(--border-color);
}

/* 响应式适配移动端 */
@media (max-width: 600px) {
  .instrument-chassis {
    padding: 20px 15px;
  }
  .prefix {
    font-size: 1rem;
    width: 55px;
  }
  .digital-input, .digital-output {
    font-size: 1.5rem;
  }
  .unit-text {
    font-size: 1rem;
    width: 40px;
  }
  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }
  .swap-btn {
    align-self: center;
    transform: rotate(90deg);
    margin: 5px 0;
  }
  .swap-btn:active {
    transform: rotate(90deg) translateX(4px);
  }
}
</style>
