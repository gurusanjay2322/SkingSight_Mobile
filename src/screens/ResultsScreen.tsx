import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { resultService } from "../services/resultService";
import { ChatModal } from "../components/ChatModal";
import { CustomAlert } from "../components/CustomAlert";
import { generateAndSharePDF } from "../utils/pdfGenerator";
import { uploadToCloudinary } from "../utils/cloudinary";
import { Alert } from "react-native";

const { width } = Dimensions.get("window");

// --- UI Constants ---
const RISK_COLORS: Record<string, string> = {
  Low: "#10B981",
  Moderate: "#F59E0B",
  High: "#EF4444",
  "Very High": "#B91C1C",
  Unknown: "#71717A",
};

const WEATHER_ICONS: Record<string, any> = {
  temp: { icon: "thermometer-outline", label: "Temp", unit: "°C" },
  humidity: { icon: "water-outline", label: "Humidity", unit: "%" },
  uv: { icon: "sunny-outline", label: "UV Index", unit: "" },
  aqi: { icon: "leaf-outline", label: "AQI", unit: "" },
};

interface RoutineStep {
  step: string;
  reason: string;
}

interface TimingData {
  recommended: string[];
  avoid: string[];
  current_advice: string;
}

const ResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const isGuest = !user;
  const fromHistory = route.params?.fromHistory === true;

  // --- State ---
  const [isSaving, setIsSaving] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [backAlertVisible, setBackAlertVisible] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // --- Data Normalization ---
  const rawData = route.params?.data || route.params?.result || {};
  const imageUri =
    route.params?.imageUri ||
    route.params?.data?.imageUrl ||
    route.params?.result?.imageUrl;

  // --- VIEW MODEL ---
  const viewModel = useMemo(() => {
    const data = rawData;
    // Check both weather and weatherRaw for compatibility with saved results
    const weather = data.weather || data.weatherRaw || {};
    const disease = data.disease || null;

    // Fallbacks
    const defaultRoutine = {
      morning: [
        { step: "Cleanse", reason: "Remove overnight impurities" },
        { step: "Moisturize", reason: "Keep skin hydrated" },
        { step: "Protect", reason: "Apply sunscreen" },
      ],
      evening: [
        { step: "Cleanse", reason: "Remove daily pollutants" },
        { step: "Repair", reason: "Apply night-time treatment" },
        { step: "Hydrate", reason: "Lock in moisture" },
      ],
    };

    const defaultTiming: TimingData = {
      recommended: ["Peak hours are usually before 10 AM and after 4 PM"],
      avoid: ["Limit exposure during high UV hours (10 AM - 4 PM)"],
      current_advice: "Follow general sun safety guidelines.",
    };

    return {
      predictedClass: data.predicted_class || data.predictedClass || "Unknown",
      confidence: data.confidence ?? 0,
      riskLevel: data.risk_level || data.riskLevel || "Low",
      routine: data.ai_routine || defaultRoutine,
      timing: data.outdoor_timing || defaultTiming,
      insights: data.ai_insights || [],
      suggestions: data.genai_suggestions || data.rule_based_suggestions || [],
      disease: disease
        ? {
            label: disease.predicted_class || disease.label || "Unknown",
            confidence: disease.confidence ?? 0,
            percentage: Math.round((disease.confidence ?? 0) * 100),
          }
        : null,
      classScores: data.class_scores || {},
      weather: {
        temp: weather.current_temp || weather.temp || 0,
        humidity: weather.humidity || 0,
        uv: weather.uv_index || weather.uv || 0,
        aqi: weather.aqi || 0,
        location: weather.city || weather.location || "Current Location",
        condition: weather.weather_condition || weather.condition || "Clear",
        // Preserve additional weather data for context
        wind_speed: weather.wind_speed || 0,
        pressure: weather.pressure || 0,
        clouds: weather.clouds || 0,
      },
      raw: data,
    };
  }, [rawData]);

  // --- Navigation Guard (Hardware Back & Gestures) ---
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      // If we already saved, if we are explicitly navigating to Home, or if viewing from history, allow it
      if (
        hasSaved ||
        fromHistory ||
        (e.data.action.type === "NAVIGATE" &&
          e.data.action.payload?.name === "Home")
      ) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Show the confirmation alert
      setBackAlertVisible(true);
    });

    return unsubscribe;
  }, [navigation, hasSaved, fromHistory]);

  // --- Actions ---
  const handleSaveResult = async () => {
    if (isGuest) {
      setAlertVisible(true);
      return;
    }

    if (!user) return;

    setIsSaving(true);
    try {
      let finalImageUrl = imageUri;

      // 1. Upload to Cloudinary if it's a local URI
      if (
        imageUri &&
        (imageUri.startsWith("file://") || imageUri.startsWith("content://"))
      ) {
        console.log("📤 Uploading image to Cloudinary...");
        try {
          finalImageUrl = await uploadToCloudinary(imageUri);
        } catch (uploadError) {
          console.error(
            "Cloudinary upload failed, saving with local URI:",
            uploadError,
          );
          // We continue anyway, though the image might not be viewable later
        }
      }

      // 2. Prepare the payload - save the full raw data PLUS important flattened fields
      const savePayload = {
        uid: user.uid,
        ...viewModel.raw, // This preserves the original API response structure
        // Ensure these are at the top level for HistoryScreen/Dashboard
        predictedClass: viewModel.predictedClass,
        confidence: viewModel.confidence,
        riskLevel: viewModel.riskLevel,
        imageUrl: finalImageUrl,
        // Save both the transformed weather and raw weather for compatibility
        weather: viewModel.weather,
        weatherRaw: viewModel.raw.weather, // Save raw weather data as fallback
        savedAt: new Date().toISOString(),
      };

      await resultService.saveResult(savePayload);

      setHasSaved(true);
      Alert.alert("Success", "Result saved to history successfully!");
      navigation.navigate("Home");
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert(
        "Error",
        "Failed to save result. Please check your connection.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => navigation.navigate("Camera");

  const handleBack = () => {
    if (fromHistory) {
      navigation.navigate("History");
    } else if (isGuest || !hasSaved) {
      setBackAlertVisible(true);
    } else {
      navigation.navigate("Home");
    }
  };

  const handleExport = async () => {
    await generateAndSharePDF(viewModel.raw, imageUri);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#09090B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <TouchableOpacity
          onPress={() => setImageModalVisible(true)}
          style={styles.backButton}
        >
          <Ionicons name="image-outline" size={24} color="#09090B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>Detected Skin Type</Text>
            <Text style={styles.heroValue}>{viewModel.predictedClass}</Text>
            <View style={styles.heroRiskContainer}>
              <Text style={styles.heroRiskLabel}>Environmental Risk</Text>
              <View
                style={[
                  styles.heroBadge,
                  {
                    backgroundColor:
                      RISK_COLORS[viewModel.riskLevel] || RISK_COLORS.Unknown,
                  },
                ]}
              >
                <Text style={styles.heroBadgeText}>{viewModel.riskLevel}</Text>
              </View>
            </View>
          </View>

          {viewModel.insights && viewModel.insights.length > 0 && (
            <View style={styles.heroInsight}>
              <Ionicons name="sparkles" size={20} color="#7C3AED" />
              <Text style={styles.heroInsightText}>
                {viewModel.insights[0]}
              </Text>
            </View>
          )}
        </View>

        {/* Outdoor Timing */}
        <View style={styles.timingCard}>
          <View style={styles.timingHeader}>
            <Ionicons name="time-outline" size={18} color="#09090B" />
            <Text style={styles.timingTitle}>Outdoor Guidance</Text>
          </View>
          <Text style={styles.timingCurrent}>
            {viewModel.timing.current_advice}
          </Text>
          <View style={styles.timingRow}>
            <View style={styles.timingCol}>
              <Text style={styles.timingColTitle}>Recommended</Text>
              {viewModel.timing.recommended?.map(
                (item: string, idx: number) => (
                  <Text key={idx} style={styles.timingItem}>
                    ✅ {item}
                  </Text>
                ),
              )}
            </View>
            <View style={styles.timingCol}>
              <Text style={styles.timingColTitle}>Caution</Text>
              {viewModel.timing.avoid?.map((item: string, idx: number) => (
                <Text
                  key={idx}
                  style={[styles.timingItem, { color: "#991B1B" }]}
                >
                  ⚠️ {item}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Environment Grid */}
        <View style={{ marginBottom: 32 }}>
          <Text style={[styles.heroLabel, { marginBottom: 16 }]}>
            Environment
          </Text>
          <View style={styles.weatherGrid}>
            <View style={styles.weatherGridItem}>
              <Ionicons name="thermometer-outline" size={20} color="#71717A" />
              <Text style={styles.weatherGridValue}>
                {viewModel.weather.temp}°C
              </Text>
              <Text style={styles.weatherGridLabel}>Temp</Text>
            </View>
            <View style={styles.weatherGridItem}>
              <Ionicons name="water-outline" size={20} color="#71717A" />
              <Text style={styles.weatherGridValue}>
                {viewModel.weather.humidity}%
              </Text>
              <Text style={styles.weatherGridLabel}>Humidity</Text>
            </View>
            <View style={styles.weatherGridItem}>
              <Ionicons name="sunny-outline" size={20} color="#71717A" />
              <Text style={styles.weatherGridValue}>
                {viewModel.weather.uv}
              </Text>
              <Text style={styles.weatherGridLabel}>UV Index</Text>
            </View>
            <View style={[styles.weatherGridItem, { borderRightWidth: 0 }]}>
              <Ionicons name="leaf-outline" size={20} color="#71717A" />
              <Text style={styles.weatherGridValue}>
                {viewModel.weather.aqi}
              </Text>
              <Text style={styles.weatherGridLabel}>AQI</Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#71717A" />
            <Text style={styles.locationText}>
              {viewModel.weather.location}
            </Text>
          </View>
        </View>

        {/* Routine Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.heroLabel, { marginBottom: 4 }]}>
            AI-Generated Routine
          </Text>
          <Text style={styles.routineSubtitle}>
            Optimized for {viewModel.predictedClass} skin in{" "}
            {viewModel.weather.condition} weather.
          </Text>
          <View style={styles.routineSection}>
            <View style={styles.routineHeader}>
              <Ionicons name="sunny" size={20} color="#F59E0B" />
              <Text style={styles.routineTitle}>Morning</Text>
            </View>
            {viewModel.routine.morning?.map(
              (item: RoutineStep, idx: number) => (
                <View key={idx} style={styles.routineItem}>
                  <Text style={styles.routineStep}>{item.step}</Text>
                  <Text style={styles.routineReason}>{item.reason}</Text>
                </View>
              ),
            )}
          </View>
          <View style={styles.routineSection}>
            <View style={styles.routineHeader}>
              <Ionicons name="moon" size={20} color="#4B5563" />
              <Text style={styles.routineTitle}>Evening</Text>
            </View>
            {viewModel.routine.evening?.map(
              (item: RoutineStep, idx: number) => (
                <View key={idx} style={styles.routineItem}>
                  <Text style={styles.routineStep}>{item.step}</Text>
                  <Text style={styles.routineReason}>{item.reason}</Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* AI Suggestions */}
        {viewModel.suggestions && viewModel.suggestions.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <Text style={[styles.heroLabel, { marginBottom: 16 }]}>
              Personalized Tips
            </Text>
            {viewModel.suggestions.map((tip: string, idx: number) => (
              <View key={idx} style={styles.suggestionItem}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color="#09090B"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.suggestionText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Confidence Chart */}
        {Object.keys(viewModel.classScores).length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.heroLabel, { marginBottom: 12 }]}>
              Analysis Confidence
            </Text>
            {Object.entries(viewModel.classScores).map(
              ([label, score]: [string, any]) => (
                <View key={label} style={styles.chartRow}>
                  <Text
                    style={[
                      styles.chartLabel,
                      label.toLowerCase() ===
                        viewModel.predictedClass.toLowerCase() &&
                        styles.chartLabelActive,
                    ]}
                  >
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </Text>
                  <View style={styles.chartBarBg}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          width: `${score}%`,
                          backgroundColor:
                            label.toLowerCase() ===
                            viewModel.predictedClass.toLowerCase()
                              ? "#09090B"
                              : "#E4E4E7",
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.chartValue,
                      label.toLowerCase() ===
                        viewModel.predictedClass.toLowerCase() &&
                        styles.chartValueActive,
                    ]}
                  >
                    {Math.round(score)}%
                  </Text>
                </View>
              ),
            )}
          </View>
        )}

        {/* Disease Detection */}
        {viewModel.disease && (
          <View style={{ marginTop: 32 }}>
            <Text style={[styles.heroLabel, { marginBottom: 16 }]}>
              Secondary Observations
            </Text>
            <View style={styles.diseaseBox}>
              <View style={styles.diseaseHeader}>
                <Ionicons name="medical-outline" size={20} color="#09090B" />
                <Text style={styles.diseaseTitle}>
                  {viewModel.disease.label}
                </Text>
              </View>
              <Text style={styles.diseaseConfidence}>
                Confidence: {viewModel.disease.percentage}%
              </Text>
              <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={16} color="#991B1B" />
                <Text style={styles.warningText}>
                  AI scans are not diagnoses. Consult a professional.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Data Sources */}
        <View style={styles.sourcesCard}>
          <View style={styles.sourcesHeader}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#71717A"
            />
            <Text style={styles.sourcesTitle}>Data Sources</Text>
          </View>
          <View style={styles.sourceItem}>
            <Ionicons name="cloud-done-outline" size={14} color="#71717A" />
            <Text style={styles.sourceText}>
              Weather: OpenWeatherMap & Open-Meteo
            </Text>
          </View>
          <View style={styles.sourceItem}>
            <Ionicons name="hardware-chip-outline" size={14} color="#71717A" />
            <Text style={styles.sourceText}>
              Intelligence: SkinSight ML + GPT-3.5
            </Text>
          </View>
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Informational only. Not a substitute for medical advice.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => setChatVisible(true)}
            style={styles.outlineButton}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#09090B"
            />
            <Text style={styles.outlineButtonText}>Ask GlowBot</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExport} style={styles.outlineButton}>
            <Ionicons name="share-outline" size={20} color="#09090B" />
            <Text style={styles.outlineButtonText}>Export Report</Text>
          </TouchableOpacity>
        </View>
        {fromHistory ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.secondaryButtonText}>Back to History</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.secondaryButton, isSaving && { opacity: 0.7 }]}
            onPress={handleSaveResult}
            disabled={isSaving}
          >
            <Text style={styles.secondaryButtonText}>
              {isSaving ? "Saving..." : "Save to History"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        context={viewModel.raw}
      />
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        title="Sign In Required"
        message="Please sign in to save your analysis results to history."
        onClose={() => setAlertVisible(false)}
        actions={[
          { text: "Sign In", onPress: () => navigation.navigate("Login") },
          { text: "Cancel", style: "cancel" },
        ]}
      />
      <CustomAlert
        visible={backAlertVisible}
        title={isGuest ? "Discard Result?" : "Unsaved Changes"}
        message={
          isGuest
            ? "You are in guest mode. Your results will be discarded if you go back."
            : "Your analysis hasn't been saved yet. Do you want to go back to Home?"
        }
        onClose={() => setBackAlertVisible(false)}
        type="warning"
        actions={[
          {
            text: "Go to Home",
            onPress: () => navigation.navigate("Home"),
            style: "destructive",
          },
          { text: "Cancel", style: "cancel" },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 12 : 32,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#09090B" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  heroCard: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  heroTop: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 13,
    color: "#71717A",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 44,
    fontWeight: "700",
    color: "#09090B",
    letterSpacing: -1.5,
    textTransform: "capitalize",
  },
  heroRiskContainer: { marginTop: 8 },
  heroRiskLabel: {
    fontSize: 12,
    color: "#71717A",
    fontWeight: "500",
    marginBottom: 4,
  },
  heroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  heroBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  heroInsight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    padding: 14,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  heroInsightText: { flex: 1, fontSize: 14, color: "#27272A", lineHeight: 20 },
  timingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  timingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  timingTitle: { fontSize: 14, fontWeight: "600", color: "#09090B" },
  timingCurrent: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    color: "#3F3F46",
  },
  timingRow: { flexDirection: "row", gap: 16 },
  timingCol: { flex: 1 },
  timingColTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#71717A",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  timingItem: {
    fontSize: 13,
    color: "#27272A",
    marginBottom: 6,
    lineHeight: 18,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  chartLabel: { width: 85, fontSize: 13, color: "#71717A" },
  chartLabelActive: { fontWeight: "600", color: "#09090B" },
  chartBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#F4F4F5",
    borderRadius: 4,
    overflow: "hidden",
  },
  chartBar: { height: "100%", borderRadius: 4 },
  chartValue: { width: 40, fontSize: 12, color: "#71717A", textAlign: "right" },
  chartValueActive: { fontWeight: "600", color: "#09090B" },
  weatherGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
  },
  weatherGridItem: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: "#F4F4F5",
  },
  weatherGridValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#09090B",
    marginTop: 4,
  },
  weatherGridLabel: { fontSize: 11, color: "#71717A", marginTop: 2 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
  },
  locationText: { fontSize: 13, color: "#71717A" },
  diseaseBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E4E7",
  },
  diseaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  diseaseTitle: { fontSize: 15, fontWeight: "600", color: "#09090B" },
  diseaseConfidence: { fontSize: 13, color: "#71717A", marginLeft: 28 },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 6,
    gap: 8,
    marginTop: 12,
  },
  warningText: { fontSize: 12, color: "#991B1B", flex: 1 },
  routineSubtitle: { fontSize: 13, color: "#71717A", marginBottom: 20 },
  routineSection: { marginBottom: 24 },
  routineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  routineTitle: { fontSize: 15, fontWeight: "600", color: "#09090B" },
  routineItem: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#E4E4E7",
  },
  routineStep: {
    fontSize: 14,
    fontWeight: "600",
    color: "#27272A",
    marginBottom: 4,
  },
  routineReason: { fontSize: 13, color: "#71717A", lineHeight: 18 },
  sourcesCard: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
    marginTop: 16,
  },
  sourcesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sourcesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71717A",
    textTransform: "uppercase",
  },
  sourceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sourceText: { fontSize: 12, color: "#71717A" },
  suggestionItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    paddingRight: 16,
  },
  suggestionText: { fontSize: 13, color: "#27272A", lineHeight: 20, flex: 1 },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FAFAFA",
    padding: 12,
    borderRadius: 6,
    gap: 8,
    marginTop: 8,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: "#71717A", lineHeight: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
    gap: 12,
  },
  actionRow: { flexDirection: "row", gap: 12 },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  outlineButtonText: { fontSize: 14, fontWeight: "500", color: "#09090B" },
  secondaryButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#09090B",
  },
  secondaryButtonText: { color: "#FFFFFF", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: { position: "absolute", top: 40, right: 20, zIndex: 10 },
  fullImage: { width: "100%", height: "80%" },
});

export { ResultsScreen };
