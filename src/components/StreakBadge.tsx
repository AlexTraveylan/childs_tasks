import { getStreakBonusPct, getStreakLevel } from '#/lib/streak'

interface StreakBadgeProps {
  streak: number
}

type TierConfig = {
  icon: string
  className: string
  /** Libellé de prestige affiché en infobulle (paliers 30+). */
  label?: string
}

const TIER_CONFIG: Record<
  Exclude<ReturnType<typeof getStreakLevel>, 0>,
  TierConfig
> = {
  1: {
    icon: '🌱',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
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
  // ── Paliers prestige (bonus plafonné à 20%, pur spectacle) ──
  30: {
    icon: '☄️',
    label: 'Météore',
    className: 'streak-meteor text-indigo-50 border-transparent',
  },
  50: {
    icon: '💎',
    label: 'Diamant',
    className: 'streak-diamond text-indigo-900 border-transparent',
  },
  100: {
    icon: '👑',
    label: 'LÉGENDE',
    className: 'streak-legend text-purple-950 border-transparent',
  },
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const level = getStreakLevel(streak)
  if (level === 0) return null

  const config = TIER_CONFIG[level]
  const bonus = getStreakBonusPct(level)
  const title =
    level === 1
      ? `Série de ${streak} — continue !`
      : config.label
        ? `Série de ${streak} — ${config.label} ! Bonus +${bonus}% sur tes points`
        : `Série de ${streak} — bonus +${bonus}% sur tes points`

  return (
    <span
      title={title}
      className={`relative inline-flex items-center gap-1 text-sm font-black px-2.5 py-1 rounded-full border-2 shrink-0 ${config.className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{streak}</span>
      {level !== 1 && <span className="opacity-80">+{bonus}%</span>}
    </span>
  )
}
