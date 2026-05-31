from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, ChatRoom, RoomMember, Message
from schemas.schemas import RoomCreate, RoomResponse, MessageCreate, MessageResponse
from routers.auth import get_current_verified_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/chat", tags=["Real-Time Chat"])

@router.post("/rooms", response_model=RoomResponse)
def create_room(
    data: RoomCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Ensure current user is in members list
    member_ids = list(set(data.member_ids + [current_user.id]))
    
    # Check if DM already exists between two users
    if data.type == "dm" and len(member_ids) == 2:
        # Query rooms of type 'dm' having both users as members
        other_user_id = [uid for uid in member_ids if uid != current_user.id][0]
        # Query matching DMs
        rooms = db.query(ChatRoom).filter(ChatRoom.type == "dm").all()
        for r in rooms:
            m_ids = [m.user_id for m in r.members]
            if current_user.id in m_ids and other_user_id in m_ids:
                # Add members metadata for response
                members = db.query(User).filter(User.id.in_(m_ids)).all()
                res = RoomResponse.from_orm(r)
                res.members = members
                return res

    # Create new room
    new_room = ChatRoom(
        type=data.type,
        name=data.name,
        avatar_url=data.avatar_url,
        created_by=current_user.id
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    # Add room members
    for uid in member_ids:
        # Check user exists
        user = db.query(User).filter(User.id == uid).first()
        if user:
            m = RoomMember(
                room_id=new_room.id,
                user_id=uid,
                is_admin=(uid == current_user.id)
            )
            db.add(m)
            
    db.commit()
    db.refresh(new_room)
    
    # Prepare response
    members = db.query(User).filter(User.id.in_(member_ids)).all()
    res = RoomResponse.from_orm(new_room)
    res.members = members
    return res

@router.get("/rooms", response_model=List[RoomResponse])
def get_user_rooms(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Find all rooms current user is member of
    room_ids = db.query(RoomMember.room_id).filter(RoomMember.user_id == current_user.id).subquery()
    rooms = db.query(ChatRoom).filter(ChatRoom.id.in_(room_ids)).all()
    
    result = []
    for r in rooms:
        # Fetch member user objects
        m_ids = [m.user_id for m in r.members]
        members = db.query(User).filter(User.id.in_(m_ids)).all()
        
        # Fetch last message
        last_msg = db.query(Message).filter(Message.room_id == r.id).order_by(Message.created_at.desc()).first()
        
        room_res = RoomResponse.from_orm(r)
        room_res.members = members
        if last_msg:
            # Attach sender details to last message
            sender = db.query(User).filter(User.id == last_msg.sender_id).first()
            msg_res = MessageResponse.from_orm(last_msg)
            if sender:
                msg_res.sender = sender
            room_res.last_message = msg_res
            
        result.append(room_res)
        
    return result

@router.get("/rooms/{room_id}/messages", response_model=List[MessageResponse])
def get_room_messages(
    room_id: int,
    before: Optional[datetime] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Verify membership
    mem = db.query(RoomMember).filter(RoomMember.room_id == room_id, RoomMember.user_id == current_user.id).first()
    if not mem:
        raise HTTPException(status_code=403, detail="Not a member of this chat room")
        
    query = db.query(Message).filter(Message.room_id == room_id)
    if before:
        query = query.filter(Message.created_at < before)
        
    messages = query.order_by(Message.created_at.desc()).limit(limit).all()
    # Reverse to chronological order
    messages.reverse()
    
    result = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        msg_res = MessageResponse.from_orm(m)
        if sender:
            msg_res.sender = sender
        result.append(msg_res)
        
    return result

@router.post("/rooms/{room_id}/messages", response_model=MessageResponse)
def post_message(
    room_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    mem = db.query(RoomMember).filter(RoomMember.room_id == room_id, RoomMember.user_id == current_user.id).first()
    if not mem:
        raise HTTPException(status_code=403, detail="Not a member of this chat room")
        
    new_msg = Message(
        room_id=room_id,
        sender_id=current_user.id,
        content=data.content,
        type=data.type,
        reply_to_id=data.reply_to_id
    )
    db.add(new_msg)
    
    # Update last read timestamp for sender
    mem.last_read_at = datetime.utcnow()
    
    db.commit()
    db.refresh(new_msg)
    
    res = MessageResponse.from_orm(new_msg)
    res.sender = current_user
    return res
