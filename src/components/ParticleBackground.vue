<template>
  <div class="particle-bg-container">
    <canvas ref="canvasRef" class="particle-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId: number | null = null

onMounted(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  let width = window.innerWidth
  let height = window.innerHeight
  const dpr = window.devicePixelRatio || 1

  const setCanvasSize = () => {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
  }
  setCanvasSize()

  // 离屏 Canvas 预渲染发光粒子，极大提升渲染性能
  const createGlowCanvas = (r: number, g: number, b: number) => {
    const offCanvas = document.createElement('canvas')
    const size = 32
    offCanvas.width = size
    offCanvas.height = size
    const offCtx = offCanvas.getContext('2d')
    if (offCtx) {
      const grad = offCtx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.85)`)
      grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.3)`)
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      offCtx.fillStyle = grad
      offCtx.beginPath()
      offCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      offCtx.fill()
    }
    return offCanvas
  }

  const palettes = [
    { canvas: createGlowCanvas(59, 130, 246), color: '#3B82F6', weight: 75 }, // 主蓝色 Primary Blue
    { canvas: createGlowCanvas(14, 165, 233), color: '#0EA5E9', weight: 15 }, // 天蓝色 Sky Blue
    { canvas: createGlowCanvas(168, 85, 247), color: '#A855F7', weight: 10 }  // 炫紫色 Purple Accent
  ]

  const particleCount = width < 768 ? 350 : 1200

  class Particle {
    x: number
    y: number
    z: number
    vx: number
    vy: number
    baseSize: number
    colorIdx: number

    constructor() {
      this.x = Math.random() * width
      this.y = Math.random() * height
      this.z = Math.random() * 100
      this.vx = 0
      this.vy = 0
      this.baseSize = Math.random() * 1.6 + 0.6

      const rand = Math.random() * 100
      if (rand < palettes[0].weight) {
        this.colorIdx = 0
      } else if (rand < palettes[0].weight + palettes[1].weight) {
        this.colorIdx = 1
      } else {
        this.colorIdx = 2
      }
    }

    update(time: number, mouseX: number, mouseY: number, mouseVx: number, mouseVy: number, mouseSpeed: number) {
      const zFactor = (100 - this.z) * 0.01
      const noiseAngle = (
        Math.sin(this.x * 0.0012 + time * 0.18) +
        Math.cos(this.y * 0.0018 - time * 0.14) +
        Math.sin((this.x + this.y) * 0.001 + time * 0.08)
      ) * Math.PI * 2

      const flowForce = 0.015 + (1 - zFactor) * 0.02
      this.vx += Math.cos(noiseAngle) * flowForce
      this.vy += Math.sin(noiseAngle) * flowForce

      if (mouseX !== -1000 && mouseY !== -1000) {
        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const distSq = dx * dx + dy * dy

        if (distSq < 90000) { // 300px 响应半径
          const dist = Math.sqrt(distSq)
          const gravity = 180 / (distSq + 1000)

          this.vx += (dx / dist) * gravity
          this.vy += (dy / dist) * gravity

          const tangentX = -dy / dist
          const tangentY = dx / dist
          this.vx += tangentX * gravity * 1.4
          this.vy += tangentY * gravity * 1.4

          if (mouseSpeed > 3) {
            const wakeForce = Math.min(mouseSpeed * 0.008, 0.4)
            this.vx += mouseVx * wakeForce * gravity
            this.vy += mouseVy * wakeForce * gravity
          }
        }
      }

      this.vx *= 0.94
      this.vy *= 0.94

      this.x += this.vx
      this.y += this.vy

      if (this.x < -50) this.x = width + 50
      if (this.x > width + 50) this.x = -50
      if (this.y < -50) this.y = height + 50
      if (this.y > height + 50) this.y = -50
    }
  }

  const particles: Particle[] = Array.from({ length: particleCount }, () => new Particle())

  let mouseX = -1000
  let mouseY = -1000
  let prevMouseX = -1000
  let prevMouseY = -1000
  let mouseVx = 0
  let mouseVy = 0
  let mouseSpeed = 0

  const handleMouseMove = (e: MouseEvent) => {
    prevMouseX = mouseX === -1000 ? e.clientX : mouseX
    prevMouseY = mouseY === -1000 ? e.clientY : mouseY
    mouseX = e.clientX
    mouseY = e.clientY

    mouseVx = mouseX - prevMouseX
    mouseVy = mouseY - prevMouseY
    mouseSpeed = Math.sqrt(mouseVx * mouseVx + mouseVy * mouseVy)
  }

  const handleMouseLeave = () => {
    mouseX = -1000
    mouseY = -1000
  }

  const handleClick = (e: MouseEvent) => {
    const ex = e.clientX
    const ey = e.clientY
    const explosionRadius = 380

    particles.forEach(p => {
      const dx = p.x - ex
      const dy = p.y - ey
      const distSq = dx * dx + dy * dy
      if (distSq < explosionRadius * explosionRadius) {
        const dist = Math.sqrt(distSq)
        const force = (explosionRadius - dist) / explosionRadius
        p.vx += (dx / (dist || 1)) * force * 14
        p.vy += (dy / (dist || 1)) * force * 14
      }
    })
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseleave', handleMouseLeave)
  window.addEventListener('click', handleClick)
  window.addEventListener('resize', setCanvasSize)

  const render = (timestamp: number) => {
    animationFrameId = requestAnimationFrame(render)

    if (document.hidden) return

    ctx.clearRect(0, 0, width, height)

    mouseSpeed *= 0.9
    mouseVx *= 0.9
    mouseVy *= 0.9

    const time = timestamp * 0.001

    particles.forEach(p => {
      p.update(time, mouseX, mouseY, mouseVx, mouseVy, mouseSpeed)

      const speedSq = p.vx * p.vx + p.vy * p.vy
      const depthFactor = p.z / 100
      const renderOpacity = 0.12 + depthFactor * 0.58
      const renderSize = p.baseSize * (0.5 + depthFactor * 1.5)

      ctx.globalAlpha = renderOpacity

      if (speedSq > 2.0) {
        ctx.beginPath()
        const trailLength = Math.min(Math.sqrt(speedSq) * 1.4, 14)
        const speedNorm = Math.sqrt(speedSq)
        const nx = p.vx / speedNorm
        const ny = p.vy / speedNorm

        ctx.moveTo(p.x - nx * trailLength, p.y - ny * trailLength)
        ctx.lineTo(p.x, p.y)
        ctx.strokeStyle = palettes[p.colorIdx].color
        ctx.lineWidth = renderSize
        ctx.lineCap = 'round'
        ctx.stroke()
      } else {
        const drawSize = renderSize * 4
        ctx.drawImage(palettes[p.colorIdx].canvas, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize)
      }
    })
  }

  animationFrameId = requestAnimationFrame(render)

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseleave', handleMouseLeave)
    window.removeEventListener('click', handleClick)
    window.removeEventListener('resize', setCanvasSize)
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
  })
})
</script>

<style scoped>
.particle-bg-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.particle-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
