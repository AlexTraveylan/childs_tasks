import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { ChildPanel, ENCOURAGEMENTS } from '#/components/ChildPanel'
import { validateAndSyncConfig, loadTasksForDay } from '#/server/config'
import { getChildren } from '#/server/children'
import {
  getOrCreateSession,
  updateSessionCompletions,
  validateSession,
} from '#/server/sessions'
import { verifyParentPassword } from '#/server/auth'
import { useTaskStore } from '#/store/taskStore'
import {
  getParisDate,
  getParisDayName,
  getParisPeriod,
  getParisTimeLabel,
  getParisDateLabel,
} from '#/lib/date'
import type { Task } from '#/lib/config'
import type { CompletionRecord } from '#/server/sessions'

export const Route = createFileRoute('/')({
  component: TasksPage,
})

type Child = { id: number; name: string; points: number }

function TasksPage() {
  const [mounted, setMounted] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [tasks, setTasks] = useState<Record<string, Task[]>>({})
  const [sessionIds, setSessionIds] = useState<Record<string, number>>({})
  const [time, setTime] = useState('')
  const [period, setPeriod] = useState<'matin' | 'soir'>(() => getParisPeriod())
  const [day, setDay] = useState(() => getParisDayName())
  const [messages, setMessages] = useState<Record<string, string>>({})
  const messageTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  )

  const {
    completions,
    setCompletion,
    removeCompletion,
    resetChild,
    resetIfStale,
    validated,
    setValidated,
  } = useTaskStore()

  useEffect(() => {
    setMounted(true)
    setTime(getParisTimeLabel())
    resetIfStale()

    const tick = setInterval(() => {
      setTime(getParisTimeLabel())
      resetIfStale()
      setPeriod(getParisPeriod())
      setDay(getParisDayName())
    }, 10000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!mounted) return

    async function init() {
      await validateAndSyncConfig()
      const kids = await getChildren()
      setChildren(kids)

      const date = getParisDate()
      const tasksMap: Record<string, Task[]> = {}
      const sessMap: Record<string, number> = {}

      for (const child of kids) {
        const t = await loadTasksForDay({
          data: { period, day, childName: child.name.toLowerCase() },
        })
        tasksMap[child.name] = t
        const sess = await getOrCreateSession({
          data: { childId: child.id, date, period, day },
        })
        sessMap[child.name] = sess.id
      }

      setTasks(tasksMap)
      setSessionIds(sessMap)
    }

    init().catch(console.error)
  }, [mounted, period, day])

  async function handleValidate(
    childName: string,
    password: string,
    honest: boolean,
  ): Promise<string | null> {
    try {
      const ok = await verifyParentPassword({ data: { input: password } })
      if (!ok) return 'Mot de passe incorrect'
      const sessionId = sessionIds[childName]
      const childTasks = tasks[childName] ?? []
      await validateSession({ data: { sessionId, honest, tasks: childTasks } })
      const kids = await getChildren()
      setChildren(kids)
      resetChild(childName)
      setValidated(childName)
      return null
    } catch {
      return 'Erreur lors de la validation'
    }
  }

  async function handleToggle(childName: string, taskIndex: number) {
    const childCompletions = completions[childName] ?? {}
    const sessionId = sessionIds[childName]
    if (!sessionId) return

    const alreadyDone = taskIndex in childCompletions

    if (alreadyDone) {
      removeCompletion(childName, taskIndex)
    } else {
      const now = new Date().toISOString()
      setCompletion(childName, taskIndex, now)

      const rand =
        ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
      setMessages((m) => ({ ...m, [childName]: rand }))
      if (childName in messageTimers.current)
        clearTimeout(messageTimers.current[childName])
      messageTimers.current[childName] = setTimeout(
        () => setMessages((m) => ({ ...m, [childName]: '' })),
        2000,
      )
    }

    const updated = { ...childCompletions }
    if (alreadyDone) {
      delete updated[taskIndex]
    } else {
      updated[taskIndex] = { completedAt: new Date().toISOString() }
    }

    const records: CompletionRecord[] = Object.entries(updated).map(
      ([idx, c]) => ({
        taskIndex: Number(idx),
        completedAt: c.completedAt,
        onTime: true,
      }),
    )

    await updateSessionCompletions({
      data: { sessionId, completions: records },
    })
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <header className="bg-primary text-primary-foreground p-3 text-center shadow-md flex-shrink-0">
        <div className="text-2xl font-black">{time || '...'}</div>
        <div className="text-xs font-semibold opacity-90 capitalize">
          {getParisDateLabel()} · {period === 'matin' ? '☀️ Matin' : '🌙 Soir'}
        </div>
      </header>

      <div className="flex flex-1 divide-x divide-border overflow-hidden min-h-0">
        {children.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground font-semibold">
            Chargement...
          </div>
        ) : (
          children.map((child) => (
            <div key={child.id} className="flex-1 overflow-auto min-w-0">
              <ChildPanel
                childName={child.name}
                points={child.points}
                tasks={tasks[child.name] ?? []}
                completions={completions[child.name] ?? {}}
                onToggle={(idx) => handleToggle(child.name, idx)}
                lastMessage={messages[child.name]}
                validated={validated[child.name] ?? false}
                onValidate={(pwd, honest) =>
                  handleValidate(child.name, pwd, honest)
                }
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
