import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PrimaryButton } from '../components/PrimaryButton';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>GlowScan</Text>
          <Text style={styles.subtitle}>
            Analyze your skin and get personalized recommendations based on environmental factors
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Open Camera"
            onPress={() => navigation.navigate('Camera')}
            style={styles.cameraButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Capture a selfie to analyze your skin condition
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 64,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  cameraButton: {
    paddingVertical: 20,
    borderRadius: 16,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

