import { createServerFn } from '@tanstack/react-start'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '#/db'
import type { Task, Reward } from '#/lib/config'

const CONFIG_ROOT = join(process.cwd(), 'config')
const PERIODS = ['matin', 'soir'] as const
const DAYS = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const

export const validateAndSyncConfig = createServerFn({ method: 'GET' }).handler(
  async () => {
    const refPath = join(CONFIG_ROOT, 'matin', 'lundi')
    if (!existsSync(refPath)) {
      throw new Error(
        `Config manquante : le dossier ${refPath} n'existe pas. Créez la structure config/ selon la spec 02-config-json.md`,
      )
    }

    const refChildren = readdirSync(refPath).filter(
      (f) => existsSync(join(refPath, f)) && !f.startsWith('.'),
    )

    if (refChildren.length !== 2) {
      throw new Error(
        `Config invalide : exactement 2 enfants attendus dans config/matin/lundi/, trouvé ${refChildren.length} : [${refChildren.join(', ')}]. Vérifiez les noms de dossiers.`,
      )
    }

    for (const period of PERIODS) {
      for (const day of DAYS) {
        const dayPath = join(CONFIG_ROOT, period, day)
        if (!existsSync(dayPath)) {
          throw new Error(`Dossier manquant : ${dayPath}`)
        }
        const children = readdirSync(dayPath).filter((f) => !f.startsWith('.'))
        const sorted = [...children].map((c) => c.toLowerCase()).sort()
        const refSorted = [...refChildren].map((c) => c.toLowerCase()).sort()
        if (JSON.stringify(sorted) !== JSON.stringify(refSorted)) {
          throw new Error(
            `Config invalide : noms d'enfants incohérents dans ${dayPath}.\nAttendu : [${refSorted.join(', ')}], trouvé : [${sorted.join(', ')}]\nVérifiez les noms de dossiers — une typo empêchera l'app de fonctionner.`,
          )
        }
      }
    }

    for (const childFolder of refChildren) {
      await prisma.child.upsert({
        where: { name: childFolder },
        create: { name: childFolder },
        update: {},
      })
    }

    await prisma.child.deleteMany({
      where: { name: { notIn: refChildren } },
    })

    return refChildren
  },
)

export const loadTasksForDay = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { period: string; day: string; childName: string }) => data,
  )
  .handler(async ({ data }) => {
    const filePath = join(
      CONFIG_ROOT,
      data.period,
      data.day,
      data.childName,
      'tasks.json',
    )
    if (!existsSync(filePath)) {
      throw new Error(`Fichier de tâches manquant : ${filePath}`)
    }
    return JSON.parse(readFileSync(filePath, 'utf-8')) as Task[]
  })

export const loadRewards = createServerFn({ method: 'GET' }).handler(
  async () => {
    const filePath = join(CONFIG_ROOT, 'rewards.json')
    if (!existsSync(filePath)) {
      throw new Error(`Fichier rewards.json manquant : ${filePath}`)
    }
    return JSON.parse(readFileSync(filePath, 'utf-8')) as Reward[]
  },
)
