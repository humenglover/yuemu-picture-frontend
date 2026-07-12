<template>
  <Teleport to="body">
    <Transition name="yuemu-fade-scale">
      <div v-if="visible" class="yuemu-modal-overlay" @click.self="closeModal">
        <div class="yuemu-modal-container">

          <!-- 苹果风格的顶部导航栏 -->
          <div class="yuemu-modal-header">
            <h2 class="yuemu-modal-title">{{ t('member.mechanismTitle') }}</h2>
            <button class="yuemu-close-btn" @click="closeModal" :aria-label="t('common.close')">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- 滚动内容区 -->
          <div class="yuemu-modal-body">

            <div class="yuemu-mechanism-section">
              <h3 class="yuemu-section-title">
                <span class="yuemu-icon-wrapper yuemu-bg-purple" style="background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </span>
                {{ t('member.modelDiffTitle') }}
              </h3>
              <ul class="yuemu-rule-list">
                <li><strong>{{ t('member.basicPrinciple') }}</strong>{{ t('member.basicPrincipleDesc') }}</li>
                <li><strong>{{ t('member.specificRatio') }}</strong><br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• <b>Qwen3.5-Flash：</b> {{ t('member.baseModelRatio') }}<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• <b>DeepSeek-V4-Flash：</b> {{ t('member.ratio136') }}<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• <b>Qwen3.5-Plus：</b> {{ t('member.ratio255') }}<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• <b>DeepSeek-V4-Pro：</b> {{ t('member.ratio1636') }}
                </li>
              </ul>
            </div>

            <div class="yuemu-mechanism-section">
              <h3 class="yuemu-section-title">
                <span class="yuemu-icon-wrapper yuemu-bg-gold">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                </span>
                {{ t('member.coreRulesTitle') }}
              </h3>
              <ul class="yuemu-rule-list">
                <li><strong>{{ t('member.registerMethod') }}</strong>{{ t('member.registerMethodDesc') }}</li>
                <li><strong>{{ t('member.growthSystem') }}</strong>{{ t('member.growthSystemDesc') }}</li>
                <li><strong>{{ t('member.rightsDiff') }}</strong> {{ t('member.rightsDiffDesc') }}</li>
                <li><strong>{{ t('member.specificQuota') }}</strong><br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• {{ t('member.quotaNormal') }}<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• {{ t('member.quotaPro') }}<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• {{ t('member.quotaPlus') }}
                </li>
                <li><strong>{{ t('member.dataSecurity') }}</strong> {{ t('member.dataSecurityDesc') }}</li>
              </ul>
            </div>

            <div class="yuemu-mechanism-section">
              <h3 class="yuemu-section-title">
                <span class="yuemu-icon-wrapper yuemu-bg-blue">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M13 3L13 17.17L18.59 11.59L20 13L12 21L4 13L5.41 11.59L11 17.17L11 3L13 3Z" transform="rotate(180 12 12)"/></svg>
                </span>
                {{ t('member.tierAndPromotionTitle') }}
              </h3>
              <div class="yuemu-tier-cards">
                <div class="yuemu-tier-card yuemu-card-pro">
                  <div class="yuemu-tier-header">
                    <span class="yuemu-tier-name">{{ t('member.proMember') }}</span>
                    <span class="yuemu-tier-duration">{{ t('member.days30') }}</span>
                  </div>
                  <div class="yuemu-tier-req">{{ t('member.conditionPro') }}</div>
                </div>
                <div class="yuemu-tier-card yuemu-card-plus">
                  <div class="yuemu-tier-header">
                    <span class="yuemu-tier-name">{{ t('member.plusMember') }}</span>
                    <span class="yuemu-tier-duration">{{ t('member.days90') }}</span>
                  </div>
                  <div class="yuemu-tier-req">{{ t('member.conditionPlus') }}</div>
                </div>
              </div>
            </div>

            <div class="yuemu-mechanism-section">
              <h3 class="yuemu-section-title">
                <span class="yuemu-icon-wrapper yuemu-bg-green">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C14.07 3 15.98 3.7 17.5 4.88l1.5-1.5V8h-4.62l1.65-1.65C14.9 5.25 13.5 4.5 12 4.5C7.86 4.5 4.5 7.86 4.5 12C4.5 16.14 7.86 19.5 12 19.5C16.14 19.5 19.5 16.14 19.5 12H21Z"/></svg>
                </span>
                {{ t('member.renewAndAntiFraudTitle') }}
              </h3>
              <ul class="yuemu-rule-list">
                <li><strong>{{ t('member.renewRule') }}</strong>{{ t('member.renewRuleDesc') }}</li>
                <li><strong>{{ t('member.cycleReset') }}</strong>{{ t('member.cycleResetDesc') }}</li>
                <li><strong>{{ t('member.antiFraud') }}</strong>{{ t('member.antiFraudDesc') }}</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const visible = ref(false)

const openModal = () => {
  visible.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  visible.value = false
  document.body.style.overflow = ''
}

defineExpose({
  openModal,
  closeModal
})
</script>

<style scoped>
/* 使用全局遮罩层变量，支持暗色平滑切换 */
.yuemu-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--comment-drawer-backdrop);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* 核心容器：采用 iOS Modal 变量 */
.yuemu-modal-container {
  width: 90%;
  max-width: 440px;
  max-height: 85vh;
  background: var(--ios-modal-bg);
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border-radius: 24px;
  box-shadow: 0 24px 48px var(--shadow-color), 0 0 0 1px var(--ios-modal-divider) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: var(--theme-transition);
}

.yuemu-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--ios-modal-divider);
  transition: var(--theme-transition);
}

.yuemu-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

/* 关闭按钮适配全局搜索/输入框背景变量 */
.yuemu-close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--ios-search-bg);
  color: var(--text-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.yuemu-close-btn:hover {
  background: var(--ios-search-focus-bg);
  color: var(--text-primary);
}

.yuemu-modal-body {
  padding: 24px;
  overflow-y: auto;
  scrollbar-width: none;
}
.yuemu-modal-body::-webkit-scrollbar {
  display: none;
}

.yuemu-mechanism-section {
  margin-bottom: 28px;
}
.yuemu-mechanism-section:last-child {
  margin-bottom: 0;
}

.yuemu-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 0;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.yuemu-icon-wrapper {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.yuemu-bg-gold { background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%); }
.yuemu-bg-blue { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
.yuemu-bg-green { background: linear-gradient(135deg, #34d399 0%, #10b981 100%); }

.yuemu-rule-list {
  padding-left: 0;
  list-style: none;
  margin: 0;
}

.yuemu-rule-list li {
  position: relative;
  padding-left: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.yuemu-rule-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--text-secondary);
}

.yuemu-rule-list strong {
  color: var(--text-primary);
  font-weight: 600;
}

.yuemu-tier-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.yuemu-tier-card {
  border-radius: 16px;
  padding: 16px 20px;
  transition: transform 0.2s ease;
  background: var(--card-background);
  border: 1px solid var(--border-color);
}

/* 卡片使用主题边框，不再硬编码固定底色，以保证暗黑模式的高级感 */
.yuemu-card-pro {
  border-color: rgba(59, 130, 246, 0.3);
}
.yuemu-card-plus {
  border-color: rgba(245, 158, 11, 0.3);
}

.yuemu-tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.yuemu-tier-name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.yuemu-tier-duration {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
}

/* 蓝色/金色字样在暗黑模式也保持良好对比度 */
.yuemu-card-pro .yuemu-tier-name { color: #60a5fa; }
.yuemu-card-pro .yuemu-tier-duration { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

.yuemu-card-plus .yuemu-tier-name { color: #fbbf24; }
.yuemu-card-plus .yuemu-tier-duration { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

.yuemu-tier-req {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 动画部分保持不变 */
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
</style>
