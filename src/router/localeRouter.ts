/**
 * Locale-aware router utilities — data-driven, zero if/else per language.
 *
 * To add a new language (e.g. Japanese):
 *   1. Add entry to LOCALE_CONFIG below
 *   2. Update SUPPORTED_LOCALES array
 *   3. Add locale files at src/locales/{key}/
 *   4. Done — routes, hreflang, sitemap all pick it up automatically.
 */

// ── 语言配置（加语言只改这里） ──

export interface LocaleConfig {
  /** URL 路径前缀，如 'zh', 'en', 'ja' */
  urlPrefix: string
  /** vue-i18n locale code */
  i18n: string
  /** HTML lang attribute */
  htmlLang: string
  /** Open Graph locale */
  ogLocale: string
  /** 默认优先级的 fallback 链 */
  fallbackPriority: number
}

export const LOCALE_CONFIG: Record<string, LocaleConfig> = {
  zh: { urlPrefix: 'zh', i18n: 'zh-CN', htmlLang: 'zh-CN', ogLocale: 'zh_CN', fallbackPriority: 0 },
  en: { urlPrefix: 'en', i18n: 'en-US', htmlLang: 'en',    ogLocale: 'en_US', fallbackPriority: 1 },
}

// ── 派生常量（从配置自动生成，不要手改） ──

export const SUPPORTED_URL_LOCALES = Object.keys(LOCALE_CONFIG) as string[]
export const SUPPORTED_I18N_LOCALES = Object.values(LOCALE_CONFIG).map(c => c.i18n)
export const DEFAULT_URL_LOCALE = SUPPORTED_URL_LOCALES[0]!

/** 用于路由正则: '(zh|en|ja)' */
export const LOCALE_PATTERN = `(${SUPPORTED_URL_LOCALES.join('|')})`

// 预编译正则（加语言后自动重建）
let _localeRegex: RegExp | null = null
function localeRegex(): RegExp {
  if (!_localeRegex) _localeRegex = new RegExp(`^\\/(${SUPPORTED_URL_LOCALES.join('|')})(\\/|$)`)
  return _localeRegex
}

let _stripRegex: RegExp | null = null
function stripRegex(): RegExp {
  if (!_stripRegex) _stripRegex = new RegExp(`^\\/(${SUPPORTED_URL_LOCALES.join('|')})(\\/|$)`)
  return _stripRegex
}

// ── 映射函数（查表，零 if/else） ──

/** URL prefix → vue-i18n code. 'en' → 'en-US', 'zh' → 'zh-CN' */
export function urlLocaleToI18n(urlLocale: string): string {
  return LOCALE_CONFIG[urlLocale]?.i18n ?? LOCALE_CONFIG[DEFAULT_URL_LOCALE].i18n
}

/** vue-i18n code → URL prefix. 'en-US' → 'en', 'zh-CN' → 'zh' */
export function i18nToUrlLocale(i18nLocale: string): string {
  for (const cfg of Object.values(LOCALE_CONFIG)) {
    if (i18nLocale.startsWith(cfg.urlPrefix)) return cfg.urlPrefix
  }
  return DEFAULT_URL_LOCALE
}

/** URL prefix → HTML lang. 'zh' → 'zh-CN', 'en' → 'en' */
export function urlLocaleToHtmlLang(urlLocale: string): string {
  return LOCALE_CONFIG[urlLocale]?.htmlLang ?? LOCALE_CONFIG[DEFAULT_URL_LOCALE].htmlLang
}

/** URL prefix → OG locale. 'zh' → 'zh_CN', 'en' → 'en_US' */
export function urlLocaleToOgLocale(urlLocale: string): string {
  return LOCALE_CONFIG[urlLocale]?.ogLocale ?? LOCALE_CONFIG[DEFAULT_URL_LOCALE].ogLocale
}

// ── 路径工具 ──

/** Extract locale from a path. Returns null if no locale prefix found. */
export function localeFromPath(path: string): string | null {
  const match = path.match(localeRegex())
  return match?.[1] ?? null
}

/** Check if a path already has a supported locale prefix */
export function hasLocalePrefix(path: string): boolean {
  return localeFromPath(path) !== null
}

/** Strip locale prefix: '/zh/about' → '/about', '/about' → '/about' */
export function stripLocalePrefix(path: string): string {
  const cleaned = path.replace(stripRegex(), '/')
  return cleaned || '/'
}

/** Add/replace locale prefix: localizePath('/about', 'en') → '/en/about' */
export function localizePath(path: string, locale: string): string {
  const clean = path.replace(stripRegex(), '/')
  const normalized = clean.startsWith('/') ? clean : `/${clean}`
  return `/${locale}${normalized === '/' ? '' : normalized}`
}

// ── 用户偏好检测 ──

/**
 * Determine the preferred locale for a new visitor.
 * Priority: localStorage → browser language → default (first in config)
 */
export function resolvePreferredLocale(): string {
  try {
    const saved = localStorage.getItem('locale')
    if (saved) {
      for (const cfg of Object.values(LOCALE_CONFIG)) {
        if (saved.startsWith(cfg.urlPrefix)) return cfg.urlPrefix
      }
    }
  } catch (_) { /* unavailable */ }

  try {
    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase()
    for (const cfg of Object.values(LOCALE_CONFIG).sort((a, b) => a.fallbackPriority - b.fallbackPriority)) {
      if (browserLang.startsWith(cfg.urlPrefix)) return cfg.urlPrefix
    }
  } catch (_) { /* unavailable */ }

  return DEFAULT_URL_LOCALE
}
