import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';
import { Lesson } from '../types';

const { width } = Dimensions.get('window');

interface CourseListItemProps {
  course: Lesson;
  onOpen?: (course: Lesson) => void;
  onReview?: (course: Lesson) => void;
  onQuiz?: (course: Lesson) => void;
}

export const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
  onOpen,
  onReview,
  onQuiz,
}) => {
  const navigation = useNavigation<any>();

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'audio': return 'volume-high';
      case 'pdf': return 'document-text';
      case 'video': return 'videocam';
      case 'slides': return 'easel';
      default: return 'document';
    }
  };

  const handleOpen = () => {
    if (onOpen) {
      onOpen(course);
    } else {
      navigation.navigate('Lesson', { lessonId: course.id });
    }
  };

  const handleReview = () => {
    if (onReview) {
      onReview(course);
    } else {
      // Navigate to review screen or show modal
    }
  };

  const handleQuiz = () => {
    if (onQuiz) {
      onQuiz(course);
    } else {
      navigation.navigate('Quiz', { lessonId: course.id });
    }
  };

  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: DesignTokens.radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
        ...DesignTokens.shadows.sm,
      }}
    >
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          padding: 16,
          gap: 16,
        }}
        onPress={handleOpen}
        accessibilityLabel={`Cours ${course.name}`}
      >
        {/* Thumbnail */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: DesignTokens.radii.md,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={[Colors.primaryLavender + '40', Colors.primaryBlue + '40']}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={getSourceIcon(course.source || 'document') as any}
              size={24}
              color={Colors.primaryBlue}
            />
          </LinearGradient>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Title and Meta Row */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <Text
              style={{
                ...Typography.body,
                color: Colors.textPrimary,
                fontWeight: '600',
                flex: 1,
                marginRight: 12,
              }}
              numberOfLines={2}
            >
              {course.name}
            </Text>

            <View style={{
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
            }}>
              {/* Subject Pill */}
              <View style={{
                backgroundColor: (course.subjectColor || Colors.primaryBlue) + '15',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: DesignTokens.radii.xs,
              }}>
                <Text style={{
                  ...Typography.badge,
                  color: course.subjectColor || Colors.primaryBlue,
                  fontWeight: '600',
                }}>
                  {course.subjectName || 'Matière'}
                </Text>
              </View>

              {/* Source and Duration */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                  <Text style={{
                    ...Typography.badge,
                    color: Colors.textSecondary,
                  }}>
                    {formatDuration(course.duration || 45)}
                  </Text>
                </View>

                <Text style={{
                  ...Typography.badge,
                  color: Colors.textSecondary,
                }}>
                  •
                </Text>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <Ionicons
                    name={getSourceIcon(course.source || 'document') as any}
                    size={12}
                    color={Colors.textSecondary}
                  />
                  <Text style={{
                    ...Typography.badge,
                    color: Colors.textSecondary,
                  }}>
                    {course.source || 'Document'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Summary */}
          {course.summary && (
            <Text
              style={{
                ...Typography.small,
                color: Colors.textSecondary,
                marginBottom: 12,
                lineHeight: 20,
              }}
              numberOfLines={2}
            >
              {course.summary}
            </Text>
          )}

          {/* Progress Row - Only show for incomplete courses */}
          {!course.isCompleted && (
            <View style={{
              marginBottom: 12,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <Text style={{
                  ...Typography.small,
                  color: Colors.textSecondary,
                  fontWeight: '500',
                }}>
                  {course.progress || 0}% terminé
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: Colors.surfaceAlt,
                borderRadius: DesignTokens.radii.full,
                overflow: 'hidden',
              }}>
                <View
                  style={{
                    height: '100%',
                    width: `${course.progress || 0}%`,
                    backgroundColor: Colors.primaryBlue,
                    borderRadius: DesignTokens.radii.full,
                  }}
                />
              </View>
            </View>
          )}

          {/* Actions Row */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <View style={{
              flexDirection: 'row',
              gap: 8,
            }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  backgroundColor: Colors.surfaceAlt,
                  borderRadius: DesignTokens.radii.sm,
                }}
                onPress={handleOpen}
              >
                <Text style={{
                  ...Typography.badge,
                  color: Colors.textPrimary,
                  fontWeight: '500',
                }}>
                  Ouvrir
                </Text>
              </TouchableOpacity>

              {course.isCompleted && (
                <>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      backgroundColor: Colors.surfaceAlt,
                      borderRadius: DesignTokens.radii.sm,
                    }}
                    onPress={handleReview}
                  >
                    <Text style={{
                      ...Typography.badge,
                      color: Colors.textPrimary,
                      fontWeight: '500',
                    }}>
                      Réviser
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      backgroundColor: Colors.surfaceAlt,
                      borderRadius: DesignTokens.radii.sm,
                    }}
                    onPress={handleQuiz}
                  >
                    <Text style={{
                      ...Typography.badge,
                      color: Colors.textPrimary,
                      fontWeight: '500',
                    }}>
                      Quiz
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              style={{
                padding: 4,
              }}
              accessibilityLabel="Plus d'options"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

