import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, Base, SessionLocal
from app.models import Satellite, ConjunctionEvent
from app.services.data_ingestion import DataIngestionService
from app.services.orbital_engine import OrbitalEngine

print("Testing Backend Service Setup...")

# Initialize DB
Base.metadata.create_all(bind=engine)
db = SessionLocal()

# Seed catalog
DataIngestionService.seed_initial_catalog(db)

count = db.query(Satellite).count()
print(f"Database contains {count} satellites/debris objects.")

# Test propagation for ISS
iss = db.query(Satellite).filter(Satellite.norad_id == 25544).first()
if iss:
    pos = OrbitalEngine.propagate_tle(iss.line1, iss.line2)
    print(f"ISS Position: Lat={pos['lat']:.2f}°, Lon={pos['lon']:.2f}°, Alt={pos['alt']:.2f} km, Speed={pos['velocity_kms']:.2f} km/s")

# Test conjunction calculation
conj = db.query(ConjunctionEvent).first()
if conj:
    print(f"Sample Conjunction: {conj.primary_name} vs {conj.secondary_name} -> Miss Dist={conj.miss_distance_km} km, Risk={conj.risk_level}")

print("Backend Verification Complete!")
