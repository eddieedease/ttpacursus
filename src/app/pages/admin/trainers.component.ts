import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Availability, TrainerOverview } from '../../models';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-admin-trainers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4 mb-4">
      <div>
        <label for="tr-search" class="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Zoeken</label>
        <input id="tr-search" type="search" class="form-input w-72 max-w-full" placeholder="Naam, e-mail of gebruikersnaam…" (input)="onSearch($event)">
      </div>
      <p class="text-sm text-slate-600">
        Trainers toevoegen of een wachtwoord wijzigen doet u onder <a routerLink="../gebruikers" class="text-teal-800 underline">Gebruikers</a>.
        Inplannen gebeurt bij <a routerLink="../planner" class="text-teal-800 underline">Cursusdata</a>.
      </p>
    </div>

    @if (error()) {
      <p class="text-sm text-red-700 mb-4" role="alert">{{ error() }}</p>
    }

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      @for (t of filtered(); track t.id) {
        <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5" [attr.aria-labelledby]="'tr-' + t.id">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 [id]="'tr-' + t.id" class="font-semibold text-slate-900">{{ t.name }}</h2>
              <p class="text-sm text-slate-600">
                @if (t.email) { <a class="text-teal-800 underline" href="mailto:{{ t.email }}">{{ t.email }}</a> · }
                <span class="font-mono text-xs">{{ t.username }}</span>
              </p>
            </div>
            @if (!t.isActive) {
              <span class="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">gedeactiveerd</span>
            }
          </div>

          <dl class="grid grid-cols-4 gap-2 text-center mb-4">
            <div class="rounded-lg bg-teal-50 py-2"><dt class="text-xs text-slate-600">Ingepland</dt><dd class="text-lg font-bold text-teal-800">{{ count(t, 'assigned') }}</dd></div>
            <div class="rounded-lg bg-slate-50 py-2"><dt class="text-xs text-slate-600">Beschikbaar</dt><dd class="text-lg font-bold text-slate-800">{{ count(t, 'beschikbaar') }}</dd></div>
            <div class="rounded-lg bg-slate-50 py-2"><dt class="text-xs text-slate-600">Misschien</dt><dd class="text-lg font-bold text-slate-800">{{ count(t, 'misschien') }}</dd></div>
            <div class="rounded-lg bg-slate-50 py-2"><dt class="text-xs text-slate-600">Open</dt><dd class="text-lg font-bold text-slate-800">{{ count(t, null) }}</dd></div>
          </dl>

          @if (t.dates.length) {
            <ul class="divide-y divide-slate-100 list-none p-0 m-0 text-sm" [attr.aria-label]="'Komende cursusdata ' + t.name">
              @for (d of t.dates; track d.eventId) {
                <li class="flex items-center justify-between gap-3 py-1.5">
                  <span class="text-slate-800 first-letter:uppercase">{{ d.eventDate | date:'EEE d MMM y' }}</span>
                  <span class="flex items-center gap-1.5">
                    @if (d.assigned) {
                      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-600 text-white">ingepland</span>
                    }
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full" [class]="availabilityClasses(d.availability)">
                      {{ d.availability ?? 'niet opgegeven' }}
                    </span>
                  </span>
                </li>
              }
            </ul>
          } @else {
            <p class="text-sm text-slate-600">Geen komende cursusdata.</p>
          }
        </article>
      } @empty {
        <p class="text-slate-600 md:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 text-center">
          @if (loading()) { Trainers worden geladen… } @else if (trainers().length) { Geen trainers gevonden. } @else { Nog geen trainers. Voeg ze toe onder Gebruikers. }
        </p>
      }
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    .form-input {
      @apply rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors;
    }
  `],
})
export class AdminTrainersComponent {
  private readonly usersService = inject(UsersService);

  readonly trainers = signal<TrainerOverview[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private readonly search = signal('');

  readonly filtered = computed(() => {
    const term = this.search().toLowerCase();
    return this.trainers().filter(t =>
      term === '' || [t.name, t.email ?? '', t.username].some(v => v.toLowerCase().includes(term))
    );
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      this.trainers.set(await this.usersService.trainers());
    } catch {
      this.error.set('Trainers konden niet worden geladen.');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  count(t: TrainerOverview, what: Availability | 'assigned' | null): number {
    return t.dates.filter(d => (what === 'assigned' ? d.assigned : d.availability === what)).length;
  }

  availabilityClasses(availability: Availability | null): string {
    switch (availability) {
      case 'beschikbaar': return 'bg-teal-100 text-teal-800';
      case 'misschien': return 'bg-amber-100 text-amber-900';
      case 'niet': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-200 text-slate-700';
    }
  }
}
