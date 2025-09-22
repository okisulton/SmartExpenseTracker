import { useExpenses } from '@/hooks/expense-store';
import { usePreferences } from '@/hooks/preferences-store';
import { STORAGE_KEYS, StorageUtils } from '@/utils/storage';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StorageDemo() {
  const { 
    expenses, 
    clearAllExpenses, 
    exportExpenses, 
    importExpenses, 
    isLoading: expensesLoading 
  } = useExpenses();
  
  const { 
    preferences, 
    resetPreferences, 
    updateCurrency, 
    updateTheme, 
    toggleNotifications,
    isLoading: preferencesLoading 
  } = usePreferences();

  const handleClearAllExpenses = async () => {
    Alert.alert(
      'Clear All Expenses',
      'Are you sure you want to delete all expenses? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllExpenses();
            if (success) {
              Alert.alert('Success', 'All expenses have been cleared.');
            } else {
              Alert.alert('Error', 'Failed to clear expenses.');
            }
          }
        }
      ]
    );
  };

  const handleExportExpenses = async () => {
    const exportData = await exportExpenses();
    if (exportData) {
      Alert.alert(
        'Export Successful', 
        `Exported ${expenses.length} expenses.\n\nData:\n${exportData.substring(0, 200)}...`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Export Failed', 'Could not export expenses.');
    }
  };

  const handleStorageInfo = async () => {
    try {
      const keys = await StorageUtils.getAllKeys();
      const expensesExist = await StorageUtils.keyExists(STORAGE_KEYS.EXPENSES);
      const preferencesExist = await StorageUtils.keyExists(STORAGE_KEYS.USER_PREFERENCES);
      
      Alert.alert(
        'Storage Information',
        `Total keys: ${keys.length}\n` +
        `Expenses stored: ${expensesExist ? 'Yes' : 'No'}\n` +
        `Preferences stored: ${preferencesExist ? 'Yes' : 'No'}\n\n` +
        `All keys: ${keys.join(', ')}`
      );
    } catch (error) {
      Alert.alert('Error', 'Could not retrieve storage information.');
    }
  };

  if (expensesLoading || preferencesLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading storage data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AsyncStorage Integration Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses ({expenses.length})</Text>
        <TouchableOpacity style={styles.button} onPress={handleExportExpenses}>
          <Text style={styles.buttonText}>Export Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearAllExpenses}>
          <Text style={styles.buttonText}>Clear All Expenses</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Preferences</Text>
        <Text style={styles.info}>Currency: {preferences.currency}</Text>
        <Text style={styles.info}>Theme: {preferences.theme}</Text>
        <Text style={styles.info}>Notifications: {preferences.notifications ? 'On' : 'Off'}</Text>
        <Text style={styles.info}>Backup: {preferences.backup ? 'On' : 'Off'}</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => updateCurrency('EUR')}>
          <Text style={styles.buttonText}>Change Currency to EUR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => updateTheme('dark')}>
          <Text style={styles.buttonText}>Switch to Dark Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleNotifications}>
          <Text style={styles.buttonText}>Toggle Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={resetPreferences}>
          <Text style={styles.buttonText}>Reset Preferences</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Information</Text>
        <TouchableOpacity style={styles.button} onPress={handleStorageInfo}>
          <Text style={styles.buttonText}>Show Storage Info</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  loading: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  info: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});