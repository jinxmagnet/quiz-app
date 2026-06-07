<script setup lang="ts">
import { useQuizStore } from '../stores/quiz'

const store = useQuizStore()
</script>

<template>
  <div class="quiz-header">
    <!-- 题库名称 -->
    <span class="bank-label">{{ store.currentBank?.label ?? '' }}</span>

    <!-- 进度条 -->
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: store.totalQuestions > 0 ? (store.answeredCount / store.totalQuestions) * 100 + '%' : '0%' }"
      ></div>
    </div>

    <!-- 统计 -->
    <span class="stats-text">
      {{ store.currentIndex + 1 }} / {{ store.totalQuestions }}
      <template v-if="store.answeredCount > 0">
        · 正确 {{ store.correctCount }}/{{ store.answeredCount }}
      </template>
    </span>
  </div>
</template>

<style scoped>
.quiz-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 0 16px;
  margin-bottom: 4px;
}

.bank-label {
  font-size: 12px;
  color: #aaa;
  white-space: nowrap;
  font-weight: 500;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
  min-width: 60px;
}

.progress-fill {
  height: 100%;
  background: #4a6cf7;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.stats-text {
  font-size: 12px;
  color: #bbb;
  white-space: nowrap;
}
</style>
