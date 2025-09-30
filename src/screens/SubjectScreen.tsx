import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Subject, Lesson } from '../types';
import { LessonCard } from '../components/LessonCard';
import { DoubleConfirmationModal } from '../components/DoubleConfirmationModal';

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
      style={styles.lessonCard}
      activeOpacity={0.7}
      onPress={() => (navigation as any).navigate('Lesson', { lessonId: lesson.id })}
    >
      <View style={[styles.lessonIndicator, { backgroundColor: subject?.color || Colors.accent.blue }]} />
      <Text style={styles.lessonName} numberOfLines={2}>{lesson.name}</Text>
      <View style={styles.lessonMeta}>
        <Ionicons name="time-outline" size={12} color={Colors.text.tertiary} />
        <Text style={styles.lessonDuration}>{lesson.duration || 45} min</Text>
      </View>
    </TouchableOpacity>
  );

  if (!subject || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.blue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={[styles.subjectIcon, { backgroundColor: subject.color + '15' }]}>
              <Ionicons
                name={getSubjectIcon(subject.name) as any}
                size={40}
                color={subject.color}
              />
            </View>
            <Text style={styles.subjectName}>{subject.name}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{subject.lessonsCount || 0}</Text>
                <Text style={styles.statLabel}>Leçons</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{subject.completedLessons || 0}</Text>
                <Text style={styles.statLabel}>Terminées</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {subject.lessonsCount ? Math.round(((subject.completedLessons || 0) / subject.lessonsCount) * 100) : 0}%
                </Text>
                <Text style={styles.statLabel}>Progrès</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowMenu(true)}
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Recent Lessons */}
        {recentLessons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Leçons récentes</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lessonsScroll}
            >
              {recentLessons.map(renderRecentLesson)}
            </ScrollView>
          </View>
        )}

        {/* Lessons Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leçons</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => (navigation as any).navigate('RecordingStudio', {
                  subjectId,
                  subjectName: subject?.name || 'Matière',
                  subjectColor: subject?.color,
                })}
              >
                <Ionicons name="add-circle" size={20} color={Colors.accent.blue} />
                <Text style={styles.addButtonText}>Nouvelle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {lessons.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={48} color={Colors.text.tertiary} />
              <Text style={styles.emptyTitle}>Aucune leçon</Text>
              <Text style={styles.emptySubtitle}>
                Créez votre première leçon pour cette matière
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => (navigation as any).navigate('RecordingStudio', {
                  subjectId,
                  subjectName: subject?.name || 'Matière',
                  subjectColor: subject?.color,
                })}
              >
                <Text style={styles.createButtonText}>Créer une leçon</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.lessonsContainer}>
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
        <Pressable style={styles.modalBackdrop} onPress={() => setShowMenu(false)}>
          <View style={styles.menuModal}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setNewSubjectName(subject?.name || '');
                setShowRenameModal(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
              <Text style={styles.menuItemText}>Renommer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowDeleteModal(true);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.accent.red} />
              <Text style={[styles.menuItemText, styles.deleteText]}>Supprimer</Text>
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
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdrop} onPress={() => setShowRenameModal(false)} />
          <View style={styles.renameModal}>
            <Text style={styles.modalTitle}>Renommer la matière</Text>
            <TextInput
              style={styles.renameInput}
              value={newSubjectName}
              onChangeText={setNewSubjectName}
              placeholder="Nom de la matière"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRenameModal(false);
                  setNewSubjectName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRenameSubject}
              >
                <Text style={styles.confirmButtonText}>Renommer</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 20,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  subjectIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectName: {
    ...Typography.largeTitle,
    color: Colors.text.primary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: 4,
  },
  editButtonText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    ...Typography.footnote,
    color: Colors.accent.blue,
    fontWeight: '700',
  },
  lessonsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  lessonCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  lessonIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  lessonName: {
    ...Typography.footnote,
    color: Colors.text.primary,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  lessonDuration: {
    ...Typography.caption2,
    color: Colors.text.tertiary,
  },
  lessonsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  lessonListCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  lessonContent: {
    flex: 1,
    marginRight: 12,
  },
  lessonHeader: {
    marginBottom: 12,
  },
  lessonListName: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  lessonStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonChapters: {
    ...Typography.caption1,
    color: Colors.text.secondary,
  },
  lessonProgress: {
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    ...Typography.caption2,
    color: Colors.text.secondary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    marginHorizontal: 20,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text.primary,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: Colors.accent.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '700',
  },
  // Menu styles
  menuButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
  },
  menuModal: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  menuItemText: {
    ...Typography.subheadline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  deleteText: {
    color: Colors.accent.red,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  renameModal: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    ...Typography.title2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  renameInput: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 16,
    ...Typography.body,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: Colors.gray[100],
  },
  confirmButton: {
    backgroundColor: Colors.accent.blue,
  },
  cancelButtonText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  confirmButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
});