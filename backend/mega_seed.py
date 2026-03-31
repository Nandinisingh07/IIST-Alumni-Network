import random
from main import SessionLocal, AlumniDB

def mega_seed():
    db = SessionLocal()
    
    # Check if we already have data
    count = db.query(AlumniDB).count()
    if count > 0:
        print(f"Database already has {count} alumni. Skipping to avoid duplicates.")
        db.close()
        return

    first_names = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Ishaan", "Ananya", "Diya", "Saanvi", "Riya", "Pranav", "Kavya", "Rohan", "Siddharth", "Ishita", "Meera"]
    last_names = ["Sharma", "Verma", "Singh", "Gupta", "Patel", "Mehta", "Iyer", "Nair", "Reddy", "Chauhan", "Mishra", "Joshi"]
    companies = ["Google", "Microsoft", "TCS", "Infosys", "Wipro", "Amazon", "Adobe", "Zomato", "PhonePe", "Flipkart", "Accenture"]
    roles = ["AI Engineer", "Software Developer", "Data Scientist", "UI/UX Designer", "Cloud Architect", "Cybersecurity Analyst", "DevOps Engineer"]
    skill_sets = [
        "Python, FastAPI, Machine Learning",
        "React, Node.js, MongoDB, Tailwind",
        "Java, Spring Boot, Microservices",
        "AWS, Docker, Kubernetes",
        "Figma, Adobe XD, HTML/CSS",
        "SQL, PowerBI, Tableau, R"
    ]

    print("Generating 50 Alumni profiles for IIST Connect...")

    for _ in range(50):
        full_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        new_alum = AlumniDB(
            name=full_name,
            company=random.choice(companies),
            role=random.choice(roles),
            skills=random.choice(skill_sets),
            batch=random.randint(2018, 2025),
            bio="IIST Alumni eager to help juniors with career guidance and referrals.",
            mentor_available=random.choice([True, True, False])
        )
        db.add(new_alum)

    db.commit()
    print("✅ Done! 50 Indian alumni added to career_ai.db")
    db.close()

if __name__ == "__main__":
    mega_seed()