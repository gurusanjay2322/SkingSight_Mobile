import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomAlert } from "../components/CustomAlert";
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
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    actions: any[];
  }>({
    title: '',
    message: '',
    type: 'info',
    actions: [],
  });

  const handleCameraPress = () => {
    if (!user) {
      setAlertConfig({
        title: "Sign In Required",
        message: "Sign in to save your analysis history. You can still use the app without signing in, but your data won't be saved.",
        type: 'info',
        actions: [
          {
            text: "Continue Without Sign In",
            onPress: () => navigation.navigate("Camera"),
          },
          { text: "Sign In", onPress: () => navigation.navigate("Login") },
        ],
      });
      setAlertVisible(true);
    } else {
      navigation.navigate("Camera");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
                onPress={() => navigation.navigate("Dashboard")}
              >
                <Ionicons name="analytics-outline" size={20} color="#09090B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("History")}
              >
                <Ionicons name="time-outline" size={20} color="#09090B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setAlertConfig({
                    title: 'Sign Out',
                    message: 'Are you sure you want to log out of your account?',
                    type: 'warning',
                    actions: [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Sign Out',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await signOut();
                            navigation.reset({
                              index: 0,
                              routes: [{ name: "Home" }],
                            });
                          } catch (error) {
                            setAlertConfig({
                              title: 'Error',
                              message: 'Failed to sign out. Please try again.',
                              type: 'error',
                              actions: [{ text: 'OK' }],
                            });
                            setAlertVisible(true);
                          }
                        },
                      },
                    ],
                  });
                  setAlertVisible(true);
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
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
          <Text style={styles.title}>Skin Sight</Text>
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
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E4E4E7",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 48,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#18181B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarTextSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#09090B",
  },
  authButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  authButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    backgroundColor: "#FFFFFF",
  },
  signUpButton: {
    backgroundColor: "#18181B",
    borderColor: "#18181B",
  },
  authButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#09090B",
  },
  signUpButtonText: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 48,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#09090B",
    marginBottom: 12,
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 16,
    color: "#71717A",
    textAlign: "left",
    lineHeight: 24,
    marginBottom: 24,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    gap: 10,
  },
  warningText: {
    fontSize: 13,
    color: "#71717A",
    fontWeight: "400",
  },
  buttonContainer: {
    marginBottom: 40,
  },
  cameraButton: {
    // Styling is handled by PrimaryButton
  },
  footer: {
    alignItems: "flex-start",
  },
  footerText: {
    fontSize: 13,
    color: "#A1A1AA",
    lineHeight: 20,
  },
});
