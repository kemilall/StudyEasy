import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';

interface HeroSectionProps {
  firstName?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ firstName }) => {
  const { userProfile } = useAuth();

  const displayName = firstName || userProfile?.displayName?.split(' ')[0] || 'Étudiant';

  return (
    <View
      style={{
        paddingTop: -8,
        paddingBottom: 32,
        paddingHorizontal: 24,
      }}
      role="region"
      ariaLabel="Bienvenue"
    >
      <Text
        style={{
          ...Typography.h1,
          color: Colors.textPrimary,
          marginBottom: -5,
          fontSize: 28,
          fontWeight: '700',
        }}
      >
        Bienvenue, {displayName}
      </Text>

      <Text
        style={{
          ...Typography.body,
          color: Colors.textSecondary,
          lineHeight: 22,
          fontSize: 15,
          maxWidth: 480,
        }}
      >
        Un clic pour transformer tes audios en cours clairs avec flashcards et quiz.
      </Text>
    </View>
  );
};

