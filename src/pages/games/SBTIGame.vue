<template>
  <div class="yuemu-sbti-codex-universe">
    <div class="zen-environment"></div>

    <div class="book-container" :class="`state-${gameState}`">
      <transition name="book-transform" mode="out-in">

        <div v-if="gameState === 'INTRO'" class="hardcover-view">
          <div class="book-spine"></div>

          <div class="book-cover-plate">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>

            <div class="cover-gold-lining">
              <div class="cover-content">
                <p class="archival-id">{{ t('pages.games.sBTIGame.fileNo2026XVPRO') }}</p>
                <div class="title-shield">
                  <h1 class="main-title">
                    <span class="small-caps">FIFTEEN DIMENSIONS</span><br />
                    <span class="script-font">{{ t('pages.games.sBTIGame.psychologicalAssessment') }}</span>
                  </h1>
                </div>
                <p class="author-label">{{ t('pages.games.sBTIGame.sbtiMatrixTopSecret') }}</p>

                <div class="seal-lock-zone">
                  <button class="physical-seal" @click="startGame">
                    <span class="seal-inner">{{ t('pages.games.sBTIGame.open') }}<br/>{{ t('pages.games.sBTIGame.archive') }}</span>
                  </button>
                  <p class="lock-hint">{{ t('pages.games.sBTIGame.clickSealToUnseal') }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="book-pages-stack"></div>
        </div>

        <div v-else-if="gameState === 'TESTING'" class="opened-book-view">
          <div class="inner-paper">
            <div class="gutter-shadow"></div>

            <div class="manuscript-content">
              <div class="progress-indicator">
                <div class="progress-meta">
                  <span>{{ t('pages.games.sBTIGame.itemStepOut', { current: currentStep + 1, total: totalQuestions }) }}</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
                </div>
              </div>

              <div class="question-canvas mobile-optimized-scroll">
                <transition name="entry-fade" mode="out-in">
                  <div :key="currentStep" class="entry-card">
                    <div class="entry-meta">{{ t('pages.games.sBTIGame.evalDimension', { dim: getQuestionDim(currentQuestion) }) }}</div>
                    <h2 class="entry-text">
                      <span v-if="currentStep === 0" class="drop-cap">{{ currentQuestion.text.charAt(0) }}</span>
                      {{ currentStep === 0 ? currentQuestion.text.slice(1) : currentQuestion.text }}
                    </h2>

                    <div class="options-ledger">
                      <div
                        v-for="(opt, optIdx) in currentQuestion.options"
                        :key="optIdx"
                        class="ledger-row"
                        :class="{ active: answers[currentQuestion.id] === opt.value }"
                        @click="handleAnswerSelection(currentQuestion.id, opt.value)"
                      >
                        <div class="ink-box"></div>
                        <div class="opt-content">
                          <span class="prefix">{{ String.fromCharCode(65 + optIdx) }}.</span>
                          <span class="text">{{ opt.label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <div class="book-footer">
                <button class="leaf-btn" @click="prevStep" :disabled="currentStep === 0"><span v-html="t('pages.games.sBTIGame.prevItem')"></span></button>
                <div class="ornament">❦</div>
                <button v-if="currentStep < totalQuestions - 1" class="leaf-btn next" @click="nextStep" :disabled="answers[currentQuestion.id] === undefined"><span v-html="t('pages.games.sBTIGame.nextItem')"></span></button>
                <button v-else class="seal-submit-btn" :class="{ 'ready': isComplete }" :disabled="!isComplete" @click="submitTest">
                  <span v-html="t('pages.games.sBTIGame.signEvalArchive')"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="gameState === 'RESULT' && result" class="report-scroll-view">
          <div class="official-scroll">
            <div class="scroll-border">
              <div class="stamp-confidential">{{ t('pages.games.sBTIGame.topSecretReport') }}</div>
              <div class="report-header">
                <p class="meta">{{ t('pages.games.sBTIGame.sbtiMatrixResult', { id: result.indexCode }) }}</p>
                <h1 class="title">{{ t('pages.games.sBTIGame.psychologicalProfileReport') }}</h1>
                <div class="divider-ornament">✨ ❦ ✨</div>
              </div>

              <div class="result-hero">
                <div class="portrait-frame">
                  <img v-if="result.image" :src="result.image" class="portrait-img" />
                  <div v-else class="img-fallback">{{ result.finalType.code }}</div>
                  <div class="wax-seal-mini">{{ t('pages.games.sBTIGame.sbtiCertification') }}</div>
                </div>
                <div class="type-id">
                  <h2 class="code">{{ result.finalType.code }}</h2>
                  <h3 class="cn">「{{ result.finalType.cn }}」</h3>
                  <p class="intro">“{{ result.finalType.intro }}”</p>
                </div>
              </div>

              <div class="report-body">
                <div class="analysis-box">
                  <h4 class="label">{{ t('pages.games.sBTIGame.deepPersonalityProfile') }}</h4>
                  <p class="desc-text">{{ result.finalType.desc }}</p>
                </div>

                <div class="dimension-ledger">
                  <h4 class="label">{{ t('pages.games.sBTIGame.fifteenDimensionData') }}</h4>
                  <div class="ledger-grid">
                    <div v-for="dim in dimensionOrder" :key="dim" class="ledger-item">
                      <span class="name">{{ dimensionMeta[dim].name }}</span>
                      <div class="gauge"><div class="fill" :style="{ width: (result.rawScores[dim] / 6) * 100 + '%' }"></div></div>
                      <span class="val">{{ result.levels[dim] }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="report-actions">
                <button class="action-btn hollow" @click="restartGame">{{ t('pages.games.sBTIGame.reEvaluate') }}</button>
                <button class="action-btn solid" @click="goToGames">{{ t('pages.games.sBTIGame.returnToLobby') }}</button>
              </div>

              <div class="report-footer">
                {{ t('pages.games.sBTIGame.evaluatorSign') }}
              </div>
            </div>
          </div>
        </div>

      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  questions as regularQuestions,
  specialQuestions,
  dimensionMeta,
  TYPE_LIBRARY,
  NORMAL_TYPES,
  dimensionOrder,
  TYPE_IMAGES,
} from '@/constants/sbti'

const router = useRouter()

type GameState = 'INTRO' | 'TESTING' | 'RESULT'
const gameState = ref<GameState>('INTRO')
const currentStep = ref(0)
const answers = ref<Record<string, number>>({})
const shuffledQuestions = ref<any[]>([])
const result = ref<any>(null)

const visibleQuestions = computed(() => {
  const list = [...shuffledQuestions.value]
  const gateIndex = list.findIndex((q) => q.id === 'drink_gate_q1')
  if (gateIndex !== -1 && answers.value['drink_gate_q1'] === 3) {
    if (!list.find((q) => q.id === 'drink_gate_q2')) {
      list.splice(gateIndex + 1, 0, specialQuestions[1])
    }
  } else if (gateIndex !== -1) {
    const sIdx = list.findIndex(q => q.id === 'drink_gate_q2')
    if (sIdx !== -1) list.splice(sIdx, 1)
  }
  return list
})

const currentQuestion = computed(() => visibleQuestions.value[currentStep.value])
const totalQuestions = computed(() => visibleQuestions.value.length)
const progressPercent = computed(() => ((currentStep.value + 1) / totalQuestions.value) * 100)
const isComplete = computed(() => visibleQuestions.value.every(q => answers.value[q.id] !== undefined))

function startGame() {
  answers.value = {}
  currentStep.value = 0
  const regShuffle = [...regularQuestions].sort(() => Math.random() - 0.5)
  regShuffle.splice(Math.floor(Math.random() * 10) + 10, 0, specialQuestions[0])
  shuffledQuestions.value = regShuffle
  gameState.value = 'TESTING'
}

function handleAnswerSelection(id: string, value: number) {
  answers.value[id] = value
  if (currentStep.value < totalQuestions.value - 1) {
    setTimeout(() => { if (answers.value[id] === value) currentStep.value++ }, 380)
  }
}

function nextStep() { if (currentStep.value < totalQuestions.value - 1) currentStep.value++ }
function prevStep() { if (currentStep.value > 0) currentStep.value-- }

function submitTest() {
  const rawScores: Record<string, number> = {}
  Object.keys(dimensionMeta).forEach((dim) => { rawScores[dim] = 0 })
  regularQuestions.forEach((q) => {
    if(answers.value[q.id] !== undefined) rawScores[q.dim || ''] += Number(answers.value[q.id])
  })
  const sumToLevel = (s: number) => (s <= 3 ? 'L' : s === 4 ? 'M' : 'H')
  const levels: Record<string, string> = {}
  Object.entries(rawScores).forEach(([dim, score]) => { levels[dim] = sumToLevel(score) })
  const levelNumMap = { L: 1, M: 2, H: 3 }
  const userVector = dimensionOrder.map((dim) => levelNumMap[levels[dim] as keyof typeof levelNumMap])
  const ranked = NORMAL_TYPES.map((type) => {
    const vector = type.pattern.replace(/-/g, '').split('').map((l) => levelNumMap[l as keyof typeof levelNumMap])
    let distance = 0
    for (let i = 0; i < vector.length; i++) distance += Math.abs(userVector[i] - vector[i])
    return { ...type, ...TYPE_LIBRARY[type.code], distance }
  }).sort((a, b) => a.distance - b.distance)
  let finalType = ranked[0]; if (answers.value['drink_gate_q2'] === 2) finalType = TYPE_LIBRARY.DRUNK
  let imagePath = ''
  if (TYPE_IMAGES[finalType.code]) {
    imagePath = new URL(`../../assets/game_pictures/sbti/${TYPE_IMAGES[finalType.code]}`, import.meta.url).href
  }
  result.value = { finalType, rawScores, levels, image: imagePath, indexCode: Math.random().toString(36).substr(2, 6).toUpperCase() }
  gameState.value = 'RESULT'
}

const restartGame = () => gameState.value = 'INTRO'
const goToGames = () => router.push('/games')
const getQuestionDim = (q: any) => q.special ? t('pages.games.sBTIGame.hiddenDimension') : (dimensionMeta[q.dim]?.name || t('pages.games.sBTIGame.psychologicalDimension'))
</script>

<style scoped lang="scss">
/* --- 1. 基础布局：实现移动端垂直居中 --- */
.yuemu-sbti-codex-universe {
  min-height: 100dvh;
  background-color: #2c2c2c;
  display: flex;
  flex-direction: column;
  padding: 40px 20px;
  transition: 0.5s;
  overflow-x: hidden;
}

.zen-environment {
  position: fixed; inset: 0; pointer-events: none; opacity: 0.1;
  background-image: url('https://www.transparenttextures.com/patterns/dark-leather.png');
}

.book-container { width: 100%; max-width: 850px; z-index: 1; perspective: 1500px; margin: auto; }

.drop-cap {
  font-family: var(--font-family-base); font-size: 3.2em; float: left;
  line-height: 0.8; margin: 0.1em 0.1em 0 0; color: var(--edit-box-kraft-text);
}

/* --- 2. 封面质感（完全保留原样） --- */
.hardcover-view {
  display: flex; border-radius: 4px 12px 12px 4px;
  background-color: #4a3228;
  box-shadow: 40px 40px 80px rgba(0,0,0,0.6);
  transition: 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; min-height: 580px;
  @media (prefers-color-scheme: dark) { background-color: #1e1a18; }
  .book-spine { width: 50px; background: #3a261e; border-right: 2px solid rgba(0,0,0,0.4); box-shadow: inset -5px 0 15px rgba(0,0,0,0.3); }
  .book-cover-plate {
    flex: 1; position: relative; padding: 25px;
    background-image: url('https://www.transparenttextures.com/patterns/fabric-of-the-forces.png');
    .corner { width: 40px; height: 40px; position: absolute; border: 2px solid #c5a368; opacity: 0.5; }
    .top-left { top: 20px; left: 20px; border-right: none; border-bottom: none; }
    .top-right { top: 20px; right: 20px; border-left: none; border-bottom: none; }
    .bottom-left { bottom: 20px; left: 20px; border-right: none; border-top: none; }
    .bottom-right { bottom: 20px; right: 20px; border-left: none; border-top: none; }
  }
  .cover-gold-lining { border: 1px solid #c5a368; padding: 70px 40px; text-align: center; height: 100%; background: rgba(0,0,0,0.02); }
  .archival-id { font-size: 11px; color: #c5a368; letter-spacing: 2px; margin-bottom: 30px; opacity: 0.8; }
  .main-title { font-size: 48px; color: #f5f0e8; line-height: 1.2; font-weight: 900; margin-bottom: 20px; word-wrap: break-word; overflow-wrap: break-word; }
  .small-caps { font-size: 13px; color: #c5a368; letter-spacing: 4px; }
  .script-font { font-family: var(--font-family-base); color: #f5f0e8; font-size: 42px; margin-top: 10px; display: block; }
  .author-label { color: #f5f0e8; opacity: 0.5; margin-bottom: 60px; font-size: 14px; }
}

.physical-seal {
  background: #9c1c1c; color: white; border: 2px dashed rgba(255,255,255,0.3);
  width: 110px; height: 110px; border-radius: 50%; font-weight: 900; cursor: pointer;
  transform: rotate(-8deg); box-shadow: 0 4px 15px rgba(0,0,0,0.5); transition: 0.3s;
  animation: seal-breath 3s infinite ease-in-out;
}
@keyframes seal-breath { 0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 25px #9c1c1c77; } }
.book-pages-stack { width: 14px; background: #e8d9c4; border-left: 2px solid rgba(0,0,0,0.4); }

/* --- 3. 翻开后的书页视图 --- */
.opened-book-view {
  background-color: #4a3228; padding: 4px; border-radius: 8px;
  box-shadow: 20px 20px 60px rgba(0,0,0,0.4);
  .inner-paper {
    background-color: var(--edit-box-kraft-bg);
    color: var(--edit-box-kraft-text);
    padding: 50px; min-height: 620px; position: relative; display: flex; flex-direction: column;
    @media (prefers-color-scheme: dark) { background-color: var(--edit-box-kraft-bg-dark); color: var(--edit-box-kraft-text-dark); }
  }
  .gutter-shadow { position: absolute; left: 0; top: 0; bottom: 0; width: 50px; background: linear-gradient(to right, rgba(0,0,0,0.12), transparent); }
}

/* 重点优化：长文本局部滚动 */
.question-canvas { flex: 1; position: relative; overflow: hidden; }
.mobile-optimized-scroll {
  @media (max-width: 600px) {
    overflow-y: auto; max-height: 55vh; padding-right: 5px;
    &::-webkit-scrollbar { width: 3px; }
    &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
  }
}

.progress-indicator { margin-bottom: 50px; .progress-text { font-weight: 900; font-size: 13px; opacity: 0.5; margin-bottom: 12px; } .ink-line { height: 1px; background: var(--edit-box-kraft-border); .ink-fill { height: 2px; background: var(--edit-box-kraft-text); transition: width 0.6s ease; } } }
.entry-text { font-size: 26px; font-weight: 800; line-height: 1.5; margin-bottom: 45px; clear: both; }
.ledger-row {
  display: flex; align-items: center; gap: 15px; padding: 16px 25px; border: 1px solid var(--edit-box-kraft-border);
  cursor: pointer; transition: 0.2s; margin-bottom: 12px; background: rgba(0,0,0,0.01);
  &:hover { background: rgba(0,0,0,0.03); transform: translateX(8px); }
  &.active { background: var(--edit-box-kraft-text); color: var(--edit-box-kraft-bg); border-color: var(--edit-box-kraft-text); .ink-box { background: var(--edit-box-kraft-bg); border-color: var(--edit-box-kraft-bg); } }
  .ink-box { width: 12px; height: 12px; border: 2px solid var(--edit-box-kraft-text); border-radius: 50%; }
  .opt-content { font-size: 17px; font-weight: bold; }
}

.book-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 30px; .leaf-btn { background: none; border: none; font-weight: 900; font-size: 14px; color: var(--edit-box-kraft-text); cursor: pointer; opacity: 0.4; transition: 0.3s; &:hover { opacity: 1; } &:disabled { opacity: 0.1; } } .seal-submit-btn { background: transparent; color: #9c1c1c; border: 2px solid #9c1c1c; padding: 10px 25px; font-weight: 900; cursor: pointer; transition: 0.4s; &.ready { background: #9c1c1c; color: white; box-shadow: 0 4px 15px rgba(156,28,28,0.3); } &:disabled { opacity: 0.2; } } }

/* --- 4. 报告结果页 (严格保持设计原样) --- */
.report-scroll-view {
  background: var(--edit-box-kraft-bg); padding: 15px; box-shadow: 0 10px 50px rgba(0,0,0,0.3);
  @media (prefers-color-scheme: dark) { background: var(--edit-box-kraft-bg-dark); }
  .scroll-border { border: 2px solid var(--edit-box-kraft-text); padding: 50px 40px; position: relative; }
  .stamp-confidential { position: absolute; top: 15px; right: 15px; border: 3px solid #9c1c1c; color: #9c1c1c; padding: 5px 15px; font-weight: 900; transform: rotate(15deg); font-size: 14px; }
  .report-header { text-align: center; margin-bottom: 50px; .title { font-size: 42px; font-weight: 900; margin-top: 10px; } }
  .result-hero { display: flex; gap: 40px; align-items: center; margin-bottom: 50px; }
  .portrait-frame { padding: 6px; background: white; border: 1px solid #ddd; position: relative; .portrait-img { width: 180px; height: 180px; object-fit: cover; filter: sepia(0.3); } .wax-seal-mini { position: absolute; bottom: -10px; right: -10px; background: #9c1c1c; color: white; padding: 4px 8px; font-size: 10px; font-weight: 900; transform: rotate(5deg); } }
  .type-id { flex: 1; .code { font-size: 70px; font-weight: 900; line-height: 1; margin: 0; } .cn { font-size: 32px; opacity: 0.7; } .intro { font-style: italic; font-size: 18px; margin-top: 15px; } }
  .analysis-box { background: rgba(0,0,0,0.02); padding: 25px; border-left: 4px solid var(--edit-box-kraft-text); margin-bottom: 40px; .desc-text { line-height: 1.9; font-size: 17px; } }
  .ledger-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px 40px; }
  .ledger-item { display: flex; align-items: center; gap: 10px; .name { width: 85px; font-size: 13px; font-weight: 700; } .gauge { flex: 1; height: 1px; background: var(--edit-box-kraft-border); .fill { height: 2px; background: var(--edit-box-kraft-text); } } .val { font-weight: 900; font-size: 12px; } }
  .report-actions { display: flex; gap: 15px; margin-top: 50px; .action-btn { flex: 1; padding: 18px; font-family: inherit; font-weight: 900; cursor: pointer; transition: 0.3s; &.hollow { background: transparent; border: 2px solid var(--edit-box-kraft-text); } &.solid { background: var(--edit-box-kraft-text); color: var(--edit-box-kraft-bg); } } }
}

/* --- 5. 动画系统 --- */
.book-transform-enter-active, .book-transform-leave-active { transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.book-transform-enter-from { opacity: 0; transform: rotateY(30deg); }
.book-transform-leave-to { opacity: 0; transform: rotateY(-30deg); }
.entry-fade-enter-active, .entry-fade-leave-active { transition: all 0.35s ease; }
.entry-fade-enter-from { opacity: 0; transform: translateY(10px); filter: blur(2px); }
.entry-fade-leave-to { opacity: 0; transform: translateY(-10px); filter: blur(2px); }

/* --- 6. 移动端专项 Media Query（仅修改问卷内部对齐，封面与结果页仅做单列适配） --- */
@media (max-width: 600px) {
  .yuemu-sbti-codex-universe { padding: 10px; }

  /* 问卷阶段专用优化 */
  .opened-book-view .inner-paper {
    padding: 25px 15px; /* 压缩问卷左右和上下边距 */
    min-height: 520px;
    max-height: 90vh; /* 锁定整页高度触发内部滚动 */
  }

  .entry-text { font-size: 20px; line-height: 1.4; margin-bottom: 25px; }
  .ledger-row { padding: 12px 15px; margin-bottom: 8px; }
  .drop-cap { font-size: 2.2em; }
  .book-footer { padding-top: 15px; }

  /* 封面与结果页适配：仅处理单列布局，不改变质感文字 */
  .hardcover-view { 
    min-height: 80vh; 
    flex-direction: column; 
    .book-spine { width: 100%; height: 25px; border-right: none; } 
    .cover-gold-lining { padding: 30px 15px; } /* 减少封面的上下留白以适配小屏幕，防止溢出 */
  }
  .author-label { margin-bottom: 25px; }
  .main-title { font-size: 28px !important; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; margin-bottom: 15px; }
  .archival-id { margin-bottom: 15px; }
  .report-scroll-view .ledger-grid { grid-template-columns: 1fr; }
  .report-scroll-view .result-hero { flex-direction: column; text-align: center; }
}
</style>
