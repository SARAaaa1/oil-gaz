import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../shared/interfaces/auth.interface';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { DascoLogoComponent } from '../../../shared/components/dasco-logo/dasco-logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LanguageSwitcherComponent, DascoLogoComponent],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // UI State Signals
  readonly mode = signal<'login' | 'forgot'>('login');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  
  // Login Form Model
  loginForm = {
    username: '',
    password: '',
    rememberMe: false
  };

  // Forgot Password Form Model
  forgotForm = {
    email: ''
  };

  // Demo Credentials List for easy review
  readonly demoRoles = [
    { label: 'Super Admin', username: 'admin', pass: 'admin123', desc: 'Full System Control' },
    { label: 'General Manager', username: 'gm', pass: 'gm123', desc: 'Operations & Finance' },
    { label: 'Procurement Mgr', username: 'procurement', pass: 'procure123', desc: 'PRs, RFQs & PO creation' },
    { label: 'Finance Manager', username: 'finance', pass: 'finance123', desc: 'PO Approvals & Reports' },
    { label: 'Operations Mgr', username: 'operations', pass: 'ops123', desc: 'Rigs & Timesheets' },
    { label: 'Store Keeper', username: 'store', pass: 'store123', desc: 'Warehouse & Inventory' },
    { label: 'Project Manager', username: 'project', pass: 'project123', desc: 'Operations & Timesheets' },
    { label: 'Employee Crew', username: 'employee', pass: 'emp123', desc: 'Read-only logs' }
  ];

  ngOnInit(): void {
    // Populate username if rememberMe was previously set
    const remembered = this.authService.getRememberedUsername();
    if (remembered) {
      this.loginForm.username = remembered;
      this.loginForm.rememberMe = true;
    }

    // If user is already authenticated, redirect to dashboard or returnUrl
    if (this.authService.isAuthenticated()) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigateByUrl(returnUrl);
    }
  }

  // --- ACTIONS ---

  handleLogin(event: Event): void {
    event.preventDefault();
    if (!this.loginForm.username || !this.loginForm.password) {
      this.errorMessage.set('auth.error_empty');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(
      this.loginForm.username,
      this.loginForm.password,
      this.loginForm.rememberMe
    ).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.notificationService.success(
          'notifications.login_success_title',
          'notifications.login_success_desc',
          { name: user.fullName, role: user.role }
        );
        
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('auth.error_invalid');
      }
    });
  }

  handleForgotPassword(event: Event): void {
    event.preventDefault();
    if (!this.forgotForm.email) {
      this.errorMessage.set('auth.error_email_required');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.forgotPassword(this.forgotForm.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('auth.success_reset_sent');
        this.forgotForm.email = '';
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('auth.error_reset_failed');
      }
    });
  }

  autofill(username: string, pass: string): void {
    this.loginForm.username = username;
    this.loginForm.password = pass;
    this.errorMessage.set(null);
  }

  setMode(newMode: 'login' | 'forgot'): void {
    this.mode.set(newMode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
