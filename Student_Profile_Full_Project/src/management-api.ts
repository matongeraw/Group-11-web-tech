import type { User } from "firebase/auth"

export async function managementRequest<T>(
  user: User,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await user.getIdToken()
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) return undefined as T
  const body: unknown = await response.json()
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "The request could not be completed."
    throw new Error(message)
  }
  return body as T
}
