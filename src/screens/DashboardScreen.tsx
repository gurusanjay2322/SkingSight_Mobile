import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { DashboardStats, resultService } from "../services/resultService";
import { RootStackParamList } from "../types";
import { getAQIColor, getRiskColor, getUVIndexColor } from "../utils/colors";

type DashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Dashboard"
>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

// Color mapping for skin conditions
const CONDITION_COLORS: Record<string, string> = {
  acne: "#EF4444",
  burned: "#F97316",
  dry: "#3B82F6",
  normal: "#10B981",
  oily: "#F59E0B",
};

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      const results = await resultService.getResultsForDashboard(user.uid, 30);
      const dashboardStats = resultService.getDashboardStats(results);
      setStats(dashboardStats);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={48} color="#6366F1" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasData = stats && stats.totalScans > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!hasData ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete some skin analyses to see your progress trends here.
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate("Camera")}
            >
              <Text style={styles.startButtonText}>Start Analysis</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="scan-outline" size={24} color="#6366F1" />
                <Text style={styles.summaryValue}>{stats.totalScans}</Text>
                <Text style={styles.summaryLabel}>Total Scans</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Ionicons 
                  name="body-outline" 
                  size={24} 
                  color={CONDITION_COLORS[stats.mostCommonCondition.toLowerCase()] || "#6366F1"} 
                />
                <Text style={styles.summaryValue}>
                  {capitalizeFirst(stats.mostCommonCondition)}
                </Text>
                <Text style={styles.summaryLabel}>Most Common</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Ionicons name="calendar-outline" size={24} color="#10B981" />
                <Text style={[styles.summaryValue, { fontSize: 14 }]}>
                  {formatDate(stats.lastAnalyzedDate)}
                </Text>
                <Text style={styles.summaryLabel}>Last Scan</Text>
              </View>
            </View>

            {/* Risk Distribution */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Risk Level Distribution</Text>
              <View style={styles.riskDistribution}>
                {Object.entries(stats.riskDistribution).map(([level, count]) => {
                  if (count === 0) return null;
                  const percentage = Math.round((count / stats.totalScans) * 100);
                  return (
                    <View key={level} style={styles.riskItem}>
                      <View style={styles.riskLabelRow}>
                        <View 
                          style={[
                            styles.riskDot, 
                            { backgroundColor: getRiskColor(level) }
                          ]} 
                        />
                        <Text style={styles.riskLabel}>{level}</Text>
                        <Text style={styles.riskCount}>{count}</Text>
                      </View>
                      <View style={styles.riskBarContainer}>
                        <View 
                          style={[
                            styles.riskBar, 
                            { 
                              width: `${percentage}%`,
                              backgroundColor: getRiskColor(level) 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.riskPercent}>{percentage}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Condition Distribution */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Skin Conditions Detected</Text>
              <View style={styles.conditionGrid}>
                {Object.entries(stats.conditionDistribution).map(([condition, count]) => (
                  <View 
                    key={condition} 
                    style={[
                      styles.conditionChip,
                      { borderColor: CONDITION_COLORS[condition.toLowerCase()] || "#6366F1" }
                    ]}
                  >
                    <Text 
                      style={[
                        styles.conditionText,
                        { color: CONDITION_COLORS[condition.toLowerCase()] || "#6366F1" }
                      ]}
                    >
                      {capitalizeFirst(condition)}
                    </Text>
                    <View 
                      style={[
                        styles.conditionCount,
                        { backgroundColor: CONDITION_COLORS[condition.toLowerCase()] || "#6366F1" }
                      ]}
                    >
                      <Text style={styles.conditionCountText}>{count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Environmental Insights */}
            {Object.keys(stats.environmentalInsights.avgAqiByCondition).length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Environmental Insights</Text>
                
                {/* AQI by Condition */}
                <Text style={styles.insightSubtitle}>
                  <Ionicons name="cloud" size={14} color="#6B7280" /> Average AQI by Condition
                </Text>
                <View style={styles.insightGrid}>
                  {Object.entries(stats.environmentalInsights.avgAqiByCondition).map(([condition, aqi]) => (
                    <View key={condition} style={styles.insightItem}>
                      <Text style={styles.insightCondition}>{capitalizeFirst(condition)}</Text>
                      <View style={[styles.insightValueBadge, { backgroundColor: getAQIColor(aqi) }]}>
                        <Text style={styles.insightValueText}>{aqi}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* UV by Risk Level */}
                {Object.keys(stats.environmentalInsights.avgUvByRiskLevel).length > 0 && (
                  <>
                    <Text style={[styles.insightSubtitle, { marginTop: 16 }]}>
                      <Ionicons name="sunny" size={14} color="#6B7280" /> Average UV Index by Risk
                    </Text>
                    <View style={styles.insightGrid}>
                      {Object.entries(stats.environmentalInsights.avgUvByRiskLevel).map(([risk, uv]) => (
                        <View key={risk} style={styles.insightItem}>
                          <Text style={styles.insightCondition}>{risk}</Text>
                          <View style={[styles.insightValueBadge, { backgroundColor: getUVIndexColor(uv) }]}>
                            <Text style={styles.insightValueText}>{uv}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Average Confidence */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Analysis Accuracy</Text>
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceCircle}>
                  <Text style={styles.confidenceValue}>
                    {Math.round(stats.averageConfidence * 100)}%
                  </Text>
                </View>
                <Text style={styles.confidenceLabel}>
                  Average Confidence Score
                </Text>
                <Text style={styles.confidenceHint}>
                  Higher scores indicate more reliable predictions
                </Text>
              </View>
            </View>

            {/* Recent Trend */}
            {stats.trendData.length > 1 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.timeline}>
                  {stats.trendData.slice(-5).reverse().map((item, index) => (
                    <View key={index} style={styles.timelineItem}>
                      <View 
                        style={[
                          styles.timelineDot,
                          { backgroundColor: CONDITION_COLORS[item.condition.toLowerCase()] || "#6366F1" }
                        ]} 
                      />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineCondition}>
                          {capitalizeFirst(item.condition)}
                        </Text>
                        <Text style={styles.timelineDate}>
                          {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Text>
                      </View>
                      <View style={[styles.timelineRisk, { backgroundColor: getRiskColor(item.riskLevel) }]}>
                        <Text style={styles.timelineRiskText}>{item.riskLevel}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { fontSize: 16, color: "#6B7280" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 8, paddingHorizontal: 32 },
  startButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  startButtonText: { color: "#FFF", fontWeight: "600", fontSize: 16 },

  // Summary Cards
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 8 },
  summaryLabel: { fontSize: 11, color: "#6B7280", marginTop: 4, textAlign: "center" },

  // Section Cards
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  // Risk Distribution
  riskDistribution: { gap: 12 },
  riskItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  riskLabelRow: { flexDirection: "row", alignItems: "center", width: 100, gap: 6 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  riskLabel: { fontSize: 12, color: "#374151", flex: 1 },
  riskCount: { fontSize: 12, color: "#6B7280", width: 20 },
  riskBarContainer: { flex: 1, height: 8, backgroundColor: "#F3F4F6", borderRadius: 4 },
  riskBar: { height: 8, borderRadius: 4 },
  riskPercent: { fontSize: 12, color: "#6B7280", width: 35, textAlign: "right" },

  // Condition Distribution
  conditionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  conditionChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    gap: 8,
  },
  conditionText: { fontSize: 13, fontWeight: "600" },
  conditionCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  conditionCountText: { color: "#FFF", fontSize: 12, fontWeight: "700" },

  // Environmental Insights
  insightSubtitle: { fontSize: 13, color: "#6B7280", marginBottom: 8 },
  insightGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  insightItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  insightCondition: { fontSize: 12, color: "#374151" },
  insightValueBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  insightValueText: { color: "#FFF", fontSize: 11, fontWeight: "600" },

  // Confidence
  confidenceContainer: { alignItems: "center", paddingVertical: 8 },
  confidenceCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#6366F1",
  },
  confidenceValue: { fontSize: 28, fontWeight: "700", color: "#6366F1" },
  confidenceLabel: { fontSize: 14, fontWeight: "600", color: "#111827", marginTop: 12 },
  confidenceHint: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  // Timeline
  timeline: { gap: 12 },
  timelineItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineContent: { flex: 1 },
  timelineCondition: { fontSize: 14, fontWeight: "600", color: "#111827" },
  timelineDate: { fontSize: 12, color: "#6B7280" },
  timelineRisk: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timelineRiskText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
});
