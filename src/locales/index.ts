import { createI18n } from 'vue-i18n'
import zhCN from './zh'
import enUS from './en'

// Try to get language from localStorage, default to zh-CN
const defaultLanguage = localStorage.getItem('locale') || 'zh-CN'

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
