import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiInsightsService, AiInsightItem, AiInsightsResponse } from '../services/ai-insights.service';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-insights.html',
  styleUrls: ['./ai-insights.css'],
})

export class AiInsightsComponent implements OnInit, OnChanges {

  /** Pass from parent when the user changes month/year in the dashboard. */
  @Input() month?: number;
  @Input() year?: number;

  insights: AiInsightItem[] = [];
  loading = false;
  error = false;
  periodLabel = '';

  constructor(private aiService: AiInsightsService) {}

  ngOnInit(): void {
    this.loadInsights();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['month'] || changes['year']) {
      this.loadInsights();
    }
  }

  loadInsights(): void {
    this.loading = true;
    this.error   = false;

    this.aiService.getInsights(this.month, this.year).subscribe({
      next: (res: AiInsightsResponse) => {
        this.insights    = res.insights;
        this.periodLabel = this.buildLabel(res.month, res.year);
        this.loading     = false;
      },
      error: (err: unknown) => {
        console.error('AI Insights error:', err);
        this.loading = false;
        this.error   = true;
      },
    });
  }

  viewAllInsights(): void {
    // Wire to router: e.g. this.router.navigate(['/insights'])
  }

  private buildLabel(month: number, year: number): string {
    return new Date(year, month - 1, 1)
      .toLocaleString('default', { month: 'long', year: 'numeric' });
  }
}
