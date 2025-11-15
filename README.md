# Skin Sight - AI-Powered Skin Analysis Mobile App

A React Native mobile application that uses AI to analyze skin conditions and provides personalized recommendations based on environmental factors including UV index, air quality, and weather data.

## ✨ Features

### Core Functionality
- **📸 Real-time Skin Analysis**: Capture selfies and get instant AI-powered skin condition analysis
- **🎯 Skin Classification**: Identifies skin conditions including acne, dry, oily, and normal skin types
- **⚠️ Risk Assessment**: Calculates risk levels (Low, Medium, High) based on analysis confidence
- **🌍 Environmental Integration**: Incorporates location data, UV index, air quality (AQI), and weather conditions
- **💾 History Tracking**: Save and review past analyses with timestamps and images
- **🔐 User Authentication**: Secure Firebase authentication with email/password signup and login
- **👤 User Profiles**: Manage user information and view analysis history

### Analysis Features
- **AI Suggestions**: GenAI-powered recommendations for skincare
- **Rule-based Suggestions**: Evidence-based skincare tips based on detected conditions
- **Image Validation**: Ensures quality photos before analysis
- **Cloud Image Storage**: Uploads analyzed images to Cloudinary for cloud storage

## 🛠️ Tech Stack

### Frontend
- **React Native** with **Expo** for cross-platform development
- **TypeScript** for type safety
- **Expo Router** for file-based routing and navigation
- **React Navigation** for screen navigation

### Backend & Services
- **Firebase Authentication** for user management
- **Firestore** for real-time database and history storage
- **Cloudinary** for image hosting and management
- **Expo Camera** for capturing photos
- **Expo Location** for geolocation services

### External APIs
- **Custom Python Backend** (via ngrok) for skin analysis predictions
- **Weather & AQI API** for environmental data

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gurusanjay2322/SkingSight_Mobile
   cd skinsight_mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```
   EXPO_PUBLIC_BACKEND_URL=https://your-ngrok-url.ngrok-free.app/api
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## 🔑 Key Services

### [Authentication Service](src/services/authService.ts)
Handles user registration, login, and profile management with Firebase.

### [API Service](src/services/api.ts)
Manages communication with the backend for skin validation and analysis predictions.

### [Result Service](src/services/resultService.ts)
Saves and retrieves analysis results from Firestore database.

### [Storage Service](src/utils/storage.ts)
Handles local and cloud storage of history items using AsyncStorage and Firestore.

### [Location Service](src/utils/location.ts)
Retrieves user's current location coordinates for environmental analysis.

### [Image Upload](src/utils/cloudinary.ts)
Uploads analyzed images to Cloudinary for cloud storage.

## 📱 Screen Navigation

| Screen | Purpose |
|--------|---------|
| [Home](src/screens/HomeScreen.tsx) | Main entry point, sign in/up, camera launch |
| [Camera](src/screens/CameraScreen.tsx) | Capture selfies with face detection guidance |
| [Preview](src/screens/PreviewScreen.tsx) | Review captured photo before analysis |
| [Results](src/screens/ResultsScreen.tsx) | Display analysis results with recommendations |
| [History](src/screens/HistoryScreen.tsx) | View past analyses and results |
| [Login](src/screens/LoginScreen.tsx) | User authentication |
| [SignUp](src/screens/SignUpScreen.tsx) | New user registration |
| [Profile](src/screens/ProfileScreen.tsx) | User profile management |

## 🎨 UI Components

- [PrimaryButton](src/components/PrimaryButton.tsx) - Reusable primary action button
- [InfoCard](src/components/InfoCard.tsx) - Display information with icons and colors
- [Loader](src/components/Loader.tsx) - Loading state indicator

## 🔐 Security & Permissions

### Required Permissions
- **Camera**: Capture skin analysis photos
- **Location**: Get coordinates for environmental data
- **Photo Library**: Save and access images

### Firestore Rules
The app implements role-based security rules where users can only access their own data:
```
- Users can read/write their own profile data
- Users can read/write their own history subcollection
```

See [firestore.rules](firestore.rules) for complete security rules.

## 🎨 Color System

Risk-based color coding throughout the app:
- 🟢 **Green**: Low risk (AQI 0-50, UV 0-2)
- 🟡 **Amber**: Medium risk (AQI 50-100, UV 2-5)
- 🟠 **Orange**: High risk (AQI 100-150, UV 5-7)
- 🔴 **Red**: Very High risk (AQI 150-200, UV 7-10)
- 🟣 **Purple**: Extreme risk (AQI 200+, UV 10+)

See [color utilities](src/utils/colors.ts) for detailed color mappings.

## 🏗️ Project Structure

```
src/
├── screens/              # Screen components
├── services/             # API and business logic services
├── contexts/             # React contexts (Auth)
├── components/           # Reusable UI components
├── utils/                # Utility functions (colors, storage, location)
├── types/                # TypeScript type definitions
└── navigation/           # App navigation setup
```

## 📊 Data Types

### [HistoryItem](src/types/index.ts)
Stores user's analysis records with predictions and confidence scores.

### [AnalyzeResponse](src/types/index.ts)
Backend response containing skin predictions, risk levels, and environmental data.

### [UserData](src/services/authService.ts)
User profile information stored in Firestore.

## 🚀 Build & Deploy

### For Production
```bash
npm run reset-project  # Clean up example files
```

### Android Build
```bash
npm run android
```

### iOS Build
```bash
npm run ios
```

## 🔧 Configuration

### Firebase Setup
Update [firebase.js](firebase.js) with your Firebase project credentials.

### App Configuration
See [app.json](app.json) for Expo and platform-specific settings including:
- Camera permissions (iOS/Android)
- Location permissions
- App icons and splash screens
- Build-time environment variables

## 📚 API Response Format

### Skin Analysis Response
```json
{
  "predicted_class": "acne",
  "confidence": 0.96,
  "risk_level": "High",
  "rule_based_suggestions": ["Use sunscreen..."],
  "genai_suggestions": [],
  "weather": {
    "aqi": 170,
    "uv_index": 6.75,
    "city": "Location Name",
    "temp_min": 11.3,
    "temp_max": 27.2
  }
}
```

## 🐛 Troubleshooting

### Backend Connection Issues
- Ensure ngrok URL is correct in `.env`
- For physical devices, use your computer's local IP: `http://192.168.x.x:5000`
- For Android emulator, use: `http://10.0.2.2:5000`
- For iOS simulator, use: `http://localhost:5000`

### Firestore Permission Errors
- Check Firestore security rules in [firestore.rules](firestore.rules)
- Ensure user is authenticated before database operations

### Camera/Location Permission Denials
- Grant permissions when prompted
- Check app settings on device for permission status

## 📝 License

This project is proprietary and confidential.

## 🤝 Contributing

For development and contributions, follow the TypeScript and React Native best practices outlined in the codebase.

---

**Version**: 1.0.0  
**Platform**: iOS, Android  
**Language**: TypeScript + React Native
