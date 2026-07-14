import { createI18n } from 'vue-i18n'
import zhCN from './zh'
import enUS from './en'

/**
 * 获取默认语言
 * 优先级：localStorage 用户选择 > 浏览器语言 > 兜底 zh-CN
 * 只支持 zh-CN 和 en-US 两种语言，浏览器语言匹配前缀即可（zh* → zh-CN，其余 → en-US）
 */
const getDefaultLanguage = (): string => {
  const saved = localStorage.getItem('locale')
  if (saved && ['zh-CN', 'en-US'].includes(saved)) {
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
