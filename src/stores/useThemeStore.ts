import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDarkTheme = ref(false)
  const isAnimating = ref(false)

  // 切换主题
  const toggleTheme = () => {
    if (isAnimating.value) return
    const isDark = !isDarkTheme.value

    const performThemeChange = () => {
      isDarkTheme.value = isDark
      document.documentElement.classList.toggle('dark-theme', isDark)
      document.body.classList.remove('dark-theme', 'light-theme')
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
      window.dispatchEvent(new Event('themeChange'))
    }

    // 优先使用浏览器原生的 View Transition API，效果平滑且绝无二次闪烁
    if (typeof document.startViewTransition === 'function') {
      isAnimating.value = true
      const transition = document.startViewTransition(() => {
        performThemeChange()
      })
      transition.finished.finally(() => {
        isAnimating.value = false
      })
    } else {
      // 降级直接切换，配合 CSS 变量渐变，实现无闪烁的过渡效果
      performThemeChange()
    }
  }

  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      isDarkTheme.value = true
      document.documentElement.classList.add('dark-theme')
    }
    // 初始清理 body 污染
    document.body.classList.remove('dark-theme', 'light-theme')
  }

  return {
    isDarkTheme,
    isAnimating,
    toggleTheme,
    initTheme
  }
})
