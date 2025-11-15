import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Loader } from '../components/Loader';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { RootStackParamList } from '../types';
import { locationService } from '../utils/location';
import { storageService } from '../utils/storage';

type PreviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Preview'>;
type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

interface Props {
  navigation: PreviewScreenNavigationProp;
  route: PreviewScreenRouteProp;
}

export const PreviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUri } = route.params;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);

      // Get current location
      let latitude = 0;
      let longitude = 0;
      
      try {
        const location = await locationService.getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
      } catch (locationError) {
        console.warn('Location error:', locationError);
        Alert.alert(
          'Location Access',
          'Unable to get your location. The analysis will continue without location data.',
          [{ text: 'OK' }]
        );
        // Continue with default values (0, 0) if location fails
      }

      const response = await apiService.analyzeSkin(imageUri, latitude, longitude);

      // Save to history (only if user is logged in, otherwise data won't be saved)
      if (user) {
        const historyItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          predicted_class: response.predicted_class,
          risk_level: response.risk_level,
          confidence: response.confidence,
          imageUri: imageUri,
          data: response,
        };
        await storageService.saveHistoryItem(historyItem, user.uid);
      }

      navigation.navigate('Results', { data: response, imageUri });

    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Failed',
        'Unable to analyze the image. Please try again.',
        [
          { text: 'Retry', onPress: handleAnalyze },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  if (isAnalyzing) {
    return <Loader message="Analyzing your skin..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Review your photo and tap "Analyze" to get your skin analysis
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Retake"
          onPress={handleRetake}
          style={[styles.button, styles.retakeButton]}
          textStyle={styles.retakeButtonText}
        />
        <PrimaryButton
          title="Analyze"
          onPress={handleAnalyze}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
  },
  retakeButton: {
    backgroundColor: '#F3F4F6',
  },
  retakeButtonText: {
    color: '#111827',
  },
});

