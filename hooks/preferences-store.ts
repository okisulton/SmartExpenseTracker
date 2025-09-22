import { DEFAULT_USER_PREFERENCES, STORAGE_KEYS, StorageUtils, UserPreferences } from '@/utils/storage';
import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

const loadPreferences = async (): Promise<UserPreferences> => {
  try {
    const preferences = await StorageUtils.getData<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
    return preferences || DEFAULT_USER_PREFERENCES;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_USER_PREFERENCES;
  }
};

const savePreferences = async (preferences: UserPreferences): Promise<UserPreferences> => {
  try {
    const success = await StorageUtils.setData(STORAGE_KEYS.USER_PREFERENCES, preferences);
    if (!success) {
      console.error('Failed to save preferences to storage');
    }
    return preferences;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return preferences;
  }
};

export const [PreferencesContext, usePreferences] = createContextHook(() => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: loadPreferences,
  });

  const saveMutation = useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      setPreferences(data);
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }
  });

  useEffect(() => {
    if (preferencesQuery.data) {
      setPreferences(preferencesQuery.data);
    }
  }, [preferencesQuery.data]);

  const { mutate } = saveMutation;

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...updates };
    mutate(updated);
  }, [preferences, mutate]);

  const resetPreferences = useCallback(() => {
    mutate(DEFAULT_USER_PREFERENCES);
  }, [mutate]);

  const updateCurrency = useCallback((currency: string) => {
    updatePreferences({ currency });
  }, [updatePreferences]);

  const updateTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme });
  }, [updatePreferences]);

  const toggleNotifications = useCallback(() => {
    updatePreferences({ notifications: !preferences.notifications });
  }, [preferences.notifications, updatePreferences]);

  const toggleBackup = useCallback(() => {
    updatePreferences({ backup: !preferences.backup });
  }, [preferences.backup, updatePreferences]);

  return useMemo(() => ({
    preferences,
    updatePreferences,
    resetPreferences,
    updateCurrency,
    updateTheme,
    toggleNotifications,
    toggleBackup,
    isLoading: preferencesQuery.isLoading,
    isSaving: saveMutation.isPending,
  }), [
    preferences,
    updatePreferences,
    resetPreferences,
    updateCurrency,
    updateTheme,
    toggleNotifications,
    toggleBackup,
    preferencesQuery.isLoading,
    saveMutation.isPending,
  ]);
});