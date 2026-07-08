import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Organisation } from '../../models';
import { OrganisationsService } from '../../services/organisations.service';

@Component({
  selector: 'app-admin-organisations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

      <!-- Form -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 self-start">
        <h2 class="text-base font-semibold text-slate-800 mb-4">
          @if (editingId()) { Organisatie bewerken } @else { Nieuwe organisatie }
        </h2>

        <form [formGroup]="form" (ngSubmit)="save()" novalidate class="space-y-4">
          <div>
            <label for="org-name" class="form-label">Naam <span class="text-red-500" aria-hidden="true">*</span></label>
            <input id="org-name" type="text" formControlName="name" class="form-input" [class.border-red-400]="isInvalid('name')">
            @if (isInvalid('name')) {
              <p class="form-error" role="alert">Naam is verplicht.</p>
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="org-contact" class="form-label">Contactpersoon</label>
              <input id="org-contact" type="text" formControlName="contactPerson" class="form-input">
            </div>
            <div>
              <label for="org-phone" class="form-label">Telefoon</label>
              <input id="org-phone" type="tel" formControlName="contactPhone" class="form-input">
            </div>
          </div>

          <div>
            <label for="org-email" class="form-label">E-mail contactpersoon</label>
            <input id="org-email" type="email" formControlName="contactEmail" class="form-input" [class.border-red-400]="isInvalid('contactEmail')">
            @if (isInvalid('contactEmail')) {
              <p class="form-error" role="alert">Vul een geldig e-mailadres in.</p>
            }
          </div>

          <div>
            <label for="org-address" class="form-label">Adres</label>
            <input id="org-address" type="text" formControlName="address" class="form-input">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="org-postcode" class="form-label">Postcode</label>
              <input id="org-postcode" type="text" formControlName="postcode" class="form-input" placeholder="1234 AB">
            </div>
            <div>
              <label for="org-city" class="form-label">Plaats</label>
              <input id="org-city" type="text" formControlName="city" class="form-input">
            </div>
          </div>

          <hr class="border-slate-200">
          <h3 class="text-sm font-semibold text-slate-700">Facturatie</h3>

          <div>
            <label for="org-inv-address" class="form-label">Factuuradres</label>
            <input id="org-inv-address" type="text" formControlName="invoiceAddress" class="form-input" placeholder="Straat of postbus">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="org-inv-postcode" class="form-label">Postcode</label>
              <input id="org-inv-postcode" type="text" formControlName="invoicePostcode" class="form-input">
            </div>
            <div>
              <label for="org-inv-city" class="form-label">Plaats</label>
              <input id="org-inv-city" type="text" formControlName="invoiceCity" class="form-input">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="org-inv-email" class="form-label">E-mail facturatie</label>
              <input id="org-inv-email" type="email" formControlName="invoiceEmail" class="form-input" [class.border-red-400]="isInvalid('invoiceEmail')">
              @if (isInvalid('invoiceEmail')) {
                <p class="form-error" role="alert">Vul een geldig e-mailadres in.</p>
              }
            </div>
            <div>
              <label for="org-inv-ref" class="form-label">Referentie / PO-nummer</label>
              <input id="org-inv-ref" type="text" formControlName="invoiceReference" class="form-input">
            </div>
          </div>

          <div>
            <label for="org-notes" class="form-label">Notities</label>
            <textarea id="org-notes" formControlName="notes" rows="2" class="form-input resize-none"></textarea>
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" formControlName="isActive" class="accent-teal-600 w-4 h-4">
            <span class="text-sm text-slate-700">Zichtbaar op het aanmeldformulier</span>
          </label>

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
      <div class="lg:col-span-3 self-start">
        <div class="mb-3">
          <label for="org-search" class="sr-only">Zoeken in organisaties</label>
          <input
            id="org-search"
            type="search"
            class="form-input max-w-xs"
            placeholder="Zoeken…"
            (input)="onSearch($event)"
          >
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm" aria-label="Organisaties">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-left">
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Naam</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Aanmeldingen</th>
                <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Actief</th>
                <th scope="col" class="px-4 py-3"><span class="sr-only">Acties</span></th>
              </tr>
            </thead>
            <tbody>
              @for (org of filtered(); track org.id) {
                <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors" [class.opacity-50]="!org.isActive">
                  <td class="px-4 py-3 font-medium text-slate-800">
                    {{ org.name }}
                    @if (!org.invoiceEmail && !org.invoiceAddress) {
                      <span class="ml-2 inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">facturatie ontbreekt</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ org.registrationCount }}</td>
                  <td class="px-4 py-3">
                    @if (org.isActive) {
                      <span class="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full">Ja</span>
                    } @else {
                      <span class="inline-block bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full">Nee</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      class="text-teal-700 hover:text-teal-900 text-xs font-semibold underline underline-offset-2 mr-3"
                      (click)="startEdit(org)"
                    >Bewerken</button>
                    <button
                      class="text-red-600 hover:text-red-800 text-xs font-semibold underline underline-offset-2"
                      (click)="remove(org)"
                    >Verwijderen</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-slate-500">
                    @if (loading()) { Organisaties worden geladen… } @else { Nog geen organisaties gevonden. }
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
export class AdminOrganisationsComponent {
  private readonly organisationsService = inject(OrganisationsService);
  private readonly fb = new FormBuilder();

  readonly organisations = signal<Organisation[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<number | null>(null);

  private readonly search = signal('');

  readonly filtered = computed(() => {
    const term = this.search().toLowerCase();
    if (!term) {
      return this.organisations();
    }
    return this.organisations().filter(org =>
      [org.name, org.contactPerson ?? '', org.contactEmail ?? '', org.city ?? '', org.invoiceEmail ?? '']
        .some(value => value.toLowerCase().includes(term))
    );
  });

  readonly form = this.fb.group({
    name: ['', Validators.required],
    contactPerson: [''],
    contactEmail: ['', Validators.email],
    contactPhone: [''],
    address: [''],
    postcode: [''],
    city: [''],
    invoiceAddress: [''],
    invoicePostcode: [''],
    invoiceCity: [''],
    invoiceEmail: ['', Validators.email],
    invoiceReference: [''],
    notes: [''],
    isActive: [true],
  });

  constructor() {
    this.load();
  }

  private async load(): Promise<void> {
    try {
      this.organisations.set(await this.organisationsService.list());
      this.error.set(null);
    } catch {
      this.error.set('Organisaties konden niet worden geladen.');
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

  startEdit(org: Organisation): void {
    this.editingId.set(org.id);
    this.form.setValue({
      name: org.name,
      contactPerson: org.contactPerson ?? '',
      contactEmail: org.contactEmail ?? '',
      contactPhone: org.contactPhone ?? '',
      address: org.address ?? '',
      postcode: org.postcode ?? '',
      city: org.city ?? '',
      invoiceAddress: org.invoiceAddress ?? '',
      invoicePostcode: org.invoicePostcode ?? '',
      invoiceCity: org.invoiceCity ?? '',
      invoiceEmail: org.invoiceEmail ?? '',
      invoiceReference: org.invoiceReference ?? '',
      notes: org.notes ?? '',
      isActive: org.isActive,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '', contactPerson: '', contactEmail: '', contactPhone: '',
      address: '', postcode: '', city: '',
      invoiceAddress: '', invoicePostcode: '', invoiceCity: '', invoiceEmail: '', invoiceReference: '',
      notes: '', isActive: true,
    });
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    const payload = this.form.getRawValue() as Partial<Organisation>;

    this.saving.set(true);
    try {
      const id = this.editingId();
      if (id) {
        await this.organisationsService.update(id, payload);
      } else {
        await this.organisationsService.create(payload);
      }
      this.cancelEdit();
      await this.load();
    } catch {
      this.error.set('De organisatie kon niet worden opgeslagen.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(org: Organisation): Promise<void> {
    if (!confirm(`Organisatie "${org.name}" verwijderen?`)) {
      return;
    }
    try {
      await this.organisationsService.delete(org.id);
      if (this.editingId() === org.id) {
        this.cancelEdit();
      }
      await this.load();
    } catch {
      this.error.set('Deze organisatie is in gebruik bij aanmeldingen en kan niet worden verwijderd. Zet deze op inactief.');
    }
  }
}
