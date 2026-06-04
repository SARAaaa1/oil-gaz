export type UserRole =
  | 'Super Admin'
  | 'General Manager'
  | 'Finance Manager'
  | 'Procurement Manager'
  | 'Operations Manager'
  | 'Store Keeper'
  | 'Project Manager'
  | 'Employee';

export type Permission =
  | 'view:dashboard'
  | 'view:procurement'
  | 'edit:procurement'
  | 'approve:po'
  | 'view:inventory'
  | 'edit:inventory'
  | 'view:vendors'
  | 'edit:vendors'
  | 'view:rigs'
  | 'edit:rigs'
  | 'view:timesheets'
  | 'edit:timesheets'
  | 'view:reports'
  | 'view:settings'
  | 'edit:settings';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: Permission[];
  lastLogin?: string;
  avatar?: string;
  token?: string; // JWT Ready
  createdAt?: string;
  companyName?: string;
  preferredLanguage?: string;
  timezone?: string;
  emailNotifications?: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
