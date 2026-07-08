import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CourseEvent } from '../models';

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

  delete(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete('/api/events.php', { params: { id } }));
  }
}
