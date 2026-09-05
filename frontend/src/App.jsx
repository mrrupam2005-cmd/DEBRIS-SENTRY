import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import GlobeView from './components/3d/GlobeView';
import SatelliteTracker from './components/SatelliteTracker';
import ConjunctionAssessment from './components/ConjunctionAssessment';
import ConstellationView from './components/ConstellationView';
import SpaceEnvironmentView from './components/SpaceEnvironmentView';
import AIDebrisDetection from './components/AIDebrisDetection';
import Analytics from './components/Analytics';
import {
  fetchSatellites, propagateAll, fetchConjunctions, fetchAnalyticsSummary,
  fetchPublicAlerts, fetchTrajectory, screenConjunctionPair, reviewConjunction,
  syncLiveCelesTrak, detectAIDebris, fetchHealth
} from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('globe');
  const [satellites, setSatellites] = useState([]);
  const [conjunctions, setConjunctions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedSat, setSelectedSat] = useState(null);
  const [selectedConjunction, setSelectedConjunction] = useState(null);
  const [trajectory, setTrajectory] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sourceMode, setSourceMode] = useState('DATA MODE: DEMO');
  const [apiError, setApiError] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  // Fetch all initial telemetry & catalog data via centralized API client
  const fetchData = async () => {
    try {
      const health = await fetchHealth();
      if (health.status === 'offline') {
        setIsBackendOnline(false);
        setApiError('Backend server at http://127.0.0.1:8000 is unreachable. Using local cache mode.');
      } else {
        setIsBackendOnline(true);
        setApiError(null);
      }

      const [rawObjects, rawPos, conjList, analData, alertList] = await Promise.all([
        fetchSatellites().catch(() => []),
        propagateAll().catch(() => []),
        fetchConjunctions().catch(() => []),
        fetchAnalyticsSummary().catch(() => null),
        fetchPublicAlerts().catch(() => [])
      ]);

      const objectsMap = new Map();
      (Array.isArray(rawObjects) ? rawObjects : []).forEach(obj => objectsMap.set(Number(obj.norad_id), obj));

      const mergedSatellites = (Array.isArray(rawPos) ? rawPos : []).map(pos => {
        const meta = objectsMap.get(Number(pos.norad_id)) || {};
        return {
          ...meta,
          ...pos
        };
      });

      const finalSatList = mergedSatellites.length > 0 ? mergedSatellites : (Array.isArray(rawObjects) ? rawObjects : []);
      setSatellites(finalSatList);
      setConjunctions(Array.isArray(conjList) ? conjList : []);
      setAlerts(Array.isArray(alertList) ? alertList : []);

      if (analData) {
        setAnalytics(analData);
        if (analData.data_mode) {
          setSourceMode(analData.data_mode);
        }
      }
    } catch (err) {
      console.warn("Backend API offline or network error, maintaining current state", err);
      setIsBackendOnline(false);
      setApiError(`API connection error: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s telemetry refresh cycle
    return () => clearInterval(interval);
  }, []);

  // Fetch trajectory when selected satellite changes
  useEffect(() => {
    if (selectedSat) {
      fetchTrajectory(selectedSat.norad_id, 24)
        .then(res => setTrajectory(res))
        .catch(err => console.error("Trajectory fetch error", err));
    } else {
      setTrajectory(null);
    }
  }, [selectedSat]);

  // Sync live data trigger
  const handleSyncLive = async () => {
    setIsSyncing(true);
    try {
      const res = await syncLiveCelesTrak();
      await fetchData();
      if (res?.mode) {
        setSourceMode(res.mode);
      }
    } catch (err) {
      console.error("Live sync failed", err);
      setApiError(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Conjunction screening trigger
  const handleScreenConjunction = async (primaryId, secondaryId) => {
    try {
      const res = await screenConjunctionPair(primaryId, secondaryId);
      setConjunctions(prev => [res, ...prev]);
      return res;
    } catch (err) {
      console.error("Conjunction screening error", err);
      setApiError(`Screening failed: ${err.message}`);
    }
  };

  // Alert review trigger
  const handleReviewAlert = async (alertId) => {
    try {
      await fetchPublicAlerts();
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_reviewed: true } : a));
    } catch (err) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_reviewed: true } : a));
    }
  };

  // Conjunction review trigger
  const handleReviewConjunction = async (conjId) => {
    try {
      await reviewConjunction(conjId);
      setConjunctions(prev => prev.map(c => c.id === conjId ? { ...c, is_reviewed: true } : c));
    } catch (err) {
      setConjunctions(prev => prev.map(c => c.id === conjId ? { ...c, is_reviewed: true } : c));
    }
  };

  // Trigger 3D View focus on a specific conjunction
  const handleInspectConjunction3D = (conj) => {
    setSelectedConjunction(conj);
    const primSat = satellites.find(s => s.norad_id === conj.primary_norad_id);
    if (primSat) {
      setSelectedSat(primSat);
    }
    setActiveTab('globe');
  };

  // AI Image detection upload handler
  const handleUploadImage = async (file) => {
    try {
      const res = await detectAIDebris(file);
      return res;
    } catch (err) {
      console.error("Image detection error", err);
      setApiError(`AI Detection failed: ${err.message}`);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-space-dark text-slate-100 flex flex-col font-sans selection:bg-sky-500">
      
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSyncLive={handleSyncLive}
        isSyncing={isSyncing}
        sourceMode={sourceMode}
        alerts={alerts}
        onReviewAlert={handleReviewAlert}
        isBackendOnline={isBackendOnline}
      />

      {/* Backend API Connection Banner if offline or error */}
      {apiError && (
        <div className="bg-amber-950/80 border-b border-amber-500/50 px-4 py-2 text-center text-xs font-mono text-amber-200 flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>{apiError}</span>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'globe' && (
          <GlobeView
            satellites={satellites}
            selectedSat={selectedSat}
            setSelectedSat={setSelectedSat}
            selectedConjunction={selectedConjunction}
            setSelectedConjunction={setSelectedConjunction}
            conjunctions={conjunctions}
            trajectory={trajectory}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            analytics={analytics}
            satellites={satellites}
            conjunctions={conjunctions}
            alerts={alerts}
            onNavigate={setActiveTab}
            onSelectSat={setSelectedSat}
            onInspectConjunction3D={handleInspectConjunction3D}
          />
        )}

        {activeTab === 'satellites' && (
          <SatelliteTracker
            satellites={satellites}
            conjunctions={conjunctions}
            onSelectSat={setSelectedSat}
            onNavigate3D={() => setActiveTab('globe')}
            onRefreshTLE={handleSyncLive}
            isRefreshing={isSyncing}
            onInspectConjunction3D={handleInspectConjunction3D}
          />
        )}

        {activeTab === 'conjunctions' && (
          <ConjunctionAssessment
            conjunctions={conjunctions}
            satellites={satellites}
            onScreenConjunction={handleScreenConjunction}
            onNavigate3D={() => setActiveTab('globe')}
            onSelectSat={setSelectedSat}
            onInspectConjunction3D={handleInspectConjunction3D}
            onReviewConjunction={handleReviewConjunction}
          />
        )}

        {activeTab === 'constellations' && (
          <ConstellationView
            onSelectSat={setSelectedSat}
          />
        )}

        {activeTab === 'spaceweather' && (
          <SpaceEnvironmentView />
        )}

        {activeTab === 'detection' && (
          <AIDebrisDetection
            onUploadImage={handleUploadImage}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            analytics={analytics}
            satellites={satellites}
            onNavigate={setActiveTab}
            onSelectSat={setSelectedSat}
            onInspectConjunction3D={handleInspectConjunction3D}
          />
        )}
      </main>

    </div>
  );
}
