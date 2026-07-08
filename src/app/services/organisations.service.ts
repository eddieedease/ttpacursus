import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Organisation, OrganisationOption } from '../models';

@Injectable({ providedIn: 'root' })
export class OrganisationsService {
  private readonly http = inject(HttpClient);

  /** Public: active organisations for the registration form dropdown. */
  listOptions(): Promise<OrganisationOption[]> {
    return firstValueFrom(this.http.get<OrganisationOption[]>('/api/organisations.php'));
  }

  /** Admin: full organisation records. */
  list(): Promise<Organisation[]> {
    return firstValueFrom(this.http.get<Organisation[]>('/api/organisations.php'));
  }

  create(organisation: Partial<Organisation>): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>('/api/organisations.php', organisation));
  }

  update(id: number, changes: Partial<Organisation>): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/organisations.php', { id, ...changes }));
  }

  delete(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete('/api/organisations.php', { params: { id } }));
  }
}
