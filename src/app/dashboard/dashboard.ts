import { CommonModule, isPlatformBrowser, DecimalPipe, DatePipe, SlicePipe, NgClass } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from '../services/api';
// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CategorySplit {
  category__name: string;
  total: number;
}

export interface MonthlyTrend {
  month: string;    // e.g. "January" | "Feb" | "2024-01"
  total: number;
}

export interface Transaction {
  id?: number;
  title: string;
  category: string;
  amount: number;
  date: string;     // ISO date string
}

export interface DashboardData {
  total_expense: number;
  budget: number;
  remaining: number;
  progress: number;                              // 0-100
  highest_category: { category__name: string; total: number };
  category_split: CategorySplit[];
  monthly_trend: MonthlyTrend[];
  ai_insights: string[];
  recent_transactions: Transaction[];
}

/** One colored arc segment for the SVG donut/pie chart */
export interface PieSegment {
  color: string;
  dash: number;
  gap: number;
  offset: number;
}
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe, SlicePipe, NgClass],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})


export class DashboardComponent implements OnInit {

  private api    = inject(ApiService);
  private router = inject(Router);

  loading   = true;
  user: any = null;
  dashboard: DashboardData | null = null;
  pieSegments: PieSegment[] = [];

  // SVG pie-donut constants (r = 50 → circumference ≈ 314.16)
  private readonly PIE_R = 50;
  private readonly PIE_C = 2 * Math.PI * this.PIE_R;

  // SVG budget-donut constants (r = 55 → circumference ≈ 345.58)
  private readonly DONUT_R = 55;
  private readonly DONUT_C = 2 * Math.PI * this.DONUT_R;

  /** Color map – extend as your categories grow */
  private readonly COLOR_MAP: Record<string, string> = {
    travel:        '#4f8ef7',
    food:          '#10b981',
    shopping:      '#f59e0b',
    bills:         '#ec4899',
    others:        '#a78bfa',
    grocery:       '#10b981',
    entertainment: '#f97316',
    health:        '#06b6d4',
    education:     '#f472b6',
    rent:          '#8b5cf6',
    Maintenance : '#f43f5e'
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.api.getCurrentUser().subscribe({
      next:  (u) => (this.user = u),
      error: ()  => this.router.navigate(['/login']),
    });

    this.api.getDashboard().subscribe({
      next: (res: DashboardData) => {
        this.dashboard = res;
        this.buildPieSegments(res.category_split, res.total_expense);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  // ── Template helpers ───────────────────────────────────────────────────────

  /** Avatar initial letter */
  getInitial(): string {
    return this.user?.username?.charAt(0).toUpperCase() ?? 'U';
  }

  /** Returns the hex color for a given category name */
  getCategoryColor(name: string): string {
    return this.COLOR_MAP[name?.toLowerCase()] ?? '#64748b';
  }

  /** Percentage of total for a category value */
  getCategoryPercent(total: number): number {
    if (!this.dashboard?.total_expense) return 0;
    return Math.round((total / this.dashboard.total_expense) * 100);
  }

  /** Bar height as % of the tallest monthly value (5-90 range for aesthetics) */
  getBarHeight(total: number): number {
    const values = this.dashboard?.monthly_trend?.map((m) => m.total) ?? [1];
    const max    = Math.max(...values, 1);
    return Math.round((total / max) * 85) + 5;
  }

  /**
   * stroke-dasharray for the budget donut ring.
   * Returns "filled empty" based on dashboard.progress (0-100).
   */
  getDonutDash(): string {
    const pct    = (this.dashboard?.progress ?? 0) / 100;
    const filled = pct * this.DONUT_C;
    const empty  = this.DONUT_C - filled;
    return `${filled.toFixed(1)} ${empty.toFixed(1)}`;
  }

  // ── Action handlers ────────────────────────────────────────────────────────

  editTransaction(tx: Transaction): void {
    // TODO: open edit modal / navigate to edit route
    console.log('Edit:', tx);
  }

  deleteTransaction(tx: Transaction): void {
    if (!tx.id) return;
    if (!confirm(`Delete "${tx.title}"?`)) return;
    // TODO: this.api.deleteTransaction(tx.id).subscribe(() => this.ngOnInit());
    console.log('Delete:', tx);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Builds PieSegment[] for the SVG donut chart.
   * stroke-dasharray + stroke-dashoffset positions each arc correctly.
   */
  private buildPieSegments(categories: CategorySplit[], total: number): void {
    if (!categories?.length || !total) return;

    let accumulated = 0;

    this.pieSegments = categories.map((cat) => {
      const pct    = cat.total / total;
      const dash   = pct * this.PIE_C;
      const gap    = this.PIE_C - dash;
      const offset = -accumulated;
      accumulated += dash;

      return {
        color:  this.getCategoryColor(cat.category__name),
        dash:   parseFloat(dash.toFixed(2)),
        gap:    parseFloat(gap.toFixed(2)),
        offset: parseFloat(offset.toFixed(2)),
      };
    });
  }
}

