import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { Candidate } from '../../../../shared/interfaces/candidate.interface';

type PipelineStatus = 'Under Review' | 'Shortlisted' | 'Interviewing' | 'Offered' | 'Hired';

interface PipelineStage {
  id: PipelineStatus;
  label: string;
  labelAr: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}

@Component({
  selector: 'app-hr-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './candidates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrCandidatesComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hrService = inject(HrMockService);

  searchQuery = '';
  newNote = '';

  readonly selectedCand = signal<Candidate | null>(null);
  readonly activeTab = signal<string>('personal');
  readonly activeStageFilter = signal<PipelineStatus | 'ALL'>('ALL');

  readonly stages: PipelineStage[] = [
    { id: 'Under Review', labelAr: 'قيد المراجعة',   label: 'Under Review', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', icon: '🔍' },
    { id: 'Shortlisted',  labelAr: 'مقبول مبدئياً', label: 'Shortlisted',  color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', icon: '✅' },
    { id: 'Interviewing', labelAr: 'في مرحلة المقابلة', label: 'Interviewing', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '🎤' },
    { id: 'Offered',      labelAr: 'تم الترشيح',    label: 'Offered',      color: '#059669', bg: '#F0FDF4', border: '#A7F3D0', icon: '📋' },
    { id: 'Hired',        labelAr: 'تم التعيين',    label: 'Hired',        color: '#009FE3', bg: '#EFF6FF', border: '#BFDBFE', icon: '🎉' },
  ];

  readonly tabs = [
    { id: 'personal',     label: 'البيانات الشخصية' },
    { id: 'qualifications', label: 'المؤهلات والمهارات' },
    { id: 'cv',           label: 'السيرة الذاتية' },
    { id: 'timeline',     label: 'السجل الوظيفي' },
    { id: 'notes',        label: 'الملاحظات' },
  ];

  // Only show candidates who have been approved (not New or Rejected)
  readonly pipelineCandidates = computed(() => {
    const validStatuses: PipelineStatus[] = ['Under Review', 'Shortlisted', 'Interviewing', 'Offered', 'Hired'];
    const q = this.searchQuery.trim().toLowerCase();

    return this.hrService.candidates().filter(c => {
      const isValid = validStatuses.includes(c.status as PipelineStatus);
      if (!isValid) return false;
      if (q) {
        return c.fullName.toLowerCase().includes(q) ||
               c.position.toLowerCase().includes(q) ||
               c.department.toLowerCase().includes(q);
      }
      return true;
    });
  });

  // Group candidates by pipeline stage
  readonly candidatesByStage = computed(() => {
    const result: Record<PipelineStatus, Candidate[]> = {
      'Under Review': [],
      'Shortlisted': [],
      'Interviewing': [],
      'Offered': [],
      'Hired': [],
    };
    for (const c of this.pipelineCandidates()) {
      const s = c.status as PipelineStatus;
      if (result[s]) result[s].push(c);
    }
    return result;
  });

  // Filtered by active stage filter for the list view
  readonly filteredCandidates = computed(() => {
    const filter = this.activeStageFilter();
    if (filter === 'ALL') return this.pipelineCandidates();
    return this.pipelineCandidates().filter(c => c.status === filter);
  });

  getStage(id: string): PipelineStage | undefined {
    return this.stages.find(s => s.id === id);
  }

  selectCandidate(cand: Candidate) {
    this.selectedCand.set(cand);
    this.activeTab.set('personal');
  }

  closeDetail() {
    this.selectedCand.set(null);
  }

  overrideHiring() {
    const cand = this.selectedCand();
    if (!cand) return;
    this.hrService.overrideHiring(cand.id);
    // refresh selected to reflect new status
    const updated = this.hrService.candidates().find(c => c.id === cand.id);
    if (updated) this.selectedCand.set(updated);
  }

  advanceStage(cand: Candidate) {
    this.hrService.moveToCandidates(cand.id);
    const updated = this.hrService.candidates().find(c => c.id === cand.id);
    if (updated && this.selectedCand()?.id === cand.id) {
      this.selectedCand.set(updated);
    }
  }

  getStatusStyle(status?: Candidate['status']): { color: string; bg: string; border: string } {
    switch (status) {
      case 'Under Review': return { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
      case 'Shortlisted':  return { color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' };
      case 'Interviewing': return { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
      case 'Offered':      return { color: '#059669', bg: '#F0FDF4', border: '#A7F3D0' };
      case 'Hired':        return { color: '#009FE3', bg: '#EFF6FF', border: '#BFDBFE' };
      default:             return { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
    }
  }

  getStageIcon(status?: Candidate['status']): string {
    switch (status) {
      case 'Under Review': return '🔍';
      case 'Shortlisted':  return '✅';
      case 'Interviewing': return '🎤';
      case 'Offered':      return '📋';
      case 'Hired':        return '🎉';
      default:             return '👤';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'المرشحون للتوظيف' }
    ]);
  }
}
