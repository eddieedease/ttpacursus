import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserRole } from '../models';

interface AuthState {
  authenticated: boolean;
  role: UserRole | null;
  name: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /** null = session check still pending */
  private readonly state = signal<AuthState | null>(null);

  readonly authenticated = computed(() => this.state()?.authenticated ?? null);
  readonly role = computed(() => this.state()?.role ?? null);
  readonly name = computed(() => this.state()?.name ?? null);

  async check(): Promise<void> {
    try {
      this.state.set(await firstValueFrom(this.http.get<AuthState>('/api/auth.php')));
    } catch {
      this.state.set({ authenticated: false, role: null, name: null });
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      this.state.set(
        await firstValueFrom(this.http.post<AuthState>('/api/auth.php', { username, password }))
      );
      return true;
    } catch {
      this.state.set({ authenticated: false, role: null, name: null });
      return false;
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.delete('/api/auth.php'));
    this.state.set({ authenticated: false, role: null, name: null });
  }
}
