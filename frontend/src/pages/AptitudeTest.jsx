import { useState, useEffect, useRef, useCallback } from 'react'
import { aptitudeAPI } from '../services/api'
import axios from 'axios'
import { LIMITS, evaluateIntegrity, shouldWarn, remainingAllowance } from '../utils/proctoringRules'

const SECTIONS = [
  { id: 'quantitative', label: 'Quantitative', description: 'Math and numerical reasoning' },
  { id: 'logical', label: 'Logical Reasoning', description: 'Patterns and problem solving' },
  { id: 'technical', label: 'Technical', description: 'CS fundamentals' },
]

export default function AptitudeTest() {
  const [currentSection, setCurrentSection] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [startTime] = useState(Date.now())
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [isTestActive, setIsTestActive] = useState(false)
  const [warnedNearLimit, setWarnedNearLimit] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const disqualifyingRef = useRef(false)
  const timerRef = useRef(null)

  // Proctoring
  const [proctoringViolations, setProctoringViolations] = useState([])
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [proctoringStatus, setProctoringStatus] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (currentSection) {
      loadQuestions(currentSection)
      setIsTestActive(true)
      startCamera()
      // Start timer
      setTimeElapsed(0)
      timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentSection])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    return () => stopCamera()
  }, [])

  // Tab switch detection
  useEffect(() => {
    if (!isTestActive) return

    const onVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1)
      }
    }
    const onBeforeUnload = (e) => {
      if (isTestActive && !submitted) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [isTestActive, submitted])

  async function startCamera() {
    try {
      // Clear streak counters from any previous test
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
        image: canvas.toDataURL('image/jpeg', 0.9),
      })

      setProctoringStatus(data)

      // Only log confirmed violations — warnings are transient and not penalised
      if (data.status === 'violation') {
        setProctoringViolations(prev => {
          // Collapse repeats of the same violation type within 30s
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

        if (Notification.permission === 'granted') {
          new Notification('Proctoring Alert', { body: data.message, tag: 'proctoring' })
        }
      }
    } catch (err) {
      console.error('Proctoring check failed:', err)
    }
  }

  async function loadQuestions(section) {
    setLoading(true)
    setError('')
    try {
      const { data } = await aptitudeAPI.getBySection(section)
      setQuestions(data)
      setCurrentQuestionIndex(0)
    } catch (err) {
      setError('Failed to load questions. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerSelect(questionId, option) {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  // --- Disqualification enforcement -------------------------------------
  const submitDisqualified = useCallback(async (reason) => {
    if (disqualifyingRef.current) return
    disqualifyingRef.current = true

    setIsTestActive(false)
    stopCamera()

    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    try {
      setLoading(true)
      const { data } = await aptitudeAPI.submitTest({
        answers,
        time_taken: timeTaken,
        is_partial: true,
        tab_switches: tabSwitches,
        proctoring_violations: proctoringViolations,
        is_disqualified: true,
        disqualification_reason: reason,
      })
      setResult({ ...data, is_disqualified: true, disqualification_reason: reason })
    } catch (err) {
      // Still show the disqualified screen even if the save failed
      setResult({
        is_disqualified: true,
        disqualification_reason: reason,
        total_score: 0,
        proctoring_score: 0,
        aptitude_level: 'beginner',
      })
    } finally {
      setSubmitted(true)
      setCurrentSection(null)
      setLoading(false)
    }
  }, [answers, startTime, tabSwitches, proctoringViolations])

  useEffect(() => {
    if (!isTestActive || submitted) return

    const state = { tabSwitches, violations: proctoringViolations }
    const { disqualified, reason } = evaluateIntegrity(state)

    if (disqualified) {
      window.alert(
        `ASSESSMENT TERMINATED\n\n${reason}\n\n` +
        `Your attempt has been disqualified and the score voided.`
      )
      submitDisqualified(reason)
      return
    }

    if (!warnedNearLimit && shouldWarn(state)) {
      setWarnedNearLimit(true)
      const left = remainingAllowance(state)
      window.alert(
        `FINAL WARNING\n\n` +
        `You are close to being disqualified.\n\n` +
        `Tab switches remaining: ${left.tabSwitches}\n` +
        `Violations remaining: ${left.violations}\n\n` +
        `Further violations will void your attempt.`
      )
    }
  }, [tabSwitches, proctoringViolations, isTestActive, submitted, warnedNearLimit, submitDisqualified])

  async function handleSubmit(isPartialExit = false) {
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    const answeredCount = Object.keys(answers).length

    if (answeredCount === 0) {
      setError('Answer at least one question before submitting.')
      return
    }

    if (isPartialExit) {
      const unanswered = questions.length - answeredCount
      const ok = window.confirm(
        `Exit test early?\n\nAnswered: ${answeredCount} of ${questions.length}\n` +
        `${unanswered} question${unanswered !== 1 ? 's' : ''} will be marked unanswered.\n\n` +
        `Continue and see your score?`
      )
      if (!ok) return
    }

    try {
      setLoading(true)
      const { data } = await aptitudeAPI.submitTest({
        answers,
        time_taken: timeTaken,
        is_partial: isPartialExit,
        tab_switches: tabSwitches,
        proctoring_violations: proctoringViolations,
      })
      setResult(data)
      setSubmitted(true)
      setCurrentSection(null)
      setIsTestActive(false)
      stopCamera()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit test')
    } finally {
      setLoading(false)
    }
  }

  function resetTest() {
    setSubmitted(false)
    setResult(null)
    setAnswers({})
    setTabSwitches(0)
    setProctoringViolations([])
    setProctoringStatus(null)
    setWarnedNearLimit(false)
    disqualifyingRef.current = false
  }

  // ---------- Results / Section Selection ----------
  if (!currentSection) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aptitude Assessment</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
            Select a section to begin. Camera proctoring is enabled during the test.
          </p>
        </div>

        {submitted && result ? (
          <div className="space-y-6">
            {result.is_disqualified && (
              <div className="p-5 rounded-xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
                      Assessment Disqualified
                    </h2>
                    <p className="mt-1.5 text-sm text-red-700 dark:text-red-400">
                      {result.disqualification_reason}
                    </p>
                    <p className="mt-3 text-sm text-red-600/80 dark:text-red-400/70">
                      Your score has been voided. Retake the assessment while following
                      the proctoring rules: stay visible to the camera, remain alone,
                      and do not leave the test tab.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!result.is_disqualified && result.is_partial && (
              <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Early exit — scored on {result.total_answered} of {result.total_questions} questions.
                </p>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric label="Score" value={`${result.total_score}%`} />
              <Metric label="Accuracy" value={`${Math.round(result.answered_accuracy ?? result.accuracy_percent ?? 0)}%`} />
              <Metric label="Level" value={result.aptitude_level} capitalize />
              <Metric label="Proctoring" value={result.proctoring_score ?? 100} />
            </div>

            {/* Section breakdown */}
            {result.section_scores && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Section Breakdown</h2>
                <div className="space-y-4">
                  {Object.entries(result.section_scores).map(([section, score]) => (
                    <div key={section}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700 dark:text-zinc-300 capitalize">{section}</span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{score}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full progress-animate ${
                            score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proctoring report */}
            {(proctoringViolations.length > 0 || tabSwitches > 0) && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Proctoring Report</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-zinc-400">Violations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{proctoringViolations.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-zinc-400">Tab switches</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{tabSwitches}</p>
                  </div>
                </div>
                {proctoringViolations.length > 0 && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800">
                    {proctoringViolations.map((v, i) => (
                      <div key={i} className="py-2">
                        <p className="text-sm text-gray-700 dark:text-zinc-300 capitalize">
                          {v.type?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">{v.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={resetTest} className="btn-primary">Take another test</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className="card card-hover text-left group"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{section.label}</h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400">{section.description}</p>
                <p className="mt-4 text-xs font-medium text-blue-600 dark:text-blue-400">Start test →</p>
              </button>
            ))}
          </div>
        )}

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
        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
          No questions available for this section.
        </p>
        <button onClick={() => setCurrentSection(null)} className="btn-secondary">
          Back to sections
        </button>
      </div>
    )
  }

  // ---------- Question view ----------
  const question = questions[currentQuestionIndex]
  const sectionName = SECTIONS.find(s => s.id === currentSection)?.label
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
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
            <span className={isViolation ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-zinc-400'}>
              {proctoringStatus?.message || 'Camera monitoring active'}
            </span>
          </div>
          <span className={`text-sm ${nearLimit ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-zinc-400'}`}>
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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{sectionName}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-center">
            <p className="text-xs text-gray-600 dark:text-zinc-400">Time</p>
            <p className="text-base font-mono font-semibold text-gray-900 dark:text-white">
              {String(Math.floor(timeElapsed / 60)).padStart(2, '0')}:{String(timeElapsed % 60).padStart(2, '0')}
            </p>
          </div>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading || Object.keys(answers).length === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exit &amp; see score
          </button>
          <button
            onClick={() => {
              if (window.confirm('Go back? Your progress will be lost and nothing will be submitted.')) {
                setCurrentSection(null)
                setIsTestActive(false)
                setAnswers({})
                stopCamera()
              }
            }}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="card">
        <h2 className="text-base font-medium text-gray-900 dark:text-white leading-relaxed">
          {question.question_text}
        </h2>

        <div className="mt-5 space-y-2">
          {question.options?.map((option, idx) => {
            const key = String.fromCharCode(65 + idx)
            const selected = answers[question.id] === key
            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(question.id, key)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-left text-sm transition-colors ${
                  selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-gray-900 dark:text-white'
                    : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 text-gray-700 dark:text-zinc-300'
                }`}
              >
                <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${
                  selected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                }`}>
                  {key}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <p className="text-sm text-gray-600 dark:text-zinc-400">
          <span className="font-medium text-gray-900 dark:text-white">{Object.keys(answers).length}</span> of {questions.length} answered
        </p>

        {currentQuestionIndex < questions.length - 1 ? (
          <button onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)} className="btn-primary">
            Next
          </button>
        ) : (
          <button onClick={() => handleSubmit(false)} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit test'}
          </button>
        )}
      </div>

      {error && <ErrorBox message={error} />}
    </div>
  )
}

function Metric({ label, value, capitalize }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1.5">{label}</p>
      <p className={`text-2xl font-bold text-gray-900 dark:text-white ${capitalize ? 'capitalize text-lg' : ''}`}>
        {value}
      </p>
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
