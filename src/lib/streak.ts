export type StreakLevel = 0 | 1 | 5 | 10 | 15 | 20

const LEVEL_BONUS_PCT: Record<StreakLevel, number> = {
  0: 0,
  1: 0,
  5: 5,
  10: 10,
  15: 15,
  20: 20,
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
  if (streak >= 20) return 20
  if (streak >= 15) return 15
  if (streak >= 10) return 10
  if (streak >= 5) return 5
  if (streak >= 1) return 1
  return 0
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
