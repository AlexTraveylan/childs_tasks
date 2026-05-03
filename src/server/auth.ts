import { createServerFn } from '@tanstack/react-start'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const verifyParentPassword = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ input: z.string() }))
  .handler(async ({ data }) => {
    const hash = process.env.PARENT_PASSWORD_HASH
    if (!hash)
      throw new Error('PARENT_PASSWORD_HASH non configuré dans .env.local')
    const result = await bcrypt.compare(data.input, hash)
    return result
  })
