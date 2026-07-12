<template>
  <div class="yuemu-retro-wall" :class="{ 'dark-theme': isDark }">
    <div class="canvas-grid"></div>

    <header class="top-nav">
      <div class="glass-dock">
        <button class="retro-btn create" @click="addNote">
          <span class="icon">✍️</span> 
        </button>
        <button class="retro-btn clear" @click="clearAll">
          <span class="icon"><i class="fas fa-broom"></i></span> 
        </button>
      </div>
    </header>

    <div id="board" class="note-layer">
      <div v-if="notes.length === 0" class="retro-empty">
        <div class="stamp-border">
          <div class="stamp-text"></div>
        </div>
        <p class="hint-text"></p>
      </div>

      <div
        v-for="note in notes"
        :key="note.id"
        class="sticky-card"
        :class="{ 'is-active': activeNoteId === note.id, 'is-maximized': note.maximized }"
        :style="{
          backgroundColor: note.color,
          left: note.x + 'px',
          top: note.y + 'px',
          zIndex: note.zIndex,
          transform: `rotate(${note.rotation}deg) scale(${note.scale})`
        }"
        @mousedown="handleDragStart($event, note)"
        @touchstart="handleDragStart($event, note)"
      >
        <div class="card-header">
          <div class="folder-eye"></div>
          <div class="note-meta">NO.{{ String(note.id).slice(-6) }}</div>
          <div class="header-actions">
            <div class="dot max" @click.stop="note.maximized = !note.maximized"></div>
            <div class="dot close" @click.stop="deleteNote(note.id)"></div>
          </div>
        </div>

        <div class="card-body">
          <textarea
            v-model="note.content"
            :placeholder="t('pages.tools.stickyWallPage.writeNote')"
            @input="saveNotes"
            @touchstart.stop
          ></textarea>
        </div>

        <div class="card-footer">
          <div class="red-stamp">
            {{ new Date(note.id).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';

// 这里的 isDark 建议通过 inject 或 props 获取你全局的状态
const isDark = ref(false);
const notes = ref<any[]>([]);
const zIndexCounter = ref(100);
const activeNoteId = ref<number | null>(null);

// 使用你提供的牛皮纸色系作为基础，辅以柔和色彩
const vintageColors = ['#f5f0e8', '#e8d9c4', '#fdf2f8', '#f0f8f1', '#e8f4f8'];

const addNote = () => {
  const newNote = {
    id: Date.now(),
    content: '',
    color: vintageColors[Math.floor(Math.random() * vintageColors.length)],
    x: Math.random() * (window.innerWidth - 250),
    y: 120 + Math.random() * (window.innerHeight - 300),
    rotation: (Math.random() - 0.5) * 6,
    zIndex: ++zIndexCounter.value,
    scale: 1,
    maximized: false
  };
  notes.value.push(newNote);
  saveNotes();
};

const deleteNote = (id: number) => {
  notes.value = notes.value.filter(n => n.id !== id);
  saveNotes();
};

const clearAll = () => {
  Modal.confirm({
    title: t('pages.tools.stickyWallPage.confirmBurn'),
    content: t('pages.tools.stickyWallPage.burnWarning'),
    onOk: () => { notes.value = []; saveNotes(); }
  });
};

const saveNotes = () => localStorage.setItem('retro_sticky_notes', JSON.stringify(notes.value));

const handleDragStart = (e: any, note: any) => {
  if (e.target.tagName === 'TEXTAREA') return;
  activeNoteId.value = note.id;
  note.zIndex = ++zIndexCounter.value;

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const startX = clientX - note.x;
  const startY = clientY - note.y;

  const move = (me: any) => {
    const cx = me.touches ? me.touches[0].clientX : me.clientX;
    const cy = me.touches ? me.touches[0].clientY : me.clientY;
    note.x = cx - startX;
    note.y = cy - startY;
  };

  const end = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', end);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
    saveNotes();
  };

  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', end);
  document.addEventListener('touchmove', move, { passive: false });
  document.addEventListener('touchend', end);
};

onMounted(() => {
  const data = localStorage.getItem('retro_sticky_notes');
  if (data) notes.value = JSON.parse(data);
});
</script>

<style lang="scss" scoped>
.yuemu-retro-wall {
  position: fixed;
  inset: 0;
  background-color: var(--background);
  transition: background-color 0.5s ease;
  overflow: hidden;

  /* 背景网格纹理 */
  .canvas-grid {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(var(--border-color) 1px, transparent 1px),
      linear-gradient(var(--border-color) 0.5px, transparent 0.5px);
    background-size: 30px 30px, 100% 40px;
    opacity: 0.5;
    pointer-events: none;
  }
}

/* 顶部停靠栏：物理居中设计 */
.top-nav {
  position: absolute;
  top: 25px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 9999;
  padding: 0 15px;

  .glass-dock {
    display: flex;
    gap: 15px;
    padding: 10px 20px;
    background: var(--header-background);
    backdrop-filter: blur(10px);
    border: 1px solid var(--header-border);
    border-radius: 50px;
    box-shadow: 0 10px 30px var(--header-shadow);
  }
}

/* 复古按钮样式 */
.retro-btn {
  border: 1.5px solid var(--text-primary);
  background: var(--card-background);
  color: var(--text-primary);
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 3px 3px 0px var(--text-primary);

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px var(--text-primary);
  }

  &.clear {
    border-color: var(--like-button-active-color);
    color: var(--like-button-active-color);
    box-shadow: 3px 3px 0px var(--like-button-active-color);
  }
}

/* 便签卡片主体 */
.sticky-card {
  position: absolute;
  width: 240px;
  padding: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 8px 8px 0px var(--shadow-color);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &.is-active {
    box-shadow: 12px 12px 25px var(--shadow-color);
  }

  &.is-maximized {
    position: fixed !important;
    inset: 20px !important;
    width: auto !important;
    height: auto !important;
    transform: none !important;
    z-index: 10000 !important;
  }
}

.card-header {
  border-bottom: 1px dashed var(--text-secondary);
  padding-bottom: 8px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;

  .folder-eye {
    width: 12px;
    height: 12px;
    border: 2px solid var(--text-primary);
    border-radius: 50%;
  }

  .note-meta {
    font-size: 11px;
    font-family: monospace;
    color: var(--text-secondary);
    flex: 1;
  }

  .header-actions {
    display: flex;
    gap: 6px;
    .dot {
      width: 10px; height: 10px;
      border: 1px solid var(--text-primary);
      cursor: pointer;
      &.max { background: #52c41a; }
      &.close { background: #ff4d4f; }
    }
  }
}

.card-body {
  textarea {
    width: 100%;
    min-height: 120px;
    background: transparent;
    border: none;
    outline: none;
    font-size: 18px;
    line-height: 1.6;
    color: #2b1d11; /* 默认墨水黑 */
    font-family: var(--font-family-base) !important;
    resize: none;
  }
}

/* 暗色模式下的文字颜色修正 */
.dark-theme {
  .card-body textarea {
    color: var(--text-primary);
  }
  .sticky-card {
    filter: sepia(0.2) brightness(0.9); /* 让卡片在暗色下有种陈旧纸张感 */
  }
}

.card-footer {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;

  .red-stamp {
    border: 2px solid var(--like-button-active-color);
    color: var(--like-button-active-color);
    padding: 2px 6px;
    font-size: 12px;
    font-weight: bold;
    transform: rotate(-15deg);
    border-radius: 4px;
    opacity: 0.8;
    user-select: none;
  }
}

/* 复古空状态 */
.retro-empty {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;

  .stamp-border {
    border: 5px double var(--text-secondary);
    padding: 20px 40px;
    display: inline-block;
    transform: rotate(-5deg);
    margin-bottom: 20px;

    .stamp-text {
      font-size: 42px;
      color: var(--text-secondary);
      font-weight: bold;
    }
  }
  .hint-text {
    color: var(--text-secondary);
    font-size: 16px;
  }
}

/* 移动端特殊适配 */
@media (max-width: 768px) {
  .sticky-card {
    width: 180px; /* 移动端卡片稍窄 */
  }
  .top-nav .glass-dock {
    width: 90%;
    justify-content: space-around;
  }
  .retro-btn {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
