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
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="goHome" aria-label="返回首页">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div class="top-center">
        <!-- 答题/学习切换 -->
        <div class="segmented">
          <button
            class="seg-btn"
            :class="{ active: store.pageMode === 'exam' }"
            @click="store.setPageMode('exam')"
          >答题</button>
          <button
            class="seg-btn"
            :class="{ active: store.pageMode === 'learn' }"
            @click="store.setPageMode('learn')"
          >学习</button>
        </div>
      </div>

      <button class="reset-btn" @click="store.reset()">重置</button>
    </div>

    <!-- 第二行：刷题模式 + 复习筛选 -->
    <div class="sub-bar">
      <div class="segmented sm">
        <button
          class="seg-btn"
          :class="{ active: store.mode === 'sequential' }"
          @click="store.setMode('sequential')"
        >顺序</button>
        <button
          class="seg-btn"
          :class="{ active: store.mode === 'random' }"
          @click="store.setMode('random')"
        >随机</button>
      </div>

      <div class="segmented sm review">
        <button
          class="seg-btn"
          :class="{ active: store.reviewMode === 'all' }"
          @click="store.setReviewMode('all')"
        >全部</button>
        <button
          class="seg-btn"
          :class="{ active: store.reviewMode === 'wrong' }"
          @click="store.setReviewMode('wrong')"
        >
          错题
          <span v-if="store.wrongCount > 0" class="badge">{{ store.wrongCount }}</span>
        </button>
        <button
          class="seg-btn"
          :class="{ active: store.reviewMode === 'bookmarked' }"
          @click="store.setReviewMode('bookmarked')"
        >收藏</button>
      </div>
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
  background: var(--color-bg);
}

/* 顶部导航栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  flex-shrink: 0;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: all 0.15s;
  flex-shrink: 0;
}

@media (hover: hover) {
  .back-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }
}

.top-center {
  display: flex;
  align-items: center;
}

/* 分段控制器 */
.segmented {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  padding: 2px;
}

.segmented.sm {
  border-radius: 8px;
}

.seg-btn {
  padding: 5px 14px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
  white-space: nowrap;
  position: relative;
}

.segmented.sm .seg-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
}

.seg-btn.active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99,102,241,0.3);
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: rgba(255,255,255,0.25);
  font-size: 10px;
  font-weight: 700;
  margin-left: 3px;
}

.reset-btn {
  padding: 5px 14px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

@media (hover: hover) {
  .reset-btn:hover {
    border-color: var(--color-error);
    color: var(--color-error);
    background: var(--color-error-bg);
  }
}

/* 第二行 */
.sub-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px 12px 8px;
  flex-shrink: 0;
}

.review {
  gap: 0;
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
