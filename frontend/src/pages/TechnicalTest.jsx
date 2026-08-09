import { useState, useEffect, useRef } from 'react'
import { technicalAPI } from '../services/api'
import axios from 'axios'

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
  const [results, setResults] = useState({})
  const [isTestActive, setIsTestActive] = useState(false)

  // Proctoring states
  const [tabSwitches, setTabSwitches] = useState(0)
  const [proctoringViolations, setProctoringViolations] = useState([])
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [currentProctoringStatus, setCurrentProctoringStatus] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const proctoringIntervalRef = useRef(null)

  useEffect(() => {
    if (selectedCategory) {
      loadQuestions(selectedCategory)
      setIsTestActive(true)
      startCamera()
    }
  }, [selectedCategory])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  // Tab switch detection
  useEffect(() => {
    if (!isTestActive) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const newCount = prev + 1
          alert(
            `⚠️ WARNING: Tab switch detected!\n\n` +
            `Tab switches: ${newCount}\n\n` +
            `Please stay on this page during the assessment.`
          )
          return newCount
        })
      }
    }

    const handleBeforeUnload = (e) => {
      if (isTestActive) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isTestActive])

  // Camera & Proctoring
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraEnabled(true)
        proctoringIntervalRef.current = setInterval(checkProctoring, 5000)
      }
    } catch (err) {
      console.error('Camera access denied:', err)
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (proctoringIntervalRef.current) {
      clearInterval(proctoringIntervalRef.current)
      proctoringIntervalRef.current = null
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
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL('image/jpeg', 0.8)

      const response = await axios.post('http://localhost:8001/api/proctoring/check', {
        image: imageData
      })

      const result = response.data
      setCurrentProctoringStatus(result)

      if (result.status === 'violation') {
        const violation = {
          timestamp: Date.now(),
          type: result.violation_type,
          message: result.message,
          face_count: result.face_count,
          severity: result.severity
        }
        setProctoringViolations(prev => [...prev, violation])

        if (Notification.permission === 'granted') {
          new Notification('Proctoring Alert', {
            body: result.message,
            tag: 'proctoring-violation'
          })
        }
      }
    } catch (err) {
      console.error('Proctoring check failed:', err)
    }
  }

  function handleExit() {
    const confirmExit = window.confirm(
      '⚠️ Are you sure you want to exit?\n\nYour answered questions are already evaluated.'
    )
    if (confirmExit) {
      setSelectedCategory(null)
      setIsTestActive(false)
      setTabSwitches(0)
      setProctoringViolations([])
      setCurrentProctoringStatus(null)
      stopCamera()
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
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerChange(questionId, answer) {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
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
      setResults(prev => ({ ...prev, [questionId]: data }))
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Technical Assessment</h1>
          <p className="mt-2 text-gray-400">
            Evaluate your technical knowledge. Answers scored using NLP similarity. Camera proctoring enabled.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-6 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-indigo-600/0 group-hover:from-indigo-600/10 group-hover:to-indigo-600/5 transition-all"></div>
              <div className="relative">
                <p className="text-4xl mb-2">{category.icon}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{category.label}</p>
                <p className="text-sm text-gray-400 mt-1">Subjective questions</p>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-100">{error}</div>
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
          <p className="text-gray-300">Loading questions...</p>
        </div>
      </div>
    )
  }

  // No Questions View
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6 text-amber-100 text-center">
        <p>No questions available for this category.</p>
        <button onClick={handleExit} className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-gray-900 dark:text-white hover:bg-amber-500">
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
      {/* Hidden camera elements */}
      <div style={{ display: 'none' }}>
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>

      {/* Proctoring Status Bar */}
      {(tabSwitches > 0 || proctoringViolations.length > 0 || currentProctoringStatus) && (
        <div className={`rounded-lg border p-4 ${
          tabSwitches > 3 || proctoringViolations.length > 5
            ? 'border-red-500/40 bg-red-500/10 text-red-100 animate-pulse'
            : proctoringViolations.length > 0
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
            : 'border-green-500/40 bg-green-500/10 text-green-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium flex items-center gap-2">
                {cameraEnabled ? '🎥' : '📷'} Proctoring
                {currentProctoringStatus?.status === 'ok' && <span className="text-green-400 font-bold">Active</span>}
                {currentProctoringStatus?.status === 'violation' && <span className="text-red-400 font-bold animate-pulse">VIOLATION</span>}
              </p>
              <div className="text-sm space-y-1">
                <p>Tab switches: <span className="font-bold">{tabSwitches}</span> | Violations: <span className="font-bold">{proctoringViolations.length}</span></p>
                {currentProctoringStatus?.message && (
                  <p className="text-xs opacity-90">{currentProctoringStatus.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera indicator */}
      {cameraEnabled && (
        <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg ${
          currentProctoringStatus?.status === 'violation'
            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
            : 'bg-green-500/20 text-green-300 border border-green-500/30'
        }`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            currentProctoringStatus?.status === 'violation' ? 'bg-red-500' : 'bg-green-500'
          }`}></div>
          <span>{currentProctoringStatus?.status === 'violation' ? currentProctoringStatus.message : 'Camera monitoring active'}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{categoryName}</h1>
          <p className="text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg bg-amber-600 text-gray-900 dark:text-white hover:bg-amber-500 transition-colors font-medium"
        >
          🚪 Exit
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
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-6 space-y-4">
        <div>
          <p className="text-gray-400 text-sm mb-2">Question {currentQuestionIndex + 1}</p>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{question.question_text}</h2>
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
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Your Answer</label>
          <textarea
            value={answer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your answer here..."
            rows="6"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          ></textarea>
          <p className="text-xs text-gray-500 mt-2">{answer.length} characters</p>
        </div>

        <button
          onClick={() => submitAnswer(question.id)}
          disabled={loading || !answer.trim()}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-gray-900 dark:text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Evaluation Result</h3>
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
              <p className="text-sm text-gray-300 mb-2">Similarity: {(result.similarity_score * 100).toFixed(1)}%</p>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500"
                  style={{ width: `${result.similarity_score * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {result.feedback && (
            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/50 p-3">
              <p className="text-sm text-gray-300">{result.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Reference Answer */}
      {question.reference_answer && (
        <details className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-6">
          <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white hover:text-gray-300">
            Reference Answer
          </summary>
          <div className="mt-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/50 p-4">
            <p className="text-gray-300 whitespace-pre-wrap">{question.reference_answer}</p>
          </div>
        </details>
      )}

      {/* Navigation */}
      <div className="flex gap-3 justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <p className="text-gray-400 text-sm">
          Evaluated: <strong className="text-gray-900 dark:text-white">{Object.keys(results).length}</strong> / {questions.length}
        </p>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-gray-900 dark:text-white hover:bg-indigo-500 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleExit}
            className="px-6 py-2 rounded-lg bg-green-600 text-gray-900 dark:text-white hover:bg-green-500 transition-colors font-semibold"
          >
            Finish & Return
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-100">{error}</div>
      )}
    </div>
  )
}
