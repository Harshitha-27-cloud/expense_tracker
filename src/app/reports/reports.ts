import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../services/reports.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common'; // ✅ ADD THIS
@Component({
  selector: 'app-reports',
  imports: [FormsModule, CommonModule, DecimalPipe], // ✅ IMPORTANT
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class ReportsComponent implements OnInit {
 
  month = new Date().getMonth() + 1;
  year  = new Date().getFullYear();
 
  months = [
    { value: 1,  label: 'January'   },
    { value: 2,  label: 'February'  },
    { value: 3,  label: 'March'     },
    { value: 4,  label: 'April'     },
    { value: 5,  label: 'May'       },
    { value: 6,  label: 'June'      },
    { value: 7,  label: 'July'      },
    { value: 8,  label: 'August'    },
    { value: 9,  label: 'September' },
    { value: 10, label: 'October'   },
    { value: 11, label: 'November'  },
    { value: 12, label: 'December'  },
  ];
 
  years = [2023, 2024, 2025,2026,2027];
 
  colors = ['#60a5fa', '#f59e0b', '#34d399', '#f87171', '#a78bfa'];
 
  reportData: any[]  = [];
  budgetSummary: any = null;
  private chartInst: any;

  constructor(private reportService: ReportsService) {}

  ngOnInit(): void {
    this.loadReport();
  }

  ngOnDestroy(): void {
    if (this.chartInst) {
      this.chartInst.destroy();
      this.chartInst = null;
    }
  }

  loadReport(): void {
    // Destroy existing chart immediately on new load
    if (this.chartInst) {
      this.chartInst.destroy();
      this.chartInst = null;
    }
    this.reportData = [];
    this.budgetSummary = null;

    this.reportService.getMonthlyReport(this.month, this.year)
      .subscribe({
        next: (res: any[]) => {
          this.reportData = res;
          setTimeout(() => this.renderChart(), 100); // slight delay ensures DOM updates
        },
        error: (err: any) => {
          console.error('Failed to load report data', err);
          this.reportData = [];
        }
      });

    this.reportService.getBudgetSummary(this.month, this.year)
      .subscribe({
        next: (res: any) => {
          this.budgetSummary = res;
        },
        error: (err: any) => {
          console.error('Failed to load budget summary', err);
          this.budgetSummary = null;
        }
      });
  }

  private renderChart(): void {
    const ctx = document.getElementById('reportChart') as HTMLCanvasElement;
    if (!ctx || !this.reportData.length) return;

    if (this.chartInst) {
      this.chartInst.destroy();
      this.chartInst = null;
    }

    const ChartJS = (window as any).Chart;
    if (!ChartJS) {
      console.warn('Chart.js not loaded');
      return;
    }

    const labels = this.reportData.map(r => r.category__name);
    const data   = this.reportData.map(r => r.total);
    const bgColors = this.reportData.map((_, i) => this.colors[i % this.colors.length]);

    this.chartInst = new ChartJS(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderColor:     '#1f2937',
          borderWidth:     2,
          hoverOffset:     6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color:     '#9ca3af',
              font:      { size: 12 },
              padding:   14,
              boxWidth:  12,
              boxHeight: 12,
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const pct   = ((value / total) * 100).toFixed(1);
                return ` ₹${value.toLocaleString('en-IN')}  (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
}