from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, AlumniProfile, Story, Roadmap, AIChatSession, AIChatMessage
from schemas.schemas import AIChatRequest, AIChatResponse, AIColdOutreachRequest, AIRoadmapSuggestRequest
from routers.auth import get_current_verified_user
from services.services import AIService
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/ai", tags=["AI Advisor"])

@router.post("/chat", response_model=AIChatResponse)
def ai_chat(
    data: AIChatRequest,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    msg = data.message
    
    # 1. RAG Context Retrieval
    # Split query into words to find database keywords
    words = [w.strip().lower() for w in msg.split() if len(w.strip()) > 3]
    
    alumni_context = []
    story_context = []
    roadmap_context = []
    
    if words:
        # Search Alumni
        alumni_queries = []
        for w in words[:3]: # Limit to first 3 keywords
            alumni_queries.append(AlumniProfile.skills.cast(str).ilike(f"%{w}%"))
            alumni_queries.append(AlumniProfile.current_company.ilike(f"%{w}%"))
            alumni_queries.append(AlumniProfile.current_role.ilike(f"%{w}%"))
        
        from sqlalchemy import or_
        matching_alumni = db.query(AlumniProfile).join(User).filter(or_(*alumni_queries)).limit(3).all()
        for ma in matching_alumni:
            alumni_context.append({
                "id": ma.user_id,
                "name": ma.user.full_name,
                "role": ma.current_role or "Alumnus",
                "company": ma.current_company or "Company",
                "skills": ma.skills,
                "bio": ma.bio or "",
                "batch": ma.batch_year or 2024
            })
            
        # Search Stories
        story_queries = []
        for w in words[:3]:
            story_queries.append(Story.title.ilike(f"%{w}%"))
            story_queries.append(Story.content.ilike(f"%{w}%"))
        
        matching_stories = db.query(Story).filter(or_(*story_queries)).limit(2).all()
        for ms in matching_stories:
            story_context.append({
                "id": ms.id,
                "title": ms.title,
                "author_name": ms.author.full_name,
                "role": ms.role or "Engineer",
                "company": ms.company or "Company",
                "content": ms.content
            })
            
        # Search Roadmaps
        roadmap_queries = []
        for w in words[:3]:
            roadmap_queries.append(Roadmap.title.ilike(f"%{w}%"))
            roadmap_queries.append(Roadmap.domain.ilike(f"%{w}%"))
            
        matching_roadmaps = db.query(Roadmap).filter(or_(*roadmap_queries)).limit(2).all()
        for mr in matching_roadmaps:
            roadmap_context.append({
                "id": mr.id,
                "title": mr.title,
                "domain": mr.domain,
                "difficulty": mr.difficulty,
                "months": mr.estimated_months
            })

    # Call AI RAG service
    result = AIService.get_rag_advice(msg, alumni_context, roadmap_context, story_context)
    
    # Save conversation message if session_id is provided
    if data.session_id:
        try:
            sess_id = int(data.session_id)
            # Verify session owned by user
            session = db.query(AIChatSession).filter(AIChatSession.id == sess_id, AIChatSession.user_id == current_user.id).first()
            if session:
                user_msg = AIChatMessage(session_id=sess_id, sender="user", content=msg)
                ai_msg = AIChatMessage(session_id=sess_id, sender="ai", content=result["response"])
                db.add(user_msg)
                db.add(ai_msg)
                db.commit()
        except Exception:
            pass
            
    return result

@router.get("/chat/history")
def get_chat_sessions(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(AIChatSession).filter(AIChatSession.user_id == current_user.id).order_by(AIChatSession.created_at.desc()).all()
    result = []
    for s in sessions:
        # Fetch last message
        last_msg = db.query(AIChatMessage).filter(AIChatMessage.session_id == s.id).order_by(AIChatMessage.created_at.desc()).first()
        result.append({
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at,
            "last_message": last_msg.content if last_msg else "No messages yet"
        })
    return result

@router.post("/chat/history")
def create_chat_session(
    title: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    sess = AIChatSession(user_id=current_user.id, title=title)
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return {"id": sess.id, "title": sess.title, "created_at": sess.created_at}

@router.get("/chat/history/{session_id}")
def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    sess = db.query(AIChatSession).filter(AIChatSession.id == session_id, AIChatSession.user_id == current_user.id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    messages = db.query(AIChatMessage).filter(AIChatMessage.session_id == session_id).order_by(AIChatMessage.created_at.asc()).all()
    return messages

@router.delete("/chat/history/{session_id}")
def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    sess = db.query(AIChatSession).filter(AIChatSession.id == session_id, AIChatSession.user_id == current_user.id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    # Delete child messages
    db.query(AIChatMessage).filter(AIChatMessage.session_id == session_id).delete()
    db.delete(sess)
    db.commit()
    return {"message": "Chat session deleted"}

@router.post("/outreach-helper")
def generate_outreach(
    data: AIColdOutreachRequest,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    alumni = db.query(User).filter(User.id == data.alumni_id).first()
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumnus not found")
        
    # Query details
    profile = alumni.alumni_profile
    role = profile.current_role if profile else "Alumnus"
    company = profile.current_company if profile else "Google"
    
    outreach = AIService.write_cold_outreach(
        alumni_name=alumni.full_name,
        alumni_role=role,
        alumni_company=company,
        user_name=current_user.full_name,
        purpose=data.purpose,
        interests=data.key_interests
    )
    return {"outreach": outreach}

@router.post("/roadmap-suggest")
def suggest_roadmap(
    data: AIRoadmapSuggestRequest,
    current_user: User = Depends(get_current_verified_user)
):
    steps = AIService.generate_ai_roadmap(
        role=data.target_role,
        current_skills=data.skills_have,
        months=data.time_limit_months
    )
    return {"roadmap": steps}

@router.post("/resume-review")
async def review_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_verified_user)
):
    content = await file.read()
    # Decode content
    text_content = content.decode("utf-8", errors="ignore")
    if not text_content.strip():
        # simulator template text if file is empty/binary PDF bytes that couldn't be decoded
        text_content = f"Mock Resume Profile for {current_user.full_name}\nSkills: React, Python, SQL"
        
    review = AIService.review_resume(text_content)
    return review
