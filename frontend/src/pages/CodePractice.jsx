import { useState } from 'react'

const ML_API_URL = 'http://localhost:8001/api'

const PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target.',
    starter: `def twoSum(nums, target):
    # Write your solution here
    pass

print(twoSum([2, 7, 11, 15], 9))`,
    expected: '[0, 1]',
    hint: 'Use a hash map to store seen numbers for O(n) time complexity.',
  },
  {
    id: 2,
    title: 'Reverse Integer',
    difficulty: 'Easy',
    description: 'Given a 32-bit signed integer, reverse its digits. Return 0 on overflow.',
    starter: `def reverse(x):
    # Write your solution here
    pass

print(reverse(123))
print(reverse(-123))
print(reverse(120))`,
    expected: '321\n-321\n21',
    hint: 'Handle the sign separately and check 32-bit bounds.',
  },
  {
    id: 3,
    title: 'Palindrome Number',
    difficulty: 'Easy',
    description: 'Determine if an integer is a palindrome without converting it to a string.',
    starter: `def isPalindrome(x):
    # Write your solution here
    pass

print(isPalindrome(121))
print(isPalindrome(-121))
print(isPalindrome(10))`,
    expected: 'True\nFalse\nFalse',
    hint: 'Negative numbers are never palindromes. Reverse half the digits.',
  },
  {
    id: 4,
    title: 'Binary Search',
    difficulty: 'Medium',
    description: 'Given a sorted array and a target, return its index or -1 if not found.',
    starter: `def search(nums, target):
    # Write your solution here
    pass

print(search([-1, 0, 3, 5, 9, 12], 9))
print(search([-1, 0, 3, 5, 9, 12], 13))`,
    expected: '4\n-1',
    hint: 'Maintain low and high pointers, halve the range each step.',
  },
  {
    id: 5,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: 'Check whether a string of brackets is validly opened and closed in order.',
    starter: `def isValid(s):
    # Write your solution here
    pass

print(isValid("()"))
print(isValid("()[]{}"))
print(isValid("(]"))
print(isValid("([)]"))`,
    expected: 'True\nTrue\nFalse\nFalse',
    hint: 'Push opening brackets onto a stack, pop and match on closing.',
  },
  {
    id: 6,
    title: 'Merge Sorted Arrays',
    difficulty: 'Easy',
    description: 'Merge two sorted arrays into a single sorted array.',
    starter: `def merge(arr1, arr2):
    # Write your solution here
    pass

print(merge([1, 3, 5], [2, 4, 6]))
print(merge([1], [0]))`,
    expected: '[1, 2, 3, 4, 5, 6]\n[0, 1]',
    hint: 'Two pointers, compare heads and advance the smaller one.',
  },
  {
    id: 7,
    title: 'Fibonacci Number',
    difficulty: 'Easy',
    description: 'Return the n-th Fibonacci number where F(0)=0 and F(1)=1.',
    starter: `def fibonacci(n):
    # Write your solution here
    pass

print(fibonacci(0))
print(fibonacci(1))
print(fibonacci(6))`,
    expected: '0\n1\n8',
    hint: 'Iterative bottom-up avoids exponential recursion.',
  },
  {
    id: 8,
    title: 'Remove Duplicates',
    difficulty: 'Medium',
    description: 'Remove duplicates from a sorted array in place and return the count of unique elements.',
    starter: `def removeDuplicates(nums):
    # Write your solution here
    pass

print(removeDuplicates([1, 1, 2]))
print(removeDuplicates([0, 0, 1, 1, 1, 2, 2, 3, 3, 4]))`,
    expected: '2\n5',
    hint: 'Slow/fast pointer: write position advances only on new values.',
  },
]

const difficultyBadge = (d) =>
  d === 'Easy' ? 'badge-green' : d === 'Medium' ? 'badge-amber' : 'badge-red'

export default function CodePractice() {
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function selectProblem(problem) {
    setSelectedProblem(problem)
    setCode(problem.starter)
    setOutput('')
    setError('')
  }

  async function handleRun() {
    if (!code.trim()) {
      setError('Write some code before running.')
      return
    }
    setLoading(true)
    setError('')
    setOutput('')

    try {
      const response = await fetch(`${ML_API_URL}/python/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, input_data: '' }),
      })
      if (!response.ok) throw new Error(`Server responded ${response.status}`)

      const result = await response.json()
      if (result.success) {
        setOutput(result.output || '(no output)')
      } else {
        setError(result.error || 'Execution failed')
        setOutput(result.output || '')
      }
    } catch (err) {
      setError(`Could not run code: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ---------- Problem list ----------
  if (!selectedProblem) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Code Practice</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
            Solve Python problems with instant sandboxed execution.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          {PROBLEMS.map((problem, i) => (
            <button
              key={problem.id}
              onClick={() => selectProblem(problem)}
              className={`w-full text-left px-5 py-4 flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/60 ${
                i !== 0 ? 'border-t border-gray-200 dark:border-zinc-800' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 dark:text-zinc-600">
                    {String(problem.id).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{problem.title}</span>
                  <span className={`badge ${difficultyBadge(problem.difficulty)}`}>{problem.difficulty}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400 truncate">{problem.description}</p>
              </div>
              <svg className="w-4 h-4 flex-shrink-0 text-gray-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ---------- Editor ----------
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedProblem(null)}
          className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
        >
          ← All problems
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">{selectedProblem.title}</h1>
          <span className={`badge ${difficultyBadge(selectedProblem.difficulty)}`}>
            {selectedProblem.difficulty}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Description */}
        <div className="card space-y-5">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Problem
            </h2>
            <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
              {selectedProblem.description}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Expected output
            </h2>
            <pre className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-sm font-mono text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">
              {selectedProblem.expected}
            </pre>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Hint
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{selectedProblem.hint}</p>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-3">
          <div className="card !p-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">solution.py</span>
              <span className="text-xs text-gray-400 dark:text-zinc-600">Python 3</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              rows="16"
              className="!rounded-none !border-0 !bg-transparent font-mono text-sm resize-none focus:!ring-0"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={loading || !code.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Running...' : 'Run code'}
            </button>
            <button
              onClick={() => setCode(selectedProblem.starter)}
              className="btn-secondary"
            >
              Reset
            </button>
          </div>

          {output && (
            <div className="card">
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Output
              </p>
              <pre className="text-sm font-mono text-gray-800 dark:text-zinc-200 whitespace-pre-wrap max-h-40 overflow-auto">
                {output}
              </pre>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
              <p className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2">
                Error
              </p>
              <pre className="text-sm font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap max-h-40 overflow-auto">
                {error}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
