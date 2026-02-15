import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "../types";
import { getRiskColor } from "../utils/colors";
import { resultService } from "../services/resultService";

type HistoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "History"
>;

interface Props {
  navigation: HistoryScreenNavigationProp;
}

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadResults = async () => {
    if (!user) return;
    try {
      const fetched = await resultService.getUserResults(user.uid);
      setResults(fetched);
    } catch (error) {
      console.error("HistoryScreen: Error fetching results", error);
    }
  };

  useEffect(() => {
    loadResults();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const renderItem = ({ item }: { item: any }) => {
    const riskColor = getRiskColor(item.riskLevel);
    const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
    const formattedDate = date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => navigation.navigate("Results", { data: item, fromHistory: true })}
      >
        <View style={styles.imageThumbnail}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbnailImage}
              onError={(e) => console.log(`Image load error for ${item.id}:`, e.nativeEvent.error)}
            />
          ) : (
            <Ionicons name="image-outline" size={24} color="#A1A1AA" />
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.skinType}>{item.predictedClass}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="analytics-outline" size={14} color="#A1A1AA" />
              <Text style={styles.statText}>{Math.round(item.confidence * 100)}% Match</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskBadgeText}>{item.riskLevel}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#E4E4E7" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Track your skin health over time</Text>
      </View>

      {results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#E4E4E7" />
          <Text style={styles.emptyTitle}>No analyzes yet</Text>
          <Text style={styles.emptySubtitle}>
            Your saved skin scans and AI insights will appear here once you take your first scan.
          </Text>
          <View style={styles.emptyButton}>
            <PrimaryButton
              title="Start New Analysis"
              onPress={() => navigation.navigate("Home")}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#09090B" />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  title: { fontSize: 32, fontWeight: "700", color: "#09090B", letterSpacing: -1 },
  subtitle: { fontSize: 14, color: "#71717A", marginTop: 4 },
  listContent: { padding: 16 },
  
  // Card
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  imageThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#F4F4F5",
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  skinType: { fontSize: 16, fontWeight: "600", color: "#09090B" },
  dateText: { fontSize: 12, color: "#A1A1AA" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: "#71717A" },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  riskBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF", textTransform: "uppercase" },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#09090B", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#71717A", textAlign: "center", marginTop: 8, lineHeight: 20 },
  emptyButton: { marginTop: 24, width: "100%" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#71717A", fontSize: 14 },
});
