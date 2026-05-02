import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getParisDate, getParisPeriod } from '#/lib/date'

export type Completion = { completedAt: string }

interface TaskStore {
  date: string
  period: 'matin' | 'soir'
  completions: Record<string, Record<number, Completion>>
  validated: Record<string, boolean>
  setCompletion: (
    childName: string,
    taskIndex: number,
    completedAt: string,
  ) => void
  removeCompletion: (childName: string, taskIndex: number) => void
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

      resetChild: (childName) =>
        set((s) => {
          const completions = { ...s.completions }
          delete completions[childName]
          return { completions }
        }),

      setValidated: (childName) =>
        set((s) => ({ validated: { ...s.validated, [childName]: true } })),

      reset: () =>
        set({
          date: getParisDate(),
          period: getParisPeriod(),
          completions: {},
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
