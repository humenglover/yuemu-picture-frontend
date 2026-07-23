/**
 * Composable for locale-aware navigation.
 */
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  i18nToUrlLocale,
  localizePath,
  hasLocalePrefix,
  stripLocalePrefix,
  SUPPORTED_URL_LOCALES,
  DEFAULT_URL_LOCALE,
} from '@/router/localeRouter'

export function useLocaleRouter() {
  const router = useRouter()
  const route = useRoute()
  const { locale } = useI18n()

  const currentUrlLocale = computed<string>(() => {
    const fromParam = route.params.locale as string | undefined
    if (fromParam && SUPPORTED_URL_LOCALES.includes(fromParam)) return fromParam
    return i18nToUrlLocale(locale.value) || DEFAULT_URL_LOCALE
  })

  const localePrefix = computed(() => `/${currentUrlLocale.value}`)
  const pathWithoutLocale = computed(() => stripLocalePrefix(route.path))

  function localePath(rawPath: string): string {
    if (hasLocalePrefix(rawPath)) return rawPath
    return localizePath(rawPath, currentUrlLocale.value)
  }

  function localePush(to: any): ReturnType<typeof router.push> {
    if (typeof to === 'string') return router.push(localePath(to))
    if (to.path) return router.push({ ...to, path: localePath(to.path) })
    return router.push(to)
  }

  function localeReplace(to: any): ReturnType<typeof router.replace> {
    if (typeof to === 'string') return router.replace(localePath(to))
    if (to.path) return router.replace({ ...to, path: localePath(to.path) })
    return router.replace(to)
  }

  return { currentUrlLocale, localePrefix, pathWithoutLocale, localePath, localePush, localeReplace }
}
