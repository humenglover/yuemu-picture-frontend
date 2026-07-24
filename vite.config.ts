import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import compression from 'vite-plugin-compression'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // let apiTarget = 'http://localhost:8123'
  let apiTarget = 'https://www.yuemutuku.com'

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
      isProd && compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 10240 }),
      isProd && compression({ algorithm: 'gzip', ext: '.gz', threshold: 10240 }),
      AutoImport({
        resolvers: [VantResolver()],
        imports: [
          { 'ant-design-vue': ['message', 'notification', 'Modal'] },
        ],
      }),
      Components({
        resolvers: [VantResolver(), AntDesignVueResolver({ importStyle: false })],
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
      rollupOptions: {
        output: {
          manualChunks(id) {
            // ── Vue 全家桶留在主 bundle —— Antd/Vant 等 UI 库启动时依赖它，拆出去会加载顺序错乱 ──

            // ── UI 库 ──
            if (id.includes('node_modules/ant-design-vue') || id.includes('node_modules/@ant-design')) {
              return 'vendor-antd'
            }
            if (id.includes('node_modules/vant')) return 'vendor-vant'

            // ── 图表 ──
            if (id.includes('node_modules/echarts') || id.includes('node_modules/vue-echarts') || id.includes('node_modules/echarts-wordcloud')) {
              return 'vendor-echarts'
            }
            if (id.includes('node_modules/zrender')) return 'vendor-echarts'

            // ── Markdown 编辑器 ──
            if (id.includes('node_modules/bytemd') || id.includes('node_modules/markdown-it') || id.includes('node_modules/@bytemd')) {
              return 'vendor-markdown'
            }

            // ── 3D / 动画 / 音频 ──
            if (id.includes('node_modules/three')) return 'vendor-three'
            if (id.includes('node_modules/swiper')) return 'vendor-swiper'
            if (id.includes('node_modules/lottie')) return 'vendor-lottie'
            if (id.includes('node_modules/wavesurfer')) return 'vendor-audio'

            // ── 图像处理 ──
            if (id.includes('node_modules/html2canvas')) return 'vendor-image'
            if (id.includes('node_modules/dom-to-image')) return 'vendor-image'
            if (id.includes('node_modules/compressorjs')) return 'vendor-image'
            if (id.includes('node_modules/colorthief')) return 'vendor-image'
            if (id.includes('node_modules/browser-image-compression')) return 'vendor-image'
            if (id.includes('node_modules/tui-image-editor')) return 'vendor-image'

            // ── 工具库 ──
            if (id.includes('node_modules/lodash-es') || id.includes('node_modules/lodash/')) return 'vendor-utils'
            if (id.includes('node_modules/date-fns')) return 'vendor-utils'
            if (id.includes('node_modules/axios')) return 'vendor-utils'
            if (id.includes('node_modules/file-saver')) return 'vendor-utils'
            if (id.includes('node_modules/qrcode') || id.includes('node_modules/qrcodejs2') || id.includes('node_modules/jsqr')) return 'vendor-qr'

            // ── VueUse ──
            if (id.includes('node_modules/@vueuse')) return 'vendor-vueuse'

            // ── 音频处理 ──
            if (id.includes('node_modules/lamejs') || id.includes('node_modules/music-metadata')) return 'vendor-audio'
            if (id.includes('node_modules/recorder')) return 'vendor-audio'
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
    define: {
      // 开启/关闭全局广告
      __ENABLE_ADS__: JSON.stringify(true),
    }
  }
})
