import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RigTimesheet, TimesheetDayRow } from '../../../shared/interfaces/operations.interface';
import { AuditService } from '../../../core/services/audit.service';

@Component({
  selector: 'app-timesheets',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './timesheets.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimesheetsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);
  private readonly translate = inject(TranslateService);

  readonly timesheets = this.mockDataService.timesheets;

  readonly selectedTimesheetId = signal<string | null>(null);
  readonly editingDay = signal<TimesheetDayRow | null>(null);

  editDayForm = {
    operatingHours: 0,
    standbyHours: 0,
    repairHours: 0,
    downtimeHours: 0,
    rigMoveHours: 0,
    comments: ''
  };

  readonly activeTimesheet = computed(() => {
    const id = this.selectedTimesheetId();
    if (!id) return null;
    return this.timesheets().find(t => t.id === id) || null;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.operations', url: '/operations' },
      { label: 'navigation.timesheets' }
    ]);

    const sheets = this.timesheets();
    if (sheets.length > 0) {
      this.selectedTimesheetId.set(sheets[0].id);
    }
  }

  onTimesheetChange(id: string) {
    this.selectedTimesheetId.set(id ? id : null);
  }

  getSumHours(day: TimesheetDayRow): number {
    return day.operatingHours + day.standbyHours + day.repairHours + day.downtimeHours + day.rigMoveHours;
  }

  openEditDayModal(day: TimesheetDayRow) {
    this.editingDay.set(day);
    this.editDayForm = {
      operatingHours: day.operatingHours,
      standbyHours: day.standbyHours,
      repairHours: day.repairHours,
      downtimeHours: day.downtimeHours,
      rigMoveHours: day.rigMoveHours,
      comments: day.comments || ''
    };
  }

  closeEditDayModal() {
    this.editingDay.set(null);
  }

  getFormSum(): number {
    const f = this.editDayForm;
    return f.operatingHours + f.standbyHours + f.repairHours + f.downtimeHours + f.rigMoveHours;
  }

  saveDayLogs(event: Event) {
    event.preventDefault();
    const sheet = this.activeTimesheet();
    const day = this.editingDay();
    if (!sheet || !day) return;

    const total = this.getFormSum();
    if (total > 24) {
      this.notificationService.danger(
        this.translate.instant('operations.timesheets.error_hours_title'),
        this.translate.instant('operations.timesheets.error_hours_desc', { hours: total })
      );
      return;
    }

    this.mockDataService.updateTimesheetDay(sheet.id, day.day, { ...this.editDayForm });

    this.auditService.log(
      'Update', 'Operations', 'Timesheet', sheet.id,
      JSON.stringify({ day: day.day, operatingHours: day.operatingHours, standbyHours: day.standbyHours, repairHours: day.repairHours, downtimeHours: day.downtimeHours, rigMoveHours: day.rigMoveHours, comments: day.comments }),
      JSON.stringify({ day: day.day, ...this.editDayForm }),
      this.translate.instant('operations.timesheets.audit_update', { day: day.day, rig: sheet.rigName, total: total })
    );

    this.notificationService.success(
      this.translate.instant('operations.timesheets.success_title'),
      this.translate.instant('operations.timesheets.success_desc', { day: day.day, rig: sheet.rigName })
    );

    this.closeEditDayModal();
  }
}
