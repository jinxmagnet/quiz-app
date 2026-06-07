<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const store = useQuizStore()

function enterQuiz(bankName: string) {
  store.selectBank(bankName)
  router.push('/quiz')
}
</script>

<template>
  <div class="home">
    <div class="hero">
      <h1>📝 刷题练习</h1>
      <p>选择题库开始</p>
    </div>

    <div class="banks">
      <button
        v-for="bank in store.questionBanks"
        :key="bank.name"
        class="bank-card"
        @click="enterQuiz(bank.name)"
      >
        <span class="bank-icon">📚</span>
        <div class="bank-body">
          <div class="bank-name">{{ bank.label }}</div>
          <div class="bank-meta">
            <span>{{ bank.questions.length }} 题</span>
            <span class="dot">·</span>
            <span>单选 {{ bank.questions.filter(q => q.type === 'single').length }}</span>
            <span class="dot">·</span>
            <span>多选 {{ bank.questions.filter(q => q.type === 'multi').length }}</span>
          </div>
        </div>
        <span class="bank-arr">→</span>
      </button>
    </div>

    <p class="footer">更多题库即将上线</p>
  </div>
</template>

<style scoped>
.home {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 20px 40px;
}

.hero {
  text-align: center;
  margin-bottom: 36px;
}

.hero h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
}

.hero p {
  font-size: 15px;
  color: #999;
  margin: 0;
}

.banks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 460px;
}

.bank-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border: 1.5px solid #eee;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
}

.bank-card:hover {
  border-color: #4a6cf7;
  box-shadow: 0 4px 16px rgba(74,108,247,0.08);
  transform: translateY(-1px);
}

.bank-icon { font-size: 32px; flex-shrink: 0; }

.bank-body { flex: 1; }

.bank-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.bank-meta {
  font-size: 12px;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot { color: #ddd; }

.bank-arr {
  font-size: 20px;
  color: #ccc;
  flex-shrink: 0;
  transition: all 0.2s;
}

.bank-card:hover .bank-arr {
  transform: translateX(3px);
  color: #4a6cf7;
}

.footer {
  margin-top: 32px;
  font-size: 12px;
  color: #ccc;
}
</style>
