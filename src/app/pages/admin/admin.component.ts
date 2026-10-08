import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from '../../shared/login/login.component';

@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoginComponent, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-full bg-slate-100 py-12 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">

        @if (auth.authenticated() === null) {
          <p class="text-center text-slate-500 mt-16" role="status">Bezig met laden…</p>

        } @else if (auth.authenticated() === false) {
          <app-login heading="Admin toegang" intro="Log in met uw beheerdersaccount." />

        } @else if (auth.role() !== 'admin') {
          <div class="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center">
            <h1 class="text-xl font-bold text-slate-800 mb-2">Geen toegang tot het beheer</h1>
            <p class="text-sm text-slate-600 mb-6">U bent ingelogd als trainer ({{ auth.name() }}).</p>
            <div class="flex justify-center gap-3">
              <a routerLink="/trainer" class="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Naar mijn beschikbaarheid</a>
              <button (click)="logout()" class="text-sm text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:border-red-300 hover:text-red-700">Uitloggen</button>
            </div>
          </div>

        } @else {
          <!-- Admin Dashboard -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-bold text-slate-900">Beheer TTPA cursus</h1>
            </div>
            <button
              id="admin-logout-btn"
              (click)="logout()"
              class="text-sm text-slate-600 hover:text-red-700 border border-slate-300 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
            >
              Uitloggen
            </button>
          </div>

          <nav class="flex gap-1 border-b border-slate-300 mb-8 overflow-x-auto" aria-label="Beheeronderdelen">
            <a routerLink="aanmeldingen" routerLinkActive="tab-active" class="tab">Aanmeldingen</a>
            <a routerLink="planner" routerLinkActive="tab-active" class="tab">Cursusdata</a>
            <a routerLink="organisaties" routerLinkActive="tab-active" class="tab">Organisaties</a>
            <a routerLink="facturen" routerLinkActive="tab-active" class="tab">Facturen</a>
            <a routerLink="trainers" routerLinkActive="tab-active" class="tab">Trainers</a>
            <a routerLink="gebruikers" routerLinkActive="tab-active" class="tab">Gebruikers</a>
            <a routerLink="e-mails" routerLinkActive="tab-active" class="tab">E-mails</a>
            <a routerLink="instellingen" routerLinkActive="tab-active" class="tab">Instellingen</a>
          </nav>

          <router-outlet />
        }
      </div>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    .tab {
      @apply px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent -mb-px transition-colors whitespace-nowrap;
    }
    .tab-active {
      @apply text-teal-700 border-teal-600;
    }
  `],
})
export class AdminComponent {
  protected readonly auth = inject(AuthService);

  constructor() {
    this.auth.check();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
