import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { HistoryItem } from '../types';

const HISTORY_KEY = '@glowscan_history';

export const storageService = {
  async saveHistoryItem(item: HistoryItem, userId?: string): Promise<void> {
    try {
      if (userId) {
        // Save to Firestore if user is logged in
        await addDoc(collection(db, 'users', userId, 'history'), {
          ...item,
          createdAt: Date.now(),
        });
      } else {
        // Save to AsyncStorage if user is not logged in
        const history = await this.getHistory(undefined);
        const updatedHistory = [item, ...history];
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.error('Error saving history item:', error);
      throw error;
    }
  },

  async getHistory(userId?: string): Promise<HistoryItem[]> {
    try {
      if (userId) {
        // Get from Firestore if user is logged in
        const historyRef = collection(db, 'users', userId, 'history');
        const q = query(historyRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const history: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
          history.push(doc.data() as HistoryItem);
        });
        return history;
      } else {
        // Get from AsyncStorage if user is not logged in
        const data = await AsyncStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  },

  async clearHistory(userId?: string): Promise<void> {
    try {
      if (userId) {
        // Clear from Firestore if user is logged in
        const history = await this.getHistory(userId);
        const batch = history.map((item) => {
          // We need to get the document ID to delete it
          // For now, we'll get all docs and delete them
          return null;
        });
        // Get all documents and delete them
        const historyRef = collection(db, 'users', userId, 'history');
        const querySnapshot = await getDocs(historyRef);
        const deletePromises = querySnapshot.docs.map((docSnapshot) =>
          deleteDoc(doc(db, 'users', userId, 'history', docSnapshot.id))
        );
        await Promise.all(deletePromises);
      } else {
        // Clear from AsyncStorage if user is not logged in
        await AsyncStorage.removeItem(HISTORY_KEY);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  },

  async deleteHistoryItem(id: string, userId?: string): Promise<void> {
    try {
      if (userId) {
        // Delete from Firestore if user is logged in
        // We need to find the document with this id
        const historyRef = collection(db, 'users', userId, 'history');
        const q = query(historyRef, where('id', '==', id));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map((docSnapshot) =>
          deleteDoc(doc(db, 'users', userId, 'history', docSnapshot.id))
        );
        await Promise.all(deletePromises);
      } else {
        // Delete from AsyncStorage if user is not logged in
        const history = await this.getHistory(undefined);
        const updatedHistory = history.filter(item => item.id !== id);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.error('Error deleting history item:', error);
      throw error;
    }
  },
};

