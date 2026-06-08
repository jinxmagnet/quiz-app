<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuizStore } from '../stores/quiz'
import QuizCard from './QuizCard.vue'

const store = useQuizStore()
const isLearnMode = computed(() => store.pageMode === 'learn')
const autoAdvanceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// 当前卡片直接取 store 数据
const currentQ = computed(() => store.currentQuestion)
const currentA = computed(() => store.currentAnswer)

// ========== 滑动切换 ==========
const touchStartX = ref(0)
const touchStartY = ref(0)
const dragX = ref(0)
const isDragging = ref(false)
const isSwiping = ref(false) // 松手后正在动画过渡
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
  // 水平滑动为主时才跟随
  if (Math.abs(dx) > Math.abs(dy)) {
    e.preventDefault()
    // 边界限制：第一题不能左滑（即不能向右看上一题），最后一题不能右滑
    if ((dx > 0 && store.currentIndex <= 0) || (dx < 0 && store.currentIndex >= store.totalQuestions - 1)) return
    dragX.value = dx
  }
}

function onTouchEnd(e: TouchEvent) {
  if (!isDragging.value) return
  isDragging.value = false

  const dx = e.changedTouches[0].clientX - touchStartX.value
  const dy = e.changedTouches[0].clientY - touchStartY.value
  if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < swipeThreshold) {
    // 未达标：弹回原位
    isSwiping.value = true
    dragX.value = 0
    setTimeout(() => { isSwiping.value = false }, 250)
    return
  }

  // 达标：滑出屏幕
  isSwiping.value = true
  const dir = dx > 0 ? 1 : -1
  dragX.value = dir * (window.innerWidth * 1.2) // 滑出视口

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
      if (store.currentIndex < store.totalQuestions - 1) goNext()
    }, 800)
  }
}

function handleAnswerMulti(labels: string[]) {
  if (store.isCurrentAnswered) return
  const result = store.submitMultiAnswer(labels)
  if (!result) return
  if (result.correct) {
    autoAdvanceTimer.value = setTimeout(() => {
      if (store.currentIndex < store.totalQuestions - 1) goNext()
    }, 800)
  }
}

function goPrev() { if (store.currentIndex > 0) store.goPrev() }
function goNext() { if (store.currentIndex < store.totalQuestions - 1) store.goNext() }

// ========== 网格弹窗 ==========
const showGrid = ref(false)
const gridPage = ref(0)
const PAGE_SIZE = 50
const gridTotalPages = computed(() => Math.ceil(store.totalQuestions / PAGE_SIZE))
const gridQuestions = computed(() => {
  const start = gridPage.value * PAGE_SIZE
  return Array.from({ length: Math.min(PAGE_SIZE, store.totalQuestions - start) }, (_, i) => start + i)
})

function openGrid() { gridPage.value = Math.floor(store.currentIndex / PAGE_SIZE); showGrid.value = true }
function jumpTo(index: number) { showGrid.value = false; store.goToIndex(index) }

function getQuestionDisplayId(idx: number): number {
  const realIdx = store.mode === 'random' && store.shuffledIds.length > 0 ? store.shuffledIds[idx] : idx
  return store.questions[realIdx]?.id ?? -1
}
function gridPrevPage() { if (gridPage.value > 0) gridPage.value-- }
function gridNextPage() { if (gridPage.value < gridTotalPages.value - 1) gridPage.value++ }

function onKeydown(e: KeyboardEvent) {
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
    </div>

    <div class="deck-nav">
      <button class="nav-arrow" :class="{ disabled: store.currentIndex === 0 }" @click="goPrev">‹</button>
      <span class="nav-index" @click="openGrid">{{ store.currentIndex + 1 }} / {{ store.totalQuestions }}</span>
      <button class="nav-arrow" :class="{ disabled: store.currentIndex >= store.totalQuestions - 1 }" @click="goNext">›</button>
    </div>

    <Teleport to="body">
      <div v-if="showGrid" class="grid-overlay" @click.self="showGrid = false">
        <div class="grid-panel">
          <div class="grid-header">
            <span class="grid-title">选择题目</span>
            <button class="grid-close" @click="showGrid = false">✕</button>
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
            <button :disabled="gridPage === 0" @click="gridPrevPage">‹ 上一页</button>
            <span>{{ gridPage + 1 }} / {{ gridTotalPages }}</span>
            <button :disabled="gridPage >= gridTotalPages - 1" @click="gridNextPage">下一页 ›</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.deck-container { display: flex; flex-direction: column; flex: 1; width: 100%; min-height: 0; overflow: hidden; }
.card-stage { flex: 1; width: 100%; overflow: hidden; touch-action: pan-y; position: relative; }
.card-wrap { height: 100%; padding: 8px 8px 12px; display: flex; align-items: stretch; will-change: transform, opacity; }
.deck-nav { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 10px 20px 16px; flex-shrink: 0; }
.nav-arrow { width: 40px; height: 40px; border: 1.5px solid #e0e0e0; border-radius: 50%; background: #fff; font-size: 22px; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0; flex-shrink: 0; }
.nav-arrow:hover:not(.disabled) { border-color: #4a6cf7; color: #4a6cf7; background: #f5f7ff; }
.nav-arrow.disabled { opacity: 0.25; cursor: not-allowed; }
.nav-index { font-size: 14px; color: #4a6cf7; font-weight: 600; min-width: 70px; text-align: center; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.nav-index:hover { background: #eef2ff; }
.grid-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
.grid-panel { background: #fff; border-radius: 16px; width: 100%; max-width: 480px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.15); }
.grid-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; flex-shrink: 0; }
.grid-title { font-size: 16px; font-weight: 600; color: #1a1a2e; }
.grid-close { width: 32px; height: 32px; border: none; border-radius: 50%; background: #f0f0f0; font-size: 14px; color: #888; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.grid-close:hover { background: #e0e0e0; }
.grid-body { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; padding: 0 20px 16px; overflow-y: auto; flex: 1; }
.grid-cell { aspect-ratio: 1; border: 1.5px solid #eee; border-radius: 8px; background: #fafafa; font-size: 12px; font-weight: 500; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; }
.grid-cell:hover { border-color: #4a6cf7; background: #f5f7ff; }
.grid-cell.current { border-color: #4a6cf7; background: #4a6cf7; color: #fff; font-weight: 700; }
.grid-cell.answered { border-color: #b7eb8f; background: #f6ffed; color: #52c41a; }
.grid-cell.answered.current { background: #4a6cf7; color: #fff; }
.grid-cell.wrong { border-color: #ffa39e; background: #fff2f0; color: #ff4d4f; }
.grid-cell.wrong.current { background: #4a6cf7; color: #fff; }
.grid-footer { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 12px 20px 16px; border-top: 1px solid #f0f0f0; font-size: 13px; color: #999; }
.grid-footer button { padding: 6px 14px; border: 1.5px solid #e0e0e0; border-radius: 8px; background: #fff; font-size: 13px; color: #666; cursor: pointer; }
.grid-footer button:hover:not(:disabled) { border-color: #4a6cf7; color: #4a6cf7; }
.grid-footer button:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
