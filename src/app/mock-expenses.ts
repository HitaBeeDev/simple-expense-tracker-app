import { Expenses } from './models/expenses';

export const MOCK_EXPENSES: Expenses[] = [
  {
    id: 101,
    title: 'Weekly groceries',
    amount: 82.45,
    date: new Date('2026-04-18'),
    category: 'Food',
  },
  {
    id: 102,
    title: 'Monthly rent',
    amount: 980,
    date: new Date('2026-04-01'),
    category: 'Housing',
  },
  {
    id: 103,
    title: 'Train pass',
    amount: 49,
    date: new Date('2026-04-06'),
    category: 'Transport',
  },
  {
    id: 104,
    title: 'Cinema night',
    amount: 28,
    date: new Date('2026-04-12'),
    category: 'Entertainment',
  },
  {
    id: 105,
    title: 'Pharmacy essentials',
    amount: 24.9,
    date: new Date('2026-04-10'),
    category: 'Health',
  },
  {
    id: 106,
    title: 'Team lunch',
    amount: 36.5,
    date: new Date('2026-03-27'),
    category: 'Food',
  },
  {
    id: 107,
    title: 'Electricity bill',
    amount: 73.2,
    date: new Date('2026-03-29'),
    category: 'Housing',
  },
  {
    id: 108,
    title: 'Streaming subscription',
    amount: 12.99,
    date: new Date('2026-03-15'),
    category: 'Entertainment',
  },
  {
    id: 109,
    title: 'Taxi to airport',
    amount: 31.6,
    date: new Date('2026-02-22'),
    category: 'Transport',
  },
  {
    id: 110,
    title: 'Desk accessories',
    amount: 18.75,
    date: new Date('2026-02-19'),
    category: 'Other',
  },
];
