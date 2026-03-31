import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.genai as genai
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

# -------- Database Setup (SQLite) --------
SQLALCHEMY_DATABASE_URL = "sqlite:///./career_ai.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------- Database Tables --------
class AlumniDB(Base):
    __tablename__ = "alumni"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    company = Column(String)
    role = Column(String)
    skills = Column(String)
    batch = Column(Integer)
    bio = Column(Text, nullable=True)  # <--- MAKE SURE THIS IS HERE
    mentor_available = Column(Boolean, default=True)
class JobDB(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    company = Column(String)
    description = Column(Text)
    link = Column(String)

# Create the database and tables
Base.metadata.create_all(bind=engine)

# -------- FastAPI App --------
app = FastAPI(title="IIST CareerAI Backend")

# Allow Lovable/Frontend to communicate
# main.py

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173", # Standard Vite port
    ],
    allow_credentials=True,
    allow_methods=["*"], # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],
)

# -------- Gemini Client --------
# REPLACE WITH YOUR KEY OR SET AS ENVIRONMENT VARIABLE
GEMINI_API_KEY = "Your_Gemini_API_Key_Here" 
client = genai.Client(api_key="your_gemini_api_key_here")

# -------- Pydantic Schemas --------
class ChatRequest(BaseModel):
    message: str

class RoadmapRequest(BaseModel):
    role: str

from typing import Optional

class AlumniCreate(BaseModel):
    name: str
    company: str
    role: str
    skills: str
    batch: int
    bio: Optional[str] = "IIST Alumni" # Added default
    mentor_available: Optional[bool] = True # Added default

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    link: str

# -------- API Endpoints --------

@app.get("/")
def home():
    return {"message": "Alumni AI API running 🚀", "status": "online"}

# 1. AI Chatbot
@app.post("/chat")
def chat(request: ChatRequest):
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"You are the IIST Career Assistant. Provide helpful career advice for: {request.message}"
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. AI Career Roadmap
@app.post("/career-roadmap")
def career_roadmap(request: RoadmapRequest):
    try:
        prompt = f"Act as a career coach. Generate a 5-step technical roadmap for a student wanting to become a {request.role}. Keep it concise."
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        # Split by lines and clean up empty strings
        steps = [s.strip() for s in response.text.split("\n") if s.strip()]
        return {"roadmap": steps[:10]} # Returns up to 10 lines of the generated text
    except Exception as e:
        return {"roadmap": ["Unable to generate roadmap at this time."]}

# 3. Resume Analysis (Requires python-multipart)
@app.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        # Basic text extraction for demo (works best with .txt or simple .doc)
        text_content = content.decode('utf-8', errors='ignore')
        
        prompt = f"Analyze this resume content. List 3 key strengths and 3 improvements for an AIML role: {text_content[:2000]}"
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error analyzing file. Ensure it's a readable text format.")

# 4. Alumni Directory
@app.post("/alumni")
def add_alumni(alumni: AlumniCreate):
    db = SessionLocal()
    try:
        new_alumni = AlumniDB(**alumni.dict())
        db.add(new_alumni)
        db.commit()
        db.refresh(new_alumni)
        return {"message": "Alumni registered successfully", "data": new_alumni}
    finally:
        db.close()

@app.get("/alumni")
def get_alumni():
    db = SessionLocal()
    alumni = db.query(AlumniDB).all()
    # Convert the skill string into a list for the frontend
    result = []
    for a in alumni:
        result.append({
            "id": a.id,
            "name": a.name,
            "company": a.company,
            "role": a.role,
            "batch": a.batch,
            "skills": a.skills.split(",") if isinstance(a.skills, str) else [],
            "bio": a.bio
        })
    db.close()
    return result

# 5. Mentor Matching (Fixed Parameter for Frontend)
@app.get("/mentor-match")
def mentor_match(skill: str = Query(..., description="Skill to search for")):
    db = SessionLocal()
    try:
        # Search across multiple fields for better matching
        matches = db.query(AlumniDB).filter(
            (AlumniDB.skills.ilike(f"%{skill}%")) | 
            (AlumniDB.role.ilike(f"%{skill}%")) |
            (AlumniDB.company.ilike(f"%{skill}%"))
        ).filter(AlumniDB.mentor_available == True).all()
        return matches
    finally:
        db.close()

# 6. Job Board
@app.post("/jobs")
def post_job(job: JobCreate):
    db = SessionLocal()
    try:
        new_job = JobDB(**job.dict())
        db.add(new_job)
        db.commit()
        return {"message": "Job posted successfully"}
    finally:
        db.close()

@app.get("/jobs")
def get_jobs():
    db = SessionLocal()
    try:
        return db.query(JobDB).all()
    finally:
        db.close()