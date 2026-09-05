import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, AlertTriangle, Activity, CheckCircle2, Radio, Server, Info } from 'lucide-react';
import Badge from './Badge';
import { fetchConstellations as fetchConstellationsApi } from '../api/client';

export default function ConstellationView({ onSelectSat }) {
  const [constellations, setConstellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConstellations();
  }, []);

  const loadConstellations = async () => {
    try {
      setLoading(true);
      const data = await fetchConstellationsApi();
      setConstellations(data);
      setError(null);
    } catch (err) {
      console.error('Constellation fetch error:', err);
      setError('Unable to load constellation metrics from backend API.');
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (status) => {
    switch (status) {
      case 'EXCELLENT':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center space-x-1"><CheckCircle2 className="w-3 h-3" /><span>EXCELLENT</span></span>;
      case 'STABLE':
        return <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center space-x-1"><ShieldCheck className="w-3 h-3" /><span>STABLE</span></span>;
      case 'AT RISK':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center space-x-1"><AlertTriangle className="w-3 h-3" /><span>AT RISK</span></span>;
      default:
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center space-x-1"><Activity className="w-3 h-3" /><span>DEGRADED</span></span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-space-card/80 backdrop-blur-md border border-space-border rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30">
              <Server className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">CONSTELLATIONS & MISSIONS</h1>
              <p className="text-xs text-slate-400 font-sans">Fleet health, debris classification, and mission operational safety tracking</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded">
            OPERATIONAL FLEET TRACKING
          </span>
          <Badge type="DATA MODE: DEMO" />
        </div>
      </div>

      {/* Loading & Error State */}
      {loading ? (
        <div className="bg-space-card/60 border border-space-border rounded-xl p-12 text-center font-mono text-sky-400 space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs tracking-widest uppercase">Querying constellation health telemetry...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center font-mono text-red-400 text-xs">
          {error}
        </div>
      ) : (
        <>
          {/* Constellations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {constellations.map((item, idx) => (
              <div
                key={idx}
                className="bg-space-card/90 backdrop-blur-md border border-space-border hover:border-sky-500/50 rounded-xl p-5 space-y-4 transition-all duration-200 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-space-dark border border-space-border flex items-center justify-center">
                      <Layers className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white font-mono">{item.name}</h2>
                      <p className="text-[11px] text-slate-400 font-sans">{item.primary_function}</p>
                    </div>
                  </div>
                  {getHealthBadge(item.health_status)}
                </div>

                {/* Health Meter Progress Bar */}
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 text-[10px]">CONSTELLATION HEALTH SCORE</span>
                    <span className="text-sky-400 font-bold text-[11px]">{item.health_score}%</span>
                  </div>
                  <div className="w-full bg-space-dark h-2 rounded-full overflow-hidden border border-space-border">
                    <div
                      className={`h-full transition-all duration-500 ${
                        item.health_score >= 90 ? 'bg-emerald-400' :
                        item.health_score >= 75 ? 'bg-sky-400' :
                        item.health_score >= 60 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${item.health_score}%` }}
                    />
                  </div>
                </div>

                {/* Breakdown Pills */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                  <div className="bg-space-dark/80 border border-space-border p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400">TOTAL</div>
                    <div className="text-sm font-bold text-white mt-0.5">{item.total_objects}</div>
                  </div>
                  <div className="bg-space-dark/80 border border-emerald-500/20 p-2 rounded-lg">
                    <div className="text-[10px] text-emerald-400">PAYLOADS</div>
                    <div className="text-sm font-bold text-emerald-300 mt-0.5">{item.active_satellites}</div>
                  </div>
                  <div className="bg-space-dark/80 border border-red-500/20 p-2 rounded-lg">
                    <div className="text-[10px] text-red-400">DEBRIS</div>
                    <div className="text-sm font-bold text-red-300 mt-0.5">{item.debris_count}</div>
                  </div>
                </div>

                {/* Risk Summary */}
                <div className="p-3 rounded-lg bg-space-dark/60 border border-space-border flex items-start space-x-2 text-xs">
                  <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-[11px] font-sans leading-relaxed">{item.risk_summary}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Extended Debris Classification Reference */}
          <div className="bg-space-card/80 backdrop-blur-md border border-space-border rounded-xl p-6 font-mono space-y-4">
            <div className="flex items-center space-x-2 border-b border-space-border pb-3">
              <Radio className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">DEBRIS TYPE CLASSIFICATION SCHEME</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-space-dark border border-red-500/30 rounded-lg space-y-1">
                <span className="text-red-400 font-bold text-[11px]">FRAGMENTATION DEBRIS</span>
                <p className="text-slate-300 text-[11px] font-sans">High-count small kinetic fragments resulting from past collisions or energetic anti-satellite tests.</p>
              </div>
              <div className="p-3 bg-space-dark border border-amber-500/30 rounded-lg space-y-1">
                <span className="text-amber-400 font-bold text-[11px]">ROCKET BODY (SPENT STAGES)</span>
                <p className="text-slate-300 text-[11px] font-sans">Large abandoned rocket upper stages remaining in drift orbits, prone to gradual orbital decay.</p>
              </div>
              <div className="p-3 bg-space-dark border border-purple-500/30 rounded-lg space-y-1">
                <span className="text-purple-400 font-bold text-[11px]">DEFUNCT SATELLITES</span>
                <p className="text-slate-300 text-[11px] font-sans">Non-operational defunct spacecraft without active attitude control, presenting high-cross section risk.</p>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
