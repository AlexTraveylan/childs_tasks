import { useState, useMemo } from 'react'
import { Progress } from '#/components/ui/progress'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { TaskItem } from '#/components/TaskItem'
import type { Task } from '#/lib/config'
import type { Completion } from '#/store/taskStore'

const ENCOURAGEMENTS = [
  'Super ! 💪',
  'Génial ! 🌟',
  'Bravo ! ⭐',
  'Trop fort ! 🎉',
  'Ouais ! 🙌',
]

const VALIDATED_MESSAGES = [
  '🏆 Champion(ne) ! Tu gères trop bien !',
  "🚀 T'es une fusée ! Rien ne t'arrête !",
  '🌟 Superstar du quotidien !',
  "🎯 Parfait ! T'es vraiment au top !",
  '💪 Trop fort(e) ! Continue comme ça !',
  '🦸 Super-héros/héroïne de la maison !',
  "😎 Trop cool ! T'as tout géré !",
  "✨ Magique ! T'es brillant(e) !",
  "🥇 Médaille d'or pour toi !",
  '🎉 Waouh, quelle efficacité !',
  '🌈 Tu illumines la journée !',
  "🔥 En feu aujourd'hui !",
]

interface ChildPanelProps {
  childName: string
  points: number
  tasks: Task[]
  completions: Record<number, Completion>
  onToggle: (taskIndex: number) => void
  lastMessage?: string
  validated?: boolean
  onValidate?: (password: string, honest: boolean) => Promise<string | null>
}

function ParentValidationForm({
  onValidate,
}: {
  onValidate: (password: string, honest: boolean) => Promise<string | null>
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(honest: boolean) {
    if (!password) return
    setLoading(true)
    setError('')
    const err = await onValidate(password, honest)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="space-y-2 p-3 bg-card border border-border rounded-2xl mt-2">
      <p className="text-xs font-bold text-muted-foreground text-center">
        Validation parent
      </p>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        className="rounded-xl text-sm"
        onKeyDown={(e) => e.key === 'Enter' && submit(true)}
      />
      {error && (
        <p className="text-destructive text-xs font-semibold text-center">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => submit(true)}
          disabled={loading || !password}
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-black"
        >
          ✅ Valider
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => submit(false)}
          disabled={loading || !password}
          className="flex-1 text-xs font-black"
        >
          ❌ Triche
        </Button>
      </div>
    </div>
  )
}

export function ChildPanel({
  childName,
  points,
  tasks,
  completions,
  onToggle,
  lastMessage,
  validated = false,
  onValidate,
}: ChildPanelProps) {
  const doneCount = Object.keys(completions).length
  const allDone = doneCount === tasks.length && tasks.length > 0
  const pct =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

  const validatedMessage = useMemo(
    () =>
      VALIDATED_MESSAGES[Math.floor(Math.random() * VALIDATED_MESSAGES.length)],
    [childName],
  )

  return (
    <div className="flex flex-col gap-3 p-3 h-full">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-black tracking-wide text-primary truncate">
          {childName}
        </h2>
        <Badge className="bg-secondary text-secondary-foreground font-black text-sm px-2.5 py-1 rounded-full shrink-0">
          ⭐ {points}
        </Badge>
      </div>

      <div className="space-y-1">
        <Progress value={pct} className="h-3 rounded-full" />
        <p className="text-xs text-muted-foreground text-right font-semibold">
          {doneCount}/{tasks.length}
        </p>
      </div>

      {lastMessage && (
        <div className="text-center text-sm font-black text-accent bg-accent/10 rounded-xl py-1.5 animate-bounce-once">
          {lastMessage}
        </div>
      )}

      {validated && (
        <div className="text-center px-3 py-3 rounded-2xl bg-secondary/40 border-2 border-secondary w-full flex-shrink-0 space-y-1">
          <p className="font-black text-secondary-foreground text-base">
            {validatedMessage}
          </p>
          <p className="text-xs text-secondary-foreground/70 font-semibold">
            ⭐ Session validée ! Points mis à jour
          </p>
        </div>
      )}

      {!validated && allDone && (
        <>
          <div className="animate-celebrate text-center px-3 py-2 rounded-2xl bg-accent/20 border-2 border-accent w-full flex-shrink-0">
            <p className="font-black text-accent text-sm">
              🎉 Bravo {childName} !
            </p>
          </div>
          {onValidate && <ParentValidationForm onValidate={onValidate} />}
        </>
      )}

      {!validated && (
        <div className="flex flex-col gap-2 flex-1 overflow-auto">
          {tasks.map((task, i) => (
            <TaskItem
              key={i}
              task={task}
              completion={completions[i]}
              onToggle={() => onToggle(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { ENCOURAGEMENTS }
