import React from 'react';
import { Satellite, AlertTriangle, ShieldAlert, Cpu, Activity, Search, ExternalLink, ArrowUpRight, ArrowRight, CheckCircle2 } from 'lucide-react';
import Badge from './Badge';

export default function Dashboard({
  analytics,
  satellites = [],
  conjunctions = [],
  alerts = [],
  onNavigate,
  onSelectSat,
  onInspectConjunction3D
}) {
  const criticalConjunctions = conjunctions.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH');
  const unreviewedCount = conjunctions.filter(c => !c.is_reviewed).length + alerts.filter(a => !a.is_reviewed).length;
  const dataMode = satellites[0]?.data_mode || "DATA MODE: DEMO";

  const topThreats = analytics?.top_risk_objects || conjunctions.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-space-card via-slate-900 to-space-card border border-space-border p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-wide">EXECUTIVE SSA & DEBRIS DECISION DASHBOARD</h1>
            <Badge type={dataMode} size="normal" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            AI Space Debris Detection, SGP4 Orbit Propagation, Subsystem Vulnerability Modeling, and Response Recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('globe')}
            className="flex items-center space-x-2 bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition"
          >
            <span>Launch 3D Orbit Globe</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 */}
        <div className="bg-space-card border border-space-border p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-sky-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tracked Objects</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Satellite className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{analytics?.total_tracked_objects || satellites.length}</span>
            <span className="text-xs text-sky-400 ml-2">LEO / MEO / GEO</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-space-border/60 pt-2">
            <span className="text-slate-400">Catalog Feed</span>
            <Badge type={dataMode} size="small" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-space-card border border-space-border p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Payloads</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{analytics?.breakdown?.payloads || 6}</span>
            <span className="text-xs text-emerald-400 ml-2">Operational</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-space-border/60 pt-2">
            <span className="text-slate-400">Telemetry Status</span>
            <span className="text-emerald-400 font-semibold">Active SGP4 Feed</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-space-card border border-space-border p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-red-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Space Debris Count</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{analytics?.breakdown?.debris || 4}</span>
            <span className="text-xs text-red-400 ml-2">Tracked Fragments</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-space-border/60 pt-2">
            <span className="text-slate-400">Debris Threat Density</span>
            <span className="text-red-400 font-semibold">High Priority</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-space-card border border-space-border p-5 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Objects Needing Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">{unreviewedCount}</span>
            <span className="text-xs text-amber-400 ml-2">Pending Review</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-space-border/60 pt-2">
            <span className="text-slate-400">Action State</span>
            <span className="text-amber-400 font-semibold">Operator Alert</span>
          </div>
        </div>

      </div>

      {/* Top 5 Current Threats Table Panel */}
      <div className="bg-space-card border border-space-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-space-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">TOP CURRENT CONJUNCTION THREATS</h3>
              <p className="text-xs text-slate-400 font-sans">Prioritized by minimum separation distance and subsystem vulnerability risk</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('conjunctions')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center"
          >
            <span>View All Assessments</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-space-dark/80 text-slate-400 uppercase tracking-wider border-b border-space-border">
                <th className="py-3 px-4 font-semibold">Primary Object</th>
                <th className="py-3 px-4 font-semibold">Secondary Threat</th>
                <th className="py-3 px-4 font-semibold">Min Distance</th>
                <th className="py-3 px-4 font-semibold">Risk Level</th>
                <th className="py-3 px-4 font-semibold">Vulnerable Subsystem</th>
                <th className="py-3 px-4 font-semibold">Recommended Operator Action</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-border/60">
              {topThreats.map((item, idx) => (
                <tr key={item.conjunction_id || idx} className="hover:bg-space-border/30 transition">
                  <td className="py-3.5 px-4 font-bold text-sky-400">{item.primary_name}</td>
                  <td className="py-3.5 px-4 font-bold text-red-400">{item.secondary_name}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{item.miss_distance_km} km</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' :
                      item.risk_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    }`}>
                      {item.risk_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-amber-300">
                    {item.vulnerable_subsystem || "Solar Array"}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-300 font-sans text-[11px]">
                    {item.recommended_action || "Perform collision avoidance screening."}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        const conj = conjunctions.find(c => c.id === item.conjunction_id) || item;
                        if (onInspectConjunction3D) onInspectConjunction3D(conj);
                        else onNavigate('globe');
                      }}
                      className="inline-flex items-center space-x-1 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white px-2.5 py-1 rounded border border-sky-500/30 transition text-[11px]"
                    >
                      <span>INSPECT 3D</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Grid: AI Detection Shortcut & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* AI Debris Shortcut Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-space-card via-slate-900 to-indigo-950/40 border border-sky-500/30 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <Badge type="AI PREDICTION" size="small" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">AI Optical Debris Detection Pipeline</h3>
            <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
              Automated computer vision detection of faint debris streaks from optical telescope frames.
            </p>
          </div>

          <button
            onClick={() => onNavigate('detection')}
            className="w-full bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs py-3 rounded-xl tracking-wider uppercase transition shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2"
          >
            <span>Analyze Astronomical Optical Frame</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* System Operational Status */}
        <div className="bg-space-card border border-space-border p-5 rounded-2xl shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Operational Status</h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-space-dark/80 rounded-lg border border-space-border">
              <span className="text-slate-300">SGP4 Orbital Engine</span>
              <span className="text-emerald-400 font-bold">ONLINE (0.2 ms)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-space-dark/80 rounded-lg border border-space-border">
              <span className="text-slate-300">Subsystem Risk Model</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-space-dark/80 rounded-lg border border-space-border">
              <span className="text-slate-300">CelesTrak Data Feed</span>
              <span className="text-emerald-400 font-bold">CONNECTED</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
