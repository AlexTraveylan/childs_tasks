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
import { getChildren, setChildStat } from '#/server/children'
import { getStreakLevel } from '#/lib/streak'

export const Route = createFileRoute('/parents')({
  component: ParentsPage,
})

type Session = Awaited<ReturnType<typeof getPendingSessions>>[number]
type Purchase = Awaited<ReturnType<typeof getPendingPurchases>>[number]
type HistoryItem = Awaited<ReturnType<typeof getPurchaseHistory>>[number]
type Child = Awaited<ReturnType<typeof getChildren>>[number]

const STREAK_ICONS: Record<number, string> = {
  0: '',
  1: '🌱',
  5: '⚡',
  10: '⭐',
  15: '🌟',
  20: '🔥',
}

function streakIcon(streak: number): string {
  return STREAK_ICONS[getStreakLevel(streak)]
}

function ParentsPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [pending, setPending] = useState<Purchase[]>([])
  const [history, setHistory] = useState<HistoryItem[] | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [editingChild, setEditingChild] = useState<{
    id: number
    field: 'points' | 'streak'
    value: string
  } | null>(null)

  async function loadData() {
    const [sess, purch, kids] = await Promise.all([
      getPendingSessions(),
      getPendingPurchases(),
      getChildren(),
    ])
    setSessions(sess)
    setPending(purch)
    setChildren(kids)
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
        date: session.date,
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

  async function handleStatSave() {
    if (!editingChild) return
    const child = children.find((c) => c.id === editingChild.id)
    if (!child) return
    const newValue = parseInt(editingChild.value, 10)
    if (isNaN(newValue) || newValue < 0) {
      setEditingChild(null)
      return
    }
    if (newValue === child[editingChild.field]) {
      setEditingChild(null)
      return
    }
    await setChildStat({
      data: {
        childId: editingChild.id,
        field: editingChild.field,
        value: newValue,
      },
    })
    await loadData()
    setEditingChild(null)
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

      {/* Scores des enfants */}
      <section>
        <h2 className="text-lg font-black mb-3">🏅 Scores des enfants</h2>
        <div className="space-y-3">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <span className="font-black text-primary text-lg">
                {child.name}
              </span>
              <div className="flex gap-4 items-center">
                {/* Points */}
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-muted-foreground">
                    🏆
                  </span>
                  {editingChild?.id === child.id &&
                  editingChild.field === 'points' ? (
                    <input
                      type="number"
                      min={0}
                      className="w-20 text-center font-black text-lg border border-border rounded-lg px-2 py-0.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editingChild.value}
                      autoFocus
                      onChange={(e) =>
                        setEditingChild({
                          ...editingChild,
                          value: e.target.value,
                        })
                      }
                      onBlur={handleStatSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleStatSave()
                        if (e.key === 'Escape') setEditingChild(null)
                      }}
                    />
                  ) : (
                    <button
                      className="font-black text-lg tabular-nums hover:text-primary transition-colors cursor-text"
                      onClick={() =>
                        setEditingChild({
                          id: child.id,
                          field: 'points',
                          value: String(child.points),
                        })
                      }
                    >
                      {child.points} pts
                    </button>
                  )}
                </div>
                {/* Série */}
                <div className="flex items-center gap-1">
                  {editingChild?.id === child.id &&
                  editingChild.field === 'streak' ? (
                    <input
                      type="number"
                      min={0}
                      className="w-16 text-center font-black text-lg border border-border rounded-lg px-2 py-0.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editingChild.value}
                      autoFocus
                      onChange={(e) =>
                        setEditingChild({
                          ...editingChild,
                          value: e.target.value,
                        })
                      }
                      onBlur={handleStatSave}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleStatSave()
                        if (e.key === 'Escape') setEditingChild(null)
                      }}
                    />
                  ) : (
                    <button
                      className="font-black text-lg tabular-nums hover:text-primary transition-colors cursor-text flex items-center gap-1"
                      onClick={() =>
                        setEditingChild({
                          id: child.id,
                          field: 'streak',
                          value: String(child.streak),
                        })
                      }
                    >
                      {streakIcon(child.streak) && (
                        <span>{streakIcon(child.streak)}</span>
                      )}
                      <span>{child.streak}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
