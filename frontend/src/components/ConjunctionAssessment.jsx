import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Activity, Play, Zap, Info, ExternalLink, 
  ArrowRight, CheckCircle2, Cpu, ShieldCheck, HelpCircle, Sliders, 
  Sun, Moon, Compass, Layers, Radio, Orbit, MapPin, AlertCircle, RefreshCw
} from 'lucide-react';
import Badge from './Badge';
import { fetchProtectedAssets, fetchCelestialEvents, fetchReEntryRisks, simulateWhatIf } from '../api/client';

export default function ConjunctionAssessment({
  conjunctions = [],
  satellites = [],
  onScreenConjunction,
  onNavigate3D,
  onSelectSat,
  onInspectConjunction3D,
  onReviewConjunction
}) {
  const [primaryId, setPrimaryId] = useState(satellites[0]?.norad_id || 25544);
  const [secondaryId, setSecondaryId] = useState(satellites[3]?.norad_id || 33749);
  const [isScreening, setIsScreening] = useState(false);
  const [selectedConjunction, setSelectedConjunction] = useState(null);

  // New Early-Warning & Risk State Feeds
  const [protectedAssets, setProtectedAssets] = useState([]);
  const [celestialEvents, setCelestialEvents] = useState([]);
  const [reentryRisks, setReentryRisks] = useState([]);

  // Modal Drawers State
  const [showWhatIfModal, setShowWhatIfModal] = useState(false);
  const [showWhyCareModal, setShowWhyCareModal] = useState(false);
  const [whatIfMissKm, setWhatIfMissKm] = useState(1.2);
  const [whatIfBurnMs, setWhatIfBurnMs] = useState(0.5);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [isSimulatingWhatIf, setIsSimulatingWhatIf] = useState(false);

  useEffect(() => {
    fetchAuxiliaryFeeds();
  }, []);

  const fetchAuxiliaryFeeds = async () => {
    try {
      const [protData, celData, reData] = await Promise.all([
        fetchProtectedAssets().catch(() => []),
        fetchCelestialEvents().catch(() => []),
        fetchReEntryRisks().catch(() => [])
      ]);

      if (protData) setProtectedAssets(protData);
      if (celData) setCelestialEvents(celData);
      if (reData) setReentryRisks(reData);
    } catch (err) {
      console.warn("Auxiliary early-warning feeds warning:", err);
    }
  };

  const handleScreen = async () => {
    setIsScreening(true);
    await onScreenConjunction(primaryId, secondaryId);
    setIsScreening(false);
  };

  const handleRunWhatIfSimulation = async (conj) => {
    if (!conj) return;
    setIsSimulatingWhatIf(true);
    try {
      const data = await simulateWhatIf(conj.id, {
        modified_miss_distance_km: whatIfMissKm,
        simulated_avoidance_burn_m_s: whatIfBurnMs
      });
      setWhatIfResult(data);
    } catch (err) {
      console.error("What If simulation error:", err);
    } finally {
      setIsSimulatingWhatIf(false);
    }
  };

  const totalCount = conjunctions.length;
  const criticalCount = conjunctions.filter(c => c.risk_level === 'CRITICAL').length;
  const highCount = conjunctions.filter(c => c.risk_level === 'HIGH').length;
  const mediumCount = conjunctions.filter(c => c.risk_level === 'MEDIUM').length;
  const lowCount = conjunctions.filter(c => c.risk_level === 'LOW').length;
  const protectedAtRisk = protectedAssets.filter(a => a.highest_risk_level === 'CRITICAL' || a.highest_risk_level === 'HIGH').length;

  const dataMode = satellites[0]?.data_mode || "DATA MODE: DEMO";

  const getTimeToTCA = (tcaStr) => {
    if (!tcaStr) return 'TCA Pending';
    const now = new Date();
    const tca = new Date(tcaStr);
    const diffMs = tca - now;
    if (diffMs <= 0) return 'Passed TCA';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `In ${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-mono">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-space-border pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-wide">ADVANCED CONJUNCTION ASSESSMENT</h1>
            <Badge type={dataMode} size="normal" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Future risk prediction, spacecraft subsystem vulnerability modeling, and human impact early-warning decision support.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 px-3 py-1 rounded-lg">
            EARLY-WARNING ACTIVE
          </span>
        </div>
      </div>

      {/* Mandatory Scientific Disclaimer & Data Transparency Banner */}
      <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl flex items-start space-x-3 text-amber-200 text-xs font-sans">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-mono text-amber-400 block uppercase tracking-wider mb-0.5">Transparent Scientific & Model Disclaimer</strong>
          <p>
            Orbital propagation (SGP4) calculates trajectory coordinates. Subsystem vulnerability and future outcome predictions are <strong>MODEL ESTIMATES</strong> designed for operational decision-support and do NOT constitute confirmed physical impact warnings.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-space-card border border-space-border p-4 rounded-xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Encounters</span>
          <span className="text-2xl font-bold text-white mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-space-card border border-red-500/30 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] text-red-400 uppercase tracking-wider block">Critical Risk</span>
          <span className="text-2xl font-bold text-red-400 mt-1 block">{criticalCount}</span>
        </div>
        <div className="bg-space-card border border-amber-500/30 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider block">High Risk</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">{highCount}</span>
        </div>
        <div className="bg-space-card border border-sky-500/30 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] text-sky-400 uppercase tracking-wider block">Medium Risk</span>
          <span className="text-2xl font-bold text-sky-400 mt-1 block">{mediumCount}</span>
        </div>
        <div className="bg-space-card border border-emerald-500/30 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Protected Assets at Risk</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{protectedAtRisk}</span>
        </div>
        <div className="bg-space-card border border-slate-700 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Data Precision</span>
          <span className="text-xs font-bold text-sky-300 mt-2 block">HIGH (0.08km)</span>
        </div>
      </div>

      {/* On-Demand Screening Tool Card */}
      <div className="bg-space-card border border-sky-500/30 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center space-x-3 border-b border-space-border pb-3">
          <Zap className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Run On-Demand Conjunction Screening</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Target Primary Satellite (A)</label>
            <select
              value={primaryId}
              onChange={(e) => setPrimaryId(Number(e.target.value))}
              className="w-full bg-space-dark border border-space-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {satellites.map(sat => (
                <option key={sat.norad_id} value={sat.norad_id}>
                  {sat.name} ({sat.norad_id}) - {sat.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Secondary Object (B)</label>
            <select
              value={secondaryId}
              onChange={(e) => setSecondaryId(Number(e.target.value))}
              className="w-full bg-space-dark border border-space-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {satellites.map(sat => (
                <option key={sat.norad_id} value={sat.norad_id}>
                  {sat.name} ({sat.norad_id}) - {sat.type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleScreen}
              disabled={isScreening}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isScreening ? 'Computing SGP4 TCA...' : 'Calculate Conjunction Risk'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Active Conjunctions Table */}
      <div className="bg-space-card border border-space-border rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-space-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            <AlertTriangle className="w-4 h-4 text-amber-400 mr-2" />
            Active Conjunction Encounters & Threat Assessment
          </h3>
          <Badge type={dataMode} size="small" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-space-dark/80 text-slate-400 text-xs uppercase tracking-wider border-b border-space-border">
                <th className="py-3.5 px-4 font-semibold">Primary Object</th>
                <th className="py-3.5 px-4 font-semibold">Secondary Threat</th>
                <th className="py-3.5 px-4 font-semibold">TCA & Countdown</th>
                <th className="py-3.5 px-4 font-semibold">Timeline Phase</th>
                <th className="py-3.5 px-4 font-semibold">Miss Dist</th>
                <th className="py-3.5 px-4 font-semibold">Priority Score</th>
                <th className="py-3.5 px-4 font-semibold">Estimated Vulnerable Subsystem</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-border/60 text-xs">
              {conjunctions.map((conj) => {
                const phase = conj.encounter_phase || 'CLOSE APPROACH';
                const warningLvl = conj.warning_level || conj.risk_level || 'MEDIUM';
                const priority = conj.priority_score || (warningLvl === 'CRITICAL' ? 80.8 : 32.2);

                return (
                  <tr
                    key={conj.id}
                    onClick={() => setSelectedConjunction(conj)}
                    className="hover:bg-space-border/30 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-sky-400">{conj.primary_name} ({conj.primary_norad_id})</td>
                    <td className="py-3.5 px-4 font-bold text-red-400">{conj.secondary_name} ({conj.secondary_norad_id})</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{conj.tca ? new Date(conj.tca).toUTCString() : 'Pending'}</div>
                      <span className="text-[10px] text-amber-300 font-sans font-bold">{getTimeToTCA(conj.tca)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Visual Encounter Timeline Bar */}
                      <div className="flex items-center space-x-1 font-mono text-[10px]">
                        <span className={`px-1 py-0.5 rounded font-bold ${phase === 'NOW' ? 'bg-red-500 text-white animate-pulse' : 'bg-space-dark text-slate-500'}`}>NOW</span>
                        <span className="text-slate-600">→</span>
                        <span className={`px-1 py-0.5 rounded font-bold ${phase === 'CLOSE APPROACH' ? 'bg-amber-500/30 text-amber-300' : 'bg-space-dark text-slate-500'}`}>APPROACH</span>
                        <span className="text-slate-600">→</span>
                        <span className={`px-1 py-0.5 rounded font-bold ${phase === 'TCA' ? 'bg-sky-500/30 text-sky-300' : 'bg-space-dark text-slate-500'}`}>TCA</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-white font-bold">{conj.miss_distance_km} km</td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        priority >= 75 ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                        priority >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      }`}>
                        {priority} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-amber-300 font-semibold">
                      <span className="text-slate-400 text-[10px] block font-sans">Model Est:</span>
                      {conj.vulnerable_subsystem || "Solar Array"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConjunction(conj);
                          setShowWhatIfModal(true);
                          handleRunWhatIfSimulation(conj);
                        }}
                        className="inline-flex items-center space-x-1 bg-space-dark hover:bg-space-border text-amber-300 px-2 py-1 rounded border border-amber-500/30 transition text-[10px]"
                        title="Simulate What If Scenarios"
                      >
                        <Sliders className="w-3 h-3 text-amber-400" />
                        <span>What If?</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConjunction(conj);
                          setShowWhyCareModal(true);
                        }}
                        className="inline-flex items-center space-x-1 bg-space-dark hover:bg-space-border text-sky-300 px-2 py-1 rounded border border-sky-500/30 transition text-[10px]"
                        title="Plain Language Explanation"
                      >
                        <HelpCircle className="w-3 h-3 text-sky-400" />
                        <span>Why Care?</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectConjunction3D) {
                            onInspectConjunction3D(conj);
                          } else {
                            const targetSat = satellites.find(s => s.norad_id === conj.primary_norad_id);
                            if (targetSat) onSelectSat(targetSat);
                            onNavigate3D();
                          }
                        }}
                        className="inline-flex items-center space-x-1 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white px-2.5 py-1 rounded border border-sky-500/30 transition text-[10px] font-semibold"
                      >
                        <span>INSPECT 3D</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: PROTECTED ASSETS DASHBOARD */}
      <div className="bg-space-card border border-space-border p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-space-border pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">PROTECTED ASSETS MONITORING</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">Priority fleet threat screening</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {protectedAssets.map((asset) => (
            <div key={asset.id} className="bg-space-dark/90 border border-space-border hover:border-emerald-500/40 rounded-xl p-4 space-y-3 transition shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{asset.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  asset.highest_risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  asset.highest_risk_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {asset.highest_risk_level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">{asset.mission}</p>
              <div className="text-[10px] text-slate-300 space-y-1 font-mono pt-1">
                <div>Operator: <strong>{asset.operator}</strong></div>
                <div>Active Threats: <strong className="text-amber-400">{asset.threat_count} Event(s)</strong></div>
                <div className="text-sky-300 truncate">{asset.next_critical_event}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SELECTED CONJUNCTION COMPREHENSIVE DETAIL DEEP DIVE */}
      {selectedConjunction && (
        <div className="bg-space-card border border-sky-500/50 p-6 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-space-border pb-3">
            <div>
              <span className="text-[10px] text-sky-400 uppercase tracking-widest block font-bold">Comprehensive Conjunction Deep-Dive & Decision Support</span>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>{selectedConjunction.primary_name}</span>
                <span className="text-red-400">↔</span>
                <span>{selectedConjunction.secondary_name}</span>
              </h3>
            </div>
            <button
              onClick={() => setSelectedConjunction(null)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-space-dark border border-space-border rounded-md"
            >
              ✕
            </button>
          </div>

          {/* EXACT OBJECT TRACK */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <Compass className="w-4 h-4 text-sky-400 mr-2" />
              1. EXACT OBJECT TRACK & SGP4 INSTANTANEOUS POSITION
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-space-dark p-3 rounded-lg border border-space-border">
                <span className="text-slate-400 text-[10px] block">PRIMARY ASSET</span>
                <span className="text-sky-400 font-bold">{selectedConjunction.primary_name} ({selectedConjunction.primary_norad_id})</span>
              </div>
              <div className="bg-space-dark p-3 rounded-lg border border-space-border">
                <span className="text-slate-400 text-[10px] block">THREAT DEBRIS</span>
                <span className="text-red-400 font-bold">{selectedConjunction.secondary_name} ({selectedConjunction.secondary_norad_id})</span>
              </div>
              <div className="bg-space-dark p-3 rounded-lg border border-space-border">
                <span className="text-slate-400 text-[10px] block">MINIMUM SEPARATION</span>
                <span className="text-white font-bold">{selectedConjunction.miss_distance_km} km</span>
              </div>
              <div className="bg-space-dark p-3 rounded-lg border border-space-border">
                <span className="text-slate-400 text-[10px] block">RELATIVE SPEED</span>
                <span className="text-white font-bold">{selectedConjunction.relative_velocity_kms || 7.66} km/s</span>
              </div>
            </div>
          </div>

          {/* SPACECRAFT SUBSYSTEM IMPACT ASSESSMENT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-space-border/60 pt-4 font-sans text-xs">
            <div className="bg-space-dark/80 p-3.5 rounded-xl border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">POTENTIAL VULNERABLE SUBSYSTEM</span>
              <span className="text-white font-bold text-sm block font-mono">{selectedConjunction.vulnerable_subsystem || "Solar Array"}</span>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {selectedConjunction.vulnerability_reason || "Approach geometry intersects estimated solar array wingspan region."}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block mt-2">
                Confidence: <strong className="text-amber-400">{selectedConjunction.vulnerability_confidence || "Medium"}</strong> (MODEL ESTIMATE)
              </span>
            </div>

            <div className="bg-space-dark/80 p-3.5 rounded-xl border border-space-border space-y-1">
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block font-bold">ESTIMATED CONSEQUENCE</span>
              <p className="text-[11px] text-slate-200 leading-relaxed font-mono">
                {selectedConjunction.potential_outcome || "Power-generation degradation possible; solar wing attitude torque disturbance."}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block mt-2">
                Impact Severity: <strong className="text-red-400">{selectedConjunction.impact_severity || "HIGH"}</strong>
              </span>
            </div>

            <div className="bg-space-dark/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">RECOMMENDED OPERATOR ACTION</span>
              <p className="text-[11px] text-emerald-200 leading-relaxed font-mono">
                {selectedConjunction.recommended_action || "Perform collision-avoidance assessment & TLE monitoring."}
              </p>
              <span className="text-[10px] font-mono text-slate-400 block mt-2">
                Decision Priority: <strong>OPERATOR REVIEW REQUIRED</strong>
              </span>
            </div>
          </div>

          {/* SIGNATURE FEATURE: SPACE IMPACT CHAIN */}
          <div className="space-y-2 border-t border-space-border/60 pt-4">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 text-sky-400 mr-2" />
              SIGNATURE FEATURE — SPACE IMPACT CHAIN
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
              <div className="p-2 bg-space-dark border border-red-500/30 rounded-lg">
                <span className="text-red-400 font-bold block">1. DEBRIS</span>
                <span className="text-white truncate block">{selectedConjunction.secondary_name}</span>
              </div>
              <div className="p-2 bg-space-dark border border-space-border rounded-lg">
                <span className="text-slate-400 font-bold block">2. ORBIT</span>
                <span className="text-slate-300 block">LEO Shell</span>
              </div>
              <div className="p-2 bg-space-dark border border-amber-500/30 rounded-lg">
                <span className="text-amber-400 font-bold block">3. CONJUNCTION</span>
                <span className="text-white block">{selectedConjunction.miss_distance_km} km</span>
              </div>
              <div className="p-2 bg-space-dark border border-sky-500/30 rounded-lg">
                <span className="text-sky-400 font-bold block">4. SATELLITE</span>
                <span className="text-white truncate block">{selectedConjunction.primary_name}</span>
              </div>
              <div className="p-2 bg-space-dark border border-amber-400/30 rounded-lg">
                <span className="text-amber-300 font-bold block">5. SUBSYSTEM</span>
                <span className="text-slate-200 truncate block">{selectedConjunction.vulnerable_subsystem || "Solar Array"}</span>
              </div>
              <div className="p-2 bg-space-dark border border-space-border rounded-lg">
                <span className="text-slate-400 font-bold block">6. MISSION</span>
                <span className="text-slate-300 block">Telecom / Ops</span>
              </div>
              <div className="p-2 bg-space-dark border border-indigo-500/30 rounded-lg">
                <span className="text-indigo-300 font-bold block">7. SERVICE</span>
                <span className="text-white block">Broadband Link</span>
              </div>
              <div className="p-2 bg-space-dark border border-emerald-500/30 rounded-lg">
                <span className="text-emerald-400 font-bold block">8. HUMAN IMPACT</span>
                <span className="text-emerald-200 block">Public Link Risk</span>
              </div>
            </div>
          </div>

          {/* MODEL PRECISION & DATA QUALITY */}
          <div className="bg-space-dark p-3.5 rounded-xl border border-space-border text-xs flex flex-col md:flex-row items-center justify-between gap-3 font-sans">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-white font-bold">MODEL PRECISION & DATA QUALITY</span>
            </div>
            <div className="flex items-center space-x-4 font-mono text-[11px]">
              <div>TLE Age: <strong className="text-white">{selectedConjunction.tle_age_hours || 3.5}h</strong></div>
              <div>Confidence: <strong className="text-emerald-400">{selectedConjunction.prediction_confidence_pct || 78}%</strong></div>
              <div>Uncertainty: <strong className="text-sky-400">± {selectedConjunction.position_uncertainty_km || 0.18} km</strong></div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-space-border">
            <div className="flex items-center space-x-2">
              <Badge type="MODEL ESTIMATE" size="small" />
              <Badge type={dataMode} size="small" />
            </div>

            <div className="flex items-center space-x-2">
              {!selectedConjunction.is_reviewed && onReviewConjunction && (
                <button
                  onClick={() => onReviewConjunction(selectedConjunction.id)}
                  className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 text-xs px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>MARK REVIEWED</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (onInspectConjunction3D) {
                    onInspectConjunction3D(selectedConjunction);
                  } else {
                    const targetSat = satellites.find(s => s.norad_id === selectedConjunction.primary_norad_id);
                    if (targetSat) onSelectSat(targetSat);
                    onNavigate3D();
                  }
                }}
                className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition flex items-center space-x-1.5"
              >
                <span>INSPECT IN 3D VIEW</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: CELESTIAL EVENTS & ECLIPSE AWARENESS */}
      <div className="bg-space-card border border-space-border p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-space-border pb-3">
          <div className="flex items-center space-x-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">CELESTIAL EVENTS & ECLIPSE AWARENESS</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">Orbital illumination & particle environment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {celestialEvents.map((evt) => (
            <div key={evt.id} className="bg-space-dark/90 border border-space-border p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">{evt.event_name}</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-bold">
                  {evt.impact_level}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{evt.operational_consideration}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: EARTH ENVIRONMENTAL & RE-ENTRY RISK */}
      <div className="bg-space-card border border-space-border p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-space-border pb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-red-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">EARTH ENVIRONMENTAL & RE-ENTRY RISK</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-sans">Atmospheric decay monitoring & uncertainty corridors</span>
        </div>

        <div className="space-y-3">
          {reentryRisks.map((re) => (
            <div key={re.id} className="bg-space-dark/90 border border-red-500/30 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{re.object_name}</span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold">{re.risk_level} RISK</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans mt-1">
                  Estimated Corridor: <strong className="text-amber-300">{re.estimated_risk_region}</strong> ({re.uncertainty_corridor})
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                <div>Entry Window: <strong className="text-white">{re.predicted_entry_window}</strong></div>
                <div>Confidence: <strong className="text-emerald-400">{re.confidence_pct}%</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: "WHAT IF?" SCENARIO SIMULATOR */}
      {showWhatIfModal && selectedConjunction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-space-card border border-amber-500/50 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-space-border pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">"WHAT IF?" SCENARIO SIMULATOR</h3>
              </div>
              <button
                onClick={() => setShowWhatIfModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-space-dark border border-space-border rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="bg-space-dark p-3 rounded-xl border border-space-border space-y-1">
                <span className="font-mono text-amber-400 font-bold text-xs block">TARGET ENCOUNTER:</span>
                <span className="text-white font-bold">{selectedConjunction.primary_name} ↔ {selectedConjunction.secondary_name}</span>
                <span className="text-slate-400 text-[11px] block">Baseline Miss Distance: {selectedConjunction.miss_distance_km} km</span>
              </div>

              <div className="space-y-3 font-mono">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Modify Miss Distance (km): {whatIfMissKm} km</label>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={whatIfMissKm}
                    onChange={(e) => setWhatIfMissKm(Number(e.target.value))}
                    className="w-full bg-space-dark"
                  />
                </div>

                <button
                  onClick={() => handleRunWhatIfSimulation(selectedConjunction)}
                  disabled={isSimulatingWhatIf}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded-xl transition text-xs shadow-lg"
                >
                  {isSimulatingWhatIf ? 'Simulating Orbit Variation...' : 'RUN SCENARIO RECALCULATION'}
                </button>
              </div>

              {whatIfResult && (
                <div className="bg-space-dark/90 p-4 rounded-xl border border-amber-500/40 space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Simulated Miss Distance:</span>
                    <strong className="text-white">{whatIfResult.simulated_miss_distance_km} km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Simulated Risk Level:</span>
                    <strong className="text-amber-400">{whatIfResult.simulated_risk_level}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Simulated Priority Score:</span>
                    <strong className="text-sky-300">{whatIfResult.simulated_priority_score} / 100</strong>
                  </div>
                  <p className="text-[11px] font-sans text-slate-300 border-t border-space-border/60 pt-2 leading-relaxed">
                    {whatIfResult.scenario_summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: "WHY SHOULD I CARE?" NON-EXPERT EXPLANATION */}
      {showWhyCareModal && selectedConjunction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-space-card border border-sky-500/50 w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-space-border pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">"WHY SHOULD I CARE?" — NON-EXPERT EXPLANATION</h3>
              </div>
              <button
                onClick={() => setShowWhyCareModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-space-dark border border-space-border rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans leading-relaxed text-slate-300">
              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl space-y-1">
                <span className="font-mono text-sky-400 font-bold block text-xs">WHAT IS HAPPENING?</span>
                <p>
                  A piece of space debris (<strong>{selectedConjunction.secondary_name}</strong>) is predicted to pass unusually close ({selectedConjunction.miss_distance_km} km) to an active operational satellite (<strong>{selectedConjunction.primary_name}</strong>).
                </p>
              </div>

              <div className="p-3 bg-space-dark border border-space-border rounded-xl space-y-1">
                <span className="font-mono text-white font-bold block text-xs">WHY DOES THIS MATTER TO PEOPLE?</span>
                <p>
                  {selectedConjunction.public_impact_description || "Satellites provide essential daily services including broadband internet, weather forecasting, emergency communications, and GPS navigation."}
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                <span className="font-mono text-emerald-400 font-bold block text-xs">WHAT ACTION IS BEING TAKEN?</span>
                <p>
                  Satellite operators monitor these close approach predictions to determine if a collision-avoidance maneuver (firing thrusters to alter altitude) is required before the time of closest approach.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
