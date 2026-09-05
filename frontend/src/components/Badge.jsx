import React from 'react';
import { ShieldCheck, Database, Cpu, Activity, Satellite } from 'lucide-react';

export default function Badge({ type = "DATA MODE: DEMO", size = "normal" }) {
  let bg = "bg-amber-950/80 text-amber-400 border-amber-600/50";
  let icon = <Database className="w-3.5 h-3.5 mr-1" />;

  const upperType = (type || "").toUpperCase();

  if (upperType === "REAL DATA") {
    bg = "bg-sky-950/80 text-sky-400 border-sky-600/50";
    icon = <ShieldCheck className="w-3.5 h-3.5 mr-1" />;
  } else if (upperType.includes("PUBLIC TLE") || upperType.includes("CELESTRAK")) {
    bg = "bg-cyan-950/80 text-cyan-300 border-cyan-600/50";
    icon = <Satellite className="w-3.5 h-3.5 mr-1" />;
  } else if (upperType.includes("DEMO") || upperType === "DATA MODE: DEMO") {
    bg = "bg-amber-950/80 text-amber-400 border-amber-600/50";
    icon = <Database className="w-3.5 h-3.5 mr-1" />;
  } else if (upperType.includes("SIMULATION")) {
    bg = "bg-purple-950/80 text-purple-300 border-purple-600/50";
    icon = <Activity className="w-3.5 h-3.5 mr-1" />;
  } else if (upperType.includes("AI PREDICTION") || upperType.includes("AI PREDICTION — PROTOTYPE")) {
    bg = "bg-emerald-950/80 text-emerald-400 border-emerald-600/50";
    icon = <Cpu className="w-3.5 h-3.5 mr-1" />;
  }

  const py = size === "small" ? "py-0.5 px-2 text-xs" : "py-1 px-2.5 text-xs font-semibold";

  return (
    <span className={`inline-flex items-center rounded-md border ${bg} ${py} tracking-wide uppercase font-mono shadow-sm`}>
      {icon}
      {type}
    </span>
  );
}
