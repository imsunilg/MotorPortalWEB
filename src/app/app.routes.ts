import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/authentication/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'excel-upload',
        loadComponent: () =>
          import('./features/excel-upload/excel-upload').then((m) => m.ExcelUpload),
      },
      {
        path: 'batch-summary',
        loadComponent: () =>
          import('./features/batch-summary/batch-summary').then((m) => m.BatchSummary),
      },
      {
        path: 'batch-processing',
        loadComponent: () =>
          import('./features/batch-processing/batch-processing').then((m) => m.BatchProcessing),
      },
      {
        path: 'invalid-records',
        loadComponent: () =>
          import('./features/invalid-records/invalid-records').then((m) => m.InvalidRecords),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'policy-search',
        loadComponent: () =>
          import('./features/policy-search/policy-search').then((m) => m.PolicySearch),
      },
      {
        path: 'policy-certificate',
        loadComponent: () =>
          import('./features/policy-certificate/policy-certificate').then(
            (m) => m.PolicyCertificate,
          ),
      },
      {
        path: 'policy-cancel',
        loadComponent: () =>
          import('./features/policy-cancel/policy-cancel').then((m) => m.PolicyCancel),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
