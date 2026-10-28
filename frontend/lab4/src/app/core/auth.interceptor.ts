import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

const PUBLIC_URLS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout'];

function withToken(request: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) {
    return request;
  }
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (PUBLIC_URLS.includes(request.url)) {
    return next(request);
  }
  const store = inject(AuthStore);
  const auth = inject(AuthService);

  return next(withToken(request, store.accessToken())).pipe(
    catchError((error) => {
      if (!isUnauthorized(error)) {
        return throwError(() => error);
      }
      if (!store.hasTokens()) {
        auth.expireSession('Требуется авторизация');
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        catchError((refreshError) => {
          if (refreshError instanceof HttpErrorResponse && (refreshError.status === 0 || refreshError.status >= 500)) {
            return throwError(() => refreshError);
          }
          auth.expireSession('Сессия истекла, войдите снова');
          return throwError(() => error);
        }),
        switchMap((token) => next(withToken(request, token))),
        catchError((retryError) => {
          if (isUnauthorized(retryError)) {
            auth.expireSession(retryError.error?.error ?? 'Сессия истекла, войдите снова');
          }
          return throwError(() => retryError);
        }),
      );
    }),
  );
};
