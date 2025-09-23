import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList, MainTabParamList, SubjectsStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { SubjectsListScreen } from '../screens/SubjectsListScreen';
import { SubjectScreen } from '../screens/SubjectScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { ChapterScreen } from '../screens/ChapterScreen';
import { TranscriptionScreen } from '../screens/TranscriptionScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AudioImportScreen } from '../screens/AudioImportScreen';
import { CreateSubjectScreen } from '../screens/CreateSubjectScreen';
import { CreateLessonScreen } from '../screens/CreateLessonScreen';
import { CreateChapterScreen } from '../screens/CreateChapterScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const SubjectsStack = createStackNavigator<SubjectsStackParamList>();

const SubjectsStackNavigator = () => {
  return (
    <SubjectsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <SubjectsStack.Screen name="SubjectsList" component={SubjectsListScreen} />
      <SubjectsStack.Screen name="Subject" component={SubjectScreen} />
      <SubjectsStack.Screen name="Lesson" component={LessonScreen} />
    </SubjectsStack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.accent.blue,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.gray[200],
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          ...Typography.caption1,
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Subjects"
        component={SubjectsStackNavigator}
        options={{
          tabBarLabel: 'Matières',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'book' : 'book-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Paramètres',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Chapter" component={ChapterScreen} />
      <Stack.Screen 
        name="Transcription" 
        component={TranscriptionScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Flashcards" 
        component={FlashcardsScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Quiz" 
        component={QuizScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="AudioImport" 
        component={AudioImportScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="CreateSubject" 
        component={CreateSubjectScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="CreateLesson" 
        component={CreateLessonScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="CreateChapter" 
        component={CreateChapterScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="ProcessingScreen" 
        component={ProcessingScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent.blue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};