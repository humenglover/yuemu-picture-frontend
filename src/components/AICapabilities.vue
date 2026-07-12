<template>
  <transition name="yuemu-fade">
    <div v-if="visible" class="yuemu-capabilities-overlay" @click.self="$emit('close')">
      <div class="yuemu-modal-card">
        <div class="yuemu-card-head">
          <div>
            <h1>{{ t('components.aiCapabilities.title') }}</h1>
            <p>{{ t('components.aiCapabilities.subtitle') }}</p>
          </div>
          <button class="yuemu-btn-close" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="yuemu-card-body">
          <div class="yuemu-grid-section">

            <div class="yuemu-card">
              <div class="yuemu-icon green">
                <i class="fas fa-eye"></i>
              </div>
              <div class="yuemu-info">
                <h2>{{ t('components.aiCapabilities.visDeepAnalysis') }}</h2>
                <p>{{ t('components.aiCapabilities.visDeepAnalysisDesc') }}</p>
              </div>
            </div>

            <div class="yuemu-card">
              <div class="yuemu-icon amber">
                <i class="fas fa-wand-magic-sparkles"></i>
              </div>
              <div class="yuemu-info">
                <h2>{{ t('components.aiCapabilities.imgProcessing') }}</h2>
                <p>{{ t('components.aiCapabilities.imgProcessingDesc') }}</p>
              </div>
            </div>

            <div class="yuemu-card">
              <div class="yuemu-icon blue">
                <i class="fas fa-magnifying-glass"></i>
              </div>
              <div class="yuemu-info">
                <h2>{{ t('components.aiCapabilities.smartSearch') }}</h2>
                <p>{{ t('components.aiCapabilities.smartSearchDesc') }}</p>
              </div>
            </div>

            <div class="yuemu-card">
              <div class="yuemu-icon cyan">
                <i class="fas fa-cloud-arrow-up"></i>
              </div>
              <div class="yuemu-info">
                <h2>{{ t('components.aiCapabilities.assetMgmt') }}</h2>
                <p>{{ t('components.aiCapabilities.assetMgmtDesc') }}</p>
              </div>
            </div>

            <div class="yuemu-card">
              <div class="yuemu-icon purple">
                <i class="fas fa-microphone-lines"></i>
              </div>
              <div class="yuemu-info">
                <h2>{{ t('components.aiCapabilities.voiceInteract') }}</h2>
                <p>{{ t('components.aiCapabilities.voiceInteractDesc') }}</p>
              </div>
            </div>

            <div class="yuemu-card">
              <div class="yuemu-icon red">
                <i class="fas fa-robot"></i>
              </div>
              <div class="yuemu-info">
                <h2>{{ t('components.aiCapabilities.agentDecision') }}</h2>
                <p>{{ t('components.aiCapabilities.agentDecisionDesc') }}</p>
              </div>
            </div>

          </div>

          <div class="yuemu-guide-section">
            <h3>{{ t('components.aiCapabilities.usageExamples') }}</h3>
            <div class="yuemu-guide-list">
              <div class="yuemu-guide-item">
                <div class="yuemu-step">1</div>
                <div class="yuemu-text">
                  <h4>{{ t('components.aiCapabilities.smartImgProc') }}</h4>
                  <p>{{ t('components.aiCapabilities.smartImgProcDesc') }}</p>
                </div>
              </div>
              <div class="yuemu-guide-item">
                <div class="yuemu-step">2</div>
                <div class="yuemu-text">
                  <h4>{{ t('components.aiCapabilities.imgDeepAnalysis') }}</h4>
                  <p>{{ t('components.aiCapabilities.imgDeepAnalysisDesc') }}</p>
                </div>
              </div>
              <div class="yuemu-guide-item">
                <div class="yuemu-step">3</div>
                <div class="yuemu-text">
                  <h4>{{ t('components.aiCapabilities.assetSearchMgmt') }}</h4>
                  <p>{{ t('components.aiCapabilities.assetSearchMgmtDesc') }}</p>
                </div>
              </div>
              <div class="yuemu-guide-item">
                <div class="yuemu-step">4</div>
                <div class="yuemu-text">
                  <h4>{{ t('components.aiCapabilities.lifeVoice') }}</h4>
                  <p>{{ t('components.aiCapabilities.lifeVoiceDesc') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="yuemu-card-foot">
          <div class="yuemu-status">
            <span class="yuemu-dot"></span>
            {{ t('components.aiCapabilities.modelOnline') }}
          </div>
          <button class="yuemu-btn-primary" @click="$emit('close')">{{ t('components.aiCapabilities.startChat') }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
defineProps<{ visible: boolean }>()
defineEmits(['close'])
</script>

<style scoped>
/* =========================================================
   规范化 UI 组件 (yuemu- 系列)
   移动端与自适应深度优化版
   ========================================================= */

.yuemu-capabilities-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
}

.yuemu-modal-card {
  width: 100%;
  max-width: 860px;
  max-height: 90vh;
  background: var(--card-background);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 24px 80px var(--shadow-color), 0 0 0 1px var(--border-color) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: yuemuPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.yuemu-card-head {
  padding: 32px 32px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-color);
}

.yuemu-card-head h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
}

.yuemu-card-head p {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.yuemu-btn-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--hover-background);
  font-size: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.yuemu-btn-close:hover {
  background: var(--border-color);
  transform: rotate(90deg) scale(1.1);
  color: var(--text-primary);
}

.yuemu-card-body {
  padding: 24px 32px;
  overflow-y: auto;
  flex: 1;
  -webkit-overflow-scrolling: touch; /* iOS 弹性滚动优化 */
}

/* 自定义漂亮滚动条 */
.yuemu-card-body::-webkit-scrollbar { width: 6px; }
.yuemu-card-body::-webkit-scrollbar-track { background: transparent; }
.yuemu-card-body::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
.yuemu-card-body::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }

.yuemu-grid-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.yuemu-card {
  background: var(--post-content-background);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.yuemu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px var(--shadow-color);
  border-color: var(--link-color);
}

.yuemu-card:hover .yuemu-icon {
  transform: scale(1.1) rotate(5deg);
}

.yuemu-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
  transition: transform 0.3s;
}

/* 渐变底色 */
.yuemu-icon.blue { background: linear-gradient(135deg, #4285f4, #669df6); box-shadow: 0 4px 12px rgba(66,133,244,0.3); }
.yuemu-icon.green { background: linear-gradient(135deg, #34a853, #5cdc7d); box-shadow: 0 4px 12px rgba(52,168,83,0.3); }
.yuemu-icon.amber { background: linear-gradient(135deg, #f9ab00, #fbc02d); box-shadow: 0 4px 12px rgba(249,171,0,0.3); }
.yuemu-icon.red { background: linear-gradient(135deg, #ea4335, #fc6e63); box-shadow: 0 4px 12px rgba(234,67,53,0.3); }
.yuemu-icon.purple { background: linear-gradient(135deg, #a142f4, #c285f6); box-shadow: 0 4px 12px rgba(161,66,244,0.3); }
.yuemu-icon.cyan { background: linear-gradient(135deg, #00bcd4, #4dd0e1); box-shadow: 0 4px 12px rgba(0,188,212,0.3); }

.yuemu-info h2 {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.yuemu-info p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.yuemu-guide-section h3 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.yuemu-guide-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.yuemu-guide-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--hover-background);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.yuemu-guide-item:hover {
  background: var(--post-content-background);
  border-color: var(--border-color);
}

.yuemu-step {
  width: 24px;
  height: 24px;
  background: var(--link-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.yuemu-text h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.yuemu-text p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.yuemu-card-foot {
  padding: 20px 32px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card-background);
}

.yuemu-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.yuemu-dot {
  width: 8px;
  height: 8px;
  background: #34a853;
  border-radius: 50%;
  animation: yuemuPulse 2s infinite;
}

.yuemu-btn-primary {
  padding: 12px 28px;
  background: var(--link-color);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.yuemu-btn-primary:hover {
  background: var(--link-hover-color);
  transform: translateY(-1px);
}

@keyframes yuemuPop {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes yuemuPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.yuemu-fade-enter-active { transition: opacity 0.25s ease; }
.yuemu-fade-leave-active { transition: opacity 0.2s ease; }
.yuemu-fade-enter-from, .yuemu-fade-leave-to { opacity: 0; }

/* =========================================================
   极致移动端适配响应式样式
   ========================================================= */

@media (max-width: 1024px) {
  .yuemu-grid-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .yuemu-capabilities-overlay {
    padding: 16px;
    align-items: flex-end; /* 手机端弹窗靠底部更便于操作 */
  }

  .yuemu-modal-card {
    border-radius: 20px 20px 16px 16px;
    max-height: 85vh;
  }

  .yuemu-card-head {
    padding: 20px 24px 16px;
  }

  .yuemu-card-head h1 {
    font-size: 22px;
  }

  .yuemu-card-body {
    padding: 16px 24px;
  }

  .yuemu-grid-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .yuemu-card {
    flex-direction: row; /* 手机端改为横向排列，节省垂直空间 */
    align-items: center;
    padding: 16px;
  }

  .yuemu-icon {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }

  .yuemu-guide-list {
    grid-template-columns: 1fr; /* 指南在手机端单列显示 */
  }

  .yuemu-card-foot {
    padding: 16px 24px;
  }

  .yuemu-btn-primary {
    padding: 10px 24px;
  }
}

@media (max-width: 480px) {
  .yuemu-capabilities-overlay {
    padding: 12px;
  }

  .yuemu-card-head {
    padding: 16px 20px 12px;
  }

  .yuemu-card-body {
    padding: 12px 20px;
  }

  .yuemu-card-foot {
    padding: 12px 20px;
  }
}

/* 移动端强制移除点击时的悬停缩放，防止底层长按死锁 */
@media (max-width: 768px) {
  .yuemu-btn-close:active, .yuemu-btn-close:hover,
  .yuemu-btn-close:active *, .yuemu-btn-close:hover *,
  .ant-card-hoverable:active, .ant-card-hoverable:hover,
  .ant-card-hoverable:active *, .ant-card-hoverable:hover *,
  .yuemu-btn-primary:active, .yuemu-btn-primary:hover,
  .yuemu-btn-primary:active *, .yuemu-btn-primary:hover *,
  .yuemu-card:active, .yuemu-card:hover,
  .yuemu-card:active *, .yuemu-card:hover *,
  .yuemu-guide-item:active, .yuemu-guide-item:hover,
  .yuemu-guide-item:active *, .yuemu-guide-item:hover * {
    transform: none !important;
  }
}
</style>
