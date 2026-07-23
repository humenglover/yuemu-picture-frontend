<template>
  <div class="yuemu-retro-food-container" :class="{ 'dark-theme': isDark }">
    <div class="paper-texture"></div>
    <div class="glow-atmosphere"></div>

    <div class="app-shell">
      <header class="retro-header">
        <div class="seal-top">{{ t('pages.tools.foodWheelPage.mustEat') }}</div>
        <h1 class="main-title">{{ t('pages.tools.foodWheelPage.food') }}<span class="accent">{{ t('pages.tools.foodWheelPage.decisionMaker') }}</span></h1>
        <div class="subtitle">
          <span class="line"></span>
          <span class="text">{{ t('pages.tools.foodWheelPage.whatToEatToday') }}</span>
          <span class="line"></span>
        </div>
      </header>

      <main class="wheel-main">
        <div class="wheel-outer-frame">
          <div class="bronze-needle"></div>

          <div class="wheel-box" :style="{ transform: `rotate(${visualRotation}deg)` }">
            <canvas ref="canvasRef" id="wheel-canvas"></canvas>
          </div>

          <button
            class="start-trigger"
            @click="startSpin"
            :disabled="spinning || foodList.length < 2"
          >
            <div class="trigger-content">
              <span>{{ spinning ? t('pages.tools.foodWheelPage.divine') : t('pages.tools.foodWheelPage.startEng') }}</span>
            </div>
          </button>
        </div>
      </main>

      <div class="bottom-actions">
        <button class="action-btn" @click="showPanel = true">
          <span class="icon"><i class="fas fa-scroll"></i></span> {{ t('pages.tools.foodWheelPage.menuManagement') }}
        </button>
      </div>
    </div>

    <Transition name="slide">
      <aside v-if="showPanel" class="menu-panel">
        <div class="panel-inner">
          <div class="panel-header">
            <h3>{{ t('pages.tools.foodWheelPage.royalMenu') }} <small>{{ foodList.length }}</small></h3>
            <button class="close-btn" @click="showPanel = false"><CloseOutlined /></button>
          </div>

          <div class="add-section">
            <button class="add-btn-large" @click="openAddModal">{{ t('pages.tools.foodWheelPage.addNewDish') }}</button>
          </div>

          <div class="food-scroll-list">
            <div v-for="food in foodList" :key="food.id" class="food-card">
              <div class="food-info">
                <div class="name">{{ food.name }}</div>
                <div class="tag">{{ food.category }}</div>
              </div>
              <button class="del-btn" @click="removeFood(food.id)">{{ t('pages.tools.foodWheelPage.discard') }}</button>
            </div>
          </div>
        </div>
      </aside>
    </Transition>

    <Transition name="unfold">
      <div v-if="resultFood && !spinning" class="result-overlay">
        <div class="scroll-wrap">
          <div class="scroll-content">
            <div class="label">{{ t('pages.tools.foodWheelPage.todaysMeal') }}</div>
            <h2 class="food-name">{{ resultFood.name }}</h2>
            <p class="desc">“{{ resultFood.description || t('pages.tools.foodWheelPage.fallbackDesc') }}”</p>
            <div class="btns">
              <button class="retry" @click="resultFood = null">{{ t('pages.tools.foodWheelPage.reconsider') }}</button>
              <button class="confirm" @click="handleConfirm">{{ t('pages.tools.foodWheelPage.acceptDecree') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <a-modal v-model:open="modalVisible" :title="t('pages.tools.foodWheelPage.inputNewDish')" @ok="handleSave" :okText="t('pages.tools.foodWheelPage.confirm')" :cancelText="t('pages.tools.foodWheelPage.giveUp')" centered>
      <div class="retro-form-body">
        <div class="f-item">
          <label>{{ t('pages.tools.foodWheelPage.title') }}</label>
          <a-input v-model:value="formData.name" :placeholder="t('pages.tools.foodWheelPage.pleaseEnterFoodName')" />
        </div>
        <div class="f-item">
          <label>{{ t('pages.tools.foodWheelPage.category') }}</label>
          <a-select v-model:value="formData.category" style="width: 100%">
            <a-select-option v-for="c in categories" :key="c" :value="c">{{c}}</a-select-option>
          </a-select>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { CloseOutlined } from '@ant-design/icons-vue'

// 基础数据
const isDark = ref(document.documentElement.classList.contains('dark-theme'));
const showPanel = ref(false);
const spinning = ref(false);
const modalVisible = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const categories = [t('pages.tools.foodWheelPage.chineseFood'), t('pages.tools.foodWheelPage.westernFood'), t('pages.tools.foodWheelPage.japanKoreaCuisine'), t('pages.tools.foodWheelPage.fastFood'), t('pages.tools.foodWheelPage.hotPot'), t('pages.tools.foodWheelPage.dessertSnacks')];

const foodList = ref([
  { id: 1, name: t('pages.tools.foodWheelPage.pekingDuck'), category: t('pages.tools.foodWheelPage.chineseFood') },
  { id: 2, name: t('pages.tools.foodWheelPage.spicyDryPot'), category: t('pages.tools.foodWheelPage.chineseFood') },
  { id: 3, name: t('pages.tools.foodWheelPage.spaghetti'), category: t('pages.tools.foodWheelPage.westernFood') },
  { id: 4, name: t('pages.tools.foodWheelPage.hellRamen'), category: t('pages.tools.foodWheelPage.japanKoreaCuisine') },
  { id: 5, name: t('pages.tools.foodWheelPage.cheeseBurger'), category: t('pages.tools.foodWheelPage.fastFood') },
  { id: 6, name: t('pages.tools.foodWheelPage.chaoshanHotpot'), category: t('pages.tools.foodWheelPage.hotPot') }
]);

const resultFood = ref<any>(null);
const visualRotation = ref(0);
const formData = reactive({ name: '', category: t('pages.tools.foodWheelPage.chineseFood') });

// 绘制转盘
const drawWheel = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.clientWidth;
  canvas.width = size * dpr;
  canvas.height = size * dpr;

  ctx.scale(dpr, dpr);
  const radius = size / 2;
  const len = foodList.value.length;
  const angleStep = (Math.PI * 2) / len;

  ctx.clearRect(0, 0, size, size);

  foodList.value.forEach((food, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius - 5, i * angleStep, (i + 1) * angleStep);

    // 纸张交替色
    ctx.fillStyle = i % 2 === 0 ? (isDark.value ? '#3d2b1f' : '#f5f0e8') : (isDark.value ? '#2d1d11' : '#e8d9c4');
    ctx.fill();
    ctx.strokeStyle = isDark.value ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.stroke();

    // 绘制文字
    ctx.translate(radius, radius);
    ctx.rotate(i * angleStep + angleStep / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = isDark.value ? '#e8d9c4' : '#5d4037';
    ctx.font = `bold ${Math.max(14, size/18)}px "Muyao-Softbrush", sans-serif`;
    ctx.fillText(food.name, radius - 25, 6);
    ctx.restore();
  });
};

// 抽奖逻辑
const startSpin = () => {
  if (spinning.value) return;
  spinning.value = true;
  resultFood.value = null;

  const duration = 4000;
  const startRotate = visualRotation.value;
  const extraRotate = 1800 + Math.random() * 1800;
  const startTime = performance.now();

  const animate = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 减速曲线
    const easeOut = 1 - Math.pow(1 - progress, 4);
    visualRotation.value = startRotate + extraRotate * easeOut;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning.value = false;
      const finalAngle = (visualRotation.value % 360 + 360) % 360;
      // 计算指针指向位置 (指针在上方 270度方向)
      const index = Math.floor(((270 - finalAngle + 360) % 360) / (360 / foodList.value.length));
      resultFood.value = foodList.value[index];
    }
  };
  requestAnimationFrame(animate);
};

// 操作
const openAddModal = () => { formData.name = ''; modalVisible.value = true; };
const handleSave = () => {
  if (!formData.name) return;
  foodList.value.push({ ...formData, id: Date.now() });
  modalVisible.value = false;
  setTimeout(drawWheel, 100);
};
const removeFood = (id: number) => {
  foodList.value = foodList.value.filter(f => f.id !== id);
  drawWheel();
};
const handleConfirm = () => { resultFood.value = null; message.success(t('pages.tools.foodWheelPage.todaysDelicacySelected')); };

onMounted(() => {
  drawWheel();
  window.addEventListener('resize', drawWheel);
});
</script>

<style scoped lang="scss">
/* --- 核心容器与居中逻辑 --- */
.yuemu-retro-food-container {
  position: fixed;
  inset: 0;
  background: var(--background);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.5s ease;
}

.paper-texture {
  position: absolute; inset: 0; pointer-events: none;
  background-image: url('https://www.transparenttextures.com/patterns/old-paper.png');
  opacity: 0.1; z-index: 1;
}

.app-shell {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 600px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 40px 20px;
}

/* --- 标题样式 --- */
.retro-header {
  text-align: center;
  .seal-top {
    display: inline-block;
    border: 2px solid #c62828;
    color: #c62828;
    padding: 2px 10px;
    font-weight: 900;
    transform: rotate(-10deg);
    margin-bottom: 10px;
  }
  .main-title {
    font-size: 3rem;
    margin: 0;
    .accent { color: #c62828; }
  }
  .subtitle {
    display: flex; align-items: center; gap: 15px;
    opacity: 0.6;
    .line { flex: 1; height: 1px; background: var(--border-color); min-width: 40px; }
  }
}

/* --- 转盘主体 --- */
.wheel-main {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.wheel-outer-frame {
  position: relative;
  width: 400px;
  height: 400px;
  background: #5d4037;
  padding: 12px;
  border-radius: 50%;
  box-shadow: 0 20px 50px var(--shadow-color);
  border: 4px solid #3d2b1f;

  .bronze-needle {
    position: absolute;
    top: -15px; left: 50%;
    transform: translateX(-50%);
    width: 0; height: 0;
    border-left: 20px solid transparent;
    border-right: 20px solid transparent;
    border-top: 40px solid #8d6e63;
    z-index: 10;
    filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));
  }
}

.wheel-box {
  width: 100%; height: 100%;
  canvas { width: 100%; height: 100%; border-radius: 50%; background: #fff; }
}

.start-trigger {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 80px; height: 80px;
  background: #c62828;
  border: 4px solid #8e0000;
  border-radius: 12px;
  cursor: pointer;
  z-index: 15;
  box-shadow: 0 6px 0 #5d0000;
  transition: all 0.1s;

  .trigger-content {
    color: white; font-size: 32px; font-weight: bold;
    display: flex; align-items: center; justify-content: center;
  }

  &:active:not(:disabled) {
    transform: translate(-50%, -46%);
    box-shadow: 0 2px 0 #5d0000;
  }
  &:disabled { opacity: 0.8; cursor: not-allowed; }
}

/* --- 底部管理按钮 --- */
.bottom-actions {
  .action-btn {
    background: var(--card-background);
    border: 2px solid var(--text-primary);
    padding: 10px 30px;
    border-radius: 4px;
    font-weight: bold;
    box-shadow: 4px 4px 0 var(--text-primary);
    cursor: pointer;
    &:active { transform: translate(2px, 2px); box-shadow: 0 0 0; }
  }
}

/* --- 侧边/抽屉面板 --- */
.menu-panel {
  position: fixed;
  right: 0; top: 0; bottom: 0;
  width: 350px;
  background: var(--edit-box-kraft-bg);
  z-index: 1000;
  border-left: 2px solid var(--border-color);
  box-shadow: -10px 0 30px rgba(0,0,0,0.1);
  padding: 30px;

  .panel-inner { height: 100%; display: flex; flex-direction: column; }
  .panel-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px solid var(--ink);
    padding-bottom: 15px;
    h3 { margin: 0; font-size: 1.5rem; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
  }
}

.food-card {
  display: flex; justify-content: space-between; align-items: center;
  padding: 15px; background: rgba(0,0,0,0.03);
  margin-top: 10px; border-radius: 4px;
  .name { font-weight: bold; font-size: 1.1rem; }
  .tag { font-size: 0.8rem; opacity: 0.6; }
  .del-btn { color: #c62828; border: 1px solid #c62828; background: none; cursor: pointer; }
}

.add-btn-large {
  width: 100%; margin-top: 20px; padding: 12px;
  background: var(--text-primary); color: var(--background);
  border: none; border-radius: 4px; font-weight: bold; cursor: pointer;
}

/* --- 结果弹窗 (卷轴) --- */
.result-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center;

  .scroll-wrap {
    background: #fdf2e9;
    padding: 40px;
    border-left: 15px solid #8e0000;
    border-right: 15px solid #8e0000;
    width: 320px; text-align: center;
    box-shadow: 0 0 50px rgba(0,0,0,0.5);

    .label { opacity: 0.5; letter-spacing: 4px; }
    .food-name { font-size: 3.5rem; color: #c62828; margin: 20px 0; }
    .btns {
      display: flex; gap: 10px; margin-top: 30px;
      button { flex: 1; padding: 10px; cursor: pointer; border: 1px solid #5d4037; }
      .confirm { background: #5d4037; color: white; }
    }
  }
}

/* --- 动画 --- */
.slide-enter-active, .slide-leave-active { transition: transform 0.4s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

.unfold-enter-active { animation: unfold 0.5s ease-out; }
@keyframes unfold {
  from { transform: scaleY(0); opacity: 0; }
  to { transform: scaleY(1); opacity: 1; }
}

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  .wheel-outer-frame { width: 300px; height: 300px; }
  .menu-panel {
    width: 100%; height: 70vh; top: auto;
    border-left: none; border-top: 4px solid var(--border-color);
  }
  .slide-enter-from, .slide-leave-to { transform: translateY(100%); }
}

/* --- 暗色主题微调 --- */
.dark-theme {
  --ink: #e8d9c4;
  .menu-panel { background: var(--edit-box-kraft-bg-dark); }
  .scroll-wrap { background: #2d1d11; border-color: #5d0000; .label { color: #fff; } .desc { color: #999; } }
}
</style>
