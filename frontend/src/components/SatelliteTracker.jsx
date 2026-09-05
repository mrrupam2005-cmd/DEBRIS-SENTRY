import React, { useState } from 'react';
import { Satellite, Search, Globe, RefreshCw, Activity, Layers, ShieldAlert, AlertTriangle, ArrowRight, Info, Compass, MapPin, Radio, CheckCircle2 } from 'lucide-react';
import Badge from './Badge';

export default function SatelliteTracker({
  satellites = [],
  conjunctions = [],
  onSelectSat,
  onNavigate3D,
  onRefreshTLE,
  isRefreshing,
  onInspectConjunction3D
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [orbitFilter, setOrbitFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [threatFilter, setThreatFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');

  const [inspectedSat, setInspectedSat] = useState(null); // For Threat Profile modal
  const [orbitLocationSat, setOrbitLocationSat] = useState(null); // For Orbit & Location modal

  // Filtering Logic
  const filteredSatellites = satellites.filter(sat => {
    if (!sat) return false;

    const satType = (sat.type || '').toUpperCase().trim();
    const filterCat = categoryFilter.toUpperCase().trim();

    // 1. Category Filter
    let matchesCategory = true;
    if (filterCat === 'SATELLITES') {
      matchesCategory = satType === 'PAYLOAD' || satType === 'ACTIVE SATELLITE';
    } else if (filterCat === 'DEBRIS') {
      matchesCategory = satType === 'DEBRIS';
    } else if (filterCat === 'ROCKET BODIES') {
      matchesCategory = satType === 'ROCKET BODY';
    }

    // 2. Orbit Filter
    const oClass = (sat.orbit_class || 'LEO').toUpperCase();
    const matchesOrbit = orbitFilter === 'ALL' || oClass === orbitFilter;

    // 3. Status Filter
    const opStat = (sat.operational_status || 'ACTIVE').toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || opStat === statusFilter;

    // 4. Threat Level Filter
    const threatLvl = (sat.threat_level || 'LOW').toUpperCase();
    const matchesThreat = threatFilter === 'ALL' || threatLvl === threatFilter;

    // 5. Country / Operator Filter
    const countryStr = (sat.country || '').toUpperCase();
    let matchesCountry = true;
    if (countryFilter !== 'ALL') {
      if (countryFilter === 'US') matchesCountry = countryStr.includes('US') || countryStr.includes('UNITED STATES');
      else if (countryFilter === 'PRC') matchesCountry = countryStr.includes('PRC') || countryStr.includes('CHINA');
      else if (countryFilter === 'CIS') matchesCountry = countryStr.includes('CIS') || countryStr.includes('RUSSIA');
      else if (countryFilter === 'ESA') matchesCountry = countryStr.includes('ESA') || countryStr.includes('EUROPE');
      else if (countryFilter === 'UNKNOWN') matchesCountry = countryStr.includes('UNKNOWN') || countryStr === '';
    }

    // 6. Search Input Filter
    const searchLower = search.toLowerCase().trim();
    const satName = (sat.name || '').toLowerCase();
    const noradIdStr = (sat.norad_id || '').toString();
    const matchesSearch = !searchLower || satName.includes(searchLower) || noradIdStr.includes(searchLower);

    return matchesCategory && matchesOrbit && matchesStatus && matchesThreat && matchesCountry && matchesSearch;
  });

  const catalogMode = satellites[0]?.data_mode || "DATA MODE: DEMO";

  // Derive threat profile metrics for a specific satellite
  const getThreatProfile = (sat) => {
    if (!sat) return null;
    const satConjs = conjunctions.filter(
      c => c.primary_norad_id === sat.norad_id || c.secondary_norad_id === sat.norad_id
    );
    const criticals = satConjs.filter(c => c.risk_level === 'CRITICAL').length;
    const highs = satConjs.filter(c => c.risk_level === 'HIGH').length;
    const closest = satConjs.length > 0 ? Math.min(...satConjs.map(c => c.miss_distance_km)) : null;
    const vuln = satConjs.length > 0 ? (satConjs[0].vulnerable_subsystem || 'Solar Array') : 'Solar Array';

    return {
      totalConjs: satConjs.length,
      criticalCount: criticals,
      highCount: highs,
      closestMissKm: closest,
      vulnerableSubsystem: vuln,
      futureTrend: (criticals > 0 || highs > 0) ? 'Increasing Risk' : 'Nominal / Stable',
      conjunctions: satConjs
    };
  };

  const getGeographicRegion = (lat, lon) => {
    if (lat === undefined || lon === undefined || lat === null || lon === null) return 'Calculated via SGP4';
    if (lat > 66) return 'Arctic Polar Region';
    if (lat < -66) return 'Antarctic Polar Region';
    if (lat >= -15 && lat <= 25 && lon >= 60 && lon <= 100) return 'Indian Subcontinent & Ocean';
    if (lat >= -10 && lat <= 25 && lon >= 95 && lon <= 145) return 'Southeast Asia / Maritime Continent';
    if (lat >= 15 && lat <= 55 && lon >= 70 && lon <= 140) return 'East Asian Mainland';
    if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 40) return 'European Continent';
    if (lat >= 25 && lat <= 70 && lon >= -170 && lon <= -50) return 'North American Continent';
    if (lat >= -55 && lat <= 15 && lon >= -85 && lon <= -35) return 'South American Continent';
    if (lat >= -35 && lat <= 38 && lon >= -20 && lon <= 55) return 'African Continent';
    if (lat >= -45 && lat <= -10 && lon >= 110 && lon <= 155) return 'Australian Continent & Ocean';
    if (lon >= -80 && lon <= 0) return 'Atlantic Ocean Basin';
    return 'Pacific Ocean / Equatorial Orbit Shell';
  };

  const inspectedProfile = inspectedSat ? getThreatProfile(inspectedSat) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-mono">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-space-border pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-wide">SATELLITE & DEBRIS CATALOG TRACKER</h1>
            <Badge type={catalogMode} size="normal" />
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Space Situational Awareness tracking catalog, SGP4 orbital parameters, object metadata, and threat profiling.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefreshTLE}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 bg-space-card hover:bg-space-border text-sky-400 text-xs px-3.5 py-2 rounded-xl border border-space-border shadow transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing TLEs...' : 'Refresh TLE Data'}</span>
          </button>
        </div>
      </div>

      {/* Primary Category Switcher & Multi-Filter Bar */}
      <div className="bg-space-card border border-space-border p-4 rounded-2xl shadow-xl space-y-4">
        
        {/* Top Category Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-space-border/60 pb-3">
          <div className="flex items-center space-x-1 bg-space-dark p-1 rounded-xl border border-space-border">
            {[
              { id: 'ALL', label: 'ALL OBJECTS' },
              { id: 'SATELLITES', label: 'SATELLITES' },
              { id: 'DEBRIS', label: 'DEBRIS' },
              { id: 'ROCKET BODIES', label: 'ROCKET BODIES' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  categoryFilter === tab.id
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-sans">
            Showing <strong className="text-sky-400 font-mono">{filteredSatellites.length}</strong> of {satellites.length} catalog records
          </div>
        </div>

        {/* Multi-Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          
          {/* Orbit Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">ORBIT CLASS</label>
            <select
              value={orbitFilter}
              onChange={(e) => setOrbitFilter(e.target.value)}
              className="w-full bg-space-dark border border-space-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Orbits</option>
              <option value="LEO">LEO (&lt; 2000 km)</option>
              <option value="MEO">MEO (2000-35000 km)</option>
              <option value="GEO">GEO (~35786 km)</option>
              <option value="HEO">HEO (High Eccentricity)</option>
            </select>
          </div>

          {/* Operational Status Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">OPERATIONAL STATUS</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-space-dark border border-space-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </div>

          {/* Threat Level Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">THREAT LEVEL</label>
            <select
              value={threatFilter}
              onChange={(e) => setThreatFilter(e.target.value)}
              className="w-full bg-space-dark border border-space-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Threat Levels</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Operator / Country Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">COUNTRY / OPERATOR</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full bg-space-dark border border-space-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Countries</option>
              <option value="US">United States (US)</option>
              <option value="PRC">China (PRC)</option>
              <option value="CIS">Russia / CIS</option>
              <option value="ESA">Europe (ESA)</option>
              <option value="UNKNOWN">Unknown / Not Listed</option>
            </select>
          </div>

          {/* Search Input Bar */}
          <div className="sm:col-span-2 md:col-span-1">
            <label className="text-[10px] text-slate-400 block mb-1">SEARCH CATALOG</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Name / NORAD ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-space-dark border border-space-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Main Catalog Table */}
      <div className="bg-space-card border border-space-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-space-dark/80 text-slate-400 text-xs uppercase tracking-wider border-b border-space-border">
                <th className="py-3.5 px-4 font-semibold">NORAD ID</th>
                <th className="py-3.5 px-4 font-semibold">Object Name</th>
                <th className="py-3.5 px-4 font-semibold">Type & Category</th>
                <th className="py-3.5 px-4 font-semibold">Orbit Class</th>
                <th className="py-3.5 px-4 font-semibold">Altitude / Speed</th>
                <th className="py-3.5 px-4 font-semibold">Operator / Country</th>
                <th className="py-3.5 px-4 font-semibold">Threat Level</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-border/60 text-xs">
              {filteredSatellites.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-sans">
                    No matching catalog objects found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredSatellites.map((sat) => {
                  const tLvl = sat.threat_level || 'LOW';
                  const oClass = sat.orbit_class || 'LEO';

                  return (
                    <tr
                      key={sat.norad_id}
                      className="hover:bg-space-border/30 transition group"
                    >
                      <td className="py-3.5 px-4 font-bold text-sky-400">{sat.norad_id}</td>
                      <td className="py-3.5 px-4 font-bold text-white group-hover:text-sky-300">
                        {sat.name}
                        {sat.mission && sat.mission !== 'Not available' && (
                          <span className="text-[10px] font-sans text-slate-400 block font-normal">{sat.mission}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold block w-fit ${
                          sat.type === 'DEBRIS' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          sat.type === 'ROCKET BODY' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}>
                          {sat.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block mt-0.5">{sat.debris_class || 'Payload'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-space-dark text-slate-300 border border-space-border px-2 py-0.5 rounded text-[10px] font-bold">
                          {oClass}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        <div>{sat.alt !== undefined && sat.alt !== null ? Number(sat.alt).toFixed(1) : (sat.apogee || 420.0).toFixed(1)} km</div>
                        <div className="text-[10px] text-slate-400">{sat.velocity_kms !== undefined && sat.velocity_kms !== null ? Number(sat.velocity_kms).toFixed(2) : '7.60'} km/s</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-semibold">{sat.country || 'Unknown'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tLvl === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' :
                          tLvl === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          tLvl === 'MEDIUM' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {tLvl}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Orbit & Location Button */}
                        <button
                          onClick={() => setOrbitLocationSat(sat)}
                          className="inline-flex items-center space-x-1 bg-space-dark hover:bg-space-border text-sky-300 px-2.5 py-1 rounded border border-sky-500/30 transition text-[11px]"
                          title="Orbit & Location Details"
                        >
                          <Compass className="w-3.5 h-3.5 text-sky-400" />
                          <span>Orbit & Location</span>
                        </button>

                        {/* Threat Profile Button */}
                        <button
                          onClick={() => setInspectedSat(sat)}
                          className="inline-flex items-center space-x-1 bg-space-dark hover:bg-space-border text-amber-300 px-2.5 py-1 rounded border border-amber-500/30 transition text-[11px]"
                          title="Threat Profile"
                        >
                          <Activity className="w-3.5 h-3.5 text-amber-400" />
                          <span>Threat Profile</span>
                        </button>

                        {/* 3D View Button */}
                        <button
                          onClick={() => {
                            onSelectSat(sat);
                            onNavigate3D();
                          }}
                          className="inline-flex items-center space-x-1 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white px-2.5 py-1 rounded border border-sky-500/30 transition text-[11px] font-semibold"
                          title="Inspect in 3D View"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>3D View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPACT DETAIL PANEL 1: Orbit & Location Modal */}
      {orbitLocationSat && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-space-card border border-sky-500/50 w-full max-w-4xl rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto font-mono">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-space-border pb-3">
              <div className="flex items-center space-x-3">
                <Compass className="w-6 h-6 text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>{orbitLocationSat.name}</span>
                    <span className="text-sky-400 text-xs">({orbitLocationSat.norad_id})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">Orbit Parameters, Current SGP4 Position, and Ground Track Information</p>
                </div>
              </div>
              <button
                onClick={() => setOrbitLocationSat(null)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1 bg-space-dark border border-space-border rounded-lg"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* OBJECT INFORMATION */}
              <div className="bg-space-dark/80 p-4 rounded-xl border border-space-border space-y-2">
                <h4 className="text-sky-400 font-bold text-xs uppercase tracking-wider flex items-center border-b border-space-border/60 pb-2">
                  <Info className="w-3.5 h-3.5 mr-1.5" />
                  OBJECT INFORMATION
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-400 block text-[10px]">NAME</span><strong className="text-white">{orbitLocationSat.name}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">NORAD ID</span><strong className="text-sky-400">{orbitLocationSat.norad_id}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">TYPE</span><strong className="text-slate-200">{orbitLocationSat.type}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">OPERATOR / COUNTRY</span><strong className="text-white">{orbitLocationSat.country || 'Unknown'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">LAUNCH COUNTRY</span><strong className="text-slate-300">{orbitLocationSat.launch_country || 'Not available'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">LAUNCH SITE</span><strong className="text-slate-300">{orbitLocationSat.launch_site || 'Not available'}</strong></div>
                  <div className="col-span-2"><span className="text-slate-400 block text-[10px]">MISSION / PURPOSE</span><strong className="text-sky-300">{orbitLocationSat.mission || orbitLocationSat.associated_program || 'Not available'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">OPERATIONAL STATUS</span><strong className="text-emerald-400">{orbitLocationSat.operational_status || 'ACTIVE'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">DATA SOURCE</span><strong className="text-slate-300">{orbitLocationSat.source || 'CelesTrak'}</strong></div>
                </div>
              </div>

              {/* ORBIT INFORMATION */}
              <div className="bg-space-dark/80 p-4 rounded-xl border border-space-border space-y-2">
                <h4 className="text-sky-400 font-bold text-xs uppercase tracking-wider flex items-center border-b border-space-border/60 pb-2">
                  <Radio className="w-3.5 h-3.5 mr-1.5" />
                  ORBIT INFORMATION
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-400 block text-[10px]">ORBIT CLASS</span><strong className="text-sky-300">{orbitLocationSat.orbit_class || 'LEO'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">ALTITUDE</span><strong className="text-white">{orbitLocationSat.alt !== undefined && orbitLocationSat.alt !== null ? Number(orbitLocationSat.alt).toFixed(1) : (orbitLocationSat.apogee || 420.0).toFixed(1)} km</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">VELOCITY</span><strong className="text-white">{orbitLocationSat.velocity_kms !== undefined && orbitLocationSat.velocity_kms !== null ? Number(orbitLocationSat.velocity_kms).toFixed(2) : '7.60'} km/s</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">INCLINATION</span><strong className="text-slate-200">{orbitLocationSat.inclination}°</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">ECCENTRICITY</span><strong className="text-slate-300">{orbitLocationSat.eccentricity || 0.001}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">ORBITAL PERIOD</span><strong className="text-slate-300">{orbitLocationSat.period || 95.0} min</strong></div>
                </div>
              </div>

              {/* CURRENT POSITION */}
              <div className="bg-space-dark/80 p-4 rounded-xl border border-space-border space-y-2">
                <h4 className="text-sky-400 font-bold text-xs uppercase tracking-wider flex items-center border-b border-space-border/60 pb-2">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                  CURRENT POSITION (SGP4 INSTANTANEOUS)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">LATITUDE</span>
                    <strong className="text-white">{orbitLocationSat.lat !== undefined ? `${Number(orbitLocationSat.lat).toFixed(4)}°` : 'Calculated via SGP4'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">LONGITUDE</span>
                    <strong className="text-white">{orbitLocationSat.lon !== undefined ? `${Number(orbitLocationSat.lon).toFixed(4)}°` : 'Calculated via SGP4'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">CURRENT GEOGRAPHIC REGION</span>
                    <strong className="text-sky-300">{getGeographicRegion(orbitLocationSat.lat, orbitLocationSat.lon)}</strong>
                  </div>
                </div>
              </div>

              {/* GROUND TRACK & THREAT PROFILE */}
              <div className="bg-space-dark/80 p-4 rounded-xl border border-space-border space-y-2">
                <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider flex items-center border-b border-space-border/60 pb-2">
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  GROUND TRACK & THREAT PROFILE
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">GROUND TRACK STATUS:</span>
                    <span className="text-emerald-400 font-bold">Active SGP4 Trajectory Propagated</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">THREAT LEVEL:</span>
                    <span className="text-amber-300 font-bold">{orbitLocationSat.threat_level || 'LOW'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">POTENTIALLY THREATENED:</span>
                    <span className="text-slate-200">{orbitLocationSat.threatened_satellites || 'None detected'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-space-border">
              <Badge type={orbitLocationSat.data_mode || "DATA MODE: DEMO"} size="small" />
              <button
                onClick={() => {
                  onSelectSat(orbitLocationSat);
                  onNavigate3D();
                }}
                className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition flex items-center space-x-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>INSPECT IN 3D ORBIT VIEW</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COMPACT DETAIL PANEL 2: Inspected Object Threat Profile Modal */}
      {inspectedSat && inspectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-space-card border border-sky-500/50 w-full max-w-4xl rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto font-mono">
            <div className="flex items-center justify-between border-b border-space-border pb-3">
              <div>
                <span className="text-[10px] text-sky-400 uppercase tracking-widest block font-bold">Comprehensive Threat Profile</span>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>{inspectedSat.name}</span>
                  <span className="text-xs text-slate-400">({inspectedSat.norad_id})</span>
                </h3>
              </div>
              <button
                onClick={() => setInspectedSat(null)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1 bg-space-dark border border-space-border rounded-lg"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-space-dark p-3 rounded-lg border border-space-border">
                <span className="text-slate-400 text-[10px] block">TOTAL CONJUNCTIONS</span>
                <span className="text-white font-bold text-base">{inspectedProfile.totalConjs}</span>
              </div>
              <div className="bg-space-dark p-3 rounded-lg border border-space-border">
                <span className="text-slate-400 text-[10px] block">CRITICAL THREATS</span>
                <span className="text-red-400 font-bold text-base">{inspectedProfile.criticalCount}</span>
              </div>
              <div className="bg-space-dark p-3 rounded-lg border border-space-border">
                <span className="text-slate-400 text-[10px] block">CLOSEST MISS DISTANCE</span>
                <span className="text-amber-400 font-bold text-base">
                  {inspectedProfile.closestMissKm !== null ? `${inspectedProfile.closestMissKm} km` : 'N/A'}
                </span>
              </div>
              <div className="bg-space-dark p-3 rounded-lg border border-space-border">
                <span className="text-slate-400 text-[10px] block">VULNERABLE SUBSYSTEM</span>
                <span className="text-amber-300 font-bold text-xs">{inspectedProfile.vulnerableSubsystem}</span>
              </div>
            </div>

            {inspectedProfile.conjunctions.length > 0 && (
              <div className="space-y-2 border-t border-space-border/60 pt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                  Active Conjunction Encounters
                </h4>
                <div className="space-y-2 text-xs">
                  {inspectedProfile.conjunctions.map((conj) => (
                    <div key={conj.id} className="bg-space-dark p-3 rounded-xl border border-space-border flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{conj.primary_name} ↔ {conj.secondary_name}</span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          Miss: <strong>{conj.miss_distance_km} km</strong> | Speed: <strong>{conj.relative_velocity_kms || 7.66} km/s</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setInspectedSat(null);
                          if (onInspectConjunction3D) onInspectConjunction3D(conj);
                          else {
                            onSelectSat(inspectedSat);
                            onNavigate3D();
                          }
                        }}
                        className="bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-white px-3 py-1.5 rounded-lg border border-sky-500/30 transition text-xs font-semibold"
                      >
                        Inspect in 3D
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-space-border">
              <Badge type={inspectedSat.data_mode || "DATA MODE: DEMO"} size="small" />
              <button
                onClick={() => {
                  setInspectedSat(null);
                  onSelectSat(inspectedSat);
                  onNavigate3D();
                }}
                className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition flex items-center space-x-1.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>VIEW TRAJECTORY IN 3D ORBIT VIEW</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
