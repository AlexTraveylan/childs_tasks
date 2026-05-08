import { describe, it, expect } from 'vitest'

// On teste calculatePoints directement — il faut l'exporter
import { calculatePoints } from '#/server/sessions'
import type { Task } from '#/lib/config'
import type { CompletionRecord } from '#/server/sessions'

const tasks: Task[] = [
  { label: 'Tâche A', deadline: '08:00' },
  { label: 'Tâche B', deadline: '08:30' },
  { label: 'Tâche C', deadline: '09:00' },
]

// 07:00 Paris = 05:00 UTC (été, UTC+2)
function makeCompletion(
  taskIndex: number,
  parisHour: number,
  parisMin = 0,
): CompletionRecord {
  const utcHour = parisHour - 2
  const d = new Date(
    `2026-05-08T${String(utcHour).padStart(2, '0')}:${String(parisMin).padStart(2, '0')}:00.000Z`,
  )
  return { taskIndex, completedAt: d.toISOString(), onTime: true }
}

describe('calculatePoints', () => {
  it('donne 1 point par tâche complétée dans les temps', () => {
    const completions = [
      makeCompletion(0, 7, 50), // A avant 08:00 ✓
      makeCompletion(1, 8, 20), // B avant 08:30 ✓
    ]
    expect(calculatePoints(tasks, completions, [])).toBe(2)
  })

  it('ne donne pas de point pour une tâche hors délai', () => {
    const completions = [
      makeCompletion(0, 8, 10), // A après 08:00 ✗
    ]
    expect(calculatePoints(tasks, completions, [])).toBe(0)
  })

  it('donne le bonus de 5 si toutes les tâches actives sont complètes dans les temps', () => {
    const completions = [
      makeCompletion(0, 7, 50),
      makeCompletion(1, 8, 20),
      makeCompletion(2, 8, 50),
    ]
    // toutes complètes dans les temps → 3 + 5 bonus
    expect(calculatePoints(tasks, completions, [])).toBe(8)
  })

  it('donne le bonus même si une tâche est skippée', () => {
    const completions = [
      makeCompletion(0, 7, 50), // A complète dans les temps
      // B est skippée
      makeCompletion(2, 8, 50), // C complète dans les temps
    ]
    // activeTasks = [A, C] — toutes complètes → 2 points + 5 bonus
    expect(calculatePoints(tasks, completions, [1])).toBe(7)
  })

  it('ne donne pas le bonus si une tâche active est manquante', () => {
    const completions = [
      makeCompletion(0, 7, 50), // A complète
      // B skippée
      // C non cochée
    ]
    expect(calculatePoints(tasks, completions, [1])).toBe(1)
  })

  it('donne le bonus si toutes les tâches sont skippées sauf une et elle est faite', () => {
    const completions = [makeCompletion(2, 8, 50)]
    expect(calculatePoints(tasks, completions, [0, 1])).toBe(6) // 1 + 5 bonus
  })
})
