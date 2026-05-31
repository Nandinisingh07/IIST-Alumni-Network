from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, Mentor, InterviewSlot, InterviewBooking, ContributionScore
from schemas.schemas import InterviewSlotCreate, InterviewSlotResponse, InterviewBookingResponse, MockInterviewFeedbackAlumni, MockInterviewFeedbackStudent
from routers.auth import get_current_verified_user
from services.services import PaymentService, CalendarService, EmailService
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/mock-interviews", tags=["Mock Interview Marketplace"])

@router.get("/slots", response_model=List[InterviewSlotResponse])
def get_slots(
    domain: Optional[str] = None,
    type: Optional[str] = None,
    price_max: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InterviewSlot).filter(InterviewSlot.status == "available")
    if domain:
        query = query.filter(InterviewSlot.domain.ilike(f"%{domain}%"))
    if type:
        query = query.filter(InterviewSlot.type == type)
    if price_max is not None:
        query = query.filter(InterviewSlot.price <= price_max)
        
    slots = query.all()
    
    result = []
    for s in slots:
        mentor = db.query(User).filter(User.id == s.alumni_id).first()
        res = InterviewSlotResponse.from_orm(s)
        if mentor:
            res.mentor = mentor
        result.append(res)
    return result

@router.get("/my-slots", response_model=List[InterviewSlotResponse])
def get_my_slots(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    slots = db.query(InterviewSlot).filter(InterviewSlot.alumni_id == current_user.id).all()
    result = []
    for s in slots:
        res = InterviewSlotResponse.from_orm(s)
        res.mentor = current_user
        result.append(res)
    return result

@router.get("/my-bookings", response_model=List[InterviewBookingResponse])
def get_my_bookings(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(InterviewBooking).filter(InterviewBooking.student_id == current_user.id).all()
    result = []
    for b in bookings:
        slot = b.slot
        mentor = db.query(User).filter(User.id == slot.alumni_id).first()
        
        # Build slot response
        slot_res = InterviewSlotResponse.from_orm(slot)
        if mentor:
            slot_res.mentor = mentor
            
        b_res = InterviewBookingResponse.from_orm(b)
        b_res.slot = slot_res
        b_res.student = current_user
        result.append(b_res)
    return result

@router.post("/offer", response_model=InterviewSlotResponse)
def post_interview_slot(
    data: InterviewSlotCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Check if user is mentor
    mentor = db.query(Mentor).filter(Mentor.user_id == current_user.id).first()
    if not mentor:
        raise HTTPException(status_code=400, detail="Must register as a Mentor first to post slots")
        
    meet_link = CalendarService.generate_meet_link()
    
    new_slot = InterviewSlot(
        alumni_id=current_user.id,
        type=data.type,
        domain=data.domain,
        scheduled_at=data.scheduled_at,
        duration_mins=data.duration_mins,
        price=data.price,
        slots_total=data.slots_total,
        slots_booked=0,
        meet_link=meet_link,
        status="available"
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    
    res = InterviewSlotResponse.from_orm(new_slot)
    res.mentor = current_user
    return res

@router.post("/payment/initiate")
def initiate_payment(price: int):
    # Call payment service order generator
    order = PaymentService.initiate_payment(price)
    return order

@router.post("/payment/verify")
def verify_payment(
    order_id: str,
    payment_id: str,
    signature: str
):
    # Simulator verifies signature
    verified = PaymentService.verify_payment(order_id, payment_id, signature)
    if not verified:
        raise HTTPException(status_code=400, detail="Invalid Razorpay transaction signature")
    return {"status": "success", "payment_id": payment_id}

@router.post("/book/{slot_id}", response_model=InterviewBookingResponse)
def book_interview_slot(
    slot_id: int,
    payment_id: Optional[str] = None,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    slot = db.query(InterviewSlot).filter(InterviewSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
        
    if slot.status != "available":
        raise HTTPException(status_code=400, detail="This slot has already been booked")
        
    # Mark slot as booked
    slot.slots_booked += 1
    if slot.slots_booked >= slot.slots_total:
        slot.status = "booked"
        
    # Create booking
    booking = InterviewBooking(
        slot_id=slot_id,
        student_id=current_user.id,
        payment_id=payment_id,
        status="paid" if payment_id else "booked",
        created_at=datetime.utcnow()
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    # Send confirmation emails
    mentor_user = db.query(User).filter(User.id == slot.alumni_id).first()
    if mentor_user:
        EmailService.send_email(
            to_email=mentor_user.email,
            subject="Mock Interview Session Booked!",
            html_content=f"""
            <h3>Mock Interview Scheduled</h3>
            <p>Dear {mentor_user.full_name},</p>
            <p>Student {current_user.full_name} has booked your slot on {slot.scheduled_at.isoformat()}.</p>
            <p><b>Meeting Link:</b> <a href="{slot.meet_link}">{slot.meet_link}</a></p>
            """
        )
        EmailService.send_email(
            to_email=current_user.email,
            subject="Mock Interview Confirmed",
            html_content=f"""
            <h3>Booking Confirmed</h3>
            <p>Dear {current_user.full_name},</p>
            <p>Your mock interview with {mentor_user.full_name} is scheduled on {slot.scheduled_at.isoformat()}.</p>
            <p><b>Meeting Link:</b> <a href="{slot.meet_link}">{slot.meet_link}</a></p>
            """
        )
        
    mentor = db.query(User).filter(User.id == slot.alumni_id).first()
    slot_res = InterviewSlotResponse.from_orm(slot)
    if mentor:
        slot_res.mentor = mentor
        
    b_res = InterviewBookingResponse.from_orm(booking)
    b_res.slot = slot_res
    b_res.student = current_user
    return b_res

@router.post("/{booking_id}/feedback/alumni")
def post_interview_feedback_alumni(
    booking_id: int,
    data: MockInterviewFeedbackAlumni,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    booking = db.query(InterviewBooking).filter(InterviewBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    slot = booking.slot
    if slot.alumni_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the interviewer can post candidate assessment feedback")
        
    # Save feedback structured JSON
    booking.feedback_by_alumni = data.dict()
    booking.status = "completed"
    
    # Award gamification points (+35 conducted mock interview)
    score = db.query(ContributionScore).filter(ContributionScore.user_id == current_user.id).first()
    if score:
        score.total_points += 35
        score.breakdown["mentoring"] = score.breakdown.get("mentoring", 0) + 35
        
    db.commit()
    return {"message": "Candidate feedback saved successfully"}

@router.post("/{booking_id}/feedback/student")
def post_interview_feedback_student(
    booking_id: int,
    data: MockInterviewFeedbackStudent,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    booking = db.query(InterviewBooking).filter(
        InterviewBooking.id == booking_id,
        InterviewBooking.student_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not owned by you")
        
    booking.feedback_by_student = data.dict()
    booking.rating = data.rating
    db.commit()
    return {"message": "Interviewer feedback saved successfully"}
