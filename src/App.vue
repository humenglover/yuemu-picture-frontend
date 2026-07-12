<template>
  <!--  <FontLoader />-->
  <div id="app">
    <a-config-provider :locale="antLocale" :theme="{ algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm }">
      <van-config-provider
        :theme="isDarkTheme ? 'dark' : 'light'"
        style="background: transparent !important; color: inherit; min-height: 100vh;"
      >
        <BasicLayout />
        <GameResolutionWarning />
      </van-config-provider>
    </a-config-provider>

    <!-- 自定义退出确认弹框 -->
    <Transition name="exit-dialog">
      <div v-if="showExitDialog" class="exit-overlay" @click.self="onCancel">
        <div class="exit-dialog">
          <div class="exit-dialog__icon">🌿</div>
          <div class="exit-dialog__title">{{ $t('pages.app.exitDialog.title') }}</div>
          <div class="exit-dialog__desc">{{ $t('pages.app.exitDialog.desc') }}</div>
          <div class="exit-dialog__actions">
            <button class="exit-btn exit-btn--cancel" @click="onCancel">{{ $t('pages.app.exitDialog.cancel') }}</button>
            <button class="exit-btn exit-btn--confirm" @click="onConfirm">{{ $t('pages.app.exitDialog.confirm') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import BasicLayout from '@/layouts/BasicLayout.vue'
import GameResolutionWarning from '@/components/GameResolutionWarning.vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import enUS from 'ant-design-vue/es/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { respondExitConfirm } from '@/utils/back';
import { useThemeStore } from '@/stores/useThemeStore';
import { theme } from 'ant-design-vue';
import { getDeviceType } from '@/utils/device';
// import FontLoader from '@/components/FontLoader.vue'

const { locale } = useI18n();

const antLocale = computed(() => {
  if (locale.value === 'en-US') {
    dayjs.locale('en');
    return enUS;
  }
  dayjs.locale('zh-cn');
  return zhCN;
});

// ── 主题状态同步 ──────────────────────────────────
const themeStore = useThemeStore();
const isDarkTheme = computed(() => themeStore.isDarkTheme);

// ── 退出弹框 ──────────────────────────────────────
const { t } = useI18n()
const showExitDialog = ref(false);

const onConfirm = () => {
  showExitDialog.value = false;
  respondExitConfirm(true);
};
const onCancel = () => {
  showExitDialog.value = false;
  respondExitConfirm(false);
};
const handleShowExitConfirm = () => {
  showExitDialog.value = true;
};

// ── 纯 JS 动态清除选中状态 ───────────────────────────────
const isEditable = (el: Element | null): boolean => {
  let curr = el as HTMLElement | null;
  while (curr) {
    if (curr.tagName === 'INPUT' || curr.tagName === 'TEXTAREA' || curr.isContentEditable) return true;
    curr = curr.parentElement;
  }
  return false;
};

// 阻止长按弹出的默认菜单和选中（这比 selectionchange 安全，因为强制 removeAllRanges 会导致某些手机底层放大镜组件卡死，进而导致全屏无法点击）
const handleContextMenu = (e: Event) => {
  // 仅在移动端拦截（解决长按死锁），如果在 PC 端，允许正常的右键菜单
  if (getDeviceType() === 'pc') return;

  const target = e.target as Element;
  if (isEditable(target)) return;
  e.preventDefault();
};

const handleSelectStart = (e: Event) => {
  // 仅在移动端拦截
  if (getDeviceType() === 'pc') return;

  const target = e.target as Element;
  if (isEditable(target)) return;
  e.preventDefault();
};

onMounted(() => {
  window.addEventListener('show-exit-confirm', handleShowExitConfirm);
  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('selectstart', handleSelectStart);
});
onUnmounted(() => {
  window.removeEventListener('show-exit-confirm', handleShowExitConfirm);
  document.removeEventListener('contextmenu', handleContextMenu);
  document.removeEventListener('selectstart', handleSelectStart);
});

</script>

<style>
html, body, #app {
  background-color: var(--background) !important;
  /* 终极核心 Hack：使用 background-image 彻底骗过 HBuilderX / Android WebView 的强制反色和遮罩算法，防止其给黑色背景加灰白蒙层 */
  background-image: linear-gradient(to bottom, var(--background), var(--background)) !important;
  color: var(--text-primary);
  min-height: 100vh;
}

/* 退出弹框遮罩 */
.exit-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  /* 修复 HBuilderX 打包 App 时 Android WebView 的 backdrop-filter 导致全局灰蒙蒙 GPU 渲染 Bug */
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* 弹框主体 */
.exit-dialog {
  width: 100%;
  max-width: 320px;
  background: var(--ios-modal-bg, var(--card-background, #fff));
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  color: var(--text-primary, #333);
  box-shadow: 0 10px 40px var(--ios-card-shadow, rgba(0,0,0,0.15));
}

.exit-dialog__icon {
  font-size: 44px;
  margin-bottom: 16px;
  display: block;
}

.exit-dialog__title {
  font-size: 19px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.exit-dialog__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 28px;
  line-height: 1.7;
}

.exit-dialog__actions {
  display: flex;
  gap: 12px;
}

.exit-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
}
.exit-btn:active { opacity: 0.7; }

.exit-btn--cancel {
  background: var(--yuemu-input-bg, #f3f3f6);
  color: var(--text-primary);
}

.exit-btn--confirm {
  background: linear-gradient(135deg, var(--link-hover-color, #60a5fa) 0%, var(--nav-item-active-text, #3b82f6) 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

/* 进出场动画 */
.exit-dialog-enter-active { transition: opacity 0.2s ease; }
.exit-dialog-leave-active  { transition: opacity 0.2s ease; }
.exit-dialog-enter-active .exit-dialog { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.exit-dialog-leave-active  .exit-dialog { transition: all 0.2s cubic-bezier(0.4, 0, 1, 1); }
.exit-dialog-enter-from { opacity: 0; }
.exit-dialog-leave-to   { opacity: 0; }
.exit-dialog-enter-from .exit-dialog { transform: scale(0.9); opacity: 0; }
.exit-dialog-leave-to   .exit-dialog { transform: scale(0.95); opacity: 0; }
</style>
