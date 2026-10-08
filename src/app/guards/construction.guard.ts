import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SiteService } from '../services/site.service';

/** Sends visitors to the "under construction" page until they unlock the preview. */
export const constructionGuard: CanActivateFn = async (_route, state) => {
  const site = inject(SiteService);
  const router = inject(Router);
  const status = await site.load();
  return status.unlocked
    ? true
    : router.createUrlTree(['/binnenkort'], { queryParams: { terug: state.url } });
};
