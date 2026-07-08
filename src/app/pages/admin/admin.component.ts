import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-full bg-slate-100 py-12 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">

        @if (auth.authenticated() === null) {
          <p class="text-center text-slate-500 mt-16" role="status">Bezig met laden…</p>

        } @else if (auth.authenticated() === false) {
          <!-- Login Wall -->
          <div class="max-w-sm mx-auto mt-16">
            <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
              <h1 class="text-xl font-bold text-slate-800 mb-1 text-center">Admin toegang</h1>
              <p class="text-sm text-slate-500 text-center mb-6">Vul het wachtwoord in om door te gaan.</p>

              <form [formGroup]="loginForm" (ngSubmit)="tryLogin()" novalidate>
                <label for="admin-password" class="block text-sm font-medium text-slate-700 mb-1">Wachtwoord</label>
                <input
                  id="admin-password"
                  type="password"
                  formControlName="password"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-4"
                  autocomplete="current-password"
                >
                @if (loginError()) {
                  <p class="text-xs text-red-600 mb-3" role="alert">Onjuist wachtwoord. Probeer het opnieuw.</p>
                }
                <button
                  id="admin-login-btn"
                  type="submit"
                  [disabled]="loggingIn()"
                  class="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Inloggen
                </button>
              </form>
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
              class="text-sm text-slate-500 hover:text-red-600 border border-slate-300 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
            >
              Uitloggen
            </button>
          </div>

          <nav class="flex gap-1 border-b border-slate-300 mb-8" aria-label="Beheeronderdelen">
            <a routerLink="aanmeldingen" routerLinkActive="tab-active" class="tab">Aanmeldingen</a>
            <a routerLink="planner" routerLinkActive="tab-active" class="tab">Cursusdata</a>
            <a routerLink="organisaties" routerLinkActive="tab-active" class="tab">Organisaties</a>
          </nav>

          <router-outlet />
        }
      </div>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    .tab {
      @apply px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 border-b-2 border-transparent -mb-px transition-colors;
    }
    .tab-active {
      @apply text-teal-700 border-teal-600;
    }
  `],
})
export class AdminComponent {
  protected readonly auth = inject(AuthService);
  private readonly fb = new FormBuilder();

  readonly loginError = signal(false);
  readonly loggingIn = signal(false);

  readonly loginForm = this.fb.group({
    password: ['', Validators.required],
  });

  constructor() {
    this.auth.check();
  }

  async tryLogin(): Promise<void> {
    if (this.loginForm.invalid || this.loggingIn()) {
      return;
    }
    this.loggingIn.set(true);
    const ok = await this.auth.login(this.loginForm.getRawValue().password!);
    this.loginError.set(!ok);
    this.loginForm.reset({ password: '' });
    this.loggingIn.set(false);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
