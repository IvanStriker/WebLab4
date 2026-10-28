import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { toAppError } from './errors';
import { ProfileChanges, TokenResponse, User } from './models';
import { NoticeStore } from './notice.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly notices = inject(NoticeStore);
  private readonly router = inject(Router);
  private refreshing$: Observable<string> | null = null;

  login(username: string, password: string): Observable<User> {
    return this.http.post<TokenResponse>('/api/auth/login', { username, password }).pipe(
      tap((tokens) => this.store.setTokens(tokens)),
      switchMap(() => this.loadMe()),
    );
  }

  register(username: string, email: string, password: string): Observable<User> {
    return this.http
      .post<User>('/api/auth/register', { username, email, password })
      .pipe(switchMap(() => this.login(username, password)));
  }

  loadMe(): Observable<User> {
    return this.http.get<User>('/api/auth/me').pipe(tap((user) => this.store.setUser(user)));
  }

  updateProfile(changes: ProfileChanges): Observable<User> {
    return this.http.patch<TokenResponse>('/api/auth/me', changes).pipe(
      tap((tokens) => this.store.setTokens(tokens)),
      switchMap(() => this.loadMe()),
    );
  }

  deleteMe(): Observable<void> {
    return this.http.delete<void>('/api/auth/me');
  }

  accountDeleted(): void {
    this.store.clear();
    this.notices.success('Учетная запись удалена, вы вышли из системы');
    this.router.navigate(['/login']);
  }

  restoreSession(): Observable<unknown> {
    if (!this.store.hasTokens()) {
      return of(null);
    }
    return this.loadMe().pipe(
      catchError((error) => {
        const user = this.store.userFromToken();
        if (user && toAppError(error).status !== 401) {
          this.store.setUser(user);
          this.notices.error(toAppError(error).message);
        }
        return of(null);
      }),
    );
  }

  refresh(): Observable<string> {
    const refreshToken = this.store.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Нет refresh-токена'));
    }
    if (!this.refreshing$) {
      this.refreshing$ = this.http.post<TokenResponse>('/api/auth/refresh', { refreshToken }).pipe(
        tap((tokens) => this.store.setTokens(tokens)),
        map((tokens) => tokens.accessToken),
        finalize(() => (this.refreshing$ = null)),
        shareReplay(1),
      );
    }
    return this.refreshing$;
  }

  logout(): Observable<unknown> {
    const refreshToken = this.store.refreshToken();
    this.store.clear();
    if (!refreshToken) {
      return of(null);
    }
    return this.http.post('/api/auth/logout', { refreshToken }).pipe(catchError(() => of(null)));
  }

  expireSession(message: string): void {
    const wasLoggedIn = this.store.hasTokens();
    this.store.clear();
    if (wasLoggedIn) {
      this.notices.error(message);
    }
    const returnUrl = this.router.url.startsWith('/login') ? null : this.router.url;
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }
}
