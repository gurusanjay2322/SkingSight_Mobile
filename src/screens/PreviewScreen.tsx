import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert } from '../components/CustomAlert';
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
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    actions: any[];
  }>({
    title: '',
    message: '',
    type: 'info',
    actions: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [locationMode, setLocationMode] = useState<'select' | 'manual'>('select');
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { user } = useAuth();


  const performAnalysis = async (lat: number, lon: number, cityName?: string) => {
    try {
      setModalVisible(false);
      setIsAnalyzing(true);
      const response = await apiService.analyzeSkin(imageUri, lat, lon);

      navigation.navigate('Results', { 
        data: response, 
        imageUri,
        locationName: cityName || 'Unknown' 
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      setAlertConfig({
        title: 'Analysis Failed',
        message: error.message || 'We could not analyze the image. Please try again.',
        type: 'error',
        actions: [{ text: 'OK' }],
      });
      setAlertVisible(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoLocation = async () => {
    try {
      setIsGeocoding(true);
      const location = await locationService.getCurrentLocation();
      await performAnalysis(location.latitude, location.longitude);
    } catch (error) {
      console.warn('Auto location failed:', error);
      setAlertConfig({
        title: 'Location Unavailable',
        message: 'Could not fetch location automatically. Please enter it manually.',
        type: 'warning',
        actions: [{ text: 'OK', onPress: () => setLocationMode('manual') }],
      });
      setAlertVisible(true);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualAddress.trim()) {
      setAlertConfig({
        title: 'Input Required',
        message: 'Please enter a city or address.',
        type: 'warning',
        actions: [{ text: 'OK' }],
      });
      setAlertVisible(true);
      return;
    }

    try {
      setIsGeocoding(true);
      const location = await locationService.getGeocodedLocation(manualAddress);
      await performAnalysis(location.latitude, location.longitude, manualAddress);
    } catch (error) {
      setAlertConfig({
        title: 'Address Not Found',
        message: 'Could not find coordinates for this address. Please try a different one.',
        type: 'error',
        actions: [{ text: 'OK' }],
      });
      setAlertVisible(true);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleCitySelect = (city: City) => {
    performAnalysis(city.lat, city.lon, city.label);
  };

  const renderCityItem = ({ item }: { item: City }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => performAnalysis(item.lat, item.lon)}
    >
      <Ionicons name="location-outline" size={18} color="#71717A" />
      <Text style={styles.cityText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Review Photo</Text>
          <Text style={styles.headerSubtitle}>Confirm your scan for analysis</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeHeader}>
          <Ionicons name="close" size={24} color="#09090B" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#71717A" />
            <Text style={styles.infoText}>Acquiring environmental context...</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-outline" size={18} color="#71717A" />
            <Text style={styles.infoText}>Encrypted clinical-grade processing</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={() => setModalVisible(true)}
          disabled={isAnalyzing}
        >
          <Text style={styles.analyzeButtonText}>Analyze Photo</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => navigation.goBack()}
          disabled={isAnalyzing}
        >
          <Text style={styles.retakeButtonText}>Retake Photo</Text>
        </TouchableOpacity>
      </View>

      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#18181B" />
          <Text style={styles.loadingText}>Running AI Analysis</Text>
          <Text style={styles.loadingSubtext}>Correlating with environmental data...</Text>
        </View>
      )}

      {/* Location Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {locationMode === 'manual' && (
                <TouchableOpacity onPress={() => setLocationMode('select')}>
                  <Ionicons name="arrow-back" size={24} color="#09090B" />
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {locationMode === 'select' ? 'Choose Location' : 'Enter Location'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#09090B" />
              </TouchableOpacity>
            </View>

            {locationMode === 'select' ? (
              <View style={styles.modalBody}>
                <TouchableOpacity style={styles.optionButton} onPress={handleAutoLocation} disabled={isGeocoding}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="locate" size={20} color="#18181B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>Auto-detect location</Text>
                    <Text style={styles.optionSubtitle}>Use GPS coordinates</Text>
                  </View>
                  {isGeocoding ? <ActivityIndicator size="small" color="#18181B" /> : <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />}
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionButton} onPress={() => setLocationMode('manual')}>
                  <View style={styles.optionIcon}>
                    <Ionicons name="search" size={20} color="#18181B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>Enter manually</Text>
                    <Text style={styles.optionSubtitle}>Search by city name</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
                </TouchableOpacity>

                <View style={styles.divider}>
                  <Text style={styles.dividerText}>OR SELECT CITY</Text>
                </View>

                <FlatList
                  data={indianCities}
                  renderItem={renderCityItem}
                  keyExtractor={(item) => item.value}
                  showsVerticalScrollIndicator={false}
                  style={styles.cityList}
                />
              </View>
            ) : (
              <View style={styles.manualBody}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city or address"
                  placeholderTextColor="#A1A1AA"
                  value={manualAddress}
                  onChangeText={setManualAddress}
                  autoFocus
                />
                <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit} disabled={isGeocoding}>
                  {isGeocoding ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Confirm Location</Text>}
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#09090B", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "#71717A", marginTop: 2 },
  closeHeader: { padding: 4 },
  
  content: { flex: 1, padding: 24 },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#F4F4F5",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  image: { width: "100%", height: "100%" },
  
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    gap: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontSize: 13, color: "#3F3F46", flex: 1 },

  footer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
    gap: 12,
  },
  analyzeButton: {
    backgroundColor: "#18181B",
    height: 56,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  analyzeButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  retakeButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  retakeButtonText: { color: "#71717A", fontSize: 15, fontWeight: "500" },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: "600", color: "#09090B" },
  loadingSubtext: { marginTop: 4, fontSize: 13, color: "#71717A" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { 
    backgroundColor: "#FFF", 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 24, 
    maxHeight: "85%",
    paddingBottom: 40
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#09090B" },
  modalBody: { gap: 16 },
  
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    gap: 12,
  },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E4E4E7", alignItems: "center", justifyContent: "center" },
  optionTitle: { fontSize: 15, fontWeight: "600", color: "#09090B" },
  optionSubtitle: { fontSize: 12, color: "#71717A", marginTop: 2 },
  
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  dividerText: { fontSize: 11, fontWeight: "700", color: "#A1A1AA", letterSpacing: 0.5 },
  
  cityList: { maxHeight: 240 },
  cityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F4F4F5", gap: 10 },
  cityText: { fontSize: 15, color: "#27272A" },
  
  manualBody: { gap: 16 },
  input: {
    height: 52,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    color: "#09090B",
  },
  submitButton: {
    height: 52,
    backgroundColor: "#18181B",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
});
