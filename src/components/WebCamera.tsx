import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { findDOMNode } from 'react-dom';
import { Ionicons } from '@expo/vector-icons';

interface WebCameraProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export const WebCamera: React.FC<WebCameraProps> = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;

    console.log('WebCamera: Component mounted, setting up camera...');
    
    // Use a small delay to ensure the ref is attached
    const timer = setTimeout(() => {
      console.log('WebCamera: Attempting to setup camera...');
      setupCamera();
    }, 300);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || !streamRef.current) return;
    
    // When facing changes, restart camera
    const timer = setTimeout(() => {
      setupCamera();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [facing]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && containerRef.current) {
      try {
        if (containerRef.current.contains(videoRef.current)) {
          containerRef.current.removeChild(videoRef.current);
        }
      } catch (e) {
        console.warn('Error removing video element:', e);
      }
      videoRef.current = null;
    }
    if (canvasRef.current && containerRef.current) {
      try {
        if (containerRef.current.contains(canvasRef.current)) {
          containerRef.current.removeChild(canvasRef.current);
        }
      } catch (e) {
        console.warn('Error removing canvas element:', e);
      }
      canvasRef.current = null;
    }
  };

  const setupCamera = async () => {
    if (Platform.OS !== 'web') return;

    setIsLoading(true);
    setError(null);

    // Cleanup previous stream
    cleanup();

    // Get container element - try multiple methods
    let container: HTMLElement | null = containerRef.current;
    
    if (!container) {
      // Try to find by data attribute
      container = document.querySelector('[data-camera-container]') as HTMLElement;
    }
    
    if (!container) {
      // Try to find the camera container by class or style
      const allDivs = document.querySelectorAll('div');
      for (let i = 0; i < allDivs.length; i++) {
        const div = allDivs[i];
        const style = window.getComputedStyle(div);
        if (style.position === 'relative' && div.children.length > 0) {
          // This might be our container
          container = div as HTMLElement;
          break;
        }
      }
    }

    if (!container) {
      // Last resort: wait and retry
      setTimeout(() => {
        setupCamera();
      }, 100);
      return;
    }

    containerRef.current = container;

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      console.log('WebCamera: Container found, creating video element...');

      // Create video and canvas elements
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.position = 'absolute';
      video.style.top = '0';
      video.style.left = '0';
      video.style.zIndex = '0';

      const canvas = document.createElement('canvas');
      canvas.style.display = 'none';

      containerRef.current.appendChild(video);
      containerRef.current.appendChild(canvas);
      videoRef.current = video;
      canvasRef.current = canvas;

      console.log('WebCamera: Requesting camera permission...');

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      console.log('WebCamera: Camera access granted!');

      streamRef.current = mediaStream;
      setStream(mediaStream);
      video.srcObject = mediaStream;
      
      // Wait for video to be ready
      video.onloadedmetadata = () => {
        console.log('WebCamera: Video metadata loaded');
        setIsLoading(false);
      };

      video.onerror = (e) => {
        console.error('WebCamera: Video error:', e);
        setError('Failed to load video stream');
        setIsLoading(false);
      };

    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError(err.message || 'Failed to access camera');
      setIsLoading(false);
      
      let errorMessage = 'Please allow camera access to use this feature.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission was denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      Alert.alert('Camera Access Error', errorMessage);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const uri = URL.createObjectURL(blob);
            onCapture(uri);
          }
          setIsCapturing(false);
        }, 'image/jpeg', 0.8);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsCapturing(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'user' ? 'environment' : 'user'));
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="camera-outline" size={64} color="#6366F1" />
          <Text style={styles.errorTitle}>Camera Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={setupCamera}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButtonError}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Requesting camera access...</Text>
        </View>
      )}
      <View 
        style={styles.cameraContainer}
        ref={(ref) => {
          if (ref && Platform.OS === 'web') {
            try {
              // Use findDOMNode to get the actual DOM element
              const domNode = findDOMNode(ref) as HTMLElement;
              if (domNode) {
                containerRef.current = domNode;
                domNode.setAttribute('data-camera-container', 'true');
              }
            } catch (e) {
              console.warn('Error setting container ref:', e);
              // Fallback: try to access directly
              try {
                const element = (ref as any)._nativeNode || (ref as any);
                if (element && element.nodeType === 1) {
                  containerRef.current = element;
                }
              } catch (e2) {
                console.warn('Fallback ref access failed:', e2);
              }
            }
          }
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.guideFrame}>
            <View style={styles.guideCorner} />
            <View style={[styles.guideCorner, styles.guideCornerTopRight]} />
            <View style={[styles.guideCorner, styles.guideCornerBottomLeft]} />
            <View style={[styles.guideCorner, styles.guideCornerBottomRight]} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.instructionText}>
              Position your face within the frame
            </Text>
            <TouchableOpacity
              style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    flex: 1,
    margin: 40,
    marginVertical: 100,
    position: 'relative',
  },
  guideCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#FFFFFF',
    top: 0,
    left: 0,
  },
  guideCornerTopRight: {
    borderLeftWidth: 0,
    borderRightWidth: 4,
    right: 0,
    left: 'auto',
  },
  guideCornerBottomLeft: {
    borderTopWidth: 0,
    borderBottomWidth: 4,
    bottom: 0,
    top: 'auto',
  },
  guideCornerBottomRight: {
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    right: 0,
    bottom: 0,
    top: 'auto',
    left: 'auto',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#E5E7EB',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonError: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

