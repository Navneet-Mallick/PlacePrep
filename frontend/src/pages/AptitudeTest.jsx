import { useState, useEffect, useRef } from 'react'
import { aptitudeAPI } from '../services/api'
import axios from 'axios'

const SECTIONS = [
  { 
    id: 'quantitative', 
    label: 'Quantitative', 
    icon: '🔢', 
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Math & numerical reasoning'
  },
  { 
    id: 'logical', 
    label: 'Logical Reasoning', 
    icon: '🧩', 
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    description: 'Patterns & problem solving'
  },
  { 
    id: 'technical', 
    label: 'Technical', 
    icon: '⚙️', 
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    description: 'CS fundamentals'
  },
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
  
  // Proctoring states
  const [proctoringViolations, setProctoringViolations] = useState([])
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [currentProctoringStatus, setCurrentProctoringStatus] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const proctoringIntervalRef = useRef(null)

  useEffect(() => {
    if (currentSection) {
      loadQuestions(currentSection)
      setIsTestActive(true)
      startCamera()
    }
  }, [currentSection])

  // Camera and Proctoring Functions
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraEnabled(true)
        
        // Start proctoring checks every 5 seconds
        proctoringIntervalRef.current = setInterval(checkProctoring, 5000)
      }
    } catch (err) {
      console.error('Camera access denied:', err)
      alert('⚠️ Camera access is required for proctoring. Please allow camera access and refresh.')
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
      // Capture frame from video
      const canvas = canvasRef.current
      const video = videoRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      // Send to backend
      const response = await axios.post('http://localhost:8001/api/proctoring/check', {
        image: imageData
      })
      
      const result = response.data
      setCurrentProctoringStatus(result)
      
      // Log violations
      if (result.status === 'violation') {
        const violation = {
          timestamp: Date.now(),
          type: result.violation_type,
          message: result.message,
          face_count: result.face_count
        }
        
        setProctoringViolations(prev => [...prev, violation])
        
        // Alert user on violation
        if (result.violation_type === 'no_face') {
          console.warn('⚠️ Proctoring: No face detected')
        } else if (result.violation_type === 'multiple_faces') {
          console.warn(`⚠️ Proctoring: Multiple faces detected (${result.face_count})`)
        }
      }
    } catch (err) {
      console.error('Proctoring check failed:', err)
    }
  }

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Proctoring System
  useEffect(() => {
    if (!isTestActive) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1)
        const newCount = tabSwitches + 1
        
        // Alert on tab switch
        alert(`⚠️ WARNING: You switched tabs!\n\nTab switches: ${newCount}\n\nPlease stay on the test tab. Multiple switches may result in test cancellation.`)
        
        // Log to console
        console.warn(`Tab switch detected. Total switches: ${newCount}`)
      }
    }

    const handleBeforeUnload = (e) => {
      if (isTestActive && !submitted) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    const handleBlur = () => {
      if (isTestActive) {
        console.log('Window lost focus - Test monitoring active')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isTestActive, submitted, tabSwitches])

  async function loadQuestions(section) {
    setLoading(true)
    setError('')
    try {
      const { data } = await aptitudeAPI.getBySection(section)
      setQuestions(data)
      setCurrentQuestionIndex(0)
    } catch (err) {
      setError('Failed to load questions. Try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerSelect(questionId, option) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }))
  }

  async function handleSubmit(isPartialExit = false) {
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    
    // Check if there are any answers to submit
    const answeredCount = Object.keys(answers).length
    if (answeredCount === 0) {
      setError('Please answer at least one question before submitting.')
      return
    }

    // Confirmation for early exit
    if (isPartialExit) {
      const totalQuestions = questions.length
      const unansweredCount = totalQuestions - answeredCount
      
      const confirmExit = window.confirm(
        `⚠️ EXIT TEST EARLY?\n\n` +
        `You have answered ${answeredCount} out of ${totalQuestions} questions.\n` +
        `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} will be marked as unanswered.\n\n` +
        `Your score will be calculated based on the ${answeredCount} question${answeredCount !== 1 ? 's' : ''} you answered.\n\n` +
        `Do you want to exit and get your score now?`
      )
      
      if (!confirmExit) {
        return
      }
    }
    
    try {
      setLoading(true)
      
      // Check if too many tab switches
      if (tabSwitches > 3) {
        const confirmSubmit = window.confirm(
          `⚠️ ALERT: ${tabSwitches} tab switches detected!\n\nThis test appears to be unproctored due to multiple tab switches.\n\nDo you still want to submit?`
        )
        if (!confirmSubmit) {
          setLoading(false)
          return
        }
      }

      const { data } = await aptitudeAPI.submitTest({
        answers,
        time_taken: timeTaken,
        is_partial: isPartialExit,
        tab_switches: tabSwitches,
        proctoring_violations: proctoringViolations
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

  // Section Selection View
  if (!currentSection) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="text-sm font-medium text-blue-300">AI-Powered Assessment</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="gradient-text">Aptitude Assessment</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Test your skills across multiple domains. Track your progress and get personalized insights.
          </p>
        </div>

        {submitted && result ? (
          <div className="space-y-6">
            {/* Partial Submission Notice */}
            {result.is_partial && (
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-100 mb-2">
                      Early Exit - Partial Submission
                    </h3>
                    <p className="text-amber-200/80 leading-relaxed">
                      You exited the test early. Your score is calculated based on{' '}
                      <strong className="text-amber-100">{result.total_answered} answered question{result.total_answered !== 1 ? 's' : ''}</strong>.
                      Complete all questions next time for a comprehensive assessment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary - Enhanced Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="group relative overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-950/40 to-emerald-950/20 p-6 backdrop-blur-sm card-hover">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-green-200/80">Total Score</p>
                    <span className="text-2xl">🎯</span>
                  </div>
                  <p className="text-5xl font-bold text-green-100 mb-1">{result.total_score}</p>
                  <div className="h-1 bg-green-500/20 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400 progress-animate"
                      style={{ width: `${result.total_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-cyan-950/20 p-6 backdrop-blur-sm card-hover">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-blue-200/80">Accuracy</p>
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-4xl font-bold text-blue-100 mb-1">{result.accuracy_percent.toFixed(1)}%</p>
                  <p className="text-xs text-blue-300/60 mt-2">Precision metric</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-pink-950/20 p-6 backdrop-blur-sm card-hover">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-purple-200/80">Skill Level</p>
                    <span className="text-2xl">⭐</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-100 capitalize mb-1">{result.aptitude_level}</p>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                    result.aptitude_level === 'advanced' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    result.aptitude_level === 'intermediate' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {result.aptitude_level === 'advanced' && '🚀 Expert'}
                    {result.aptitude_level === 'intermediate' && '📈 Growing'}
                    {result.aptitude_level === 'beginner' && '🌱 Learning'}
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-blue-950/20 p-6 backdrop-blur-sm card-hover">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-cyan-200/80">Proctoring</p>
                    <span className="text-2xl">🎥</span>
                  </div>
                  <p className="text-4xl font-bold text-cyan-100 mb-1">{result.proctoring_score || 100}</p>
                  <p className="text-xs text-cyan-300/60 mt-2">Integrity score</p>
                </div>
              </div>
            </div>

            {/* Section Scores */}
            {result.section_scores && (
              <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/30 p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                    📈
                  </span>
                  Section Breakdown
                </h2>
                <div className="space-y-6">
                  {Object.entries(result.section_scores).map(([section, score]) => {
                    const sectionData = SECTIONS.find(s => s.id === section)
                    return (
                      <div key={section} className="group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{sectionData?.icon}</span>
                            <div>
                              <p className="text-base font-semibold text-slate-200 capitalize">{section}</p>
                              <p className="text-xs text-slate-400">{sectionData?.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{score}%</p>
                            <p className={`text-xs font-medium ${
                              score >= 80 ? 'text-green-400' :
                              score >= 60 ? 'text-blue-400' :
                              score >= 40 ? 'text-amber-400' :
                              'text-red-400'
                            }`}>
                              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work'}
                            </p>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                          <div
                            className={`h-full bg-gradient-to-r ${sectionData?.gradient || 'from-blue-500 to-blue-600'} progress-animate shadow-lg`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Aptitude Level Info */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/20 p-8 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-3xl">
                  {result.aptitude_level === 'advanced' && '🏆'}
                  {result.aptitude_level === 'intermediate' && '💪'}
                  {result.aptitude_level === 'beginner' && '🎯'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-3">Your Aptitude Level</h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    {result.aptitude_level === 'advanced' && 
                      'Outstanding performance! You demonstrate advanced aptitude. You\'re well-prepared for challenging roles and complex problem-solving tasks.'}
                    {result.aptitude_level === 'intermediate' && 
                      'Solid foundation! You have intermediate aptitude. Focus on weak areas and consistent practice to reach advanced level.'}
                    {result.aptitude_level === 'beginner' && 
                      'Great start! You\'re building your foundation. Regular practice and focused learning will help you improve significantly.'}
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setResult(null)
                      setAnswers({})
                      setTabSwitches(0)
                      setProctoringViolations([])
                      setCurrentProctoringStatus(null)
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all transform hover:scale-105"
                  >
                    <span>Take Another Test</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {SECTIONS.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                style={{ animationDelay: `${index * 100}ms` }}
                className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/60 to-slate-800/30 p-8 hover:border-slate-600 transition-all duration-300 card-hover backdrop-blur-sm reveal"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Corner accent */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${section.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
                
                <div className="relative space-y-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${section.gradient} bg-opacity-10 border border-${section.color}-500/20 text-4xl group-hover:scale-110 transition-transform duration-300`}>
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{section.label}</h3>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                      {section.description}
                    </p>
                  </div>
                  <div className={`inline-flex items-center gap-2 text-sm font-medium text-${section.color}-400 group-hover:gap-3 transition-all`}>
                    <span>Start Assessment</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-600/5 p-4 backdrop-blur-sm animate-in slide-in-from-top">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-red-100 font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-purple-500 border-t-transparent animate-spin-slow"></div>
          </div>
          <div>
            <p className="text-xl font-semibold text-white mb-2">Loading questions...</p>
            <p className="text-sm text-slate-400">Preparing your assessment</p>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-8 text-center backdrop-blur-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-3xl mb-4">
          📭
        </div>
        <h3 className="text-xl font-bold text-amber-100 mb-2">No Questions Available</h3>
        <p className="text-amber-200/80 mb-6">There are no questions available for this section. Please try another section.</p>
        <button
          onClick={() => setCurrentSection(null)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Sections</span>
        </button>
      </div>
    )
  }

  const question = questions[currentQuestionIndex]
  const sectionName = SECTIONS.find(s => s.id === currentSection)?.label
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="space-y-6">
      {/* Camera Preview (hidden) */}
      <div style={{ display: 'none' }}>
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>

      {/* Proctoring Status Bar */}
      {(tabSwitches > 0 || proctoringViolations.length > 0 || currentProctoringStatus) && (
        <div className={`rounded-lg border p-4 ${
          tabSwitches > 3 || proctoringViolations.length > 5
            ? 'border-red-500/40 bg-red-500/10 text-red-100' 
            : proctoringViolations.length > 0
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
            : 'border-green-500/40 bg-green-500/10 text-green-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium flex items-center gap-2">
                {cameraEnabled ? '🎥' : '📷'} Proctoring Monitor 
                {currentProctoringStatus?.status === 'ok' && <span className="text-green-400">✓ Active</span>}
                {currentProctoringStatus?.status === 'violation' && <span className="text-red-400">⚠ Violation</span>}
              </p>
              <div className="text-sm space-y-1">
                <p>Tab switches: {tabSwitches}</p>
                <p>Camera violations: {proctoringViolations.length}</p>
                {currentProctoringStatus && (
                  <p className="text-xs opacity-80">{currentProctoringStatus.message}</p>
                )}
              </div>
            </div>
            {(tabSwitches > 3 || proctoringViolations.length > 5) && (
              <p className="text-sm font-bold">⚠️ Multiple violations detected!</p>
            )}
          </div>
        </div>
      )}

      {/* Camera Status Indicator */}
      {cameraEnabled && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Camera monitoring active</span>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{sectionName}</h1>
          <p className="text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading || Object.keys(answers).length === 0}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            title="Exit test early and get score for answered questions"
          >
            🚪 Exit & Get Score
          </button>
          <button
            onClick={() => {
              const confirmBack = window.confirm(
                '⚠️ Are you sure you want to go back?\n\nYour progress will be lost and the test will not be submitted.'
              )
              if (confirmBack) {
                setCurrentSection(null)
                setIsTestActive(false)
                setAnswers({})
                stopCamera()
              }
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-6">
        <div>
          <p className="text-slate-400 text-sm mb-2">Question {currentQuestionIndex + 1}</p>
          <h2 className="text-xl font-semibold text-white">{question.question_text}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options && question.options.map((option, idx) => {
            const optionKey = String.fromCharCode(65 + idx) // A, B, C, D
            const isSelected = answers[question.id] === optionKey
            
            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(question.id, optionKey)}
                className={`w-full p-4 rounded-lg border-2 text-left font-medium transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/30 text-white'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="mr-3 font-bold">{optionKey}.</span>
                {option}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="text-center">
          <p className="text-slate-400 text-sm">
            Answered: <strong className="text-white">{Object.keys(answers).length}</strong> / {questions.length}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            You can exit anytime to get your score
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
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 transition-colors font-semibold"
          >
            {loading ? 'Submitting...' : 'Submit Test'}
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
