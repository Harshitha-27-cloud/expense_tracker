import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

export interface SidebarItem {
  id: number;
  name: string;
  icon: string;
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private apiUrl = 'http://127.0.0.1:8000/api/sidebar/';
  private fallbackItems: SidebarItem[] = [
    { id: 1, name: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { id: 2, name: 'Expenses', icon: 'receipt', route: '/expenses' },
    { id: 3, name: 'Categories', icon: 'folder', route: '/categories' },
    { id: 4, name: 'Budgets', icon: 'account_balance', route: '/budgets' },
    { id: 5, name: 'Reports', icon: 'bar_chart', route: '/reports' },
    { id: 6, name: 'AI Insights', icon: 'smart_toy', route: '/ai' },
    { id: 7, name: 'Budget Alert', icon: 'notifications', route: '/alerts' }
  ];

  constructor(private http: HttpClient) {}

  getDefaultSidebar(): SidebarItem[] {
    return this.normalizeItems(this.fallbackItems);
  }

  getSidebar(): Observable<SidebarItem[]> {
    return this.http.get<SidebarItem[]>(this.apiUrl).pipe(
      map((items) => this.normalizeItems(items)),
      catchError(() => of(this.getDefaultSidebar()))
    );
  }

  private normalizeItems(items: SidebarItem[] | null | undefined): SidebarItem[] {
    const fallbackByRoute = new Map(
      this.fallbackItems.map((item) => [item.route, item])
    );
    const seenRoutes = new Set<string>();
    const normalized: SidebarItem[] = [];

    for (const item of items ?? []) {
      const route = this.normalizeRoute(item?.route);
      const fallback = fallbackByRoute.get(route);
      const uniqueKey = route || item?.name?.trim()?.toLowerCase();

      if (!uniqueKey || seenRoutes.has(uniqueKey)) {
        continue;
      }

      seenRoutes.add(uniqueKey);
      normalized.push({
        id: item?.id ?? fallback?.id ?? normalized.length + 1,
        name: item?.name?.trim() || fallback?.name || 'Module',
        icon: item?.icon?.trim() || fallback?.icon || 'dashboard',
        route,
      });
    }

    if (!normalized.length) {
      return [...this.fallbackItems];
    }

    return normalized;
  }

  private normalizeRoute(route: string | undefined): string {
    if (!route) {
      return '/dashboard';
    }

    return route.startsWith('/') ? route : `/${route}`;
  }
}
