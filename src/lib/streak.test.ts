import { describe, it, expect } from 'vitest'
import {
  getStreakLevel,
  computeStreakUpdate,
  applyStreakBonus,
} from '#/lib/streak'

describe('getStreakLevel', () => {
  it('retourne 0 pour streak = 0', () => {
    expect(getStreakLevel(0)).toBe(0)
  })

  it('retourne 1 pour 1 ≤ streak < 5', () => {
    expect(getStreakLevel(1)).toBe(1)
    expect(getStreakLevel(4)).toBe(1)
  })

  it('retourne 5 pour 5 ≤ streak < 10', () => {
    expect(getStreakLevel(5)).toBe(5)
    expect(getStreakLevel(9)).toBe(5)
  })

  it('retourne 10 pour 10 ≤ streak < 15', () => {
    expect(getStreakLevel(10)).toBe(10)
    expect(getStreakLevel(14)).toBe(10)
  })

  it('retourne 15 pour 15 ≤ streak < 20', () => {
    expect(getStreakLevel(15)).toBe(15)
    expect(getStreakLevel(19)).toBe(15)
  })

  it('retourne 20 pour 20 ≤ streak < 30', () => {
    expect(getStreakLevel(20)).toBe(20)
    expect(getStreakLevel(29)).toBe(20)
  })

  it('retourne les paliers prestige 30 / 50 / 100', () => {
    expect(getStreakLevel(30)).toBe(30)
    expect(getStreakLevel(49)).toBe(30)
    expect(getStreakLevel(50)).toBe(50)
    expect(getStreakLevel(99)).toBe(50)
    expect(getStreakLevel(100)).toBe(100)
    expect(getStreakLevel(999)).toBe(100)
  })
})

describe('computeStreakUpdate', () => {
  it('passe au palier 1 (sans bonus) dès la première victoire', () => {
    const r = computeStreakUpdate({
      currentStreak: 0,
      honest: true,
      activeTaskCount: 3,
      activeCompletionCount: 3,
    })
    expect(r.newStreak).toBe(1)
    expect(r.streakLevel).toBe(1)
    expect(r.bonusPct).toBe(0)
  })

  it('incrémente la série si toutes les tâches actives sont cochées', () => {
    const r = computeStreakUpdate({
      currentStreak: 4,
      honest: true,
      activeTaskCount: 3,
      activeCompletionCount: 3,
    })
    expect(r.newStreak).toBe(5)
    expect(r.streakLevel).toBe(5)
    expect(r.bonusPct).toBe(0.05)
  })

  it('remet la série à 0 si validation malhonnête', () => {
    const r = computeStreakUpdate({
      currentStreak: 12,
      honest: false,
      activeTaskCount: 3,
      activeCompletionCount: 3,
    })
    expect(r.newStreak).toBe(0)
    expect(r.streakLevel).toBe(0)
    expect(r.bonusPct).toBe(0)
  })

  it('remet la série à 0 si au moins une tâche active n est pas cochée', () => {
    const r = computeStreakUpdate({
      currentStreak: 8,
      honest: true,
      activeTaskCount: 3,
      activeCompletionCount: 2,
    })
    expect(r.newStreak).toBe(0)
    expect(r.streakLevel).toBe(0)
    expect(r.bonusPct).toBe(0)
  })

  it('laisse la série inchangée si aucune tâche active', () => {
    const r = computeStreakUpdate({
      currentStreak: 7,
      honest: true,
      activeTaskCount: 0,
      activeCompletionCount: 0,
    })
    expect(r.newStreak).toBe(7)
    expect(r.streakLevel).toBe(5)
    expect(r.bonusPct).toBe(0.05)
  })

  it('atteint le palier prestige 50 sans dépasser le bonus de 20%', () => {
    const r = computeStreakUpdate({
      currentStreak: 49,
      honest: true,
      activeTaskCount: 2,
      activeCompletionCount: 2,
    })
    expect(r.newStreak).toBe(50)
    expect(r.streakLevel).toBe(50)
    expect(r.bonusPct).toBe(0.2)
  })

  it('plafonne le bonus à 20% au palier légende (100+)', () => {
    const r = computeStreakUpdate({
      currentStreak: 150,
      honest: true,
      activeTaskCount: 2,
      activeCompletionCount: 2,
    })
    expect(r.newStreak).toBe(151)
    expect(r.streakLevel).toBe(100)
    expect(r.bonusPct).toBe(0.2)
  })
})

describe('applyStreakBonus', () => {
  it('retourne 0 si basePoints vaut 0', () => {
    expect(applyStreakBonus(0, 0.2)).toBe(0)
  })

  it('retourne basePoints inchangé si bonusPct vaut 0', () => {
    expect(applyStreakBonus(8, 0)).toBe(8)
  })

  it('applique le bonus avec arrondi supérieur (5%)', () => {
    // 8 * 1.05 = 8.4 → ceil → 9
    expect(applyStreakBonus(8, 0.05)).toBe(9)
  })

  it('applique le bonus avec arrondi supérieur (20%)', () => {
    // 8 * 1.20 = 9.6 → ceil → 10
    expect(applyStreakBonus(8, 0.2)).toBe(10)
  })

  it('garantit au moins +1 point sur petites sessions', () => {
    // 1 * 1.05 = 1.05 → ceil → 2
    expect(applyStreakBonus(1, 0.05)).toBe(2)
  })
})
