<script setup lang="ts">
import { useQuizStore } from '../stores/quiz'

const store = useQuizStore()

function retryOne(qid: number) {
  store.retryQuestion(qid)
}
</script>

<template>
  <div class="wrong-list-wrap">
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
          <button class="btn-retry-one" @click="retryOne(q.id)">重答</button>
        </div>
      </div>
    </template>

    <!-- 底部再来一次 -->
    <button
      v-if="store.wrongQuestionsList.length > 0"
      class="btn-restart"
      @click="store.reset()"
    >再来一次</button>
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
}

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
  justify-content: space-between;
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

.btn-retry-one {
  padding: 5px 16px;
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-error);
  border: 1.5px solid var(--color-error);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
}

@media (hover: hover) {
  .btn-retry-one:hover {
    background: var(--color-error-bg);
  }
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
