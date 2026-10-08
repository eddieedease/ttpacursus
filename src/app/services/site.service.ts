import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface SiteStatus {
  construction: boolean;
  unlocked: boolean;
}

/** "Under construction" state of the public site. */
@Injectable({ providedIn: 'root' })
export class SiteService {
  private readonly http = inject(HttpClient);
  private readonly status = signal<SiteStatus | null>(null);

  /** true when the public site may be shown (not under construction, or unlocked). */
  readonly unlocked = computed(() => this.status()?.unlocked ?? false);

  async load(force = false): Promise<SiteStatus> {
    const current = this.status();
    if (current && !force) {
      return current;
    }
    let status: SiteStatus;
    try {
      status = await firstValueFrom(this.http.get<SiteStatus>('/api/site.php'));
    } catch {
      // API unreachable: do not lock visitors out of the static pages.
      status = { construction: false, unlocked: true };
    }
    this.status.set(status);
    return status;
  }

  async unlock(password: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post('/api/site.php', { password }));
      this.status.set({ construction: true, unlocked: true });
      return true;
    } catch {
      return false;
    }
  }
}
