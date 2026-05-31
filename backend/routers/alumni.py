from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database.db import get_db
from database.models import User, AlumniProfile, Follow
from schemas.schemas import AlumniProfileResponse, AlumniProfileUpdate, UserResponse
from routers.auth import get_current_user, get_current_verified_user
from typing import List, Optional

router = APIRouter(prefix="/api/alumni", tags=["Alumni Directory"])

@router.get("", response_model=List[AlumniProfileResponse])
def get_alumni(
    page: int = 1,
    limit: int = 12,
    search: Optional[str] = None,
    branch: Optional[str] = None,
    batch: Optional[int] = None,
    company: Optional[str] = None,
    location: Optional[str] = None,
    domain: Optional[str] = None,
    mentor_available: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    query = db.query(AlumniProfile).join(User).filter(User.role == "alumni")
    
    # Filter conditions
    if branch:
        query = query.filter(AlumniProfile.branch.ilike(f"%{branch}%"))
    if batch:
        query = query.filter(AlumniProfile.batch_year == batch)
    if company:
        query = query.filter(AlumniProfile.current_company.ilike(f"%{company}%"))
    if location:
        query = query.filter(AlumniProfile.location.ilike(f"%{location}%"))
    if mentor_available is not None:
        query = query.filter(AlumniProfile.is_mentor == mentor_available)
        
    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            AlumniProfile.current_company.ilike(f"%{search}%"),
            AlumniProfile.current_role.ilike(f"%{search}%"),
            AlumniProfile.bio.ilike(f"%{search}%"),
            # JSON skill search simulator
            AlumniProfile.skills.cast(str).ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
        
    if domain:
        # JSON domains list filter
        query = query.filter(AlumniProfile.domains.cast(str).ilike(f"%{domain}%"))

    # Return results
    results = query.offset(offset).limit(limit).all()
    return results

@router.get("/featured", response_model=List[AlumniProfileResponse])
def get_featured_alumni(db: Session = Depends(get_db)):
    # Query top alumni sorted by contribution score
    return db.query(AlumniProfile).join(User).filter(User.role == "alumni").order_by(AlumniProfile.contribution_score.desc()).limit(6).all()


@router.get("/{user_id}", response_model=AlumniProfileResponse)
def get_alumni_by_id(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(AlumniProfile).filter(AlumniProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Alumni profile not found")
    
    # Increment profile views
    profile.profile_views += 1
    db.commit()
    db.refresh(profile)
    return profile

@router.put("/{user_id}", response_model=AlumniProfileResponse)
def update_alumni_profile(
    user_id: int,
    profile_data: AlumniProfileUpdate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
    profile = db.query(AlumniProfile).filter(AlumniProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Alumni profile not found")
        
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
        
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/{user_id}/follow")
def follow_alumni(
    user_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
        
    # Check if target exists
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if already following
    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.followed_id == user_id).first()
    if existing:
        return {"message": "Already following"}
        
    new_follow = Follow(follower_id=current_user.id, followed_id=user_id)
    db.add(new_follow)
    db.commit()
    return {"message": "Successfully followed"}

@router.delete("/{user_id}/follow")
def unfollow_alumni(
    user_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.followed_id == user_id).first()
    if not follow:
        raise HTTPException(status_code=400, detail="Not following this user")
        
    db.delete(follow)
    db.commit()
    return {"message": "Successfully unfollowed"}

@router.get("/{user_id}/followers", response_model=List[UserResponse])
def get_followers(user_id: int, db: Session = Depends(get_db)):
    followers = db.query(User).join(Follow, Follow.follower_id == User.id).filter(Follow.followed_id == user_id).all()
    return followers

@router.get("/{user_id}/following-status")
def get_following_status(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.followed_id == user_id).first()
    follower_count = db.query(Follow).filter(Follow.followed_id == user_id).count()
    return {
        "is_following": follow is not None,
        "follower_count": follower_count
    }
