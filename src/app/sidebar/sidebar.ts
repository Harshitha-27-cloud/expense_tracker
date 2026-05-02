import { CommonModule, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BudgetService } from '../services/budget.service';
import { CategoryService } from '../services/category.service';
import { ExpenseService } from '../services/expense.service';
import { SidebarItem, SidebarService } from '../services/sidebar.services';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgSwitch, NgSwitchCase, NgSwitchDefault],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class SidebarComponent implements OnInit {
  @Output() itemSelected = new EventEmitter<void>();

  menuItems: SidebarItem[] = [];
  isOpen = false;

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private categoryService: CategoryService,
    private expenseService: ExpenseService,
    private budgetService: BudgetService
  ) {}

  ngOnInit(): void {
    this.menuItems = this.sidebarService.getDefaultSidebar();
    this.loadSidebar();
  }

  loadSidebar(): void {
    this.sidebarService.getSidebar().subscribe({
      next: (data) => {
        this.menuItems = data?.length ? data : this.sidebarService.getDefaultSidebar();
      },
      error: (err) => console.error(err),
    });
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }

  closeSidebar(): void {
    this.isOpen = false;
  }

  onItemClick(item?: SidebarItem): void {
    this.prefetchRouteData(item?.route ?? '');
    this.closeSidebar();
    this.itemSelected.emit();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    this.closeSidebar();
    this.itemSelected.emit();
    void this.router.navigate(['/login']);
  }

  // Close sidebar on Escape key
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeSidebar();
  }

  private prefetchRouteData(route: string): void {
    if (route === '/categories') {
      this.categoryService.getCategories().subscribe({ next: () => {}, error: () => {} });
      return;
    }

    if (route === '/expenses') {
      this.expenseService.getCategories().subscribe({ next: () => {}, error: () => {} });
      this.expenseService.getExpenses().subscribe({ next: () => {}, error: () => {} });
      return;
    }

    if (route === '/budgets') {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      this.budgetService.getBudgets().subscribe({ next: () => {}, error: () => {} });
      this.budgetService.getMonthlyExpenses(month, year).subscribe({ next: () => {}, error: () => {} });
    }
  }
}
