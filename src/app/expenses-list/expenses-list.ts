import { Component, OnInit, inject } from '@angular/core';
import { ExpenseCategory, Expense } from '../models/expenses';
import { ExpenseService } from '../expense.service';
import { ExpensesHeroComponent } from '../expenses-hero/expenses-hero';
import { ExpensesActivityCardComponent } from '../expenses-activity-card/expenses-activity-card';
import { NewExpenseCardComponent } from '../new-expense-card/new-expense-card';
import { ExpensesOverviewComponent } from '../expenses-overview/expenses-overview';
import { ExpenseSummariesCardComponent } from '../expense-summaries-card/expense-summaries-card';
import { VisibleTotalCardComponent } from '../visible-total-card/visible-total-card';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [
    ExpensesHeroComponent,
    ExpensesActivityCardComponent,
    NewExpenseCardComponent,
    ExpensesOverviewComponent,
    ExpenseSummariesCardComponent,
    VisibleTotalCardComponent,
  ],
  templateUrl: './expenses-list.html',
})
export class ExpensesListComponent implements OnInit {
  protected readonly service = inject(ExpenseService);

  newExpenseTitle = '';
  newExpenseAmount: number | null = null;
  newExpenseDate = '';
  newExpenseCategory: ExpenseCategory = 'Other';
  addExpenseErrors: string[] = [];

  editingExpenseId: number | null = null;
  editExpenseTitle = '';
  editExpenseAmount: number | null = null;
  editExpenseDate = '';
  editExpenseCategory: ExpenseCategory = 'Other';
  editExpenseErrors: string[] = [];

  ngOnInit(): void {
    this.service.init();
  }

  addExpense(): void {
    this.addExpenseErrors = this.service.validate(
      this.newExpenseTitle,
      this.newExpenseAmount,
      this.newExpenseDate,
    );
    if (this.addExpenseErrors.length) return;

    this.service.addExpense(
      this.newExpenseTitle,
      this.newExpenseAmount,
      this.newExpenseDate,
      this.newExpenseCategory,
    );
    this.newExpenseTitle = '';
    this.newExpenseAmount = null;
    this.newExpenseDate = '';
    this.newExpenseCategory = 'Other';
    this.addExpenseErrors = [];
  }

  startEdit(expense: Expense): void {
    this.editingExpenseId = expense.id;
    this.editExpenseTitle = expense.title;
    this.editExpenseAmount = expense.amount;
    this.editExpenseDate = this.service.formatDateForInput(expense.date);
    this.editExpenseCategory = expense.category;
    this.editExpenseErrors = [];
  }

  saveEdit(expenseId: number): void {
    this.editExpenseErrors = this.service.validate(
      this.editExpenseTitle,
      this.editExpenseAmount,
      this.editExpenseDate,
    );
    if (this.editExpenseErrors.length) return;

    this.service.saveEdit(
      expenseId,
      this.editExpenseTitle,
      this.editExpenseAmount,
      this.editExpenseDate,
      this.editExpenseCategory,
    );
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingExpenseId = null;
    this.editExpenseTitle = '';
    this.editExpenseAmount = null;
    this.editExpenseDate = '';
    this.editExpenseCategory = 'Other';
    this.editExpenseErrors = [];
  }

  deleteExpense(id: number): void {
    if (id === this.editingExpenseId) this.cancelEdit();
    this.service.deleteExpense(id);
  }
}
