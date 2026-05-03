import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <nav class="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16" aria-label="Hoofdnavigatie">

        <!-- Logo / Brand -->
        <a routerLink="/" class="flex items-center gap-2 text-navy font-bold text-lg tracking-tight">
          <span class="text-teal-600 text-2xl font-black leading-none">TTPA</span>
          <span class="text-slate-700 font-semibold text-base">Cursus</span>
        </a>

        <!-- Desktop nav -->
        <ul class="hidden sm:flex items-center gap-6 list-none m-0 p-0">
          <li>
            <a routerLink="/" routerLinkActive="text-teal-600 font-semibold"
               [routerLinkActiveOptions]="{ exact: true }"
               class="text-slate-600 hover:text-teal-600 transition-colors text-sm font-medium">
              Home
            </a>
          </li>
          <li>
            <a routerLink="/aanmelden"
               class="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Aanmelden
            </a>
          </li>
        </ul>

        <!-- Mobile hamburger -->
        <button
          class="sm:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          [attr.aria-expanded]="mobileOpen()"
          aria-controls="mobile-menu"
          aria-label="Menu openen"
          (click)="mobileOpen.set(!mobileOpen())"
        >
          @if (!mobileOpen()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          }
        </button>
      </nav>

      <!-- Mobile menu -->
      @if (mobileOpen()) {
        <div id="mobile-menu" class="sm:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-3">
          <a routerLink="/" (click)="mobileOpen.set(false)"
             class="text-slate-700 font-medium py-2 hover:text-teal-600 transition-colors">
            Home
          </a>
          <a routerLink="/aanmelden" (click)="mobileOpen.set(false)"
             class="bg-teal-600 text-white text-center font-semibold py-2 rounded-lg hover:bg-teal-700 transition-colors">
            Aanmelden
          </a>
        </div>
      }
    </header>
  `,
})
export class NavComponent {
  readonly mobileOpen = signal(false);
}
