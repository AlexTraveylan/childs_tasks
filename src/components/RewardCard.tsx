import { useState } from 'react'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { cn } from '#/lib/utils'
import type { Reward } from '#/lib/config'

interface RewardCardProps {
  reward: Reward
  points: number
  onBuy: (quantity: number) => Promise<void>
}

export function RewardCard({ reward, points, onBuy }: RewardCardProps) {
  const [qty, setQty] = useState(1)
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const cost =
    reward.mode === 'quantity' ? reward.costPerUnit * qty : reward.cost
  const canAfford = points >= cost
  const displayQty = reward.mode === 'quantity' ? qty * reward.unitValue : 1
  const displayUnit = reward.mode === 'quantity' ? reward.unit : ''

  async function handleBuy() {
    setLoading(true)
    try {
      await onBuy(qty)
    } finally {
      setLoading(false)
      setConfirm(false)
      setQty(1)
    }
  }

  return (
    <>
      <Card
        className={cn(
          'rounded-2xl transition-all duration-300',
          !canAfford && 'opacity-50 grayscale',
        )}
      >
        <CardContent className="pt-4 pb-2 text-center">
          <div className="text-4xl mb-2">{reward.emoji ?? '🎁'}</div>
          <p className="font-black text-base leading-tight">{reward.label}</p>

          {reward.mode === 'quantity' && (
            <p className="text-xs text-muted-foreground mt-1 font-semibold">
              {reward.costPerUnit} pt = {reward.unitValue} {reward.unit}
            </p>
          )}
          {reward.mode === 'unique' && (
            <Badge className="mt-2 bg-primary text-primary-foreground font-bold">
              {reward.cost} pts
            </Badge>
          )}

          {reward.mode === 'quantity' && (
            <>
              <div className="flex items-center justify-center gap-3 mt-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full font-black"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </Button>
                <span className="font-black text-base w-16 text-center">
                  {displayQty} {displayUnit}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full font-black"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-sm font-bold text-primary mt-2">
                Coût : {cost} pt{cost > 1 ? 's' : ''}
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="pb-4">
          <Button
            className="w-full font-black rounded-xl"
            disabled={!canAfford || loading}
            onClick={() => setConfirm(true)}
          >
            {canAfford ? 'Acheter 🛒' : `🔒 Il manque ${cost - points} pts`}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-black">
              Confirmer l'achat ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground">
            {reward.emoji} {reward.label}
            {reward.mode === 'quantity' &&
              ` — ${displayQty} ${displayUnit}`}{' '}
            <span className="font-bold text-primary">({cost} pts)</span>
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleBuy}
              disabled={loading}
              className="font-black"
            >
              {loading ? '...' : 'Oui, acheter !'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
