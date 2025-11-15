import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { InfoCard } from "../components/InfoCard";
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

type ResultsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Results"
>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, "Results">;

interface Props {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

const getSkinTypeIcon = (predictedClass: string) => {
  switch (predictedClass.toLowerCase()) {
    case "acne":
      return <Ionicons name="medical" size={24} color="#EF4444" />;
    case "dry":
      return <Ionicons name="water-outline" size={24} color="#3B82F6" />;
    case "oily":
      return <Ionicons name="flash" size={24} color="#F59E0B" />;
    case "normal":
      return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
    default:
      return <Ionicons name="body" size={24} color="#6366F1" />;
  }
};

export const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { data, imageUri , fromHistory } = route.params;
  const { user } = useAuth();

  // 🧩 Normalize structure for both Firestore + API response
  const normalizedData = {
    predictedClass:
      data?.predictedClass || data?.predicted_class || "Unknown",
    confidence: data?.confidence ?? 0,
    riskLevel: data?.riskLevel || data?.risk_level || "Unknown",
    weather: data?.weather || {},
    suggestions:
      data?.suggestions || data?.rule_based_suggestions || [],
    genaiSuggestions:
      data?.genai_suggestions || data?.ai_suggestions || [],
    disease: data?.disease || null,
  };

  const riskColor = getRiskColor(normalizedData.riskLevel);
  const uvColor = getUVIndexColor(normalizedData.weather.uv_index || 0);
  const aqiColor = getAQIColor(normalizedData.weather.aqi || 0);
  const confidencePercentage = Math.round(normalizedData.confidence * 100);

  const handleSaveResult = () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to save your results.");
      return;
    }

    Alert.alert(
      "Save Result",
      "Do you want to save this image with your result?",
      [
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
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Risk Card */}
        <View style={[styles.riskCard, { borderColor: riskColor }]}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskLabel}>Risk Level</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskBadgeText}>
                {normalizedData.riskLevel}
              </Text>
            </View>
          </View>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={[styles.confidenceValue, { color: riskColor }]}>
              {confidencePercentage}%
            </Text>
          </View>
        </View>

        {/* Skin Condition */}
        <InfoCard
          title="Skin Condition"
          value={
            typeof normalizedData.predictedClass === "string"
              ? normalizedData.predictedClass.charAt(0).toUpperCase() +
                normalizedData.predictedClass.slice(1)
              : "Unknown"
          }
          icon={getSkinTypeIcon(normalizedData.predictedClass || "Unknown")}
          color={riskColor}
        />

        {/* Disease Detection */}
        {normalizedData.disease && (
          <View style={[styles.diseaseCard, { borderColor: normalizedData.disease.confidence > 0.7 ? "#EF4444" : "#F59E0B" }]}>
            <View style={styles.diseaseHeader}>
              <Ionicons 
                name="medical" 
                size={24} 
                color={normalizedData.disease.confidence > 0.7 ? "#EF4444" : "#F59E0B"} 
              />
              <Text style={styles.diseaseTitle}>Detected Skin Condition</Text>
            </View>
            <Text style={styles.diseaseClass}>
              {normalizedData.disease.predicted_class}
            </Text>
            <View style={styles.diseaseConfidence}>
              <Text style={styles.diseaseConfidenceLabel}>Confidence:</Text>
              <Text style={[styles.diseaseConfidenceValue, { color: normalizedData.disease.confidence > 0.7 ? "#EF4444" : "#F59E0B" }]}>
                {normalizedData.disease.confidence_percentage}
              </Text>
            </View>
            {normalizedData.disease.confidence > 0.7 && (
              <View style={styles.diseaseWarning}>
                <Ionicons name="warning" size={20} color="#EF4444" />
                <Text style={styles.diseaseWarningText}>
                  High confidence detection. Please consult a dermatologist.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* UV Index */}
        <InfoCard
          title="UV Index"
          value={(normalizedData.weather.uv_index || 0).toFixed(1)}
          subtitle={getUVIndexLabel(normalizedData.weather.uv_index || 0)}
          color={uvColor}
          icon={<Ionicons name="sunny" size={24} color={uvColor} />}
        />

        {/* AQI */}
        <InfoCard
          title="Air Quality Index"
          value={normalizedData.weather.aqi || 0}
          subtitle={getAQILabel(normalizedData.weather.aqi || 0)}
          color={aqiColor}
          icon={<Ionicons name="cloud" size={24} color={aqiColor} />}
        />

        {/* Weather Info */}
        <View style={styles.weatherCard}>
          <Text style={styles.weatherCardTitle}>Weather Information</Text>

          <View style={styles.weatherItem}>
            <Ionicons name="location" size={20} color="#6B7280" />
            <Text style={styles.weatherItemText}>
              {normalizedData.weather.city || "Unknown"}
            </Text>
          </View>

          <View style={styles.weatherItem}>
            <Ionicons name="thermometer" size={20} color="#6B7280" />
            <Text style={styles.weatherItemText}>
              {(normalizedData.weather.temp_min ?? 0).toFixed(1)}°C -{" "}
              {(normalizedData.weather.temp_max ?? 0).toFixed(1)}°C
            </Text>
          </View>

          <View style={styles.weatherItem}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.weatherItemText}>
              Dominant Pollutant:{" "}
              {(normalizedData.weather.dominant_pollutant || "N/A").toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Rule-based Suggestions */}
        {normalizedData.suggestions.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.recommendationsTitle}>Recommendations</Text>
            {normalizedData.suggestions.map((suggestion, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.recommendationText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* GenAI Suggestions */}
        {normalizedData.genaiSuggestions.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.recommendationsTitle}>AI Suggestions</Text>
            {normalizedData.genaiSuggestions.map((suggestion, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="sparkles" size={20} color="#6366F1" />
                <Text style={styles.recommendationText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!fromHistory && <PrimaryButton
          title="Save Result"
          onPress={handleSaveResult}
          style={[styles.footerButton, { backgroundColor: "#6366F1" }]}
        />}
        <PrimaryButton
          title="New Analysis"
          onPress={() => navigation.navigate("Home")}
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
  scrollContent: { padding: 16 },
  riskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  riskLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskBadgeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  confidenceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confidenceLabel: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
  confidenceValue: { fontSize: 32, fontWeight: "700" },
  weatherCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherCardTitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  weatherItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  weatherItemText: { fontSize: 14, color: "#374151", flex: 1 },
  recommendationsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerButton: { marginBottom: 12 },
  diseaseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diseaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  diseaseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  diseaseClass: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  diseaseConfidence: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  diseaseConfidenceLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  diseaseConfidenceValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  diseaseWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  diseaseWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 18,
  },
});