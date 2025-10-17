import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';
import { BackgroundWaves } from '../components/BackgroundWaves';

interface SignUpScreenProps {
  navigation: any;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !displayName.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
    } catch (error: any) {
      Alert.alert('Erreur de création de compte', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundWaves opacity={0.05} color={Colors.primaryLavender} />
      <LinearGradient
        colors={[Colors.surface, Colors.surfaceAlt]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Ionicons name="school" size={48} color={Colors.accent.blue} />
                <Text style={styles.title}>StudyEasy</Text>
                <Text style={styles.subtitle}>Créez votre compte</Text>
              </View>

              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  placeholderTextColor={Colors.text.secondary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Adresse email"
                  placeholderTextColor={Colors.text.secondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor={Colors.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={Colors.text.secondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={[styles.signUpButton, isLoading && styles.disabledButton]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <Text style={styles.signUpButtonText}>
                    {isLoading ? 'Création...' : 'Créer le compte'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={navigateToLogin} style={styles.loginLink}>
                <Text style={styles.loginText}>
                  Déjà un compte ? <Text style={styles.loginTextBold}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.xl,
    padding: 24,
    marginBottom: 24,
    ...DesignTokens.shadows.md,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: DesignTokens.radii.md,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
  },
  signUpButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: DesignTokens.radii.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 56,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    ...Typography.headline,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  loginTextBold: {
    ...Typography.body,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});
