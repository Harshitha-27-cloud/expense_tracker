import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BudgetAlertResponse {
  show: boolean;
  type?: 'exceeded';
  spent?: number;
  budget?: number;
}

export interface BudgetSummaryResponse {
  month: number;
  year: number;
  budget_amount: number;
  spent: number;
  remaining: number;
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetAlertService {
  private apiBase = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getBudgetAlert(): Observable<BudgetAlertResponse> {
    return this.http.get<BudgetAlertResponse>(`${this.apiBase}/budget-alert/`, {
      headers: this.getHeaders()
    });
  }

  getBudgetSummary(month: number, year: number): Observable<BudgetSummaryResponse> {
    return this.http.get<BudgetSummaryResponse>(
      `${this.apiBase}/budget-summary/?month=${month}&year=${year}`,
      { headers: this.getHeaders() }
    );
  }
}
