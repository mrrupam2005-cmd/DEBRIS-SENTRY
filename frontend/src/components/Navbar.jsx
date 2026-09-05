import React, { useState } from 'react';
import { Globe, Satellite, AlertTriangle, Cpu, BarChart2, RefreshCw, Radio, Bell, CheckCircle2, ShieldAlert, Server, Sun } from 'lucide-react';
import Badge from './Badge';

export default function Navbar({ activeTab, setActiveTab, onSyncLive, isSyncing, sourceMode, alerts = [], onReviewAlert, isBackendOnline = true }) {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const navItems = [
    { id: 'globe', label: '3D Orbit View', icon: Globe },
    { id: 'satellites', label: 'Satellite & Debris Catalog', icon: Satellite },
    { id: 'conjunctions', label: 'Conjunction Assessment', icon: AlertTriangle },
    { id: 'constellations', label: 'Constellations & Missions', icon: Server },
    { id: 'spaceweather', label: 'Space Weather & Comm Risk', icon: Sun },
    { id: 'detection', label: 'AI Debris Detection', icon: Cpu },
    { id: 'analytics', label: 'Early-Warning & Risk Center', icon: BarChart2 },
  ];

  const unreadAlerts = alerts.filter(a => !a.is_reviewed);

  return (
    <header className="bg-space-card/90 backdrop-blur-md border-b border-space-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('globe')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-space-dark rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wider text-white font-mono">DEBRIS-SENTRY</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-mono font-semibold">v1.0</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI Space Debris Detection & SSA Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-border/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System Control Actions & Alert Drawer */}
          <div className="flex items-center space-x-3 relative">
            <div className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
              isBackendOnline ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40' : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
            }`}>
              {isBackendOnline ? 'BACKEND: ONLINE (127.0.0.1:8000)' : 'BACKEND: OFFLINE (DEMO MODE)'}
            </div>
            <Badge type={sourceMode} size="normal" />

            {/* Operational Alert Bell Drawer Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                className="relative p-2 rounded-lg bg-space-border/60 hover:bg-space-border text-slate-300 transition"
                title="Operational Safety Alerts"
              >
                <Bell className="w-4 h-4 text-sky-400" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadAlerts.length}
                  </span>
                )}
              </button>

              {/* Alert Drawer Dropdown */}
              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-space-card/95 backdrop-blur-md border border-space-border rounded-xl shadow-2xl p-4 z-50 space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-space-border pb-2">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-white tracking-wider">OPERATIONAL ALERTS</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {unreadAlerts.length} Active Unreviewed
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                    {alerts.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No active operational alerts.</p>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-lg border transition ${
                            alert.is_reviewed
                              ? 'bg-space-dark/40 border-space-border opacity-60'
                              : alert.category === 'CRITICAL'
                              ? 'bg-red-500/10 border-red-500/40 text-red-200'
                              : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              alert.category === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                            }`}>
                              {alert.category}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {alert.miss_distance_km ? `${alert.miss_distance_km} km miss` : ''}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-white mt-1.5">{alert.title}</p>
                          <p className="text-[11px] text-slate-300 mt-1 font-sans leading-relaxed">{alert.message}</p>

                          {!alert.is_reviewed && (
                            <button
                              onClick={() => onReviewAlert && onReviewAlert(alert.id)}
                              className="mt-2.5 flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-space-dark px-2 py-1 rounded border border-emerald-500/30 transition"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>MARK AS REVIEWED</span>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onSyncLive}
              disabled={isSyncing}
              title="Sync live TLEs from CelesTrak"
              className="flex items-center space-x-1.5 bg-space-border/80 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-md border border-slate-700 transition-all font-mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">{isSyncing ? 'Syncing...' : 'Sync CelesTrak'}</span>
            </button>
          </div>

        </div>
      </div>
      
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-space-border/50 space-x-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                isActive ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
