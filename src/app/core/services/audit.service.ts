import { Injectable, signal, inject, Injector } from '@angular/core';
import { AuditLog, AuditAction } from '../../shared/interfaces/audit.interface';
import { AuthService } from './auth.service';

const LOCAL_STORAGE_KEY = 'petroflow_audit_logs';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly injector = inject(Injector);
  private _authService?: AuthService;

  // Signal holding the active audit trail logs
  readonly logs = signal<AuditLog[]>([]);

  constructor() {
    this.logs.set(this.loadLogs());
  }

  // --- RETRIEVE OR LAZY-LOAD AUTH SERVICE ---
  private get authService(): AuthService {
    if (!this._authService) {
      this._authService = this.injector.get(AuthService);
    }
    return this._authService;
  }

  // --- APPEND ACTION TO AUDIT TRAIL ---
  log(
    actionOrParams: AuditAction | {
      action: AuditAction;
      module: string;
      entityName: string;
      entityId: string;
      oldValue?: string;
      newValue?: string;
      details?: string;
      user?: string;
      role?: string;
    },
    module?: string,
    entityName?: string,
    entityId?: string,
    oldValue?: string,
    newValue?: string,
    details?: string
  ): void {
    const currentUser = this.authService.currentUser();
    
    let actionVal: AuditAction;
    let moduleVal: string;
    let entityNameVal: string;
    let entityIdVal: string;
    let oldValueVal: string;
    let newValueVal: string;
    let detailsVal: string;
    let userVal = currentUser ? currentUser.fullName : 'System / Guest';
    let usernameVal = currentUser ? currentUser.username : 'system';
    let roleVal = currentUser ? currentUser.role : 'Guest';

    if (actionOrParams && typeof actionOrParams === 'object') {
      actionVal = actionOrParams.action;
      moduleVal = actionOrParams.module;
      entityNameVal = actionOrParams.entityName;
      entityIdVal = actionOrParams.entityId;
      oldValueVal = actionOrParams.oldValue || 'N/A';
      newValueVal = actionOrParams.newValue || 'N/A';
      detailsVal = actionOrParams.details || '';
      if (actionOrParams.user) userVal = actionOrParams.user;
      if (actionOrParams.role) roleVal = actionOrParams.role;
    } else {
      actionVal = actionOrParams as AuditAction;
      moduleVal = module || '';
      entityNameVal = entityName || '';
      entityIdVal = entityId || '';
      oldValueVal = oldValue || 'N/A';
      newValueVal = newValue || 'N/A';
      detailsVal = details || '';
    }

    const newLog: AuditLog = {
      id: `aud-${Math.random().toString(36).substr(2, 9)}`,
      user: userVal,
      username: usernameVal,
      role: roleVal,
      module: moduleVal,
      entityName: entityNameVal,
      entityId: entityIdVal,
      action: actionVal,
      oldValue: oldValueVal,
      newValue: newValueVal,
      timestamp: new Date().toISOString(),
      details: detailsVal
    };

    this.logs.update(current => [newLog, ...current]);
    this.saveLogs();
  }

  // --- PERSISTENCE UTILITIES ---
  private saveLogs(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.logs()));
    } catch (e) {
      console.error('Failed to store audit logs in LocalStorage', e);
    }
  }

  private loadLogs(): AuditLog[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Corrupted audit logs database, resetting...', e);
      }
    }
    
    // Pre-populate with realistic mock historical logs for demo purposes
    const mockLogs: AuditLog[] = [
      {
        id: 'aud-h101',
        user: 'Sophia Sterling',
        username: 'finance',
        role: 'Finance Manager',
        module: 'Procurement',
        entityName: 'PurchaseOrder',
        entityId: 'PO-2026-001',
        action: 'Approve',
        oldValue: 'Status: Pending Approval',
        newValue: 'Status: Approved',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        details: 'Approved PO-2026-001 ($42,500.00) for Rig 12 Drill Collar drill pipes.'
      },
      {
        id: 'aud-h102',
        user: 'Frank Jones',
        username: 'procurement',
        role: 'Procurement Manager',
        module: 'Procurement',
        entityName: 'PurchaseRequest',
        entityId: 'PR-2026-002',
        action: 'Status Change',
        oldValue: 'Status: PR Logged',
        newValue: 'Status: RFQ Generated',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        details: 'Converted PR-2026-002 to RFQ-2026-004.'
      },
      {
        id: 'aud-h103',
        user: 'Robert Vance',
        username: 'operations',
        role: 'Operations Manager',
        module: 'Operations',
        entityName: 'Timesheet',
        entityId: 'TS-RIG12-W22',
        action: 'Create',
        oldValue: 'Status: Empty',
        newValue: 'Status: Saved Draft',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
        details: 'Logged daily operating hours & NPT (Downtime: 2.5 hrs) for rig: Rig-12.'
      },
      {
        id: 'aud-h104',
        user: 'Jim Halpert',
        username: 'store',
        role: 'Store Keeper',
        module: 'Inventory',
        entityName: 'InventoryItem',
        entityId: 'INV-1039',
        action: 'Update',
        oldValue: 'Stock Level: 45 units',
        newValue: 'Stock Level: 145 units',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
        details: 'Received delivery shipment of Heavy Duty Drill Valves. Adjusted warehouse bin 04.'
      },
      {
        id: 'aud-h105',
        user: 'Alex Davidson',
        username: 'admin',
        role: 'Super Admin',
        module: 'Settings',
        entityName: 'Profile',
        entityId: 'u-1',
        action: 'Update',
        oldValue: 'Timezone: UTC-6',
        newValue: 'Timezone: UTC-5',
        timestamp: new Date(Date.now() - 3600000 * 28).toISOString(), // 28 hours ago
        details: 'Super Admin profile details updated. Offset set to EST.'
      },
      {
        id: 'aud-h106',
        user: 'Marcus Aurelius',
        username: 'gm',
        role: 'General Manager',
        module: 'Auth',
        entityName: 'Session',
        entityId: 'gm',
        action: 'Login',
        oldValue: 'N/A',
        newValue: 'Session Initialized',
        timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
        details: 'User authenticated from workstation IP: 192.168.10.45.'
      }
    ];

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockLogs));
    } catch(e) {}
    
    return mockLogs;
  }
}
