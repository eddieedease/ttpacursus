import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CourseEvent, EventTrainer } from '../../models';
import { EventsService } from '../../services/events.service';
import { RegistrationsService } from '../../services/registrations.service';
import { apiError } from '../../shared/api-error';

@Component({
  selector: 'app-admin-planner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Form -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 self-start">
        <h2 class="text-base font-semibold text-slate-800 mb-4">
          @if (editingId()) { Cursusdatum bewerken } @else { Nieuwe cursusdatum }
        </h2>

        <form [formGroup]="form" (ngSubmit)="save()" novalidate class="space-y-4">
          <div>
            <label for="ev-date" class="form-label">Datum <span class="text-red-500" aria-hidden="true">*</span></label>
            <input id="ev-date" type="date" formControlName="eventDate" class="form-input" [class.border-red-400]="isInvalid('eventDate')">
            @if (isInvalid('eventDate')) {
              <p class="form-error" role="alert">Datum is verplicht.</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ev-start" class="form-label">Van</label>
              <input id="ev-start" type="time" formControlName="startTime" class="form-input">
            </div>
            <div>
              <label for="ev-end" class="form-label">Tot</label>
              <input id="ev-end" type="time" formControlName="endTime" class="form-input">
            </div>
          </div>

          <div>
            <label for="ev-location" class="form-label">Locatie</label>
            <input id="ev-location" type="text" formControlName="location" class="form-input" placeholder="Cursuscentrum Utrecht">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ev-capacity" class="form-label">Capaciteit</label>
              <input id="ev-capacity" type="number" min="1" formControlName="capacity" class="form-input">
            </div>
            <div>
              <label for="ev-status" class="form-label">Status</label>
              <select id="ev-status" formControlName="status" class="form-input">
                <option value="open">Open</option>
                <option value="gesloten">Gesloten</option>
                <option value="geannuleerd">Geannuleerd</option>
              </select>
            </div>
          </div>

          <div>
            <label for="ev-notes" class="form-label">Notities</label>
            <textarea id="ev-notes" formControlName="notes" rows="2" class="form-input resize-none"></textarea>
          </div>

          @if (error()) {
            <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
          }

          <div class="flex gap-2">
            <button
              type="submit"
              [disabled]="saving()"
              class="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              @if (editingId()) { Opslaan } @else { Toevoegen }
            </button>
            @if (editingId()) {
              <button
                type="button"
                (click)="cancelEdit()"
                class="text-sm text-slate-500 hover:text-slate-800 border border-slate-300 px-4 py-2 rounded-lg transition-colors"
              >
                Annuleren
              </button>
            }
          </div>
        </form>
      </div>

      <!-- List -->
      <div class="lg:col-span-2 self-start">
        <div class="mb-3">
          <label for="ev-search" class="sr-only">Zoeken in cursusdata</label>
          <input
            id="ev-search"
            type="search"
            class="form-input max-w-xs"
            placeholder="Zoeken…"
            (input)="onSearch($event)"
          >
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm" aria-label="Cursusdata">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-left">
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Datum</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Tijd</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Locatie</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Bezetting</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Voorkeuren</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Trainers</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Status</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody>
              @for (ev of filtered(); track ev.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-slate-800 capitalize">{{ ev.eventDate | date:'EEE d MMM y' }}</td>
                  <td class="px-4 py-3 text-slate-600">
                    @if (ev.startTime) { {{ ev.startTime.slice(0, 5) }}@if (ev.endTime) {–{{ ev.endTime.slice(0, 5) }} } } @else { — }
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ ev.location ?? '—' }}</td>
                  <td class="px-4 py-3 text-slate-600">
                    <span [class.text-red-600]="(ev.assignedCount ?? 0) >= (ev.capacity ?? 0)" [class.font-semibold]="(ev.assignedCount ?? 0) >= (ev.capacity ?? 0)">
                      {{ ev.assignedCount }}/{{ ev.capacity }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ ev.preferredCount }}</td>
                  <td class="px-4 py-3 text-slate-700">
                    <button
                      class="text-left text-xs font-semibold text-teal-800 hover:text-teal-950 underline underline-offset-2"
                      [attr.aria-expanded]="openId() === ev.id"
                      (click)="toggle(ev.id)"
                    >
                      @if (assignedTrainers(ev).length) { {{ assignedTrainers(ev).join(', ') }} } @else { Nog niemand }
                      <span class="block font-normal text-slate-600 no-underline">{{ availableCount(ev) }} beschikbaar</span>
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-block text-xs font-semibold px-3 py-1 rounded-full" [class]="statusClasses(ev)">
                      {{ ev.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      class="text-teal-700 hover:text-teal-900 text-xs font-semibold underline underline-offset-2 mr-3"
                      (click)="startEdit(ev)"
                    >Bewerken</button>
                    <button
                      class="text-red-600 hover:text-red-800 text-xs font-semibold underline underline-offset-2"
                      (click)="remove(ev)"
                    >Verwijderen</button>
                  </td>
                </tr>
                @if (openId() === ev.id) {
                  <tr class="border-b border-slate-100 bg-slate-50/60">
                    <td colspan="8" class="px-6 py-5">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <fieldset>
                          <legend class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Trainers inplannen</legend>
                          @for (t of ev.trainers ?? []; track t.userId) {
                            <label class="flex items-center gap-3 py-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-slate-400 text-teal-600 focus:ring-teal-500"
                                [checked]="t.assigned"
                                [disabled]="busyId() === ev.id"
                                (change)="toggleTrainer(ev, t)"
                              >
                              <span class="text-sm text-slate-800 flex-1">{{ t.name }}</span>
                              <span class="text-xs font-semibold px-2 py-0.5 rounded-full" [class]="availabilityClasses(t)">
                                {{ t.availability ?? 'niet opgegeven' }}
                              </span>
                            </label>
                          } @empty {
                            <p class="text-sm text-slate-600">Er zijn nog geen trainers. Voeg ze toe onder Gebruikers.</p>
                          }
                        </fieldset>
                        <div>
                          <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Deelnemers bevestigen</h3>
                          <p class="text-sm text-slate-700 mb-3">
                            {{ ev.confirmedCount }} van {{ ev.assignedCount }} ingedeelde deelnemer(s) bevestigd.
                          </p>
                          @if ((ev.assignedCount ?? 0) > (ev.confirmedCount ?? 0)) {
                            <button
                              class="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-4 py-2 rounded-lg"
                              [disabled]="busyId() === ev.id"
                              (click)="confirmAll(ev)"
                            >Bevestig alle ingedeelden &amp; mail</button>
                            <p class="text-xs text-slate-600 mt-2">Iedereen die op deze datum is ingedeeld en nog niet bevestigd is, krijgt de bevestigingsmail.</p>
                          }
                          @if (confirmMsg(); as m) {
                            <p class="mt-3 text-sm" [class]="m.ok ? 'text-teal-800' : 'text-red-700'" role="status">{{ m.text }}</p>
                          }
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="8" class="px-4 py-8 text-center text-slate-500">
                    @if (loading()) { Cursusdata worden geladen… } @else { Geen cursusdata gevonden. }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    .form-label {
      @apply block text-sm font-medium text-slate-700 mb-1;
    }
    .form-input {
      @apply w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors;
    }
    .form-error {
      @apply mt-1 text-xs text-red-600;
    }
  `],
})
export class AdminPlannerComponent {
  private readonly eventsService = inject(EventsService);
  private readonly registrationsService = inject(RegistrationsService);
  private readonly fb = new FormBuilder();

  readonly events = signal<CourseEvent[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly openId = signal<number | null>(null);
  readonly busyId = signal<number | null>(null);
  readonly confirmMsg = signal<{ ok: boolean; text: string } | null>(null);

  private readonly search = signal('');

  readonly filtered = computed(() => {
    const term = this.search().toLowerCase();
    if (!term) {
      return this.events();
    }
    return this.events().filter(ev =>
      [ev.eventDate, ev.location ?? '', ev.notes ?? '', ev.status ?? '']
        .some(value => value.toLowerCase().includes(term))
    );
  });

  readonly form = this.fb.group({
    eventDate: ['', Validators.required],
    startTime: [''],
    endTime: [''],
    location: [''],
    capacity: [12, [Validators.required, Validators.min(1)]],
    status: ['open'],
    notes: [''],
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      this.events.set(await this.eventsService.list());
      this.error.set(null);
    } catch {
      this.error.set('Cursusdata konden niet worden geladen.');
    } finally {
      this.loading.set(false);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  statusClasses(ev: CourseEvent): string {
    switch (ev.status) {
      case 'open': return 'bg-teal-100 text-teal-800';
      case 'geannuleerd': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-200 text-slate-700';
    }
  }

  toggle(id: number): void {
    this.openId.update(open => (open === id ? null : id));
    this.confirmMsg.set(null);
  }

  assignedTrainers(ev: CourseEvent): string[] {
    return (ev.trainers ?? []).filter(t => t.assigned).map(t => t.name);
  }

  availableCount(ev: CourseEvent): number {
    return (ev.trainers ?? []).filter(t => t.availability === 'beschikbaar').length;
  }

  availabilityClasses(t: EventTrainer): string {
    switch (t.availability) {
      case 'beschikbaar': return 'bg-teal-100 text-teal-800';
      case 'misschien': return 'bg-amber-100 text-amber-900';
      case 'niet': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-200 text-slate-700';
    }
  }

  async toggleTrainer(ev: CourseEvent, trainer: EventTrainer): Promise<void> {
    const ids = (ev.trainers ?? [])
      .filter(t => (t.userId === trainer.userId ? !t.assigned : t.assigned))
      .map(t => t.userId);
    this.busyId.set(ev.id);
    try {
      await this.eventsService.setTrainers(ev.id, ids);
      await this.load();
    } catch {
      this.error.set('De trainers konden niet worden opgeslagen.');
    } finally {
      this.busyId.set(null);
    }
  }

  async confirmAll(ev: CourseEvent): Promise<void> {
    const open = (ev.assignedCount ?? 0) - (ev.confirmedCount ?? 0);
    if (!confirm(`${open} deelnemer(s) bevestigen en de bevestigingsmail versturen?`)) {
      return;
    }
    this.busyId.set(ev.id);
    try {
      const results = await this.registrationsService.confirmEvent(ev.id);
      const failed = results.filter(r => !r.ok);
      this.confirmMsg.set(
        failed.length
          ? { ok: false, text: `${results.length - failed.length} bevestigd, ${failed.length} mislukt: ${failed[0].error}` }
          : { ok: true, text: `${results.length} deelnemer(s) bevestigd en gemaild.` }
      );
      await this.load();
    } catch (e) {
      this.confirmMsg.set({ ok: false, text: apiError(e, 'Bevestigen is mislukt.') });
    } finally {
      this.busyId.set(null);
    }
  }

  startEdit(ev: CourseEvent): void {
    this.editingId.set(ev.id);
    this.form.setValue({
      eventDate: ev.eventDate,
      startTime: ev.startTime?.slice(0, 5) ?? '',
      endTime: ev.endTime?.slice(0, 5) ?? '',
      location: ev.location ?? '',
      capacity: ev.capacity ?? 12,
      status: ev.status ?? 'open',
      notes: ev.notes ?? '',
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ eventDate: '', startTime: '', endTime: '', location: '', capacity: 12, status: 'open', notes: '' });
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    const v = this.form.getRawValue();
    const payload = {
      eventDate: v.eventDate!,
      startTime: v.startTime || null,
      endTime: v.endTime || null,
      location: v.location || null,
      capacity: v.capacity!,
      status: v.status as CourseEvent['status'],
      notes: v.notes || null,
    };

    this.saving.set(true);
    try {
      const id = this.editingId();
      if (id) {
        await this.eventsService.update(id, payload);
      } else {
        await this.eventsService.create(payload);
      }
      this.cancelEdit();
      await this.load();
    } catch {
      this.error.set('De cursusdatum kon niet worden opgeslagen.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(ev: CourseEvent): Promise<void> {
    const inUse = (ev.assignedCount ?? 0) > 0 || (ev.preferredCount ?? 0) > 0;
    const warning = inUse
      ? `Let op: er zijn aanmeldingen gekoppeld aan deze datum (${ev.assignedCount} ingedeeld, ${ev.preferredCount} met voorkeur). Die worden losgekoppeld en terug op 'nieuw' gezet. Doorgaan?`
      : 'Deze cursusdatum verwijderen?';
    if (!confirm(warning)) {
      return;
    }
    try {
      await this.eventsService.delete(ev.id);
      if (this.editingId() === ev.id) {
        this.cancelEdit();
      }
      await this.load();
    } catch {
      this.error.set('De cursusdatum kon niet worden verwijderd.');
    }
  }
}
