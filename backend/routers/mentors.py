from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, AlumniProfile, Mentor, MentorshipRequest, MentorshipSession, ContributionScore
from schemas.schemas import MentorResponse, MentorRegister, MentorshipRequestResponse, MentorshipRequestCreate, MentorshipSessionResponse, SessionFeedback, UserResponse
from routers.auth import get_current_verified_user
from services.services import CalendarService, EmailService
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="", tags=["Mentor-Mentee System"])

@router.get("/api/mentors", response_model=List[MentorResponse])
def get_mentors(
    domain: Optional[str] = None,
    rate_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Mentor).join(User).filter(User.is_verified == True)
    
    if domain:
        query = query.filter(Mentor.domains.cast(str).ilike(f"%{domain}%"))
    if rate_type:
        query = query.filter(Mentor.rate_type == rate_type)
        
    return query.all()

@router.post("/api/mentors/register", response_model=MentorResponse)
def register_mentor(
    data: MentorRegister,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "alumni":
        raise HTTPException(status_code=400, detail="Only alumni can register as mentors")
        
    # Check if already a mentor
    existing = db.query(Mentor).filter(Mentor.user_id == current_user.id).first()
    if existing:
        # Update details
        existing.domains = data.domains
        existing.bio = data.bio
        existing.availability_slots = data.availability_slots
        existing.rate_type = data.rate_type
        existing.hourly_rate = data.hourly_rate
        existing.max_mentees = data.max_mentees
        db.commit()
        db.refresh(existing)
        return existing
        
    new_mentor = Mentor(
        user_id=current_user.id,
        domains=data.domains,
        bio=data.bio,
        availability_slots=data.availability_slots,
        rate_type=data.rate_type,
        hourly_rate=data.hourly_rate,
        max_mentees=data.max_mentees
    )
    db.add(new_mentor)
    
    # Mark in alumni profile
    profile = db.query(AlumniProfile).filter(AlumniProfile.user_id == current_user.id).first()
    if profile:
        profile.is_mentor = True
        profile.mentor_rate = data.rate_type
        
    db.commit()
    db.refresh(new_mentor)
    return new_mentor

@router.put("/api/mentors/{mentor_id}/availability", response_model=MentorResponse)
def update_availability(
    mentor_id: int,
    availability_slots: List[dict],
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.id != mentor_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit availability")
        
    mentor = db.query(Mentor).filter(Mentor.user_id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
        
    mentor.availability_slots = availability_slots
    db.commit()
    db.refresh(mentor)
    return mentor

@router.post("/api/mentorship/request", response_model=MentorshipRequestResponse)
def request_mentorship(
    data: MentorshipRequestCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Check if mentor exists
    mentor = db.query(Mentor).filter(Mentor.user_id == data.mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
        
    # Check duplicate requests
    dup = db.query(MentorshipRequest).filter(
        MentorshipRequest.student_id == current_user.id,
        MentorshipRequest.mentor_id == data.mentor_id,
        MentorshipRequest.status == "pending"
    ).first()
    if dup:
        raise HTTPException(status_code=400, detail="You already have a pending request with this mentor")
        
    new_req = MentorshipRequest(
        student_id=current_user.id,
        mentor_id=data.mentor_id,
        message=data.message,
        goal=data.goal,
        status="pending"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    # Notify mentor via email
    mentor_user = mentor.user
    EmailService.send_email(
        to_email=mentor_user.email,
        subject="New Mentorship Request Received",
        html_content=f"""
        <h3>Mentorship Request from {current_user.full_name}</h3>
        <p><b>Goal Statement:</b> {data.goal}</p>
        <p><b>Message:</b> {data.message}</p>
        <p>Please log in to your IIST Connect portal to Accept or Decline this request.</p>
        """
    )
    return new_req

@router.get("/api/mentorship/requests", response_model=List[MentorshipRequestResponse])
def get_mentorship_requests(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "student":
        return db.query(MentorshipRequest).filter(MentorshipRequest.student_id == current_user.id).all()
    elif current_user.role == "alumni":
        return db.query(MentorshipRequest).filter(MentorshipRequest.mentor_id == current_user.id).all()
    else:
        return db.query(MentorshipRequest).all()

@router.put("/api/mentorship/requests/{request_id}/accept")
def accept_request(
    request_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    req = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == request_id, 
        MentorshipRequest.mentor_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or not assigned to you")
        
    req.status = "accepted"
    db.commit()
    
    # Email student
    student_user = req.student
    EmailService.send_email(
        to_email=student_user.email,
        subject="Mentorship Request Accepted!",
        html_content=f"""
        <h3>Congratulations!</h3>
        <p>Alumni Mentor {current_user.full_name} has accepted your mentorship request.</p>
        <p>Go to your 'My Mentors' dashboard to schedule your initial session.</p>
        """
    )
    return {"message": "Request accepted successfully"}

@router.put("/api/mentorship/requests/{request_id}/decline")
def decline_request(
    request_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    req = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == request_id, 
        MentorshipRequest.mentor_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or not assigned to you")
        
    req.status = "declined"
    db.commit()
    return {"message": "Request declined"}

@router.get("/api/mentorship/sessions", response_model=List[MentorshipSessionResponse])
def get_sessions(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "student":
        return db.query(MentorshipSession).filter(MentorshipSession.mentee_id == current_user.id).all()
    else:
        return db.query(MentorshipSession).filter(MentorshipSession.mentor_id == current_user.id).all()

@router.post("/api/mentorship/sessions/{session_id}/notes")
def post_session_notes(
    session_id: int,
    notes: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Only mentors can post session summary notes
    session = db.query(MentorshipSession).filter(
        MentorshipSession.id == session_id,
        MentorshipSession.mentor_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or not hosted by you")
        
    session.notes = notes
    db.commit()
    return {"message": "Notes added successfully"}

@router.post("/api/mentorship/sessions/{session_id}/review")
def review_session(
    session_id: int,
    feedback: SessionFeedback,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    session = db.query(MentorshipSession).filter(MentorshipSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if current_user.id == session.mentee_id:
        session.mentee_rating = feedback.rating
        session.review_text = feedback.review_text
        session.status = "completed"
        
        # Recalculate Mentor aggregate ratings
        mentor = db.query(Mentor).filter(Mentor.user_id == session.mentor_id).first()
        if mentor:
            mentor.session_count += 1
            mentor.total_reviews += 1
            # Simple avg rating update
            mentor.avg_rating = round(((mentor.avg_rating * (mentor.total_reviews - 1)) + feedback.rating) / mentor.total_reviews, 1)
            
            # Award gamification points to Mentor (+50 completed session, +10 rating bonus if rating >= 4)
            score = db.query(ContributionScore).filter(ContributionScore.user_id == session.mentor_id).first()
            if score:
                score.total_points += 50
                score.breakdown["mentoring"] = score.breakdown.get("mentoring", 0) + 50
                if feedback.rating >= 4:
                    score.total_points += 10
                    score.breakdown["reviews"] = score.breakdown.get("reviews", 0) + 10
                    
            # Award gamification points to Student (+15 review completed)
            student_score = db.query(ContributionScore).filter(ContributionScore.user_id == current_user.id).first()
            if student_score:
                student_score.total_points += 15
                
    elif current_user.id == session.mentor_id:
        session.mentor_rating = feedback.rating
        session.notes = feedback.notes or session.notes
        
    db.commit()
    return {"message": "Review submitted successfully"}

@router.get("/api/mentorship/my-mentors", response_model=List[MentorResponse])
def get_my_mentors(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Fetch all mentors that have accepted requests or completed sessions with student
    mentor_ids = db.query(MentorshipRequest.mentor_id).filter(
        MentorshipRequest.student_id == current_user.id,
        MentorshipRequest.status == "accepted"
    ).subquery()
    return db.query(Mentor).filter(Mentor.user_id.in_(mentor_ids)).all()

@router.get("/api/mentorship/my-mentees", response_model=List[UserResponse])
def get_my_mentees(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    student_ids = db.query(MentorshipRequest.student_id).filter(
        MentorshipRequest.mentor_id == current_user.id,
        MentorshipRequest.status == "accepted"
    ).subquery()
    return db.query(User).filter(User.id.in_(student_ids)).all()

@router.post("/api/mentorship/sessions/{request_id}/schedule", response_model=MentorshipSessionResponse)
def schedule_session(
    request_id: int,
    scheduled_at: datetime,
    duration_mins: int = 30,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    req = db.query(MentorshipRequest).filter(
        MentorshipRequest.id == request_id,
        MentorshipRequest.status == "accepted"
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Accepted request not found")
        
    # Generate Google Meet link and simulate invites
    invitees = [req.student.email, req.mentor.user.email]
    meet_link = CalendarService.create_calendar_event(
        attendee_emails=invitees,
        event_title="IIST Connect: Mentorship Session",
        scheduled_at=scheduled_at,
        duration_mins=duration_mins
    )
    
    new_session = MentorshipSession(
        mentor_id=req.mentor_id,
        mentee_id=req.student_id,
        scheduled_at=scheduled_at,
        duration_mins=duration_mins,
        meet_link=meet_link,
        status="scheduled"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session
