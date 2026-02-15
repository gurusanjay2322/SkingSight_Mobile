import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AlertAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  actions: AlertAction[];
  onClose: () => void;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  actions,
  onClose,
  type = 'info',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <Ionicons name="warning" size={32} color="#F59E0B" />;
      case 'error':
        return <Ionicons name="alert-circle" size={32} color="#EF4444" />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={32} color="#10B981" />;
      default:
        return <Ionicons name="information-circle" size={32} color="#18181B" />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertContainer}>
              <View style={styles.iconContainer}>{getIcon()}</View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      action.style === 'destructive' && styles.destructiveButton,
                      action.style === 'cancel' && styles.cancelButton,
                      index === actions.length - 1 && styles.lastButton,
                    ]}
                    onPress={() => {
                      onClose();
                      action.onPress?.();
                    }}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        action.style === 'destructive' && styles.destructiveText,
                        action.style === 'cancel' && styles.cancelText,
                      ]}
                    >
                      {action.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: Math.min(width - 48, 340),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#09090B',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
  },
  actionButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  destructiveButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelText: {
    color: '#09090B',
  },
  destructiveText: {
    color: '#EF4444',
  },
  lastButton: {
    marginBottom: 0,
  },
});
