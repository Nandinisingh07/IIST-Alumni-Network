from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, ReferralPost, ReferralApplication, ContributionScore
from schemas.schemas import ReferralPostCreate, ReferralPostResponse, ReferralApplicationCreate, ReferralApplicationResponse
from routers.auth import get_current_verified_user
from services.services import EmailService
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/referrals", tags=["Referral Board"])

@router.get("", response_model=List[ReferralPostResponse])
def get_referrals(
    company: Optional[str] = None,
    role: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ReferralPost)
    if company:
        query = query.filter(ReferralPost.company.ilike(f"%{company}%"))
    if role:
        query = query.filter(ReferralPost.role.ilike(f"%{role}%"))
    if type:
        query = query.filter(ReferralPost.type == type)
    if status:
        query = query.filter(ReferralPost.status == status)
    return query.all()

@router.get("/my-postings", response_model=List[ReferralPostResponse])
def get_my_postings(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    return db.query(ReferralPost).filter(ReferralPost.alumni_id == current_user.id).all()

@router.get("/my-applications", response_model=List[ReferralApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    return db.query(ReferralApplication).filter(ReferralApplication.student_id == current_user.id).all()

@router.post("", response_model=ReferralPostResponse)
def create_referral(
    data: ReferralPostCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "alumni" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only alumni can post referrals")
        
    new_post = ReferralPost(
        alumni_id=current_user.id,
        company=data.company,
        role=data.role,
        jd_url=data.jd_url,
        type=data.type,
        location=data.location,
        experience_required=data.experience_required,
        deadline=data.deadline,
        status="open",
        slots_available=data.slots_available
    )
    db.add(new_post)
    
    # Award gamification points (+20 for posting referral)
    score = db.query(ContributionScore).filter(ContributionScore.user_id == current_user.id).first()
    if score:
        score.total_points += 20
        score.breakdown["referrals"] = score.breakdown.get("referrals", 0) + 20
        
    db.commit()
    db.refresh(new_post)
    return new_post

@router.put("/{post_id}", response_model=ReferralPostResponse)
def update_referral(
    post_id: int,
    data: ReferralPostCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    post = db.query(ReferralPost).filter(ReferralPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Referral posting not found")
        
    if post.alumni_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this posting")
        
    post.company = data.company
    post.role = data.role
    post.jd_url = data.jd_url
    post.type = data.type
    post.location = data.location
    post.experience_required = data.experience_required
    post.deadline = data.deadline
    post.slots_available = data.slots_available
    
    db.commit()
    db.refresh(post)
    return post

@router.delete("/{post_id}")
def delete_referral(
    post_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    post = db.query(ReferralPost).filter(ReferralPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Referral posting not found")
        
    if post.alumni_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this posting")
        
    db.delete(post)
    db.commit()
    return {"message": "Referral deleted successfully"}

@router.post("/{post_id}/apply", response_model=ReferralApplicationResponse)
def apply_referral(
    post_id: int,
    data: ReferralApplicationCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    post = db.query(ReferralPost).filter(ReferralPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Referral posting not found")
        
    if post.status != "open":
        raise HTTPException(status_code=400, detail="Referral slots have been filled or closed")
        
    # Check duplicate application
    dup = db.query(ReferralApplication).filter(
        ReferralApplication.post_id == post_id,
        ReferralApplication.student_id == current_user.id
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="You have already applied for this referral")
        
    new_app = ReferralApplication(
        post_id=post_id,
        student_id=current_user.id,
        resume_url=data.resume_url,
        cover_note=data.cover_note,
        status="pending"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.get("/{post_id}/applicants", response_model=List[ReferralApplicationResponse])
def get_applicants(
    post_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    post = db.query(ReferralPost).filter(ReferralPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Referral posting not found")
        
    if post.alumni_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view applicants")
        
    return db.query(ReferralApplication).filter(ReferralApplication.post_id == post_id).all()

@router.put("/{post_id}/applicants/{student_id}/status")
def update_applicant_status(
    post_id: int,
    student_id: int,
    status: str, # referred, rejected, offer_received
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    post = db.query(ReferralPost).filter(ReferralPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Referral posting not found")
        
    if post.alumni_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to change applicant status")
        
    application = db.query(ReferralApplication).filter(
        ReferralApplication.post_id == post_id,
        ReferralApplication.student_id == student_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application record not found")
        
    application.status = status
    application.updated_at = datetime.utcnow()
    
    # Handle decrementing referral slots if status turns "referred"
    if status == "referred" and post.slots_available > 0:
        post.slots_available -= 1
        if post.slots_available == 0:
            post.status = "filled"
            
    # Award gamification bonus point trigger (+100 if referral leads to offer)
    if status == "offer_received":
        score = db.query(ContributionScore).filter(ContributionScore.user_id == post.alumni_id).first()
        if score:
            score.total_points += 100
            score.breakdown["referrals"] = score.breakdown.get("referrals", 0) + 100
            
    db.commit()
    
    # Send email notification to student candidate
    student_user = application.student
    EmailService.send_email(
        to_email=student_user.email,
        subject=f"Application status updated for {post.role} at {post.company}",
        html_content=f"""
        <h3>Referral Application Status Update</h3>
        <p>Dear {student_user.full_name},</p>
        <p>Alumni {current_user.full_name} has updated your application status to: <b>{status.upper()}</b></p>
        <p>Track your timeline status in the Referral Board section of the app.</p>
        """
    )
    return {"message": "Candidate status updated successfully"}
