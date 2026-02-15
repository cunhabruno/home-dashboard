import Dashboard from './components/Dashboard';
import WeatherWidget from './components/WeatherWidget';
import MarketCarousel from './components/MarketCarousel';

export default function Home() {
  return (
    <Dashboard>
      <WeatherWidget />
      <MarketCarousel />
    </Dashboard>
  );
}
