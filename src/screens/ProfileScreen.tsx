import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';
import { useAuth } from '../contexts/AuthContext';

const AVATARS = [
  { id: '1', emoji: '👨‍🎓', name: 'Étudiant' },
  { id: '2', emoji: '👩‍🎓', name: 'Étudiante' },
  { id: '3', emoji: '🧠', name: 'Génie' },
  { id: '4', emoji: '📚', name: 'Intellectuel' },
  { id: '5', emoji: '🚀', name: 'Explorateur' },
  { id: '6', emoji: '⭐', name: 'Star' },
  { id: '7', emoji: '🔥', name: 'Motivé' },
  { id: '8', emoji: '💡', name: 'Créatif' },
];

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { userProfile, signOut, updateProfile } = useAuth();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar || AVATARS[0].id);

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    updateProfile({ avatar: avatarId });
    setShowAvatarModal(false);
  };

  const handleNameChange = () => {
    if (newDisplayName.trim()) {
      updateProfile({ displayName: newDisplayName.trim() });
      setNewDisplayName('');
      setShowNameModal(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        },
      ]
    );
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  const navigateToSubscription = () => {
    navigation.navigate('Subscription');
  };

  const currentAvatar = AVATARS.find(avatar => avatar.id === selectedAvatar) || AVATARS[0];

  const profileStats = [
    { label: 'Matières créées', value: '12', icon: 'book-outline' },
    { label: 'Leçons étudiées', value: '47', icon: 'school-outline' },
    { label: 'Temps d\'étude', value: '23h', icon: 'time-outline' },
    { label: 'Série en cours', value: '7 jours', icon: 'flame-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowAvatarModal(true)}
          >
            <Text style={styles.avatarEmoji}>{currentAvatar.emoji}</Text>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{currentAvatar.name}</Text>
        </View>

        {/* User Info */}
        <View style={styles.infoSection}>
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => setShowNameModal(true)}
          >
            <Ionicons name="person-outline" size={24} color={Colors.accent.blue} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nom</Text>
              <Text style={styles.infoValue}>{userProfile?.displayName || 'Utilisateur'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={24} color={Colors.accent.blue} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userProfile?.email || 'Non disponible'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Vos statistiques</Text>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons name={stat.icon as any} size={24} color={Colors.accent.blue} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings Link */}
        <TouchableOpacity style={styles.settingsLink} onPress={navigateToSettings}>
          <Ionicons name="settings-outline" size={24} color={Colors.accent.blue} />
          <Text style={styles.settingsText}>Paramètres</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>

        {/* Subscription Section */}
        <View style={styles.subscriptionSection}>
          <Text style={styles.sectionTitle}>Abonnement</Text>
          <TouchableOpacity style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>Plan actuel</Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            </View>
            <Text style={styles.subscriptionDescription}>
              Accès illimité à toutes les fonctionnalités
            </Text>
            <TouchableOpacity style={styles.manageButton} onPress={navigateToSubscription}>
              <Text style={styles.manageButtonText}>Gérer l'abonnement</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal visible={showAvatarModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarGrid}>
              {AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    selectedAvatar === avatar.id && styles.selectedAvatar,
                  ]}
                  onPress={() => handleAvatarSelect(avatar.id)}
                >
                  <Text style={styles.avatarOptionEmoji}>{avatar.emoji}</Text>
                  <Text style={styles.avatarOptionName}>{avatar.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Name Change Modal */}
      <Modal visible={showNameModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer le nom</Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.nameInput}
              value={newDisplayName}
              onChangeText={setNewDisplayName}
              placeholder="Nouveau nom"
              placeholderTextColor={Colors.text.secondary}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleNameChange}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.accent.blue,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarName: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.xl,
    marginBottom: 24,
    ...DesignTokens.shadows.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    ...Typography.small,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.lg,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    ...DesignTokens.shadows.sm,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.accent.blue,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  settingsLink: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...DesignTokens.shadows.md,
  },
  settingsText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    marginLeft: 16,
  },
  subscriptionSection: {
    marginBottom: 32,
  },
  subscriptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.xl,
    padding: 20,
    ...DesignTokens.shadows.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  premiumBadge: {
    backgroundColor: Colors.accent.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignTokens.radii.full,
  },
  premiumText: {
    ...Typography.small,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  subscriptionDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  manageButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: DesignTokens.radii.md,
    padding: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    ...Typography.body,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: Colors.accent.red + '15',
    borderRadius: DesignTokens.radii.xl,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  signOutText: {
    ...Typography.headline,
    color: Colors.accent.red,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: DesignTokens.radii.xl,
    borderTopRightRadius: DesignTokens.radii.xl,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  avatarOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: DesignTokens.radii.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: '20%',
  },
  selectedAvatar: {
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '10',
  },
  avatarOptionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  avatarOptionName: {
    ...Typography.small,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: DesignTokens.radii.md,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    ...Typography.body,
  },
  saveButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: DesignTokens.radii.md,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.headline,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
});
