import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import { checkParentPassword } from '#/server/auth'
import type { Task } from '#/lib/config'

export type CompletionRecord = {
  taskIndex: number
  completedAt: string
  onTime: boolean
}

export type SkipRecord = {
  taskIndex: number
  skippedAt: string
}

const TZ = 'Europe/Paris'
const DAILY_COMPLETE_BONUS = 5

function isOnTime(completedAt: string, deadline: string): boolean {
  const [dh, dm] = deadline.split(':').map(Number)
  const d = new Date(completedAt)
  const h = parseInt(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: TZ,
      hour: '2-digit',
      hour12: false,
    }).format(d),
  )
  const m = parseInt(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: TZ,
      minute: '2-digit',
    }).format(d),
  )
  return h < dh || (h === dh && m <= dm)
}

export function calculatePoints(
  tasks: Task[],
  completions: CompletionRecord[],
  skippedIndices: number[],
): number {
  const skipped = new Set(skippedIndices)
  const activeTasks = tasks
    .map((t, i) => ({ task: t, index: i }))
    .filter(({ index }) => !skipped.has(index))

  let points = 0
  for (const c of completions) {
    if (skipped.has(c.taskIndex)) continue
    const task = tasks[c.taskIndex]
    if (isOnTime(c.completedAt, task.deadline)) points += 1
  }

  const activeCompletions = completions.filter((c) => !skipped.has(c.taskIndex))
  if (
    activeTasks.length > 0 &&
    activeCompletions.length === activeTasks.length
  ) {
    const lastActive = activeTasks[activeTasks.length - 1]
    const lastC = completions.find((c) => c.taskIndex === lastActive.index)
    if (lastC && isOnTime(lastC.completedAt, lastActive.task.deadline)) {
      points += DAILY_COMPLETE_BONUS
    }
  }

  return points
}

export const getOrCreateSession = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { childId: number; date: string; period: string; day: string }) => d,
  )
  .handler(async ({ data }) => {
    return prisma.taskSession.upsert({
      where: {
        childId_date_period: {
          childId: data.childId,
          date: data.date,
          period: data.period,
        },
      },
      create: { ...data, completions: '[]', skips: '[]' },
      update: {},
    })
  })

export const updateSessionCompletions = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { sessionId: number; completions: CompletionRecord[] }) => d,
  )
  .handler(async ({ data }) => {
    await prisma.taskSession.update({
      where: { id: data.sessionId },
      data: { completions: JSON.stringify(data.completions) },
    })
  })

export const skipTask = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { sessionId: number; taskIndex: number; password: string }) => d,
  )
  .handler(async ({ data }) => {
    const ok = await checkParentPassword(data.password)
    if (!ok) return { success: false, error: 'Mot de passe incorrect' }

    const session = await prisma.taskSession.findUniqueOrThrow({
      where: { id: data.sessionId },
    })
    const skips: SkipRecord[] = JSON.parse(session.skips)
    if (!skips.find((s) => s.taskIndex === data.taskIndex)) {
      skips.push({
        taskIndex: data.taskIndex,
        skippedAt: new Date().toISOString(),
      })
    }
    await prisma.taskSession.update({
      where: { id: data.sessionId },
      data: { skips: JSON.stringify(skips) },
    })
    return { success: true, error: null }
  })

export const getPendingSessions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const sessions = await prisma.taskSession.findMany({
      where: { validated: false, NOT: { completions: '[]' } },
      include: { child: true },
      orderBy: { createdAt: 'desc' },
    })
    return sessions.map((s) => ({
      ...s,
      completions: JSON.parse(s.completions) as CompletionRecord[],
      skips: JSON.parse(s.skips) as SkipRecord[],
    }))
  },
)

export const validateSession = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { sessionId: number; honest: boolean; tasks: Task[] }) => d,
  )
  .handler(async ({ data }) => {
    const session = await prisma.taskSession.findUniqueOrThrow({
      where: { id: data.sessionId },
    })
    const completions = JSON.parse(session.completions) as CompletionRecord[]
    const skips = JSON.parse(session.skips) as SkipRecord[]
    const skippedIndices = skips.map((s) => s.taskIndex)
    const points = data.honest
      ? calculatePoints(data.tasks, completions, skippedIndices)
      : 0

    await prisma.$transaction([
      prisma.taskSession.update({
        where: { id: data.sessionId },
        data: {
          validated: true,
          validatedAt: new Date(),
          pointsEarned: points,
        },
      }),
      ...(points > 0
        ? [
            prisma.child.update({
              where: { id: session.childId },
              data: { points: { increment: points } },
            }),
          ]
        : []),
    ])
  })
