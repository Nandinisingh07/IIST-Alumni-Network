import os
import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio
from database.db import engine, Base, SessionLocal
from database.models import User, AlumniProfile, Mentor, Roadmap, Story, ReferralPost, Event, PlacementRecord, ContributionScore, Badge, UserBadge, ChatRoom, RoomMember, Message
from services.services import AuthService, StorageService

# Import all routers
from routers import auth, alumni, mentors, roadmaps, chat, ai, referrals, events, stories, interviews, analytics, gamification, projects, admin, notifications

# Initialize Database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI App
app = FastAPI(title="IIST Connect Backend", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://localhost:8080", "http://127.0.0.1:8081", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serves static files (uploads)
static_path = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_path, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Mount Routers
app.include_router(auth.router)
app.include_router(alumni.router)
app.include_router(mentors.router)
app.include_router(roadmaps.router)
app.include_router(chat.router)
app.include_router(ai.router)
app.include_router(referrals.router)
app.include_router(events.router)
app.include_router(stories.router)
app.include_router(interviews.router)
app.include_router(analytics.router)
app.include_router(gamification.router)
app.include_router(projects.router)
app.include_router(admin.router)
app.include_router(notifications.router)

@app.get("/")
def home():
    return {"message": "IIST Alumni AI Platform API is running 🚀", "status": "online"}

# --- SOCKET.IO SERVER SETUP ---
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Socket events
@sio.event
async def connect(sid, environ):
    print(f"[SOCKET] Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[SOCKET] Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    # data: {"room_id": "1"}
    room_id = str(data.get("room_id"))
    await sio.enter_room(sid, room_id)
    print(f"[SOCKET] Client {sid} joined room {room_id}")

@sio.event
async def leave_room(sid, data):
    room_id = str(data.get("room_id"))
    await sio.leave_room(sid, room_id)
    print(f"[SOCKET] Client {sid} left room {room_id}")

@sio.event
async def send_message(sid, data):
    # data: {"room_id": 1, "sender_id": 1, "content": "text", "type": "text"}
    room_id = data.get("room_id")
    sender_id = data.get("sender_id")
    content = data.get("content")
    msg_type = data.get("type", "text")
    
    # Save to database
    db = SessionLocal()
    try:
        new_msg = Message(
            room_id=room_id,
            sender_id=sender_id,
            content=content,
            type=msg_type
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        
        # Query sender user object
        sender = db.query(User).filter(User.id == sender_id).first()
        
        # Broadcast message to room
        payload = {
            "id": new_msg.id,
            "room_id": room_id,
            "sender_id": sender_id,
            "content": content,
            "type": msg_type,
            "is_edited": False,
            "created_at": new_msg.created_at.isoformat(),
            "sender": {
                "id": sender.id,
                "email": sender.email,
                "full_name": sender.full_name,
                "avatar_url": sender.avatar_url,
                "role": sender.role
            } if sender else None
        }
        await sio.emit("message", payload, room=str(room_id))
    finally:
        db.close()

@sio.event
async def typing_start(sid, data):
    # data: {"room_id": 1, "user_name": "Sarah"}
    room_id = str(data.get("room_id"))
    await sio.emit("typing_start", data, room=room_id, skip_sid=sid)

@sio.event
async def typing_stop(sid, data):
    room_id = str(data.get("room_id"))
    await sio.emit("typing_stop", data, room=room_id, skip_sid=sid)

# Wrap FastAPI with Socket.io ASGI app
asgi_app = socketio.ASGIApp(sio, app)

# Startup DB Seed Data Hook
@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        # Check if users are seeded
        if db.query(User).count() == 0:
            print("[SEED] Seeding default database records...")
            
            # 1. Add Default Admin
            admin_pwd = AuthService.hash_password("admin123")
            admin_user = User(
                email="admin@indoreinstitute.com",
                password_hash=admin_pwd,
                role="admin",
                full_name="IIST Admin User",
                is_verified=True,
                is_profile_complete=True
            )
            db.add(admin_user)
            
            # 2. Add Alumni Mentors
            sarah_pwd = AuthService.hash_password("sarah123")
            sarah = User(
                email="sarah.chen@indoreinstitute.com",
                password_hash=sarah_pwd,
                role="alumni",
                full_name="Sarah Chen",
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                college_id="IIST-AL-2018-09",
                graduation_year=2018,
                branch="Computer Science",
                is_verified=True,
                is_profile_complete=True
            )
            db.add(sarah)
            
            nandini_pwd = AuthService.hash_password("nandini123")
            nandini = User(
                email="nandini.singh@indoreinstitute.com",
                password_hash=nandini_pwd,
                role="alumni",
                full_name="Nandini Singh",
                avatar_url="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
                college_id="IIST-AL-2021-45",
                graduation_year=2021,
                branch="Information Technology",
                is_verified=True,
                is_profile_complete=True
            )
            db.add(nandini)
            
            # 3. Add Student
            student_pwd = AuthService.hash_password("student123")
            student = User(
                email="student@iist.in",
                password_hash=student_pwd,
                role="student",
                full_name="Rahul Sharma",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                college_id="IIST-ST-2023-102",
                graduation_year=2025,
                branch="Computer Science",
                is_verified=True,
                is_profile_complete=True
            )
            db.add(student)
            
            db.commit()
            
            # Initialize Alumni Profiles
            profile_sarah = AlumniProfile(
                user_id=sarah.id,
                bio="Senior ML Engineer at Google DeepMind. Specializes in LLMs, TensorFlow, and Python R&D. Helping students navigate tech paths.",
                current_company="Google DeepMind",
                current_role="Senior ML Engineer",
                location="Bengaluru, Karnataka",
                linkedin_url="https://linkedin.com/in/sarahchen",
                github_url="https://github.com/sarahchen",
                skills=["Machine Learning", "Python", "TensorFlow", "Deep Learning"],
                domains=["AI/ML", "Data Science", "Research"],
                is_mentor=True,
                mentor_rate="free",
                contribution_score=150,
                profile_views=84,
                batch_year=2018,
                branch="Computer Science"
            )
            db.add(profile_sarah)
            
            profile_nandini = AlumniProfile(
                user_id=nandini.id,
                bio="AI Engineer at Google Cloud. Expert in Python, FastAPI web architectures, React dashboard interfaces, and RAG models.",
                current_company="Google",
                current_role="AI Engineer",
                location="Hyderabad, Telangana",
                linkedin_url="https://linkedin.com/in/nandinisingh",
                github_url="https://github.com/nandinisingh",
                skills=["FastAPI", "React", "Python", "SQL", "Tailwind CSS"],
                domains=["Web Development", "AI/ML", "Database Design"],
                is_mentor=True,
                mentor_rate="paid",
                contribution_score=240,
                profile_views=128,
                batch_year=2021,
                branch="Information Technology"
            )
            db.add(profile_nandini)
            
            # Initialize Mentor Models
            mentor_sarah = Mentor(
                user_id=sarah.id,
                domains=["AI/ML", "Data Science"],
                bio="Ready to mentor final year B.Tech students on projects and career path guides.",
                availability_slots=[
                    {"day": "Monday", "time": "18:00 - 19:00"},
                    {"day": "Wednesday", "time": "18:00 - 19:00"},
                    {"day": "Saturday", "time": "10:00 - 12:00"}
                ],
                rate_type="free",
                hourly_rate=0.0,
                session_count=5,
                avg_rating=4.8,
                total_reviews=5
            )
            db.add(mentor_sarah)
            
            mentor_nandini = Mentor(
                user_id=nandini.id,
                domains=["Web Development", "Software Engineering"],
                bio="Focused on mock interviews and backend web architectures.",
                availability_slots=[
                    {"day": "Tuesday", "time": "19:00 - 20:00"},
                    {"day": "Thursday", "time": "19:00 - 20:00"},
                    {"day": "Sunday", "time": "14:00 - 16:00"}
                ],
                rate_type="paid",
                hourly_rate=500.0,
                session_count=8,
                avg_rating=4.9,
                total_reviews=8
            )
            db.add(mentor_nandini)
            
            # Contribution Scores
            score_admin = ContributionScore(user_id=admin_user.id, total_points=0, breakdown={})
            score_sarah = ContributionScore(user_id=sarah.id, total_points=150, breakdown={"mentoring": 100, "stories": 50})
            score_nandini = ContributionScore(user_id=nandini.id, total_points=240, breakdown={"mentoring": 150, "referrals": 90})
            score_student = ContributionScore(user_id=student.id, total_points=15, breakdown={"reviews": 15})
            db.add(score_admin)
            db.add(score_sarah)
            db.add(score_nandini)
            db.add(score_student)
            
            # 4. Placement Records
            placements = [
                PlacementRecord(batch_year=2023, branch="Computer Science", company="Google", role="Software Engineer", package_lpa=32.0, role_type="off-campus", domain="SDE", location="Bengaluru"),
                PlacementRecord(batch_year=2023, branch="Computer Science", company="Amazon", role="SDE Intern", package_lpa=18.0, role_type="ppo", domain="SDE", location="Hyderabad"),
                PlacementRecord(batch_year=2023, branch="Information Technology", company="TCS", role="Systems Engineer", package_lpa=7.5, role_type="on-campus", domain="SDE", location="Pune"),
                PlacementRecord(batch_year=2024, branch="Computer Science", company="Microsoft", role="Software Engineer", package_lpa=44.0, role_type="on-campus", domain="SDE", location="Bengaluru"),
                PlacementRecord(batch_year=2024, branch="Information Technology", company="Razorpay", role="Software Engineer", package_lpa=22.0, role_type="on-campus", domain="SDE", location="Bengaluru"),
                PlacementRecord(batch_year=2024, branch="Electronics & Comm", company="Infosys", role="Systems Engineer", package_lpa=3.6, role_type="on-campus", domain="Core", location="Indore")
            ]
            for p in placements:
                db.add(p)
                
            # 5. Roadmaps
            roadmaps_seed = [
                Roadmap(
                    title="Frontend Developer Blueprint",
                    domain="Web Development",
                    description="Detailed timeline roadmap to master modern frontend architectures including React, state management, and visual optimization.",
                    difficulty="Beginner",
                    estimated_months=4,
                    tags=["React", "TypeScript", "Tailwind CSS"],
                    created_by=admin_user.id,
                    upvotes=28,
                    bookmarks_count=15,
                    milestones=[
                        {"id": "m1", "title": "Web Fundamentals", "description": "Master HTML5, CSS3 layout engines (Flexbox, Grid), and modern vanilla JavaScript ES6 features.", "resources": ["MDN Web Docs", "JavaScriptInfo"], "estimated_weeks": 2, "type": "learn", "order_index": 1},
                        {"id": "m2", "title": "React Architecture", "description": "Learn components nesting, virtual DOM, props vs state, and routing using React Router v6.", "resources": ["React Docs", "Scrimba React Course"], "estimated_weeks": 3, "type": "learn", "order_index": 2},
                        {"id": "m3", "title": "Tailwind & UI kits", "description": "Integrate utility-first Tailwind classes and shadcn modular dialog elements.", "resources": ["Tailwind Docs", "shadcn UI Docs"], "estimated_weeks": 2, "type": "build", "order_index": 3},
                        {"id": "m4", "title": "State & Fetching", "description": "Configure server-state syncing using Tanstack React Query and client hooks using Zustand.", "resources": ["React Query Guide", "Zustand Repo"], "estimated_weeks": 3, "type": "build", "order_index": 4},
                        {"id": "m5", "title": "Capston Project build", "description": "Deploy a complete responsive dashboard interface with analytics charts to Vercel.", "resources": ["Vercel Deployment Guide"], "estimated_weeks": 2, "type": "apply", "order_index": 5}
                    ]
                ),
                Roadmap(
                    title="Machine Learning Engineer Roadmap",
                    domain="AI/ML",
                    description="Advanced roadmap covering statistical mathematics, model training frameworks, and LLMs prompt pipelines.",
                    difficulty="Advanced",
                    estimated_months=6,
                    tags=["Python", "PyTorch", "NLP", "LLMs"],
                    created_by=sarah.id,
                    upvotes=48,
                    bookmarks_count=32,
                    milestones=[
                        {"id": "ml1", "title": "Python & Data Science Stack", "description": "Master NumPy arrays, Pandas DataFrames, and Matplotlib visualizations.", "resources": ["Kaggle Learn Pandas", "RealPython Guide"], "estimated_weeks": 2, "type": "learn", "order_index": 1},
                        {"id": "ml2", "title": "Traditional ML algorithms", "description": "Implement linear regression, classification forests, and K-means clustering using Scikit-Learn.", "resources": ["StatQuest ML Playlist", "Hands-On ML book"], "estimated_weeks": 4, "type": "learn", "order_index": 2},
                        {"id": "ml3", "title": "Deep Neural Networks", "description": "Understand multi-layer perceptrons, backpropagation, and training loops using PyTorch.", "resources": ["DeepLearning.AI courses", "PyTorch Tutorials"], "estimated_weeks": 4, "type": "build", "order_index": 3},
                        {"id": "ml4", "title": "Transformer architectures & NLP", "description": "Learn self-attention mechanisms and fine-tune models from HuggingFace.", "resources": ["HuggingFace NLP course", "Jay Alammar's Illustrated Transformer"], "estimated_weeks": 4, "type": "build", "order_index": 4},
                        {"id": "ml5", "title": "RAG Models & Vector DBs", "description": "Build an AI chatbot pipeline with vector search similarity index (ChromaDB/LangChain).", "resources": ["LangChain Docs", "Pinecone Learn hub"], "estimated_weeks": 3, "type": "apply", "order_index": 5}
                    ]
                )
            ]
            for r in roadmaps_seed:
                db.add(r)
                
            # 6. Stories
            stories_seed = [
                Story(
                    author_id=sarah.id,
                    title="My Career Journey: From B.Tech to Google DeepMind",
                    content="It was in IIST that I discovered my passion for artificial intelligence. I started with python scripts and kaggle notebooks. In this blog, I summarize how taking linear algebra courses and building deep learning pipelines during my final year helped me land a SDE role at Google Cloud, eventually transitioning into Google DeepMind...",
                    type="journey",
                    company="Google DeepMind",
                    role="Senior ML Engineer",
                    cover_image_url="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500",
                    tags=["Google", "ML Engineer", "Career Journey"],
                    read_time_mins=6,
                    views=142,
                    likes_count=52,
                    comments_count=2,
                    is_featured=True,
                    published_at=datetime.datetime.utcnow() - datetime.timedelta(days=5)
                )
            ]
            for s in stories_seed:
                db.add(s)
                
            # 7. Job Referrals
            jobs_seed = [
                ReferralPost(
                    alumni_id=nandini.id,
                    company="Google",
                    role="Associate AI Engineer",
                    jd_url="https://careers.google.com/jobs/results",
                    type="full-time",
                    location="Hyderabad",
                    experience_required=1,
                    deadline=datetime.datetime.utcnow() + datetime.timedelta(days=15),
                    status="open",
                    slots_available=4
                )
            ]
            for j in jobs_seed:
                db.add(j)

            # 8. Events Webinars
            events_seed = [
                Event(
                    title="Cracking Big Tech Interviews in 2026",
                    description="Join Sarah Chen for an exclusive AMA webinar on mastering coding interviews, system design round patterns, and behavioral portfolio preparation.",
                    host_id=sarah.id,
                    type="ama",
                    scheduled_at=datetime.datetime.utcnow() + datetime.timedelta(days=2),
                    duration_mins=60,
                    meet_link="https://meet.google.com/abc-defg-hij",
                    thumbnail_url="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=500",
                    max_attendees=150,
                    tags=["AMA", "Coding", "Interviews", "Webinar"],
                    status="upcoming"
                )
            ]
            for ev in events_seed:
                db.add(ev)
                
            db.commit()
            print("[SEED] Seeding database records completed successfully!")
            
    finally:
        db.close()

# Export raw app as middleware ASGI target
app = asgi_app