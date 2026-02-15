import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={48} color="#18181B" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasData = stats && stats.totalScans > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#09090B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Insights</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#18181B" />
        }
      >
        {!hasData ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color="#E4E4E7" />
            <Text style={styles.emptyTitle}>Insights Pending</Text>
            <Text style={styles.emptySubtitle}>
              Your progress visualizations will appear here after your first analysis.
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate("Camera")}
            >
              <Text style={styles.startButtonText}>Initial Scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="scan-outline" size={18} color="#71717A" />
                <Text style={styles.summaryValue}>{stats.totalScans}</Text>
                <Text style={styles.summaryLabel}>Scans</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Ionicons 
                  name="flask-outline" 
                  size={18} 
                  color="#71717A" 
                />
                <Text style={styles.summaryValue}>
                  {capitalizeFirst(stats.mostCommonCondition)}
                </Text>
                <Text style={styles.summaryLabel}>Pattern</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <Ionicons name="time-outline" size={18} color="#71717A" />
                <Text style={[styles.summaryValue, { fontSize: 13 }]}>
                  {formatDate(stats.lastAnalyzedDate)}
                </Text>
                <Text style={styles.summaryLabel}>Latest</Text>
              </View>
            </View>

            {/* Risk Distribution */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Risk Profile</Text>
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
              <Text style={styles.sectionTitle}>Identified Conditions</Text>
              <View style={styles.conditionGrid}>
                {Object.entries(stats.conditionDistribution).map(([condition, count]) => (
                  <View 
                    key={condition} 
                    style={styles.conditionChip}
                  >
                    <Text style={styles.conditionText}>
                      {capitalizeFirst(condition)}
                    </Text>
                    <View 
                      style={[
                        styles.conditionCount,
                        { backgroundColor: CONDITION_COLORS[condition.toLowerCase()] || "#18181B" }
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
                <Text style={styles.sectionTitle}>Context Correlation</Text>
                
                {/* AQI by Condition */}
                <Text style={styles.insightSubtitle}>Avg. AQI exposure</Text>
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
                    <Text style={[styles.insightSubtitle, { marginTop: 24 }]}>Avg. UV intensity</Text>
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
              <Text style={styles.sectionTitle}>System Confidence</Text>
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceCircle}>
                  <Text style={styles.confidenceValue}>
                    {Math.round(stats.averageConfidence * 100)}%
                  </Text>
                </View>
                <Text style={styles.confidenceLabel}>
                  Avg. Analysis Reliability
                </Text>
                <Text style={styles.confidenceHint}>
                  Based on recent scan clarity and model correlation.
                </Text>
              </View>
            </View>

            {/* Recent Trend */}
            {stats.trendData.length > 1 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Activity Log</Text>
                <View style={styles.timeline}>
                  {stats.trendData.slice(-5).reverse().map((item, index) => (
                    <View key={index} style={styles.timelineItem}>
                      <View 
                        style={[
                          styles.timelineDot,
                          { backgroundColor: CONDITION_COLORS[item.condition.toLowerCase()] || "#18181B" }
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#09090B" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: { fontSize: 14, color: "#71717A", fontWeight: "500" },
  
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#09090B", marginTop: 16, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 14, color: "#71717A", textAlign: "center", marginTop: 8, paddingHorizontal: 32, lineHeight: 20 },
  startButton: {
    backgroundColor: "#18181B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  startButtonText: { color: "#FFF", fontWeight: "600", fontSize: 15 },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#09090B", marginTop: 12, letterSpacing: -0.5 },
  summaryLabel: { fontSize: 11, color: "#71717A", marginTop: 4, fontWeight: "500", textTransform: "uppercase" },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#09090B",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  riskDistribution: { gap: 16 },
  riskItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  riskLabelRow: { flexDirection: "row", alignItems: "center", width: 80, gap: 8 },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  riskLabel: { fontSize: 13, color: "#27272A", flex: 1, fontWeight: "500" },
  riskCount: { fontSize: 12, color: "#71717A", width: 20 },
  riskBarContainer: { flex: 1, height: 6, backgroundColor: "#F4F4F5", borderRadius: 3, overflow: "hidden" },
  riskBar: { height: 6, borderRadius: 3 },
  riskPercent: { fontSize: 12, color: "#71717A", width: 35, textAlign: "right", fontWeight: "500" },

  conditionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  conditionChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 6,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8,
    gap: 10,
    backgroundColor: "#FAFAFA",
    borderColor: "#E4E4E7",
  },
  conditionText: { fontSize: 13, fontWeight: "600", color: "#27272A" },
  conditionCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  conditionCountText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

  insightSubtitle: { fontSize: 12, color: "#71717A", marginBottom: 12, fontWeight: "500", textTransform: "uppercase" },
  insightGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  insightItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  insightCondition: { fontSize: 13, color: "#3F3F46" },
  insightValueBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  insightValueText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

  confidenceContainer: { alignItems: "center", paddingVertical: 8 },
  confidenceCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  confidenceValue: { fontSize: 32, fontWeight: "700", color: "#09090B", letterSpacing: -1 },
  confidenceLabel: { fontSize: 15, fontWeight: "600", color: "#09090B", marginTop: 16 },
  confidenceHint: { fontSize: 13, color: "#71717A", marginTop: 4, textAlign: "center" },

  timeline: { gap: 16 },
  timelineItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12,
    paddingVertical: 8,
  },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineContent: { flex: 1 },
  timelineCondition: { fontSize: 14, fontWeight: "600", color: "#09090B" },
  timelineDate: { fontSize: 12, color: "#71717A", marginTop: 2 },
  timelineRisk: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  timelineRiskText: { color: "#FFF", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
});
