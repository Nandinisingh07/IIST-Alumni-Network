from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, ProjectPost
from schemas.schemas import ProjectCreate, ProjectResponse, ProjectInterestCreate
from routers.auth import get_current_verified_user
from datetime import datetime
from typing import List, Optional

# Since we don't have project_interests table in models.py, let's look at the database.models
# database/models.py has:
# class ProjectPost(Base):
#     __tablename__ = "project_posts"
#     ...
#     skills_needed = Column(JSON, default=list)
#     ...
# There is no project_interests table defined!
# How do we store project interest applications?
# We can represent it by adding a ProjectInterest table in database/models.py, or by storing interests inside a JSON column in ProjectPost!
# Storing them as a JSON column in ProjectPost is incredibly simple and clean, avoiding complex SQLite table migrations!
# Let's check: does ProjectPost have a column for interests?
# Let's inspect database/models.py ProjectPost columns:
# - id, posted_by, role_of_poster, type, title, description, skills_needed, domain, commitment_hours_per_week, status, team_size_needed, created_at.
# There is no interests column. We can append an `interests` JSON column to ProjectPost in models.py, or we can add a ProjectInterest class.
# Wait, let's add a ProjectInterest table to database/models.py. That will be very clean and matches standard DB relational layouts.
# Let's check how to add ProjectInterest to models.py:
# class ProjectInterest(Base):
#     __tablename__ = "project_interests"
#     id = Column(Integer, primary_key=True, index=True)
#     project_id = Column(Integer, ForeignKey("project_posts.id"), nullable=False)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     note = Column(Text, nullable=False)
#     skills = Column(JSON, default=list)
#     accepted = Column(Boolean, default=False)
#     created_at = Column(DateTime, default=datetime.utcnow)
# Let's edit models.py to append this table!
# Let's first view the end of database/models.py.
# The end has:
# class AIChatMessage(Base):
#     ...
# Let's append ProjectInterest to database/models.py.

router = APIRouter(prefix="/api/projects", tags=["Project Collaboration Board"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    type: Optional[str] = None,
    domain: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ProjectPost)
    if type:
        query = query.filter(ProjectPost.type == type)
    if domain:
        query = query.filter(ProjectPost.domain.ilike(f"%{domain}%"))
    if status:
        query = query.filter(ProjectPost.status == status)
        
    posts = query.all()
    
    result = []
    for p in posts:
        poster = db.query(User).filter(User.id == p.posted_by).first()
        res = ProjectResponse.from_orm(p)
        if poster:
            res.poster = poster
        result.append(res)
    return result

@router.get("/my-projects")
def get_my_projects(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Posted projects
    posted = db.query(ProjectPost).filter(ProjectPost.posted_by == current_user.id).all()
    
    # We will simulate joined/interested projects from mock lists or local filters
    # If we need ProjectInterest table, let's write it in this file using a mock or a quick query
    # Since we will create the ProjectInterest table in database/models.py, we can query it!
    # Let's run a query on ProjectInterest
    from database.models import ProjectInterest
    
    interested = db.query(ProjectPost).join(ProjectInterest, ProjectInterest.project_id == ProjectPost.id).filter(
        ProjectInterest.user_id == current_user.id,
        ProjectInterest.accepted == False
    ).all()
    
    joined = db.query(ProjectPost).join(ProjectInterest, ProjectInterest.project_id == ProjectPost.id).filter(
        ProjectInterest.user_id == current_user.id,
        ProjectInterest.accepted == True
    ).all()
    
    return {
        "posted": posted,
        "joined": joined,
        "interested": interested
    }

@router.post("", response_model=ProjectResponse)
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    new_post = ProjectPost(
        posted_by=current_user.id,
        role_of_poster=current_user.role,
        type=data.type,
        title=data.title,
        description=data.description,
        skills_needed=data.skills_needed,
        domain=data.domain,
        commitment_hours_per_week=data.commitment_hours_per_week,
        status="open",
        team_size_needed=data.team_size_needed
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    res = ProjectResponse.from_orm(new_post)
    res.poster = current_user
    return res

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    post = db.query(ProjectPost).filter(ProjectPost.id == project_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Project post not found")
        
    if post.posted_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
        
    post.type = data.type
    post.title = data.title
    post.description = data.description
    post.skills_needed = data.skills_needed
    post.domain = data.domain
    post.commitment_hours_per_week = data.commitment_hours_per_week
    post.team_size_needed = data.team_size_needed
    
    db.commit()
    db.refresh(post)
    
    poster = db.query(User).filter(User.id == post.posted_by).first()
    res = ProjectResponse.from_orm(post)
    if poster:
        res.poster = poster
    return res

@router.post("/{project_id}/express-interest")
def express_interest(
    project_id: int,
    data: ProjectInterestCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Check if project exists
    post = db.query(ProjectPost).filter(ProjectPost.id == project_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Project post not found")
        
    from database.models import ProjectInterest
    
    # Check duplicate interest
    dup = db.query(ProjectInterest).filter(
        ProjectInterest.project_id == project_id,
        ProjectInterest.user_id == current_user.id
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="You have already expressed interest in this project")
        
    interest = ProjectInterest(
        project_id=project_id,
        user_id=current_user.id,
        note=data.note,
        skills=data.skills,
        accepted=False
    )
    db.add(interest)
    db.commit()
    return {"message": "Collaboration interest recorded successfully"}

@router.get("/{project_id}/interests")
def get_interests(
    project_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    post = db.query(ProjectPost).filter(ProjectPost.id == project_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Project post not found")
        
    if post.posted_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view project interests")
        
    from database.models import ProjectInterest
    
    interests = db.query(ProjectInterest).filter(ProjectInterest.project_id == project_id).all()
    result = []
    for i in interests:
        user = db.query(User).filter(User.id == i.user_id).first()
        result.append({
            "user_id": i.user_id,
            "project_id": i.project_id,
            "note": i.note,
            "skills": i.skills,
            "accepted": i.accepted,
            "user": user
        })
    return result

@router.put("/{project_id}/interests/{user_id}/accept")
def accept_collaborator(
    project_id: int,
    user_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    post = db.query(ProjectPost).filter(ProjectPost.id == project_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Project post not found")
        
    if post.posted_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to accept collaborators")
        
    from database.models import ProjectInterest
    
    interest = db.query(ProjectInterest).filter(
        ProjectInterest.project_id == project_id,
        ProjectInterest.user_id == user_id
    ).first()
    if not interest:
        raise HTTPException(status_code=404, detail="Interest record not found")
        
    interest.accepted = True
    db.commit()
    return {"message": "Collaborator accepted"}
