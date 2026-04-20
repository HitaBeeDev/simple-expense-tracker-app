export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Entertainment'
  | 'Health'
  | 'Other';

export interface Expense {
  id: number;
  title: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
}
