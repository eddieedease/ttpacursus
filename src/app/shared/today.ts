import { InjectionToken } from '@angular/core';

/** Today's date as 'YYYY-MM-DD' (local time); comparable with API dates as strings. */
export const TODAY = new InjectionToken<string>('TODAY', {
  providedIn: 'root',
  factory: () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  },
});

export type Period = 'komend' | 'verleden';

/** Whether a date belongs to the period. Items without a date count as upcoming (still to be planned). */
export function inPeriod(date: string | null | undefined, period: Period, today: string): boolean {
  const upcoming = !date || date.slice(0, 10) >= today;
  return period === 'komend' ? upcoming : !upcoming;
}
