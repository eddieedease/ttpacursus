import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CourseEvent, Organisation, Registration, RegistrationStatus } from '../../models';
import { EventsService } from '../../services/events.service';
import { OrganisationsService } from '../../services/organisations.service';
import { RegistrationsService } from '../../services/registrations.service';

@Component({
  selector: 'app-admin-registrations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Totaal aanmeldingen</p>
        <p class="text-3xl font-bold text-slate-900">{{ registrations().length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Nog in te delen</p>
        <p class="text-3xl font-bold text-amber-600">{{ newCount() }}</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Ingedeeld</p>
        <p class="text-3xl font-bold text-teal-600">{{ assignedCount() }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-4 items-end">
      <div>
        <label for="filter-status" class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
        <select id="filter-status" class="form-input" (change)="onStatusFilter($event)">
          <option value="">Alle</option>
          <option value="nieuw">Nieuw</option>
          <option value="ingedeeld">Ingedeeld</option>
          <option value="geannuleerd">Geannuleerd</option>
        </select>
      </div>
      <div>
        <label for="filter-event" class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Ingedeeld op datum</label>
        <select id="filter-event" class="form-input" (change)="onEventFilter($event)">
          <option value="">Alle</option>
          @for (ev of events(); track ev.id) {
            <option [value]="ev.id">{{ ev.eventDate | date:'d MMM y' }}</option>
          }
        </select>
      </div>
      @if (error()) {
        <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
      }
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm" aria-label="Overzicht aanmeldingen">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-left">
              <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Naam</th>
              <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Organisatie</th>
              <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Voorkeursdatum</th>
              <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Ingedeeld op</th>
              <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Status</th>
              <th scope="col" class="px-4 py-3"><span class="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody>
            @for (reg of filtered(); track reg.id) {
              <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 font-medium text-slate-800">{{ fullName(reg) }}</td>
                <td class="px-4 py-3 text-slate-600">
                  {{ reg.organisationName ?? reg.orgAndersNaam }}
                  @if (!reg.organisationId) {
                    <span class="ml-1 inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">anders</span>
                  }
                </td>
                <td class="px-4 py-3 text-slate-600">{{ (reg.preferredEventDate | date:'d MMM y') ?? '—' }}</td>
                <td class="px-4 py-3">
                  <label class="sr-only" [for]="'assign-' + reg.id">Indelen op cursusdatum</label>
                  <select
                    [id]="'assign-' + reg.id"
                    class="form-input py-1.5"
                    [disabled]="busyId() === reg.id"
                    (change)="assign(reg, $event)"
                  >
                    <option value="" [selected]="reg.assignedEventId === null">— Niet ingedeeld —</option>
                    @for (ev of events(); track ev.id) {
                      <option [value]="ev.id" [selected]="ev.id === reg.assignedEventId">
                        {{ ev.eventDate | date:'d MMM y' }} ({{ ev.assignedCount }}/{{ ev.capacity }})
                      </option>
                    }
                  </select>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block text-xs font-semibold px-3 py-1 rounded-full"
                    [class]="statusClasses(reg.status)"
                  >{{ reg.status }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="text-teal-700 hover:text-teal-900 text-xs font-semibold underline underline-offset-2"
                    (click)="toggleDetail(reg.id)"
                    [attr.aria-expanded]="openId() === reg.id"
                  >
                    @if (openId() === reg.id) { Sluiten } @else { Details }
                  </button>
                </td>
              </tr>
              @if (openId() === reg.id) {
                <tr class="border-b border-slate-100 bg-slate-50/60">
                  <td colspan="6" class="px-6 py-5">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">

                      <div>
                        <h3 class="detail-heading">Persoonlijk</h3>
                        <p><span class="detail-label">Geslacht:</span> {{ reg.geslacht }}</p>
                        <p><span class="detail-label">Geboren:</span> {{ reg.geboortedatum | date:'d MMM y' }} te {{ reg.geboorteplaats }}</p>
                        <p><span class="detail-label">Adres:</span> {{ reg.adres }}, {{ reg.postcode }} {{ reg.woonplaats }}</p>
                      </div>

                      <div>
                        <h3 class="detail-heading">Contact</h3>
                        <p><span class="detail-label">E-mail:</span> <a class="text-teal-700 underline" href="mailto:{{ reg.email }}">{{ reg.email }}</a></p>
                        <p><span class="detail-label">Werk:</span> {{ reg.telefoonWerk }}</p>
                        <p><span class="detail-label">Mobiel:</span> {{ reg.mobiel }}@if (reg.mobielExtra) { / {{ reg.mobielExtra }} }</p>
                      </div>

                      <div>
                        <h3 class="detail-heading">Professioneel</h3>
                        <p><span class="detail-label">BIG:</span> <span class="font-mono text-xs">{{ reg.bigNummer }}</span></p>
                        <p><span class="detail-label">Functie:</span> {{ reg.functie }} ({{ reg.specialisme }})</p>
                        <p><span class="detail-label">Afdeling:</span> {{ reg.afdeling }}</p>
                        <p><span class="detail-label">In opleiding:</span> {{ reg.inOpleiding ? 'Ja' : 'Nee' }}</p>
                        @if (reg.werkervaring) {
                          <p><span class="detail-label">Werkervaring:</span> {{ reg.werkervaring }}</p>
                        }
                      </div>

                      @if (!reg.organisationId && reg.orgAndersNaam) {
                        <div>
                          <h3 class="detail-heading">Opgegeven organisatie (anders)</h3>
                          <p>{{ reg.orgAndersNaam }}</p>
                          @if (reg.orgAndersContactpersoon) { <p><span class="detail-label">Contact:</span> {{ reg.orgAndersContactpersoon }}</p> }
                          @if (reg.orgAndersEmail) { <p><span class="detail-label">E-mail:</span> {{ reg.orgAndersEmail }}</p> }
                          @if (reg.orgAndersAdres) { <p><span class="detail-label">Adres:</span> {{ reg.orgAndersAdres }}</p> }
                          @if (reg.orgAndersFactuuradres) { <p><span class="detail-label">Factuuradres:</span> {{ reg.orgAndersFactuuradres }}</p> }
                        </div>
                      }

                      <div>
                        <h3 class="detail-heading">Overig</h3>
                        @if (reg.dieetwensen) { <p><span class="detail-label">Dieet:</span> {{ reg.dieetwensen }}</p> }
                        @if (reg.opmerkingen) { <p><span class="detail-label">Opmerkingen:</span> {{ reg.opmerkingen }}</p> }
                        <p><span class="detail-label">Aangemeld:</span> {{ reg.createdAt | date:'d MMM y, HH:mm' }}</p>
                      </div>

                      <div>
                        <h3 class="detail-heading">Acties</h3>
                        <label class="detail-label block mb-1" [for]="'org-' + reg.id">Organisatie wijzigen</label>
                        <select
                          [id]="'org-' + reg.id"
                          class="form-input py-1.5 mb-3"
                          [disabled]="busyId() === reg.id"
                          (change)="switchOrganisation(reg, $event)"
                        >
                          <option value="" [selected]="reg.organisationId === null">— Geen (anders) —</option>
                          @for (org of organisations(); track org.id) {
                            <option [value]="org.id" [selected]="org.id === reg.organisationId">{{ org.name }}</option>
                          }
                        </select>
                        <div class="flex gap-2">
                          @if (reg.status !== 'geannuleerd') {
                            <button
                              class="text-xs font-semibold text-amber-700 border border-amber-300 hover:bg-amber-50 px-3 py-1.5 rounded-lg"
                              [disabled]="busyId() === reg.id"
                              (click)="setStatus(reg, 'geannuleerd')"
                            >Annuleren</button>
                          } @else {
                            <button
                              class="text-xs font-semibold text-teal-700 border border-teal-300 hover:bg-teal-50 px-3 py-1.5 rounded-lg"
                              [disabled]="busyId() === reg.id"
                              (click)="setStatus(reg, reg.assignedEventId ? 'ingedeeld' : 'nieuw')"
                            >Heractiveren</button>
                          }
                          <button
                            class="text-xs font-semibold text-red-700 border border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-lg"
                            [disabled]="busyId() === reg.id"
                            (click)="remove(reg)"
                          >Verwijderen</button>
                        </div>
                      </div>

                    </div>
                  </td>
                </tr>
              }
            } @empty {
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-slate-500">
                  @if (loading()) { Aanmeldingen worden geladen… } @else { Geen aanmeldingen gevonden. }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        {{ filtered().length }} aanmelding(en) gevonden
      </div>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    .form-input {
      @apply rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors;
    }
    .detail-heading {
      @apply text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5;
    }
    .detail-label {
      @apply text-slate-500;
    }
  `],
})
export class AdminRegistrationsComponent {
  private readonly registrationsService = inject(RegistrationsService);
  private readonly eventsService = inject(EventsService);
  private readonly organisationsService = inject(OrganisationsService);

  readonly registrations = signal<Registration[]>([]);
  readonly events = signal<CourseEvent[]>([]);
  readonly organisations = signal<Organisation[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly openId = signal<number | null>(null);
  readonly busyId = signal<number | null>(null);

  private readonly statusFilter = signal<RegistrationStatus | ''>('');
  private readonly eventFilter = signal<number | null>(null);

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const eventId = this.eventFilter();
    return this.registrations().filter(reg =>
      (status === '' || reg.status === status) &&
      (eventId === null || reg.assignedEventId === eventId)
    );
  });

  readonly newCount = computed(() => this.registrations().filter(r => r.status === 'nieuw').length);
  readonly assignedCount = computed(() => this.registrations().filter(r => r.status === 'ingedeeld').length);

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      const [registrations, events, organisations] = await Promise.all([
        this.registrationsService.list(),
        this.eventsService.list(),
        this.organisationsService.list(),
      ]);
      this.registrations.set(registrations);
      this.events.set(events);
      this.organisations.set(organisations);
      this.error.set(null);
    } catch {
      this.error.set('Gegevens konden niet worden geladen.');
    } finally {
      this.loading.set(false);
    }
  }

  fullName(reg: Registration): string {
    return [reg.titel, reg.voorletters, reg.voorvoegsels, reg.achternaam].filter(Boolean).join(' ');
  }

  statusClasses(status: RegistrationStatus): string {
    switch (status) {
      case 'ingedeeld': return 'bg-teal-100 text-teal-800';
      case 'geannuleerd': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-800';
    }
  }

  toggleDetail(id: number): void {
    this.openId.update(open => (open === id ? null : id));
  }

  onStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as RegistrationStatus | '');
  }

  onEventFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.eventFilter.set(value === '' ? null : Number(value));
  }

  async assign(reg: Registration, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    await this.mutate(reg.id, () =>
      this.registrationsService.assignEvent(reg.id, value === '' ? null : Number(value))
    );
  }

  async switchOrganisation(reg: Registration, event: Event): Promise<void> {
    const value = (event.target as HTMLSelectElement).value;
    await this.mutate(reg.id, () =>
      this.registrationsService.setOrganisation(reg.id, value === '' ? null : Number(value))
    );
  }

  async setStatus(reg: Registration, status: RegistrationStatus): Promise<void> {
    await this.mutate(reg.id, () => this.registrationsService.setStatus(reg.id, status));
  }

  async remove(reg: Registration): Promise<void> {
    if (!confirm(`Aanmelding van ${this.fullName(reg)} definitief verwijderen?`)) {
      return;
    }
    await this.mutate(reg.id, () => this.registrationsService.delete(reg.id));
  }

  private async mutate(id: number, action: () => Promise<unknown>): Promise<void> {
    this.busyId.set(id);
    try {
      await action();
      await this.load();
      this.error.set(null);
    } catch {
      this.error.set('De wijziging kon niet worden opgeslagen.');
    } finally {
      this.busyId.set(null);
    }
  }
}
