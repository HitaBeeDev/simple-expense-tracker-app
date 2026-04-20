import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExpenseCategory } from '../models/expenses';

type CategoryOption = {
  value: ExpenseCategory;
  icon: string;
};

type CurrencyOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-new-expense-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-expense-card.html',
})
export class NewExpenseCardComponent {
  @Input() newExpenseTitle = '';
  @Output() newExpenseTitleChange = new EventEmitter<string>();

  @Input() newExpenseAmount: number | null = null;
  @Output() newExpenseAmountChange = new EventEmitter<number | null>();

  @Input() newExpenseDate = '';
  @Output() newExpenseDateChange = new EventEmitter<string>();

  @Input() maxDate = '';

  @Input() newExpenseCategory: ExpenseCategory = 'Other';
  @Output() newExpenseCategoryChange = new EventEmitter<ExpenseCategory>();

  @Input() selectedCurrency = '';
  @Output() selectedCurrencyChange = new EventEmitter<string>();
  @Output() currencyPreferenceChange = new EventEmitter<void>();

  @Input() categories: CategoryOption[] = [];
  @Input() currencyOptions: CurrencyOption[] = [];
  @Input() addExpenseErrors: string[] = [];

  @Output() addExpenseClick = new EventEmitter<void>();

  onCurrencyChange(value: string): void {
    this.selectedCurrencyChange.emit(value);
    this.currencyPreferenceChange.emit();
  }
}
