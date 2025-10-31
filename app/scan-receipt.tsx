import { GEMINI_API_KEY } from '@/constants/api';
import { EXPENSE_CATEGORIES, getCategoryById } from '@/constants/categories';
import { useExpenses } from '@/hooks/expense-store';
import { ExpenseCategory } from '@/types/expense';
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Check, Image as ImageIcon, Sparkles, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
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

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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
    if (!imageUri || !imageUri.trim()) {
      console.error('Invalid image URI provided');
      return;
    }
    
    const sanitizedUri = imageUri.trim();
    
    setIsProcessing(true);
    try {
      console.log('Processing receipt image:', sanitizedUri);

      // Convert image to base64
      const response = await fetch(sanitizedUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });

      console.log('Sending request to Gemini 2.5 Flash...');

      // Use Gemini 2.5 Flash (latest stable model)
      // Disable thinking mode for OCR tasks to avoid token consumption
      const result = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64,
                },
              },
              {
                text: `You are an AI assistant specialized in extracting expense information from receipt images.

Analyze this receipt image carefully and extract the following information:

1. **amount**: The total amount paid (as a number, without currency symbols)
   - Look for "Total", "Amount Due", "Grand Total", or similar labels
   - Return just the number (e.g., 25.99, not "$25.99")
   - If multiple totals are present, use the largest amount
   - Use Indonesian currency format (e.g., 15000, 25000.50)

2. **description**: A detailed description combining items purchased and store name
   - **Format**: "[Items] at [Store Name]"
   - **Items**: List the main items purchased (2-4 most significant items)
     * For groceries: "Diapers, milk, noodles at JAYA MART"
     * For restaurants: "Coffee, croissant at Starbucks"
     * For shopping: "T-shirt, jeans at Uniqlo"
     * For single items: "Premium gasoline at Shell"
   - **If items are unclear**: Use general category + store
     * "Groceries at Whole Foods"
     * "Meal at McDonald's"
     * "Fuel at BP Station"
   - **If store name is unclear**: Use items only
     * "Diapers, milk, bread"
     * "Coffee and pastry"
   - Keep concise but descriptive (5-10 words max)

3. **category**: The most appropriate expense category
   - Choose ONE of: food, transport, shopping, entertainment, bills, health, education, travel, other
   - Examples:
     * Restaurants, cafes, groceries → "food"
     * Uber, taxi, gas, parking → "transport"
     * Clothing, electronics, general retail → "shopping"
     * Movies, concerts, games → "entertainment"
     * Utilities, phone, internet → "bills"
     * Pharmacy, doctor, gym → "health"
     * Books, courses, school supplies → "education"
     * Hotels, flights, tours → "travel"
     * Anything else → "other"

**CRITICAL INSTRUCTIONS:**
- If the receipt is unclear or unreadable, use these defaults:
  * amount: 10.00
  * description: "Receipt expense"
  * category: "other"
- Extract information accurately from the receipt
- You MUST respond with ONLY a valid JSON object
- Do NOT include any markdown formatting, code blocks, or extra text
- Do NOT wrap the JSON in \`\`\`json or any other markers
- The response must be PURE JSON that can be parsed directly

**Required JSON format (respond with ONLY this, nothing else):**
{"amount": 25.99, "description": "Starbucks Coffee", "category": "food"}`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.2, // Lower temperature for consistent/accurate extraction
          topP: 0.8,
          topK: 20,
          maxOutputTokens: 1024, // Increased to accommodate thinking tokens + actual response
          // Note: Gemini 2.5 Flash has thinking mode that uses tokens
          // Increased maxOutputTokens ensures we have enough for actual response
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
          ],
        },
      });

      console.log('Received response from Gemini');
      console.log('Full response object:', JSON.stringify(result, null, 2));

      // Debug: Check response structure
      if (result.candidates && result.candidates.length > 0) {
        console.log('Candidates:', result.candidates);
        console.log('First candidate:', result.candidates[0]);
      }

      // Extract text from response
      const aiResult = result.text || '';
      console.log('AI Response text:', aiResult);
      console.log('AI Response length:', aiResult.length);

      // Parse structured JSON output (should be clean JSON thanks to schema)
      let expenseData;
      
      // Check if we have a valid response
      if (!aiResult || aiResult.trim().length === 0) {
        console.error('❌ Empty response from AI');
        
        // Check for safety/prompt feedback
        if (result.promptFeedback) {
          console.error('Prompt feedback:', result.promptFeedback);
        }
        
        // Use fallback
        expenseData = {
          amount: 10.00,
          description: 'Receipt expense (Empty AI response)',
          category: 'other',
        };
      } else {
        try {
          // Clean the response (remove markdown code blocks if present)
          let cleanedResult = aiResult.trim();
          
          // Remove markdown code blocks
          cleanedResult = cleanedResult.replace(/```json\s*/g, '');
          cleanedResult = cleanedResult.replace(/```\s*/g, '');
          
          // Try to extract JSON object if there's extra text
          const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedResult = jsonMatch[0];
          }
          
          console.log('Cleaned response:', cleanedResult);
          
          expenseData = JSON.parse(cleanedResult);
          console.log('✅ Parsed expense data:', expenseData);
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          console.error('Raw response:', aiResult);
          
          // Fallback to default values
          expenseData = {
            amount: 10.00,
            description: 'Receipt expense (AI parsing failed)',
            category: 'other',
          };
        }
      }

      // Validate and sanitize the extracted data
      let amount = parseFloat(expenseData.amount);
      if (isNaN(amount) || amount <= 0) {
        console.warn('⚠️ Invalid amount detected, using default');
        amount = 10.00;
      }

      const validCategories = EXPENSE_CATEGORIES.map(c => c.id);
      const categoryId = validCategories.includes(expenseData.category) 
        ? expenseData.category 
        : 'other';
      const category = getCategoryById(categoryId);
      
      const description = (expenseData.description && typeof expenseData.description === 'string') 
        ? expenseData.description.trim() 
        : 'Receipt expense';

      console.log('✅ Final processed data:', { amount, description, category: category.name });

      // Show confirmation modal with extracted data
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
      console.error('💥 Error processing receipt:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Provide user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error processing receipt: ${errorMessage}\n\nPlease try again with a clearer image.\n\nTips:\n- Ensure good lighting\n- Receipt should be flat and in focus\n- Try uploading from gallery instead`);
      
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
            <View style={[styles.modalHeader, { paddingTop: insets.top + 20 }]}>
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
        <View style={[styles.cameraHeader, { paddingTop: insets.top + 20 }]}>
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