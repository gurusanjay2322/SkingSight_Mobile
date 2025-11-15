import axios, { AxiosInstance } from 'axios';
import { AnalyzeResponse, ValidateSkinResponse } from '../types';

// Backend URL - for physical devices, use your computer's local IP (e.g., http://192.168.1.100:5000)
// For Android emulator, use http://10.0.2.2:5000
// For iOS simulator, use http://localhost:5000
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://6b74ea17ff9e.ngrok-free.app/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
    });
  }

  async validateSkin(imageUri: string): Promise<ValidateSkinResponse> {
    try {
      const formData = new FormData();
  
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
  
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);
  
      console.log('Validating skin with FormData');
  
      const response = await this.client.post<ValidateSkinResponse>(
        '/validSkin',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        }
      );
      console.log('Validation Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Validation API Error:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios full error:', JSON.stringify(error, null, 2));
        throw error;
      }
      throw error;
    }
  }

  async validateSkin(imageUri: string): Promise<ValidateSkinResponse> {
    try {
      const formData = new FormData();
  
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
  
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);
  
      console.log('Validating skin with FormData');
  
      const response = await this.client.post<ValidateSkinResponse>(
        '/validSkin',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        }
      );
      console.log('Validation Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Validation API Error:', error);
      if (axios.isAxiosError(error)) {
        console.log('Axios full error:', JSON.stringify(error, null, 2));
        throw error;
      }
      throw error;
    }
  }

  async analyzeSkin(imageUri: string, latitude: number, longitude: number): Promise<AnalyzeResponse> {
    try {
      const formData = new FormData();
  
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename.toLowerCase());
      // Map common extensions to MIME types
      const extension = match ? match[1].toLowerCase() : 'jpg';
      const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      const type = mimeTypes[extension] || 'image/jpeg';

      // Append image file to FormData - React Native/Expo format
      // The object structure {uri, name, type} is required for React Native
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
  
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);
  
      formData.append('lat', latitude.toString());
      formData.append('lon', longitude.toString());

      // Make request - axios will automatically set Content-Type with boundary for FormData
      // In React Native/Expo, FormData is handled specially - don't set Content-Type manually
      const response = await this.client.post<AnalyzeResponse>('/predict', formData);
      

  
      console.log('FormData:', formData);
  
      // ✅ Force multipart/form-data
      const response = await this.client.post<AnalyzeResponse>(
        '/predict',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        }
      );
      console.log('Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error);
      
      // Log detailed error information
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
        });
        
        // Return mock data if API is not available (for development/testing)
        const isConnectionError = 
          error.code === 'ECONNREFUSED' || 
          error.code === 'NETWORK_ERROR' ||
          error.message?.includes('Network Error') ||
          error.response?.status === 404 ||
          error.response?.status === 500;
        
        if (isConnectionError) {
          console.warn('Backend not available, using mock data');
          return this.getMockResponse();
        }
      }
      
      throw error;
    }
  }
        console.log('Axios full error:', JSON.stringify(error, null, 2));
      }
      console.warn('Backend not available, using mock data');
      return this.getMockResponse();
    }
  }
  

  // Mock response for development/testing
  private getMockResponse(): AnalyzeResponse {
    return {
      confidence: 0.96,
      genai_suggestions: [],
      predicted_class: 'acne',
      risk_level: 'High',
      rule_based_suggestions: [
        'Use sunscreen with SPF 30 or higher.',
        'Limit prolonged or heavy exertion outdoors.',
        'Use products with salicylic acid.',
      ],
      weather: {
        aqi: 170,
        city: 'Nerul, Navi Mumbai, India',
        dominant_pollutant: 'pm25',
        temp_max: 27.2,
        temp_min: 11.3,
        timezone: 'Asia/Kolkata',
        uv_index: 6.75,
      },
    };
  }
}

export const apiService = new ApiService();

