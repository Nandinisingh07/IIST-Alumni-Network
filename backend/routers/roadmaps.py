from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, Roadmap, RoadmapProgress
from schemas.schemas import RoadmapCreate, RoadmapResponse, RoadmapProgressResponse
from routers.auth import get_current_verified_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/roadmaps", tags=["Career Roadmaps"])

@router.get("", response_model=List[RoadmapResponse])
def get_roadmaps(
    domain: Optional[str] = None,
    contributed_by: Optional[int] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Roadmap)
    if domain:
        query = query.filter(Roadmap.domain.ilike(f"%{domain}%"))
    if contributed_by:
        query = query.filter(Roadmap.created_by == contributed_by)
    if difficulty:
        query = query.filter(Roadmap.difficulty == difficulty)
    return query.all()

@router.get("/popular", response_model=List[RoadmapResponse])
def get_popular(db: Session = Depends(get_db)):
    return db.query(Roadmap).order_by(Roadmap.upvotes.desc()).limit(6).all()

@router.get("/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap(roadmap_id: int, db: Session = Depends(get_db)):
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return roadmap

@router.post("", response_model=RoadmapResponse)
def create_roadmap(
    data: RoadmapCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Convert milestones schemas to JSON dict array
    milestones_json = [m.dict() for m in data.milestones]
    
    new_roadmap = Roadmap(
        title=data.title,
        domain=data.domain,
        description=data.description,
        difficulty=data.difficulty,
        milestones=milestones_json,
        created_by=current_user.id,
        estimated_months=data.estimated_months,
        tags=data.tags
    )
    db.add(new_roadmap)
    db.commit()
    db.refresh(new_roadmap)
    return new_roadmap

@router.put("/{roadmap_id}", response_model=RoadmapResponse)
def update_roadmap(
    roadmap_id: int,
    data: RoadmapCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
        
    if roadmap.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this roadmap")
        
    milestones_json = [m.dict() for m in data.milestones]
    roadmap.title = data.title
    roadmap.domain = data.domain
    roadmap.description = data.description
    roadmap.difficulty = data.difficulty
    roadmap.milestones = milestones_json
    roadmap.estimated_months = data.estimated_months
    roadmap.tags = data.tags
    
    db.commit()
    db.refresh(roadmap)
    return roadmap

@router.post("/{roadmap_id}/bookmark")
def bookmark_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
        
    # Simply increment bookmark counter (and mock tracking)
    roadmap.bookmarks_count += 1
    db.commit()
    return {"message": "Roadmap bookmarked"}

@router.post("/{roadmap_id}/review")
def upvote_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
        
    roadmap.upvotes += 1
    db.commit()
    return {"message": "Upvoted successfully", "upvotes": roadmap.upvotes}

@router.get("/{roadmap_id}/progress", response_model=RoadmapProgressResponse)
def get_user_progress(
    roadmap_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    prog = db.query(RoadmapProgress).filter(
        RoadmapProgress.roadmap_id == roadmap_id,
        RoadmapProgress.user_id == current_user.id
    ).first()
    if not prog:
        # Create empty progress record
        prog = RoadmapProgress(
            user_id=current_user.id,
            roadmap_id=roadmap_id,
            completed_milestones=[]
        )
        db.add(prog)
        db.commit()
        db.refresh(prog)
    return prog

@router.post("/{roadmap_id}/progress")
def update_user_progress(
    roadmap_id: int,
    completed_milestones: List[str],
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    prog = db.query(RoadmapProgress).filter(
        RoadmapProgress.roadmap_id == roadmap_id,
        RoadmapProgress.user_id == current_user.id
    ).first()
    if not prog:
        prog = RoadmapProgress(
            user_id=current_user.id,
            roadmap_id=roadmap_id,
            completed_milestones=completed_milestones
        )
        db.add(prog)
    else:
        prog.completed_milestones = completed_milestones
        prog.last_updated = datetime.utcnow()
        
    db.commit()
    return {"message": "Progress tracked successfully", "completed_count": len(completed_milestones)}
