import { auth } from "../firebase"
import { z } from "zod"
import type { AccountStatus, User, UserRole } from "../types"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const timestampSchema = z.union([
  z.string(),
  z.object({ _seconds: z.number(), _nanoseconds: z.number() })
])
const userSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  fullName: z.string(),
  role: z.enum(["student", "lecturer", "admin"]).optional(),
  status: z.enum(["pending", "active", "suspended"]).optional(),
  studentId: z.string().optional(),
  programme: z.string().optional(),
  createdAt: timestampSchema.optional(),
  updatedAt: timestampSchema.optional()
}).passthrough()
const currentUserSchema = userSchema.extend({
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(["student", "lecturer", "admin"]),
  status: z.enum(["pending", "active", "suspended"])
})
const meResponseSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  role: z.enum(["student", "lecturer", "admin"]),
  profile: currentUserSchema
})
const registrationResponseSchema = z.object({
  message: z.string(),
  status: z.literal("pending")
})
const usersResponseSchema = z.object({ users: z.array(userSchema) })
const messageResponseSchema = z.object({ message: z.string() })
const notificationResponseSchema = z.object({ id: z.string() })

export async function apiRequest<T>(path: string, schema: z.ZodType<T>, options: RequestOptions = {}): Promise<T> {
  if (!auth?.currentUser) throw new ApiError("Sign in is required to make this request.", 401)
  const token = await auth.currentUser.getIdToken()
  const headers = new Headers(options.headers)
  headers.set("Authorization", `Bearer ${token}`)

  let body: string | undefined
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(options.body)
  }

  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...options,
    headers,
    body
  })
  const responseText = await response.text()
  let responseBody: unknown
  if (responseText) {
    try {
      responseBody = JSON.parse(responseText)
    } catch {
      throw new ApiError("The server returned an invalid response.", response.status)
    }
  }

  if (!response.ok) {
    const message = typeof responseBody === "object" && responseBody !== null && "error" in responseBody
      ? responseBody.error
      : undefined
    throw new ApiError(typeof message === "string" ? message : "The request was not successful.", response.status)
  }
  if (!responseText) throw new ApiError("The server returned an empty response.", response.status)
  const parsed = schema.safeParse(responseBody)
  if (!parsed.success) throw new ApiError("The server response did not match the expected format.", response.status)
  return parsed.data
}

export interface RegistrationResponse {
  message: string
  status: "pending"
}

export interface MeResponse {
  uid: string
  email: string
  role: UserRole
  profile: User
}

export function getCurrentProfile(signal?: AbortSignal): Promise<MeResponse> {
  return apiRequest("/me", meResponseSchema, { signal })
}

export function completeRegistration(input: { fullName: string; studentId: string }): Promise<RegistrationResponse> {
  return apiRequest("/profile/complete-registration", registrationResponseSchema, {
    method: "POST",
    body: input
  })
}

export interface UserSummary {
  uid: string
  fullName: string
  programme?: string
  email?: string
  studentId?: string
  role?: UserRole
  status?: AccountStatus
}

export function listUsers(signal?: AbortSignal): Promise<{ users: UserSummary[] }> {
  return apiRequest("/users", usersResponseSchema, { signal })
}

export function updateAccountStatus(uid: string, status: Extract<AccountStatus, "active" | "suspended">): Promise<{ message: string }> {
  return apiRequest(`/users/${encodeURIComponent(uid)}/status`, messageResponseSchema, {
    method: "PATCH",
    body: { status }
  })
}

export function updateUserRole(uid: string, role: UserRole): Promise<{ message: string }> {
  return apiRequest(`/admin/users/${encodeURIComponent(uid)}/role`, messageResponseSchema, {
    method: "POST",
    body: { role }
  })
}

export function createNotification(input: { title: string; message: string; audience?: "students" | "lecturers" | "all" }): Promise<{ id: string }> {
  return apiRequest("/admin/notifications", notificationResponseSchema, {
    method: "POST",
    body: input
  })
}
