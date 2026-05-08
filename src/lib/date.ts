const TZ = 'Europe/Paris'

function parisNow() {
  const now = new Date()

  const date = new Intl.DateTimeFormat('fr-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  const hour = parseInt(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: TZ,
      hour: '2-digit',
      hour12: false,
    }).format(now),
  )

  const minute = parseInt(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: TZ,
      minute: '2-digit',
    }).format(now),
  )

  const dayName = new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ,
    weekday: 'long',
  })
    .format(now)
    .toLowerCase()

  return { date, hour, minute, dayName, now }
}

export function getParisDate(): string {
  return parisNow().date
}

export function getParisPeriod(): 'matin' | 'soir' {
  return parisNow().hour < 12 ? 'matin' : 'soir'
}

export function getParisDayName(): string {
  return parisNow().dayName
}

export function isPastDeadline(deadline: string): boolean {
  const [dh, dm] = deadline.split(':').map(Number)
  const { hour, minute } = parisNow()
  return hour > dh || (hour === dh && minute > dm)
}

export function minutesUntilDeadline(deadline: string): number {
  const [dh, dm] = deadline.split(':').map(Number)
  const { hour, minute } = parisNow()
  return dh * 60 + dm - (hour * 60 + minute)
}

export function getParisTimeLabel(): string {
  const { hour, minute } = parisNow()
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatParisTime(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString))
}

export function wasCompletedLate(
  completedAt: string,
  deadline: string,
): boolean {
  const [dh, dm] = deadline.split(':').map(Number)
  const completionDate = new Date(completedAt)
  const completionHour = parseInt(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: TZ,
      hour: '2-digit',
      hour12: false,
    }).format(completionDate),
  )
  const completionMinute = parseInt(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: TZ,
      minute: '2-digit',
    }).format(completionDate),
  )
  return completionHour > dh || (completionHour === dh && completionMinute > dm)
}

export function getParisDateLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}
