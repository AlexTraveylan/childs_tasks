import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import type { Reward } from '#/lib/config'

export const createPurchase = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: { childId: number; reward: Reward; quantity: number }) => d,
  )
  .handler(async ({ data }) => {
    const { reward, quantity } = data
    const cost =
      reward.mode === 'quantity' ? reward.costPerUnit * quantity : reward.cost
    const child = await prisma.child.findUniqueOrThrow({
      where: { id: data.childId },
    })
    if (child.points < cost) throw new Error('Solde insuffisant')

    await prisma.$transaction([
      prisma.child.update({
        where: { id: data.childId },
        data: { points: { decrement: cost } },
      }),
      prisma.purchase.create({
        data: {
          childId: data.childId,
          rewardKey: reward.key,
          rewardLabel: reward.label,
          cost,
          quantity,
          unitValue: reward.mode === 'quantity' ? reward.unitValue : null,
          unitLabel: reward.mode === 'quantity' ? reward.unit : null,
        },
      }),
    ])
  })

export const getPendingPurchases = createServerFn({ method: 'GET' }).handler(
  async () => {
    return prisma.purchase.findMany({
      where: { isDone: false },
      include: { child: true },
      orderBy: { createdAt: 'desc' },
    })
  },
)

export const getPurchaseHistory = createServerFn({ method: 'GET' }).handler(
  async () => {
    return prisma.purchase.findMany({
      where: { isDone: true },
      include: { child: true },
      orderBy: { createdAt: 'desc' },
    })
  },
)

export const markPurchaseDone = createServerFn({ method: 'POST' })
  .inputValidator((d: { purchaseId: number }) => d)
  .handler(async ({ data }) => {
    await prisma.purchase.update({
      where: { id: data.purchaseId },
      data: { isDone: true, doneAt: new Date() },
    })
  })
