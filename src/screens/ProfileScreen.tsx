import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileStackParamList } from '../navigation/types';
import { AuthContext } from '../context/AuthContext';

const avatarOptions = ['🎓', '📚', '🧠', '🚀', '💡', '📝'];

export type ProfileScreenProps = StackScreenProps<ProfileStackParamList, 'ProfileHome'>;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { logout } = React.useContext(AuthContext);
  const [selectedAvatar, setSelectedAvatar] = React.useState<string>(avatarOptions[0]);
  const [displayName, setDisplayName] = React.useState('Étudiant(e) motivé(e)');
  const [bio, setBio] = React.useState(
    'Préparation du semestre en sciences sociales et passionné(e) de productivité.'
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mon profil</Text>
          <Text style={styles.subtitle}>
            Personnalisez votre espace et gérez vos préférences StudyEasy.
          </Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Avatar</Text>
          <View style={styles.avatarRow}>
            {avatarOptions.map((emoji) => {
              const isSelected = emoji === selectedAvatar;
              return (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                  onPress={() => setSelectedAvatar(emoji)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.avatarLabel}>{emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Informations</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nom affiché</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Accès rapide</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.85}
          >
            <Ionicons name="star" size={24} color={Colors.accent.orange} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>S'abonner à StudyEasy+</Text>
              <Text style={styles.actionSubtitle}>
                Débloquez les fiches premium, les quiz illimités et l'assistance prioritaire.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.85}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.accent.blue} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Paramètres</Text>
              <Text style={styles.actionSubtitle}>
                Notifications, langue et documents légaux disponibles ici.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>Support & légalité</Text>
          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('LegalNotice')}
            >
              <Text style={styles.linkLabel}>Mentions légales</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('TermsOfUse')}
            >
              <Text style={styles.linkLabel}>Conditions d'utilisation</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Text style={styles.linkLabel}>Politique de confidentialité</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={22} color={Colors.accent.red} />
          <Text style={styles.logoutLabel}>Se déconnecter</Text>
        </TouchableOpacity>
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
    paddingTop: 24,
    paddingBottom: 40,
    gap: 32,
  },
  header: {
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
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 4,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '15',
  },
  avatarLabel: {
    fontSize: 28,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  field: {
    marginTop: 16,
    gap: 8,
  },
  fieldLabel: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  input: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 16,
    ...Typography.body,
    color: Colors.text.primary,
  },
  multilineInput: {
    textAlignVertical: 'top',
    height: 112,
  },
  quickActions: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 2,
  },
  actionContent: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  actionSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  helpSection: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 2,
  },
  linksContainer: {
    gap: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  linkLabel: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logoutLabel: {
    ...Typography.headline,
    color: Colors.accent.red,
  },
});

