import { TestBed } from '@angular/core/testing';
import { ExpenseService } from './expense.service';
import { Expense } from './models/expenses';

describe('ExpenseService', () => {
  let service: ExpenseService;

  const mockExpense = (overrides: Partial<Expense> = {}): Expense => ({
    id: 1,
    title: 'Coffee',
    amount: 3.5,
    date: new Date('2026-01-01'),
    category: 'Food',
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseService);
  });

  describe('validate', () => {
    it('returns error for empty title', () => {
      expect(service.validate('', 10, '2026-01-01')).toContain('Title is required.');
    });

    it('returns error for whitespace-only title', () => {
      expect(service.validate('   ', 10, '2026-01-01')).toContain('Title is required.');
    });

    it('returns error for null amount', () => {
      expect(service.validate('Coffee', null, '2026-01-01')).toContain('Amount is required.');
    });

    it('returns error for zero amount', () => {
      expect(service.validate('Coffee', 0, '2026-01-01')).toContain('Amount must be greater than 0.');
    });

    it('returns error for negative amount', () => {
      expect(service.validate('Coffee', -5, '2026-01-01')).toContain('Amount must be greater than 0.');
    });

    it('returns error for missing date', () => {
      expect(service.validate('Coffee', 10, '')).toContain('Date is required.');
    });

    it('returns no errors for valid inputs', () => {
      expect(service.validate('Coffee', 3.5, '2026-01-01')).toHaveSize(0);
    });
  });

  describe('addExpense', () => {
    it('appends a new expense to the list', () => {
      service.expenses.set([]);
      service.addExpense('Lunch', 12, '2026-01-15', 'Food');
      expect(service.expenses()).toHaveSize(1);
      expect(service.expenses()[0].title).toBe('Lunch');
      expect(service.expenses()[0].amount).toBe(12);
      expect(service.expenses()[0].category).toBe('Food');
    });

    it('trims whitespace from the title', () => {
      service.expenses.set([]);
      service.addExpense('  Rent  ', 1200, '2026-01-01', 'Housing');
      expect(service.expenses()[0].title).toBe('Rent');
    });
  });

  describe('deleteExpense', () => {
    it('removes the expense with the given id', () => {
      service.expenses.set([mockExpense({ id: 1 }), mockExpense({ id: 2, title: 'Tea' })]);
      service.deleteExpense(1);
      expect(service.expenses()).toHaveSize(1);
      expect(service.expenses()[0].id).toBe(2);
    });

    it('does nothing when id does not exist', () => {
      service.expenses.set([mockExpense({ id: 1 })]);
      service.deleteExpense(999);
      expect(service.expenses()).toHaveSize(1);
    });
  });

  describe('saveEdit', () => {
    it('updates title, amount, date and category for the given id', () => {
      service.expenses.set([mockExpense({ id: 1 })]);
      service.saveEdit(1, 'Updated', 99, '2026-06-01', 'Transport');
      const updated = service.expenses()[0];
      expect(updated.title).toBe('Updated');
      expect(updated.amount).toBe(99);
      expect(updated.category).toBe('Transport');
    });

    it('leaves other expenses untouched', () => {
      service.expenses.set([mockExpense({ id: 1 }), mockExpense({ id: 2, title: 'Unchanged' })]);
      service.saveEdit(1, 'Changed', 5, '2026-01-01', 'Food');
      expect(service.expenses()[1].title).toBe('Unchanged');
    });
  });

  describe('filteredExpenses (computed)', () => {
    beforeEach(() => {
      service.expenses.set([
        mockExpense({ id: 1, title: 'Coffee', category: 'Food' }),
        mockExpense({ id: 2, title: 'Bus pass', category: 'Transport' }),
      ]);
    });

    it('returns all expenses when no filters are active', () => {
      expect(service.filteredExpenses()).toHaveSize(2);
    });

    it('filters by search query', () => {
      service.searchQuery.set('bus');
      expect(service.filteredExpenses()).toHaveSize(1);
      expect(service.filteredExpenses()[0].title).toBe('Bus pass');
    });

    it('filters by category', () => {
      service.selectedCategoryFilter.set('Transport');
      expect(service.filteredExpenses()).toHaveSize(1);
      expect(service.filteredExpenses()[0].category).toBe('Transport');
    });
  });

  describe('clearFilters', () => {
    it('resets all filter signals to defaults', () => {
      service.searchQuery.set('test');
      service.selectedCategoryFilter.set('Food');
      service.selectedDateRange.set('this-month');
      service.clearFilters();
      expect(service.searchQuery()).toBe('');
      expect(service.selectedCategoryFilter()).toBe('All');
      expect(service.selectedDateRange()).toBe('all');
    });
  });
});
