export type UserRole = "student" | "lecturer" | "admin"
export type AccountStatus = "pending" | "active" | "suspended"
export type VerificationStatus = "draft" | "pending" | "verified" | "rejected"
export type TimestampValue = string | { _seconds: number; _nanoseconds: number }

export interface User {
  uid: string
  email: string
  fullName: string
  role: UserRole
  status: AccountStatus
  studentId?: string
  programme?: string
  createdAt?: TimestampValue
  updatedAt?: TimestampValue
}

export interface StudentProfile {
  uid: string
  displayName?: string
  programme?: string
  yearOfStudy?: number
  bio?: string
  visibility: "private" | "assigned"
  createdAt: TimestampValue
  updatedAt: TimestampValue
}

export interface Skill {
  id: string
  ownerUid: string
  name: string
  category: string
  proficiency: "beginner" | "intermediate" | "advanced"
  evidencePath?: string
  status: VerificationStatus
  createdAt: TimestampValue
  updatedAt: TimestampValue
}

export interface Activity {
  id: string
  ownerUid: string
  name: string
  category: string
  organization: string
  role: string
  startDate: string
  endDate?: string
  description: string
  achievements: string[]
  evidencePaths: string[]
  status: VerificationStatus
  createdAt: TimestampValue
  updatedAt: TimestampValue
}

export interface Achievement {
  id: string
  ownerUid: string
  title: string
  category: string
  issuer?: string
  date?: string
  description: string
  evidencePaths: string[]
  status: VerificationStatus
  createdAt: TimestampValue
  updatedAt: string
}

export interface VerificationRecord {
  id: string
  studentUid: string
  itemType: "skill" | "activity" | "achievement"
  itemId: string
  reviewerUid: string
  decision: "verified" | "rejected"
  reason?: string
  createdAt: string
}

export interface RecommendationRequest {
  id: string
  studentUid: string
  assignedLecturerUid: string
  purpose: string
  recipient: string
  status: "pending" | "approved" | "rejected"
  verifiedRecordIds: string[]
  createdAt: TimestampValue
  updatedAt: TimestampValue
}

export interface ProfileShare {
  id: string
  ownerUid: string
  allowedSections: string[]
  expiresAt: TimestampValue
  revokedAt?: TimestampValue
  createdAt: TimestampValue
}

export interface AuditLog {
  id: string
  actorUid: string
  targetUid: string
  action: string
  createdAt: TimestampValue
}

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "empty"; data: T }
  | { status: "error"; message: string }
