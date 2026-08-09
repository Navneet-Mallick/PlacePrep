/**
 * Proctoring enforcement rules.
 *
 * Both the aptitude and technical assessments share these thresholds so
 * enforcement is consistent across the platform.
 */

export const LIMITS = {
  tabSwitches: 6,        // leaving the test tab this many times
  totalViolations: 8,    // any confirmed camera violations
  highSeverity: 3,       // multiple persons detected
}

export const WARN_AT = {
  tabSwitches: 4,
  totalViolations: 5,
  highSeverity: 2,
}

/**
 * Decide whether the candidate should be disqualified.
 *
 * @param {{tabSwitches: number, violations: Array<{severity?: string}>}} state
 * @returns {{disqualified: boolean, reason: string}}
 */
export function evaluateIntegrity({ tabSwitches = 0, violations = [] }) {
  const high = violations.filter(v => v.severity === 'high').length

  if (high >= LIMITS.highSeverity) {
    return {
      disqualified: true,
      reason: `Multiple persons detected ${high} times during the assessment`,
    }
  }

  if (tabSwitches >= LIMITS.tabSwitches) {
    return {
      disqualified: true,
      reason: `Left the test tab ${tabSwitches} times (limit ${LIMITS.tabSwitches})`,
    }
  }

  if (violations.length >= LIMITS.totalViolations) {
    return {
      disqualified: true,
      reason: `${violations.length} proctoring violations recorded (limit ${LIMITS.totalViolations})`,
    }
  }

  return { disqualified: false, reason: '' }
}

/**
 * Whether the candidate is close to a limit and should see a final warning.
 */
export function shouldWarn({ tabSwitches = 0, violations = [] }) {
  const high = violations.filter(v => v.severity === 'high').length
  return (
    tabSwitches >= WARN_AT.tabSwitches ||
    violations.length >= WARN_AT.totalViolations ||
    high >= WARN_AT.highSeverity
  )
}

/**
 * Remaining allowance, for display in the proctoring bar.
 */
export function remainingAllowance({ tabSwitches = 0, violations = [] }) {
  return {
    tabSwitches: Math.max(0, LIMITS.tabSwitches - tabSwitches),
    violations: Math.max(0, LIMITS.totalViolations - violations.length),
  }
}
