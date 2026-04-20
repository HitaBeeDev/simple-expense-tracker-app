import { Component, Input } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Expense } from '../models/expenses';

@Component({
  selector: 'app-visible-total-card',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  templateUrl: './visible-total-card.html',
})
export class VisibleTotalCardComponent {
  @Input() visibleTotal = 0;
  @Input() selectedCurrency = '';
  @Input() visibleCount = 0;
  @Input() highestExpense: Expense | null = null;
  @Input() highestExpenseCategoryIcon = '';
}
