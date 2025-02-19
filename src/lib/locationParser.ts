type ParsedLocation = {
  city?: string;
  country?: string;
  lat: number;
  lng: number;
};

// Predefined coordinates for major tech hubs as fallbacks
const techHubCoordinates: Record<string, [number, number]> = {
  'San Francisco': [37.7749, -122.4194],
  'New York': [40.7128, -74.0060],
  'London': [51.5074, -0.1278],
  'Berlin': [52.5200, 13.4050],
  'Singapore': [1.3521, 103.8198],
  'Tokyo': [35.6762, 139.6503],
  'Dubai': [25.2048, 55.2708],
  // Add more tech hubs as needed
};

export function parseLocation(locationString: string): ParsedLocation {
  if (!locationString) {
    return generateRandomLocation();
  }

  // Clean the input string
  const cleanLocation = locationString.trim().toLowerCase();
  
  // Check for common separators: comma, hyphen, or forward slash
  const parts = cleanLocation.split(/[,\-\/]/).map(part => part.trim());
  
  // Try to identify city and country from the parts
  let city: string | undefined;
  let country: string | undefined;

  if (parts.length >= 2) {
    city = parts[0];
    country = parts[parts.length - 1];
  } else {
    // If only one part, treat it as a city
    city = parts[0];
  }

  // Look up coordinates for known tech hubs
  if (city) {
    const cityKey = Object.keys(techHubCoordinates).find(
      key => key.toLowerCase() === city
    );
    
    if (cityKey) {
      const [lat, lng] = techHubCoordinates[cityKey];
      return {
        city: toTitleCase(city),
        country,
        lat,
        lng
      };
    }
  }

  // If no exact match found, generate a random position in a region
  return {
    city: city ? toTitleCase(city) : undefined,
    country: country ? toTitleCase(country) : undefined,
    ...generateRandomLocation()
  };
}

function generateRandomLocation(): { lat: number; lng: number } {
  // Generate random coordinates within populated regions
  const regions = [
    // North America
    { minLat: 25, maxLat: 50, minLng: -130, maxLng: -70 },
    // Europe
    { minLat: 35, maxLat: 60, minLng: -10, maxLng: 30 },
    // Asia
    { minLat: 10, maxLat: 40, minLng: 70, maxLng: 140 },
    // Australia
    { minLat: -40, maxLat: -10, minLng: 110, maxLng: 155 }
  ];

  // Randomly select a region
  const region = regions[Math.floor(Math.random() * regions.length)];
  
  return {
    lat: region.minLat + Math.random() * (region.maxLat - region.minLat),
    lng: region.minLng + Math.random() * (region.maxLng - region.minLng)
  };
}

function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
} 