import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type LoginScreenProps = StackScreenProps<AuthStackParamList, 'Login'>;
type ProviderKey = 'apple' | 'google' | 'email';

const providers: { key: ProviderKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'apple', label: 'Continuer avec Apple', icon: 'logo-apple' },
  { key: 'google', label: 'Continuer avec Google', icon: 'logo-google' },
  { key: 'email', label: 'Continuer avec email', icon: 'mail-outline' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();

  const handleProviderPress = (providerKey: ProviderKey) => {
    if (providerKey === 'email') {
      navigation.navigate('EmailAuth', { mode: 'login' });
      return;
    }

    login(providerKey);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.brand}>StudyEasy</Text>
          <Text style={styles.title}>Ravi de te revoir 👋</Text>
          <Text style={styles.subtitle}>
            Reprends tes révisions là où tu t&apos;es arrêté et continue à faire grandir ton
            savoir.
          </Text>
        </View>

        <View style={styles.actions}>
          {providers.map(provider => (
            <TouchableOpacity
              key={provider.key}
              style={styles.providerButton}
              activeOpacity={0.85}
              onPress={() => handleProviderPress(provider.key)}
            >
              <Ionicons name={provider.icon} size={22} color={Colors.text.primary} />
              <Text style={styles.providerLabel}>{provider.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.footerLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  hero: {
    marginBottom: 48,
  },
  brand: {
    ...Typography.caption1,
    color: Colors.accent.blue,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    ...Typography.title1,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  actions: {
    gap: 16,
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  providerLabel: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  footer: {
    marginTop: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  footerLink: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});

