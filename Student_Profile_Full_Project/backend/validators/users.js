import { z } from 'zod'

export const accountStatusSchema = z.object({
  status: z.enum(['active', 'suspended'])
}).strict()

export const userRoleSchema = z.object({
  role: z.enum(['student', 'lecturer', 'admin'])
}).strict()
