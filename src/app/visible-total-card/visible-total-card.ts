import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Expenses } from '../models/expenses';

@Component({
  selector: 'app-visible-total-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visible-total-card.html',
})
export class VisibleTotalCardComponent {
  @Input() visibleTotal = 0;
  @Input() selectedCurrency = '';
  @Input() visibleCount = 0;
  @Input() highestExpense: Expenses | null = null;
  @Input() highestExpenseCategoryIcon = '';
}
