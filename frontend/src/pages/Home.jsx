import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  { title: 'Resume Analysis', description: 'Upload your resume. Get NLP-powered entity extraction, role prediction, and scoring.', to: '/resume' },
  { title: 'Aptitude Tests', description: 'Quantitative, logical, and technical MCQs with proctoring and professional scoring.', to: '/aptitude' },
  { title: 'Technical Assessment', description: 'Subjective questions evaluated using semantic similarity. Real placement-style questions.', to: '/technical' },
  { title: 'Code Practice', description: 'Write and run Python code against real problems. LeetCode-style with instant execution.', to: '/practice' },
]

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-20 py-8">
      <section className="max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          Placement preparation,<br />done right.
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-zinc-400 leading-relaxed">
          Resume analysis, aptitude tests, technical assessments, and code practice — 
          all backed by machine learning. One platform, no fluff.
        </p>
        <div className="mt-8 flex gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md text-sm hover:bg-blue-700">
                Go to Dashboard
              </Link>
              <Link to="/resume" className="px-5 py-2.5 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 font-medium rounded-md text-sm hover:border-gray-400 dark:hover:border-zinc-500">
                Analyze Resume
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md text-sm hover:bg-blue-700">
                Get Started
              </Link>
              <Link to="/login" className="px-5 py-2.5 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 font-medium rounded-md text-sm hover:border-gray-400 dark:hover:border-zinc-500">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-6">Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <Link key={f.title} to={isAuthenticated ? f.to : '/register'}
              className="p-5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 hover:bg-gray-100 dark:hover:bg-zinc-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{f.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-6">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['Upload your resume for AI analysis', 'Take aptitude and technical tests', 'Get scored with ML-based evaluation', 'Track progress and improve weak areas'].map((text, i) => (
            <div key={i} className="space-y-2">
              <span className="text-xs font-mono text-gray-400 dark:text-zinc-600">0{i + 1}</span>
              <p className="text-sm text-gray-700 dark:text-zinc-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-200 dark:border-zinc-800 pt-8">
        <p className="text-xs text-gray-400 dark:text-zinc-600 max-w-xl">
          Built with Django, FastAPI, React, scikit-learn, spaCy, OpenCV, and Google Gemini.
        </p>
      </section>
    </div>
  )
}
