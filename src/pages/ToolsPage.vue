<template>
  <div class="games-page">
    <div class="container">
      <div class="games-grid">
        <!-- 广告作为一个卡片融入网格 -->
        <div class="modern-card" style="padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 128px;" v-if="$enableAds">
          <GlobalAdBanner margin="0" :fillHeight="true" style="width: 100%; height: 100%;" />
        </div>
        <div 
          v-for="tool in tools" 
          :key="tool.key" 
          class="modern-card"
          @click="handleToolClick(tool)"
        >
          <div class="card-left">
            <span class="card-serial" :style="{ color: getAccentColor(tool.key) }">{{ tool.serial }}</span>
            <h3 class="game-name">{{ tool.name }}</h3>
            <div class="game-tag" :style="{ color: getAccentColor(tool.key) }">{{ tool.category }}</div>
          </div>
          <div class="card-right">
            <img :src="getImage(tool.key)" :alt="tool.name" class="game-icon" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ToolIconCanvas from '../components/ToolIconCanvas.vue'
import GlobalAdBanner from '@/components/GlobalAdBanner.vue'

const router = useRouter()



const getImage = (key) => {
  const map = {
    'color-picker': 'color-picker.png',
    'food-wheel': 'food-wheel.png',
    'calculator': 'calculator.png',
    'timer': 'timer.png',
    'pomodoro': 'pompdoro.png',
    'sticky-wall': 'sticky-wall.png',
    'random': 'random.png',
    'base-converter': 'base-converter.png',
    'unit-converter': 'unit-converter.png',
    'text-lab': 'textlab.png',
    'vault-key': 'vaultkey.png',
    'grid-ruler': 'grid-ruler.png',
    'reminder': 'note.png'
  };
  return new URL(`../assets/tools/${map[key] || 'random.png'}`, import.meta.url).href;
};

const getAccentColor = (id) => {
  const colors = [
    '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const tools = computed(() => [
  { key: 'reminder', name: t('pages.toolsPage.tools.reminder.name'), serial: t('pages.toolsPage.tools.reminder.serial'), category: t('pages.toolsPage.tools.reminder.category'), path: '/reminder' },
  { key: 'color-picker', name: t('pages.toolsPage.tools.colorPicker.name'), serial: t('pages.toolsPage.tools.colorPicker.serial'), category: t('pages.toolsPage.tools.colorPicker.category'), path: '/tools/color-picker' },
  { key: 'food-wheel', name: t('pages.toolsPage.tools.foodWheel.name'), serial: t('pages.toolsPage.tools.foodWheel.serial'), category: t('pages.toolsPage.tools.foodWheel.category'), path: '/tools/food-wheel' },
  { key: 'calculator', name: t('pages.toolsPage.tools.calculator.name'), serial: t('pages.toolsPage.tools.calculator.serial'), category: t('pages.toolsPage.tools.calculator.category'), path: '/tools/calculator' },
  { key: 'timer', name: t('pages.toolsPage.tools.timer.name'), serial: t('pages.toolsPage.tools.timer.serial'), category: t('pages.toolsPage.tools.timer.category'), path: '/tools/timer' },
  { key: 'pomodoro', name: t('pages.toolsPage.tools.pomodoro.name'), serial: t('pages.toolsPage.tools.pomodoro.serial'), category: t('pages.toolsPage.tools.pomodoro.category'), path: '/tools/pomodoro' },
  { key: 'sticky-wall', name: t('pages.toolsPage.tools.stickyWall.name'), serial: t('pages.toolsPage.tools.stickyWall.serial'), category: t('pages.toolsPage.tools.stickyWall.category'), path: '/tools/sticky-wall' },
  { key: 'random', name: t('pages.toolsPage.tools.random.name'), serial: t('pages.toolsPage.tools.random.serial'), category: t('pages.toolsPage.tools.random.category'), path: '/tools/random' },
  { key: 'base-converter', name: t('pages.toolsPage.tools.baseConverter.name'), serial: t('pages.toolsPage.tools.baseConverter.serial'), category: t('pages.toolsPage.tools.baseConverter.category'), path: '/tools/base-converter' },
  { key: 'unit-converter', name: t('pages.toolsPage.tools.unitConverter.name'), serial: t('pages.toolsPage.tools.unitConverter.serial'), category: t('pages.toolsPage.tools.unitConverter.category'), path: '/tools/unit-converter' },
  { key: 'text-lab', name: t('pages.toolsPage.tools.textLab.name'), serial: t('pages.toolsPage.tools.textLab.serial'), category: t('pages.toolsPage.tools.textLab.category'), path: '/tools/text-lab' },
  { key: 'vault-key', name: t('pages.toolsPage.tools.vaultKey.name'), serial: t('pages.toolsPage.tools.vaultKey.serial'), category: t('pages.toolsPage.tools.vaultKey.category'), path: '/tools/vault-key' },
  { key: 'grid-ruler', name: t('pages.toolsPage.tools.gridRuler.name'), serial: t('pages.toolsPage.tools.gridRuler.serial'), category: t('pages.toolsPage.tools.gridRuler.category'), path: '/tools/grid-ruler' },
])

const handleToolClick = (tool: any) => {
  router.push(tool.path)
}

</script>


<style scoped>

.games-page {
  background-color: var(--background);
  padding-bottom: 80px;
  transition: background-color 0.3s ease;
}



.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.modern-card {
  background: var(--card-background);
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  box-shadow: 0 8px 30px var(--shadow-color);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modern-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px var(--shadow-color);
  background-color: var(--hover-background);
}

.card-left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1;
}

.card-serial {
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 8px;
  font-family: 'Inter', 'Segoe UI', sans-serif;
}

.game-name {
  font-size: 20px;
  font-weight: 900;
  color: var(--text-primary);
  margin: 0 0 6px 0;
  letter-spacing: 0.5px;
}

.game-tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  z-index: 1;
}

.game-icon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modern-card:hover .game-icon {
  transform: scale(1.1) rotate(-5deg);
}

@media (max-width: 768px) {
  

  .container {
    padding: 20px 16px;
  }

  .games-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .modern-card {
    padding: 16px;
    border-radius: 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .card-right {
    margin-top: 12px;
    align-self: flex-end;
  }
  
  .game-name {
    font-size: 16px;
  }
  
  .card-serial {
    font-size: 12px;
    margin-bottom: 4px;
  }
  
  .game-tag {
    font-size: 10px;
  }
  
  .game-icon {
    width: 48px;
    height: 48px;
  }
}
</style>

