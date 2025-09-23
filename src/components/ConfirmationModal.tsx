import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  doubleConfirmation?: boolean;
  doubleConfirmText?: string;
  doubleConfirmMessage?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  isLoading = false,
  doubleConfirmation = false,
  doubleConfirmText = 'Confirmer la suppression',
  doubleConfirmMessage = 'Cette action est irréversible. Êtes-vous vraiment sûr ?',
}) => {
  const [step, setStep] = useState<'first' | 'second'>('first');

  const handleConfirm = () => {
    if (doubleConfirmation && step === 'first') {
      setStep('second');
    } else {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (doubleConfirmation && step === 'second') {
      setStep('first');
    } else {
      onCancel();
    }
  };

  const handleModalClose = () => {
    setStep('first');
    onCancel();
  };

  const currentTitle = step === 'first' ? title : doubleConfirmText;
  const currentMessage = step === 'first' ? message : doubleConfirmMessage;
  const currentConfirmText = step === 'first' && doubleConfirmation ? 'Continuer' : confirmText;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={step === 'first' ? 'warning-outline' : 'trash-outline'}
                size={24}
                color={step === 'first' ? Colors.accent.orange : Colors.accent.red}
              />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleModalClose}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{currentTitle}</Text>
            <Text style={styles.message}>{currentMessage}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                step === 'second' && styles.dangerButton
              ]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Text style={styles.confirmButtonText}>{currentConfirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 24,
  },
  title: {
    ...Typography.title2,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  cancelButtonText: {
    ...Typography.headline,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: Colors.accent.blue,
  },
  dangerButton: {
    backgroundColor: Colors.accent.red,
  },
  confirmButtonText: {
    ...Typography.headline,
    color: Colors.surface,
    fontWeight: '600',
  },
});
