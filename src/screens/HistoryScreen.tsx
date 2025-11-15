import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
    const fetched = await resultService.getUserResults(user.uid);
    setResults(fetched);
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

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("Results", {
            data: item,
            imageUri: item.imageUrl,
            fromHistory: true,
          })
        }
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title}>
            {item?.predictedClass
              ? item.predictedClass.charAt(0).toUpperCase() +
                item.predictedClass.slice(1)
              : "Unknown"}
          </Text>

          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          <View style={[styles.badge, { backgroundColor: riskColor }]}>
            <Text style={styles.badgeText}>{item.riskLevel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Results</Text>
        <View style={{ width: 24 }} />
      </View>

      {results.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={60} color="#D1D5DB" />
          <Text style={styles.emptyText}>No results yet</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 16 }}
        />
      )}
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
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: { width: 100, height: 100 },
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1, padding: 12, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "600", color: "#111827" },
  date: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#6B7280", marginTop: 12 },
});
