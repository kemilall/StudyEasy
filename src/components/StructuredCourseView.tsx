import React, { useState } from 'react';
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
          <View style={styles.textBlock}>
            <Text style={styles.textContent} selectable={true}>
              {block.content}
            </Text>
          </View>
        );

      case 'example':
        return (
          <View style={styles.exampleBlock}>
            {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
            <Text style={styles.exampleContent} selectable={true}>{block.content}</Text>
          </View>
        );

      case 'formula':
        const formattedFormula = block.content
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
          .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
          .replace(/\\int/g, '∫')
          .replace(/\\sum/g, '∑')
          .replace(/\\pi/g, 'π')
          .replace(/\\theta/g, 'θ')
          .replace(/\\lambda/g, 'λ')
          .replace(/\\rightarrow/g, '→')
          .replace(/\\times/g, '×')
          .replace(/\\approx/g, '≈')
          .replace(/\\leq/g, '≤')
          .replace(/\\geq/g, '≥');

        return (
          <View style={styles.formulaBlock}>
            {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
            <Text style={styles.formulaContent} selectable={true}>{formattedFormula}</Text>
          </View>
        );

      case 'definition':
        return (
          <View style={styles.definitionBlock}>
            {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
            <Text style={styles.definitionContent} selectable={true}>{block.content}</Text>
          </View>
        );

      case 'bullet_points':
        const bulletPoints = block.content.split('\n').filter(point => point.trim());
        return (
          <View style={styles.bulletPointsBlock}>
            {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
            {bulletPoints.map((point, idx) => (
              <View key={idx} style={styles.bulletPoint}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletText} selectable={true}>{point.replace(/^[•\-\*]\s*/, '')}</Text>
              </View>
            ))}
          </View>
        );

      case 'summary':
        return (
          <View style={styles.summaryBlock}>
            {block.title && <Text style={styles.blockTitle} selectable={true}>{block.title}</Text>}
            <Text style={styles.summaryContent} selectable={true}>{block.content}</Text>
          </View>
        );

      default:
        return (
          <Text style={styles.textContent} selectable={true}>
            {block.content}
          </Text>
        );
    }
  };

  return <View style={styles.contentBlock}>{renderContent()}</View>;
};

const SubsectionComponent: React.FC<{ subsection: any; index: number }> = ({ subsection, index }) => {
  return (
    <View style={styles.subsection}>
      <Text style={styles.subsectionTitle}>{subsection.title}</Text>
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
  );
};

const SectionComponent: React.FC<{ section: any; index: number }> = ({ section, index }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.subsectionsContainer}>
        {section.subsections.map((subsection: any, subsectionIndex: number) => (
          <SubsectionComponent
            key={subsectionIndex}
            subsection={subsection}
            index={subsectionIndex}
          />
        ))}
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
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.lessonTitle} selectable={true}>
          {course.title}
        </Text>

        {/* Metadata */}
        <View style={styles.metadataRow}>
          <View style={styles.subjectPill}>
            <Text style={styles.subjectPillText}>{lesson?.subjectName || 'Physics'}</Text>
          </View>
          <Text style={styles.dateText}>
            • {lesson?.createdAt ? formatDate(lesson.createdAt) : 'April 22, 2024'}
          </Text>
        </View>

        {/* Action Buttons */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.actionButtonsScrollView}
          contentContainerStyle={styles.actionButtonsContainer}
        >
          {lesson?.flashcards && lesson.flashcards.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('Flashcards', { lessonId: lesson.id })}
            >
              <Ionicons name="layers-outline" size={18} color={Colors.textPrimary} />
              <Text style={styles.actionButtonText}>Review flashcards</Text>
            </TouchableOpacity>
          )}

          {lesson?.quiz && lesson.quiz.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate?.('Quiz', { lessonId: lesson.id })}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textPrimary} />
              <Text style={styles.actionButtonText}>Take quiz</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {/* Handle edit */}}
          >
            <Ionicons name="create-outline" size={18} color={Colors.textPrimary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Overview Section */}
        {course.overview && (
          <View style={styles.overviewSection}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewTitle}>Objectif du cours</Text>
              <Text style={styles.overviewText} selectable={true}>{course.overview.objective}</Text>
              
              {course.overview.main_ideas && course.overview.main_ideas.length > 0 && (
                <View style={styles.mainIdeasContainer}>
                  <Text style={styles.overviewSubtitle}>Idées principales</Text>
                  {course.overview.main_ideas.map((idea, index) => (
                    <View key={index} style={styles.ideaItem}>
                      <Text style={styles.ideaBullet}>▸</Text>
                      <Text style={styles.ideaText} selectable={true}>{idea}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Course Sections */}
        {course.sections.map((section, index) => (
          <SectionComponent
            key={index}
            section={section}
            index={index}
          />
        ))}

        {/* Conclusion */}
        {course.conclusion && (
          <View style={styles.conclusionSection}>
            <View style={styles.conclusionCard}>
              <Text style={styles.conclusionTitle}>Conclusion</Text>
              <Text style={styles.conclusionText} selectable={true}>{course.conclusion}</Text>
            </View>
          </View>
        )}

        {/* References */}
        {course.references && course.references.length > 0 && (
          <View style={styles.referencesSection}>
            <Text style={styles.referencesTitle}>Références</Text>
            {course.references.map((reference, index) => (
              <Text key={index} style={styles.referenceItem} selectable={true}>
                {index + 1}. {reference}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  lessonTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 16,
    fontFamily: 'Georgia',
    lineHeight: 35,
    letterSpacing: -0.1,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  subjectPill: {
    backgroundColor: Colors.primaryLavender + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  subjectPillText: {
    ...Typography.small,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  dateText: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  actionButtonsScrollView: {
    marginBottom: 40,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLavender + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primaryLavender + '40',
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    ...Typography.small,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  // Overview Section
  overviewSection: {
    marginBottom: 32,
  },
  overviewCard: {
    backgroundColor: Colors.gray[100],
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  overviewTitle: {
    ...Typography.title3,
    color: Colors.primaryLavender,
    marginBottom: 12,
    fontWeight: '700',
  },
  overviewText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  overviewSubtitle: {
    ...Typography.headline,
    color: Colors.primaryLavender,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
  },
  mainIdeasContainer: {
    marginTop: 16,
  },
  ideaItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ideaBullet: {
    color: Colors.primaryLavender,
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  ideaText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 24,
  },
  
  // Course Sections
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.primaryBlue,
    marginBottom: 20,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  subsectionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    ...Typography.headline,
    color: Colors.accentGreen,
    marginBottom: 16,
    fontWeight: '600',
  },
  blocksContainer: {
    gap: 12,
  },
  contentBlock: {
    marginBottom: 12,
  },
  
  // Content Blocks
  textBlock: {
    marginBottom: 8,
  },
  textContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  blockTitle: {
    ...Typography.headline,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: '600',
  },
  exampleBlock: {
    backgroundColor: Colors.primaryLavender + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryLavender,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exampleContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  formulaBlock: {
    backgroundColor: Colors.primaryBlue + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  formulaContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  definitionBlock: {
    backgroundColor: Colors.accentGreen + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.accentGreen,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  definitionContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  bulletPointsBlock: {
    backgroundColor: Colors.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletSymbol: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 24,
  },
  summaryBlock: {
    backgroundColor: Colors.danger + '10',
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  summaryContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  
  // Conclusion
  conclusionSection: {
    marginBottom: 32,
  },
  conclusionCard: {
    backgroundColor: Colors.primaryLavender + '10',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.primaryLavender + '30',
  },
  conclusionTitle: {
    ...Typography.title3,
    color: Colors.primaryLavender,
    marginBottom: 12,
    fontWeight: '700',
  },
  conclusionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  
  // References
  referencesSection: {
    marginBottom: 32,
  },
  referencesTitle: {
    ...Typography.headline,
    color: Colors.textPrimary,
    marginBottom: 12,
    fontWeight: '600',
  },
  referenceItem: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 22,
  },
});
