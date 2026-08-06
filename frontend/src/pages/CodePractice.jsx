import { useState } from 'react'

const ML_API_URL = 'http://localhost:8000/api'

const SAMPLE_PROBLEMS = [
  {
    id: 1,
    title: "Hello World",
    description: "Print 'Hello, World!'",
    starter: "print('Hello, World!')",
    expected: "Hello, World!"
  },
  {
    id: 2,
    title: "Sum of Two Numbers",
    description: "Take two numbers as input and print their sum",
    starter: "a = int(input())\nb = int(input())\nprint(a + b)",
    expected: "Output depends on input (e.g., 15 for inputs 7, 8)"
  },
  {
    id: 3,
    title: "Factorial",
    description: "Calculate factorial of a number",
    starter: `n = int(input())
result = 1
for i in range(1, n + 1):
    result *= i
print(result)`,
    expected: "120 (for input 5)"
  },
  {
    id: 4,
    title: "Fibonacci Series",
    description: "Print first N Fibonacci numbers",
    starter: `n = int(input())
a, b = 0, 1
for _ in range(n):
    print(a, end=' ')
    a, b = b, a + b`,
    expected: "0 1 1 2 3 (for input 5)"
  },
  {
    id: 5,
    title: "Check Prime Number",
    description: "Check if a number is prime",
    starter: `n = int(input())
is_prime = n > 1
for i in range(2, int(n**0.5) + 1):
    if n % i == 0:
        is_prime = False
        break
print(is_prime)`,
    expected: "True or False"
  }
]

const LEETCODE_PROBLEMS = [
  {
    id: 101,
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
    testInput: "",
    explanation: "nums[0] + nums[1] = 2 + 7 = 9"
  },
  {
    id: 102,
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
    testInput: "",
    explanation: "Simply reverse the digits while respecting the sign"
  },
  {
    id: 103,
    title: "Palindrome Number",
    difficulty: "Easy",
    description: "Determine if an integer is a palindrome. Do this without converting to string.",
    starter: `def isPalindrome(x):
    # Write your solution here
    pass

# Test case
print(isPalindrome(121))
print(isPalindrome(-121))
print(isPalindrome(10))`,
    expected: "True\\nFalse\\nFalse",
    testInput: "",
    explanation: "A negative number is not a palindrome. Check if reversed number equals original"
  },
  {
    id: 104,
    title: "Remove Duplicates from Sorted Array",
    difficulty: "Easy",
    description: "Remove duplicates from a sorted array in-place. Return the length of the array with unique elements.",
    starter: `def removeDuplicates(nums):
    # Write your solution here
    pass

# Test case
nums1 = [1, 1, 2]
nums2 = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
print(removeDuplicates(nums1))
print(removeDuplicates(nums2))`,
    expected: "2\\n5",
    testInput: "",
    explanation: "Use two pointers to track unique elements"
  },
  {
    id: 105,
    title: "Binary Search",
    difficulty: "Medium",
    description: "Given a sorted array and a target value, find its index. Return -1 if not found.",
    starter: `def search(nums, target):
    # Write your solution here
    pass

# Test case
print(search([−1, 0, 3, 5, 9, 12], 9))
print(search([−1, 0, 3, 5, 9, 12], 13))`,
    expected: "4\\n-1",
    testInput: "",
    explanation: "Use binary search for O(log n) time complexity"
  },
  {
    id: 106,
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: "Given a string containing parentheses, determine if it's valid. Valid means all brackets are properly closed.",
    starter: `def isValid(s):
    # Write your solution here
    pass

# Test case
print(isValid("()"))
print(isValid("()[]{}"))
print(isValid("(]"))
print(isValid("([)]"))`,
    expected: "True\\nTrue\\nFalse\\nFalse",
    testInput: "",
    explanation: "Use a stack to match opening and closing brackets"
  },
  {
    id: 107,
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    description: "Merge two sorted lists into one sorted list without extra space.",
    starter: `def mergeSortedArrays(arr1, arr2):
    # Write your solution here
    pass

# Test case
print(mergeSortedArrays([1, 3, 5], [2, 4, 6]))
print(mergeSortedArrays([1], [0]))`,
    expected: "[1, 2, 3, 4, 5, 6]\\n[0, 1]",
    testInput: "",
    explanation: "Use two pointers to merge arrays efficiently"
  }
]

export default function CodePractice() {
  const [code, setCode] = useState('# Write your Python code here\nprint("Hello, World!")')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showProblems, setShowProblems] = useState(false)
  const [showLeetCode, setShowLeetCode] = useState(false)
  const [selectedTab, setSelectedTab] = useState('practice') // 'practice' or 'leetcode'
  const [selectedProblem, setSelectedProblem] = useState(null)

  const handleLoadProblem = (problem) => {
    setCode(problem.starter)
    setInput('')
    setOutput('')
    setError('')
    setShowProblems(false)
    setShowLeetCode(false)
    setSelectedProblem(problem)
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

      const result = await response.json()

      if (result.success) {
        setOutput(result.output || '(No output)')
      } else {
        setError(result.error || 'Error executing code')
        setOutput(result.output || '')
      }
    } catch (err) {
      setError(`Failed to execute: ${err.message}`)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Python Code Practice</h1>
        <p className="mt-2 text-slate-400">
          Write and execute Python code directly in your browser. Practice any Python code with instant feedback!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {/* Sidebar - Quick Links & Problems */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleRun}
                disabled={loading}
                className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
              >
                {loading ? '▶ Running...' : '▶ Run Code'}
              </button>
              <button
                onClick={handleClear}
                className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="font-semibold text-white mb-3">📚 Practice Type</h3>
            <div className="space-y-2">
              <button
                onClick={() => { setSelectedTab('practice'); setShowProblems(!showProblems); setShowLeetCode(false); }}
                className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedTab === 'practice'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                🐍 Sample Problems
              </button>
              <button
                onClick={() => { setSelectedTab('leetcode'); setShowLeetCode(!showLeetCode); setShowProblems(false); }}
                className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedTab === 'leetcode'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                ⚡ LeetCode-Style
              </button>
            </div>
          </div>

          {/* Sample Problems Panel */}
          {showProblems && selectedTab === 'practice' && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-4">
              <h3 className="font-semibold text-white mb-3">Sample Problems</h3>
              <div className="space-y-2">
                {SAMPLE_PROBLEMS.map((problem) => (
                  <button
                    key={problem.id}
                    onClick={() => handleLoadProblem(problem)}
                    className="w-full text-left p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:border-indigo-500 transition-all text-sm"
                  >
                    <p className="font-medium truncate">{problem.title}</p>
                    <p className="text-xs text-slate-500 truncate mt-1">{problem.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LeetCode Problems Panel */}
          {showLeetCode && selectedTab === 'leetcode' && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
              <h3 className="font-semibold text-white mb-3">⚡ LeetCode Problems</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {LEETCODE_PROBLEMS.map((problem) => (
                  <button
                    key={problem.id}
                    onClick={() => handleLoadProblem(problem)}
                    className={`w-full text-left p-2 rounded-lg border transition-all text-sm ${
                      selectedProblem?.id === problem.id
                        ? 'border-amber-400 bg-amber-900/40 text-amber-100'
                        : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:border-amber-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{problem.title}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        problem.difficulty === 'Easy'
                          ? 'bg-green-900/50 text-green-300'
                          : problem.difficulty === 'Medium'
                          ? 'bg-yellow-900/50 text-yellow-300'
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-1">{problem.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Problem Details */}
          {selectedProblem && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
              <h3 className="font-semibold text-white mb-2">📋 Problem Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">TITLE</p>
                  <p className="text-sm text-white">{selectedProblem.title}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-1">DESCRIPTION</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedProblem.description}</p>
                </div>
                {selectedProblem.explanation && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">HINT</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedProblem.explanation}</p>
                  </div>
                )}
                {selectedProblem.expected && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">EXPECTED OUTPUT</p>
                    <p className="text-xs text-green-300 font-mono bg-slate-950 p-2 rounded">{selectedProblem.expected}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="font-semibold text-white mb-3">💡 Tips</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>• Timeout: 5 seconds max</li>
              <li>• Use print() for output</li>
              <li>• Use input() to read data</li>
              <li>• One input per line</li>
              <li>• Avoid infinite loops</li>
              <li>• Runs in sandbox</li>
              <li>• No file system access</li>
              <li>• Import most Python libs</li>
            </ul>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="md:col-span-3 space-y-4">
          {/* Code Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-300">Python Code Editor</label>
              <span className="text-xs text-slate-500">{code.length} characters</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# Write your Python code here&#10;print('Hello, World!')"
              rows="15"
              className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-white font-mono text-sm placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Input Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Input Data (stdin)</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input data (one value per line)..."
              rows="4"
              className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-white font-mono text-sm placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Output Section */}
          {output && (
            <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-4">
              <p className="text-sm font-medium text-green-200 mb-2">✓ Output:</p>
              <pre className="bg-slate-950 p-3 rounded text-green-300 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-40 border border-slate-700">
                {output}
              </pre>
            </div>
          )}

          {/* Error Section */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4">
              <p className="text-sm font-medium text-red-200 mb-2">✗ Error:</p>
              <pre className="bg-slate-950 p-3 rounded text-red-300 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-40 border border-slate-700">
                {error}
              </pre>
            </div>
          )}

          {/* No Output State */}
          {!output && !error && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-8 text-center">
              <p className="text-slate-400">
                👈 Write your code above and click <span className="font-semibold text-green-400">▶ Run Code</span> to see output
              </p>
            </div>
          )}

          {/* Execution Info */}
          <div className="flex gap-3">
            <button
              onClick={handleRun}
              disabled={loading}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Running...
                </>
              ) : (
                <>
                  ▶ Run Code
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="flex-1 rounded-lg bg-slate-700 px-4 py-3 font-medium text-white hover:bg-slate-600 transition-colors"
            >
              🗑️ Clear
            </button>
          </div>

          {/* Code Examples */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
            <p className="text-sm font-medium text-slate-300 mb-3">📝 Example Codes:</p>
            <div className="space-y-2">
              <button
                onClick={() => setCode("# Calculate sum\na = 5\nb = 10\nprint(f'Sum: {a + b}')")}
                className="w-full text-left text-xs p-2 rounded border border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20 transition-colors text-slate-300"
              >
                Calculate Sum
              </button>
              <button
                onClick={() => setCode("# Loop example\nfor i in range(1, 6):\n    print(f'{i} x 5 = {i*5}')")}
                className="w-full text-left text-xs p-2 rounded border border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20 transition-colors text-slate-300"
              >
                Multiplication Table
              </button>
              <button
                onClick={() => setCode("# List comprehension\nnumbers = [1, 2, 3, 4, 5]\nsquares = [x**2 for x in numbers]\nprint(squares)")}
                className="w-full text-left text-xs p-2 rounded border border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20 transition-colors text-slate-300"
              >
                List Comprehension
              </button>
              <button
                onClick={() => setCode("# Dictionary example\nperson = {'name': 'John', 'age': 25}\nfor key, value in person.items():\n    print(f'{key}: {value}')")}
                className="w-full text-left text-xs p-2 rounded border border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20 transition-colors text-slate-300"
              >
                Dictionary Iteration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
