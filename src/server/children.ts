import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'

export const getChildren = createServerFn({ method: 'GET' }).handler(
  async () => {
    return prisma.child.findMany({ orderBy: { name: 'asc' } })
  },
)
