import { createI18n } from 'vue-i18n'
import zhCN from './zh'
import enUS from './en'

export interface LanguageOption {
  code: string
  name: string
  shortName: string
  label: string
  icon?: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'zh-CN', name: '简体中文', shortName: 'ZH', label: 'ZH (简体中文)', icon: '🇨🇳' },
  { code: 'en-US', name: 'English', shortName: 'EN', label: 'EN (English)', icon: '🇺🇸' },
]

/**
 * 获取默认语言
 * 优先级：localStorage 用户选择 > 浏览器语言 > 兜底 zh-CN
 */
const getDefaultLanguage = (): string => {
  const saved = localStorage.getItem('locale')
  if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
    return saved
  }
  const browserLang = navigator.language || (navigator as any).userLanguage || ''
  return browserLang.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

const defaultLanguage = getDefaultLanguage()

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: defaultLanguage,
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export default i18n
