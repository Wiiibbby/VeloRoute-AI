export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RouteData {
  coordinates: [number, number][]; // [lng, lat]
  distance: number; // meters
  duration: number; // seconds
  elevation: number[]; // meters
}

export const geocode = async (query: string): Promise<Coordinates | null> => {
  try {
    const coordMatch = query.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[3]),
      };
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

export const searchPlaces = async (query: string): Promise<Place[]> => {
  try {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    if (!data || !data.features) return [];

    return data.features.map((f: any) => {
      const p = f.properties;
      const addressParts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
      const address = Array.from(new Set(addressParts)).join(', ');
      return {
        name: p.name || addressParts[0] || "Unknown Place",
        address: address,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    });
  } catch (error) {
    console.error("Search places error:", error);
    return [];
  }
};

export const getRoute = async (start: Coordinates, end: Coordinates): Promise<RouteData | null> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/bicycle/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates; // [lng, lat][]
    
    // Sample coordinates for elevation (max 100 points for OpenTopoData)
    const sampledCoords = sampleCoordinates(coordinates, 100);
    const elevation = await getElevation(sampledCoords);

    return {
      coordinates,
      distance: route.distance,
      duration: route.duration,
      elevation: elevation || generateMockElevation(sampledCoords.length, route.distance),
    };
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
};

const sampleCoordinates = (coords: [number, number][], maxPoints: number): [number, number][] => {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const sampled = [];
  for (let i = 0; i < coords.length; i += step) {
    sampled.push(coords[i]);
  }
  if (sampled[sampled.length - 1] !== coords[coords.length - 1]) {
    sampled.push(coords[coords.length - 1]);
  }
  return sampled;
};

const getElevation = async (coords: [number, number][]): Promise<number[] | null> => {
  try {
    const locations = coords.map(c => `${c[1]},${c[0]}`).join('|');
    const url = `https://api.opentopodata.org/v1/aster30m?locations=${locations}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.results) {
      return data.results.map((r: any) => r.elevation || 0);
    }
    return null;
  } catch (error) {
    console.error("Elevation error:", error);
    return null;
  }
};

const generateMockElevation = (points: number, distance: number): number[] => {
  // Generate a somewhat realistic looking elevation profile
  let currentElevation = 50 + Math.random() * 100;
  const elevation = [currentElevation];
  for (let i = 1; i < points; i++) {
    const change = (Math.random() - 0.45) * 10; // slight upward bias or random
    currentElevation = Math.max(0, currentElevation + change);
    elevation.push(currentElevation);
  }
  return elevation;
};
