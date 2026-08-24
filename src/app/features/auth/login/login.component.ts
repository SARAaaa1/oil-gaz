import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule, LanguageSwitcherComponent],
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
  readonly showPassword = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }
  
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

    this.authService.loginRaw(
      this.loginForm.username,
      this.loginForm.password,
      this.loginForm.rememberMe
    ).subscribe({
      next: (user) => {
        this.isLoading.set(false);

        // ✅ TASK 5: mustChangePassword — توجيه إجباري لتغيير كلمة المرور
        if (this.authService.mustChangePassword()) {
          this.notificationService.warning(
            'auth.must_change_password_title',
            'auth.must_change_password_desc'
          );
          this.router.navigate(['/profile'], { queryParams: { tab: 'password' } });
          return;
        }

        this.notificationService.success(
          'notifications.login_success_title',
          'notifications.login_success_desc',
          { name: user.fullName, role: user.role }
        );

        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (_err) => {
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


  setMode(newMode: 'login' | 'forgot'): void {
    this.mode.set(newMode);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}
