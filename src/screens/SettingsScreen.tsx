import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileStackParamList } from '../navigation/types';

type SettingsScreenProps = StackScreenProps<ProfileStackParamList, 'Settings'>;

type ToggleSettingItem = {
  type: 'toggle';
  icon: string;
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
};

type NavigationSettingItem = {
  type: 'link';
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
};

type SettingItem = ToggleSettingItem | NavigationSettingItem;

type SettingsSection = {
  title: string;
  items: SettingItem[];
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [language, setLanguage] = React.useState<'Français' | 'Anglais'>('Français');

  const handleLanguageChange = () => {
    setLanguage((prev) => (prev === 'Français' ? 'Anglais' : 'Français'));
  };

  const openHelpCenter = async () => {
    const url = 'https://support.studyeasy.app';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Centre d'aide", "Impossible d'ouvrir le centre d'aide pour le moment.");
    }
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@studyeasy.app');
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Notifications',
      items: [
        {
          type: 'toggle',
          icon: 'notifications-outline',
          label: 'Notifications push',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          type: 'link',
          icon: 'language-outline',
          label: "Langue de l'interface",
          value: language,
          onPress: handleLanguageChange,
        },
        {
          type: 'link',
          icon: 'card-outline',
          label: 'Gérer mon abonnement',
          onPress: () => navigation.navigate('Subscription'),
        },
      ],
    },
    {
      title: 'Support & légal',
      items: [
        {
          type: 'link',
          icon: 'help-circle-outline',
          label: "Centre d'aide",
          onPress: openHelpCenter,
        },
        {
          type: 'link',
          icon: 'chatbubble-outline',
          label: 'Contacter le support',
          onPress: contactSupport,
        },
        {
          type: 'link',
          icon: 'document-text-outline',
          label: 'Mentions légales',
          onPress: () => navigation.navigate('LegalNotice'),
        },
        {
          type: 'link',
          icon: 'shield-checkmark-outline',
          label: 'Politique de confidentialité',
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
        {
          type: 'link',
          icon: 'document-lock-outline',
          label: "Conditions d'utilisation",
          onPress: () => navigation.navigate('TermsOfUse'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <Text style={styles.subtitle}>
          Ajustez vos préférences de notifications, de langue et accédez à vos documents légaux.
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.type === 'toggle' ? undefined : item.onPress}
                  disabled={item.type === 'toggle'}
                  activeOpacity={item.type === 'toggle' ? 1 : 0.7}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={Colors.text.secondary}
                    />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{
                        false: Colors.gray[300],
                        true: Colors.accent.blue,
                      }}
                      thumbColor={Colors.surface}
                    />
                  ) : (
                    <View style={styles.settingRight}>
                      {item.value && (
                        <Text style={styles.settingValue}>{item.value}</Text>
                      )}
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={Colors.text.tertiary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

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
    paddingBottom: 12,
    gap: 8,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body,
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

