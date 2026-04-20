import { Injectable, computed, signal } from '@angular/core';
import { Expense, ExpenseCategory } from './models/expenses';
import { MOCK_EXPENSES } from './mock-expenses';

export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
export type DateRangeFilter = 'all' | 'this-month' | 'last-month' | 'custom';
export type CurrencyCode = 'EUR' | 'USD' | 'GBP';

export type CategoryOption = {
  value: ExpenseCategory;
  icon: string;
  colorClass: string;
  chartColor: string;
};

export type SummaryItem = { label: string; total: number };
export type CategorySummaryItem = SummaryItem & { category: ExpenseCategory };
export type ChartItem = CategorySummaryItem & { percentage: number };

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'Food', icon: '🍽️', colorClass: 'bg-[#edf2fb] text-[#243865]', chartColor: '#dce4f3' },
  { value: 'Transport', icon: '🚌', colorClass: 'bg-[#dce4f3] text-[#243865]', chartColor: '#bcc9e3' },
  { value: 'Housing', icon: '🏠', colorClass: 'bg-[#bcc9e3] text-[#22345d]', chartColor: '#9aadd3' },
  { value: 'Entertainment', icon: '🎬', colorClass: 'bg-[#9aadd3] text-[#203154]', chartColor: '#6f88bb' },
  { value: 'Health', icon: '💊', colorClass: 'bg-[#6f88bb] text-[#f7faff]', chartColor: '#4b659d' },
  { value: 'Other', icon: '🧾', colorClass: 'bg-[#314472] text-[#f7faff]', chartColor: '#243865' },
];

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly seedVersion = '2026-04-20-v6';
  private readonly storageKeys = {
    expenses: 'expenses',
    currency: 'expenseCurrency',
    seedVersion: 'expenseSeedVersion',
  } as const;

  readonly categories = CATEGORY_OPTIONS;
  readonly categoryIcons: Record<ExpenseCategory, string> = Object.fromEntries(
    CATEGORY_OPTIONS.map((o) => [o.value, o.icon]),
  ) as Record<ExpenseCategory, string>;
  readonly allCategoriesValue = 'All' as const;
  readonly maxDate = this.formatDateForInput(new Date());

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

  // State signals
  readonly expenses = signal<Expense[]>([]);
  readonly searchQuery = signal('');
  readonly selectedCategoryFilter = signal<ExpenseCategory | 'All'>('All');
  readonly selectedSort = signal<SortOption>('date-desc');
  readonly selectedDateRange = signal<DateRangeFilter>('all');
  readonly customStartDate = signal('');
  readonly customEndDate = signal('');
  readonly selectedCurrency = signal<CurrencyCode>('EUR');

  // Computed
  readonly filteredExpenses = computed(() =>
    [...this.expenses()]
      .filter((e) => this.matchesSearch(e))
      .filter((e) => this.matchesCategory(e))
      .filter((e) => this.matchesDateRange(e))
      .sort((a, b) => this.compareExpenses(a, b)),
  );

  readonly visibleTotal = computed(() =>
    this.filteredExpenses().reduce((sum, e) => sum + e.amount, 0),
  );

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.selectedCategoryFilter() !== this.allCategoriesValue ||
      this.selectedDateRange() !== 'all',
  );

  readonly monthlyBreakdown = computed((): SummaryItem[] => {
    const totals = new Map<string, { total: number; sortKey: number }>();
    for (const expense of this.filteredExpenses()) {
      const monthStart = new Date(expense.date.getFullYear(), expense.date.getMonth(), 1);
      const label = expense.date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const current = totals.get(label);
      totals.set(label, {
        total: (current?.total ?? 0) + expense.amount,
        sortKey: monthStart.getTime(),
      });
    }
    return [...totals.entries()]
      .sort((a, b) => b[1].sortKey - a[1].sortKey)
      .map(([label, value]) => ({ label, total: value.total }));
  });

  readonly categoryTotals = computed((): CategorySummaryItem[] => {
    const totals = new Map<ExpenseCategory, number>();
    for (const expense of this.filteredExpenses()) {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
    }
    return this.categories
      .map((cat) => ({ category: cat.value, label: cat.value, total: totals.get(cat.value) ?? 0 }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);
  });

  readonly highestExpense = computed((): Expense | null =>
    this.filteredExpenses().reduce<Expense | null>((highest, expense) => {
      if (!highest || expense.amount > highest.amount) return expense;
      return highest;
    }, null),
  );

  readonly highestExpenseCategoryIcon = computed((): string => {
    const highest = this.highestExpense();
    return highest ? (this.categoryIcons[highest.category] ?? '') : '';
  });

  readonly categoryChartData = computed((): ChartItem[] =>
    this.categoryTotals().map((item) => ({
      ...item,
      percentage: this.visibleTotal() ? (item.total / this.visibleTotal()) * 100 : 0,
    })),
  );

  init(): void {
    const savedSeedVersion = this.readStorageValue(this.storageKeys.seedVersion);
    const shouldReseed = savedSeedVersion !== this.seedVersion;
    const savedExpenses = shouldReseed ? null : this.readStoredExpenses();
    const savedCurrency = this.readStorageValue(this.storageKeys.currency);

    this.expenses.set(savedExpenses ?? this.getInitialExpenses());
    this.selectedCurrency.set(this.normalizeCurrency(savedCurrency));

    if (!savedExpenses || shouldReseed) {
      this.persistExpenses();
      this.writeStorageValue(this.storageKeys.seedVersion, this.seedVersion);
    }
  }

  validate(title: string, amount: number | null, date: string): string[] {
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

  addExpense(title: string, amount: number | null, date: string, category: ExpenseCategory): void {
    this.expenses.update((list) => [
      ...list,
      {
        id: Date.now(),
        title: title.trim(),
        amount: Number(amount),
        date: new Date(date),
        category,
      },
    ]);
    this.persistExpenses();
  }

  deleteExpense(id: number): void {
    this.expenses.update((list) => list.filter((e) => e.id !== id));
    this.persistExpenses();
  }

  saveEdit(
    id: number,
    title: string,
    amount: number | null,
    date: string,
    category: ExpenseCategory,
  ): void {
    this.expenses.update((list) =>
      list.map((e) =>
        e.id === id
          ? { ...e, title: title.trim(), amount: Number(amount), date: new Date(date), category }
          : e,
      ),
    );
    this.persistExpenses();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategoryFilter.set('All');
    this.selectedDateRange.set('all');
    this.customStartDate.set('');
    this.customEndDate.set('');
    this.selectedSort.set('date-desc');
  }

  saveCurrencyPreference(): void {
    this.writeStorageValue(this.storageKeys.currency, this.selectedCurrency());
  }

  exportCsv(): void {
    const header = ['Title', 'Amount', 'Currency', 'Date', 'Category'];
    const rows = this.filteredExpenses().map((expense) => [
      expense.title,
      expense.amount.toFixed(2),
      this.selectedCurrency(),
      this.formatDateForInput(expense.date),
      expense.category,
    ]);
    const csvContent = [header, ...rows]
      .map((row) => row.map((v) => this.escapeCsvValue(v)).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${this.formatDateForInput(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private matchesSearch(expense: Expense): boolean {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return !query || expense.title.toLocaleLowerCase().includes(query);
  }

  private matchesCategory(expense: Expense): boolean {
    const filter = this.selectedCategoryFilter();
    return filter === this.allCategoriesValue || expense.category === filter;
  }

  private matchesDateRange(expense: Expense): boolean {
    const range = this.selectedDateRange();
    if (range === 'all') return true;

    const expenseTime = expense.date.getTime();
    const today = new Date();

    if (range === 'this-month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return expenseTime >= start && expenseTime <= end;
    }

    if (range === 'last-month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).getTime();
      return expenseTime >= start && expenseTime <= end;
    }

    const start = this.customStartDate()
      ? new Date(this.customStartDate()).getTime()
      : Number.NEGATIVE_INFINITY;
    const end = this.customEndDate()
      ? new Date(this.customEndDate()).setHours(23, 59, 59, 999)
      : Number.POSITIVE_INFINITY;
    return expenseTime >= start && expenseTime <= end;
  }

  private compareExpenses(a: Expense, b: Expense): number {
    switch (this.selectedSort()) {
      case 'date-asc':
        return a.date.getTime() - b.date.getTime();
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      default:
        return b.date.getTime() - a.date.getTime();
    }
  }

  private persistExpenses(): void {
    this.writeStorageValue(this.storageKeys.expenses, JSON.stringify(this.expenses()));
  }

  private readStoredExpenses(): Expense[] | null {
    const raw = this.readStorageValue(this.storageKeys.expenses);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      const sanitized = parsed
        .map((e: unknown) => this.sanitizeExpense(e))
        .filter((e): e is Expense => e !== null);
      return sanitized.length ? sanitized : null;
    } catch {
      return null;
    }
  }

  private sanitizeExpense(expense: unknown): Expense | null {
    if (!expense || typeof expense !== 'object') return null;
    const c = expense as Partial<Expense> & { date?: string | Date };
    const title = typeof c.title === 'string' ? c.title.trim() : '';
    const amount = Number(c.amount);
    const date = new Date(c.date ?? '');

    if (!title || Number.isNaN(amount) || amount <= 0 || Number.isNaN(date.getTime())) return null;

    return {
      id: typeof c.id === 'number' ? c.id : Date.now() + Math.floor(Math.random() * 1000),
      title,
      amount,
      date,
      category: this.normalizeCategory(c.category),
    };
  }

  private readStorageValue(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorageValue(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // storage unavailable
    }
  }

  private getInitialExpenses(): Expense[] {
    return MOCK_EXPENSES.map((e) => ({ ...e, date: new Date(e.date) }));
  }

  private normalizeCategory(category: unknown): ExpenseCategory {
    return this.categories.some((o) => o.value === category) ? (category as ExpenseCategory) : 'Other';
  }

  private normalizeCurrency(currency: string | null): CurrencyCode {
    return this.currencyOptions.some((o) => o.value === currency)
      ? (currency as CurrencyCode)
      : 'EUR';
  }

  private escapeCsvValue(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
  }
}
