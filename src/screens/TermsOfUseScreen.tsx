import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileStackParamList } from '../navigation/types';

export type TermsOfUseScreenProps = StackScreenProps<ProfileStackParamList, 'TermsOfUse'>;

export const TermsOfUseScreen: React.FC<TermsOfUseScreenProps> = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Conditions d'utilisation</Text>
        <Text style={styles.subtitle}>
          Les règles qui encadrent l'utilisation de l'application et des services StudyEasy.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Objet</Text>
          <Text style={styles.paragraph}>
            StudyEasy propose une plateforme d'apprentissage permettant la création de cours,
            la génération de fiches et d'exercices automatisés. Les présentes conditions ont
            pour objectif de définir le cadre de cet usage.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Compte utilisateur</Text>
          <Text style={styles.paragraph}>
            L'utilisateur s'engage à fournir des informations exactes et à maintenir la
            confidentialité de ses identifiants. Toute activité réalisée depuis son compte lui
            est imputée.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Contenus</Text>
          <Text style={styles.paragraph}>
            Les documents importés doivent respecter les lois en vigueur et ne pas porter
            atteinte aux droits de tiers. StudyEasy se réserve le droit de suspendre un compte
            en cas d'utilisation abusive.
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

