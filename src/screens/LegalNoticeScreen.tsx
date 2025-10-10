import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export const LegalNoticeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mentions légales</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Éditeur</Text>
          <Text style={styles.paragraph}>StudyEasy SAS</Text>
          <Text style={styles.paragraph}>10 rue des Études, 75005 Paris, France</Text>
          <Text style={styles.paragraph}>Capital social : 50 000€</Text>
          <Text style={styles.paragraph}>RCS Paris 912 345 678</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.paragraph}>Email : legal@studyeasy.app</Text>
          <Text style={styles.paragraph}>Téléphone : +33 1 23 45 67 89</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsable de publication</Text>
          <Text style={styles.paragraph}>Camille Martin</Text>
          <Text style={styles.paragraph}>camille.martin@studyeasy.app</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hébergement</Text>
          <Text style={styles.paragraph}>OVHcloud</Text>
          <Text style={styles.paragraph}>2 rue Kellermann, 59100 Roubaix, France</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>
            L&apos;ensemble des éléments graphiques, textuels, sonores ou logiciels composant
            l&apos;application StudyEasy sont protégés par le droit d&apos;auteur. Toute reproduction
            partielle ou totale est strictement interdite sans autorisation écrite préalable.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions d&apos;utilisation</Text>
          <Text style={styles.paragraph}>
            L&apos;utilisation de l&apos;application implique l&apos;acceptation pleine et entière des
            conditions générales d&apos;utilisation disponibles dans ton espace Paramètres. Ces
            conditions sont susceptibles d&apos;être modifiées à tout moment : les utilisateurs sont
            invités à les consulter régulièrement.
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

