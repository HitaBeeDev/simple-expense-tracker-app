import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ExpenseCategory, Expense } from '../models/expenses';

type CategoryOption = {
  value: ExpenseCategory;
  icon: string;
};

@Component({
  selector: 'app-expenses-activity-card',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './expenses-activity-card.html',
})
export class ExpensesActivityCardComponent {
  @Input() filteredExpenses: Expense[] = [];
  @Input() selectedCurrency = '';
  @Input() editingExpenseId: number | null = null;
  @Input() editExpenseTitle = '';
  @Output() editExpenseTitleChange = new EventEmitter<string>();
  @Input() editExpenseAmount: number | null = null;
  @Output() editExpenseAmountChange = new EventEmitter<number | null>();
  @Input() editExpenseDate = '';
  @Output() editExpenseDateChange = new EventEmitter<string>();
  @Input() editExpenseCategory: ExpenseCategory = 'Other';
  @Output() editExpenseCategoryChange = new EventEmitter<ExpenseCategory>();
  @Input() editExpenseErrors: string[] = [];
  @Input() categories: CategoryOption[] = [];
  @Input() maxDate = '';

  @Output() startEditClick = new EventEmitter<Expense>();
  @Output() saveEditClick = new EventEmitter<number>();
  @Output() cancelEditClick = new EventEmitter<void>();
  @Output() deleteExpenseClick = new EventEmitter<number>();
}
