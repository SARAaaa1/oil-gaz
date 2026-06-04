export type AuditAction =
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Approve'
  | 'Reject'
  | 'Login'
  | 'Logout'
  | 'Status Change';

export interface AuditLog {
  id: string;
  user: string;        // fullName of the user
  username: string;    // login username
  role: string;        // UserRole name
  module: string;      // e.g., 'Procurement', 'Inventory', 'Operations', 'Auth', 'Settings'
  entityName: string;  // e.g., 'PurchaseRequest', 'RFQ', 'PO', 'Timesheet', 'InventoryItem', 'Session', 'Profile'
  entityId: string;    // ID of the target resource
  action: AuditAction;
  oldValue: string;    // serialized JSON or human-readable description
  newValue: string;    // serialized JSON or human-readable description
  timestamp: string;   // ISO 8601 string
  details?: string;    // Additional context notes
}
