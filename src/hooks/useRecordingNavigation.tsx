import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRecording } from '../contexts/RecordingContext';
import { RecordingExitModal } from '../components/RecordingExitModal';

export const useRecordingNavigation = () => {
  const navigation = useNavigation();
  const { isRecording, currentDraft } = useRecording();
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    screen: string;
    params?: any;
  } | null>(null);

  // Check if there's an active recording or draft when navigating
  useEffect(() => {
    const handleNavigation = (e: any) => {
      if (isRecording || currentDraft) {
        e.preventDefault();
        setPendingNavigation({
          screen: e.data.route.name,
          params: e.data.params,
        });
        setShowExitModal(true);
      }
    };

    // Listen for navigation attempts
    const unsubscribe = navigation.addListener('beforeRemove', handleNavigation);

    return unsubscribe;
  }, [navigation, isRecording, currentDraft]);

  const handleExitModalClose = () => {
    setShowExitModal(false);
    setPendingNavigation(null);
  };

  const handleExitModalConfirm = () => {
    if (pendingNavigation) {
      (navigation as any).navigate(pendingNavigation.screen, pendingNavigation.params);
    } else {
      navigation.goBack();
    }
    handleExitModalClose();
  };

  const handleExitModalSaveDraft = () => {
    // Save as draft and navigate to home
    (navigation as any).navigate('MainTabs', { screen: 'Home' });
    handleExitModalClose();
  };

  const handleExitModalCancel = () => {
    // Cancel recording and navigate to home
    (navigation as any).navigate('MainTabs', { screen: 'Home' });
    handleExitModalClose();
  };

  return {
    showExitModal,
    pendingNavigation,
    handleExitModalClose,
    handleExitModalConfirm,
    handleExitModalSaveDraft,
    handleExitModalCancel,
  };
};
