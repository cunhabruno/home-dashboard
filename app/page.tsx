import Dashboard from './components/Dashboard';
import WeatherWidget from './components/WeatherWidget';
import StockMarketWidget from './components/StockMarketWidget';

export default function Home() {
  return (
    <Dashboard>
      <WeatherWidget />
      <StockMarketWidget />
    </Dashboard>
  );
}
