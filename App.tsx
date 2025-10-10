import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
}