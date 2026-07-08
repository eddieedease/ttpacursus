import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Registration } from '../../models';
import { RegistrationsService } from '../../services/registrations.service';

@Component({
  selector: 'app-registration-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">

        <div>
          <label [for]="fid('titel')" class="form-label">Titel</label>
          <input [id]="fid('titel')" type="text" formControlName="titel" class="form-input" [class.border-red-400]="isInvalid('titel')">
        </div>
        <div>
          <label [for]="fid('voorletters')" class="form-label">Voorletters</label>
          <input [id]="fid('voorletters')" type="text" formControlName="voorletters" class="form-input" [class.border-red-400]="isInvalid('voorletters')">
        </div>
        <div>
          <label [for]="fid('voornaam')" class="form-label">Voornaam</label>
          <input [id]="fid('voornaam')" type="text" formControlName="voornaam" class="form-input" [class.border-red-400]="isInvalid('voornaam')">
        </div>
        <div>
          <label [for]="fid('voorvoegsels')" class="form-label">Voorvoegsels</label>
          <input [id]="fid('voorvoegsels')" type="text" formControlName="voorvoegsels" class="form-input">
        </div>
        <div>
          <label [for]="fid('achternaam')" class="form-label">Achternaam</label>
          <input [id]="fid('achternaam')" type="text" formControlName="achternaam" class="form-input" [class.border-red-400]="isInvalid('achternaam')">
        </div>
        <div>
          <label [for]="fid('geslacht')" class="form-label">Geslacht</label>
          <select [id]="fid('geslacht')" formControlName="geslacht" class="form-input">
            <option value="man">Man</option>
            <option value="vrouw">Vrouw</option>
          </select>
        </div>
        <div>
          <label [for]="fid('geboortedatum')" class="form-label">Geboortedatum</label>
          <input [id]="fid('geboortedatum')" type="date" formControlName="geboortedatum" class="form-input" [class.border-red-400]="isInvalid('geboortedatum')">
        </div>
        <div>
          <label [for]="fid('geboorteplaats')" class="form-label">Geboorteplaats</label>
          <input [id]="fid('geboorteplaats')" type="text" formControlName="geboorteplaats" class="form-input" [class.border-red-400]="isInvalid('geboorteplaats')">
        </div>
        <div>
          <label [for]="fid('email')" class="form-label">E-mailadres</label>
          <input [id]="fid('email')" type="email" formControlName="email" class="form-input" [class.border-red-400]="isInvalid('email')">
        </div>
        <div>
          <label [for]="fid('telefoonWerk')" class="form-label">Telefoon werk</label>
          <input [id]="fid('telefoonWerk')" type="tel" formControlName="telefoonWerk" class="form-input" [class.border-red-400]="isInvalid('telefoonWerk')">
        </div>
        <div>
          <label [for]="fid('mobiel')" class="form-label">Mobiel</label>
          <input [id]="fid('mobiel')" type="tel" formControlName="mobiel" class="form-input" [class.border-red-400]="isInvalid('mobiel')">
        </div>
        <div>
          <label [for]="fid('mobielExtra')" class="form-label">Mobiel (extra)</label>
          <input [id]="fid('mobielExtra')" type="tel" formControlName="mobielExtra" class="form-input">
        </div>
        <div>
          <label [for]="fid('adres')" class="form-label">Adres</label>
          <input [id]="fid('adres')" type="text" formControlName="adres" class="form-input" [class.border-red-400]="isInvalid('adres')">
        </div>
        <div>
          <label [for]="fid('postcode')" class="form-label">Postcode</label>
          <input [id]="fid('postcode')" type="text" formControlName="postcode" class="form-input" [class.border-red-400]="isInvalid('postcode')">
        </div>
        <div>
          <label [for]="fid('woonplaats')" class="form-label">Woonplaats</label>
          <input [id]="fid('woonplaats')" type="text" formControlName="woonplaats" class="form-input" [class.border-red-400]="isInvalid('woonplaats')">
        </div>
        <div>
          <label [for]="fid('bigNummer')" class="form-label">BIG Nummer</label>
          <input [id]="fid('bigNummer')" type="text" formControlName="bigNummer" class="form-input" [class.border-red-400]="isInvalid('bigNummer')">
        </div>
        <div>
          <label [for]="fid('functie')" class="form-label">Functie</label>
          <input [id]="fid('functie')" type="text" formControlName="functie" class="form-input" [class.border-red-400]="isInvalid('functie')">
        </div>
        <div>
          <label [for]="fid('specialisme')" class="form-label">Specialisme</label>
          <input [id]="fid('specialisme')" type="text" formControlName="specialisme" class="form-input" [class.border-red-400]="isInvalid('specialisme')">
        </div>
        <div>
          <label [for]="fid('afdeling')" class="form-label">Afdeling</label>
          <input [id]="fid('afdeling')" type="text" formControlName="afdeling" class="form-input" [class.border-red-400]="isInvalid('afdeling')">
        </div>
        <div>
          <label [for]="fid('inOpleiding')" class="form-label">In opleiding</label>
          <select [id]="fid('inOpleiding')" formControlName="inOpleiding" class="form-input">
            <option value="nee">Nee</option>
            <option value="ja">Ja</option>
          </select>
        </div>
        <div>
          <label [for]="fid('dieetwensen')" class="form-label">Dieetwensen</label>
          <input [id]="fid('dieetwensen')" type="text" formControlName="dieetwensen" class="form-input">
        </div>
        <div class="sm:col-span-2 lg:col-span-3">
          <label [for]="fid('werkervaring')" class="form-label">Werkervaring</label>
          <textarea [id]="fid('werkervaring')" formControlName="werkervaring" rows="2" class="form-input resize-none"></textarea>
        </div>
        <div class="sm:col-span-2 lg:col-span-3">
          <label [for]="fid('opmerkingen')" class="form-label">Opmerkingen</label>
          <textarea [id]="fid('opmerkingen')" formControlName="opmerkingen" rows="2" class="form-input resize-none"></textarea>
        </div>

        @if (registration().organisationId === null) {
          <div class="sm:col-span-2 lg:col-span-3 border-t border-slate-200 pt-3 mt-1">
            <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Opgegeven organisatie (anders)</h4>
          </div>
          <div>
            <label [for]="fid('orgAndersNaam')" class="form-label">Naam organisatie</label>
            <input [id]="fid('orgAndersNaam')" type="text" formControlName="orgAndersNaam" class="form-input">
          </div>
          <div>
            <label [for]="fid('orgAndersContactpersoon')" class="form-label">Contactpersoon</label>
            <input [id]="fid('orgAndersContactpersoon')" type="text" formControlName="orgAndersContactpersoon" class="form-input">
          </div>
          <div>
            <label [for]="fid('orgAndersEmail')" class="form-label">E-mail contactpersoon</label>
            <input [id]="fid('orgAndersEmail')" type="email" formControlName="orgAndersEmail" class="form-input">
          </div>
          <div>
            <label [for]="fid('orgAndersAdres')" class="form-label">Adres organisatie</label>
            <input [id]="fid('orgAndersAdres')" type="text" formControlName="orgAndersAdres" class="form-input">
          </div>
          <div class="sm:col-span-2">
            <label [for]="fid('orgAndersFactuuradres')" class="form-label">Factuuradres</label>
            <input [id]="fid('orgAndersFactuuradres')" type="text" formControlName="orgAndersFactuuradres" class="form-input">
          </div>
        }

      </div>

      @if (error()) {
        <p class="mt-3 text-sm text-red-600" role="alert">{{ error() }}</p>
      }

      <div class="flex gap-2 mt-4">
        <button
          type="submit"
          [disabled]="saving()"
          class="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          Opslaan
        </button>
        <button
          type="button"
          (click)="cancelled.emit()"
          class="text-sm text-slate-500 hover:text-slate-800 border border-slate-300 px-4 py-2 rounded-lg transition-colors"
        >
          Annuleren
        </button>
      </div>
    </form>
  `,
  styles: [`
    @reference "tailwindcss";
    .form-label {
      @apply block text-xs font-medium text-slate-600 mb-0.5;
    }
    .form-input {
      @apply w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm
             focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors;
    }
  `],
})
export class RegistrationEditComponent {
  private readonly registrationsService = inject(RegistrationsService);
  private readonly fb = new FormBuilder();

  readonly registration = input.required<Registration>();
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    achternaam: ['', Validators.required],
    voorvoegsels: [''],
    voorletters: ['', Validators.required],
    voornaam: ['', Validators.required],
    titel: ['', Validators.required],
    geslacht: ['man', Validators.required],
    geboortedatum: ['', Validators.required],
    geboorteplaats: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefoonWerk: ['', Validators.required],
    mobiel: ['', Validators.required],
    mobielExtra: [''],
    adres: ['', Validators.required],
    postcode: ['', Validators.required],
    woonplaats: ['', Validators.required],
    bigNummer: ['', Validators.required],
    functie: ['', Validators.required],
    specialisme: ['', Validators.required],
    afdeling: ['', Validators.required],
    inOpleiding: ['nee', Validators.required],
    werkervaring: [''],
    orgAndersNaam: [''],
    orgAndersContactpersoon: [''],
    orgAndersEmail: [''],
    orgAndersAdres: [''],
    orgAndersFactuuradres: [''],
    dieetwensen: [''],
    opmerkingen: [''],
  });

  constructor() {
    effect(() => {
      const reg = this.registration();
      this.form.reset({
        achternaam: reg.achternaam,
        voorvoegsels: reg.voorvoegsels ?? '',
        voorletters: reg.voorletters,
        voornaam: reg.voornaam,
        titel: reg.titel,
        geslacht: reg.geslacht,
        geboortedatum: reg.geboortedatum,
        geboorteplaats: reg.geboorteplaats,
        email: reg.email,
        telefoonWerk: reg.telefoonWerk,
        mobiel: reg.mobiel,
        mobielExtra: reg.mobielExtra ?? '',
        adres: reg.adres,
        postcode: reg.postcode,
        woonplaats: reg.woonplaats,
        bigNummer: reg.bigNummer,
        functie: reg.functie,
        specialisme: reg.specialisme,
        afdeling: reg.afdeling,
        inOpleiding: reg.inOpleiding ? 'ja' : 'nee',
        werkervaring: reg.werkervaring ?? '',
        orgAndersNaam: reg.orgAndersNaam ?? '',
        orgAndersContactpersoon: reg.orgAndersContactpersoon ?? '',
        orgAndersEmail: reg.orgAndersEmail ?? '',
        orgAndersAdres: reg.orgAndersAdres ?? '',
        orgAndersFactuuradres: reg.orgAndersFactuuradres ?? '',
        dieetwensen: reg.dieetwensen ?? '',
        opmerkingen: reg.opmerkingen ?? '',
      });
    });
  }

  /** Unique field id per registration so multiple rows never clash. */
  fid(field: string): string {
    return `edit-${this.registration().id}-${field}`;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      await this.registrationsService.update(this.registration().id, this.form.getRawValue());
      this.saved.emit();
    } catch {
      this.error.set('De wijzigingen konden niet worden opgeslagen.');
    } finally {
      this.saving.set(false);
    }
  }
}
