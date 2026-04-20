import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExpenseCategory } from '../models/expenses';

type CategoryOption = {
  value: ExpenseCategory;
  icon: string;
};

type FilterOption = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-expenses-overview',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './expenses-overview.html',
})
export class ExpensesOverviewComponent {
  @Input() visibleCount = 0;
  @Input() visibleTotal = 0;
  @Input() selectedCurrency = '';
  @Input() hasActiveFilters = false;

  @Input() searchQuery = '';
  @Output() searchQueryChange = new EventEmitter<string>();

  @Input() selectedCategoryFilter: ExpenseCategory | string = '';
  @Output() selectedCategoryFilterChange = new EventEmitter<ExpenseCategory | string>();

  @Input() selectedDateRange = '';
  @Output() selectedDateRangeChange = new EventEmitter<string>();

  @Input() selectedSort = '';
  @Output() selectedSortChange = new EventEmitter<string>();

  @Input() customStartDate = '';
  @Output() customStartDateChange = new EventEmitter<string>();

  @Input() customEndDate = '';
  @Output() customEndDateChange = new EventEmitter<string>();

  @Input() maxDate = '';
  @Input() allCategoriesValue = '';
  @Input() categories: CategoryOption[] = [];
  @Input() dateRangeOptions: FilterOption[] = [];
  @Input() sortOptions: FilterOption[] = [];

  @Output() exportCsvClick = new EventEmitter<void>();
  @Output() resetClick = new EventEmitter<void>();
}
