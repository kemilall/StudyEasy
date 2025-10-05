import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DesignTokens } from '../constants/designTokens';
import { SubjectsStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/dataService';
import { Subject } from '../types';
import { SubjectCard } from '../components/SubjectCard';

type SubjectsListNavigationProp = StackNavigationProp<SubjectsStackParamList, 'SubjectsList'>;

export const SubjectsListScreen: React.FC = () => {
  const navigation = useNavigation<SubjectsListNavigationProp>();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { width } = Dimensions.get('window');
  const CARD_GAP = 16;
  const H_PADDING = 20;
  const CARD_WIDTH = (width - H_PADDING * 2 - CARD_GAP) / 2;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = DataService.subscribeToUserSubjects(user.uid, (userSubjects) => {
      setSubjects(userSubjects);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await DataService.deleteSubject(subjectId);
    } catch (error) {
      console.error('Error deleting subject:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la matière. Veuillez réessayer.');
    }
  };

  const renderSubject = ({ item }: { item: Subject }) => (
    <View style={{ width: CARD_WIDTH }}>
      <SubjectCard
        subject={item}
        onPress={() => navigation.navigate('Subject', { subjectId: item.id })}
        onDelete={() => handleDeleteSubject(item.id)}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        <ImageBackground
          source={require('../../assets/background_waves.png')}
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
      {/* Background decorative waves */}
      <ImageBackground
        source={require('../../assets/background_waves.png')}
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
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={renderSubject}
          numColumns={2}
          columnWrapperStyle={{
            gap: CARD_GAP,
            paddingHorizontal: H_PADDING,
            marginBottom: CARD_GAP,
          }}
          contentContainerStyle={{
            paddingTop: 32,
            paddingBottom: 48,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
              {/* Hero Header */}
              <View style={{
                backgroundColor: Colors.surface,
                borderRadius: 20,
                padding: 24,
                marginBottom: 8,
                ...DesignTokens.shadows.sm,
                borderWidth: 1,
                borderColor: Colors.border,
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      ...Typography.h1,
                      color: Colors.textPrimary,
                      fontWeight: '700',
                      marginBottom: 4,
                      fontSize: 28,
                    }}>
                      Mes Matières
                    </Text>
                    <Text style={{
                      ...Typography.body,
                      color: Colors.textSecondary,
                      lineHeight: 22,
                    }}>
                      Organisez vos cours par matière
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      backgroundColor: Colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                      ...DesignTokens.shadows.sm,
                    }}
                    onPress={() => (navigation as any).navigate('CreateSubject')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="add"
                      size={24}
                      color={Colors.primaryBlue}
                    />
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={{
              paddingHorizontal: 20,
              paddingTop: 40,
              alignItems: 'center',
            }}>
              <View style={{
                backgroundColor: Colors.surface,
                borderRadius: 20,
                padding: 48,
                alignItems: 'center',
                width: '100%',
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
                  <Ionicons name="school-outline" size={40} color={Colors.textSecondary} />
                </View>
                <Text style={{
                  ...Typography.h3,
                  color: Colors.textPrimary,
                  fontWeight: '700',
                  marginBottom: 8,
                  textAlign: 'center',
                }}>
                  Aucune matière
                </Text>
                <Text style={{
                  ...Typography.body,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 24,
                  marginBottom: 32,
                }}>
                  Créez votre première matière pour commencer à organiser vos cours
                </Text>
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate('CreateSubject')}
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
                      Créer une matière
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};
