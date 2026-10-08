import { HttpErrorResponse } from '@angular/common/http';

/** The API's (Dutch) error message, or the fallback. */
export function apiError(e: unknown, fallback: string): string {
  return e instanceof HttpErrorResponse && typeof e.error?.error === 'string' ? e.error.error : fallback;
}
