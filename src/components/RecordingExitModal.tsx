import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useRecording } from '../contexts/RecordingContext';
import { useNavigation } from '@react-navigation/native';

interface RecordingExitModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RecordingExitModal: React.FC<RecordingExitModalProps> = ({
  visible,
  onClose,
}) => {
  const { cancelRecording, saveAsDraft } = useRecording();
  const navigation = useNavigation();

  const handleStopRecording = () => {
    cancelRecording();
    onClose();
  };

  const handleSaveAsDraft = () => {
    saveAsDraft();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="mic" size={32} color={Colors.accent.red} />
              </View>
              <Text style={styles.title}>Quitter l'enregistrement ?</Text>
              <Text style={styles.subtitle}>
                Votre enregistrement sera perdu si vous quittez maintenant.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.stopButton}
                onPress={handleStopRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="stop" size={20} color={Colors.surface} />
                <Text style={styles.stopButtonText}>Arrêter l'enregistrement</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.draftButton}
                onPress={handleSaveAsDraft}
                activeOpacity={0.8}
              >
                <Ionicons name="document" size={20} color={Colors.accent.blue} />
                <Text style={styles.draftButtonText}>Sauvegarder comme brouillon</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent.red + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.headline,
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  stopButton: {
    backgroundColor: Colors.accent.red,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
  draftButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.accent.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  draftButtonText: {
    ...Typography.headline,
    color: Colors.accent.blue,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  cancelButtonText: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
