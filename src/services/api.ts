import axios, { AxiosInstance, AxiosError } from 'axios';
import { AnalyzeResponse, ValidateSkinResponse } from '../types';

// Backend URL - for physical devices, use your computer's local IP (e.g., http://192.168.1.100:5000)
// For Android emulator, use http://10.0.2.2:5000
// For iOS simulator, use http://localhost:5000
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://089a-122-167-102-88.ngrok-free.app/api';

// Error types for better user messaging
export enum ApiErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
}

// User-friendly error messages
const ERROR_MESSAGES: Record<ApiErrorType, string> = {
  [ApiErrorType.NETWORK]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [ApiErrorType.TIMEOUT]: 'The request took too long. Please try again.',
  [ApiErrorType.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ApiErrorType.VALIDATION]: 'The image could not be processed. Please try taking another photo.',
  [ApiErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

// Utility function to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
    });
  }

  /**
   * Classifies an axios error into a structured ApiError
   */
  private classifyError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Network errors (no response received)
      if (!axiosError.response) {
        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          return {
            type: ApiErrorType.TIMEOUT,
            message: axiosError.message,
            userMessage: ERROR_MESSAGES[ApiErrorType.TIMEOUT],
            retryable: true,
          };
        }
        return {
          type: ApiErrorType.NETWORK,
          message: axiosError.message,
          userMessage: ERROR_MESSAGES[ApiErrorType.NETWORK],
          retryable: true,
        };
      }
      
      // Server errors (5xx)
      if (axiosError.response.status >= 500) {
        return {
          type: ApiErrorType.SERVER,
          message: `Server error: ${axiosError.response.status}`,
          userMessage: ERROR_MESSAGES[ApiErrorType.SERVER],
          retryable: true,
        };
      }
      
      // Client errors (4xx)
      if (axiosError.response.status >= 400) {
        return {
          type: ApiErrorType.VALIDATION,
          message: `Client error: ${axiosError.response.status}`,
          userMessage: ERROR_MESSAGES[ApiErrorType.VALIDATION],
          retryable: false,
        };
      }
    }
    
    return {
      type: ApiErrorType.UNKNOWN,
      message: error instanceof Error ? error.message : 'Unknown error',
      userMessage: ERROR_MESSAGES[ApiErrorType.UNKNOWN],
      retryable: true,
    };
  }

  /**
   * Executes a request with exponential backoff retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: ApiError | null = null;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.classifyError(error);
        
        // Don't retry non-retryable errors
        if (!lastError.retryable) {
          console.log(`❌ Non-retryable error: ${lastError.message}`);
          throw lastError;
        }
        
        // Don't retry if we've exhausted all attempts
        if (attempt === config.maxRetries) {
          console.log(`❌ All ${config.maxRetries + 1} attempts failed`);
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          config.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
          config.maxDelayMs
        );
        
        console.log(`⚠️ Attempt ${attempt + 1} failed: ${lastError.message}. Retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Creates FormData for image upload
   */
  private createImageFormData(imageUri: string): FormData {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    return formData;
  }

  async validateSkin(imageUri: string): Promise<ValidateSkinResponse> {
    console.log('🔍 Validating skin image...');
    
    try {
      const result = await this.withRetry(async () => {
        const formData = this.createImageFormData(imageUri);

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
        
        console.log('✅ Validation successful:', response.data);
        return response.data;
      });
      
      return result;
    } catch (error) {
      if ((error as ApiError).type) {
        console.error('❌ Validation failed:', (error as ApiError).userMessage);
        throw error;
      }
      
      // Unexpected error
      const apiError = this.classifyError(error);
      console.error('❌ Validation failed:', apiError.userMessage);
      throw apiError;
    }
  }

  async analyzeSkin(imageUri: string, latitude: number, longitude: number): Promise<AnalyzeResponse> {
    console.log('🔬 Analyzing skin...');
    
    try {
      const result = await this.withRetry(async () => {
        const formData = this.createImageFormData(imageUri);
        formData.append('lat', latitude.toString());
        formData.append('lon', longitude.toString());

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
        
        console.log('✅ Analysis successful:', response.data);
        return response.data;
      });
      
      return result;
    } catch (error) {
      // If it's an ApiError, check if we should use mock data
      if ((error as ApiError).type) {
        console.warn('⚠️ Backend not available, using mock data');
        return this.getMockResponse();
      }
      
      // Unexpected error - still return mock data
      console.warn('⚠️ Unexpected error, using mock data');
      return this.getMockResponse();
    }
  }

  /**
   * Check if the backend is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/', { timeout: 5000 });
      return true;
    } catch {
      return false;
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

  async chatWithContext(context: any, question: string, history: any[]): Promise<string> {
    try {
      const response = await this.client.post('/chat', {
        context,
        question,
        history,
      }, {
        responseType: 'text', // Handle streaming text response
      });
      return response.data;
    } catch (error) {
      console.error('Chat API Error:', error);
      return "I'm having trouble connecting to the server. Please check your internet connection.";
    }
  }
}

export const apiService = new ApiService();

