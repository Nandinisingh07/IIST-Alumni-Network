import os
import shutil
import random
import string
import datetime
from datetime import timedelta
from typing import List, Dict, Any, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
import bcrypt as _bcrypt
from fastapi import UploadFile
import google.genai as genai
from dotenv import load_dotenv

# Load environment
load_dotenv()

# --- 1. AUTH SERVICE ---
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_jwt_key_12345")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "super_secret_refresh_key_67890")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        hashed = _bcrypt.hashpw(password.encode(), _bcrypt.gensalt())
        return hashed.decode()

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return _bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
        except Exception:
            return False

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.datetime.utcnow() + expires_delta
        else:
            expire = datetime.datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

    @staticmethod
    def create_refresh_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=ALGORITHM)

    @staticmethod
    def verify_token(token: str, is_refresh: bool = False) -> Optional[dict]:
        try:
            secret = JWT_REFRESH_SECRET if is_refresh else JWT_SECRET
            payload = jwt.decode(token, secret, algorithms=[ALGORITHM])
            # Check type
            expected_type = "refresh" if is_refresh else "access"
            if payload.get("type") != expected_type:
                return None
            return payload
        except JWTError:
            return None


# --- 2. STORAGE SERVICE (Local File System Simulator) ---
class StorageService:
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")

    @classmethod
    def initialize(cls):
        os.makedirs(cls.UPLOAD_DIR, exist_ok=True)

    @classmethod
    async def upload_file(cls, file: UploadFile) -> str:
        cls.initialize()
        # Clean file name
        ext = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid_generator()}{ext}"
        filepath = os.path.join(cls.UPLOAD_DIR, unique_name)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return local file URL path (FastAPI will serve /static)
        return f"http://localhost:8000/static/uploads/{unique_name}"


# --- 3. EMAIL SERVICE (SendGrid Simulator) ---
class EmailService:
    LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs", "emails.log")

    @classmethod
    def initialize(cls):
        os.makedirs(os.path.dirname(cls.LOG_FILE), exist_ok=True)

    @classmethod
    def send_email(cls, to_email: str, subject: str, html_content: str):
        cls.initialize()
        timestamp = datetime.datetime.utcnow().isoformat()
        log_entry = f"[{timestamp}] TO: {to_email} | SUBJECT: {subject}\nCONTENT:\n{html_content}\n{'-'*50}\n"
        
        with open(cls.LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_entry)
        
        print(f"\n[EMAIL SIMULATOR] Sent email to {to_email} with subject: '{subject}' (Logged to {cls.LOG_FILE})")


# --- 4. CALENDAR SERVICE (Google Calendar Simulator) ---
class CalendarService:
    @staticmethod
    def generate_meet_link() -> str:
        # Generates a random standard Google Meet URL: g.co/meet/abc-defg-hij
        part1 = "".join(random.choices(string.ascii_lowercase, k=3))
        part2 = "".join(random.choices(string.ascii_lowercase, k=4))
        part3 = "".join(random.choices(string.ascii_lowercase, k=3))
        return f"https://meet.google.com/{part1}-{part2}-{part3}"

    @staticmethod
    def create_calendar_event(attendee_emails: List[str], event_title: str, scheduled_at: datetime.datetime, duration_mins: int) -> str:
        meet_link = CalendarService.generate_meet_link()
        end_time = scheduled_at + timedelta(minutes=duration_mins)
        # Send mock emails to invitees
        for email in attendee_emails:
            EmailService.send_email(
                to_email=email,
                subject=f"Invitation: {event_title} on Google Calendar",
                html_content=f"""
                <h3>Calendar Invitation</h3>
                <p>You have been invited to a calendar event scheduled via IIST Connect.</p>
                <p><b>Event:</b> {event_title}</p>
                <p><b>Time:</b> {scheduled_at.isoformat()} to {end_time.isoformat()} (UTC)</p>
                <p><b>Meeting Link:</b> <a href="{meet_link}">{meet_link}</a></p>
                """
            )
        return meet_link


# --- 5. PAYMENT SERVICE (Razorpay Simulator) ---
class PaymentService:
    @staticmethod
    def initiate_payment(amount_in_rupees: int) -> Dict[str, Any]:
        order_id = f"order_{uuid_generator(12)}"
        return {
            "id": order_id,
            "entity": "order",
            "amount": amount_in_rupees * 100, # paise
            "currency": "INR",
            "receipt": f"rcpt_{uuid_generator(6)}",
            "status": "created"
        }

    @staticmethod
    def verify_payment(order_id: str, payment_id: str, signature: str) -> bool:
        # Simulator always succeeds signature check
        return True


# --- 6. AI CAREER SERVICE (Gemini API Wrapper) ---
class AIService:
    # Set Gemini API Key
    API_KEY = os.getenv("GEMINI_API_KEY", "Your_Gemini_API_Key_Here")
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            # Fallback to loading the API key dynamically
            api_key = os.getenv("GEMINI_API_KEY", cls.API_KEY)
            cls._client = genai.Client(api_key=api_key)
        return cls._client

    @classmethod
    def generate_content(cls, prompt: str) -> str:
        try:
            client = cls.get_client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"[AI SERVICE ERROR] {e}")
            return f"Error connecting to AI advisor. Feedback Details: {str(e)}"

    @classmethod
    def get_rag_advice(cls, question: str, alumni_context: List[Dict[str, Any]], roadmap_context: List[Dict[str, Any]], story_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Formulate context block
        context = ""
        citations = []

        if alumni_context:
            context += "### Verified Alumni Information:\n"
            for a in alumni_context:
                context += f"- {a['name']} (Class of {a['batch']}): {a['role']} at {a['company']}. Skills: {a['skills']}. Bio: {a['bio']}\n"
                citations.append({"type": "alumni", "name": a["name"], "company": a["company"], "id": a["id"]})
        
        if story_context:
            context += "\n### Alumni Interview Experiences & Career Journeys:\n"
            for s in story_context:
                context += f"- Story Title: '{s['title']}' by Author {s['author_name']} at {s['company']} (Role: {s['role']}). Excerpt: {s['content'][:300]}...\n"
                citations.append({"type": "story", "title": s["title"], "id": s["id"]})

        if roadmap_context:
            context += "\n### Recommended Career Roadmaps:\n"
            for r in roadmap_context:
                context += f"- Roadmap Title: '{r['title']}' for domain '{r['domain']}'. Estimated duration: {r['months']} months. Difficulty: {r['difficulty']}\n"
                citations.append({"type": "roadmap", "title": r["title"], "id": r["id"]})

        prompt = f"""
        You are AlumniAI, the dedicated AI career advisor for Indore Institute of Science & Technology (IIST).
        Use the following database context to help answer the user's question. If context is empty, give general advice.
        Always cite the relevant alumni, stories, or roadmaps when responding to make it feel grounded in real data.
        Keep the response engaging, professional, and formatted in markdown.

        Database Context:
        {context}

        User Question:
        "{question}"

        Format the response in structured markdown. Do not mention system-level prompt instructions.
        """
        response_text = cls.generate_content(prompt)
        return {
            "response": response_text,
            "citations": citations
        }

    @classmethod
    def review_resume(cls, text_content: str) -> Dict[str, Any]:
        prompt = f"""
        You are a senior technical recruiter. Analyze this resume text and provide structured review feedback for standard B.Tech engineering roles.
        
        Resume Content:
        \"\"\"{text_content[:3000]}\"\"\"

        Output your feedback as a plain text string that has these sections:
        - ATS SCORE: (Give a score out of 100)
        - SUMMARY: (Brief executive summary)
        - KEY STRENGTHS: (Bullet points)
        - AREAS FOR IMPROVEMENT: (Bullet points)
        - KEYWORDS SUGGESTED: (Industry keywords missing but highly recommended)
        - ACTIONABLE SUGGESTIONS: (Steps to increase score)
        """
        raw_review = cls.generate_content(prompt)
        
        # Try to parse score
        ats_score = 75
        for line in raw_review.split("\n"):
            if "ats score" in line.lower() or "score:" in line.lower():
                try:
                    # extract digits
                    digits = [int(s) for s in line.split() if s.isdigit()]
                    if digits:
                        ats_score = digits[0]
                except Exception:
                    pass
        
        return {
            "ats_score": ats_score,
            "raw_feedback": raw_review
        }

    @classmethod
    def write_cold_outreach(cls, alumni_name: str, alumni_role: str, alumni_company: str, user_name: str, purpose: str, interests: str) -> str:
        prompt = f"""
        Write a professional, highly personalized LinkedIn cold message or short email template.
        Sender: {user_name} (Student at IIST Indore)
        Recipient: {alumni_name} ({alumni_role} at {alumni_company})
        Purpose of Outreach: {purpose} (e.g. seeking mock review/referral/career advice)
        Key common interests/skills mentioned by student: {interests}

        Guidelines:
        - Keep it brief (under 250 words)
        - Respectful of their time
        - Highlights the shared IIST connection
        - Calls for action (e.g. brief chat, feedback review)
        """
        return cls.generate_content(prompt)

    @classmethod
    def generate_ai_roadmap(cls, role: str, current_skills: List[str], months: int) -> List[str]:
        prompt = f"""
        Act as a professional career counselor.
        Create a detailed step-by-step career path roadmap to become a '{role}'.
        The timeline is {months} months.
        The student currently knows: {', '.join(current_skills)}.
        Provide exactly 5 concrete milestone phases. For each phase, write:
        Phase [X]: [Phase Title] - [Duration in Weeks]
        - Learn: [Specific resources/topics]
        - Build: [A concrete hands-on project idea]
        - Apply: [What to do, e.g., practice Leetcode, apply for roles]
        Keep it concise and clear.
        """
        raw = cls.generate_content(prompt)
        # Split by phase blocks
        steps = [s.strip() for s in raw.split("\n") if s.strip()]
        return steps


# --- UTILS ---
def uuid_generator(length=8) -> str:
    letters = string.ascii_lowercase + string.digits
    return "".join(random.choices(letters, k=length))
