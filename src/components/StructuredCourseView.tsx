import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StructuredCourse, ContentBlock, Lesson } from '../types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Ionicons } from '@expo/vector-icons';

interface StructuredCourseViewProps {
  course: StructuredCourse;
  lesson?: Lesson;
  onMarkComplete?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

const ContentBlockComponent: React.FC<{ block: ContentBlock; index: number }> = ({ block, index }) => {
  const renderContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <View>
            <Text style={styles.debugLabel}>TEXT</Text>
            <Text style={styles.textBlock} selectable={true}>
              {block.content}
            </Text>
          </View>
        );

      case 'example':
        return (
          <View>
            <Text style={styles.debugLabel}>EXAMPLE</Text>
            <View style={styles.exampleBlock}>
              {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
              <Text style={styles.exampleContent} selectable={true}>{block.content}</Text>
            </View>
          </View>
        );

      case 'formula':
        // Replace common mathematical symbols for better display
        const formattedFormula = block.content
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
          .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
          .replace(/\\int/g, '∫')
          .replace(/\\sum/g, '∑')
          .replace(/\\prod/g, '∏')
          .replace(/\\lim/g, 'lim')
          .replace(/\\infty/g, '∞')
          .replace(/\\pi/g, 'π')
          .replace(/\\alpha/g, 'α')
          .replace(/\\beta/g, 'β')
          .replace(/\\gamma/g, 'γ')
          .replace(/\\delta/g, 'δ')
          .replace(/\\epsilon/g, 'ε')
          .replace(/\\theta/g, 'θ')
          .replace(/\\lambda/g, 'λ')
          .replace(/\\mu/g, 'μ')
          .replace(/\\sigma/g, 'σ')
          .replace(/\\tau/g, 'τ')
          .replace(/\\phi/g, 'φ')
          .replace(/\\psi/g, 'ψ')
          .replace(/\\omega/g, 'ω')
          .replace(/\\Delta/g, 'Δ')
          .replace(/\\Sigma/g, 'Σ')
          .replace(/\\Pi/g, 'Π')
          .replace(/\\rightarrow/g, '→')
          .replace(/\\leftarrow/g, '←')
          .replace(/\\Rightarrow/g, '⇒')
          .replace(/\\Leftarrow/g, '⇐')
          .replace(/\\leftrightarrow/g, '↔')
          .replace(/\\Rightarrow/g, '⇒')
          .replace(/\\approx/g, '≈')
          .replace(/\\neq/g, '≠')
          .replace(/\\leq/g, '≤')
          .replace(/\\geq/g, '≥')
          .replace(/\\pm/g, '±')
          .replace(/\\mp/g, '∓')
          .replace(/\\times/g, '×')
          .replace(/\\div/g, '÷')
          .replace(/\\cdot/g, '⋅')
          .replace(/\\circ/g, '°')
          .replace(/\\partial/g, '∂')
          .replace(/\\nabla/g, '∇')
          .replace(/\\in/g, '∈')
          .replace(/\\notin/g, '∉')
          .replace(/\\subset/g, '⊂')
          .replace(/\\subseteq/g, '⊆')
          .replace(/\\supset/g, '⊃')
          .replace(/\\supseteq/g, '⊇')
          .replace(/\\cup/g, '∪')
          .replace(/\\cap/g, '∩')
          .replace(/\\emptyset/g, '∅')
          .replace(/\\forall/g, '∀')
          .replace(/\\exists/g, '∃')
          .replace(/\\nexists/g, '∄')
          .replace(/\\wedge/g, '∧')
          .replace(/\\vee/g, '∨')
          .replace(/\\neg/g, '¬')
          .replace(/\\therefore/g, '∴')
          .replace(/\\because/g, '∵');

        return (
          <View>
            <Text style={styles.debugLabel}>FORMULA</Text>
            <View style={styles.formulaBlock}>
              {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
              <Text style={styles.formulaContent} selectable={true}>{formattedFormula}</Text>
            </View>
          </View>
        );

      case 'definition':
        return (
          <View>
            <Text style={styles.debugLabel}>DEFINITION</Text>
            <View style={styles.definitionBlock}>
              {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
              <Text style={styles.definitionContent} selectable={true}>{block.content}</Text>
            </View>
          </View>
        );

      case 'bullet_points':
        const bulletPoints = block.content.split('\n').filter(point => point.trim());
        return (
          <View>
            <Text style={styles.debugLabel}>BULLET_POINTS</Text>
            <View style={styles.bulletPointsBlock}>
              {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
              {bulletPoints.map((point, idx) => {
              // Check if it's a numbered list (1. 2. 3. etc.)
              const isNumbered = /^\d+\./.test(point.trim());
              return (
                <View key={idx} style={styles.bulletPoint}>
                  {isNumbered ? (
                    <>
                      <Text style={styles.numberSymbol}>{point.match(/^\d+\./)[0]}</Text>
                      <Text style={styles.bulletText} selectable={true}>{point.replace(/^\d+\.\s*/, '')}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.bulletSymbol}>•</Text>
                      <Text style={styles.bulletText} selectable={true}>{point.replace(/^[•\-\*]\s*/, '')}</Text>
                    </>
                  )}
                </View>
              );
            })}
            </View>
          </View>
        );

      case 'summary':
        return (
          <View>
            <Text style={styles.debugLabel}>SUMMARY</Text>
            <View style={styles.summaryBlock}>
              {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
              <Text style={styles.summaryContent} selectable={true}>{block.content}</Text>
            </View>
          </View>
        );

      default:
        return (
          <View>
            <Text style={styles.debugLabel}>DEFAULT</Text>
            <Text style={styles.textBlock} selectable={true}>
              {block.content}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.contentBlock}>
      {renderContent()}
    </View>
  );
};

const SubsectionComponent: React.FC<{ subsection: any; index: number; isLast?: boolean }> = ({ subsection, index, isLast }) => {
  return (
    <View>
      <Text style={styles.debugLabel}>SUBSECTION_{index}</Text>
      <View style={[styles.subsection, isLast && { marginBottom: 0 }]}>
        <Text style={styles.debugLabel}>SUBSECTION_TITLE</Text>
        <Text style={styles.subsectionTitle}>{subsection.title}</Text>
        <Text style={styles.debugLabel}>BLOCKS_CONTAINER</Text>
        <View style={styles.blocksContainer}>
          {subsection.blocks.map((block: ContentBlock, blockIndex: number) => (
            <ContentBlockComponent
              key={blockIndex}
              block={block}
              index={blockIndex}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const SectionComponent: React.FC<{ section: any; index: number }> = ({ section, index }) => {
  return (
    <View>
      <Text style={styles.debugLabel}>SECTION_{index}</Text>
      <View style={styles.section}>
        <Text style={styles.debugLabel}>SECTION_TITLE</Text>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.debugLabel}>SUBSECTIONS_CONTAINER</Text>
        <View style={styles.subsectionsContainer}>
          {section.subsections.map((subsection: any, subsectionIndex: number) => (
            <SubsectionComponent
              key={subsectionIndex}
              subsection={subsection}
              index={subsectionIndex}
              isLast={subsectionIndex === section.subsections.length - 1}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export const StructuredCourseView: React.FC<StructuredCourseViewProps> = ({ 
  course, 
  lesson,
  onMarkComplete,
  onNavigate 
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Course Title */}
      <View>
        <Text style={styles.debugLabel}>COURSE_TITLE</Text>
        <Text style={styles.courseTitle} selectable={true}>{course.title}</Text>
      </View>

      {/* Status Card */}
      {lesson && (
        <View style={[styles.statusCard, lesson.isCompleted && styles.completedCard]}>
          <View style={styles.statusIcon}>
            <Ionicons
              name={lesson.isCompleted ? "checkmark-circle" : "time-outline"}
              size={24}
              color={lesson.isCompleted ? Colors.accent.green : Colors.accent.orange}
            />
          </View>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {lesson.isCompleted ? 'Leçon terminée' : 'En cours'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {lesson.duration && lesson.duration > 0 ? `${lesson.duration} minutes` : 'Durée inconnue'}
            </Text>
          </View>
          {!lesson.isCompleted && onMarkComplete && (
            <TouchableOpacity style={styles.completeButton} onPress={onMarkComplete}>
              <Text style={styles.completeButtonText}>Terminer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Overview */}
      <View>
        <Text style={styles.debugLabel}>OVERVIEW_CONTAINER</Text>
        <View style={styles.overviewContainer}>
          <View style={styles.overviewContent}>
            <Text style={styles.debugLabel}>OVERVIEW_OBJECTIVE_TITLE</Text>
            <Text style={styles.overviewTitle} selectable={true}>Objectif du cours</Text>
            <Text style={styles.debugLabel}>OVERVIEW_OBJECTIVE_CONTENT</Text>
            <Text style={styles.overviewObjective} selectable={true}>{course.overview.objective}</Text>

            {course.overview.main_ideas && course.overview.main_ideas.length > 0 && (
              <>
                <Text style={styles.debugLabel}>OVERVIEW_MAIN_IDEAS_TITLE</Text>
                <Text style={styles.overviewTitle} selectable={true}>Idées principales</Text>
                <Text style={styles.debugLabel}>OVERVIEW_MAIN_IDEAS_CONTENT</Text>
                {course.overview.main_ideas.map((idea, index) => (
                  <Text key={index} style={styles.mainIdea} selectable={true}>• {idea}</Text>
                ))}
              </>
            )}

            {course.overview.structure && course.overview.structure.length > 0 && (
              <>
                <Text style={styles.debugLabel}>OVERVIEW_STRUCTURE_TITLE</Text>
                <Text style={styles.overviewTitle} selectable={true}>Structure du cours</Text>
                <Text style={styles.debugLabel}>OVERVIEW_STRUCTURE_CONTENT</Text>
                {course.overview.structure.map((item, index) => (
                  <Text key={index} style={styles.structureItem} selectable={true}>{index + 1}. {item}</Text>
                ))}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Sections */}
      {course.sections.map((section, index) => (
        <SectionComponent
          key={index}
          section={section}
          index={index}
        />
      ))}

      {/* Conclusion */}
      <View>
        <Text style={styles.debugLabel}>CONCLUSION_CONTAINER</Text>
        <View style={styles.conclusionContainer}>
          <View style={styles.conclusionInner}>
            <Text style={styles.debugLabel}>CONCLUSION_TITLE</Text>
            <Text style={styles.conclusionTitle} selectable={true}>Conclusion</Text>
            <Text style={styles.debugLabel}>CONCLUSION_CONTENT</Text>
            <Text style={styles.conclusionContent} selectable={true}>{course.conclusion}</Text>
          </View>
        </View>
      </View>

      {/* References */}
      {course.references && course.references.length > 0 && (
        <View>
          <Text style={styles.debugLabel}>REFERENCES_CONTAINER</Text>
          <View style={styles.referencesContainer}>
            <View style={styles.referencesInner}>
              <Text style={styles.debugLabel}>REFERENCES_TITLE</Text>
              <Text style={styles.referencesTitle} selectable={true}>Références</Text>
              <Text style={styles.debugLabel}>REFERENCES_CONTENT</Text>
              {course.references.map((reference, index) => (
                <Text key={index} style={styles.referenceItem} selectable={true}>• {reference}</Text>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Action Cards */}
      {lesson && onNavigate && (
        <View style={styles.actionsGrid}>
          {lesson.transcription && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('Transcription', { lessonId: lesson.id })}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.accent.purple + '15' }]}>
                <Ionicons name="document-text" size={24} color={Colors.accent.purple} />
              </View>
              <Text style={styles.actionTitle} selectable={true}>Transcription</Text>
              <Text style={styles.actionSubtitle} selectable={true}>Texte complet</Text>
            </TouchableOpacity>
          )}

          {lesson.flashcards && lesson.flashcards.length > 0 && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('Flashcards', { lessonId: lesson.id })}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.accent.blue + '15' }]}>
                <Ionicons name="albums" size={24} color={Colors.accent.blue} />
              </View>
              <Text style={styles.actionTitle} selectable={true}>Flashcards</Text>
              <Text style={styles.actionSubtitle} selectable={true}>{lesson.flashcards.length} cartes</Text>
            </TouchableOpacity>
          )}

          {lesson.quiz && lesson.quiz.length > 0 && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('Quiz', { lessonId: lesson.id })}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.accent.green + '15' }]}>
                <Ionicons name="help-circle" size={24} color={Colors.accent.green} />
              </View>
              <Text style={styles.actionTitle} selectable={true}>Quiz</Text>
              <Text style={styles.actionSubtitle} selectable={true}>{lesson.quiz.length} questions</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => onNavigate('Chat', { lessonId: lesson.id })}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.accent.orange + '15' }]}>
              <Ionicons name="chatbubble" size={24} color={Colors.accent.orange} />
            </View>
            <Text style={styles.actionTitle} selectable={true}>Chat IA</Text>
            <Text style={styles.actionSubtitle} selectable={true}>Posez vos questions</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  courseTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'left',
    marginBottom: 20,
    marginTop: 0,
    lineHeight: 32,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    backgroundColor: Colors.accent.green + '10',
  },
  statusIcon: {
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statusSubtitle: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
  },
  completeButton: {
    backgroundColor: Colors.accent.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  completeButtonText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
  overviewContainer: {
    backgroundColor: Colors.surface,
    marginVertical: 16,
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  overviewContent: {
    paddingHorizontal: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 24,
  },
  overviewObjective: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: 12,
  },
  mainIdea: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 24,
  },
  structureItem: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 24,
  },
  sectionsContainer: {
    paddingHorizontal: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
    lineHeight: 28,
  },
  subsectionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  subsection: {
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 10,
    marginHorizontal: -4,
    lineHeight: 24,
  },
  blocksContainer: {
    // Container for content blocks
  },
  contentBlock: {
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
  textBlock: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  exampleBlock: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  exampleContent: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  formulaBlock: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  formulaContent: {
    fontSize: 16,
    color: Colors.text.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  definitionBlock: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  definitionContent: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  bulletPointsBlock: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletSymbol: {
    fontSize: 16,
    color: Colors.text.primary,
    marginRight: 8,
    marginTop: 2,
    fontWeight: '600',
  },
  bulletText: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 24,
  },
  numberSymbol: {
    fontSize: 16,
    color: Colors.text.primary,
    marginRight: 8,
    marginTop: 2,
    fontWeight: '600',
    minWidth: 24,
  },
  summaryBlock: {
    backgroundColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  summaryContent: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  conclusionContainer: {
    backgroundColor: Colors.surface,
    marginVertical: 16,
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  conclusionInner: {
    paddingHorizontal: 20,
  },
  conclusionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 10,
    lineHeight: 28,
  },
  conclusionContent: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  referencesContainer: {
    backgroundColor: Colors.surface,
    marginVertical: 16,
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  referencesInner: {
    paddingHorizontal: 20,
  },
  referencesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 10,
    lineHeight: 24,
  },
  referenceItem: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    ...Typography.caption1,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  debugLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent.red,
    backgroundColor: Colors.accent.yellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
});
