from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str # student, alumni, admin
    college_id: Optional[str] = None
    graduation_year: Optional[int] = None
    branch: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    full_name: str
    avatar_url: Optional[str] = None
    college_id: Optional[str] = None
    graduation_year: Optional[int] = None
    branch: Optional[str] = None
    is_verified: bool
    is_profile_complete: bool
    created_at: datetime
    last_active: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class VerifyEmail(BaseModel):
    email: EmailStr
    otp: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

# --- ONBOARDING WIZARD ---
class OnboardingWizard(BaseModel):
    bio: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    skills: Optional[List[str]] = []
    domains: Optional[List[str]] = []
    graduation_year: Optional[int] = None
    branch: Optional[str] = None

# --- ALUMNI DIRECTORY ---
class AlumniProfileResponse(BaseModel):
    user_id: int
    bio: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    skills: List[str] = []
    domains: List[str] = []
    is_mentor: bool
    mentor_rate: str
    contribution_score: int
    profile_views: int
    batch_year: Optional[int] = None
    branch: Optional[str] = None
    achievements: List[str] = []
    user: UserResponse

    class Config:
        from_attributes = True

class AlumniProfileUpdate(BaseModel):
    bio: Optional[str] = None
    current_company: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    skills: Optional[List[str]] = None
    domains: Optional[List[str]] = None
    achievements: Optional[List[str]] = None

# --- MENTORS & REQUESTS ---
class MentorRegister(BaseModel):
    domains: List[str]
    bio: str
    availability_slots: List[Dict[str, Any]] # JSON weekly grid
    rate_type: str = "free" # free, paid
    hourly_rate: float = 0.0
    max_mentees: int = 5

class MentorResponse(BaseModel):
    user_id: int
    domains: List[str]
    bio: Optional[str]
    availability_slots: List[Dict[str, Any]]
    rate_type: str
    hourly_rate: float
    max_mentees: int
    session_count: int
    avg_rating: float
    total_reviews: int
    user: UserResponse

    class Config:
        from_attributes = True

class MentorshipRequestCreate(BaseModel):
    mentor_id: int
    message: Optional[str] = None
    goal: Optional[str] = None

class MentorshipRequestResponse(BaseModel):
    id: int
    student_id: int
    mentor_id: int
    message: Optional[str]
    goal: Optional[str]
    status: str
    created_at: datetime
    student: UserResponse
    mentor: MentorResponse

    class Config:
        from_attributes = True

class MentorshipSessionResponse(BaseModel):
    id: int
    mentor_id: int
    mentee_id: int
    scheduled_at: datetime
    duration_mins: int
    meet_link: Optional[str]
    status: str
    notes: Optional[str]
    mentor_rating: Optional[int]
    mentee_rating: Optional[int]
    review_text: Optional[str]
    mentee: UserResponse
    mentor: MentorResponse

    class Config:
        from_attributes = True

class SessionFeedback(BaseModel):
    rating: int # 1 to 5
    review_text: Optional[str] = None
    notes: Optional[str] = None

# --- CAREER ROADMAPS ---
class MilestoneSchema(BaseModel):
    id: str
    title: str
    description: str
    resources: List[str] = []
    estimated_weeks: int
    type: str # learn, build, apply
    order_index: int

class RoadmapCreate(BaseModel):
    title: str
    domain: str
    description: Optional[str] = None
    difficulty: str = "Beginner" # Beginner, Intermediate, Advanced
    milestones: List[MilestoneSchema]
    estimated_months: int = 3
    tags: List[str] = []

class RoadmapResponse(BaseModel):
    id: int
    title: str
    domain: str
    description: Optional[str]
    difficulty: str
    milestones: List[Dict[str, Any]]
    created_by: int
    upvotes: int
    bookmarks_count: int
    estimated_months: int
    tags: List[str]

    class Config:
        from_attributes = True

class RoadmapProgressResponse(BaseModel):
    user_id: int
    roadmap_id: int
    completed_milestones: List[str]
    started_at: datetime
    last_updated: datetime

    class Config:
        from_attributes = True

# --- REAL-TIME CHAT ---
class RoomCreate(BaseModel):
    type: str # dm, group, domain_channel
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    member_ids: List[int] # List of user IDs to include

class MessageCreate(BaseModel):
    content: str
    type: str = "text" # text, image, file, system
    reply_to_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    content: str
    type: str
    reply_to_id: Optional[int]
    is_edited: bool
    created_at: datetime
    sender: UserResponse

    class Config:
        from_attributes = True

class RoomResponse(BaseModel):
    id: int
    type: str
    name: Optional[str]
    avatar_url: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    members: List[UserResponse] = []
    last_message: Optional[MessageResponse] = None

    class Config:
        from_attributes = True

# --- AI CAREER CHATBOT ---
class AIChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class AIChatResponse(BaseModel):
    response: str
    citations: List[Dict[str, Any]] = []

class AIColdOutreachRequest(BaseModel):
    alumni_id: int
    purpose: str # referral, advice, networking
    key_interests: str

class AIRoadmapSuggestRequest(BaseModel):
    target_role: str
    skills_have: List[str]
    time_limit_months: int = 6

# --- REFERRAL BOARD ---
class ReferralPostCreate(BaseModel):
    company: str
    role: str
    jd_url: Optional[str] = None
    type: str = "full-time" # full-time, internship, contract
    location: Optional[str] = None
    experience_required: int = 0
    deadline: Optional[datetime] = None
    slots_available: int = 1

class ReferralPostResponse(BaseModel):
    id: int
    alumni_id: int
    company: str
    role: str
    jd_url: Optional[str]
    type: str
    location: Optional[str]
    experience_required: int
    deadline: Optional[datetime]
    status: str
    slots_available: int
    alumni: UserResponse

    class Config:
        from_attributes = True

class ReferralApplicationCreate(BaseModel):
    resume_url: str
    cover_note: Optional[str] = None

class ReferralApplicationResponse(BaseModel):
    id: int
    post_id: int
    student_id: int
    resume_url: str
    cover_note: Optional[str]
    status: str
    updated_at: datetime
    student: UserResponse
    post: ReferralPostResponse

    class Config:
        from_attributes = True

# --- EVENTS & WEBINARS ---
class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "webinar" # webinar, ama, mock-drive, reunion, workshop
    scheduled_at: datetime
    duration_mins: int = 60
    meet_link: Optional[str] = None
    thumbnail_url: Optional[str] = None
    max_attendees: int = 100
    tags: List[str] = []

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    host_id: int
    type: str
    scheduled_at: datetime
    duration_mins: int
    meet_link: Optional[str]
    recording_url: Optional[str]
    thumbnail_url: Optional[str]
    max_attendees: int
    tags: List[str]
    status: str
    host: UserResponse
    attendees_count: int = 0

    class Config:
        from_attributes = True

class EventFeedbackCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

# --- STORIES ---
class StoryCreate(BaseModel):
    title: str
    content: str # JSON rich text string or plain HTML
    type: str = "journey" # journey, interview-exp, startup, abroad, research
    company: Optional[str] = None
    role: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: List[str] = []

class StoryCommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class StoryCommentResponse(BaseModel):
    id: int
    story_id: int
    author_id: int
    content: str
    parent_id: Optional[int]
    created_at: datetime
    author: UserResponse

    class Config:
        from_attributes = True

class StoryResponse(BaseModel):
    id: int
    author_id: int
    title: str
    content: str
    type: str
    company: Optional[str]
    role: Optional[str]
    cover_image_url: Optional[str]
    tags: List[str]
    read_time_mins: int
    views: int
    likes_count: int
    comments_count: int
    is_featured: bool
    published_at: datetime
    author: UserResponse

    class Config:
        from_attributes = True

# --- MOCK INTERVIEWS ---
class InterviewSlotCreate(BaseModel):
    type: str # technical, hr, case-study, system-design
    domain: str
    scheduled_at: datetime
    duration_mins: int = 45
    price: int = 0 # 0 = free
    slots_total: int = 1

class InterviewSlotResponse(BaseModel):
    id: int
    alumni_id: int
    type: str
    domain: str
    scheduled_at: datetime
    duration_mins: int
    price: int
    slots_total: int
    slots_booked: int
    meet_link: Optional[str]
    status: str
    mentor: UserResponse

    class Config:
        from_attributes = True

class InterviewBookingResponse(BaseModel):
    id: int
    slot_id: int
    student_id: int
    payment_id: Optional[str]
    status: str
    feedback_by_alumni: Optional[Dict[str, Any]]
    feedback_by_student: Optional[Dict[str, Any]]
    rating: Optional[int]
    created_at: datetime
    slot: InterviewSlotResponse
    student: UserResponse

    class Config:
        from_attributes = True

class MockInterviewFeedbackAlumni(BaseModel):
    communication: int # 1 to 5
    technical_depth: int
    problem_solving: int
    confidence: int
    notes: Optional[str] = None

class MockInterviewFeedbackStudent(BaseModel):
    rating: int # 1 to 5
    review: Optional[str] = None

# --- PLACEMENT ANALYTICS ---
class PlacementRecordCreate(BaseModel):
    batch_year: int
    branch: str
    company: str
    role: str
    package_lpa: float
    role_type: str = "on-campus" # on-campus, off-campus, ppo, startup
    domain: str = "SDE"
    location: Optional[str] = None

class PlacementRecordResponse(BaseModel):
    id: int
    user_id: Optional[int]
    batch_year: int
    branch: str
    company: str
    role: str
    package_lpa: float
    role_type: str
    domain: str
    location: Optional[str]

    class Config:
        from_attributes = True

class AnalyticsSummary(BaseModel):
    total_placements: int
    avg_package: float
    highest_package: float
    percent_placed: float
    top_recruiter: str

# --- GAMIFICATION ---
class ContributionScoreResponse(BaseModel):
    user_id: int
    total_points: int
    breakdown: Dict[str, int]

    class Config:
        from_attributes = True

class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    icon_url: Optional[str]
    criteria: Optional[str]

    class Config:
        from_attributes = True

class LeaderboardUser(BaseModel):
    user_id: int
    full_name: str
    avatar_url: Optional[str]
    role: str
    total_points: int
    rank: int

# --- PROJECT COLLABORATION ---
class ProjectCreate(BaseModel):
    type: str # startup-idea, open-source, research, freelance, side-project
    title: str
    description: str
    skills_needed: List[str]
    domain: Optional[str] = None
    commitment_hours_per_week: int = 10
    team_size_needed: int = 2

class ProjectResponse(BaseModel):
    id: int
    posted_by: int
    role_of_poster: str
    type: str
    title: str
    description: str
    skills_needed: List[str]
    domain: Optional[str]
    commitment_hours_per_week: int
    status: str
    team_size_needed: int
    created_at: datetime
    poster: UserResponse

    class Config:
        from_attributes = True

class ProjectInterestCreate(BaseModel):
    note: str
    skills: List[str]

class ProjectInterestResponse(BaseModel):
    user_id: int
    project_id: int
    note: str
    skills: List[str]
    accepted: bool
    user: UserResponse

    class Config:
        from_attributes = True

# --- ADMIN ---
class AdminStats(BaseModel):
    total_users: int
    active_this_month: int
    sessions_booked: int
    stories_published: int
    events_held: int
    referrals_posted: int

class AnnouncementCreate(BaseModel):
    title: str
    body: str
    target_role: str = "all" # all, student, alumni

# --- NOTIFICATIONS ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    body: str
    link: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
