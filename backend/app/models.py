from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class Satellite(Base):
    __tablename__ = "satellites"

    id = Column(Integer, primary_key=True, index=True)
    norad_id = Column(Integer, unique=True, index=True, nullable=False)
    name = Column(String, index=True)
    type = Column(String, index=True) # PAYLOAD, DEBRIS, ROCKET BODY
    country = Column(String, default="US")
    inclination = Column(Float, default=0.0)
    eccentricity = Column(Float, default=0.001)
    apogee = Column(Float, default=500.0)
    perigee = Column(Float, default=490.0)
    period = Column(Float, default=95.0)
    rcs = Column(String, default="MEDIUM")
    line1 = Column(Text, nullable=False)
    line2 = Column(Text, nullable=False)
    epoch = Column(String, default="2024-065.50000000")
    source = Column(String, default="CelesTrak Public Catalog")
    data_mode = Column(String, default="DATA MODE: DEMO") # DATA MODE: DEMO or DATA MODE: PUBLIC TLE
    source_type = Column(String, default="DEMO DATA")
    
    # Extended Debris Classification & Constellation Tracking
    debris_class = Column(String, default="Unknown Object") # Fragmentation Debris, Rocket Body, Defunct Satellite, Mission-related Debris, Unknown Object
    constellation = Column(String, default="LEO General") # Starlink, ISS / LEO Ops, Earth Observation, Navigation (GPS), Lunar / Deep Space
    human_impact_reason = Column(Text, default="Supports essential satellite communication or Earth observation infrastructure.")

    # Detailed Space Situational Awareness & Catalog Metadata
    orbit_class = Column(String, default="LEO") # LEO, MEO, GEO, HEO
    launch_site = Column(String, default="Not available")
    launch_country = Column(String, default="Not available")
    mission = Column(String, default="Not available")
    operational_status = Column(String, default="ACTIVE") # ACTIVE, INACTIVE, UNKNOWN
    threat_level = Column(String, default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    associated_program = Column(String, default="Not available")
    threatened_satellites = Column(String, default="None detected")

    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class ConjunctionEvent(Base):
    __tablename__ = "conjunction_events"

    id = Column(Integer, primary_key=True, index=True)
    primary_norad_id = Column(Integer, ForeignKey("satellites.norad_id"))
    secondary_norad_id = Column(Integer, ForeignKey("satellites.norad_id"))
    primary_name = Column(String)
    secondary_name = Column(String)
    tca = Column(DateTime, index=True)
    miss_distance_km = Column(Float)
    radial_miss_km = Column(Float)
    intrack_miss_km = Column(Float)
    crosstrack_miss_km = Column(Float)
    relative_velocity_kms = Column(Float)
    collision_probability = Column(Float)
    risk_level = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    source_type = Column(String, default="SIMULATION")

    # Extended Pre-Emptive Warning & Visual Timeline Phase
    warning_level = Column(String, default="MEDIUM") # WATCH, LOW, MEDIUM, HIGH, CRITICAL
    encounter_phase = Column(String, default="CLOSE APPROACH") # NOW, CLOSE APPROACH, TCA, POST-ENCOUNTER

    # Transparent Subsystem Vulnerability & Future Risk Model Fields
    vulnerable_subsystem = Column(String, default="Solar Array") # Solar Array, Comm Antenna, Thermal, Propulsion, Nav, Power, Payload, Structure
    vulnerability_confidence = Column(String, default="Medium") # Low, Medium, High
    vulnerability_reason = Column(Text, default="Model estimate based on relative approach geometry & orbital inclination.")
    potential_outcome = Column(Text, default="Possible power generation degradation or momentum disturbance.")
    recommended_action = Column(Text, default="Perform collision avoidance screening & TLE monitoring.")
    is_reviewed = Column(Boolean, default=False)

    # Advanced Early-Warning & Decision Support Metrics
    priority_score = Column(Float, default=75.0) # 0 to 100
    tle_age_hours = Column(Float, default=4.0)
    prediction_confidence_pct = Column(Float, default=74.0)
    position_uncertainty_km = Column(Float, default=0.25)
    impact_severity = Column(String, default="HIGH") # LOW, MODERATE, SEVERE, CRITICAL
    public_impact_description = Column(Text, default="Supports essential satellite communication or Earth observation infrastructure.")
    space_impact_chain = Column(JSON, nullable=True)
    what_if_scenarios = Column(JSON, nullable=True)

class AlertRecord(Base):
    __tablename__ = "alert_records"

    id = Column(Integer, primary_key=True, index=True)
    conjunction_id = Column(Integer, nullable=True)
    category = Column(String, default="HIGH") # INFO, LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String)
    message = Column(Text)
    object_name = Column(String)
    threat_name = Column(String)
    tca = Column(DateTime)
    miss_distance_km = Column(Float)
    is_reviewed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SpaceEnvironmentRecord(Base):
    __tablename__ = "space_environment"

    id = Column(Integer, primary_key=True, index=True)
    solar_flare_class = Column(String, default="C1.2") # C-class, M-class, X-class
    geomagnetic_kp = Column(Float, default=2.3) # 0 to 9 index
    radiation_storm_level = Column(String, default="S1 - Minor")
    atmospheric_drag_risk = Column(String, default="MODERATE") # LOW, MODERATE, HIGH
    micrometeoroid_flux = Column(String, default="NOMINAL") # NOMINAL, ELEVATED
    data_mode = Column(String, default="DEMO / ESTIMATED DATA")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class CommunicationRiskRecord(Base):
    __tablename__ = "communication_risks"

    id = Column(Integer, primary_key=True, index=True)
    mission_name = Column(String)
    mission_profile = Column(String, default="Earth Orbit") # Earth Orbit, Lunar Mission, Solar Mission, Deep Space
    connectivity_status = Column(String, default="NORMAL") # NORMAL, DEGRADED, AT RISK
    cause_summary = Column(Text, default="Nominal ground station line-of-sight & solar quiet region.")
    confidence = Column(String, default="Medium")
    data_mode = Column(String, default="DEMO / ESTIMATED DATA")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class ProtectedAssetRecord(Base):
    __tablename__ = "protected_assets"

    id = Column(Integer, primary_key=True, index=True)
    norad_id = Column(Integer, unique=True, index=True)
    name = Column(String, index=True)
    asset_type = Column(String, default="Operational Satellite")
    mission = Column(String, default="Telecommunications")
    operator = Column(String, default="United States")
    orbit_class = Column(String, default="LEO")
    status = Column(String, default="ACTIVE")
    threat_count = Column(Integer, default=0)
    highest_risk_level = Column(String, default="LOW")
    next_critical_event = Column(String, default="Nominal Orbit")
    data_mode = Column(String, default="DATA MODE: DEMO")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class CelestialEventRecord(Base):
    __tablename__ = "celestial_events"

    id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String)
    event_type = Column(String, default="LUNAR ECLIPSE") # LUNAR ECLIPSE, SOLAR ECLIPSE, METEOR SHOWER
    event_date = Column(String, default="Upcoming 2026")
    operational_consideration = Column(Text, default="Potential solar array shadow passage; power management consideration.")
    impact_level = Column(String, default="LOW / INFORMATIONAL")
    data_mode = Column(String, default="DEMO / ESTIMATED DATA")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class ReEntryRiskRecord(Base):
    __tablename__ = "reentry_risks"

    id = Column(Integer, primary_key=True, index=True)
    object_name = Column(String)
    norad_id = Column(Integer)
    predicted_entry_window = Column(String, default="24-48 Hours")
    estimated_risk_region = Column(String, default="Broad Equatorial Ocean Corridor (Uncertainty Area)")
    uncertainty_corridor = Column(String, default="± 3,500 km Along-Track Shift Zone")
    risk_level = Column(String, default="LOW")
    confidence_pct = Column(Float, default=68.0)
    source = Column(String, default="SGP4 Orbital Decay Model")
    data_mode = Column(String, default="DEMO / ESTIMATED DATA")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class AIDetectionLog(Base):
    __tablename__ = "ai_detections"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    filepath = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    detections_count = Column(Integer)
    detected_objects = Column(JSON) # bounding boxes, confidence, class, endpoints
    processing_time_ms = Column(Float)
    source_type = Column(String, default="AI PREDICTION")

class NearEarthObjectRecord(Base):
    __tablename__ = "near_earth_objects"

    id = Column(Integer, primary_key=True, index=True)
    object_name = Column(String, index=True)
    estimated_size = Column(String, default="1.5 - 3.0 meters")
    trajectory = Column(String, default="Hyperbolic Earth-Approach Trajectory")
    velocity_kms = Column(Float, default=15.4)
    closest_approach = Column(String, default="Upcoming 24h Window")
    earth_distance_km = Column(Float, default=14200.0)
    impact_corridor = Column(String, default="Equatorial Airburst Risk Corridor (Uncertainty Area)")
    risk_level = Column(String, default="LOW")
    confidence_pct = Column(Float, default=71.0)
    data_mode = Column(String, default="DEMO / ESTIMATED DATA")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class PublicAlert(Base):
    __tablename__ = "public_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String, unique=True, index=True)
    severity = Column(String, default="HIGH") # CRITICAL, HIGH, MEDIUM, INFORMATION
    title = Column(String)
    what_happened = Column(Text)
    when_utc = Column(String)
    where_orbit = Column(String)
    risk_level = Column(String, default="HIGH")
    potential_impact = Column(Text)
    confidence_pct = Column(Float, default=74.0)
    data_source = Column(String, default="CelesTrak / SSA Early-Warning Model")
    recommended_action = Column(Text)
    status = Column(String, default="NEW") # NEW, ACKNOWLEDGED, MONITORING, RESOLVED
    priority_score = Column(Float, default=85.0)
    region = Column(String, default="GLOBAL / ALL REGIONS")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class NotificationPreferenceRecord(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="default_user")
    enable_critical_conjunction = Column(Boolean, default=True)
    enable_high_risk_debris = Column(Boolean, default=True)
    enable_protected_satellite = Column(Boolean, default=True)
    enable_reentry_warning = Column(Boolean, default=True)
    enable_asteroid_warning = Column(Boolean, default=True)
    enable_meteoroid_event = Column(Boolean, default=True)
    enable_space_weather = Column(Boolean, default=True)
    enable_comm_risk = Column(Boolean, default=True)
    enable_celestial_event = Column(Boolean, default=True)
    severity_threshold = Column(String, default="All alerts") # Critical only, High + Critical, All alerts
    preferred_region = Column(String, default="ALL REGIONS")
    sms_status = Column(String, default="SMS PROVIDER NOT CONFIGURED")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

