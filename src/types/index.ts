// API Response Types
export interface WeatherData {
  aqi: number;
  city: string;
  dominant_pollutant: string;
  temp_max: number;
  temp_min: number;
  timezone: string;
  uv_index: number;
}

export interface AnalyzeResponse {
  confidence: number;
  genai_suggestions: string[];
  predicted_class: string;
  risk_level: 'Low' | 'Medium' | 'High';
  rule_based_suggestions: string[];
  weather: WeatherData;
}

export interface ValidateSkinResponse {
  human_ratio: number;
  message: string;
  skin_ratio: number;
  valid: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Preview: { imageUri: string };
  Results: { data: AnalyzeResponse };
  History: undefined;
};

// History Item Type
export interface HistoryItem {
  id: string;
  timestamp: number;
  predicted_class: string;
  risk_level: 'Low' | 'Medium' | 'High';
  confidence: number;
  imageUri: string;
  data: AnalyzeResponse;
}

