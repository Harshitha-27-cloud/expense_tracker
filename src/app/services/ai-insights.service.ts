import { Injectable } from '@angular/core';
import { HttpClient , HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiInsightItem {
  type: string;
  title: string;
  text: string;
  icon: string;
  tone: string;
}
export interface AiInsightsResponse {
  insights: AiInsightItem[];
  month: number;   // ✅ added
  year: number;    // ✅ added
}
export interface AiInsightsResponse {
  insights: AiInsightItem[];
}

@Injectable({
  providedIn: 'root'
})
export class AiInsightsService {

  private apiUrl = 'http://127.0.0.1:8000/api/ai/insights/';

   constructor(private http: HttpClient) {}

  getInsights(month?: number, year?: number): Observable<AiInsightsResponse> {
    let params = new HttpParams();

    if (month && year) {
      params = params
        .set('month', month.toString())
        .set('year', year.toString());
    }

    return this.http.get<AiInsightsResponse>(this.apiUrl, { params });
  }
}