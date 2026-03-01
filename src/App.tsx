import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_SITES, API_BASE_URL } from './constants';
import { SiteStatus, Alert, SensorType } from './types';
import { Sidebar } from './components/Sidebar';
import { SensorCard } from './components/SensorCard';
import { AlertPanel } from './components/AlertPanel';
import {
  LayoutDashboard,
  Bell,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [sites, setSites] = useState<SiteStatus[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sites`);
      const data = await response.json();
      setSites(data);
      if (data.length > 0 && !selectedSiteId) {
        setSelectedSiteId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
    const interval = setInterval(fetchSites, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const selectedSite = useMemo(() =>
    sites.find(s => s.id === selectedSiteId) || sites[0] || MOCK_SITES[0],
    [sites, selectedSiteId]
  );

  const alerts = useMemo(() => {
    const allAlerts: Alert[] = [];
    if (!sites.length) return allAlerts;

    sites.forEach(site => {
      (Object.entries(site.sensors) as [SensorType, any][]).forEach(([type, sensor]) => {
        if (sensor.current > sensor.threshold) {
          allAlerts.push({
            id: `alert-${site.id}-${type}`,
            siteId: site.id,
            siteName: site.name,
            type,
            severity: sensor.current > sensor.threshold * 1.2 ? 'critical' : 'warning',
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} at ${site.name} is ${sensor.current}${sensor.unit} — threshold: ${sensor.threshold}${sensor.unit}`,
            timestamp: Date.now() - Math.random() * 3600000,
            resolved: false,
          });
        }
      });
    });
    return allAlerts.sort((a, b) => b.timestamp - a.timestamp);
  }, [sites]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSites().finally(() => setTimeout(() => setIsRefreshing(false), 800));
  };
//junk
  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-emerald-500/30 transition-colors duration-300 overflow-hidden">
      <Sidebar
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSelectSite={(id) => { setSelectedSiteId(id); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-header)] flex items-center justify-between px-4 lg:px-8 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3 lg:gap-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-[var(--border-subtle)] rounded-lg lg:hidden text-[var(--text-secondary)]"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[var(--text-secondary)]">
              <LayoutDashboard size={18} />
              <span className="text-sm font-medium">Dashboard</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-[var(--border-subtle)]" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-none">
                {selectedSite.name}
              </span>
              <span className="hidden xs:inline text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                {selectedSite.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-full hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`}
              title="Refresh data"
            >
              <RefreshCw size={18} />
            </button>
            <button className="p-2 rounded-full hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] relative" title="Alerts">
              <Bell size={18} />
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--bg-header)]" />
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="animate-spin text-emerald-500" size={32} />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

              {/* Site Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                      {selectedSite.name}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedSite.status === 'online' ? 'bg-emerald-500/10 text-emerald-500' :
                        selectedSite.status === 'warning' ? 'bg-amber-500/10  text-amber-500' :
                          'bg-red-500/10    text-red-500'
                      }`}>
                      {selectedSite.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[var(--text-secondary)] text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>Secure Connection</span>
                    </div>
                    <div className="hidden xs:block w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
                    <div className="flex items-center gap-1.5">
                      <ExternalLink size={14} />
                      <span>{selectedSite.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Grid: Sensor Cards + Alerts */}
              <div className="grid grid-cols-12 gap-6">
                {/* Sensor Cards */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="wait">
                    {/* Temperature — full width */}
                    {selectedSite.sensors?.temperature && (
                      <motion.div
                        key={`${selectedSiteId}-temp`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="col-span-1 md:col-span-2"
                      >
                        <SensorCard
                          type="temperature"
                          current={selectedSite.sensors.temperature.current}
                          unit={selectedSite.sensors.temperature.unit}
                          history={selectedSite.sensors.temperature.history}
                          threshold={selectedSite.sensors.temperature.threshold}
                        />
                      </motion.div>
                    )}

                    {/* Humidity */}
                    {selectedSite.sensors?.humidity && (
                      <motion.div
                        key={`${selectedSiteId}-hum`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="col-span-1"
                      >
                        <SensorCard
                          type="humidity"
                          current={selectedSite.sensors.humidity.current}
                          unit={selectedSite.sensors.humidity.unit}
                          history={selectedSite.sensors.humidity.history}
                          threshold={selectedSite.sensors.humidity.threshold}
                        />
                      </motion.div>
                    )}

                    {/* Smoke */}
                    {selectedSite.sensors?.smoke && (
                      <motion.div
                        key={`${selectedSiteId}-smoke`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="col-span-1"
                      >
                        <SensorCard
                          type="smoke"
                          current={selectedSite.sensors.smoke.current}
                          unit={selectedSite.sensors.smoke.unit}
                          history={selectedSite.sensors.smoke.history}
                          threshold={selectedSite.sensors.smoke.threshold}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Alerts Panel */}
                <div className="col-span-12 lg:col-span-4 h-[600px]">
                  <AlertPanel alerts={alerts} />
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
