<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import QuizHeader from '../components/QuizHeader.vue'
import QuizDeck from '../components/QuizDeck.vue'
import QuizResult from '../components/QuizResult.vue'

const router = useRouter()
const store = useQuizStore()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="quiz-page">
    <!-- 顶部按钮栏 -->
    <div class="top-bar">
      <div class="page-mode-toggle">
        <button class="page-mode-btn" :class="{ active: store.pageMode === 'exam' }" @click="store.setPageMode('exam')">答题</button>
        <button class="page-mode-btn" :class="{ active: store.pageMode === 'learn' }" @click="store.setPageMode('learn')">学习</button>
      </div>
      <div class="quiz-mode-toggle">
        <button class="quiz-mode-btn" :class="{ active: store.mode === 'sequential' }" @click="store.setMode('sequential')">顺序</button>
        <button class="quiz-mode-btn" :class="{ active: store.mode === 'random' }" @click="store.setMode('random')">随机</button>
      </div>
      <button class="reset-btn" @click="store.reset()">重置</button>
    </div>

    <!-- 进度条 + 题库名 -->
    <QuizHeader />

    <!-- 主内容 -->
    <main class="main-content">
      <QuizDeck v-if="store.pageMode === 'exam' && !store.isFinished" />
      <QuizDeck v-else-if="store.pageMode === 'learn'" />
      <QuizResult v-else />
    </main>
  </div>
</template>

<style scoped>
.quiz-page {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  flex-shrink: 0;
}

.page-mode-toggle,
.quiz-mode-toggle {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.page-mode-btn,
.quiz-mode-btn {
  padding: 5px 12px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
}

.page-mode-btn.active { background: #4a6cf7; color: #fff; }
.quiz-mode-btn.active { background: #6d5df7; color: #fff; }

.reset-btn {
  padding: 5px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}

.reset-btn:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
  background: #fff2f0;
}

/* 主内容 */
.main-content {
  width: 100%;
  display: flex;
  justify-content: center;
  flex: 1;
  min-height: 0;
}
</style>
