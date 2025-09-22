import { EXPENSE_CATEGORIES, getCategoryById } from '@/constants/categories';
import { useExpenses } from '@/hooks/expense-store';
import { ExpenseCategory } from '@/types/expense';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Check, Image as ImageIcon, Sparkles, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExtractedExpenseData {
  amount: number;
  description: string;
  category: ExpenseCategory;
  imageUri: string;
}

export default function ScanReceiptScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedExpenseData | null>(null);
  const [editedAmount, setEditedAmount] = useState<string>('');
  const [editedDescription, setEditedDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const { addExpense } = useExpenses();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.permissionGradient}
        >
          <Camera color="white" size={64} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan receipts and extract expense information automatically.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  const processReceiptImage = async (imageUri: string) => {
    // Validate input
    if (!imageUri || !imageUri.trim()) {
      console.error('Invalid image URI provided');
      return;
    }
    
    if (imageUri.length > 1000) {
      console.error('Image URI too long');
      return;
    }
    
    const sanitizedUri = imageUri.trim();
    
    setIsProcessing(true);
    try {
      console.log('Processing receipt image:', sanitizedUri);

      // Convert image to base64
      const response = await fetch(sanitizedUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.readAsDataURL(blob);
      });

      // Call AI API to extract expense information
      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant that extracts expense information from receipt images. 

Analyze the image and return ONLY a valid JSON object with this exact structure:
{
  "amount": <number>,
  "description": "<string>",
  "category": "<string>"
}

Rules:
- amount: Extract the total amount as a number (e.g., 25.99, not "$25.99")
- description: Brief description of the purchase (e.g., "Grocery shopping", "Coffee", "Gas station")
- category: Must be one of: food, transport, shopping, entertainment, bills, health, education, travel, other

If you cannot clearly read the receipt:
- Use a reasonable default amount like 10.00
- Use "Receipt expense" as description
- Use "other" as category

Return ONLY the JSON object, no other text.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract expense information from this receipt image and return only the JSON object.'
                },
                {
                  type: 'image',
                  image: base64
                }
              ]
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API Error:', errorText);
        throw new Error(`AI service error: ${aiResponse.status}`);
      }

      const aiResult = await aiResponse.json();
      console.log('AI Response:', aiResult.completion);

      // Clean and parse the AI response
      let expenseData;
      try {
        // Remove any markdown formatting or extra text
        let cleanResponse = aiResult.completion.trim();
        
        // Find JSON object in the response
        const jsonMatch = cleanResponse.match(/\{[^}]*\}/s);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
        
        // Remove any code block markers
        cleanResponse = cleanResponse.replace(/```json\s*|```\s*/g, '');
        
        console.log('Cleaned AI response:', cleanResponse);
        expenseData = JSON.parse(cleanResponse);
        
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', aiResult.completion);
        
        // Fallback: create a default expense
        expenseData = {
          amount: 10.00,
          description: 'Receipt expense (AI parsing failed)',
          category: 'other'
        };
      }

      // Validate and sanitize the data
      let amount = parseFloat(expenseData.amount);
      if (isNaN(amount) || amount <= 0) {
        console.warn('Invalid amount detected, using default');
        amount = 10.00;
      }

      const validCategories = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'travel', 'other'];
      const categoryId = validCategories.includes(expenseData.category) ? expenseData.category : 'other';
      const category = getCategoryById(categoryId);
      
      const description = (expenseData.description && typeof expenseData.description === 'string') 
        ? expenseData.description.trim() 
        : 'Receipt expense';

      console.log('Processed expense data:', { amount, description, category: category.name });

      // Show confirmation modal instead of directly adding expense
      const finalExpenseData: ExtractedExpenseData = {
        amount,
        description,
        category,
        imageUri: sanitizedUri,
      };
      
      setExtractedData(finalExpenseData);
      setEditedAmount(amount.toString());
      setEditedDescription(description);
      setSelectedCategory(category);
      setShowConfirmation(true);

    } catch (error) {
      console.error('Error processing receipt:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // For now, we'll just log the error and reset the image
      // In a production app, you might want to show an alert or toast
      alert(`Error processing receipt: ${errorMessage}`);
      
      setCapturedImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const confirmAndSaveExpense = () => {
    if (!extractedData) return;

    const finalAmount = parseFloat(editedAmount) || extractedData.amount;
    const finalDescription = editedDescription.trim() || extractedData.description;
    const finalCategory = selectedCategory || extractedData.category;

    addExpense({
      amount: finalAmount,
      description: finalDescription,
      category: finalCategory,
      date: new Date().toISOString(),
      imageUri: extractedData.imageUri,
      isAIGenerated: true,
    });

    // Reset all states
    setShowConfirmation(false);
    setExtractedData(null);
    setCapturedImage(null);
    setEditedAmount('');
    setEditedDescription('');
    setSelectedCategory(null);
    
    router.push('/transactions');
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setExtractedData(null);
    setEditedAmount('');
    setEditedDescription('');
    setSelectedCategory(null);
  };

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <LinearGradient
                colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                style={styles.processingGradient}
              >
                <ActivityIndicator size="large" color="white" />
                <Sparkles color="white" size={32} />
                <Text style={styles.processingTitle}>AI is analyzing your receipt...</Text>
                <Text style={styles.processingText}>This may take a few seconds</Text>
              </LinearGradient>
            </View>
          )}
          
          {!isProcessing && (
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => setCapturedImage(null)}
              >
                <Text style={styles.previewButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.previewButton, styles.primaryButton]}
                onPress={() => processReceiptImage(capturedImage)}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.primaryButtonGradient}
                >
                  <Sparkles color="white" size={20} />
                  <Text style={styles.primaryButtonText}>Process with AI</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Confirmation Modal */}
        <Modal
          visible={showConfirmation}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={cancelConfirmation}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 32 }]}>
              <TouchableOpacity onPress={cancelConfirmation}>
                <X color="#666" size={24} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Confirm Expense</Text>
              <TouchableOpacity onPress={confirmAndSaveExpense}>
                <Check color="#667eea" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.confirmationSection}>
                <View style={styles.aiIndicator}>
                  <Sparkles color="#667eea" size={16} />
                  <Text style={styles.aiIndicatorText}>Generated by AI</Text>
                </View>

                {/* Receipt Image Preview */}
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: capturedImage }} style={styles.receiptThumbnail} />
                </View>

                {/* Amount */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Amount</Text>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={editedAmount}
                      onChangeText={setEditedAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholder="Enter description"
                    multiline
                  />
                </View>

                {/* Category */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {EXPENSE_CATEGORIES.map((category: ExpenseCategory) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          selectedCategory?.id === category.id && styles.categoryOptionSelected
                        ]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text style={[
                          styles.categoryIcon,
                          selectedCategory?.id === category.id && styles.categoryIconSelected
                        ]}>
                          {category.icon}
                        </Text>
                        <Text style={[
                          styles.categoryName,
                          selectedCategory?.id === category.id && styles.categoryNameSelected
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelConfirmation}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={confirmAndSaveExpense}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.saveButtonGradient}
                >
                  <Check color="white" size={20} />
                  <Text style={styles.saveButtonText}>Save Expense</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Header */}
        <View style={[styles.cameraHeader, { paddingTop: insets.top + 32 }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Scan Receipt</Text>
          <TouchableOpacity 
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Camera color="white" size={24} />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsBox}>
            <Sparkles color="#667eea" size={24} />
            <Text style={styles.instructionsTitle}>AI Receipt Scanner</Text>
            <Text style={styles.instructionsText}>
              Position the receipt in the frame and tap the capture button. 
              AI will automatically extract the amount, description, and category.
            </Text>
          </View>
        </View>

        {/* Camera Controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <ImageIcon color="white" size={24} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <View style={styles.placeholder} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  instructionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  processingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 16,
  },
  previewButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    flex: 1,
  },
  confirmationSection: {
    padding: 20,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
    gap: 6,
  },
  aiIndicatorText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  receiptPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  receiptThumbnail: {
    width: 120,
    height: 160,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingVertical: 16,
  },
  descriptionInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 50,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryOption: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    minWidth: 80,
  },
  categoryOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryIconSelected: {
    opacity: 1,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});