import { useState, useEffect } from 'react'

const ML_API_URL = 'http://localhost:8001/api'

const diffBadge = (d) =>
  d === 'Easy' ? 'badge-green' : d === 'Medium' ? 'badge-amber' : 'badge-red'

export default function CodePractice() {
  const [tab, setTab] = useState('problems') // 'problems' | 'terminal'
  const [problems, setProblems] = useState([])
  const [selected, setSelected] = useState(null)
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProblems, setLoadingProblems] = useState(true)

  useEffect(() => {
    fetch('/coding_problems.json')
      .then(r => r.json())
      .then(setProblems)
      .catch(() => {})
      .finally(() => setLoadingProblems(false))
  }, [])

  function selectProblem(p) {
    setSelected(p)
    setCode(p.starter)
    setOutput('')
    setError('')
    setInput('')
  }

  async function runCode() {
    if (!code.trim()) { setError('Write some code first.'); return }
    setLoading(true)
    setOutput('')
    setError('')
    try {
      const res = await fetch(`${ML_API_URL}/python/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, input_data: input }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      if (data.success) {
        setOutput(data.output || '(no output)')
      } else {
        setError(data.error || 'Execution failed')
        if (data.output) setOutput(data.output)
      }
    } catch (err) {
      setError(`Could not run code: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Code Practice</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
            Solve problems or use the free terminal to run any Python code.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        <button
          onClick={() => { setTab('problems'); setSelected(null); setCode(''); setOutput(''); setError('') }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'problems'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
          }`}
        >
          Problems
        </button>
        <button
          onClick={() => { setTab('terminal'); setSelected(null); setCode('# Write any Python code here\nprint("Hello, World!")'); setOutput(''); setError(''); setInput('') }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'terminal'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
          }`}
        >
          Python Terminal
        </button>
      </div>

      {/* === PROBLEMS TAB === */}
      {tab === 'problems' && !selected && (
        loadingProblems ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden divide-y divide-gray-200 dark:divide-zinc-800">
            {problems.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProblem(p)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/60"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400 dark:text-zinc-600">
                      {String(p.id).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{p.title}</span>
                    <span className={`badge ${diffBadge(p.difficulty)}`}>{p.difficulty}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 truncate">{p.description}</p>
                </div>
                <svg className="w-4 h-4 flex-shrink-0 text-gray-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )
      )}

      {/* === PROBLEM EDITOR === */}
      {tab === 'problems' && selected && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <button onClick={() => setSelected(null)} className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white">
              ← All problems
            </button>
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-gray-900 dark:text-white">{selected.title}</span>
              <span className={`badge ${diffBadge(selected.difficulty)}`}>{selected.difficulty}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Left: description */}
            <div className="card space-y-4">
              <div>
                <p className="section-label mb-2">Problem</p>
                <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{selected.description}</p>
              </div>
              <div>
                <p className="section-label mb-2">Expected output</p>
                <pre className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-sm font-mono text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">
                  {selected.expected}
                </pre>
              </div>
              <div>
                <p className="section-label mb-2">Hint</p>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{selected.hint}</p>
              </div>
            </div>

            {/* Right: editor */}
            <div className="space-y-3">
              <Editor code={code} setCode={setCode} />
              <Actions run={runCode} reset={() => setCode(selected.starter)} loading={loading} disabled={!code.trim()} />
              <Output output={output} error={error} />
            </div>
          </div>
        </div>
      )}

      {/* === TERMINAL TAB === */}
      {tab === 'terminal' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Free-form Python execution. Write any code, provide stdin input, and run.
          </p>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Code */}
            <div className="lg:col-span-2 space-y-3">
              <Editor code={code} setCode={setCode} rows={18} />
              <Actions run={runCode} reset={() => { setCode('# Write any Python code here\n'); setOutput(''); setError('') }} loading={loading} disabled={!code.trim()} />
            </div>

            {/* Right panel: input + output */}
            <div className="space-y-3">
              <div className="card !p-0 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">stdin (input)</span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter input here (one value per line)..."
                  rows={5}
                  className="!rounded-none !border-0 font-mono text-sm resize-none focus:!ring-0"
                />
              </div>
              <Output output={output} error={error} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Sub-components ---

function Editor({ code, setCode, rows = 14 }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">solution.py</span>
        <span className="text-xs text-gray-400 dark:text-zinc-600">Python 3</span>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck="false"
        rows={rows}
        className="!rounded-none !border-0 !bg-transparent font-mono text-sm resize-none focus:!ring-0"
      />
    </div>
  )
}

function Actions({ run, reset, loading, disabled }) {
  return (
    <div className="flex gap-2">
      <button onClick={run} disabled={loading || disabled} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? 'Running...' : 'Run code'}
      </button>
      <button onClick={reset} className="btn-secondary">Reset</button>
    </div>
  )
}

function Output({ output, error }) {
  return (
    <>
      {output && (
        <div className="card !p-0 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-800">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Output</span>
          </div>
          <pre className="px-4 py-3 text-sm font-mono text-gray-800 dark:text-zinc-200 whitespace-pre-wrap max-h-48 overflow-auto">
            {output}
          </pre>
        </div>
      )}
      {error && (
        <div className="card !p-0 overflow-hidden border-red-200 dark:border-red-900/50">
          <div className="px-4 py-2 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
            <span className="text-xs font-medium text-red-600 dark:text-red-400">Error</span>
          </div>
          <pre className="px-4 py-3 text-sm font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap max-h-48 overflow-auto">
            {error}
          </pre>
        </div>
      )}
    </>
  )
}
