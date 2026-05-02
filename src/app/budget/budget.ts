import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { BudgetService } from '../services/budget.service';

interface BudgetRecord {
  id?: number;
  month: number;
  year: number;
  amount: number;
}

interface BudgetSummary {
  budget_amount: number | string;
  spent: number | string;
  remaining: number | string;
  progress: number;
}

@Component({
  selector: 'app-budget',
  imports: [CommonModule, FormsModule],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
})
export class BudgetComponent implements OnInit {
  readonly currentDate = new Date();
  readonly months = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 }
  ];
  readonly years = Array.from(
    { length: 6 },
    (_, index) => this.currentDate.getFullYear() - 2 + index
  );

  selectedMonth = this.currentDate.getMonth() + 1;
  selectedYear = this.currentDate.getFullYear();

  budgetAmount = 0;
  budgetInput: number | null = null;
  spent = 0;
  remaining = 0;
  progress = 0;
  loading = false;
  saving = false;
  errorMsg = '';

  constructor(private budgetService: BudgetService) {}

  ngOnInit(): void {
    const cachedSummary = this.budgetService.getCachedBudgetSummary(this.selectedMonth, this.selectedYear);
    const cachedBudget = this.budgetService
      .getCachedBudgets()
      .find((item) => item.month === this.selectedMonth && item.year === this.selectedYear);

    if (cachedSummary || cachedBudget) {
      this.applySummary(cachedSummary, cachedBudget);
    }

    this.loadBudget();
  }

  loadBudget(forceRefresh = false): void {
    this.loading = this.budgetAmount === 0 && this.spent === 0;
    this.errorMsg = '';

    forkJoin({
      budgets: this.budgetService.getBudgets(forceRefresh),
      summary: this.budgetService.getBudgetSummary(this.selectedMonth, this.selectedYear, forceRefresh),
    }).subscribe({
      next: ({ budgets, summary }: { budgets: BudgetRecord[]; summary: BudgetSummary }) => {
        const budget = budgets.find(
          (item) => item.month === this.selectedMonth && item.year === this.selectedYear
        );

        this.applySummary(summary, budget);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Failed to load budget details.';
      }
    });
  }

  addBudget(): void {
    if (!this.budgetInput || this.budgetInput <= 0) {
      this.errorMsg = 'Enter a valid monthly budget amount.';
      return;
    }

    this.saving = true;
    this.errorMsg = '';

    this.budgetService.addBudget({
      month: this.selectedMonth,
      year: this.selectedYear,
      amount: this.budgetInput
    }).subscribe({
      next: (savedBudget: { id?: number; month: number; year: number; amount: number | string }) => {
        const normalizedBudget: BudgetRecord = {
          ...savedBudget,
          amount: Number(savedBudget.amount ?? 0),
        };
        const updatedBudgets = this.upsertBudget(normalizedBudget);
        this.budgetService.setCachedBudgets(updatedBudgets);
        this.saving = false;
        this.loadBudget(true);
      },
      error: () => {
        this.saving = false;
        this.errorMsg = 'Failed to save monthly budget.';
      }
    });
  }

  get monthLabel(): string {
    return this.months.find((month) => month.value === this.selectedMonth)?.name ?? '';
  }

  get displayedRemaining(): number {
    return this.remaining;
  }

  get overspentAmount(): number {
    return Math.max(this.spent - this.budgetAmount, 0);
  }

  private applySummary(summary: BudgetSummary | null, budget?: BudgetRecord): void {
    this.budgetAmount = Number(summary?.budget_amount ?? budget?.amount ?? 0);
    this.budgetInput = this.budgetAmount || null;
    this.spent = Number(summary?.spent ?? 0);
    this.remaining = Number(summary?.remaining ?? (this.budgetAmount - this.spent));
    this.progress = this.budgetAmount > 0
      ? Math.max(Math.min((this.remaining / this.budgetAmount) * 100, 100), 0)
      : 0;
  }

  private upsertBudget(savedBudget: BudgetRecord): BudgetRecord[] {
    const budgets = this.budgetService.getCachedBudgets();
    const existingIndex = budgets.findIndex(
      (budget) => budget.month === savedBudget.month && budget.year === savedBudget.year
    );

    if (existingIndex >= 0) {
      budgets[existingIndex] = savedBudget;
      return budgets;
    }

    return [...budgets, savedBudget];
  }
}
