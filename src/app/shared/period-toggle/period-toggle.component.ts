import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Period } from '../today';

/** Segmented switch between upcoming and past items, with counts. */
@Component({
  selector: 'app-period-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-sm" role="group" [attr.aria-label]="label()">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors"
          [class]="period() === option.value ? 'bg-teal-600 text-white' : 'text-slate-700 hover:bg-slate-100'"
          [attr.aria-pressed]="period() === option.value"
          (click)="period.set(option.value)"
        >
          {{ option.label }}
          <span class="ml-1 font-normal" [class]="period() === option.value ? 'text-teal-50' : 'text-slate-600'">
            ({{ option.value === 'komend' ? upcomingCount() : pastCount() }})
          </span>
        </button>
      }
    </div>
  `,
})
export class PeriodToggleComponent {
  readonly period = model<Period>('komend');
  readonly upcomingCount = input(0);
  readonly pastCount = input(0);
  readonly label = input('Periode');

  readonly options: { value: Period; label: string }[] = [
    { value: 'komend', label: 'Komend' },
    { value: 'verleden', label: 'Verleden' },
  ];
}
