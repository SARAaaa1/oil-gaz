import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';
import {
  OperationsApiService,
  Timesheet,
  TimesheetDay,
  UpdateDayBody
} from '../../../core/services/operations-api.service';

@Component({
  selector: 'app-timesheets',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './timesheets.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimesheetsComponent implements OnInit {
  private readonly opsApi      = inject(OperationsApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly translate   = inject(TranslateService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly timesheets  = signal<Timesheet[]>([]);
  readonly isLoading   = signal(false);
  readonly isSaving    = signal(false);

  readonly showCreateModal = signal(false);
  readonly isCreating = signal(false);
  readonly isSubmitting = signal<string | null>(null); // stores WO ID being submitted

  // Create form
  createForm = { rigId: '', month: new Date().toISOString().slice(0, 7), projectCode: '' };

  readonly rigs = signal<any[]>([]);

  readonly selectedTimesheetId = signal<string | null>(null);
  readonly editingDay          = signal<TimesheetDay | null>(null);

  editDayForm: UpdateDayBody = {
    operatingHours: 0, standbyHours: 0, repairHours: 0,
    downtimeHours: 0, rigMoveHours: 0, comments: ''
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly activeTimesheet = computed(() => {
    const id = this.selectedTimesheetId();
    if (!id) return null;
    return this.timesheets().find(t => t._id === id) ?? null;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.timesheets' }
    ]);
    this.loadTimesheets();

    // Load rigs for the create form dropdown
    this.opsApi.getRigs().subscribe({
      next: (data: any) => this.rigs.set(Array.isArray(data) ? data : (data.data ?? [])),
      error: () => {}
    });
  }

  loadTimesheets() {
    this.isLoading.set(true);
    this.opsApi.getTimesheets({ limit: 50 }).subscribe({
      next: (res: any) => {
        const raw: Timesheet[] = res.items ?? res;
        const list = raw.map(t => {
          const totalHours = (t.totalOperatingHours + t.totalStandbyHours +
                             t.totalRepairHours + t.totalDowntimeHours + t.totalRigMoveHours) || 1;
          const utilizationRate = Math.round((t.totalOperatingHours / totalHours) * 100);
          const downtimePercent = Math.round((t.totalDowntimeHours  / totalHours) * 100);
          return {
            ...t,
            id: t._id,
            utilizationRate,
            downtimePercent,
            days: (t.days ?? []).map((d: any) => ({ ...d, day: d.day ?? d.dayNumber }))
          };
        });
        this.timesheets.set(list);
        if (list.length > 0) this.selectedTimesheetId.set(list[0]._id);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.danger('Error', 'Failed to load timesheets');
        this.isLoading.set(false);
      }
    });
  }

  onTimesheetChange(id: string) {
    this.selectedTimesheetId.set(id || null);
  }

  // ── Day Edit ───────────────────────────────────────────────────────────────
  getSumHours(day: TimesheetDay): number {
    return (day.operatingHours + day.standbyHours + day.repairHours +
            day.downtimeHours + day.rigMoveHours);
  }

  openEditDayModal(day: TimesheetDay) {
    this.editingDay.set(day);
    this.editDayForm = {
      operatingHours: day.operatingHours,
      standbyHours:   day.standbyHours,
      repairHours:    day.repairHours,
      downtimeHours:  day.downtimeHours,
      rigMoveHours:   day.rigMoveHours,
      comments:       day.comments || ''
    };
  }

  closeEditDayModal() { this.editingDay.set(null); }

  getFormSum(): number {
    const f = this.editDayForm;
    return (f.operatingHours ?? 0) + (f.standbyHours ?? 0) + (f.repairHours ?? 0) +
           (f.downtimeHours ?? 0) + (f.rigMoveHours ?? 0);
  }

  saveDayLogs(event: Event) {
    event.preventDefault();
    const sheet = this.activeTimesheet();
    const day   = this.editingDay();
    if (!sheet || !day) return;

    const total = this.getFormSum();
    if (total > 24) {
      this.notificationService.danger(
        this.translate.instant('operations.timesheets.error_hours_title'),
        this.translate.instant('operations.timesheets.error_hours_desc', { hours: total })
      );
      return;
    }

    this.isSaving.set(true);
    this.opsApi.updateTimesheetDay(sheet._id, day.dayNumber, this.editDayForm).subscribe({
      next: (updated: Timesheet) => {
        // Replace the updated timesheet in local list
        this.timesheets.update(list => list.map(t => t._id === updated._id ? updated : t));

        this.auditService.log(
          'Update', 'Operations', 'Timesheet', sheet._id,
          JSON.stringify({ day: day.dayNumber, prev: { op: day.operatingHours, sb: day.standbyHours } }),
          JSON.stringify({ day: day.dayNumber, ...this.editDayForm }),
          `Updated Day ${day.dayNumber} for ${sheet.rigName}. Total: ${total}h`
        );

        this.notificationService.success(
          this.translate.instant('operations.timesheets.success_title'),
          this.translate.instant('operations.timesheets.success_desc', { day: day.dayNumber, rig: sheet.rigName })
        );
        this.closeEditDayModal();
        this.isSaving.set(false);
      },
      error: (err: any) => {
        this.notificationService.danger('Error', err?.error?.message || 'Failed to update day');
        this.isSaving.set(false);
      }
    });
  }

  // ── Create Timesheet ───────────────────────────────────────────────────────
  openCreateTimesheet() {
    this.createForm = {
      rigId: this.rigs()[0]?._id ?? this.rigs()[0]?.id ?? '',
      month: new Date().toISOString().slice(0, 7),
      projectCode: ''
    };
    this.showCreateModal.set(true);
  }

  saveCreateTimesheet() {
    if (!this.createForm.rigId || !this.createForm.month) {
      this.notificationService.danger('Validation', 'Rig and Month are required');
      return;
    }
    this.isCreating.set(true);
    this.opsApi.createTimesheet({
      rigId: this.createForm.rigId,
      month: this.createForm.month,
      projectCode: this.createForm.projectCode || undefined,
    }).subscribe({
      next: (created: any) => {
        const normalized = { ...created, id: created._id ?? created.id, utilizationRate: 0, downtimePercent: 0 };
        this.timesheets.update(list => [normalized, ...list]);
        this.showCreateModal.set(false);
        this.isCreating.set(false);
        this.notificationService.success('Timesheet Created', `Timesheet for ${created.rigName ?? 'Rig'} - ${this.createForm.month} created`);
      },
      error: (err: any) => {
        this.isCreating.set(false);
        if (err?.status === 409) {
          this.notificationService.danger('Duplicate', 'A timesheet for this rig and month already exists');
        } else {
          this.notificationService.danger('Error', err?.error?.message || 'Failed to create timesheet');
        }
      }
    });
  }

  // ── Submit / Approve Timesheet ─────────────────────────────────────────────
  submitTimesheet(ts: any) {
    const tsId = ts._id ?? ts.id;
    this.isSubmitting.set(tsId);
    this.opsApi.updateTimesheetStatus(tsId, 'Submitted').subscribe({
      next: (updated: any) => {
        this.timesheets.update(list =>
          list.map(t => (t._id ?? (t as any).id) === tsId ? { ...t, status: 'Submitted' } : t)
        );
        this.isSubmitting.set(null);
        this.notificationService.success('Submitted', 'Timesheet submitted for approval');
      },
      error: (err: any) => {
        this.isSubmitting.set(null);
        this.notificationService.danger('Error', err?.error?.message || 'Failed to submit timesheet');
      }
    });
  }

  approveTimesheet(ts: any) {
    const tsId = ts._id ?? ts.id;
    this.isSubmitting.set(tsId);
    this.opsApi.updateTimesheetStatus(tsId, 'Approved').subscribe({
      next: (updated: any) => {
        this.timesheets.update(list =>
          list.map(t => (t._id ?? (t as any).id) === tsId
            ? { ...t, status: 'Approved', utilizationRate: updated.summary?.utilizationRate ?? (t as any).utilizationRate }
            : t
          )
        );
        this.isSubmitting.set(null);
        this.notificationService.success('Approved', 'Timesheet approved successfully');
      },
      error: (err: any) => {
        this.isSubmitting.set(null);
        this.notificationService.danger('Error', err?.error?.message || 'Failed to approve timesheet');
      }
    });
  }
}
