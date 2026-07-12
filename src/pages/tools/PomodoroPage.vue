<template>
  <div class="gemini-pomodoro-wrapper">
    <div class="background-aurora"></div>

    <div class="app-container">
      <header class="app-header">
        <div class="status-pill" :class="currentMode">
          <span class="status-dot"></span>
          <span class="status-text">{{ isRunning ? t('pages.tools.pomodoroPage.running') : t('pages.tools.pomodoroPage.standby') }}</span>
        </div>
        <div class="cycle-count">{{ t('pages.tools.pomodoroPage.completedCycles', { count: completedSessions }) }}</div>
      </header>

      <main class="main-layout">
        <!-- Timer Section -->
        <section class="timer-section">
          <div class="glass-card timer-card">
            <h2 class="mode-title">{{ currentMode === 'work' ? t('pages.tools.pomodoroPage.focusModeTitle').replace(/>>>|<<</g, '') : t('pages.tools.pomodoroPage.restoreModeTitle').replace(/>>>|<<</g, '') || 'Rest Mode' }}</h2>
            
            <div class="time-display">
              <span class="time-text">{{ formatTime }}</span>
            </div>

            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            </div>

            <div class="controls">
              <button @click="toggleTimer" class="gemini-btn primary-btn" :class="{ 'is-running': isRunning }">
                <span class="btn-text">{{ isRunning ? t('pages.tools.pomodoroPage.terminateProgram') : t('pages.tools.pomodoroPage.startProgram') }}</span>
                <div class="btn-glow"></div>
              </button>
              
              <div class="secondary-controls">
                <button @click="resetTimer" class="gemini-btn outline-btn">{{ t('pages.tools.pomodoroPage.resetBtn') }}</button>
                <button @click="showSettings = true" class="gemini-btn outline-btn">{{ t('pages.tools.pomodoroPage.configBtn') }}</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Tasks Section -->
        <aside class="tasks-section">
          <div class="glass-card tasks-card">
            <div class="tasks-header">
              <h3>{{ t('pages.tools.pomodoroPage.taskListLog').replace('.LOG', '') }}</h3>
              <button class="icon-btn add-btn" @click="showAddTask = true" title="Add Task">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
            
            <div class="tasks-list">
              <div v-if="tasks.length === 0" class="empty-state">
                {{ t('pages.tools.pomodoroPage.noTasks') }}
              </div>
              <transition-group name="list">
                <div v-for="task in tasks" :key="task.id" class="task-item" :class="{ 'is-completed': task.completed }">
                  <label class="custom-checkbox">
                    <input type="checkbox" v-model="task.completed">
                    <span class="checkmark"></span>
                  </label>
                  <span class="task-title">{{ task.title }}</span>
                  <button class="icon-btn delete-btn" @click="deleteTask(task.id)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                  </button>
                </div>
              </transition-group>
            </div>
          </div>
        </aside>
      </main>
    </div>

    <!-- Modals -->
    <transition name="fade">
      <div v-if="showSettings || showAddTask" class="modal-overlay" @click.self="closeModals">
        <div class="glass-modal">
          <h3 class="modal-title">{{ showSettings ? t('pages.tools.pomodoroPage.parameterAdjustment') : t('pages.tools.pomodoroPage.newTaskList') }}</h3>
          
          <div class="modal-body">
            <template v-if="showSettings">
              <div class="form-group">
                <label>{{ t('pages.tools.pomodoroPage.workDurationMin') }}</label>
                <input type="number" v-model="settings.workDuration" class="gemini-input" min="1" max="120" />
              </div>
              <div class="form-group">
                <label>{{ t('pages.tools.pomodoroPage.restDurationMin') }}</label>
                <input type="number" v-model="settings.breakDuration" class="gemini-input" min="1" max="60" />
              </div>
            </template>
            <template v-else>
              <div class="form-group">
                <label>{{ t('pages.tools.pomodoroPage.taskDesc') }}</label>
                <input v-model="newTask.title" :placeholder="t('pages.tools.pomodoroPage.inputCommand')" class="gemini-input" @keyup.enter="confirmAction" autofocus />
              </div>
            </template>
          </div>
          
          <div class="modal-actions">
            <button @click="closeModals" class="gemini-btn text-btn">{{ t('pages.tools.pomodoroPage.cancelBtn') }}</button>
            <button @click="confirmAction" class="gemini-btn primary-btn">{{ t('pages.tools.pomodoroPage.confirmExec') }}</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, computed, onMounted } from 'vue'

const { t } = useI18n();

const currentMode = ref<'work' | 'break'>('work')

onMounted(() => {
  timeLeft.value = settings.value.workDuration * 60
})
const isRunning = ref(false)
const timeLeft = ref(25 * 60)
const completedSessions = ref(0)
const tasks = ref<any[]>([])
const showSettings = ref(false)
const showAddTask = ref(false)
const timer = ref<any>(null)
const settings = ref({ workDuration: 25, breakDuration: 5 })
const newTask = ref({ title: '' })

const formatTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const progress = computed(() => {
  const total = (currentMode.value === 'work' ? settings.value.workDuration : settings.value.breakDuration) * 60
  return ((total - timeLeft.value) / total) * 100
})

const toggleTimer = () => {
  if (isRunning.value) {
    clearInterval(timer.value)
  } else {
    timer.value = setInterval(() => {
      if (timeLeft.value > 0) timeLeft.value--
      else completeCycle()
    }, 1000)
  }
  isRunning.value = !isRunning.value
}

const completeCycle = () => {
  clearInterval(timer.value)
  isRunning.value = false
  if (currentMode.value === 'work') {
    completedSessions.value++
    currentMode.value = 'break'
    timeLeft.value = settings.value.breakDuration * 60
  } else {
    currentMode.value = 'work'
    timeLeft.value = settings.value.workDuration * 60
  }
}

const resetTimer = () => {
  clearInterval(timer.value)
  isRunning.value = false
  timeLeft.value = (currentMode.value === 'work' ? settings.value.workDuration : settings.value.breakDuration) * 60
}

const closeModals = () => {
  showSettings.value = false
  showAddTask.value = false
}

const confirmAction = () => {
  if (showAddTask.value && newTask.value.title.trim()) {
    tasks.value.push({ id: Date.now(), title: newTask.value.title.trim(), completed: false })
    newTask.value.title = ''
  }
  if (showSettings.value) {
      if(currentMode.value === 'work') timeLeft.value = settings.value.workDuration * 60;
      else timeLeft.value = settings.value.breakDuration * 60;
      clearInterval(timer.value)
      isRunning.value = false
  }
  closeModals()
}

const deleteTask = (id: number) => {
  tasks.value = tasks.value.filter(t => t.id !== id)
}


</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

.gemini-pomodoro-wrapper {
  --g-bg: var(--background, #f0f4f9);
  --g-surface: var(--card-background, rgba(255, 255, 255, 0.7));
  --g-surface-border: var(--border-color, rgba(255, 255, 255, 0.5));
  --g-text: var(--text-primary, #1f1f1f);
  --g-text-secondary: var(--text-secondary, #444746);
  --g-primary: var(--link-hover-color, #0b57d0);
  --g-primary-hover: #1365e1;
  --g-gradient-1: #4285f4;
  --g-gradient-2: #9b72cb;
  --g-gradient-3: #d96570;
  
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: var(--g-bg);
  color: var(--g-text);
}



/* Aurora Background */
.background-aurora {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 50% 50%, rgba(66, 133, 244, 0.08), transparent 40%),
              radial-gradient(circle at 80% 20%, rgba(155, 114, 203, 0.08), transparent 30%),
              radial-gradient(circle at 20% 80%, rgba(217, 101, 112, 0.08), transparent 40%);
  filter: blur(60px);
  z-index: 0;
  animation: aurora-shift 20s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes aurora-shift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-5%, 5%) scale(1.05); }
}

.app-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: var(--g-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--g-surface-border);
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--g-text-secondary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--g-text-secondary);
  transition: all 0.3s;
}

.status-pill.work .status-dot {
  background-color: var(--g-gradient-1);
  box-shadow: 0 0 8px var(--g-gradient-1);
}

.status-pill.break .status-dot {
  background-color: var(--g-gradient-2);
  box-shadow: 0 0 8px var(--g-gradient-2);
}

.cycle-count {
  font-weight: 500;
  color: var(--g-text-secondary);
  background: var(--g-surface);
  padding: 6px 16px;
  border-radius: 9999px;
  border: 1px solid var(--g-surface-border);
  backdrop-filter: blur(12px);
}

/* Main Layout */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  flex: 1;
  min-height: 0;
}

/* Glassmorphism Cards */
.glass-card {
  background: var(--g-surface);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--g-surface-border);
  border-radius: 28px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.02);
  padding: 3rem;
  display: flex;
  flex-direction: column;
}

/* Timer Section */
.timer-card {
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.mode-title {
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--g-text-secondary);
  margin-bottom: 2rem;
  letter-spacing: 1px;
}

.time-display {
  margin: 1rem 0 3rem;
}

.time-text {
  font-size: 8rem;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -4px;
  background: linear-gradient(135deg, var(--g-text) 30%, var(--g-text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}

.progress-track {
  width: 100%;
  max-width: 400px;
  height: 6px;
  background: rgba(128, 128, 128, 0.1);
  border-radius: 999px;
  margin-bottom: 4rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--g-gradient-1), var(--g-gradient-2));
  border-radius: 999px;
  transition: width 1s linear;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 320px;
}

.secondary-controls {
  display: flex;
  gap: 1rem;
  width: 100%;
}

/* Buttons */
.gemini-btn {
  position: relative;
  border: none;
  border-radius: 999px;
  padding: 14px 28px;
  font-size: 1.1rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.gemini-btn:active {
  transform: scale(0.96);
}

.primary-btn {
  width: 100%;
  padding: 18px 36px;
  font-size: 1.25rem;
  background: var(--g-text);
  color: var(--g-bg);
}

.gemini-pomodoro-wrapper.dark-theme .primary-btn {
  background: var(--g-primary);
  color: #000;
}

.primary-btn.is-running {
  background: var(--g-surface);
  border: 1px solid var(--g-surface-border);
  color: var(--g-text);
}

.primary-btn.is-running .btn-glow {
  opacity: 0.15;
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--g-gradient-1), var(--g-gradient-2), var(--g-gradient-3));
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 0;
}

.primary-btn:hover:not(.is-running) .btn-glow {
  opacity: 1;
}

.btn-text {
  position: relative;
  z-index: 1;
}

.outline-btn {
  flex: 1;
  background: transparent;
  border: 1px solid var(--g-surface-border);
  color: var(--g-text);
  font-size: 1rem;
  padding: 12px 20px;
}

.outline-btn:hover {
  background: rgba(128, 128, 128, 0.05);
}

.text-btn {
  background: transparent;
  color: var(--g-text-secondary);
}

.text-btn:hover {
  background: rgba(128, 128, 128, 0.05);
  color: var(--g-text);
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--g-text-secondary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(128, 128, 128, 0.08);
  color: var(--g-text);
}

/* Tasks Section */
.tasks-card {
  padding: 2rem;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tasks-header h3 {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  color: var(--g-text-secondary);
  font-style: italic;
  text-align: center;
  margin-top: 2rem;
  font-size: 0.95rem;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(128, 128, 128, 0.03);
  transition: all 0.2s;
}

.task-item:hover {
  background: rgba(128, 128, 128, 0.06);
}

.task-title {
  flex: 1;
  font-size: 1rem;
  transition: all 0.2s;
}

.task-item.is-completed .task-title {
  color: var(--g-text-secondary);
  text-decoration: line-through;
  opacity: 0.6;
}

/* Custom Checkbox */
.custom-checkbox {
  position: relative;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.custom-checkbox input {
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  position: absolute;
  inset: 0;
  border: 2px solid var(--g-text-secondary);
  border-radius: 6px;
  transition: all 0.2s;
}

.custom-checkbox:hover input ~ .checkmark {
  border-color: var(--g-text);
}

.custom-checkbox input:checked ~ .checkmark {
  background-color: var(--g-primary);
  border-color: var(--g-primary);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.custom-checkbox input:checked ~ .checkmark:after {
  display: block;
}

.gemini-pomodoro-wrapper.dark-theme .custom-checkbox input:checked ~ .checkmark:after {
  border-color: #000;
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.glass-modal {
  background: var(--g-surface);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--g-surface-border);
  border-radius: 28px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.1);
  transform: scale(1);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-enter-active .glass-modal {
  animation: modal-pop 0.3s cubic-bezier(0.2, 0, 0, 1);
}

@keyframes modal-pop {
  0% { transform: scale(0.95) translateY(10px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

.modal-title {
  margin: 0 0 1.5rem;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  color: var(--g-text-secondary);
  margin-bottom: 0.5rem;
}

.gemini-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(128, 128, 128, 0.05);
  border: 1px solid var(--g-surface-border);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--g-text);
  font-family: inherit;
  transition: all 0.2s;
}

.gemini-input:focus {
  outline: none;
  background: rgba(128, 128, 128, 0.08);
  border-color: var(--g-primary);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

/* Responsive */
@media (max-width: 900px) {
  .gemini-pomodoro-wrapper {
    height: auto;
    min-height: 100dvh;
    overflow-y: auto;
  }
  .app-container {
    height: auto;
  }
  .main-layout {
    grid-template-columns: 1fr;
  }
  
  .time-text {
    font-size: 6rem;
  }
  
  .app-container {
    padding: 1rem;
  }
}
</style>
