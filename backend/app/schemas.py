from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class SatelliteBase(BaseModel):
    norad_id: int
    name: str
    type: str
    country: Optional[str] = "UNKNOWN"
    inclination: float
    eccentricity: Optional[float] = 0.001
    apogee: float
    perigee: float
    period: float
    rcs: Optional[str] = "UNKNOWN"
    line1: str
    line2: str
    epoch: Optional[str] = "2024-065"
    source: Optional[str] = "CelesTrak"
    data_mode: str = "DATA MODE: DEMO"
    source_type: str = "DEMO DATA"
    debris_class: Optional[str] = "Unknown Object"
    constellation: Optional[str] = "LEO General"
    human_impact_reason: Optional[str] = "Supports essential satellite communication or Earth observation infrastructure."
    orbit_class: Optional[str] = "LEO"
    launch_site: Optional[str] = "Not available"
    launch_country: Optional[str] = "Not available"
    mission: Optional[str] = "Not available"
    operational_status: Optional[str] = "ACTIVE"
    threat_level: Optional[str] = "LOW"
    associated_program: Optional[str] = "Not available"
    threatened_satellites: Optional[str] = "None detected"

class SatelliteCreate(SatelliteBase):
    pass

class SatelliteResponse(SatelliteBase):
    id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Position3D(BaseModel):
    norad_id: int
    name: str
    type: str
    x: float
    y: float
    z: float
    lat: float
    lon: float
    alt: float
    velocity_kms: float
    data_mode: str = "DATA MODE: DEMO"
    source_type: str = "DEMO DATA"
    timestamp: str

class TrajectoryPoint(BaseModel):
    timestamp: str
    x: float
    y: float
    z: float
    lat: float
    lon: float
    alt: float

class TrajectoryResponse(BaseModel):
    norad_id: int
    name: str
    label: str = "MODEL / ORBIT PROPAGATION"
    points: List[TrajectoryPoint]
    data_mode: str = "DATA MODE: DEMO"
    source_type: str = "SIMULATION"

class ConjunctionResponse(BaseModel):
    id: int
    primary_norad_id: int
    secondary_norad_id: int
    primary_name: str
    secondary_name: str
    tca: datetime
    miss_distance_km: float
    radial_miss_km: float
    intrack_miss_km: float
    crosstrack_miss_km: float
    relative_velocity_kms: float
    collision_probability: float
    risk_level: str
    warning_level: Optional[str] = "MEDIUM"
    encounter_phase: Optional[str] = "CLOSE APPROACH"
    vulnerable_subsystem: Optional[str] = "Solar Array"
    vulnerability_confidence: Optional[str] = "Medium"
    vulnerability_reason: Optional[str] = "Approach geometry intersects estimated solar array wingspan."
    potential_outcome: Optional[str] = "Power-generation degradation possible."
    recommended_action: Optional[str] = "Perform collision-avoidance assessment."
    priority_score: Optional[float] = 75.0
    tle_age_hours: Optional[float] = 4.0
    prediction_confidence_pct: Optional[float] = 74.0
    position_uncertainty_km: Optional[float] = 0.25
    impact_severity: Optional[str] = "HIGH"
    public_impact_description: Optional[str] = "Supports essential broadband internet & telecommunications infrastructure."
    space_impact_chain: Optional[Dict[str, Any]] = None
    what_if_scenarios: Optional[Dict[str, Any]] = None
    is_reviewed: Optional[bool] = False
    source_type: str = "SIMULATION"
    model_config = ConfigDict(from_attributes=True)

class ProtectedAssetResponse(BaseModel):
    id: int
    norad_id: int
    name: str
    asset_type: str
    mission: str
    operator: str
    orbit_class: str
    status: str
    threat_count: int
    highest_risk_level: str
    next_critical_event: str
    data_mode: str = "DATA MODE: DEMO"
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CelestialEventResponse(BaseModel):
    id: int
    event_name: str
    event_type: str
    event_date: str
    operational_consideration: str
    impact_level: str
    data_mode: str = "DEMO / ESTIMATED DATA"
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReEntryRiskResponse(BaseModel):
    id: int
    object_name: str
    norad_id: int
    predicted_entry_window: str
    estimated_risk_region: str
    uncertainty_corridor: str
    risk_level: str
    confidence_pct: float
    source: str
    data_mode: str = "DEMO / ESTIMATED DATA"
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class WhatIfRequest(BaseModel):
    modified_miss_distance_km: Optional[float] = None
    simulated_avoidance_burn_m_s: Optional[float] = None

class WhatIfResponse(BaseModel):
    original_miss_distance_km: float
    simulated_miss_distance_km: float
    original_risk_level: str
    simulated_risk_level: str
    original_priority_score: float
    simulated_priority_score: float
    scenario_summary: str
    recommended_decision: str

class AlertResponse(BaseModel):
    id: int
    conjunction_id: Optional[int] = None
    category: str = "HIGH"
    title: str
    message: str
    object_name: str
    threat_name: str
    tca: Optional[datetime] = None
    miss_distance_km: Optional[float] = None
    is_reviewed: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ThreatProfileResponse(BaseModel):
    norad_id: int
    name: str
    type: str
    total_conjunctions: int
    critical_count: int
    high_count: int
    next_tca: Optional[str] = None
    closest_miss_km: Optional[float] = None
    vulnerable_subsystem: str = "Solar Array"
    future_risk_trend: str = "Increasing"
    conjunctions: List[ConjunctionResponse]

class SpaceEnvironmentResponse(BaseModel):
    id: int
    solar_flare_class: str
    geomagnetic_kp: float
    radiation_storm_level: str
    atmospheric_drag_risk: str
    micrometeoroid_flux: str
    data_mode: str = "DEMO / ESTIMATED DATA"
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CommunicationRiskResponse(BaseModel):
    id: int
    mission_name: str
    mission_profile: str
    connectivity_status: str
    cause_summary: str
    confidence: str
    data_mode: str = "DEMO / ESTIMATED DATA"
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ConstellationSummary(BaseModel):
    name: str
    total_objects: int
    active_satellites: int
    debris_count: int
    health_score: float
    health_status: str
    primary_function: str
    risk_summary: str

class DetectionItem(BaseModel):
    x: int
    y: int
    width: int
    height: int
    confidence: float
    candidate_type: str = "OPTICAL_STREAK_CANDIDATE"
    streak_length_px: Optional[float] = 42.5
    estimated_apparent_velocity: Optional[str] = "1.2 deg/sec"

class AIDetectionResponse(BaseModel):
    detection_id: int
    filename: str
    image_width: int
    image_height: int
    detection_count: int
    detections: List[DetectionItem]
    processing_time_ms: float
    method: str = "Computer Vision Baseline"
    data_mode: str = "AI PREDICTION — PROTOTYPE"
    image_url: str
    processed_image_url: str
    stage_logs: Optional[List[str]] = []

class NearEarthObjectResponse(BaseModel):
    id: int
    object_name: str
    estimated_size: str
    trajectory: str
    velocity_kms: float
    closest_approach: str
    earth_distance_km: float
    impact_corridor: str
    risk_level: str
    confidence_pct: float
    data_mode: str = "DEMO / ESTIMATED DATA"
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PublicAlertResponse(BaseModel):
    id: int
    alert_code: str
    severity: str
    title: str
    what_happened: str
    when_utc: str
    where_orbit: str
    risk_level: str
    potential_impact: str
    confidence_pct: float
    data_source: str
    recommended_action: str
    status: str
    priority_score: float
    region: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationPreferenceRequest(BaseModel):
    enable_critical_conjunction: Optional[bool] = True
    enable_high_risk_debris: Optional[bool] = True
    enable_protected_satellite: Optional[bool] = True
    enable_reentry_warning: Optional[bool] = True
    enable_asteroid_warning: Optional[bool] = True
    enable_meteoroid_event: Optional[bool] = True
    enable_space_weather: Optional[bool] = True
    enable_comm_risk: Optional[bool] = True
    enable_celestial_event: Optional[bool] = True
    severity_threshold: Optional[str] = "All alerts"
    preferred_region: Optional[str] = "ALL REGIONS"

class NotificationPreferenceResponse(BaseModel):
    id: int
    user_id: str
    enable_critical_conjunction: bool
    enable_high_risk_debris: bool
    enable_protected_satellite: bool
    enable_reentry_warning: bool
    enable_asteroid_warning: bool
    enable_meteoroid_event: bool
    enable_space_weather: bool
    enable_comm_risk: bool
    enable_celestial_event: bool
    severity_threshold: str
    preferred_region: str
    sms_status: str = "SMS PROVIDER NOT CONFIGURED"
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FutureForecastItem(BaseModel):
    event: str
    time: str
    horizon: str # 1h, 6h, 24h, 7d, 30d
    object_name: str
    location_orbit: str
    risk: str
    confidence_pct: float

class FutureRiskForecastResponse(BaseModel):
    horizon: str
    total_events: int
    items: List[FutureForecastItem]
    data_mode: str = "DEMO / ESTIMATED DATA"


