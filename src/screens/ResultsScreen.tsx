import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { InfoCard } from '../components/InfoCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { RootStackParamList } from '../types';
import {
  getAQIColor,
  getAQILabel,
  getRiskColor,
  getUVIndexColor,
  getUVIndexLabel,
} from '../utils/colors';

type ResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface Props {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

const getSkinTypeIcon = (predictedClass: string) => {
  switch (predictedClass.toLowerCase()) {
    case 'acne':
      return <Ionicons name="medical" size={24} color="#EF4444" />;
    case 'dry':
      return <Ionicons name="water-outline" size={24} color="#3B82F6" />;
    case 'oily':
      return <Ionicons name="flash" size={24} color="#F59E0B" />;
    case 'normal':
      return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
    default:
      return <Ionicons name="body" size={24} color="#6366F1" />;
  }
};

export const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { data } = route.params;
  const riskColor = getRiskColor(data.risk_level);
  const uvColor = getUVIndexColor(data.weather.uv_index);
  const aqiColor = getAQIColor(data.weather.aqi);

  const confidencePercentage = Math.round(data.confidence * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
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
        {/* Risk Level Card */}
        <View style={[styles.riskCard, { borderColor: riskColor }]}>
          <View style={styles.riskHeader}>
            <Text style={styles.riskLabel}>Risk Level</Text>
            <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={styles.riskBadgeText}>{data.risk_level}</Text>
            </View>
          </View>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={[styles.confidenceValue, { color: riskColor }]}>
              {confidencePercentage}%
            </Text>
          </View>
        </View>

        {/* Skin Type */}
        <InfoCard
          title="Skin Condition"
          value={data.predicted_class.charAt(0).toUpperCase() + data.predicted_class.slice(1)}
          icon={getSkinTypeIcon(data.predicted_class)}
          color={riskColor}
        />

        {/* UV Index */}
        <InfoCard
          title="UV Index"
          value={data.weather.uv_index.toFixed(1)}
          subtitle={getUVIndexLabel(data.weather.uv_index)}
          color={uvColor}
          icon={<Ionicons name="sunny" size={24} color={uvColor} />}
        />

        {/* AQI */}
        <InfoCard
          title="Air Quality Index"
          value={data.weather.aqi}
          subtitle={getAQILabel(data.weather.aqi)}
          color={aqiColor}
          icon={<Ionicons name="cloud" size={24} color={aqiColor} />}
        />

        {/* Weather Info */}
        <View style={styles.weatherCard}>
          <Text style={styles.weatherCardTitle}>Weather Information</Text>
          
          {/* City Location */}
          <View style={styles.weatherItem}>
            <Ionicons name="location" size={20} color="#6B7280" />
            <Text style={styles.weatherItemText}>{data.weather.city}</Text>
          </View>
          
          {/* Temperature */}
          <View style={styles.weatherItem}>
            <Ionicons name="thermometer" size={20} color="#6B7280" />
            <Text style={styles.weatherItemText}>
              {data.weather.temp_min.toFixed(1)}°C - {data.weather.temp_max.toFixed(1)}°C
            </Text>
          </View>
          
          {/* Dominant Pollutant */}
          <View style={styles.weatherItem}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.weatherItemText}>
              Dominant Pollutant: {data.weather.dominant_pollutant.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Recommendations */}
        {data.rule_based_suggestions.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.recommendationsTitle}>Recommendations</Text>
            {data.rule_based_suggestions.map((suggestion, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.recommendationText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* GenAI Suggestions */}
        {data.genai_suggestions && data.genai_suggestions.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.recommendationsTitle}>AI Suggestions</Text>
            {data.genai_suggestions.map((suggestion, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="sparkles" size={20} color="#6366F1" />
                <Text style={styles.recommendationText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="New Analysis"
          onPress={() => navigation.navigate('Home')}
          style={styles.footerButton}
        />
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Ionicons name="time-outline" size={20} color="#6366F1" />
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  riskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  confidenceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  confidenceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 4,
  },
  weatherItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    marginBottom: 12,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
});

