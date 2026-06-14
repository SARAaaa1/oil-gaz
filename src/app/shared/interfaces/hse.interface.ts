export interface HSEIncident {
  id: string;
  incidentNumber: string;
  type: 'LTI' | 'Near Miss' | 'First Aid' | 'Environmental' | 'Property Damage';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  date: string;
  location: string; // e.g. "Rig 12", "Base Camp"
  description: string;
  immediateActionTaken: string;
  reportedBy: string;
  status: 'Investigating' | 'Under Review' | 'Closed';
  rootCause?: string;
  correctiveAction?: string;
}

export interface PTW {
  id: string;
  permitNumber: string;
  type: 'Cold Work' | 'Hot Work' | 'Confined Space' | 'Electrical Isolation' | 'Working at Height';
  requestDate: string;
  validFrom: string;
  validTo: string;
  location: string;
  assignedProjectCode?: string;
  applicantName: string;
  safetyOfficerApproved: boolean;
  operationsManagerApproved: boolean;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Closed' | 'Expired';
  gasTestRequired: boolean;
  gasTestResults?: string;
}

export interface SafetyInspection {
  id: string;
  inspectionNumber: string;
  date: string;
  location: string;
  inspectorName: string;
  itemsAuditedCount: number;
  violationsCount: number;
  scorePercentage: number;
  status: 'Draft' | 'Submitted' | 'Action Required' | 'Closed';
}

export interface SafetyRisk {
  id: string;
  riskCode: string;
  activityDescription: string;
  hazardDescription: string;
  initialSeverity: 'Low' | 'Medium' | 'High' | 'Critical';
  controlMeasures: string;
  residualSeverity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Mitigated' | 'Closed';
}
