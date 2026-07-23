<template>
  <div id="PrivacyCenterView">
    <div class="privacy-container">
      <div class="privacy-header">
        <h1 class="page-title">{{ $t('pages.privacyPage.privacyCenter') }}</h1>
        <p class="page-subtitle">{{ $t('pages.privacyPage.policy.footer.desc1') }}</p>
      </div>

      <div class="privacy-content">
        <div class="privacy-group">
          <div class="privacy-card" @click="router.push({ name: 'Privacy', hash: '#privacy-policy' })">
            <div class="card-icon bg-teal"><i class="fas fa-file-contract"></i></div>
            <div class="card-text">
              <div class="card-title">{{ $t('pages.privacyPage.privacyPolicy') }}</div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-right"></i></div>
          </div>
          
          <div class="privacy-card" @click="router.push({ name: 'Privacy', hash: '#cookies' })">
            <div class="card-icon bg-blue"><i class="fas fa-cookie-bite"></i></div>
            <div class="card-text">
              <div class="card-title">{{ $t('pages.privacyPage.cookiePolicy') }}</div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-right"></i></div>
          </div>

          <div class="privacy-card" @click="router.push({ name: 'Privacy', hash: '#privacy-policy' })">
            <div class="card-icon bg-purple"><i class="fas fa-gavel"></i></div>
            <div class="card-text">
              <div class="card-title">{{ $t('pages.privacyPage.termsOfService') }}</div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-right"></i></div>
          </div>
        </div>

        <div class="privacy-group">
          <div class="group-title">{{ $t('pages.privacyPage.manageCookies') }}</div>
          <div class="privacy-card" @click="router.push({ name: 'Privacy', hash: '#cookies' })">
            <div class="card-icon bg-orange"><i class="fas fa-sliders-h"></i></div>
            <div class="card-text">
              <div class="card-title">{{ $t('pages.privacyPage.manageCookies') }}</div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-right"></i></div>
          </div>
        </div>

        <div class="privacy-group">
          <div class="group-title">{{ $t('pages.privacyPage.downloadMyData') }}</div>
          <div class="privacy-card" @click="router.push({ name: 'Privacy', hash: '#your-rights' })">
            <div class="card-icon bg-green"><i class="fas fa-download"></i></div>
            <div class="card-text">
              <div class="card-title">{{ $t('pages.privacyPage.downloadMyData') }}</div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-right"></i></div>
          </div>
          <div class="privacy-card" @click="router.push({ name: 'Privacy', hash: '#ai-processing' })">
            <div class="card-icon bg-cyan"><i class="fas fa-robot"></i></div>
            <div class="card-text">
              <div class="card-title">{{ $t('pages.privacyPage.aiDataProcessing') }}</div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-right"></i></div>
          </div>
        </div>
        
        <div class="privacy-group">
          <div class="group-title">{{ $t('pages.privacyPage.thirdPartyServices') }}</div>
          <div class="privacy-card" @click="router.push({ name: 'Privacy', hash: '#third-party' })">
            <div class="card-icon bg-gray"><i class="fas fa-server"></i></div>
            <div class="card-text">
              <div class="card-title">{{ $t('pages.privacyPage.thirdPartyServices') }}</div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-right"></i></div>
          </div>
          <div class="privacy-card" @click="router.push({ name: 'Privacy', hash: '#privacy-policy' })">
            <div class="card-icon bg-gray"><i class="fab fa-osi"></i></div>
            <div class="card-text">
              <div class="card-title">{{ $t('pages.privacyPage.openSourceLicenses') }}</div>
            </div>
            <div class="card-arrow"><i class="fas fa-chevron-right"></i></div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
</script>

<style scoped>
#PrivacyCenterView {
  min-height: 100vh;
  background: var(--background);
  color: var(--text-primary);
  padding: 40px 20px;
  font-family: var(--font-family-base);
}

.privacy-container {
  max-width: 800px;
  margin: 0 auto;
}

.privacy-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
}

.privacy-group {
  margin-bottom: 32px;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding-left: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.privacy-card {
  display: flex;
  align-items: center;
  background: var(--card-background);
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: var(--theme-transition);
  border: 1px solid var(--border-color);
}

.privacy-card:hover {
  background: var(--hover-background);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-color);
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
}

.bg-teal { background: #14b8a6; }
.bg-blue { background: #3b82f6; }
.bg-purple { background: #8b5cf6; }
.bg-orange { background: #f97316; }
.bg-green { background: #10b981; }
.bg-cyan { background: #06b6d4; }
.bg-gray { background: #6b7280; }

.card-text {
  flex: 1;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
}

.card-arrow {
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
