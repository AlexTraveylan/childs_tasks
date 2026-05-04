import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ParentPasswordGate } from '#/components/ParentPasswordGate'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { getPendingSessions, validateSession } from '#/server/sessions'
import {
  getPendingPurchases,
  getPurchaseHistory,
  markPurchaseDone,
} from '#/server/purchases'
import { loadTasksForDay } from '#/server/config'

export const Route = createFileRoute('/parents')({
  component: ParentsPage,
})

type Session = Awaited<ReturnType<typeof getPendingSessions>>[number]
type Purchase = Awaited<ReturnType<typeof getPendingPurchases>>[number]
type HistoryItem = Awaited<ReturnType<typeof getPurchaseHistory>>[number]

function ParentsPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [pending, setPending] = useState<Purchase[]>([])
  const [history, setHistory] = useState<HistoryItem[] | null>(null)

  async function loadData() {
    const [sess, purch] = await Promise.all([
      getPendingSessions(),
      getPendingPurchases(),
    ])
    setSessions(sess)
    setPending(purch)
  }

  async function handleUnlocked() {
    setUnlocked(true)
    await loadData()
  }

  async function handleValidate(session: Session, honest: boolean) {
    const tasks = await loadTasksForDay({
      data: {
        period: session.period,
        day: session.day,
        childName: session.child.name.toLowerCase(),
      },
    })
    await validateSession({ data: { sessionId: session.id, honest, tasks } })
    await loadData()
  }

  async function handleDone(purchaseId: number) {
    await markPurchaseDone({ data: { purchaseId } })
    await loadData()
  }

  async function handleShowHistory() {
    const h = await getPurchaseHistory()
    setHistory(h)
  }

  if (!unlocked) return <ParentPasswordGate onUnlocked={handleUnlocked} />

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-8 pb-8">
      <header className="text-center pt-2">
        <h1 className="text-2xl font-black text-primary">👨‍👩‍👧‍👦 Espace parents</h1>
      </header>

      {/* Sessions à valider */}
      <section>
        <h2 className="text-lg font-black mb-3">
          ✅ Listes à valider ({sessions.length})
        </h2>
        {sessions.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4 bg-muted rounded-xl font-semibold">
            Rien à valider pour l'instant !
          </p>
        )}
        {sessions.map((sess) => (
          <div
            key={sess.id}
            className="bg-card border border-border rounded-2xl p-4 mb-3 space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-black text-primary text-lg">
                {sess.child.name}
              </span>
              <Badge variant="outline" className="capitalize font-semibold">
                {sess.period} · {sess.day} · {sess.date}
              </Badge>
            </div>
            <div className="space-y-1 bg-muted rounded-xl p-3">
              {sess.completions.map((c) => (
                <div key={c.taskIndex} className="flex justify-between text-sm">
                  <span className="font-semibold">
                    Tâche #{c.taskIndex + 1}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(c.completedAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Paris',
                    })}{' '}
                    {c.onTime ? '✅' : '⏰'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 font-black bg-accent text-accent-foreground rounded-xl hover:bg-accent/90"
                onClick={() => handleValidate(sess, true)}
              >
                👍 Valider
              </Button>
              <Button
                variant="outline"
                className="flex-1 font-black border-destructive text-destructive rounded-xl hover:bg-destructive/10"
                onClick={() => handleValidate(sess, false)}
              >
                🚫 Ils ont triché
              </Button>
            </div>
          </div>
        ))}
      </section>

      {/* Achats à honorer */}
      <section>
        <h2 className="text-lg font-black mb-3">
          🛒 Achats à honorer ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-4 bg-muted rounded-xl font-semibold">
            Aucun achat en attente !
          </p>
        )}
        {pending.map((p) => (
          <div
            key={p.id}
            className="bg-card border border-border rounded-2xl p-4 mb-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-black truncate">
                {p.child.name} — {p.rewardLabel}
              </p>
              <p className="text-sm text-muted-foreground font-semibold">
                {p.unitValue
                  ? `${p.quantity * p.unitValue} ${p.unitLabel}`
                  : `×${p.quantity}`}{' '}
                · {p.cost} pts ·{' '}
                {new Date(p.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <Button
              className="font-black rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              onClick={() => handleDone(p.id)}
            >
              ✅ Fait !
            </Button>
          </div>
        ))}
      </section>

      {/* Historique */}
      <section>
        {history === null ? (
          <Button
            variant="outline"
            className="w-full font-black rounded-xl"
            onClick={handleShowHistory}
          >
            📜 Voir l'historique des achats
          </Button>
        ) : (
          <>
            <h2 className="text-lg font-black mb-3">📜 Historique</h2>
            {history.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4 font-semibold">
                Aucun achat dans l'historique
              </p>
            )}
            {history.map((h) => (
              <div
                key={h.id}
                className="flex justify-between items-center text-sm py-2 border-b border-border gap-2"
              >
                <span className="font-semibold truncate">
                  {h.child.name} — {h.rewardLabel}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {new Date(h.createdAt).toLocaleDateString('fr-FR')} →{' '}
                  {h.doneAt
                    ? new Date(h.doneAt).toLocaleDateString('fr-FR')
                    : '?'}
                </span>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  )
}
