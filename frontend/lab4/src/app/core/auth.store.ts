import { computed, Injectable, signal } from '@angular/core';
import { Role, TokenResponse, User } from './models';

export function tokenPayload(token: string | null): Record<string, unknown> | null {
  if (!token) {
    return null;
  }
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

const ACCESS_KEY = 'students_access';
const REFRESH_KEY = 'students_refresh';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly user = signal<User | null>(null);
  readonly accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  readonly refreshToken = signal<string | null>(localStorage.getItem(REFRESH_KEY));

  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');
  readonly hasTokens = computed(() => this.refreshToken() !== null);

  setTokens(tokens: TokenResponse): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);
  }

  setUser(user: User): void {
    this.user.set(user);
  }

  userFromToken(): User | null {
    const payload = tokenPayload(this.accessToken());
    if (!payload) {
      return null;
    }
    return { id: Number(payload['uid']), username: String(payload['sub']), email: '', role: payload['role'] as Role };
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
  }
}
