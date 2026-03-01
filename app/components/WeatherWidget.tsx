'use client';

import { useEffect, useState } from 'react';
import WidgetContainer from './Widget';

interface HourlyForecast {
  time: string;
  temperature: number;
  icon: string;
  precipProb: number;
}

interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  location: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  tempMin: number;
  tempMax: number;
  hourly: HourlyForecast[];
}

const weatherConditions: { [key: number]: { condition: string; icon: string } } = {
  0: { condition: 'Clear', icon: '☀️' },
  1: { condition: 'Mainly Clear', icon: '🌤️' },
  2: { condition: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Foggy', icon: '🌫️' },
  51: { condition: 'Light Drizzle', icon: '🌦️' },
  53: { condition: 'Drizzle', icon: '🌦️' },
  55: { condition: 'Heavy Drizzle', icon: '🌦️' },
  56: { condition: 'Freezing Drizzle', icon: '🌧️' },
  57: { condition: 'Freezing Drizzle', icon: '🌧️' },
  61: { condition: 'Light Rain', icon: '🌧️' },
  63: { condition: 'Rain', icon: '🌧️' },
  65: { condition: 'Heavy Rain', icon: '🌧️' },
  66: { condition: 'Freezing Rain', icon: '🌧️' },
  67: { condition: 'Freezing Rain', icon: '🌧️' },
  71: { condition: 'Light Snow', icon: '🌨️' },
  73: { condition: 'Snow', icon: '🌨️' },
  75: { condition: 'Heavy Snow', icon: '🌨️' },
  77: { condition: 'Snow Grains', icon: '🌨️' },
  80: { condition: 'Light Showers', icon: '🌦️' },
  81: { condition: 'Showers', icon: '🌧️' },
  82: { condition: 'Heavy Showers', icon: '🌧️' },
  85: { condition: 'Snow Showers', icon: '🌨️' },
  86: { condition: 'Heavy Snow Showers', icon: '🌨️' },
  95: { condition: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'Thunderstorm + Hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm + Hail', icon: '⛈️' },
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatSunTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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
            maximumAge: 300000,
            enableHighAccuracy: false
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          const ipData = await ipResponse.json();
          latitude = ipData.latitude;
          longitude = ipData.longitude;
        } catch {
          latitude = 51.5074;
          longitude = -0.1278;
        }
      }
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset` +
        `&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto&forecast_days=1`
      );
      
      if (!response.ok) throw new Error('Failed to fetch weather data');
      
      const data = await response.json();
      
      const weatherCode = data.current.weather_code;
      const weatherInfo = weatherConditions[weatherCode] || { condition: 'Unknown', icon: '🌡️' };
      
      // Build hourly forecast — remaining hours of the day
      const now = new Date();
      const currentHour = now.getHours();
      const hourly: HourlyForecast[] = [];

      if (data.hourly) {
        for (let i = 0; i < data.hourly.time.length; i++) {
          const hourDate = new Date(data.hourly.time[i]);
          if (hourDate.getHours() <= currentHour) continue;
          const code = data.hourly.weather_code[i];
          const info = weatherConditions[code] || { condition: 'Unknown', icon: '🌡️' };
          hourly.push({
            time: data.hourly.time[i],
            temperature: Math.round(data.hourly.temperature_2m[i]),
            icon: info.icon,
            precipProb: data.hourly.precipitation_probability[i] ?? 0,
          });
        }
      }
      
      // Get location name
      let locationName;
      try {
        const locationResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const locationData = await locationResponse.json();
        locationName = locationData.city 
          ? `${locationData.city}, ${locationData.countryCode}`
          : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      } catch {
        locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      }
      
      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        condition: weatherInfo.condition,
        location: locationName,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        icon: weatherInfo.icon,
        uvIndex: Math.round(data.daily.uv_index_max[0]),
        sunrise: data.daily.sunrise[0],
        sunset: data.daily.sunset[0],
        tempMin: Math.round(data.daily.temperature_2m_min[0]),
        tempMax: Math.round(data.daily.temperature_2m_max[0]),
        hourly,
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

  const uvLabel =
    weather.uvIndex <= 2 ? 'Low' :
    weather.uvIndex <= 5 ? 'Moderate' :
    weather.uvIndex <= 7 ? 'High' :
    weather.uvIndex <= 10 ? 'Very High' : 'Extreme';

  const uvColor =
    weather.uvIndex <= 2 ? 'text-green-600 dark:text-green-400' :
    weather.uvIndex <= 5 ? 'text-yellow-600 dark:text-yellow-400' :
    weather.uvIndex <= 7 ? 'text-orange-600 dark:text-orange-400' :
    'text-red-600 dark:text-red-400';

  return (
    <WidgetContainer title="Weather">
      <div className="space-y-4">
        {/* Current conditions */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
              {weather.temperature}°C
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Feels like {weather.feelsLike}°C
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              📍 {weather.location}
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl">{weather.icon}</div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">
              {weather.condition}
            </div>
          </div>
        </div>

        {/* Daily high / low + sunrise / sunset */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <div className="text-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">High</div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {weather.tempMax}°
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Low</div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {weather.tempMin}°
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">🌅 Rise</div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {formatSunTime(weather.sunrise)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">🌇 Set</div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {formatSunTime(weather.sunset)}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <div className="text-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">💧 Humidity</div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {weather.humidity}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">💨 Wind</div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {weather.windSpeed} km/h
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">☀️ UV</div>
            <div className={`font-semibold text-sm ${uvColor}`}>
              {weather.uvIndex} {uvLabel}
            </div>
          </div>
        </div>

        {/* Hourly forecast */}
        {weather.hourly.length > 0 && (
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              🕐 Rest of the Day
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {weather.hourly.map((hour) => (
                <div
                  key={hour.time}
                  className="flex flex-col items-center flex-shrink-0 min-w-[3.5rem] p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60"
                >
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    {formatTime(hour.time)}
                  </span>
                  <span className="text-lg my-0.5">{hour.icon}</span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {hour.temperature}°
                  </span>
                  {hour.precipProb > 0 && (
                    <span className="text-[10px] text-blue-500 font-medium mt-0.5">
                      💧{hour.precipProb}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button 
          onClick={fetchWeather}
          className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>
    </WidgetContainer>
  );
}
