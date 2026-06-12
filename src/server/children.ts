import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'

export const getChildren = createServerFn({ method: 'GET' }).handler(
  async () => {
    return prisma.child.findMany({ orderBy: { name: 'asc' } })
  },
)

export const setChildStat = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { childId: number; field: 'points' | 'streak'; value: number }) => d,
  )
  .handler(async ({ data }) => {
    await prisma.child.update({
      where: { id: data.childId },
      data: { [data.field]: data.value },
    })
  })
