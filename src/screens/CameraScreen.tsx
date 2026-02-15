import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomAlert } from '../components/CustomAlert';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { WebCamera } from '../components/WebCamera';
import * as ImagePicker from 'expo-image-picker';

type CameraScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>;

interface Props {
  navigation: CameraScreenNavigationProp;
}

export const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
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
  const [image, setImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        // Immediate Validation
        const validationResponse = await apiService.validateSkin(photo.uri);
        
        if (validationResponse.valid) {
          navigation.navigate('Preview', { imageUri: photo.uri });
        } else {
          setAlertConfig({
            title: 'no visible skin detected',
            message: 'Please ensure the skin area is clearly visible and well-lit.',
            type: 'warning',
            actions: [{ text: 'Try Again' }],
          });
          setAlertVisible(true);
        }
      }
    } catch (error) {
      console.error('Error in capture/validation flow:', error);
      setAlertConfig({
        title: 'Capture Failed',
        message: 'Could not process image. Please try again.',
        type: 'error',
        actions: [{ text: 'OK' }],
      });
      setAlertVisible(true);
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const toggleCameraType = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <WebCamera
          onCapture={(uri) => setImage(uri)}
          onClose={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#18181B" />
        <Text style={styles.permissionTitle}>Camera Access</Text>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={async () => {
            const result = await requestPermission();
            if (!result.granted) {
              setAlertConfig({
                title: 'Permission Denied',
                message: 'Camera access is required to take photos of skin concerns.',
                type: 'warning',
                actions: [{ text: 'OK' }],
              });
              setAlertVisible(true);
            }
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          actions={alertConfig.actions}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  }

  const renderCamera = () => (
    <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={24}
              color={flash === "on" ? "#EAB308" : "#FFF"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>Make sure the skin is visible and is at the center of the frame</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.sideButton} />

            <TouchableOpacity style={styles.captureContainer} onPress={takePicture}>
              {isCapturing ? <ActivityIndicator color="#FFF" /> : <View style={styles.captureButton} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideButton} onPress={toggleCameraType}>
              <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </CameraView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {renderCamera()}
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
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.1)", justifyContent: "space-between" },
  header: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20 },
  iconButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: "rgba(255,255,255,0.15)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  controlsContainer: {
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
  },
  instructionsContainer: { 
    alignItems: "center",
    marginBottom: 20,
  },
  instructionBox: { 
    backgroundColor: "rgba(0,0,0,0.6)", 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 12,
    marginHorizontal: 32,
  },
  instructionText: { color: "#FFF", fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 18 },
  controls: { 
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  captureContainer: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#FFF", padding: 4, justifyContent: "center", alignItems: "center" },
  captureButton: { width: "100%", height: "100%", borderRadius: 40, backgroundColor: "#FFF" },
  sideButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  
  previewContainer: { flex: 1, backgroundColor: "#000" },
  previewImage: { flex: 1 },
  previewControls: { flexDirection: "row", padding: 24, gap: 12, backgroundColor: "#000", paddingBottom: Platform.OS === "ios" ? 40 : 30 },
  previewButton: { flex: 1, height: 52, borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  retakeButton: { backgroundColor: "transparent", borderColor: "#27272A" },
  useButton: { backgroundColor: "#FFF", borderColor: "#FFF" },
  retakeText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  useText: { color: "#000", fontSize: 14, fontWeight: "600" },

  permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, backgroundColor: "#FFF" },
  permissionTitle: { fontSize: 24, fontWeight: "700", color: "#18181B", marginTop: 20 },
  permissionText: { fontSize: 14, color: "#71717A", textAlign: "center", marginTop: 8, lineHeight: 20 },
  permissionButton: { marginTop: 32, backgroundColor: "#18181B", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  permissionButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
