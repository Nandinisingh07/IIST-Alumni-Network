from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from database.db import get_db
from database.models import User, PlacementRecord
from schemas.schemas import PlacementRecordCreate, PlacementRecordResponse, AnalyticsSummary
from routers.auth import get_current_verified_user, get_current_admin
import pandas as pd
import io
from typing import List, Optional

router = APIRouter(prefix="/api/analytics", tags=["Placement Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_summary(year: Optional[int] = None, branch: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PlacementRecord)
    if year:
        query = query.filter(PlacementRecord.batch_year == year)
    if branch:
        query = query.filter(PlacementRecord.branch.ilike(f"%{branch}%"))
        
    records = query.all()
    if not records:
        return {
            "total_placements": 0,
            "avg_package": 0.0,
            "highest_package": 0.0,
            "percent_placed": 0.0,
            "top_recruiter": "None"
        }
        
    packages = [r.package_lpa for r in records]
    total_placements = len(records)
    avg_package = round(sum(packages) / total_placements, 2)
    highest_package = max(packages)
    
    # Calculate company recruiting headcounts to find the top recruiter
    recruiter_counts = {}
    for r in records:
        recruiter_counts[r.company] = recruiter_counts.get(r.company, 0) + 1
    top_recruiter = max(recruiter_counts, key=recruiter_counts.get) if recruiter_counts else "None"
    
    return {
        "total_placements": total_placements,
        "avg_package": avg_package,
        "highest_package": highest_package,
        "percent_placed": 88.5, # Mock target placement percentage index
        "top_recruiter": top_recruiter
    }

@router.get("/placements", response_model=List[PlacementRecordResponse])
def get_placements(year: Optional[int] = None, branch: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(PlacementRecord)
    if year:
        query = query.filter(PlacementRecord.batch_year == year)
    if branch:
        query = query.filter(PlacementRecord.branch.ilike(f"%{branch}%"))
    return query.all()

@router.get("/companies")
def get_companies_breakdown(year: Optional[int] = None, branch: Optional[str] = None, db: Session = Depends(get_db)):
    # Recruiting count per company
    query = db.query(
        PlacementRecord.company, 
        func.count(PlacementRecord.id).label("count"),
        func.avg(PlacementRecord.package_lpa).label("avg_package")
    )
    if year:
        query = query.filter(PlacementRecord.batch_year == year)
    if branch:
        query = query.filter(PlacementRecord.branch.ilike(f"%{branch}%"))
        
    results = query.group_by(PlacementRecord.company).order_by(func.count(PlacementRecord.id).desc()).all()
    return [{"company": r[0], "count": r[1], "avg_package": round(r[2], 2)} for r in results]

@router.get("/salary-trends")
def get_salary_trends(branch: Optional[str] = None, db: Session = Depends(get_db)):
    # Returns average salary trends per batch year
    query = db.query(
        PlacementRecord.batch_year,
        func.avg(PlacementRecord.package_lpa).label("avg_salary"),
        func.max(PlacementRecord.package_lpa).label("max_salary")
    )
    if branch:
        query = query.filter(PlacementRecord.branch.ilike(f"%{branch}%"))
        
    results = query.group_by(PlacementRecord.batch_year).order_by(PlacementRecord.batch_year.asc()).all()
    return [{"year": r[0], "avg_package": round(r[1], 2), "highest_package": r[2]} for r in results]

@router.get("/domains")
def get_domains_distribution(year: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(PlacementRecord.domain, func.count(PlacementRecord.id))
    if year:
        query = query.filter(PlacementRecord.batch_year == year)
    results = query.group_by(PlacementRecord.domain).all()
    return [{"domain": r[0], "count": r[1]} for r in results]

@router.get("/top-recruiters")
def get_top_recruiters(db: Session = Depends(get_db)):
    results = db.query(PlacementRecord.company, func.count(PlacementRecord.id)).group_by(PlacementRecord.company).order_by(func.count(PlacementRecord.id).desc()).limit(10).all()
    return [{"company": r[0], "count": r[1]} for r in results]

@router.post("/placement", response_model=PlacementRecordResponse)
def add_placement_record(
    data: PlacementRecordCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    new_rec = PlacementRecord(
        batch_year=data.batch_year,
        branch=data.branch,
        company=data.company,
        role=data.role,
        package_lpa=data.package_lpa,
        role_type=data.role_type,
        domain=data.domain,
        location=data.location
    )
    db.add(new_rec)
    db.commit()
    db.refresh(new_rec)
    return new_rec

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    
    # Required columns check
    required = ["batch_year", "branch", "company", "role", "package_lpa", "role_type", "domain"]
    for col in required:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Missing required CSV column: {col}")
            
    records_added = 0
    for _, row in df.iterrows():
        rec = PlacementRecord(
            batch_year=int(row["batch_year"]),
            branch=str(row["branch"]),
            company=str(row["company"]),
            role=str(row["role"]),
            package_lpa=float(row["package_lpa"]),
            role_type=str(row["role_type"]),
            domain=str(row["domain"]),
            location=str(row.get("location", ""))
        )
        db.add(rec)
        records_added += 1
        
    db.commit()
    return {"message": "CSV data imported successfully", "records_imported": records_added}
