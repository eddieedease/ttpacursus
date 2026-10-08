import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Availability, TrainerEvent } from '../../models';
import { AuthService } from '../../services/auth.service';
import { AvailabilityService } from '../../services/availability.service';
import { LoginComponent } from '../../shared/login/login.component';

const OPTIONS: { value: Availability; label: string; active: string }[] = [
  { value: 'beschikbaar', label: 'Beschikbaar', active: 'bg-teal-600 text-white border-teal-600' },
  { value: 'misschien', label: 'Misschien', active: 'bg-amber-500 text-slate-900 border-amber-500' },
  { value: 'niet', label: 'Niet beschikbaar', active: 'bg-slate-700 text-white border-slate-700' },
];

@Component({
  selector: 'app-trainer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LoginComponent, RouterLink],
  template: `
    <div class="min-h-full bg-slate-100 py-12 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto">

        @if (auth.authenticated() === null) {
          <p class="text-center text-slate-500 mt-16" role="status">Bezig met laden…</p>

        } @else if (auth.authenticated() === false) {
          <app-login heading="Trainers" intro="Log in om uw beschikbaarheid voor de cursusdata door te geven." />

        } @else if (auth.role() !== 'trainer') {
          <div class="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center">
            <h1 class="text-xl font-bold text-slate-800 mb-2">Alleen voor trainers</h1>
            <p class="text-sm text-slate-600 mb-6">U bent ingelogd als beheerder. Trainers en hun beschikbaarheid ziet u in het beheer.</p>
            <a routerLink="/admin/planner" class="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Naar cursusdata</a>
          </div>

        } @else {
          <div class="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">Mijn beschikbaarheid</h1>
              <p class="text-slate-600 text-sm mt-1">
                Welkom {{ auth.name() }}. Geef per cursusdatum aan of u beschikbaar bent.
                Uw keuze wordt direct opgeslagen.
              </p>
            </div>
            <button
              (click)="auth.logout()"
              class="shrink-0 text-sm text-slate-600 hover:text-red-700 border border-slate-300 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
            >Uitloggen</button>
          </div>

          @if (assignedCount() > 0) {
            <p class="mb-4 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl px-4 py-3 text-sm">
              U bent ingepland op <strong>{{ assignedCount() }}</strong> cursusdatum(s), gemarkeerd met "Ingepland".
            </p>
          }

          @if (error()) {
            <p class="mb-4 text-sm text-red-700" role="alert">{{ error() }}</p>
          }

          <ul class="space-y-3 list-none p-0 m-0" aria-label="Cursusdata">
            @for (ev of events(); track ev.eventId) {
              <li class="bg-white rounded-xl border shadow-sm p-5" [class]="ev.assigned ? 'border-teal-400' : 'border-slate-200'">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 class="font-semibold text-slate-900 first-letter:uppercase">
                      {{ ev.eventDate | date:'EEEE d MMMM y' }}
                      @if (ev.assigned) {
                        <span class="ml-2 align-middle inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-0.5 rounded-full normal-case">Ingepland</span>
                      }
                    </h2>
                    <p class="text-sm text-slate-600">
                      @if (ev.startTime) { {{ ev.startTime.slice(0, 5) }}@if (ev.endTime) {–{{ ev.endTime.slice(0, 5) }}} uur · }
                      {{ ev.location ?? 'Locatie volgt' }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2" role="group" [attr.aria-label]="'Beschikbaarheid ' + (ev.eventDate | date:'d MMMM y')">
                    @for (opt of options; track opt.value) {
                      <button
                        type="button"
                        class="text-xs font-semibold px-3 py-2 rounded-lg border transition-colors"
                        [class]="ev.availability === opt.value ? opt.active : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'"
                        [attr.aria-pressed]="ev.availability === opt.value"
                        [disabled]="busyId() === ev.eventId"
                        (click)="choose(ev, opt.value)"
                      >{{ opt.label }}</button>
                    }
                  </div>
                </div>
              </li>
            } @empty {
              <li class="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600">
                @if (loading()) { Cursusdata worden geladen… } @else { Er zijn nog geen cursusdata gepland. }
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class TrainerComponent {
  protected readonly auth = inject(AuthService);
  private readonly availability = inject(AvailabilityService);

  readonly options = OPTIONS;
  readonly events = signal<TrainerEvent[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  readonly assignedCount = computed(() => this.events().filter(e => e.assigned).length);

  constructor() {
    this.auth.check();
    // Load the dates as soon as a trainer is logged in (also right after login).
    effect(() => {
      if (this.auth.role() === 'trainer') {
        this.load();
      }
    });
  }

  private async load(): Promise<void> {
    try {
      this.events.set(await this.availability.list());
      this.error.set(null);
    } catch {
      this.error.set('De cursusdata konden niet worden geladen.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Clicking the active option again clears it. */
  async choose(ev: TrainerEvent, value: Availability): Promise<void> {
    const next = ev.availability === value ? null : value;
    this.busyId.set(ev.eventId);
    try {
      await this.availability.set(ev.eventId, next);
      this.events.update(list =>
        list.map(e => (e.eventId === ev.eventId ? { ...e, availability: next } : e))
      );
      this.error.set(null);
    } catch {
      this.error.set('Uw keuze kon niet worden opgeslagen. Probeer het opnieuw.');
    } finally {
      this.busyId.set(null);
    }
  }
}
