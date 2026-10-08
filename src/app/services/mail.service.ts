import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MailLogEntry, MailPlaceholder, MailTemplate } from '../models';

@Injectable({ providedIn: 'root' })
export class MailService {
  private readonly http = inject(HttpClient);

  templates(): Promise<{ templates: MailTemplate[]; placeholders: MailPlaceholder[] }> {
    return firstValueFrom(
      this.http.get<{ templates: MailTemplate[]; placeholders: MailPlaceholder[] }>('/api/mail-templates.php')
    );
  }

  saveTemplate(key: string, subject: string, body: string): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/mail-templates.php', { key, subject, body }));
  }

  /** Send the saved template with example data. */
  testTemplate(key: string, to: string): Promise<unknown> {
    return firstValueFrom(this.http.post('/api/mail-templates.php', { key, to }));
  }

  log(registrationId?: number): Promise<MailLogEntry[]> {
    const params: Record<string, string> = registrationId ? { registration_id: String(registrationId) } : {};
    return firstValueFrom(this.http.get<MailLogEntry[]>('/api/mail-log.php', { params }));
  }
}
