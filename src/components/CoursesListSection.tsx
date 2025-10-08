import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';
import { CourseListItem } from './CourseListItem';
import { Lesson } from '../types';

interface CoursesListSectionProps {
  courses: Lesson[];
  isLoading?: boolean;
  onCourseOpen?: (course: Lesson) => void;
  onCourseReview?: (course: Lesson) => void;
  onCourseQuiz?: (course: Lesson) => void;
}

export const CoursesListSection: React.FC<CoursesListSectionProps> = ({
  courses,
  isLoading = false,
  onCourseOpen,
  onCourseReview,
  onCourseQuiz,
}) => {
  const renderCourseItem = ({ item }: { item: Lesson }) => (
    <CourseListItem
      course={item}
      onOpen={onCourseOpen}
      onReview={onCourseReview}
      onQuiz={onCourseQuiz}
    />
  );

  const renderEmptyState = () => (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: DesignTokens.radii.xl,
        padding: 48,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 24,
        ...DesignTokens.shadows.sm,
      }}
    >
      <Ionicons name="book-outline" size={48} color={Colors.textSecondary} />
      <Text
        style={{
          ...Typography.h3,
          color: Colors.textPrimary,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Aucun cours généré
      </Text>
      <Text
        style={{
          ...Typography.body,
          color: Colors.textSecondary,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 24,
        }}
      >
        Commence par enregistrer ou importer un audio.
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: Colors.primaryBlue,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: DesignTokens.radii.md,
        }}
      >
        <Text
          style={{
            ...Typography.body,
            color: Colors.textOnPrimary,
            fontWeight: '600',
          }}
        >
          Enregistrer un cours
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingSkeleton = () => (
    <View>
      {[1, 2, 3, 4, 5].map((index) => (
        <View
          key={index}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: DesignTokens.radii.lg,
            borderWidth: 1,
            borderColor: Colors.border,
            marginBottom: 12,
            padding: 16,
            ...DesignTokens.shadows.sm,
          }}
        >
          <View style={{
            flexDirection: 'row',
            gap: 16,
          }}>
            {/* Thumbnail skeleton */}
            <View style={{
              width: 56,
              height: 56,
              borderRadius: DesignTokens.radii.md,
              backgroundColor: Colors.surfaceAlt,
            }} />

            {/* Content skeleton */}
            <View style={{ flex: 1 }}>
              {/* Title row */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <View style={{
                  height: 20,
                  backgroundColor: Colors.surfaceAlt,
                  borderRadius: 4,
                  flex: 1,
                  marginRight: 12,
                }} />
                <View style={{
                  height: 20,
                  backgroundColor: Colors.surfaceAlt,
                  borderRadius: 4,
                  width: 120,
                }} />
              </View>

              {/* Summary skeleton */}
              <View style={{
                height: 16,
                backgroundColor: Colors.surfaceAlt,
                borderRadius: 4,
                marginBottom: 8,
              }} />
              <View style={{
                height: 16,
                backgroundColor: Colors.surfaceAlt,
                borderRadius: 4,
                width: '60%',
                marginBottom: 12,
              }} />

              {/* Progress bar skeleton */}
              <View style={{
                height: 6,
                backgroundColor: Colors.surfaceAlt,
                borderRadius: DesignTokens.radii.full,
                marginBottom: 12,
              }} />

              {/* Actions skeleton */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <View style={{
                  flexDirection: 'row',
                  gap: 8,
                }}>
                  <View style={{
                    height: 28,
                    backgroundColor: Colors.surfaceAlt,
                    borderRadius: DesignTokens.radii.sm,
                    width: 60,
                  }} />
                  <View style={{
                    height: 28,
                    backgroundColor: Colors.surfaceAlt,
                    borderRadius: DesignTokens.radii.sm,
                    width: 60,
                  }} />
                  <View style={{
                    height: 28,
                    backgroundColor: Colors.surfaceAlt,
                    borderRadius: DesignTokens.radii.sm,
                    width: 60,
                  }} />
                </View>
                <View style={{
                  width: 16,
                  height: 16,
                  backgroundColor: Colors.surfaceAlt,
                  borderRadius: 8,
                }} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View
      style={{
        paddingHorizontal: 20,
        marginBottom: 48,
      }}
      role="region"
      ariaLabel="Derniers cours générés"
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <View>
          <Text
            style={{
              ...Typography.h3,
              color: Colors.textPrimary,
            }}
          >
            Derniers cours générés
          </Text>
          <Text
            style={{
              ...Typography.small,
              color: Colors.textSecondary,
              marginTop: 4,
            }}
          >
            {courses.length} éléments
          </Text>
        </View>

        {/* Toolbar would go here - filters, sort, search */}
      </View>

      {/* Content */}
      {isLoading ? (
        renderLoadingSkeleton()
      ) : courses.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={{ paddingBottom: 20 }}>
          {courses.map((item) => (
            <View key={item.id}>
              {renderCourseItem({ item })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

