import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = 'http://127.0.0.1:8000/api/';
  private currentUserRequest$?: Observable<any>;

  constructor(private http: HttpClient) {}

  login(data: { username: string; password: string }) {
    return this.http.post(this.baseUrl + 'token/', data);
  }

  register(data: {
    username: string; email: string;
    date_of_birth: string; contact_number: string; password: string;
  }) {
    return this.http.post(this.baseUrl + 'register/', data);
  }

  getExpenses() { return this.http.get(this.baseUrl + 'expenses/'); }
  addExpense(data: any) { return this.http.post(this.baseUrl + 'expenses/', data); }
  updateExpense(id: number, data: any) { return this.http.put(this.baseUrl + `expenses/${id}/`, data); }
  deleteExpense(id: number) { return this.http.delete(this.baseUrl + `expenses/${id}/`); }
  getCategories() { return this.http.get(this.baseUrl + 'categories/'); }
  addCategory(data: any) { return this.http.post(this.baseUrl + 'categories/', data); }
  updateCategory(id: number, data: any) { return this.http.put(this.baseUrl + `categories/${id}/`, data); }
  deleteCategory(id: number) { return this.http.delete(this.baseUrl + `categories/${id}/`); }
  getBudgets() { return this.http.get(this.baseUrl + 'budgets/'); }
  getCurrentUser(forceRefresh = false) {
    if (!this.currentUserRequest$ || forceRefresh) {
      this.currentUserRequest$ = this.http
        .get(this.baseUrl + 'current-user/')
        .pipe(shareReplay(1));
    }

    return this.currentUserRequest$;
  }

  clearCurrentUserCache(): void {
    this.currentUserRequest$ = undefined;
  }

  getDashboard(): Observable<any> {
  return this.http.get(this.baseUrl + 'dashboard/');
}

  getSidebarModules() { return this.http.get(this.baseUrl + 'sidebar/'); }
}
