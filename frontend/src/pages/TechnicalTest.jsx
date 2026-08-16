import { useState, useEffect, useRef } from 'react'
import { technicalAPI } from '../services/api'
import axios from 'axios'
import { LIMITS, evaluateIntegrity, shouldWarn } from '../utils/proctoringRules'

const CATEGORIES = [
  { id: 'dsa', label: 'Data Structures & Algorithms' },
  { id: 'dbms', label: 'Database Management' },
  { id: 'os', label: 'Operating Systems' },
  { id: 'cn', label: 'Computer Networks' },
  { id: 'git', label: 'Version Control' },
  { id: 'web', label: 'Web Development' },
]

export default function TechnicalTest() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState({})
  const [isTestActive, setIsTestActive] = useState(false)
  const [disqualified, setDisqualified] = useState(null)
  const [warnedNearLimit, setWarnedNearLimit] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  // Proctoring
  const [tabSwitches, setTabSwitches] = useState(0)
  const [proctoringViolations, setProctoringViolations] = useState([])
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [proctoringStatus, setProctoringStatus] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (selectedCategory) {
      loadQuestions(selectedCategory)
      setIsTestActive(true)
      startCamera()
    }
  }, [selectedCategory])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (!isTestActive) return
    const onVisibilityChange = () => {
      if (document.hidden) setTabSwitches(prev => prev + 1)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [isTestActive])

  // Disqualification enforcement
  useEffect(() => {
    if (!isTestActive || disqualified) return

    const state = { tabSwitches, violations: proctoringViolations }
    const check = evaluateIntegrity(state)

    if (check.disqualified) {
      window.alert(
        `ASSESSMENT TERMINATED\n\n${check.reason}\n\n` +
        `Your attempt has been disqualified.`
      )
      setDisqualified(check.reason)
      setIsTestActive(false)
      stopCamera()
      return
    }

    if (!warnedNearLimit && shouldWarn(state)) {
      setWarnedNearLimit(true)
      window.alert(
        'FINAL WARNING\n\nYou are close to being disqualified. ' +
        'Further violations will terminate this assessment.'
      )
    }
  }, [tabSwitches, proctoringViolations, isTestActive, disqualified, warnedNearLimit])

  async function startCamera() {
    try {
      await axios.post('http://localhost:8001/api/proctoring/reset').catch(() => {})

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraEnabled(true)
        intervalRef.current = setInterval(checkProctoring, 5000)
      }
    } catch (err) {
      console.error('Camera access denied:', err)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setCameraEnabled(false)
  }

  async function checkProctoring() {
    if (!videoRef.current || !canvasRef.current) return
    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)

      const { data } = await axios.post('http://localhost:8001/api/proctoring/check', {
        image: canvas.toDataURL('image/jpeg', 0.8),
      })
      setProctoringStatus(data)

      if (data.status === 'violation') {
        setProctoringViolations(prev => {
          const last = prev[prev.length - 1]
          if (last && last.type === data.violation_type && Date.now() - last.timestamp < 30000) {
            return prev
          }
          return [...prev, {
            timestamp: Date.now(),
            type: data.violation_type,
            message: data.message,
            severity: data.severity,
          }]
        })
      }
    } catch (err) {
      console.error('Proctoring check failed:', err)
    }
  }

  async function loadQuestions(category) {
    setLoading(true)
    setError('')
    try {
      const { data } = await technicalAPI.getByCategory(category)
      setQuestions(data)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setResults({})
    } catch (err) {
      setError('Failed to load questions. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer(questionId) {
    const answer = answers[questionId]?.trim()
    if (!answer) {
      setError('Write an answer before submitting.')
      return
    }
    try {
      setLoading(true)
      const { data } = await technicalAPI.submitAnswer({ question_id: questionId, answer })
      setResults(prev => ({ ...prev, [questionId]: data }))
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to evaluate answer')
    } finally {
      setLoading(false)
    }
  }

  function resetSession() {
    setSelectedCategory(null)
    setIsTestActive(false)
    setTabSwitches(0)
    setProctoringViolations([])
    setProctoringStatus(null)
    setDisqualified(null)
    setWarnedNearLimit(false)
    setShowSummary(false)
    stopCamera()
  }

  function handleExit() {
    const evaluated = Object.keys(results).length
    if (evaluated === 0) {
      if (window.confirm('Exit without answering any questions?')) {
        resetSession()
      }
      return
    }
    // Show summary instead of just going back
    setIsTestActive(false)
    setShowSummary(true)
    stopCamera()
  }

  // ---------- Summary view ----------
  if (showSummary) {
    const evaluated = Object.values(results)
    const avgScore = evaluated.length > 0
      ? Math.round(evaluated.reduce((sum, r) => sum + (r.score || 0), 0) / evaluated.length)
      : 0
    const categoryName = CATEGORIES.find(c => c.id === selectedCategory)?.label

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assessment Complete</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-zinc-300">
            {categoryName} — {evaluated.length} of {questions.length} questions answered
          </p>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Average Score</p>
            <p className={`text-3xl font-bold ${
              avgScore >= 75 ? 'text-emerald-600 dark:text-emerald-400'
                : avgScore >= 55 ? 'text-blue-600 dark:text-blue-400'
                : avgScore >= 35 ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}>{avgScore}%</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Answered</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{evaluated.length}/{questions.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Tab Switches</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{tabSwitches}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Violations</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{proctoringViolations.length}</p>
          </div>
        </div>

        {/* Per-question results */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question Scores</h2>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {questions.filter(q => results[q.id]).map((q, i) => {
              const r = results[q.id]
              return (
                <div key={q.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 dark:text-zinc-200 truncate">
                      {i + 1}. {q.question_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${
                      r.category === 'excellent' ? 'badge-green'
                        : r.category === 'good' ? 'badge-blue'
                        : r.category === 'fair' ? 'badge-amber'
                        : 'badge-red'
                    }`}>{r.category || 'scored'}</span>
                    <span className={`text-lg font-bold ${
                      r.score >= 75 ? 'text-emerald-600 dark:text-emerald-400'
                        : r.score >= 55 ? 'text-blue-600 dark:text-blue-400'
                        : r.score >= 35 ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>{r.score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={resetSession} className="btn-primary">Back to categories</button>
        </div>
      </div>
    )
  }

  // ---------- Category selection ----------
  if (!selectedCategory) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Technical Assessment</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-zinc-300">
            Answer subjective questions from core CS domains. Your responses are evaluated 
            using TF-IDF cosine similarity with synonym-aware semantic matching.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="card card-hover text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.label}</h3>
              <p className="mt-1 text-xs text-gray-700 dark:text-zinc-300">Subjective questions</p>
              <p className="mt-4 text-xs font-medium text-blue-600 dark:text-blue-400">Start →</p>
            </button>
          ))}
        </div>

        {error && <ErrorBox message={error} />}
      </div>
    )
  }

  // ---------- Disqualified ----------
  if (disqualified) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="p-6 rounded-xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-red-800 dark:text-red-300">
                Assessment Disqualified
              </h1>
              <p className="mt-1.5 text-sm text-red-700 dark:text-red-400">{disqualified}</p>
              <p className="mt-3 text-sm text-red-600/80 dark:text-red-400/70">
                Retake the assessment while following the proctoring rules: stay
                visible to the camera, remain alone, and do not leave the test tab.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm text-gray-700 dark:text-zinc-300">
            Tab switches: <span className="font-semibold text-gray-900 dark:text-white">{tabSwitches}</span>
            {' · '}
            Violations: <span className="font-semibold text-gray-900 dark:text-white">{proctoringViolations.length}</span>
          </p>
        </div>

        <button onClick={resetSession} className="btn-primary mt-5">
          Back to categories
        </button>
      </div>
    )
  }

  // ---------- Loading ----------
  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-zinc-700 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  // ---------- No questions ----------
  if (questions.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm text-gray-700 dark:text-zinc-300 mb-4">No questions in this category.</p>
        <button onClick={handleExit} className="btn-secondary">Back</button>
      </div>
    )
  }

  const categoryName = CATEGORIES.find(c => c.id === selectedCategory)?.label
  const question = questions[currentQuestionIndex]
  const result = results[question.id]
  const answer = answers[question.id] || ''
  const isViolation = proctoringStatus?.status === 'violation'
  const nearLimit = shouldWarn({ tabSwitches, violations: proctoringViolations })

  return (
    <div className="space-y-6">
      {/* Camera preview (small corner) */}
      <div className="fixed bottom-4 right-4 z-40 rounded-lg overflow-hidden border border-gray-300 dark:border-zinc-700 shadow-lg w-32 h-24 bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Proctoring bar */}
      {cameraEnabled && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${
          isViolation
            ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20'
            : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${isViolation ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className={isViolation ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-zinc-300'}>
              {proctoringStatus?.message || 'Camera monitoring active'}
            </span>
          </div>
          <span className={`text-sm ${nearLimit ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-zinc-300'}`}>
            Tab switches {tabSwitches}/{LIMITS.tabSwitches} · Violations {proctoringViolations.length}/{LIMITS.totalViolations}
          </span>
        </div>
      )}

      {nearLimit && (
        <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Final warning — further violations will disqualify your attempt.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{categoryName}</h1>
          <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <button onClick={handleExit} className="btn-secondary">Exit</button>
      </div>

      {/* Progress */}
      <div className="h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-base font-medium text-gray-900 dark:text-white leading-relaxed">
            {question.question_text}
          </h2>
          {question.difficulty && (
            <span className={`badge flex-shrink-0 ${
              question.difficulty === 'easy' ? 'badge-green'
                : question.difficulty === 'medium' ? 'badge-amber' : 'badge-red'
            }`}>
              {question.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Answer */}
      <div className="card">
        <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-2">Your answer</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
          placeholder="Explain in your own words..."
          rows="6"
          className="resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400 dark:text-zinc-500">{answer.length} characters</span>
          <button
            onClick={() => submitAnswer(question.id)}
            disabled={loading || !answer.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Evaluating...' : 'Submit answer'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Evaluation</h3>
              <span className={`badge ${
                result.category === 'excellent' ? 'badge-green'
                  : result.category === 'good' ? 'badge-blue'
                  : result.category === 'fair' ? 'badge-amber'
                  : 'badge-red'
              }`}>
                {result.category || (result.score >= 75 ? 'excellent' : result.score >= 55 ? 'good' : result.score >= 35 ? 'fair' : 'weak')}
              </span>
            </div>
            <span className={`text-2xl font-bold ${
              result.score >= 75 ? 'text-emerald-600 dark:text-emerald-400'
                : result.score >= 55 ? 'text-blue-600 dark:text-blue-400'
                : result.score >= 35 ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {result.score}<span className="text-sm text-gray-400 dark:text-zinc-500">/100</span>
            </span>
          </div>

          {result.similarity_score != null && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-700 dark:text-zinc-300 mb-1.5">
                <span>Similarity</span>
                <span>{(result.similarity_score * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${result.similarity_score * 100}%` }} />
              </div>
            </div>
          )}

          {result.feedback && (
            <p className="text-sm text-gray-700 dark:text-zinc-300">{result.feedback}</p>
          )}
        </div>
      )}

      {/* Reference answer */}
      {question.reference_answer && (
        <details className="card">
          <summary className="cursor-pointer text-sm font-medium text-gray-900 dark:text-white">
            Reference answer
          </summary>
          <p className="mt-3 text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {question.reference_answer}
          </p>
        </details>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <p className="text-sm text-gray-700 dark:text-zinc-300">
          <span className="font-medium text-gray-900 dark:text-white">{Object.keys(results).length}</span> of {questions.length} evaluated
        </p>

        {currentQuestionIndex < questions.length - 1 ? (
          <button onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)} className="btn-primary">
            Next
          </button>
        ) : (
          <button onClick={handleExit} className="btn-primary">Finish</button>
        )}
      </div>

      {error && <ErrorBox message={error} />}
    </div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}
