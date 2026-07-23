<template>
  <div class="tech-constellation-card">
    <!-- 宇宙星空发光背景 -->
    <div class="nebula-glow"></div>
    
    <!-- 闪烁的小星点 -->
    <div
      v-for="i in 40"
      :key="i"
      class="star-particle"
      :style="{
        width: (Math.random() * 2 + 1) + 'px',
        height: (Math.random() * 2 + 1) + 'px',
        left: (Math.random() * 100) + '%',
        top: (Math.random() * 100) + '%',
        animationDelay: (Math.random() * 3) + 's',
        animationDuration: (Math.random() * 4 + 2) + 's'
      }"
    ></div>

    <!-- 顶部星系分类 Filter Tabs -->
    <div class="category-tabs">
      <button
        v-for="tab in CATEGORIES"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeCategory === tab.key }"
        @click="selectCategory(tab.key)"
      >
        <i :class="tab.iconClass" class="mr-1.5"></i>
        <span>{{ tab.name }}</span>
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- ECharts Canvas 容器 -->
    <div ref="chartRef" class="chart-canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'

const { t, locale } = useI18n()
const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
const activeCategory = ref<string>('all')

const CATEGORIES = computed(() => [
  { key: 'all', name: t('pages.aboutPage.constellation.categories.all'), iconClass: 'fa-solid fa-globe', count: 31 },
  { key: 'frontend', name: t('pages.aboutPage.constellation.categories.frontend'), iconClass: 'fa-solid fa-code', count: 10 },
  { key: 'media', name: t('pages.aboutPage.constellation.categories.media'), iconClass: 'fa-solid fa-cubes', count: 8 },
  { key: 'backend', name: t('pages.aboutPage.constellation.categories.backend'), iconClass: 'fa-solid fa-server', count: 7 },
  { key: 'ai', name: t('pages.aboutPage.constellation.categories.ai'), iconClass: 'fa-solid fa-wand-magic-sparkles', count: 6 }
])

// 图标矢量 SVG Path 集合
const ICONS = {
  layers: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  cube: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  paintbrush: '<path d="M18.37 2.63a2.12 2.12 0 0 1 3 3L13.5 13.5l-4.5 1 1-4.5L18.37 2.63z"/><path d="M9 15v3H6v3H3v-3h3v-3h3z"/>',
  server: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
}

// 动态合成带有 SVG DropShadow 发光滤镜与矢量图标的 Data URI
const makeSvgNode = (color: string, iconKey: keyof typeof ICONS, isCore = false, opacity = 1) => {
  const iconPath = ICONS[iconKey] || ICONS.code
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" opacity="${opacity}">
    <defs>
      <radialGradient id="grad_${color.replace('#','')}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#030712" stop-opacity="0.95" />
      </radialGradient>
      <filter id="glow_${color.replace('#','')}" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="${isCore ? '8' : '4.5'}" flood-color="${color}" flood-opacity="0.95" />
      </filter>
    </defs>
    <circle cx="50" cy="50" r="38" fill="url(#grad_${color.replace('#','')})" stroke="${color}" stroke-width="${isCore ? '3.8' : '2.2'}" filter="url(#glow_${color.replace('#','')})" />
    <g transform="translate(37, 37) scale(1.1)" fill="none" stroke="${isCore ? '#ffffff' : color}" stroke-width="${isCore ? '2.4' : '1.9'}" stroke-linecap="round" stroke-linejoin="round">
      ${iconPath}
    </g>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

interface TechNode {
  id: string
  name: string
  level: number
  category: 'frontend' | 'media' | 'backend' | 'ai'
  color: string
  icon: keyof typeof ICONS
}

const TECH_NODES: TechNode[] = [
  // 核心
  { id: 'core', name: 'Yuemu Full-Stack Engine', level: 0, category: 'frontend', color: '#3b82f6', icon: 'layers' },

  // 前端与 UI 交互 (10)
  { id: 'vue', name: 'Vue 3 Ecosystem', level: 1, category: 'frontend', color: '#3b82f6', icon: 'layers' },
  { id: 'ts', name: 'TypeScript 5', level: 1, category: 'frontend', color: '#06b6d4', icon: 'code' },
  { id: 'vite', name: 'Vite 5 / ESBuild', level: 1, category: 'frontend', color: '#38bdf8', icon: 'wrench' },
  { id: 'pinia', name: 'Pinia State', level: 2, category: 'frontend', color: '#10b981', icon: 'cube' },
  { id: 'router', name: 'Vue Router 4', level: 2, category: 'frontend', color: '#06b6d4', icon: 'globe' },
  { id: 'antd', name: 'Ant Design Vue', level: 2, category: 'frontend', color: '#ec4899', icon: 'layout' },
  { id: 'vant', name: 'Vant Mobile UI', level: 2, category: 'frontend', color: '#f43f5e', icon: 'layout' },
  { id: 'tailwind', name: 'Tailwind CSS', level: 2, category: 'frontend', color: '#38bdf8', icon: 'paintbrush' },
  { id: 'vueuse', name: 'VueUse Utilities', level: 2, category: 'frontend', color: '#10b981', icon: 'code' },
  { id: 'i18n', name: 'Vue-i18n Multi-Lang', level: 2, category: 'frontend', color: '#a855f7', icon: 'globe' },

  // 3D与多媒体引擎 (8)
  { id: 'canvas', name: 'WebGL / Canvas', level: 1, category: 'media', color: '#8b5cf6', icon: 'sparkles' },
  { id: 'three', name: 'Three.js 3D Engine', level: 2, category: 'media', color: '#a855f7', icon: 'cube' },
  { id: 'echarts', name: 'ECharts 5 / Vue-ECharts', level: 2, category: 'media', color: '#c084fc', icon: 'sparkles' },
  { id: 'cobe', name: 'COBE 3D Interactive Globe', level: 2, category: 'media', color: '#6366f1', icon: 'globe' },
  { id: 'wasm', name: 'WebAssembly (WASM)', level: 1, category: 'media', color: '#8b5cf6', icon: 'cpu' },
  { id: 'wavesurfer', name: 'WaveSurfer Audio Wave', level: 2, category: 'media', color: '#f59e0b', icon: 'sparkles' },
  { id: 'lottie', name: 'Lottie Vector Animation', level: 2, category: 'media', color: '#f43f5e', icon: 'sparkles' },
  { id: 'cropper', name: 'Vue-Cropper Image Studio', level: 2, category: 'media', color: '#10b981', icon: 'paintbrush' },

  // 后端架构与高并发 (7)
  { id: 'spring', name: 'Spring Boot 3 Core', level: 1, category: 'backend', color: '#f59e0b', icon: 'database' },
  { id: 'java', name: 'Java 21 LTS High-Perf', level: 1, category: 'backend', color: '#f97316', icon: 'code' },
  { id: 'mybatis', name: 'MyBatis-Flex ORM', level: 2, category: 'backend', color: '#eab308', icon: 'database' },
  { id: 'redis', name: 'Redis & Redisson Lock', level: 2, category: 'backend', color: '#ef4444', icon: 'cpu' },
  { id: 'mysql', name: 'MySQL 8.0 Sharding DB', level: 2, category: 'backend', color: '#0284c7', icon: 'database' },
  { id: 'websocket', name: 'WebSocket & SSE Sync', level: 2, category: 'backend', color: '#10b981', icon: 'server' },
  { id: 'axios', name: 'Axios / HTTP Gateway', level: 2, category: 'backend', color: '#34d399', icon: 'wrench' },

  // AI与云原生基础设施 (6)
  { id: 'ai_engine', name: 'FLUX.1 & SDXL AI Engine', level: 1, category: 'ai', color: '#a855f7', icon: 'sparkles' },
  { id: 'fastapi', name: 'Python FastAPI Pipeline', level: 2, category: 'ai', color: '#059669', icon: 'terminal' },
  { id: 'pytorch', name: 'PyTorch & OpenCV Vision', level: 2, category: 'ai', color: '#ea580c', icon: 'code' },
  { id: 'cos', name: 'Tencent COS / Aliyun OSS', level: 2, category: 'ai', color: '#0284c7', icon: 'cloud' },
  { id: 'docker', name: 'Docker & Nginx Cluster', level: 2, category: 'ai', color: '#0284c7', icon: 'shield' },
  { id: 'prerender', name: 'Pre-rendering / SSR SEO', level: 2, category: 'ai', color: '#8b5cf6', icon: 'globe' }
]

const EDGES = [
  // 核心枢纽
  { source: 'core', target: 'vue' },
  { source: 'core', target: 'canvas' },
  { source: 'core', target: 'spring' },
  { source: 'core', target: 'ai_engine' },

  // 前端生态网络
  { source: 'vue', target: 'ts' },
  { source: 'vue', target: 'vite' },
  { source: 'vue', target: 'pinia' },
  { source: 'vue', target: 'router' },
  { source: 'vue', target: 'antd' },
  { source: 'ts', target: 'vueuse' },
  { source: 'vite', target: 'tailwind' },
  { source: 'antd', target: 'vant' },
  { source: 'vue', target: 'i18n' },
  { source: 'pinia', target: 'axios' },

  // 3D与多媒体引擎网络
  { source: 'canvas', target: 'three' },
  { source: 'canvas', target: 'echarts' },
  { source: 'canvas', target: 'cobe' },
  { source: 'canvas', target: 'wasm' },
  { source: 'three', target: 'lottie' },
  { source: 'wasm', target: 'cropper' },
  { source: 'canvas', target: 'wavesurfer' },

  // 后端微服务网络
  { source: 'spring', target: 'java' },
  { source: 'spring', target: 'mybatis' },
  { source: 'spring', target: 'redis' },
  { source: 'spring', target: 'websocket' },
  { source: 'mybatis', target: 'mysql' },
  { source: 'java', target: 'axios' },

  // AI与云设施网络
  { source: 'ai_engine', target: 'fastapi' },
  { source: 'ai_engine', target: 'pytorch' },
  { source: 'ai_engine', target: 'cos' },
  { source: 'fastapi', target: 'docker' },
  { source: 'vite', target: 'prerender' },
  { source: 'cos', target: 'docker' },

  // 跨领域交互关联
  { source: 'axios', target: 'spring' },
  { source: 'cropper', target: 'ai_engine' },
  { source: 'echarts', target: 'vue' },
  { source: 'websocket', target: 'vue' }
]

const updateChartOptions = () => {
  if (!chart) return

  const cat = activeCategory.value

  const nodes = TECH_NODES.map((tech) => {
    const isCore = tech.level === 0
    const isPrimary = tech.level === 1
    const size = isCore ? 76 : isPrimary ? 54 : 42

    const isMatch = cat === 'all' || tech.category === cat || tech.id === 'core'
    const nodeOpacity = isMatch ? 1 : 0.22

    return {
      id: tech.id,
      name: tech.name,
      symbol: `image://${makeSvgNode(tech.color, tech.icon, isCore, nodeOpacity)}`,
      symbolSize: size,
      itemStyle: { opacity: nodeOpacity },
      label: {
        show: true,
        position: 'bottom',
        distance: 6,
        color: isMatch ? '#e2e8f0' : '#475569',
        fontSize: isCore ? 14 : 11.5,
        fontWeight: isCore ? 'bold' : '600',
        backgroundColor: isMatch ? 'rgba(9, 9, 11, 0.88)' : 'rgba(9, 9, 11, 0.4)',
        borderColor: isMatch ? tech.color : 'rgba(255, 255, 255, 0.05)',
        borderWidth: isMatch ? 1.2 : 0.5,
        borderRadius: 6,
        padding: [3, 8]
      }
    }
  })

  const links = EDGES.map((edge) => {
    const srcNode = TECH_NODES.find(n => n.id === edge.source)
    const tgtNode = TECH_NODES.find(n => n.id === edge.target)

    const isSrcMatch = cat === 'all' || srcNode?.category === cat || edge.source === 'core'
    const isTgtMatch = cat === 'all' || tgtNode?.category === cat || edge.target === 'core'
    const linkOpacity = isSrcMatch && isTgtMatch ? 0.65 : 0.12

    return {
      source: edge.source,
      target: edge.target,
      lineStyle: {
        width: isSrcMatch && isTgtMatch ? 1.8 : 1,
        curveness: 0.16,
        opacity: linkOpacity,
        color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
          { offset: 0, color: srcNode?.color || '#3b82f6' },
          { offset: 1, color: tgtNode?.color || '#06b6d4' }
        ])
      }
    }
  })

  const option: any = {
    backgroundColor: 'transparent',
    tooltip: {
      show: true,
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(59, 130, 246, 0.4)',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 13 },
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const tech = TECH_NODES.find(n => n.id === params.data.id)
          if (!tech) return params.name
          const catObj = CATEGORIES.value.find(c => c.key === tech.category)
          const domainLabel = t('pages.aboutPage.constellation.tooltipField')
          const defaultDomain = t('pages.aboutPage.constellation.defaultDomain')
          return `<div style="padding: 4px 8px;">
            <div style="font-weight: bold; font-size: 14px; color: ${tech.color}">${tech.name}</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${domainLabel}${catObj?.name || defaultDomain}</div>
          </div>`
        }
        return ''
      }
    },
    animationDurationUpdate: 800,
    animationEasingUpdate: 'cubicInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        roam: true,
        label: { show: true },
        force: {
          repulsion: 520,
          edgeLength: [90, 175],
          gravity: 0.055,
          layoutAnimation: true
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3.5,
            opacity: 1
          }
        }
      }
    ]
  }

  chart.setOption(option)
}

const selectCategory = (catKey: string) => {
  activeCategory.value = catKey
  updateChartOptions()
}

watch(locale, () => {
  updateChartOptions()
})

const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, undefined, { renderer: 'canvas' })
  updateChartOptions()
}

const handleResize = () => {
  chart?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.tech-constellation-card {
  position: relative;
  width: 100%;
  height: 680px;
  background: radial-gradient(ellipse at bottom, #0c192c 0%, #030712 100%);
  border-radius: 36px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
}

.nebula-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 75%);
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
}

.star-particle {
  position: absolute;
  border-radius: 50%;
  background: #ffffff;
  pointer-events: none;
  animation: twinkle linear infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.15; transform: scale(0.8); }
  50% { opacity: 0.85; transform: scale(1.3); }
}

.category-tabs {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 6px 10px;
  border-radius: 100px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  max-width: 92%;
  overflow-x: auto;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 7px 14px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.06);
}

.tab-btn.active {
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  font-weight: 600;
}

.tab-count {
  margin-left: 6px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.15);
  padding: 1px 6px;
  border-radius: 20px;
}

.tab-btn.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.chart-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 10;
  padding-top: 30px;
}

@media (max-width: 768px) {
  .tech-constellation-card {
    height: 520px;
    border-radius: 24px;
  }

  .category-tabs {
    top: 14px;
    padding: 4px 6px;
    gap: 4px;
  }

  .tab-btn {
    padding: 5px 10px;
    font-size: 12px;
  }
}
</style>

