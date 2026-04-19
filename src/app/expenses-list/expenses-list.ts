import { Component, OnInit } from '@angular/core';
import { ExpenseCategory, Expenses } from '../models/expenses';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type CategoryOption = {
  value: ExpenseCategory;
  icon: string;
  colorClass: string;
};

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type DateRangeFilter = 'all' | 'this-month' | 'last-month' | 'custom';
type SummaryItem = {
  label: string;
  total: number;
};
type CategorySummaryItem = SummaryItem & {
  category: ExpenseCategory;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'Food', icon: '🍽️', colorClass: 'bg-orange-100 text-orange-700' },
  { value: 'Transport', icon: '🚌', colorClass: 'bg-sky-100 text-sky-700' },
  { value: 'Housing', icon: '🏠', colorClass: 'bg-emerald-100 text-emerald-700' },
  { value: 'Entertainment', icon: '🎬', colorClass: 'bg-fuchsia-100 text-fuchsia-700' },
  { value: 'Health', icon: '💊', colorClass: 'bg-rose-100 text-rose-700' },
  { value: 'Other', icon: '🧾', colorClass: 'bg-slate-200 text-slate-700' },
];

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './expenses-list.html',
  styleUrls: ['./expenses-list.css'],
})
export class ExpancesListComponent implements OnInit {
  readonly categories = CATEGORY_OPTIONS;
  readonly allCategoriesValue = 'All';
  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'date-desc', label: 'Date: Newest first' },
    { value: 'date-asc', label: 'Date: Oldest first' },
    { value: 'amount-desc', label: 'Amount: High to low' },
    { value: 'amount-asc', label: 'Amount: Low to high' },
  ];
  readonly dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
    { value: 'all', label: 'All dates' },
    { value: 'this-month', label: 'This month' },
    { value: 'last-month', label: 'Last month' },
    { value: 'custom', label: 'Custom range' },
  ];
  newExpenseTitle: string = '';
  newExpenseAmount: number | null = null;
  newExpenseDate: string = '';
  newExpenseCategory: ExpenseCategory = 'Other';
  addExpenseErrors: string[] = [];

  editingExpenseId: number | null = null;
  editExpenseTitle: string = '';
  editExpenseAmount: number | null = null;
  editExpenseDate: string = '';
  editExpenseCategory: ExpenseCategory = 'Other';
  editExpenseErrors: string[] = [];

  selectedCategoryFilter: ExpenseCategory | 'All' = 'All';
  selectedSort: SortOption = 'date-desc';
  selectedDateRange: DateRangeFilter = 'all';
  customStartDate: string = '';
  customEndDate: string = '';
  searchQuery: string = '';
  expenses: Expenses[] = [];
  readonly maxDate = this.formatDateForInput(new Date());

  get filteredExpenses(): Expenses[] {
    return [...this.expenses]
      .filter((expense) => this.matchesSearch(expense))
      .filter((expense) => this.matchesCategory(expense))
      .filter((expense) => this.matchesDateRange(expense))
      .sort((left, right) => this.compareExpenses(left, right));
  }

  get visibleTotal(): number {
    return this.filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  get monthlyBreakdown(): SummaryItem[] {
    const totalsByMonth = new Map<string, { total: number; sortKey: number }>();

    for (const expense of this.filteredExpenses) {
      const monthStart = new Date(expense.date.getFullYear(), expense.date.getMonth(), 1);
      const label = expense.date.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
      const current = totalsByMonth.get(label);
      totalsByMonth.set(label, {
        total: (current?.total ?? 0) + expense.amount,
        sortKey: monthStart.getTime(),
      });
    }

    return [...totalsByMonth.entries()]
      .sort((left, right) => right[1].sortKey - left[1].sortKey)
      .map(([label, value]) => ({ label, total: value.total }));
  }

  get categoryTotals(): CategorySummaryItem[] {
    const totalsByCategory = new Map<ExpenseCategory, number>();

    for (const expense of this.filteredExpenses) {
      totalsByCategory.set(expense.category, (totalsByCategory.get(expense.category) ?? 0) + expense.amount);
    }

    return this.categories
      .map((category) => ({
        category: category.value,
        label: category.value,
        total: totalsByCategory.get(category.value) ?? 0,
      }))
      .filter((item) => item.total > 0);
  }

  get highestExpense(): Expenses | null {
    return this.filteredExpenses.reduce<Expenses | null>((highest, expense) => {
      if (!highest || expense.amount > highest.amount) {
        return expense;
      }

      return highest;
    }, null);
  }

  ngOnInit(): void {
    const savedExpenses = localStorage.getItem('expenses');
    const parsedExpenses = savedExpenses ? JSON.parse(savedExpenses) : [];

    this.expenses = parsedExpenses.map((expense: Expenses) => ({
      ...expense,
      date: new Date(expense.date),
      category: this.normalizeCategory(expense.category),
    }));
  }

  addExpense() {
    this.addExpenseErrors = this.validateExpense(
      this.newExpenseTitle,
      this.newExpenseAmount,
      this.newExpenseDate
    );

    if (this.addExpenseErrors.length) {
      return;
    }

    const newExpense: Expenses = {
      id: Date.now(),
      title: this.newExpenseTitle.trim(),
      amount: Number(this.newExpenseAmount),
      date: new Date(this.newExpenseDate),
      category: this.newExpenseCategory,
    };

    this.expenses.push(newExpense);
    this.newExpenseTitle = '';
    this.newExpenseAmount = null;
    this.newExpenseDate = '';
    this.newExpenseCategory = 'Other';
    this.addExpenseErrors = [];
    this.saveExpenses();
  }

  deleteExpense(expenseId: number) {
    if (expenseId === this.editingExpenseId) {
      this.cancelEdit();
    }

    this.expenses = this.expenses.filter((expense) => expense.id !== expenseId);
    this.saveExpenses();
  }

  startEdit(expense: Expenses) {
    this.editingExpenseId = expense.id;
    this.editExpenseTitle = expense.title;
    this.editExpenseAmount = expense.amount;
    this.editExpenseDate = this.formatDateForInput(expense.date);
    this.editExpenseCategory = expense.category;
    this.editExpenseErrors = [];
  }

  saveEdit(expenseId: number) {
    this.editExpenseErrors = this.validateExpense(
      this.editExpenseTitle,
      this.editExpenseAmount,
      this.editExpenseDate
    );

    if (this.editExpenseErrors.length) {
      return;
    }

    const expenseIndex = this.expenses.findIndex((expense) => expense.id === expenseId);

    if (expenseIndex === -1) {
      return;
    }

    const expense = this.expenses[expenseIndex];

    this.expenses[expenseIndex] = {
      ...expense,
      title: this.editExpenseTitle.trim(),
      amount: Number(this.editExpenseAmount),
      date: new Date(this.editExpenseDate),
      category: this.editExpenseCategory,
    };

    this.cancelEdit();
    this.saveExpenses();
  }

  cancelEdit() {
    this.editingExpenseId = null;
    this.editExpenseTitle = '';
    this.editExpenseAmount = null;
    this.editExpenseDate = '';
    this.editExpenseCategory = 'Other';
    this.editExpenseErrors = [];
  }

  getCategoryDetails(category: ExpenseCategory): CategoryOption {
    return this.categories.find((option) => option.value === category) ?? this.categories.at(-1)!;
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchQuery.trim().length > 0 ||
      this.selectedCategoryFilter !== this.allCategoriesValue ||
      this.selectedDateRange !== 'all'
    );
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategoryFilter = 'All';
    this.selectedDateRange = 'all';
    this.customStartDate = '';
    this.customEndDate = '';
    this.selectedSort = 'date-desc';
  }

  private validateExpense(title: string, amount: number | null, date: string): string[] {
    const errors: string[] = [];
    const trimmedTitle = title.trim();
    const numericAmount = Number(amount);

    if (!trimmedTitle) {
      errors.push('Title is required.');
    }

    if (amount === null || Number.isNaN(numericAmount)) {
      errors.push('Amount is required.');
    } else if (numericAmount <= 0) {
      errors.push('Amount must be greater than 0.');
    }

    if (!date) {
      errors.push('Date is required.');
    } else if (date > this.maxDate) {
      errors.push('Date cannot be in the future.');
    }

    return errors;
  }

  private saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(this.expenses));
  }

  private matchesSearch(expense: Expenses): boolean {
    const normalizedQuery = this.searchQuery.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return expense.title.toLocaleLowerCase().includes(normalizedQuery);
  }

  private matchesCategory(expense: Expenses): boolean {
    if (this.selectedCategoryFilter === this.allCategoriesValue) {
      return true;
    }

    return expense.category === this.selectedCategoryFilter;
  }

  private matchesDateRange(expense: Expenses): boolean {
    if (this.selectedDateRange === 'all') {
      return true;
    }

    const expenseTime = expense.date.getTime();
    const today = new Date();

    if (this.selectedDateRange === 'this-month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return expenseTime >= start && expenseTime <= end;
    }

    if (this.selectedDateRange === 'last-month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).getTime();
      return expenseTime >= start && expenseTime <= end;
    }

    const start = this.customStartDate ? new Date(this.customStartDate).getTime() : Number.NEGATIVE_INFINITY;
    const end = this.customEndDate
      ? new Date(this.customEndDate).setHours(23, 59, 59, 999)
      : Number.POSITIVE_INFINITY;

    return expenseTime >= start && expenseTime <= end;
  }

  private compareExpenses(left: Expenses, right: Expenses): number {
    switch (this.selectedSort) {
      case 'date-asc':
        return left.date.getTime() - right.date.getTime();
      case 'amount-desc':
        return right.amount - left.amount;
      case 'amount-asc':
        return left.amount - right.amount;
      case 'date-desc':
      default:
        return right.date.getTime() - left.date.getTime();
    }
  }

  private normalizeCategory(category: ExpenseCategory | undefined): ExpenseCategory {
    return this.categories.some((option) => option.value === category) ? category! : 'Other';
  }

  private formatDateForInput(date: Date): string {
    const normalizedDate = new Date(date);
    const year = normalizedDate.getFullYear();
    const month = `${normalizedDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${normalizedDate.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
