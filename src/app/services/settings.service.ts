import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SiteSettings } from '../models';

export type SettingsChanges = Partial<Omit<SiteSettings, 'smtpPassSet'>> & { smtpPass?: string };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  get(): Promise<SiteSettings> {
    return firstValueFrom(this.http.get<SiteSettings>('/api/settings.php'));
  }

  save(changes: SettingsChanges): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/settings.php', changes));
  }

  sendTestMail(to: string): Promise<unknown> {
    return firstValueFrom(this.http.post('/api/settings.php', { to }));
  }
}
