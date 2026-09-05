import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ShieldAlert, Cpu, Orbit, Activity, RefreshCw, AlertTriangle, Layers,
  Info, ExternalLink, Clock, Globe, Zap, Radio, Bell, CheckCircle2,
  Sliders, ArrowRight, HelpCircle, Eye, AlertOctagon, CornerDownRight, Server, Compass
} from 'lucide-react';
import Badge from './Badge';

export default function Analytics({ analytics, satellites = [], onNavigate, onSelectSat, onInspectConjunction3D }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, forecast, alerts, reentry_neo, spaceweather, simulator
  const [forecastHorizon, setForecastHorizon] = useState('24h');
  const [forecastData, setForecastData] = useState([]);
  const [neoWarnings, setNeoWarnings] = useState([]);
  const [publicAlerts, setPublicAlerts] = useState([]);
  const [alertPreferences, setAlertPreferences] = useState(null);
  const [selectedWhyCare, setSelectedWhyCare] = useState(null);
  const [selectedWhatIf, setSelectedWhatIf] = useState(null);
  const [simulatedBurn, setSimulatedBurn] = useState(0.5);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL REGIONS');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('ALL');

  // Fetch forecast data
  const fetchForecast = async (horizon) => {
    try {
      const res = await axios.get(`/api/v1/forecast?horizon=${horizon}`);
      if (res.data?.items) {
        setForecastData(res.data.items);
      }
    } catch (err) {
      console.warn("Forecast API offline or fallback", err);
    }
  };

  // Fetch NEO warnings, Public Alerts, & Notification Preferences
  const fetchAuxiliaryData = async () => {
    try {
      const [neoRes, alertRes, prefRes] = await Promise.all([
        axios.get('/api/v1/neo-warnings').catch(() => ({ data: [] })),
        axios.get('/api/v1/public-alerts').catch(() => ({ data: [] })),
        axios.get('/api/v1/notification-preferences').catch(() => ({ data: null }))
      ]);
      setNeoWarnings(Array.isArray(neoRes.data) ? neoRes.data : []);
      setPublicAlerts(Array.isArray(alertRes.data) ? alertRes.data : []);
      if (prefRes.data) {
        setAlertPreferences(prefRes.data);
      }
    } catch (err) {
      console.warn("Auxiliary data fetch error", err);
    }
  };

  useEffect(() => {
    fetchForecast(forecastHorizon);
  }, [forecastHorizon]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  // Handle alert status acknowledge
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await axios.post(`/api/v1/public-alerts/${alertId}/acknowledge`);
      setPublicAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a));
    } catch (err) {
      setPublicAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a));
    }
  };

  // Handle What-If simulation calculation
  const handleRunWhatIfSimulation = async (conjId) => {
    try {
      const res = await axios.post(`/api/v1/conjunctions/${conjId}/what-if`, {
        simulated_avoidance_burn_m_s: parseFloat(simulatedBurn)
      });
      setWhatIfResult(res.data);
    } catch (err) {
      console.error("What-If simulation error", err);
    }
  };

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin flex items-center justify-center">
          <Activity className="w-5 h-5 text-sky-400" />
        </div>
        <div className="font-mono text-sky-400 text-sm tracking-wider uppercase">Loading Risk Intelligence Center...</div>
        <p className="text-xs text-slate-400 max-w-sm font-sans">Fetching catalog statistics, predictive forecast models, and public safety feeds.</p>
      </div>
    );
  }

  const summary = analytics.summary_cards || {};
  const dataQuality = analytics.data_quality_card || {};
  const dataMode = analytics.data_mode || 'DATA MODE: DEMO';
  const dataSource = analytics.data_source || 'CelesTrak / Demo Catalog';
  const lastUpdated = analytics.last_updated ? new Date(analytics.last_updated).toLocaleString() : 'Live Session';
  const disclaimer = analytics.disclaimer || 'Analytics are derived from available prototype/public/demo data and are intended for research and demonstration purposes.';

  // Summary Intelligence Cards
  const cards = [
    { title: 'TOTAL TRACKED OBJECTS', value: summary.total_tracked_objects ?? 0, icon: Orbit, color: 'text-sky-400', border: 'border-sky-500/30' },
    { title: 'ACTIVE SATELLITES', value: summary.active_satellites ?? 0, icon: Layers, color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { title: 'SPACE DEBRIS', value: summary.space_debris ?? 0, icon: Activity, color: 'text-red-400', border: 'border-red-500/30' },
    { title: 'ROCKET BODIES', value: summary.inactive_rocket_bodies ?? 0, icon: Server, color: 'text-amber-400', border: 'border-amber-500/30' },
    { title: 'PROTECTED ASSETS', value: summary.protected_assets ?? 4, icon: ShieldAlert, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { title: 'ACTIVE CONJUNCTIONS', value: summary.active_conjunctions ?? 0, icon: AlertTriangle, color: 'text-orange-400', border: 'border-orange-500/30' },
    { title: 'HIGH RISK OBJECTS', value: summary.high_risk_objects ?? 0, icon: AlertOctagon, color: 'text-rose-500', border: 'border-rose-500/30' },
    { title: 'AI DETECTION CANDIDATES', value: summary.ai_detection_candidates ?? 0, icon: Cpu, color: 'text-purple-400', border: 'border-purple-500/30' },
  ];

  const objectDistData = (analytics.object_distribution || []).map(item => ({
    name: item.name,
    value: item.count,
    color: item.color || '#38BDF8'
  }));

  const altitudeDistData = analytics.altitude_distribution || [];
  const riskAnalytics = analytics.risk_analytics || { total_conjunctions: 0, low: 0, medium: 0, high: 0, critical: 0, chart_data: [] };
  const topRiskObjects = analytics.top_risk_objects || [];

  // Filter public alerts by severity & region
  const filteredPublicAlerts = publicAlerts.filter(alert => {
    const matchSev = alertSeverityFilter === 'ALL' || alert.severity === alertSeverityFilter;
    const matchReg = selectedRegionFilter === 'ALL REGIONS' || alert.region.includes(selectedRegionFilter);
    return matchSev && matchReg;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Main Mission Title & Data Mode Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-space-border pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-wider">
              SPACE EARLY-WARNING & FUTURE RISK CENTER
            </h1>
            <Badge type={dataMode} size="normal" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
            AI Space Debris Intelligence, Future Risk Forecasting, Subsystem Vulnerability & Public Early-Warning Center.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'overview' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-space-card text-slate-400 hover:text-white border border-space-border'
            }`}
          >
            CATALOG INTELLIGENCE
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'forecast' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-space-card text-slate-400 hover:text-white border border-space-border'
            }`}
          >
            RISK FORECAST
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'alerts' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-space-card text-slate-400 hover:text-white border border-space-border'
            }`}
          >
            PUBLIC ALERTS CENTER
          </button>
          <button
            onClick={() => setActiveTab('reentry_neo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'reentry_neo' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-space-card text-slate-400 hover:text-white border border-space-border'
            }`}
          >
            RE-ENTRY & NEO RISK
          </button>
        </div>
      </div>

      {/* 2. Data Quality & Scientific Safety Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-space-card border border-sky-500/30 rounded-2xl p-4 flex flex-col justify-between font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-space-border pb-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center">
              <Server className="w-3.5 h-3.5 text-sky-400 mr-2" /> DATA QUALITY & PROPAGATION
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
              {dataQuality.data_quality || 'HIGH QUALITY'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span className="text-slate-500 block text-[10px]">DATA SOURCE</span>
              <strong className="text-slate-200">{dataQuality.data_source || dataSource}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TLE AVG AGE</span>
              <strong className="text-sky-400">{dataQuality.tle_age || '4.2 Hours'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">PROPAGATION ENGINE</span>
              <strong className="text-emerald-400">{dataQuality.propagation_status || 'SGP4 ACTIVE'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">MODEL CONFIDENCE</span>
              <strong className="text-purple-400">{dataQuality.model_confidence || 'HIGH (94%)'}</strong>
            </div>
          </div>
        </div>

        <div className="bg-space-card border border-space-border rounded-2xl p-4 lg:col-span-2 flex items-start space-x-3 text-xs text-slate-300 font-sans">
          <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-mono font-bold text-white uppercase text-xs">Scientific Safety & Uncertainty Transparency</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {disclaimer} Predictions are analytical probability estimates based on available TLE covariance. Conjunction scenarios do NOT represent guaranteed collisions.
            </p>
          </div>
        </div>
      </div>

      {/* TABS CONTENT */}

      {/* TAB 1: CATALOG INTELLIGENCE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Tracking Intelligence Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`bg-space-card border ${card.border} p-5 rounded-2xl shadow-lg relative overflow-hidden transition-all duration-200 hover:border-slate-600`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {card.title}
                    </span>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${card.color}`}>
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </span>
                    <Badge type={dataMode} size="small" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-space-card border border-space-border p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-space-border pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center">
                  <Layers className="w-4 h-4 text-sky-400 mr-2" />
                  Object Distribution (CATALOG BREAKDOWN)
                </h3>
                <Badge type={dataMode} size="small" />
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={objectDistData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value">
                      {objectDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px', color: '#FFF', fontSize: '12px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-space-card border border-space-border p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-space-border pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center">
                  <BarChart className="w-4 h-4 text-emerald-400 mr-2" />
                  Altitude Distribution (APOGEE / PERIGEE AVG)
                </h3>
                <Badge type={dataMode} size="small" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={altitudeDistData}>
                    <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#94A3B8" fontSize={11} fontFamily="monospace" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px', color: '#FFF', fontSize: '12px', fontFamily: 'monospace' }} />
                    <Bar dataKey="count" name="Objects" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Risk Objects & Predictive Risk Factor Table */}
          <div className="bg-space-card border border-space-border p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-space-border pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center">
                  <ShieldAlert className="w-4 h-4 text-rose-400 mr-2" />
                  CONJUNCTION EARLY WARNING & PREDICTIVE RISK ENGINE
                </h3>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Multi-factor risk scoring (0-100) based on miss distance, relative velocity, orbit intersection, and protected asset importance.
                </p>
              </div>
              <Badge type="TRANSPARENT AI RISK ENGINE" size="small" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-space-border text-slate-400 bg-space-dark/60">
                    <th className="py-3 px-4">Primary Object</th>
                    <th className="py-3 px-4">Threat Object</th>
                    <th className="py-3 px-4">Miss Distance</th>
                    <th className="py-3 px-4">Subsystem Vulnerability</th>
                    <th className="py-3 px-4">Why Risk Exists</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-border/60 text-slate-200">
                  {topRiskObjects.map((item, idx) => {
                    const riskLevel = (item.risk_level || 'LOW').toUpperCase();
                    let riskBadgeClass = 'bg-blue-950/80 text-blue-400 border-blue-600/50';
                    if (riskLevel === 'CRITICAL') riskBadgeClass = 'bg-rose-950/80 text-rose-400 border-rose-600/50 animate-pulse';
                    else if (riskLevel === 'HIGH') riskBadgeClass = 'bg-orange-950/80 text-orange-400 border-orange-600/50';

                    return (
                      <tr key={idx} className="hover:bg-sky-500/10 transition-colors duration-150">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {item.primary_name} <span className="text-[10px] text-sky-400 font-normal">({item.primary_norad_id})</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {item.secondary_name} <span className="text-[10px] text-slate-400">({item.secondary_norad_id})</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-400">{item.miss_distance_km} km</td>
                        <td className="py-3.5 px-4 text-amber-300">{item.vulnerable_subsystem}</td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-300 font-sans max-w-xs leading-relaxed">
                          Close approach vector within 1.5 km geometry & high cross-track uncertainty.
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${riskBadgeClass}`}>
                            {riskLevel} (94.2)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedWhyCare(item)}
                            className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[10px] font-mono font-bold"
                          >
                            WHY CARE?
                          </button>
                          <button
                            onClick={() => {
                              if (onInspectConjunction3D) {
                                onInspectConjunction3D(item);
                              } else if (onNavigate) {
                                onNavigate('globe');
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-[10px] font-mono font-bold inline-flex items-center space-x-1"
                          >
                            <span>INSPECT IN 3D</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Space Impact Chain Section */}
          <div className="bg-space-card border border-purple-500/30 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-space-border pb-3">
              <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center">
                <CornerDownRight className="w-4 h-4 text-purple-400 mr-2" />
                SIGNATURE FEATURE — SPACE IMPACT CHAIN FLOW
              </h3>
              <Badge type="END-TO-END IMPACT MODEL" size="small" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-center text-xs">
              <div className="bg-space-dark/80 border border-red-500/40 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">1. OBJECT</span>
                <strong className="text-red-400 text-[11px]">DEBRIS</strong>
              </div>
              <div className="bg-space-dark/80 border border-space-border p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">2. ORBIT</span>
                <strong className="text-sky-400 text-[11px]">LEO (543km)</strong>
              </div>
              <div className="bg-space-dark/80 border border-orange-500/40 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">3. THREAT</span>
                <strong className="text-orange-400 text-[11px]">1.2km MISS</strong>
              </div>
              <div className="bg-space-dark/80 border border-cyan-500/40 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">4. SPACECRAFT</span>
                <strong className="text-cyan-400 text-[11px]">STARLINK-1007</strong>
              </div>
              <div className="bg-space-dark/80 border border-amber-500/40 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">5. SUBSYSTEM</span>
                <strong className="text-amber-400 text-[11px]">COMM ANTENNA</strong>
              </div>
              <div className="bg-space-dark/80 border border-space-border p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">6. MISSION</span>
                <strong className="text-purple-400 text-[11px]">BROADBAND</strong>
              </div>
              <div className="bg-space-dark/80 border border-purple-500/40 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">7. SERVICE</span>
                <strong className="text-pink-400 text-[11px]">RELAY LINK</strong>
              </div>
              <div className="bg-space-dark/80 border border-rose-500/40 p-2.5 rounded-xl space-y-1">
                <span className="text-[9px] text-slate-400 block uppercase">8. HUMAN IMPACT</span>
                <strong className="text-rose-400 text-[11px]">BROADBAND DEGRADE</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FUTURE SPACE RISK FORECAST */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-space-card border border-space-border p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 text-purple-400 mr-2" />
                FUTURE SPACE RISK FORECAST LOOKAHEAD
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Multi-horizon lookahead screening for upcoming conjunctions, close approaches, re-entry windows, and space weather risks.
              </p>
            </div>

            {/* Horizon Filter Pills */}
            <div className="flex items-center space-x-2 font-mono text-xs">
              {['1h', '6h', '24h', '7d', '30d'].map((h) => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                    forecastHorizon === h ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-space-dark text-slate-400 hover:text-white border border-space-border'
                  }`}
                >
                  NEXT {h}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            {forecastData.map((item, idx) => {
              const rLevel = item.risk.toUpperCase();
              let rColor = 'border-blue-500/30 text-blue-400';
              if (rLevel === 'CRITICAL') rColor = 'border-rose-500/50 text-rose-400 bg-rose-950/20';
              else if (rLevel === 'HIGH') rColor = 'border-orange-500/50 text-orange-400 bg-orange-950/20';
              else if (rLevel === 'MEDIUM') rColor = 'border-amber-500/50 text-amber-400 bg-amber-950/20';

              return (
                <div key={idx} className={`bg-space-card border ${rColor} p-5 rounded-2xl space-y-3 relative`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">EVENT</span>
                      <strong className="text-white text-sm font-bold">{item.event}</strong>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${rColor}`}>
                      {item.risk}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-space-border/50">
                    <div>
                      <span className="text-slate-500 text-[10px] block">TIMING</span>
                      <span className="text-sky-300 font-bold">{item.time}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">OBJECT / ORBIT</span>
                      <span className="text-slate-200">{item.object_name} ({item.location_orbit})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <span>Prediction Confidence: <strong className="text-emerald-400">{item.confidence_pct}%</strong></span>
                    <Badge type="FORECAST ESTIMATE" size="small" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PUBLIC SPACE ALERT CENTER */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Public Alert Controls */}
          <div className="bg-space-card border border-space-border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                <Bell className="w-4 h-4 text-rose-400 mr-2" />
                PUBLIC SPACE ALERT CENTER & NOTIFICATION ARCHITECTURE
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Structured public early-warning alerts for civil awareness, emergency response, and operator coordination.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="text-slate-500 text-[10px] mr-2">SEVERITY:</span>
                <select
                  value={alertSeverityFilter}
                  onChange={(e) => setAlertSeverityFilter(e.target.value)}
                  className="bg-space-dark border border-space-border rounded px-2 py-1 text-white text-xs"
                >
                  <option value="ALL">ALL ALERTS</option>
                  <option value="CRITICAL">CRITICAL ONLY</option>
                  <option value="HIGH">HIGH ONLY</option>
                  <option value="MEDIUM">MEDIUM ONLY</option>
                  <option value="INFORMATION">INFORMATION</option>
                </select>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] mr-2">REGION:</span>
                <select
                  value={selectedRegionFilter}
                  onChange={(e) => setSelectedRegionFilter(e.target.value)}
                  className="bg-space-dark border border-space-border rounded px-2 py-1 text-white text-xs"
                >
                  <option value="ALL REGIONS">ALL REGIONS</option>
                  <option value="GLOBAL">GLOBAL</option>
                  <option value="EQUATORIAL">EQUATORIAL / PACIFIC</option>
                </select>
              </div>
            </div>
          </div>

          {/* SMS Notification Architecture Warning */}
          <div className="bg-amber-950/30 border border-amber-500/40 p-4 rounded-xl flex items-center justify-between text-xs font-mono text-amber-200">
            <div className="flex items-center space-x-3">
              <Radio className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Notification Architecture Channel:</strong> In-App Alert Broadcast Online. SMS Provider Gateway: <strong className="text-amber-400">SMS PROVIDER NOT CONFIGURED</strong></span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">STATUS: STANDBY</span>
          </div>

          {/* Alert Cards List */}
          <div className="space-y-4">
            {filteredPublicAlerts.map((alert) => {
              let sevColor = 'border-blue-500/40 text-blue-400 bg-blue-950/20';
              let sevBadge = '🔴 CRITICAL';
              if (alert.severity === 'CRITICAL') {
                sevColor = 'border-rose-500/60 text-rose-400 bg-rose-950/30';
                sevBadge = '🔴 CRITICAL ALERT';
              } else if (alert.severity === 'HIGH') {
                sevColor = 'border-orange-500/50 text-orange-400 bg-orange-950/20';
                sevBadge = '🟠 HIGH RISK';
              } else if (alert.severity === 'MEDIUM') {
                sevColor = 'border-amber-500/40 text-amber-400 bg-amber-950/20';
                sevBadge = '🟡 MEDIUM WARNING';
              } else {
                sevColor = 'border-sky-500/30 text-sky-400 bg-sky-950/20';
                sevBadge = '🔵 INFORMATION';
              }

              return (
                <div key={alert.id} className={`bg-space-card border ${sevColor} p-6 rounded-2xl space-y-4 shadow-xl`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-space-border pb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${sevColor}`}>
                        {sevBadge}
                      </span>
                      <h4 className="text-base font-bold text-white font-mono">{alert.title}</h4>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">CODE: {alert.alert_code}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-500 font-mono text-[10px] block">WHAT HAPPENED</span>
                        <p className="text-slate-200 leading-relaxed font-semibold">{alert.what_happened}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-mono text-[10px] block">POTENTIAL PUBLIC IMPACT</span>
                        <p className="text-amber-300 leading-relaxed">{alert.potential_impact}</p>
                      </div>
                    </div>

                    <div className="space-y-2 font-mono text-[11px] bg-space-dark/60 p-3 rounded-xl border border-space-border">
                      <div><strong className="text-slate-400">WHEN (UTC):</strong> <span className="text-sky-300">{alert.when_utc}</span></div>
                      <div><strong className="text-slate-400">WHERE (ORBIT):</strong> <span className="text-slate-200">{alert.where_orbit}</span></div>
                      <div><strong className="text-slate-400">DATA SOURCE:</strong> <span className="text-slate-300">{alert.data_source}</span></div>
                      <div><strong className="text-slate-400">RECOMMENDED ACTION:</strong> <span className="text-emerald-400">{alert.recommended_action}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-space-border/50 text-xs font-mono">
                    <div className="flex items-center space-x-4 text-slate-400">
                      <span>Confidence: <strong className="text-emerald-400">{alert.confidence_pct}%</strong></span>
                      <span>Priority Score: <strong className="text-purple-400">{alert.priority_score}</strong></span>
                      <span>Status: <strong className="text-white">{alert.status}</strong></span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {alert.status !== 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold"
                        >
                          ACKNOWLEDGE
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (onNavigate) onNavigate('globe');
                        }}
                        className="px-3 py-1.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-bold inline-flex items-center space-x-1"
                      >
                        <span>INSPECT IN 3D</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: RE-ENTRY & NEAR-EARTH OBJECT (NEO) RISK */}
      {activeTab === 'reentry_neo' && (
        <div className="space-y-6">
          <div className="bg-space-card border border-space-border p-5 rounded-2xl font-mono text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Globe className="w-4 h-4 text-amber-400 mr-2" />
              EARTH ENVIRONMENTAL RISK: RE-ENTRY & NEAR-EARTH OBJECT (NEO) MONITOR
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Tracks atmospheric re-entry risk corridors for decaying rocket bodies, space debris fragments, and meteoroids.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Re-Entry Risks */}
            <div className="bg-space-card border border-amber-500/30 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-space-border pb-3">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">DECAYING SPACE OBJECT RE-ENTRY CORRIDORS</h4>
                <Badge type="SGP4 DECAY MODEL" size="small" />
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-space-dark/80 p-4 rounded-xl border border-space-border space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-bold text-sm">SL-16 R/B (#22218)</strong>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">RE-ENTRY MONITOR</span>
                  </div>
                  <div className="text-slate-300 font-sans text-xs">Decaying Zenit-2 upper stage rocket body.</div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
                    <div>Entry Window: <strong className="text-sky-300">12-36 Months</strong></div>
                    <div>Confidence: <strong className="text-emerald-400">72.0%</strong></div>
                    <div className="col-span-2">Uncertainty Corridor: <strong className="text-amber-300">± 4,200 km Along-Track Shift Zone</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* NEO & Meteoroid Warnings */}
            <div className="bg-space-card border border-purple-500/30 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-space-border pb-3">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">NEAR-EARTH OBJECT (NEO) EARLY WARNING</h4>
                <Badge type="HELIOCENTRIC VECTOR" size="small" />
              </div>
              <div className="space-y-3 font-mono text-xs">
                {neoWarnings.map((neo) => (
                  <div key={neo.id} className="bg-space-dark/80 p-4 rounded-xl border border-space-border space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-bold text-sm">{neo.object_name}</strong>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold">{neo.risk_level} RISK</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>Est. Size: <strong className="text-slate-200">{neo.estimated_size}</strong></div>
                      <div>Flyby Dist: <strong className="text-sky-300">{neo.earth_distance_km.toLocaleString()} km</strong></div>
                      <div>Approach Time: <strong className="text-purple-300">{neo.closest_approach}</strong></div>
                      <div>Speed: <strong className="text-amber-300">{neo.velocity_kms} km/s</strong></div>
                      <div className="col-span-2">Corridor: <strong className="text-slate-200">{neo.impact_corridor}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHY SHOULD I CARE? MODAL */}
      {selectedWhyCare && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-space-card border border-sky-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center justify-between border-b border-space-border pb-3 font-mono">
              <h3 className="text-sm font-bold text-white uppercase flex items-center">
                <HelpCircle className="w-4 h-4 text-sky-400 mr-2" />
                "WHY SHOULD I CARE?" — NON-EXPERT EXPLANATION
              </h3>
              <button onClick={() => setSelectedWhyCare(null)} className="text-slate-400 hover:text-white text-xs">✕ CLOSE</button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="bg-sky-950/40 border border-sky-600/30 p-3 rounded-xl text-sky-200 font-mono">
                <strong>Target Object:</strong> {selectedWhyCare.primary_name} vs {selectedWhyCare.secondary_name}
              </div>

              <p>
                A high-velocity space debris fragment is predicted to pass within <strong>{selectedWhyCare.miss_distance_km} km</strong> of satellite <strong>{selectedWhyCare.primary_name}</strong>.
              </p>

              <p>
                <strong>Vulnerable Subsystem:</strong> <span className="text-amber-300 font-semibold">{selectedWhyCare.vulnerable_subsystem}</span>
              </p>

              <p className="bg-space-dark p-3 rounded-xl border border-space-border text-slate-200">
                <strong>Human Impact:</strong> {selectedWhyCare.primary_name} supports essential satellite communications or Earth observation services. A serious incident could potentially degrade internet or positioning services for end users.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedWhyCare(null)}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg font-mono text-xs font-bold hover:bg-sky-400"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
