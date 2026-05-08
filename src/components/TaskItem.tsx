import { useState, useRef } from 'react'
import { Checkbox } from '#/components/ui/checkbox'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  isPastDeadline,
  minutesUntilDeadline,
  formatParisTime,
  wasCompletedLate,
} from '#/lib/date'
import type { Task } from '#/lib/config'
import type { Completion } from '#/store/taskStore'
import { cn } from '#/lib/utils'

const LONG_PRESS_MS = 600

interface TaskItemProps {
  task: Task
  completion?: Completion
  onToggle: () => void
  onSkip?: (password: string) => Promise<string | null>
}

export function TaskItem({
  task,
  completion,
  onToggle,
  onSkip,
}: TaskItemProps) {
  const [bouncing, setBouncing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [skipLoading, setSkipLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const done = !!completion
  const past = isPastDeadline(task.deadline)
  const minsLeft = minutesUntilDeadline(task.deadline)
  const urgent = !done && !past && minsLeft <= 5

  function handleToggle() {
    if (!done) {
      setBouncing(true)
      setTimeout(() => setBouncing(false), 400)
    }
    onToggle()
  }

  function startLongPress() {
    if (!onSkip) return
    timerRef.current = setTimeout(() => {
      setDialogOpen(true)
    }, LONG_PRESS_MS)
  }

  function cancelLongPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  async function handleSkipSubmit() {
    if (!password || !onSkip) return
    setSkipLoading(true)
    setError('')
    const err = await onSkip(password)
    setSkipLoading(false)
    if (err) {
      setError(err)
    } else {
      setDialogOpen(false)
      setPassword('')
    }
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border select-none',
          done ? 'bg-accent/10 border-accent/30' : 'bg-card border-border',
        )}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
      >
        <Checkbox
          checked={done}
          onCheckedChange={handleToggle}
          className={cn(
            'h-6 w-6 rounded-lg shrink-0',
            bouncing && 'animate-bounce-once',
          )}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <span
            className={cn(
              'font-semibold text-xl leading-snug',
              done && 'line-through text-muted-foreground',
            )}
          >
            {task.label}
          </span>
          {completion && (
            <span className="text-[10px] text-accent/70 font-semibold">
              ✓ {formatParisTime(completion.completedAt)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-bold px-1.5',
              !done && past && 'border-destructive text-destructive',
              !done &&
                urgent &&
                'border-orange-400 text-orange-500 animate-pulse',
              !done && !past && !urgent && 'border-accent text-accent',
              done && 'border-accent/50 text-accent/70',
            )}
          >
            {task.deadline}
          </Badge>
          {done && wasCompletedLate(completion.completedAt, task.deadline) && (
            <span className="text-[10px] text-orange-400 font-bold">
              ⏰ Hors délai
            </span>
          )}
          {done && !wasCompletedLate(completion.completedAt, task.deadline) && (
            <span className="text-[10px] text-accent font-bold">
              ✅ Dans les temps
            </span>
          )}
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setPassword('')
            setError('')
          }
        }}
      >
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-sm font-black">
              Passer cette tâche ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground text-center font-semibold">
            {task.label}
          </p>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe parent"
            className="rounded-xl text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSkipSubmit()}
            autoFocus
          />
          {error && (
            <p className="text-destructive text-xs font-semibold text-center">
              {error}
            </p>
          )}
          <Button
            onClick={handleSkipSubmit}
            disabled={skipLoading || !password}
            className="w-full rounded-xl font-black"
          >
            {skipLoading ? 'Vérification...' : 'Passer la tâche'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
