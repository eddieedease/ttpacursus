import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Availability, TrainerEvent } from '../models';

/** Availability of the logged-in trainer. */
@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);

  list(): Promise<TrainerEvent[]> {
    return firstValueFrom(this.http.get<TrainerEvent[]>('/api/availability.php'));
  }

  set(eventId: number, status: Availability | null): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/availability.php', { eventId, status }));
  }
}
