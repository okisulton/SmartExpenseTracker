import { ExpenseCategory } from '@/types/expense';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#45B7D1' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
  { id: 'bills', name: 'Bills & Utilities', icon: '⚡', color: '#FFEAA7' },
  { id: 'health', name: 'Healthcare', icon: '🏥', color: '#DDA0DD' },
  { id: 'education', name: 'Education', icon: '📚', color: '#98D8C8' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#F7DC6F' },
  { id: 'other', name: 'Other', icon: '📝', color: '#BDC3C7' },
];

export const getCategoryById = (id: string): ExpenseCategory => {
  return EXPENSE_CATEGORIES.find(cat => cat.id === id) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
};