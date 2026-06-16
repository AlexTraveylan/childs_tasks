export type StreakLevel = 0 | 1 | 5 | 10 | 15 | 20 | 30 | 50 | 100

// À partir du palier 20, le bonus est plafonné : les paliers supérieurs
// (30/50/100) sont purement du prestige visuel, pas de bonus supplémentaire.
const LEVEL_BONUS_PCT: Record<StreakLevel, number> = {
  0: 0,
  1: 0,
  5: 5,
  10: 10,
  15: 15,
  20: 20,
  30: 20,
  50: 20,
  100: 20,
}

export type StreakUpdate = {
  newStreak: number
  streakLevel: StreakLevel
  bonusPct: number
}

export type StreakUpdateInput = {
  currentStreak: number
  honest: boolean
  activeTaskCount: number
  activeCompletionCount: number
}

export function getStreakLevel(streak: number): StreakLevel {
  if (streak >= 100) return 100
  if (streak >= 50) return 50
  if (streak >= 30) return 30
  if (streak >= 20) return 20
  if (streak >= 15) return 15
  if (streak >= 10) return 10
  if (streak >= 5) return 5
  if (streak >= 1) return 1
  return 0
}

/** Bonus affiché (en %) associé à un palier. Plafonné à 20% dès le palier 20. */
export function getStreakBonusPct(level: StreakLevel): number {
  return LEVEL_BONUS_PCT[level]
}

export function computeStreakUpdate(input: StreakUpdateInput): StreakUpdate {
  const { currentStreak, honest, activeTaskCount, activeCompletionCount } =
    input

  let newStreak: number
  if (!honest) {
    newStreak = 0
  } else if (activeTaskCount === 0) {
    newStreak = currentStreak
  } else if (activeCompletionCount === activeTaskCount) {
    newStreak = currentStreak + 1
  } else {
    newStreak = 0
  }

  const streakLevel = getStreakLevel(newStreak)
  const bonusPct = LEVEL_BONUS_PCT[streakLevel] / 100

  return { newStreak, streakLevel, bonusPct }
}

export function applyStreakBonus(basePoints: number, bonusPct: number): number {
  if (basePoints === 0) return 0
  return Math.ceil(basePoints * (1 + bonusPct))
}
