<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Question, AnswerRecord } from '../types'

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

function getOptionClass(label: string) {
  const correctAnswer = props.question.answer

  if (props.learnMode) {
    return correctAnswer.includes(label) ? 'opt-correct' : 'opt-dim'
  }

  if (!isAnswered.value) {
    return isMulti.value && selectedMulti.value.includes(label) ? 'opt-selected' : ''
  }

  const ans = props.answer!
  if (ans.correct) {
    return ans.selected.includes(label) ? 'opt-correct' : 'opt-dim'
  }
  if (correctAnswer.includes(label)) return 'opt-correct'
  if (ans.selected.includes(label)) return 'opt-wrong'
  return 'opt-dim'
}

function handleOptionClick(label: string) {
  if (props.learnMode || isAnswered.value) return
  if (isMulti.value) {
    // 多选题：点击切换选中状态
    const idx = selectedMulti.value.indexOf(label)
    idx >= 0 ? selectedMulti.value.splice(idx, 1) : selectedMulti.value.push(label)
  } else {
    // 单选题：点击直接提交
    emit('answer-single', label)
  }
}

// 多选题：点击确定按钮提交
function submitMulti() {
  if (selectedMulti.value.length > 0 && !isAnswered.value) {
    emit('answer-multi', [...selectedMulti.value])
  }
}
</script>

<template>
  <div class="quiz-card" :class="{ 'is-learn': learnMode }">
    <!-- 题号 + 类型 -->
    <div class="card-top">
      <span class="q-num">{{ question.id }}</span>
      <span class="q-type" :class="isMulti ? 'type-multi' : 'type-single'">
        {{ isMulti ? '多选' : '单选' }}
      </span>
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
        <span class="opt-letter">{{ question.optionLabels[idx] }}</span>
        <span class="opt-text">{{ opt }}</span>
        <span v-if="learnMode && question.answer.includes(question.optionLabels[idx])" class="opt-mark">✓</span>
        <span v-if="!learnMode && isAnswered && props.answer?.correct && props.answer.selected.includes(question.optionLabels[idx])" class="opt-mark">✓</span>
        <span v-if="!learnMode && isAnswered && !props.answer?.correct && question.answer.includes(question.optionLabels[idx])" class="opt-mark">✓</span>
        <span v-if="!learnMode && isAnswered && !props.answer?.correct && props.answer.selected.includes(question.optionLabels[idx]) && !question.answer.includes(question.optionLabels[idx])" class="opt-mark wrong">✗</span>
      </button>
    </div>

    <!-- 多选题确定按钮 -->
    <button v-if="isMulti && !learnMode && !isAnswered && selectedMulti.length > 0"
      class="btn-submit-multi" @click="submitMulti">
      确定提交（{{ selectedMulti.length }} 项）
    </button>

    <!-- 结果 -->
    <div v-if="!learnMode && isAnswered" class="result" :class="props.answer?.correct ? 'res-ok' : 'res-err'">
      {{ props.answer?.correct ? '✓ 正确' : `✗ 错误 · 答案 ${question.answer}` }}
    </div>

    <!-- 学习模式提示 -->
    <div v-if="learnMode" class="result res-ok">
      📖 答案：{{ question.answer }}
    </div>
  </div>
</template>

<style scoped>
.quiz-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px 20px 24px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;
  border: 1.5px solid #eee;
  overflow-y: auto;
}

.is-learn {
  border-color: #e8f5e9;
}

/* 顶部 */
.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.q-num {
  font-size: 13px;
  color: #bbb;
  font-weight: 600;
}

.q-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.type-single { background: #eef2ff; color: #4a6cf7; }
.type-multi  { background: #fff7e6; color: #fa8c16; }

/* 题目文本 */
.q-text {
  font-size: 16px;
  line-height: 1.7;
  color: #1a1a2e;
  font-weight: 500;
  margin-bottom: 18px;
}

/* 选项 */
.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1.5px solid #eee;
  border-radius: 10px;
  background: #fafafa;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  color: #333;
  transition: all 0.15s;
}

.opt:hover:not(:disabled) {
  border-color: #4a6cf7;
  background: #f5f7ff;
}

.opt:active:not(:disabled) { transform: scale(0.99); }

.opt-letter {
  font-weight: 700;
  font-size: 14px;
  color: #4a6cf7;
  min-width: 20px;
}

.opt-text { flex: 1; }

.opt-mark {
  font-size: 16px;
  font-weight: 700;
  color: #52c41a;
}
.opt-mark.wrong { color: #ff4d4f; }

.opt-selected { border-color: #4a6cf7; background: #eef2ff; }
.opt-correct  { border-color: #b7eb8f; background: #f6ffed; }
.opt-wrong    { border-color: #ffa39e; background: #fff2f0; }
.opt-dim      { opacity: 0.4; }

/* 结果提示 */
.result {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.res-ok { background: #f6ffed; color: #52c41a; }
.res-err { background: #fff2f0; color: #ff4d4f; }

/* 多选题提交按钮 */
.btn-submit-multi {
  margin-top: 12px;
  padding: 11px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4a6cf7, #6b8cff);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-submit-multi:hover { opacity: 0.88; }
.btn-submit-multi:active { transform: scale(0.98); }
</style>
