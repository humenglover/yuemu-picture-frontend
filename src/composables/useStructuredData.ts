/**
 * SEO structured data (JSON-LD) injection composable.
 * Injects <script type="application/ld+json"> into <head> and cleans up on unmount.
 */
import { onMounted, onUnmounted, watchEffect, isReactive, isRef, toValue } from 'vue'

export function useStructuredData(data: Record<string, unknown> | (() => Record<string, unknown>)) {
  let scriptEl: HTMLScriptElement | null = null

  onMounted(() => {
    const initial = typeof data === 'function' ? data() : data
    scriptEl = injectStructuredData(initial)

    // If a getter was passed, reactively update on changes
    if (typeof data === 'function') {
      watchEffect(() => {
        const updated = data()
        if (scriptEl) {
          scriptEl.textContent = JSON.stringify(updated, null, 2)
        }
      })
    }
  })

  onUnmounted(() => {
    if (scriptEl?.parentNode) {
      scriptEl.parentNode.removeChild(scriptEl)
    }
  })
}

/** One-shot injection (call outside setup if needed) */
export function injectStructuredData(data: Record<string, unknown>): HTMLScriptElement {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data, null, 2)
  document.head.appendChild(script)
  return script
}

// ── Schema builders ──

export function buildImageObject(params: {
  url: string
  name: string
  description?: string
  width?: number
  height?: number
  author?: string
  datePublished?: string
  license?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: params.url,
    name: params.name,
    description: params.description || '',
    ...(params.width && { width: params.width }),
    ...(params.height && { height: params.height }),
    ...(params.author && {
      author: { '@type': 'Person', name: params.author },
    }),
    ...(params.datePublished && { datePublished: params.datePublished }),
    ...(params.license && { license: params.license }),
  }
}

export function buildBreadcrumbList(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildArticle(params: {
  headline: string
  description?: string
  image?: string
  author?: string
  datePublished?: string
  dateModified?: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.headline,
    ...(params.description && { description: params.description }),
    ...(params.image && { image: params.image }),
    ...(params.author && {
      author: { '@type': 'Person', name: params.author },
    }),
    ...(params.datePublished && { datePublished: params.datePublished }),
    ...(params.dateModified && { dateModified: params.dateModified }),
    url: params.url,
    publisher: {
      '@type': 'Organization',
      name: '悦木图库',
      url: 'https://www.yuemutuku.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.yuemutuku.com/logo.png',
      },
    },
  }
}
