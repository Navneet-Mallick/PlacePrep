import { useState } from 'react'

const ML_API_URL = 'http://localhost:8001/api'

const PROBLEMS = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers and a target, find the two numbers that add up to the target. Return their indices.",
    starter: `def twoSum(nums, target):
    # Write your solution here
    pass

# Test case
nums = [2, 7, 11, 15]
target = 9
print(twoSum(nums, target))`,
    expected: "[0, 1]",
    explanation: "Use a hash map to store seen numbers for O(n) time complexity"
  },
  {
    id: 2,
    title: "Reverse Integer",
    difficulty: "Easy",
    description: "Given a 32-bit signed integer, reverse its digits. Handle overflow by returning 0.",
    starter: `def reverse(x):
    # Write your solution here
    pass

# Test case
print(reverse(123))
print(reverse(-123))
print(reverse(120))`,
    expected: "123\\n-123\\n21",
    explanation: "Reverse digits while respecting the sign and 32-bit bounds"
  },
  {
    id: 3,
    title: "Palindrome Number",
    difficulty: "Easy",
    description: "Determine if an integer is a palindrome without converting to string.",
    starter: `def isPalindrome(x):
    # Write your solution here
    pass

# Test case
print(isPalindrome(121))
print(isPalindrome(-121))
print(isPalindrome(10))`,
    expected: "True\\nFalse\\nFalse",
    explanation: "Negative numbers and numbers ending with 0 cannot be palindromes"
  },
  {
    id: 4,
    title: "Binary Search",
    difficulty: "Medium",
    description: "Given a sorted array and a target, find its index. Return -1 if not found.",
    starter: `def search(nums, target):
    # Write your solution here
    pass

# Test case
print(search([-1, 0, 3, 5, 9, 12], 9))
print(search([-1, 0, 3, 5, 9, 12], 13))`,
    expected: "4\\n-1",
    explanation: "Use binary search for O(log n) time complexity"
  },
  {
    id: 5,
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: "Check if a string containing parentheses is valid. All brackets must be properly closed.",
    starter: `def isValid(s):
    # Write your solution here
    pass

# Test case
print(isValid("()"))
print(isValid("()[]{}"))
print(isValid("(]"))
print(isValid("([)]"))`,
    expected: "True\\nTrue\\nFalse\\nFalse",
    explanation: "Use a stack to match opening and closing brackets"
  },
  {
    id: 6,
    title: "Merge Sorted Arrays",
    difficulty: "Easy",
    description: "Merge two sorted arrays into one sorted array.",
    starter: `def merge(arr1, arr2):
    # Write your solution here
    pass

# Test case
print(merge([1, 3, 5], [2, 4, 6]))
print(merge([1], [0]))`,
    expected: "[1, 2, 3, 4, 5, 6]\\n[0, 1]",
    explanation: "Use two pointers for O(n+m) time complexity"
  },
  {
    id: 7,
    title: "Fibonacci Sequence",
    difficulty: "Easy",
    description: "Return the n-th Fibonacci number.",
    starter: `def fibonacci(n):
    # Write your solution here
    pass

# Test case
print(fibonacci(0))
print(fibonacci(1))
print(fibonacci(6))`,
    expected: "0\\n1\\n8",
    explanation: "Consider using memoization for better performance"
  },
  {
    id: 8,
    title: "Remove Duplicates",
    difficulty: "Medium",
    description: "Remove duplicates from sorted array in-place. Return count of unique elements.",
    starter: `def removeDuplicates(nums):
    # Write your solution here
    pass

# Test case
nums1 = [1, 1, 2]
nums2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
print(removeDuplicates(nums1))
print(removeDuplicates(nums2))`,
    expected: "2\\n5",
    explanation: "Use two pointers technique for O(n) time and O(1) space"
  }
]

export default function CodePractice() {
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [code, setCode] = useState('')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSelectProblem = (problem) => {
    setSelectedProblem(problem)
    setCode(problem.starter)
    setOutput('')
    setError('')
    setInput('')
  }

  const handleRun = async () => {
    if (!code.trim()) {
      setError('Please write some code to execute')
      return
    }

    setLoading(true)
    setError('')
    setOutput('')

    try {
      const response = await fetch(`${ML_API_URL}/python/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          input_data: input
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setOutput(result.output || '(No output)')
      } else {
        setError(result.error || 'Error executing code')
        setOutput(result.output || '')
      }
    } catch (err) {
      setError(`Failed to execute: ${err.message}`)
      setOutput('')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setCode('')
    setInput('')
    setOutput('')
    setError('')
  }

  // List View
  if (!selectedProblem) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Code Practice</h1>
          <p className="mt-2 text-gray-400">
            Practice coding problems and improve your skills
          </p>
        </div>

        <div className="grid gap-3">
          {PROBLEMS.map((problem) => (
            <button
              key={problem.id}
              onClick={() => handleSelectProblem(problem)}
              className="text-left p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 hover:bg-gray-100 dark:bg-zinc-800 hover:border-gray-200 dark:border-zinc-600 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{problem.title}</span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      problem.difficulty === 'Easy'
                        ? 'bg-green-900/40 text-green-300'
                        : problem.difficulty === 'Medium'
                        ? 'bg-yellow-900/40 text-yellow-300'
                        : 'bg-red-900/40 text-red-300'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{problem.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedProblem(null)
            handleClear()
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">{selectedProblem.title}</h1>
        <div className={`px-3 py-1 rounded text-sm font-medium ${
          selectedProblem.difficulty === 'Easy'
            ? 'bg-green-900/40 text-green-300'
            : selectedProblem.difficulty === 'Medium'
            ? 'bg-yellow-900/40 text-yellow-300'
            : 'bg-red-900/40 text-red-300'
        }`}>
          {selectedProblem.difficulty}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-200px)]">
        {/* Left: Problem Description */}
        <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 p-6 overflow-y-auto space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
            <p className="text-gray-300 leading-relaxed">{selectedProblem.description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Expected Output</h3>
            <pre className="bg-gray-100 dark:bg-zinc-950 p-3 rounded text-green-300 font-mono text-sm border border-gray-200 dark:border-zinc-700">
              {selectedProblem.expected}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Hint</h3>
            <p className="text-gray-300 text-sm leading-relaxed italic">
              💡 {selectedProblem.explanation}
            </p>
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 p-4 flex flex-col space-y-3">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-300">Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-white font-mono text-sm placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              spellCheck="false"
            />
          </div>

          {/* Input (optional) */}
          <div className="flex-col space-y-2 hidden">
            <label className="text-sm font-medium text-gray-300">Input</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input..."
              rows="2"
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-white font-mono text-sm placeholder-slate-600 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Output */}
          {output && (
            <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-3">
              <p className="text-xs font-medium text-green-200 mb-1">Output</p>
              <pre className="text-green-300 font-mono text-xs whitespace-pre-wrap max-h-24 overflow-auto">
                {output}
              </pre>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3">
              <p className="text-xs font-medium text-red-200 mb-1">Error</p>
              <pre className="text-red-300 font-mono text-xs whitespace-pre-wrap max-h-24 overflow-auto">
                {error}
              </pre>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={loading || !code.trim()}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Running
                </>
              ) : (
                <>
                  ▶ Run
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="flex-1 rounded-lg bg-slate-700 px-4 py-2 font-medium text-white hover:bg-slate-600 transition-colors text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
