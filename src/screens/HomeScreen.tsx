import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "../types";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user, userData, signOut } = useAuth();

  const handleCameraPress = () => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Sign in to save your analysis history. You can still use the app without signing in, but your data won't be saved.",
        [
          {
            text: "Continue Without Sign In",
            onPress: () => navigation.navigate("Camera"),
          },
          { text: "Sign In", onPress: () => navigation.navigate("Login") },
        ]
      );
    } else {
      navigation.navigate("Camera");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        {user ? (
          <View style={styles.loggedInBar}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>
                  {userData?.fullName?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
              <Text style={styles.profileName}>
                {userData?.fullName || "User"}
              </Text>
            </TouchableOpacity>

            <View style={styles.iconRow}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("History")}
              >
                <Ionicons name="time-outline" size={22} color="#111827" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  Alert.alert("Sign Out", "Are you sure you want to log out?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Sign Out",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await signOut();
                          navigation.reset({
                            index: 0,
                            routes: [{ name: "Home" }],
                          });
                        } catch (error) {
                          console.log(error);
                          Alert.alert("Error", "Failed to sign out.");
                        }
                      },
                    },
                  ]);
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.authButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.authButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authButton, styles.signUpButton]}
              onPress={() => navigation.navigate("SignUp")}
            >
              <Text style={[styles.authButtonText, styles.signUpButtonText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>GlowScan</Text>
          <Text style={styles.subtitle}>
            Analyze your skin and get personalized recommendations based on
            environmental factors
          </Text>
          {!user && (
            <View style={styles.warningBanner}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#F59E0B"
              />
              <Text style={styles.warningText}>
                Sign in to save your analysis history
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Open Camera"
            onPress={handleCameraPress}
            style={styles.cameraButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Capture a selfie to analyze your skin condition
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loggedInBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarTextSmall: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  authButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  authButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  signUpButton: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  authButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  signUpButtonText: {
    color: "#FFFFFF",
  },
  historyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 64,
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#92400E",
    fontWeight: "500",
  },
  buttonContainer: {
    marginBottom: 32,
  },
  cameraButton: {
    paddingVertical: 20,
    borderRadius: 16,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
