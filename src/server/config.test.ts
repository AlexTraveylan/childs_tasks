import { describe, it, expect } from 'vitest'
import { isHoliday } from '#/lib/holiday'

const holidayConfig = {
  days: ['05-01', '05-08'],
  periods: [{ start: '05-14', end: '05-15' }],
}

describe('isHoliday', () => {
  it('retourne true pour un jour férié isolé', () => {
    expect(isHoliday('2026-05-01', holidayConfig)).toBe(true)
  })

  it("retourne true pour le premier jour d'une période de vacances", () => {
    expect(isHoliday('2026-05-14', holidayConfig)).toBe(true)
  })

  it("retourne true pour le dernier jour d'une période de vacances (inclusif)", () => {
    expect(isHoliday('2026-05-15', holidayConfig)).toBe(true)
  })

  it('retourne true pour un jour férié isolé (05-08)', () => {
    expect(isHoliday('2026-05-08', holidayConfig)).toBe(true)
  })

  it('retourne false pour un jour normal', () => {
    expect(isHoliday('2026-05-02', holidayConfig)).toBe(false)
  })

  it('retourne false pour un jour hors période de vacances', () => {
    expect(isHoliday('2026-05-16', holidayConfig)).toBe(false)
  })

  it('retourne false pour un jour non-férié éloigné', () => {
    expect(isHoliday('2026-06-01', holidayConfig)).toBe(false)
  })
})
