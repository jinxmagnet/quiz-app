<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Question, AnswerRecord } from '../types'
import { useQuizStore } from '../stores/quiz'

const store = useQuizStore()

const props = defineProps<{
  question: Question
  answer: AnswerRecord | null
  revealed: boolean
  learnMode: boolean
}>()

const emit = defineEmits<{
  (e: 'answer-single', label: string): void
  (e: 'answer-multi', labels: string[]): void
}>()

const selectedMulti = ref<string[]>([])

watch(() => props.question.id, () => { selectedMulti.value = [] })

const isMulti = computed(() => props.question.type === 'multi')
const isAnswered = computed(() => props.answer !== null)
const bookmarked = computed(() => store.isBookmarked(props.question.id))

function getOptionClass(label: string) {
  const correctAnswer = props.question.answer

  if (props.learnMode) {
    return correctAnswer.includes(label) ? 'opt-correct' : ''
  }

  if (!isAnswered.value) {
    return isMulti.value && selectedMulti.value.includes(label) ? 'opt-selected' : ''
  }

  const ans = props.answer!
  if (ans.correct) {
    return ans.selected.includes(label) ? 'opt-correct' : ''
  }
  if (correctAnswer.includes(label)) return 'opt-correct'
  if (ans.selected.includes(label)) return 'opt-wrong'
  return ''
}

function handleOptionClick(label: string) {
  if (props.learnMode || isAnswered.value) return
  if (isMulti.value) {
    const idx = selectedMulti.value.indexOf(label)
    idx >= 0 ? selectedMulti.value.splice(idx, 1) : selectedMulti.value.push(label)
  } else {
    emit('answer-single', label)
  }
}

function submitMulti() {
  if (selectedMulti.value.length > 0 && !isAnswered.value) {
    emit('answer-multi', [...selectedMulti.value])
  }
}

function onBookmark() {
  store.toggleBookmark(props.question.id)
}
</script>

<template>
  <div class="quiz-card" :class="{ 'is-learn': learnMode }">
    <!-- 题号 + 标签 + 收藏 -->
    <div class="card-top">
      <span class="q-num">#{{ question.id }}</span>
      <span class="q-type" :class="isMulti ? 'type-multi' : 'type-single'">
        {{ isMulti ? '多选' : '单选' }}
      </span>
      <span class="q-section">{{ question.section }}</span>
      <button class="bookmark-btn" :class="{ active: bookmarked }" @click="onBookmark" :aria-label="bookmarked ? '取消收藏' : '收藏'">
        <svg width="16" height="16" viewBox="0 0 24 24" :fill="bookmarked ? '#f59e0b' : 'none'" :stroke="bookmarked ? '#f59e0b' : '#94a3b8'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
    </div>

    <!-- 题目 -->
    <div class="q-text">{{ question.question }}</div>

    <!-- 选项 -->
    <div class="options">
      <button
        v-for="(opt, idx) in question.options"
        :key="question.optionLabels[idx]"
        class="opt"
        :class="getOptionClass(question.optionLabels[idx])"
        :disabled="learnMode || (isAnswered && !revealed)"
        @click="handleOptionClick(question.optionLabels[idx])"
      >
        <span class="opt-letter" :class="getOptionClass(question.optionLabels[idx])">{{ question.optionLabels[idx] }}</span>
        <span class="opt-text">{{ opt }}</span>
        <span v-if="getOptionClass(question.optionLabels[idx]) === 'opt-correct'" class="opt-mark">✓</span>
        <span v-if="getOptionClass(question.optionLabels[idx]) === 'opt-wrong'" class="opt-mark wrong">✗</span>
      </button>
    </div>

    <!-- 多选题确定按钮 -->
    <button v-if="isMulti && !learnMode && !isAnswered && selectedMulti.length > 0"
      class="btn-submit-multi" @click="submitMulti">
      确定提交（{{ selectedMulti.length }} 项）
    </button>

    <!-- 答题结果 -->
    <div v-if="!learnMode && isAnswered" class="result" :class="props.answer?.correct ? 'res-ok' : 'res-err'">
      <template v-if="props.answer?.correct">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>正确</span>
      </template>
      <template v-else>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span>错误 · 正确答案 <strong>{{ question.answer }}</strong></span>
      </template>
    </div>

    <!-- 学习模式提示 -->
    <div v-if="learnMode" class="result res-learn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span>答案：<strong>{{ question.answer }}</strong></span>
    </div>
  </div>
</template>

<style scoped>
.quiz-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 20px 20px 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;
  overflow-y: auto;
}

.is-learn {
  border-color: #d1fae5;
}

/* 顶部 */
.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.q-num {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 600;
}

.q-type {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 600;
}

.type-single { background: var(--color-primary-bg); color: var(--color-primary); }
.type-multi  { background: var(--color-warning-bg); color: var(--color-warning); }

.q-section {
  flex: 1;
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.bookmark-btn:active {
  transform: scale(0.9);
}

@media (hover: hover) {
  .bookmark-btn:hover {
    background: var(--color-warning-bg);
  }
}

/* 题目文本 */
.q-text {
  font-size: 16px;
  line-height: 1.75;
  color: var(--color-text);
  font-weight: 500;
  margin-bottom: 20px;
  flex-shrink: 0;
}

/* 选项 */
.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #f8fafc;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  color: var(--color-text);
  transition: all 0.15s ease;
}

@media (hover: hover) {
  .opt:hover:not(:disabled) {
    border-color: var(--color-primary-light);
    background: var(--color-primary-bg);
  }
}

.opt:active:not(:disabled) {
  transform: scale(0.99);
}

.opt:disabled {
  cursor: default;
}

.opt-letter {
  font-weight: 700;
  font-size: 14px;
  color: var(--color-text-muted);
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-border);
}

.opt-selected {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}
.opt-selected .opt-letter {
  background: var(--color-primary);
  color: #fff;
}

.opt-correct {
  border-color: var(--color-success);
  background: var(--color-success-bg);
}
.opt-correct .opt-letter {
  background: var(--color-success);
  color: #fff;
}

.opt-wrong {
  border-color: var(--color-error);
  background: var(--color-error-bg);
}
.opt-wrong .opt-letter {
  background: var(--color-error);
  color: #fff;
}

.opt-text { flex: 1; }

.opt-mark {
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.opt-correct .opt-mark { color: var(--color-success); }
.opt-wrong .opt-mark { color: var(--color-error); }

/* 结果提示 */
.result {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.res-ok {
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid #d1fae5;
}

.res-err {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid #fecaca;
}

.res-err strong {
  color: var(--color-success);
}

.res-learn {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border: 1px solid #c7d2fe;
}

.res-learn strong {
  color: var(--color-text);
}

/* 多选题提交按钮 */
.btn-submit-multi {
  margin-top: 14px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

@media (hover: hover) {
  .btn-submit-multi:hover {
    background: #4f46e5;
  }
}
</style>
