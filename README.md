Safety-first - Emergency Response App
Problem & Solution
Problem: In emergency situations, every second counts. Traditional emergency response systems often suffer from delays in reporting, lack of precise location data, and insufficient information for responders to prepare adequately before arriving at the scene.
Solution: Safety-first is a mobile-first emergency response application that enables citizens to quickly report emergencies with precise location data, photos, and detailed descriptions. The system connects citizens with registered emergency responders who can receive real-time alerts and respond faster with better preparation.
Key Features:
•	One-Tap SOS Reporting: Instant emergency alerts with categorized emergency types (cardiac arrest, stroke, trauma, fire, etc.)
•	Precise Location Tracking: Automatic GPS location capture with reverse geocoding
•	Photo Evidence: Capture and upload incident photos for responders
•	Real-time Notifications: Instant alerts to nearby emergency responders
•	First Aid Guidance: Built-in first aid instructions for common emergencies
•	Dual User Roles: Support for both citizens (reporters) and emergency responders
•	Contact Management: Emergency contacts and quick access to help

Setup Instructions
Prerequisites
•	Node.js (v18 or higher)
•	npm or yarn
•	Expo CLI
•	A Supabase account (for backend services)
•	iOS Simulator (Mac) or Android Emulator, or a physical device with Expo Go app
Installation
1.	Clone the repository
2.	git clone <your-repository-url>
3.	cd project4
4.	Install dependencies
5.	npm install
Opening in VS Code
Option 1: From Terminal
code .
Option 2: From VS Code
•	Open VS Code
•	File → Open Folder
•	Select the project4 directory
Recommended VS Code Extensions for this Project:
•	ESLint - JavaScript/TypeScript linting
•	Prettier - Code formatting
•	TypeScript and JavaScript Language Features - Enhanced TypeScript support
•	React Native Tools - React Native debugging and IntelliSense
•	Expo - Expo-specific tooling support
•	GitLens - Git integration and blame information
VS Code Configuration: The project includes a .prettierrc file for consistent code formatting. Ensure your VS Code settings are configured to use Prettier as the default formatter for TypeScript and TypeScript React files.
Debugging in VS Code:
1.	Install the "React Native Tools" extension
2.	Set up a launch configuration in .vscode/launch.json:
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Expo",
      "request": "launch",
      "type": "reactnativedirect",
      "cwd": "${workspaceFolder}",
      "enableDebug": true
    }
  ]
}
3.	Start the Expo dev server (npm run dev)
4.	Press F5 or use the Run and Debug panel to start debugging
ONLY IF THE DATABASE IS DOWN ONLY CONFIGURE SUPABASE WHEN IT IS DOWN 
Configure Supabase
Create a new project in Supabase and set up the following:
•	Database Tables: Run the SQL scripts in the supabase/ directory to create required tables
•	Environment Variables: Copy .env.example to .env and add your Supabase credentials:
•	EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
•	EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
Required tables include:
•	profiles (user profiles)
•	emergencies (emergency reports)
•	contacts (emergency contacts)
•	first_aid_guides (first aid instructions)
4.	Set up Storage
In Supabase, create a storage bucket named incident-photos with public access enabled for storing emergency photos.
Running the Application
Development Mode
npm run dev
This will start the Expo development server. You can then:
•	For Mobile Preview:
o	Download the Expo Go app on your mobile device
o	Scan the QR code displayed in the terminal
o	The app will load on your device with full mobile functionality
•	For Web Preview:
o	Press w in the terminal to open in web browser
o	Or press Shift + w to open in a new browser window
•	For iOS Simulator (Mac only):
o	Press i in the terminal
o	Requires Xcode to be installed
•	For Android Emulator:
o	Press a in the terminal
o	Requires Android Studio and emulator to be set up
Building for Production
Web Build:
npm run build:web
iOS Build:
eas build --platform ios
Android Build:
eas build --platform android
Project Structure
project4/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── emergency/         # Emergency reporting
│   └── profile/           # User profile management
├── assets/                # Images and static assets
├── constants/             # Theme constants and configurations
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries (auth, supabase)
├── supabase/              # Database schema and migrations
├── types/                 # TypeScript type definitions
└── .env                   # Environment variables (not in git)
Available Scripts
•	npm run dev - Start Expo development server
•	npm run build:web - Build for web production
•	npm run lint - Run ESLint
•	npm run typecheck - Run TypeScript type checking
Troubleshooting
Metro bundler issues:
npx expo start -c
Clear cache:
npx expo start --clear
Dependency issues:
rm -rf node_modules package-lock.json
npm install
Tech Stack
•	Framework: React Native with Expo
•	Navigation: Expo Router
•	Backend: Supabase (PostgreSQL, Auth, Storage)
•	Styling: React Native StyleSheet with Expo Linear Gradient
•	Icons: Lucide React Native
•	State Management: React Context API
•	TypeScript: Full type safety
License
This project is private and confidential.

