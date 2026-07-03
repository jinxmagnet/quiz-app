/** 题目类型 */
export type QuestionType = 'single' | 'multi'

/** 单道题目 */
export interface Question {
  id: number
  section: string
  question: string
  options: string[]
  optionLabels: string[]
  answer: string // 正确答案，如 "C" 或 "ABCD"
  type: QuestionType
}

/** 答题记录 */
export interface AnswerRecord {
  selected: string[]
  correct: boolean
}

/** 刷题模式 */
export type QuizMode = 'sequential' | 'random'

/** 页面模式：答题 / 学习 / 错题 */
export type PageMode = 'exam' | 'learn' | 'wrong'

/** 复习筛选：全部 / 收藏 */
export type ReviewMode = 'all' | 'bookmarked'

/** 题库信息 */
export interface QuestionBank {
  name: string
  label: string
  questions: Question[]
}

/** 卡片滑动方向 */
export type SwipeDirection = 'left' | 'right' | null
