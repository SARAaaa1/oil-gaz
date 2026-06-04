import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Permission, UserRole } from '../../shared/interfaces/auth.interface';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  // Check if authenticated first
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // 1. Permission-based checks
  const requiredPermission = route.data['permission'] as Permission | undefined;
  if (requiredPermission && !authService.hasPermission(requiredPermission)) {
    notificationService.danger(
      'Access Denied',
      `Your account does not have the '${requiredPermission}' permission required to access this resource.`
    );
    return router.createUrlTree(['/dashboard']);
  }

  // 2. Role-based checks
  const requiredRoles = route.data['roles'] as UserRole[] | undefined;
  if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
    notificationService.danger(
      'Access Denied',
      `Your current role (${authService.userRole()}) does not have permission to view this view.`
    );
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
