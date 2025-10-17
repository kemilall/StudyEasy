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

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const { signIn } = useAuth();

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsEmailLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Erreur de connexion', error.message || 'Une erreur est survenue');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      // TODO: Implémenter la connexion Google
      Alert.alert('Info', 'Connexion Google - Fonctionnalité à implémenter');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la connexion Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    try {
      // TODO: Implémenter la connexion Apple
      Alert.alert('Info', 'Connexion Apple - Fonctionnalité à implémenter');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la connexion Apple');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp');
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
                <Text style={styles.subtitle}>Apprenez plus efficacement</Text>
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton, isAppleLoading && styles.disabledButton]}
                  onPress={handleAppleLogin}
                  disabled={isAppleLoading}
                >
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text style={styles.socialButtonText}>
                    {isAppleLoading ? 'Connexion...' : 'Continuer avec Apple'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton, isGoogleLoading && styles.disabledButton]}
                  onPress={handleGoogleLogin}
                  disabled={isGoogleLoading}
                >
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text style={[styles.socialButtonText, { color: Colors.text.primary }]}>
                    {isGoogleLoading ? 'Connexion...' : 'Continuer avec Google'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email/Password Form */}
              <View style={styles.formContainer}>
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

                <TouchableOpacity
                  style={[styles.loginButton, (isLoading || isEmailLoading) && styles.disabledButton]}
                  onPress={handleEmailLogin}
                  disabled={isLoading || isEmailLoading}
                >
                  <Text style={styles.loginButtonText}>
                    {isEmailLoading ? 'Connexion...' : 'Se connecter'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={navigateToSignUp} style={styles.signUpLink}>
                <Text style={styles.signUpText}>
                  Pas de compte ? <Text style={styles.signUpTextBold}>Créer un compte</Text>
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
    marginBottom: 48,
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
  socialContainer: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: DesignTokens.radii.lg,
    gap: 12,
    minHeight: 56,
  },
  appleButton: {
    backgroundColor: Colors.text.primary,
  },
  googleButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialButtonText: {
    ...Typography.headline,
    color: 'white',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.small,
    color: Colors.text.secondary,
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  loginButton: {
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
  loginButtonText: {
    ...Typography.headline,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    ...Typography.small,
    color: Colors.accent.blue,
    textDecorationLine: 'underline',
  },
  signUpLink: {
    alignItems: 'center',
  },
  signUpText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  signUpTextBold: {
    ...Typography.body,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});
