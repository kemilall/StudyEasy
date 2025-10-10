import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type EmailAuthScreenProps = StackScreenProps<AuthStackParamList, 'EmailAuth'>;

export const EmailAuthScreen: React.FC<EmailAuthScreenProps> = ({ route, navigation }) => {
  const { mode } = route.params;
  const { login } = useAuth();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const isSignUp = mode === 'signup';

  const handleSubmit = () => {
    if (!email || !password || (isSignUp && !fullName)) {
      Alert.alert('Informations manquantes', 'Merci de compléter tous les champs obligatoires.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Mot de passe', 'Les mots de passe ne correspondent pas.');
      return;
    }

    login('email', {
      name: fullName || 'Étudiant StudyEasy',
      email,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brand}>StudyEasy</Text>
            <Text style={styles.title}>
              {isSignUp ? 'Créer un compte avec ton email' : 'Connexion avec ton email'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Quelques informations pour personnaliser ton expérience.'
                : 'Entre tes identifiants StudyEasy pour retrouver tes cours.'}
            </Text>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.field}>
                <Text style={styles.label}>Prénom et nom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Alex Étudiant"
                  placeholderTextColor={Colors.text.tertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>
              <TextInput
                style={styles.input}
                placeholder="prenom@exemple.com"
                placeholderTextColor={Colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType={isSignUp ? 'newPassword' : 'password'}
              />
            </View>

            {isSignUp && (
              <View style={styles.field}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.tertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  textContentType="newPassword"
                />
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={handleSubmit}>
            <Text style={styles.submitLabel}>
              {isSignUp ? "Créer mon compte" : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() =>
              navigation.navigate(isSignUp ? 'Login' : 'SignUp')
            }
          >
            <Text style={styles.secondaryLabel}>
              {isSignUp
                ? 'Déjà inscrit ? Se connecter'
                : "Pas de compte ? Créer un compte"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  brand: {
    ...Typography.caption1,
    color: Colors.accent.blue,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    ...Typography.title2,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  form: {
    gap: 24,
  },
  field: {
    gap: 8,
  },
  label: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Typography.body,
    color: Colors.text.primary,
  },
  submitButton: {
    marginTop: 40,
    backgroundColor: Colors.accent.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitLabel: {
    ...Typography.headline,
    color: Colors.text.inverse,
  },
  secondaryAction: {
    marginTop: 24,
    alignItems: 'center',
  },
  secondaryLabel: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});

