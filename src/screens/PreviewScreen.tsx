import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Loader } from '../components/Loader';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { indianCities, City } from '../data/indianCities';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [locationMode, setLocationMode] = useState<'select' | 'manual'>('select');
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { user } = useAuth();

  const performAnalysis = async (lat: number, lon: number) => {
    try {
      setModalVisible(false); // Close modal if open
      setIsAnalyzing(true);
      const response = await apiService.analyzeSkin(imageUri, lat, lon);

      // Save to history
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
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzePress = () => {
    // Open choice modal immediately
    setLocationMode('select');
    setModalVisible(true);
  };

  const handleAutoLocation = async () => {
    try {
      setIsGeocoding(true);
      const location = await locationService.getCurrentLocation();
      await performAnalysis(location.latitude, location.longitude);
    } catch (error) {
      console.warn('Auto location failed:', error);
      Alert.alert(
        'Location Unavailable',
        'Could not fetch location automatically. Please enter it manually.',
        [{ text: 'OK', onPress: () => setLocationMode('manual') }]
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualAddress.trim()) {
      Alert.alert('Error', 'Please enter a city or address.');
      return;
    }

    try {
      setIsGeocoding(true);
      const location = await locationService.getGeocodedLocation(manualAddress);
      await performAnalysis(location.latitude, location.longitude);
    } catch (error) {
      Alert.alert('Address Not Found', 'Could not find coordinates for this address. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleCitySelect = (city: City) => {
     performAnalysis(city.lat, city.lon);
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const renderCityItem = ({ item }: { item: City }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => handleCitySelect(item)}
    >
      <Ionicons name="location-outline" size={20} color="#4B5563" />
      <Text style={styles.cityText}>{item.label}</Text>
    </TouchableOpacity>
  );

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
            Review your photo and tap "Analyze". You can choose how to detect your location.
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
          onPress={handleAnalyzePress}
          style={styles.button}
        />
      </View>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            
            {/* Header with Back button if in manual mode */}
            <View style={styles.modalHeaderRow}>
              {locationMode === 'manual' ? (
                <TouchableOpacity onPress={() => setLocationMode('select')} style={styles.modalBackBtn}>
                   <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
              ) : <View style={{width: 24}} />}
              
              <Text style={styles.modalTitle}>
                {locationMode === 'select' ? 'Select Method' : 'Enter Location'}
              </Text>
              
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                 <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {locationMode === 'select' ? (
              <View style={styles.selectionContainer}>
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={handleAutoLocation}
                  disabled={isGeocoding}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="locate" size={24} color="#4F46E5" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Fetch Automatically</Text>
                    <Text style={styles.optionSubtitle}>Use your current GPS location</Text>
                  </View>
                  {isGeocoding ? <ActivityIndicator color="#4F46E5" /> : <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={() => setLocationMode('manual')}
                >
                  <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="create-outline" size={24} color="#374151" />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Enter Manually</Text>
                    <Text style={styles.optionSubtitle}>Type your city or address</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <View style={styles.divider}>
                   <Text style={styles.dividerText}>OR SELECT FROM LIST</Text>
                </View>

                {/* Existing list as fallback/quick select */}
                <FlatList
                    data={indianCities}
                    renderItem={renderCityItem}
                    keyExtractor={(item) => item.value}
                    style={styles.cityList}
                    showsVerticalScrollIndicator={false}
                />
              </View>
            ) : (
              <View style={styles.manualContainer}>
                <Text style={styles.inputLabel}>City/Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bangalore, Indiranagar"
                  value={manualAddress}
                  onChangeText={setManualAddress}
                  autoFocus={true}
                  returnKeyType="search"
                  onSubmitEditing={handleManualSubmit}
                />
                <PrimaryButton
                  title={isGeocoding ? "Searching..." : "Confirm Location"}
                  onPress={handleManualSubmit}
                  style={styles.submitButton}
                />
              </View>
            )}

          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalBackBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  selectionContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 1,
    width: '100%',
    textAlign: 'center',
  },
  cityList: {
    maxHeight: 200,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  cityText: {
    fontSize: 16,
    color: '#374151',
  },
  manualContainer: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  submitButton: {
    marginTop: 8,
  },
  closeButton: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
});

