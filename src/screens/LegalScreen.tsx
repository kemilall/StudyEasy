import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';

export const LegalScreen: React.FC = () => {
  const legalSections = [
    {
      title: '1. Informations générales',
      content: `StudyEasy est une application développée pour faciliter l'apprentissage et la gestion des connaissances.

Éditeur : StudyEasy Corp
Siège social : 123 Avenue de l'Éducation, 75001 Paris, France
Email : contact@studyeasy.app
Site web : www.studyeasy.app

Directeur de la publication : StudyEasy Team
Hébergement : Services cloud sécurisés conformes RGPD`
    },
    {
      title: '2. Objet du service',
      content: `StudyEasy est une plateforme éducative qui permet aux utilisateurs de :

• Créer et organiser des matières d'étude
• Enregistrer et transcrire des leçons audio
• Générer des fiches de révision et quiz
• Suivre leurs progrès d'apprentissage
• Partager des connaissances avec la communauté

Le service est destiné à un usage éducatif et personnel uniquement.`
    },
    {
      title: '3. Conditions d\'utilisation',
      content: `Pour utiliser StudyEasy, vous devez :

• Être âgé d'au moins 13 ans
• Fournir des informations exactes lors de l'inscription
• Respecter les lois en vigueur
• Ne pas utiliser le service à des fins illégales ou frauduleuses
• Ne pas porter atteinte aux droits de tiers

L'utilisation du service implique l'acceptation pleine et entière des présentes conditions.`
    },
    {
      title: '4. Protection des données personnelles',
      content: `Conformément au RGPD (Règlement Général sur la Protection des Données), nous nous engageons à :

• Protéger vos données personnelles
• Ne collecter que les données nécessaires
• Obtenir votre consentement explicite
• Vous permettre d'accéder, modifier ou supprimer vos données
• Sécuriser le stockage et la transmission des données

Les données collectées incluent :
• Informations de profil (nom, email)
• Contenu éducatif créé
• Statistiques d'utilisation anonymisées

Pour exercer vos droits RGPD, contactez-nous à privacy@studyeasy.app`
    },
    {
      title: '5. Propriété intellectuelle',
      content: `Le contenu généré par l'IA (fiches, quiz, transcriptions) appartient à l'utilisateur.

StudyEasy détient les droits sur :
• Le code source et l'architecture de l'application
• Les algorithmes d'intelligence artificielle
• La marque et le logo StudyEasy
• L'interface utilisateur et l'expérience utilisateur

Il est interdit de reproduire, modifier ou distribuer ces éléments sans autorisation.`
    },
    {
      title: '6. Responsabilité et garantie',
      content: `StudyEasy s'efforce de fournir un service fiable et sécurisé, mais ne peut garantir :

• Une disponibilité permanente du service
• L'exactitude absolue des transcriptions automatiques
• La compatibilité avec tous les appareils

L'utilisateur est seul responsable de :
• La sauvegarde de ses données
• L'utilisation appropriée du service
• Le respect des lois applicables

StudyEasy ne saurait être tenu responsable des dommages indirects résultant de l'utilisation du service.`
    },
    {
      title: '7. Modifications des conditions',
      content: `StudyEasy se réserve le droit de modifier les présentes conditions à tout moment.

Les utilisateurs seront informés des modifications par notification ou email.

La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles conditions.

Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}`
    },
    {
      title: '8. Support et contact',
      content: `Pour toute question concernant les présentes mentions légales ou le service StudyEasy :

Email : legal@studyeasy.app
Adresse : 123 Avenue de l'Éducation, 75001 Paris, France

Nous nous engageons à répondre sous 48 heures ouvrées.`
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.accent.blue} />
        </TouchableOpacity>
        <Text style={styles.title}>Mentions légales</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introText}>
            Les présentes mentions légales régissent l'utilisation de l'application StudyEasy.
            En utilisant notre service, vous acceptez ces conditions.
          </Text>
        </View>

        {legalSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} StudyEasy. Tous droits réservés.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  backButton: {
    padding: 8,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  introSection: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.xl,
    padding: 20,
    marginBottom: 24,
    marginTop: 16,
    ...DesignTokens.shadows.md,
  },
  introText: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: DesignTokens.radii.xl,
    padding: 20,
    marginBottom: 16,
    ...DesignTokens.shadows.sm,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.accent.blue,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    ...Typography.footnote,
    color: Colors.text.tertiary,
  },
});



