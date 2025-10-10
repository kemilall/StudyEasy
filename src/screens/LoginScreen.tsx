import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { AuthStackParamList } from '../navigation/types';
import { AuthContext } from '../context/AuthContext';

export type LoginScreenProps = StackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = React.useContext(AuthContext);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showEmailForm, setShowEmailForm] = React.useState(false);

  const handleEmailLogin = () => {
    if (!email || !password) {
      Alert.alert('Informations manquantes', 'Merci de compléter vos identifiants.');
      return;
    }

    login();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>StudyEasy</Text>
        <Text style={styles.title}>Bienvenue !</Text>
        <Text style={styles.subtitle}>
          Retrouvez vos cours, vos révisions et vos progrès en un seul endroit.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={login}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-apple" size={22} color={Colors.surface} />
            <Text style={[styles.socialLabel, styles.socialLabelDark]}>Continuer avec Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={login}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={20} color={Colors.text.primary} />
            <Text style={styles.socialLabel}>Continuer avec Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => setShowEmailForm((prev) => !prev)}
            activeOpacity={0.85}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.text.primary} />
            <Text style={styles.socialLabel}>Se connecter avec un email</Text>
          </TouchableOpacity>
        </View>

        {showEmailForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Connexion par email</Text>
            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor={Colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={Colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleEmailLogin}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonLabel}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  brand: {
    ...Typography.caption1,
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: Colors.accent.blue,
    marginBottom: 12,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  actions: {
    marginTop: 36,
    gap: 16,
  },
  socialButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  socialLabel: {
    ...Typography.headline,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  socialLabelDark: {
    color: Colors.surface,
  },
  appleButton: {
    backgroundColor: Colors.text.primary,
    borderColor: Colors.text.primary,
  },
  googleButton: {
    backgroundColor: Colors.surface,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 4,
  },
  formTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 16,
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: Colors.accent.blue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    ...Typography.headline,
    color: Colors.surface,
  },
  footer: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  link: {
    ...Typography.body,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});

