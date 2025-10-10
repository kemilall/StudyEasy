import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export const PrivacyPolicyScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Politique de confidentialité</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collecte des données</Text>
          <Text style={styles.paragraph}>
            StudyEasy collecte uniquement les données nécessaires au bon fonctionnement de
            l&apos;application : prénom, nom, adresse email, contenus importés et préférences
            pédagogiques.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisation</Text>
          <Text style={styles.paragraph}>
            Les données collectées sont utilisées pour personnaliser ton expérience, améliorer tes
            recommandations de cours et t&apos;envoyer des rappels liés à ton apprentissage.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partage</Text>
          <Text style={styles.paragraph}>
            Nous ne vendons ni ne louons aucune donnée personnelle. Elles peuvent être partagées
            uniquement avec des prestataires de confiance (hébergement, analytics) dans le cadre
            d&apos;une exécution contractuelle.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Durée de conservation</Text>
          <Text style={styles.paragraph}>
            Tes données sont conservées tant que ton compte reste actif. Tu peux demander leur
            suppression à tout moment depuis les Paramètres ou par email à privacy@studyeasy.app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tes droits</Text>
          <Text style={styles.paragraph}>
            Conformément au RGPD, tu disposes d&apos;un droit d&apos;accès, de rectification, de
            suppression et d&apos;opposition. Contacte-nous pour exercer ces droits.
          </Text>
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
  title: {
    ...Typography.title1,
    color: Colors.text.primary,
  },
  section: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
});

