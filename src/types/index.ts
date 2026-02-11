// API Response Types
export interface WeatherData {
  aqi: number;
  city: string;
  country?: string;
  dominant_pollutant: string;
  temp_max: number;
  temp_min: number;
  current_temp?: number;
  feels_like?: number;
  humidity?: number;
  pressure?: number;
  timezone: string;
  uv_index: number;
  weather_condition?: string;
  weather_description?: string;
  weather_icon?: string;
  sunrise?: number;
  sunset?: number;
  wind_speed?: number;
  clouds?: number;
  owm_aqi_raw?: number;
}

export interface DiseaseInfo {
  predicted_class?: string;
  label?: string;
  confidence: number;
  confidence_percentage?: string;
  scores?: Record<string, number>;
}

export interface ClassScores {
  acne: number;
  burned: number;
  dry: number;
  normal: number;
  oily: number;
}

export interface AnalyzeResponse {
  confidence: number;
  genai_suggestions: string[];
  predicted_class: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
  rule_based_suggestions: string[];
  weather: WeatherData;
  disease?: DiseaseInfo;
  class_scores?: ClassScores;
}

export interface ValidateSkinResponse {
  human_ratio: number;
  message: string;
  skin_ratio: number;
  valid: boolean;
  disease?: DiseaseInfo;
}

export interface SkinResult {
  uid: string;
  predictedClass: string;
  confidence: number;
  weather: any;
  riskLevel: string;
  suggestions: string[];
  imageUrl?: string;
  createdAt?: any;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Onboarding: undefined;
  Camera: undefined;
  Preview: { imageUri: string };
  Results: { data: AnalyzeResponse | SkinResult; imageUri?: string , fromHistory? : boolean };
  History: undefined;
  Dashboard: undefined;
  Login: undefined;
  SignUp: undefined;
  Profile: undefined;
};

// History Item Type
export interface HistoryItem {
  id: string;
  timestamp: number;
  predicted_class: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
  confidence: number;
  imageUri: string;
  data: AnalyzeResponse;
}

