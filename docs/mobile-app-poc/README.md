# AeroSuite Mobile App POC

This directory contains a proof-of-concept (POC) implementation for the AeroSuite mobile
application, as described in the feasibility study. This POC demonstrates key technical aspects of
the proposed mobile app integration.

## Overview

The POC implements a React Native application that showcases the following key features:

1. __Authentication Flow__
   - Login/Registration screens
   - JWT token management
   - Secure token storage

2. __Core Navigation__
   - Tab-based navigation
   - Stack navigation for detailed views
   - Authentication state management

3. __Offline Capabilities__
   - Request queueing system
   - Local data storage
   - Synchronization mechanism

4. __Native Device Features__
   - Camera integration for inspections
   - Location services
   - Barcode scanning

5. __Inspection Workflow__
   - Mobile-optimized inspection interface
   - Photo capture and annotation
   - Offline inspection capabilities

## Project Structure

```bash
mobile-app-poc/
├── App.js                 # Main application entry point
├── screens/               # Application screens
│   ├── auth/              # Authentication screens
│   ├── inspections/       # Inspection-related screens
│   └── suppliers/         # Supplier-related screens
├── services/              # API and utility services
│   ├── api.js             # API service with offline support
│   └── offlineQueue.js    # Offline request queue management
└── redux/                 # State management (placeholder)
```bash

## Technical Implementation Details

### Authentication

The POC implements JWT-based authentication with secure token storage using AsyncStorage. Token
refresh mechanisms are included to handle token expiration.

### API Integration

The API service (`services/api.js`) provides:
- RESTful API communication
- Request/response interceptors
- Error handling
- Offline request queueing

### Offline Support

Offline capabilities are implemented through:
- Network status detection
- Request queueing (`services/offlineQueue.js`)
- Local data persistence
- Conflict resolution strategy

### Inspection Workflow

The inspection workflow (`screens/inspections/ConductInspectionScreen.js`) demonstrates:
- Checklist functionality
- Photo capture and management
- Defect recording
- Offline data collection
- Location tagging
- Barcode scanning

## Getting Started

To run this POC:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Use an emulator or scan the QR code with Expo Go app

## Next Steps

This POC validates the technical feasibility of the proposed mobile app integration. Based on the
successful implementation of key features, we recommend proceeding with Phase 1 development as
outlined in the feasibility study.

Key findings from this POC:
- React Native provides sufficient access to native device features
- Offline capabilities can be reliably implemented
- The existing API architecture is compatible with mobile requirements
- The inspection workflow can be optimized for mobile use

## Dependencies

- React Native
- Expo
- React Navigation
- AsyncStorage
- NetInfo
- Expo Camera
- Expo Location
- Expo BarCodeScanner
