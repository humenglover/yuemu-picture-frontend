<template>
  <Transition name="fade">
    <div v-if="showWarning" class="resolution-warning">
      <div class="warning-content">
        <i class="fas fa-search-minus warning-icon"></i>
        <span>{{ $t('components.gameResolutionWarning.message') }}</span>
      </div>
      <button class="close-btn" @click="dismiss">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getDeviceType } from '@/utils/device';
import { DEVICE_TYPE_ENUM } from '@/constants/device';

const route = useRoute();
const showWarning = ref(false);
const dismissed = ref(false);
const device = ref('');

const checkResolution = () => {
  if (device.value !== DEVICE_TYPE_ENUM.PC) {
    showWarning.value = false;
    return;
  }
  
  if (!route.path.startsWith('/games/')) {
    showWarning.value = false;
    return;
  }

  if (dismissed.value) return;

  // 如果浏览器可视高度小于 720px，通常意味着笔记本屏幕过小或浏览器缩放比例过大（比如 125% 或 150%）
  // 许多小游戏需要至少 650-700px 的纵向空间才能完整显示画布
  const viewportHeight = window.innerHeight;
  if (viewportHeight < 720) {
    showWarning.value = true;
  } else {
    showWarning.value = false;
  }
};

const dismiss = () => {
  showWarning.value = false;
  dismissed.value = true;
};

watch(() => route.path, () => {
  dismissed.value = false; // 进入新游戏页面时重置忽略状态
  checkResolution();
});

onMounted(async () => {
  device.value = await getDeviceType();
  checkResolution();
  window.addEventListener('resize', checkResolution);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkResolution);
});
</script>

<style scoped>
.resolution-warning {
  position: fixed;
  top: 76px; /* Header is 64px, leave some margin */
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: rgba(255, 152, 0, 0.9);
  backdrop-filter: blur(10px);
  color: #fff;
  padding: 12px 24px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(255, 152, 0, 0.3);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.warning-icon {
  font-size: 16px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
