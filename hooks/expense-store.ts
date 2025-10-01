import { getCategoryById } from '@/constants/categories';
import { Expense } from '@/types/expense';
import { STORAGE_KEYS, StorageUtils } from '@/utils/storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

const loadExpenses = async (): Promise<Expense[]> => {
  try {
    const expenses = await StorageUtils.getData<Expense[]>(STORAGE_KEYS.EXPENSES);
    return expenses || [];
  } catch (error) {
    console.error('Error loading expenses:', error);
    return [];
  }
};

const saveExpenses = async (expenses: Expense[]): Promise<Expense[]> => {
  if (!Array.isArray(expenses)) return [];
  try {
    const success = await StorageUtils.setData(STORAGE_KEYS.EXPENSES, expenses);
    if (!success) {
      console.error('Failed to save expenses to storage');
    }
    return expenses;
  } catch (error) {
    console.error('Error saving expenses:', error);
    return expenses;
  }
};

export const [ExpenseContext, useExpenses] = createContextHook(() => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: loadExpenses
  });

  const saveMutation = useMutation({
    mutationFn: saveExpenses,
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        setExpenses(data);
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
      }
    }
  });

  useEffect(() => {
    if (expensesQuery.data) {
      setExpenses(expensesQuery.data);
    }
  }, [expensesQuery.data]);

  const { mutate } = saveMutation;

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    const updated = [newExpense, ...expenses];
    mutate(updated);
  }, [expenses, mutate]);

  const deleteExpense = useCallback((id: string) => {
    const updated = expenses.filter(expense => expense.id !== id);
    mutate(updated);
  }, [expenses, mutate]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const updated = expenses.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    );
    mutate(updated);
  }, [expenses, mutate]);

  const clearAllExpenses = useCallback(async () => {
    try {
      const success = await StorageUtils.removeData(STORAGE_KEYS.EXPENSES);
      if (success) {
        mutate([]);
      }
      return success;
    } catch (error) {
      console.error('Error clearing all expenses:', error);
      return false;
    }
  }, [mutate]);

  const exportExpenses = useCallback(async () => {
    try {
      return JSON.stringify(expenses, null, 2);
    } catch (error) {
      console.error('Error exporting expenses:', error);
      return null;
    }
  }, [expenses]);

  const addMultipleExpenses = useCallback((newExpenses: Expense[]) => {
    const updated = [...newExpenses, ...expenses];
    mutate(updated);
  }, [expenses, mutate]);

  const importExpenses = useCallback(async (expensesJson: string) => {
    try {
      const importedExpenses = JSON.parse(expensesJson) as Expense[];
      if (Array.isArray(importedExpenses)) {
        mutate(importedExpenses);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing expenses:', error);
      return false;
    }
  }, [mutate]);

  return useMemo(() => ({
    expenses,
    addExpense,
    addMultipleExpenses,
    deleteExpense,
    updateExpense,
    clearAllExpenses,
    exportExpenses,
    importExpenses,
    isLoading: expensesQuery.isLoading,
    isSaving: saveMutation.isPending,
  }), [
    expenses, 
    addExpense,
    addMultipleExpenses, 
    deleteExpense, 
    updateExpense, 
    clearAllExpenses,
    exportExpenses,
    importExpenses,
    expensesQuery.isLoading, 
    saveMutation.isPending
  ]);
});

export function useExpenseAnalytics() {
  const { expenses } = useExpenses();

  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month expenses
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const totalThisMonth = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Category breakdown
    const categoryTotals: { [key: string]: number } = {};
    currentMonthExpenses.forEach(expense => {
      categoryTotals[expense.category.id] = (categoryTotals[expense.category.id] || 0) + expense.amount;
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([categoryId, amount]) => ({
      category: getCategoryById(categoryId),
      amount,
      percentage: totalThisMonth > 0 ? (amount / totalThisMonth) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Recent expenses (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentExpenses = expenses.filter(expense => 
      new Date(expense.date) >= sevenDaysAgo
    ).slice(0, 5);

    // Daily spending for the last 7 days
    const dailySpending: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailySpending[dateKey] = 0;
    }

    expenses.forEach(expense => {
      const dateKey = expense.date.split('T')[0];
      if (dailySpending.hasOwnProperty(dateKey)) {
        dailySpending[dateKey] += expense.amount;
      }
    });

    return {
      totalThisMonth,
      categoryBreakdown,
      recentExpenses,
      dailySpending: Object.entries(dailySpending).map(([date, amount]) => ({
        date,
        amount,
      })),
    };
  }, [expenses]);
}