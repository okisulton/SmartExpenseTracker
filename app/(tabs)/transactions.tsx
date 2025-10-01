import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { useExpenses } from '@/hooks/expense-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Search, Trash2, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  const { expenses, deleteExpense } = useExpenses();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || expense.category.id === selectedCategory;
      
      // Date range filter - normalize dates to compare only date part (not time)
      const expenseDate = new Date(expense.date);
      const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
      
      let matchesDateRange = true;
      
      if (startDate) {
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        matchesDateRange = matchesDateRange && expenseDateOnly >= startDateOnly;
      }
      
      if (endDate) {
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        matchesDateRange = matchesDateRange && expenseDateOnly <= endDateOnly;
      }
      
      return matchesSearch && matchesCategory && matchesDateRange;
    });
  }, [expenses, searchQuery, selectedCategory, startDate, endDate]);

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
      year: 'numeric',
    });
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString);
    
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      // Select end date
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        // If selected date is before start date, make it the new start date
        setStartDate(selectedDate);
        setEndDate(null);
      }
    }
  };

  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
  };





  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Select date range';
    if (startDate && !endDate) return `From ${formatDateShort(startDate)}`;
    if (startDate && endDate) {
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return `${formatDateShort(startDate)} - ${formatDateShort(endDate)} (${days} days)`;
    }
    return 'Select date range';
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    if (startDate && endDate) {
      // Mark range between start and end dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        
        if (d.getTime() === start.getTime()) {
          marked[dateString] = { startingDay: true, color: '#667eea', textColor: 'white' };
        } else if (d.getTime() === end.getTime()) {
          marked[dateString] = { endingDay: true, color: '#667eea', textColor: 'white' };
        } else {
          marked[dateString] = { color: '#667eea20', textColor: '#2c3e50' };
        }
      }
    } else if (startDate) {
      // Mark only start date
      const dateString = startDate.toISOString().split('T')[0];
      marked[dateString] = { selected: true, selectedColor: '#667eea' };
    }
    
    return marked;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>
            {filteredExpenses.length} expenses • {formatCurrency(totalAmount)}
          </Text>
        </View>
      </LinearGradient>

      {/* Search and Filter */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Search color="#7f8c8d" size={20} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search expenses..."
            placeholderTextColor="#bdc3c7"
          />
        </View>

        {/* Date Range Filter */}
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={() => setShowCalendarModal(true)}
        >
          <Calendar size={20} color="#667eea" />
          <Text style={styles.dateSelectorText}>{formatDateRange()}</Text>
          {(startDate || endDate) && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={clearDateRange}
            >
              <X color="#e74c3c" size={16} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilters}
          contentContainerStyle={styles.categoryFiltersContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory === 'all' && styles.filterButtonSelected
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedCategory === 'all' && styles.filterButtonTextSelected
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {EXPENSE_CATEGORIES.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterButton,
                selectedCategory === category.id && styles.filterButtonSelected,
                index === EXPENSE_CATEGORIES.length - 1 && styles.filterButtonLast
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.filterButtonIcon}>{category.icon}</Text>
              <Text style={[
                styles.filterButtonText,
                selectedCategory === category.id && styles.filterButtonTextSelected
              ]}>
                {category.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No transactions found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedCategory !== 'all' || startDate || endDate
                ? 'Try adjusting your search, date range, or filters'
                : 'Start adding expenses to see them here'
              }
            </Text>
          </View>
        ) : (
          filteredExpenses.map((expense) => (
            <View key={expense.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.categoryIconContainer,
                  { backgroundColor: expense.category.color + '20' }
                ]}>
                  <Text style={styles.transactionIcon}>{expense.category.icon}</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>{expense.description}</Text>
                  <Text style={styles.transactionCategory}>{expense.category.name}</Text>
                  <Text style={styles.transactionDate}>{formatDate(expense.date)}</Text>
                  {expense.isAIGenerated && (
                    <Text style={styles.aiLabel}>✨ AI Generated</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>-{formatCurrency(expense.amount)}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteExpense(expense.id)}
                >
                  <Trash2 color="#e74c3c" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCalendarModal(false)}
              >
                <X color="#7f8c8d" size={24} />
              </TouchableOpacity>
            </View>
            
            <RNCalendar
              onDayPress={handleDayPress}
              markingType={'period'}
              markedDates={getMarkedDates()}
              maxDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: 'white',
                calendarBackground: 'white',
                textSectionTitleColor: '#2c3e50',
                selectedDayBackgroundColor: '#667eea',
                selectedDayTextColor: '#667eea',
                todayTextColor: '#667eea',
                dayTextColor: '#2c3e50',
                textDisabledColor: '#bdc3c7',
                arrowColor: '#667eea',
                monthTextColor: '#2c3e50',
                indicatorColor: '#667eea',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
              }}
            />
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  clearDateRange();
                  setShowCalendarModal(false);
                }}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
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
  filtersContainer: {
    padding: 20,
    paddingTop: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
  },

  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  clearDateButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  clearButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
  },
  applyButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  categoryFilters: {
    marginHorizontal: -20,
    paddingVertical: 8,
  },
  categoryFiltersContent: {
    paddingLeft: 20,
    paddingRight: 80,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonSelected: {
    backgroundColor: '#667eea',
  },
  filterButtonLast: {
    marginRight: 20,
  },
  filterButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  filterButtonTextSelected: {
    color: 'white',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionItem: {
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
  transactionLeft: {
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
  transactionIcon: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  aiLabel: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
});