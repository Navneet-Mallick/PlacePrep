import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  { title: 'Resume Analysis', desc: 'NLP-powered entity extraction, role prediction, and AI recommendations using spaCy + Gemini.', to: '/resume', icon: '📄' },
  { title: 'Aptitude Assessment', desc: 'Timed MCQs across quantitative, logical, and technical domains with ML-based level prediction.', to: '/aptitude', icon: '🧠' },
  { title: 'Technical Evaluation', desc: 'Subjective answer scoring using TF-IDF cosine similarity with synonym-aware semantic matching.', to: '/technical', icon: '⚙️' },
  { title: 'Code Practice', desc: 'LeetCode-style Python problems with sandboxed execution and instant output feedback.', to: '/practice', icon: '💻' },
]

const techStack = ['Django REST', 'FastAPI', 'React', 'scikit-learn', 'spaCy', 'OpenCV', 'Gemini AI', 'PostgreSQL']

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-24 py-4">
      {/* Hero */}
      <section className="max-w-2xl pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-6">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">ML-Powered Platform</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-[1.1]">
          Your complete placement<br />preparation system.
        </h1>
        <p className="mt-5 text-lg text-gray-500 dark:text-zinc-400 leading-relaxed max-w-lg">
          Analyze resumes, practice aptitude, solve technical questions, and write code — all evaluated by machine learning models trained on real data.
        </p>
        <div className="mt-8 flex gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
              <Link to="/resume" className="btn-secondary">Analyze Resume</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-primary">Get Started Free</Link>
              <Link to="/login" className="btn-secondary">Sign in</Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800"></div>
          <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Core Modules</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <Link key={f.title} to={isAuthenticated ? f.to : '/register'}
              className="card card-hover group cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-8">How it works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { num: '01', title: 'Upload', desc: 'Submit your resume for AI analysis' },
            { num: '02', title: 'Assess', desc: 'Take aptitude & technical tests' },
            { num: '03', title: 'Evaluate', desc: 'ML models score your performance' },
            { num: '04', title: 'Improve', desc: 'Track progress & fix weak areas' },
          ].map((s) => (
            <div key={s.num}>
              <span className="text-xs font-mono text-blue-500 dark:text-blue-400 font-semibold">{s.num}</span>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-2 mb-1">{s.title}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-t border-gray-200 dark:border-zinc-800 pt-10">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-5">Built with</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-xs font-medium text-gray-600 dark:text-zinc-400 border border-gray-200/50 dark:border-zinc-700/50">
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
