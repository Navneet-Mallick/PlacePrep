import { useState, useEffect, useRef } from 'react'
import { technicalAPI } from '../services/api'
import axios from 'axios'

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

  async function startCamera() {
    try {
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
        setProctoringViolations(prev => [...prev, {
          timestamp: Date.now(),
          type: data.violation_type,
          message: data.message,
          severity: data.severity,
        }])
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

  function handleExit() {
    if (window.confirm('Exit assessment? Your evaluated answers are already saved.')) {
      setSelectedCategory(null)
      setIsTestActive(false)
      setTabSwitches(0)
      setProctoringViolations([])
      setProctoringStatus(null)
      stopCamera()
    }
  }

  // ---------- Category selection ----------
  if (!selectedCategory) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Technical Assessment</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
            Subjective questions scored using semantic similarity. Camera proctoring is enabled.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="card card-hover text-left"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{category.label}</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Subjective questions</p>
              <p className="mt-4 text-xs font-medium text-blue-600 dark:text-blue-400">Start →</p>
            </button>
          ))}
        </div>

        {error && <ErrorBox message={error} />}
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
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">No questions in this category.</p>
        <button onClick={handleExit} className="btn-secondary">Back</button>
      </div>
    )
  }

  const categoryName = CATEGORIES.find(c => c.id === selectedCategory)?.label
  const question = questions[currentQuestionIndex]
  const result = results[question.id]
  const answer = answers[question.id] || ''
  const isViolation = proctoringStatus?.status === 'violation'

  return (
    <div className="space-y-6">
      <div style={{ display: 'none' }}>
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>

      {/* Proctoring bar */}
      {cameraEnabled && (
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${
          isViolation
            ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20'
            : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${isViolation ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className={isViolation ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-zinc-400'}>
              {proctoringStatus?.message || 'Camera monitoring active'}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-zinc-500">
            {tabSwitches} tab switches · {proctoringViolations.length} violations
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{categoryName}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
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
        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-2">Your answer</label>
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Evaluation</h3>
            <span className={`text-2xl font-bold ${
              result.score >= 70 ? 'text-emerald-600 dark:text-emerald-400'
                : result.score >= 50 ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {result.score}<span className="text-sm text-gray-400 dark:text-zinc-500">/100</span>
            </span>
          </div>

          {result.similarity_score != null && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
                <span>Similarity</span>
                <span>{(result.similarity_score * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${result.similarity_score * 100}%` }} />
              </div>
            </div>
          )}

          {result.feedback && (
            <p className="text-sm text-gray-600 dark:text-zinc-400">{result.feedback}</p>
          )}
        </div>
      )}

      {/* Reference answer */}
      {question.reference_answer && (
        <details className="card">
          <summary className="cursor-pointer text-sm font-medium text-gray-900 dark:text-white">
            Reference answer
          </summary>
          <p className="mt-3 text-sm text-gray-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
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

        <p className="text-sm text-gray-500 dark:text-zinc-400">
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
