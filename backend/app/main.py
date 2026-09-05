import os
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from .database import engine, Base, get_db
from .models import (
    Satellite, ConjunctionEvent, AIDetectionLog, AlertRecord, 
    SpaceEnvironmentRecord, CommunicationRiskRecord, ProtectedAssetRecord, CelestialEventRecord, ReEntryRiskRecord,
    NearEarthObjectRecord, PublicAlert, NotificationPreferenceRecord
)
from .schemas import (
    SatelliteResponse, Position3D, TrajectoryResponse, 
    ConjunctionResponse, AIDetectionResponse, AlertResponse, ThreatProfileResponse,
    ConstellationSummary, SpaceEnvironmentResponse, CommunicationRiskResponse,
    ProtectedAssetResponse, CelestialEventResponse, ReEntryRiskResponse, WhatIfRequest, WhatIfResponse,
    NearEarthObjectResponse, PublicAlertResponse, NotificationPreferenceRequest, NotificationPreferenceResponse,
    FutureRiskForecastResponse, FutureForecastItem
)
from .services.orbital_engine import OrbitalEngine
from .services.ai_engine import AIDebrisEngine
from .services.debris_detection import DebrisDetectionService
from .services.data_ingestion import DataIngestionService
from .services.conjunction_engine import ConjunctionEngine, ScenarioEngine
from .services.analytics_engine import AnalyticsEngine

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Space Situational Awareness (SSA) & Debris Intelligence API",
    description="Backend service providing SGP4 orbital propagation, TLE tracking, conjunction screening, and AI optical debris streak detection.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
custom_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

production_origins = [
    "https://debris-sentry.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "*"
] + custom_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=production_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static directory setup for AI detection uploads
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def startup_event():
    """Seed catalog database on initial startup."""
    db = next(get_db())
    DataIngestionService.seed_initial_catalog(db)

@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "operational",
        "system": "AI-Based SSA Platform",
        "services": {
            "database": "online",
            "sgp4_engine": "online",
            "ai_engine": "online",
            "conjunction_engine": "online"
        }
    }

@app.get("/api/objects", response_model=List[SatelliteResponse])
@app.get("/api/satellites", response_model=List[SatelliteResponse])
@app.get("/api/v1/satellites", response_model=List[SatelliteResponse])
def get_satellites(
    type: Optional[str] = None, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve catalog list of tracked satellites and debris objects."""
    query = db.query(Satellite)
    if type and type.upper() != "ALL":
        query = query.filter(Satellite.type == type.upper())
    if search:
        query = query.filter(
            (Satellite.name.ilike(f"%{search}%")) | 
            (Satellite.norad_id.like(f"%{search}%"))
        )
    return query.all()

@app.get("/api/objects/{object_id}", response_model=SatelliteResponse)
@app.get("/api/v1/satellites/{object_id}", response_model=SatelliteResponse)
def get_satellite(object_id: int, db: Session = Depends(get_db)):
    """Return single object metadata by database ID or NORAD ID."""
    sat = db.query(Satellite).filter(
        (Satellite.norad_id == object_id) | (Satellite.id == object_id)
    ).first()
    if not sat:
        raise HTTPException(status_code=404, detail=f"Object {object_id} not found in tracking catalog")
    return sat

@app.get("/api/objects/{object_id}/position", response_model=Position3D)
@app.get("/api/v1/propagate/{object_id}", response_model=Position3D)
def propagate_satellite(object_id: int, db: Session = Depends(get_db)):
    """Compute real-time SGP4 position (Lat, Lon, Alt, Velocity, X, Y, Z)."""
    sat = db.query(Satellite).filter(
        (Satellite.norad_id == object_id) | (Satellite.id == object_id)
    ).first()
    if not sat:
        raise HTTPException(status_code=404, detail=f"Object {object_id} not found")
    
    pos = OrbitalEngine.propagate_tle(sat.line1, sat.line2)
    return {
        "norad_id": sat.norad_id,
        "name": sat.name,
        "type": sat.type,
        "x": pos["x"],
        "y": pos["y"],
        "z": pos["z"],
        "lat": pos["lat"],
        "lon": pos["lon"],
        "alt": pos["alt"],
        "velocity_kms": pos["velocity_kms"],
        "data_mode": sat.data_mode,
        "source_type": sat.source_type,
        "timestamp": pos["timestamp"]
    }

@app.get("/api/objects/{object_id}/trajectory", response_model=TrajectoryResponse)
@app.get("/api/v1/trajectory/{object_id}", response_model=TrajectoryResponse)
def get_trajectory(
    object_id: int, 
    hours: float = Query(24.0, ge=1.0, le=72.0),
    db: Session = Depends(get_db)
):
    """Generate future trajectory using SGP4 propagation labeled as MODEL / ORBIT PROPAGATION."""
    sat = db.query(Satellite).filter(
        (Satellite.norad_id == object_id) | (Satellite.id == object_id)
    ).first()
    if not sat:
        raise HTTPException(status_code=404, detail=f"Object {object_id} not found")
        
    points = OrbitalEngine.generate_future_trajectory(sat.line1, sat.line2, hours=hours, step_minutes=15)
    return {
        "norad_id": sat.norad_id,
        "name": sat.name,
        "label": "MODEL / ORBIT PROPAGATION",
        "points": points,
        "data_mode": sat.data_mode,
        "source_type": "SIMULATION"
    }

@app.get("/api/v1/propagate-all", response_model=List[Position3D])
def propagate_all_satellites(db: Session = Depends(get_db)):
    """Propagate instantaneous 3D positions for all catalog objects for rendering on 3D Earth."""
    satellites = db.query(Satellite).all()
    results = []
    for sat in satellites:
        try:
            pos = OrbitalEngine.propagate_tle(sat.line1, sat.line2)
            results.append({
                "norad_id": sat.norad_id,
                "name": sat.name,
                "type": sat.type,
                "x": pos["x"],
                "y": pos["y"],
                "z": pos["z"],
                "lat": pos["lat"],
                "lon": pos["lon"],
                "alt": pos["alt"],
                "velocity_kms": pos["velocity_kms"],
                "data_mode": sat.data_mode,
                "source_type": sat.source_type,
                "timestamp": pos["timestamp"]
            })
        except Exception:
            continue
    return results

@app.get("/api/debris", response_model=List[SatelliteResponse])
def get_debris_objects(db: Session = Depends(get_db)):
    """Retrieve catalog list of tracked space debris objects."""
    return db.query(Satellite).filter(Satellite.type == "DEBRIS").all()

@app.get("/api/orbits")
def get_catalog_orbits(db: Session = Depends(get_db)):
    """Retrieve trajectory points for orbital paths visualization."""
    satellites = db.query(Satellite).all()
    orbits = []
    for sat in satellites:
        try:
            points = OrbitalEngine.generate_future_trajectory(sat.line1, sat.line2, hours=24.0, step_minutes=30)
            orbits.append({
                "norad_id": sat.norad_id,
                "name": sat.name,
                "type": sat.type,
                "points": points
            })
        except Exception:
            continue
    return orbits

@app.get("/api/conjunctions", response_model=List[ConjunctionResponse])
@app.get("/api/v1/conjunctions", response_model=List[ConjunctionResponse])
def get_conjunctions(db: Session = Depends(get_db)):
    """Get active conjunction screening events and threat alerts."""
    events = db.query(ConjunctionEvent).order_by(ConjunctionEvent.miss_distance_km.asc()).all()
    return events

@app.get("/api/conjunctions/{conjunction_id}", response_model=ConjunctionResponse)
def get_conjunction_detail(conjunction_id: int, db: Session = Depends(get_db)):
    """Return detailed conjunction encounter record by ID."""
    event = db.query(ConjunctionEvent).filter(ConjunctionEvent.id == conjunction_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Conjunction event #{conjunction_id} not found")
    return event

@app.post("/api/conjunctions/screen", response_model=ConjunctionResponse)
@app.post("/api/v1/conjunctions/screen", response_model=ConjunctionResponse)
def screen_conjunction_pair(
    primary_id: int,
    secondary_id: int,
    db: Session = Depends(get_db)
):
    """Run SGP4 close-approach screening for a specific pair of satellites/debris."""
    sat_a = db.query(Satellite).filter((Satellite.norad_id == primary_id) | (Satellite.id == primary_id)).first()
    sat_b = db.query(Satellite).filter((Satellite.norad_id == secondary_id) | (Satellite.id == secondary_id)).first()

    if not sat_a or not sat_b:
        raise HTTPException(status_code=404, detail="One or both satellites not found in tracking catalog")

    res = OrbitalEngine.calculate_conjunction(
        sat_a.line1, sat_a.line2,
        sat_b.line1, sat_b.line2,
        hours=24.0
    )

    # Persist or update conjunction event record
    event = db.query(ConjunctionEvent).filter(
        ((ConjunctionEvent.primary_norad_id == sat_a.norad_id) & (ConjunctionEvent.secondary_norad_id == sat_b.norad_id)) |
        ((ConjunctionEvent.primary_norad_id == sat_b.norad_id) & (ConjunctionEvent.secondary_norad_id == sat_a.norad_id))
    ).first()

    if not event:
        event = ConjunctionEvent(
            primary_norad_id=sat_a.norad_id,
            secondary_norad_id=sat_b.norad_id,
            primary_name=sat_a.name,
            secondary_name=sat_b.name,
            tca=res["tca"],
            miss_distance_km=res["miss_distance_km"],
            radial_miss_km=res["radial_miss_km"],
            intrack_miss_km=res["intrack_miss_km"],
            crosstrack_miss_km=res["crosstrack_miss_km"],
            relative_velocity_kms=res["relative_velocity_kms"],
            collision_probability=res["collision_probability"],
            risk_level=res["risk_level"],
            source_type="SIMULATION"
        )
        db.add(event)
    else:
        event.tca = res["tca"]
        event.miss_distance_km = res["miss_distance_km"]
        event.radial_miss_km = res["radial_miss_km"]
        event.intrack_miss_km = res["intrack_miss_km"]
        event.crosstrack_miss_km = res["crosstrack_miss_km"]
        event.relative_velocity_kms = res["relative_velocity_kms"]
        event.collision_probability = res["collision_probability"]
        event.risk_level = res["risk_level"]

    db.commit()
    db.refresh(event)
    return event

@app.get("/api/risk-summary")
def get_risk_summary(db: Session = Depends(get_db)):
    """Return conjunction threat summary and scientific disclaimer."""
    return ConjunctionEngine.get_risk_summary(db)

@app.get("/api/conjunctions/{conjunction_id}/trajectory")
def get_conjunction_trajectories(conjunction_id: int, db: Session = Depends(get_db)):
    """Return dual orbital trajectories for Object A and Object B surrounding TCA."""
    event = db.query(ConjunctionEvent).filter(ConjunctionEvent.id == conjunction_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Conjunction event #{conjunction_id} not found")

    sat_a = db.query(Satellite).filter(Satellite.norad_id == event.primary_norad_id).first()
    sat_b = db.query(Satellite).filter(Satellite.norad_id == event.secondary_norad_id).first()

    traj_a = OrbitalEngine.generate_future_trajectory(sat_a.line1, sat_a.line2, hours=24.0, step_minutes=15) if sat_a else []
    traj_b = OrbitalEngine.generate_future_trajectory(sat_b.line1, sat_b.line2, hours=24.0, step_minutes=15) if sat_b else []

    return {
        "conjunction_id": event.id,
        "primary": {"norad_id": event.primary_norad_id, "name": event.primary_name, "points": traj_a},
        "secondary": {"norad_id": event.secondary_norad_id, "name": event.secondary_name, "points": traj_b},
        "tca": event.tca.isoformat() if event.tca else None,
        "miss_distance_km": event.miss_distance_km,
        "label": "PROTOTYPE CONJUNCTION ANALYSIS"
    }

@app.get("/api/v1/alerts", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    """Retrieve operational safety alert queue."""
    return db.query(AlertRecord).order_by(AlertRecord.created_at.desc()).all()

@app.post("/api/v1/alerts/{alert_id}/review", response_model=AlertResponse)
def review_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark an operational alert as reviewed by satellite operator."""
    alert = db.query(AlertRecord).filter(AlertRecord.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert #{alert_id} not found")
    alert.is_reviewed = True
    db.commit()
    db.refresh(alert)
    return alert

@app.post("/api/v1/conjunctions/{conjunction_id}/review", response_model=ConjunctionResponse)
def review_conjunction(conjunction_id: int, db: Session = Depends(get_db)):
    """Mark conjunction event as reviewed."""
    event = db.query(ConjunctionEvent).filter(ConjunctionEvent.id == conjunction_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Conjunction #{conjunction_id} not found")
    event.is_reviewed = True
    db.commit()
    db.refresh(event)
    return event

@app.get("/api/v1/satellites/{norad_id}/threat-profile", response_model=ThreatProfileResponse)
def get_satellite_threat_profile(norad_id: int, db: Session = Depends(get_db)):
    """Retrieve comprehensive threat profile & subsystem vulnerability summary for a specific satellite."""
    sat = db.query(Satellite).filter((Satellite.norad_id == norad_id) | (Satellite.id == norad_id)).first()
    if not sat:
        raise HTTPException(status_code=404, detail=f"Object {norad_id} not found")

    conjs = db.query(ConjunctionEvent).filter(
        (ConjunctionEvent.primary_norad_id == sat.norad_id) | (ConjunctionEvent.secondary_norad_id == sat.norad_id)
    ).order_by(ConjunctionEvent.miss_distance_km.asc()).all()

    total = len(conjs)
    critical = sum(1 for c in conjs if c.risk_level == "CRITICAL")
    high = sum(1 for c in conjs if c.risk_level == "HIGH")
    closest = conjs[0].miss_distance_km if conjs else None
    next_tca = conjs[0].tca.isoformat() if conjs and conjs[0].tca else None
    vuln = getattr(conjs[0], "vulnerable_subsystem", "Solar Array") if conjs else "Solar Array"

    return {
        "norad_id": sat.norad_id,
        "name": sat.name,
        "type": sat.type,
        "total_conjunctions": total,
        "critical_count": critical,
        "high_count": high,
        "next_tca": next_tca,
        "closest_miss_km": closest,
        "vulnerable_subsystem": vuln,
        "future_risk_trend": "Increasing" if critical > 0 or high > 0 else "Stable",
        "conjunctions": conjs
    }

@app.post("/api/ai/detect", response_model=AIDetectionResponse)
@app.post("/api/v1/detect", response_model=AIDetectionResponse)
async def detect_debris(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload astronomical optical image for computer vision streak candidate detection."""
    # File validation
    allowed_exts = [".png", ".jpg", ".jpeg", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file extension {ext}. Allowed: PNG, JPG, JPEG, WEBP")

    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 15MB limit.")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty upload file.")

    try:
        result = DebrisDetectionService.process_image_pipeline(contents, file.filename, UPLOAD_DIR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Optical image processing failed: {str(e)}")

    log = AIDetectionLog(
        filename=result["filename"],
        filepath=result["processed_image_url"],
        detections_count=result["detection_count"],
        detected_objects=result["detections"],
        processing_time_ms=result["processing_time_ms"],
        source_type="AI PREDICTION — PROTOTYPE"
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "detection_id": log.id,
        "filename": result["filename"],
        "image_width": result["image_width"],
        "image_height": result["image_height"],
        "detection_count": result["detection_count"],
        "detections": result["detections"],
        "processing_time_ms": result["processing_time_ms"],
        "method": result["method"],
        "data_mode": result["data_mode"],
        "image_url": result["image_url"],
        "processed_image_url": result["processed_image_url"]
    }

@app.get("/api/ai/detection/{detection_id}", response_model=AIDetectionResponse)
def get_ai_detection_by_id(detection_id: int, db: Session = Depends(get_db)):
    """Retrieve stored AI debris streak detection log by ID."""
    log = db.query(AIDetectionLog).filter(AIDetectionLog.id == detection_id).first()
    if not log:
        raise HTTPException(status_code=404, detail=f"Detection log #{detection_id} not found")

    return {
        "detection_id": log.id,
        "filename": log.filename,
        "image_width": 1920,
        "image_height": 1080,
        "detection_count": log.detections_count,
        "detections": log.detected_objects or [],
        "processing_time_ms": log.processing_time_ms,
        "method": "Computer Vision Baseline",
        "data_mode": "AI PREDICTION — PROTOTYPE",
        "image_url": f"/uploads/{log.filename}",
        "processed_image_url": log.filepath
    }

@app.get("/api/v1/ai/detections", response_model=List[AIDetectionResponse])
def get_all_ai_detections(db: Session = Depends(get_db)):
    """Retrieve all stored AI optical debris streak detection logs."""
    logs = db.query(AIDetectionLog).order_by(AIDetectionLog.created_at.desc()).all()
    results = []
    for log in logs:
        results.append({
            "detection_id": log.id,
            "filename": log.filename,
            "image_width": 1920,
            "image_height": 1080,
            "detection_count": log.detections_count,
            "detections": log.detected_objects or [],
            "processing_time_ms": log.processing_time_ms,
            "method": "Computer Vision Baseline",
            "data_mode": "AI PREDICTION — PROTOTYPE",
            "image_url": f"/uploads/{log.filename}",
            "processed_image_url": log.filepath
        })
    return results


@app.get("/api/analytics")
@app.get("/api/dashboard/stats")
@app.get("/api/v1/analytics")
@app.get("/api/analytics/summary")
def get_analytics(db: Session = Depends(get_db)):
    """Return comprehensive analytics for Space Situational Awareness dashboard."""
    full_analytics = AnalyticsEngine.get_comprehensive_analytics(db)
    
    # Backwards compatibility fields for existing components
    full_analytics["total_tracked_objects"] = full_analytics["summary_cards"]["total_tracked_objects"]
    full_analytics["breakdown"] = {
        "payloads": full_analytics["summary_cards"]["active_satellites"],
        "debris": full_analytics["summary_cards"]["space_debris"],
        "rocket_bodies": full_analytics["summary_cards"]["inactive_rocket_bodies"]
    }
    full_analytics["critical_conjunctions_count"] = full_analytics["summary_cards"]["high_risk_objects"]
    full_analytics["data_sources"] = {
        "celestrak": "active",
        "space_track": "cached_demo",
        "ai_pipeline": "online"
    }
    
    return full_analytics

@app.get("/api/v1/constellations", response_model=List[ConstellationSummary])
def get_constellation_summaries(db: Session = Depends(get_db)):
    """Retrieve operational constellation health summaries and threat levels."""
    satellites = db.query(Satellite).all()
    conjunctions = db.query(ConjunctionEvent).all()
    
    groups: Dict[str, List[Satellite]] = {}
    for sat in satellites:
        c_name = getattr(sat, "constellation", "LEO General") or "LEO General"
        if c_name not in groups:
            groups[c_name] = []
        groups[c_name].append(sat)
        
    results = []
    for c_name, sat_list in groups.items():
        total = len(sat_list)
        active = sum(1 for s in sat_list if s.type == "PAYLOAD")
        deb_cnt = sum(1 for s in sat_list if s.type in ["DEBRIS", "ROCKET BODY"])
        
        norad_ids = {s.norad_id for s in sat_list}
        rel_conjs = [c for c in conjunctions if c.primary_norad_id in norad_ids or c.secondary_norad_id in norad_ids]
        crit_cnt = sum(1 for c in rel_conjs if c.risk_level == "CRITICAL")
        high_cnt = sum(1 for c in rel_conjs if c.risk_level == "HIGH")
        
        health_score = max(40.0, 98.5 - (crit_cnt * 15.0) - (high_cnt * 8.0))
        if health_score >= 90:
            status = "EXCELLENT"
        elif health_score >= 75:
            status = "STABLE"
        elif health_score >= 60:
            status = "AT RISK"
        else:
            status = "DEGRADED"
            
        prim_func = "Global Satellite Broadband & Telecommunications" if "Starlink" in c_name else (
            "Space Station Ops & Microgravity Research" if "ISS" in c_name else "Earth Observation & Orbital Infrastructure"
        )
        r_sum = f"{len(rel_conjs)} active conjunction screenings. {crit_cnt} critical threat(s)." if rel_conjs else "Nominal orbital operations. No critical close approach."
        
        results.append({
            "name": c_name,
            "total_objects": total,
            "active_satellites": active,
            "debris_count": deb_cnt,
            "health_score": round(health_score, 1),
            "health_status": status,
            "primary_function": prim_func,
            "risk_summary": r_sum
        })
        
    return results

@app.get("/api/v1/space-environment", response_model=List[SpaceEnvironmentResponse])
def get_space_environment(db: Session = Depends(get_db)):
    """Retrieve Space Weather & Solar Environment conditions."""
    return db.query(SpaceEnvironmentRecord).order_by(SpaceEnvironmentRecord.updated_at.desc()).all()

@app.get("/api/v1/communication-risk", response_model=List[CommunicationRiskResponse])
def get_communication_risks(db: Session = Depends(get_db)):
    """Retrieve Spacecraft Communication & Telemetry Link status."""
    return db.query(CommunicationRiskRecord).order_by(CommunicationRiskRecord.updated_at.desc()).all()

@app.get("/api/v1/protected-assets", response_model=List[ProtectedAssetResponse])
def get_protected_assets(db: Session = Depends(get_db)):
    """Retrieve prioritized protected spacecraft assets."""
    return db.query(ProtectedAssetRecord).order_by(ProtectedAssetRecord.threat_count.desc()).all()

@app.get("/api/v1/celestial-events", response_model=List[CelestialEventResponse])
def get_celestial_events(db: Session = Depends(get_db)):
    """Retrieve astronomical & celestial events awareness feeds."""
    return db.query(CelestialEventRecord).order_by(CelestialEventRecord.updated_at.desc()).all()

@app.get("/api/v1/reentry-risks", response_model=List[ReEntryRiskResponse])
def get_reentry_risks(db: Session = Depends(get_db)):
    """Retrieve atmospheric re-entry risk corridors and decay monitoring."""
    return db.query(ReEntryRiskRecord).order_by(ReEntryRiskRecord.updated_at.desc()).all()

@app.post("/api/v1/conjunctions/{conjunction_id}/what-if", response_model=WhatIfResponse)
def simulate_conjunction_what_if(
    conjunction_id: int, 
    req: WhatIfRequest,
    db: Session = Depends(get_db)
):
    """Simulate 'What If?' scenario variation for decision support screening."""
    event = db.query(ConjunctionEvent).filter(ConjunctionEvent.id == conjunction_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Conjunction #{conjunction_id} not found")

    res = ScenarioEngine.simulate_what_if(
        orig_miss_km=event.miss_distance_km,
        orig_risk=event.risk_level,
        orig_score=getattr(event, "priority_score", 75.0) or 75.0,
        new_miss_km=req.modified_miss_distance_km,
        burn_m_s=req.simulated_avoidance_burn_m_s
    )
    return res

@app.post("/api/v1/sync-live")
def sync_celestrak(db: Session = Depends(get_db)):
    """Trigger live TLE synchronization from CelesTrak."""
    res = DataIngestionService.fetch_live_celestrak(db, limit=50)
    return res

@app.get("/api/v1/forecast", response_model=FutureRiskForecastResponse)
def get_future_risk_forecast(
    horizon: str = Query("24h", description="Forecast window: 1h, 6h, 24h, 7d, 30d"),
    db: Session = Depends(get_db)
):
    """Retrieve upcoming Space Risk Forecast items for lookahead horizon."""
    all_items = [
        # 1 Hour Horizon
        FutureForecastItem(
            event="STARLINK-1007 vs FENGYUN 1C DEBRIS Close Approach",
            time="TCA in +02h 18m",
            horizon="1h",
            object_name="STARLINK-1007",
            location_orbit="LEO — 543.9 km",
            risk="CRITICAL",
            confidence_pct=94.0
        ),
        FutureForecastItem(
            event="Geomagnetic Kp-Index Ionospheric Noise Surge",
            time="Next 45 mins",
            horizon="1h",
            object_name="Broadband & Nav Constellations",
            location_orbit="Global Ionosphere Shell",
            risk="ELEVATED",
            confidence_pct=88.0
        ),
        # 6 Hour Horizon
        FutureForecastItem(
            event="ISS (ZARYA) Orbit Safety Corridor Entry",
            time="TCA in +04h 32m",
            horizon="6h",
            object_name="ISS (ZARYA)",
            location_orbit="LEO — 418.2 km",
            risk="HIGH",
            confidence_pct=82.0
        ),
        FutureForecastItem(
            event="Hubble Telescope Solar Array Shadow Ingress",
            time="TCA in +05h 10m",
            horizon="6h",
            object_name="Hubble Space Telescope",
            location_orbit="LEO — 535.0 km",
            risk="LOW",
            confidence_pct=96.0
        ),
        # 24 Hour Horizon
        FutureForecastItem(
            event="2024 BX1 Meteoroid Sub-Orbital Airburst Risk",
            time="07 Sep 04:12 UTC (+18h)",
            horizon="24h",
            object_name="2024 BX1 Meteoroid",
            location_orbit="Sub-Orbital Airburst Corridor",
            risk="MEDIUM",
            confidence_pct=76.0
        ),
        FutureForecastItem(
            event="Envisat Defunct Satellite Drift Screening",
            time="07 Sep 11:00 UTC (+23h)",
            horizon="24h",
            object_name="Envisat",
            location_orbit="LEO — 765.0 km",
            risk="MEDIUM",
            confidence_pct=79.0
        ),
        # 7 Day Horizon
        FutureForecastItem(
            event="Perseid Meteoroid Particle Flux Peak",
            time="12-14 August 2026",
            horizon="7d",
            object_name="LEO Satellite Fleet",
            location_orbit="LEO & MEO Shells",
            risk="WATCH",
            confidence_pct=91.0
        ),
        FutureForecastItem(
            event="Asteroid 2026 SA-1 Lunar Distance Flyby Corridor",
            time="14 Sep 18:30 UTC",
            horizon="7d",
            object_name="Asteroid 2026 SA-1",
            location_orbit="Lunar-Distance Deep Space",
            risk="LOW",
            confidence_pct=88.0
        ),
        # 30 Day Horizon
        FutureForecastItem(
            event="SL-16 R/B Upper Stage Atmospheric Decay Window",
            time="12-36 Months Window (Monitoring)",
            horizon="30d",
            object_name="SL-16 R/B (#22218)",
            location_orbit="Equatorial Ocean Re-Entry Corridor",
            risk="MEDIUM",
            confidence_pct=68.0
        ),
        FutureForecastItem(
            event="Penumbral Lunar Eclipse Shadow Passage",
            time="Upcoming May 2026",
            horizon="30d",
            object_name="GEO Satellite Fleet",
            location_orbit="GEO Arc — 35,786 km",
            risk="INFORMATIONAL",
            confidence_pct=99.0
        )
    ]

    h_clean = horizon.lower()
    filtered = [item for item in all_items if item.horizon == h_clean]
    if not filtered:
        filtered = [item for item in all_items if item.horizon == "24h"]

    return {
        "horizon": h_clean,
        "total_events": len(filtered),
        "items": filtered,
        "data_mode": "DEMO / ESTIMATED DATA"
    }

@app.get("/api/v1/neo-warnings", response_model=List[NearEarthObjectResponse])
def get_neo_warnings(db: Session = Depends(get_db)):
    """Retrieve Near-Earth Object (NEO) meteoroid and asteroid early warnings."""
    return db.query(NearEarthObjectRecord).order_by(NearEarthObjectRecord.updated_at.desc()).all()

@app.get("/api/v1/public-alerts", response_model=List[PublicAlertResponse])
def get_public_alerts(
    severity: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve structured public space safety & early-warning alert feed."""
    query = db.query(PublicAlert)
    if severity and severity.upper() != "ALL":
        query = query.filter(PublicAlert.severity == severity.upper())
    if region and region.upper() != "ALL REGIONS" and region.upper() != "GLOBAL / ALL REGIONS":
        query = query.filter(PublicAlert.region.ilike(f"%{region}%"))
    return query.order_by(PublicAlert.priority_score.desc()).all()

@app.post("/api/v1/public-alerts/{alert_id}/acknowledge", response_model=PublicAlertResponse)
def acknowledge_public_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark public space alert status as ACKNOWLEDGED."""
    alert = db.query(PublicAlert).filter(PublicAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Public alert #{alert_id} not found")
    alert.status = "ACKNOWLEDGED"
    db.commit()
    db.refresh(alert)
    return alert

@app.get("/api/v1/notification-preferences", response_model=NotificationPreferenceResponse)
def get_notification_preferences(db: Session = Depends(get_db)):
    """Retrieve user notification preferences and channel architecture status."""
    pref = db.query(NotificationPreferenceRecord).filter(NotificationPreferenceRecord.user_id == "default_user").first()
    if not pref:
        pref = NotificationPreferenceRecord(user_id="default_user")
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

@app.post("/api/v1/notification-preferences", response_model=NotificationPreferenceResponse)
def update_notification_preferences(
    req: NotificationPreferenceRequest,
    db: Session = Depends(get_db)
):
    """Update user alert preferences."""
    pref = db.query(NotificationPreferenceRecord).filter(NotificationPreferenceRecord.user_id == "default_user").first()
    if not pref:
        pref = NotificationPreferenceRecord(user_id="default_user")
        db.add(pref)

    for field, val in req.dict(exclude_unset=True).items():
        setattr(pref, field, val)

    pref.sms_status = "SMS PROVIDER NOT CONFIGURED"
    db.commit()
    db.refresh(pref)
    return pref

