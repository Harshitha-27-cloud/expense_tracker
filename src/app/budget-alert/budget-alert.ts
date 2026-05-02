import { Component, OnInit } from '@angular/core';
import { BudgetAlertService, BudgetAlertResponse, BudgetSummaryResponse } from '../services/budget-alert.service';
@Component({
  selector: 'app-budget-alert',
  imports: [],
  templateUrl: './budget-alert.html',
  styleUrl: './budget-alert.css',
})
export class BudgetAlertComponent implements OnInit {

  alertData: BudgetAlertResponse | null = null;
  summaryData: BudgetSummaryResponse | null = null;

  showAlert = false;
  showDetails = false;
  isLoading = true;
  error: string | null = null;

  today = new Date();

  constructor(private budgetAlertService: BudgetAlertService) {}

  ngOnInit(): void {
    this.loadAlert();
  }

  loadAlert(): void {
    this.isLoading = true;

    this.budgetAlertService.getBudgetAlert().subscribe({
      next: (data: BudgetAlertResponse) => {
        this.alertData = data;
        this.showAlert = data.show;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load budget alert:', err);
        this.error = 'Unable to load budget alert.';
        this.isLoading = false;
      }
    });
  }

  onViewDetails(): void {
    this.showDetails = true;

    const month = this.today.getMonth() + 1;
    const year = this.today.getFullYear();

    this.budgetAlertService.getBudgetSummary(month, year).subscribe({
      next: (data: BudgetSummaryResponse) => {
        this.summaryData = data;
      },
      error: (err: any) => {
        console.error('Failed to load budget summary:', err);
      }
    });
  }

  onCloseDetails(): void {
    this.showDetails = false;
  }

  onDismissAlert(): void {
    this.showAlert = false;
  }

  get overBudgetAmount(): number {
    if (!this.alertData?.spent || !this.alertData?.budget) return 0;
    return this.alertData.spent - this.alertData.budget;
  }

  get progressPercent(): number {
    if (!this.summaryData) return 0;
    return Math.min(this.summaryData.progress, 100);
  }

  get progressColor(): string {
    const p = this.progressPercent;
    if (p >= 100) return '#ff3b3b';
    if (p >= 80) return '#ff8c00';
    return '#00d68f';
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return '₹0';
    return '₹' + value.toLocaleString('en-IN');
  }
}