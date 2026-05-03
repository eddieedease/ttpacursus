import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

function emailMatchValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.get('email');
  const emailBevestig = control.get('emailBevestig');
  if (email && emailBevestig && email.value !== emailBevestig.value) {
    emailBevestig.setErrors({ emailMismatch: true });
    return { emailMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="bg-slate-50 min-h-full py-12 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto">

        <!-- Page header -->
        <div class="text-center mb-10">
          <h1 class="text-3xl font-bold text-slate-900">Aanmeldformulier</h1>
          <p class="text-slate-500 mt-2">Velden gemarkeerd met <span class="text-red-500">*</span> zijn verplicht.</p>
        </div>

        @if (submitted()) {
          <!-- Success message -->
          <div class="bg-teal-50 border border-teal-300 rounded-2xl p-8 text-center shadow" role="alert" aria-live="polite">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-teal-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h2 class="text-xl font-bold text-teal-800 mb-2">Aanmelding ontvangen!</h2>
            <p class="text-teal-700">Bedankt voor uw aanmelding. U ontvangt een bevestiging per e-mail.</p>
          </div>
        } @else {

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate class="space-y-8">

            <!-- Section: Persoonlijke gegevens -->
            <fieldset class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <legend class="text-base font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 w-full block">
                Persoonlijke gegevens
              </legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label for="achternaam" class="form-label">Achternaam <span class="text-red-500" aria-hidden="true">*</span></label>
                    <input id="achternaam" type="text" formControlName="achternaam" class="form-input" [class.border-red-400]="isInvalid('achternaam')" autocomplete="family-name">
                    @if (isInvalid('achternaam')) {
                      <p class="form-error" role="alert">Achternaam is verplicht.</p>
                    }
                  </div>
                  <div>
                    <label for="voorvoegsels" class="form-label">Voorvoegsels</label>
                    <input id="voorvoegsels" type="text" formControlName="voorvoegsels" class="form-input" placeholder="van, de, van der…">
                  </div>
                  <div>
                    <label for="voorletters" class="form-label">Voorletters <span class="text-red-500" aria-hidden="true">*</span></label>
                    <input id="voorletters" type="text" formControlName="voorletters" class="form-input" [class.border-red-400]="isInvalid('voorletters')" placeholder="A.B.">
                    @if (isInvalid('voorletters')) {
                      <p class="form-error" role="alert">Voorletters zijn verplicht.</p>
                    }
                  </div>
                </div>

                <div>
                  <label for="voornaam" class="form-label">Voornaam <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="voornaam" type="text" formControlName="voornaam" class="form-input" [class.border-red-400]="isInvalid('voornaam')" autocomplete="given-name">
                  @if (isInvalid('voornaam')) {
                    <p class="form-error" role="alert">Voornaam is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="titel" class="form-label">Titel <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="titel" type="text" formControlName="titel" class="form-input" [class.border-red-400]="isInvalid('titel')" placeholder="Dr., Drs., Prof.…">
                  @if (isInvalid('titel')) {
                    <p class="form-error" role="alert">Titel is verplicht.</p>
                  }
                </div>

                <!-- Geslacht -->
                <div class="sm:col-span-2">
                  <fieldset>
                    <legend class="form-label">Geslacht <span class="text-red-500" aria-hidden="true">*</span></legend>
                    <div class="flex gap-6 mt-1" role="radiogroup">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" formControlName="geslacht" value="man" class="accent-teal-600 w-4 h-4">
                        <span class="text-sm text-slate-700">Man</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" formControlName="geslacht" value="vrouw" class="accent-teal-600 w-4 h-4">
                        <span class="text-sm text-slate-700">Vrouw</span>
                      </label>
                    </div>
                    @if (isInvalid('geslacht')) {
                      <p class="form-error" role="alert">Geslacht is verplicht.</p>
                    }
                  </fieldset>
                </div>

                <div>
                  <label for="geboortedatum" class="form-label">Geboortedatum <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="geboortedatum" type="date" formControlName="geboortedatum" class="form-input" [class.border-red-400]="isInvalid('geboortedatum')">
                  @if (isInvalid('geboortedatum')) {
                    <p class="form-error" role="alert">Geboortedatum is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="geboorteplaats" class="form-label">Geboorteplaats <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="geboorteplaats" type="text" formControlName="geboorteplaats" class="form-input" [class.border-red-400]="isInvalid('geboorteplaats')">
                  @if (isInvalid('geboorteplaats')) {
                    <p class="form-error" role="alert">Geboorteplaats is verplicht.</p>
                  }
                </div>

              </div>
            </fieldset>

            <!-- Section: Contactgegevens -->
            <fieldset class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <legend class="text-base font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 w-full block">
                Contactgegevens
              </legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div>
                  <label for="email" class="form-label">E-mailadres <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="email" type="email" formControlName="email" class="form-input" [class.border-red-400]="isInvalid('email')" autocomplete="email">
                  @if (isInvalid('email')) {
                    <p class="form-error" role="alert">Vul een geldig e-mailadres in.</p>
                  }
                </div>

                <div>
                  <label for="emailBevestig" class="form-label">E-mailadres bevestigen <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="emailBevestig" type="email" formControlName="emailBevestig" class="form-input" [class.border-red-400]="isInvalid('emailBevestig')">
                  @if (isInvalid('emailBevestig')) {
                    <p class="form-error" role="alert">
                      @if (form.get('emailBevestig')?.errors?.['emailMismatch']) {
                        E-mailadressen komen niet overeen.
                      } @else {
                        Bevestig uw e-mailadres.
                      }
                    </p>
                  }
                </div>

                <div>
                  <label for="telefoonWerk" class="form-label">Telefoonnummer werk <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="telefoonWerk" type="tel" formControlName="telefoonWerk" class="form-input" [class.border-red-400]="isInvalid('telefoonWerk')" autocomplete="work tel">
                  @if (isInvalid('telefoonWerk')) {
                    <p class="form-error" role="alert">Telefoonnummer werk is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="mobiel" class="form-label">Mobiel <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="mobiel" type="tel" formControlName="mobiel" class="form-input" [class.border-red-400]="isInvalid('mobiel')" autocomplete="mobile tel">
                  @if (isInvalid('mobiel')) {
                    <p class="form-error" role="alert">Mobiel nummer is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="telefoonMobielExtra" class="form-label">Mobiele telefoonnummer (extra)</label>
                  <input id="telefoonMobielExtra" type="tel" formControlName="telefoonMobielExtra" class="form-input">
                </div>

              </div>
            </fieldset>

            <!-- Section: Privéadres -->
            <fieldset class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <legend class="text-base font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 w-full block">
                Privéadres <span class="text-xs font-normal text-slate-500">(benodigd voor eenmalig toesturen cursusmateriaal)</span>
              </legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div class="sm:col-span-2">
                  <label for="adresPrive" class="form-label">Adres <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="adresPrive" type="text" formControlName="adresPrive" class="form-input" [class.border-red-400]="isInvalid('adresPrive')" autocomplete="street-address">
                  @if (isInvalid('adresPrive')) {
                    <p class="form-error" role="alert">Adres is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="postcode" class="form-label">Postcode <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="postcode" type="text" formControlName="postcode" class="form-input" [class.border-red-400]="isInvalid('postcode')" autocomplete="postal-code" placeholder="1234 AB">
                  @if (isInvalid('postcode')) {
                    <p class="form-error" role="alert">Postcode is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="woonplaats" class="form-label">Woonplaats <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="woonplaats" type="text" formControlName="woonplaats" class="form-input" [class.border-red-400]="isInvalid('woonplaats')" autocomplete="address-level2">
                  @if (isInvalid('woonplaats')) {
                    <p class="form-error" role="alert">Woonplaats is verplicht.</p>
                  }
                </div>

              </div>
            </fieldset>

            <!-- Section: Professionele gegevens -->
            <fieldset class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <legend class="text-base font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 w-full block">
                Professionele gegevens
              </legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div>
                  <label for="bigNummer" class="form-label">BIG Nummer <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="bigNummer" type="text" formControlName="bigNummer" class="form-input" [class.border-red-400]="isInvalid('bigNummer')">
                  @if (isInvalid('bigNummer')) {
                    <p class="form-error" role="alert">BIG Nummer is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="functie" class="form-label">Functie <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="functie" type="text" formControlName="functie" class="form-input" [class.border-red-400]="isInvalid('functie')">
                  @if (isInvalid('functie')) {
                    <p class="form-error" role="alert">Functie is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="specialisme" class="form-label">Specialisme <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="specialisme" type="text" formControlName="specialisme" class="form-input" [class.border-red-400]="isInvalid('specialisme')">
                  @if (isInvalid('specialisme')) {
                    <p class="form-error" role="alert">Specialisme is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="afdeling" class="form-label">Afdeling <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="afdeling" type="text" formControlName="afdeling" class="form-input" [class.border-red-400]="isInvalid('afdeling')">
                  @if (isInvalid('afdeling')) {
                    <p class="form-error" role="alert">Afdeling is verplicht.</p>
                  }
                </div>

                <!-- In opleiding -->
                <div class="sm:col-span-2">
                  <fieldset>
                    <legend class="form-label">In Opleiding <span class="text-red-500" aria-hidden="true">*</span></legend>
                    <div class="flex gap-6 mt-1">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" formControlName="inOpleiding" value="nee" class="accent-teal-600 w-4 h-4">
                        <span class="text-sm text-slate-700">Nee</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" formControlName="inOpleiding" value="ja" class="accent-teal-600 w-4 h-4">
                        <span class="text-sm text-slate-700">Ja</span>
                      </label>
                    </div>
                    @if (isInvalid('inOpleiding')) {
                      <p class="form-error" role="alert">Dit veld is verplicht.</p>
                    }
                  </fieldset>
                </div>

                <div class="sm:col-span-2">
                  <label for="werkervaring" class="form-label">Relevante werkervaring na afronden studie</label>
                  <textarea id="werkervaring" formControlName="werkervaring" rows="3" class="form-input resize-none" placeholder="Omschrijf uw relevante werkervaring…"></textarea>
                </div>

              </div>
            </fieldset>

            <!-- Section: Organisatiegegevens -->
            <fieldset class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <legend class="text-base font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 w-full block">
                Organisatiegegevens
              </legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div class="sm:col-span-2">
                  <label for="naamOrganisatie" class="form-label">Naam organisatie <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="naamOrganisatie" type="text" formControlName="naamOrganisatie" class="form-input" [class.border-red-400]="isInvalid('naamOrganisatie')">
                  @if (isInvalid('naamOrganisatie')) {
                    <p class="form-error" role="alert">Naam organisatie is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="contactpersoonOrg" class="form-label">Contactpersoon organisatie <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="contactpersoonOrg" type="text" formControlName="contactpersoonOrg" class="form-input" [class.border-red-400]="isInvalid('contactpersoonOrg')">
                  @if (isInvalid('contactpersoonOrg')) {
                    <p class="form-error" role="alert">Contactpersoon is verplicht.</p>
                  }
                </div>

                <div>
                  <label for="emailContactpersoonOrg" class="form-label">E-mail contactpersoon <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="emailContactpersoonOrg" type="email" formControlName="emailContactpersoonOrg" class="form-input" [class.border-red-400]="isInvalid('emailContactpersoonOrg')">
                  @if (isInvalid('emailContactpersoonOrg')) {
                    <p class="form-error" role="alert">Vul een geldig e-mailadres in.</p>
                  }
                </div>

                <div class="sm:col-span-2">
                  <label for="adresOrganisatie" class="form-label">Adres organisatie <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="adresOrganisatie" type="text" formControlName="adresOrganisatie" class="form-input" [class.border-red-400]="isInvalid('adresOrganisatie')">
                  @if (isInvalid('adresOrganisatie')) {
                    <p class="form-error" role="alert">Adres organisatie is verplicht.</p>
                  }
                </div>

                <div class="sm:col-span-2">
                  <label for="factuuradres" class="form-label">Factuuradres organisatie <span class="text-red-500" aria-hidden="true">*</span></label>
                  <input id="factuuradres" type="text" formControlName="factuuradres" class="form-input" [class.border-red-400]="isInvalid('factuuradres')">
                  @if (isInvalid('factuuradres')) {
                    <p class="form-error" role="alert">Factuuradres is verplicht.</p>
                  }
                </div>

              </div>
            </fieldset>

            <!-- Section: Overig -->
            <fieldset class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <legend class="text-base font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-200 w-full block">
                Overig
              </legend>
              <div class="grid grid-cols-1 gap-5">

                <div>
                  <label for="dieetwensen" class="form-label">Dieetwensen</label>
                  <input id="dieetwensen" type="text" formControlName="dieetwensen" class="form-input" placeholder="bijv. vegetarisch, glutenvrij…">
                </div>

                <div>
                  <label for="opmerkingen" class="form-label">Opmerkingen</label>
                  <textarea id="opmerkingen" formControlName="opmerkingen" rows="4" class="form-input resize-none" placeholder="Heeft u nog vragen of opmerkingen?"></textarea>
                </div>

              </div>
            </fieldset>

            <!-- Submit -->
            <div class="flex justify-end pb-6">
              <button
                id="submit-aanmelding"
                type="submit"
                class="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-10 py-4 rounded-xl shadow-md transition-all duration-200 hover:scale-105"
              >
                Aanmelding versturen
              </button>
            </div>

          </form>
        }
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
export class FormComponent {
  private readonly fb = new FormBuilder();

  readonly submitted = signal(false);

  readonly form = this.fb.group(
    {
      // Persoonlijk
      achternaam: ['', Validators.required],
      voorvoegsels: [''],
      voorletters: ['', Validators.required],
      voornaam: ['', Validators.required],
      titel: ['', Validators.required],
      geslacht: ['', Validators.required],
      geboortedatum: ['', Validators.required],
      geboorteplaats: ['', Validators.required],
      // Contact
      email: ['', [Validators.required, Validators.email]],
      emailBevestig: ['', Validators.required],
      telefoonWerk: ['', Validators.required],
      mobiel: ['', Validators.required],
      telefoonMobielExtra: [''],
      // Privéadres
      adresPrive: ['', Validators.required],
      postcode: ['', Validators.required],
      woonplaats: ['', Validators.required],
      // Professioneel
      bigNummer: ['', Validators.required],
      functie: ['', Validators.required],
      specialisme: ['', Validators.required],
      afdeling: ['', Validators.required],
      inOpleiding: ['', Validators.required],
      werkervaring: [''],
      // Organisatie
      naamOrganisatie: ['', Validators.required],
      contactpersoonOrg: ['', Validators.required],
      emailContactpersoonOrg: ['', [Validators.required, Validators.email]],
      adresOrganisatie: ['', Validators.required],
      factuuradres: ['', Validators.required],
      // Overig
      dieetwensen: [''],
      opmerkingen: [''],
    },
    { validators: emailMatchValidator }
  );

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      console.log('Aanmelding:', this.form.value);
      this.submitted.set(true);
    }
  }
}
