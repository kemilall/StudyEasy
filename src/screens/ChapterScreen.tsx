import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { Chapter } from '../types';
import { fetchChapter } from '../api/backend';
import { loadCachedChapter } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';

type ChapterScreenRouteProp = RouteProp<RootStackParamList, 'Chapter'>;
type ChapterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chapter'>;

export const ChapterScreen: React.FC = () => {
  const navigation = useNavigation<ChapterScreenNavigationProp>();
  const route = useRoute<ChapterScreenRouteProp>();
  const { chapterId } = route.params;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
 
   const loadChapter = useCallback(async () => {
     try {
       setError(null);
       setIsLoading(true);
       const data = await fetchChapter(chapterId);
       setChapter(data);
     } catch (_err) {
       setError("Impossible de charger ce chapitre.");
     } finally {
       setIsLoading(false);
     }
   }, [chapterId]);
 
  useEffect(() => {
    let isMounted = true;

    const bootstrapFromCache = async () => {
      if (!user) return;
      const cached = await loadCachedChapter(chapterId);
      if (cached && isMounted) {
        setChapter(cached);
        setIsLoading(false);
      }
    };

    bootstrapFromCache();
    loadChapter();

    return () => {
      isMounted = false;
    };
  }, [user, loadChapter, chapterId]);
 
   if (isLoading && !chapter) {
     return (
       <SafeAreaView style={[styles.container, styles.centered]}>
         <ActivityIndicator size="large" color={Colors.accent.blue} />
       </SafeAreaView>
     );
   }
 
   if (error) {
     return (
       <SafeAreaView style={[styles.container, styles.centered]}>
         <Ionicons name="warning" size={36} color={Colors.accent.red} />
         <Text style={styles.errorText}>{error}</Text>
         <TouchableOpacity style={styles.retryButton} onPress={loadChapter}>
           <Text style={styles.retryText}>Réessayer</Text>
         </TouchableOpacity>
       </SafeAreaView>
     );
   }
 
   if (!chapter) {
     return null;
   }
 
   const features = [
     {
       icon: 'document-text-outline',
       title: 'Transcription',
       subtitle: 'Texte complet du cours',
       color: Colors.accent.blue,
       onPress: () => navigation.navigate('Transcription', { chapterId }),
     },
     {
       icon: 'albums-outline',
       title: 'Flashcards',
       subtitle: `${chapter.flashcards?.length || 0} cartes`,
       color: Colors.accent.green,
       onPress: () => navigation.navigate('Flashcards', { chapterId }),
     },
     {
       icon: 'help-circle-outline',
       title: 'Quiz',
       subtitle: `${chapter.quiz?.length || 0} questions`,
       color: Colors.accent.orange,
       onPress: () => navigation.navigate('Quiz', { chapterId }),
     },
     {
       icon: 'chatbubble-outline',
       title: 'Chat IA',
       subtitle: 'Poser des questions',
       color: Colors.accent.purple,
       onPress: () => navigation.navigate('Chat', { chapterId }),
     },
   ];
 
   const isProcessing = chapter.isProcessing || chapter.status === 'processing' || chapter.status === 'pending';
 
   return (
     <SafeAreaView style={styles.container}>
       <ScrollView 
         showsVerticalScrollIndicator={false}
         refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadChapter} />}
       >
         <View style={styles.header}>
           <TouchableOpacity 
             onPress={() => navigation.goBack()}
             style={styles.backButton}
           >
             <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
           </TouchableOpacity>
           
           <Text style={styles.title}>{chapter.name}</Text>
           
           <View style={styles.metaContainer}>
             <View style={styles.metaItem}>
               <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
               <Text style={styles.metaText}>{chapter.duration} min</Text>
             </View>
             {chapter.isCompleted && (
               <View style={styles.metaItem}>
                 <Ionicons name="checkmark-circle" size={16} color={Colors.accent.green} />
                 <Text style={[styles.metaText, { color: Colors.accent.green }]}
                 >
                   Complété
                 </Text>
               </View>
             )}
             {chapter.status === 'failed' && (
               <View style={styles.metaItem}>
                 <Ionicons name="warning" size={16} color={Colors.accent.red} />
                 <Text style={[styles.metaText, { color: Colors.accent.red }]}>Erreur</Text>
               </View>
             )}
           </View>
         </View>
 
         <View style={styles.content}>
           {chapter.status === 'failed' && (
             <View style={styles.errorBanner}>
               <Ionicons name="alert-circle-outline" size={20} color={Colors.accent.red} />
               <Text style={styles.errorBannerText}>
                 {chapter.failureReason || 'Une erreur est survenue durant la génération.'}
               </Text>
             </View>
           )}
 
           {isProcessing && (
             <View style={styles.processingBanner}>
               <ActivityIndicator size="small" color={Colors.accent.blue} />
               <Text style={styles.processingText}>Traitement en cours, patientez quelques instants...</Text>
             </View>
           )}
 
           {chapter.summary && (
             <View style={styles.summaryContainer}>
               <Text style={styles.sectionTitle}>Résumé</Text>
               <Text style={styles.summary}>{chapter.summary}</Text>
             </View>
           )}
 
           {chapter.bulletPoints?.length ? (
             <View style={styles.bulletPointsContainer}>
               <Text style={styles.sectionTitle}>Points clés</Text>
               {chapter.bulletPoints.map((point, index) => (
                 <View key={index} style={styles.bulletPoint}>
                   <View style={styles.bullet} />
                   <Text style={styles.bulletText}>{point}</Text>
                 </View>
               ))}
             </View>
           ) : null}
 
           {chapter.sections?.length ? (
             <View style={styles.sectionsContainer}>
               <Text style={styles.sectionTitle}>Cours détaillé</Text>
               {chapter.sections.map((section, index) => (
                 <View key={index} style={styles.sectionBlock}>
                   <Text style={styles.sectionHeading}>{section.heading}</Text>
                   <Text style={styles.sectionOverview}>{section.overview}</Text>
                   {section.key_points?.length ? (
                     <View style={styles.sectionKeyPoints}>
                       {section.key_points.map((kp, idx) => (
                         <View key={idx} style={styles.keyPointItem}>
                           <View style={styles.keyPointMarker} />
                           <Text style={styles.keyPointText}>{kp}</Text>
                         </View>
                       ))}
                     </View>
                   ) : null}
                   {section.detailed_content && (
                     <Text style={styles.sectionContent}>{section.detailed_content}</Text>
                   )}
                 </View>
               ))}
             </View>
           ) : null}
 
           <View style={styles.featuresContainer}>
             <Text style={styles.sectionTitle}>Ressources</Text>
             <View style={styles.featuresGrid}>
               {features.map((feature, index) => (
                 <TouchableOpacity
                   key={index}
                   style={styles.featureCard}
                   onPress={feature.onPress}
                   activeOpacity={0.8}
                   disabled={isProcessing || chapter.status === 'failed'}
                 >
                   <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                     <Ionicons 
                       name={feature.icon as any} 
                       size={24} 
                       color={feature.color} 
                     />
                   </View>
                   <Text style={styles.featureTitle}>{feature.title}</Text>
                   <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                 </TouchableOpacity>
               ))}
             </View>
           </View>
         </View>
       </ScrollView>
     </SafeAreaView>
   );
 };
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: Colors.background,
   },
   centered: {
     justifyContent: 'center',
     alignItems: 'center',
     gap: 16,
   },
   header: {
     paddingHorizontal: 24,
     paddingTop: 16,
     paddingBottom: 24,
   },
   backButton: {
     marginBottom: 16,
   },
   title: {
     ...Typography.title1,
     color: Colors.text.primary,
     marginBottom: 12,
   },
   metaContainer: {
     flexDirection: 'row',
     gap: 16,
   },
   metaItem: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 6,
   },
   metaText: {
     ...Typography.footnote,
     color: Colors.text.secondary,
   },
   content: {
     paddingHorizontal: 24,
     paddingBottom: 32,
   },
   sectionTitle: {
     ...Typography.title3,
     color: Colors.text.primary,
     marginBottom: 16,
   },
   summaryContainer: {
     marginBottom: 32,
   },
   summary: {
     ...Typography.body,
     color: Colors.text.primary,
     lineHeight: 24,
   },
   bulletPointsContainer: {
     marginBottom: 32,
   },
   bulletPoint: {
     flexDirection: 'row',
     marginBottom: 12,
   },
   bullet: {
     width: 6,
     height: 6,
     borderRadius: 3,
     backgroundColor: Colors.text.secondary,
     marginTop: 8,
     marginRight: 12,
   },
   bulletText: {
     ...Typography.body,
     color: Colors.text.primary,
     flex: 1,
   },
   sectionsContainer: {
     marginBottom: 32,
     gap: 24,
   },
   sectionBlock: {
     backgroundColor: Colors.surface,
     padding: 20,
     borderRadius: 16,
     gap: 12,
   },
   sectionHeading: {
     ...Typography.title3,
     color: Colors.text.primary,
   },
   sectionOverview: {
     ...Typography.subheadline,
     color: Colors.text.secondary,
   },
   sectionKeyPoints: {
     gap: 8,
   },
   keyPointItem: {
     flexDirection: 'row',
     alignItems: 'flex-start',
     gap: 8,
   },
   keyPointMarker: {
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: Colors.accent.blue,
     marginTop: 6,
   },
   keyPointText: {
     ...Typography.body,
     color: Colors.text.primary,
     flex: 1,
   },
   sectionContent: {
     ...Typography.body,
     color: Colors.text.primary,
     lineHeight: 24,
   },
   featuresContainer: {
     marginTop: 16,
   },
   featuresGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 16,
   },
   featureCard: {
     width: '48%',
     backgroundColor: Colors.surface,
     borderRadius: 16,
     padding: 16,
     gap: 12,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 2,
     },
     shadowOpacity: 0.05,
     shadowRadius: 8,
     elevation: 2,
   },
   featureIcon: {
     width: 40,
     height: 40,
     borderRadius: 20,
     justifyContent: 'center',
     alignItems: 'center',
   },
   featureTitle: {
     ...Typography.subheadline,
     color: Colors.text.primary,
     fontWeight: '600',
   },
   featureSubtitle: {
     ...Typography.footnote,
     color: Colors.text.secondary,
   },
   errorText: {
     ...Typography.subheadline,
     color: Colors.accent.red,
     textAlign: 'center',
   },
   retryButton: {
     paddingHorizontal: 20,
     paddingVertical: 10,
     backgroundColor: Colors.accent.blue,
     borderRadius: 24,
   },
   retryText: {
     ...Typography.footnote,
     color: Colors.surface,
   },
   errorBanner: {
     flexDirection: 'row',
     gap: 12,
     backgroundColor: Colors.accent.red + '10',
     borderRadius: 12,
     padding: 16,
     marginBottom: 20,
     alignItems: 'center',
   },
   errorBannerText: {
     ...Typography.footnote,
     color: Colors.accent.red,
     flex: 1,
   },
   processingBanner: {
     flexDirection: 'row',
     gap: 12,
     alignItems: 'center',
     backgroundColor: Colors.accent.blue + '10',
     padding: 16,
     borderRadius: 12,
     marginBottom: 20,
   },
   processingText: {
     ...Typography.footnote,
     color: Colors.accent.blue,
     flex: 1,
   },
 });
