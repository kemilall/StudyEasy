import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileStackParamList } from '../navigation/types';

export type PrivacyPolicyScreenProps = StackScreenProps<ProfileStackParamList, 'PrivacyPolicy'>;

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Politique de confidentialité</Text>
        <Text style={styles.subtitle}>
          Nous protégeons vos données et les utilisons uniquement pour améliorer votre
          apprentissage.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collecte des données</Text>
          <Text style={styles.paragraph}>
            Nous collectons uniquement les informations nécessaires à la création de votre
            compte et au suivi de vos apprentissages : nom, adresse email, contenus importés et
            interactions pédagogiques.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisation</Text>
          <Text style={styles.paragraph}>
            Les données sont utilisées pour personnaliser vos recommandations, générer vos
            fiches et améliorer les fonctionnalités. Elles ne sont jamais vendues à des tiers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conservation & droits</Text>
          <Text style={styles.paragraph}>
            Vous pouvez demander la suppression de vos données à tout moment depuis les
            paramètres. Les informations sont conservées tant que votre compte est actif.
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 24,
  },
  title: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
  },
  paragraph: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
});

