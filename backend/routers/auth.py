from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime
from database.db import get_db
from database.models import User, AlumniProfile, ContributionScore
from schemas.schemas import UserRegister, UserLogin, UserResponse, VerifyEmail, ForgotPassword, ResetPassword, OnboardingWizard
from services.services import AuthService, EmailService
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# JWT Cookie Helpers
def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False, # Set to True in production
        max_age=3600 # 1 hour
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=604800 # 7 days
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

# Dependency: Get Current User from Cookies
def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token"
        )
    email = payload.get("email")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    # Update last active time
    user.last_active = datetime.utcnow()
    db.commit()
    return user

def get_current_verified_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return user

def get_current_admin(user: User = Depends(get_current_verified_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check college email for alumni
    if user_data.role == "alumni":
        # College email domain check (e.g. must end with indoreinstitute.com or college.edu)
        if not (user_data.email.endswith("indoreinstitute.com") or user_data.email.endswith("iist.in") or user_data.email.endswith(".edu")):
             raise HTTPException(
                 status_code=400, 
                 detail="Alumni accounts require verification. Please register with your college email domain (*.indoreinstitute.com, *.iist.in, or *.edu)."
             )

    password_hash = AuthService.hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=password_hash,
        role=user_data.role,
        full_name=user_data.full_name,
        college_id=user_data.college_id,
        graduation_year=user_data.graduation_year,
        branch=user_data.branch,
        is_verified=False,
        is_profile_complete=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize profile if alumni
    if new_user.role == "alumni":
        profile = AlumniProfile(
            user_id=new_user.id,
            batch_year=new_user.graduation_year,
            branch=new_user.branch,
            is_mentor=False
        )
        db.add(profile)
    
    # Initialize Contribution Score
    score = ContributionScore(
        user_id=new_user.id,
        total_points=0,
        breakdown={"mentoring": 0, "stories": 0, "referrals": 0, "events": 0, "reviews": 0}
    )
    db.add(score)
    db.commit()
    
    # Send mock email OTP
    otp = "123456" # Mock verification code
    EmailService.send_email(
        to_email=new_user.email,
        subject="Verify your IIST Connect Account",
        html_content=f"""
        <h3>Welcome to IIST Connect!</h3>
        <p>Dear {new_user.full_name},</p>
        <p>Thank you for registering. Please verify your account using the OTP below:</p>
        <h2 style="color: #6366f1; letter-spacing: 4px;">{otp}</h2>
        <p>This code will expire in 10 minutes.</p>
        """
    )
    return {"message": "Registration successful. Please verify your email with the OTP."}

@router.post("/login")
def login(login_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not AuthService.verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Generate tokens
    access_token = AuthService.create_access_token({"email": user.email, "role": user.role})
    refresh_token = AuthService.create_refresh_token({"email": user.email, "role": user.role})
    
    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)
    
    # Update last active
    user.last_active = datetime.utcnow()
    db.commit()
    
    return {"message": "Login successful", "user": UserResponse.from_orm(user)}

@router.post("/logout")
def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}

@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    payload = AuthService.verify_token(refresh_token, is_refresh=True)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    email = payload.get("email")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    # Rotate tokens
    access_token = AuthService.create_access_token({"email": user.email, "role": user.role})
    new_refresh_token = AuthService.create_refresh_token({"email": user.email, "role": user.role})
    
    set_auth_cookies(response, access_token, new_refresh_token)
    return {"message": "Token refreshed"}

@router.post("/verify-email")
def verify_email(data: VerifyEmail, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.otp == "123456": # Simulator accepts 123456 as verified
        user.is_verified = True
        db.commit()
        return {"message": "Email verified successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP")

@router.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not registered")
    
    reset_token = "mock_reset_token_xyz"
    EmailService.send_email(
        to_email=user.email,
        subject="Reset your Password - IIST Connect",
        html_content=f"""
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your IIST Connect password:</p>
        <p><a href="http://localhost:5173/reset-password?token={reset_token}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        """
    )
    return {"message": "Password reset link sent to your email."}

@router.post("/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    # Simulating token check
    if data.token != "mock_reset_token_xyz":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # For demo reset password of NANDINI who is already in DB or email match
    # Since we don't store token in user table in schema, we allow changing password of any user for reset simulation
    # Let's update password for test account or NANDINI
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No users exist")
    
    user.password_hash = AuthService.hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successfully"}

@router.post("/google-oauth")
def google_oauth(response: Response, request: Request, db: Session = Depends(get_db)):
    # Mock Google Login
    # For simplicity, log in or register a mock Google user
    email = "google_user@indoreinstitute.com"
    user = db.query(User).filter(User.email == email).first()
    if not user:
        password_hash = AuthService.hash_password("google_user_secret_123")
        user = User(
            email=email,
            password_hash=password_hash,
            role="student",
            full_name="Google Student User",
            is_verified=True,
            is_profile_complete=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize Contribution Score
        score = ContributionScore(
            user_id=user.id,
            total_points=0,
            breakdown={"mentoring": 0, "stories": 0, "referrals": 0, "events": 0, "reviews": 0}
        )
        db.add(score)
        db.commit()

    access_token = AuthService.create_access_token({"email": user.email, "role": user.role})
    refresh_token = AuthService.create_refresh_token({"email": user.email, "role": user.role})
    set_auth_cookies(response, access_token, refresh_token)
    return {"message": "Google Login successful", "user": UserResponse.from_orm(user)}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/complete-profile")
def complete_profile(data: OnboardingWizard, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.graduation_year = data.graduation_year or current_user.graduation_year
    current_user.branch = data.branch or current_user.branch
    current_user.is_profile_complete = True
    
    # Save alumni profile details if alumni
    if current_user.role == "alumni":
        profile = db.query(AlumniProfile).filter(AlumniProfile.user_id == current_user.id).first()
        if not profile:
            profile = AlumniProfile(user_id=current_user.id)
            db.add(profile)
        profile.bio = data.bio or profile.bio
        profile.current_company = data.current_company or profile.current_company
        profile.current_role = data.current_role or profile.current_role
        profile.location = data.location or profile.location
        profile.linkedin_url = data.linkedin_url or profile.linkedin_url
        profile.github_url = data.github_url or profile.github_url
        profile.skills = data.skills if data.skills is not None else profile.skills
        profile.domains = data.domains if data.domains is not None else profile.domains
        profile.batch_year = data.graduation_year or profile.batch_year
        profile.branch = data.branch or profile.branch

    db.commit()
    return {"message": "Onboarding completed successfully"}
