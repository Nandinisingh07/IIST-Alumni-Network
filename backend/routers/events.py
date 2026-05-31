from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, Event, EventRSVP, EventFeedback, ContributionScore
from schemas.schemas import EventCreate, EventResponse, EventFeedbackCreate, UserResponse
from routers.auth import get_current_verified_user
from services.services import CalendarService, EmailService, AIService
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/events", tags=["Events & Webinars"])

@router.get("", response_model=List[EventResponse])
def get_events(
    type: Optional[str] = None,
    upcoming: Optional[bool] = None,
    past: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if type:
        query = query.filter(Event.type == type)
        
    now = datetime.utcnow()
    if upcoming:
        query = query.filter(Event.scheduled_at > now)
    elif past:
        query = query.filter(Event.scheduled_at < now)
        
    events = query.all()
    
    result = []
    for e in events:
        host = db.query(User).filter(User.id == e.host_id).first()
        count = db.query(EventRSVP).filter(EventRSVP.event_id == e.id).count()
        res = EventResponse.from_orm(e)
        if host:
            res.host = host
        res.attendees_count = count
        result.append(res)
        
    return result

@router.get("/recordings", response_model=List[EventResponse])
def get_recordings(db: Session = Depends(get_db)):
    # Returns completed events that have a recording URL
    events = db.query(Event).filter(Event.recording_url != None, Event.recording_url != "").all()
    result = []
    for e in events:
        host = db.query(User).filter(User.id == e.host_id).first()
        count = db.query(EventRSVP).filter(EventRSVP.event_id == e.id).count()
        res = EventResponse.from_orm(e)
        if host:
            res.host = host
        res.attendees_count = count
        result.append(res)
    return result

@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    host = db.query(User).filter(User.id == event.host_id).first()
    count = db.query(EventRSVP).filter(EventRSVP.event_id == event_id).count()
    res = EventResponse.from_orm(event)
    if host:
        res.host = host
    res.attendees_count = count
    return res

@router.post("", response_model=EventResponse)
def create_event(
    data: EventCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "alumni" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only alumni or admins can host events")
        
    # Generate Google Meet link automatically
    meet_link = CalendarService.generate_meet_link()
    
    new_event = Event(
        title=data.title,
        description=data.description,
        host_id=current_user.id,
        type=data.type,
        scheduled_at=data.scheduled_at,
        duration_mins=data.duration_mins,
        meet_link=meet_link,
        thumbnail_url=data.thumbnail_url,
        max_attendees=data.max_attendees,
        tags=data.tags,
        status="upcoming"
    )
    db.add(new_event)
    
    # Award gamification points (+40 points for hosting event)
    score = db.query(ContributionScore).filter(ContributionScore.user_id == current_user.id).first()
    if score:
        score.total_points += 40
        score.breakdown["events"] = score.breakdown.get("events", 0) + 40
        
    db.commit()
    db.refresh(new_event)
    
    # Return response
    res = EventResponse.from_orm(new_event)
    res.host = current_user
    res.attendees_count = 0
    return res

@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    data: EventCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this event")
        
    event.title = data.title
    event.description = data.description
    event.type = data.type
    event.scheduled_at = data.scheduled_at
    event.duration_mins = data.duration_mins
    event.thumbnail_url = data.thumbnail_url
    event.max_attendees = data.max_attendees
    event.tags = data.tags
    
    db.commit()
    db.refresh(event)
    
    host = db.query(User).filter(User.id == event.host_id).first()
    count = db.query(EventRSVP).filter(EventRSVP.event_id == event_id).count()
    res = EventResponse.from_orm(event)
    if host:
        res.host = host
    res.attendees_count = count
    return res

@router.post("/{event_id}/rsvp")
def rsvp_event(
    event_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Check max attendees capacity
    count = db.query(EventRSVP).filter(EventRSVP.event_id == event_id).count()
    if count >= event.max_attendees:
        raise HTTPException(status_code=400, detail="Event RSVP has reached maximum capacity limit")
        
    existing = db.query(EventRSVP).filter(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id).first()
    if existing:
        return {"message": "Already RSVPed"}
        
    rsvp = EventRSVP(event_id=event_id, user_id=current_user.id)
    db.add(rsvp)
    db.commit()
    
    # Schedule Google Calendar simulated invite
    CalendarService.create_calendar_event(
        attendee_emails=[current_user.email],
        event_title=f"IIST Connect RSVP: {event.title}",
        scheduled_at=event.scheduled_at,
        duration_mins=event.duration_mins
    )
    return {"message": "RSVP recorded successfully. Calendar invite sent."}

@router.delete("/{event_id}/rsvp")
def cancel_rsvp(
    event_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    rsvp = db.query(EventRSVP).filter(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id).first()
    if not rsvp:
        raise HTTPException(status_code=400, detail="No RSVP record found to cancel")
        
    db.delete(rsvp)
    db.commit()
    return {"message": "RSVP cancelled"}

@router.get("/{event_id}/attendees", response_model=List[UserResponse])
def get_attendees(event_id: int, db: Session = Depends(get_db)):
    attendees = db.query(User).join(EventRSVP, EventRSVP.user_id == User.id).filter(EventRSVP.event_id == event_id).all()
    return attendees

@router.post("/{event_id}/feedback")
def post_feedback(
    event_id: int,
    data: EventFeedbackCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Verify RSVP exists
    rsvp = db.query(EventRSVP).filter(EventRSVP.event_id == event_id, EventRSVP.user_id == current_user.id).first()
    if not rsvp:
        raise HTTPException(status_code=400, detail="You must RSVP and attend the event to leave feedback")
        
    existing = db.query(EventFeedback).filter(EventFeedback.event_id == event_id, EventFeedback.user_id == current_user.id).first()
    if existing:
        existing.rating = data.rating
        existing.comment = data.comment
    else:
        new_f = EventFeedback(
            event_id=event_id,
            user_id=current_user.id,
            rating=data.rating,
            comment=data.comment
        )
        db.add(new_f)
        
    db.commit()
    return {"message": "Feedback submitted successfully"}

@router.post("/{event_id}/summarize")
def summarize_event(
    event_id: int,
    transcript: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Post event AI summary (LangChain simulation summarizing event content)
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if event.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only host/admin can generate AI summary")
        
    prompt = f"""
    Please write a comprehensive structured summary of the following webinar/event transcript.
    Event Title: {event.title}
    
    Transcript Excerpt:
    {transcript[:3000]}

    Create the summary using these markdown sections:
    - EXECUTIVE SUMMARY
    - KEY INSIGHTS / TAKEAWAYS
    - TIPS FOR STUDENTS
    - Q&A TRANSCRIPT HIGHLIGHTS
    """
    summary = AIService.generate_content(prompt)
    event.recording_url = "http://localhost:8000/static/uploads/mock_recording.mp4" # Mock video path
    event.description = f"{event.description or ''}\n\n### AI-Generated Event Summary\n{summary}"
    event.status = "completed"
    
    db.commit()
    return {"message": "AI summary and recording published", "summary": summary}
