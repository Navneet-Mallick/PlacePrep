import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    title: 'Resume Analysis',
    desc: 'Upload your resume and get instant feedback — role prediction, skill extraction, and improvement suggestions.',
    to: '/resume',
  },
  {
    title: 'Aptitude Tests',
    desc: 'Timed MCQs across quantitative, logical, and technical domains with ML-based scoring.',
    to: '/aptitude',
  },
  {
    title: 'Technical Assessment',
    desc: 'Answer subjective questions and get scored on how well you explain core CS concepts.',
    to: '/technical',
  },
  {
    title: 'Code Practice',
    desc: 'Solve coding problems, run your code instantly, and compare output against expected results.',
    to: '/practice',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-[80vh]">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
            Prepare smarter.<br />
            <span className="text-blue-600 dark:text-blue-400">Get placed faster.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-zinc-400 leading-relaxed">
            One platform for resume analysis, aptitude tests, technical assessments,
            and coding practice — with real-time proctoring and AI-powered evaluation.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-primary text-center">Dashboard</Link>
                <Link to="/resume" className="btn-secondary text-center">Analyze Resume</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-center">Get Started Free</Link>
                <Link to="/login" className="btn-secondary text-center">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-t border-gray-200 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
          What you can do
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <Link
              key={f.title}
              to={isAuthenticated ? f.to : '/register'}
              className="card card-hover group"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                {f.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA for guests */}
      {!isAuthenticated && (
        <section className="py-12 border-t border-gray-200 dark:border-zinc-800">
          <div className="rounded-2xl bg-blue-600 dark:bg-blue-700 px-6 sm:px-10 py-10 sm:py-14 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Ready to start preparing?
            </h2>
            <p className="text-blue-100 mb-8 max-w-md mx-auto">
              Create a free account and begin your placement journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 text-center">
                Create free account
              </Link>
              <Link to="/login" className="px-6 py-3 border border-blue-300 text-white font-semibold rounded-lg hover:bg-blue-600 text-center">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
