import { describe, it, expect } from 'vitest'
import { isHolidayDate } from '#/server/config'

describe('isHolidayDate', () => {
  it('retourne true pour un jour férié isolé', () => {
    expect(isHolidayDate('2026-05-01')).toBe(true)
  })

  it("retourne true pour le premier jour d'une période de vacances", () => {
    expect(isHolidayDate('2026-05-14')).toBe(true)
  })

  it("retourne true pour le dernier jour d'une période de vacances (inclusif)", () => {
    expect(isHolidayDate('2026-05-15')).toBe(true)
  })

  it('retourne true pour un jour férié isolé (05-08)', () => {
    expect(isHolidayDate('2026-05-08')).toBe(true)
  })

  it('retourne false pour un jour normal', () => {
    expect(isHolidayDate('2026-05-02')).toBe(false)
  })

  it('retourne false pour un jour hors période de vacances', () => {
    expect(isHolidayDate('2026-05-16')).toBe(false)
  })

  it('retourne false pour un jour non-férié éloigné', () => {
    expect(isHolidayDate('2026-06-01')).toBe(false)
  })
})
