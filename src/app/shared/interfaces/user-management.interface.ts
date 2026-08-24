import { UserRole, Permission } from './auth.interface';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserStatus = 'Active' | 'Inactive' | 'Suspended' | 'Pending';

// ─── Core Interfaces ─────────────────────────────────────────────────────────

export interface Department {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  parentId?: string;
  managerId?: string;
  managerName?: string;
  usersCount?: number;
  createdAt?: string;
}

export interface Role {
  id: string;
  name: UserRole;
  nameAr: string;
  description: string;
  isSystem: boolean;
  usersCount: number;
  permissions: Permission[];
  createdAt?: string;
}

export interface ManagedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  role: UserRole;
  roleName?: string;          // Arabic label
  departmentId?: string;
  department?: Department;
  employeeId?: string;
  vendorId?: string;
  avatar?: string;            // initials
  avatarUrl?: string;
  status: UserStatus;
  companyName?: string;
  preferredLanguage?: 'ar' | 'en';
  timezone?: string;
  emailNotifications?: boolean;
  mustChangePassword?: boolean;
  lastLogin?: string;
  createdAt?: string;
  createdBy?: string;
  permissions?: Permission[];
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateUserDto {
  username: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  role: UserRole;
  departmentId?: string;
  employeeId?: string;
  temporaryPassword: string;
  confirmPassword: string;
  preferredLanguage?: 'ar' | 'en';
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserDto {
  fullName?: string;
  fullNameAr?: string;
  email?: string;
  role?: UserRole;
  departmentId?: string;
  employeeId?: string;
  status?: UserStatus;
  preferredLanguage?: 'ar' | 'en';
  emailNotifications?: boolean;
}

export interface ResetPasswordDto {
  newPassword: string;
  confirmPassword: string;
  mustChangeOnLogin: boolean;
}

export interface ChangeStatusDto {
  status: UserStatus;
  reason: string;
  suspendUntil?: string;
}

// ─── Filter / Pagination ─────────────────────────────────────────────────────

export interface UsersFilter {
  search: string;
  role: string;
  departmentId: string;
  status: string;
}

// ─── Role-Permission Map ─────────────────────────────────────────────────────

export interface PermissionGroup {
  module: string;
  moduleAr: string;
  permissions: {
    key: Permission;
    label: string;
    labelAr: string;
  }[];
}
