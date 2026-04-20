import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ExpenseCategory } from '../models/expenses';

type SummaryItem = {
  label: string;
  total: number;
};

type CategorySummaryItem = SummaryItem & {
  category: ExpenseCategory;
};

@Component({
  selector: 'app-expense-summaries-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-summaries-card.html',
})
export class ExpenseSummariesCardComponent {
  @Input() monthlyBreakdown: SummaryItem[] = [];
  @Input() categoryTotals: CategorySummaryItem[] = [];
  @Input() selectedCurrency = '';
  @Input() categoryIcons: Record<ExpenseCategory, string> = {
    Food: '',
    Transport: '',
    Housing: '',
    Entertainment: '',
    Health: '',
    Other: '',
  };
}
