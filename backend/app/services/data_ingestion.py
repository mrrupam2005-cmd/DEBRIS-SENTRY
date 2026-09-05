import json
import os
import requests
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from ..models import (
    Satellite, ConjunctionEvent, AlertRecord, SpaceEnvironmentRecord, 
    CommunicationRiskRecord, ProtectedAssetRecord, CelestialEventRecord, ReEntryRiskRecord,
    NearEarthObjectRecord, PublicAlert, NotificationPreferenceRecord
)
from .orbital_engine import OrbitalEngine
from .conjunction_engine import SubsystemVulnerabilityModel, PriorityScoreEngine, SpaceImpactChainEngine

CELESTRAK_ACTIVE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json"

class DataIngestionService:
    @staticmethod
    def seed_initial_catalog(db: Session):
        """Populate database from sample TLE JSON or CelesTrak on startup."""
        existing_count = db.query(Satellite).count()
        if existing_count == 0:
            json_path = os.path.join(os.path.dirname(__file__), "..", "data", "sample_tles.json")
            if os.path.exists(json_path):
                with open(json_path, "r", encoding="utf-8") as f:
                    tles_data = json.load(f)
                    
                for item in tles_data:
                    parsed = OrbitalEngine.parse_tle_elements(item["line1"], item["line2"])
                    norad = item["norad_id"]
                    
                    avg_alt = (parsed["apogee"] + parsed["perigee"]) / 2.0
                    if avg_alt < 2000:
                        o_class = "LEO"
                    elif avg_alt < 35000:
                        o_class = "MEO"
                    elif avg_alt < 36500:
                        o_class = "GEO"
                    else:
                        o_class = "HEO"

                    # Explicit metadata mappings without inventing data
                    if norad == 25544:
                        c_name = "ISS / LEO Ops"
                        d_class = "Payload"
                        h_impact = "Human spaceflight habitat & zero-g research laboratory carrying astronaut crew."
                        l_site = "Baikonur Cosmodrome Site 1/5"
                        l_country = "Kazakhstan"
                        miss = "Human Spaceflight & Microgravity Research"
                        op_stat = "ACTIVE"
                        t_level = "MEDIUM"
                        assoc_prog = "International Space Station Program"
                        threat_sats = "None (Primary Operational Station)"
                    elif norad == 20580:
                        c_name = "LEO General"
                        d_class = "Payload"
                        h_impact = "Deep space astronomical observation observatory."
                        l_site = "Kennedy Space Center LC-39B"
                        l_country = "United States"
                        miss = "Deep Space Astronomical Observation"
                        op_stat = "ACTIVE"
                        t_level = "LOW"
                        assoc_prog = "Hubble Space Telescope Program"
                        threat_sats = "None (Primary Asset)"
                    elif norad == 44713:
                        c_name = "Starlink Constellation"
                        d_class = "Payload"
                        h_impact = "Provides global broadband internet & communications connectivity."
                        l_site = "Cape Canaveral SLC-40"
                        l_country = "United States"
                        miss = "Broadband Satellite Telecommunications"
                        op_stat = "ACTIVE"
                        t_level = "CRITICAL"
                        assoc_prog = "Starlink Constellation"
                        threat_sats = "None (Primary Asset)"
                    elif norad == 33749:
                        c_name = "Legacy Fragmentation Zone"
                        d_class = "Fragmentation Debris"
                        h_impact = "Hypervelocity collision fragment endangering surrounding Low Earth Orbits."
                        l_site = "Plesetsk Cosmodrome"
                        l_country = "Russia"
                        miss = "Not available"
                        op_stat = "INACTIVE"
                        t_level = "HIGH"
                        assoc_prog = "Cosmos 2251 / Iridium 33 Collision Event (2009)"
                        threat_sats = "ISS (ZARYA), LEO Constellations"
                    elif norad == 31113:
                        c_name = "Legacy Fragmentation Zone"
                        d_class = "Fragmentation Debris"
                        h_impact = "Hypervelocity collision fragment endangering surrounding Low Earth Orbits."
                        l_site = "Taiyuan Satellite Launch Center"
                        l_country = "China"
                        miss = "Not available"
                        op_stat = "INACTIVE"
                        t_level = "CRITICAL"
                        assoc_prog = "Fengyun 1C Anti-Satellite Test (2007)"
                        threat_sats = "STARLINK-1007, Sun-Synchronous Satellites"
                    elif norad == 27386:
                        c_name = "LEO General"
                        d_class = "Defunct Satellite"
                        h_impact = "Inactive Earth observation satellite drifting in Sun-synchronous orbit."
                        l_site = "Guiana Space Centre ELA-3"
                        l_country = "France (French Guiana)"
                        miss = "Earth Observation & Environmental Monitoring"
                        op_stat = "INACTIVE"
                        t_level = "MEDIUM"
                        assoc_prog = "Envisat Program (ESA)"
                        threat_sats = "Sun-Synchronous Orbits"
                    elif norad == 22218:
                        c_name = "Spent Upper Stages"
                        d_class = "Rocket Body"
                        h_impact = "Large uncontrolled rocket body prone to atmospheric decay and collision."
                        l_site = "Baikonur Cosmodrome"
                        l_country = "Kazakhstan"
                        miss = "Not available"
                        op_stat = "INACTIVE"
                        t_level = "LOW"
                        assoc_prog = "Zenit-2 Launch Vehicle Upper Stage"
                        threat_sats = "LEO Shell Satellites"
                    elif norad == 43013:
                        c_name = "Unruly Orbital Debris"
                        d_class = "Mission-related Debris"
                        h_impact = "Untracked orbital fragment capable of causing kinetic impact damage."
                        l_site = "Jiuquan Satellite Launch Center"
                        l_country = "China"
                        miss = "Not available"
                        op_stat = "INACTIVE"
                        t_level = "LOW"
                        assoc_prog = "Tiangong-2 Space Lab Mission Debris"
                        threat_sats = "Low LEO Satellites"
                    else:
                        c_name = "LEO Debris Field" if item["type"] == "DEBRIS" else "LEO General"
                        d_class = "Unknown Object" if item["type"] == "DEBRIS" else "Payload"
                        h_impact = "Satellite infrastructure or untracked fragment."
                        l_site = "Not available"
                        l_country = "Unknown"
                        miss = "Not available"
                        op_stat = "UNKNOWN" if item["type"] == "DEBRIS" else "ACTIVE"
                        t_level = "LOW"
                        assoc_prog = "Not available"
                        threat_sats = "Unknown"

                    sat = Satellite(
                        norad_id=norad,
                        name=item["name"],
                        type=item["type"],
                        country=item.get("country", "UNKNOWN"),
                        inclination=parsed["inclination"],
                        eccentricity=parsed["eccentricity"],
                        apogee=parsed["apogee"],
                        perigee=parsed["perigee"],
                        period=parsed["period"],
                        rcs=item.get("rcs", "MEDIUM"),
                        line1=item["line1"],
                        line2=item["line2"],
                        epoch=parsed["epoch"],
                        source="LOCAL DEMO CATALOG",
                        data_mode="DATA MODE: DEMO",
                        source_type="DEMO DATA",
                        debris_class=d_class,
                        constellation=c_name,
                        human_impact_reason=h_impact,
                        orbit_class=o_class,
                        launch_site=l_site,
                        launch_country=l_country,
                        mission=miss,
                        operational_status=op_stat,
                        threat_level=t_level,
                        associated_program=assoc_prog,
                        threatened_satellites=threat_sats
                    )
                    db.add(sat)
                db.commit()

        # Ensure seed conjunction events exist with full subsystem vulnerability attributes
        conj_count = db.query(ConjunctionEvent).count()
        if conj_count == 0:
            sat_iss = db.query(Satellite).filter(Satellite.norad_id == 25544).first()
            sat_deb1 = db.query(Satellite).filter(Satellite.norad_id == 33749).first()
            sat_deb2 = db.query(Satellite).filter(Satellite.norad_id == 31113).first()
            sat_star = db.query(Satellite).filter(Satellite.norad_id == 44713).first()

            if sat_iss and sat_deb1:
                c1 = OrbitalEngine.calculate_conjunction(sat_iss.line1, sat_iss.line2, sat_deb1.line1, sat_deb1.line2)
                p1 = PriorityScoreEngine.calculate_priority_score(c1["miss_distance_km"], c1["relative_velocity_kms"], c1["collision_probability"], True)
                chain1 = SpaceImpactChainEngine.generate_impact_chain(sat_iss.name, sat_deb1.name, "Solar Array Wingspan", c1["miss_distance_km"])
                e1 = ConjunctionEvent(
                    primary_norad_id=sat_iss.norad_id,
                    secondary_norad_id=sat_deb1.norad_id,
                    primary_name=sat_iss.name,
                    secondary_name=sat_deb1.name,
                    tca=c1["tca"],
                    miss_distance_km=c1["miss_distance_km"],
                    radial_miss_km=c1["radial_miss_km"],
                    intrack_miss_km=c1["intrack_miss_km"],
                    crosstrack_miss_km=c1["crosstrack_miss_km"],
                    relative_velocity_kms=c1["relative_velocity_kms"],
                    collision_probability=c1["collision_probability"],
                    risk_level="HIGH" if c1["miss_distance_km"] < 1000 else "MEDIUM",
                    warning_level="HIGH",
                    encounter_phase="CLOSE APPROACH",
                    vulnerable_subsystem="Solar Array Wingspan",
                    vulnerability_confidence="High",
                    vulnerability_reason="Co-planar approach trajectory intersecting extended solar array wingspan region.",
                    potential_outcome="Power-generation degradation possible; solar wing torque disturbance.",
                    recommended_action="Perform collision-avoidance assessment; evaluate solar array trim angle adjustment.",
                    priority_score=p1,
                    tle_age_hours=3.5,
                    prediction_confidence_pct=78.0,
                    position_uncertainty_km=0.18,
                    impact_severity="HIGH",
                    public_impact_description="Human spaceflight habitat carrying crew members; supports continuous orbital microgravity laboratory operations.",
                    space_impact_chain=chain1,
                    is_reviewed=False,
                    source_type="SIMULATION"
                )
                db.add(e1)

            if sat_star and sat_deb2:
                c2 = OrbitalEngine.calculate_conjunction(sat_star.line1, sat_star.line2, sat_deb2.line1, sat_deb2.line2)
                p2 = PriorityScoreEngine.calculate_priority_score(1.2, 12.4, 0.0048, True)
                chain2 = SpaceImpactChainEngine.generate_impact_chain(sat_star.name, sat_deb2.name, "Communication Antenna Bay", 1.2)
                e2 = ConjunctionEvent(
                    primary_norad_id=sat_star.norad_id,
                    secondary_norad_id=sat_deb2.norad_id,
                    primary_name=sat_star.name,
                    secondary_name=sat_deb2.name,
                    tca=datetime.now(timezone.utc) + timedelta(hours=18, minutes=24),
                    miss_distance_km=1.2,
                    radial_miss_km=0.3,
                    intrack_miss_km=0.8,
                    crosstrack_miss_km=0.7,
                    relative_velocity_kms=12.4,
                    collision_probability=0.0048,
                    risk_level="CRITICAL",
                    warning_level="CRITICAL",
                    encounter_phase="NOW",
                    vulnerable_subsystem="Communication Antenna Bay",
                    vulnerability_confidence="High",
                    vulnerability_reason="High relative velocity encounter approaching forward telemetry payload assembly.",
                    potential_outcome="Telemetry signal disruption risk; potential RF reflector surface pitting.",
                    recommended_action="Immediate COLA burn evaluation & emergency orbital maneuver screening.",
                    priority_score=p2,
                    tle_age_hours=2.1,
                    prediction_confidence_pct=86.0,
                    position_uncertainty_km=0.08,
                    impact_severity="CRITICAL",
                    public_impact_description="Provides global broadband satellite internet connectivity to remote areas worldwide.",
                    space_impact_chain=chain2,
                    is_reviewed=False,
                    source_type="SIMULATION"
                )
                db.add(e2)

            db.commit()

        # Seed Protected Assets
        protected_count = db.query(ProtectedAssetRecord).count()
        if protected_count == 0:
            assets = [
                ProtectedAssetRecord(
                    norad_id=25544,
                    name="ISS (ZARYA)",
                    asset_type="Crewed Space Habitat",
                    mission="Microgravity Laboratory & Human Spaceflight",
                    operator="US / Russia / ESA / JAXA / CSA",
                    orbit_class="LEO",
                    status="ACTIVE",
                    threat_count=1,
                    highest_risk_level="HIGH",
                    next_critical_event="Close approach screening active"
                ),
                ProtectedAssetRecord(
                    norad_id=44713,
                    name="STARLINK-1007",
                    asset_type="Telecom Broadband Payload",
                    mission="Global Internet Services",
                    operator="United States (SpaceX)",
                    orbit_class="LEO",
                    status="ACTIVE",
                    threat_count=1,
                    highest_risk_level="CRITICAL",
                    next_critical_event="TCA in 18h 24m (1.2 km miss)"
                ),
                ProtectedAssetRecord(
                    norad_id=20580,
                    name="HST (HUBBLE)",
                    asset_type="Space Telescope Observatory",
                    mission="Deep Space Astrophysics",
                    operator="United States (NASA/ESA)",
                    orbit_class="LEO",
                    status="ACTIVE",
                    threat_count=0,
                    highest_risk_level="LOW",
                    next_critical_event="Nominal Orbit"
                ),
                ProtectedAssetRecord(
                    norad_id=27386,
                    name="ENVISAT",
                    asset_type="Earth Observation Platform",
                    mission="Environmental Remote Sensing",
                    operator="ESA (Europe)",
                    orbit_class="LEO",
                    status="INACTIVE",
                    threat_count=0,
                    highest_risk_level="MEDIUM",
                    next_critical_event="Defunct Satellite Drift"
                )
            ]
            db.add_all(assets)
            db.commit()

        # Seed Celestial Events
        celestial_count = db.query(CelestialEventRecord).count()
        if celestial_count == 0:
            events = [
                CelestialEventRecord(
                    event_name="Lunar Eclipse Penumbral Shadow Passage",
                    event_type="LUNAR ECLIPSE",
                    event_date="Upcoming May 2026",
                    operational_consideration="Temporary solar panel shadow entry; power management & battery discharge monitoring.",
                    impact_level="LOW / INFORMATIONAL"
                ),
                CelestialEventRecord(
                    event_name="Perseid Meteoroid Stream Peak",
                    event_type="METEOR SHOWER",
                    event_date="Upcoming August 2026",
                    operational_consideration="Elevated background micrometeoroid particle flux; satellite attitude trim screening.",
                    impact_level="WATCH / MODERATE"
                )
            ]
            db.add_all(events)
            db.commit()

        # Seed Re-Entry Risks
        reentry_count = db.query(ReEntryRiskRecord).count()
        if reentry_count == 0:
            reentry = ReEntryRiskRecord(
                object_name="SL-16 R/B (#22218)",
                norad_id=22218,
                predicted_entry_window="12-36 Months (Decay Monitoring)",
                estimated_risk_region="Broad Equatorial Ocean Corridor (Uncertainty Area)",
                uncertainty_corridor="± 4,200 km Along-Track Shift Zone",
                risk_level="LOW",
                confidence_pct=72.0,
                source="SGP4 Orbital Decay Model"
            )
            db.add(reentry)
            db.commit()

        # Seed initial operational alert records
        alert_count = db.query(AlertRecord).count()
        if alert_count == 0:
            now = datetime.now(timezone.utc)
            a1 = AlertRecord(
                conjunction_id=1,
                category="CRITICAL",
                title="CRITICAL SPACE ALERT",
                message="STARLINK-1007 vs FENGYUN 1C DEBRIS close approach predicted within 1.2 km. Priority Score: 94.2/100.",
                object_name="STARLINK-1007",
                threat_name="FENGYUN 1C DEBRIS",
                tca=now + timedelta(hours=18, minutes=24),
                miss_distance_km=1.2,
                is_reviewed=False,
                created_at=now
            )
            a2 = AlertRecord(
                conjunction_id=2,
                category="HIGH",
                title="HIGH RISK CONJUNCTION ALERT",
                message="ISS (ZARYA) vs COSMOS 2251 DEBRIS trajectory convergence detected. Solar Array wingspan vulnerability.",
                object_name="ISS (ZARYA)",
                threat_name="COSMOS 2251 DEBRIS",
                tca=now + timedelta(hours=21, minutes=43),
                miss_distance_km=841.5,
                is_reviewed=False,
                created_at=now - timedelta(minutes=15)
            )
            db.add(a1)
            db.add(a2)
            db.commit()

        # Seed initial Space Environment record if empty
        env_count = db.query(SpaceEnvironmentRecord).count()
        if env_count == 0:
            env = SpaceEnvironmentRecord(
                solar_flare_class="C1.2",
                geomagnetic_kp=2.3,
                radiation_storm_level="S1 - Minor",
                atmospheric_drag_risk="MODERATE",
                micrometeoroid_flux="NOMINAL",
                data_mode="DEMO / ESTIMATED DATA"
            )
            db.add(env)
            db.commit()

        # Seed initial Communication Risk records if empty
        comm_count = db.query(CommunicationRiskRecord).count()
        if comm_count == 0:
            comm_list = [
                CommunicationRiskRecord(
                    mission_name="ISS (ZARYA) & Crew Missions",
                    mission_profile="Low Earth Orbit",
                    connectivity_status="NORMAL",
                    cause_summary="Nominal ground station line-of-sight & clear telemetry band.",
                    confidence="High",
                    data_mode="DEMO / ESTIMATED DATA"
                ),
                CommunicationRiskRecord(
                    mission_name="Artemis & Deep Space Gateway",
                    mission_profile="Lunar Transfer / Deep Space",
                    connectivity_status="DEGRADED",
                    cause_summary="Solar flare C1.2 elevated ionospheric noise & Deep Space Network tracking window handover.",
                    confidence="Medium",
                    data_mode="DEMO / ESTIMATED DATA"
                ),
                CommunicationRiskRecord(
                    mission_name="Starlink Constellation Ingress",
                    mission_profile="Low Earth Orbit (550km)",
                    connectivity_status="NORMAL",
                    cause_summary="Multi-orbital plane relay redundant link online.",
                    confidence="High",
                    data_mode="DEMO / ESTIMATED DATA"
                ),
                CommunicationRiskRecord(
                    mission_name="GPS Block III Fleet",
                    mission_profile="Medium Earth Orbit",
                    connectivity_status="NORMAL",
                    cause_summary="Nominal atomic clock sync & clear L1/L2 signals.",
                    confidence="High",
                    data_mode="DEMO / ESTIMATED DATA"
                )
            ]
            db.add_all(comm_list)
            db.commit()

        # Seed Near-Earth Objects (NEOs)
        neo_count = db.query(NearEarthObjectRecord).count()
        if neo_count == 0:
            neos = [
                NearEarthObjectRecord(
                    object_name="2024 BX1 Meteoroid",
                    estimated_size="1.0 - 2.2 meters",
                    trajectory="Hyperbolic Atmospheric-Entry Vector",
                    velocity_kms=15.4,
                    closest_approach="07 Sep 2026 04:12 UTC",
                    earth_distance_km=14200.0,
                    impact_corridor="Sub-Orbital Airburst Risk Corridor (Uncertainty Area)",
                    risk_level="MEDIUM",
                    confidence_pct=76.0,
                    data_mode="DEMO / ESTIMATED DATA"
                ),
                NearEarthObjectRecord(
                    object_name="Asteroid 2026 SA-1",
                    estimated_size="18.5 - 34.0 meters",
                    trajectory="Heliocentric Earth-Crossing Trajectory",
                    velocity_kms=21.8,
                    closest_approach="14 Sep 2026 18:30 UTC",
                    earth_distance_km=384000.0,
                    impact_corridor="Lunar-Distance Deep Space Flyby Corridor",
                    risk_level="LOW",
                    confidence_pct=88.0,
                    data_mode="DEMO / ESTIMATED DATA"
                )
            ]
            db.add_all(neos)
            db.commit()

        # Seed Public Space Alerts
        public_alert_count = db.query(PublicAlert).count()
        if public_alert_count == 0:
            p_alerts = [
                PublicAlert(
                    alert_code="ALERT-2026-0901",
                    severity="CRITICAL",
                    title="CRITICAL SPACE ALERT: Potential Close Approach",
                    what_happened="High-velocity debris fragment FENGYUN 1C DEBRIS predicted to make close approach within 1.2 km of STARLINK-1007.",
                    when_utc="06 Sep 2026 — 07:00 UTC",
                    where_orbit="Low Earth Orbit (LEO) - 543.9 km Altitude",
                    risk_level="CRITICAL",
                    potential_impact="Communication service degradation for regional broadband user terminals if collision occurs.",
                    confidence_pct=74.0,
                    data_source="CelesTrak Public Catalog / SGP4 Orbital Vector Model",
                    recommended_action="Satellite operators should review orbital covariance and evaluate collision-avoidance maneuver options.",
                    status="NEW",
                    priority_score=94.2,
                    region="GLOBAL / ALL REGIONS"
                ),
                PublicAlert(
                    alert_code="ALERT-2026-0902",
                    severity="HIGH",
                    title="HIGH RISK ALERT: Crewed Habitat Orbit Convergence",
                    what_happened="COSMOS 2251 DEBRIS trajectory entering safety buffer zone surrounding ISS (ZARYA).",
                    when_utc="06 Sep 2026 — 10:43 UTC",
                    where_orbit="Low Earth Orbit (LEO) - 418.2 km Altitude",
                    risk_level="HIGH",
                    potential_impact="Precautionary crew shelter or micro-boost maneuver may be evaluated by Mission Control.",
                    confidence_pct=82.0,
                    data_source="Public TLE Catalog / SGP4 Propagation",
                    recommended_action="Monitor telemetry & track 24h orbital vector evolution.",
                    status="MONITORING",
                    priority_score=88.5,
                    region="GLOBAL / ALL REGIONS"
                ),
                PublicAlert(
                    alert_code="ALERT-2026-0903",
                    severity="MEDIUM",
                    title="MEDIUM ALERT: Space Debris Decay Re-Entry Corridor",
                    what_happened="Upper stage rocket body SL-16 R/B experiencing elevated atmospheric drag decay.",
                    when_utc="Estimated 12-36 Months Window",
                    where_orbit="Broad Equatorial Ocean Corridor (Uncertainty Area)",
                    risk_level="MEDIUM",
                    potential_impact="Localized atmospheric breakup; negligible risk to populated areas, ocean corridor monitoring.",
                    confidence_pct=68.0,
                    data_source="SGP4 Orbital Decay Model",
                    recommended_action="Track radar TLE updates during final orbital passes.",
                    status="NEW",
                    priority_score=62.0,
                    region="EQUATORIAL / PACIFIC OCEAN"
                ),
                PublicAlert(
                    alert_code="ALERT-2026-0904",
                    severity="INFORMATION",
                    title="INFORMATION ALERT: Perseid Meteoroid Stream Peak",
                    what_happened="Annual Perseid meteoroid particle stream peak expected to increase micrometeoroid flux in LEO.",
                    when_utc="12-14 August 2026",
                    where_orbit="LEO & MEO Satellite Shells",
                    risk_level="INFORMATION",
                    potential_impact="Minor sensor noise and solar panel degradation risk; zero structural damage expected.",
                    confidence_pct=91.0,
                    data_source="Space Environment Monitoring Network",
                    recommended_action="Standard sensor calibration & attitude trim oversight.",
                    status="RESOLVED",
                    priority_score=35.0,
                    region="GLOBAL / ALL REGIONS"
                )
            ]
            db.add_all(p_alerts)
            db.commit()

        # Seed User Notification Preferences
        pref_count = db.query(NotificationPreferenceRecord).count()
        if pref_count == 0:
            pref = NotificationPreferenceRecord(
                user_id="default_user",
                enable_critical_conjunction=True,
                enable_high_risk_debris=True,
                enable_protected_satellite=True,
                enable_reentry_warning=True,
                enable_asteroid_warning=True,
                enable_meteoroid_event=True,
                enable_space_weather=True,
                enable_comm_risk=True,
                enable_celestial_event=True,
                severity_threshold="All alerts",
                preferred_region="ALL REGIONS",
                sms_status="SMS PROVIDER NOT CONFIGURED"
            )
            db.add(pref)
            db.commit()

    @staticmethod
    def fetch_live_celestrak(db: Session, limit: int = 50) -> Dict[str, Any]:
        """Attempt fetching live active TLE data from CelesTrak API with fallback to demo data."""
        try:
            resp = requests.get(CELESTRAK_ACTIVE_URL, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                count = 0
                for item in data[:limit]:
                    norad_id = item.get("NORAD_CAT_ID")
                    if not norad_id:
                        continue
                    
                    line1 = item.get("TLE_LINE1")
                    line2 = item.get("TLE_LINE2")
                    if not line1 or not line2:
                        continue

                    parsed = OrbitalEngine.parse_tle_elements(line1, line2)
                    existing = db.query(Satellite).filter(Satellite.norad_id == norad_id).first()

                    if not existing:
                        sat = Satellite(
                            norad_id=norad_id,
                            name=item.get("OBJECT_NAME", f"SAT-{norad_id}"),
                            type="PAYLOAD" if "DEBRIS" not in item.get("OBJECT_NAME", "") else "DEBRIS",
                            country=item.get("COUNTRY_CODE", "US"),
                            inclination=parsed["inclination"],
                            eccentricity=parsed["eccentricity"],
                            apogee=parsed["apogee"],
                            perigee=parsed["perigee"],
                            period=parsed["period"],
                            rcs=item.get("RCS_SIZE", "MEDIUM"),
                            line1=line1,
                            line2=line2,
                            epoch=parsed["epoch"],
                            source="CELESTRAK PUBLIC DATA",
                            data_mode="DATA MODE: PUBLIC TLE",
                            source_type="REAL DATA"
                        )
                        db.add(sat)
                        count += 1
                    else:
                        existing.line1 = line1
                        existing.line2 = line2
                        existing.source = "CELESTRAK PUBLIC DATA"
                        existing.data_mode = "DATA MODE: PUBLIC TLE"
                        existing.source_type = "REAL DATA"

                db.commit()
                return {"status": "success", "mode": "DATA MODE: PUBLIC TLE", "count": count}
        except Exception as e:
            pass

        return {"status": "fallback", "mode": "DATA MODE: DEMO", "count": 0}
