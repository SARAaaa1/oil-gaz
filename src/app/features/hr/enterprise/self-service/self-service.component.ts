import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { LanguageService } from '../../../../core/services/language.service';
import { HrWorkflowService } from '../../shared/hr-workflow.service';

@Component({
  selector: 'app-hr-self-service',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="space-y-6" [dir]="dir()">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center text-xl text-white font-black">
          A
        </div>
        <div>
          <h1 class="text-2xl font-black text-slate-800 tracking-tight">{{ 'hr.reports.ent_ess_title' | translate }}</h1>
          <p class="text-xs text-slate-500 font-semibold mt-0.5">Welcome back, Ahmad Al-Dosari · Sr. Drilling Engineer</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button (click)="isManagerView.set(!isManagerView())" class="px-4 py-2.5 bg-slate-850 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm">
          {{ isManagerView() ? 'Switch to Employee Portal' : 'Switch to Manager Portal' }}
        </button>
      </div>
    </div>

    @if (!isManagerView()) {
      
      <!-- Employee View -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Sidebar Navigation Tabs -->
        <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-fit space-y-1.5">
          @for (tab of employeeTabs; track tab.key) {
            <button (click)="activeTab.set(tab.key)" 
                    [class]="activeTab() === tab.key ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'" 
                    class="w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3">
              <span>{{ tab.icon }}</span>
              <span>{{ tab.label | translate }}</span>
            </button>
          }
        </div>

        <!-- Tab Workspaces -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[350px]">
          
          <!-- My Profile -->
          @if (activeTab() === 'profile') {
            <div class="space-y-4 text-xs">
              <h3 class="font-black text-slate-800 text-sm border-b pb-2">Personal Information</h3>
              <div class="grid grid-cols-2 gap-4">
                <div><p class="text-[10px] text-slate-400 font-bold uppercase">Employee ID</p><p class="font-bold text-slate-700 mt-0.5">EMP-001</p></div>
                <div><p class="text-[10px] text-slate-400 font-bold uppercase">Nationality</p><p class="font-bold text-slate-700 mt-0.5">Saudi Arabia</p></div>
                <div><p class="text-[10px] text-slate-400 font-bold uppercase">Email</p><p class="font-bold text-slate-700 mt-0.5">a.dosari&#64;petroflow.com</p></div>

                <div><p class="text-[10px] text-slate-400 font-bold uppercase">Mobile</p><p class="font-bold text-slate-700 mt-0.5">+966 50 123 4567</p></div>
              </div>
            </div>
          }

          <!-- My Attendance -->
          @if (activeTab() === 'attendance') {
            <div class="space-y-4 text-xs">
              <h3 class="font-black text-slate-800 text-sm border-b pb-2">My Monthly Attendance Summary</h3>
              <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div class="bg-green-50 p-3 rounded-xl border border-green-150"><p class="text-lg font-black text-green-700">22</p><p class="text-[9px] text-slate-400">Present</p></div>
                <div class="bg-amber-50 p-3 rounded-xl border border-amber-150"><p class="text-lg font-black text-amber-700">1</p><p class="text-[9px] text-slate-400">Late Days</p></div>
                <div class="bg-red-50 p-3 rounded-xl border border-red-150"><p class="text-lg font-black text-red-600">0</p><p class="text-[9px] text-slate-400">Absences</p></div>
              </div>
            </div>
          }

          <!-- My Leaves -->
          @if (activeTab() === 'leaves') {
            <div class="space-y-4 text-xs">
              <div class="flex justify-between items-center border-b pb-2">
                <h3 class="font-black text-slate-800 text-sm">Leave Balances</h3>
                <button (click)="openRequestModal()" class="text-[10px] font-black text-primary hover:underline">+ Request Leave</button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between">
                  <span class="font-bold text-slate-600">Annual Leave</span>
                  <span class="font-black text-slate-800">16 days</span>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between">
                  <span class="font-bold text-slate-600">Sick Leave</span>
                  <span class="font-black text-slate-800">10 days</span>
                </div>
              </div>
            </div>
          }

          <!-- My Payslips -->
          @if (activeTab() === 'payroll') {
            <div class="space-y-4 text-xs">
              <h3 class="font-black text-slate-800 text-sm border-b pb-2">My Salary & Payslips</h3>
              <div class="bg-slate-50 rounded-xl p-4 border flex justify-between items-center">
                <div>
                  <p class="font-black text-slate-850">July 2026 Payslip</p>
                  <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Net Transferred: SAR 14,800</p>
                </div>
                <button class="px-3 py-1.5 bg-primary text-white rounded-lg font-bold">Download PDF</button>
              </div>
            </div>
          }

        </div>

      </div>

    } @else {
      
      <!-- Manager Approvals Portal -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 text-xs">
        <h3 class="font-black text-slate-800 text-sm border-b pb-2">👨‍💼 Manager Approvals Worklist</h3>
        
        <div class="divide-y divide-slate-100">
          @for (wf of pendingWorkflowTasks(); track wf.id) {
            <div class="py-4 flex justify-between items-center gap-4">
              <div>
                <span class="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-bold">{{ wf.type }}</span>
                <h4 class="font-black text-slate-800 mt-1">{{ wf.description }}</h4>
                <p class="text-[10px] text-slate-400 mt-0.5">Submitted by: {{ wf.submittedBy }}</p>
              </div>
              <div class="flex gap-2">
                <button (click)="approveTask(wf)" class="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-bold">Approve</button>
                <button (click)="rejectTask(wf)" class="px-3 py-1.5 bg-red-50 text-red-650 hover:bg-red-100 rounded-lg font-bold">Reject</button>
              </div>
            </div>
          } @empty {
            <p class="text-slate-400 text-center py-6">All manager action tasks completed.</p>
          }
        </div>
      </div>

    }

    <!-- Request Modal -->
    @if (showRequestModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4" (click)="showRequestModal.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md my-16" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b bg-slate-50 rounded-t-2xl">
            <h3 class="font-black text-slate-800 text-sm">Submit Leave Request</h3>
            <button (click)="showRequestModal.set(false)" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
          </div>
          <div class="p-5 space-y-4 text-xs">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Leave Type</label>
              <select [(ngModel)]="requestForm.leaveType" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 bg-white text-xs">
                <option value="Annual">Annual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Emergency">Emergency Leave</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                <input [(ngModel)]="requestForm.start" type="date" class="w-full mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                <input [(ngModel)]="requestForm.end" type="date" class="w-full mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">Reason / Remarks</label>
              <input [(ngModel)]="requestForm.reason" type="text" class="w-full mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
            </div>
          </div>
          <div class="flex justify-end gap-2 p-4 border-t bg-slate-50 rounded-b-2xl">
            <button (click)="showRequestModal.set(false)" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold">Cancel</button>
            <button (click)="submitLeaveRequest()" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-sm">Submit</button>
          </div>
        </div>
      </div>
    }

  </div>
  `
})
export class HrSelfServiceComponent implements OnInit {
  private readonly bc = inject(BreadcrumbService);
  readonly hr = inject(HrMockService);
  readonly workflow = inject(HrWorkflowService);
  readonly lang = inject(LanguageService);

  isManagerView = signal(false);
  activeTab = signal('profile');
  showRequestModal = signal(false);
  requestForm: any = {};

  readonly dir = computed(() => this.lang.isArabic() ? 'rtl' : 'ltr');

  readonly employeeTabs = [
    { key: 'profile', label: 'hr.reports.ent_ess_my_profile', icon: '👤' },
    { key: 'attendance', label: 'hr.reports.ent_ess_my_attendance', icon: '📅' },
    { key: 'leaves', label: 'hr.reports.ent_ess_my_leaves', icon: '🍂' },
    { key: 'payroll', label: 'hr.reports.ent_ess_my_payroll', icon: '💰' }
  ];

  readonly pendingWorkflowTasks = computed(() =>
    this.workflow.workflowInstances().filter(w => w.status === 'Pending')
  );

  openRequestModal() {
    this.requestForm = { leaveType: 'Annual', start: '', end: '', reason: '' };
    this.showRequestModal.set(true);
  }

  submitLeaveRequest() {
    this.workflow.addWorkflow({
      type: 'Leave Request',
      employeeId: 'emp1',
      employeeName: 'Ahmad Al-Dosari',
      description: `${this.requestForm.leaveType} Leave request starting ${this.requestForm.start}.`,
      status: 'Pending',
      steps: [
        { stepNumber: 1, role: 'Department Manager', assigneeName: 'Khalid Al-Shehri', status: 'Pending' }
      ]
    });
    this.showRequestModal.set(false);
  }

  approveTask(wf: any) {
    this.workflow.approveStep(wf.id, wf.currentStep, 'Auto-approved from Self Service');
  }

  rejectTask(wf: any) {
    this.workflow.rejectStep(wf.id, wf.currentStep, 'Rejected from Self Service');
  }

  ngOnInit() {
    this.bc.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'navigation.hr_self_service' }
    ]);
  }
}
