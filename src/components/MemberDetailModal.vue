<template>
  <Teleport to="body">
    <Transition name="yuemu-fade-scale">
      <div v-if="visible" class="yuemu-modal-overlay" @click.self="close">
        <div class="yuemu-modal-container">

          <button class="yuemu-close-btn" @click="close" :aria-label="t('common.close')">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>

          <div class="yuemu-member-header">
            <div class="yuemu-ambient-glow" :class="`yuemu-glow-type-${user.memberType || 0}`"></div>

            <div class="yuemu-badge-wrapper">
              <img v-if="getMemberIcon(user.memberType)" :src="getMemberIcon(user.memberType)" alt="Member Badge" class="yuemu-big-badge" />
              <div v-else class="yuemu-default-badge">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
                </svg>
              </div>
            </div>

            <h2 class="yuemu-member-title">{{ getMemberTitle(user.memberType) }}</h2>
          </div>

          <div class="yuemu-member-content">
            <div class="yuemu-info-group">
              <div class="yuemu-info-row">
                <span class="yuemu-label">{{ t('member.username') }}</span>
                <span class="yuemu-value">{{ user.userName || t('member.notSet') }}</span>
              </div>

              <div class="yuemu-info-row">
                <span class="yuemu-label">{{ t('member.currentStatus') }}</span>
                <span class="yuemu-value yuemu-highlight" :class="`yuemu-text-type-${user.memberType || 0}`">
                  {{ getMemberTitle(user.memberType) }}
                </span>
              </div>

              <div class="yuemu-info-row" v-if="user.memberType > 0">
                <span class="yuemu-label">{{ t('member.validUntil') }}</span>
                <span class="yuemu-value">{{ formatExpire(user.memberExpire) }}</span>
              </div>
              <div class="yuemu-info-row" v-else>
                <span class="yuemu-label">{{ t('member.memberRights') }}</span>
                <span class="yuemu-value yuemu-tips">{{ t('member.noRights') }}</span>
              </div>
            </div>

            <div class="yuemu-action-wrap">
              <button class="yuemu-upgrade-btn" @click="goToInvite">
                {{ t('member.upgradeBtn') }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
// 假设这是你之前生成的矢量 SVG 图片路径
import proIcon from '@/assets/icons/pro.svg'
import plusIcon from '@/assets/icons/plus.svg'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const visible = ref(false)
const user = ref<any>({})

const router = useRouter()

const open = (userData: any) => {
  user.value = userData || {}
  visible.value = true
  document.body.style.overflow = 'hidden' // 锁定背景滚动
}

const close = () => {
  visible.value = false
  document.body.style.overflow = '' // 恢复背景滚动
}

// 组件卸载时确保恢复滚动条
onUnmounted(() => {
  document.body.style.overflow = ''
})

defineExpose({ open, close })

const getMemberTitle = (type: number) => {
  if (type === 1) return t('member.proMember')
  if (type === 2) return t('member.plusMember')
  return t('member.normalUser')
}

const getMemberIcon = (type: number) => {
  if (type === 1) return proIcon
  if (type === 2) return plusIcon
  return ''
}

const formatExpire = (dateStr: string) => {
  if (!dateStr) return t('member.permanent')
  const date = new Date(dateStr)
  if (date.getFullYear() > 2090) return t('member.permanent')
  return t('member.expireDateFormat', {
    year: date.getFullYear(),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    day: String(date.getDate()).padStart(2, '0')
  })
}

const goToInvite = () => {
  close()
  router.push({ name: 'InvitePage' })
}
</script>

<style scoped>
/* 遮罩层 */
.yuemu-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: var(--comment-drawer-backdrop);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* 核心容器 */
.yuemu-modal-container {
  position: relative;
  width: 90%;
  max-width: 360px;
  background: var(--ios-modal-bg);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 28px;
  box-shadow: 0 24px 48px var(--shadow-color), 0 0 0 1px var(--ios-modal-divider) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: var(--theme-transition);
}

/* 关闭按钮 */
.yuemu-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--ios-search-bg);
  color: var(--text-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
}

.yuemu-close-btn:hover {
  background: var(--ios-search-focus-bg);
  color: var(--text-primary);
}

/* 顶部徽标展示区 */
.yuemu-member-header {
  position: relative;
  padding: 40px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 环境光晕 (Ambient Glow) */
.yuemu-ambient-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  transform: translate(-50%, -60%);
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.25;
  z-index: 0;
  transition: background 0.4s ease;
}

.yuemu-glow-type-0 { background: #94a3b8; }
.yuemu-glow-type-1 { background: #3b82f6; opacity: 0.35; }
.yuemu-glow-type-2 { background: #f59e0b; opacity: 0.35; }

.yuemu-badge-wrapper {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}

.yuemu-big-badge {
  width: 90px;
  height: 90px;
  filter: drop-shadow(0 12px 24px rgba(0,0,0,0.15));
  animation: yuemu-float 4s ease-in-out infinite;
}

.yuemu-default-badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--ios-search-bg);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px var(--shadow-color);
}

.yuemu-member-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  position: relative;
  z-index: 1;
}

/* 详情信息区 */
.yuemu-member-content {
  padding: 0 24px 28px;
}

/* iOS 设置分组列表风格 */
.yuemu-info-group {
  background: var(--ios-card-bg);
  border-radius: 16px;
  padding: 0 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px var(--shadow-color), 0 0 0 1px var(--ios-modal-divider) inset;
}

.yuemu-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  font-size: 15px;
  border-bottom: 1px solid var(--ios-modal-divider);
}

.yuemu-info-row:last-child {
  border-bottom: none;
}

.yuemu-label {
  color: var(--text-secondary);
}

.yuemu-value {
  color: var(--text-primary);
  font-weight: 500;
}

/* 会员专属高亮色 */
.yuemu-text-type-1 { color: #3b82f6; font-weight: 600; }
.yuemu-text-type-2 { color: #f59e0b; font-weight: 600; }

/* 暗色主题下的高亮对比度修正 */
:deep(.dark-theme) .yuemu-text-type-1,
.dark-theme .yuemu-text-type-1 { color: #60a5fa; }

:deep(.dark-theme) .yuemu-text-type-2,
.dark-theme .yuemu-text-type-2 { color: #fbbf24; }

.yuemu-tips {
  color: var(--text-secondary);
  font-size: 14px;
}

/* 操作按钮 */
.yuemu-action-wrap {
  display: flex;
  justify-content: center;
}

.yuemu-upgrade-btn {
  width: 100%;
  padding: 14px 0;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: var(--text-primary);
  color: var(--background);
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.yuemu-upgrade-btn:hover {
  transform: scale(0.98);
  opacity: 0.9;
}

/* 浮动动画 */
@keyframes yuemu-float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
}

/* 进出场动画 */
.yuemu-fade-scale-enter-active,
.yuemu-fade-scale-leave-active {
  transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.yuemu-fade-scale-enter-active .yuemu-modal-container,
.yuemu-fade-scale-leave-active .yuemu-modal-container {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.yuemu-fade-scale-enter-from,
.yuemu-fade-scale-leave-to {
  opacity: 0;
}

.yuemu-fade-scale-enter-from .yuemu-modal-container,
.yuemu-fade-scale-leave-to .yuemu-modal-container {
  transform: scale(0.95) translateY(10px);
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-upgrade-btn:active, .yuemu-upgrade-btn:hover,
  .yuemu-upgrade-btn:active *, .yuemu-upgrade-btn:hover *,
  .yuemu-close-btn:active, .yuemu-close-btn:hover,
  .yuemu-close-btn:active *, .yuemu-close-btn:hover * {
    transform: none !important;
  }
}
</style>
