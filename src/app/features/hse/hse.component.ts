import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RoleDirective } from '../../shared/directives/role.directive';
import { HSEIncident, PTW, SafetyInspection, SafetyRisk } from '../../shared/interfaces/hse.interface';
import { Project } from '../../shared/interfaces/project.interface';
import { WorkflowService } from '../../core/services/workflow.service';
import { AuditService } from '../../core/services/audit.service';

@Component({
  selector: 'app-hse',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RoleDirective],
  templateUrl: './hse.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HseComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly workflowService = inject(WorkflowService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly auditService = inject(AuditService);

  // Core signals
  readonly incidents = this.mockDataService.hseIncidents;
  readonly ptws = this.mockDataService.ptws;
  readonly inspections = this.mockDataService.safetyInspections;
  readonly risks = this.mockDataService.safetyRisks;
  readonly projects = this.workflowService.projects;

  // UI States
  readonly activeTab = signal<'dashboard' | 'ptw' | 'inspections' | 'risks'>('dashboard');
  readonly searchQuery = signal<string>('');

  // Modal States
  readonly showIncidentModal = signal<boolean>(false);
  readonly showPtwModal = signal<boolean>(false);
  readonly showRiskModal = signal<boolean>(false);
  readonly showInspectionModal = signal<boolean>(false);
  readonly showInvestigateModal = signal<boolean>(false);
  readonly selectedIncident = signal<HSEIncident | null>(null);

  // Form: Incident Report
  incidentType: 'LTI' | 'Near Miss' | 'First Aid' | 'Environmental' | 'Property Damage' = 'Near Miss';
  incidentSeverity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  incidentDate = new Date().toISOString().split('T')[0];
  incidentLocation = '';
  incidentDescription = '';
  incidentImmediateAction = '';
  incidentReportedBy = '';

  // Form: Investigation Closeout
  rootCause = '';
  correctiveAction = '';

  // Form: PTW Request
  ptwType: 'Cold Work' | 'Hot Work' | 'Confined Space' | 'Electrical Isolation' | 'Working at Height' = 'Cold Work';
  ptwLocation = '';
  ptwProjectCode = '';
  ptwApplicant = '';
  ptwValidFrom = new Date().toISOString().slice(0, 16); // format for datetime-local
  ptwValidTo = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString().slice(0, 16);
  ptwGasTestRequired = false;

  // Form: Risk Entry
  riskActivity = '';
  riskHazard = '';
  riskInitialSeverity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
  riskControlMeasures = '';
  riskResidualSeverity: 'Low' | 'Medium' | 'High' = 'Low';

  // Form: Inspection Entry
  inspectionLocation = '';
  inspectionInspector = '';
  inspectionAuditedCount = 10;
  inspectionViolationsCount = 0;
  inspectionScore = 100;

  // Computed HSE KPIs
  readonly kpis = computed(() => {
    const incs = this.incidents();
    const activePtws = this.ptws().filter(p => p.status === 'Approved').length;
    
    // Average safety inspection score
    const auds = this.inspections();
    const avgScore = auds.length > 0 
      ? auds.reduce((sum, a) => sum + a.scorePercentage, 0) / auds.length 
      : 100;

    // LTI count
    const ltiCount = incs.filter(i => i.type === 'LTI').length;

    // Closed incident ratio
    const closedCount = incs.filter(i => i.status === 'Closed').length;

    return {
      ltiCount,
      ltiFreeDays: ltiCount === 0 ? 365 : Math.floor(Math.random() * 30),
      activePtws,
      avgScore,
      closedIncidentsRatio: `${closedCount}/${incs.length}`
    };
  });

  // Filtered lists based on search
  readonly filteredIncidents = computed(() => {
    let list = this.incidents();
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      list = list.filter(i => 
        i.incidentNumber.toLowerCase().includes(query) ||
        i.location.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.reportedBy.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly filteredPtws = computed(() => {
    let list = this.ptws();
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      list = list.filter(p => 
        p.permitNumber.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.applicantName.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly filteredInspections = computed(() => {
    let list = this.inspections();
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      list = list.filter(i => 
        i.inspectionNumber.toLowerCase().includes(query) ||
        i.location.toLowerCase().includes(query) ||
        i.inspectorName.toLowerCase().includes(query)
      );
    }
    return list;
  });

  readonly filteredRisks = computed(() => {
    let list = this.risks();
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      list = list.filter(r => 
        r.riskCode.toLowerCase().includes(query) ||
        r.activityDescription.toLowerCase().includes(query) ||
        r.hazardDescription.toLowerCase().includes(query)
      );
    }
    return list;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.hse' }
    ]);
  }

  // Report Incident
  openReportIncidentModal() {
    this.incidentType = 'Near Miss';
    this.incidentSeverity = 'Low';
    this.incidentDate = new Date().toISOString().split('T')[0];
    this.incidentLocation = '';
    this.incidentDescription = '';
    this.incidentImmediateAction = '';
    this.incidentReportedBy = 'David Miller';
    this.showIncidentModal.set(true);
  }

  submitIncident() {
    if (!this.incidentLocation || !this.incidentDescription || !this.incidentImmediateAction) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const incNum = 'INC-2026-' + Math.floor(100 + Math.random() * 900);
    const newInc: HSEIncident = {
      id: 'inc-' + Math.random().toString(36).substring(2, 9),
      incidentNumber: incNum,
      type: this.incidentType,
      severity: this.incidentSeverity,
      date: this.incidentDate,
      location: this.incidentLocation,
      description: this.incidentDescription,
      immediateActionTaken: this.incidentImmediateAction,
      reportedBy: this.incidentReportedBy,
      status: 'Investigating'
    };

    this.incidents.update(prev => [newInc, ...prev]);

    // Also push to Audit logs
    this.auditService.log({
      action: 'Create',
      module: 'HSE',
      entityName: 'HSEIncident',
      entityId: incNum,
      details: `HSE Incident logged: ${incNum} (${this.incidentType}) at ${this.incidentLocation}.`
    });

    this.showIncidentModal.set(false);
    this.notificationService.success('hse.incident_logged_title', 'hse.incident_logged_desc');
  }

  // Open Investigate modal to close incident
  openInvestigateModal(inc: HSEIncident) {
    this.selectedIncident.set(inc);
    this.rootCause = inc.rootCause || '';
    this.correctiveAction = inc.correctiveAction || '';
    this.showInvestigateModal.set(true);
  }

  submitInvestigation() {
    const inc = this.selectedIncident();
    if (!inc) return;

    if (!this.rootCause || !this.correctiveAction) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    this.incidents.update(list => 
      list.map(i => i.id === inc.id ? { 
        ...i, 
        rootCause: this.rootCause, 
        correctiveAction: this.correctiveAction, 
        status: 'Closed' 
      } : i)
    );

    this.showInvestigateModal.set(false);
    this.notificationService.success('hse.investigation_closed_title', 'hse.investigation_closed_desc');
  }

  // Apply Permit (PTW)
  openAddPtwModal() {
    this.ptwType = 'Cold Work';
    this.ptwLocation = '';
    this.ptwProjectCode = this.projects()[0]?.code || '';
    this.ptwApplicant = 'Sven Larson';
    this.ptwValidFrom = new Date().toISOString().slice(0, 16);
    this.ptwValidTo = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString().slice(0, 16);
    this.ptwGasTestRequired = false;
    this.showPtwModal.set(true);
  }

  submitPtw() {
    if (!this.ptwLocation || !this.ptwApplicant) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const ptwNum = 'PTW-2026-' + Math.floor(100 + Math.random() * 900);
    const newPtw: PTW = {
      id: 'ptw-' + Math.random().toString(36).substring(2, 9),
      permitNumber: ptwNum,
      type: this.ptwType,
      requestDate: new Date().toISOString().split('T')[0],
      validFrom: this.ptwValidFrom.replace('T', ' '),
      validTo: this.ptwValidTo.replace('T', ' '),
      location: this.ptwLocation,
      assignedProjectCode: this.ptwProjectCode || undefined,
      applicantName: this.ptwApplicant,
      safetyOfficerApproved: false,
      operationsManagerApproved: false,
      status: 'Pending Approval',
      gasTestRequired: this.ptwGasTestRequired
    };

    this.ptws.update(prev => [newPtw, ...prev]);
    this.showPtwModal.set(false);
    this.notificationService.success('hse.ptw_submitted_title', 'hse.ptw_submitted_desc');
  }

  // Double signatures logic for PTW approvals
  approvePtw(ptwId: string, role: 'safety' | 'operations') {
    this.ptws.update(list => 
      list.map(p => {
        if (p.id === ptwId) {
          const update = { ...p };
          if (role === 'safety') {
            update.safetyOfficerApproved = true;
          } else {
            update.operationsManagerApproved = true;
          }

          // If both approved, set status to Approved
          if (update.safetyOfficerApproved && update.operationsManagerApproved) {
            update.status = 'Approved';
            // Mock gas test results if required
            if (update.gasTestRequired) {
              update.gasTestResults = '0% LEL, 20.9% O2, 0ppm H2S (Normal limits)';
            }
          }
          return update;
        }
        return p;
      })
    );

    this.notificationService.success('hse.ptw_approved_title', 'hse.ptw_approved_desc');
  }

  // Safety Inspection
  openAddInspectionModal() {
    this.inspectionLocation = '';
    this.inspectionInspector = 'David Miller';
    this.inspectionAuditedCount = 20;
    this.inspectionViolationsCount = 0;
    this.inspectionScore = 100;
    this.showInspectionModal.set(true);
  }

  submitInspection() {
    if (!this.inspectionLocation) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const insNum = 'SI-2026-' + Math.floor(100 + Math.random() * 900);
    const score = Number(this.inspectionScore) || 100;
    const status: 'Closed' | 'Action Required' = score >= 90 ? 'Closed' : 'Action Required';

    const newIns: SafetyInspection = {
      id: 'si-' + Math.random().toString(36).substring(2, 9),
      inspectionNumber: insNum,
      date: new Date().toISOString().split('T')[0],
      location: this.inspectionLocation,
      inspectorName: this.inspectionInspector,
      itemsAuditedCount: Number(this.inspectionAuditedCount) || 10,
      violationsCount: Number(this.inspectionViolationsCount) || 0,
      scorePercentage: score,
      status: status
    };

    this.inspections.update(prev => [newIns, ...prev]);
    this.showInspectionModal.set(false);
    this.notificationService.success('hse.inspection_logged_title', 'hse.inspection_logged_desc');
  }

  // Risk Entry
  openAddRiskModal() {
    this.riskActivity = '';
    this.riskHazard = '';
    this.riskInitialSeverity = 'Medium';
    this.riskControlMeasures = '';
    this.riskResidualSeverity = 'Low';
    this.showRiskModal.set(true);
  }

  submitRisk() {
    if (!this.riskActivity || !this.riskHazard || !this.riskControlMeasures) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }

    const codeNum = 'RSK-OPS-' + Math.floor(100 + Math.random() * 900);
    const newRisk: SafetyRisk = {
      id: 'rsk-' + Math.random().toString(36).substring(2, 9),
      riskCode: codeNum,
      activityDescription: this.riskActivity,
      hazardDescription: this.riskHazard,
      initialSeverity: this.riskInitialSeverity,
      controlMeasures: this.riskControlMeasures,
      residualSeverity: this.riskResidualSeverity,
      status: 'Mitigated'
    };

    this.risks.update(prev => [newRisk, ...prev]);
    this.showRiskModal.set(false);
    this.notificationService.success('hse.risk_added_title', 'hse.risk_added_desc');
  }
}
