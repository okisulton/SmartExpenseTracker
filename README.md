# SmartExpenseTracker

![Thumbnail](assets/images/screenshots/thumbnail.png)

An expense tracker app with receipt scanning and AI-powered analysis, built with Expo + React Native.

**Current Version: 2.0.0**

> 🔑 **Note:** This app uses Google Gemini AI for receipt scanning. You need to set up your own API key to use this feature. See [API Key Setup](#api-key-setup) below.

## Version History

### v2.0.0 (Build 3) - 2025-10-31

#### 🤖 Major Features

- ✅ **Google Gemini AI Integration** - Replaced previous AI endpoint with Google Gemini API
  - More accurate receipt OCR and data extraction
  - Enhanced description format: includes items + store name
  - Example output: `"Diapers, milk, noodles at JAYA MART"`
  - Uses `gemini-2.5-flash` model with structured outputs

#### 🔧 Technical Improvements

- ✅ Updated to Expo 54.0.21 and React Native 0.81.5
- ✅ Added React Native URL polyfill for compatibility
- ✅ Enabled React JSX transformation in TypeScript
- ✅ Enhanced error handling and debugging logs for AI processing
- ✅ Improved Android icon configuration

#### 🔒 Security

- ✅ API key management system with `.gitignore` protection
- ✅ Sensitive credentials excluded from version control

#### 📦 Dependencies Updated

- Added: `@google/genai` (v1.28.0), `react-native-url-polyfill` (v3.0.0)
- Updated: Multiple Expo packages and core dependencies
- See [package.json](package.json) for complete list

### v1.1.0 (Build 2)

- ✅ Added seamless app updates (no uninstall required)
- ✅ Improved data migration system
- ✅ Enhanced AI receipt processing
- ✅ Better error handling and stability
- ✅ Added input date in add expense
- ✅ Added filter date range in transaction

### v1.0.0 (Build 1)

- ✅ Initial release
- ✅ Basic expense tracking
- ✅ Receipt scanning with AI
- ✅ Analytics and reporting

## App Updates

**Note:** This app now requires a Google Gemini API key for receipt scanning features.

To build and distribute your own version:

1. Set up your Google Gemini API key (see [API Key Setup](#api-key-setup))
2. Build the app using EAS Build (see [Build with EAS](#build-with-eas))
3. Install the APK on your Android device

**Important Notes:**

- The app stores data locally using AsyncStorage
- Updates preserve all your expense data
- Camera permission is required for receipt scanning

## Quick Links

- [API Key Setup](#api-key-setup)
- [Install APK on Android](#install-apk-on-android)
- [Run for Development](#run-for-development)
- [Features](#features)
- [Data Storage (AsyncStorage)](#data-storage-asyncstorage)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Build with EAS](#build-with-eas)
- [App Permissions](#app-permissions)
- [Screenshots](#screenshots)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## API Key Setup

SmartExpenseTracker uses **Google Gemini AI** for intelligent receipt scanning and data extraction. You need to obtain your own API key to use this feature.

### 🔑 Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the generated API key (starts with `AIza...`)

### 📝 Step 2: Configure the API Key

Create a file `constants/api.ts` in your project with the following content:

```typescript
export const GEMINI_API_KEY = 'YOUR_API_KEY_HERE';
```

Replace `YOUR_API_KEY_HERE` with your actual API key from Step 1.

**Example:**

```typescript
export const GEMINI_API_KEY = 'AIzaSysdjiqNI91herwoLKDS930sjsai';
```

### 🔒 Step 3: Verify Security (Important!)

The `constants/api.ts` file is already added to `.gitignore` to prevent accidentally committing your API key to version control.

**Verify `.gitignore` includes:**

```
constants/api.ts
```

**Security Best Practices:**

- ✅ Never commit API keys to Git repositories
- ✅ Never share your API key publicly
- ✅ Regenerate your key if accidentally exposed
- ✅ Use environment variables for production builds

### 💡 Alternative: Environment Variables (Recommended for Production)

For production apps, use environment variables:

1. Install `react-native-dotenv`:

   ```bash
   npm install react-native-dotenv
   ```
2. Create `.env` file:

   ```
   GEMINI_API_KEY=AIzaSysdjiqNI91herwoLKDS930sjsai
   ```
3. Add `.env` to `.gitignore`:

   ```
   .env
   ```
4. Update `constants/api.ts`:

   ```typescript
   import { GEMINI_API_KEY as ENV_KEY } from '@env';
   export const GEMINI_API_KEY = ENV_KEY || '';
   ```

### 🧪 Step 4: Test the Integration

1. Start the development server:

   ```bash
   npx expo start
   ```
2. Open the app and navigate to **"Scan Receipt"**
3. Take a photo of a receipt or select from gallery
4. The AI should analyze and extract:

   - Amount
   - Description (items + store name)
   - Category

**Expected Output:**

```
Amount: 25000
Description: Diapers, milk, noodles at JAYA MART
Category: Shopping
```

### ⚠️ API Usage Limits

Google Gemini API has free tier limits:

- **Free tier**: 15 requests per minute (RPM)
- **Rate limit**: May vary based on your account

If you exceed limits, you'll see error messages in the app. Consider:

- Upgrading to a paid plan for higher limits
- Implementing request throttling in production

## Install APK on Android

**Note:** You need to build your own APK using EAS Build (see [Build with EAS](#build-with-eas)) after setting up your API key.

1) Build the APK using `npx eas build -p android` (requires EAS account)
2) Download the APK from your EAS build dashboard
3) Open the APK file to install. If your device blocks the installation, enable the following settings based on your Android version:

- Android 8.0 (API 26) and higher:
  - Settings > Apps & notifications > Special app access > Install unknown apps
  - Choose the app you used to download the APK (e.g., your browser)
  - Enable “Allow from this source”
- Android 7.1.1 (API 25) and lower:
  - Settings > Security
  - Enable “Unknown sources”

3) Return to the APK file and proceed with installation.
4) Open the app once installed.
5) Ensure you've configured your Gemini API key (see [API Key Setup](#api-key-setup))

Note:

- On first launch, the app may request Camera/Storage permissions (see [App Permissions](#app-permissions)).
- Receipt scanning requires a valid Google Gemini API key.

## Run for Development

Prereqs: Node.js LTS, npm/yarn/pnpm.

**Important:** You must configure your Google Gemini API key first! See [API Key Setup](#api-key-setup).

- Install dependencies:
  - npm: `npm install`
  - yarn: `yarn`
- Configure API key:
  - Create `constants/api.ts` with your Gemini API key
- Start dev server:
  - `npx expo start`

Relevant project config:

- App config: [app.json](app.json)
- EAS config: [eas.json](eas.json)
- Type definitions: [expo-env.d.ts](expo-env.d.ts)
- Lint & scripts: [package.json](package.json), [eslint.config.js](eslint.config.js)

## Features

- **🤖 AI-Powered Receipt Scanning** - Uses Google Gemini AI for intelligent OCR
  - Automatic amount extraction
  - Smart description generation (items + store name)
  - Category auto-detection
  - Example: `"Diapers, milk, noodles at JAYA MART"` → Category: Shopping
- **📸 Camera Integration** - Capture receipts directly in-app
- **💰 Expense Management** - Add, edit, delete, and categorize expenses
- **📊 Analytics** - Visual insights and category breakdowns
- **📅 Date Filtering** - Filter transactions by date range
- **💾 Local Storage** - All data stored securely on device using AsyncStorage
- **🎨 Modern UI** - Clean, intuitive interface with Expo Router navigation

## Data Storage (AsyncStorage)

The app uses `@react-native-async-storage/async-storage` to persist data locally on the device.

- Storage utilities: [utils/storage.ts](utils/storage.ts)
- Expense store: [hooks/expense-store.ts](hooks/expense-store.ts)
- User preferences store: [hooks/preferences-store.ts](hooks/preferences-store.ts)

Storage keys:

- EXPENSES: `financial_tracker_expenses`
- USER_PREFERENCES: `financial_tracker_preferences`

Available operations (via hooks):

- Expenses: add, update, delete, clear-all, export (JSON), import (JSON)
- Preferences: set currency, theme (light/dark/system), toggle notifications, reset

Utility components (optional, for testing/dev):

- Storage demo: [components/storage-demo.tsx](components/storage-demo.tsx)
- AsyncStorage tests: [components/async-storage-test.tsx](components/async-storage-test.tsx)

## Tech Stack

- ⚛️ React Native + Expo (v54.0.21)
- 🧭 Expo Router (file-based routing)
- 🔄 React Query (TanStack Query)
- 💾 AsyncStorage (local data persistence)
- 📷 Expo Camera + 🖼️ Expo Image Picker
- � Google Gemini AI (`@google/genai` v1.28.0)
- 🔧 react-native-url-polyfill (compatibility layer)
- 🟦 TypeScript (with React JSX transformation)
- 🧪 ESLint config
- 🏗️ EAS Build

## Project Structure

Key files/directories:

- Routing root: [app/_layout.tsx](app/_layout.tsx)
- Not found screen: [app/+not-found.tsx](app/+not-found.tsx)
- Main tabs: [app/(tabs)/index.tsx](app/(tabs)/index.tsx), [app/(tabs)/transactions.tsx](app/(tabs)/transactions.tsx), [app/(tabs)/add-expense.tsx](app/(tabs)/add-expense.tsx), [app/(tabs)/analytics.tsx](app/(tabs)/analytics.tsx)
- Receipt scanning: [app/scan-receipt.tsx](app/scan-receipt.tsx)
- API configuration: `constants/api.ts` (create this file - see [API Key Setup](#api-key-setup))
- Hooks: [hooks/expense-store.ts](hooks/expense-store.ts), [hooks/preferences-store.ts](hooks/preferences-store.ts)
- Types: [types/expense.ts](types/expense.ts)
- Categories constants: [constants/categories.ts](constants/categories.ts)
- Assets: `assets/images/`

## Build with EAS

**Prerequisites:**

- EAS CLI: `npm install -g eas-cli`
- Expo account (create at [expo.dev](https://expo.dev))
- Google Gemini API key configured (see [API Key Setup](#api-key-setup))

**Steps:**

- Login: `npx eas login`
- Configure (first time): `npx eas build:configure`
- Build Android:
  - Development build: `npx eas build -p android --profile development`
  - Production build: `npx eas build -p android --profile production`
  - Or use custom profiles in [eas.json](eas.json)

Build results are available on your Expo dashboard at [expo.dev](https://expo.dev).

**Important:** Make sure `constants/api.ts` is in `.gitignore` before building to avoid exposing your API key.

## App Permissions

- Camera: capture/scan receipts in-app
- Storage/Media: read/save receipt images (varies by Android version)

Permissions are requested when the related features are first used.

## Screenshots

- Home/Dashboard:
  ![Home](assets/images/screenshots/home.png)
- Transactions List:
  ![Transactions](assets/images/screenshots/transactions.png)
- Receipt Scanning:
  ![Scan Receipt](assets/images/screenshots/scan-receipt.png)
- AI Receipt Analysis:
  ![Analyze Receipt](assets/images/screenshots/ai-analyzing.png)
- OCR/Extraction Result:
  ![OCR Result](assets/images/screenshots/ocr-result.png)
- Add Expense
  ![Add Expense](assets/images/screenshots/add-expense.png)
- Analytics:
  ![Analytics](assets/images/screenshots/analytics.png)

---

## Contributing

Contributions are welcome! Please ensure:

- Your Google Gemini API key is in `constants/api.ts` (never commit this file)
- Follow the existing code style and patterns
- Test receipt scanning functionality before submitting PRs

## Troubleshooting

### Receipt Scanning Issues

- **"AI response was empty"**:

  - Check your API key in `constants/api.ts`
  - Verify your Gemini API quota at [Google AI Studio](https://aistudio.google.com/)
  - Check network connection
  - Try taking a clearer photo with better lighting
- **"Error processing receipt"**:

  - Ensure receipt is flat and in focus
  - Check Camera permission is enabled
  - Try uploading from gallery instead of camera
  - Verify API key is valid and not expired

### Installation Issues

- **"App not installed"**:
  - Ensure "Install unknown apps"/"Unknown sources" is enabled per your Android version.
  - Uninstall previous versions (if signed differently) and try again.

### Development Issues

- **"Cannot find module 'constants/api.ts'"**:

  - Create the file with your Gemini API key (see [API Key Setup](#api-key-setup))
- **Download issues**:

  - Try a different browser or network.
- **Camera not working while scanning**:

  - Ensure Camera permission is enabled in Settings > Apps > SmartExpenseTracker > Permissions.

## License

This project is open source under the MIT License. See [LICENSE](LICENSE) for details.
