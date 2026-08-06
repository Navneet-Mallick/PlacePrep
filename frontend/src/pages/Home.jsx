import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: '📄',
    title: 'Resume Analysis',
    description: 'Upload your resume and get AI-powered insights, skills extraction, and predicted job roles.',
    to: '/resume',
  },
  {
    icon: '🧠',
    title: 'Aptitude Tests',
    description: 'Master quantitative reasoning, logical thinking, and verbal ability with timed assessments.',
    to: '/aptitude',
  },
  {
    icon: '💻',
    title: 'Technical Assessment',
    description: 'Solve real-world coding problems and get detailed feedback on your solutions.',
    to: '/technical',
  },
  {
    icon: '📊',
    title: 'Performance Dashboard',
    description: 'Track your progress, identify weak areas, and get personalized learning paths.',
    to: '/dashboard',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative py-20 px-4 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl"></div>
        <div className="relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-blue-400 text-sm font-semibold">🎯 Your Path to Success</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Master Your Placement Preparation
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Everything you need in one intelligent platform. Analyze your resume, practice aptitude, master technical concepts, and track your readiness with data-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/resume"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                  >
                    Start Analyzing →
                  </Link>
                  <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                  >
                    View Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                  >
                    Get Started →
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { number: '565+', label: 'Aptitude Questions' },
          { number: '8+', label: 'Technical Topics' },
          { number: '100%', label: 'AI-Powered Analysis' },
          { number: '24/7', label: 'Available Access' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg text-center"
          >
            <div className="text-3xl font-bold text-blue-400 mb-2">{stat.number}</div>
            <div className="text-gray-300">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Features Grid */}
      <section>
        <h2 className="text-4xl font-bold text-white mb-12 text-center">
          Everything You Need to <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Succeed</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={isAuthenticated ? feature.to : '/register'}
              className="group p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-blue-500/20 rounded-xl hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                {feature.description}
              </p>
              <div className="mt-4 text-blue-400 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block">
                Learn More →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="relative py-16 px-8 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 blur-xl"></div>
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Career?</h2>
            <p className="text-gray-300 mb-8">
              Join thousands of students preparing for their dream placements with PlacementPrep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
              >
                Already Have Account?
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
