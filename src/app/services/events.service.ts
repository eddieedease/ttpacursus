import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmResult, CourseEvent } from '../models';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);

  list(): Promise<CourseEvent[]> {
    return firstValueFrom(this.http.get<CourseEvent[]>('/api/events.php'));
  }

  create(event: Partial<CourseEvent>): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>('/api/events.php', event));
  }

  update(id: number, changes: Partial<CourseEvent>): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/events.php', { id, ...changes }));
  }

  setTrainers(id: number, trainerIds: number[]): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/events.php', { id, trainerIds }));
  }

  /** Confirm the scheduled (not yet confirmed) trainers of a date and mail them. */
  async confirmTrainers(eventId: number): Promise<ConfirmResult[]> {
    const res = await firstValueFrom(
      this.http.post<{ results: ConfirmResult[] }>('/api/confirm-trainers.php', { eventId })
    );
    return res.results;
  }

  delete(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete('/api/events.php', { params: { id } }));
  }
}
