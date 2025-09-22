import { useExpenseAnalytics, useExpenses } from '@/hooks/expense-store';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Calendar, CreditCard, PlusCircle, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { expenses } = useExpenses();
  const analytics = useExpenseAnalytics();
  const insets = useSafeAreaInsets();

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingTop: insets.top + 32 }]}
      >
        <Text style={styles.headerTitle}>Financial Tracker</Text>
        <Text style={styles.headerSubtitle}>Track your expenses with AI</Text>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingUp color="#667eea" size={24} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(analytics.totalThisMonth)}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Calendar color="#f093fb" size={24} />
          </View>
          <Text style={styles.statValue}>{expenses.length}</Text>
          <Text style={styles.statLabel}>Total Expenses</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/add-expense')}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.actionButtonGradient}
            >
              <PlusCircle color="white" size={24} />
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/scan-receipt')}
          >
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.actionButtonGradient}
            >
              <CreditCard color="white" size={24} />
              <Text style={styles.actionButtonText}>Scan Receipt</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Categories */}
      {analytics.categoryBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories This Month</Text>
          {analytics.categoryBreakdown.slice(0, 3).map((item, index) => (
            <View key={item.category.id} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <Text style={styles.categoryIcon}>{item.category.icon}</Text>
                <View>
                  <Text style={styles.categoryName}>{item.category.name}</Text>
                  <Text style={styles.categoryPercentage}>
                    {item.percentage.toFixed(1)}% of spending
                  </Text>
                </View>
              </View>
              <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Expenses */}
      {analytics.recentExpenses.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {analytics.recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseIcon}>{expense.category.icon}</Text>
                <View>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                </View>
              </View>
              <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {expenses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No expenses yet</Text>
          <Text style={styles.emptyStateText}>
            Start tracking your expenses by adding one manually or scanning a receipt
          </Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => router.push('/add-expense')}
          >
            <Text style={styles.emptyStateButtonText}>Add Your First Expense</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 80,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -30,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expenseIcon: {
    fontSize: 20,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  expenseDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});