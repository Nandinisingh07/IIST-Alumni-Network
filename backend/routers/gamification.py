from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, ContributionScore, Badge, UserBadge
from schemas.schemas import ContributionScoreResponse, BadgeResponse, LeaderboardUser
from routers.auth import get_current_verified_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/gamification", tags=["Gamification System"])

@router.get("/my-score", response_model=ContributionScoreResponse)
def get_my_score(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    score = db.query(ContributionScore).filter(ContributionScore.user_id == current_user.id).first()
    if not score:
        # Create empty score tracker
        score = ContributionScore(
            user_id=current_user.id,
            total_points=0,
            breakdown={"mentoring": 0, "stories": 0, "referrals": 0, "events": 0, "reviews": 0}
        )
        db.add(score)
        db.commit()
        db.refresh(score)
    return score

@router.get("/leaderboard", response_model=List[LeaderboardUser])
def get_leaderboard(
    type: str = "alumni", # alumni, student
    period: str = "all-time", # monthly, all-time
    db: Session = Depends(get_db)
):
    # Fetch contribution scores sorted descending
    scores = db.query(ContributionScore).join(User).filter(User.role == type).order_by(ContributionScore.total_points.desc()).limit(20).all()
    
    leaderboard = []
    for index, s in enumerate(scores):
        leaderboard.append({
            "user_id": s.user_id,
            "full_name": s.user.full_name,
            "avatar_url": s.user.avatar_url,
            "role": s.user.role,
            "total_points": s.total_points,
            "rank": index + 1
        })
    return leaderboard

@router.get("/badges", response_model=List[BadgeResponse])
def get_all_badges(db: Session = Depends(get_db)):
    # Initialize mock badges list if none exists
    badges = db.query(Badge).all()
    if not badges:
        seed_badges = [
            Badge(name="First Mentor", description="Completed your first mentoring session", criteria="mentoring >= 1", icon_url="https://images.unsplash.com/photo-1544717305-2782549b5136?w=100"),
            Badge(name="Story Teller", description="Published 3 stories on the Story Wall", criteria="stories >= 3", icon_url="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=100"),
            Badge(name="Placement Champion", description="Referred 5 candidates that received job offers", criteria="referrals_offers >= 5", icon_url="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100"),
            Badge(name="AMA Host", description="Hosted 3 webinars or AMA reunion events", criteria="events >= 3", icon_url="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=100"),
            Badge(name="Community Pillar", description="Ranked in the top 10 on the monthly leaderboard", criteria="rank <= 10", icon_url="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=100")
        ]
        for sb in seed_badges:
            db.add(sb)
        db.commit()
        badges = db.query(Badge).all()
    return badges

@router.get("/my-badges", response_model=List[BadgeResponse])
def get_user_badges(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Fetch badges associated with current user
    user_badges = db.query(Badge).join(UserBadge).filter(UserBadge.user_id == current_user.id).all()
    
    # Auto-award simulator logic
    # Query current user metrics to check if they qualify for any badges
    score = db.query(ContributionScore).filter(ContributionScore.user_id == current_user.id).first()
    if score:
        # Check First Mentor
        first_mentor = db.query(Badge).filter(Badge.name == "First Mentor").first()
        if first_mentor and score.breakdown.get("mentoring", 0) >= 50: # Completed session = 50 pts
            # Check if already awarded
            exists = db.query(UserBadge).filter(UserBadge.user_id == current_user.id, UserBadge.badge_id == first_mentor.id).first()
            if not exists:
                db.add(UserBadge(user_id=current_user.id, badge_id=first_mentor.id))
                
        # Check Story Teller
        story_teller = db.query(Badge).filter(Badge.name == "Story Teller").first()
        if story_teller and score.breakdown.get("stories", 0) >= 90: # 3 stories = 90 pts
            exists = db.query(UserBadge).filter(UserBadge.user_id == current_user.id, UserBadge.badge_id == story_teller.id).first()
            if not exists:
                db.add(UserBadge(user_id=current_user.id, badge_id=story_teller.id))
                
        # Check AMA Host
        ama_host = db.query(Badge).filter(Badge.name == "AMA Host").first()
        if ama_host and score.breakdown.get("events", 0) >= 120: # 3 events hosted = 120 pts
            exists = db.query(UserBadge).filter(UserBadge.user_id == current_user.id, UserBadge.badge_id == ama_host.id).first()
            if not exists:
                db.add(UserBadge(user_id=current_user.id, badge_id=ama_host.id))
                
        db.commit()
        # Fetch updated badges
        user_badges = db.query(Badge).join(UserBadge).filter(UserBadge.user_id == current_user.id).all()
        
    return user_badges
