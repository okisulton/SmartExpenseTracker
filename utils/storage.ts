import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  EXPENSES: 'financial_tracker_expenses',
  USER_PREFERENCES: 'financial_tracker_preferences',
  APP_VERSION: 'financial_tracker_app_version',
} as const;

// Utility functions for AsyncStorage operations
export const StorageUtils = {
  // Get data from AsyncStorage
  async getData<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  },

  // Set data to AsyncStorage
  async setData<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      return false;
    }
  },

  // Remove data from AsyncStorage
  async removeData(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      return false;
    }
  },

  // Clear all data from AsyncStorage
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  },

  // Get all keys from AsyncStorage
  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },

  // Check if key exists
  async keyExists(key: string): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.includes(key);
    } catch (error) {
      console.error(`Error checking if key ${key} exists:`, error);
      return false;
    }
  },
};

// User preferences interface
export interface UserPreferences {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  backup: boolean;
}

// Default user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  currency: 'USD',
  language: 'en',
  theme: 'system',
  notifications: true,
  backup: true,
};