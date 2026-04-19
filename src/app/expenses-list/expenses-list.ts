import { Component, OnInit } from '@angular/core';
import { ExpenseCategory, Expenses } from '../models/expenses';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type CategoryOption = {
  value: ExpenseCategory;
  icon: string;
  colorClass: string;
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
  expenses: Expenses[] = [];
  readonly maxDate = this.formatDateForInput(new Date());

  get filteredExpenses(): Expenses[] {
    if (this.selectedCategoryFilter === this.allCategoriesValue) {
      return this.expenses;
    }

    return this.expenses.filter((expense) => expense.category === this.selectedCategoryFilter);
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
