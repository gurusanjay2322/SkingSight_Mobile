import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { SkinResult } from "../types";



export interface DashboardStats {
  totalScans: number;
  mostCommonCondition: string;
  averageConfidence: number;
  lastAnalyzedDate: Date | null;
  riskDistribution: {
    Low: number;
    Moderate: number;
    High: number;
    'Very High': number;
  };
  conditionDistribution: Record<string, number>;
  environmentalInsights: {
    avgAqiByCondition: Record<string, number>;
    avgUvByRiskLevel: Record<string, number>;
  };
  trendData: {
    date: Date;
    condition: string;
    confidence: number;
    riskLevel: string;
  }[];
}

export const resultService = {
  async saveResult(result: any) {
    try {
      // 🔹 Remove undefined fields (Firestore hates them)
      const cleanResult = Object.fromEntries(
        Object.entries(result).filter(([_, v]) => v !== undefined && v !== null)
      );

      console.log("💾 Saving result to Firestore...", cleanResult);

      const docRef = await addDoc(collection(db, "results"), {
        ...cleanResult,
        timestamp: serverTimestamp(), // Use consistent naming 'timestamp'
        createdAt: serverTimestamp(),
      });

      console.log("✅ Result saved successfully with ID:", docRef.id);
      return docRef;
    } catch (error) {
      console.error("❌ Failed to save result:", error);
      throw error;
    }
  },

  getUserResults: async (uid: string) => {
    try {
      const resultsRef = collection(db, "results");
      const q = query(
        resultsRef,
        where("uid", "==", uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("📦 Fetched user results:", results.length);
      return results;
    } catch (error) {
      console.error("❌ Failed to fetch results:", error);
      return [];
    }
  },

  /**
   * Get results from the last N days for dashboard analytics
   * Default to 365 days to show most historical data
   */
  getResultsForDashboard: async (uid: string, days: number = 365) => {
    try {
      console.log("📊 Dashboard: Fetching results for uid:", uid);
      const resultsRef = collection(db, "results");
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Simple query first - just filter by uid (avoids index requirement)
      const q = query(
        resultsRef,
        where("uid", "==", uid)
      );

      const snapshot = await getDocs(q);
      console.log("📊 Dashboard: Raw snapshot size:", snapshot.size);
      
      // Sort in JS instead of Firestore (more reliable), include all results
      const results = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

      console.log(`📊 Dashboard: Fetched ${results.length} results for dashboard`);
      return results;
    } catch (error) {
      console.error("❌ Dashboard: Failed to fetch results:", error);
      return [];
    }
  },

  /**
   * Calculate statistics for the dashboard
   */
  getDashboardStats: (results: any[]): DashboardStats => {
    const emptyStats: DashboardStats = {
      totalScans: 0,
      mostCommonCondition: "N/A",
      averageConfidence: 0,
      lastAnalyzedDate: null,
      riskDistribution: { Low: 0, Moderate: 0, High: 0, 'Very High': 0 },
      conditionDistribution: {},
      environmentalInsights: {
        avgAqiByCondition: {},
        avgUvByRiskLevel: {},
      },
      trendData: [],
    };

    if (!results || results.length === 0) {
      return emptyStats;
    }

    // Calculate condition distribution
    const conditionCounts: Record<string, number> = {};
    const riskCounts: Record<string, number> = { Low: 0, Moderate: 0, High: 0, 'Very High': 0 };
    
    // For environmental insights
    const aqiByCondition: Record<string, number[]> = {};
    const uvByRiskLevel: Record<string, number[]> = {};
    
    let totalConfidence = 0;
    const trendData: DashboardStats['trendData'] = [];

    results.forEach((result: any) => {
      const condition = result.predictedClass || 'Unknown';
      const riskLevel = result.riskLevel || 'Low';
      const confidence = result.confidence || 0;
      const weather = result.weather || {};
      
      // Count conditions
      conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      
      // Count risk levels
      if (riskCounts.hasOwnProperty(riskLevel)) {
        riskCounts[riskLevel]++;
      }
      
      // Sum confidence
      totalConfidence += confidence;
      
      // Track AQI by condition
      if (weather.aqi !== undefined) {
        if (!aqiByCondition[condition]) aqiByCondition[condition] = [];
        aqiByCondition[condition].push(weather.aqi);
      }
      
      // Track UV by risk level
      if (weather.uv_index !== undefined) {
        if (!uvByRiskLevel[riskLevel]) uvByRiskLevel[riskLevel] = [];
        uvByRiskLevel[riskLevel].push(weather.uv_index);
      }
      
      // Build trend data
      if (result.createdAt) {
        const date = result.createdAt.toDate ? result.createdAt.toDate() : new Date(result.createdAt);
        trendData.push({
          date,
          condition,
          confidence,
          riskLevel,
        });
      }
    });

    // Find most common condition
    const mostCommonCondition = Object.entries(conditionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    // Calculate average AQI by condition
    const avgAqiByCondition: Record<string, number> = {};
    Object.entries(aqiByCondition).forEach(([condition, values]) => {
      avgAqiByCondition[condition] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    });

    // Calculate average UV by risk level
    const avgUvByRiskLevel: Record<string, number> = {};
    Object.entries(uvByRiskLevel).forEach(([risk, values]) => {
      avgUvByRiskLevel[risk] = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
    });

    // Get last analyzed date
    const lastResult = results[0];
    const lastAnalyzedDate = lastResult?.createdAt 
      ? (lastResult.createdAt.toDate ? lastResult.createdAt.toDate() : new Date(lastResult.createdAt))
      : null;

    return {
      totalScans: results.length,
      mostCommonCondition,
      averageConfidence: Number((totalConfidence / results.length).toFixed(2)),
      lastAnalyzedDate,
      riskDistribution: riskCounts as DashboardStats['riskDistribution'],
      conditionDistribution: conditionCounts,
      environmentalInsights: {
        avgAqiByCondition,
        avgUvByRiskLevel,
      },
      trendData: trendData.sort((a, b) => a.date.getTime() - b.date.getTime()),
    };
  },
};


