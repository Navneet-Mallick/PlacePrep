import { useState, useEffect } from 'react'
import { technicalAPI } from '../services/api'

const CATEGORIES = [
  { id: 'dsa', label: 'Data Structures & Algorithms', icon: '🌳' },
  { id: 'dbms', label: 'Database Management Systems', icon: '🗄️' },
  { id: 'os', label: 'Operating Systems', icon: '⚙️' },
  { id: 'cn', label: 'Computer Networks', icon: '🌐' },
  { id: 'git', label: 'Version Control (Git)', icon: '📦' },
  { id: 'web', label: 'Web Development', icon: '🌐' },
]

export default function TechnicalTest() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState({})

  useEffect(() => {
    if (selectedCategory) {
      loadQuestions(selectedCategory)
    }
  }, [selectedCategory])

  async function loadQuestions(category) {
    setLoading(true)
    setError('')
    try {
      const { data } = await technicalAPI.getByCategory(category)
      setQuestions(data)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setResults({})
      setSubmitted(false)
    } catch (err) {
      setError('Failed to load questions. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerChange(questionId, answer) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  async function submitAnswer(questionId) {
    const answer = answers[questionId]?.trim()
    
    if (!answer) {
      setError('Please provide an answer before submitting.')
      return
    }

    try {
      setLoading(true)
      const { data } = await technicalAPI.submitAnswer({
        question_id: questionId,
        answer: answer,
      })
      
      setResults(prev => ({
        ...prev,
        [questionId]: data
      }))
      
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to evaluate answer')
    } finally {
      setLoading(false)
    }
  }

  // Category Selection View
  if (!selectedCategory) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Technical Assessment</h1>
          <p className="mt-2 text-slate-400">
            Evaluate your technical knowledge in various domains. Your answers will be scored using NLP similarity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/10 group-hover:to-indigo-600/5 transition-all"></div>
              <div className="relative">
                <p className="text-4xl mb-2">{category.icon}</p>
                <p className="text-lg font-semibold text-white">{category.label}</p>
                <p className="text-sm text-slate-400 mt-1">Subjective questions</p>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-100">
            {error}
          </div>
        )}
      </div>
    )
  }

  // Loading View
  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-300">Loading questions...</p>
        </div>
      </div>
    )
  }

  // No Questions View
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-amber-100 text-center">
        <p>No questions available for this category. Please try another category.</p>
        <button
          onClick={() => setSelectedCategory(null)}
          className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-500"
        >
          Back
        </button>
      </div>
    )
  }

  const categoryName = CATEGORIES.find(c => c.id === selectedCategory)?.label
  const question = questions[currentQuestionIndex]
  const result = results[question.id]
  const answer = answers[question.id] || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{categoryName}</h1>
          <p className="text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <button
          onClick={() => setSelectedCategory(null)}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div>
          <p className="text-slate-400 text-sm mb-2">Question {currentQuestionIndex + 1}</p>
          <h2 className="text-xl font-semibold text-white">{question.question_text}</h2>
        </div>

        {question.difficulty && (
          <div className="flex gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              question.difficulty === 'easy' ? 'bg-green-900/30 text-green-200' :
              question.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-200' :
              'bg-red-900/30 text-red-200'
            }`}>
              {question.difficulty.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Answer Input */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Your Answer</label>
          <textarea
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your answer here..."
            rows="6"
            className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          ></textarea>
          <p className="text-xs text-slate-500 mt-2">
            {answer.length} characters
          </p>
        </div>

        <button
          onClick={() => submitAnswer(question.id)}
          disabled={loading || !answer.trim()}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Evaluating...' : 'Submit Answer'}
        </button>
      </div>

      {/* Evaluation Result */}
      {result && (
        <div className={`rounded-xl border-2 p-6 space-y-3 ${
          result.score >= 70 
            ? 'border-green-500/30 bg-green-950/20' 
            : result.score >= 50 
            ? 'border-yellow-500/30 bg-yellow-950/20'
            : 'border-red-500/30 bg-red-950/20'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Evaluation Result</h3>
            <div className={`text-3xl font-bold ${
              result.score >= 70 ? 'text-green-200' :
              result.score >= 50 ? 'text-yellow-200' :
              'text-red-200'
            }`}>
              {result.score}/100
            </div>
          </div>

          {result.similarity_score && (
            <div>
              <p className="text-sm text-slate-300 mb-2">Similarity Score: {(result.similarity_score * 100).toFixed(1)}%</p>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                  style={{ width: `${result.similarity_score * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {result.feedback && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="text-sm text-slate-300">{result.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Reference Answer (if available) */}
      {question.reference_answer && (
        <details className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <summary className="cursor-pointer font-semibold text-white hover:text-slate-300">
            📚 Reference Answer
          </summary>
          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <p className="text-slate-300 whitespace-pre-wrap">{question.reference_answer}</p>
          </div>
        </details>
      )}

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="text-center">
          <p className="text-slate-400 text-sm">
            Answered: {Object.keys(results).length} / {questions.length}
          </p>
        </div>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors font-semibold"
          >
            Finish & Return
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-100">
          {error}
        </div>
      )}
    </div>
  )
}
