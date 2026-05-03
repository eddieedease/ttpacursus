import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Registration {
  naam: string;
  email: string;
  bigNummer: string;
  specialisme: string;
  instelling: string;
  datum: string;
}

const MOCK_DATA: Registration[] = [
  { naam: 'Dr. A. Jansen', email: 'a.jansen@umcg.nl', bigNummer: '19048291', specialisme: 'Cardiologie', instelling: 'UMCG', datum: '2025-04-10' },
  { naam: 'Drs. M. de Vries', email: 'm.devries@amc.nl', bigNummer: '38201947', specialisme: 'Neurologie', instelling: 'Amsterdam UMC', datum: '2025-04-12' },
  { naam: 'Prof. K. Bakker', email: 'k.bakker@radboud.nl', bigNummer: '57294018', specialisme: 'Interne Geneeskunde', instelling: 'Radboudumc', datum: '2025-04-14' },
  { naam: 'Dr. S. Peters', email: 's.peters@lumc.nl', bigNummer: '62038471', specialisme: 'Chirurgie', instelling: 'LUMC', datum: '2025-04-15' },
];

@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="min-h-full bg-slate-100 py-12 px-4 sm:px-6">
      <div class="max-w-5xl mx-auto">

        @if (!authenticated()) {
          <!-- Login Wall -->
          <div class="max-w-sm mx-auto mt-16">
            <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
              <h1 class="text-xl font-bold text-slate-800 mb-1 text-center">Admin toegang</h1>
              <p class="text-sm text-slate-500 text-center mb-6">Vul het wachtwoord in om door te gaan.</p>

              <form (ngSubmit)="tryLogin()" novalidate>
                <label for="admin-password" class="block text-sm font-medium text-slate-700 mb-1">Wachtwoord</label>
                <input
                  id="admin-password"
                  type="password"
                  [(ngModel)]="passwordInput"
                  name="password"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-4"
                  autocomplete="current-password"
                >
                @if (loginError()) {
                  <p class="text-xs text-red-600 mb-3" role="alert">Onjuist wachtwoord. Probeer het opnieuw.</p>
                }
                <button
                  id="admin-login-btn"
                  type="submit"
                  class="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Inloggen
                </button>
              </form>
            </div>
          </div>

        } @else {
          <!-- Admin Dashboard -->
          <div class="flex items-center justify-between mb-8">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">Admin – Aanmeldingen</h1>
              <p class="text-sm text-slate-500 mt-1">Overzicht van alle ontvangen aanmeldingen.</p>
            </div>
            <button
              id="admin-logout-btn"
              (click)="logout()"
              class="text-sm text-slate-500 hover:text-red-600 border border-slate-300 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
            >
              Uitloggen
            </button>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Totaal aanmeldingen</p>
              <p class="text-3xl font-bold text-slate-900">{{ registrations.length }}</p>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Nieuwe (deze week)</p>
              <p class="text-3xl font-bold text-teal-600">2</p>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Status</p>
              <span class="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full">Inschrijving open</span>
            </div>
          </div>

          <!-- Table -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm" aria-label="Overzicht aanmeldingen">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-left">
                    <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Naam</th>
                    <th scope="col" class="px-4 py-3 font-semibold text-slate-600">E-mail</th>
                    <th scope="col" class="px-4 py-3 font-semibold text-slate-600">BIG Nummer</th>
                    <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Specialisme</th>
                    <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Instelling</th>
                    <th scope="col" class="px-4 py-3 font-semibold text-slate-600">Datum</th>
                  </tr>
                </thead>
                <tbody>
                  @for (reg of registrations; track reg.bigNummer) {
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td class="px-4 py-3 font-medium text-slate-800">{{ reg.naam }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ reg.email }}</td>
                      <td class="px-4 py-3 text-slate-600 font-mono text-xs">{{ reg.bigNummer }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ reg.specialisme }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ reg.instelling }}</td>
                      <td class="px-4 py-3 text-slate-500">{{ reg.datum }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              {{ registrations.length }} aanmelding(en) gevonden — mockdata, API wordt later gekoppeld.
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminComponent {
  readonly authenticated = signal(false);
  readonly loginError = signal(false);
  passwordInput = '';

  readonly registrations: Registration[] = MOCK_DATA;

  // Simple hardcoded password — will be replaced with real auth when backend is set up
  private readonly ADMIN_PASSWORD = 'ttpa2025';

  tryLogin(): void {
    if (this.passwordInput === this.ADMIN_PASSWORD) {
      this.authenticated.set(true);
      this.loginError.set(false);
    } else {
      this.loginError.set(true);
    }
    this.passwordInput = '';
  }

  logout(): void {
    this.authenticated.set(false);
  }
}
