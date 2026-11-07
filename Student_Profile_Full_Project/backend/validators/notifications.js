import { z } from 'zod'

export const notificationSchema = z.object({
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().min(2).max(1000),
  audience: z.enum(['students', 'lecturers', 'all']).default('students')
}).strict()
