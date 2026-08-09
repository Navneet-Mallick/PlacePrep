import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    title: 'Resume Analysis',
    description: 'Upload your resume. Get NLP-powered entity extraction, role prediction, and scoring.',
    to: '/resume',
  },
  {
    title: 'Aptitude Tests',
    description: 'Quantitative, logical, and technical MCQs with proctoring and professional scoring.',
    to: '/aptitude',
  },
  {
    title: 'Technical Assessment',
    description: 'Subjective questions evaluated using semantic similarity. Real placement-style questions.',
    to: '/technical',
  },
  {
    title: 'Code Practice',
    description: 'Write and run Python code against real problems. LeetCode-style with instant execution.',
    to: '/practice',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-20 py-8">
      {/* Hero */}
      <section className="max-w-2xl">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Placement preparation,<br />done right.
        </h1>
        <p className="mt-4 text-lg text-neutral-400 leading-relaxed">
          Resume analysis, aptitude tests, technical assessments, and code practice — 
          all backed by machine learning. One platform, no fluff.
        </p>
        <div className="mt-8 flex gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-white text-neutral-900 font-medium rounded-md text-sm hover:bg-neutral-200"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/resume"
                className="px-5 py-2.5 border border-neutral-700 text-neutral-300 font-medium rounded-md text-sm hover:border-neutral-500 hover:text-white"
              >
                Analyze Resume
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-white text-neutral-900 font-medium rounded-md text-sm hover:bg-neutral-200"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 border border-neutral-700 text-neutral-300 font-medium rounded-md text-sm hover:border-neutral-500 hover:text-white"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-6">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={isAuthenticated ? feature.to : '/register'}
              className="group p-5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
            >
              <h3 className="text-sm font-semibold text-white mb-1.5">{feature.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-6">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', text: 'Upload your resume for AI analysis' },
            { step: '02', text: 'Take aptitude and technical tests' },
            { step: '03', text: 'Get scored with ML-based evaluation' },
            { step: '04', text: 'Track progress and improve weak areas' },
          ].map((item) => (
            <div key={item.step} className="space-y-2">
              <span className="text-xs font-mono text-neutral-600">{item.step}</span>
              <p className="text-sm text-neutral-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack note */}
      <section className="border-t border-neutral-800 pt-8">
        <p className="text-xs text-neutral-600 max-w-xl">
          Built with Django, FastAPI, React, scikit-learn, spaCy, OpenCV, and Google Gemini. 
          All ML models run locally — no data leaves your instance.
        </p>
      </section>
    </div>
  )
}
