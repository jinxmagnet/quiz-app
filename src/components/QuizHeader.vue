<script setup lang="ts">
import { computed } from 'vue'
import { useQuizStore } from '../stores/quiz'

const store = useQuizStore()

const progressPercent = computed(() => {
  if (store.reviewMode !== 'all') {
    return store.reviewTotal > 0 ? (store.currentIndex / store.reviewTotal) * 100 : 0
  }
  return store.activeTotal > 0 ? (store.answeredCount / store.activeTotal) * 100 : 0
})
</script>

<template>
  <div class="quiz-header">
    <div class="header-info">
      <span class="bank-label">{{ store.currentBank?.label ?? '' }}</span>
      <div class="stats-row">
        <span class="stat-item">
          {{ store.currentIndex + 1 }} / {{ store.activeTotal }}
        </span>
        <span v-if="store.answeredCount > 0" class="stat-divider">·</span>
        <span v-if="store.answeredCount > 0" class="stat-item correct">
          正确 {{ store.correctCount }}/{{ store.answeredCount }}
        </span>
        <span v-if="store.wrongCount > 0" class="stat-item wrong">
          · 错误 {{ store.wrongCount }}
        </span>
      </div>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
.quiz-header {
  padding: 0 16px 8px;
  flex-shrink: 0;
}

.header-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.bank-label {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 55%;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.stat-item.correct {
  color: var(--color-success);
}

.stat-item.wrong {
  color: var(--color-error);
}

.stat-divider {
  margin: 0 2px;
  color: var(--color-border);
}

.progress-bar {
  height: 3px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 2px;
  transition: width 0.4s ease;
}
</style>
