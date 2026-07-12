<template>
  <div class="yuemu-emoji-picker">
    <div class="yuemu-emoji-categories">
      <div
        v-for="category in categories"
        :key="category.name"
        class="yuemu-category-item"
        :class="{ 'is-active': currentCategory === category.name }"
        @click="currentCategory = category.name"
        :title="getCurrentCategoryLabelStrict(category.name)"
      >
        {{ category.icon }}
      </div>
    </div>

    <div class="yuemu-emoji-list">
      <div class="yuemu-category-name">{{ getCurrentCategoryLabel }}</div>
      <div class="yuemu-emoji-grid">
        <div
          v-for="emoji in getCurrentCategoryEmojis"
          :key="emoji"
          class="yuemu-emoji-item"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 定义属性
const props = defineProps<{
  i18n?: Record<string, string>
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'select', emoji: string): void
}>()

// 表情分类和对应的表情
const emojiData = {
  smileys: [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍',
    '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
    '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
    '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
    '🥹', '🫣', '🫡', '🫢', '🤭', '🫠', '🤗', '🫂', '🤤', '🥴', '😵‍💫', '🤐', '🥱', '😴',
    '😮‍💨', '😶‍🌫️', '😶', '🫥', '😦', '😧', '🙄', '😬', '😑', '🫨', '🫤', '😐', '🤥', '🤫'
  ],
  gestures: [
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
    '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐',
    '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀',
    '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '🔥', '✨', '💫', '💥', '💢',
    '🫰', '🤌', '🫳', '🫴', '🫱', '🫲', '🫸', '🫷', '🤏', '', '👐', '🙌', '🫱‍🫲',
    '💅', '🤳', '✍️', '🙆', '🙅', '🤷', '🙋', '🧏', '🙇', '🫡', '🤦', '🧎', '🧍', '💆'
  ],
  hearts: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❤️‍🔥', '❤️‍🩹', '💝',
    '💞', '💓', '💗', '💖', '💘', '💕', '💌', '💟', '❣️', '💋', '💯', '💢', '💥', '💫', '💦',
    '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '💋', '💯',
    '♥️', '♡', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💌', '💘', '💋', '💄'
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸',
    '🐵', '🙈', '🙉', '🙊', '🐒', '🦍', '🦧', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉',
    '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲',
    '🦭', '🐋', '🐳', '🐬', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🪸', '🪼', '🦀', '🦞',
    '🦐', '🦑', '🐌', '🦋', '🐛', '🪲', '🐜', '🐝', '🪰', '🪱', '🦗', '🪳', '🕷️', '🕸️'
  ],
  flowers: [
    '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴',
    '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🪹', '🪺', '🍄', '🌰', '🦀', '🐚'
  ],
  food: [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍',
    '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🥕', '🧄', '🧅', '🥔', '🍠',
    '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗',
    '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥠', '🥡',
    '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮'
  ],
  objects: [
    '⌚️', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀',
    '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️',
    '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦',
    '🎮', '🕹️', '🎲', '♟️', '🎭', '🎨', '🎼', '🎵', '🎶', '🎤', '🎧', '🎷', '🎸', '🎹',
    '🎺', '🎻', '🪘', '🥁', '🪗', '🎯', '🎱', '🎳', '🎮', '🎰', '🎲', '🎪', '🎭'
  ],
  weather: [
    '☀️', '🌤️', '⛅️', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄️', '🌬️',
    '💨', '🌪️', '🌫️', '🌊', '💧', '💦', '☔️', '⚡️', '❄️', '🌡️', '🌈', '🌞', '🌝', '🌚'
  ]
}

// 表情分类
const categories = computed(() => [
  { name: 'smileys', icon: '😊', label: t('components.emojiPicker.smileys') },
  { name: 'gestures', icon: '👋', label: t('components.emojiPicker.gestures') },
  { name: 'hearts', icon: '❤️', label: t('components.emojiPicker.hearts') },
  { name: 'animals', icon: '🐶', label: t('components.emojiPicker.animals') },
  { name: 'flowers', icon: '🌸', label: t('components.emojiPicker.flowers') },
  { name: 'food', icon: '🍔', label: t('components.emojiPicker.food') },
  { name: 'objects', icon: '💡', label: t('components.emojiPicker.objects') },
  { name: 'weather', icon: '🌤️', label: t('components.emojiPicker.weather') }
])

const currentCategory = ref('smileys')

// 工具函数：获取指定分类的严格 Label (用于 tooltip)
const getCurrentCategoryLabelStrict = (name: string) => {
  const category = categories.value.find(c => c.name === name)
  return props.i18n?.[name] || category?.label || ''
}

// 获取当前分类标签
const getCurrentCategoryLabel = computed(() => {
  return getCurrentCategoryLabelStrict(currentCategory.value)
})

// 获取当前分类的表情
const getCurrentCategoryEmojis = computed(() => {
  return emojiData[currentCategory.value as keyof typeof emojiData] || []
})

// 选择表情
const selectEmoji = (emoji: string) => {
  emit('select', emoji)
}
</script>

<style scoped>
/* 组件级暗色模式变量覆写 */
@media (prefers-color-scheme: dark) { .yuemu-emoji-picker { --emoji-picker-background: #1e1e1e;
  --emoji-picker-background-rgb: 30, 30, 30;
  --emoji-picker-border: #30363d;
  --emoji-picker-shadow: rgba(0, 0, 0, 0.4);
  --text-primary: #e6edf3;
  --text-secondary: #848d97;
  --hover-background: #2d333b;
  --border-color: #484f58; } }

.yuemu-emoji-picker {
  background: var(--emoji-picker-background, #ffffff);
  color: var(--text-primary, #1f2328);
  border: 1px solid var(--emoji-picker-border, #f0f0f0);
  border-radius: 12px;
  box-shadow: 0 4px 16px var(--emoji-picker-shadow, rgba(0, 0, 0, 0.1));
  width: 320px;
  height: 360px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: var(--theme-transition, all 0.3s ease);
}

.yuemu-emoji-categories {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--emoji-picker-border, #f0f0f0);
  background: var(--emoji-picker-background, #ffffff);
  flex-shrink: 0;
  transition: var(--theme-transition, all 0.3s ease);
}

.yuemu-category-item {
  padding: 6px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 18px;
  opacity: 0.6; /* 默认略暗，突出激活状态 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.yuemu-category-item:hover {
  background: var(--hover-background, #f5f7fa);
  opacity: 0.9;
  transform: translateY(-1px);
}

.yuemu-category-item.is-active {
  background: var(--hover-background, #f5f7fa);
  opacity: 1;
  box-shadow: inset 0 0 0 1px var(--border-color, #e5e7eb); /* 用微小的边框勾勒激活状态 */
  transform: scale(1.05);
}

.yuemu-emoji-list {
  padding: 12px 12px 12px 16px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--emoji-picker-background, #ffffff);
  transition: var(--theme-transition, all 0.3s ease);
}

.yuemu-category-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #656d76);
  margin-bottom: 8px;
  padding-bottom: 4px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  position: sticky;
  top: -12px; /* 补偿父容器的 padding */
  background: rgba(var(--emoji-picker-background-rgb, 255, 255, 255), 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10;
  border-bottom: 1px solid var(--emoji-picker-border, transparent);
  letter-spacing: 0.5px;
}

.yuemu-emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  padding-bottom: 8px;
}

.yuemu-emoji-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 22px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹簧动画 */
  user-select: none;
}

.yuemu-emoji-item:hover {
  background: var(--hover-background, #f5f7fa);
  transform: scale(1.25);
  z-index: 2; /* 放大时置顶 */
  box-shadow: 0 2px 8px var(--emoji-picker-shadow, rgba(0, 0, 0, 0.1));
}

.yuemu-emoji-item:active {
  transform: scale(0.95);
}

/* ================== 自定义滚动条样式 ================== */
.yuemu-emoji-list::-webkit-scrollbar {
  width: 6px;
}

.yuemu-emoji-list::-webkit-scrollbar-track {
  background: transparent;
}

.yuemu-emoji-list::-webkit-scrollbar-thumb {
  background: var(--border-color, #e5e7eb);
  border-radius: 3px;
}

.yuemu-emoji-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary, #9ca3af);
}

/* ================== 响应式调整 ================== */
@media screen and (max-width: 768px) {
  .yuemu-emoji-picker {
    width: 100%;
    height: 320px;
    border: none;
    border-radius: 12px 12px 0 0; /* 移动端通常作为底部抽屉出现 */
    box-shadow: 0 -4px 16px var(--emoji-picker-shadow, rgba(0, 0, 0, 0.1));
  }

  .yuemu-emoji-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .yuemu-emoji-item {
    font-size: 20px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-emoji-item:active, .yuemu-emoji-item:hover,
  .yuemu-emoji-item:active *, .yuemu-emoji-item:hover *,
  .yuemu-category-item:active, .yuemu-category-item:hover,
  .yuemu-category-item:active *, .yuemu-category-item:hover * {
    transform: none !important;
  }
}
</style>
