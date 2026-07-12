<template>
  <Transition name="yuemu-fade">
    <div v-if="true" class="yuemu-ai-overlay" @click.self="handleClose">
      <div class="yuemu-ai-panel">
        <!-- 头部：Apple 风格的居中标题与极简关闭按钮 -->
        <header class="yuemu-panel-header">
          <div class="yuemu-header-placeholder"></div>
          <h3 class="yuemu-title">
            <i class="fa-solid fa-wand-magic-sparkles yuemu-magic-icon"></i>
            {{ t('components.aiPostGen.title') }}
          </h3>
          <button class="yuemu-close-btn" @click="handleClose" :disabled="isGenerating">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div class="yuemu-panel-body">
          <!-- 内容输入区：iOS 备忘录风格 -->
          <div class="yuemu-section">
            <label class="yuemu-label">{{ t('components.aiPostGen.postContent') }}</label>
            <div class="yuemu-textarea-wrapper">
              <textarea
                v-model="prompt"
                :placeholder="t('components.aiPostGen.postContentPlaceholder')"
                class="yuemu-ios-textarea"
                :disabled="isGenerating"
              ></textarea>
            </div>
          </div>

          <!-- 分类选择：iOS 横向滚动胶囊 -->
          <div class="yuemu-section">
            <label class="yuemu-label">{{ t('components.aiPostGen.category') }} <span class="yuemu-sub-label">{{ t('components.aiPostGen.categoryHint') }}</span></label>
            <div class="yuemu-chips-container yuemu-hide-scrollbar">
              <button
                v-for="cat in categories"
                :key="cat"
                class="yuemu-chip"
                :class="{ 'yuemu-chip-active': category === cat }"
                @click="category = cat"
                :disabled="isGenerating"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <!-- 风格定制：网格化选择器 -->
          <div class="yuemu-section">
            <label class="yuemu-label">{{ t('components.aiPostGen.style') }} <span class="yuemu-sub-label">{{ t('components.aiPostGen.styleHint') }}</span></label>
            <div class="yuemu-style-grid">
              <button
                v-for="style in styleOptions"
                :key="style.id === null ? 'auto' : style.id"
                class="yuemu-style-card"
                :class="{ 'yuemu-style-active': styleId === style.id }"
                @click="styleId = style.id"
                :disabled="isGenerating"
              >
                <div class="yuemu-style-indicator"></div>
                <span>{{ style.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 底部操作区：宽大的主操作按钮 -->
        <footer class="yuemu-panel-footer">
          <button
            class="yuemu-ios-primary-btn"
            :class="{ 'yuemu-btn-disabled': !prompt.trim() || isGenerating }"
            @click="startGeneration"
            :disabled="!prompt.trim() || isGenerating"
          >
            <i v-if="isGenerating" class="fa-solid fa-spinner fa-spin"></i>
            <i v-else class="fa-solid fa-bolt"></i>
            {{ isGenerating ? t('components.aiPostGen.generating') : t('components.aiPostGen.startGenerate') }}
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  categories: {
    type: Array as () => string[],
    default: () => ['默认分类', '日常', '穿搭', '美食', '旅行', '摄影']
  },
  isGenerating: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'start']);

const prompt = ref('');
const category = ref(props.categories[0] || t('components.aiPostGen.defaultCategory'));
const styleId = ref<number | null>(null);

// 将原本的 select 选项映射为对象数组，方便渲染高颜值 UI
const styleOptions = computed(() => [
  { id: null, label: t('components.aiPostGen.smartMatch') },
  { id: 1, label: t('components.aiPostGen.minimalist') },
  { id: 2, label: t('components.aiPostGen.polaroid') },
  { id: 3, label: t('components.aiPostGen.magazine') },
]);

const handleClose = () => {
  if (props.isGenerating) return;
  emit('close');
};

const startGeneration = () => {
  if (!prompt.value.trim() || props.isGenerating) return;

  const params: any = {
    prompt: prompt.value,
    category: category.value,
    styleId: styleId.value
  };

  emit('start', params);
};
</script>

<style scoped>
.yuemu-ai-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}

.yuemu-ai-panel {
  background: var(--card-background);
  width: 92%;
  max-width: 500px;
  border-radius: 24px; /* iOS 标志性的大圆角 */
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-height: 90vh;
}

/* 头部：极简、居中、无多余线条 */
.yuemu-panel-header {
  padding: 20px 20px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.yuemu-header-placeholder {
  width: 32px; /* 占位，保证标题绝对居中 */
}

.yuemu-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.yuemu-magic-icon {
  /* Apple Intelligence 风格渐变色 */
  background: linear-gradient(135deg, #007AFF, #AF52DE, #FF2D55);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 18px;
}

.yuemu-close-btn {
  background: var(--background);
  border: none;
  color: var(--text-secondary);
  width: 30px;
  height: 30px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.yuemu-close-btn:active {
  transform: scale(0.9);
  background: var(--border-color);
}

/* 身体部分 */
.yuemu-panel-body {
  padding: 12px 20px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.yuemu-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.yuemu-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.yuemu-sub-label {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-secondary);
}

/* 文本域：模仿 iOS 备忘录/输入框体验 */
.yuemu-textarea-wrapper {
  background: var(--background);
  border-radius: 16px;
  padding: 4px;
  transition: box-shadow 0.3s ease;
}

.yuemu-textarea-wrapper:focus-within {
  background: var(--hover-background);
  box-shadow: 0 0 0 2px var(--text-primary);
}

.yuemu-ios-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: none;
  background: transparent;
  resize: none;
  min-height: 110px;
  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-primary);
}

.yuemu-ios-textarea:focus {
  outline: none;
}

.yuemu-ios-textarea::placeholder {
  color: var(--text-secondary);
}

/* 类别选择：横向滑动胶囊 (Chips) 替代 Select */
.yuemu-chips-container {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.yuemu-hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.yuemu-chip {
  flex-shrink: 0;
  padding: 10px 18px;
  border-radius: 20px;
  border: none;
  background: var(--hover-background);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.yuemu-chip-active {
  background: var(--text-primary);
  color: var(--card-background);
}

.yuemu-chip:active {
  transform: scale(0.95);
}

/* 风格选择：精致网格替代 Select */
.yuemu-style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.yuemu-style-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: var(--hover-background);
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}

.yuemu-style-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--text-secondary);
  transition: all 0.2s ease;
}

.yuemu-style-active {
  background: var(--background);
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.yuemu-style-active .yuemu-style-indicator {
  border-color: var(--text-primary);
  background: var(--text-primary);
  box-shadow: inset 0 0 0 3px var(--background); /* 形成被选中的原点效果，适配暗色模式 */
}

.yuemu-style-card:active {
  transform: scale(0.97);
}

/* 底部按钮 */
.yuemu-panel-footer {
  padding: 12px 20px 20px;
}

.yuemu-ios-primary-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  background: var(--text-primary);
  border: none;
  color: var(--card-background);
  font-size: 17px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.yuemu-ios-primary-btn:active:not(.yuemu-btn-disabled) {
  transform: scale(0.97);
  opacity: 0.9;
}

.yuemu-btn-disabled {
  background: var(--hover-background);
  color: var(--text-secondary);
  cursor: not-allowed;
}

/* 动画效果 */
.yuemu-fade-enter-active,
.yuemu-fade-leave-active {
  transition: opacity 0.3s ease;
}

.yuemu-fade-enter-active .yuemu-ai-panel {
  animation: yuemu-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.yuemu-fade-leave-active .yuemu-ai-panel {
  transition: transform 0.3s ease;
  transform: translateY(20px);
}

.yuemu-fade-enter-from,
.yuemu-fade-leave-to {
  opacity: 0;
}

@keyframes yuemu-slide-up {
  from {
    transform: translateY(40px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>
