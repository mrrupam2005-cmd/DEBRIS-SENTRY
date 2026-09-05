import React, { useState, useEffect } from 'react';
import { Sun, Radio, Activity, AlertTriangle, ShieldCheck, Wifi, CloudSun, Info } from 'lucide-react';
import Badge from './Badge';
import { fetchSpaceEnvironment, fetchCommunicationRisks } from '../api/client';

export default function SpaceEnvironmentView() {
  const [spaceEnv, setSpaceEnv] = useState(null);
  const [commRisks, setCommRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpaceEnvironmentData();
  }, []);

  const fetchSpaceEnvironmentData = async () => {
    try {
      setLoading(true);
      const [envData, commData] = await Promise.all([
        fetchSpaceEnvironment().catch(() => []),
        fetchCommunicationRisks().catch(() => [])
      ]);

      if (envData && envData.length > 0) setSpaceEnv(envData[0]);
      if (commData) setCommRisks(commData);
    } catch (err) {
      console.error('Space Environment fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NORMAL':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center space-x-1"><ShieldCheck className="w-3 h-3" /><span>NOMINAL / NORMAL</span></span>;
      case 'DEGRADED':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center space-x-1"><AlertTriangle className="w-3 h-3" /><span>DEGRADED LINK</span></span>;
      default:
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center space-x-1"><Activity className="w-3 h-3" /><span>AT RISK</span></span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-space-card/80 backdrop-blur-md border border-space-border rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <Sun className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">SPACE WEATHER & COMM RISK</h1>
              <p className="text-xs text-slate-400 font-sans">Solar activity, geomagnetic KP index, atmospheric drag, and spacecraft telemetry link safety</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge type="DEMO / ESTIMATED DATA" />
        </div>
      </div>

      {/* Mandatory Demo / Estimated Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs font-mono">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">DEMO / ESTIMATED DATA NOTICE:</span>
          <span className="text-slate-300 font-sans ml-1.5 leading-relaxed">
            Space environment parameters and mission communication link statuses are simulated estimates based on prototype space weather indicators.
          </span>
        </div>
      </div>

      {loading ? (
        <div className="bg-space-card/60 border border-space-border rounded-xl p-12 text-center font-mono text-amber-400 space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs tracking-widest uppercase">Querying space weather indicators...</p>
        </div>
      ) : (
        <>
          {/* Space Environment Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
            <div className="bg-space-card/90 border border-space-border rounded-xl p-4 space-y-1">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>SOLAR FLARE CLASS</span>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-amber-300">{spaceEnv?.solar_flare_class || 'C1.2'}</div>
              <div className="text-[10px] text-emerald-400">Low Solar X-Ray Flux</div>
            </div>

            <div className="bg-space-card/90 border border-space-border rounded-xl p-4 space-y-1">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>GEOMAGNETIC KP INDEX</span>
                <Activity className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-bold text-sky-300">{spaceEnv?.geomagnetic_kp || 2.3} / 9.0</div>
              <div className="text-[10px] text-sky-400">Quiet Geomagnetic Field</div>
            </div>

            <div className="bg-space-card/90 border border-space-border rounded-xl p-4 space-y-1">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>RADIATION STORM</span>
                <CloudSun className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-lg font-bold text-indigo-300">{spaceEnv?.radiation_storm_level || 'S1 - Minor'}</div>
              <div className="text-[10px] text-slate-400">Proton Flux Nominal</div>
            </div>

            <div className="bg-space-card/90 border border-space-border rounded-xl p-4 space-y-1">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>ATMOSPHERIC DRAG</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-amber-300">{spaceEnv?.atmospheric_drag_risk || 'MODERATE'}</div>
              <div className="text-[10px] text-amber-400">Elevated Thermosphere Density</div>
            </div>

            <div className="bg-space-card/90 border border-space-border rounded-xl p-4 space-y-1">
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>MICROMETEOROID FLUX</span>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-emerald-300">{spaceEnv?.micrometeoroid_flux || 'NOMINAL'}</div>
              <div className="text-[10px] text-emerald-400">Standard Background Background</div>
            </div>
          </div>

          {/* Mission Communication Risk Table */}
          <div className="bg-space-card/90 backdrop-blur-md border border-space-border rounded-xl p-6 font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-space-border pb-3">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">MISSION COMMUNICATION & TELEMETRY LINK RISKS</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Updated: Real-time Telemetry Monitor</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-space-border/60 text-slate-400 text-[10px] uppercase">
                    <th className="py-3 px-3">MISSION / FLEET</th>
                    <th className="py-3 px-3">ORBITAL PROFILE</th>
                    <th className="py-3 px-3">CONNECTIVITY STATUS</th>
                    <th className="py-3 px-3">PRIMARY CAUSE SUMMARY</th>
                    <th className="py-3 px-3">MODEL CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-border/40">
                  {commRisks.map((item) => (
                    <tr key={item.id} className="hover:bg-space-border/30 transition">
                      <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                        <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{item.mission_name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{item.mission_profile}</td>
                      <td className="py-3 px-3">{getStatusBadge(item.connectivity_status)}</td>
                      <td className="py-3 px-3 text-slate-300 font-sans text-[11px] max-w-xs leading-relaxed">
                        {item.cause_summary}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        <span className="bg-space-dark border border-space-border px-2 py-0.5 rounded text-[10px]">
                          {item.confidence} Confidence
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
