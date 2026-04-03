import { useState } from 'react';
import { MapPin, Navigation, Utensils, Activity, Loader2, LocateFixed } from 'lucide-react';
import Map from './components/Map';
import ElevationChart from './components/ElevationChart';
import AutocompleteInput from './components/AutocompleteInput';
import { geocode, getRoute, Coordinates, RouteData, reverseGeocode, Place } from './services/route';
import { getFoodRecommendations, FoodSpot } from './services/gemini';

export default function App() {
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  
  const [startPlace, setStartPlace] = useState<Place | null>(null);
  const [endPlace, setEndPlace] = useState<Place | null>(null);

  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [endCoords, setEndCoords] = useState<Coordinates | null>(null);
  
  const [route, setRoute] = useState<RouteData | null>(null);
  const [foodSpots, setFoodSpots] = useState<FoodSpot[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          if (address) {
            const shortAddress = address.split(',').slice(0, 3).join(',');
            setStartQuery(shortAddress);
            setStartPlace({
              name: shortAddress,
              address: address,
              lat: latitude,
              lng: longitude
            });
          } else {
            setStartQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            setStartPlace({
              name: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
              address: '',
              lat: latitude,
              lng: longitude
            });
          }
        } catch (err) {
          setStartQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          setStartPlace({
            name: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            address: '',
            lat: latitude,
            lng: longitude
          });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setError('Unable to retrieve your location. Please check permissions.');
        setLocating(false);
      }
    );
  };

  const handlePlanRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startQuery || !endQuery) {
      setError('Please enter both start and destination.');
      return;
    }

    setLoading(true);
    setError('');
    setRoute(null);
    setFoodSpots([]);

    try {
      // 1. Geocode
      let start = startCoords;
      let end = endCoords;

      if (startPlace && startPlace.name === startQuery) {
        start = { lat: startPlace.lat, lng: startPlace.lng };
      } else {
        start = await geocode(startQuery);
      }

      if (endPlace && endPlace.name === endQuery) {
        end = { lat: endPlace.lat, lng: endPlace.lng };
      } else {
        end = await geocode(endQuery);
      }

      if (!start || !end) {
        throw new Error('Could not find coordinates for the given locations.');
      }

      setStartCoords(start);
      setEndCoords(end);

      // 2. Get Route & Elevation
      const routeData = await getRoute(start, end);
      if (!routeData) {
        throw new Error('Could not calculate route.');
      }
      setRoute(routeData);

      // 3. Get Food Recommendations from Gemini
      const spots = await getFoodRecommendations(startQuery, endQuery);
      setFoodSpots(spots);

    } catch (err: any) {
      setError(err.message || 'An error occurred while planning the route.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-50 font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-[400px] flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-2xl relative">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">VeloRoute AI</h1>
          </div>

          <form onSubmit={handlePlanRoute} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Start</label>
              <AutocompleteInput
                value={startQuery}
                onChange={setStartQuery}
                onSelect={(place) => {
                  setStartQuery(place.name);
                  setStartPlace(place);
                }}
                placeholder="e.g. San Francisco"
                icon={<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
                rightElement={
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={locating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                    title="Use current location"
                  >
                    {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Destination</label>
              <AutocompleteInput
                value={endQuery}
                onChange={setEndQuery}
                onSelect={(place) => {
                  setEndQuery(place.name);
                  setEndPlace(place);
                }}
                placeholder="e.g. Palo Alto"
                icon={<Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Planning Route...
                </>
              ) : (
                'Plan Route'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {route && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-xs mb-1">Distance</div>
                  <div className="text-xl font-semibold text-slate-100">
                    {(route.distance / 1000).toFixed(1)} <span className="text-sm text-slate-500">km</span>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="text-slate-400 text-xs mb-1">Est. Time</div>
                  <div className="text-xl font-semibold text-slate-100">
                    {Math.round(route.duration / 60)} <span className="text-sm text-slate-500">min</span>
                  </div>
                </div>
              </div>

              <ElevationChart elevation={route.elevation} distance={route.distance} />
            </div>
          )}

          {foodSpots.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Utensils className="w-5 h-5 text-orange-400" />
                <h2 className="font-semibold">Recommended Stops</h2>
              </div>
              <div className="space-y-3">
                {foodSpots.map((spot, idx) => (
                  <div key={idx} className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <h3 className="font-medium text-slate-200 mb-1">{spot.name}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{spot.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!route && !loading && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-4 py-12">
              <MapPin className="w-12 h-12 opacity-20" />
              <p className="text-sm">Enter a start and destination to plan your cycling route and discover great food along the way.</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-slate-950 z-0">
        <Map start={startCoords} end={endCoords} route={route} foodSpots={foodSpots} />
      </div>
    </div>
  );
}
