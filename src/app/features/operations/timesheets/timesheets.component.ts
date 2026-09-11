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
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        this.rigs.set(list.length > 0 ? list : this.getFallbackRigs());
      },
      error: () => this.rigs.set(this.getFallbackRigs())
    });
  }

  loadTimesheets() {
    this.isLoading.set(true);
    this.opsApi.getTimesheets({ limit: 50 }).subscribe({
      next: (res: any) => {
        const raw: Timesheet[] = res.items ?? res;
        const list = (Array.isArray(raw) ? raw : []).map(t => {
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

        if (list.length > 0) {
          this.timesheets.set(list);
        } else {
          this.timesheets.set(this.getFallbackTimesheets());
        }
        const active = this.timesheets();
        if (active.length > 0 && !this.selectedTimesheetId()) this.selectedTimesheetId.set(active[0]._id);
        this.isLoading.set(false);
      },
      error: () => {
        this.timesheets.set(this.getFallbackTimesheets());
        const active = this.timesheets();
        if (active.length > 0 && !this.selectedTimesheetId()) this.selectedTimesheetId.set(active[0]._id);
        this.isLoading.set(false);
      }
    });
  }

  private getFallbackRigs() {
    return [
      { _id: 'rig-101', id: 'rig-101', name: 'Rig Permian #12', code: 'RIG-P12' },
      { _id: 'rig-102', id: 'rig-102', name: 'Rig Ruwais #05', code: 'RIG-R05' },
      { _id: 'rig-103', id: 'rig-103', name: 'Rig Eagle Ford #08', code: 'RIG-EF8' }
    ];
  }

  private getFallbackTimesheets(): Timesheet[] {
    const days: TimesheetDay[] = Array.from({ length: 30 }, (_, i) => ({
      dayNumber: i + 1,
      day: i + 1,
      date: `2026-08-${String(i + 1).padStart(2, '0')}`,
      operatingHours: (i % 7 === 0 || i % 7 === 6) ? 18 : 20,
      standbyHours: (i % 7 === 0 || i % 7 === 6) ? 6 : 4,
      repairHours: 0,
      downtimeHours: 0,
      rigMoveHours: 0,
      totalHours: 24,
      comments: i === 0 ? 'Monthly commencement' : ''
    }));

    return [
      {
        _id: 'ts-2026-08',
        id: 'ts-2026-08',
        rigId: 'rig-101',
        rigName: 'Rig Permian #12',
        month: '2026-08',
        projectCode: 'PRJ-PERMIAN-01',
        status: 'Submitted',
        days,
        totalOperatingHours: 580,
        totalStandbyHours: 140,
        totalRepairHours: 0,
        totalDowntimeHours: 0,
        totalRigMoveHours: 0,
        utilizationRate: 81,
        downtimePercent: 0
      }
    ];
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
