<template>
  <div class="scrapbook-page">
    <main class="scrapbook-container">
      
      <div v-if="isLoading" class="skeleton-doodle">
        <div class="skel-text">{{ $t('pages.contactPage.loadingNotebook') }}</div>
      </div>

      <transition name="fade-scrapbook">
        <div v-show="!isLoading" class="scrapbook-grid">

          <!-- 1. Hero Section (12) -->
          <section class="scrapbook-item span-12 rot-1 flex-row">
            <div class="tape tape-yellow" style="top: -15px; left: 20%; transform: rotate(-3deg);"></div>
            <div class="tape tape-blue" style="bottom: -15px; right: 20%; transform: rotate(2deg);"></div>
            
            <div class="polaroid-wrapper">
              <div class="polaroid-card rot-3">
                <div class="tape tape-pink" style="top: -10px; left: 50%; transform: translateX(-50%) rotate(4deg);"></div>
                <img src="https://github.com/humenglover.png" class="polaroid-img" onerror="this.src='https://api.dicebear.com/7.x/notionists/svg?seed=humenglover'" />
                <div class="polaroid-caption">@{{ $t('pages.contactPage.author') }}</div>
              </div>
            </div>
            
            <div class="hero-info">
              <h1 class="handwriting-title">✨ Hi, I'm Small Vegetables!</h1>
              <p class="handwriting-text">A small party dish. {{ $t('pages.contactPage.welcome') }}~</p>
              <div class="doodle-tags">
                <span class="doodle-tag">#{{ $t('pages.contactPage.developer') }}</span>
                <span class="doodle-tag">#{{ $t('pages.contactPage.opensourceLover') }}</span>
              </div>
              <p class="handwriting-text" style="opacity: 0.8;">{{ $t('pages.contactPage.loveFrontend') }}</p>
            </div>
          </section>

          <!-- 2. Skills Checklist (4) -->
          <section class="scrapbook-item span-4 notepad-page rot-neg-2">
            <div class="binder-holes"></div>
            <h2 class="handwriting-title" style="margin-top: 10px;"><i class="fas fa-clipboard-list"></i> {{ $t('pages.contactPage.skillList') }}</h2>
            <ul class="checklist">
              <li><span class="check-box checked">✔</span> Vue.js / Nuxt</li>
              <li><span class="check-box checked">✔</span> TypeScript</li>
              <li><span class="check-box checked">✔</span> Node / SpringBoot</li>
              <li><span class="check-box checked">✔</span> {{ $t('pages.contactPage.mobileArch') }}</li>
              <li><span class="check-box"></span> {{ $t('pages.contactPage.buildingWheel') }}...</li>
            </ul>
          </section>

          <!-- 3. About (8) -->
          <section class="scrapbook-item span-8 rot-2">
            <div class="tape tape-green" style="top: 10px; right: -40px; transform: rotate(90deg);"></div>
            <h2 class="handwriting-title"><i class="fas fa-edit"></i> {{ $t('pages.contactPage.aboutMe') }} / About</h2>
            <p class="handwriting-text">
              {{ $t('pages.contactPage.hello') }}<br>
              {{ $t('pages.contactPage.intro') }}<br>
              <br><br>
              <strong>Keep Creating ✨</strong>
            </p>
          </section>

          <!-- 4. Socials: 4 Sticky Notes (12) -->
          <a href="mailto:109484028@qq.com" class="scrapbook-item span-3 sticky-note rot-3">
            <div class="pin"></div>
            <i class="fas fa-envelope social-icon"></i>
            <span class="handwriting-text">Email</span>
          </a>

          <a href="https://github.com/humenglover" target="_blank" class="scrapbook-item span-3 sticky-note rot-neg-2">
            <div class="tape tape-pink" style="top: -15px; transform: rotate(5deg);"></div>
            <i class="fab fa-github social-icon"></i>
            <span class="handwriting-text">GitHub</span>
          </a>

          <a href="https://b23.tv/pgoOOmz" target="_blank" class="scrapbook-item span-3 sticky-note rot-1">
            <div class="pin" style="background: radial-gradient(circle at 30% 30%, #81d4fa, #0277bd);"></div>
            <i class="fas fa-tv social-icon"></i>
            <span class="handwriting-text">Bilibili</span>
          </a>

          <a href="https://www.douyin.com/user/68316901625" target="_blank" class="scrapbook-item span-3 sticky-note rot-neg-3">
            <div class="tape tape-yellow" style="top: -15px; transform: rotate(-5deg);"></div>
            <i class="fas fa-film social-icon"></i>
            <span class="handwriting-text">{{ $t('pages.contactPage.douyin') }}</span>
          </a>

          <!-- 5. Earth (5) -->
          <section class="scrapbook-item span-5 rot-neg-1" style="display: flex; flex-direction: column; align-items: center;">
            <div class="pin" style="top: 15px;"></div>
            <h2 class="handwriting-title" style="margin-top: 10px;"><i class="fas fa-globe"></i> {{ $t('pages.contactPage.contactUniverse') }}</h2>
            <div class="earth-container">
              <canvas ref="canvasRef" class="cobe-canvas"></canvas>
            </div>
          </section>

          <!-- 6. Projects (7) -->
          <section class="scrapbook-item span-7 rot-2">
            <div class="tape tape-blue" style="top: 40%; left: -40px; transform: rotate(90deg);"></div>
            <h2 class="handwriting-title"><i class="fas fa-lightbulb"></i> {{ $t('pages.contactPage.opensourceProjects') }}</h2>
            <div class="doodle-divider"></div>
            
            <a href="https://github.com/humenglover/yuemu" target="_blank" class="project-doodle-card">
              <h3><i class="fas fa-leaf" style="color: #4caf50;"></i> {{ $t('pages.contactPage.yuemu') }} (yuemu)</h3>
              <p>{{ $t('pages.contactPage.yuemuDesc') }}</p>
            </a>
            
            <a href="https://github.com/humenglover/myblog" target="_blank" class="project-doodle-card">
              <h3><i class="fas fa-book-open" style="color: #2196f3;"></i> {{ $t('pages.contactPage.myBlog') }} (myblog)</h3>
              <p>{{ $t('pages.contactPage.myBlogDesc') }}</p>
            </a>
          </section>

          <!-- 7. Photo Stack (5) -->
          <section class="scrapbook-item span-5 rot-2 photo-stack-section">
            <div class="photo-stack">
              <div class="polaroid-card photo-back rot-neg-3">
                <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400" class="polaroid-img" style="filter: grayscale(0.5) sepia(0.3);" crossorigin="anonymous" />
              </div>
              <div class="polaroid-card photo-front rot-3">
                <div class="tape tape-yellow" style="top: -15px; left: 50%; transform: translateX(-50%) rotate(-4deg);"></div>
                <img src="https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=400" class="polaroid-img" style="filter: sepia(0.2);" crossorigin="anonymous" />
                <div class="polaroid-caption" style="font-size: 20px;"><i class="fas fa-laptop-code"></i> Coding Routine</div>
              </div>
            </div>
          </section>

          <!-- 8. Daily (7) -->
          <section class="scrapbook-item span-7 rot-neg-1">
            <div class="pin" style="top: 15px; left: auto; right: 20px;"></div>
            <h2 class="handwriting-title"><i class="fas fa-thumbtack"></i> {{ $t('pages.contactPage.moreAction') }}</h2>
            <div class="doodle-divider"></div>
            
            <ul class="doodle-list">
              <li><strong>{{ $t('pages.contactPage.toolsBox') }}</strong>：{{ $t('pages.contactPage.toolsDesc') }}</li>
              <li><strong>{{ $t('pages.contactPage.gamesRepo') }}</strong>：{{ $t('pages.contactPage.gamesDesc') }}</li>
              <li><strong>{{ $t('pages.contactPage.designConcept') }}</strong>：{{ $t('pages.contactPage.persist') }} Mobile First {{ $t('pages.contactPage.principles') }}，{{ $t('pages.contactPage.uxBlank') }}</li>
              <li><strong>{{ $t('pages.contactPage.techExplore') }}</strong>：{{ $t('pages.contactPage.studying') }} WebGL {{ $t('pages.contactPage.and') }} Three.js {{ $t('pages.contactPage.visualPresent') }}</li>
            </ul>
          </section>

          <!-- 9. Cassette Player (4) -->
          <section class="scrapbook-item span-4 rot-neg-1 tape-player">
            <div class="tape tape-pink" style="top: -10px; left: -10px; transform: rotate(-45deg);"></div>
            <h2 class="handwriting-title" style="font-size: 24px; margin-bottom: 20px;"><i class="fas fa-music"></i> Now Playing</h2>
            <div class="cassette">
              <div class="cassette-label">
                <div class="cassette-text">Mix Tape Vol.1</div>
                <div class="cassette-reels">
                  <div class="reel spinning"></div>
                  <div class="reel spinning"></div>
                </div>
              </div>
            </div>
            <p class="handwriting-text" style="text-align: center; margin-top: 20px; font-weight: bold;">New Boy - {{ $t('pages.contactPage.penicillin') }}</p>
          </section>

          <!-- 10. Ticket Stub Milestones (8) -->
          <section class="scrapbook-item span-8 rot-1 ticket-stub">
            <div class="pin" style="top: 15px; right: 20px; left: auto;"></div>
            <div class="ticket-content">
              <h2 class="handwriting-title"><i class="fas fa-ticket-alt"></i> {{ $t('pages.contactPage.milestones') }} / Milestones</h2>
              <div class="timeline-doodle">
                <div class="time-node">
                  <span class="time-dot"></span>
                  <div class="time-info">
                    <span class="time-year">2023</span>
                    <span class="time-desc">{{ $t('pages.contactPage.touchFrontend') }}，{{ $t('pages.contactPage.magicCode') }} Hello World。</span>
                  </div>
                </div>
                <div class="time-node">
                  <span class="time-dot"></span>
                  <div class="time-info">
                    <span class="time-year">2024</span>
                    <span class="time-desc">{{ $t('pages.contactPage.buildBlog') }} (myblog)，{{ $t('pages.contactPage.startAccumulate') }}</span>
                  </div>
                </div>
                <div class="time-node">
                  <span class="time-dot"></span>
                  <div class="time-info">
                    <span class="time-year">2026</span>
                    <span class="time-desc">{{ $t('pages.contactPage.startYuemu') }}，{{ $t('pages.contactPage.startOpensource') }} Keep Creating!</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 11. Quote (12) -->
          <section class="scrapbook-item span-12 rot-1" style="text-align: center; border: none; background: transparent; box-shadow: none;">
            <p class="handwriting-title" style="font-size: 32px; color: var(--edit-box-kraft-text); opacity: 0.8;">
              "{{ $t('pages.contactPage.quote1') }}{{ $t('pages.contactPage.quote2') }}"
            </p>
            <span class="handwriting-text">—— {{ $t('pages.contactPage.wangyangming') }}</span>
          </section>

        </div>
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import createGlobe from 'cobe'

const isLoading = ref(true)
const canvasRef = ref<HTMLCanvasElement>()
let globe: any

onMounted(() => {
  setTimeout(async () => {
    isLoading.value = false
    await nextTick()
    setTimeout(initGlobe, 100)
  }, 600)
})

const initGlobe = () => {
  if (!canvasRef.value) return

  let phi = 0
  const canvas = canvasRef.value
  const container = canvas.parentElement
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight
  if (width === 0 || height === 0) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr

  const globeConfig = {
    devicePixelRatio: dpr,
    width: width * dpr,
    height: height * dpr,
    phi: 0,
    theta: 0.15,
    dark: 0, 
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 1.2, // 修复：之前为 6 导致光照过曝，点阵变成了纯白色
    baseColor: [0.36, 0.25, 0.22], // 棕色大陆点阵
    markerColor: [0.83, 0.18, 0.18], // 红色定位图钉
    glowColor: [0.95, 0.95, 0.95], // 接近纯白的光晕，在 multiply 下会变透明
    markers: [
      { location: [30.5928, 114.3055], size: 0.08 }
    ],
    onRender: (state: any) => {
      state.phi = phi
      phi += 0.003
    }
  }

  globe = createGlobe(canvas, globeConfig)
  setTimeout(() => { canvas.style.opacity = '1' }, 100)

  const resizeObserver = new ResizeObserver(() => {
    if(container && container.clientWidth > 0 && container.clientHeight > 0) {
      const w = container.clientWidth
      const h = container.clientHeight
      globeConfig.width = w * dpr
      globeConfig.height = h * dpr
      if(globe) globe.destroy()
      globe = createGlobe(canvas, globeConfig)
    }
  })
  resizeObserver.observe(container)
}

onBeforeUnmount(() => {
  if(globe) globe.destroy()
})
</script>

<style scoped>
/* ================= 基础与变量配置 ================= */
.scrapbook-page {
  /* 手账复古网格纸背景，自适应亮暗色牛皮纸变量 */
  background-color: var(--edit-box-kraft-bg, #f5f0e8);
  background-image: 
    linear-gradient(var(--edit-box-kraft-border, rgba(187, 146, 94, 0.2)) 1px, transparent 1px),
    linear-gradient(90deg, var(--edit-box-kraft-border, rgba(187, 146, 94, 0.2)) 1px, transparent 1px);
  background-size: 24px 24px;
  color: var(--edit-box-kraft-text, #5d4037);
  font-family: var(--font-family-base, "Muyao-Softbrush", cursive, sans-serif);
  min-height: 100vh;
  padding-bottom: 60px;
  overflow-x: hidden;
}

.scrapbook-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 5%;
}

/* ================= 骨架屏 ================= */
.skeleton-doodle {
  height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
.skel-text {
  font-size: 24px;
  font-family: var(--font-family-base, "Muyao-Softbrush", cursive, sans-serif);
  color: var(--edit-box-kraft-text);
  animation: pulse 1.5s infinite;
}
@keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

/* ================= 网格与卡片拼贴 ================= */
.scrapbook-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 32px;
  grid-auto-flow: dense;
}

.scrapbook-item {
  position: relative;
  background: var(--edit-box-kraft-dark, #e8d9c4);
  padding: 32px;
  box-shadow: 4px 6px 16px rgba(0,0,0,0.08);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px dashed var(--edit-box-kraft-border, rgba(187, 146, 94, 0.3));
  text-decoration: none;
  color: inherit;
  border-radius: 4px; /* 模拟轻微裁切的不完美纸边 */
}
.scrapbook-item:hover {
  transform: scale(1.02) rotate(0deg) !important;
  box-shadow: 8px 12px 24px rgba(0,0,0,0.12);
  z-index: 20;
}

/* 跨列控制 */
.span-12 { grid-column: span 12; }
.span-8 { grid-column: span 8; }
.span-7 { grid-column: span 7; }
.span-5 { grid-column: span 5; }
.span-4 { grid-column: span 4; }
.span-3 { grid-column: span 3; }

/* ================= 随机旋转 (手工拼贴感) ================= */
.rot-1 { transform: rotate(-2deg); }
.rot-2 { transform: rotate(3deg); }
.rot-3 { transform: rotate(1.5deg); }
.rot-neg-1 { transform: rotate(-1.5deg); }
.rot-neg-2 { transform: rotate(-3deg); }
.rot-neg-3 { transform: rotate(2deg); }

/* ================= 手账小物件 ================= */
/* 纸胶带 Washi Tape */
.tape {
  position: absolute;
  width: 130px; height: 35px;
  background-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  z-index: 10;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-left: 3px dotted rgba(255,255,255,0.6);
  border-right: 3px dotted rgba(255,255,255,0.6);
}
.tape-pink { background-color: rgba(244, 143, 177, 0.5); }
.tape-yellow { background-color: rgba(255, 238, 88, 0.5); }
.tape-blue { background-color: rgba(129, 212, 250, 0.5); }
.tape-green { background-color: rgba(165, 214, 167, 0.5); }

/* 图钉 Push Pin */
.pin {
  position: absolute;
  top: 15px; left: 50%;
  transform: translateX(-50%);
  width: 18px; height: 18px;
  background: radial-gradient(circle at 30% 30%, #ef5350, #c62828);
  border-radius: 50%;
  box-shadow: 2px 4px 6px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(0,0,0,0.2);
  z-index: 10;
}
.pin::after {
  content: '';
  position: absolute;
  top: 14px; left: 8px;
  width: 2px; height: 12px;
  background: rgba(0,0,0,0.3);
  z-index: -1;
  box-shadow: 2px 2px 2px rgba(0,0,0,0.2);
}

/* ================= 1. 拍立得与大头贴 ================= */
.flex-row { display: flex; align-items: center; gap: 40px; }
.polaroid-wrapper { flex-shrink: 0; padding: 10px; }
.polaroid-card {
  background: var(--edit-box-kraft-bg, #fff);
  padding: 12px 12px 48px 12px;
  box-shadow: 3px 6px 18px rgba(0,0,0,0.15);
  display: inline-block;
  position: relative;
  border: 1px solid var(--edit-box-kraft-border, #eaeaea);
  transition: 0.3s;
}
.polaroid-img {
  width: 200px; height: 200px;
  object-fit: cover;
  background: #ddd;
  filter: sepia(0.2) contrast(1.1); /* 复古滤镜 */
}
.polaroid-caption {
  position: absolute;
  bottom: 12px; left: 0; width: 100%;
  text-align: center;
  font-size: 24px;
  color: var(--edit-box-kraft-text);
  font-weight: 600;
}

/* ================= 新增：技能便签本 ================= */
.notepad-page {
  background: var(--edit-box-kraft-bg);
  background-image: repeating-linear-gradient(transparent, transparent 31px, var(--edit-box-kraft-border) 31px, var(--edit-box-kraft-border) 32px);
  padding-top: 40px;
}
.binder-holes {
  position: absolute; top: 0; left: 0; width: 100%; height: 20px;
  background-image: radial-gradient(circle at 20px 10px, transparent 6px, var(--edit-box-kraft-bg) 7px);
  background-size: 40px 20px;
  background-position: -10px 0;
  border-bottom: 1px solid var(--edit-box-kraft-border);
}
.checklist { list-style: none; padding: 0; margin: 0; }
.checklist li { font-size: 18px; line-height: 32px; color: var(--edit-box-kraft-text); display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.check-box { width: 22px; height: 22px; border: 2px solid var(--edit-box-kraft-text); border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; }
.check-box.checked { color: #d32f2f; font-weight: bold; }

/* ================= 新增：相片墙 ================= */
.photo-stack-section { background: transparent !important; box-shadow: none !important; border: none !important; display: flex; justify-content: center; align-items: center; }
.photo-stack { position: relative; width: 220px; height: 260px; }
.photo-back { position: absolute; top: 0; left: 0; transform: rotate(-8deg); z-index: 1; opacity: 0.9; }
.photo-front { position: absolute; top: 20px; left: 20px; transform: rotate(5deg); z-index: 2; }
.photo-stack-section:hover .photo-front { transform: rotate(2deg) translateY(-10px) !important; }
.photo-stack-section:hover .photo-back { transform: rotate(-12deg) translateX(-10px) !important; }

/* ================= 新增：复古磁带 ================= */
.tape-player { background: var(--edit-box-kraft-bg); display: flex; flex-direction: column; align-items: center; }
.cassette {
  width: 100%; max-width: 220px; height: 130px;
  background: #cfd8dc;
  border-radius: 10px;
  position: relative;
  border: 2px solid #90a4ae;
  display: flex; justify-content: center; align-items: center;
  box-shadow: inset 0 2px 5px rgba(255,255,255,0.5), 0 5px 10px rgba(0,0,0,0.1);
}
.cassette::before { 
  content: ''; position: absolute; bottom: 0; left: 15%; width: 70%; height: 30px;
  border: 2px solid #90a4ae; border-bottom: none; border-radius: 5px 5px 0 0; background: #eceff1;
}
.cassette-label {
  width: 80%; height: 70px; background: #ffcc80; border-radius: 5px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 1px solid #ffa726; z-index: 2;
}
.cassette-text { font-family: 'Muyao-Softbrush', cursive; font-size: 16px; margin-bottom: 8px; color: #e65100; font-weight: bold;}
.cassette-reels { display: flex; gap: 45px; background: #fff; padding: 6px 15px; border-radius: 20px; border: 1px solid #ddd;}
.reel { width: 26px; height: 26px; background: #333; border-radius: 50%; position: relative; }
.reel::after { content: ''; position: absolute; top: 50%; left: 50%; width: 8px; height: 8px; background: #fff; transform: translate(-50%, -50%); border-radius: 50%; }
.reel.spinning { animation: spin 4s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ================= 新增：票根时间轴 ================= */
.ticket-stub {
  background: var(--edit-box-kraft-bg);
  position: relative;
  padding: 30px 40px;
  background-image: 
    radial-gradient(circle at 0 15px, transparent 8px, var(--edit-box-kraft-bg) 9px),
    radial-gradient(circle at 100% 15px, transparent 8px, var(--edit-box-kraft-bg) 9px);
  background-size: 100% 30px;
  background-position: 0 0;
  background-repeat: repeat-y;
  border: none !important;
  box-shadow: 5px 5px 15px rgba(0,0,0,0.1) !important;
  filter: drop-shadow(0 0 1px var(--edit-box-kraft-border));
}
.ticket-content { border: 2px dashed var(--edit-box-kraft-border); padding: 25px; border-radius: 8px; }
.timeline-doodle { border-left: 2px dashed var(--edit-box-kraft-text); margin-left: 10px; padding-left: 25px; }
.time-node { position: relative; margin-bottom: 24px; }
.time-node:last-child { margin-bottom: 0; }
.time-dot { position: absolute; left: -33px; top: 5px; width: 14px; height: 14px; background: var(--edit-box-kraft-text); border-radius: 50%; box-shadow: 0 0 0 4px var(--edit-box-kraft-bg); }
.time-year { font-size: 22px; font-weight: bold; color: var(--edit-box-kraft-text); display: block; margin-bottom: 4px; }
.time-desc { font-size: 16px; color: var(--edit-box-kraft-text); opacity: 0.8; line-height: 1.6; display: block;}


/* ================= 排版与手写字 ================= */
.handwriting-title {
  font-size: 30px;
  margin: 0 0 16px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--edit-box-kraft-text);
}
.handwriting-text {
  font-size: 18px;
  line-height: 1.8;
  margin: 0 0 12px;
  color: var(--edit-box-kraft-text);
}
.doodle-divider {
  height: 4px;
  background-image: radial-gradient(circle, var(--edit-box-kraft-text) 2px, transparent 2px);
  background-size: 16px 4px;
  margin: 24px 0;
  opacity: 0.3;
}
.doodle-tags { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.doodle-tag {
  display: inline-block;
  border: 2px solid var(--edit-box-kraft-text);
  border-radius: 255px 15px 225px 15px/15px 225px 15px 255px; /* 手绘圆圈感 */
  padding: 6px 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--edit-box-kraft-text);
  opacity: 0.8;
}

/* ================= 2. 复古地球仪 ================= */
.earth-container {
  width: 280px; height: 280px;
  position: relative;
  background: radial-gradient(circle, var(--edit-box-kraft-bg) 40%, var(--edit-box-kraft-border) 100%);
  border-radius: 50%;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05);
  margin: 10px auto;
  border: 2px dashed var(--edit-box-kraft-border);
}
.cobe-canvas { 
  width: 100%; height: 100%; 
  position: absolute; inset: 0; 
  border-radius: 50%; 
  opacity: 0; transition: opacity 1s ease; 
  mix-blend-mode: multiply; /* 极客魔法：将白色底球过滤，仅留下黑色大陆点阵，完美融合进牛皮纸！ */
}

/* ================= 3. 便利贴 (社交) ================= */
.sticky-note {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 16px;
  padding: 40px 20px 30px;
  background: var(--edit-box-kraft-bg) !important;
}
.sticky-note .social-icon { font-size: 48px; color: var(--edit-box-kraft-text); opacity: 0.8; }
.sticky-note .handwriting-text { margin: 0; font-size: 22px; font-weight: 600; }

/* ================= 4. 项目涂鸦卡片 ================= */
.project-doodle-card {
  display: block;
  border: 2px solid transparent;
  border-bottom: 2px solid var(--edit-box-kraft-border);
  padding: 20px;
  margin-bottom: 16px;
  transition: 0.3s;
}
.project-doodle-card:hover {
  border: 2px dashed var(--edit-box-kraft-text);
  border-radius: 255px 15px 225px 15px/15px 225px 15px 255px;
  transform: translateX(10px) rotate(-1deg);
  background: rgba(0,0,0,0.02);
}
.project-doodle-card h3 { margin: 0 0 12px; font-size: 22px; display: flex; align-items: center; gap: 12px; color: var(--edit-box-kraft-text); }
.project-doodle-card p { font-size: 16px; margin: 0; opacity: 0.8; color: var(--edit-box-kraft-text); line-height: 1.6; }

/* ================= 5. 动向列表 ================= */
.doodle-list {
  list-style: none; padding: 0; margin: 0;
}
.doodle-list li {
  position: relative;
  padding-left: 30px;
  margin-bottom: 20px;
  font-size: 17px;
  line-height: 1.6;
  color: var(--edit-box-kraft-text);
}
.doodle-list li::before {
  content: '★';
  position: absolute; left: 0; top: 0;
  color: var(--edit-box-kraft-text);
  opacity: 0.6;
}

/* ================= 动画 ================= */
.fade-scrapbook-enter-active, .fade-scrapbook-leave-active { transition: all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1); }
.fade-scrapbook-enter-from { opacity: 0; transform: translateY(40px) scale(0.95) rotate(-5deg); }

/* ================= 移动端适配 ================= */
@media (max-width: 1024px) {
  .span-7, .span-5, .span-8, .span-4, .span-3 { grid-column: span 12; }
  .flex-row { flex-direction: column; text-align: center; gap: 24px; }
  .polaroid-card { transform: rotate(0) !important; }
}
</style>
