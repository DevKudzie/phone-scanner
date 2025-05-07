# Phone Scanner

This project provides a document scanning solution consisting of a cross-platform mobile app and a Python-based server. The app allows you to scan documents with your phone's camera and send them directly to your computer over WiFi.

## Components

### 1. Mobile App (React Native with Expo)
- Scan documents with your phone camera
- Multi-page scanning capability
- Auto-discovery of the server on your local network
- Send scanned documents as PDF to your computer

### 2. Server (Python Flask)
- Receives scanned documents from the mobile app
- Provides a web interface to view uploaded documents
- Automatically converts images to PDF if needed

## Setup Instructions

### Server Setup (Computer)

1. Ensure you have Python 3.7+ installed
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```
3. Run the server:
   ```
   python server.py
   ```
4. Note the Network URL displayed in the terminal (e.g., `http://192.168.1.100:5000`)
5. Access the server status page by opening the URL in your browser

### Mobile App Setup

1. Ensure you have Node.js and npm installed
2. Install Expo CLI globally:
   ```
   npm install -g expo-cli
   ```
3. Navigate to the PhoneScanner directory:
   ```
   cd PhoneScanner
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Start the expo development server:
   ```
   npx expo start
   ```
6. Use the Expo Go app on your iOS/Android device to scan the QR code

## Usage

1. Start the server on your computer
2. Launch the mobile app on your phone
3. Make sure both devices are on the same WiFi network
4. In the app, tap on "Settings" and enter the server IP address if it's not automatically discovered
5. Tap "Start Scanning" to scan documents
6. After scanning, tap "Done" to preview
7. In the preview screen, tap "Send as PDF" to transfer to your computer
8. The document will be saved in the `uploads` folder on your computer

## Troubleshooting

- If auto-discovery doesn't work, manually enter the server IP address in the app settings
- If you're having connection issues, check that both devices are on the same WiFi network
- Check the server console for any error messages

## Technical Details

- The mobile app is built with React Native and Expo
- Camera permissions are required for scanning
- Network permissions are required for sending files
- The server runs on port 5000 by default
- Files are saved in the `uploads` directory relative to where the server is run 