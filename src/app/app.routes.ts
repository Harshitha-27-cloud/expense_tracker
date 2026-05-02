import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login';
import { CategoryComponent } from './category/category';
import { DashboardComponent } from './dashboard/dashboard';
import { ExpenseComponent } from './expenses/expenses';
import { ShellComponent } from './layout/shell';
import { PlaceholderPageComponent } from './placeholder/placeholder';
import { BudgetComponent } from './budget/budget';
import { ReportsComponent } from './reports/reports'; 
import { AiInsightsComponent } from './ai-insights/ai-insights'; 
import { BudgetAlertComponent } from './budget-alert/budget-alert';  // ✅ ADD THIS

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: ShellComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'expenses', component: ExpenseComponent },
      { path: 'categories', component: CategoryComponent },
      { path: 'budgets', component: BudgetComponent },

      { path: 'ai', component: AiInsightsComponent },   // ✅ KEEP ONLY ONE

      { path: 'reports', component: ReportsComponent },

      // ✅ FIXED ALERT ROUTE
      { path: 'alerts', component: BudgetAlertComponent },

      // Optional placeholder routes
      // { path: 'alerts', component: PlaceholderPageComponent, data: { title: 'Budget Alert' } },
    ],
  },

  { path: '**', redirectTo: 'login' },
];