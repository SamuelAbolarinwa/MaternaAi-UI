import React, { useState, useEffect } from 'react';
import db from './db';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import BottomTabBar from './components/BottomTabBar';
import NewVisitScreen from './screens/NewVisitScreen';
import ResultsScreen from './screens/ResultsScreen';
import PatientsScreen from './screens/PatientsScreen';
import HistoryScreen from './screens/HistoryScreen';

const API_BASE = 'https://maternaai-pbpw.onrender.com';

const DEFAULT_SETTINGS = {
  tempUnit: 'C',
  bsUnit: 'mmol/L',
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('newVisit');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('maternaai_settings') || '') || DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const saveSettings = (updated: any) => {
    setSettings(updated);
    localStorage.setItem('maternaai_settings', JSON.stringify(updated));
  };

  useEffect(() => {
    db.init();
    db.setApiBaseUrl(API_BASE);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigate = (screen: string, params: any = {}) => {
    if (params.patientId) setSelectedPatientId(params.patientId);
    if (params.result) setCurrentResult(params.result);
    if (params.currentPatientId) setCurrentPatientId(params.currentPatientId);
    setCurrentScreen(screen);
    setSidebarOpen(false); // always close sidebar on navigate
  };

  return (
    <div className="min-h-screen bg-[#FDF9F7] flex flex-col">
      <TopBar setSidebarOpen={setSidebarOpen} isOnline={isOnline} />
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        navigate={navigate}
        selectedPatientId={selectedPatientId}
        currentScreen={currentScreen}
        settings={settings}
        saveSettings={saveSettings}
      />
      <main className="flex-1 pt-24 pb-28 overflow-y-auto">
        {currentScreen === 'newVisit' && (
          <NewVisitScreen navigate={navigate} apiBase={API_BASE} settings={settings} />
        )}
        {currentScreen === 'results' && (
          <ResultsScreen navigate={navigate} result={currentResult} patientId={currentPatientId} />
        )}
        {currentScreen === 'patients' && (
          <PatientsScreen navigate={navigate} apiBase={API_BASE} />
        )}
        {currentScreen === 'history' && (
          <HistoryScreen navigate={navigate} patientId={selectedPatientId} />
        )}
      </main>
      <BottomTabBar 
        currentScreen={currentScreen} 
        navigate={navigate} 
        selectedPatientId={selectedPatientId} 
      />
    </div>
  );
}
