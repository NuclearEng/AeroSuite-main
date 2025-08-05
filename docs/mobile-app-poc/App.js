import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Mock store for demonstration purposes
import store from './redux/store';

// Auth related screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';

// Main app screens
import DashboardScreen from './screens/DashboardScreen';
import InspectionsScreen from './screens/inspections/InspectionsScreen';
import ConductInspectionScreen from './screens/inspections/ConductInspectionScreen';
import SuppliersScreen from './screens/suppliers/SuppliersScreen';
import SupplierDetailScreen from './screens/suppliers/SupplierDetailScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';

// Create navigation stacks
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const InspectionStack = createStackNavigator();
const SupplierStack = createStackNavigator();

// Authentication stack
const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

// Inspection stack
const InspectionStackNavigator = () => (
  <InspectionStack.Navigator>
    <InspectionStack.Screen name="InspectionsList" component={InspectionsScreen} options={{ title: 'Inspections' }} />
    <InspectionStack.Screen name="ConductInspection" component={ConductInspectionScreen} options={{ title: 'Conduct Inspection' }} />
  </InspectionStack.Navigator>
);

// Supplier stack
const SupplierStackNavigator = () => (
  <SupplierStack.Navigator>
    <SupplierStack.Screen name="SuppliersList" component={SuppliersScreen} options={{ title: 'Suppliers' }} />
    <SupplierStack.Screen name="SupplierDetail" component={SupplierDetailScreen} options={{ title: 'Supplier Details' }} />
  </SupplierStack.Navigator>
);

// Main tab navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Dashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Inspections') {
          iconName = focused ? 'clipboard' : 'clipboard-outline';
        } else if (route.name === 'Suppliers') {
          iconName = focused ? 'business' : 'business-outline';
        } else if (route.name === 'Notifications') {
          iconName = focused ? 'notifications' : 'notifications-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: '#1976d2',
      inactiveTintColor: 'gray',
    }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Inspections" component={InspectionStackNavigator} />
    <Tab.Screen name="Suppliers" component={SupplierStackNavigator} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main app component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Loading AeroSuite...</Text>
      </View>
    );
  }

  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <MainStack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              <MainStack.Screen name="Main" component={TabNavigator} />
            ) : (
              <MainStack.Screen name="Auth" component={AuthStackNavigator} />
            )}
          </MainStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
}); 