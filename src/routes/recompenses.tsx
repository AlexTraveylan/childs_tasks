import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { RewardCard } from '#/components/RewardCard'
import { loadRewards } from '#/server/config'
import { getChildren } from '#/server/children'
import { createPurchase } from '#/server/purchases'
import type { Reward } from '#/lib/config'

export const Route = createFileRoute('/recompenses')({
  component: RewardsPage,
})

type Child = { id: number; name: string; points: number }

function RewardsPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])

  async function loadData() {
    const [kids, rews] = await Promise.all([getChildren(), loadRewards()])
    setChildren(kids)
    setRewards(rews)
  }

  useEffect(() => {
    loadData().catch(console.error)
  }, [])

  async function handleBuy(child: Child, reward: Reward, quantity: number) {
    await createPurchase({ data: { childId: child.id, reward, quantity } })
    await loadData()
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <header className="bg-primary text-primary-foreground p-4 text-center shadow-md">
        <h1 className="text-2xl font-black">🎁 Boutique des récompenses</h1>
      </header>

      <div className="flex flex-1 divide-x divide-border">
        {children.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground font-semibold">
            Chargement...
          </div>
        ) : (
          children.map((child) => {
            const minCost = rewards.reduce((min, r) => {
              const c = r.mode === 'quantity' ? r.costPerUnit : r.cost
              return Math.min(min, c)
            }, Infinity)
            const canAffordAnything = child.points >= minCost

            return (
              <div key={child.id} className="flex-1 p-3 overflow-auto">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="text-xl font-black text-primary truncate">
                    {child.name}
                  </h2>
                  <span className="bg-secondary text-secondary-foreground font-black text-base px-3 py-1 rounded-full flex-shrink-0">
                    ⭐ {child.points}
                  </span>
                </div>

                {!canAffordAnything && rewards.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground font-semibold mb-4 bg-muted rounded-xl p-3">
                    💪 Plus que {minCost - child.points} pt
                    {minCost - child.points > 1 ? 's' : ''} pour débloquer
                    quelque chose !
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  {rewards.map((reward) => (
                    <RewardCard
                      key={reward.key}
                      reward={reward}
                      points={child.points}
                      onBuy={(qty) => handleBuy(child, reward, qty)}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
