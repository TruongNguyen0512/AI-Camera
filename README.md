

# Guide to Building and Running React Native App
This project is built with React Native and Expo. The following instructions will help you build and run the app on both Android and iOS devices.

## System Requirements

- Node.js (latest version)
- Expo CLI
- EAS CLI
- Xcode (for iOS)
- Android Studio (for Android)

## Setup the Project

First, make sure you have installed Expo CLI and EAS CLI:
```sh 
npm install -g expo-cli
npm install -g eas-cli
```
Log in to your Expo account:
```sh 
expo login  
eas login    
```

## 1. Install Dependencies

Navigate to the root directory of the project and run the following command to install all the necessary dependencies:
```sh 
npm install
```
## 2. iOS Specific Setup
If you are building for iOS, you may need to install CocoaPods dependencies:
```sh 
cd ios
pod install
cd ..
```

Make sure you have CocoaPods installed. If not, you can install it using:
sudo gem install cocoapods

## Running the App on Android
### 1. Enable USB Debugging on Your Android Device
To enable USB Debugging on your Android device:
- Go to Settings > About phone.
- Tap Build number seven times to unlock Developer options.
- Go back to Settings and select Developer options.
Enable USB Debugging.
### 2. Build the Project
Navigate to the android folder and run the Gradle command to build the app:
```sh 
cd android
./gradlew build
```
### 3. Install the App on an Android Device
Use adb to install the built APK file onto your Android device:
```sh 
adb install -r /path/to/your/app.apk
Check the connected Android devices:
adb devices
```
### 4. Configure Connection for Expo
Run the following command to set up a reverse connection between your device and computer:
```sh 
adb reverse tcp:8081 tcp:8081
```
### 5. Start Expo
## Run the app with Expo:
```sh 
npx expo start
```
Running the App on iOS
### 1. Build the iOS Project
Use eas build to build the app for iOS:
```sh 
eas build --platform ios
```
### 2. Open the Project in Xcode
If you want to run the app on an iOS simulator or a physical iPhone:
```sh 
npx expo run:ios
```
Or open directly in Xcode:

Open Xcode.
Navigate to the ios folder of your project.
Open the YourProject.xcworkspace file.
### 3. Run the App on iOS Simulator
In Xcode, select an iOS simulator from the device selection menu.
Click the Run button (the green triangle) to run the app on the simulator.
### 4. Run the App on a Physical iPhone
Connect your iPhone to your computer using a USB cable.
In Xcode, select your iPhone from the device list.
Click Run to install and run the app on your iPhone.
#Using EAS CLI to Build the App
## 1. Configure EAS Build
Create a configuration file for EAS Build:
```sh 
eas build:configure
```
## 2. Build the App with EAS
Build the app for iOS or Android:

## iOS:
```sh 
eas build --platform ios
```
## Android:
```sh 
eas build --platform android
```
## 3. Check the Build Results
Once the build process is complete, you will receive a link to download the build file (APK for Android or IPA for iOS).
Running the App on an iPhone
Install the App via TestFlight: Use TestFlight to distribute and install the app for testing.
Install the App via Xcode: Connect your iPhone to your computer and use Xcode to directly install the app on the device.
