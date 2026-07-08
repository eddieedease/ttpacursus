import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Registration, RegistrationStatus, RegistrationSubmission } from '../models';

@Injectable({ providedIn: 'root' })
export class RegistrationsService {
  private readonly http = inject(HttpClient);

  /** Public: submit the registration form. */
  submit(payload: RegistrationSubmission): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>('/api/registrations.php', payload));
  }

  /** Admin: list registrations, optionally filtered. */
  list(filters: { status?: RegistrationStatus; eventId?: number } = {}): Promise<Registration[]> {
    const params: Record<string, string> = {};
    if (filters.status) {
      params['status'] = filters.status;
    }
    if (filters.eventId) {
      params['event_id'] = String(filters.eventId);
    }
    return firstValueFrom(this.http.get<Registration[]>('/api/registrations.php', { params }));
  }

  /** Admin: assign to a course date (or unassign with null). */
  assignEvent(id: number, assignedEventId: number | null): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/registrations.php', { id, assignedEventId }));
  }

  /** Admin: switch the registration to another organisation. */
  setOrganisation(id: number, organisationId: number | null): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/registrations.php', { id, organisationId }));
  }

  setStatus(id: number, status: RegistrationStatus): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/registrations.php', { id, status }));
  }

  delete(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete('/api/registrations.php', { params: { id } }));
  }
}
