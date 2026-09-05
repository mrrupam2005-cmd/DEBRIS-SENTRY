import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Radio, Eye, EyeOff, RotateCcw, Clock, Play, Pause, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';
import Badge from '../Badge';

// Authentic Thin Rayleigh Atmosphere Shader Material (Subtle blue atmospheric rim glow)
const AtmosphereShaderMaterial = {
  uniforms: {
    color: { value: new THREE.Color('#00D4FF') }
  },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    uniform vec3 color;
    void main() {
      float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
      gl_FragColor = vec4(color, 1.0) * intensity * 0.85;
    }
  `
};

const EARTH_RADIUS = 2.5;

/**
 * 3D Keplerian orbital state calculator
 */
function calculateOrbitalState(sat, tSeconds, earthRadius = EARTH_RADIUS) {
  const alt = sat.alt || (sat.apogee ? (sat.apogee + sat.perigee) / 2 : 500.0);
  const R = earthRadius + (alt / 6371.0) * 1.5;
  
  const incDeg = sat.inclination ?? (20 + (sat.norad_id * 17) % 65);
  const incRad = (incDeg * Math.PI) / 180;
  
  const raanDeg = (sat.norad_id * 137.5) % 360;
  const raanRad = (raanDeg * Math.PI) / 180;
  
  const baseSpeed = 0.06 + (500.0 / Math.max(alt, 200.0)) * 0.03;
  const phase0 = ((sat.norad_id * 53.1) % 360) * (Math.PI / 180);
  
  const theta = phase0 + baseSpeed * tSeconds;
  
  const vec = new THREE.Vector3(R * Math.cos(theta), 0, R * Math.sin(theta));
  vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), incRad);
  vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), raanRad);
  
  const r = vec.length();
  const lat = Math.asin(Math.min(Math.max(vec.y / r, -1), 1)) * (180 / Math.PI);
  const lon = Math.atan2(vec.z, vec.x) * (180 / Math.PI);
  
  return {
    x: vec.x,
    y: vec.y,
    z: vec.z,
    alt: alt,
    lat: lat,
    lon: lon,
    velocity_kms: sat.velocity_kms || (7.8 - (alt / 1000) * 0.25)
  };
}

// Photorealistic NASA 3D Earth Sphere Component using authentic 4K NASA Blue Marble satellite textures
function PhotorealisticEarth() {
  const earthRef = useRef();
  const cloudsRef = useRef();

  const [dayMap, nightMap, specularMap, cloudMap] = useTexture([
    '/assets/earth/earth_daymap.jpg',
    '/assets/earth/earth_nightmap.png',
    '/assets/earth/earth_specular.png',
    '/assets/earth/earth_clouds.png'
  ]);

  useEffect(() => {
    if (dayMap) dayMap.colorSpace = THREE.SRGBColorSpace;
    if (nightMap) nightMap.colorSpace = THREE.SRGBColorSpace;

    if (earthRef.current) earthRef.current.rotation.y = 4.2;
    if (cloudsRef.current) cloudsRef.current.rotation.y = 4.2;
  }, [dayMap, nightMap]);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.012;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.018;
    }
  });

  return (
    <group>
      {/* Primary Photorealistic NASA Blue Marble Earth Surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={dayMap}
          emissiveMap={nightMap}
          emissive="#FFFFFF"
          emissiveIntensity={1.2}
          roughnessMap={specularMap}
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>

      {/* Photorealistic NASA Transparent Cloud Layer */}
      <mesh ref={cloudsRef} scale={[1.008, 1.008, 1.008]}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={cloudMap}
          transparent={true}
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Thin Rayleigh Blue Atmosphere Scattering Rim Glow */}
      <mesh scale={[1.018, 1.018, 1.018]}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <shaderMaterial
          args={[AtmosphereShaderMaterial]}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Soft Outer Blue Atmosphere Halo Rim */}
      <mesh scale={[1.05, 1.05, 1.05]}>
        <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#0EA5E9"
          transparent={true}
          opacity={0.07}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// 3D Miniature Solar Array Satellite Mesh
function Satellite3DMesh({ position, color = '#38BDF8', isSelected = false }) {
  return (
    <group position={position} scale={isSelected ? [0.16, 0.16, 0.16] : [0.09, 0.09, 0.09]}>
      <mesh>
        <boxGeometry args={[0.4, 0.4, 0.6]} />
        <meshStandardMaterial color={isSelected ? '#FACC15' : '#E2E8F0'} metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.75, 0, 0]}>
        <boxGeometry args={[1.0, 0.04, 0.35]} />
        <meshStandardMaterial color="#0284C7" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.75, 0, 0]}>
        <boxGeometry args={[1.0, 0.04, 0.35]} />
        <meshStandardMaterial color="#0284C7" metalness={0.8} roughness={0.3} />
      </mesh>
      {isSelected && (
        <mesh scale={[2.2, 2.2, 2.2]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#FACC15" transparent={true} opacity={0.45} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
}

// Render bright dashed 3D vector connection line between Primary & Secondary objects in a conjunction
function Conjunction3DLine({ primarySat, secondarySat, tSeconds }) {
  const linePoints = useMemo(() => {
    if (!primarySat || !secondarySat) return null;
    const stA = calculateOrbitalState(primarySat, tSeconds);
    const stB = calculateOrbitalState(secondarySat, tSeconds);
    return [
      [stA.x, stA.y, stA.z],
      [stB.x, stB.y, stB.z]
    ];
  }, [primarySat, secondarySat, tSeconds]);

  if (!linePoints) return null;

  return (
    <group>
      <Line
        points={linePoints}
        color="#EF4444"
        lineWidth={2.5}
        dashed={true}
        dashScale={5}
        dashSize={0.2}
        gapSize={0.1}
        transparent={true}
        opacity={0.95}
      />
    </group>
  );
}

// Animated Live Satellites & Space Debris Point Cloud with Motion Trails and Raycast Click Interaction
function AnimatedSatellitePoints({
  satellites,
  selectedSat,
  onSelectSat,
  isPlaying,
  timelineOffsetSec,
  onUpdateSelectedState,
  showSatellites = true,
  showDebris = true,
  showRocketBodies = true,
  currentSimTimeRef
}) {
  const posAttrRef = useRef();
  const trailAttrRef = useRef();
  const simTimeRef = useRef(0);
  const [modelPositions, setModelPositions] = useState([]);

  const expandedSats = useMemo(() => {
    if (!satellites || satellites.length === 0) return [];
    const result = [...satellites];
    
    const baseCount = satellites.length;
    if (baseCount < 60) {
      for (let i = 0; i < (80 - baseCount); i++) {
        const parent = satellites[i % baseCount];
        const isDebris = i % 3 !== 0;
        result.push({
          norad_id: 90000 + i,
          name: isDebris ? `DEBRIS FRAGMENT #${101 + i}` : `RB STAGE #${201 + i}`,
          type: isDebris ? 'DEBRIS' : 'ROCKET BODY',
          alt: Math.max(300, (parent.alt || 500) + ((i * 37) % 300) - 150),
          inclination: ((parent.inclination || 51.6) + ((i * 13) % 25) - 12) % 180,
          velocity_kms: 7.5 + ((i % 5) * 0.1),
          period: 94.0 + (i % 8) * 0.5,
          epoch: '2024-065',
          data_mode: parent.data_mode || 'DATA MODE: DEMO',
          source: 'Catalog Fragment Swarm'
        });
      }
    }
    return result;
  }, [satellites]);

  const activeSats = useMemo(() => {
    return expandedSats.filter((sat) => {
      if (selectedSat && selectedSat.norad_id === sat.norad_id) return true;
      if (sat.type === 'DEBRIS') return showDebris;
      if (sat.type === 'ROCKET BODY' || sat.type === 'INACTIVE') return showRocketBodies;
      return showSatellites;
    });
  }, [expandedSats, showSatellites, showDebris, showRocketBodies, selectedSat]);

  const { initialPositions, trailPositions, colors, trailColors } = useMemo(() => {
    const pos = [];
    const trailPos = [];
    const cols = [];
    const trailCols = [];

    activeSats.forEach((sat) => {
      const state = calculateOrbitalState(sat, 0);
      const stateTrail = calculateOrbitalState(sat, -0.4);

      pos.push(state.x, state.y, state.z);
      trailPos.push(stateTrail.x, stateTrail.y, stateTrail.z);

      const color = new THREE.Color();
      const trailColor = new THREE.Color();

      if (selectedSat && selectedSat.norad_id === sat.norad_id) {
        color.set('#FACC15'); // Yellow
        trailColor.set('#FDE047');
      } else if (sat.type === 'DEBRIS') {
        color.set('#EF4444'); // Red
        trailColor.set('#F87171');
      } else if (sat.type === 'ROCKET BODY' || sat.type === 'INACTIVE') {
        color.set('#F59E0B'); // Orange
        trailColor.set('#FBBF24');
      } else {
        color.set('#38BDF8'); // Cyan
        trailColor.set('#7DD3FC');
      }

      cols.push(color.r, color.g, color.b);
      trailCols.push(trailColor.r, trailColor.g, trailColor.b);
    });

    return {
      initialPositions: new Float32Array(pos),
      trailPositions: new Float32Array(trailPos),
      colors: new Float32Array(cols),
      trailColors: new Float32Array(trailCols)
    };
  }, [activeSats, selectedSat]);

  useFrame((state, delta) => {
    if (isPlaying) {
      simTimeRef.current += delta;
    }

    const currentT = simTimeRef.current + timelineOffsetSec;
    if (currentSimTimeRef) currentSimTimeRef.current = currentT;

    if (posAttrRef.current && trailAttrRef.current) {
      const arr = posAttrRef.current.array;
      const trailArr = trailAttrRef.current.array;
      const modelPosList = [];

      activeSats.forEach((sat, i) => {
        const state = calculateOrbitalState(sat, currentT);
        const stateTrail = calculateOrbitalState(sat, currentT - 0.35);

        arr[i * 3] = state.x;
        arr[i * 3 + 1] = state.y;
        arr[i * 3 + 2] = state.z;

        trailArr[i * 3] = stateTrail.x;
        trailArr[i * 3 + 1] = stateTrail.y;
        trailArr[i * 3 + 2] = stateTrail.z;

        if (i < 4 || (selectedSat && selectedSat.norad_id === sat.norad_id)) {
          modelPosList.push({
            id: sat.norad_id,
            pos: [state.x, state.y, state.z],
            isSelected: selectedSat && selectedSat.norad_id === sat.norad_id,
            color: sat.type === 'DEBRIS' ? '#EF4444' : '#38BDF8'
          });
        }

        if (selectedSat && selectedSat.norad_id === sat.norad_id && onUpdateSelectedState) {
          onUpdateSelectedState(state);
        }
      });

      posAttrRef.current.needsUpdate = true;
      trailAttrRef.current.needsUpdate = true;
      setModelPositions(modelPosList);
    }
  });

  const handlePointClick = (e) => {
    e.stopPropagation();
    const intersectPt = e.point;
    if (!intersectPt || !activeSats.length) return;
    
    let closestSat = null;
    let minDist = 1.2;
    const currentT = simTimeRef.current + timelineOffsetSec;

    activeSats.forEach((sat) => {
      const st = calculateOrbitalState(sat, currentT);
      const satVec = new THREE.Vector3(st.x, st.y, st.z);
      const dist = intersectPt.distanceTo(satVec);
      if (dist < minDist) {
        minDist = dist;
        closestSat = sat;
      }
    });

    if (closestSat && onSelectSat) {
      onSelectSat(closestSat);
    }
  };

  return (
    <group onClick={handlePointClick}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={trailAttrRef}
            attach="attributes-position"
            count={trailPositions.length / 3}
            array={trailPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={trailColors.length / 3}
            array={trailColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors={true}
          transparent={true}
          opacity={0.35}
          sizeAttenuation={true}
        />
      </points>

      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={posAttrRef}
            attach="attributes-position"
            count={initialPositions.length / 3}
            array={initialPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.11}
          vertexColors={true}
          transparent={true}
          opacity={0.95}
          sizeAttenuation={true}
        />
      </points>

      {modelPositions.map((m) => (
        <Satellite3DMesh
          key={m.id}
          position={m.pos}
          color={m.color}
          isSelected={m.isSelected}
        />
      ))}
    </group>
  );
}

// Thin, Elegant 3D Orbital Trajectory Lines Rendering
function OrbitalTrails({ satellites, selectedSat, visible, showSatellites, showDebris, showRocketBodies }) {
  const lines = useMemo(() => {
    if (!visible || !satellites || satellites.length === 0) return [];

    const filtered = satellites.filter((sat) => {
      if (selectedSat && selectedSat.norad_id === sat.norad_id) return true;
      if (sat.type === 'DEBRIS') return showDebris;
      if (sat.type === 'ROCKET BODY' || sat.type === 'INACTIVE') return showRocketBodies;
      return showSatellites;
    });

    const targetSats = selectedSat
      ? [selectedSat, ...filtered.slice(0, 24)]
      : filtered.slice(0, 26);

    return targetSats.map((sat) => {
      const pts = [];
      const steps = 96;
      for (let k = 0; k <= steps; k++) {
        const tSample = (k / steps) * 120.0;
        const st = calculateOrbitalState(sat, tSample);
        pts.push([st.x, st.y, st.z]);
      }
      return {
        id: sat.norad_id,
        color: selectedSat && selectedSat.norad_id === sat.norad_id ? '#FACC15' : 
               sat.type === 'DEBRIS' ? '#EF4444' :
               sat.type === 'ROCKET BODY' ? '#F59E0B' : '#38BDF8',
        width: selectedSat && selectedSat.norad_id === sat.norad_id ? 2.2 : 1.0,
        points: pts
      };
    });
  }, [satellites, selectedSat, visible, showSatellites, showDebris, showRocketBodies]);

  if (!visible || lines.length === 0) return null;

  return (
    <group>
      {lines.map((line) => (
        <Line
          key={line.id}
          points={line.points}
          color={line.color}
          lineWidth={line.width}
          dashed={false}
          transparent={true}
          opacity={0.60}
        />
      ))}
    </group>
  );
}

export default function GlobeView({
  satellites,
  selectedSat,
  setSelectedSat,
  selectedConjunction,
  setSelectedConjunction,
  conjunctions = [],
  trajectory
}) {
  const controlsRef = useRef();
  const currentSimTimeRef = useRef(0);

  const [showOrbit, setShowOrbit] = useState(true);
  const [showSatellites, setShowSatellites] = useState(true);
  const [showDebris, setShowDebris] = useState(true);
  const [showRocketBodies, setShowRocketBodies] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeStepIndex, setTimeStepIndex] = useState(0);
  const [liveSelectedState, setLiveSelectedState] = useState(null);

  const dataMode = satellites[0]?.data_mode || "DATA MODE: DEMO";

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Timeline offset steps (Extended up to +48 hours as requested)
  const timelineSteps = [
    { label: 'Current', index: 0, offsetSec: 0 },
    { label: '+10m', index: 1, offsetSec: 600 },
    { label: '+30m', index: 2, offsetSec: 1800 },
    { label: '+1h', index: 3, offsetSec: 3600 },
    { label: '+3h', index: 4, offsetSec: 10800 },
    { label: '+6h', index: 5, offsetSec: 21600 },
    { label: '+12h', index: 6, offsetSec: 43200 },
    { label: '+24h', index: 7, offsetSec: 86400 },
    { label: '+48h', index: 8, offsetSec: 172800 }
  ];

  const currentTimeline = timelineSteps[timeStepIndex] || timelineSteps[0];

  // Primary & secondary objects in selected conjunction for 3D visual vector line
  const conjunctionPrimarySat = useMemo(() => {
    if (!selectedConjunction) return selectedSat;
    return satellites.find(s => s.norad_id === selectedConjunction.primary_norad_id) || selectedSat;
  }, [selectedConjunction, selectedSat, satellites]);

  const conjunctionSecondarySat = useMemo(() => {
    if (!selectedConjunction) return null;
    return satellites.find(s => s.norad_id === selectedConjunction.secondary_norad_id);
  }, [selectedConjunction, satellites]);

  const getRiskLevel = (sat) => {
    if (!sat) return "NOMINAL";
    if (sat.norad_id % 7 === 0 || sat.risk_level === 'CRITICAL') return "CRITICAL ALERT";
    if (sat.type === 'DEBRIS') return "MODERATE THREAT";
    if (sat.type === 'ROCKET BODY' || sat.type === 'INACTIVE') return "HIGH RISK";
    return "LOW / NOMINAL";
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-space-dark overflow-hidden font-mono">
      
      {/* Top Left Header & Controls Card */}
      <div className="absolute top-4 left-4 z-10 space-y-3 pointer-events-none">
        <div className="bg-space-card/90 backdrop-blur-md border border-space-border p-4 rounded-xl shadow-2xl max-w-sm pointer-events-auto space-y-3">
          
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wider flex items-center">
              <Radio className="w-4 h-4 text-sky-400 mr-2 animate-pulse" />
              3D SPACE VIEW
            </h2>
            <Badge type={dataMode} size="small" />
          </div>

          <p className="text-[11px] text-slate-400 font-sans">
            Interactive Space Situational Awareness globe powered by SGP4 orbital propagation.
          </p>

          {/* Color Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-space-border/60 pt-2.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50"></span>
              <span className="text-slate-300">Active Satellite</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
              <span className="text-slate-300">Space Debris</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
              <span className="text-slate-300">Inactive / Rocket Body</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50"></span>
              <span className="text-slate-300">Selected Target</span>
            </div>
          </div>

          {/* Core Camera & Visibility Action Buttons */}
          <div className="flex items-center space-x-2 border-t border-space-border/60 pt-2.5">
            <button
              onClick={() => setShowOrbit(!showOrbit)}
              className={`flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showOrbit ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'bg-space-dark text-slate-400 border-space-border'
              }`}
            >
              {showOrbit ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showOrbit ? 'HIDE ORBIT' : 'SHOW ORBIT'}</span>
            </button>

            <button
              onClick={resetCamera}
              className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-space-dark hover:bg-space-border text-slate-300 rounded-lg text-xs border border-space-border transition"
              title="Reset 3D View Camera"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Reset Cam</span>
            </button>
          </div>

          {/* Object Category Filters */}
          <div className="grid grid-cols-3 gap-1.5 border-t border-space-border/60 pt-2.5">
            <button
              onClick={() => setShowSatellites(!showSatellites)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                showSatellites ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'bg-space-dark text-slate-500 border-space-border'
              }`}
              title="Toggle Active Satellites"
            >
              SAT ({showSatellites ? 'ON' : 'OFF'})
            </button>
            <button
              onClick={() => setShowDebris(!showDebris)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                showDebris ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-space-dark text-slate-500 border-space-border'
              }`}
              title="Toggle Space Debris"
            >
              DEBRIS ({showDebris ? 'ON' : 'OFF'})
            </button>
            <button
              onClick={() => setShowRocketBodies(!showRocketBodies)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                showRocketBodies ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-space-dark text-slate-500 border-space-border'
              }`}
              title="Toggle Rocket Bodies & Inactive Objects"
            >
              ROCKET ({showRocketBodies ? 'ON' : 'OFF'})
            </button>
          </div>

        </div>
      </div>

      {/* Conjunction 3D Focus HUD Overlay Card */}
      {selectedConjunction && (
        <div className="absolute top-4 right-4 z-20 w-96 bg-space-card/95 backdrop-blur-md border border-red-500/50 p-5 rounded-2xl shadow-2xl space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto font-mono">
          <div className="flex items-center justify-between border-b border-space-border pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              <div>
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest block">3D CONJUNCTION FOCUS</span>
                <h3 className="text-sm font-bold text-white">
                  {selectedConjunction.primary_name} vs {selectedConjunction.secondary_name}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedConjunction(null)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-space-dark border border-space-border rounded-md"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">MISS DISTANCE</span>
              <span className="text-red-400 font-bold text-sm">{selectedConjunction.miss_distance_km} km</span>
            </div>
            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">RELATIVE VELOCITY</span>
              <span className="text-white font-bold">{selectedConjunction.relative_velocity_kms || 12.4} km/s</span>
            </div>
            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border col-span-2">
              <span className="text-slate-400 text-[10px] block">POTENTIAL VULNERABLE SUBSYSTEM</span>
              <span className="text-amber-400 font-bold text-xs">{selectedConjunction.vulnerable_subsystem || "Solar Array"}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                {selectedConjunction.vulnerability_reason || "Approach geometry intersects estimated solar array wingspan."}
              </span>
            </div>
            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border col-span-2">
              <span className="text-slate-400 text-[10px] block">ESTIMATED OUTCOME (MODEL PREDICTION)</span>
              <span className="text-slate-200 text-[11px] font-sans block mt-0.5">
                {selectedConjunction.potential_outcome || "Power-generation degradation possible."}
              </span>
            </div>
            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border col-span-2">
              <span className="text-slate-400 text-[10px] block">RECOMMENDED ACTION</span>
              <span className="text-emerald-400 font-semibold text-[11px] font-sans block mt-0.5">
                {selectedConjunction.recommended_action || "Perform collision avoidance assessment & TLE monitoring."}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-space-border text-[10px]">
            <Badge type="MODEL ESTIMATE" size="small" />
            <span className="text-sky-400 font-semibold uppercase">OPERATOR REVIEW REQUIRED</span>
          </div>
        </div>
      )}

      {/* Selected Target Information Sidebar Panel */}
      {selectedSat && !selectedConjunction && (
        <div className="absolute top-4 right-4 z-10 w-96 bg-space-card/95 backdrop-blur-md border border-sky-500/40 p-5 rounded-2xl shadow-2xl space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
          
          <div className="flex items-center justify-between border-b border-space-border pb-3">
            <div>
              <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-widest block">Selected Target</span>
              <h3 className="text-base font-bold text-white">{selectedSat.name}</h3>
            </div>
            <button
              onClick={() => setSelectedSat(null)}
              className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-space-dark border border-space-border rounded-md"
            >
              ✕
            </button>
          </div>

          {/* Primary Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            
            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">NORAD ID</span>
              <span className="text-sky-400 font-bold text-sm">{selectedSat.norad_id}</span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">OBJECT TYPE</span>
              <span className={`font-bold text-xs ${
                selectedSat.type === 'DEBRIS' ? 'text-red-400' : 
                selectedSat.type === 'ROCKET BODY' ? 'text-amber-400' : 'text-sky-400'
              }`}>
                {selectedSat.type}
              </span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">ALTITUDE</span>
              <span className="text-white font-bold">
                {liveSelectedState ? liveSelectedState.alt.toFixed(1) : (selectedSat.alt || 420.0).toFixed(1)} km
              </span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">VELOCITY</span>
              <span className="text-white font-bold">
                {liveSelectedState ? liveSelectedState.velocity_kms.toFixed(2) : (selectedSat.velocity_kms || 7.66).toFixed(2)} km/s
              </span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">INCLINATION</span>
              <span className="text-white font-bold">{selectedSat.inclination}°</span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">RISK LEVEL</span>
              <span className={`font-bold text-xs ${
                getRiskLevel(selectedSat).includes('CRITICAL') ? 'text-red-400 animate-pulse' :
                getRiskLevel(selectedSat).includes('HIGH') ? 'text-amber-400' :
                getRiskLevel(selectedSat).includes('MODERATE') ? 'text-yellow-400' : 'text-emerald-400'
              }`}>
                {getRiskLevel(selectedSat)}
              </span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">ORBITAL PERIOD</span>
              <span className="text-white font-bold">{selectedSat.period || '92.9'} min</span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border">
              <span className="text-slate-400 text-[10px] block">TLE EPOCH</span>
              <span className="text-slate-200 font-bold text-[11px]">{selectedSat.epoch || '2024-065'}</span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border col-span-2">
              <span className="text-slate-400 text-[10px] block">LIVE GEODETIC POSITION</span>
              <span className="text-sky-300 font-bold">
                {liveSelectedState ? liveSelectedState.lat.toFixed(2) : (selectedSat.lat || 0).toFixed(2)}° N, {liveSelectedState ? liveSelectedState.lon.toFixed(2) : (selectedSat.lon || 0).toFixed(2)}° E
              </span>
            </div>

            <div className="bg-space-dark/80 p-2.5 rounded-lg border border-space-border col-span-2">
              <span className="text-slate-400 text-[10px] block">SOURCE CATALOG</span>
              <span className="text-slate-300 font-bold text-[11px]">{selectedSat.source || 'CelesTrak Public Data'}</span>
            </div>
          </div>

          {/* Trajectory Label Badge */}
          <div className="flex items-center justify-between pt-2 border-t border-space-border">
            <Badge type={selectedSat.data_mode || "DATA MODE: DEMO"} size="small" />
            <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
              SGP4 LIVE PROPAGATION
            </span>
          </div>

        </div>
      )}

      {/* Bottom Timeline & Play/Pause Control Panel */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-space-card/95 backdrop-blur-md border border-space-border p-3 rounded-2xl shadow-2xl flex items-center space-x-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-lg ${
            isPlaying
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
              : 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/20'
          }`}
          title={isPlaying ? 'Pause Motion' : 'Play Live Motion'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <div className="h-4 w-px bg-space-border"></div>

        <div className="flex items-center space-x-2 text-xs text-sky-400 px-1">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-bold hidden sm:inline">Timeline:</span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-md sm:max-w-none">
          {timelineSteps.map((step) => (
            <button
              key={step.label}
              onClick={() => setTimeStepIndex(step.index)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                timeStepIndex === step.index
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'bg-space-dark text-slate-400 hover:text-white border border-space-border'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D R3F Canvas - Initial Camera at [0, 0, 9.0] framing Earth at ~67% Viewport Height */}
      <Canvas
        camera={{ position: [0, 0, 9.0], fov: 45 }}
        onPointerDown={(e) => {
          if (e.target.tagName === 'CANVAS' && (selectedSat || selectedConjunction)) {
            setSelectedSat(null);
            setSelectedConjunction(null);
          }
        }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[-16, 5, 12]} intensity={2.6} />
        <Stars radius={100} depth={50} count={7000} factor={5} saturation={0} fade speed={1} />
        
        <Suspense fallback={null}>
          <PhotorealisticEarth />
        </Suspense>

        <AnimatedSatellitePoints
          satellites={satellites}
          selectedSat={selectedSat}
          onSelectSat={setSelectedSat}
          isPlaying={isPlaying}
          timelineOffsetSec={currentTimeline.offsetSec}
          onUpdateSelectedState={setLiveSelectedState}
          showSatellites={showSatellites}
          showDebris={showDebris}
          showRocketBodies={showRocketBodies}
          currentSimTimeRef={currentSimTimeRef}
        />

        <OrbitalTrails
          satellites={satellites}
          selectedSat={selectedSat}
          visible={showOrbit}
          showSatellites={showSatellites}
          showDebris={showDebris}
          showRocketBodies={showRocketBodies}
        />

        {conjunctionPrimarySat && conjunctionSecondarySat && (
          <Conjunction3DLine
            primarySat={conjunctionPrimarySat}
            secondarySat={conjunctionSecondarySat}
            tSeconds={currentSimTimeRef.current}
          />
        )}

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={0.8}
          rotateSpeed={0.5}
          minDistance={3.0}
          maxDistance={20.0}
        />
      </Canvas>

    </div>
  );
}
