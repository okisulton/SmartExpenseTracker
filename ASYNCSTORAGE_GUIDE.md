# AsyncStorage Integration Guide

This document explains how AsyncStorage has been integrated into the Smart Expense Tracker app for local data persistence.

## Overview

The app now uses `@react-native-async-storage/async-storage` for local data storage, replacing the web-only `localStorage`. This ensures data persistence across app sessions on both iOS and Android platforms.

## Files Changed/Added

### 1. `/utils/storage.ts` (New)
- **StorageUtils**: A utility class providing common AsyncStorage operations
- **STORAGE_KEYS**: Centralized storage key constants
- **UserPreferences**: Interface and default values for user settings

### 2. `/hooks/expense-store.ts` (Updated)
- Replaced `localStorage` with AsyncStorage
- Added new methods: `clearAllExpenses`, `exportExpenses`, `importExpenses`
- Improved error handling and type safety

### 3. `/hooks/preferences-store.ts` (New)
- Complete user preferences management
- Methods for updating currency, theme, notifications, backup settings
- Persistent storage of user settings

### 4. `/components/storage-demo.tsx` (New)
- Demo component showing AsyncStorage features
- Example usage of all storage operations

### 5. `/app/_layout.tsx` (Updated)
- Added PreferencesContext provider

## Features

### Expense Management
- ✅ Persistent expense storage
- ✅ Data export functionality
- ✅ Clear all expenses option
- ✅ Import expenses from JSON
- ✅ Automatic data synchronization

### User Preferences
- ✅ Currency selection
- ✅ Theme preferences (light/dark/system)
- ✅ Notification settings
- ✅ Backup preferences
- ✅ Reset to defaults

### Storage Operations
- ✅ Get/Set data with type safety
- ✅ Remove specific data
- ✅ Clear all storage
- ✅ Check key existence
- ✅ List all storage keys

## Usage Examples

### Using the Expense Store
```typescript
import { useExpenses } from '@/hooks/expense-store';

const MyComponent = () => {
  const { 
    expenses, 
    addExpense, 
    deleteExpense, 
    updateExpense,
    clearAllExpenses,
    exportExpenses,
    importExpenses,
    isLoading 
  } = useExpenses();

  // Add a new expense
  const handleAddExpense = () => {
    addExpense({
      amount: 50.00,
      description: 'Lunch',
      date: new Date().toISOString(),
      category: { id: 'food', name: 'Food', icon: '🍽️' }
    });
  };

  // Export all expenses
  const handleExport = async () => {
    const data = await exportExpenses();
    console.log('Exported data:', data);
  };

  return (
    // Your component JSX
  );
};
```

### Using the Preferences Store
```typescript
import { usePreferences } from '@/hooks/preferences-store';

const SettingsComponent = () => {
  const { 
    preferences, 
    updateCurrency, 
    updateTheme, 
    toggleNotifications 
  } = usePreferences();

  return (
    <View>
      <Text>Current Currency: {preferences.currency}</Text>
      <Button 
        title="Switch to EUR" 
        onPress={() => updateCurrency('EUR')} 
      />
      <Button 
        title="Toggle Notifications" 
        onPress={toggleNotifications} 
      />
    </View>
  );
};
```

### Direct Storage Operations
```typescript
import { StorageUtils, STORAGE_KEYS } from '@/utils/storage';

// Save custom data
await StorageUtils.setData('my_key', { value: 'test' });

// Load custom data
const data = await StorageUtils.getData('my_key');

// Check if data exists
const exists = await StorageUtils.keyExists(STORAGE_KEYS.EXPENSES);

// Remove data
await StorageUtils.removeData('my_key');
```

## Storage Keys

All storage keys are centralized in `STORAGE_KEYS`:
- `EXPENSES`: 'financial_tracker_expenses'
- `USER_PREFERENCES`: 'financial_tracker_preferences'
- `APP_VERSION`: 'financial_tracker_app_version'

## Error Handling

All storage operations include comprehensive error handling:
- Graceful fallbacks for failed operations
- Console logging for debugging
- Type safety with TypeScript
- Default values for missing data

## Testing

To test the AsyncStorage integration:

1. Add some expenses through the app
2. Close and restart the app
3. Verify expenses are still there
4. Try the storage demo component
5. Check preferences persistence

## Migration from localStorage

The app automatically handles the migration from localStorage to AsyncStorage. No manual migration is needed.

## Best Practices

1. **Always use the provided hooks** (`useExpenses`, `usePreferences`) instead of direct AsyncStorage calls
2. **Handle loading states** using the `isLoading` properties
3. **Use StorageUtils** for custom storage operations
4. **Follow the established patterns** for error handling and type safety
5. **Test on both platforms** (iOS and Android) to ensure compatibility

## Troubleshooting

### Data Not Persisting
- Check device storage permissions
- Verify AsyncStorage is properly installed
- Check console for error messages

### Performance Issues
- AsyncStorage operations are asynchronous
- Use React Query for caching and optimization
- Avoid storing large amounts of data

### Type Errors
- Ensure proper TypeScript interfaces
- Use the provided utility functions
- Check import statements

## Future Enhancements

- [ ] Data backup to cloud storage
- [ ] Data encryption for sensitive information
- [ ] Storage quota management
- [ ] Offline data synchronization
- [ ] Data compression for large datasets