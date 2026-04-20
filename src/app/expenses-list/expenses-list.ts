import { Component, OnInit } from '@angular/core';
import { ExpenseCategory, Expenses } from '../models/expenses';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MOCK_EXPENSES } from '../mock-expenses';

type CategoryOption = {
  value: ExpenseCategory;
  icon: string;
  colorClass: string;
  chartColor: string;
};

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type DateRangeFilter = 'all' | 'this-month' | 'last-month' | 'custom';
type CurrencyCode = 'EUR' | 'USD' | 'GBP';
type SummaryItem = {
  label: string;
  total: number;
};
type CategorySummaryItem = SummaryItem & {
  category: ExpenseCategory;
};
type ChartItem = CategorySummaryItem & {
  percentage: number;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: 'Food',
    icon: '🍽️',
    colorClass: 'bg-[#edf2fb] text-[#243865]',
    chartColor: '#dce4f3',
  },
  {
    value: 'Transport',
    icon: '🚌',
    colorClass: 'bg-[#dce4f3] text-[#243865]',
    chartColor: '#bcc9e3',
  },
  {
    value: 'Housing',
    icon: '🏠',
    colorClass: 'bg-[#bcc9e3] text-[#22345d]',
    chartColor: '#9aadd3',
  },
  {
    value: 'Entertainment',
    icon: '🎬',
    colorClass: 'bg-[#9aadd3] text-[#203154]',
    chartColor: '#6f88bb',
  },
  {
    value: 'Health',
    icon: '💊',
    colorClass: 'bg-[#6f88bb] text-[#f7faff]',
    chartColor: '#4b659d',
  },
  {
    value: 'Other',
    icon: '🧾',
    colorClass: 'bg-[#314472] text-[#f7faff]',
    chartColor: '#243865',
  },
];

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './expenses-list.html',
})
export class ExpancesListComponent implements OnInit {
  readonly categories = CATEGORY_OPTIONS;
  readonly allCategoriesValue = 'All';
  readonly storageKeys = {
    expenses: 'expenses',
    currency: 'expenseCurrency',
  } as const;
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
  readonly currencyOptions: { value: CurrencyCode; label: string }[] = [
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
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
  selectedCurrency: CurrencyCode = 'EUR';
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

  get categoryChartData(): ChartItem[] {
    return this.categoryTotals.map((item) => ({
      ...item,
      percentage: this.visibleTotal ? (item.total / this.visibleTotal) * 100 : 0,
    }));
  }

  ngOnInit(): void {
    const savedExpenses = this.readStoredExpenses();
    const savedCurrency = this.readStorageValue(this.storageKeys.currency);

    this.expenses = savedExpenses ?? this.getInitialExpenses();
    this.selectedCurrency = this.normalizeCurrency(savedCurrency);

    if (!savedExpenses) {
      this.saveExpenses();
    }
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

  saveCurrencyPreference() {
    this.writeStorageValue(this.storageKeys.currency, this.selectedCurrency);
  }

  exportVisibleExpensesToCsv() {
    const header = ['Title', 'Amount', 'Currency', 'Date', 'Category'];
    const rows = this.filteredExpenses.map((expense) => [
      expense.title,
      expense.amount.toFixed(2),
      this.selectedCurrency,
      this.formatDateForInput(expense.date),
      expense.category,
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `expenses-${this.formatDateForInput(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
    this.writeStorageValue(this.storageKeys.expenses, JSON.stringify(this.expenses));
  }

  private readStoredExpenses(): Expenses[] | null {
    const rawExpenses = this.readStorageValue(this.storageKeys.expenses);

    if (!rawExpenses) {
      return null;
    }

    try {
      const parsedExpenses = JSON.parse(rawExpenses);

      if (!Array.isArray(parsedExpenses)) {
        return null;
      }

      const sanitizedExpenses = parsedExpenses
        .map((expense) => this.sanitizeExpense(expense))
        .filter((expense): expense is Expenses => expense !== null);

      return sanitizedExpenses.length ? sanitizedExpenses : null;
    } catch (error) {
      console.error('Failed to read saved expenses from storage:', error);
      return null;
    }
  }

  private sanitizeExpense(expense: unknown): Expenses | null {
    if (!expense || typeof expense !== 'object') {
      return null;
    }

    const candidate = expense as Partial<Expenses> & { date?: string | Date };
    const normalizedTitle = typeof candidate.title === 'string' ? candidate.title.trim() : '';
    const normalizedAmount = Number(candidate.amount);
    const normalizedDate = new Date(candidate.date ?? '');

    if (!normalizedTitle || Number.isNaN(normalizedAmount) || normalizedAmount <= 0) {
      return null;
    }

    if (Number.isNaN(normalizedDate.getTime())) {
      return null;
    }

    return {
      id: typeof candidate.id === 'number' ? candidate.id : Date.now() + Math.floor(Math.random() * 1000),
      title: normalizedTitle,
      amount: normalizedAmount,
      date: normalizedDate,
      category: this.normalizeCategory(candidate.category),
    };
  }

  private readStorageValue(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to read "${key}" from storage:`, error);
      return null;
    }
  }

  private writeStorageValue(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to write "${key}" to storage:`, error);
    }
  }

  private getInitialExpenses(): Expenses[] {
    return MOCK_EXPENSES.map((expense) => ({
      ...expense,
      date: new Date(expense.date),
    }));
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

  private normalizeCurrency(currency: string | null): CurrencyCode {
    return this.currencyOptions.some((option) => option.value === currency)
      ? (currency as CurrencyCode)
      : 'EUR';
  }

  private escapeCsvValue(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
  }

  private formatCurrency(value: number, digits = 2): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.selectedCurrency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  private formatDateForInput(date: Date): string {
    const normalizedDate = new Date(date);
    const year = normalizedDate.getFullYear();
    const month = `${normalizedDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${normalizedDate.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
