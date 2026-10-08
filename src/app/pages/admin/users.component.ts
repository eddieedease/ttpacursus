import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models';
import { UsersService } from '../../services/users.service';
import { apiError } from '../../shared/api-error';

@Component({
  selector: 'app-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Form -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 self-start">
        <h2 class="text-base font-semibold text-slate-800 mb-1">
          @if (editing(); as u) { {{ u.name || u.username }} bewerken } @else { Nieuwe gebruiker }
        </h2>
        <p class="text-xs text-slate-600 mb-4">
          Trainers loggen in op <strong>/trainer</strong> en geven daar hun beschikbaarheid door.
        </p>

        <form [formGroup]="form" (ngSubmit)="save()" novalidate class="space-y-4">
          <div>
            <label for="u-name" class="form-label">Naam</label>
            <input id="u-name" type="text" formControlName="name" class="form-input" autocomplete="off">
          </div>
          <div>
            <label for="u-email" class="form-label">E-mailadres</label>
            <input id="u-email" type="email" formControlName="email" class="form-input" autocomplete="off">
          </div>
          <div>
            <label for="u-username" class="form-label">Gebruikersnaam <span class="text-red-600" aria-hidden="true">*</span></label>
            <input id="u-username" type="text" formControlName="username" class="form-input" autocomplete="off"
                   [attr.aria-required]="true" [readonly]="!!editing()" [class.bg-slate-100]="!!editing()">
          </div>
          <div>
            <label for="u-role" class="form-label">Rol</label>
            <select id="u-role" formControlName="role" class="form-input">
              <option value="trainer">Trainer</option>
              <option value="admin">Beheerder</option>
            </select>
          </div>
          <div>
            <label for="u-password" class="form-label">
              @if (editing()) { Nieuw wachtwoord (leeg = ongewijzigd) } @else { Wachtwoord <span class="text-red-600" aria-hidden="true">*</span> }
            </label>
            <input id="u-password" type="password" formControlName="password" class="form-input" autocomplete="new-password"
                   aria-describedby="u-password-hint">
            <p id="u-password-hint" class="mt-1 text-xs text-slate-600">Minimaal 8 tekens.</p>
          </div>

          @if (error()) {
            <p class="text-sm text-red-700" role="alert">{{ error() }}</p>
          }

          <div class="flex gap-2">
            <button type="submit" [disabled]="saving()"
              class="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
              @if (editing()) { Opslaan } @else { Toevoegen }
            </button>
            @if (editing()) {
              <button type="button" (click)="cancel()"
                class="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 px-4 py-2 rounded-lg transition-colors">Annuleren</button>
            }
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="lg:col-span-2 self-start bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm" aria-label="Gebruikers">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-left">
                <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Naam</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Gebruikersnaam</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Rol</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Ingepland</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr class="border-b border-slate-100">
                  <td class="px-4 py-3 font-medium text-slate-800">
                    {{ u.name || '—' }}
                    @if (u.email) { <span class="block text-xs font-normal text-slate-600">{{ u.email }}</span> }
                  </td>
                  <td class="px-4 py-3 text-slate-700 font-mono text-xs">{{ u.username }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                          [class]="u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'">
                      {{ u.role === 'admin' ? 'Beheerder' : 'Trainer' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-700">{{ u.role === 'trainer' ? u.assignedCount : '—' }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ u.isActive ? 'Actief' : 'Gedeactiveerd' }}</td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button class="text-teal-700 hover:text-teal-900 text-xs font-semibold underline underline-offset-2 mr-3"
                            (click)="edit(u)">Bewerken</button>
                    <button class="text-slate-700 hover:text-slate-900 text-xs font-semibold underline underline-offset-2 mr-3"
                            (click)="toggleActive(u)">{{ u.isActive ? 'Deactiveren' : 'Activeren' }}</button>
                    <button class="text-red-700 hover:text-red-900 text-xs font-semibold underline underline-offset-2"
                            (click)="remove(u)">Verwijderen</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-4 py-8 text-center text-slate-600">
                  @if (loading()) { Gebruikers worden geladen… } @else { Nog geen gebruikers. }
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    .form-label { @apply block text-sm font-medium text-slate-700 mb-1; }
    .form-input {
      @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors;
    }
  `],
})
export class AdminUsersComponent {
  private readonly usersService = inject(UsersService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editing = signal<User | null>(null);

  readonly form = new FormBuilder().nonNullable.group({
    name: [''],
    email: ['', Validators.email],
    username: ['', Validators.required],
    role: ['trainer' as User['role']],
    password: [''],
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      this.users.set(await this.usersService.list());
    } catch {
      this.error.set('Gebruikers konden niet worden geladen.');
    } finally {
      this.loading.set(false);
    }
  }

  edit(user: User): void {
    this.editing.set(user);
    this.error.set(null);
    this.form.setValue({ name: user.name ?? '', email: user.email ?? '', username: user.username, role: user.role, password: '' });
  }

  cancel(): void {
    this.editing.set(null);
    this.error.set(null);
    this.form.reset();
  }

  async save(): Promise<void> {
    if (this.saving()) {
      return;
    }
    const v = this.form.getRawValue();
    const editing = this.editing();
    if (!v.username.trim() || (!editing && v.password.length < 8) || (v.password && v.password.length < 8)) {
      this.error.set('Vul een gebruikersnaam en een wachtwoord van minimaal 8 tekens in.');
      return;
    }
    this.saving.set(true);
    try {
      if (editing) {
        await this.usersService.update(editing.id, {
          name: v.name, email: v.email, role: v.role, ...(v.password ? { password: v.password } : {}),
        });
      } else {
        await this.usersService.create(v);
      }
      this.cancel();
      await this.load();
    } catch (e) {
      this.error.set(apiError(e, 'De gebruiker kon niet worden opgeslagen.'));
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(user: User): Promise<void> {
    try {
      await this.usersService.update(user.id, { isActive: !user.isActive });
      await this.load();
    } catch (e) {
      this.error.set(apiError(e, 'De wijziging kon niet worden opgeslagen.'));
    }
  }

  async remove(user: User): Promise<void> {
    if (!confirm(`Gebruiker ${user.name || user.username} definitief verwijderen? Beschikbaarheid en planning van deze gebruiker verdwijnen ook.`)) {
      return;
    }
    try {
      await this.usersService.delete(user.id);
      if (this.editing()?.id === user.id) {
        this.cancel();
      }
      await this.load();
    } catch (e) {
      this.error.set(apiError(e, 'De gebruiker kon niet worden verwijderd.'));
    }
  }
}

