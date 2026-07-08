import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /** null = session check still pending */
  readonly authenticated = signal<boolean | null>(null);

  async check(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ authenticated: boolean }>('/api/auth.php')
      );
      this.authenticated.set(res.authenticated);
    } catch {
      this.authenticated.set(false);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post<{ authenticated: boolean }>('/api/auth.php', { username, password })
      );
      this.authenticated.set(true);
      return true;
    } catch {
      this.authenticated.set(false);
      return false;
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.delete('/api/auth.php'));
    this.authenticated.set(false);
  }
}
