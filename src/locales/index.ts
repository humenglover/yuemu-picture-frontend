import { createI18n } from 'vue-i18n'
import { LOCALE_CONFIG, urlLocaleToI18n, resolvePreferredLocale, SUPPORTED_URL_LOCALES } from '@/router/localeRouter'
import zhCN from './zh'
import enUS from './en'

export interface LanguageOption {
  code: string
  name: string
  shortName: string
  label: string
  icon?: string
}

/**
 * UI 语言选择器配置 — 从 LOCALE_CONFIG 自动派生。
 * 加新语言：只改 localeRouter.ts 的 LOCALE_CONFIG + 加翻译文件 + 加到这里。
 */
const LANGUAGE_LABELS: Record<string, { name: string; shortName: string; icon: string }> = {
  zh: { name: '简体中文', shortName: 'ZH', icon: '🇨🇳' },
  en: { name: 'English',  shortName: 'EN', icon: '🇺🇸' },
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = SUPPORTED_URL_LOCALES.map(key => ({
  code: LOCALE_CONFIG[key].i18n,
  name: LANGUAGE_LABELS[key]?.name ?? key,
  shortName: LANGUAGE_LABELS[key]?.shortName ?? key.toUpperCase(),
  label: `${LANGUAGE_LABELS[key]?.shortName ?? key.toUpperCase()} (${LANGUAGE_LABELS[key]?.name ?? key})`,
  icon: LANGUAGE_LABELS[key]?.icon,
}))

/**
 * 获取默认语言
 * 优先级：URL 路径 → localStorage 用户选择 → 浏览器语言 → 配置默认
 */
const getDefaultLanguage = (): string => {
  // 1. URL 路径检测（直接访问 /en/xxx）
  try {
    const pathMatch = window.location.pathname.match(new RegExp(`^\\/(${SUPPORTED_URL_LOCALES.join('|')})(\\/|$)`))
    if (pathMatch) return urlLocaleToI18n(pathMatch[1])
  } catch (_) { /* SSR */ }

  // 2. localStorage
  const saved = localStorage.getItem('locale')
  if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) return saved

  // 3. 浏览器语言 → 查表
  return urlLocaleToI18n(resolvePreferredLocale())
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLanguage(),
  fallbackLocale: 'en-US',
  messages: Object.fromEntries(
    SUPPORTED_URL_LOCALES.map(k => [LOCALE_CONFIG[k].i18n, k === 'zh' ? zhCN : enUS])
  ),
})

export default i18n
