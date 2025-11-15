import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export interface UserData {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: number;
}

export interface SignUpData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

class AuthService {
  // 🔐 Sign up new user and store data in Firestore
  async signUp(data: SignUpData): Promise<User> {
    try {
      console.log("Starting sign up process...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;
      console.log("User created:", user.uid);

      // Optional: update display name in Firebase Auth profile
      try {
        await updateProfile(user, { displayName: data.fullName });
        console.log("Profile updated");
      } catch (profileError) {
        console.warn("Profile update error (non-critical):", profileError);
      }

      // Prepare Firestore data
      const userData: UserData = {
        uid: user.uid,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        createdAt: Date.now(),
      };

      // Save to Firestore with timeout guard
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Firestore operation timed out")),
            10000
          )
        );

        await Promise.race([
          setDoc(doc(db, "users", user.uid), userData),
          timeoutPromise,
        ]);
        console.log("User data saved to Firestore ✅");
      } catch (firestoreError: any) {
        console.error("Firestore save error:", firestoreError);
        const errorMessage =
          firestoreError.code === "permission-denied"
            ? "Permission denied. Please check Firestore rules."
            : firestoreError.message === "Firestore operation timed out"
            ? "Operation timed out. Please check your internet."
            : "Failed to save user data. Please try again.";
        throw new Error(errorMessage);
      }

      return user;
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw new Error(
        error.message || "Failed to create account. Please try again."
      );
    }
  }

  // 🧩 Fetch user data (auto-create missing record if not found)
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }

      // Handle missing document by auto-creating it
      const user = auth.currentUser;
      if (user) {
        const fallbackData: UserData = {
          uid: user.uid,
          fullName: user.displayName || "User",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          createdAt: Date.now(),
        };
        await setDoc(doc(db, "users", uid), fallbackData);
        console.log("Created missing Firestore entry for user");
        return fallbackData;
      }

      return null;
    } catch (error: any) {
      console.error("Get user data error:", error);
      throw error;
    }
  }

  // 🚪 Sign in existing user
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  // 🚫 Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  // 👂 Listen for auth changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }

  // 👤 Get current user synchronously
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

export const authService = new AuthService();
