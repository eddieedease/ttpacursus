import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="bg-slate-900 text-slate-400 text-sm py-8 mt-auto">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>
          &copy; {{ year }} <span class="text-white font-semibold">TTPA Cursus</span>. Alle rechten voorbehouden.
        </p>
        <p class="text-slate-500">
          Voor vragen: <a href="mailto:info@ttpacursus.nl" class="text-teal-400 hover:text-teal-300 transition-colors">info@ttpacursus.nl</a>
        </p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
