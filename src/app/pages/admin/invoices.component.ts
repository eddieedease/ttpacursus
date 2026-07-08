import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, formatCurrency, formatDate } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CourseEvent, Invoice, Organisation, Registration } from '../../models';
import { EventsService } from '../../services/events.service';
import { InvoicesService } from '../../services/invoices.service';
import { OrganisationsService } from '../../services/organisations.service';
import { RegistrationsService } from '../../services/registrations.service';

interface BillableOrg {
  organisation: Organisation;
  count: number;
}

@Component({
  selector: 'app-admin-invoices',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Create form -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 self-start">
        <h2 class="text-base font-semibold text-slate-800 mb-4">Nieuwe factuur</h2>
        <p class="text-xs text-slate-500 mb-4">
          Per cursusdatum wordt per organisatie gefactureerd voor de <strong>ingedeelde</strong> deelnemers.
        </p>

        <form [formGroup]="form" (ngSubmit)="create()" novalidate class="space-y-4">
          <div>
            <label for="inv-event" class="form-label">Cursusdatum <span class="text-red-500" aria-hidden="true">*</span></label>
            <select id="inv-event" formControlName="eventId" class="form-input">
              <option value="" disabled>— Kies een datum —</option>
              @for (ev of events(); track ev.id) {
                <option [value]="ev.id">{{ ev.eventDate | date:'d MMM y' }} ({{ ev.assignedCount }} ingedeeld)</option>
              }
            </select>
          </div>

          <div>
            <label for="inv-org" class="form-label">Organisatie <span class="text-red-500" aria-hidden="true">*</span></label>
            <select id="inv-org" formControlName="organisationId" class="form-input">
              <option value="" disabled>— Kies een organisatie —</option>
              @for (item of billableOrgs(); track item.organisation.id) {
                <option [value]="item.organisation.id">{{ item.organisation.name }} ({{ item.count }} deelnemers)</option>
              }
            </select>
            @if (form.controls.eventId.value && billableOrgs().length === 0) {
              <p class="form-error" role="alert">Geen ingedeelde deelnemers met gekoppelde organisatie op deze datum.</p>
            }
            @if (unlinkedCount() > 0) {
              <p class="mt-1 text-xs text-amber-700" role="alert">
                Let op: {{ unlinkedCount() }} ingedeelde deelnemer(s) op deze datum zonder gekoppelde organisatie.
                Koppel deze eerst via Aanmeldingen.
              </p>
            }
          </div>

          <div>
            <label for="inv-price" class="form-label">Prijs per deelnemer (€) <span class="text-red-500" aria-hidden="true">*</span></label>
            <input id="inv-price" type="number" min="0.01" step="0.01" formControlName="unitPrice" class="form-input" placeholder="bijv. 595,00">
          </div>

          <div>
            <label for="inv-notes" class="form-label">Notities</label>
            <textarea id="inv-notes" formControlName="notes" rows="2" class="form-input resize-none" placeholder="bijv. kostenplaats, afwijkende afspraken…"></textarea>
          </div>

          @if (error()) {
            <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || saving()"
            class="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            Factuur aanmaken
          </button>
        </form>
      </div>

      <!-- List -->
      <div class="lg:col-span-2 self-start">
        <div class="mb-3">
          <label for="inv-search" class="sr-only">Zoeken in facturen</label>
          <input
            id="inv-search"
            type="search"
            class="form-input max-w-xs"
            placeholder="Zoeken…"
            (input)="onSearch($event)"
          >
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm" aria-label="Facturen">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-left">
                  <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Nummer</th>
                  <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Cursusdatum</th>
                  <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Organisatie</th>
                  <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Deelnemers</th>
                  <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Totaal</th>
                  <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th scope="col" class="px-4 py-3"><span class="sr-only">Acties</span></th>
                </tr>
              </thead>
              <tbody>
                @for (inv of filtered(); track inv.id) {
                  <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 font-mono text-xs font-medium text-slate-800">{{ inv.invoiceNumber }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ inv.eventDate | date:'d MMM y' }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ inv.orgName }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ inv.participantCount }}</td>
                    <td class="px-4 py-3 text-slate-800 font-medium">{{ inv.total | currency:'EUR' }}</td>
                    <td class="px-4 py-3">
                      <button
                        class="inline-block text-xs font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer"
                        [class]="inv.status === 'verwerkt' ? 'bg-teal-100 text-teal-800 hover:bg-teal-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'"
                        [disabled]="busyId() === inv.id"
                        (click)="toggleStatus(inv)"
                        [attr.aria-label]="'Status wijzigen van factuur ' + inv.invoiceNumber + ', nu: ' + inv.status"
                        title="Klik om status te wisselen"
                      >{{ inv.status }}</button>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        class="text-teal-700 hover:text-teal-900 text-xs font-semibold underline underline-offset-2 mr-3"
                        (click)="print(inv)"
                      >Print / PDF</button>
                      <button
                        class="text-red-600 hover:text-red-800 text-xs font-semibold underline underline-offset-2"
                        (click)="remove(inv)"
                      >Verwijderen</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                      @if (loading()) { Facturen worden geladen… } @else { Nog geen facturen. }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            {{ filtered().length }} factu(u)r(en)
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
export class AdminInvoicesComponent {
  private readonly invoicesService = inject(InvoicesService);
  private readonly eventsService = inject(EventsService);
  private readonly organisationsService = inject(OrganisationsService);
  private readonly registrationsService = inject(RegistrationsService);
  private readonly fb = new FormBuilder();

  readonly invoices = signal<Invoice[]>([]);
  readonly events = signal<CourseEvent[]>([]);
  readonly organisations = signal<Organisation[]>([]);
  readonly registrations = signal<Registration[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  private readonly search = signal('');
  private readonly selectedEventId = signal<number | null>(null);

  readonly form = this.fb.group({
    eventId: ['', Validators.required],
    organisationId: ['', Validators.required],
    unitPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    notes: [''],
  });

  /** Organisations that have assigned participants on the selected date. */
  readonly billableOrgs = computed<BillableOrg[]>(() => {
    const eventId = this.selectedEventId();
    if (eventId === null) {
      return [];
    }
    const counts = new Map<number, number>();
    for (const reg of this.registrations()) {
      if (reg.assignedEventId === eventId && reg.status === 'ingedeeld' && reg.organisationId !== null) {
        counts.set(reg.organisationId, (counts.get(reg.organisationId) ?? 0) + 1);
      }
    }
    return this.organisations()
      .filter(org => counts.has(org.id))
      .map(org => ({ organisation: org, count: counts.get(org.id)! }));
  });

  /** Assigned participants on the selected date without a linked organisation. */
  readonly unlinkedCount = computed(() => {
    const eventId = this.selectedEventId();
    if (eventId === null) {
      return 0;
    }
    return this.registrations().filter(
      reg => reg.assignedEventId === eventId && reg.status === 'ingedeeld' && reg.organisationId === null
    ).length;
  });

  readonly filtered = computed(() => {
    const term = this.search().toLowerCase();
    if (!term) {
      return this.invoices();
    }
    return this.invoices().filter(inv =>
      [inv.invoiceNumber, inv.orgName, inv.eventDate, inv.status, ...inv.participants]
        .some(value => value.toLowerCase().includes(term))
    );
  });

  constructor() {
    this.load();
    this.form.controls.eventId.valueChanges.subscribe(value => {
      this.selectedEventId.set(value ? Number(value) : null);
      this.form.controls.organisationId.setValue('');
    });
  }

  private async load(): Promise<void> {
    try {
      const [invoices, events, organisations, registrations] = await Promise.all([
        this.invoicesService.list(),
        this.eventsService.list(),
        this.organisationsService.list(),
        this.registrationsService.list(),
      ]);
      this.invoices.set(invoices);
      this.events.set(events);
      this.organisations.set(organisations);
      this.registrations.set(registrations);
      this.error.set(null);
    } catch {
      this.error.set('Gegevens konden niet worden geladen.');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  async create(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    try {
      await this.invoicesService.create({
        eventId: Number(v.eventId),
        organisationId: Number(v.organisationId),
        unitPrice: Number(v.unitPrice),
        notes: v.notes || undefined,
      });
      this.form.reset({ eventId: '', organisationId: '', unitPrice: null, notes: '' });
      this.error.set(null);
      await this.load();
    } catch {
      this.error.set('De factuur kon niet worden aangemaakt.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleStatus(inv: Invoice): Promise<void> {
    this.busyId.set(inv.id);
    try {
      await this.invoicesService.setStatus(inv.id, inv.status === 'open' ? 'verwerkt' : 'open');
      await this.load();
    } catch {
      this.error.set('De status kon niet worden gewijzigd.');
    } finally {
      this.busyId.set(null);
    }
  }

  async remove(inv: Invoice): Promise<void> {
    if (!confirm(`Factuur ${inv.invoiceNumber} verwijderen?`)) {
      return;
    }
    try {
      await this.invoicesService.delete(inv.id);
      await this.load();
    } catch {
      this.error.set('De factuur kon niet worden verwijderd.');
    }
  }

  /** Opens a clean printable invoice; the browser's print dialog saves it as PDF. */
  print(inv: Invoice): void {
    const win = window.open('', '_blank', 'width=820,height=1000');
    if (!win) {
      this.error.set('Pop-up geblokkeerd. Sta pop-ups toe om de factuur te printen.');
      return;
    }
    win.document.write(this.invoiceHtml(inv));
    win.document.close();
    win.focus();
    win.print();
  }

  private invoiceHtml(inv: Invoice): string {
    const euro = (value: number) => formatCurrency(value, 'nl', '€', 'EUR');
    const date = (value: string, format: string) => formatDate(value, format, 'nl');
    const esc = (value: string | null) =>
      (value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const rows = inv.participants
      .map(name => `<tr><td>Deelname TTPA cursus ${date(inv.eventDate, 'd MMMM y')} — ${esc(name)}</td><td class="num">${euro(inv.unitPrice)}</td></tr>`)
      .join('');

    return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>${esc(inv.invoiceNumber)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; margin: 3rem; font-size: 14px; }
  h1 { font-size: 22px; margin: 0 0 0.25rem; }
  .muted { color: #64748b; }
  .head { display: flex; justify-content: space-between; margin-bottom: 3rem; }
  .addr { white-space: pre-line; margin-top: 2rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; }
  th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; }
  .num { text-align: right; white-space: nowrap; }
  .total td { font-weight: 700; border-top: 2px solid #1e293b; border-bottom: none; }
  .notes { margin-top: 2rem; font-size: 13px; }
  @media print { body { margin: 1rem; } }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>Factuur</h1>
      <div class="muted">${esc(inv.invoiceNumber)}</div>
      <div class="addr">${esc(inv.orgName)}${inv.orgInvoiceAddress ? '\n' + esc(inv.orgInvoiceAddress) : ''}</div>
      ${inv.orgInvoiceReference ? `<div class="muted" style="margin-top:0.5rem">Uw referentie: ${esc(inv.orgInvoiceReference)}</div>` : ''}
    </div>
    <div style="text-align:right">
      <strong>TTPA Cursus</strong>
      <div class="muted">Factuurdatum: ${date(inv.createdAt, 'd MMMM y')}</div>
      <div class="muted">Cursusdatum: ${date(inv.eventDate, 'd MMMM y')}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Omschrijving</th><th class="num">Bedrag</th></tr></thead>
    <tbody>
      ${rows}
      <tr class="total"><td>Totaal (${inv.participantCount} deelnemer${inv.participantCount === 1 ? '' : 's'})</td><td class="num">${euro(inv.total)}</td></tr>
    </tbody>
  </table>

  ${inv.notes ? `<p class="notes"><strong>Opmerkingen:</strong> ${esc(inv.notes)}</p>` : ''}
  ${inv.orgInvoiceEmail ? `<p class="notes muted">Facturatie-e-mail: ${esc(inv.orgInvoiceEmail)}</p>` : ''}
</body>
</html>`;
  }
}
