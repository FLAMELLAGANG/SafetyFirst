# SafetyFirst - Emergency Response App

A mobile-first emergency response application that enables citizens to quickly report emergencies with precise location data, photos, and detailed descriptions.

## Problem & Solution

Problem: In emergency situations, every second counts. Traditional emergency response systems often suffer from delays in reporting, lack of precise location data, and insufficient information for responders to prepare adequately before arriving at the scene.
Solution: Safety-first is a mobile-first emergency response application that enables citizens to quickly report emergencies with precise location data, photos, and detailed descriptions. The system connects citizens with registered emergency responders who can receive real-time alerts and respond faster with better preparation.


## 🚀 Getting Started with SafetyFirst in VS Code

This guide will help you set up and run the SafetyFirst emergency response app on your machine using VS Code and Expo mobile preview.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **VS Code** - [Download here](https://code.visualstudio.com/)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Expo Go app** on your mobile device (iOS/Android)

## 🛠️ Installation Steps

### 1. Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone <url for SafetyFirst>
cd project
```

### 2. Open in VS Code

**Option 1: From Terminal**
```bash
code .
```

**Option 2: From VS Code**
- Open VS Code
- File → Open Folder
- Select the `project` directory

### 3. Install Dependencies

In VS Code, open the integrated terminal (Ctrl+` or View → Terminal) and run:

```bash
npm install
```

This will install all required packages. This may take several minutes.

### 4. Install VS Code Extensions (Recommended)

For the best development experience, install these VS Code extensions:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript and JavaScript Language Features** - Enhanced TypeScript support
- **React Native Tools** - React Native debugging and IntelliSense

### 5. Configure Environment Variables

The project uses Supabase for backend services. The environment variables are already configured in:
- `eas.json` (for EAS builds)
- `app.json` (for app configuration)

No additional `.env` setup is required for development.

## 📱 Running the App in Expo Mobile Preview

### Step 1: Start the Development Server

In your VS Code terminal, run:

```bash
npm run dev
```

You should see output similar to:

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
› Web is waiting on http://localhost:8081
```

### Step 2: Connect Your Mobile Device

**For Android:**
1. Download **Expo Go** from Google Play Store
2. Make sure your phone and computer are on the same WiFi network
3. Open Expo Go app
4. Scan the QR code displayed in your terminal

**For iOS:**
1. Download **Expo Go** from App Store  
2. Make sure your phone and computer are on the same WiFi network
3. Open your Camera app and scan the QR code displayed in your terminal
4. Tap the notification to open in Expo Go

### Step 3: The App Will Load

The SafetyFirst app will now load on your mobile device with full functionality!

## 🌐 Alternative Preview Options

### Web Preview
Press `w` in the terminal to open in your web browser at `http://localhost:8081`

### Android Emulator
Press `a` in the terminal (requires Android Studio setup)

### iOS Simulator  
Press `i` in the terminal (Mac only, requires Xcode)

## 📱 App Features

Once running, you can explore:

- **Emergency Reporting** - Tap SOS button to report emergencies
- **GPS Location** - Automatic location capture
- **Photo Upload** - Add incident photos
- **First Aid Guides** - Access emergency medical instructions
- **Contact Management** - Store emergency contacts
- **Real-time Notifications** - Get instant alerts

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for web
npm run build:web

# Run linter
npm run lint

# Type checking
npm run typecheck
```

## 🐛 Troubleshooting

### Metro bundler issues
```bash
npx expo start -c
```

### Clear cache
```bash
npx expo start --clear
```

### Dependency issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### QR code not scanning
- Ensure your device and computer are on the same network
- Try using the manual URL: `exp://192.168.x.x:8081`
- Check firewall settings

## 📦 Building APK for Android

To build a standalone APK file:

```bash
# Install EAS CLI (first time only)
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

The build will take 15-30 minutes. You'll receive a download link when complete.

## 🏗️ Project Structure

```
project4/
├── app/                    # Main application screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── emergency/         # Emergency reporting
│   └── profile/           # User profile
├── assets/                # Images and icons
├── constants/             # Theme and configuration
├── lib/                   # Utilities (auth, supabase)
├── eas.json              # Build configuration
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## 🆘 Getting Help

If you encounter issues:

1. Check the terminal output for error messages
2. Ensure all dependencies are installed (`npm install`)
3. Verify your network connection for mobile preview
4. Check Expo status: https://status.expo.dev/

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)

---

**Happy coding! 🎉**
