import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: 'pour toujours',
    description: 'Parfait pour commencer',
    features: [
      '3 matières maximum',
      'Enregistrement audio basique',
      'Transcription automatique',
      '5 fiches par leçon',
      'Quiz basiques',
    ],
    limitations: [
      'Stockage limité',
      'Pas de sauvegarde cloud',
      'Pas d\'export PDF',
      'Support communautaire seulement',
    ],
    popular: false,
    color: Colors.text.secondary,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '4,99€',
    period: 'par mois',
    description: 'Le plus populaire',
    features: [
      'Matières illimitées',
      'Enregistrement audio avancé',
      'Transcription premium',
      'Fiches illimitées',
      'Quiz personnalisés',
      'Sauvegarde cloud',
      'Export PDF',
      'Support prioritaire',
      'Statistiques avancées',
    ],
    limitations: [],
    popular: true,
    color: Colors.accent.green,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,99€',
    period: 'par mois',
    description: 'Pour les étudiants avancés',
    features: [
      'Tout du Premium',
      'Collaboration en équipe',
      'API accès développeur',
      'Intégrations tierces',
      'Analyses approfondies',
      'Support téléphonique',
      'Formation personnalisée',
      'Accès anticipé aux nouvelles fonctionnalités',
    ],
    limitations: [],
    popular: false,
    color: Colors.primaryLavender,
  },
];

export const SubscriptionScreen: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    Alert.alert(
      'Confirmation d\'abonnement',
      `Vous êtes sur le point de souscrire à l'offre ${plan.name} à ${plan.price} ${plan.period}.\n\nCette action est pour démonstration uniquement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            Alert.alert('Info', 'Fonctionnalité d\'abonnement à implémenter');
          }
        },
      ]
    );
  };

  const getYearlyPrice = (monthlyPrice: string) => {
    const price = parseFloat(monthlyPrice.replace('€', '').replace(',', '.'));
    return `${(price * 12 * 0.8).toFixed(2)}€`; // 20% discount
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Abonnement</Text>
        <Text style={styles.subtitle}>Choisissez le plan qui vous convient</Text>
      </View>

      {/* Billing Toggle */}
      <View style={styles.billingToggle}>
        <TouchableOpacity
          style={[
            styles.billingOption,
            billingCycle === 'monthly' && styles.billingOptionActive,
          ]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text style={[
            styles.billingText,
            billingCycle === 'monthly' && styles.billingTextActive,
          ]}>
            Mensuel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.billingOption,
            billingCycle === 'yearly' && styles.billingOptionActive,
          ]}
          onPress={() => setBillingCycle('yearly')}
        >
          <Text style={[
            styles.billingText,
            billingCycle === 'yearly' && styles.billingTextActive,
          ]}>
            Annuel
          </Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-20%</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.selectedPlanCard,
              plan.popular && styles.popularPlanCard,
            ]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>LE PLUS POPULAIRE</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={[styles.planPrice, { color: plan.color }]}>
                  {billingCycle === 'yearly' && plan.id !== 'free'
                    ? getYearlyPrice(plan.price)
                    : plan.price
                  }
                </Text>
                <Text style={[styles.planPeriod, { color: Colors.text.secondary }]}>
                  {plan.id === 'free' ? plan.period : billingCycle === 'yearly' ? 'par an' : plan.period}
                </Text>
              </View>
            </View>

            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Fonctionnalités incluses :</Text>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent.green} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}

              {plan.limitations.length > 0 && (
                <View style={styles.limitationsSection}>
                  <Text style={styles.limitationsTitle}>Limitations :</Text>
                  {plan.limitations.map((limitation, index) => (
                    <View key={index} style={styles.limitationItem}>
                      <Ionicons name="close-circle" size={20} color={Colors.accent.red} />
                      <Text style={styles.limitationText}>{limitation}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: plan.color },
                selectedPlan === plan.id && styles.selectedSubscribeButton,
              ]}
              onPress={() => handleSubscribe(plan.id)}
            >
              <Text style={[
                styles.subscribeButtonText,
                { color: plan.id === 'free' ? Colors.text.primary : Colors.textOnPrimary }
              ]}>
                {plan.id === 'free' ? 'Commencer gratuitement' : 'S\'abonner'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Questions fréquentes</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Puis-je changer de plan à tout moment ?</Text>
            <Text style={styles.faqAnswer}>
              Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment.
              Les changements prennent effet immédiatement.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Comment se passe la facturation ?</Text>
            <Text style={styles.faqAnswer}>
              La facturation est gérée de manière sécurisée. Vous recevrez une facture
              par email à chaque renouvellement.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Y a-t-il une période d'essai ?</Text>
            <Text style={styles.faqAnswer}>
              Oui ! Tous les nouveaux utilisateurs bénéficient de 14 jours d'essai
              gratuit pour tester le plan Premium.
            </Text>
          </View>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactText}>
            Besoin d'aide ? Contactez notre support à{' '}
            <Text style={styles.contactLink}>support@studyeasy.app</Text>
          </Text>
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
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: DesignTokens.radii.xl,
    padding: 4,
    marginBottom: 24,
    ...DesignTokens.shadows.sm,
  },
  billingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: DesignTokens.radii.lg,
  },
  billingOptionActive: {
    backgroundColor: Colors.accent.blue,
  },
  billingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  billingTextActive: {
    color: Colors.textOnPrimary,
  },
  discountBadge: {
    backgroundColor: Colors.accent.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DesignTokens.radii.full,
    marginLeft: 8,
  },
  discountText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    ...DesignTokens.shadows.md,
  },
  selectedPlanCard: {
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blue + '05',
  },
  popularPlanCard: {
    borderColor: Colors.accent.green,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: Colors.accent.green,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: DesignTokens.radii.full,
  },
  popularText: {
    ...Typography.small,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    ...Typography.h3,
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    ...Typography.h2,
    fontWeight: '700',
  },
  planPeriod: {
    ...Typography.body,
  },
  planDescription: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: 20,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  limitationsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  limitationsTitle: {
    ...Typography.body,
    color: Colors.accent.red,
    fontWeight: '600',
    marginBottom: 8,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  limitationText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
  subscribeButton: {
    borderRadius: DesignTokens.radii.lg,
    padding: 16,
    alignItems: 'center',
    minHeight: 56,
  },
  selectedSubscribeButton: {
    backgroundColor: Colors.accent.blue,
  },
  subscribeButtonText: {
    ...Typography.headline,
    fontWeight: '600',
  },
  faqSection: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.xl,
    padding: 20,
    marginBottom: 24,
    ...DesignTokens.shadows.sm,
  },
  faqTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  faqAnswer: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  contactSection: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  contactText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  contactLink: {
    color: Colors.accent.blue,
    fontWeight: '600',
  },
});



