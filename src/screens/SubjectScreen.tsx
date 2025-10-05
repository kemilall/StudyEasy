import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Subject, Lesson } from '../types';
import { LessonCard } from '../components/LessonCard';
import { DoubleConfirmationModal } from '../components/DoubleConfirmationModal';

const BackgroundWavesImage = require('../../assets/background_waves.png');

export const SubjectScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { subjectId } = route.params as { subjectId: string };
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  useEffect(() => {
    if (!user || !subjectId) return;

    // Get subject data
    const loadSubject = async () => {
      try {
        const subjects = await DataService.getUserSubjects(user.uid);
        const foundSubject = subjects.find(s => s.id === subjectId);
        setSubject(foundSubject || null);
      } catch (error) {
        console.error('Error loading subject:', error);
      }
    };

    // Subscribe to lessons
    const unsubscribe = DataService.subscribeToSubjectLessons(subjectId, (subjectLessons) => {
      setLessons(subjectLessons);
      setIsLoading(false);

      // Load recent lessons from this subject
      loadRecentLessons(subjectLessons);
    });

    loadSubject();

    return () => unsubscribe();
  }, [user, subjectId]);

  const loadRecentLessons = (lessonsList: Lesson[]) => {
    // Get the most recent lessons from this subject
    const recentOnes = lessonsList
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    setRecentLessons(recentOnes);
  };

  const getSubjectIcon = (name: string) => {
    const lowercaseName = name.toLowerCase();
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

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await DataService.deleteLesson(lessonId);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la leçon. Veuillez réessayer.');
    }
  };

  const handleRenameSubject = async () => {
    if (!subject || !newSubjectName.trim()) return;

    try {
      await DataService.updateSubject(subject.id, { name: newSubjectName.trim() });
      setShowRenameModal(false);
      setNewSubjectName('');
    } catch (error) {
      console.error('Error renaming subject:', error);
      Alert.alert('Erreur', 'Impossible de renommer la matière. Veuillez réessayer.');
    }
  };

  const handleDeleteSubject = async () => {
    if (!subject) return;

    try {
      // Fermer le modal et retourner immédiatement pour masquer l'UI
      setShowDeleteModal(false);
      navigation.goBack();
      
      // Supprimer en arrière-plan (async sans await)
      DataService.deleteSubject(subject.id).catch(error => {
        console.error('Error deleting subject:', error);
        Alert.alert('Erreur', 'Impossible de supprimer la matière. Veuillez réessayer.');
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la matière. Veuillez réessayer.');
    }
  };

  const renderLesson = (lesson: Lesson) => (
    <LessonCard
      key={lesson.id}
      lesson={lesson}
      onPress={() => (navigation as any).navigate('Lesson', { lessonId: lesson.id })}
      onDelete={() => handleDeleteLesson(lesson.id)}
    />
  );

  const renderRecentLesson = (lesson: Lesson) => (
    <TouchableOpacity
      key={lesson.id}
      style={{
        width: 180,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginRight: 12,
        ...DesignTokens.shadows.sm,
      }}
      activeOpacity={0.7}
      onPress={() => (navigation as any).navigate('Lesson', { lessonId: lesson.id })}
    >
      <View style={{
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: subject?.color || Colors.primaryBlue,
        marginBottom: 12,
      }} />
      <Text style={{
        ...Typography.footnote,
        color: Colors.textPrimary,
        fontWeight: '600',
        lineHeight: 18,
        flex: 1,
      }} numberOfLines={2}>
        {lesson.name}
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
      }}>
        <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
        <Text style={{
          ...Typography.caption2,
          color: Colors.textSecondary,
        }}>
          {lesson.duration || 45} min
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!subject || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        <ImageBackground
          source={BackgroundWavesImage}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
          imageStyle={{ opacity: 0.08 }}
        />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Background decorative waves - Fixed */}
      <ImageBackground
        source={BackgroundWavesImage}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
        imageStyle={{ opacity: 0.08 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
          {/* Header */}
          <View style={{
            paddingTop: 16,
            paddingBottom: 32,
            position: 'relative',
          }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                marginLeft: 20,
              }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={{
              alignItems: 'center',
              paddingHorizontal: 20,
            }}>
              {/* Hero Subject Icon with Gradient */}
              <LinearGradient
                colors={[Colors.primaryLavender + '20', Colors.primaryBlue + '20']}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 24,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                  ...DesignTokens.shadows.md,
                }}
              >
                <Ionicons
                  name={getSubjectIcon(subject.name) as any}
                  size={48}
                  color={subject.color || Colors.primaryBlue}
                />
              </LinearGradient>

              <Text style={{
                ...Typography.h1,
                color: Colors.textPrimary,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 24,
                fontSize: 32,
              }}>
                {subject.name}
              </Text>

              {/* Stats Card with Mindflow styling */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: Colors.surface,
                borderRadius: 16,
                padding: 24,
                marginHorizontal: 20,
                ...DesignTokens.shadows.sm,
                borderWidth: 1,
                borderColor: Colors.border,
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    ...Typography.h2,
                    color: Colors.textPrimary,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}>
                    {subject.lessonsCount || 0}
                  </Text>
                  <Text style={{
                    ...Typography.small,
                    color: Colors.textSecondary,
                  }}>
                    Leçons
                  </Text>
                </View>
                
                <View style={{
                  width: 1,
                  backgroundColor: Colors.border,
                  marginHorizontal: 20,
                }} />
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    ...Typography.h2,
                    color: Colors.textPrimary,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}>
                    {subject.completedLessons || 0}
                  </Text>
                  <Text style={{
                    ...Typography.small,
                    color: Colors.textSecondary,
                  }}>
                    Terminées
                  </Text>
                </View>
                
                <View style={{
                  width: 1,
                  backgroundColor: Colors.border,
                  marginHorizontal: 20,
                }} />
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    ...Typography.h2,
                    color: Colors.accentGreen,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}>
                    {subject.lessonsCount ? Math.round(((subject.completedLessons || 0) / subject.lessonsCount) * 100) : 0}%
                  </Text>
                  <Text style={{
                    ...Typography.small,
                    color: Colors.textSecondary,
                  }}>
                    Progrès
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              style={{
                position: 'absolute',
                top: 16,
                right: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Recent Lessons */}
          {recentLessons.length > 0 && (
            <View style={{ marginBottom: 40 }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                marginBottom: 20,
              }}>
                <Text style={{
                  ...Typography.h3,
                  color: Colors.textPrimary,
                  fontWeight: '700',
                }}>
                  Leçons récentes
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                }}
              >
                {recentLessons.map(renderRecentLesson)}
              </ScrollView>
            </View>
          )}

          {/* Lessons Section */}
          <View style={{ marginBottom: 32 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 20,
            }}>
              <Text style={{
                ...Typography.h3,
                color: Colors.textPrimary,
                fontWeight: '700',
                flex: 1,
              }}>
                Toutes les leçons
              </Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: Colors.surfaceAlt,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                onPress={() => (navigation as any).navigate('RecordingStudio', {
                  subjectId,
                  subjectName: subject?.name || 'Matière',
                  subjectColor: subject?.color,
                })}
              >
                <Ionicons name="add" size={16} color={Colors.primaryBlue} />
                <Text style={{
                  ...Typography.small,
                  color: Colors.primaryBlue,
                  fontWeight: '600',
                }}>
                  Nouvelle
                </Text>
              </TouchableOpacity>
            </View>

            {lessons.length === 0 ? (
              <View style={{
                backgroundColor: Colors.surface,
                borderRadius: 20,
                padding: 48,
                marginHorizontal: 20,
                alignItems: 'center',
                ...DesignTokens.shadows.sm,
                borderWidth: 1,
                borderColor: Colors.border,
              }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: Colors.surfaceAlt,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                }}>
                  <Ionicons name="book-outline" size={40} color={Colors.textSecondary} />
                </View>
                <Text style={{
                  ...Typography.h3,
                  color: Colors.textPrimary,
                  fontWeight: '700',
                  marginBottom: 8,
                }}>
                  Aucune leçon
                </Text>
                <Text style={{
                  ...Typography.body,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 24,
                  marginBottom: 32,
                }}>
                  Créez votre première leçon pour cette matière
                </Text>
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate('RecordingStudio', {
                    subjectId,
                    subjectName: subject?.name || 'Matière',
                    subjectColor: subject?.color,
                  })}
                >
                  <LinearGradient
                    colors={DesignTokens.gradients.brand}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{
                      ...Typography.body,
                      color: Colors.textOnPrimary,
                      fontWeight: '600',
                    }}>
                      Créer une leçon
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{
                paddingHorizontal: 20,
                gap: 12,
              }}>
                {lessons.map(renderLesson)}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Menu Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            justifyContent: 'flex-start',
          }} onPress={() => setShowMenu(false)}>
            <View style={{
              position: 'absolute',
              top: 70,
              right: 20,
              backgroundColor: Colors.surface,
              borderRadius: 16,
              padding: 8,
              minWidth: 180,
              ...DesignTokens.shadows.lg,
              borderWidth: 1,
              borderColor: Colors.border,
            }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                  gap: 12,
                }}
                onPress={() => {
                  setShowMenu(false);
                  setNewSubjectName(subject?.name || '');
                  setShowRenameModal(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color={Colors.textPrimary} />
                <Text style={{
                  ...Typography.body,
                  color: Colors.textPrimary,
                  fontWeight: '500',
                }}>
                  Renommer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 8,
                  gap: 12,
                }}
                onPress={() => {
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                <Text style={{
                  ...Typography.body,
                  color: Colors.danger,
                  fontWeight: '500',
                }}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Rename Modal */}
        <Modal
          visible={showRenameModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRenameModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Pressable style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }} onPress={() => setShowRenameModal(false)} />
            <View style={{
              backgroundColor: Colors.surface,
              borderRadius: 20,
              padding: 24,
              marginHorizontal: 20,
              width: '90%',
              maxWidth: 400,
              ...DesignTokens.shadows.lg,
            }}>
              <Text style={{
                ...Typography.h3,
                color: Colors.textPrimary,
                textAlign: 'center',
                marginBottom: 20,
              }}>
                Renommer la matière
              </Text>
              <TextInput
                style={{
                  backgroundColor: Colors.surfaceAlt,
                  borderRadius: 12,
                  padding: 16,
                  ...Typography.body,
                  color: Colors.textPrimary,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  marginBottom: 24,
                }}
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                placeholder="Nom de la matière"
                placeholderTextColor={Colors.textSecondary}
                autoFocus
              />
              <View style={{
                flexDirection: 'row',
                gap: 12,
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 12,
                    backgroundColor: Colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowRenameModal(false);
                    setNewSubjectName('');
                  }}
                >
                  <Text style={{
                    ...Typography.body,
                    color: Colors.textSecondary,
                    fontWeight: '600',
                  }}>
                    Annuler
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={handleRenameSubject}
                >
                  <LinearGradient
                    colors={DesignTokens.gradients.brand}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      ...Typography.body,
                      color: Colors.textOnPrimary,
                      fontWeight: '600',
                    }}>
                      Renommer
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DoubleConfirmationModal
          visible={showDeleteModal}
          title="Supprimer la matière"
          message={`Êtes-vous sûr de vouloir supprimer "${subject?.name}" ?`}
          warningMessage={`Cette action supprimera la matière "${subject?.name}" et toutes ses leçons. Cette action ne peut pas être annulée.`}
          confirmText="Supprimer"
          onConfirm={handleDeleteSubject}
          onCancel={() => setShowDeleteModal(false)}
        />
      </SafeAreaView>
    </View>
  );
};