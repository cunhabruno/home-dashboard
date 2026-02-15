'use client';

import { useEffect, useState } from 'react';
import WidgetContainer from './Widget';

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let latitude, longitude;
      
      // Try to get user's current location
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 300000, // 5 minutes cache
            enableHighAccuracy: false
          });
        });
        
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        console.log('✅ Got location from browser:', latitude, longitude);
      } catch (geoError) {
        // Fallback to IP-based location
        console.warn('⚠️ Geolocation failed, using IP-based location:', geoError);
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          const ipData = await ipResponse.json();
          latitude = ipData.latitude;
          longitude = ipData.longitude;
          console.log('✅ Got location from IP:', latitude, longitude);
        } catch (ipError) {
          // Final fallback to a default location (Central London)
          console.warn('⚠️ IP location failed, using default location (London)');
          latitude = 51.5074;
          longitude = -0.1278;
        }
      }
      
      console.log('🌍 Fetching weather for:', latitude, longitude);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      
      const data = await response.json();
      
      const weatherConditions: { [key: number]: { condition: string; icon: string } } = {
        0: { condition: 'Clear', icon: '☀️' },
        1: { condition: 'Mainly Clear', icon: '🌤️' },
        2: { condition: 'Partly Cloudy', icon: '⛅' },
        3: { condition: 'Overcast', icon: '☁️' },
        45: { condition: 'Foggy', icon: '🌫️' },
        48: { condition: 'Foggy', icon: '🌫️' },
        51: { condition: 'Light Drizzle', icon: '🌦️' },
        61: { condition: 'Rain', icon: '🌧️' },
        71: { condition: 'Snow', icon: '🌨️' },
        95: { condition: 'Thunderstorm', icon: '⛈️' },
      };
      
      const weatherCode = data.current.weather_code;
      const weatherInfo = weatherConditions[weatherCode] || { condition: 'Unknown', icon: '🌡️' };
      
      // Get location name from reverse geocoding
      let locationName;
      try {
        const locationResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const locationData = await locationResponse.json();
        locationName = locationData.city 
          ? `${locationData.city}, ${locationData.countryCode}`
          : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      } catch (locError) {
        console.warn('⚠️ Location name fetch failed:', locError);
        locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      }
      
      console.log('✅ Weather data fetched successfully');
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        condition: weatherInfo.condition,
        location: locationName,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        icon: weatherInfo.icon,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <WidgetContainer title="Weather">
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-4xl">🌡️</div>
        </div>
      </WidgetContainer>
    );
  }

  if (error || !weather) {
    return (
      <WidgetContainer title="Weather">
        <div className="text-red-500">
          <p>{error || 'Unable to load weather data'}</p>
          <button 
            onClick={fetchWeather}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Weather">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
              {weather.temperature}°C
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {weather.location}
            </div>
          </div>
          <div className="text-6xl">
            {weather.icon}
          </div>
        </div>
        
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="text-lg font-medium mb-3 text-zinc-900 dark:text-zinc-100">
            {weather.condition}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-zinc-500 dark:text-zinc-400">Humidity</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {weather.humidity}%
              </div>
            </div>
            <div>
              <div className="text-zinc-500 dark:text-zinc-400">Wind Speed</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {weather.windSpeed} km/h
              </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={fetchWeather}
          className="w-full mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>
    </WidgetContainer>
  );
}
