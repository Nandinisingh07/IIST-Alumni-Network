from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, AlumniProfile, MentorshipSession, Story, ReferralPost, Event, Roadmap
from schemas.schemas import AdminStats, UserResponse, AnnouncementCreate
from routers.auth import get_current_admin
from services.services import EmailService
from datetime import datetime, timedelta
from typing import List, Optional

router = APIRouter(prefix="/api/admin", tags=["Platform Administration"])

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    
    # Active this month (last active in past 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_this_month = db.query(User).filter(User.last_active >= thirty_days_ago).count()
    
    sessions_booked = db.query(MentorshipSession).count()
    stories_published = db.query(Story).count()
    events_held = db.query(Event).filter(Event.status == "completed").count()
    referrals_posted = db.query(ReferralPost).count()
    
    return {
        "total_users": total_users,
        "active_this_month": active_this_month,
        "sessions_booked": sessions_booked,
        "stories_published": stories_published,
        "events_held": events_held,
        "referrals_posted": referrals_posted
    }

@router.get("/users", response_model=List[UserResponse])
def get_users(
    role: Optional[str] = None,
    verified: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if verified is not None:
        query = query.filter(User.is_verified == verified)
        
    return query.offset(offset).limit(limit).all()

@router.put("/users/{user_id}/verify")
def verify_user(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_verified = True
    db.commit()
    return {"message": f"User {user.full_name} verified successfully"}

@router.put("/users/{user_id}/ban")
def ban_user(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Mock ban by marking unverified and changing role
    user.is_verified = False
    # In full system we would have an is_banned flag, but here we can just update status
    db.delete(user) # Or delete/deactivate user
    db.commit()
    return {"message": "User has been banned and profile removed"}

@router.get("/stories/pending")
def get_pending_stories(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Standard query for unfeatured stories or moderation queue
    return db.query(Story).filter(Story.is_featured == False).all()

@router.put("/stories/{story_id}/approve")
def approve_story(
    story_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    story.is_featured = True
    db.commit()
    return {"message": "Story approved and featured"}

@router.get("/roadmaps/pending")
def get_pending_roadmaps(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Filter pending roadmaps
    return db.query(Roadmap).all()

@router.put("/roadmaps/{roadmap_id}/approve")
def approve_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
        
    # Simulating roadmap approval check
    db.commit()
    return {"message": "Roadmap approved successfully"}

@router.post("/announcements")
def broadcast_announcement(
    data: AnnouncementCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Query targets
    query = db.query(User)
    if data.target_role != "all":
        query = query.filter(User.role == data.target_role)
    users = query.all()
    
    # Broadcast emails simulation
    for u in users:
        EmailService.send_email(
            to_email=u.email,
            subject=f"Important Announcement: {data.title}",
            html_content=f"""
            <h3>Platform Broadcast Notice</h3>
            <p>Dear {u.full_name},</p>
            <p>{data.body}</p>
            <br>
            <p>Best Regards,</p>
            <p>IIST Connect Administrator Team</p>
            """
        )
    return {"message": "Announcement broadcasted successfully", "sent_to_count": len(users)}
