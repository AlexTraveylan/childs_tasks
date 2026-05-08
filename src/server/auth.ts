import { createServerFn } from '@tanstack/react-start'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function checkParentPassword(input: string): Promise<boolean> {
  const hash = process.env.PARENT_PASSWORD_HASH
  if (!hash)
    throw new Error('PARENT_PASSWORD_HASH non configuré dans .env.local')
  return bcrypt.compare(input, hash)
}

export const verifyParentPassword = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ input: z.string() }))
  .handler(async ({ data }) => checkParentPassword(data.input))
