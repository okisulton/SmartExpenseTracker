export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
  imageUri?: string;
  isAIGenerated?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
  categoryBreakdown: { [categoryId: string]: number };
}