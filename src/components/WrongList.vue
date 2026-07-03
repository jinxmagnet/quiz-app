<script setup lang="ts">
import { useQuizStore } from '../stores/quiz'
import QuizCard from './QuizCard.vue'

const store = useQuizStore()

function handleRetrySingle(label: string) {
  store.submitWrongRetrySingle(label)
}

function handleRetryMulti(labels: string[]) {
  store.submitWrongRetryMulti(labels)
}

function currentWrongAnswer() {
  const q = store.wrongRetryQuestion
  if (!q) return null
  return store.answers[q.id] ?? null
}
</script>

<template>
  <div class="wrong-list-wrap">
    <!-- 重答卡片模式 -->
    <template v-if="store.wrongRetrying">
      <div v-if="store.wrongRetryQuestion" class="retry-card">
        <div class="retry-progress">
          重答进度 {{ store.wrongRetryIndex + 1 }} / {{ store.wrongRetrySequence.length + store.wrongRetryDone.size }}
        </div>
        <QuizCard
          :key="store.wrongRetryQuestion.id"
          :question="store.wrongRetryQuestion"
          :answer="currentWrongAnswer()"
          :revealed="true"
          :learn-mode="false"
          @answer-single="handleRetrySingle"
          @answer-multi="handleRetryMulti"
        />
      </div>
      <div v-else class="empty-state">
        <span class="empty-icon">🎉</span>
        <p>错题已全部答对！</p>
        <button class="btn-restart" @click="store.resetWrongRetry()">返回错题列表</button>
      </div>
    </template>

    <!-- 列表模式 -->
    <template v-else>
      <div v-if="store.wrongQuestionsList.length === 0" class="empty-state">
        <span class="empty-icon">🎉</span>
        <p>暂无错题</p>
      </div>

      <template v-else>
        <div v-for="q in store.wrongQuestionsList" :key="q.id" class="wrong-item">
          <div class="wrong-q">
            <span class="wid">#{{ q.id }}</span>
            {{ q.question }}
          </div>
          <div class="wrong-actions">
            <span class="wans">正确答案：<strong>{{ q.answer }}</strong></span>
          </div>
        </div>
      </template>

      <button
        v-if="store.wrongQuestionsList.length > 0"
        class="btn-restart"
        @click="store.startWrongRetry()"
      >重新答题</button>
    </template>
  </div>
</template>

<style scoped>
.wrong-list-wrap {
  width: 100%;
  max-width: 480px;
  padding: 8px 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

/* 重答卡片 */
.retry-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 6px;
}

.retry-progress {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 0 4px;
}

.retry-card :deep(.quiz-card) {
  height: auto;
  flex: 1;
}

/* 空状态 */
.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  padding: 40px 20px;
}

.empty-icon { font-size: 44px; display: block; margin-bottom: 8px; }
.empty-state p { font-size: 15px; font-weight: 600; }

/* 单条错题 */
.wrong-item {
  background: var(--color-surface);
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.wrong-q {
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-text);
  margin-bottom: 8px;
}

.wid {
  font-weight: 700;
  color: var(--color-error);
  margin-right: 4px;
  font-size: 13px;
}

.wrong-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.wans {
  font-size: 13px;
  color: var(--color-text-muted);
}

.wans strong {
  color: var(--color-success);
  font-weight: 700;
}

.btn-restart {
  align-self: center;
  padding: 11px 36px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 4px;
}

@media (hover: hover) {
  .btn-restart:hover {
    background: #4f46e5;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
}
</style>
