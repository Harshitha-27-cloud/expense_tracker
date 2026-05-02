import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly baseUrl = 'http://127.0.0.1:8000/api/';
  private expensesRequest$?: Observable<any>;
  private categoriesRequest$?: Observable<any>;
  private cachedExpenses: any[] = [];
  private cachedCategories: any[] = [];

  constructor(private http: HttpClient) {}

  getExpenses(forceRefresh = false): Observable<any[]> {
    if (!this.expensesRequest$ || forceRefresh) {
      this.expensesRequest$ = this.http
        .get(this.baseUrl + 'expenses/')
        .pipe(
          tap((expenses) => {
            this.cachedExpenses = Array.isArray(expenses) ? [...expenses] : [];
          }),
          shareReplay(1)
        );
    }

    return this.expensesRequest$;
  }

  getCategories(forceRefresh = false): Observable<any[]> {
    if (!this.categoriesRequest$ || forceRefresh) {
      this.categoriesRequest$ = this.http
        .get(this.baseUrl + 'categories/')
        .pipe(
          tap((categories) => {
            this.cachedCategories = Array.isArray(categories) ? [...categories] : [];
          }),
          shareReplay(1)
        );
    }

    return this.categoriesRequest$;
  }

  getCachedExpenses(): any[] {
    return [...this.cachedExpenses];
  }

  getCachedCategories(): any[] {
    return [...this.cachedCategories];
  }

  setCachedExpenses(expenses: any[]): void {
    this.cachedExpenses = [...expenses];
  }

  setCachedCategories(categories: any[]): void {
    this.cachedCategories = [...categories];
  }

  addExpense(data: any): Observable<any> {
    return this.http.post(this.baseUrl + 'expenses/', data).pipe(
      tap(() => this.clearExpensesCache())
    );
  }

  updateExpense(id: number, data: any): Observable<any> {
    return this.http.put(this.baseUrl + `expenses/${id}/`, data).pipe(
      tap(() => this.clearExpensesCache())
    );
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete(this.baseUrl + `expenses/${id}/`).pipe(
      tap(() => this.clearExpensesCache())
    );
  }

  clearExpensesCache(): void {
    this.expensesRequest$ = undefined;
  }

  clearCategoriesCache(): void {
    this.categoriesRequest$ = undefined;
  }
}
