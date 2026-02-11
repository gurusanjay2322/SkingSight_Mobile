  import React, { useEffect, useState } from 'react';
  import { NavigationContainer } from '@react-navigation/native';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { View, ActivityIndicator } from 'react-native';
  import { RootStackParamList } from '../types';
  import { HomeScreen } from '../screens/HomeScreen';
  import { CameraScreen } from '../screens/CameraScreen';
  import { PreviewScreen } from '../screens/PreviewScreen';
  import { ResultsScreen } from '../screens/ResultsScreen';
  import { HistoryScreen } from '../screens/HistoryScreen';
  import { DashboardScreen } from '../screens/DashboardScreen';
  import { LoginScreen } from '../screens/LoginScreen';
  import { SignUpScreen } from '../screens/SignUpScreen';
  import { ProfileScreen } from '../screens/ProfileScreen';
  import { OnboardingScreen } from '../screens/OnboardingScreen';

  const Stack = createNativeStackNavigator<RootStackParamList>();

  export const AppNavigator: React.FC = () => {
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
      AsyncStorage.getItem('hasLaunched').then((value) => {
        if (value === null) {
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      });
    }, []);

    if (isFirstLaunch === null) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      );
    }

    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isFirstLaunch ? "Onboarding" : "Home"}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Preview" component={PreviewScreen} />
          <Stack.Screen name="Results" component={ResultsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };


