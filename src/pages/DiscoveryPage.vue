<template>
  <div class="discovery-page">
    <div class="container">

        <div class="module">
          <div class="module-header">
            <h2 class="module-title">{{ $t('pages.discoveryPage.communityInteraction') }}</h2>
            <span class="module-subtitle">{{ $t('pages.discoveryPage.communitySubtitle') }}</span>
          </div>

          <div class="bento-grid">
            <div class="bento-card bento-large bg-image-card" :style="{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.45)), url(${loveImg})` }" @click="goToPage('/loveboard/list')">
              <div class="bento-content">
                <div class="text-group bottom-text">
                  <h3 class="bento-title">{{ $t('pages.discoveryPage.loveBoard') }}</h3>
                  <p class="bento-desc">{{ $t('pages.discoveryPage.loveBoardDesc') }}</p>
                </div>
              </div>
            </div>

            <div class="bento-card bento-medium bg-image-card" :style="{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.1)), url(${friendLinkImg})` }" @click="goToPage('/friend-links')">
              <div class="bento-content row-content">
                <div class="text-group">
                  <h3 class="bento-title">{{ $t('pages.discoveryPage.friendLinks') }}</h3>
                  <p class="bento-desc">{{ $t('pages.discoveryPage.friendLinksDesc') }}</p>
                </div>
              </div>
            </div>

            <div class="bento-card bento-medium bg-image-card" :style="{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.1)), url(${treeHoleImg})` }" @click="goToPage('/barrage')">
              <div class="bento-content row-content">
                <div class="text-group">
                  <h3 class="bento-title">{{ $t('pages.discoveryPage.treeHole') }}</h3>
                  <p class="bento-desc">{{ $t('pages.discoveryPage.treeHoleDesc') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="module">
          <div class="module-header">
            <h2 class="module-title">{{ $t('pages.discoveryPage.premiumGames') }}</h2>
            <span class="module-subtitle">{{ $t('pages.discoveryPage.gamesSubtitle') }}</span>
          </div>
          
          <div class="games-grid">
            <div class="modern-card" v-for="(game, index) in games" :key="game.path" @click="goToPage(game.path)">
              <div class="card-left">
                <span class="card-serial" :style="{ color: getAccentColor(game.path) }">{{ String(index + 1).padStart(2, '0') }}</span>
                <h3 class="game-name">{{ $t(game.nameKey) }}</h3>
                <div class="game-tag" :style="{ color: getAccentColor(game.path) }">{{ $t(game.descKey) }}</div>
              </div>
              <div class="card-right">
                <img :src="getGameImage(game.image)" :alt="$t(game.nameKey)" class="game-icon" />
              </div>
            </div>
          </div>
        </div>

        <div class="module">
          <div class="module-header">
            <h2 class="module-title">{{ $t('pages.discoveryPage.usefulTools') }}</h2>
            <span class="module-subtitle">{{ $t('pages.discoveryPage.toolsSubtitle') }}</span>
          </div>
          <div class="games-grid">
            <div class="modern-card" v-for="(tool, index) in tools" :key="tool.path" @click="goToPage(tool.path)">
              <div class="card-left">
                <span class="card-serial" :style="{ color: getAccentColor(tool.key) }">{{ String(index + 1).padStart(2, '0') }}</span>
                <h3 class="game-name">{{ $t(tool.nameKey) }}</h3>
                <div class="game-tag" :style="{ color: getAccentColor(tool.key) }">{{ $t(tool.categoryKey || 'pages.discoveryPage.tool') }}</div>
              </div>
              <div class="card-right">
                <img :src="getToolImage(tool.key)" :alt="$t(tool.nameKey)" class="game-icon" />
              </div>
            </div>
          </div>
        </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import loveImg from '@/assets/images/love.png';
import friendLinkImg from '@/assets/images/friend-link.png';
import treeHoleImg from '@/assets/images/tree-hole.png';

const { t } = useI18n();

import { markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { LinkOutlined, HeartOutlined, MessageOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const goToPage = (path: string) => {
  router.push(path);
};

// 游戏列表数据配置
const games = [
  { nameKey: 'pages.discoveryPage.games.snake', descKey: 'pages.discoveryPage.games.snakeDesc', path: '/games/snake', image: 'snake.png' },
  { nameKey: 'pages.discoveryPage.games.2048', descKey: 'pages.discoveryPage.games.2048Desc', path: '/games/2048', image: '2048.png' },
  { nameKey: 'pages.discoveryPage.games.linkLink', descKey: 'pages.discoveryPage.games.linkLinkDesc', path: '/games/link-link', image: 'link-link.png' },
  { nameKey: 'pages.discoveryPage.games.tetris', descKey: 'pages.discoveryPage.games.tetrisDesc', path: '/games/tetris', image: 'tetris.png' },
  { nameKey: 'pages.discoveryPage.games.sbti', descKey: 'pages.discoveryPage.games.sbtiDesc', path: '/games/sbti', image: 'personality-test.png' },
  { nameKey: 'pages.discoveryPage.games.slidingPuzzle', descKey: 'pages.discoveryPage.games.slidingPuzzleDesc', path: '/games/sliding-puzzle', image: 'silding-puzzle.png' },
  { nameKey: 'pages.discoveryPage.games.brick', descKey: 'pages.discoveryPage.games.brickDesc', path: '/games/brick', image: 'brick-breaker.png' },
  { nameKey: 'pages.discoveryPage.games.dino', descKey: 'pages.discoveryPage.games.dinoDesc', path: '/games/dino', image: 'dino-run.png' },
  { nameKey: 'pages.discoveryPage.games.memoryCard', descKey: 'pages.discoveryPage.games.memoryCardDesc', path: '/games/memory-card', image: 'memory-card.png' },
  { nameKey: 'pages.discoveryPage.games.minesweeper', descKey: 'pages.discoveryPage.games.minesweeperDesc', path: '/games/minesweeper', image: 'minesweeper.png' },
  { nameKey: 'pages.discoveryPage.games.colorChallenge', descKey: 'pages.discoveryPage.games.colorChallengeDesc', path: '/games/color-challenge', image: 'color-challenge.png' },
  { nameKey: 'pages.discoveryPage.games.aaGame', descKey: 'pages.discoveryPage.games.aaGameDesc', path: '/games/aa-game', image: 'aa-game.png' },
  { nameKey: 'pages.discoveryPage.games.sudoku', descKey: 'pages.discoveryPage.games.sudokuDesc', path: '/games/sudoku', image: 'sudoku.png' },
  { nameKey: 'pages.discoveryPage.games.boxJump', descKey: 'pages.discoveryPage.games.boxJumpDesc', path: '/games/box-jump', image: 'box-jump.png' },
  { nameKey: 'pages.discoveryPage.games.mazeRunner', descKey: 'pages.discoveryPage.games.mazeRunnerDesc', path: '/games/maze-runner', image: 'maze-runner.png' },
  { nameKey: 'pages.discoveryPage.games.queens', descKey: 'pages.discoveryPage.games.queensDesc', path: '/games/queens', image: 'eight-queens.png' },
  { nameKey: 'pages.discoveryPage.games.tankBattle', descKey: 'pages.discoveryPage.games.tankBattleDesc', path: '/games/tank-battle', image: 'tank-battle.png' },
  { nameKey: 'pages.discoveryPage.games.catTrap', descKey: 'pages.discoveryPage.games.catTrapDesc', path: '/games/cat-trap', image: 'cat-trap.png' },
  { nameKey: 'pages.discoveryPage.games.whackMole', descKey: 'pages.discoveryPage.games.whackMoleDesc', path: '/games/whack-mole', image: 'whack-mole.png' },
  { nameKey: 'pages.discoveryPage.games.planeWar', descKey: 'pages.discoveryPage.games.planeWarDesc', path: '/games/plane-war', image: 'plane-war.png' },
  { nameKey: 'pages.discoveryPage.games.drawLine', descKey: 'pages.discoveryPage.games.drawLineDesc', path: '/games/draw-line', image: 'draw-line.png' },
  { nameKey: 'pages.discoveryPage.games.fruitSlice', descKey: 'pages.discoveryPage.games.fruitSliceDesc', path: '/games/fruit-slice', image: 'fruit-slice.png' }
];

const getGameImage = (img) => {
  return new URL(`../assets/game_pictures/${img}`, import.meta.url).href;
};


const getToolImage = (key) => {
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

// 工具列表数据配置
const tools = [
  { key: 'reminder', nameKey: 'pages.discoveryPage.tools.reminder', categoryKey: 'pages.toolsPage.tools.reminder.category', path: '/reminder' },
  { key: 'color-picker', nameKey: 'pages.discoveryPage.tools.colorPicker', categoryKey: 'pages.toolsPage.tools.colorPicker.category', path: '/tools/color-picker' },
  { key: 'food-wheel', nameKey: 'pages.discoveryPage.tools.foodWheel', categoryKey: 'pages.toolsPage.tools.foodWheel.category', path: '/tools/food-wheel' },
  { key: 'calculator', nameKey: 'pages.discoveryPage.tools.calculator', categoryKey: 'pages.toolsPage.tools.calculator.category', path: '/tools/calculator' },
  { key: 'timer', nameKey: 'pages.discoveryPage.tools.timer', categoryKey: 'pages.toolsPage.tools.timer.category', path: '/tools/timer' },
  { key: 'pomodoro', nameKey: 'pages.discoveryPage.tools.pomodoro', categoryKey: 'pages.toolsPage.tools.pomodoro.category', path: '/tools/pomodoro' },
  { key: 'sticky-wall', nameKey: 'pages.discoveryPage.tools.stickyWall', categoryKey: 'pages.toolsPage.tools.stickyWall.category', path: '/tools/sticky-wall' },
  { key: 'random', nameKey: 'pages.discoveryPage.tools.random', categoryKey: 'pages.toolsPage.tools.random.category', path: '/tools/random' },
  { key: 'base-converter', nameKey: 'pages.discoveryPage.tools.baseConverter', categoryKey: 'pages.toolsPage.tools.baseConverter.category', path: '/tools/base-converter' },
  { key: 'unit-converter', nameKey: 'pages.discoveryPage.tools.unitConverter', categoryKey: 'pages.toolsPage.tools.unitConverter.category', path: '/tools/unit-converter' },
  { key: 'text-lab', nameKey: 'pages.discoveryPage.tools.textLab', categoryKey: 'pages.toolsPage.tools.textLab.category', path: '/tools/text-lab' },
  { key: 'vault-key', nameKey: 'pages.discoveryPage.tools.vaultKey', categoryKey: 'pages.toolsPage.tools.vaultKey.category', path: '/tools/vault-key' },
  { key: 'grid-ruler', nameKey: 'pages.discoveryPage.tools.gridRuler', categoryKey: 'pages.toolsPage.tools.gridRuler.category', path: '/tools/grid-ruler' },
];
</script>

<style lang="scss" scoped>
.discovery-page {
  display: flex;
  flex-direction: column;
  background: var(--background);
  color: var(--text-primary);
  overflow: hidden;

  // 玻璃拟态顶部导航
  .page-header {
    flex-shrink: 0;
    padding: 16px 24px;
    background: var(--header-background);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--header-border);
    position: sticky;
    top: 0;
    z-index: 100;

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--header-text);
      margin: 0;
      letter-spacing: -0.5px;
    }
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px 0 100px;
    &::-webkit-scrollbar { width: 0; }
  }

  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px 24px 100px;
  }

  // 模块通用样式
  .module {
    margin-bottom: 48px;

    .module-header {
      margin-bottom: 24px;
      .module-title {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0 0 6px 0;
        letter-spacing: 0.5px;
      }
      .module-subtitle {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }
  }

  // ================= 1. Bento Box 布局 (社区版块) =================
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(2, 160px);
      gap: 24px;
    }

    .bento-card {
      border-radius: 28px;
      cursor: pointer;
      overflow: hidden;
      position: relative;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      border: 1px solid rgba(255, 255, 255, 0.1);

      &:hover {
        transform: scale(0.98) translateY(-4px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }

      .bento-content {
        padding: 28px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        z-index: 2;
      }

      .row-content {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }

      .bento-title {
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 6px 0;
        letter-spacing: 0.5px;
      }

      .bento-desc {
        font-size: 14px;
        margin: 0;
        opacity: 0.85;
        font-weight: 500;
      }

      // 图标容器
      .icon-wrapper {
        width: 56px;
        height: 56px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;

        &.glass-icon {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
      }
    }

    // 网格占位控制
    .bento-large {
      @media (min-width: 768px) {
        grid-column: span 2;
        grid-row: span 2;
      }
      color: #fff;
      .bottom-text { margin-top: auto; }
      
      .icon-wrapper {
        width: 64px;
        height: 64px;
        font-size: 32px;
      }
    }

    .bento-medium {
      @media (min-width: 768px) {
        grid-column: span 2;
        grid-row: span 1;
      }
      color: #fff;
    }

    .bg-image-card {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
  }

  // ================= 2. 游戏与工具卡片 (.modern-card) =================
  .games-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .modern-card {
    background: var(--card-background);
    border-radius: 24px;
    padding: 24px;
    cursor: pointer;
    box-shadow: 0 8px 30px var(--shadow-color);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modern-card:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 20px 40px var(--shadow-color);
    background-color: var(--hover-background);
  }

  .card-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 1;
    flex: 1;
    min-width: 0;
  }

  .card-serial {
    font-size: 14px;
    font-weight: 900;
    margin-bottom: 8px;
    font-family: 'Inter', 'Segoe UI', sans-serif;
  }

  .game-name {
    font-size: 20px;
    font-weight: 900;
    color: var(--text-primary);
    margin: 0 0 6px 0;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .game-tag {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .card-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    z-index: 1;
    flex-shrink: 0;
    margin-left: 16px;
  }

  .game-icon {
    width: 84px;
    height: 84px;
    object-fit: contain;
    filter: drop-shadow(0 12px 20px rgba(0,0,0,0.15));
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .modern-card:hover .game-icon {
    transform: scale(1.15) rotate(-8deg);
  }

  @media (max-width: 768px) {
    .container {
      padding: 16px 16px 100px;
    }
    
    .games-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .modern-card {
      padding: 20px;
      border-radius: 20px;
      flex-direction: column;
      align-items: flex-start;
    }

    .card-right {
      margin-top: 16px;
      margin-left: 0;
      align-self: flex-end;
    }
    
    .game-name {
      font-size: 18px;
    }
    
    .card-serial {
      font-size: 12px;
    }
    
    .game-tag {
      font-size: 10px;
    }
    
    .game-icon {
      width: 64px;
      height: 64px;
    }
    
    .bento-grid .bento-card {
      border-radius: 20px;
      .bento-content {
        padding: 20px;
      }
      .icon-wrapper {
        width: 48px;
        height: 48px;
        font-size: 24px;
      }
    }
  }

}
</style>
