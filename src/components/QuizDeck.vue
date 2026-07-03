<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuizStore } from '../stores/quiz'
import QuizCard from './QuizCard.vue'

const store = useQuizStore()
const isLearnMode = computed(() => store.pageMode === 'learn')
const autoAdvanceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const currentQ = computed(() => store.activeQuestion)
const currentA = computed(() => store.currentAnswer)

// ========== 滑动切换 ==========
const touchStartX = ref(0)
const touchStartY = ref(0)
const dragX = ref(0)
const isDragging = ref(false)
const isSwiping = ref(false)
const swipeThreshold = 80

function onTouchStart(e: TouchEvent) {
  if (isSwiping.value) return
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  dragX.value = 0
  isDragging.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  const dx = e.touches[0].clientX - touchStartX.value
  const dy = e.touches[0].clientY - touchStartY.value
  if (Math.abs(dx) > Math.abs(dy)) {
    e.preventDefault()
    if ((dx > 0 && !store.canGoPrev()) || (dx < 0 && !store.canGoNext())) return
    dragX.value = dx
  }
}

function onTouchEnd(e: TouchEvent) {
  if (!isDragging.value) return
  isDragging.value = false

  const dx = e.changedTouches[0].clientX - touchStartX.value
  const dy = e.changedTouches[0].clientY - touchStartY.value
  if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < swipeThreshold) {
    isSwiping.value = true
    dragX.value = 0
    setTimeout(() => { isSwiping.value = false }, 250)
    return
  }

  isSwiping.value = true
  const dir = dx > 0 ? 1 : -1
  dragX.value = dir * (window.innerWidth * 1.2)

  setTimeout(() => {
    if (dx > 0) goPrev()
    else goNext()
    dragX.value = 0
    isSwiping.value = false
  }, 200)
}

function cardStyle() {
  const t = isSwiping.value ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : 'none'
  const abs = Math.abs(dragX.value)
  return {
    transform: `translateX(${dragX.value}px)`,
    opacity: abs > 0 ? 1 - Math.min(abs / 400, 0.5) : 1,
    transition: t,
  }
}

// ========== 事件处理 ==========
function handleAnswerSingle(label: string) {
  if (store.isCurrentAnswered) return
  const result = store.submitSingleAnswer(label)
  if (!result) return
  if (result.correct) {
    autoAdvanceTimer.value = setTimeout(() => {
      if (store.canGoNext()) goNext()
    }, 800)
  }
}

function handleAnswerMulti(labels: string[]) {
  if (store.isCurrentAnswered) return
  const result = store.submitMultiAnswer(labels)
  if (!result) return
  if (result.correct) {
    autoAdvanceTimer.value = setTimeout(() => {
      if (store.canGoNext()) goNext()
    }, 800)
  }
}

function goPrev() { if (store.canGoPrev()) store.goPrev() }
function goNext() { if (store.canGoNext()) store.goNext() }

// ========== 网格弹窗 ==========
const showGrid = ref(false)
const gridPage = ref(0)
const PAGE_SIZE = 50
const gridTotalPages = computed(() => Math.ceil(store.activeTotal / PAGE_SIZE))
const gridQuestions = computed(() => {
  const start = gridPage.value * PAGE_SIZE
  return Array.from({ length: Math.min(PAGE_SIZE, store.activeTotal - start) }, (_, i) => start + i)
})

function openGrid() { gridPage.value = Math.floor(store.currentIndex / PAGE_SIZE); showGrid.value = true }
function jumpTo(index: number) { showGrid.value = false; store.goToIndex(index) }

function getQuestionDisplayId(idx: number): number {
  if (store.reviewMode !== 'all') {
    const seq = store.reviewSequence
    if (idx >= 0 && idx < seq.length) {
      const realIdx = seq[idx]
      return store.questions[realIdx]?.id ?? -1
    }
    return -1
  }
  const realIdx = store.mode === 'random' && store.shuffledIds.length > 0 ? store.shuffledIds[idx] : idx
  return store.questions[realIdx]?.id ?? -1
}

function gridPrevPage() { if (gridPage.value > 0) gridPage.value-- }
function gridNextPage() { if (gridPage.value < gridTotalPages.value - 1) gridPage.value++ }

function onKeydown(e: KeyboardEvent) {
  if (showGrid.value) return
  if (e.key === 'ArrowLeft') goPrev()
  else if (e.key === 'ArrowRight') goNext()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (autoAdvanceTimer.value) clearTimeout(autoAdvanceTimer.value)
})
</script>

<template>
  <div class="deck-container">
    <div class="card-stage" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
      <div v-if="currentQ" class="card-wrap" :style="cardStyle()">
        <QuizCard
          :key="store.currentIndex"
          :question="currentQ"
          :answer="currentA"
          :revealed="true"
          :learn-mode="isLearnMode"
          @answer-single="handleAnswerSingle"
          @answer-multi="handleAnswerMulti"
        />
      </div>
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无题目</p>
        <p class="empty-hint">切换复习模式或重置题库</p>
      </div>
    </div>

    <div class="deck-nav">
      <button class="nav-btn" :class="{ disabled: !store.canGoPrev() }" @click="goPrev">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="nav-index" @click="openGrid">{{ store.currentIndex + 1 }} / {{ store.activeTotal }}</span>
      <button class="nav-btn" :class="{ disabled: !store.canGoNext() }" @click="goNext">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="showGrid" class="grid-overlay" @click.self="showGrid = false">
        <div class="grid-panel">
          <div class="grid-header">
            <span class="grid-title">题目索引</span>
            <button class="grid-close" @click="showGrid = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="grid-body">
            <button v-for="idx in gridQuestions" :key="idx" class="grid-cell"
              :class="{
                current: idx === store.currentIndex,
                answered: store.answers[getQuestionDisplayId(idx)]?.correct,
                wrong: store.answers[getQuestionDisplayId(idx)] && !store.answers[getQuestionDisplayId(idx)]?.correct
              }" @click="jumpTo(idx)">{{ idx + 1 }}</button>
          </div>
          <div class="grid-footer" v-if="gridTotalPages > 1">
            <button :disabled="gridPage === 0" @click="gridPrevPage">上一页</button>
            <span>{{ gridPage + 1 }} / {{ gridTotalPages }}</span>
            <button :disabled="gridPage >= gridTotalPages - 1" @click="gridNextPage">下一页</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.deck-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.card-stage {
  flex: 1;
  width: 100%;
  overflow: hidden;
  touch-action: pan-y;
  position: relative;
}

.card-wrap {
  height: 100%;
  padding: 4px 12px 8px;
  display: flex;
  align-items: stretch;
  will-change: transform, opacity;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.empty-hint {
  font-size: 12px !important;
  font-weight: 400 !important;
  margin-top: 4px !important;
  color: var(--color-text-muted);
}

.deck-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 20px 16px;
  flex-shrink: 0;
}

.nav-btn {
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.15s;
}

@media (hover: hover) {
  .nav-btn:hover:not(.disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }
}

.nav-btn.disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.nav-index {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 700;
  min-width: 70px;
  text-align: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: all 0.15s;
}

@media (hover: hover) {
  .nav-index:hover {
    background: var(--color-primary-bg);
  }
}

/* 网格弹窗 */
.grid-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.grid-panel {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 440px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.grid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  flex-shrink: 0;
}

.grid-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
}

.grid-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-body {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
  padding: 0 20px 16px;
  overflow-y: auto;
  flex: 1;
}

.grid-cell {
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s;
}

.grid-cell:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.grid-cell.current {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(99,102,241,0.3);
}

.grid-cell.answered {
  border-color: #a7f3d0;
  background: var(--color-success-bg);
  color: var(--color-success);
}

.grid-cell.answered.current {
  background: var(--color-primary);
  color: #fff;
}

.grid-cell.wrong {
  border-color: #fecaca;
  background: var(--color-error-bg);
  color: var(--color-error);
}

.grid-cell.wrong.current {
  background: var(--color-primary);
  color: #fff;
}

.grid-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-muted);
}

.grid-footer button {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.grid-footer button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
