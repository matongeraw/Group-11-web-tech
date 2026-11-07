import { z } from 'zod'

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  studentId: z.string().trim().regex(/^\d{6}$/)
}).strict()
