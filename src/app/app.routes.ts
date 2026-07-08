import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'aanmelden',
    loadComponent: () => import('./pages/form/form.component').then(m => m.FormComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'aanmeldingen' },
      {
        path: 'aanmeldingen',
        loadComponent: () =>
          import('./pages/admin/registrations.component').then(m => m.AdminRegistrationsComponent),
      },
      {
        path: 'planner',
        loadComponent: () =>
          import('./pages/admin/planner.component').then(m => m.AdminPlannerComponent),
      },
      {
        path: 'organisaties',
        loadComponent: () =>
          import('./pages/admin/organisations.component').then(m => m.AdminOrganisationsComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
