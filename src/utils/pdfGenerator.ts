import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateAndSharePDF = async (data: any, imageUri?: string) => {
  const safeData = data as any;
  const date = new Date().toLocaleDateString();
  
  const predictedClass = safeData?.predictedClass || safeData?.predicted_class || "Unknown";
  const confidence = Math.round((safeData?.confidence ?? 0) * 100);
  const riskLevel = safeData?.riskLevel || safeData?.risk_level || "Unknown";
  const suggestions = safeData?.suggestions || safeData?.rule_based_suggestions || [];
  const genaiSuggestions = safeData?.genaiSuggestions || safeData?.genai_suggestions || [];
  const weather = safeData?.weather || {};
  
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'very high': return '#7F1D1D';
      default: return '#6B7280';
    }
  };

  const getUVLabel = (uv: number) => {
    if (uv <= 2) return { label: 'Low', color: '#10B981' };
    if (uv <= 5) return { label: 'Moderate', color: '#F59E0B' };
    if (uv <= 7) return { label: 'High', color: '#F97316' };
    if (uv <= 10) return { label: 'Very High', color: '#EF4444' };
    return { label: 'Extreme', color: '#7F1D1D' };
  };

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: '#10B981' };
    if (aqi <= 100) return { label: 'Moderate', color: '#F59E0B' };
    if (aqi <= 150) return { label: 'Unhealthy (Sensitive)', color: '#F97316' };
    return { label: 'Unhealthy', color: '#EF4444' };
  };

  const riskColor = getRiskColor(riskLevel);
  const uvIndex = weather?.uv_index ?? 0;
  const uvInfo = getUVLabel(uvIndex);
  const aqi = weather?.aqi ?? 0;
  const aqiInfo = getAQILabel(aqi);
  const humidity = weather?.humidity ?? 'N/A';
  const city = weather?.city || 'Unknown';
  const currentTemp = weather?.current_temp || weather?.temp_max || 'N/A';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: 'Helvetica', sans-serif; color: #333; padding: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6366F1; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #6366F1; margin-bottom: 5px; }
          .subtitle { font-size: 14px; color: #666; }
          .section { margin-bottom: 20px; background: #f9fafb; padding: 15px; border-radius: 8px; }
          .section-title { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 10px; border-left: 4px solid #6366F1; padding-left: 10px; }
          .section-title.weather { border-left-color: #3B82F6; }
          .section-title.ai { border-left-color: #8B5CF6; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .label { font-weight: 600; color: #555; }
          .value { font-weight: bold; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 10px; color: white; font-weight: bold; font-size: 13px; }
          .image-container { text-align: center; margin: 15px 0; }
          .skin-image { max-width: 100%; height: auto; border-radius: 8px; max-height: 250px; object-fit: cover; }
          .suggestion-item { margin-bottom: 5px; padding-left: 20px; position: relative; font-size: 14px; }
          .suggestion-item:before { content: "•"; position: absolute; left: 0; color: #6366F1; font-weight: bold; }
          .ai-item:before { color: #8B5CF6; }
          .weather-grid { display: flex; flex-wrap: wrap; gap: 10px; }
          .weather-card { flex: 1; min-width: 45%; background: white; padding: 10px; border-radius: 8px; border: 1px solid #E5E7EB; }
          .weather-card .wc-label { font-size: 11px; color: #9CA3AF; text-transform: uppercase; margin-bottom: 4px; }
          .weather-card .wc-value { font-size: 18px; font-weight: bold; color: #111827; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">SkinSight Analysis Report</div>
          <div class="subtitle">Date: ${date} · ${city}</div>
        </div>

        <div class="section">
          <div class="section-title">Analysis Summary</div>
          <div class="row">
            <span class="label">Skin Condition:</span>
            <span class="value" style="text-transform: capitalize;">${predictedClass}</span>
          </div>
          <div class="row">
            <span class="label">AI Confidence:</span>
            <span class="value">${confidence}%</span>
          </div>
          <div class="row" style="align-items: center;">
            <span class="label">Risk Level:</span>
            <span class="badge" style="background-color: ${riskColor};">${riskLevel}</span>
          </div>
        </div>

        ${imageUri ? `
          <div class="image-container">
            <img src="${imageUri}" class="skin-image" />
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title weather">Weather & Environment</div>
          <div class="weather-grid">
            <div class="weather-card">
              <div class="wc-label">UV Index</div>
              <div class="wc-value">${uvIndex} <span class="badge" style="background-color: ${uvInfo.color}; font-size: 11px;">${uvInfo.label}</span></div>
            </div>
            <div class="weather-card">
              <div class="wc-label">Air Quality</div>
              <div class="wc-value">${aqi} <span class="badge" style="background-color: ${aqiInfo.color}; font-size: 11px;">${aqiInfo.label}</span></div>
            </div>
            <div class="weather-card">
              <div class="wc-label">Humidity</div>
              <div class="wc-value">${humidity}%</div>
            </div>
            <div class="weather-card">
              <div class="wc-label">Temperature</div>
              <div class="wc-value">${currentTemp}°C</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Recommendations</div>
          ${suggestions.length > 0 
            ? suggestions.map((s: string) => `<div class="suggestion-item">${s}</div>`).join('') 
            : '<p style="color: #9CA3AF; font-size: 13px;">No recommendations available.</p>'}
        </div>

        ${genaiSuggestions.length > 0 ? `
        <div class="section">
          <div class="section-title ai">AI-Powered Insights</div>
          ${genaiSuggestions.map((s: string) => `<div class="suggestion-item ai-item">${s}</div>`).join('')}
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Disclaimer</div>
          <p style="font-size: 12px; color: #666; margin: 0;">
            This report is generated by AI for informational purposes only. It is not a medical diagnosis. 
            Please consult a certified dermatologist for professional medical advice.
          </p>
        </div>

        <div class="footer">
          Generated by SkinSight App
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

