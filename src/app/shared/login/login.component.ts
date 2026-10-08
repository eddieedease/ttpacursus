import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

/** Username/password login card, shared by the admin and trainer pages. */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="max-w-sm mx-auto mt-16">
      <div class="bg-white rounded-2xl shadow-md border border-slate-200 p-8">
        <h1 class="text-xl font-bold text-slate-800 mb-1 text-center">{{ heading() }}</h1>
        <p class="text-sm text-slate-500 text-center mb-6">{{ intro() }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label for="login-username" class="block text-sm font-medium text-slate-700 mb-1">Gebruikersnaam</label>
          <input
            id="login-username"
            type="text"
            formControlName="username"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-4"
            autocomplete="username"
          >
          <label for="login-password" class="block text-sm font-medium text-slate-700 mb-1">Wachtwoord</label>
          <input
            id="login-password"
            type="password"
            formControlName="password"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 mb-4"
            autocomplete="current-password"
          >
          @if (error()) {
            <p class="text-xs text-red-600 mb-3" role="alert">Onjuiste inloggegevens. Probeer het opnieuw.</p>
          }
          <button
            type="submit"
            [disabled]="busy()"
            class="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Inloggen
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);

  readonly heading = input.required<string>();
  readonly intro = input('');

  readonly error = signal(false);
  readonly busy = signal(false);

  readonly form = new FormBuilder().nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    const { username, password } = this.form.getRawValue();
    const ok = await this.auth.login(username, password);
    this.error.set(!ok);
    this.form.patchValue({ password: '' });
    this.busy.set(false);
  }
}
