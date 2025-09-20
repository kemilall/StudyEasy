import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Colors } from './src/constants/colors';

const RootNavigation = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent.blue} />
      </View>
    );
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigation />
    </AuthProvider>
  );
}
