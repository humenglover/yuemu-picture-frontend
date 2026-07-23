<template>
  <Teleport to="body">
    <Transition name="cookie-banner">
      <div v-if="visible" class="cookie-consent-backdrop">
        <div class="cookie-consent-panel">
          <!-- Header -->
          <div class="cookie-consent-header">
            <SafetyCertificateOutlined class="cookie-consent-icon" />
            <h3 class="cookie-consent-title">{{ $t('pages.app.cookieConsent.title') }}</h3>
          </div>

          <!-- Body -->
          <div class="cookie-consent-body">
            <p class="cookie-consent-desc">
              {{ $t('pages.app.cookieConsent.description') }}
            </p>

            <!-- Cookie categories (shown when customizing) -->
            <div v-if="showDetails" class="cookie-categories">
              <div class="cookie-category">
                <div class="cookie-category-header">
                  <a-switch :checked="true" disabled size="small" />
                  <span class="cookie-category-name">{{ $t('pages.app.cookieConsent.necessary') }}</span>
                </div>
                <p class="cookie-category-desc">{{ $t('pages.app.cookieConsent.necessaryDesc') }}</p>
              </div>
              <div class="cookie-category">
                <div class="cookie-category-header">
                  <a-switch v-model:checked="preferences.analytics" size="small" />
                  <span class="cookie-category-name">{{ $t('pages.app.cookieConsent.analytics') }}</span>
                </div>
                <p class="cookie-category-desc">{{ $t('pages.app.cookieConsent.analyticsDesc') }}</p>
              </div>
              <div class="cookie-category">
                <div class="cookie-category-header">
                  <a-switch v-model:checked="preferences.marketing" size="small" />
                  <span class="cookie-category-name">{{ $t('pages.app.cookieConsent.marketing') }}</span>
                </div>
                <p class="cookie-category-desc">{{ $t('pages.app.cookieConsent.marketingDesc') }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="cookie-consent-actions">
            <button class="cookie-btn cookie-btn--detail" @click="showDetails = !showDetails">
              {{ showDetails ? $t('pages.app.cookieConsent.hideDetails') : $t('pages.app.cookieConsent.customize') }}
            </button>
            <div class="cookie-btn-group">
              <button class="cookie-btn cookie-btn--necessary" @click="acceptNecessary">
                {{ $t('pages.app.cookieConsent.necessaryOnly') }}
              </button>
              <button class="cookie-btn cookie-btn--accept" @click="acceptAll">
                {{ $t('pages.app.cookieConsent.acceptAll') }}
              </button>
            </div>
          </div>

          <!-- Footer link -->
          <p class="cookie-consent-footer">
            <router-link :to="{ name: 'Privacy' }">{{ $t('pages.app.cookieConsent.privacyPolicy') }}</router-link>
            <span class="cookie-divider">|</span>
            <router-link :to="{ name: 'PrivacyCenter' }">{{ $t('pages.app.cookieConsent.privacyCenter') }}</router-link>
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { SafetyCertificateOutlined } from '@ant-design/icons-vue'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

const STORAGE_KEY = 'cookie-consent-preferences'
const VISITED_KEY = 'cookie-consent-visited'

const visible = ref(false)
const showDetails = ref(false)
const preferences = reactive<CookiePreferences>({
  necessary: true, // always required
  analytics: false,
  marketing: false,
})

function loadStoredPreferences(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as CookiePreferences
      preferences.necessary = true
      preferences.analytics = parsed.analytics ?? false
      preferences.marketing = parsed.marketing ?? false
      return true
    }
  } catch {
    // corrupted data, ignore
  }
  return false
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  localStorage.setItem(VISITED_KEY, '1')
}

function applyConsent(prefs: CookiePreferences) {
  savePreferences(prefs)
  visible.value = false

  if (prefs.analytics) {
    // Enable analytics (e.g. Google Analytics, etc.)
    enableAnalytics()
  }
  if (prefs.marketing) {
    // Enable marketing cookies
    enableMarketing()
  }

  // Dispatch event so other parts of the app can react
  window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: prefs }))
}

function acceptAll() {
  const prefs: CookiePreferences = { necessary: true, analytics: true, marketing: true }
  preferences.analytics = true
  preferences.marketing = true
  applyConsent(prefs)
}

function acceptNecessary() {
  const prefs: CookiePreferences = { necessary: true, analytics: false, marketing: false }
  preferences.analytics = false
  preferences.marketing = false
  applyConsent(prefs)
}

// Hooks for analytics & marketing — replace with actual implementations
function enableAnalytics() {
  // e.g. window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
  console.log('[CookieConsent] Analytics cookies enabled')
}

function enableMarketing() {
  // e.g. window.gtag?.('consent', 'update', { ad_storage: 'granted' })
  console.log('[CookieConsent] Marketing cookies enabled')
}

onMounted(() => {
  const hasStored = loadStoredPreferences()

  // If user has previously visited and made a choice, don't show again
  if (hasStored) {
    // Re-apply the stored preferences (e.g. on page reload, re-enable analytics)
    if (preferences.analytics) enableAnalytics()
    if (preferences.marketing) enableMarketing()
    return
  }

  // Show the banner with a small delay for smooth entry animation
  setTimeout(() => {
    visible.value = true
  }, 400)
})
</script>

<style scoped>
/* ── Backdrop ──────────────────────────────────── */
.cookie-consent-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
}

/* ── Panel ─────────────────────────────────────── */
.cookie-consent-panel {
  width: 100%;
  max-width: 480px;
  background: var(--card-background, #ffffff);
  border-radius: 20px;
  padding: 24px 24px 20px;
  color: var(--text-primary, #333);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.18),
    0 0 0 1px var(--border-color, rgba(200, 190, 180, 0.22));
  max-height: 85vh;
  overflow-y: auto;
  margin-bottom: env(safe-area-inset-bottom, 8px);
}

/* ── Header ────────────────────────────────────── */
.cookie-consent-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.cookie-consent-icon {
  font-size: 26px;
  color: var(--nav-item-active-text, #3b82f6);
  display: flex;
  align-items: center;
}

.cookie-consent-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #333);
}

/* ── Body ──────────────────────────────────────── */
.cookie-consent-body {
  margin-bottom: 20px;
}

.cookie-consent-desc {
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--text-secondary, #666);
  margin: 0 0 14px;
}

/* ── Categories ────────────────────────────────── */
.cookie-categories {
  background: var(--yuemu-input-bg, #f3f3f6);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cookie-category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.cookie-category-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.cookie-category-desc {
  font-size: 12px;
  color: var(--text-secondary, #666);
  margin: 0;
  padding-left: 40px;
  line-height: 1.5;
}

/* ── Actions ───────────────────────────────────── */
.cookie-consent-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
  justify-content: space-between;
}

.cookie-btn-group {
  display: flex;
  gap: 8px;
}

.cookie-btn {
  border: none;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 10px 18px;
  -webkit-user-select: none;
  user-select: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.cookie-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}

.cookie-btn--detail {
  background: transparent;
  color: var(--text-secondary, #666);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 500;
  padding: 10px 8px;
}

.cookie-btn--necessary {
  background: var(--yuemu-input-bg, #f3f3f6);
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, rgba(200, 190, 180, 0.22));
}

.cookie-btn--accept {
  background: linear-gradient(135deg, var(--link-hover-color, #60a5fa) 0%, var(--nav-item-active-text, #3b82f6) 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}

/* ── Footer ────────────────────────────────────── */
.cookie-consent-footer {
  text-align: center;
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary, #666);
}

.cookie-consent-footer a {
  color: var(--link-color, #3b82f6);
  text-decoration: none;
  font-weight: 500;
}

.cookie-consent-footer a:hover {
  color: var(--link-hover-color, #2563eb);
  text-decoration: underline;
}

.cookie-divider {
  margin: 0 8px;
  opacity: 0.4;
}

/* ── Transition ────────────────────────────────── */
.cookie-banner-enter-active {
  transition: opacity 0.25s ease;
}
.cookie-banner-leave-active {
  transition: opacity 0.2s ease;
}
.cookie-banner-enter-active .cookie-consent-panel {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cookie-banner-leave-active .cookie-consent-panel {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}
.cookie-banner-enter-from {
  opacity: 0;
}
.cookie-banner-leave-to {
  opacity: 0;
}
.cookie-banner-enter-from .cookie-consent-panel {
  transform: translateY(30px) scale(0.96);
  opacity: 0;
}
.cookie-banner-leave-to .cookie-consent-panel {
  transform: translateY(20px) scale(0.97);
  opacity: 0;
}

/* ── Mobile ────────────────────────────────────── */
@media (max-width: 520px) {
  .cookie-consent-backdrop {
    padding: 12px;
  }
  .cookie-consent-panel {
    padding: 20px 18px 16px;
    border-radius: 18px;
    margin-bottom: env(safe-area-inset-bottom, 4px);
  }
  .cookie-consent-title {
    font-size: 16px;
  }
  .cookie-consent-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .cookie-btn-group {
    flex-direction: column;
  }
  .cookie-btn {
    text-align: center;
    padding: 12px 16px;
    font-size: 14px;
  }
}
</style>
