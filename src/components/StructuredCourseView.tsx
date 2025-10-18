import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { StructuredCourse, ContentItem, CourseSection, Lesson } from '../types';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { MathText } from './MathText';

interface StructuredCourseViewProps {
  course: StructuredCourse;
  lesson?: Lesson;
  onMarkComplete?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

// Component to visualize Mermaid mindmap syntax as a structured view
const MindmapVisualizer: React.FC<{ mermaidCode: string }> = ({ mermaidCode }) => {
  const parseMindmap = (code: string) => {
    const lines = code.split('\n').filter(line => line.trim());
    const nodes: { text: string; level: number; isRoot?: boolean }[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Skip the "mindmap" declaration
      if (trimmed === 'mindmap') return;
      
      // Count indentation level
      const indentLevel = line.search(/\S/);
      
      // Extract text from different node formats
      let text = '';
      let isRoot = false;
      
      // Root node with (( ))
      if (trimmed.match(/^\(\(.*\)\)$/)) {
        text = trimmed.replace(/^\(\(/, '').replace(/\)\)$/, '');
        isRoot = true;
      }
      // Root node with root(( ))
      else if (trimmed.match(/^root\(\(.*\)\)$/)) {
        text = trimmed.replace(/^root\(\(/, '').replace(/\)\)$/, '');
        isRoot = true;
      }
      // Regular node
      else {
        text = trimmed;
      }
      
      if (text) {
        nodes.push({ text, level: indentLevel / 2, isRoot });
      }
    });
    
    return nodes;
  };
  
  const nodes = parseMindmap(mermaidCode);
  
  if (nodes.length === 0) {
    // Fallback to showing the code if parsing fails
    return (
      <View style={styles.mindmapContent} testID="mindmap-content-fallback">
        <Text style={styles.mindmapLabel} testID="mindmap-label">Diagramme Mental:</Text>
        <Text style={styles.mindmapCode} testID="mindmap-code">{mermaidCode}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.mindmapContainer} testID="mindmap-container">
      {nodes.map((node, index) => (
        <View
          key={index}
          style={[
            styles.mindmapNode,
            node.isRoot && styles.mindmapRootNode,
            { marginLeft: node.level * 24 }
          ]}
          testID={`mindmap-node-${index}`}
        >
          {!node.isRoot && node.level > 0 && (
            <View style={styles.mindmapConnector} testID={`mindmap-connector-${index}`} />
          )}
          <View style={[
            styles.mindmapNodeContent,
            node.isRoot && styles.mindmapRootContent
          ]} testID={`mindmap-node-content-${index}`}>
            <Text style={[
              styles.mindmapNodeText,
              node.isRoot && styles.mindmapRootText
            ]} testID={`mindmap-node-text-${index}`}>
              {node.text}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Component to render formatted text with bold, italic, and list support
const FormattedText: React.FC<{ text: string; style?: any }> = ({ text, style }) => {
  // Check if text contains lists
  const lines = text.split('\n');
  const hasLists = lines.some(line => 
    /^\s*[-•*]\s/.test(line) || /^\s*\d+\.\s/.test(line)
  );

  if (hasLists) {
    return (
      <View>
        {lines.map((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          // Bullet list detection
          if (/^[-•*]\s/.test(trimmedLine)) {
            const content = trimmedLine.replace(/^[-•*]\s/, '');
            return (
              <View key={lineIndex} style={styles.listItem}>
                <Text style={styles.bulletSymbol}>•</Text>
                <FormattedTextInline text={content} style={[style, styles.listText]} />
              </View>
            );
          }
          
          // Numbered list detection
          if (/^\d+\.\s/.test(trimmedLine)) {
            const match = trimmedLine.match(/^(\d+)\.\s(.*)$/);
            if (match) {
              const [, number, content] = match;
              return (
                <View key={lineIndex} style={styles.listItem}>
                  <Text style={styles.numberSymbol}>{number}.</Text>
                  <FormattedTextInline text={content} style={[style, styles.listText]} />
                </View>
              );
            }
          }
          
          // Regular line
          if (trimmedLine) {
            return (
              <FormattedTextInline key={lineIndex} text={line} style={style} />
            );
          }
          
          // Empty line - add spacing
          return <View key={lineIndex} style={{ height: 8 }} />;
        })}
      </View>
    );
  }

  // No lists, use inline formatting
  return <FormattedTextInline text={text} style={style} />;
};

// Component for definition formatting (Term: Definition)
const DefinitionText: React.FC<{ text: string; style?: any }> = ({ text, style }) => {
  // Check if text contains a colon pattern for "Term : Definition"
  const colonMatch = text.match(/^([^:]+):\s*(.+)$/s);
  
  if (colonMatch) {
    const [, term, definition] = colonMatch;
    return (
      <Text style={style} selectable={true}>
        <Text style={{ color: Colors.accentGreen, fontWeight: '600' }}>
          {term.trim()}
        </Text>
        <Text> : </Text>
        <FormattedTextInline text={definition.trim()} style={style} />
      </Text>
    );
  }
  
  // If no colon pattern, just use regular formatting
  return <FormattedText text={text} style={style} />;
};
const FormattedTextInline: React.FC<{ text: string; style?: any }> = ({ text, style }) => {
  // Split text by line breaks first
  const lines = text.split('\n');
  
  if (lines.length === 1) {
    // Single line - check if THIS line contains LaTeX
    if (text.includes('\\(') || text.includes('\\[')) {
      return <MathText fontSize={16} lineHeight={22} style={{ ...(style || {}), textAlign: 'left' }}>{text}</MathText>;
    }
    
    // Handle inline formatting only (no old $ formulas)
    // Split by bold/italic formatting
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(part => part !== undefined && part !== '');
    
    return (
      <Text style={style} selectable={true}>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            return (
              <Text key={index} style={[style, { fontWeight: '700' }]}>
                {part.slice(2, -2)}
              </Text>
            );
          } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
            // Italic text
            return (
              <Text key={index} style={[style, { fontStyle: 'italic' }]}>
                {part.slice(1, -1)}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  }
  
  // Multiple lines - render each line separately
  return (
    <View>
      {lines.map((line, lineIndex) => {
        if (!line.trim()) {
          // Empty line - add spacing
          return <View key={lineIndex} style={{ height: 8 }} />;
        }
        
        // Check if this specific line contains LaTeX
        if (line.includes('\\(') || line.includes('\\[')) {
          return <MathText key={lineIndex} fontSize={16} lineHeight={22} style={{ ...(style || {}), textAlign: 'left' }}>{line}</MathText>;
        }
        
        // Process formatting for this line
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(part => part !== undefined && part !== '');
        
        return (
          <Text key={lineIndex} style={style} selectable={true}>
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                // Bold text
                return (
                  <Text key={`${lineIndex}-${partIndex}`} style={[style, { fontWeight: '700' }]}>
                    {part.slice(2, -2)}
                  </Text>
                );
              } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                // Italic text
                return (
                  <Text key={`${lineIndex}-${partIndex}`} style={[style, { fontStyle: 'italic' }]}>
                    {part.slice(1, -1)}
                  </Text>
                );
              }
              return <Text key={`${lineIndex}-${partIndex}`}>{part}</Text>;
            })}
          </Text>
        );
      })}
    </View>
  );
};

// DEPRECATED - Old formula handler kept for backwards compatibility
const OldFormattedTextInline: React.FC<{ text: string; style?: any }> = ({ text, style }) => {
  // Split text by line breaks first
  const lines = text.split('\n');
  
  if (lines.length === 1) {
    // Single line - handle inline formatting and formulas
    // Split by formulas first, then by formatting
    const formulaParts = text.split(/(\$[^$]+\$)/g);
    
    return (
      <Text style={style} selectable={true}>
        {formulaParts.map((formulaPart, formulaIndex) => {
          // Check if this is a formula
          if (formulaPart.startsWith('$') && formulaPart.endsWith('$') && formulaPart.length > 2) {
            const formula = formulaPart.slice(1, -1)
              // Greek letters
              .replace(/\\alpha/g, 'α')
              .replace(/\\beta/g, 'β')
              .replace(/\\gamma/g, 'γ')
              .replace(/\\delta/g, 'δ')
              .replace(/\\epsilon/g, 'ε')
              .replace(/\\sigma/g, 'σ')
              .replace(/\\mu/g, 'μ')
              .replace(/\\pi/g, 'π')
              .replace(/\\theta/g, 'θ')
              .replace(/\\lambda/g, 'λ')
              .replace(/\\omega/g, 'ω')
              .replace(/\\phi/g, 'φ')
              // Arrows
              .replace(/\\rightarrow/g, '→')
              .replace(/\\leftarrow/g, '←')
              .replace(/\\Rightarrow/g, '⇒')
              .replace(/\\leftrightarrow/g, '↔')
              // Math operators
              .replace(/\\times/g, '×')
              .replace(/\\div/g, '÷')
              .replace(/\\pm/g, '±')
              .replace(/\\approx/g, '≈')
              .replace(/\\neq/g, '≠')
              .replace(/\\leq/g, '≤')
              .replace(/\\geq/g, '≥')
              .replace(/\\infty/g, '∞')
              // Common functions
              .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
              .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
              .replace(/\\sum/g, '∑')
              .replace(/\\int/g, '∫')
              .replace(/\\partial/g, '∂')
              // Chemical notation - charges
              .replace(/\^(\+)/g, '⁺')
              .replace(/\^(\-)/g, '⁻')
              // Superscripts for powers (single digits)
              .replace(/\^0/g, '⁰')
              .replace(/\^1/g, '¹')
              .replace(/\^2/g, '²')
              .replace(/\^3/g, '³')
              .replace(/\^4/g, '⁴')
              .replace(/\^5/g, '⁵')
              .replace(/\^6/g, '⁶')
              .replace(/\^7/g, '⁷')
              .replace(/\^8/g, '⁸')
              .replace(/\^9/g, '⁹')
              // Subscripts for chemical formulas (single digits)
              .replace(/_0/g, '₀')
              .replace(/_1/g, '₁')
              .replace(/_2/g, '₂')
              .replace(/_3/g, '₃')
              .replace(/_4/g, '₄')
              .replace(/_5/g, '₅')
              .replace(/_6/g, '₆')
              .replace(/_7/g, '₇')
              .replace(/_8/g, '₈')
              .replace(/_9/g, '₉');
            
            return (
              <Text key={`formula-${formulaIndex}`} style={{ 
                fontFamily: 'Courier', 
                backgroundColor: Colors.primaryBlue + '10',
                paddingHorizontal: 4,
                borderRadius: 4,
                color: Colors.primaryBlue,
                fontWeight: '600'
              }}>
                {formula}
              </Text>
            );
          }
          
          // Not a formula, handle bold/italic formatting
          const parts = formulaPart.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
          
          return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              // Bold text
              return (
                <Text key={`${formulaIndex}-${index}`} style={[style, { fontWeight: '700' }]}>
                  {part.slice(2, -2)}
                </Text>
              );
            } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
              // Italic text
              return (
                <Text key={`${formulaIndex}-${index}`} style={[style, { fontStyle: 'italic' }]}>
                  {part.slice(1, -1)}
                </Text>
              );
            }
            return <Text key={`${formulaIndex}-${index}`}>{part}</Text>;
          });
        }).flat()}
      </Text>
    );
  }
  
  // Multiple lines - render each line separately
  return (
    <View>
      {lines.map((line, lineIndex) => {
        if (!line.trim()) {
          // Empty line - add spacing
          return <View key={lineIndex} style={{ height: 8 }} />;
        }
        
        // Process formulas and formatting for this line
        const formulaParts = line.split(/(\$[^$]+\$)/g);
        
        return (
          <Text key={lineIndex} style={style} selectable={true}>
            {formulaParts.map((formulaPart, formulaIndex) => {
              // Check if this is a formula
              if (formulaPart.startsWith('$') && formulaPart.endsWith('$') && formulaPart.length > 2) {
                const formula = formulaPart.slice(1, -1)
                  // Greek letters
                  .replace(/\\alpha/g, 'α')
                  .replace(/\\beta/g, 'β')
                  .replace(/\\gamma/g, 'γ')
                  .replace(/\\delta/g, 'δ')
                  .replace(/\\epsilon/g, 'ε')
                  .replace(/\\sigma/g, 'σ')
                  .replace(/\\mu/g, 'μ')
                  .replace(/\\pi/g, 'π')
                  .replace(/\\theta/g, 'θ')
                  .replace(/\\lambda/g, 'λ')
                  .replace(/\\omega/g, 'ω')
                  .replace(/\\phi/g, 'φ')
                  // Arrows
                  .replace(/\\rightarrow/g, '→')
                  .replace(/\\leftarrow/g, '←')
                  .replace(/\\Rightarrow/g, '⇒')
                  .replace(/\\leftrightarrow/g, '↔')
                  // Math operators
                  .replace(/\\times/g, '×')
                  .replace(/\\div/g, '÷')
                  .replace(/\\pm/g, '±')
                  .replace(/\\approx/g, '≈')
                  .replace(/\\neq/g, '≠')
                  .replace(/\\leq/g, '≤')
                  .replace(/\\geq/g, '≥')
                  .replace(/\\infty/g, '∞')
                  // Common functions
                  .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
                  .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
                  .replace(/\\sum/g, '∑')
                  .replace(/\\int/g, '∫')
                  .replace(/\\partial/g, '∂')
                  // Chemical notation - charges
                  .replace(/\^(\+)/g, '⁺')
                  .replace(/\^(\-)/g, '⁻')
                  // Superscripts for powers (single digits)
                  .replace(/\^0/g, '⁰')
                  .replace(/\^1/g, '¹')
                  .replace(/\^2/g, '²')
                  .replace(/\^3/g, '³')
                  .replace(/\^4/g, '⁴')
                  .replace(/\^5/g, '⁵')
                  .replace(/\^6/g, '⁶')
                  .replace(/\^7/g, '⁷')
                  .replace(/\^8/g, '⁸')
                  .replace(/\^9/g, '⁹')
                  // Subscripts for chemical formulas (single digits)
                  .replace(/_0/g, '₀')
                  .replace(/_1/g, '₁')
                  .replace(/_2/g, '₂')
                  .replace(/_3/g, '₃')
                  .replace(/_4/g, '₄')
                  .replace(/_5/g, '₅')
                  .replace(/_6/g, '₆')
                  .replace(/_7/g, '₇')
                  .replace(/_8/g, '₈')
                  .replace(/_9/g, '₉');
                  
                return (
                  <Text key={`${lineIndex}-formula-${formulaIndex}`} style={{ 
                    fontFamily: 'Courier', 
                    backgroundColor: Colors.primaryBlue + '10',
                    paddingHorizontal: 4,
                    borderRadius: 4,
                    color: Colors.primaryBlue,
                    fontWeight: '600'
                  }}>
                    {formula}
                  </Text>
                );
              }
              
              // Not a formula, handle bold/italic formatting
              const parts = formulaPart.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
              
              return parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  // Bold text
                  return (
                    <Text key={`${lineIndex}-${formulaIndex}-${partIndex}`} style={[style, { fontWeight: '700' }]}>
                      {part.slice(2, -2)}
                    </Text>
                  );
                } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                  // Italic text
                  return (
                    <Text key={`${lineIndex}-${formulaIndex}-${partIndex}`} style={[style, { fontStyle: 'italic' }]}>
                      {part.slice(1, -1)}
                    </Text>
                  );
                }
                return <Text key={`${lineIndex}-${formulaIndex}-${partIndex}`}>{part}</Text>;
              });
            }).flat()}
          </Text>
        );
      })}
    </View>
  );
};

// Component to render individual content items
const ContentItemComponent: React.FC<{ item: ContentItem; level?: number }> = ({ item, level = 0 }) => {
  const renderContent = () => {
    switch (item.type) {
      case 'texte':
        return (
          <View style={styles.textBlock} testID="content-text-block">
            <FormattedText text={item.valeur || ''} style={styles.textContent} />
          </View>
        );

      case 'exemple':
        return (
          <View style={styles.exampleBlock} testID="content-example-block">
            <Text style={styles.exampleLabel} testID="example-label">Exemple</Text>
            {item.titre && <Text style={styles.blockTitle} selectable={true} testID="example-title">📌 {item.titre}</Text>}
            <FormattedText text={item.valeur || ''} style={styles.exampleContent} />
          </View>
        );

      case 'formule':
        // Display formula using MathText with LaTeX support
        // Wrap in \[ \] for display mode if not already wrapped
        const formulaValue = item.valeur || '';
        const formulaContent = formulaValue.startsWith('\\[') ? formulaValue : `\\[ ${formulaValue} \\]`;
        
        return (
          <View style={styles.formulaBlock} testID="content-formula-block">
            {item.titre && <Text style={styles.blockTitle} selectable={true} testID="formula-title">📐 {item.titre}</Text>}
            <MathText fontSize={18} style={styles.formulaContent}>
              {formulaContent}
            </MathText>
          </View>
        );

      case 'definition':
        return (
          <View style={styles.definitionBlock} testID="content-definition-block">
            <View style={styles.definitionContainer}>
              <View style={styles.definitionTermBox}>
                <Text style={styles.definitionTermText}>
                  {item.titre}
                </Text>
              </View>
              <Text style={styles.definitionSeparator}> : </Text>
              <View style={styles.definitionValueBox}>
                <FormattedText text={item.valeur || ''} style={styles.definitionValueText} />
              </View>
            </View>
          </View>
        );

      case 'mindmap':
        // Parse and display Mermaid mindmap as a visual structure
        const mermaidCode = (item.valeur || '').replace(/```mermaid\n?/, '').replace(/```$/, '').trim();
        return (
          <View style={styles.mindmapBlock} testID="content-mindmap-block">
            {item.titre && <Text style={styles.blockTitle} selectable={true} testID="mindmap-title">🧠 {item.titre}</Text>}
            <MindmapVisualizer mermaidCode={mermaidCode} />
          </View>
        );

      case 'sous-section':
        return (
          <View style={[styles.subsection, level > 0 && styles.nestedSubsection]} testID={`subsection-level-${level}`}>
            {item.titre && <FormattedText text={item.titre} style={[styles.subsectionTitle, level > 0 && styles.nestedSubsectionTitle]} />}
            <View style={{ marginTop: 8 }}>
              {item.contenu && item.contenu.map((subItem, index) => (
                <View key={index} style={{ marginBottom: 12, position: 'relative' }}>
                  <ContentItemComponent item={subItem} level={level + 1} />
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return (
          <View style={{ position: 'relative' }}>
            <Text style={styles.textContent} selectable={true} testID="default-content-text">
              {item.valeur || ''}
            </Text>
          </View>
        );
    }
  };

  return <View style={styles.contentItem} testID="content-item">{renderContent()}</View>;
};

// Component to render a course section
const CourseSectionComponent: React.FC<{ section: CourseSection; index: number }> = ({ section, index }) => {
  return (
    <View style={styles.section} testID={`course-section-${index}`}>
      <Text style={styles.sectionTitle} testID={`section-title-${index}`}>{section.titre}</Text>
      <View style={styles.sectionContent} testID={`section-content-${index}`}>
        {section.contenu.map((item, itemIndex) => (
          <ContentItemComponent key={itemIndex} item={item} />
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
  // Log du contenu brut du cours uniquement
  console.log('========================================');
  console.log('📚 CONTENU DU COURS BRUT');
  console.log('========================================');
  console.log(JSON.stringify(course, null, 2));
  console.log('========================================');

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(date).toLocaleDateString('fr-FR', options);
  };

  return (
    <View style={styles.mainContainer} testID="main-container">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} testID="main-scroll-view">
        {/* Title */}
        <View style={{ position: 'relative' }}>
          <Text style={styles.lessonTitle} selectable={true} testID="lesson-title">
            {course.titre_cours}
          </Text>
        </View>

        {/* Metadata */}
        <View style={styles.metadataRow} testID="metadata-section">
          <View style={styles.subjectPill} testID="subject-pill">
            <Text style={styles.subjectPillText} testID="subject-pill-text">{lesson?.subjectName || 'Matière'}</Text>
          </View>
          <Text style={styles.dateText} testID="date-text">
            • {lesson?.createdAt ? formatDate(lesson.createdAt) : formatDate(new Date())}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ position: 'relative', marginBottom: 32 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.actionButtonsScrollView}
            contentContainerStyle={styles.actionButtonsContainer}
            testID="action-buttons-scroll-view"
          >
            {lesson?.flashcards && lesson.flashcards.length > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigate?.('Flashcards', { lessonId: lesson.id })}
                testID="flashcards-button"
              >
                <Ionicons name="layers-outline" size={18} color={Colors.textPrimary} testID="flashcards-icon" />
                <Text style={styles.actionButtonText} testID="flashcards-button-text">Réviser les flashcards</Text>
              </TouchableOpacity>
            )}

            {lesson?.quiz && lesson.quiz.length > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onNavigate?.('Quiz', { lessonId: lesson.id })}
                testID="quiz-button"
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textPrimary} testID="quiz-icon" />
                <Text style={styles.actionButtonText} testID="quiz-button-text">Faire le quiz</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {/* Handle edit */}}
              testID="edit-button"
            >
              <Ionicons name="create-outline" size={18} color={Colors.textPrimary} testID="edit-icon" />
              <Text style={styles.actionButtonText} testID="edit-button-text">Modifier</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Description */}
        {course.description && (
          <View style={styles.descriptionSection} testID="description-section">
            <View style={styles.descriptionCard} testID="description-card">
              <Text style={styles.descriptionTitle} testID="description-title">Description du cours</Text>
              <FormattedText text={course.description} style={styles.descriptionText} />
            </View>
          </View>
        )}

        {/* Introduction */}
        {course.introduction?.texte && (
          <View style={styles.introductionSection} testID="introduction-section">
            <View style={styles.introductionCard} testID="introduction-card">
              <Text style={styles.introductionTitle} testID="introduction-title">Introduction</Text>
              <FormattedText text={course.introduction.texte} style={styles.introductionText} />
            </View>
          </View>
        )}

        {/* Course Plan */}
        {course.plan && course.plan.length > 0 && (
          <View style={styles.planSection} testID="plan-section">
            <Text style={styles.planTitle} testID="plan-title">Plan du cours</Text>
            <View style={styles.planCard} testID="plan-card">
              {course.plan.map((item, index) => (
                <View key={index} style={[styles.planItem, { position: 'relative' }]} testID={`plan-item-${index}`}>
                  <Text style={styles.planNumber} testID={`plan-number-${index}`}>{index + 1}.</Text>
                  <FormattedTextInline text={item} style={styles.planText} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Course Sections */}
        {course.sections.map((section, index) => (
          <CourseSectionComponent
            key={index}
            section={section}
            index={index}
          />
        ))}

        {/* Conclusion */}
        {course.conclusion?.texte && (
          <View style={styles.conclusionSection} testID="conclusion-section">
            <View style={styles.conclusionCard} testID="conclusion-card">
              <Text style={styles.conclusionTitle} testID="conclusion-title">Conclusion</Text>
              <FormattedText text={course.conclusion.texte} style={styles.conclusionText} />
            </View>
          </View>
        )}

        {/* References */}
        {course.references && course.references.length > 0 && (
          <View style={styles.referencesSection} testID="references-section">
            <Text style={styles.referencesTitle} testID="references-title">Références</Text>
            <View style={styles.referencesCard} testID="references-card">
              {course.references.map((reference, index) => (
                <View key={index} style={[styles.referenceItem, { position: 'relative' }]} testID={`reference-item-${index}`}>
                  <Text style={styles.referenceNumber} testID={`reference-number-${index}`}>{index + 1}.</Text>
                  <View style={styles.referenceContent} testID={`reference-content-${index}`}>
                    <FormattedTextInline text={reference.titre} style={styles.referenceTitle} />
                    {reference.auteur && (
                      <Text style={styles.referenceDetail} selectable={true} testID={`reference-author-${index}`}>
                        Par {reference.auteur}
                        {reference.annee && ` (${reference.annee})`}
                        {reference.editeur && ` - ${reference.editeur}`}
                      </Text>
                    )}
                    {reference.lien && (
                      <Text style={styles.referenceLink} selectable={true} testID={`reference-link-${index}`}>
                        {reference.lien}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} testID="bottom-spacing" />
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
  },
  lessonTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 16,
    fontFamily: 'Georgia',
    lineHeight: 36,
    letterSpacing: -0.5,
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
    marginBottom: 32,
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
  
  // Description Section
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionCard: {
    backgroundColor: Colors.gray[100],
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  descriptionTitle: {
    ...Typography.title3,
    color: Colors.primaryLavender,
    marginBottom: 12,
    fontWeight: '700',
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  
  // Introduction Section
  introductionSection: {
    marginBottom: 24,
  },
  introductionCard: {
    backgroundColor: Colors.primaryBlue + '08',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.primaryBlue + '20',
  },
  introductionTitle: {
    ...Typography.title3,
    color: Colors.primaryBlue,
    marginBottom: 12,
    fontWeight: '700',
  },
  introductionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  
  // Plan Section
  planSection: {
    marginBottom: 32,
  },
  planTitle: {
    ...Typography.headline,
    color: Colors.textPrimary,
    marginBottom: 12,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  planItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  planNumber: {
    ...Typography.body,
    color: Colors.primaryLavender,
    fontWeight: '600',
    marginRight: 8,
    width: 20,
  },
  planText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
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
  sectionContent: {
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
  
  // Content Items
  contentItem: {
    marginBottom: 6,
  },
  textBlock: {
    marginBottom: 8,
  },
  textContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  blockTitle: {
    ...Typography.headline,
    color: Colors.textPrimary,
    marginBottom: 8,
    fontWeight: '600',
  },
  definitionTitle: {
    ...Typography.headline,
    color: Colors.accentGreen,
    marginBottom: 12,
    fontWeight: '700',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Example Block
  exampleBlock: {
    backgroundColor: Colors.primaryLavender + '10',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primaryLavender + '20',
  },
  exampleLabel: {
    fontSize: 12,
    color: Colors.primaryLavender,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  exampleContent: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
    flex: 1,
  },
  
  // Formula Block
  formulaBlock: {
    backgroundColor: Colors.primaryBlue + '10',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  formulaContent: {
    ...Typography.title3,
    color: Colors.primaryBlue,
    fontFamily: 'Courier',
    textAlign: 'center',
    lineHeight: 28,
  },
  
  // Definition Block - Simple style without border
  definitionBlock: {
    marginVertical: 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  definitionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  definitionTermBox: {
    backgroundColor: Colors.primaryLavender + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primaryLavender + '20',
  },
  definitionTermText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  definitionSeparator: {
    color: Colors.textSecondary,
    marginHorizontal: 4,
    marginTop: 6,
  },
  definitionValueBox: {
    flex: 1,
    marginTop: 6,
  },
  definitionValueText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  
  // Mindmap Block
  mindmapBlock: {
    backgroundColor: Colors.warning + '08',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  mindmapContent: {
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    padding: 12,
  },
  mindmapLabel: {
    ...Typography.caption1,
    color: Colors.warning,
    fontWeight: '600',
    marginBottom: 8,
  },
  mindmapCode: {
    ...Typography.small,
    color: Colors.textPrimary,
    fontFamily: 'Courier',
    lineHeight: 20,
  },
  
  // Mindmap Visualizer Styles
  mindmapContainer: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  mindmapNode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    position: 'relative',
  },
  mindmapRootNode: {
    marginVertical: 12,
    justifyContent: 'center',
  },
  mindmapConnector: {
    position: 'absolute',
    left: -20,
    top: '50%',
    width: 20,
    height: 2,
    backgroundColor: Colors.warning + '40',
    marginTop: -1,
  },
  mindmapNodeContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: Colors.warning + '30',
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mindmapRootContent: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  mindmapNodeText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  mindmapRootText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  
  // Subsections
  subsection: {
    marginTop: 20,
    marginBottom: 20,
    paddingLeft: 0,
  },
  nestedSubsection: {
    marginLeft: 20,
    paddingLeft: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accentGreen + '30',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingVertical: 16,
    paddingRight: 16,
  },
  subsectionTitle: {
    ...Typography.headline,
    color: Colors.accentGreen,
    marginBottom: 8,
    fontWeight: '700',
    fontSize: 20,
  },
  nestedSubsectionTitle: {
    fontSize: 18,
    marginBottom: 6,
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
    marginBottom: 16,
    fontWeight: '600',
  },
  referencesCard: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 16,
  },
  referenceItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  referenceNumber: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginRight: 8,
    width: 20,
  },
  referenceContent: {
    flex: 1,
  },
  referenceTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  referenceDetail: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  referenceLink: {
    ...Typography.small,
    color: Colors.primaryBlue,
    textDecorationLine: 'underline',
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 12,
    paddingVertical: 2,
  },
  bulletSymbol: {
    fontSize: 18,
    color: Colors.primaryLavender,
    marginRight: 12,
    marginTop: 1,
    fontWeight: '700',
    textShadowColor: Colors.primaryLavender + '30',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  numberSymbol: {
    fontSize: 16,
    color: Colors.primaryBlue,
    marginRight: 12,
    marginTop: 2,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'right',
    backgroundColor: Colors.primaryBlue + '15',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  listText: {
    flex: 1,
    lineHeight: 26,
    marginTop: 1,
  },
});