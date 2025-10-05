import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';

const { width } = Dimensions.get('window');

interface QuickActionsSectionProps {
  onRecordPress?: () => void;
  onImportAudioPress?: () => void;
  onImportCoursePress?: () => void;
  subjects?: any[];
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  onRecordPress,
  onImportAudioPress,
  onImportCoursePress,
  subjects = [],
}) => {
  const navigation = useNavigation<any>();

  const handleImportAudioPress = () => {
    if (subjects.length === 0) {
      // No subjects, redirect to create subject
      navigation.navigate('CreateSubject' as never);
    } else if (subjects.length === 1) {
      // Only one subject, use it directly
      navigation.navigate('AudioImport' as never, {
        subjectId: subjects[0].id,
      });
    } else {
      // Multiple subjects, use first one for now
      // TODO: Create a subject picker screen for import
      navigation.navigate('AudioImport' as never, {
        subjectId: subjects[0].id,
      });
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 20,
        marginBottom: 32,
      }}
      role="region"
      ariaLabel="Actions rapides"
    >
      {/* Row 1: Enregistrer + Importer audio */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* Enregistrer un cours */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: '#E8E0F5',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
          onPress={() => navigation.navigate('RecordingSubjectPicker' as never)}
          accessibilityLabel="Enregistrer un cours"
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#C9B6E4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="mic" size={20} color={Colors.textOnPrimary} />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Enregistrer{'\n'}un cours
          </Text>
        </TouchableOpacity>

        {/* Importer un audio */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: '#FEF7E6',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
          onPress={handleImportAudioPress}
          accessibilityLabel="Importer un audio"
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#F5E6D3',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-up" size={20} color="#8B7355" />
          </View>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: Colors.textPrimary,
              flex: 1,
            }}
          >
            Importer{'\n'}un audio
          </Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: Importer un cours (full width) */}
      <TouchableOpacity
        style={{
          backgroundColor: '#FEF7E6',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
        onPress={() => navigation.navigate('CreateLesson' as never)}
        accessibilityLabel="Importer un cours"
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#F5E6D3',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="document-text-outline" size={20} color="#8B7355" />
        </View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: Colors.textPrimary,
          }}
        >
          Importer un cours
        </Text>
      </TouchableOpacity>
    </View>
  );
};

