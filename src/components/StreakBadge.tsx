import { getStreakLevel } from '#/lib/streak'

interface StreakBadgeProps {
  streak: number
}

type TierConfig = {
  icon: string
  className: string
}

const TIER_CONFIG: Record<5 | 10 | 15 | 20, TierConfig> = {
  5: {
    icon: '⚡',
    className: 'bg-sky-100 text-sky-700 border-sky-300',
  },
  10: {
    icon: '⭐',
    className: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  },
  15: {
    icon: '🌟',
    className: 'bg-amber-100 text-amber-700 border-amber-400',
  },
  20: {
    icon: '🔥',
    className:
      'bg-orange-100 text-orange-700 border-orange-400 animate-flame-flicker',
  },
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const level = getStreakLevel(streak)
  if (level === 0) return null

  const config = TIER_CONFIG[level]
  const bonusPct = level

  return (
    <span
      title={`Série de ${streak} — bonus +${bonusPct}% sur tes points`}
      className={`inline-flex items-center gap-1 text-sm font-black px-2.5 py-1 rounded-full border-2 shrink-0 ${config.className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{streak}</span>
    </span>
  )
}
