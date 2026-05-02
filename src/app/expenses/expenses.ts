import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ExpenseService } from '../services/expense.service';

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: number | null;
  category_name?: string;
  date: string;
  description: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  templateUrl: './expenses.html',
  imports: [CommonModule, FormsModule, DatePipe],
  styleUrls: ['./expenses.scss']
})
export class ExpenseComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);

  expenses: Expense[]          = [];
  categories: CategoryOption[] = [];
  loading      = false;
  errorMsg     = '';
  isEditing    = false;
  editingId: number | null = null;
  showModal    = false;
  searchQuery  = '';
  activeFilter = 'All';
  dateFrom     = '';
  dateTo       = '';
  today        = new Date();
  filterTabs   = ['All'];
  formData: Partial<Expense> = this.blankForm();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const cachedCategories = this.expenseService.getCachedCategories();
    if (cachedCategories.length) {
      this.categories = cachedCategories;
      this.filterTabs = ['All', ...cachedCategories.map((c: CategoryOption) => c.name)];
    }

    const cachedExpenses = this.expenseService.getCachedExpenses();
    if (cachedExpenses.length) {
      this.expenses = cachedExpenses;
    }

    this.loadCategories();
    this.getExpenses();
  }

  // ── Data ────────────────────────────────────────────────────────────────────

  getExpenses(): void {
    this.loading = this.expenses.length === 0;
    this.expenseService.getExpenses().subscribe({
      next: (res: any) => { this.expenses = res; this.loading = false; },
      error: () => { this.loading = false; this.errorMsg = 'Failed to load expenses.'; }
    });
  }

  loadCategories(forceRefresh = false): void {
    this.expenseService.getCategories(forceRefresh).subscribe({
      next: (res: any) => {
        this.categories = res;
        this.filterTabs = ['All', ...res.map((c: CategoryOption) => c.name)];
      },
      error: () => { this.categories = []; this.filterTabs = ['All']; }
    });
  }

  // ── Modal ───────────────────────────────────────────────────────────────────

  openAddModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.errorMsg  = '';
    this.formData  = this.blankForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.cancelEdit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  addExpense(): void {
    if (!this.formData.title?.trim() || !this.formData.amount) {
      this.errorMsg = 'Title and amount are required.';
      return;
    }
    this.errorMsg = '';
    this.expenseService.addExpense(this.formData).subscribe({
      next: (createdExpense: Expense) => {
        const expense = this.decorateExpense(createdExpense);
        this.expenses = [expense, ...this.expenses];
        this.expenseService.setCachedExpenses(this.expenses);
        this.closeModal();
      },
      error: () => { this.errorMsg = 'Failed to add expense.'; }
    });
  }

  startEdit(expense: Expense): void {
    this.isEditing = true;
    this.editingId = expense.id;
    this.formData  = { ...expense };
    this.errorMsg  = '';
    this.showModal = true;
  }

  updateExpense(): void {
    if (!this.editingId || !this.formData.title?.trim()) {
      this.errorMsg = 'Title is required.';
      return;
    }
    this.errorMsg = '';
    this.expenseService.updateExpense(this.editingId, this.formData).subscribe({
      next: (updatedExpense: Expense) => {
        const expense = this.decorateExpense(updatedExpense);
        this.expenses = this.expenses.map((item) =>
          item.id === this.editingId ? expense : item
        );
        this.expenseService.setCachedExpenses(this.expenses);
        this.closeModal();
      },
      error: () => { this.errorMsg = 'Failed to update expense.'; }
    });
  }

  deleteExpense(id: number): void {
    if (!confirm('Delete this expense?')) return;
    this.expenseService.deleteExpense(id).subscribe({
      next: () => {
        this.expenses = this.expenses.filter((expense) => expense.id !== id);
        this.expenseService.setCachedExpenses(this.expenses);
        if (this.editingId === id) this.closeModal();
      },
      error: () => { this.errorMsg = 'Failed to delete expense.'; }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingId = null;
    this.errorMsg  = '';
    this.resetForm();
  }

  // ── Filters ─────────────────────────────────────────────────────────────────

  setFilter(tab: string): void {
    this.activeFilter = tab;
  }

  applyDateFilter(): void { /* triggers displayedExpenses() via change detection */ }

  resetFilters(): void {
    this.activeFilter = 'All';
    this.dateFrom     = '';
    this.dateTo       = '';
    this.searchQuery  = '';
  }

  displayedExpenses(): Expense[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.expenses.filter(expense => {
      const matchCat =
        this.activeFilter === 'All' ||
        (expense.category_name ?? '').toLowerCase() === this.activeFilter.toLowerCase();

      const matchDate =
        (!this.dateFrom || expense.date >= this.dateFrom) &&
        (!this.dateTo   || expense.date <= this.dateTo);

      const matchQ =
        !q ||
        (expense.title        ?? '').toLowerCase().includes(q) ||
        (expense.category_name ?? '').toLowerCase().includes(q) ||
        (expense.description  ?? '').toLowerCase().includes(q);

      return matchCat && matchDate && matchQ;
    });
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  getTotalAmount(): number {
    return this.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  }

  getMonthAmount(): number {
    const now = new Date();
    return this.expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);
  }

  getUniqueCategoryCount(): number {
    return new Set(this.expenses.map(e => e.category_name).filter(Boolean)).size;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  getCategoryClass(cat: string): string {
    const map: Record<string, string> = {
      food:      'food',
      travel:    'travel',
      shopping:  'shopping',
      utilities: 'utility',
      bills:     'bills',
      other:     'other'
    };
    return map[(cat ?? '').toLowerCase()] ?? 'other';
  }

  private blankForm(): Partial<Expense> {
    return { title: '', amount: undefined, category: null, date: '', description: '' };
  }

  private decorateExpense(expense: Expense): Expense {
    if (expense.category_name) {
      return expense;
    }

    const categoryName = this.categories.find((category) => category.id === expense.category)?.name;
    return {
      ...expense,
      category_name: categoryName ?? expense.category_name,
    };
  }

  private resetForm(): void {
    this.formData = this.blankForm();
  }
}
