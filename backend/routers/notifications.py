from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, Notification
from schemas.schemas import NotificationResponse
from routers.auth import get_current_verified_user
from typing import List, Optional

router = APIRouter(prefix="/api/notifications", tags=["Notification Alerts"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).all()

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    note = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    note.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    unread = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).all()
    for note in unread:
        note.is_read = True
    db.commit()
    return {"message": "All notifications marked as read", "marked_count": len(unread)}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Standard query
    note = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.delete(note)
    db.commit()
    return {"message": "Notification deleted successfully"}
