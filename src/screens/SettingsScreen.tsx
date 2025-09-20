import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

type ToggleSettingsItem = {
  icon: string;
  label: string;
  isToggle: true;
  value: boolean;
  onToggle: (value: boolean) => void;
};

type ActionSettingsItem = {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
};

type SettingsItem = ToggleSettingsItem | ActionSettingsItem;

export const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const settingsSections: Array<{ title: string; items: SettingsItem[] }> = [
    {
      title: 'Compte',
      items: [
        {
          icon: 'person-outline',
          label: 'Profil',
          value: 'Étudiant',
          onPress: () => {},
        },
        {
          icon: 'mail-outline',
          label: 'Email',
          value: 'etudiant@example.com',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          isToggle: true,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          icon: 'moon-outline',
          label: 'Mode sombre',
          isToggle: true,
          value: darkModeEnabled,
          onToggle: setDarkModeEnabled,
        },
        {
          icon: 'language-outline',
          label: 'Langue',
          value: 'Français',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Aide',
          onPress: () => {},
        },
        {
          icon: 'chatbubble-outline',
          label: 'Contact',
          onPress: () => {},
        },
        {
          icon: 'document-text-outline',
          label: 'Conditions d\'utilisation',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
                  onPress={'onPress' in item ? item.onPress : undefined}
                  disabled={'isToggle' in item}
                  activeOpacity={'isToggle' in item ? 1 : 0.7}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={24} 
                      color={Colors.text.secondary} 
                    />
                    <Text style={styles.settingLabel}>{item.label}</Text>
                  </View>
                  {'isToggle' in item ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ 
                        false: Colors.gray[300], 
                        true: Colors.accent.blue 
                      }}
                      thumbColor={Colors.surface}
                    />
                  ) : (
                    <View style={styles.settingRight}>
                      {'value' in item && item.value && (
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

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8}>
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
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
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
