import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { HrMockService } from '../../shared/hr-mock.service';
import { Candidate } from '../../../../shared/interfaces';

interface AiSummaryResult {
  skillsScore: number;
  experienceSummary: string;
  suitabilityScore: number;
  pros: string[];
  cons: string[];
  recommendation: 'مقبول للمقابلة' | 'مرفوض' | 'للمراجعة اللاحقة';
}

@Component({
  selector: 'app-hr-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './applications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrApplicationsComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  readonly hrService = inject(HrMockService);

  // Core Filter Models
  searchQuery = '';
  deptFilter = 'ALL';
  posFilter = '';
  statusFilter = 'ALL';

  // Smart AI and Custom Filtration Models
  minExpFilter = signal<number>(0);
  eduFilter = signal<string>('ALL');
  keywordFilter = signal<string>('');

  // Selected candidate for details view
  readonly selectedCandidate = signal<Candidate | null>(null);

  // AI Summary States
  readonly aiLoading = signal(false);
  readonly aiSummary = signal<AiSummaryResult | null>(null);

  // Modal Model for manually adding candidates
  showAddModal = signal(false);
  form = this.getEmptyForm();

  // Computed Filtered List integrating default + smart filtration
  readonly filteredApplications = computed(() => {
    let list = this.hrService.candidates();
    const query = this.searchQuery.trim().toLowerCase();
    const dept = this.deptFilter;
    const pos = this.posFilter.trim().toLowerCase();
    const status = this.statusFilter;
    const minExp = this.minExpFilter();
    const edu = this.eduFilter();
    const keyword = this.keywordFilter().trim().toLowerCase();

    // Default filters
    if (dept !== 'ALL') {
      list = list.filter(a => a.department.toLowerCase().includes(dept.toLowerCase()));
    }
    if (pos) {
      list = list.filter(a => a.position.toLowerCase().includes(pos));
    }
    if (status !== 'ALL') {
      list = list.filter(a => a.status === status);
    }
    if (query) {
      list = list.filter(a => 
        a.fullName.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.phone.includes(query)
      );
    }

    // Smart Filtration
    if (minExp > 0) {
      list = list.filter(a => a.experienceYears >= minExp);
    }
    if (edu !== 'ALL') {
      list = list.filter(a => a.education.toLowerCase().includes(edu.toLowerCase()));
    }
    if (keyword) {
      list = list.filter(a => 
        (a.skills && a.skills.some(s => s.toLowerCase().includes(keyword))) ||
        (a.bio && a.bio.toLowerCase().includes(keyword)) ||
        a.education.toLowerCase().includes(keyword)
      );
    }

    return list;
  });

  // Calculate matching score (mock AI logic)
  getMatchingScore(c: Candidate): number {
    let score = 50; // base score
    if (c.experienceYears >= 5) score += 20;
    else if (c.experienceYears >= 2) score += 10;

    if (c.education.toLowerCase().includes('b.sc') || c.education.toLowerCase().includes('بكالوريوس') || c.education.toLowerCase().includes('engineering')) score += 20;
    else if (c.education.toLowerCase().includes('m.sc') || c.education.toLowerCase().includes('ماجستير')) score += 30;

    if (c.skills && c.skills.length > 2) score += 10;
    return Math.min(score, 100);
  }

  // Trigger AI Summary Generation
  generateAiSummary(c: Candidate) {
    this.aiLoading.set(true);
    this.aiSummary.set(null);

    setTimeout(() => {
      // Logic simulation based on Candidate profile
      const score = this.getMatchingScore(c);
      const isEng = c.position.toLowerCase().includes('drill') || c.position.toLowerCase().includes('engineer');
      
      const summary: AiSummaryResult = {
        skillsScore: score - 5,
        experienceSummary: `يمتلك المتقدم خبرة قدرها ${c.experienceYears} سنوات في مجال ${c.position}. تعليمه الأكاديمي هو (${c.education}). مهاراته الأساسية ومسيرته المهنية تتناسب بشكل ممتاز مع احتياجات قسم ${c.department}.`,
        suitabilityScore: score,
        pros: [
          `خبرة عملية مناسبة (${c.experienceYears} سنوات)`,
          `مؤهل أكاديمي متوافق مع الوظيفة`,
          c.linkedInUrl ? 'يمتلك حساب LinkedIn مهني محدث' : 'بيانات التواصل كاملة وموثقة'
        ],
        cons: [
          c.experienceYears < 3 ? 'سنوات الخبرة في الجانب الأدنى للمستوى المطلوب' : 'يتطلب تدريباً خفيفاً على أنظمة الشركة الداخلية'
        ],
        recommendation: score >= 80 ? 'مقبول للمقابلة' : score >= 60 ? 'للمراجعة اللاحقة' : 'مرفوض'
      };

      this.aiSummary.set(summary);
      this.aiLoading.set(false);
    }, 1500);
  }

  selectCandidate(c: Candidate) {
    this.selectedCandidate.set(c);
    this.aiSummary.set(null); // Reset summary
  }

  closeDetails() {
    this.selectedCandidate.set(null);
    this.aiSummary.set(null);
  }

  resetFilters() {
    this.searchQuery = '';
    this.deptFilter = 'ALL';
    this.posFilter = '';
    this.statusFilter = 'ALL';
    this.minExpFilter.set(0);
    this.eduFilter.set('ALL');
    this.keywordFilter.set('');
  }

  openAddModal() {
    this.form = this.getEmptyForm();
    this.showAddModal.set(true);
  }

  closeAddModal() {
    this.showAddModal.set(false);
  }

  submit() {
    if (!this.form.fullName.trim() || !this.form.email.trim() || !this.form.phone.trim() || !this.form.position.trim()) {
      return;
    }
    const success = this.hrService.submitApplication(this.form);
    if (success) {
      this.closeAddModal();
    }
  }

  moveCandidate(id: string) {
    this.hrService.moveToCandidates(id);
    // Sync active details if currently selected
    const updated = this.hrService.candidates().find(x => x.id === id);
    if (updated && this.selectedCandidate()?.id === id) {
      this.selectedCandidate.set(updated);
    }
  }

  rejectCandidate(id: string) {
    this.hrService.rejectCandidate(id);
    // Sync active details if currently selected
    const updated = this.hrService.candidates().find(x => x.id === id);
    if (updated && this.selectedCandidate()?.id === id) {
      this.selectedCandidate.set(updated);
    }
  }

  isSelectedCandidate(id: string): boolean {
    const active = this.selectedCandidate();
    return active ? active.id === id : false;
  }

  getStatusClass(status: Candidate['status']): string {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'Under Review': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Shortlisted': return 'bg-teal-50 text-teal-700 border border-teal-100';
      case 'Interviewing': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'Offered': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'Hired': return 'bg-green-50 text-green-700 border border-green-100';
      case 'Rejected': return 'bg-red-50 text-red-700 border border-red-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  }

  getEmptyForm() {
    return {
      fullName: '',
      email: '',
      phone: '',
      position: '',
      department: 'Engineering',
      experienceYears: 0,
      education: '',
      expectedSalary: 10000
    };
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.hr' },
      { label: 'hr.applications.title' }
    ]);
  }
}
