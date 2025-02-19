interface ParsedLocation {
  display_name: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

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

export async function getLocationCoordinates(locationString: string): Promise<ParsedLocation> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`
    );
    const data = await response.json();

    if (data && data[0]) {
      const result = data[0];
      // Extract city and country from display name
      const addressParts = result.display_name.split(', ');
      const country = addressParts[addressParts.length - 1];
      const city = addressParts[0];

      return {
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        city,
        country
      };
    }

    // Fallback coordinates if location not found (0,0)
    return {
      display_name: '',
      lat: 0,
      lng: 0
    };
  } catch (error) {
    console.error('Error geocoding location:', error);
    // Return fallback coordinates
    return {
      display_name: '',
      lat: 0,
      lng: 0
    };
  }
}

// For immediate use when we already have coordinates
export function parseLocation(locationString: string): ParsedLocation {
  try {
    // Try to parse stored JSON format first
    const parsed = JSON.parse(locationString);
    return {
      display_name: parsed.display_name,
      lat: parsed.lat || 0,
      lng: parsed.lng || 0,
      city: parsed.city,
      country: parsed.country
    };
  } catch {
    // If not JSON, return fallback coordinates
    return {
      display_name: '',
      lat: 0,
      lng: 0
    };
  }
}

export const parseLocationString = (locationString: string | null): ParsedLocation | null => {
  if (!locationString) return null;
  
  try {
    const parsed = JSON.parse(locationString);
    return {
      display_name: parsed.display_name,
      lat: parsed.lat,
      lng: parsed.lng
    };
  } catch (e) {
    console.error('Error parsing location:', e);
    return null;
  }
};

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