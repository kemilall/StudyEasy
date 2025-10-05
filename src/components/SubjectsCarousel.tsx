import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';
import { Subject } from '../types';

const { width } = Dimensions.get('window');

interface SubjectsCarouselProps {
  subjects: Subject[];
  onSubjectPress?: (subject: Subject) => void;
}

export const SubjectsCarousel: React.FC<SubjectsCarouselProps> = ({
  subjects,
  onSubjectPress,
}) => {
  const navigation = useNavigation<any>();

  // Icon mapping for subjects
  const getSubjectIcon = (subjectName: string) => {
    const lowercaseName = subjectName.toLowerCase();
    if (lowercaseName.includes('math')) return 'calculator-outline';
    if (lowercaseName.includes('physi')) return 'planet-outline';
    if (lowercaseName.includes('chimi')) return 'flask-outline';
    if (lowercaseName.includes('histoi')) return 'library-outline';
    if (lowercaseName.includes('géo')) return 'earth-outline';
    if (lowercaseName.includes('bio')) return 'leaf-outline';
    if (lowercaseName.includes('info')) return 'code-slash-outline';
    if (lowercaseName.includes('anglais') || lowercaseName.includes('english')) return 'language-outline';
    return 'book-outline';
  };

  const renderSubjectItem = ({ item }: { item: Subject }) => {
    const iconName = getSubjectIcon(item.name);

    return (
      <TouchableOpacity
        style={{
          marginRight: 12,
          width: 148,
          height: 56,
        }}
        onPress={() => {
          if (onSubjectPress) {
            onSubjectPress(item);
          } else {
            navigation.navigate('Subjects', { screen: 'Subject', params: { subjectId: item.id } });
          }
        }}
        accessibilityLabel={`Matière ${item.name}`}
      >
        <View
          style={[
            {
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Colors.surfaceAlt,
              borderRadius: DesignTokens.radii.full,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: Colors.border,
            },
            DesignTokens.shadows.sm,
          ]}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: DesignTokens.radii.xs,
              backgroundColor: item.color + '20', // 20% opacity
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons
              name={iconName as any}
              size={14}
              color={item.color}
            />
          </View>

          <Text
            style={{
              ...Typography.body,
              color: Colors.textPrimary,
              fontWeight: '500',
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (subjects.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        paddingHorizontal: 20,
        marginBottom: 48,
      }}
      role="region"
      ariaLabel="Matières récentes"
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            ...Typography.h3,
            color: Colors.textPrimary,
          }}
        >
          Matières récentes
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Subjects', { screen: 'SubjectsList' })}
          style={{
            paddingVertical: 4,
            paddingHorizontal: 8,
          }}
        >
          <Text
            style={{
              ...Typography.body,
              color: Colors.primaryBlue,
              fontWeight: '600',
            }}
          >
            Toutes les matières
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={subjects}
        renderItem={renderSubjectItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingRight: 20, // Extra padding for the last item
        }}
      />
    </View>
  );
};

