<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { useQuizStore } from '../stores/quiz'
import QuizCard from './QuizCard.vue'
import type { Question, AnswerRecord } from '../types'

const store = useQuizStore()
const isLearnMode = computed(() => store.pageMode === 'learn')

// ========== 双卡片预渲染 ==========
const slotA = shallowRef<{ q: Question; idx: number; answer: AnswerRecord | null } | null>(null)
const slotB = shallowRef<{ q: Question; idx: number; answer: AnswerRecord | null } | null>(null)
const activeSlot = ref<'A' | 'B'>('A')
const isAnimating = ref(false)
const animDirection = ref<'left' | 'right' | null>(null) // 'left'=下一题, 'right'=上一题

// inactive slot 当前预取的方向（'left'=右侧预取下一题, 'right'=左侧预取上一题）
const prefetchDir = ref<'left' | 'right'>('left')

function getActiveSlot() { return activeSlot.value === 'A' ? slotA : slotB }
function getInactiveSlot() { return activeSlot.value === 'A' ? slotB : slotA }

function getQuestionAtIndex(idx: number): Question | null {
  const realIdx = store.mode === 'random' && store.shuffledIds.length > 0
    ? store.shuffledIds[idx]
    : idx
  return store.questions[realIdx] ?? null
}

function fillSlot(slot: typeof slotA, idx: number) {
  const q = getQuestionAtIndex(idx)
  if (!q) return
  const answer = store.answers[q.id] ?? null
  slot.value = { q, idx, answer }
}

// 初始化：slotA=题1, slotB=题2(右侧)
function initSlots() {
  if (store.totalQuestions === 0) return
  fillSlot(slotA, store.currentIndex)
  if (store.currentIndex < store.totalQuestions - 1) {
    fillSlot(slotB, store.currentIndex + 1)
    prefetchDir.value = 'left'
  }
}

// 首次挂载时初始化（确保 store 数据已就绪）
onMounted(() => { initSlots() })

// 监听题库数据就绪后初始化
watch(() => store.totalQuestions, (total) => {
  if (total > 0 && !slotA.value) {
    initSlots()
  }
}, { immediate: true })

initSlots()

// 预填 inactive slot
function fillInactiveForDirection(dir: 'left' | 'right') {
  const inactive = getInactiveSlot()
  const idx = dir === 'left' ? store.currentIndex + 1 : store.currentIndex - 1
  if (idx >= 0 && idx < store.totalQuestions) {
    fillSlot(inactive, idx)
    prefetchDir.value = dir
  }
}

// ========== 卡片样式 ==========
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const dragOffset = ref(0)
const autoAdvanceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function slotStyle(slotName: 'A' | 'B') {
  const isActive = activeSlot.value === slotName
  const dir = animDirection.value

  // 拖拽
  if (isDragging.value && isActive) {
    return {
      transform: `translateX(${dragOffset.value}px)`,
      opacity: 1 - Math.abs(dragOffset.value / 400),
      transition: 'none',
      zIndex: 2,
    }
  }

  // inactive 非动画态位置
  const inactiveBase = prefetchDir.value === 'left' ? 'translateX(100%)' : 'translateX(-100%)'

  const transition = isAnimating.value
    ? 'transform 0.2s ease-out, opacity 0.2s ease-out'
    : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'

  if (isActive && isAnimating.value) {
    const outX = dir === 'left' ? '-100%' : '100%'
    return { transform: `translateX(${outX})`, opacity: 0, transition, zIndex: 2 }
  }

  if (!isActive && isAnimating.value) {
    return { transform: 'translateX(0)', opacity: 1, transition, zIndex: 1 }
  }

  return {
    transform: isActive ? 'translateX(0)' : inactiveBase,
    opacity: isActive ? 1 : 0,
    transition: isActive ? transition : 'none',
    zIndex: isActive ? 2 : 1,
  }
}

// ========== 事件处理 ==========
function getClientX(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientX
  return (e as MouseEvent).clientX
}
function getClientY(e: MouseEvent | TouchEvent): number {
  if ('touches' in e) return e.touches[0].clientY
  return (e as MouseEvent).clientY
}

function onStart(e: MouseEvent | TouchEvent) {
  if (isAnimating.value) return
  isDragging.value = true
  startX.value = getClientX(e)
  startY.value = getClientY(e)
  dragOffset.value = 0
}

function onMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  const dx = getClientX(e) - startX.value
  const dy = getClientY(e) - startY.value
  if (Math.abs(dx) > Math.abs(dy) || Math.abs(dx) > 10) {
    e.preventDefault?.()
    dragOffset.value = dx
  }
}

function onEnd() {
  if (!isDragging.value) return
  isDragging.value = false

  const threshold = 60
  if (dragOffset.value < -threshold && store.currentIndex < store.totalQuestions - 1) {
    switchCard('left', store.goNext)
  } else if (dragOffset.value > threshold && store.currentIndex > 0) {
    switchCard('right', store.goPrev)
  } else {
    dragOffset.value = 0
  }
}

function switchCard(direction: 'left' | 'right', action: () => void) {
  animDirection.value = direction
  isAnimating.value = true

  // 如果 inactive 预取方向与切换方向不一致，重新填充
  if (prefetchDir.value !== direction) {
    fillInactiveForDirection(direction)
  }

  setTimeout(() => {
    action()
    activeSlot.value = activeSlot.value === 'A' ? 'B' : 'A'
    isAnimating.value = false
    animDirection.value = null
    dragOffset.value = 0

    // 动画结束后默认预取下一题放右侧
    const inactive = getInactiveSlot()
    const nextIdx = store.currentIndex + 1
    if (nextIdx < store.totalQuestions) {
      fillSlot(inactive, nextIdx)
      prefetchDir.value = 'left'
    } else {
      const prevIdx = store.currentIndex - 1
      if (prevIdx >= 0) {
        fillSlot(inactive, prevIdx)
        prefetchDir.value = 'right'
      }
    }
  }, 200)
}

function handleAnswerSingle(label: string) {
  if (store.isCurrentAnswered) return
  const result = store.submitSingleAnswer(label)
  if (!result) return
  // 立即刷新当前 active slot 的 answer，使 QuizCard 显示结果
  const active = getActiveSlot()
  if (active.value) {
    active.value = { ...active.value, answer: store.currentAnswer }
  }
  if (result.correct) {
    autoAdvanceTimer.value = setTimeout(() => {
      if (store.currentIndex < store.totalQuestions - 1) switchCard('left', store.goNext)
    }, 800)
  }
}

function handleAnswerMulti(labels: string[]) {
  if (store.isCurrentAnswered) return
  const result = store.submitMultiAnswer(labels)
  if (!result) return
  // 立即刷新当前 active slot 的 answer，使 QuizCard 显示结果
  const active = getActiveSlot()
  if (active.value) {
    active.value = { ...active.value, answer: store.currentAnswer }
  }
  if (result.correct) {
    autoAdvanceTimer.value = setTimeout(() => {
      if (store.currentIndex < store.totalQuestions - 1) switchCard('left', store.goNext)
    }, 800)
  }
}

function handleNavPrev() {
  if (store.currentIndex <= 0 || isAnimating.value) return
  switchCard('right', store.goPrev)
}
function handleNavNext() {
  if (store.currentIndex >= store.totalQuestions - 1 || isAnimating.value) return
  switchCard('left', store.goNext)
}

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

function jumpTo(index: number) {
  showGrid.value = false
  fillSlot(slotA, index)
  activeSlot.value = 'A'
  const next = index + 1
  if (next < store.totalQuestions) { fillSlot(slotB, next); prefetchDir.value = 'left' }
  else { slotB.value = null; prefetchDir.value = 'right' }
  store.goToIndex(index)
}

function getQuestionDisplayId(idx: number): number {
  const realIdx = store.mode === 'random' && store.shuffledIds.length > 0 ? store.shuffledIds[idx] : idx
  return store.questions[realIdx]?.id ?? -1
}

function gridPrevPage() { if (gridPage.value > 0) gridPage.value-- }
function gridNextPage() { if (gridPage.value < gridTotalPages.value - 1) gridPage.value++ }

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') handleNavPrev()
  else if (e.key === 'ArrowRight') handleNavNext()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (autoAdvanceTimer.value) clearTimeout(autoAdvanceTimer.value)
})
</script>

<template>
  <div class="deck-container">
    <div
      class="card-stage"
      @mousedown="onStart" @mousemove="onMove" @mouseup="onEnd" @mouseleave="onEnd"
      @touchstart="onStart" @touchmove="onMove" @touchend="onEnd"
    >
      <div v-if="slotA" class="card-wrap" :style="slotStyle('A')">
        <QuizCard :question="slotA.q" :answer="slotA.answer" :revealed="true" :learn-mode="isLearnMode"
          @answer-single="handleAnswerSingle" @answer-multi="handleAnswerMulti" />
      </div>
      <div v-if="slotB" class="card-wrap" :style="slotStyle('B')">
        <QuizCard :question="slotB.q" :answer="slotB.answer" :revealed="true" :learn-mode="isLearnMode"
          @answer-single="handleAnswerSingle" @answer-multi="handleAnswerMulti" />
      </div>
    </div>

    <div class="deck-nav">
      <button class="nav-arrow" :class="{ disabled: store.currentIndex === 0 }" @click="handleNavPrev">‹</button>
      <span class="nav-index" @click="openGrid">{{ store.currentIndex + 1 }} / {{ store.totalQuestions }}</span>
      <button class="nav-arrow" :class="{ disabled: store.currentIndex >= store.totalQuestions - 1 }" @click="handleNavNext">›</button>
    </div>

    <Teleport to="body">
      <Transition name="fade">
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
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.deck-container { display: flex; flex-direction: column; flex: 1; width: 100%; min-height: 0; overflow: hidden; }
.card-stage { flex: 1; width: 100%; overflow: hidden; position: relative; cursor: grab; touch-action: pan-y; }
.card-stage:active { cursor: grabbing; }
.card-wrap { position: absolute; inset: 0; padding: 8px 8px 12px; display: flex; align-items: stretch; will-change: transform, opacity; pointer-events: auto; }
.deck-nav { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 10px 20px 16px; flex-shrink: 0; }
.nav-arrow { width: 40px; height: 40px; border: 1.5px solid #e0e0e0; border-radius: 50%; background: #fff; font-size: 22px; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; line-height: 1; padding: 0; flex-shrink: 0; }
.nav-arrow:hover:not(.disabled) { border-color: #4a6cf7; color: #4a6cf7; background: #f5f7ff; }
.nav-arrow.disabled { opacity: 0.25; cursor: not-allowed; }
.nav-index { font-size: 14px; color: #4a6cf7; font-weight: 600; min-width: 70px; text-align: center; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.15s; }
.nav-index:hover { background: #eef2ff; }
.nav-index:active { background: #dde4ff; }
.grid-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
.grid-panel { background: #fff; border-radius: 16px; width: 100%; max-width: 480px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.15); }
.grid-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; flex-shrink: 0; }
.grid-title { font-size: 16px; font-weight: 600; color: #1a1a2e; }
.grid-close { width: 32px; height: 32px; border: none; border-radius: 50%; background: #f0f0f0; font-size: 14px; color: #888; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.grid-close:hover { background: #e0e0e0; }
.grid-body { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; padding: 0 20px 16px; overflow-y: auto; flex: 1; }
.grid-cell { aspect-ratio: 1; border: 1.5px solid #eee; border-radius: 8px; background: #fafafa; font-size: 12px; font-weight: 500; color: #666; cursor: pointer; transition: all 0.12s; display: flex; align-items: center; justify-content: center; padding: 0; }
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
