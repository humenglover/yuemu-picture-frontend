<template>
  <div id="NotFoundView">
    <div class="not-found-container">
      <!-- 插图区域：图片本身已传达 404 -->
      <div class="illustration-wrapper">
        <img
          :src="notFoundImg"
          :alt="$t('pages.notFoundPage.title')"
          class="not-found-img"
        />
        <div class="glow-orb orb-1"></div>
        <div class="glow-orb orb-2"></div>
      </div>

      <!-- 文字信息 -->
      <div class="text-section">
        <h2 class="error-title">{{ $t('pages.notFoundPage.title') }}</h2>
        <p class="error-subtitle">{{ $t('pages.notFoundPage.subtitle') }}</p>
        <p class="error-lost">{{ $t('pages.notFoundPage.lostInSpace') }}</p>
      </div>

      <!-- 提示信息 -->
      <div class="tips-section">
        <div class="tip-item">
          <i class="fas fa-search tip-icon"></i>
          <span>{{ $t('pages.notFoundPage.tip1') }}</span>
        </div>
        <div class="tip-item">
          <i class="fas fa-compass tip-icon"></i>
          <span>{{ $t('pages.notFoundPage.tip2') }}</span>
        </div>
      </div>

      <!-- 返回首页按钮 -->
      <button class="back-home-btn" @click="goHome">
        <i class="fas fa-home"></i>
        <span>{{ $t('pages.notFoundPage.backToHome') }}</span>
      </button>
    </div>

    <!-- 背景装饰粒子 -->
    <div class="bg-particles">
      <div
        v-for="i in 20"
        :key="i"
        class="particle"
        :style="getParticleStyle(i)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import notFoundImg from '@/assets/404.png'

const router = useRouter()
const { t } = useI18n()

const goHome = () => {
  router.push('/')
}

const getParticleStyle = (index: number) => {
  const size = Math.random() * 3 + 2
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = Math.random() * 10 + 10
  const opacity = Math.random() * 0.3 + 0.05
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    opacity,
  }
}
</script>

<style scoped>
#NotFoundView {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  transition: var(--theme-transition);
}

.not-found-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 24px;
  max-width: 520px;
  width: 100%;
}

/* ========== 插图区域 ========== */
.illustration-wrapper {
  position: relative;
  margin-bottom: 28px;
}

.not-found-img {
  width: 240px;
  height: auto;
  max-width: 100%;
  position: relative;
  z-index: 1;
  animation: float 6s ease-in-out infinite;
  filter: drop-shadow(0 8px 24px rgba(59, 130, 246, 0.25));
}

/* ---------- 蓝色光晕 ---------- */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  z-index: 0;
  pointer-events: none;
}

.orb-1 {
  width: 180px;
  height: 180px;
  top: 5%;
  left: -25%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent 70%);
  animation: orbPulse 4s ease-in-out infinite;
}

.orb-2 {
  width: 140px;
  height: 140px;
  bottom: 0%;
  right: -20%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.25), transparent 70%);
  animation: orbPulse 5s ease-in-out infinite reverse;
}

/* ========== 文字区域 ========== */
.text-section {
  margin-bottom: 28px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.error-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 6px;
  line-height: 1.6;
}

.error-lost {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.7;
  font-style: italic;
}

/* ========== 提示区域 ========== */
.tips-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 32px;
  padding: 16px 20px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  width: 100%;
  max-width: 360px;
  transition: var(--theme-transition);
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-secondary);
}

.tip-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.12);
  border-radius: 50%;
  flex-shrink: 0;
}

/* ========== 返回首页按钮 — 蓝色系 ========== */
.back-home-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-family-base);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.35);
}

.back-home-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(37, 99, 235, 0.5);
}

.back-home-btn:active {
  transform: translateY(0);
}

/* ========== 背景粒子 — 蓝色调 ========== */
.bg-particles {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  bottom: -10px;
  background: #3b82f6;
  border-radius: 50%;
  animation: rise linear infinite;
}

/* ========== 动画 ========== */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes orbPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes rise {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.12;
  }
  90% {
    opacity: 0.04;
  }
  100% {
    transform: translateY(-100vh) scale(0.3);
    opacity: 0;
  }
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .not-found-img {
    width: 180px;
  }

  .error-title {
    font-size: 20px;
  }

  .error-subtitle {
    font-size: 14px;
  }

  .tips-section {
    max-width: 100%;
    padding: 14px 16px;
  }

  .back-home-btn {
    padding: 10px 24px;
    font-size: 14px;
  }
}
</style>
