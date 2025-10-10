import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type SettingsScreenProps = StackScreenProps<ProfileStackParamList, 'Settings'>;

type SettingsItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | boolean;
  isToggle?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [studyRemindersEnabled, setStudyRemindersEnabled] = React.useState(false);
  const [language, setLanguage] = React.useState<'Français' | 'Anglais' | 'Espagnol'>('Français');

  const handleLanguagePress = () => {
    Alert.alert("Langue de l'application", 'Choisis la langue de StudyEasy', [
      { text: 'Français', onPress: () => setLanguage('Français') },
      { text: 'Anglais', onPress: () => setLanguage('Anglais') },
      { text: 'Espagnol', onPress: () => setLanguage('Espagnol') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handlePasswordReset = () => {
    Alert.alert(
      'Sécurité',
      "Nous allons t'envoyer un email pour réinitialiser ton mot de passe.",
      [
        {
          text: 'Envoyer',
          onPress: () =>
            Linking.openURL(
              'mailto:support@studyeasy.app?subject=Réinitialisation%20mot%20de%20passe'
            ),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleContact = () => Linking.openURL('mailto:contact@studyeasy.app');
  const handleHelp = () => Linking.openURL('https://studyeasy.app/aide');
  const handleDataRequest = () =>
    Linking.openURL("mailto:privacy@studyeasy.app?subject=Demande%20d'accès%20aux%20données");

  const settingsSections: SettingsSection[] = [
    {
      title: 'Compte',
      items: [
        {
          icon: 'mail-outline',
          label: 'Adresse email',
          value: user?.email ?? 'Non renseignée',
        },
        {
          icon: 'key-outline',
          label: 'Mettre à jour mon mot de passe',
          onPress: handlePasswordReset,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notifications push',
          isToggle: true,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          icon: 'alarm-outline',
          label: "Rappels d'étude quotidiens",
          isToggle: true,
          value: studyRemindersEnabled,
          onToggle: setStudyRemindersEnabled,
        },
        {
          icon: 'language-outline',
          label: "Langue de l'application",
          value: language,
          onPress: handleLanguagePress,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: "Centre d'aide",
          onPress: handleHelp,
        },
        {
          icon: 'chatbubble-outline',
          label: 'Contacter le support',
          onPress: handleContact,
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Gestion des données',
          onPress: handleDataRequest,
        },
        {
          icon: 'document-text-outline',
          label: 'Mentions légales',
          onPress: () => navigation.navigate('LegalNotice'),
        },
        {
          icon: 'newspaper-outline',
          label: 'Politique de confidentialité',
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
      ],
    },
    {
      title: 'Abonnement',
      items: [
        {
          icon: 'card-outline',
          label: 'Gérer mon abonnement',
          onPress: () => navigation.navigate('Subscription'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <Text style={styles.subtitle}>Personnalise StudyEasy selon tes besoins</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={`${section.title}-${item.label}`}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.onPress}
                  disabled={item.isToggle}
                  activeOpacity={item.isToggle ? 1 : 0.7}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={Colors.text.secondary}
                    />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  {item.isToggle ? (
                    <Switch
                      value={Boolean(item.value)}
                      onValueChange={value => item.onToggle?.(value)}
                      trackColor={{
                        false: Colors.gray[300],
                        true: Colors.accent.blue,
                      }}
                      thumbColor={Colors.surface}
                    />
                  ) : (
                    <View style={styles.settingRight}>
                      {typeof item.value === 'string' && (
                        <Text style={styles.settingValue}>{item.value}</Text>
                      )}
                      {item.onPress && (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={Colors.text.tertiary}
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={logout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2025 StudyEasy</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...Typography.footnote,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  logoutButton: {
    backgroundColor: Colors.accent.red + '15',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    ...Typography.headline,
    color: Colors.accent.red,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  version: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
    marginBottom: 4,
  },
  copyright: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
  },
});

