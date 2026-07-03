<script setup lang="ts">
import { computed } from 'vue'
import { useQuizStore } from '../stores/quiz'

const store = useQuizStore()

const accuracy = computed(() => {
  if (store.answeredCount === 0) return 0
  return Math.round((store.correctCount / store.answeredCount) * 100)
})

const wrongQuestions = computed(() => {
  return Object.entries(store.answers)
    .filter(([_, r]) => !r.correct)
    .map(([qid]) => store.questions.find(q => q.id === Number(qid)))
    .filter(Boolean)
})
</script>

<template>
  <div class="result-wrap">
    <div class="result-card">
      <div class="res-icon">
        <svg v-if="accuracy >= 90" width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
          <text x="32" y="40" text-anchor="middle" font-size="28">🏆</text>
        </svg>
        <svg v-else-if="accuracy >= 60" width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#d1fae5" stroke="#10b981" stroke-width="3"/>
          <path d="M20 34l8 8 16-16" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#eef2ff" stroke="#6366f1" stroke-width="3"/>
          <text x="32" y="40" text-anchor="middle" font-size="28">📚</text>
        </svg>
      </div>

      <h2 class="res-title">答题完成</h2>

      <div class="stats">
        <div class="stat">
          <span class="val">{{ store.totalQuestions }}</span>
          <span class="lbl">总题</span>
        </div>
        <div class="stat">
          <span class="val" style="color: var(--color-success)">{{ store.correctCount }}</span>
          <span class="lbl">正确</span>
        </div>
        <div class="stat">
          <span class="val" style="color: var(--color-error)">{{ store.answeredCount - store.correctCount }}</span>
          <span class="lbl">错误</span>
        </div>
        <div class="stat">
          <span class="val" :style="{ color: accuracy >= 60 ? 'var(--color-success)' : 'var(--color-error)' }">{{ accuracy }}%</span>
          <span class="lbl">正确率</span>
        </div>
      </div>

      <div v-if="wrongQuestions.length" class="wrong-list">
        <h3>错题回顾 ({{ wrongQuestions.length }})</h3>
        <div v-for="q in wrongQuestions" :key="q!.id" class="wrong-item">
          <div class="wrong-q">
            <span class="wid">#{{ q!.id }}</span>
            {{ q!.question }}
          </div>
          <div class="wrong-actions">
            <span class="wans">正确答案：<strong>{{ q!.answer }}</strong></span>
            <button class="btn-single-retry" @click="store.retryQuestion(q!.id)">重答</button>
          </div>
        </div>
      </div>

      <div v-else class="perfect">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>全部正确，太棒了！</span>
      </div>

      <button class="btn-restart" @click="store.reset()">再来一次</button>
    </div>
  </div>
</template>

<style scoped>
.result-wrap {
  width: 100%;
  max-width: 480px;
  padding: 8px 12px 24px;
}

.result-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 32px 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  text-align: center;
  overflow-y: auto;
  max-height: 100%;
}

.res-icon {
  margin-bottom: 8px;
}

.res-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 24px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: #f8fafc;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.val {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.lbl {
  font-size: 11px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.wrong-list {
  text-align: left;
  margin-bottom: 24px;
}

.wrong-list h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-error);
  margin: 0 0 10px;
}

.wrong-item {
  background: var(--color-error-bg);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.wid {
  font-weight: 700;
  color: var(--color-error);
  margin-right: 4px;
}

.wrong-q {
  margin-bottom: 6px;
}

.wans {
  font-size: 12px;
  color: var(--color-text-muted);
}

.wans strong {
  color: var(--color-success);
}

.perfect {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  margin-bottom: 24px;
  background: var(--color-success-bg);
  border: 1px solid #d1fae5;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-success);
}

.btn-restart {
  padding: 12px 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

@media (hover: hover) {
  .btn-restart:hover {
    background: #4f46e5;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
}

.wrong-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  gap: 8px;
}

.btn-single-retry {
  padding: 4px 14px;
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-error);
  border: 1px solid var(--color-error);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s;
}

@media (hover: hover) {
  .btn-single-retry:hover {
    background: var(--color-error-bg);
  }
}
</style>
