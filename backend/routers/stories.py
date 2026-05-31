from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User, Story, StoryComment, ContributionScore
from schemas.schemas import StoryCreate, StoryResponse, StoryCommentCreate, StoryCommentResponse
from routers.auth import get_current_verified_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/stories", tags=["Alumni Story Wall"])

@router.get("", response_model=List[StoryResponse])
def get_stories(
    domain: Optional[str] = None,
    company: Optional[str] = None,
    type: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    query = db.query(Story)
    if domain:
        query = query.filter(Story.tags.cast(str).ilike(f"%{domain}%"))
    if company:
        query = query.filter(Story.company.ilike(f"%{company}%"))
    if type:
        query = query.filter(Story.type == type)
        
    stories = query.order_by(Story.published_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for s in stories:
        author = db.query(User).filter(User.id == s.author_id).first()
        res = StoryResponse.from_orm(s)
        if author:
            res.author = author
        result.append(res)
    return result

@router.get("/bookmarked", response_model=List[StoryResponse])
def get_bookmarked_stories(
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    # Simply simulate returning featured/bookmarked items for user
    # For simplicity, returning stories with bookmarks_count > 0 in this database
    stories = db.query(Story).filter(Story.bookmarks_count > 0).all()
    result = []
    for s in stories:
        author = db.query(User).filter(User.id == s.author_id).first()
        res = StoryResponse.from_orm(s)
        if author:
            res.author = author
        result.append(res)
    return result

@router.get("/{story_id}", response_model=StoryResponse)
def get_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    story.views += 1
    db.commit()
    db.refresh(story)
    
    author = db.query(User).filter(User.id == story.author_id).first()
    res = StoryResponse.from_orm(story)
    if author:
        res.author = author
    return res

@router.post("", response_model=StoryResponse)
def create_story(
    data: StoryCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "alumni" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only alumni can publish stories")
        
    # Calculate reading time estimate (approx 200 words per minute)
    words = len(data.content.split())
    read_time = max(1, round(words / 200))
    
    new_story = Story(
        author_id=current_user.id,
        title=data.title,
        content=data.content,
        type=data.type,
        company=data.company,
        role=data.role,
        cover_image_url=data.cover_image_url,
        tags=data.tags,
        read_time_mins=read_time,
        published_at=datetime.utcnow()
    )
    db.add(new_story)
    
    # Award gamification points (+30 for publishing story)
    score = db.query(ContributionScore).filter(ContributionScore.user_id == current_user.id).first()
    if score:
        score.total_points += 30
        score.breakdown["stories"] = score.breakdown.get("stories", 0) + 30
        
    db.commit()
    db.refresh(new_story)
    
    res = StoryResponse.from_orm(new_story)
    res.author = current_user
    return res

@router.put("/{story_id}", response_model=StoryResponse)
def update_story(
    story_id: int,
    data: StoryCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    if story.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this story")
        
    words = len(data.content.split())
    read_time = max(1, round(words / 200))
    
    story.title = data.title
    story.content = data.content
    story.type = data.type
    story.company = data.company
    story.role = data.role
    story.cover_image_url = data.cover_image_url
    story.tags = data.tags
    story.read_time_mins = read_time
    
    db.commit()
    db.refresh(story)
    
    author = db.query(User).filter(User.id == story.author_id).first()
    res = StoryResponse.from_orm(story)
    if author:
        res.author = author
    return res

@router.post("/{story_id}/like")
def like_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    story.likes_count += 1
    db.commit()
    return {"message": "Liked successfully", "likes": story.likes_count}

@router.post("/{story_id}/bookmark")
def bookmark_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    # Increment bookmarks count
    # In full system we would write to story_bookmarks table
    story.bookmarks_count = (getattr(story, "bookmarks_count", 0) or 0) + 1
    db.commit()
    return {"message": "Story bookmarked"}

@router.get("/{story_id}/comments", response_model=List[StoryCommentResponse])
def get_comments(story_id: int, db: Session = Depends(get_db)):
    comments = db.query(StoryComment).filter(StoryComment.story_id == story_id).order_by(StoryComment.created_at.asc()).all()
    result = []
    for c in comments:
        author = db.query(User).filter(User.id == c.author_id).first()
        res = StoryCommentResponse.from_orm(c)
        if author:
            res.author = author
        result.append(res)
    return result

@router.post("/{story_id}/comments", response_model=StoryCommentResponse)
def post_comment(
    story_id: int,
    data: StoryCommentCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    new_comment = StoryComment(
        story_id=story_id,
        author_id=current_user.id,
        content=data.content,
        parent_id=data.parent_id
    )
    db.add(new_comment)
    
    # Increment comment count
    story.comments_count += 1
    db.commit()
    db.refresh(new_comment)
    
    res = StoryCommentResponse.from_orm(new_comment)
    res.author = current_user
    return res

@router.delete("/{story_id}/comments/{comment_id}")
def delete_comment(
    story_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    comment = db.query(StoryComment).filter(StoryComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    if comment.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    db.delete(comment)
    
    # Decrement comment count
    story = db.query(Story).filter(Story.id == story_id).first()
    if story and story.comments_count > 0:
        story.comments_count -= 1
        
    db.commit()
    return {"message": "Comment deleted successfully"}
