import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getParisDate, getParisPeriod } from '#/lib/date'

export type Completion = { completedAt: string }
export type Skip = { skippedAt: string }

interface TaskStore {
  date: string
  period: 'matin' | 'soir'
  completions: Record<string, Record<number, Completion>>
  skips: Record<string, Record<number, Skip>>
  validated: Record<string, boolean>
  setCompletion: (
    childName: string,
    taskIndex: number,
    completedAt: string,
  ) => void
  removeCompletion: (childName: string, taskIndex: number) => void
  setSkip: (childName: string, taskIndex: number, skippedAt: string) => void
  resetChild: (childName: string) => void
  setValidated: (childName: string) => void
  resetIfStale: () => void
  reset: () => void
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      date: '',
      period: 'matin',
      completions: {},
      skips: {},
      validated: {},

      setCompletion: (childName, taskIndex, completedAt) =>
        set((s) => ({
          completions: {
            ...s.completions,
            [childName]: {
              ...(s.completions[childName] ?? {}),
              [taskIndex]: { completedAt },
            },
          },
        })),

      removeCompletion: (childName, taskIndex) =>
        set((s) => {
          const child = { ...(s.completions[childName] ?? {}) }
          delete child[taskIndex]
          return { completions: { ...s.completions, [childName]: child } }
        }),

      setSkip: (childName, taskIndex, skippedAt) =>
        set((s) => ({
          skips: {
            ...s.skips,
            [childName]: {
              ...(s.skips[childName] ?? {}),
              [taskIndex]: { skippedAt },
            },
          },
        })),

      resetChild: (childName) =>
        set((s) => {
          const completions = { ...s.completions }
          const skips = { ...s.skips }
          delete completions[childName]
          delete skips[childName]
          return { completions, skips }
        }),

      setValidated: (childName) =>
        set((s) => ({ validated: { ...s.validated, [childName]: true } })),

      reset: () =>
        set({
          date: getParisDate(),
          period: getParisPeriod(),
          completions: {},
          skips: {},
          validated: {},
        }),

      resetIfStale: () => {
        const today = getParisDate()
        const period = getParisPeriod()
        const { date, period: storedPeriod } = get()
        if (date !== today || storedPeriod !== period) {
          get().reset()
        }
      },
    }),
    { name: 'chores-task-store' },
  ),
)
