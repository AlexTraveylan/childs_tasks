import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import type { Task } from '#/lib/config'

export type CompletionRecord = {
  taskIndex: number
  completedAt: string // ISO 8601 UTC
  onTime: boolean
}

function calculatePoints(
  tasks: Task[],
  completions: CompletionRecord[],
): number {
  const TZ = 'Europe/Paris'
  const DAILY_COMPLETE_BONUS = 5

  let points = 0

  for (const c of completions) {
    const task = tasks.at(c.taskIndex)
    if (!task) continue
    const [dh, dm] = task.deadline.split(':').map(Number)
    const d = new Date(c.completedAt)
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
    if (h < dh || (h === dh && m <= dm)) points += 1
  }

  if (completions.length === tasks.length && tasks.length > 0) {
    const lastTask = tasks.at(-1)
    const lastC = completions.find((c) => c.taskIndex === tasks.length - 1)
    if (lastTask && lastC) {
      const [dh, dm] = lastTask.deadline.split(':').map(Number)
      const d = new Date(lastC.completedAt)
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
      if (h < dh || (h === dh && m <= dm)) points += DAILY_COMPLETE_BONUS
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
      create: { ...data, completions: '[]' },
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
    const points = data.honest ? calculatePoints(data.tasks, completions) : 0

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
