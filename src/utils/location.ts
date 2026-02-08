import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export const locationService = {
  async getCurrentLocation(): Promise<LocationData> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Check and wait for services to be enabled (resolves android race condition)
      let serviceEnabled = await Location.hasServicesEnabledAsync();
      
      if (!serviceEnabled) {
        try {
            // This triggers the specific Android dialog to turn on location
            await Location.enableNetworkProviderAsync();
            serviceEnabled = true; // If promise resolves, user likely accepted
        } catch (e) {
            console.log("User rejected location enable request or not supported");
        }
      
        if (!serviceEnabled) {
             // Double check with polling if the above didn't immediately update state
            for (let i = 0; i < 5; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                serviceEnabled = await Location.hasServicesEnabledAsync();
                if (serviceEnabled) break;
            }
        }
      }

      if (!serviceEnabled) {
         throw new Error('Location services are disabled. Please enable them and try again.');
      }

      // Get current position with a slight retry on failure
      // (Sometimes getting position immediately after enabling service fails)
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
             accuracy: Location.Accuracy.Balanced,
        });
      } catch (err) {
         console.warn("First location attempt failed, retrying...", err);
         await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
         location = await Location.getCurrentPositionAsync({
             accuracy: Location.Accuracy.Balanced,
        });
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  },
  async getGeocodedLocation(address: string): Promise<LocationData> {
    try {
      const geocoded = await Location.geocodeAsync(address);
      if (geocoded.length === 0) {
        throw new Error('Address not found');
      }
      return {
        latitude: geocoded[0].latitude,
        longitude: geocoded[0].longitude,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  },
};

