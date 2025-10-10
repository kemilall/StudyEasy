import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  RootStackParamList,
  MainTabParamList,
  SubjectsStackParamList,
  ProfileStackParamList,
  AuthStackParamList,
} from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { SubjectsListScreen } from '../screens/SubjectsListScreen';
import { SubjectScreen } from '../screens/SubjectScreen';
import { LessonScreen } from '../screens/LessonScreen';
import { ChapterScreen } from '../screens/ChapterScreen';
import { TranscriptionScreen } from '../screens/TranscriptionScreen';
import { FlashcardsScreen } from '../screens/FlashcardsScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AudioImportScreen } from '../screens/AudioImportScreen';
import { CreateSubjectScreen } from '../screens/CreateSubjectScreen';
import { CreateLessonScreen } from '../screens/CreateLessonScreen';
import { CreateChapterScreen } from '../screens/CreateChapterScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { LegalNoticeScreen } from '../screens/LegalNoticeScreen';
import { TermsOfUseScreen } from '../screens/TermsOfUseScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AuthContext } from '../context/AuthContext';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const SubjectsStack = createStackNavigator<SubjectsStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

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

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          ...Typography.headline,
          color: Colors.text.primary,
        },
        headerTintColor: Colors.text.primary,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />
      <ProfileStack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: 'Offres StudyEasy+' }}
      />
      <ProfileStack.Screen
        name="LegalNotice"
        component={LegalNoticeScreen}
        options={{ title: 'Mentions légales' }}
      />
      <ProfileStack.Screen
        name="TermsOfUse"
        component={TermsOfUseScreen}
        options={{ title: "Conditions d'utilisation" }}
      />
      <ProfileStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Politique de confidentialité' }}
      />
    </ProfileStack.Navigator>
  );
};

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
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
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const authValue = React.useMemo(
    () => ({
      login: () => setIsAuthenticated(true),
      logout: () => setIsAuthenticated(false),
    }),
    []
  );

  return (
    <AuthContext.Provider value={authValue}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: Colors.background },
          }}
        >
          {isAuthenticated ? (
            <>
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
                name="AudioImportScreen"
                component={AudioImportScreen}
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="CreateSubjectScreen"
                component={CreateSubjectScreen}
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="CreateLessonScreen"
                component={CreateLessonScreen}
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="CreateChapterScreen"
                component={CreateChapterScreen}
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="ProcessingScreen"
                component={ProcessingScreen}
                options={{
                  presentation: 'modal',
                }}
              />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
};