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
      <div class="res-icon">{{ accuracy >= 90 ? '🏆' : accuracy >= 60 ? '👍' : '📚' }}</div>
      <h2 class="res-title">答题完成</h2>

      <div class="stats">
        <div class="stat"><span class="val">{{ store.totalQuestions }}</span><span class="lbl">总题</span></div>
        <div class="stat"><span class="val green">{{ store.correctCount }}</span><span class="lbl">正确</span></div>
        <div class="stat"><span class="val red">{{ store.answeredCount - store.correctCount }}</span><span class="lbl">错误</span></div>
        <div class="stat"><span class="val" :class="accuracy >= 60 ? 'green' : 'red'">{{ accuracy }}%</span><span class="lbl">正确率</span></div>
      </div>

      <div v-if="wrongQuestions.length" class="wrong-list">
        <h3>错题 ({{ wrongQuestions.length }})</h3>
        <div v-for="q in wrongQuestions" :key="q!.id" class="wrong-item">
          <span class="wid">#{{ q!.id }}</span> {{ q!.question }}
          <div class="wans">答案：<strong>{{ q!.answer }}</strong></div>
        </div>
      </div>

      <button class="btn-restart" @click="store.reset()">再来一次</button>
    </div>
  </div>
</template>

<style scoped>
.result-wrap {
  width: 100%;
  max-width: 480px;
}

.result-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  text-align: center;
}

.res-icon { font-size: 48px; margin-bottom: 4px; }
.res-title { font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 20px; }

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 6px;
  background: #f8f9fc;
  border-radius: 8px;
}

.val { font-size: 20px; font-weight: 700; color: #333; }
.val.green { color: #52c41a; }
.val.red { color: #ff4d4f; }
.lbl { font-size: 11px; color: #999; }

.wrong-list {
  text-align: left;
  margin-bottom: 20px;
}

.wrong-list h3 {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d4f;
  margin: 0 0 10px;
}

.wrong-item {
  background: #fff2f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

.wid { font-weight: 700; color: #ff4d4f; margin-right: 4px; }
.wans { margin-top: 4px; font-size: 12px; color: #888; }
.wans strong { color: #52c41a; }

.btn-restart {
  padding: 10px 32px;
  border: none;
  border-radius: 20px;
  background: #4a6cf7;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-restart:hover { background: #3d5ce5; }
</style>
