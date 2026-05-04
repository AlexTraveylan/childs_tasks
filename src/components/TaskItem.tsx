import { useState } from 'react'
import { Checkbox } from '#/components/ui/checkbox'
import { Badge } from '#/components/ui/badge'
import {
  isPastDeadline,
  minutesUntilDeadline,
  formatParisTime,
} from '#/lib/date'
import type { Task } from '#/lib/config'
import type { Completion } from '#/store/taskStore'
import { cn } from '#/lib/utils'

interface TaskItemProps {
  task: Task
  completion?: Completion
  onToggle: () => void
}

export function TaskItem({ task, completion, onToggle }: TaskItemProps) {
  const [bouncing, setBouncing] = useState(false)
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

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border',
        done ? 'bg-accent/10 border-accent/30' : 'bg-card border-border',
      )}
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
        {done && past && (
          <span className="text-[10px] text-orange-400 font-bold">
            ⏰ Hors délai
          </span>
        )}
      </div>
    </div>
  )
}
