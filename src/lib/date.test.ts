import { describe, it, expect } from 'vitest'

// We test wasCompletedLate which doesn't exist yet — RED phase
import { wasCompletedLate } from '#/lib/date'

describe('wasCompletedLate', () => {
  it('returns false when task was completed before the deadline', () => {
    // completed at 07:45 Paris time, deadline 08:00
    const completedAt = new Date('2026-05-08T05:45:00.000Z').toISOString() // 07:45 Paris (UTC+2)
    expect(wasCompletedLate(completedAt, '08:00')).toBe(false)
  })

  it('returns true when task was completed after the deadline', () => {
    // completed at 08:10 Paris time, deadline 08:00
    const completedAt = new Date('2026-05-08T06:10:00.000Z').toISOString() // 08:10 Paris (UTC+2)
    expect(wasCompletedLate(completedAt, '08:00')).toBe(true)
  })

  it('returns false when task was completed exactly at the deadline minute', () => {
    // completed at 08:00 Paris time, deadline 08:00
    const completedAt = new Date('2026-05-08T06:00:00.000Z').toISOString() // 08:00 Paris (UTC+2)
    expect(wasCompletedLate(completedAt, '08:00')).toBe(false)
  })
})
