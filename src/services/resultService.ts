import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";

export interface SkinResult {
  uid: string;
  predictedClass: string;
  confidence: number;
  weather: any;
  riskLevel: string;
  suggestions: string[];
  imageUrl?: string;
  createdAt?: any;
}

export const resultService = {
  async saveResult(result: Omit<SkinResult, "createdAt">) {
    try {
      // 🔹 Remove undefined fields (Firestore hates them)
      const cleanResult = Object.fromEntries(
        Object.entries(result).filter(([_, v]) => v !== undefined)
      );

      await addDoc(collection(db, "results"), {
        ...cleanResult,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Result saved successfully");
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
};

