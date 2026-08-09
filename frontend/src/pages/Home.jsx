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
        <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">
          Placement preparation,<br />done right.
        </h1>
        <p className="mt-4 text-lg text-[var(--text-muted)] leading-relaxed">
          Resume analysis, aptitude tests, technical assessments, and code practice — 
          all backed by machine learning. One platform, no fluff.
        </p>
        <div className="mt-8 flex gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-[var(--accent)] text-white font-medium rounded-md text-sm hover:bg-[var(--accent-hover)]"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/resume"
                className="px-5 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] font-medium rounded-md text-sm hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
              >
                Analyze Resume
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-[var(--accent)] text-white font-medium rounded-md text-sm hover:bg-[var(--accent-hover)]"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] font-medium rounded-md text-sm hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-6">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={isAuthenticated ? feature.to : '/register'}
              className="group p-5 rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{feature.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-6">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', text: 'Upload your resume for AI analysis' },
            { step: '02', text: 'Take aptitude and technical tests' },
            { step: '03', text: 'Get scored with ML-based evaluation' },
            { step: '04', text: 'Track progress and improve weak areas' },
          ].map((item) => (
            <div key={item.step} className="space-y-2">
              <span className="text-xs font-mono text-[var(--text-faint)]">{item.step}</span>
              <p className="text-sm text-[var(--text-secondary)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech note */}
      <section className="border-t border-[var(--border)] pt-8">
        <p className="text-xs text-[var(--text-faint)] max-w-xl">
          Built with Django, FastAPI, React, scikit-learn, spaCy, OpenCV, and Google Gemini. 
          All ML models run locally — no data leaves your instance.
        </p>
      </section>
    </div>
  )
}
