import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CategoryService } from '../services/category.service';

interface CategoryItem {
  id: number;
  name: string;
  user?: number;
}

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category.html',
  styleUrls: ['./category.css']
})
export class CategoryComponent implements OnInit {
  categories: CategoryItem[] = [];
  categoryName = '';
  editMode = false;
  editingId: number | null = null;
  errorMsg = '';
  showModal = false;
  loading = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const cachedCategories = this.categoryService.getCachedCategories();
    if (cachedCategories.length) {
      this.categories = cachedCategories;
    }

    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = this.categories.length === 0;

    this.categoryService.getCategories().subscribe({
      next: (res: CategoryItem[]) => {
        this.categories = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.errorMsg = 'Failed to load categories';
        this.loading = false;
      }
    });
  }

  openModal(): void {
    this.resetForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  saveCategory(): void {
    if (!this.categoryName.trim()) {
      this.errorMsg = 'Category name is required';
      return;
    }

    this.errorMsg = '';
    this.loading = true;

    const payload = { name: this.categoryName.trim() };

    if (this.editMode && this.editingId !== null) {
      this.categoryService.updateCategory(this.editingId, payload).subscribe({
        next: (updatedCategory: CategoryItem) => {
          this.categories = this.categories.map((category) =>
            category.id === this.editingId ? updatedCategory : category
          );
          this.categoryService.setCachedCategories(this.categories);
          this.finishSave('Category updated successfully');
        },
        error: (err) => {
          console.error('Update error:', err);
          this.errorMsg = 'Failed to update category';
          this.showToast(this.errorMsg, 'error');
          this.loading = false;
        }
      });
      return;
    }

    this.categoryService.addCategory(payload).subscribe({
      next: (createdCategory: CategoryItem) => {
        this.categories = [...this.categories, createdCategory];
        this.categoryService.setCachedCategories(this.categories);
        this.finishSave('Category added successfully');
      },
      error: (err) => {
        console.error('Add error:', err);
        this.errorMsg = 'Failed to save category';
        this.showToast(this.errorMsg, 'error');
        this.loading = false;
      }
    });
  }

  editCategory(cat: CategoryItem): void {
    this.categoryName = cat.name;
    this.editMode = true;
    this.editingId = cat.id;
    this.errorMsg = '';
    this.showModal = true;
  }

  deleteCategory(id: number): void {
    if (!confirm('Delete this category?')) {
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter((category) => category.id !== id);
        this.categoryService.setCachedCategories(this.categories);
        this.showToast('Category deleted successfully', 'success');
        this.loading = false;
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.errorMsg = 'Failed to delete category';
        this.showToast(this.errorMsg, 'error');
        this.loading = false;
      }
    });
  }

  trackByCategoryId(index: number, category: CategoryItem): number {
    return category.id;
  }

  closeToast(): void {
    this.toastMessage = '';
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  private finishSave(message: string): void {
    this.showToast(message, 'success');
    this.loading = false;
    this.showModal = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.categoryName = '';
    this.editMode = false;
    this.editingId = null;
    this.errorMsg = '';
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastType = type;
    this.toastMessage = message;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimer = null;
    }, 2500);
  }
}
