import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';

export interface Budget {
  id?: number;
  month: number;
  year: number;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = 'http://127.0.0.1:8000/api/budgets/';
  private budgetsRequest$?: Observable<Budget[]>;
  private monthlyExpenseRequests = new Map<string, Observable<any>>();
  private budgetSummaryRequests = new Map<string, Observable<any>>();
  private cachedBudgets: Budget[] = [];
  private cachedMonthlyExpenses = new Map<string, any[]>();
  private cachedBudgetSummaries = new Map<string, any>();

  constructor(private http: HttpClient) {}

  getBudgets(forceRefresh = false): Observable<Budget[]> {
    if (!this.budgetsRequest$ || forceRefresh) {
      this.budgetsRequest$ = this.http.get<Budget[]>(this.apiUrl).pipe(
        tap((budgets) => {
          this.cachedBudgets = Array.isArray(budgets) ? [...budgets] : [];
        }),
        shareReplay(1)
      );
    }

    return this.budgetsRequest$;
  }

  addBudget(data: Budget): Observable<any> {
    return this.http.post(this.apiUrl, data).pipe(
      tap(() => this.clearBudgetCache())
    );
  }

  getMonthlyExpenses(month: number, year: number, forceRefresh = false) {
    const cacheKey = `${month}-${year}`;

    if (!this.monthlyExpenseRequests.has(cacheKey) || forceRefresh) {
      this.monthlyExpenseRequests.set(
        cacheKey,
        this.http.get<any>(
          `http://127.0.0.1:8000/api/reports/monthly/?month=${month}&year=${year}`
        ).pipe(
          tap((expenses) => {
            this.cachedMonthlyExpenses.set(
              cacheKey,
              Array.isArray(expenses) ? [...expenses] : []
            );
          }),
          shareReplay(1)
        )
      );
    }

    return this.monthlyExpenseRequests.get(cacheKey) as Observable<any>;
  }

  getBudgetSummary(month: number, year: number, forceRefresh = false) {
    const cacheKey = `${month}-${year}`;

    if (!this.budgetSummaryRequests.has(cacheKey) || forceRefresh) {
      this.budgetSummaryRequests.set(
        cacheKey,
        this.http.get<any>(
          `http://127.0.0.1:8000/api/budgets/summary/?month=${month}&year=${year}`
        ).pipe(
          tap((summary) => {
            this.cachedBudgetSummaries.set(cacheKey, summary);
          }),
          shareReplay(1)
        )
      );
    }

    return this.budgetSummaryRequests.get(cacheKey) as Observable<any>;
  }

  getCachedBudgets(): Budget[] {
    return [...this.cachedBudgets];
  }

  getCachedMonthlyExpenses(month: number, year: number): any[] {
    return [...(this.cachedMonthlyExpenses.get(`${month}-${year}`) ?? [])];
  }

  getCachedBudgetSummary(month: number, year: number): any {
    return this.cachedBudgetSummaries.get(`${month}-${year}`) ?? null;
  }

  setCachedBudgets(budgets: Budget[]): void {
    this.cachedBudgets = [...budgets];
  }

  setCachedMonthlyExpenses(month: number, year: number, expenses: any[]): void {
    this.cachedMonthlyExpenses.set(`${month}-${year}`, [...expenses]);
  }

  setCachedBudgetSummary(month: number, year: number, summary: any): void {
    this.cachedBudgetSummaries.set(`${month}-${year}`, summary);
  }

  clearBudgetCache(): void {
    this.budgetsRequest$ = undefined;
    this.cachedBudgets = [];
    this.monthlyExpenseRequests.clear();
    this.cachedMonthlyExpenses.clear();
    this.budgetSummaryRequests.clear();
    this.cachedBudgetSummaries.clear();
  }
}
