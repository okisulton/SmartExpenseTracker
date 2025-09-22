import { StorageUtils } from '@/utils/storage';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';

interface TestResult {
  operation: string;
  success: boolean;
  details?: string;
}

export default function AsyncStorageTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Test 1: Save data
      const testData = { message: 'Hello AsyncStorage!', timestamp: Date.now() };
      const saveSuccess = await StorageUtils.setData('test_key', testData);
      results.push({
        operation: 'Save Test Data',
        success: saveSuccess,
        details: saveSuccess ? 'Data saved successfully' : 'Failed to save data'
      });

      // Test 2: Load data
      const loadedData = await StorageUtils.getData<typeof testData>('test_key');
      const loadSuccess = loadedData !== null && loadedData.message === testData.message;
      results.push({
        operation: 'Load Test Data',
        success: loadSuccess,
        details: loadSuccess ? `Loaded: ${loadedData?.message}` : 'Failed to load data'
      });

      // Test 3: Check key existence
      const keyExists = await StorageUtils.keyExists('test_key');
      results.push({
        operation: 'Check Key Existence',
        success: keyExists,
        details: keyExists ? 'Key found' : 'Key not found'
      });

      // Test 4: Get all keys
      const allKeys = await StorageUtils.getAllKeys();
      const hasTestKey = allKeys.includes('test_key');
      results.push({
        operation: 'Get All Keys',
        success: hasTestKey,
        details: `Found ${allKeys.length} keys, test_key included: ${hasTestKey}`
      });

      // Test 5: Remove data
      const removeSuccess = await StorageUtils.removeData('test_key');
      results.push({
        operation: 'Remove Test Data',
        success: removeSuccess,
        details: removeSuccess ? 'Data removed successfully' : 'Failed to remove data'
      });

      // Test 6: Verify removal
      const verifyRemoval = await StorageUtils.getData('test_key');
      const removalVerified = verifyRemoval === null;
      results.push({
        operation: 'Verify Data Removal',
        success: removalVerified,
        details: removalVerified ? 'Data successfully removed' : 'Data still exists'
      });

      setTestResults(results);
      
      const allPassed = results.every(result => result.success);
      Alert.alert(
        'Test Results', 
        allPassed ? 'All tests passed! ✅' : 'Some tests failed ❌'
      );

    } catch (error) {
      Alert.alert('Test Error', `Failed to run tests: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run tests automatically when component mounts
    runTests();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AsyncStorage Integration Test</Text>
      
      <Button 
        title={isRunning ? "Running Tests..." : "Run Tests Again"} 
        onPress={runTests}
        disabled={isRunning}
      />

      <View style={styles.results}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.testResult}>
            <Text style={[styles.operation, result.success ? styles.success : styles.failure]}>
              {result.success ? '✅' : '❌'} {result.operation}
            </Text>
            {result.details && (
              <Text style={styles.details}>{result.details}</Text>
            )}
          </View>
        ))}
      </View>

      {testResults.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Tests: {testResults.filter(r => r.success).length} / {testResults.length} passed
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  results: {
    marginTop: 20,
  },
  testResult: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  operation: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  success: {
    color: '#34C759',
  },
  failure: {
    color: '#FF3B30',
  },
  details: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  summary: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  summaryText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});