type HolidayConfig = {
  days: string[] // format "MM-DD"
  periods: { start: string; end: string }[] // format "MM-DD"
}

export function isHoliday(isoDate: string, config: HolidayConfig): boolean {
  const mmdd = isoDate.slice(5) // "YYYY-MM-DD" → "MM-DD"
  const year = isoDate.slice(0, 4)

  if (config.days.includes(mmdd)) return true

  return config.periods.some((p) => {
    const startFull = `${year}-${p.start}`
    let endFull = `${year}-${p.end}`
    if (endFull < startFull) {
      endFull = `${parseInt(year) + 1}-${p.end}`
    }
    return isoDate >= startFull && isoDate <= endFull
  })
}
