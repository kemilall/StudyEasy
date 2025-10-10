import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

const plans = [
  {
    id: 'monthly',
    title: 'Mensuel',
    price: '12,99€ / mois',
    description: 'Idéal pour tester StudyEasy en toute flexibilité.',
    features: ['Accès illimité aux transcriptions', 'Flashcards et quiz personnalisés', 'Assistance prioritaire'],
  },
  {
    id: 'yearly',
    title: 'Annuel',
    price: '119,99€ / an',
    badge: '2 mois offerts',
    description: 'La formule la plus avantageuse pour progresser toute l’année.',
    features: ['Toutes les fonctionnalités du plan mensuel', 'Ateliers live exclusifs', 'Partage des révisions avec ton groupe'],
  },
  {
    id: 'lifetime',
    title: 'À vie',
    price: '349€ en une fois',
    description: 'Investissement unique pour les apprenant·e·s déterminés.',
    features: ['Mises à jour à vie', 'Espace de stockage étendu', 'Support VIP 24/7'],
  },
];

export const SubscriptionScreen: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = React.useState<string>('yearly');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>S&apos;abonner à StudyEasy</Text>
        <Text style={styles.subtitle}>
          Choisis la formule qui te correspond pour débloquer toute la puissance de ton assistant
          d&apos;apprentissage.
        </Text>

        <View style={styles.planList}>
          {plans.map(plan => {
            const isSelected = plan.id === selectedPlan;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                activeOpacity={0.9}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  {plan.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
                <View style={styles.featureList}>
                  {plan.features.map(feature => (
                    <View key={feature} style={styles.featureItem}>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'checkmark-circle-outline'}
                        size={20}
                        color={isSelected ? Colors.accent.green : Colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          isSelected && { color: Colors.text.primary },
                        ]}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
          <Text style={styles.ctaLabel}>Continuer avec l&apos;offre {selectedPlan === 'yearly' ? 'annuelle' : selectedPlan === 'monthly' ? 'mensuelle' : 'à vie'}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          En poursuivant, tu acceptes les conditions générales de vente et la politique de
          confidentialité de StudyEasy. Le renouvellement est automatique sauf annulation.
        </Text>
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
  title: {
    ...Typography.title1,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  planList: {
    gap: 20,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },
  planCardSelected: {
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '10',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
  },
  badge: {
    backgroundColor: Colors.accent.green + '33',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    ...Typography.caption1,
    color: Colors.accent.green,
    fontWeight: '600',
  },
  planPrice: {
    ...Typography.title2,
    color: Colors.text.primary,
  },
  planDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    flex: 1,
  },
  ctaButton: {
    backgroundColor: Colors.accent.blue,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaLabel: {
    ...Typography.headline,
    color: Colors.text.inverse,
  },
  disclaimer: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});

