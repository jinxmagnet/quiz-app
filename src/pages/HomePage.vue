<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'

const router = useRouter()
const store = useQuizStore()

function enterQuiz(bankName: string) {
  store.selectBank(bankName)
  router.push('/quiz')
}

function getProgress(bankName: string) {
  const storageKey = `quiz-progress-${bankName}-answers`
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const answers = JSON.parse(raw)
    const keys = Object.keys(answers)
    if (keys.length === 0) return null
    const correct = Object.values(answers as Record<string, { correct: boolean }>).filter((a: { correct: boolean }) => a.correct).length
    return { answered: keys.length, correct }
  } catch { return null }
}
</script>

<template>
  <div class="home">
    <div class="hero">
      <div class="logo">📝</div>
      <h1>刷题练习</h1>
      <p>选择题库开始备考</p>
    </div>

    <div class="banks">
      <button
        v-for="bank in store.questionBanks"
        :key="bank.name"
        class="bank-card"
        @click="enterQuiz(bank.name)"
      >
        <div class="bank-icon">
          <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
            <rect width="40" height="40" rx="12" fill="#eef2ff"/>
            <path d="M12 14h16M12 20h16M12 26h10" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="bank-body">
          <div class="bank-name">{{ bank.label }}</div>
          <div class="bank-meta">
            <span>{{ bank.questions.length }} 题</span>
            <span class="dot">·</span>
            <span>单选 {{ bank.questions.filter(q => q.type === 'single').length }}</span>
            <span class="dot">·</span>
            <span>多选 {{ bank.questions.filter(q => q.type === 'multi').length }}</span>
          </div>
          <div v-if="getProgress(bank.name)" class="bank-progress">
            <div class="mini-bar">
              <div class="mini-fill" :style="{ width: (getProgress(bank.name)!.answered / bank.questions.length * 100) + '%' }"></div>
            </div>
            <span class="mini-text">已答 {{ getProgress(bank.name)!.answered }}/{{ bank.questions.length }} · 正确 {{ getProgress(bank.name)!.correct }}</span>
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
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 20px 32px;
  overflow-y: auto;
}

.hero {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  font-size: 44px;
  margin-bottom: 8px;
}

.hero h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.hero p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

.banks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 440px;
}

.bank-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  box-shadow: var(--shadow-sm);
}

.bank-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
}

@media (hover: hover) {
  .bank-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 20px rgba(99,102,241,0.1);
    transform: translateY(-1px);
  }
}

.bank-icon { flex-shrink: 0; }

.bank-body { flex: 1; min-width: 0; }

.bank-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
  line-height: 1.3;
}

.bank-meta {
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot { color: var(--color-border); }

.bank-progress {
  margin-top: 8px;
}

.mini-bar {
  height: 3px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.mini-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width 0.5s ease;
}

.mini-text {
  font-size: 11px;
  color: var(--color-text-muted);
}

.bank-arr {
  font-size: 20px;
  color: var(--color-border);
  flex-shrink: 0;
  transition: all 0.2s;
}

@media (hover: hover) {
  .bank-card:hover .bank-arr {
    transform: translateX(2px);
    color: var(--color-primary);
  }
}

.footer {
  margin-top: 28px;
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
