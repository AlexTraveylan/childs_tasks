import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.child.upsert({
    where: { name: 'Agathe' },
    create: { name: 'Agathe' },
    update: {},
  })
  await prisma.child.upsert({
    where: { name: 'Maxence' },
    create: { name: 'Maxence' },
    update: {},
  })
  console.log('Seed OK : Agathe et Maxence créés')
}

main()
  .catch((e) => {
    console.error('Erreur seed :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
