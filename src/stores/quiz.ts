import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Question, AnswerRecord, QuizMode, PageMode } from '../types'
import questionsData from '../data/questions.json'

const STORAGE_PREFIX = 'quiz-progress'

function getStorageKey(bank: string, field: string) {
  return `${STORAGE_PREFIX}-${bank}-${field}`
}

function saveToStorage(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* quota exceeded */ }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw != null) return JSON.parse(raw) as T
  } catch { /* parse error */ }
  return fallback
}

function clearStorageForBank(bank: string) {
  ;['answers', 'index', 'mode', 'pageMode', 'shuffledIds'].forEach((field) => {
    try { localStorage.removeItem(getStorageKey(bank, field)) } catch { /* */ }
  })
}

export const useQuizStore = defineStore('quiz', () => {
  // ========== 题库相关 ==========
  const questionBanks = ref<{ name: string; label: string; questions: Question[] }[]>([
    {
      name: 'safety-a',
      label: '安全员A证（建筑施工企业主要负责人）',
      questions: questionsData as Question[],
    },
  ])
  const currentBankName = ref('safety-a')

  const currentBank = computed(() =>
    questionBanks.value.find((b) => b.name === currentBankName.value)
  )

  const questions = computed(() => currentBank.value?.questions ?? [])

  // ========== 刷题模式（顺序/随机） ==========
  const mode = ref<QuizMode>('sequential')

  // ========== 页面模式（答题/学习） ==========
  const pageMode = ref<PageMode>('exam')

  // 随机模式下的打乱索引
  const shuffledIds = ref<number[]>([])

  function shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  function regenerateShuffledIds() {
    shuffledIds.value = shuffleArray(questions.value.map((_, i) => i))
  }

  // 当前题目在题库中的实际索引
  const currentIndex = ref(loadFromStorage<number>(getStorageKey('safety-a', 'index'), 0))

  // 获取当前题目的实际索引（顺序模式用 currentIndex，随机模式用 shuffledIds[currentIndex]）
  const currentQuestionIndex = computed(() => {
    if (mode.value === 'random' && shuffledIds.value.length > 0) {
      return shuffledIds.value[currentIndex.value]
    }
    return currentIndex.value
  })

  const currentQuestion = computed(() => {
    const idx = currentQuestionIndex.value
    if (idx >= 0 && idx < questions.value.length) {
      return questions.value[idx]
    }
    return null
  })

  const totalQuestions = computed(() => questions.value.length)

  // ========== 答题记录 ==========
  const answers = ref<Record<number, AnswerRecord>>(
    loadFromStorage<Record<number, AnswerRecord>>(getStorageKey('safety-a', 'answers'), {})
  )

  // 已答题数
  const answeredCount = computed(() => Object.keys(answers.value).length)

  // 正确数
  const correctCount = computed(
    () => Object.values(answers.value).filter((a) => a.correct).length
  )

  // 是否全部完成
  const isFinished = computed(() => answeredCount.value >= totalQuestions.value)

  // 当前题是否已答
  const isCurrentAnswered = computed(() => {
    const q = currentQuestion.value
    if (!q) return false
    return answers.value[q.id] !== undefined
  })

  // 当前题答题记录
  const currentAnswer = computed(() => {
    const q = currentQuestion.value
    if (!q) return null
    return answers.value[q.id] ?? null
  })

  // ========== 动作 ==========

  /** 切换题库 */
  function selectBank(name: string) {
    currentBankName.value = name
    currentIndex.value = 0
    answers.value = {}
    if (mode.value === 'random') {
      regenerateShuffledIds()
    }
  }

  /** 切换页面模式（答题/学习） */
  function setPageMode(newPageMode: PageMode) {
    pageMode.value = newPageMode
    currentIndex.value = 0
    answers.value = {}
    if (mode.value === 'random') {
      regenerateShuffledIds()
    }
  }

  /** 切换刷题模式 */
  function setMode(newMode: QuizMode) {
    if (mode.value === newMode) return
    mode.value = newMode
    currentIndex.value = 0
    answers.value = {}
    if (newMode === 'random') {
      regenerateShuffledIds()
    }
  }

  /** 提交单选题答案 */
  function submitSingleAnswer(selectedLabel: string) {
    const q = currentQuestion.value
    if (!q) return null

    const correct = selectedLabel === q.answer

    answers.value = {
      ...answers.value,
      [q.id]: {
        selected: [selectedLabel],
        correct,
      },
    }

    return { correct, correctAnswer: q.answer }
  }

  /** 提交多选题答案 */
  function submitMultiAnswer(selectedLabels: string[]) {
    const q = currentQuestion.value
    if (!q) return null

    // 判断：选中的选项集合是否与正确答案完全一致
    const correctAnswerSet = new Set(q.answer.split(''))
    const selectedSet = new Set(selectedLabels)
    const correct =
      correctAnswerSet.size === selectedSet.size &&
      [...correctAnswerSet].every((l) => selectedSet.has(l))

    answers.value = {
      ...answers.value,
      [q.id]: {
        selected: selectedLabels,
        correct,
      },
    }

    return { correct, correctAnswer: q.answer }
  }

  /** 去下一题 */
  function goNext() {
    if (currentIndex.value < totalQuestions.value - 1) {
      currentIndex.value++
    }
  }

  /** 去上一题 */
  function goPrev() {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  /** 跳到指定索引 */
  function goToIndex(index: number) {
    if (index >= 0 && index < totalQuestions.value) {
      currentIndex.value = index
    }
  }

  /** 重置当前题库 */
  function reset() {
    currentIndex.value = 0
    answers.value = {}
    clearStorageForBank('safety-a')
    if (mode.value === 'random') {
      regenerateShuffledIds()
    }
  }

  // 初始化随机索引
  regenerateShuffledIds()

  // ========== LocalStorage 自动保存 ==========
  watch(answers, (val) => {
    saveToStorage(getStorageKey('safety-a', 'answers'), val)
  }, { deep: true })

  watch(currentIndex, (val) => {
    saveToStorage(getStorageKey('safety-a', 'index'), val)
  })

  return {
    // state
    questionBanks,
    currentBankName,
    currentBank,
    questions,
    mode,
    pageMode,
    shuffledIds,
    currentIndex,
    answers,
    // computed
    currentQuestionIndex,
    currentQuestion,
    totalQuestions,
    answeredCount,
    correctCount,
    isFinished,
    isCurrentAnswered,
    currentAnswer,
    // actions
    selectBank,
    setMode,
    setPageMode,
    submitSingleAnswer,
    submitMultiAnswer,
    goNext,
    goPrev,
    goToIndex,
    reset,
  }
})
