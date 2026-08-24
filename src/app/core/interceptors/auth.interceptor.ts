import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TOKEN_KEYS } from '../../shared/interfaces/api-response.interface';

/**
 * Auth HTTP Interceptor
 * 1. Attaches Bearer token to every request automatically
 * 2. Handles 401 → clears session and redirects to /login
 * 3. Passes through all other errors unchanged
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Read token from localStorage (remember me) or sessionStorage (session only)
  const token =
    localStorage.getItem(TOKEN_KEYS.ACCESS) ||
    sessionStorage.getItem(TOKEN_KEYS.ACCESS);

  // Clone request with Authorization header if token exists
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid → clear session and redirect to login
        localStorage.removeItem(TOKEN_KEYS.ACCESS);
        localStorage.removeItem(TOKEN_KEYS.REFRESH);
        sessionStorage.removeItem(TOKEN_KEYS.ACCESS);
        sessionStorage.removeItem(TOKEN_KEYS.REFRESH);
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
