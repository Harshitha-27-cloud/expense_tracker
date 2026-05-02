import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { ApiService } from '../services/api';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  currentTitle = 'Dashboard';
  mobileMenuOpen = false;
  userName = 'Account';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.updateTitle(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateTitle((event as NavigationEnd).urlAfterRedirects);
        this.mobileMenuOpen = false;
      });

    if (isPlatformBrowser(this.platformId)) {
      this.api.getCurrentUser().subscribe({
        next: (user: any) => {
          this.userName = user?.username || 'Account';
        },
        error: () => {
          this.userName = 'Account';
        },
      });
    }
  }

  get userInitial(): string {
    return (this.userName?.trim()?.charAt(0) || 'A').toUpperCase();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
    }
    void this.router.navigate(['/login']);
  }

  private updateTitle(url: string): void {
    const path = url.split('?')[0].replace(/^\//, '');
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      expenses: 'Expenses',
      categories: 'Categories',
      budgets: 'Budgets',
      reports: 'Reports',
      ai: 'AI Insights',
      alerts: 'Budget Alert',
    };

    this.currentTitle = map[path] ?? 'Dashboard';
  }
}
