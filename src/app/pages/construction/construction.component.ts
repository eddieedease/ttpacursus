import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SiteService } from '../../services/site.service';

@Component({
  selector: 'app-construction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, ReactiveFormsModule],
  template: `
    <section class="relative overflow-hidden min-h-[calc(100dvh-4rem)] bg-slate-900 flex items-center justify-center px-4 py-20">
      <img ngSrc="images/simulatie.jpg" fill priority alt="" class="object-cover">
      <div class="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-teal-950/80" aria-hidden="true"></div>
      <div class="relative max-w-md w-full text-center">
        <p class="text-teal-300 font-black text-4xl tracking-tight mb-2">TTPA</p>
        <h1 class="text-2xl sm:text-3xl font-bold text-white mb-3">Binnenkort online</h1>
        <p class="text-slate-200 mb-10">
          De website voor de TTPA cursus (Tips, Tricks and Pitfall Avoidance) wordt op dit moment voorbereid.
        </p>

        <form
          [formGroup]="form"
          (ngSubmit)="unlock()"
          novalidate
          class="bg-white/10 backdrop-blur rounded-2xl p-6 text-left border border-white/15"
        >
          <label for="preview-password" class="block text-sm font-medium text-white mb-1">Wachtwoord voor de preview</label>
          <div class="flex gap-2">
            <input
              id="preview-password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              [attr.aria-invalid]="error()"
              [attr.aria-describedby]="error() ? 'preview-error' : null"
              class="flex-1 min-w-0 rounded-lg border border-white/30 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
            <button
              type="submit"
              [disabled]="busy()"
              class="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-900 font-semibold px-5 rounded-lg transition-colors"
            >
              Bekijken
            </button>
          </div>
          @if (error()) {
            <p id="preview-error" class="mt-2 text-sm text-red-200" role="alert">Onjuist wachtwoord.</p>
          }
        </form>
      </div>
    </section>
  `,
})
export class ConstructionComponent {
  private readonly site = inject(SiteService);
  private readonly router = inject(Router);

  /** Return URL, bound from the query parameter. */
  readonly terug = input<string>();

  readonly busy = signal(false);
  readonly error = signal(false);

  readonly form = new FormBuilder().nonNullable.group({
    password: ['', Validators.required],
  });

  async unlock(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      return;
    }
    this.busy.set(true);
    const ok = await this.site.unlock(this.form.getRawValue().password);
    this.busy.set(false);
    this.error.set(!ok);
    if (ok) {
      const target = this.terug();
      await this.router.navigateByUrl(target?.startsWith('/') && !target.startsWith('/binnenkort') ? target : '/');
    } else {
      this.form.reset();
    }
  }
}
