import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser, LoginRequest, LoginResponse } from '../models/auth.model';

// Session storage keys.
const TOKEN_KEY = 'mp_token';
const USERNAME_KEY = 'mp_username';
const ROLE_KEY = 'mp_role';

/**
 * Handles authentication against MotorPortalAPI and holds the current
 * session state.
 *
 * Storage choice: we use `sessionStorage` rather than `localStorage`.
 * Both are readable by any script on the page (i.e. neither is safe against
 * a genuine XSS vulnerability - an httpOnly cookie would be needed for that),
 * but sessionStorage at least scopes the token to a single tab and clears it
 * automatically when the tab is closed, which limits the window in which a
 * leaked/inspected value stays useful compared to localStorage persisting
 * indefinitely across sessions. For this internal operator tool that tradeoff
 * is acceptable; a future hardening pass could move to httpOnly cookies
 * issued by the API instead.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<CurrentUser | null>(this.readStoredUser());

  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(username: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { username, password };
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, body).pipe(
      tap((response) => this.setSession(response)),
    );
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setSession(response: LoginResponse): void {
    sessionStorage.setItem(TOKEN_KEY, response.token);
    sessionStorage.setItem(USERNAME_KEY, response.username);
    sessionStorage.setItem(ROLE_KEY, response.role);
    this.currentUserSignal.set({ username: response.username, role: response.role });
  }

  private readStoredUser(): CurrentUser | null {
    const username = sessionStorage.getItem(USERNAME_KEY);
    const role = sessionStorage.getItem(ROLE_KEY);
    if (username && role) {
      return { username, role };
    }
    return null;
  }
}
