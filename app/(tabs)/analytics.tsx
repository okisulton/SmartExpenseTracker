import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, PieChart, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExpenseAnalytics } from '@/hooks/expense-store';

export default function AnalyticsScreen() {
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

  const maxDailyAmount = Math.max(...analytics.dailySpending.map(d => d.amount));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingTop: insets.top + 32 }]}
      >
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Insights into your spending</Text>
      </LinearGradient>

      {/* Monthly Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar color="#667eea" size={24} />
          <Text style={styles.sectionTitle}>This Month</Text>
        </View>
        
        <View style={styles.monthlyCard}>
          <Text style={styles.monthlyAmount}>{formatCurrency(analytics.totalThisMonth)}</Text>
          <Text style={styles.monthlyLabel}>Total Spent</Text>
        </View>
      </View>

      {/* Daily Spending Chart */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp color="#667eea" size={24} />
          <Text style={styles.sectionTitle}>Daily Spending (Last 7 Days)</Text>
        </View>
        
        <View style={styles.chartContainer}>
          <View style={styles.chart}>
            {analytics.dailySpending.map((day, index) => {
              const height = maxDailyAmount > 0 ? (day.amount / maxDailyAmount) * 120 : 0;
              return (
                <View key={day.date} style={styles.chartBar}>
                  <Text style={styles.chartAmount}>
                    {day.amount > 0 ? `$${day.amount.toFixed(0)}` : ''}
                  </Text>
                  <View style={styles.barContainer}>
                    <LinearGradient
                      colors={day.amount > 0 ? ['#667eea', '#764ba2'] : ['#f8f9fa', '#f8f9fa']}
                      style={[styles.bar, { height: Math.max(height, 4) }]}
                    />
                  </View>
                  <Text style={styles.chartDate}>{formatDate(day.date)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <PieChart color="#667eea" size={24} />
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
        </View>
        
        {analytics.categoryBreakdown.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No expenses this month</Text>
          </View>
        ) : (
          analytics.categoryBreakdown.map((item, index) => (
            <View key={item.category.id} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[
                  styles.categoryIconContainer,
                  { backgroundColor: item.category.color + '20' }
                ]}>
                  <Text style={styles.categoryIcon}>{item.category.icon}</Text>
                </View>
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryName}>{item.category.name}</Text>
                  <Text style={styles.categoryPercentage}>
                    {item.percentage.toFixed(1)}% of total spending
                  </Text>
                </View>
              </View>
              
              <View style={styles.categoryRight}>
                <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <LinearGradient
                      colors={[item.category.color, item.category.color + '80']}
                      style={[
                        styles.progressBar,
                        { width: `${item.percentage}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Spending Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>💡 Spending Tip</Text>
          <Text style={styles.insightText}>
            {analytics.categoryBreakdown.length > 0
              ? `Your biggest expense category is ${analytics.categoryBreakdown[0].category.name}. Consider setting a budget for this category.`
              : 'Start tracking your expenses to get personalized insights!'
            }
          </Text>
        </View>

        {analytics.totalThisMonth > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>📊 Monthly Average</Text>
            <Text style={styles.insightText}>
              You&apos;re spending an average of {formatCurrency(analytics.totalThisMonth / new Date().getDate())} per day this month.
            </Text>
          </View>
        )}
      </View>
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
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  monthlyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthlyAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  monthlyLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    height: 16,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    width: 20,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  chartDate: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  categoryRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  progressBarContainer: {
    width: 80,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});