from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student") # student, alumni, admin
    full_name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    college_id = Column(String, unique=True, index=True, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    branch = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_profile_complete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

    # Relationships
    alumni_profile = relationship("AlumniProfile", back_populates="user", uselist=False)
    mentor = relationship("Mentor", back_populates="user", uselist=False)
    mentorship_requests = relationship("MentorshipRequest", foreign_keys="[MentorshipRequest.student_id]", back_populates="student")
    sessions_as_mentee = relationship("MentorshipSession", foreign_keys="[MentorshipSession.mentee_id]", back_populates="mentee")
    roadmap_progress = relationship("RoadmapProgress", back_populates="user")
    referrals_applied = relationship("ReferralApplication", back_populates="student")
    event_rsvps = relationship("EventRSVP", back_populates="user")
    event_feedbacks = relationship("EventFeedback", back_populates="user")
    stories = relationship("Story", back_populates="author")
    story_comments = relationship("StoryComment", back_populates="author")
    interview_bookings = relationship("InterviewBooking", back_populates="student")
    placement_records = relationship("PlacementRecord", back_populates="user")
    contribution_score = relationship("ContributionScore", back_populates="user", uselist=False)
    badges = relationship("UserBadge", back_populates="user")
    project_posts = relationship("ProjectPost", back_populates="poster")
    notifications = relationship("Notification", back_populates="user")

class AlumniProfile(Base):
    __tablename__ = "alumni_profiles"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    bio = Column(Text, nullable=True)
    current_company = Column(String, nullable=True)
    current_role = Column(String, nullable=True)
    location = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    skills = Column(JSON, default=list) # JSON list of skills
    domains = Column(JSON, default=list) # JSON list of domains
    is_mentor = Column(Boolean, default=False)
    mentor_rate = Column(String, default="free") # free, paid
    contribution_score = Column(Integer, default=0)
    profile_views = Column(Integer, default=0)
    batch_year = Column(Integer, nullable=True)
    branch = Column(String, nullable=True)
    achievements = Column(JSON, default=list)

    user = relationship("User", back_populates="alumni_profile")

class Mentor(Base):
    __tablename__ = "mentors"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    domains = Column(JSON, default=list)
    bio = Column(Text, nullable=True)
    availability_slots = Column(JSON, default=list) # Weekly availability grid
    rate_type = Column(String, default="free")
    hourly_rate = Column(Float, default=0.0)
    max_mentees = Column(Integer, default=5)
    session_count = Column(Integer, default=0)
    avg_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)

    user = relationship("User", back_populates="mentor")
    mentorship_requests = relationship("MentorshipRequest", foreign_keys="[MentorshipRequest.mentor_id]", back_populates="mentor")
    sessions_as_mentor = relationship("MentorshipSession", foreign_keys="[MentorshipSession.mentor_id]", back_populates="mentor")
    interview_slots = relationship("InterviewSlot", back_populates="mentor")

class MentorshipRequest(Base):
    __tablename__ = "mentorship_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("mentors.user_id"), nullable=False)
    message = Column(Text, nullable=True)
    goal = Column(Text, nullable=True)
    status = Column(String, default="pending") # pending, accepted, declined
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id], back_populates="mentorship_requests")
    mentor = relationship("Mentor", foreign_keys=[mentor_id], back_populates="mentorship_requests")

class MentorshipSession(Base):
    __tablename__ = "mentorship_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("mentors.user_id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    duration_mins = Column(Integer, default=30)
    meet_link = Column(String, nullable=True)
    status = Column(String, default="scheduled") # scheduled, completed, cancelled
    notes = Column(Text, nullable=True)
    mentor_rating = Column(Integer, nullable=True)
    mentee_rating = Column(Integer, nullable=True)
    review_text = Column(Text, nullable=True)

    mentor = relationship("Mentor", foreign_keys=[mentor_id], back_populates="sessions_as_mentor")
    mentee = relationship("User", foreign_keys=[mentee_id], back_populates="sessions_as_mentee")

class Roadmap(Base):
    __tablename__ = "roadmaps"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String, default="Beginner") # Beginner, Intermediate, Advanced
    milestones = Column(JSON, default=list) # JSON Milestones array
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    upvotes = Column(Integer, default=0)
    bookmarks_count = Column(Integer, default=0)
    estimated_months = Column(Integer, default=3)
    tags = Column(JSON, default=list)

    progress_records = relationship("RoadmapProgress", back_populates="roadmap")

class RoadmapProgress(Base):
    __tablename__ = "roadmap_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"), nullable=False)
    completed_milestones = Column(JSON, default=list) # list of completed milestone IDs
    started_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="roadmap_progress")
    roadmap = relationship("Roadmap", back_populates="progress_records")

class ChatRoom(Base):
    __tablename__ = "chat_rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, default="dm") # dm, group, domain_channel
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("RoomMember", back_populates="room")
    messages = relationship("Message", back_populates="room")

class RoomMember(Base):
    __tablename__ = "room_members"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_at = Column(DateTime, default=datetime.utcnow)
    is_admin = Column(Boolean, default=False)

    room = relationship("ChatRoom", back_populates="members")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String, default="text") # text, image, file, system
    reply_to_id = Column(Integer, nullable=True)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("ChatRoom", back_populates="messages")

class ReferralPost(Base):
    __tablename__ = "referral_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    alumni_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    jd_url = Column(String, nullable=True)
    type = Column(String, default="full-time") # full-time, internship, contract
    location = Column(String, nullable=True)
    experience_required = Column(Integer, default=0)
    deadline = Column(DateTime, nullable=True)
    status = Column(String, default="open") # open, closed, filled
    slots_available = Column(Integer, default=1)

    applications = relationship("ReferralApplication", back_populates="post")

class ReferralApplication(Base):
    __tablename__ = "referral_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("referral_posts.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_url = Column(String, nullable=False)
    cover_note = Column(String(300), nullable=True)
    status = Column(String, default="pending") # pending, referred, rejected, offer_received
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    post = relationship("ReferralPost", back_populates="applications")
    student = relationship("User", back_populates="referrals_applied")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, default="webinar") # webinar, ama, mock-drive, reunion, workshop
    scheduled_at = Column(DateTime, nullable=False)
    duration_mins = Column(Integer, default=60)
    meet_link = Column(String, nullable=True)
    recording_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    max_attendees = Column(Integer, default=100)
    tags = Column(JSON, default=list)
    status = Column(String, default="upcoming") # upcoming, live, completed

    rsvps = relationship("EventRSVP", back_populates="event")
    feedbacks = relationship("EventFeedback", back_populates="event")

class EventRSVP(Base):
    __tablename__ = "event_rsvps"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rsvp_at = Column(DateTime, default=datetime.utcnow)
    attended = Column(Boolean, default=False)

    event = relationship("Event", back_populates="rsvps")
    user = relationship("User", back_populates="event_rsvps")

class EventFeedback(Base):
    __tablename__ = "event_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, default=5)
    comment = Column(Text, nullable=True)

    event = relationship("Event", back_populates="feedbacks")
    user = relationship("User", back_populates="event_feedbacks")

class Story(Base):
    __tablename__ = "stories"
    
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False) # JSON rich text content as string or raw HTML
    type = Column(String, default="journey") # journey, interview-exp, startup, abroad, research
    company = Column(String, nullable=True)
    role = Column(String, nullable=True)
    cover_image_url = Column(String, nullable=True)
    tags = Column(JSON, default=list)
    read_time_mins = Column(Integer, default=5)
    views = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    published_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="stories")
    comments = relationship("StoryComment", back_populates="story")

class StoryComment(Base):
    __tablename__ = "story_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, nullable=True) # supports 1-level nesting
    created_at = Column(DateTime, default=datetime.utcnow)

    story = relationship("Story", back_populates="comments")
    author = relationship("User", back_populates="story_comments")

class InterviewSlot(Base):
    __tablename__ = "interview_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    alumni_id = Column(Integer, ForeignKey("mentors.user_id"), nullable=False)
    type = Column(String, default="technical") # technical, hr, case-study, system-design
    domain = Column(String, nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    duration_mins = Column(Integer, default=45)
    price = Column(Integer, default=0) # 0 = free
    slots_total = Column(Integer, default=1)
    slots_booked = Column(Integer, default=0)
    meet_link = Column(String, nullable=True)
    status = Column(String, default="available") # available, booked, completed

    mentor = relationship("Mentor", back_populates="interview_slots")
    bookings = relationship("InterviewBooking", back_populates="slot")

class InterviewBooking(Base):
    __tablename__ = "interview_bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("interview_slots.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payment_id = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, paid, completed, review_submitted
    feedback_by_alumni = Column(JSON, nullable=True) # structured assessment scores (1-5) + text notes
    feedback_by_student = Column(JSON, nullable=True) # rating (1-5) + review comments
    rating = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    slot = relationship("InterviewSlot", back_populates="bookings")
    student = relationship("User", back_populates="interview_bookings")

class PlacementRecord(Base):
    __tablename__ = "placement_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    batch_year = Column(Integer, nullable=False)
    branch = Column(String, nullable=False)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    package_lpa = Column(Float, nullable=False)
    role_type = Column(String, default="on-campus") # on-campus, off-campus, ppo, startup
    domain = Column(String, default="SDE") # SDE, Core, Finance, etc.
    location = Column(String, nullable=True)

    user = relationship("User", back_populates="placement_records")

class ContributionScore(Base):
    __tablename__ = "contribution_scores"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    total_points = Column(Integer, default=0)
    breakdown = Column(JSON, default=dict) # JSON breakdown of scoring parameters

    user = relationship("User", back_populates="contribution_score")

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    icon_url = Column(String, nullable=True)
    criteria = Column(String, nullable=True)

    owners = relationship("UserBadge", back_populates="badge")

class UserBadge(Base):
    __tablename__ = "user_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="owners")

class ProjectPost(Base):
    __tablename__ = "project_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_of_poster = Column(String, default="student") # student, alumni
    type = Column(String, default="side-project") # startup-idea, open-source, research, freelance, side-project
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    skills_needed = Column(JSON, default=list)
    domain = Column(String, nullable=True)
    commitment_hours_per_week = Column(Integer, default=10)
    status = Column(String, default="open") # open, in-progress, closed
    team_size_needed = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.utcnow)

    poster = relationship("User", back_populates="project_posts")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False) # chat, referral, mentorship, badge, announcement
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    link = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class Follow(Base):
    __tablename__ = "follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    followed_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIChatSession(Base):
    __tablename__ = "ai_chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("ai_chat_sessions.id"), nullable=False)
    sender = Column(String, nullable=False) # user, ai
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProjectInterest(Base):
    __tablename__ = "project_interests"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("project_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=False)
    skills = Column(JSON, default=list)
    accepted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)