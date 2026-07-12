<template>
  <canvas ref="canvasRef" :style="{ width: size + 'px', height: size + 'px' }"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps({
  iconType: String,
  size: {
    type: Number,
    default: 64
  }
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const s = props.size;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = s * dpr;
  canvas.height = s * dpr;
  ctx.scale(dpr, dpr);

  const style = getComputedStyle(document.documentElement);
  const color = canvas.style.color || style.getPropertyValue('--text-primary').trim() || '#333';

  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const c = s / 2;
  switch (props.iconType) {
    case 'reminder':
      ctx.strokeRect(s * 0.2, s * 0.2, s * 0.6, s * 0.7); ctx.beginPath();
      ctx.moveTo(s * 0.3, s * 0.4); ctx.lineTo(s * 0.7, s * 0.4);
      ctx.moveTo(s * 0.3, s * 0.55); ctx.lineTo(s * 0.7, s * 0.55);
      ctx.moveTo(s * 0.3, s * 0.7); ctx.lineTo(s * 0.5, s * 0.7); ctx.stroke(); break;
    case 'color-picker':
      ctx.beginPath(); ctx.arc(c, c, s * 0.2, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c + s * 0.15, c - s * 0.15); ctx.lineTo(s * 0.8, s * 0.2); ctx.stroke(); break;
    case 'food-wheel':
      ctx.beginPath(); ctx.arc(c, c, s * 0.3, 0, 7); ctx.moveTo(c, c - s * 0.3); ctx.lineTo(c, c + s * 0.3); ctx.moveTo(c - s * 0.3, c); ctx.lineTo(c + s * 0.3, c); ctx.stroke(); break;
    case 'calculator':
      ctx.strokeRect(s * 0.25, s * 0.2, s * 0.5, s * 0.6); ctx.strokeRect(s * 0.35, s * 0.3, s * 0.3, s * 0.15);
      ctx.fillRect(s * 0.35, s * 0.55, 4, 4); ctx.fillRect(s * 0.55, s * 0.55, 4, 4); ctx.fillRect(s * 0.35, s * 0.68, 4, 4); ctx.fillRect(s * 0.55, s * 0.68, 4, 4); break;
    case 'timer':
      ctx.beginPath(); ctx.arc(c, c + 2, s * 0.25, 0, 7); ctx.moveTo(c, c + 2); ctx.lineTo(c, c - s * 0.1); ctx.lineTo(c + s * 0.1, c + 2); ctx.stroke();
      ctx.fillRect(c - 4, s * 0.15, 8, 3); break;
    case 'pomodoro':
      ctx.beginPath(); ctx.arc(c, c + 4, s * 0.25, 0, 7);
      ctx.moveTo(c, c - 2); ctx.lineTo(c - 6, c - 12);
      ctx.moveTo(c, c - 2); ctx.lineTo(c + 6, c - 12);
      ctx.stroke(); break;
    case 'sticky-wall':
      ctx.strokeRect(s * 0.2, s * 0.25, s * 0.5, s * 0.5); ctx.strokeRect(s * 0.35, s * 0.15, s * 0.5, s * 0.5); break;
    case 'random':
      ctx.strokeRect(s * 0.2, s * 0.2, s * 0.6, s * 0.6); ctx.beginPath(); ctx.arc(s * 0.35, s * 0.35, 2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(s * 0.65, s * 0.65, 2, 0, 7); ctx.fill(); break;
    case 'base-converter':
      ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.35); ctx.lineTo(s * 0.8, s * 0.35); ctx.lineTo(s * 0.6, s * 0.2); ctx.moveTo(s * 0.8, s * 0.65); ctx.lineTo(s * 0.2, s * 0.65); ctx.lineTo(s * 0.4, s * 0.8); ctx.stroke(); break;
    case 'unit-converter':
      ctx.beginPath(); ctx.moveTo(s * 0.25, s * 0.35); ctx.lineTo(s * 0.45, s * 0.35); ctx.moveTo(s * 0.55, s * 0.35); ctx.lineTo(s * 0.75, s * 0.35);
      ctx.moveTo(s * 0.65, s * 0.25); ctx.lineTo(s * 0.75, s * 0.35); ctx.lineTo(s * 0.65, s * 0.45);
      ctx.moveTo(s * 0.25, s * 0.65); ctx.lineTo(s * 0.45, s * 0.65); ctx.moveTo(s * 0.55, s * 0.65); ctx.lineTo(s * 0.75, s * 0.65);
      ctx.moveTo(s * 0.35, s * 0.55); ctx.lineTo(s * 0.25, s * 0.65); ctx.lineTo(s * 0.35, s * 0.75); ctx.stroke(); break;
    case 'text-lab':
      ctx.strokeRect(s * 0.2, s * 0.25, s * 0.6, s * 0.5); ctx.beginPath();
      ctx.moveTo(s * 0.3, s * 0.4); ctx.lineTo(s * 0.7, s * 0.4);
      ctx.moveTo(s * 0.3, s * 0.5); ctx.lineTo(s * 0.6, s * 0.5);
      ctx.moveTo(s * 0.3, s * 0.6); ctx.lineTo(s * 0.65, s * 0.6); ctx.stroke(); break;
    case 'vault-key':
      ctx.beginPath(); ctx.arc(s * 0.35, c, s * 0.12, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.47, c); ctx.lineTo(s * 0.7, c);
      ctx.moveTo(s * 0.6, c - s * 0.08); ctx.lineTo(s * 0.6, c + s * 0.08);
      ctx.moveTo(s * 0.68, c - s * 0.06); ctx.lineTo(s * 0.68, c + s * 0.06); ctx.stroke(); break;
    case 'grid-ruler':
      ctx.strokeRect(s * 0.2, s * 0.35, s * 0.6, s * 0.3);
      for (let i = 0; i < 7; i++) {
        const x = s * 0.2 + (s * 0.6 / 6) * i;
        const h = i % 2 === 0 ? s * 0.15 : s * 0.1;
        ctx.beginPath(); ctx.moveTo(x, s * 0.35); ctx.lineTo(x, s * 0.35 + h); ctx.stroke();
      } break;
    default:
      ctx.strokeRect(s * 0.3, s * 0.3, s * 0.4, s * 0.4);
  }
};

onMounted(() => {
  draw();
  const obs = new MutationObserver(draw);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});
</script>
