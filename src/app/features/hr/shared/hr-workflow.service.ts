import { Injectable, signal, computed, inject } from '@angular/core';
import { WorkflowInstance, HrApprovalStep, HrNotification, AutomationRule } from '../../../shared/interfaces';


import { NotificationService } from '../../../core/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class HrWorkflowService {
  private readonly notify = inject(NotificationService);

  readonly workflowInstances = signal<WorkflowInstance[]>([
    {
      id: 'wf-1',
      type: 'Leave Request',
      employeeId: 'emp1',
      employeeName: 'Ahmad Al-Dosari',
      submittedBy: 'Ahmad Al-Dosari',
      submittedAt: '2026-07-01',
      priority: 'Medium',
      status: 'Pending',
      currentStep: 1,
      totalSteps: 2,
      description: 'Annual Leave request for 10 days starting July 10, 2026.',
      steps: [
        { stepNumber: 1, role: 'Department Manager', assigneeName: 'Khalid Al-Shehri', status: 'Pending' },
        { stepNumber: 2, role: 'HR Operations', assigneeName: 'Sarah Al-Qahtani', status: 'Pending' }
      ]
    },
    {
      id: 'wf-2',
      type: 'New Hire',
      employeeName: 'Rami Al-Harbi',
      submittedBy: 'Sarah Al-Qahtani',
      submittedAt: '2026-07-02',
      priority: 'High',
      status: 'Pending',
      currentStep: 1,
      totalSteps: 3,
      description: 'Onboarding setup and contract generation for new Drilling Engineer.',
      steps: [
        { stepNumber: 1, role: 'HR Manager', assigneeName: 'Sarah Al-Qahtani', status: 'Pending' },
        { stepNumber: 2, role: 'IT Operations', assigneeName: 'IT Support', status: 'Pending' },
        { stepNumber: 3, role: 'Finance Control', assigneeName: 'Fatima Al-Otaibi', status: 'Pending' }
      ]
    },
    {
      id: 'wf-3',
      type: 'Overtime Request',
      employeeId: 'emp3',
      employeeName: 'Mohammed Al-Zahrani',
      submittedBy: 'Mohammed Al-Zahrani',
      submittedAt: '2026-07-03',
      priority: 'Low',
      status: 'Approved',
      currentStep: 2,
      totalSteps: 2,
      description: 'Overtime compensation for weekend drilling supervisor coverage.',
      steps: [
        { stepNumber: 1, role: 'Department Manager', assigneeName: 'Khalid Al-Shehri', status: 'Approved', actionedAt: '2026-07-03' },
        { stepNumber: 2, role: 'HR Operations', assigneeName: 'Sarah Al-Qahtani', status: 'Approved', actionedAt: '2026-07-03' }
      ]
    }
  ]);

  readonly notifications = signal<HrNotification[]>([
    { id: 'n-1', title: 'New Leave Request Approval', message: 'Ahmad Al-Dosari submitted a leave request requiring your approval.', read: false, createdAt: '2026-07-01 10:15', type: 'Approval' },
    { id: 'n-2', title: 'Asset Assigned', message: 'Laptop Asset #LP-9087 has been successfully assigned to Sarah Al-Qahtani.', read: false, createdAt: '2026-07-02 08:30', type: 'Info' },
    { id: 'n-3', title: 'Passport Expiry Warning', message: 'John Smith\'s passport will expire in 45 days.', read: true, createdAt: '2026-06-30 09:00', type: 'Warning' }
  ]);

  readonly automationRules = signal<AutomationRule[]>([
    { id: 'r-1', name: 'Auto Generate Account on Hiring', trigger: 'Candidate Status -> Hired', action: 'Create Active User Account + Assign Employee Number', active: true },
    { id: 'r-2', name: 'Auto Notify IT of New Hire', trigger: 'New Hire Workflow Initiated', action: 'Send Email Notification to IT support queue', active: true },
    { id: 'r-3', name: 'Leave Carry-Forward Rule', trigger: 'End of Year Cycle', action: 'Transfer unused leaves up to 5 days to next year balance', active: false }
  ]);

  // Computed Values
  readonly pendingApprovalsCount = computed(() =>
    this.workflowInstances().filter(w => w.status === 'Pending').length
  );

  readonly unreadNotificationsCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  // Workflow CRUD actions
  approveStep(wfId: string, stepNum: number, comment?: string) {
    this.workflowInstances.update(list => list.map(w => {
      if (w.id === wfId) {
        const updatedSteps = w.steps.map(s =>
          s.stepNumber === stepNum ? { ...s, status: 'Approved' as const, actionedAt: new Date().toISOString().split('T')[0], comments: comment } : s
        );
        
        // Determine overall status
        const allApproved = updatedSteps.every(s => s.status === 'Approved');
        let nextStep = w.currentStep;
        if (!allApproved && updatedSteps[stepNum - 1].status === 'Approved') {
          nextStep = stepNum + 1;
        }

        return {
          ...w,
          steps: updatedSteps,
          currentStep: nextStep,
          status: allApproved ? ('Approved' as const) : ('Pending' as const)
        };
      }
      return w;
    }));
    this.notify.success('hr.workflow.msg_approved', 'Workflow step approved successfully.');
  }

  rejectStep(wfId: string, stepNum: number, reason?: string) {
    this.workflowInstances.update(list => list.map(w => {
      if (w.id === wfId) {
        const updatedSteps = w.steps.map(s =>
          s.stepNumber === stepNum ? { ...s, status: 'Rejected' as const, actionedAt: new Date().toISOString().split('T')[0], comments: reason } : s
        );

        return {
          ...w,
          steps: updatedSteps,
          status: 'Rejected' as const
        };
      }
      return w;
    }));
    this.notify.warning('hr.workflow.msg_rejected', 'Workflow step rejected.');
  }

  addWorkflow(wf: Partial<WorkflowInstance>) {
    const newWf: WorkflowInstance = {
      id: `wf-${Date.now()}`,
      type: 'Leave Request',
      submittedBy: 'HR Portal',
      submittedAt: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      status: 'Pending',
      currentStep: 1,
      totalSteps: 1,
      description: '',
      steps: [],
      ...wf
    };
    this.workflowInstances.update(list => [...list, newWf]);
    this.notify.success('hr.common.success', 'New workflow initiated successfully.');
  }

  // Notification actions
  markNotifAsRead(id: string) {
    this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
  }

  markAllNotifsAsRead() {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.notify.success('hr.common.success', 'All notifications marked as read.');
  }

  // Automation Rule actions
  toggleRule(ruleId: string) {
    this.automationRules.update(list => list.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
    this.notify.success('hr.common.success', 'Automation rule state updated.');
  }

  addRule(rule: Partial<AutomationRule>) {
    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: '',
      trigger: '',
      action: '',
      active: true,
      ...rule
    };
    this.automationRules.update(list => [...list, newRule]);
    this.notify.success('hr.common.success', 'Automation rule created.');
  }
}
