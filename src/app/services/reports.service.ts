import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  private API_URL = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getMonthlyReport(month: number, year: number): Observable<any> {
    return this.http.get(`${this.API_URL}/reports/monthly/?month=${month}&year=${year}`);
  }

  getBudgetSummary(month: number, year: number): Observable<any> {
    return this.http.get(`${this.API_URL}/budgets/summary/?month=${month}&year=${year}`);
  }
}