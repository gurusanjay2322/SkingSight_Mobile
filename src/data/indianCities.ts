export interface City {
  label: string;
  value: string;
  lat: number;
  lon: number;
}

export const indianCities: City[] = [
  { label: "Chennai, Tamil Nadu", value: "Chennai", lat: 13.0827, lon: 80.2707 },
  { label: "Mumbai, Maharashtra", value: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { label: "Delhi, Delhi", value: "Delhi", lat: 28.7041, lon: 77.1025 },
  { label: "Bangalore, Karnataka", value: "Bangalore", lat: 12.9716, lon: 77.5946 },
  { label: "Hyderabad, Telangana", value: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  { label: "Kolkata, West Bengal", value: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { label: "Pune, Maharashtra", value: "Pune", lat: 18.5204, lon: 73.8567 },
  { label: "Ahmedabad, Gujarat", value: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { label: "Jaipur, Rajasthan", value: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { label: "Lucknow, Uttar Pradesh", value: "Lucknow", lat: 26.8467, lon: 80.9461 },
  { label: "Kanpur, Uttar Pradesh", value: "Kanpur", lat: 26.4499, lon: 80.3319 },
  { label: "Nagpur, Maharashtra", value: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { label: "Indore, Madhya Pradesh", value: "Indore", lat: 22.7196, lon: 75.8577 },
  { label: "Thane, Maharashtra", value: "Thane", lat: 19.2183, lon: 72.9781 },
  { label: "Bhopal, Madhya Pradesh", value: "Bhopal", lat: 23.2599, lon: 77.4126 },
  { label: "Visakhapatnam, Andhra Pradesh", value: "Visakhapatnam", lat: 17.6868, lon: 83.2185 },
  { label: "Surat, Gujarat", value: "Surat", lat: 21.1702, lon: 72.8311 },
  { label: "Patna, Bihar", value: "Patna", lat: 25.5941, lon: 85.1376 },
  { label: "Ludhiana, Punjab", value: "Ludhiana", lat: 30.9010, lon: 75.8573 },
  { label: "Agra, Uttar Pradesh", value: "Agra", lat: 27.1767, lon: 78.0081 },
  { label: "Nashik, Maharashtra", value: "Nashik", lat: 19.9975, lon: 73.7898 },
  { label: "Vadodara, Gujarat", value: "Vadodara", lat: 22.3072, lon: 73.1812 },
  { label: "Coimbatore, Tamil Nadu", value: "Coimbatore", lat: 11.0168, lon: 76.9558 },
  { label: "Madurai, Tamil Nadu", value: "Madurai", lat: 9.9252, lon: 78.1198 },
  { label: "Varanasi, Uttar Pradesh", value: "Varanasi", lat: 25.3176, lon: 82.9739 },
  { label: "Meerut, Uttar Pradesh", value: "Meerut", lat: 28.9845, lon: 77.7064 },
  { label: "Rajkot, Gujarat", value: "Rajkot", lat: 22.3039, lon: 70.8022 },
  { label: "Jamshedpur, Jharkhand", value: "Jamshedpur", lat: 22.8046, lon: 86.2029 },
  { label: "Srinagar, Jammu and Kashmir", value: "Srinagar", lat: 34.0837, lon: 74.7973 },
  { label: "Jabalpur, Madhya Pradesh", value: "Jabalpur", lat: 23.1815, lon: 79.9864 },
  { label: "Asansol, West Bengal", value: "Asansol", lat: 23.6739, lon: 86.9524 },
  { label: "Allahabad, Uttar Pradesh", value: "Allahabad", lat: 25.4358, lon: 81.8463 },
  { label: "Dhanbad, Jharkhand", value: "Dhanbad", lat: 23.7957, lon: 86.4304 },
  { label: "Amritsar, Punjab", value: "Amritsar", lat: 31.6340, lon: 74.8723 },
  { label: "Guwahati, Assam", value: "Guwahati", lat: 26.1158, lon: 91.7086 },
  { label: "Bhubaneswar, Odisha", value: "Bhubaneswar", lat: 20.2961, lon: 85.8245 },
  { label: "Chandigarh, Chandigarh", value: "Chandigarh", lat: 30.7333, lon: 76.7794 }
].sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
