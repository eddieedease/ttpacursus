import { Routes } from '@angular/router';
import { constructionGuard } from './guards/construction.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [constructionGuard],
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'aanmelden',
    canActivate: [constructionGuard],
    loadComponent: () => import('./pages/form/form.component').then(m => m.FormComponent),
  },
  {
    path: 'binnenkort',
    loadComponent: () =>
      import('./pages/construction/construction.component').then(m => m.ConstructionComponent),
  },
  {
    path: 'trainer',
    loadComponent: () => import('./pages/trainer/trainer.component').then(m => m.TrainerComponent),
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
      {
        path: 'facturen',
        loadComponent: () =>
          import('./pages/admin/invoices.component').then(m => m.AdminInvoicesComponent),
      },
      {
        path: 'trainers',
        loadComponent: () =>
          import('./pages/admin/trainers.component').then(m => m.AdminTrainersComponent),
      },
      {
        path: 'gebruikers',
        loadComponent: () => import('./pages/admin/users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'e-mails',
        loadComponent: () => import('./pages/admin/mails.component').then(m => m.AdminMailsComponent),
      },
      {
        path: 'instellingen',
        loadComponent: () =>
          import('./pages/admin/settings.component').then(m => m.AdminSettingsComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
