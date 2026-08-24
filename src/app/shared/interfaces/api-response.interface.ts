// ─── Unified TransformInterceptor Wrapper ─────────────────────────────────────
// كل الـ responses من الـ Backend مغلّفة في هذا الشكل

export interface ApiWrapper<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

// ─── Paginated Shape ──────────────────────────────────────────────────────────
// ما يرجعه /admin/users داخل data

export interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface AuthUserDto {
  id?: string;
  _id?: string;
  username: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  role: string;
  permissions: string[];
  department?: string | { code: string; nameEn: string; nameAr: string } | null;
  avatar?: string;
  preferredLanguage?: string;
  timezone?: string;
  lastLogin?: string;
  mustChangePassword?: boolean;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUserDto;
}

export interface MeResponseDto {
  id?: string;
  _id?: string;
  username: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  role: string;
  permissions: string[];
  department?: { code: string; nameEn: string; nameAr: string } | null;
  avatar?: string;
  avatarUrl?: string | null;
  preferredLanguage?: string;
  timezone?: string;
  emailNotifications?: boolean;
  mustChangePassword?: boolean;
  lastLogin?: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Admin Users DTOs ─────────────────────────────────────────────────────────

export interface BackendUser {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  roleId?: { _id: string; name: string; nameAr: string; permissions?: string[] };
  departmentId?: { _id: string; code: string; nameEn: string; nameAr: string } | null;
  employeeId?: string;
  avatar?: string;
  avatarUrl?: string | null;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
  preferredLanguage?: string;
  timezone?: string;
  emailNotifications?: boolean;
  mustChangePassword?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
}

export interface CreateUserBackendDto {
  username: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  roleId: string;
  departmentId?: string;
  employeeId?: string;
  password?: string;
  preferredLanguage?: string;
  status?: string;
}

export interface UpdateUserBackendDto {
  fullName?: string;
  fullNameAr?: string;
  email?: string;
  departmentId?: string;
  employeeId?: string;
  preferredLanguage?: string;
  timezone?: string;
  emailNotifications?: boolean;
}

export interface ChangeStatusBackendDto {
  status: 'Active' | 'Inactive' | 'Suspended';
  reason?: string;
  suspendUntil?: string; // ✅ TASK 8 — مضاف الآن في الـ Backend
}

// ─── Admin Roles DTOs ─────────────────────────────────────────────────────────

export interface BackendRole {
  _id: string;
  name: string;
  nameAr?: string;
  description?: string;
  isSystem: boolean;
  permissions: BackendPermission[];
  usersCount?: number; // ✅ TASK 4 — مضاف من الـ Backend بالـ Aggregation
  createdAt?: string;
}

export interface BackendPermission {
  _id: string;
  name: string;
  description?: string;
  module?: string;
  action?: string;
}

// ─── Admin Departments DTOs ──────────────────────────────────────────────────

export interface BackendDepartment {
  _id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  parentId?: { _id: string; code: string; nameEn: string; nameAr: string } | null;
  managerId?: { _id: string; fullName: string; username: string; email?: string } | null;
  usersCount?: number; // ✅ TASK 3 — مضاف من الـ Backend بالـ Aggregation
  createdAt?: string;
  updatedAt?: string;
}

// ─── Role Users (TASK 2) ──────────────────────────────────────────────────────

export interface BackendRoleUser {
  _id: string;
  username: string;
  fullName: string;
  fullNameAr?: string;
  email: string;
  avatar?: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
  departmentId?: { _id: string; nameAr: string; nameEn: string; code: string } | null;
  lastLogin?: string;
}

// ─── Token Storage Keys ───────────────────────────────────────────────────────

export const TOKEN_KEYS = {
  ACCESS:   'petroflow_auth_token',
  REFRESH:  'petroflow_refresh_token',
  REMEMBER: 'petroflow_remembered_username'
} as const;
