import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TrainerOverview, User } from '../models';

export interface UserChanges {
  username?: string;
  name?: string;
  email?: string;
  role?: User['role'];
  isActive?: boolean;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  list(): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>('/api/users.php'));
  }

  /** Trainers with their upcoming assignments and availability. */
  trainers(): Promise<TrainerOverview[]> {
    return firstValueFrom(this.http.get<TrainerOverview[]>('/api/trainers.php'));
  }

  create(user: UserChanges): Promise<{ id: number }> {
    return firstValueFrom(this.http.post<{ id: number }>('/api/users.php', user));
  }

  update(id: number, changes: UserChanges): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/users.php', { id, ...changes }));
  }

  delete(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete('/api/users.php', { params: { id } }));
  }
}
