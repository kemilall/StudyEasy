import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { ProfileStackParamList } from '../navigation/types';

export type LegalNoticeScreenProps = StackScreenProps<ProfileStackParamList, 'LegalNotice'>;

export const LegalNoticeScreen: React.FC<LegalNoticeScreenProps> = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mentions légales</Text>
        <Text style={styles.subtitle}>
          Retrouvez ici les informations officielles relatives à l'application StudyEasy.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Éditeur</Text>
          <Text style={styles.paragraph}>
            {`StudyEasy SAS\n12 rue de l'Éducation\n75000 Paris\ncontact@studyeasy.app`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Directeur de la publication</Text>
          <Text style={styles.paragraph}>Camille Dupont, Présidente de StudyEasy.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hébergement</Text>
          <Text style={styles.paragraph}>
            {`Plateforme sécurisée sur des serveurs localisés en Union Européenne\nInfrastructure opérée par Scaleway, 8 rue de la Ville l'Évêque, 75008 Paris.`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>
            L'ensemble des contenus présents dans l'application (textes, visuels, éléments
            pédagogiques) sont la propriété exclusive de StudyEasy. Toute reproduction ou
            diffusion sans autorisation écrite est interdite.
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

