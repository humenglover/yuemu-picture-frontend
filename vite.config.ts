import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  let apiTarget = 'http://localhost:8123'
  // let apiTarget = 'https://www.yuemutuku.com'
  if (mode === 'production') {
    apiTarget = 'https://www.yuemutuku.com'
  } else if (mode === 'staging') {
    apiTarget = 'https://lumenglover.com'
  }

  const isProd = mode === 'production'
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'lottie-player'
          }
        }
      }),
      !isProd && vueDevTools(),
      AutoImport({
        resolvers: [VantResolver()],
      }),
      Components({
        resolvers: [VantResolver()],
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
          // 关键：禁用缓冲以支持SSE流式传输
          buffer: false,
          timeout: 600000, // 10 minutes
          proxyTimeout: 600000 // 10 minutes
        }
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        'Referrer-Policy': 'no-referrer-when-downgrade'
      }
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
          pure_funcs: ['console.log', 'console.info', 'console.warn', 'console.error', 'console.debug']
        },
        format: {
          comments: false,
        }
      },
    },
    define: {
      // 开启/关闭全局广告
      __ENABLE_ADS__: JSON.stringify(true),
    }
  }
})
