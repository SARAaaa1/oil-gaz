import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrMockService } from '../../shared/hr-mock.service';

interface ApplyForm {
  firstName:   string;
  fatherName:  string;
  grandName:   string;
  lastName:    string;
  email:       string;
  phone:       string;
  nationality: string;
  jobTitle:    string;
  department:  string;
  experience:  string;
  education:   string;
  university:  string;
  major:       string;
  linkedin:    string;
  coverLetter: string;
  cvFile:      File | null;
  cvFileName:  string;
}

@Component({
  selector: 'app-hr-apply',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './apply.component.html',
})
export class HrApplyComponent {
  private readonly hrService = inject(HrMockService);

  readonly currentYear = new Date().getFullYear();

  // Open positions list
  readonly positions = [
    'مهندس حفر — Drilling Engineer',
    'مهندس إنتاج — Production Engineer',
    'مهندس ميكانيكي — Mechanical Engineer',
    'مهندس كهربائي — Electrical Engineer',
    'مهندس HSE — HSE Engineer',
    'محاسب قانوني — Senior Accountant',
    'محاسب تكاليف — Cost Accountant',
    'محلل مالي — Financial Analyst',
    'مدير مشتريات — Procurement Manager',
    'أخصائي مشتريات — Procurement Specialist',
    'مدير مشاريع — Project Manager',
    'مشرف موقع — Site Supervisor',
    'مختبر تحاليل — Lab Technician',
    'فني صيانة — Maintenance Technician',
    'أخصائي موارد بشرية — HR Specialist',
    'أخرى — Other (حدد في خطاب التقديم)',
  ];

  readonly departments = [
    'الحفر — Drilling',
    'الإنتاج — Production',
    'الصيانة — Maintenance',
    'المالية — Finance',
    'المشتريات — Procurement',
    'المشاريع — Projects',
    'الموارد البشرية — HR',
    'تقنية المعلومات — IT',
    'السلامة — HSE',
    'الإدارة — Administration',
  ];

  readonly experienceOptions = [
    'حديث التخرج — Fresh Graduate',
    '1 – 3 سنوات',
    '3 – 5 سنوات',
    '5 – 10 سنوات',
    'أكثر من 10 سنوات',
  ];

  readonly educationOptions = [
    'دبلوم — Diploma',
    'بكالوريوس — Bachelor\'s',
    'ماجستير — Master\'s',
    'دكتوراه — PhD',
  ];

  readonly nationalities = [
    'سعودي — Saudi', 'مصري — Egyptian', 'أردني — Jordanian', 'سوري — Syrian',
    'يمني — Yemeni', 'لبناني — Lebanese', 'سوداني — Sudanese', 'باكستاني — Pakistani',
    'هندي — Indian', 'فلبيني — Filipino', 'بريطاني — British', 'أمريكي — American', 'أخرى — Other',
  ];

  form = signal<ApplyForm>({
    firstName: '', fatherName: '', grandName: '', lastName: '',
    email: '', phone: '', nationality: '',
    jobTitle: '', department: '',
    experience: '', education: '', university: '', major: '',
    linkedin: '', coverLetter: '',
    cvFile: null, cvFileName: '',
  });

  readonly step        = signal<1 | 2 | 3>(1);
  readonly submitted   = signal(false);
  readonly submitting  = signal(false);
  readonly dragOver    = signal(false);
  readonly errors      = signal<Partial<Record<keyof ApplyForm, string>>>({});

  // ── Field update helper ────────────────────────────────────────────────────
  set(field: keyof ApplyForm, value: string) {
    this.form.update(f => ({ ...f, [field]: value }));
    // Clear error on change
    this.errors.update(e => ({ ...e, [field]: undefined }));
  }

  // ── CV File handling ───────────────────────────────────────────────────────
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.attachFile(input.files[0]);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.attachFile(file);
  }

  attachFile(file: File) {
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      this.errors.update(e => ({ ...e, cvFile: 'الرجاء رفع ملف PDF أو Word فقط' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errors.update(e => ({ ...e, cvFile: 'حجم الملف يجب أن لا يتجاوز 5 ميجابايت' }));
      return;
    }
    this.form.update(f => ({ ...f, cvFile: file, cvFileName: file.name }));
    this.errors.update(e => ({ ...e, cvFile: undefined }));
  }

  removeFile() {
    this.form.update(f => ({ ...f, cvFile: null, cvFileName: '' }));
  }

  // ── Validation per step ───────────────────────────────────────────────────
  validateStep1(): boolean {
    const f = this.form();
    const errs: Partial<Record<keyof ApplyForm, string>> = {};
    if (!f.firstName.trim())  errs.firstName  = 'مطلوب';
    if (!f.fatherName.trim()) errs.fatherName  = 'مطلوب';
    if (!f.grandName.trim())  errs.grandName   = 'مطلوب';
    if (!f.lastName.trim())   errs.lastName    = 'مطلوب';
    if (!f.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      errs.email = 'بريد إلكتروني غير صحيح';
    if (!f.phone.trim())      errs.phone       = 'مطلوب';
    if (!f.nationality)       errs.nationality  = 'مطلوب';
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  validateStep2(): boolean {
    const f = this.form();
    const errs: Partial<Record<keyof ApplyForm, string>> = {};
    if (!f.jobTitle)    errs.jobTitle    = 'مطلوب';
    if (!f.department)  errs.department  = 'مطلوب';
    if (!f.experience)  errs.experience  = 'مطلوب';
    if (!f.education)   errs.education   = 'مطلوب';
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  nextStep() {
    if (this.step() === 1 && !this.validateStep1()) return;
    if (this.step() === 2 && !this.validateStep2()) return;
    this.step.update(s => (s < 3 ? (s + 1) as 1 | 2 | 3 : s));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep() {
    this.step.update(s => (s > 1 ? (s - 1) as 1 | 2 | 3 : s));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submit() {
    if (!this.form().cvFile) {
      this.errors.update(e => ({ ...e, cvFile: 'رفع السيرة الذاتية مطلوب' }));
      return;
    }
    this.submitting.set(true);

    const raw = this.form();
    // تحويل سنوات الخبرة إلى رقم
    let expYears = 0;
    if (raw.experience.includes('1 – 3')) expYears = 2;
    else if (raw.experience.includes('3 – 5')) expYears = 4;
    else if (raw.experience.includes('5 – 10')) expYears = 7;
    else if (raw.experience.includes('أكثر من 10')) expYears = 12;

    const candidateData = {
      fullName: this.fullName,
      email: raw.email,
      phone: raw.phone,
      position: raw.jobTitle.split(' — ')[1] || raw.jobTitle,
      department: raw.department.split(' — ')[1] || raw.department,
      experienceYears: expYears,
      education: `${raw.education.split(' — ')[1] || raw.education} - ${raw.major} (${raw.university})`,
      expectedSalary: 12000,
      availability: 'Immediate',
      bio: raw.coverLetter || `الجنسية: ${raw.nationality.split(' — ')[0]} | متقدم من خلال الموقع الإلكتروني الرسمي.`,
      linkedInUrl: raw.linkedin,
      attachments: raw.cvFile ? [{
        name: raw.cvFileName,
        url: '#',
        size: `${(raw.cvFile.size / 1024).toFixed(0)} KB`,
        type: raw.cvFileName.split('.').pop()?.toUpperCase() || 'PDF'
      }] : []
    };

    setTimeout(() => {
      const ok = this.hrService.submitApplication(candidateData);
      this.submitting.set(false);
      if (ok) {
        this.submitted.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 1500);
  }

  get fullName(): string {
    const f = this.form();
    return [f.firstName, f.fatherName, f.grandName, f.lastName].filter(Boolean).join(' ');
  }
}
