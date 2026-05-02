import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://127.0.0.1:8000/api/categories/';
  private categoriesRequest$?: Observable<any>;
  private cachedCategories: any[] = [];

  constructor(private http: HttpClient) {}

  getCategories(forceRefresh = false): Observable<any> {
    if (!this.categoriesRequest$ || forceRefresh) {
      this.categoriesRequest$ = this.http
        .get(this.apiUrl)
        .pipe(
          tap((categories) => {
            this.cachedCategories = Array.isArray(categories) ? [...categories] : [];
          }),
          shareReplay(1)
        );
    }

    return this.categoriesRequest$;
  }

  getCachedCategories(): any[] {
    return [...this.cachedCategories];
  }

  setCachedCategories(categories: any[]): void {
    this.cachedCategories = [...categories];
  }

  addCategory(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data).pipe(
      tap(() => this.clearCategoriesCache())
    );
  }

  updateCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}${id}/`, data).pipe(
      tap(() => this.clearCategoriesCache())
    );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`).pipe(
      tap(() => this.clearCategoriesCache())
    );
  }

  clearCategoriesCache(): void {
    this.categoriesRequest$ = undefined;
  }
}
