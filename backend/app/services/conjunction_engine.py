import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import Satellite, ConjunctionEvent, AlertRecord
from .orbital_engine import OrbitalEngine

class SubsystemVulnerabilityModel:
    @staticmethod
    def estimate_vulnerability(sat_a: Satellite, sat_b: Satellite, miss_dist_km: float, rel_vel_kms: float) -> Dict[str, str]:
        """
        Model-based estimate of vulnerable spacecraft subsystem, potential outcome, and recommended actions.
        Explicitly labeled as MODEL ESTIMATE.
        """
        inc_diff = abs((sat_a.inclination or 51.6) - (sat_b.inclination or 51.6))
        
        if rel_vel_kms > 11.0 or miss_dist_km < 1.0:
            subsystem = "Primary Structural Frame"
            reason = f"Hypervelocity encounter ({rel_vel_kms:.1f} km/s) at high cross-track angle ({inc_diff:.1f}°)."
            outcome = "Potential kinetic impact risk; total mission degradation or fragmentation risk."
            rec = "Immediate COLA burn evaluation & emergency collision-avoidance screening."
            conf = "High" if miss_dist_km < 1.0 else "Medium"
        elif inc_diff < 20.0:
            subsystem = "Solar Array"
            reason = f"Co-planar approach ({rel_vel_kms:.1f} km/s) intersecting extended solar array wingspan region."
            outcome = "Power-generation degradation possible; solar wing attitude torque disturbance."
            rec = "Perform collision-avoidance assessment; evaluate solar array trim angle adjustment."
            conf = "Medium"
        elif rel_vel_kms < 6.0:
            subsystem = "Communication Antenna"
            reason = f"Low relative velocity ({rel_vel_kms:.1f} km/s) approaching forward telemetry payload assembly."
            outcome = "Possible telemetry signal degradation or RF reflector surface pitting."
            rec = "Schedule targeted radar tracking & monitor 12h TLE refresh."
            conf = "Medium"
        elif sat_a.norad_id % 3 == 0:
            subsystem = "Propulsion Subsystem"
            reason = f"Approach trajectory intersects aft propulsion module and RCS thruster manifold."
            outcome = "Propulsion line hazard; potential attitude control impairment."
            rec = "Prepare thruster warm-up sequence & verify collision-avoidance burn timeline."
            conf = "Medium"
        else:
            subsystem = "Thermal Control Radiator"
            reason = f"Approach vector grazing zenith thermal radiator panel."
            outcome = "Thermal insulation degradation; localized bus heating risk."
            rec = "Monitor 12-hour TLE propagation and log close-approach metrics."
            conf = "Low"

        return {
            "vulnerable_subsystem": subsystem,
            "vulnerability_confidence": conf,
            "vulnerability_reason": reason,
            "potential_outcome": outcome,
            "recommended_action": rec
        }

class ConjunctionEngine:
    @staticmethod
    def screen_all_pairs(db: Session, hours: float = 24.0, threshold_km: float = 1000.0) -> List[Dict[str, Any]]:
        """Screen all satellite/debris pairs over future prediction window to identify close approaches."""
        satellites = db.query(Satellite).all()
        if len(satellites) < 2:
            return []

        events = []
        screened_pairs = set()

        for i in range(len(satellites)):
            for j in range(i + 1, len(satellites)):
                sat_a = satellites[i]
                sat_b = satellites[j]
                
                if sat_a.norad_id == sat_b.norad_id:
                    continue

                pair_key = tuple(sorted([sat_a.norad_id, sat_b.norad_id]))
                if pair_key in screened_pairs:
                    continue
                screened_pairs.add(pair_key)

                res = OrbitalEngine.calculate_conjunction(
                    sat_a.line1, sat_a.line2,
                    sat_b.line1, sat_b.line2,
                    hours=hours
                )

                if res["miss_distance_km"] <= threshold_km:
                    vuln = SubsystemVulnerabilityModel.estimate_vulnerability(
                        sat_a, sat_b, res["miss_distance_km"], res["relative_velocity_kms"]
                    )
                    now_utc = datetime.now(timezone.utc)
                    tca_val = res["tca"]
                    if tca_val.tzinfo is None:
                        tca_val = tca_val.replace(tzinfo=timezone.utc)
                    
                    diff_sec = (tca_val - now_utc).total_seconds()
                    if abs(diff_sec) < 1800:
                        enc_phase = "NOW"
                    elif 0 <= diff_sec <= 21600:
                        enc_phase = "TCA"
                    elif diff_sec > 21600:
                        enc_phase = "CLOSE APPROACH"
                    else:
                        enc_phase = "POST-ENCOUNTER"

class PriorityScoreEngine:
    @staticmethod
    def calculate_priority_score(miss_dist_km: float, rel_vel_kms: float, prob: float, is_protected: bool = True) -> float:
        m_score = max(0.0, 40.0 * (1.0 - min(miss_dist_km, 10.0) / 10.0))
        v_score = min(20.0, rel_vel_kms * 1.5)
        p_score = min(25.0, prob * 2500.0)
        a_score = 15.0 if is_protected else 5.0
        total = m_score + v_score + p_score + a_score
        return round(min(99.0, max(15.0, total)), 1)

class SpaceImpactChainEngine:
    @staticmethod
    def generate_impact_chain(primary_name: str, secondary_name: str, subsystem: str, miss_dist: float) -> Dict[str, Any]:
        return {
            "debris": secondary_name,
            "orbit": "Low Earth Orbit (LEO Shell)",
            "conjunction": f"Close Approach predicted at {miss_dist:.1f} km",
            "satellite": primary_name,
            "subsystem": subsystem,
            "mission": "Broadband & Operational Infrastructure",
            "public_service": "Global Telecommunications & Earth Data Links",
            "human_impact": "Potential temporary communications service degradation if orbital impact occurs."
        }

class ScenarioEngine:
    @staticmethod
    def simulate_what_if(orig_miss_km: float, orig_risk: str, orig_score: float, new_miss_km: float = None, burn_m_s: float = None) -> Dict[str, Any]:
        sim_miss = orig_miss_km
        if new_miss_km is not None:
            sim_miss = new_miss_km
        elif burn_m_s is not None:
            sim_miss = max(0.1, orig_miss_km + (burn_m_s * 4.2))

        if sim_miss < 1.0:
            sim_risk = "CRITICAL"
        elif sim_miss < 5.0:
            sim_risk = "HIGH"
        elif sim_miss < 15.0:
            sim_risk = "MEDIUM"
        else:
            sim_risk = "LOW"

        sim_score = PriorityScoreEngine.calculate_priority_score(sim_miss, 7.6, 0.001)

        summary = f"Simulated encounter separation shift: {orig_miss_km:.1f} km → {sim_miss:.1f} km. Risk classification transitioned from {orig_risk} to {sim_risk}."
        rec = "Execute collision-avoidance maneuver (COLA) prior to TCA." if sim_risk in ["HIGH", "CRITICAL"] else "Continue tracking; no immediate avoidance maneuver required."

        return {
            "original_miss_distance_km": orig_miss_km,
            "simulated_miss_distance_km": sim_miss,
            "original_risk_level": orig_risk,
            "simulated_risk_level": sim_risk,
            "original_priority_score": orig_score,
            "simulated_priority_score": sim_score,
            "scenario_summary": summary,
            "recommended_decision": rec
        }

    @staticmethod
    def get_risk_summary(db: Session) -> Dict[str, Any]:
        """Compute qualitative risk classification summary across stored conjunction events."""
        events = db.query(ConjunctionEvent).all()
        total = len(events)
        critical = sum(1 for e in events if e.risk_level == "CRITICAL")
        high = sum(1 for e in events if e.risk_level == "HIGH")
        medium = sum(1 for e in events if e.risk_level == "MEDIUM")
        low = sum(1 for e in events if e.risk_level == "LOW")

        first_sat = db.query(Satellite).first()
        data_mode = first_sat.data_mode if first_sat else "DATA MODE: DEMO"

        return {
            "total_conjunctions": total,
            "risk_categories": {
                "critical": critical,
                "high": high,
                "medium": medium,
                "low": low
            },
            "data_mode": data_mode,
            "disclaimer": "Prototype conjunction screening based on orbital propagation. Subsystem vulnerability is a model estimate and does NOT constitute certified physical impact prediction."
        }
