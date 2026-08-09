import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    title: 'Resume Analysis',
    desc: 'Upload PDF or DOCX. Get NLP entity extraction, role prediction with confidence scores, and Gemini AI recommendations.',
    to: '/resume',
  },
  {
    title: 'Aptitude Tests',
    desc: 'Quantitative, logical, and technical MCQs. Camera proctoring with face detection. ML-based level prediction.',
    to: '/aptitude',
  },
  {
    title: 'Technical Assessment',
    desc: 'Subjective answers scored using TF-IDF + semantic similarity. Covers DSA, DBMS, OS, Networks and more.',
    to: '/technical',
  },
  {
    title: 'Code Practice',
    desc: 'LeetCode-style Python problems with sandboxed execution. Write, run, and debug code in the browser.',
    to: '/practice',
  },
]

const stats = [
  { value: '500+', label: 'Aptitude Questions' },
  { value: '60+', label: 'Technical Questions' },
  { value: '8', label: 'Coding Problems' },
  { value: 'AI', label: 'Powered Scoring' },
]

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-5xl mx-auto">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 tracking-wide">
              ML-Powered Placement Training
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
            Prepare smarter.<br />
            <span className="text-blue-600 dark:text-blue-400">Get placed faster.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-500 dark:text-zinc-400 leading-relaxed">
            Resume analysis, aptitude tests, technical assessments, and code practice — 
            all in one platform. Every evaluation is powered by machine learning.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-primary text-center">
                  Go to Dashboard
                </Link>
                <Link to="/resume" className="btn-secondary text-center">
                  Analyze Resume
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-center">
                  Get Started — It's Free
                </Link>
                <Link to="/login" className="btn-secondary text-center">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 py-8 border-y border-gray-100 dark:border-zinc-800">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-16 max-w-5xl mx-auto">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Everything you need to prepare
          </h2>
          <p className="mt-2 text-gray-500 dark:text-zinc-400">
            Four modules, one platform. Each backed by real ML models.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <Link
              key={f.title}
              to={isAuthenticated ? f.to : '/register'}
              className="group p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <span className="text-xs font-mono font-semibold text-blue-500 dark:text-blue-400">
                  0{i + 1}
                </span>
                <svg
                  className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-blue-400 transition-colors"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-12 max-w-5xl mx-auto border-t border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-10">How it works</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Upload', desc: 'Submit your resume for AI analysis' },
            { step: '02', title: 'Assess', desc: 'Take aptitude and technical tests' },
            { step: '03', title: 'Evaluate', desc: 'Get ML-scored results instantly' },
            { step: '04', title: 'Improve', desc: 'Track gaps and work on weak areas' },
          ].map((s) => (
            <div key={s.step}>
              <p className="text-xs font-mono font-semibold text-blue-500 dark:text-blue-400 mb-3">{s.step}</p>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{s.title}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="px-4 sm:px-6 py-16 max-w-5xl mx-auto">
          <div className="rounded-2xl bg-blue-600 dark:bg-blue-700 px-8 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to get started?
            </h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Create a free account and start preparing for your placement interviews today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 text-center"
              >
                Create free account
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border border-blue-400 text-white font-semibold rounded-lg hover:bg-blue-500/30 text-center"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Tech footer */}
      <section className="px-4 sm:px-6 pb-12 max-w-5xl mx-auto">
        <p className="text-xs text-gray-400 dark:text-zinc-600">
          Built with Django · FastAPI · React · scikit-learn · spaCy · OpenCV · PostgreSQL · Gemini AI
        </p>
      </section>
    </div>
  )
}
