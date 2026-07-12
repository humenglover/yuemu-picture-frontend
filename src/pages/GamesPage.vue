<template>
  <div class="modern-games-container">
    <div class="page-content-wrapper">
      <!-- Category Filter Bar (Horizontal Scrollable) -->
      <div class="category-scroll-container">
        <div class="category-tabs">
          <button 
            v-for="cat in categories" 
            :key="cat.value"
            class="cat-card"
            :class="{ active: activeCategory === cat.value }"
            :style="{ 
              '--cat-color': cat.color,
              '--cat-bg': cat.color + '15',
              '--cat-shadow': cat.color + '30'
            } as any"
            @click="activeCategory = cat.value"
          >
            <div class="cat-icon"><i :class="cat.icon" :style="{ color: cat.color }"></i></div>
            <div class="cat-info">
              <span class="cat-title">{{ cat.label }}</span>
              <span class="cat-count">{{ cat.count }} {{ tSafe('pages.gamesPage.gamesCount', 'Games') }}</span>
            </div>
          </button>
        </div>
      </div>

      <div class="games-grid">
        <!-- 广告作为一个卡片融入网格 -->
        <div class="modern-card" style="padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 128px;" v-if="$enableAds">
          <GlobalAdBanner margin="0" :fillHeight="true" style="width: 100%; height: 100%;" />
        </div>
        <div
          v-for="game in filteredGames"
          :key="game.id"
          class="game-card modern-card"
          @click="router.push(game.path)"
        >
          <div class="card-content">
            <div class="card-left">
              <span class="card-serial" :style="{ color: getAccentColor(game.id) }">{{ game.serial }}</span>
              <h3 class="game-name">{{ $t(game.nameKey) }}</h3>
              <div class="game-tag" :style="{ color: getAccentColor(game.id) }">{{ tSafe('pages.gamesPage.categories.' + game.category.toLowerCase(), game.category.toUpperCase()) }}</div>
            </div>
            <div class="card-right">
              <img :src="getIcon(game.icon)" :alt="$t(game.nameKey)" class="game-icon" />
            </div>
          </div>
        </div>

        <div class="game-card modern-card placeholder-card">
          <div class="card-content">
            <div class="card-left">
              <span class="card-serial" style="color: #999">NEXT</span>
              <h3 class="game-name">{{ tSafe('pages.gamesPage.moreGames', '更多游戏') }}</h3>
              <div class="game-tag" style="color: #999">{{ tSafe('pages.gamesPage.inDev', '研发中，敬请期待') }}</div>
            </div>
            <div class="card-right">
              <div class="placeholder-icon">
                <i class="fas fa-gamepad"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import GlobalAdBanner from '@/components/GlobalAdBanner.vue';

const { t } = useI18n();
const router = useRouter();

// Provide fallback translation if key missing
const tSafe = (key: string, fallback: string) => {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

const activeCategory = ref('ALL');

const gamesList = [
  { id: 'SNAKE', nameKey: 'pages.gamesPage.games.SNAKE', serial: '01', category: 'Classic', path: '/games/snake', icon: 'snake.png' },
  { id: '2048', nameKey: 'pages.gamesPage.games.2048', serial: '02', category: 'Logic', path: '/games/2048', icon: '2048.png' },
  { id: 'TETRIS', nameKey: 'pages.gamesPage.games.TETRIS', serial: '03', category: 'Logic', path: '/games/tetris', icon: 'tetris.png' },
  { id: 'MINES', nameKey: 'pages.gamesPage.games.MINES', serial: '04', category: 'Strategy', path: '/games/minesweeper', icon: 'minesweeper.png' },
  { id: 'SBTI', nameKey: 'pages.gamesPage.games.SBTI', serial: '05', category: 'Psych', path: '/games/sbti', icon: 'personality-test.png' },
  { id: 'QUEENS', nameKey: 'pages.gamesPage.games.QUEENS', serial: '06', category: 'Puzzle', path: '/games/queens', icon: 'eight-queens.png' },
  { id: 'LINK', nameKey: 'pages.gamesPage.games.LINK', serial: '07', category: 'Casual', path: '/games/link-link', icon: 'link-link.png' },
  { id: 'SLIDING', nameKey: 'pages.gamesPage.games.SLIDING', serial: '08', category: 'Puzzle', path: '/games/sliding-puzzle', icon: 'silding-puzzle.png' },
  { id: 'COLOR', nameKey: 'pages.gamesPage.games.COLOR', serial: '09', category: 'Vision', path: '/games/color-challenge', icon: 'color-challenge.png' },
  { id: 'MEMO', nameKey: 'pages.gamesPage.games.MEMO', serial: '10', category: 'Memory', path: '/games/memory-card', icon: 'memory-card.png' },
  { id: 'BRICK', nameKey: 'pages.gamesPage.games.BRICK', serial: '11', category: 'Action', path: '/games/brick', icon: 'brick-breaker.png' },
  { id: 'DINO', nameKey: 'pages.gamesPage.games.DINO', serial: '12', category: 'Arcade', path: '/games/dino', icon: 'dino-run.png' },
  { id: 'AA', nameKey: 'pages.gamesPage.games.AA', serial: '13', category: 'Timing', path: '/games/aa-game', icon: 'aa-game.png' },
  { id: 'SUDOKU', nameKey: 'pages.gamesPage.games.SUDOKU', serial: '14', category: 'Logic', path: '/games/sudoku', icon: 'sudoku.png' },
  { id: 'BOXJUMP', nameKey: 'pages.gamesPage.games.BOXJUMP', serial: '15', category: 'Arcade', path: '/games/box-jump', icon: 'box-jump.png' },
  { id: 'MAZE', nameKey: 'pages.gamesPage.games.MAZE', serial: '16', category: 'Puzzle', path: '/games/maze-runner', icon: 'maze-runner.png' },
  { id: 'TANK', nameKey: 'pages.gamesPage.games.TANK', serial: '17', category: 'Action', path: '/games/tank-battle', icon: 'tank-battle.png' },
  { id: 'CATTRAP', nameKey: 'pages.gamesPage.games.CATTRAP', serial: '18', category: 'Strategy', path: '/games/cat-trap', icon: 'cat-trap.png' },
  { id: 'WHACKMOLE', nameKey: 'pages.gamesPage.games.WHACKMOLE', serial: '19', category: 'Action', path: '/games/whack-mole', icon: 'whack-mole.png' },
  { id: 'PLANEWAR', nameKey: 'pages.gamesPage.games.PLANEWAR', serial: '20', category: 'Arcade', path: '/games/plane-war', icon: 'plane-war.png' },
  { id: 'DRAWLINE', nameKey: 'pages.gamesPage.games.DRAWLINE', serial: '21', category: 'Puzzle', path: '/games/draw-line', icon: 'draw-line.png' },
  { id: 'FRUITSLICE', nameKey: 'pages.gamesPage.games.FRUITSLICE', serial: '22', category: 'Action', path: '/games/fruit-slice', icon: 'fruit-slice.png' },
];

const groupMap: Record<string, string> = {
  'Logic': 'LOGIC', 'Puzzle': 'LOGIC',
  'Action': 'ACTION', 'Arcade': 'ACTION', 'Timing': 'ACTION',
  'Strategy': 'STRATEGY',
  'Memory': 'MEMORY', 'Vision': 'MEMORY',
  'Casual': 'CASUAL', 'Classic': 'CASUAL', 'Psych': 'CASUAL'
};

const categories = computed(() => [
  { value: 'ALL', label: tSafe('pages.gamesPage.filter.all', '全部'), icon: 'fas fa-layer-group', color: '#6366f1', count: gamesList.length },
  { value: 'LOGIC', label: tSafe('pages.gamesPage.filter.logic', '益智逻辑'), icon: 'fas fa-lightbulb', color: '#10b981', count: gamesList.filter(g => groupMap[g.category] === 'LOGIC').length },
  { value: 'ACTION', label: tSafe('pages.gamesPage.filter.action', '反应挑战'), icon: 'fas fa-bullseye', color: '#ef4444', count: gamesList.filter(g => groupMap[g.category] === 'ACTION').length },
  { value: 'STRATEGY', label: tSafe('pages.gamesPage.filter.strategy', '策略思考'), icon: 'fas fa-chess-knight', color: '#f59e0b', count: gamesList.filter(g => groupMap[g.category] === 'STRATEGY').length },
  { value: 'MEMORY', label: tSafe('pages.gamesPage.filter.memory', '记忆观察'), icon: 'fas fa-brain', color: '#ec4899', count: gamesList.filter(g => groupMap[g.category] === 'MEMORY').length },
  { value: 'CASUAL', label: tSafe('pages.gamesPage.filter.casual', '休闲娱乐'), icon: 'fas fa-gamepad', color: '#8b5cf6', count: gamesList.filter(g => groupMap[g.category] === 'CASUAL').length },
]);

const colors: Record<string, string> = {
  SNAKE: '#10b981',
  '2048': '#f59e0b',
  TETRIS: '#ec4899',
  MINES: '#475569',
  SBTI: '#d97706',
  QUEENS: '#3b82f6',
  LINK: '#8b5cf6',
  SLIDING: '#ef4444',
  COLOR: '#06b6d4',
  MEMO: '#1e3a8a',
  BRICK: '#f97316',
  DINO: '#334155',
  AA: '#0ea5e9',
  SUDOKU: '#22c55e',
  BOXJUMP: '#3b82f6',
  MAZE: '#8b4513',
  TANK: '#65a30d',
  CATTRAP: '#f59e0b',
  WHACKMOLE: '#b45309',
  PLANEWAR: '#0ea5e9',
  DRAWLINE: '#8b5cf6',
  FRUITSLICE: '#f43f5e',
};

const getAccentColor = (id: string) => colors[id] || '#999';

const getIcon = (filename: string) => {
  return new URL(`../assets/game_pictures/${filename}`, import.meta.url).href;
};

const filteredGames = computed(() => {
  if (activeCategory.value === 'ALL') return gamesList;
  return gamesList.filter(g => groupMap[g.category] === activeCategory.value);
});
</script>

<style scoped>
.modern-games-container {
  min-height: 100vh;
  background-color: var(--background, #f4f7fb);
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  transition: background-color 0.3s ease;
}

.page-content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* Category Filter Scroll Container */
.category-scroll-container {
  width: 100%;
  overflow-x: auto;
  padding: 15px 4px 20px 4px; /* Added padding to prevent shadow clipping */
  margin-top: -15px; /* Offset the padding visually */
  margin-bottom: 20px;
  scrollbar-width: none; /* Firefox */
}

.category-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.category-tabs {
  display: flex;
  gap: 16px;
  min-width: max-content;
}

/* Category Cards matching the reference */
.cat-card {
  background: var(--cat-bg);
  border: 1px solid transparent;
  padding: 12px 24px 12px 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px var(--cat-shadow);
}

.cat-card.active {
  background: var(--card-background, #ffffff);
  border-color: var(--cat-color);
  box-shadow: 0 8px 25px var(--cat-shadow);
}

.cat-icon {
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-cat-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.cat-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cat-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--cat-color);
  margin-bottom: 2px;
}

.cat-count {
  font-size: 11px;
  color: var(--text-secondary, #64748b);
  font-weight: 600;
}

/* Games Grid */
.games-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.modern-card {
  background: var(--card-background, #ffffff);
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  box-shadow: 0 8px 30px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color, rgba(0,0,0,0.02));
}

.modern-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0,0,0,0.08);
}

.card-content {
  display: flex;
  justify-content: space-between;
  height: 100%;
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
  color: var(--text-primary, #1e293b);
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
  justify-content: space-between;
  z-index: 1;
}

.game-icon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
  transition: transform 0.3s ease;
}

.modern-card:hover .game-icon {
  transform: scale(1.1) rotate(-5deg);
}

.placeholder-card {
  opacity: 0.7;
}
.placeholder-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #cbd5e1;
}

/* Dark Theme Support */
:root.dark-theme .cat-card.active {
  background: #1e293b;
}
:root.dark-theme .modern-card {
  background: #1e293b;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  border-color: rgba(255,255,255,0.05);
}
:root.dark-theme .game-name {
  color: #f1f5f9;
}
:root.dark-theme .modern-card:hover {
  box-shadow: 0 15px 35px rgba(0,0,0,0.6);
}

/* Mobile Responsiveness */
@media (max-width: 1024px) {
  .games-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .modern-games-container { padding: 30px 15px; }
}
@media (max-width: 768px) {
  .games-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .modern-card { padding: 16px; border-radius: 16px; }
  .game-icon { width: 55px; height: 55px; }
  .game-name { font-size: 16px; margin-bottom: 4px; }
  .card-serial { font-size: 11px; margin-bottom: 4px; }
  
  /* Make categories wrap into a grid on mobile instead of horizontal scroll */
  .category-scroll-container { 
    overflow-x: visible; 
    padding-bottom: 0;
  }
  .category-tabs { 
    min-width: auto; 
    display: grid; 
    grid-template-columns: repeat(2, 1fr); 
    gap: 12px; 
  }
  .cat-card { padding: 10px 12px; gap: 10px; border-radius: 12px; justify-content: flex-start; min-width: 0; }
  .cat-icon { font-size: 20px; }
  .cat-title { font-size: 13px; }
  .cat-count { font-size: 10px; }
}
@media (max-width: 480px) {
  .games-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .modern-card { padding: 12px; border-radius: 12px; }
  .game-icon { width: 45px; height: 45px; }
  .game-name { font-size: 15px; }
  .game-tag { font-size: 9px; }
  .placeholder-icon { width: 45px; height: 45px; font-size: 28px; }
}
</style>
