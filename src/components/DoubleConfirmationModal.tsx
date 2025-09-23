import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface DoubleConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  warningMessage: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DoubleConfirmationModal: React.FC<DoubleConfirmationModalProps> = ({
  visible,
  title,
  message,
  warningMessage,
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const handleReset = () => {
    setStep(1);
  };

  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  const handleFirstConfirm = () => {
    setStep(2);
  };

  const handleFinalConfirm = () => {
    handleReset();
    onConfirm();
  };

  React.useEffect(() => {
    if (!visible) {
      handleReset();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleCancel} />
        <View style={styles.container}>
          {step === 1 ? (
            <>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.accent.orange + '20' }]}>
                  <Ionicons name="warning" size={24} color={Colors.accent.orange} />
                </View>
                <Text style={styles.title}>{title}</Text>
              </View>
              
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.warningButton]}
                  onPress={handleFirstConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.warningText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.accent.red + '20' }]}>
                  <Ionicons name="alert-circle" size={24} color={Colors.accent.red} />
                </View>
                <Text style={styles.title}>Attention !</Text>
              </View>
              
              <Text style={styles.message}>{warningMessage}</Text>
              
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleFinalConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 340,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.title2,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  button: {
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
  warningButton: {
    backgroundColor: Colors.accent.orange,
  },
  confirmButton: {
    backgroundColor: Colors.accent.red,
  },
  cancelText: {
    ...Typography.subheadline,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  warningText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
  confirmText: {
    ...Typography.subheadline,
    color: Colors.surface,
    fontWeight: '600',
  },
});
