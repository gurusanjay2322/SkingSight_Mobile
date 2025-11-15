// Color utilities for risk levels and indicators

export const getRiskColor = (riskLevel: 'Low' | 'Medium' | 'High'): string => {
  switch (riskLevel) {
    case 'Low':
      return '#10B981'; // Green
    case 'Medium':
      return '#F59E0B'; // Amber
    case 'High':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

export const getUVIndexColor = (uvIndex: number): string => {
  if (uvIndex <= 2) return '#10B981'; // Green - Low
  if (uvIndex <= 5) return '#F59E0B'; // Amber - Moderate
  if (uvIndex <= 7) return '#F97316'; // Orange - High
  if (uvIndex <= 10) return '#EF4444'; // Red - Very High
  return '#7C3AED'; // Purple - Extreme
};

export const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return '#10B981'; // Green - Good
  if (aqi <= 100) return '#F59E0B'; // Amber - Moderate
  if (aqi <= 150) return '#F97316'; // Orange - Unhealthy for Sensitive
  if (aqi <= 200) return '#EF4444'; // Red - Unhealthy
  if (aqi <= 300) return '#7C3AED'; // Purple - Very Unhealthy
  return '#DC2626'; // Dark Red - Hazardous
};

export const getUVIndexLabel = (uvIndex: number): string => {
  if (uvIndex <= 2) return 'Low';
  if (uvIndex <= 5) return 'Moderate';
  if (uvIndex <= 7) return 'High';
  if (uvIndex <= 10) return 'Very High';
  return 'Extreme';
};

export const getAQILabel = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

