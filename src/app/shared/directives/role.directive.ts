import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../interfaces/auth.interface';

@Directive({
  selector: '[appRole]',
  standalone: true
})
export class RoleDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private allowedRoles: UserRole[] = [];
  private hasView = false;

  @Input() set appRole(roles: UserRole | UserRole[] | undefined) {
    if (!roles) {
      this.allowedRoles = [];
    } else {
      this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    }
    this.updateView();
  }

  constructor() {
    // Angular 19 reactive effect: dynamically redraw view if auth state changes
    effect(() => {
      // Access signal to register dependency
      this.authService.currentUser();
      this.updateView();
    });
  }

  private updateView() {
    const roleMatches = this.allowedRoles.length === 0 || this.authService.hasAnyRole(this.allowedRoles);
    
    if (roleMatches && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!roleMatches && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
