import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

const avatars = ['🧠', '🦉', '🚀', '📚', '📝', '🎧'];

type ProfileScreenProps = StackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = React.useState(user?.name ?? '');
  const [fieldOfStudy, setFieldOfStudy] = React.useState(user?.fieldOfStudy ?? '');
  const [university, setUniversity] = React.useState(user?.university ?? '');

  React.useEffect(() => {
    setName(user?.name ?? '');
    setFieldOfStudy(user?.fieldOfStudy ?? '');
    setUniversity(user?.university ?? '');
  }, [user]);

  const handleSave = () => {
    updateProfile({ name, fieldOfStudy, university });
  };

  const renderAvatar = ({ item }: { item: string }) => {
    const isSelected = user?.avatar === item;
    return (
      <TouchableOpacity
        style={[styles.avatarOption, isSelected && styles.avatarSelected]}
        onPress={() => updateProfile({ avatar: item })}
        activeOpacity={0.85}
      >
        <Text style={styles.avatarEmoji}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour {user?.name?.split(' ')[0] ?? 'toi'} 👋</Text>
          <Text style={styles.subtitle}>
            Personnalise ton profil StudyEasy pour retrouver tous tes contenus au même endroit.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avatar</Text>
          <FlatList
            data={avatars}
            renderItem={renderAvatar}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.avatarSeparator} />}
            contentContainerStyle={styles.avatarList}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Prénom et nom</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ton nom"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="words"
                onBlur={handleSave}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Parcours d&apos;études</Text>
              <TextInput
                style={styles.input}
                value={fieldOfStudy}
                onChangeText={setFieldOfStudy}
                placeholder="Licence Sciences cognitives"
                placeholderTextColor={Colors.text.tertiary}
                onBlur={handleSave}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Établissement</Text>
              <TextInput
                style={styles.input}
                value={university}
                onChangeText={setUniversity}
                placeholder="Université"
                placeholderTextColor={Colors.text.tertiary}
                onBlur={handleSave}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveLabel}>Enregistrer les modifications</Text>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="settings-outline" size={24} color={Colors.accent.blue} />
                <View>
                  <Text style={styles.actionLabel}>Paramètres</Text>
                  <Text style={styles.actionDescription}>Gérer notifications, préférences et sécurité</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Subscription')}
              activeOpacity={0.8}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="sparkles-outline" size={24} color={Colors.accent.purple} />
                <View>
                  <Text style={styles.actionLabel}>S&apos;abonner</Text>
                  <Text style={styles.actionDescription}>Accéder à toutes les fonctionnalités premium</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('LegalNotice')}
              activeOpacity={0.8}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="document-text-outline" size={24} color={Colors.accent.teal} />
                <View>
                  <Text style={styles.actionLabel}>Mentions légales</Text>
                  <Text style={styles.actionDescription}>Consulter les informations légales</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('PrivacyPolicy')}
              activeOpacity={0.8}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="shield-checkmark-outline" size={24} color={Colors.accent.green} />
                <View>
                  <Text style={styles.actionLabel}>Politique de confidentialité</Text>
                  <Text style={styles.actionDescription}>Comprendre l&apos;usage de tes données</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
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
    paddingTop: 32,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    gap: 12,
  },
  greeting: {
    ...Typography.title1,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  avatarList: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  avatarSeparator: {
    width: 12,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    borderWidth: 2,
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '12',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Typography.body,
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.accent.blue,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveLabel: {
    ...Typography.headline,
    color: Colors.text.inverse,
  },
  quickActions: {
    gap: 16,
  },
  actionList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionLabel: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  actionDescription: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
});

