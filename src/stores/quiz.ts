import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Question, AnswerRecord, QuizMode, PageMode, ReviewMode } from '../types'
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
  ;['answers', 'index', 'mode', 'pageMode', 'shuffledIds', 'bookmarks', 'reviewMode'].forEach((field) => {
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
  const mode = ref<QuizMode>(
    loadFromStorage<QuizMode>(getStorageKey('safety-a', 'mode'), 'sequential')
  )

  // ========== 页面模式：答题/学习/错题 ==========
  const pageMode = ref<PageMode>(
    loadFromStorage<PageMode>(getStorageKey('safety-a', 'pageMode'), 'exam') as PageMode
  )

  // ========== 复习筛选：全部 / 收藏 ==========
  const reviewMode = ref<ReviewMode>(
    loadFromStorage<ReviewMode>(getStorageKey('safety-a', 'reviewMode'), 'all')
  )

  // 随机模式下的打乱索引
  const shuffledIds = ref<number[]>(
    loadFromStorage<number[]>(getStorageKey('safety-a', 'shuffledIds'), [])
  )

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

  // ========== 收藏题号 ==========
  const bookmarks = ref<Set<number>>(
    new Set(loadFromStorage<number[]>(getStorageKey('safety-a', 'bookmarks'), []))
  )

  function toggleBookmark(questionId: number) {
    const next = new Set(bookmarks.value)
    next.has(questionId) ? next.delete(questionId) : next.add(questionId)
    bookmarks.value = next
  }

  function isBookmarked(questionId: number): boolean {
    return bookmarks.value.has(questionId)
  }

  // ========== 当前题目索引 ==========
  const currentIndex = ref(loadFromStorage<number>(getStorageKey('safety-a', 'index'), 0))

  // 当前题目在题库中的实际索引
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

  // ========== 复习筛选下的题目序列（仅用于答题/学习模式的全部/收藏筛选）==========
  const reviewSequence = computed(() => {
    const seq = mode.value === 'random' && shuffledIds.value.length > 0
      ? shuffledIds.value
      : questions.value.map((_, i) => i)

    if (reviewMode.value === 'bookmarked') {
      return seq.filter(idx => {
        const q = questions.value[idx]
        if (!q) return false
        return bookmarks.value.has(q.id)
      })
    }
    return seq
  })

  const reviewTotal = computed(() => reviewSequence.value.length)

  // 复习序列中的当前题目
  const reviewCurrentQuestion = computed(() => {
    const seq = reviewSequence.value
    if (currentIndex.value >= 0 && currentIndex.value < seq.length) {
      const realIdx = seq[currentIndex.value]
      return questions.value[realIdx] ?? null
    }
    return null
  })

  // 答题/学习模式下的活跃题目
  const activeQuestion = computed(() => {
    if (reviewMode.value !== 'all') return reviewCurrentQuestion.value
    return currentQuestion.value
  })

  const activeTotal = computed(() => {
    if (reviewMode.value !== 'all') return reviewTotal.value
    return totalQuestions.value
  })

  // ========== 错题列表（错题专用模式）==========
  const wrongQuestionsList = computed(() => {
    return Object.entries(answers.value)
      .filter(([_, r]) => !r.correct)
      .map(([qid]) => questions.value.find(q => q.id === Number(qid)))
      .filter(Boolean) as Question[]
  })

  // 错题重答模式
  const wrongRetrying = ref(false)
  const wrongRetryIndex = ref(0)

  const wrongRetryQuestion = computed(() => {
    const list = wrongQuestionsList.value
    if (wrongRetryIndex.value >= 0 && wrongRetryIndex.value < list.length) {
      return list[wrongRetryIndex.value]
    }
    return null
  })

  function startWrongRetry() {
    if (wrongQuestionsList.value.length === 0) return
    wrongRetryIndex.value = 0
    wrongRetrying.value = true
  }

  function clearWrongAnswers() {
    const next = { ...answers.value }
    for (const [qid, rec] of Object.entries(next)) {
      if (!rec.correct) delete next[Number(qid)]
    }
    answers.value = next
  }

  function resetWrongRetry() {
    wrongRetrying.value = false
    wrongRetryIndex.value = 0
  }

  // 错题重答提交（答对自动移除，答错保留接着下一题）
  function submitWrongRetrySingle(label: string) {
    const q = wrongRetryQuestion.value
    if (!q) return null
    const correct = label === q.answer
    answers.value = {
      ...answers.value,
      [q.id]: { selected: [label], correct },
    }
    // 所有错题都答对了
    if (wrongQuestionsList.value.length === 0) {
      wrongRetrying.value = false
      wrongRetryIndex.value = 0
      return { correct, correctAnswer: q.answer }
    }
    // 答对后索引可能越界（当前是最后一道题被答对），往前移
    if (wrongRetryIndex.value >= wrongQuestionsList.value.length) {
      wrongRetryIndex.value = wrongQuestionsList.value.length - 1
    }
    // 答错则前进下一题
    if (!correct && wrongRetryIndex.value < wrongQuestionsList.value.length - 1) {
      wrongRetryIndex.value++
    }
    return { correct, correctAnswer: q.answer }
  }

  function submitWrongRetryMulti(labels: string[]) {
    const q = wrongRetryQuestion.value
    if (!q) return null
    const correctAnswerSet = new Set(q.answer.split(''))
    const selectedSet = new Set(labels)
    const correct =
      correctAnswerSet.size === selectedSet.size &&
      [...correctAnswerSet].every((l) => selectedSet.has(l))
    answers.value = {
      ...answers.value,
      [q.id]: { selected: labels, correct },
    }
    if (wrongQuestionsList.value.length === 0) {
      wrongRetrying.value = false
      wrongRetryIndex.value = 0
      return { correct, correctAnswer: q.answer }
    }
    if (wrongRetryIndex.value >= wrongQuestionsList.value.length) {
      wrongRetryIndex.value = wrongQuestionsList.value.length - 1
    }
    if (!correct && wrongRetryIndex.value < wrongQuestionsList.value.length - 1) {
      wrongRetryIndex.value++
    }
    return { correct, correctAnswer: q.answer }
  }

  // ========== 答题记录 ==========
  const answers = ref<Record<number, AnswerRecord>>(
    loadFromStorage<Record<number, AnswerRecord>>(getStorageKey('safety-a', 'answers'), {})
  )

  const answeredCount = computed(() => Object.keys(answers.value).length)

  const correctCount = computed(
    () => Object.values(answers.value).filter((a) => a.correct).length
  )

  const wrongCount = computed(() => answeredCount.value - correctCount.value)

  const isFinished = computed(() => {
    // 错题模式不判定完成
    if (pageMode.value === 'wrong') return false
    if (reviewMode.value !== 'all') {
      return currentIndex.value >= reviewTotal.value
    }
    return answeredCount.value >= totalQuestions.value
  })

  const isCurrentAnswered = computed(() => {
    const q = activeQuestion.value
    if (!q) return false
    return answers.value[q.id] !== undefined
  })

  const currentAnswer = computed(() => {
    const q = activeQuestion.value
    if (!q) return null
    return answers.value[q.id] ?? null
  })

  // ========== 动作 ==========

  function selectBank(name: string) {
    if (name === currentBankName.value) return
    currentBankName.value = name
    currentIndex.value = 0
    answers.value = {}
    bookmarks.value = new Set()
    reviewMode.value = 'all'
    pageMode.value = 'exam'
    if (mode.value === 'random') {
      regenerateShuffledIds()
    }
  }

  function setPageMode(newPageMode: PageMode) {
    if (newPageMode === pageMode.value) return
    pageMode.value = newPageMode
    if (newPageMode === 'wrong') {
      currentIndex.value = 0
    }
  }

  function setMode(newMode: QuizMode) {
    if (mode.value === newMode) return
    mode.value = newMode
    currentIndex.value = 0
    answers.value = {}
    bookmarks.value = new Set()
    reviewMode.value = 'all'
    if (newMode === 'random') {
      regenerateShuffledIds()
    } else {
      shuffledIds.value = []
    }
  }

  function setReviewMode(newReviewMode: ReviewMode) {
    if (newReviewMode === reviewMode.value) return
    reviewMode.value = newReviewMode
    currentIndex.value = 0
  }

  function submitSingleAnswer(selectedLabel: string) {
    const q = activeQuestion.value
    if (!q) return null
    const correct = selectedLabel === q.answer
    answers.value = {
      ...answers.value,
      [q.id]: { selected: [selectedLabel], correct },
    }
    return { correct, correctAnswer: q.answer }
  }

  function submitMultiAnswer(selectedLabels: string[]) {
    const q = activeQuestion.value
    if (!q) return null
    const correctAnswerSet = new Set(q.answer.split(''))
    const selectedSet = new Set(selectedLabels)
    const correct =
      correctAnswerSet.size === selectedSet.size &&
      [...correctAnswerSet].every((l) => selectedSet.has(l))
    answers.value = {
      ...answers.value,
      [q.id]: { selected: selectedLabels, correct },
    }
    return { correct, correctAnswer: q.answer }
  }

  function canGoNext(): boolean {
    if (pageMode.value === 'wrong') return false
    const total = reviewMode.value !== 'all' ? reviewTotal.value : totalQuestions.value
    return currentIndex.value < total - 1
  }

  function canGoPrev(): boolean {
    return currentIndex.value > 0
  }

  function goNext() {
    if (canGoNext()) currentIndex.value++
  }

  function goPrev() {
    if (canGoPrev()) currentIndex.value--
  }

  function goToIndex(index: number) {
    const total = reviewMode.value !== 'all' ? reviewTotal.value : totalQuestions.value
    if (index >= 0 && index < total) {
      currentIndex.value = index
    }
  }

  function retryQuestion(qid: number) {
    const next = { ...answers.value }
    delete next[qid]
    answers.value = next
  }

  function reset() {
    currentIndex.value = 0
    answers.value = {}
    bookmarks.value = new Set()
    reviewMode.value = 'all'
    pageMode.value = 'exam'
    clearStorageForBank('safety-a')
    if (mode.value === 'random') {
      regenerateShuffledIds()
    }
  }

  // 初始化随机索引
  if (shuffledIds.value.length === 0 && questions.value.length > 0 && mode.value === 'random') {
    regenerateShuffledIds()
  }

  // ========== LocalStorage 自动保存 ==========
  watch(answers, (val) => {
    saveToStorage(getStorageKey('safety-a', 'answers'), val)
  }, { deep: true })

  watch(currentIndex, (val) => {
    saveToStorage(getStorageKey('safety-a', 'index'), val)
  })

  watch(mode, (val) => {
    saveToStorage(getStorageKey('safety-a', 'mode'), val)
  })

  watch(pageMode, (val) => {
    saveToStorage(getStorageKey('safety-a', 'pageMode'), val)
  })

  watch(reviewMode, (val) => {
    saveToStorage(getStorageKey('safety-a', 'reviewMode'), val)
  })

  watch(shuffledIds, (val) => {
    saveToStorage(getStorageKey('safety-a', 'shuffledIds'), val)
  }, { deep: true })

  watch(bookmarks, (val) => {
    saveToStorage(getStorageKey('safety-a', 'bookmarks'), [...val])
  }, { deep: true })

  return {
    // state
    questionBanks,
    currentBankName,
    currentBank,
    questions,
    mode,
    pageMode,
    reviewMode,
    shuffledIds,
    currentIndex,
    answers,
    bookmarks,
    // computed
    currentQuestionIndex,
    currentQuestion,
    activeQuestion,
    totalQuestions,
    activeTotal,
    reviewSequence,
    reviewTotal,
    wrongQuestionsList,
    wrongRetrying,
    wrongRetryIndex,
    wrongRetryQuestion,
    answeredCount,
    correctCount,
    wrongCount,
    isFinished,
    isCurrentAnswered,
    currentAnswer,
    // actions
    selectBank,
    setMode,
    setPageMode,
    setReviewMode,
    submitSingleAnswer,
    submitMultiAnswer,
    goNext,
    goPrev,
    goToIndex,
    canGoNext,
    canGoPrev,
    reset,
    retryQuestion,
    startWrongRetry,
    clearWrongAnswers,
    resetWrongRetry,
    submitWrongRetrySingle,
    submitWrongRetryMulti,
    toggleBookmark,
    isBookmarked,
  }
})
