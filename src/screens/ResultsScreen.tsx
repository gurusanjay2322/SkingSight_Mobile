import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatModal } from "../components/ChatModal";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../contexts/AuthContext";
import { resultService } from "../services/resultService";
import { RootStackParamList } from "../types";
import { uploadToCloudinary } from "../utils/cloudinary";
import {
  getAQIColor,
  getAQILabel,
  getRiskColor,
  getUVIndexColor,
  getUVIndexLabel,
} from "../utils/colors";
import { generateAndSharePDF } from "../utils/pdfGenerator";

type ResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Results">;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, "Results">;

interface Props {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

// Skin type info with skin impact details
const SKIN_TYPE_INFO: Record<string, { description: string; tip: string; icon: string }> = {
  oily: {
    description: "Your skin produces excess sebum, which can lead to shine and clogged pores.",
    tip: "Use oil-free products and gentle cleansers.",
    icon: "flash",
  },
  dry: {
    description: "Your skin lacks moisture, which may cause tightness, flaking, and fine lines.",
    tip: "Hydrate with rich moisturizers and avoid hot water.",
    icon: "water-outline",
  },
  acne: {
    description: "Your skin shows signs of acne from clogged pores, bacteria, or inflammation.",
    tip: "Use salicylic acid products and avoid touching your face.",
    icon: "medical",
  },
  normal: {
    description: "Your skin is well-balanced with good hydration and minimal issues.",
    tip: "Maintain your routine and focus on sun protection.",
    icon: "checkmark-circle",
  },
  burned: {
    description: "Your skin shows signs of sun damage or thermal irritation.",
    tip: "Apply soothing aloe vera and avoid further sun exposure.",
    icon: "flame",
  },
};

// Humidity impact on skin
const getHumidityImpact = (humidity: number, skinType: string): { level: string; impact: string; color: string } => {
  if (humidity < 30) {
    return {
      level: "Low",
      impact: skinType === "dry" 
        ? "Very dehydrating for your dry skin. Use extra moisturizer." 
        : "Air is dry. Apply moisturizer to prevent water loss.",
      color: "#F59E0B",
    };
  } else if (humidity < 60) {
    return {
      level: "Comfortable",
      impact: "Ideal humidity level for healthy skin.",
      color: "#10B981",
    };
  } else {
    return {
      level: "High",
      impact: skinType === "oily" 
        ? "May increase oiliness. Use mattifying products." 
        : "Skin may feel sticky. Use lightweight products.",
      color: "#3B82F6",
    };
  }
};

// Pollutant explanations
const POLLUTANT_INFO: Record<string, { name: string; skinEffect: string }> = {
  pm2_5: { name: "PM2.5", skinEffect: "Fine particles that penetrate pores and cause inflammation" },
  pm10: { name: "PM10", skinEffect: "Coarse particles that settle on skin surface" },
  o3: { name: "Ozone", skinEffect: "Accelerates skin aging and depletes antioxidants" },
  no2: { name: "Nitrogen Dioxide", skinEffect: "Can cause skin inflammation and barrier damage" },
  so2: { name: "Sulfur Dioxide", skinEffect: "May irritate sensitive skin" },
  co: { name: "Carbon Monoxide", skinEffect: "Reduces oxygen to skin cells" },
};

// Get outdoor timing recommendations
const getOutdoorTiming = (uvIndex: number, aqi: number, sunrise?: number, sunset?: number) => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Format sunrise/sunset times
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const sunriseTime = formatTime(sunrise);
  const sunsetTime = formatTime(sunset);

  let bestOutdoor: string[] = [];
  let avoidOutdoor: string[] = [];
  let currentAdvice = "";

  // UV-based recommendations
  if (uvIndex >= 8) {
    avoidOutdoor.push("10 AM - 4 PM (extreme UV)");
    bestOutdoor.push(`Before 9 AM${sunriseTime ? ` (sunrise ${sunriseTime})` : ""}`);
    bestOutdoor.push(`After 5 PM${sunsetTime ? ` (sunset ${sunsetTime})` : ""}`);
    currentAdvice = currentHour >= 10 && currentHour <= 16 
      ? "⚠️ High UV right now - stay indoors or use strong protection"
      : "✅ Safe to be outdoors with basic protection";
  } else if (uvIndex >= 6) {
    avoidOutdoor.push("11 AM - 3 PM (high UV)");
    bestOutdoor.push("Early morning or late afternoon");
    currentAdvice = currentHour >= 11 && currentHour <= 15 
      ? "⚠️ UV is elevated - wear sunscreen"
      : "✅ Good time for outdoor activities";
  } else if (uvIndex >= 3) {
    bestOutdoor.push("Most of the day is safe");
    currentAdvice = "✅ Moderate UV - basic sun protection recommended";
  } else {
    bestOutdoor.push("Anytime is safe");
    currentAdvice = "✅ Low UV - minimal sun protection needed";
  }

  // AQI-based modifications
  if (aqi > 150) {
    avoidOutdoor.push("Limit all outdoor activities");
    currentAdvice = "⚠️ Poor air quality - stay indoors when possible";
  } else if (aqi > 100) {
    avoidOutdoor.push("Avoid strenuous outdoor exercise");
  }

  return { bestOutdoor, avoidOutdoor, currentAdvice, sunriseTime, sunsetTime };
};

// Morning/Evening routine generator
const generateRoutine = (skinType: string, uvIndex: number, humidity: number, hasDisease: boolean) => {
  const morning = [
    { step: "Gentle Cleanser", reason: "Remove overnight oils" },
    skinType === "oily" || skinType === "acne"
      ? { step: "Toner (alcohol-free)", reason: "Balance skin pH" }
      : null,
    uvIndex >= 3
      ? { step: `Sunscreen SPF ${uvIndex >= 6 ? "50+" : "30+"}`, reason: "UV protection" }
      : null,
    humidity < 40
      ? { step: "Hydrating Moisturizer", reason: "Combat dry air" }
      : skinType === "oily"
      ? { step: "Lightweight Moisturizer", reason: "Oil-free hydration" }
      : { step: "Moisturizer", reason: "Daily hydration" },
  ].filter(Boolean);

  const evening = [
    { step: "Double Cleanse", reason: "Remove sunscreen & pollutants" },
    skinType === "acne" ? { step: "Salicylic Acid Treatment", reason: "Unclog pores" } : null,
    skinType === "dry" ? { step: "Hydrating Serum", reason: "Deep hydration" } : null,
    hasDisease ? { step: "Prescribed Treatment", reason: "Follow dermatologist advice" } : null,
    { step: "Night Moisturizer", reason: "Overnight repair" },
  ].filter(Boolean);

  return { morning, evening };
};

export const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { data, imageUri, fromHistory } = route.params;
  const { user } = useAuth();
  const [chatVisible, setChatVisible] = useState(false);
  
  // Cast to any to handle both AnalyzeResponse (snake_case) and SkinResult (camelCase)
  const safeData = data as any;

  // Normalize structure for both Firestore + API response
  const normalizedData = {
    predictedClass: safeData?.predictedClass || safeData?.predicted_class || "Unknown",
    confidence: safeData?.confidence ?? 0,
    riskLevel: safeData?.riskLevel || safeData?.risk_level || "Unknown",
    weather: safeData?.weather || {},
    suggestions: safeData?.suggestions || safeData?.rule_based_suggestions || [],
    genaiSuggestions: safeData?.genai_suggestions || safeData?.ai_suggestions || [],
    classScores: safeData?.class_scores || null,
    disease: safeData?.disease
      ? {
          label: safeData.disease?.label || safeData.disease?.predicted_class || "Unknown",
          confidence: safeData.disease?.confidence ?? 0,
          confidencePercentage: Math.round((safeData.disease?.confidence ?? 0) * 100),
        }
      : null,
  };

  const DISEASE_THRESHOLD = 0.3;
  const hasDisease = normalizedData.disease && normalizedData.disease.confidence >= DISEASE_THRESHOLD;

  const riskColor = getRiskColor(normalizedData.riskLevel);
  const uvColor = getUVIndexColor(normalizedData.weather.uv_index || 0);
  const aqiColor = getAQIColor(normalizedData.weather.aqi || 0);
  const confidencePercentage = Math.round(normalizedData.confidence * 100);

  const skinTypeKey = normalizedData.predictedClass.toLowerCase();
  const skinInfo = SKIN_TYPE_INFO[skinTypeKey] || {
    description: "Your skin condition has been analyzed.",
    tip: "Follow the recommendations below.",
    icon: "body",
  };

  const formatSkinType = (type: string) => type.charAt(0).toUpperCase() + type.slice(1);

  // Weather data
  const weather = normalizedData.weather;
  const humidity = weather.humidity || 50;
  const humidityInfo = getHumidityImpact(humidity, skinTypeKey);
  const currentTemp = weather.current_temp || weather.temp_max || 0;
  const feelsLike = weather.feels_like || currentTemp;
  
  // Outdoor timing
  const outdoorTiming = getOutdoorTiming(
    weather.uv_index || 0,
    weather.aqi || 0,
    weather.sunrise,
    weather.sunset
  );

  // Personalized routine
  const routine = generateRoutine(skinTypeKey, weather.uv_index || 0, humidity, !!hasDisease);

  // Class scores for chart
  const classScores = normalizedData.classScores || {};
  const sortedScores = Object.entries(classScores)
    .sort(([, a], [, b]) => (b as number) - (a as number)) as [string, number][];

  const handleSaveResult = () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to save your results.");
      return;
    }

    Alert.alert("Save Result", "Do you want to save this image with your result?", [
      {
        text: "No",
        onPress: async () => {
          await resultService.saveResult({
            uid: user.uid,
            predictedClass: normalizedData.predictedClass,
            confidence: normalizedData.confidence,
            weather: normalizedData.weather,
            riskLevel: normalizedData.riskLevel,
            suggestions: normalizedData.suggestions,
          });
          Alert.alert("Saved", "Result saved without image.");
        },
      },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const imageUrl = await uploadToCloudinary(imageUri);
            await resultService.saveResult({
              uid: user.uid,
              predictedClass: normalizedData.predictedClass,
              confidence: normalizedData.confidence,
              weather: normalizedData.weather,
              riskLevel: normalizedData.riskLevel,
              suggestions: normalizedData.suggestions,
              imageUrl: imageUrl ?? undefined,
            });
            Alert.alert("Saved", "Result and image saved successfully.");
          } catch (err) {
            console.error("Save error:", err);
            Alert.alert("Error", "Failed to save result.");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const currentTime = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <TouchableOpacity onPress={() => generateAndSharePDF(normalizedData, imageUri)}>
          <Ionicons name="share-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.heroCard, { borderLeftColor: riskColor }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroSkinType}>
              <Text style={styles.heroLabel}>Your Skin Type</Text>
              <View style={styles.heroValueRow}>
                <Ionicons name={skinInfo.icon as any} size={28} color={riskColor} />
                <Text style={styles.heroValue}>{formatSkinType(normalizedData.predictedClass)}</Text>
              </View>
            </View>
            <View style={styles.heroRiskContainer}>
              <Text style={styles.heroRiskLabel}>Today's Risk</Text>
              <View style={[styles.heroBadge, { backgroundColor: riskColor }]}>
                <Text style={styles.heroBadgeText}>{normalizedData.riskLevel}</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroInsight}>
            <Ionicons name="bulb" size={18} color="#6366F1" />
            <Text style={styles.heroInsightText}>{skinInfo.tip}</Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* OUTDOOR TIMING - NEW */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <View style={styles.timingCard}>
          <View style={styles.timingHeader}>
            <Ionicons name="time-outline" size={20} color="#6366F1" />
            <Text style={styles.timingTitle}>Best Times for You</Text>
          </View>
          <Text style={styles.timingCurrent}>{outdoorTiming.currentAdvice}</Text>
          
          <View style={styles.timingRow}>
            <View style={styles.timingCol}>
              <Text style={styles.timingColTitle}>✅ Best Outdoor Times</Text>
              {outdoorTiming.bestOutdoor.map((time, i) => (
                <Text key={i} style={styles.timingItem}>• {time}</Text>
              ))}
            </View>
            {outdoorTiming.avoidOutdoor.length > 0 && (
              <View style={styles.timingCol}>
                <Text style={styles.timingColTitle}>⚠️ Avoid</Text>
                {outdoorTiming.avoidOutdoor.map((time, i) => (
                  <Text key={i} style={[styles.timingItem, { color: "#DC2626" }]}>• {time}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SKIN CONFIDENCE CHART - NEW */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {sortedScores.length > 0 && (
          <CollapsibleSection
            title="AI Confidence Breakdown"
            icon={<Ionicons name="bar-chart-outline" size={20} color="#8B5CF6" />}
            defaultExpanded={false}
          >
            <Text style={styles.chartExplainer}>Why the AI classified your skin as {formatSkinType(normalizedData.predictedClass)}:</Text>
            {sortedScores.map(([type, score]) => (
              <View key={type} style={styles.chartRow}>
                <Text style={[styles.chartLabel, type === skinTypeKey && styles.chartLabelActive]}>
                  {formatSkinType(type)}
                </Text>
                <View style={styles.chartBarBg}>
                  <View style={[styles.chartBar, { width: `${score}%`, backgroundColor: type === skinTypeKey ? "#6366F1" : "#D1D5DB" }]} />
                </View>
                <Text style={[styles.chartValue, type === skinTypeKey && styles.chartValueActive]}>
                  {score}%
                </Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SKIN ANALYSIS */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          title="Your Skin Analysis"
          icon={<Ionicons name="body-outline" size={20} color="#6366F1" />}
          defaultExpanded={true}
        >
          <View style={styles.analysisRow}>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Skin Type</Text>
              <Text style={styles.analysisValue}>{formatSkinType(normalizedData.predictedClass)}</Text>
            </View>
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Confidence</Text>
              <Text style={[styles.analysisValue, { color: "#6366F1" }]}>{confidencePercentage}%</Text>
            </View>
          </View>

          <View style={styles.explainerBox}>
            <Ionicons name="information-circle" size={16} color="#6366F1" />
            <Text style={styles.explainerText}>{skinInfo.description}</Text>
          </View>

          {/* Disease Detection */}
          {normalizedData.disease && (
            <View style={[styles.diseaseBox, { borderColor: hasDisease ? "#F59E0B" : "#10B981" }]}>
              <View style={styles.diseaseHeader}>
                <Ionicons
                  name={hasDisease ? "alert-circle" : "checkmark-circle"}
                  size={20}
                  color={hasDisease ? "#F59E0B" : "#10B981"}
                />
                <Text style={[styles.diseaseTitle, { color: hasDisease ? "#92400E" : "#065F46" }]}>
                  {hasDisease ? `Detected: ${normalizedData.disease.label}` : "No Skin Conditions Detected"}
                </Text>
              </View>
              <Text style={styles.diseaseConfidence}>Confidence: {normalizedData.disease.confidencePercentage}%</Text>
              {hasDisease && normalizedData.disease.confidence > 0.7 && (
                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={16} color="#DC2626" />
                  <Text style={styles.warningText}>Consider consulting a dermatologist for professional evaluation.</Text>
                </View>
              )}
            </View>
          )}
        </CollapsibleSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* WEATHER & SKIN IMPACT - ENHANCED */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          title="Weather & Skin Impact"
          icon={<Ionicons name="partly-sunny-outline" size={20} color="#F59E0B" />}
          defaultExpanded={true}
        >
          {/* Current Conditions */}
          <View style={styles.weatherGrid}>
            <View style={styles.weatherGridItem}>
              <Ionicons name="thermometer" size={24} color="#EF4444" />
              <Text style={styles.weatherGridValue}>{currentTemp.toFixed(0)}°C</Text>
              <Text style={styles.weatherGridLabel}>Feels {feelsLike.toFixed(0)}°</Text>
            </View>
            <View style={styles.weatherGridItem}>
              <Ionicons name="water" size={24} color={humidityInfo.color} />
              <Text style={styles.weatherGridValue}>{humidity}%</Text>
              <Text style={styles.weatherGridLabel}>{humidityInfo.level}</Text>
            </View>
            <View style={styles.weatherGridItem}>
              <Ionicons name="sunny" size={24} color={uvColor} />
              <Text style={styles.weatherGridValue}>{(weather.uv_index || 0).toFixed(1)}</Text>
              <Text style={styles.weatherGridLabel}>{getUVIndexLabel(weather.uv_index || 0)}</Text>
            </View>
            <View style={styles.weatherGridItem}>
              <Ionicons name="cloud" size={24} color={aqiColor} />
              <Text style={styles.weatherGridValue}>{weather.aqi || 0}</Text>
              <Text style={styles.weatherGridLabel}>{getAQILabel(weather.aqi || 0)}</Text>
            </View>
          </View>

          {/* Humidity Impact */}
          <View style={[styles.impactBox, { borderLeftColor: humidityInfo.color }]}>
            <Text style={styles.impactTitle}>💧 Humidity Impact on Your Skin</Text>
            <Text style={styles.impactText}>{humidityInfo.impact}</Text>
          </View>

          {/* UV Impact */}
          <View style={[styles.impactBox, { borderLeftColor: uvColor }]}>
            <Text style={styles.impactTitle}>☀️ UV Impact on Your Skin</Text>
            <Text style={styles.impactText}>
              {weather.uv_index >= 8
                ? "Extreme risk of harm. Unprotected skin can burn in minutes."
                : weather.uv_index >= 6
                ? "High risk. UV damages collagen and accelerates aging."
                : weather.uv_index >= 3
                ? "Moderate risk. Sun protection still recommended."
                : "Low risk. Minimal skin damage expected."}
            </Text>
          </View>

          {/* Pollutant Info */}
          {weather.dominant_pollutant && POLLUTANT_INFO[weather.dominant_pollutant] && (
            <View style={[styles.impactBox, { borderLeftColor: aqiColor }]}>
              <Text style={styles.impactTitle}>💨 Main Pollutant: {POLLUTANT_INFO[weather.dominant_pollutant].name}</Text>
              <Text style={styles.impactText}>{POLLUTANT_INFO[weather.dominant_pollutant].skinEffect}</Text>
            </View>
          )}

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#6B7280" />
            <Text style={styles.locationText}>
              {weather.city}{weather.country ? `, ${weather.country}` : ""}
            </Text>
          </View>
        </CollapsibleSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PERSONALIZED ROUTINE - NEW */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          title="Your Skincare Routine"
          icon={<Ionicons name="sparkles-outline" size={20} color="#EC4899" />}
          defaultExpanded={false}
        >
          <Text style={styles.routineSubtitle}>Based on your {formatSkinType(normalizedData.predictedClass)} skin + today's weather:</Text>
          
          <View style={styles.routineSection}>
            <View style={styles.routineHeader}>
              <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
              <Text style={styles.routineTitle}>Morning Routine</Text>
            </View>
            {routine.morning.map((item: any, i) => (
              <View key={i} style={styles.routineItem}>
                <Text style={styles.routineStep}>{i + 1}. {item.step}</Text>
                <Text style={styles.routineReason}>{item.reason}</Text>
              </View>
            ))}
          </View>

          <View style={styles.routineSection}>
            <View style={styles.routineHeader}>
              <Ionicons name="moon-outline" size={18} color="#6366F1" />
              <Text style={styles.routineTitle}>Evening Routine</Text>
            </View>
            {routine.evening.map((item: any, i) => (
              <View key={i} style={styles.routineItem}>
                <Text style={styles.routineStep}>{i + 1}. {item.step}</Text>
                <Text style={styles.routineReason}>{item.reason}</Text>
              </View>
            ))}
          </View>
        </CollapsibleSection>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* RECOMMENDATIONS */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {(normalizedData.suggestions.length > 0 || normalizedData.genaiSuggestions.length > 0) && (
          <CollapsibleSection
            title="Expert Recommendations"
            icon={<Ionicons name="checkmark-done-outline" size={20} color="#10B981" />}
            defaultExpanded={true}
          >
            {normalizedData.suggestions.length > 0 && (
              <View style={styles.recSection}>
                <View style={styles.recHeader}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  <Text style={styles.recHeaderText}>Based on Your Analysis</Text>
                </View>
                {normalizedData.suggestions.map((suggestion: string, index: number) => (
                  <View key={index} style={styles.recItem}>
                    <View style={styles.recBullet} />
                    <Text style={styles.recText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}

            {normalizedData.genaiSuggestions.length > 0 && (
              <View style={[styles.recSection, { marginTop: 16 }]}>
                <View style={styles.recHeader}>
                  <Ionicons name="sparkles" size={16} color="#6366F1" />
                  <Text style={styles.recHeaderText}>AI-Powered Personalized Tips</Text>
                </View>
                {normalizedData.genaiSuggestions.map((suggestion: string, index: number) => (
                  <View key={index} style={styles.recItem}>
                    <View style={[styles.recBullet, { backgroundColor: "#6366F1" }]} />
                    <Text style={styles.recText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </CollapsibleSection>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DATA SOURCES - Always Visible */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <View style={styles.sourcesCard}>
          <View style={styles.sourcesHeader}>
            <Ionicons name="shield-checkmark" size={18} color="#6B7280" />
            <Text style={styles.sourcesTitle}>Data Sources & Reliability</Text>
          </View>

          <View style={styles.sourceItem}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text style={styles.sourceText}>Analyzed: {currentTime}</Text>
          </View>

          <View style={styles.sourceItem}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={styles.sourceText}>Location: {weather.city}{weather.country ? `, ${weather.country}` : ""}</Text>
          </View>

          <View style={styles.sourceDivider} />

          <Text style={styles.sourceLabel}>Data provided by:</Text>
          <View style={styles.sourceList}>
            <Text style={styles.sourceProvider}>• Weather & AQI: OpenWeatherMap API</Text>
            <Text style={styles.sourceProvider}>• UV Index: Open-Meteo API</Text>
            <Text style={styles.sourceProvider}>• Skin Type Analysis: ResNet50 CNN</Text>
            {normalizedData.disease && (
              <Text style={styles.sourceProvider}>• Disease Detection: EfficientNet-B0</Text>
            )}
            {normalizedData.genaiSuggestions.length > 0 && (
              <Text style={styles.sourceProvider}>• AI Suggestions: GPT-OSS LLM</Text>
            )}
          </View>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
            <Text style={styles.disclaimerText}>
              This is not a medical diagnosis. Always consult a dermatologist for professional advice.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {!fromHistory && (
          <PrimaryButton
            title="Save Result"
            onPress={handleSaveResult}
            style={[styles.footerButton, { backgroundColor: "#6366F1" }]}
          />
        )}
        <PrimaryButton
          title="New Analysis"
          onPress={() => navigation.navigate("Home")}
          style={styles.footerButton}
        />
      </View>

      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setChatVisible(true)}
      >
        <Ionicons name="chatbubbles" size={24} color="#FFF" />
        <Text style={styles.fabText}>Ask AI</Text>
      </TouchableOpacity>

      {/* Chat Modal */}
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        context={normalizedData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },

  // Hero Card
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  heroSkinType: {},
  heroValueRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  heroRiskContainer: { alignItems: "flex-end" },
  heroRiskLabel: { fontSize: 11, color: "#6B7280", fontWeight: "500", marginBottom: 4 },
  heroLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  heroValue: { fontSize: 26, fontWeight: "700", color: "#111827" },
  heroBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  heroInsight: { flexDirection: "row", alignItems: "center", backgroundColor: "#EEF2FF", padding: 12, borderRadius: 8, gap: 8 },
  heroInsightText: { flex: 1, fontSize: 13, color: "#4338CA", lineHeight: 18 },

  // Timing Card
  timingCard: { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E0E7FF" },
  timingHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  timingTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  timingCurrent: { fontSize: 14, fontWeight: "600", marginBottom: 12, padding: 10, backgroundColor: "#F3F4F6", borderRadius: 8 },
  timingRow: { flexDirection: "row", gap: 16 },
  timingCol: { flex: 1 },
  timingColTitle: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  timingItem: { fontSize: 12, color: "#4B5563", marginBottom: 4, paddingLeft: 4 },

  // Chart
  chartExplainer: { fontSize: 12, color: "#6B7280", marginBottom: 12 },
  chartRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  chartLabel: { width: 60, fontSize: 12, color: "#6B7280" },
  chartLabelActive: { fontWeight: "700", color: "#111827" },
  chartBarBg: { flex: 1, height: 16, backgroundColor: "#F3F4F6", borderRadius: 8, overflow: "hidden" },
  chartBar: { height: "100%", borderRadius: 8 },
  chartValue: { width: 40, fontSize: 12, color: "#6B7280", textAlign: "right" },
  chartValueActive: { fontWeight: "700", color: "#6366F1" },

  // Analysis
  analysisRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  analysisItem: {},
  analysisLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  analysisValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  explainerBox: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#F5F3FF", padding: 12, borderRadius: 8, gap: 8, marginBottom: 12 },
  explainerText: { flex: 1, fontSize: 13, color: "#5B21B6", lineHeight: 18 },
  diseaseBox: { borderWidth: 1, borderRadius: 8, padding: 12, backgroundColor: "#FEFCE8" },
  diseaseHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  diseaseTitle: { fontSize: 14, fontWeight: "600" },
  diseaseConfidence: { fontSize: 12, color: "#6B7280", marginLeft: 28 },
  warningBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", padding: 8, borderRadius: 6, gap: 6, marginTop: 8 },
  warningText: { fontSize: 12, color: "#DC2626", flex: 1 },

  // Weather Grid
  weatherGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  weatherGridItem: { width: "25%", alignItems: "center", paddingVertical: 12 },
  weatherGridValue: { fontSize: 18, fontWeight: "700", color: "#111827", marginTop: 4 },
  weatherGridLabel: { fontSize: 10, color: "#6B7280", marginTop: 2 },
  impactBox: { backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 3 },
  impactTitle: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4 },
  impactText: { fontSize: 12, color: "#6B7280", lineHeight: 18 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  locationText: { fontSize: 13, color: "#6B7280" },

  // Routine
  routineSubtitle: { fontSize: 12, color: "#6B7280", marginBottom: 16 },
  routineSection: { marginBottom: 16 },
  routineHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  routineTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  routineItem: { marginBottom: 8, paddingLeft: 4 },
  routineStep: { fontSize: 13, fontWeight: "600", color: "#374151" },
  routineReason: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  // Recommendations
  recSection: {},
  recHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  recHeaderText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  recItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 10 },
  recBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981", marginTop: 6 },
  recText: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 },

  // Sources
  sourcesCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginTop: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  sourcesHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sourcesTitle: { fontSize: 14, fontWeight: "600", color: "#374151" },
  sourceItem: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  sourceText: { fontSize: 12, color: "#6B7280" },
  sourceDivider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },
  sourceLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 6, fontWeight: "500" },
  sourceList: { marginLeft: 4 },
  sourceProvider: { fontSize: 12, color: "#6B7280", marginBottom: 3 },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#F9FAFB", padding: 10, borderRadius: 6, gap: 6, marginTop: 12 },
  disclaimerText: { flex: 1, fontSize: 11, color: "#6B7280", lineHeight: 16 },

  // Footer
  footer: { padding: 16, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  footerButton: { marginBottom: 8 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#6366F1",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    elevation: 6,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 8,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});