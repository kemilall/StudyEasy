import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileStackParamList } from '../navigation/types';

const plans = [
  {
    id: 'monthly',
    title: 'Mensuel',
    price: '7,99€',
    description: 'Flexibilité maximale, résiliable à tout moment.',
    perks: ['Fiches intelligentes illimitées', 'Quiz personnalisés', 'Support standard'],
  },
  {
    id: 'semester',
    title: 'Semestriel',
    price: '39,99€',
    description: 'Idéal pour un semestre complet, -15% sur le prix mensuel.',
    perks: ['Fiches + Quiz illimités', 'Synthèse audio des chapitres', 'Assistant IA prioritaire'],
    highlight: true,
  },
  {
    id: 'yearly',
    title: 'Annuel',
    price: '69,99€',
    description: 'Préparez toute l’année avec le meilleur tarif.',
    perks: ['Fonctionnalités premium complètes', 'Statistiques avancées', 'Support VIP 24h'],
  },
];

export type SubscriptionScreenProps = StackScreenProps<ProfileStackParamList, 'Subscription'>;

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = () => {
  const [selectedPlan, setSelectedPlan] = React.useState<string>('semester');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Étendre mon accès</Text>
          <Text style={styles.subtitle}>
            Choisissez l’offre qui correspond à votre rythme d’apprentissage et profitez des
            outils premium StudyEasy.
          </Text>
        </View>

        <View style={styles.planContainer}>
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.9}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  {plan.highlight && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeLabel}>Populaire</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                <View style={styles.perks}>
                  {plan.perks.map((perk) => (
                    <View key={perk} style={styles.perkRow}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
                      <Text style={styles.perkLabel}>{perk}</Text>
                    </View>
                  ))}
                </View>
                {isSelected && (
                  <View style={styles.selectionFooter}>
                    <Ionicons name="checkbox" size={20} color={Colors.accent.blue} />
                    <Text style={styles.selectionLabel}>Offre sélectionnée</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9}>
          <Text style={styles.primaryButtonLabel}>Confirmer mon abonnement</Text>
        </TouchableOpacity>
        <Text style={styles.legalNote}>
          En validant, vous acceptez le renouvellement automatique. Gérez vos abonnements à tout
          moment depuis les paramètres du profil.
        </Text>
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
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
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
  planContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 2,
  },
  planCardSelected: {
    borderColor: Colors.accent.blue,
    shadowOpacity: 0.08,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
  },
  badge: {
    backgroundColor: Colors.accent.blue + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLabel: {
    ...Typography.caption1,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  planPrice: {
    ...Typography.title1,
    color: Colors.text.primary,
  },
  planDescription: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  perks: {
    gap: 8,
    marginTop: 8,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  perkLabel: {
    ...Typography.body,
    color: Colors.text.primary,
  },
  selectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  selectionLabel: {
    ...Typography.subheadline,
    color: Colors.accent.blue,
  },
  primaryButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    ...Typography.headline,
    color: Colors.surface,
  },
  legalNote: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

