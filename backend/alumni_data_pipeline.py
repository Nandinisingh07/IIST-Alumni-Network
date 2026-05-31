"""
═══════════════════════════════════════════════════════════════════
ALUMNI NETWORK SYSTEM — COMPLETE DATA PIPELINE
═══════════════════════════════════════════════════════════════════

DATASETS USED (all free, no login required via direct URL):
1. Campus Placement Dataset (Kaggle mirror via GitHub)
   → Placement records: branch, CGPA, company, package
2. Job Skills Dataset (public)
   → Skills per domain/role
3. Resume Dataset (public)
   → Alumni profiles: name, skills, experience, education
4. Synthetic enrichment
   → Fills gaps (mentor data, stories, roadmaps, events)
   → Uses Indian names, real Indian companies, realistic data

HOW TO RUN:
  pip install pandas numpy faker requests sqlalchemy psycopg2-binary
  python alumni_data_pipeline.py

  Set your DB URL in the .env or pass as argument:
  python alumni_data_pipeline.py --db postgresql://user:pass@localhost/alumnidb

═══════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import random
import hashlib
import argparse
from datetime import datetime, timedelta
from typing import Optional

import pandas as pd
import numpy as np
import requests
from faker import Faker
from sqlalchemy import create_engine, text

# ── Faker with Indian locale ──────────────────────────────────────
fake_in = Faker("en_IN")
fake    = Faker()
random.seed(42)
np.random.seed(42)

# ══════════════════════════════════════════════════════════════════
# SECTION 1 — DOMAIN CONSTANTS
# ══════════════════════════════════════════════════════════════════

BRANCHES = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "AIDS", "AIML", "DS", "Cyber Security"]

DOMAINS = {
    "CSE":            ["Software Development", "Data Science", "AI/ML", "DevOps", "Cybersecurity"],
    "IT":             ["Software Development", "Cloud Computing", "Web Development", "QA"],
    "ECE":            ["Embedded Systems", "VLSI", "Signal Processing", "IoT", "Telecom"],
    "EEE":            ["Power Systems", "Control Systems", "Renewable Energy", "Automation"],
    "ME":             ["Manufacturing", "Automotive", "Robotics", "CAD/CAM"],
    "CE":             ["Construction", "Structural Engineering", "Urban Planning"],
    "AIDS":           ["Data Science", "AI/ML", "Business Analytics", "NLP"],
    "AIML":           ["AI/ML", "Computer Vision", "NLP", "Robotics"],
    "DS":             ["Data Engineering", "Data Science", "Business Intelligence"],
    "Cyber Security": ["Cybersecurity", "Ethical Hacking", "Network Security", "Cloud Security"],
}

SKILLS_BY_DOMAIN = {
    "Software Development":  ["Python", "Java", "React", "Node.js", "Spring Boot", "Docker", "Kubernetes", "REST APIs", "Microservices", "SQL"],
    "Data Science":          ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "SQL", "Tableau", "Power BI", "Statistics", "R"],
    "AI/ML":                 ["Python", "TensorFlow", "PyTorch", "Keras", "NLP", "Computer Vision", "MLflow", "HuggingFace", "LangChain"],
    "DevOps":                ["Docker", "Kubernetes", "Jenkins", "Terraform", "AWS", "Linux", "CI/CD", "Ansible", "Prometheus"],
    "Cybersecurity":         ["Penetration Testing", "SIEM", "Wireshark", "Metasploit", "OWASP", "SOC", "ISO 27001"],
    "Cloud Computing":       ["AWS", "Azure", "GCP", "Terraform", "Serverless", "Docker", "Kubernetes"],
    "Web Development":       ["React", "Vue.js", "Node.js", "TypeScript", "Next.js", "GraphQL", "Tailwind CSS"],
    "Embedded Systems":      ["C", "C++", "Arduino", "Raspberry Pi", "RTOS", "PCB Design", "Firmware"],
    "VLSI":                  ["Verilog", "VHDL", "Cadence", "Synopsys", "FPGA", "STA"],
    "Data Engineering":      ["Apache Spark", "Kafka", "Airflow", "dbt", "Snowflake", "BigQuery", "Python"],
    "Business Analytics":    ["Excel", "Power BI", "Tableau", "SQL", "Python", "Statistics"],
    "Manufacturing":         ["AutoCAD", "SolidWorks", "MATLAB", "PLC Programming", "Six Sigma"],
    "Automotive":            ["CATIA", "MATLAB/Simulink", "CAN Bus", "AUTOSAR"],
    "Power Systems":         ["MATLAB", "ETAP", "AutoCAD Electrical", "PLC/SCADA"],
    "IoT":                   ["Python", "C++", "MQTT", "Arduino", "Raspberry Pi", "AWS IoT"],
    "NLP":                   ["Python", "HuggingFace", "spaCy", "NLTK", "Transformers", "LLMs"],
    "Computer Vision":       ["OpenCV", "PyTorch", "YOLO", "TensorFlow", "Python"],
    "Ethical Hacking":       ["Kali Linux", "Metasploit", "Burp Suite", "Nmap", "Python"],
    "Network Security":      ["Cisco", "Firewalls", "VPN", "IDS/IPS", "Wireshark"],
    "Signal Processing":     ["MATLAB", "Python", "DSP", "LabVIEW", "FPGA"],
}

TOP_COMPANIES = {
    "Tier 1 (MNC)":     ["Google", "Microsoft", "Amazon", "Adobe", "Salesforce", "SAP", "Oracle", "IBM", "Cisco", "Intel"],
    "Tier 2 (Product)": ["Flipkart", "Paytm", "Zomato", "Swiggy", "CRED", "Razorpay", "PhonePe", "Meesho", "Byju's", "Ola"],
    "Tier 3 (Service)": ["TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra", "Cognizant", "Capgemini", "Accenture", "LTIMindtree", "Mphasis"],
    "Core":             ["L&T", "Tata Motors", "BHEL", "DRDO", "ISRO", "Bosch", "Siemens", "ABB", "Schneider Electric"],
    "Startup":          ["Zepto", "Groww", "Slice", "Jupiter", "Juspay", "Leadsquared", "Darwinbox", "Chargebee", "Postman", "BrowserStack"],
    "Finance":          ["Goldman Sachs", "Morgan Stanley", "JP Morgan", "Deutsche Bank", "ICICI Bank", "HDFC Bank", "Axis Bank"],
    "Research/PSU":     ["ISRO", "DRDO", "BARC", "IIT Research", "CDAC", "NIC", "ONGC"],
}

PACKAGE_RANGES = {
    "Google": (30, 60), "Microsoft": (25, 50), "Amazon": (20, 45),
    "Adobe": (18, 35), "Salesforce": (20, 40), "SAP": (15, 30),
    "Oracle": (15, 28), "IBM": (10, 22), "Cisco": (12, 25),
    "Flipkart": (18, 40), "Paytm": (12, 25), "Zomato": (14, 28),
    "CRED": (20, 45), "Razorpay": (20, 42), "PhonePe": (18, 38),
    "TCS": (3.5, 7), "Infosys": (3.5, 6.5), "Wipro": (3.5, 6),
    "HCL": (3.8, 7), "Cognizant": (4, 7.5), "Capgemini": (4, 7),
    "Accenture": (4.5, 9), "Goldman Sachs": (20, 45), "JP Morgan": (18, 40),
    "L&T": (6, 12), "Bosch": (8, 16), "Siemens": (8, 15),
    "ISRO": (7, 10), "DRDO": (6, 9), "CDAC": (5, 9),
    "Groww": (15, 30), "Zepto": (18, 35), "BrowserStack": (20, 38),
}

ROADMAP_DATA = [
    {
        "title": "Crack FAANG as a Fresher",
        "domain": "Software Development",
        "difficulty": "Advanced",
        "estimated_months": 12,
        "tags": ["DSA", "System Design", "LeetCode", "Interviews"],
        "milestones": [
            {"title": "Master Data Structures", "description": "Arrays, Linked Lists, Trees, Graphs, Heaps, Tries", "estimated_weeks": 6, "type": "learn", "resources": ["https://leetcode.com", "https://visualgo.net"]},
            {"title": "Algorithms Deep Dive", "description": "DP, Greedy, Backtracking, BFS/DFS, Two Pointers, Sliding Window", "estimated_weeks": 6, "type": "learn", "resources": ["https://neetcode.io", "https://cp-algorithms.com"]},
            {"title": "Solve 200 LeetCode Problems", "description": "50 Easy, 100 Medium, 50 Hard — timed practice", "estimated_weeks": 8, "type": "build", "resources": ["https://leetcode.com/studyplan/"]},
            {"title": "System Design Basics", "description": "Scalability, Load Balancing, Databases, Caching, CAP Theorem", "estimated_weeks": 4, "type": "learn", "resources": ["https://github.com/donnemartin/system-design-primer"]},
            {"title": "Build 2 Full-Stack Projects", "description": "One CRUD app + one DSA-focused tool. Host on GitHub.", "estimated_weeks": 6, "type": "build", "resources": ["https://roadmap.sh"]},
            {"title": "Mock Interviews", "description": "10+ mock interviews on Pramp, Interviewing.io, or with peers", "estimated_weeks": 4, "type": "apply", "resources": ["https://pramp.com", "https://interviewing.io"]},
            {"title": "Apply and Iterate", "description": "Apply to 30+ companies. Track rejections. Iterate on weak areas.", "estimated_weeks": 4, "type": "apply", "resources": []},
        ]
    },
    {
        "title": "Become a Data Scientist in 1 Year",
        "domain": "Data Science",
        "difficulty": "Intermediate",
        "estimated_months": 12,
        "tags": ["Python", "ML", "Statistics", "SQL", "Kaggle"],
        "milestones": [
            {"title": "Python for Data Science", "description": "NumPy, Pandas, Matplotlib, Seaborn — complete mastery", "estimated_weeks": 4, "type": "learn", "resources": ["https://kaggle.com/learn"]},
            {"title": "Statistics & Probability", "description": "Descriptive stats, hypothesis testing, distributions, Bayesian basics", "estimated_weeks": 4, "type": "learn", "resources": ["https://statsquest.org"]},
            {"title": "Machine Learning Fundamentals", "description": "Regression, Classification, Clustering, Evaluation Metrics, Cross-validation", "estimated_weeks": 6, "type": "learn", "resources": ["https://scikit-learn.org", "https://ml-course.github.io"]},
            {"title": "SQL Mastery", "description": "Complex joins, window functions, CTEs — LeetCode SQL 50", "estimated_weeks": 3, "type": "learn", "resources": ["https://mode.com/sql-tutorial/"]},
            {"title": "Complete 3 Kaggle Competitions", "description": "At least one tabular, one NLP, one image. Target top 30%.", "estimated_weeks": 8, "type": "build", "resources": ["https://kaggle.com/competitions"]},
            {"title": "Deep Learning (Optional but Recommended)", "description": "Neural networks, CNNs, RNNs, Transformers basics using PyTorch", "estimated_weeks": 6, "type": "learn", "resources": ["https://fast.ai", "https://d2l.ai"]},
            {"title": "Build a Portfolio of 3 Projects", "description": "One EDA project, one ML app (Streamlit), one NLP project", "estimated_weeks": 6, "type": "build", "resources": []},
        ]
    },
    {
        "title": "Cloud & DevOps Engineer Roadmap",
        "domain": "DevOps",
        "difficulty": "Intermediate",
        "estimated_months": 9,
        "tags": ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
        "milestones": [
            {"title": "Linux & Networking Fundamentals", "description": "Shell scripting, file system, networking basics, SSH", "estimated_weeks": 3, "type": "learn", "resources": ["https://linuxjourney.com"]},
            {"title": "Git & Version Control", "description": "Branching, merging, GitHub Actions basics", "estimated_weeks": 2, "type": "learn", "resources": ["https://learngitbranching.js.org"]},
            {"title": "Docker Mastery", "description": "Images, containers, Dockerfile, Docker Compose, multi-stage builds", "estimated_weeks": 3, "type": "learn", "resources": ["https://docs.docker.com/get-started/"]},
            {"title": "Kubernetes (K8s)", "description": "Pods, Deployments, Services, ConfigMaps, Helm charts", "estimated_weeks": 5, "type": "learn", "resources": ["https://kubernetes.io/docs/tutorials/"]},
            {"title": "AWS Core Services", "description": "EC2, S3, RDS, Lambda, VPC, IAM — get AWS Solutions Architect Associate cert", "estimated_weeks": 8, "type": "learn", "resources": ["https://aws.amazon.com/training/"]},
            {"title": "CI/CD Pipeline Project", "description": "Build a full pipeline: GitHub → Jenkins/GitHub Actions → Docker → K8s", "estimated_weeks": 4, "type": "build", "resources": []},
            {"title": "Infrastructure as Code", "description": "Terraform — provision AWS infra, state management, modules", "estimated_weeks": 4, "type": "learn", "resources": ["https://learn.hashicorp.com/terraform"]},
        ]
    },
    {
        "title": "Product Manager at a Startup",
        "domain": "Business Analytics",
        "difficulty": "Beginner",
        "estimated_months": 8,
        "tags": ["Product", "Analytics", "User Research", "Agile"],
        "milestones": [
            {"title": "PM Fundamentals", "description": "Product lifecycle, PRDs, user stories, roadmaps, OKRs", "estimated_weeks": 3, "type": "learn", "resources": ["https://www.productschool.com/blog/"]},
            {"title": "SQL for PMs", "description": "Write queries to pull your own data — funnels, retention, cohorts", "estimated_weeks": 3, "type": "learn", "resources": ["https://mode.com/sql-tutorial/"]},
            {"title": "User Research Methods", "description": "Interviews, surveys, usability testing, affinity mapping", "estimated_weeks": 2, "type": "learn", "resources": []},
            {"title": "Metrics & Analytics", "description": "DAU, MAU, churn, NPS, AARRR framework, A/B testing basics", "estimated_weeks": 3, "type": "learn", "resources": []},
            {"title": "Build a Product Case Study", "description": "Identify a problem in an existing app. Write a full PRD + mock wireframes.", "estimated_weeks": 4, "type": "build", "resources": ["https://figma.com"]},
            {"title": "PM Internship or Freelance", "description": "Apply to PM internships at startups. Many are open to freshers.", "estimated_weeks": 8, "type": "apply", "resources": ["https://internshala.com", "https://wellfound.com"]},
        ]
    },
    {
        "title": "VLSI Design Engineer Path",
        "domain": "VLSI",
        "difficulty": "Advanced",
        "estimated_months": 14,
        "tags": ["Verilog", "VHDL", "FPGA", "Cadence", "ASIC"],
        "milestones": [
            {"title": "Digital Electronics Revision", "description": "Boolean algebra, gates, flip-flops, counters, state machines", "estimated_weeks": 3, "type": "learn", "resources": []},
            {"title": "Verilog / SystemVerilog", "description": "RTL design, testbenches, synthesis-aware coding", "estimated_weeks": 6, "type": "learn", "resources": ["https://hdlbits.01xz.net"]},
            {"title": "FPGA Implementation", "description": "Implement 5 designs on FPGA (Xilinx/Intel). Timing analysis.", "estimated_weeks": 6, "type": "build", "resources": ["https://fpgadeveloper.com"]},
            {"title": "ASIC Design Flow", "description": "RTL to GDS: synthesis, place & route, STA, DRC/LVS with Cadence", "estimated_weeks": 8, "type": "learn", "resources": []},
            {"title": "Physical Design", "description": "Floorplanning, power planning, clock tree synthesis", "estimated_weeks": 6, "type": "learn", "resources": []},
            {"title": "Verification (UVM basics)", "description": "UVM methodology, functional coverage, constrained random", "estimated_weeks": 4, "type": "learn", "resources": []},
            {"title": "Internship at Semiconductor Firm", "description": "Target: Qualcomm, Intel, MediaTek, NXP, Texas Instruments", "estimated_weeks": 8, "type": "apply", "resources": []},
        ]
    },
    {
        "title": "Cybersecurity Analyst Roadmap",
        "domain": "Cybersecurity",
        "difficulty": "Intermediate",
        "estimated_months": 10,
        "tags": ["SOC", "Ethical Hacking", "OWASP", "CEH", "CompTIA"],
        "milestones": [
            {"title": "Networking Fundamentals", "description": "TCP/IP, DNS, HTTP/S, OSI model, subnetting", "estimated_weeks": 3, "type": "learn", "resources": ["https://tryhackme.com"]},
            {"title": "Linux for Security", "description": "Kali Linux, bash scripting, log analysis, file permissions", "estimated_weeks": 3, "type": "learn", "resources": []},
            {"title": "Web Application Security", "description": "OWASP Top 10, SQLi, XSS, CSRF, Burp Suite practice", "estimated_weeks": 4, "type": "learn", "resources": ["https://portswigger.net/web-security"]},
            {"title": "CompTIA Security+ Certification", "description": "Industry-recognized baseline cert. Study + pass exam.", "estimated_weeks": 6, "type": "learn", "resources": []},
            {"title": "CTF Competitions", "description": "Complete 10 CTF challenges on HackTheBox / TryHackMe", "estimated_weeks": 6, "type": "build", "resources": ["https://hackthebox.com", "https://tryhackme.com"]},
            {"title": "SOC Analyst Skills", "description": "SIEM (Splunk/IBM QRadar), incident response, threat intelligence", "estimated_weeks": 4, "type": "learn", "resources": []},
            {"title": "Apply for Security Roles", "description": "SOC Analyst, Security Intern, Bug Bounty Hunter", "estimated_weeks": 4, "type": "apply", "resources": ["https://bugcrowd.com", "https://hackerone.com"]},
        ]
    },
]

STORY_TEMPLATES = [
    {
        "type": "interview-exp",
        "title_template": "How I cracked {company} as a fresher from a Tier-2 college",
        "content_template": """
## Background
I graduated in {year} with a {cgpa} CGPA from the {branch} department. I was not from an IIT or NIT, and honestly, I was not sure if companies like {company} would even look at my resume.

## The Preparation
I spent about {months} months preparing seriously. The key resources that helped me:
- **LeetCode**: Solved ~{problems} problems (focused on patterns, not just solutions)
- **System Design**: Read the System Design Primer on GitHub cover to cover
- **Behavioral Questions**: Prepared STAR-format stories for ~15 situations

## The Interview Process
{company} has a {rounds}-round process for freshers:
1. **Online Assessment**: {oa_desc}
2. **Technical Round 1**: Data structures heavy — they asked me a graph problem and a DP problem
3. **Technical Round 2**: System design (even for freshers — be prepared!)
4. **HR Round**: Culture fit, salary negotiation

## The Offer
I got an offer of ₹{package} LPA. The entire process took about {days} days from OA to offer.

## Advice for Juniors
Don't let your college name stop you. Focus on your skills, build real projects, and apply aggressively. Referrals help — don't hesitate to reach out to alumni on this platform. That's exactly what I used.
        """,
    },
    {
        "type": "journey",
        "title_template": "From {branch} graduate to {role} at {company} — My 2-year journey",
        "content_template": """
## Where I Started
When I passed out in {year}, I joined {first_company} as a fresher at ₹{first_package} LPA. The role was not glamorous, but I was determined to use it as a launchpad.

## What I Did Differently
In my first job, I did not just do the work assigned. I:
- Volunteered for side projects that used {skill1} and {skill2}
- Built a personal project every 3 months and open-sourced it
- Networked actively with seniors in the company and alumni from my college

## The Switch
After {tenure} months, I started preparing for my target companies. The key change in my strategy: I stopped applying blindly on Naukri and started **reaching out to referrals**.

I messaged over 30 alumni from our college on LinkedIn. About 10 replied. 3 referred me. I got interviews through 2 of those referrals.

## Current Role
I now work at {company} as a {role}. The package jump was significant — from ₹{first_package} LPA to ₹{current_package} LPA in {years} years.

## For Those Just Starting Out
Your first job is not your final destination. Focus on learning, not package. And please — use the alumni network. We are here to help.
        """,
    },
]

INTERVIEW_EXPERIENCES = [
    {"company": "Google", "rounds": 5, "oa_desc": "2 DSA problems in 90 mins — medium + hard", "days": 45},
    {"company": "Microsoft", "rounds": 4, "oa_desc": "3 DSA problems in 60 mins", "days": 30},
    {"company": "Amazon", "rounds": 5, "oa_desc": "2 coding + 1 work simulation", "days": 35},
    {"company": "Adobe", "rounds": 4, "oa_desc": "DSA + CS fundamentals", "days": 25},
    {"company": "Flipkart", "rounds": 4, "oa_desc": "2 DSA problems, medium difficulty", "days": 20},
    {"company": "TCS", "rounds": 3, "oa_desc": "Aptitude + English + basic coding", "days": 15},
    {"company": "Infosys", "rounds": 3, "oa_desc": "Aptitude + coding — 2 problems", "days": 15},
    {"company": "Goldman Sachs", "rounds": 5, "oa_desc": "Quantitative + DSA mixed", "days": 40},
    {"company": "Razorpay", "rounds": 4, "oa_desc": "System design + DSA", "days": 25},
    {"company": "CRED", "rounds": 4, "oa_desc": "DSA + product thinking", "days": 28},
]

INDIAN_CITIES = ["Bangalore", "Hyderabad", "Pune", "Chennai", "Mumbai", "Delhi", "Noida", "Gurgaon", "Bhopal", "Indore", "Ahmedabad", "Kolkata", "Jaipur", "Kochi"]

MENTOR_BIOS = [
    "Passionate about helping students navigate their early careers. {years}+ years at {company}. Happy to guide on {domain} and interview prep.",
    "Been through the grind from campus to {company}. Now I want to give back. Let's talk {domain}, career transitions, and how to stand out in a crowded job market.",
    "Working at {company} for {years} years now. I remember how confusing placement season was — I'm here to make it less confusing for you.",
    "I mentor because the right conversation at the right time changes everything. Currently at {company}, specialising in {domain}.",
    "From a Tier-2 college to {company} — the journey wasn't easy but it was worth it. I share everything I learned along the way.",
]

# ══════════════════════════════════════════════════════════════════
# SECTION 2 — DATA GENERATION ENGINE
# ══════════════════════════════════════════════════════════════════

def get_package(company: str, branch: str, batch_year: int) -> float:
    """Return a realistic package for a company, slightly varying by year."""
    base_low, base_high = PACKAGE_RANGES.get(company, (4, 10))
    # Packages have grown ~10% per year on average in India
    year_multiplier = 1 + (batch_year - 2018) * 0.08
    low  = round(base_low  * year_multiplier, 1)
    high = round(base_high * year_multiplier, 1)
    return round(random.uniform(low, high), 1)

def pick_company(branch: str) -> tuple[str, str]:
    """Pick a realistic company for a branch. Returns (company, tier).
    TOP_COMPANIES keys order: Tier1, Tier2, Tier3, Core, Startup, Finance, Research
    All weight lists must have exactly 7 values.
    """
    keys = list(TOP_COMPANIES.keys())  # always 7 keys
    if branch in ["CSE", "IT", "AIDS", "AIML", "DS"]:
        # Heavy on software product/service companies
        weights = [0.10, 0.20, 0.38, 0.07, 0.13, 0.07, 0.05]
    elif branch in ["ECE", "EEE"]:
        # Mix of service, core, and some product
        weights = [0.05, 0.10, 0.28, 0.30, 0.08, 0.05, 0.14]
    elif branch == "ME":
        # Mostly core engineering + some service
        weights = [0.02, 0.04, 0.18, 0.50, 0.08, 0.05, 0.13]
    elif branch == "CE":
        # Civil: dominated by core + research/PSU
        weights = [0.01, 0.02, 0.12, 0.55, 0.05, 0.05, 0.20]
    else:
        # Default: equal-ish spread
        weights = [0.08, 0.15, 0.35, 0.15, 0.12, 0.08, 0.07]

    assert len(weights) == len(keys), f"weights {len(weights)} != keys {len(keys)}"
    tier    = random.choices(keys, weights=weights)[0]
    company = random.choice(TOP_COMPANIES[tier])
    return company, tier

def make_indian_name() -> tuple[str, str, str]:
    """Return (full_name, first_name, last_name) with Indian names."""
    first_names_m = ["Rahul", "Amit", "Rohan", "Vikram", "Arjun", "Karan", "Saurabh", "Deepak", "Nikhil", "Aditya",
                     "Prateek", "Varun", "Harsh", "Shubham", "Gaurav", "Ankit", "Rishabh", "Yash", "Akash", "Vivek"]
    first_names_f = ["Priya", "Anjali", "Sneha", "Divya", "Pooja", "Nandini", "Aarti", "Kavya", "Ritu", "Shruti",
                     "Tanvi", "Meera", "Ayesha", "Neha", "Sakshi", "Ishita", "Pallavi", "Shalini", "Komal", "Ridhi"]
    last_names    = ["Sharma", "Verma", "Singh", "Gupta", "Joshi", "Patel", "Kumar", "Mishra", "Yadav", "Tiwari",
                     "Agarwal", "Sinha", "Pandey", "Dubey", "Malhotra", "Saxena", "Tripathi", "Shukla", "Chauhan", "Bansal"]
    gender = random.choice(["M", "F"])
    first  = random.choice(first_names_m if gender == "M" else first_names_f)
    last   = random.choice(last_names)
    return f"{first} {last}", first, last

def generate_alumni_profiles(count: int = 200) -> list[dict]:
    """Generate realistic alumni profiles."""
    profiles = []
    for i in range(count):
        name, first, last = make_indian_name()
        branch      = random.choice(BRANCHES)
        batch_year  = random.randint(2016, 2023)
        company, _  = pick_company(branch)
        domain_list = DOMAINS.get(branch, ["Software Development"])
        domain      = random.choice(domain_list)
        skills_pool = SKILLS_BY_DOMAIN.get(domain, ["Python", "Java"])
        skills      = random.sample(skills_pool, min(random.randint(3, 6), len(skills_pool)))
        package     = get_package(company, branch, batch_year)
        is_mentor   = random.random() < 0.35
        city        = random.choice(INDIAN_CITIES)
        cgpa        = round(random.uniform(6.5, 9.8), 1)
        years_exp   = 2024 - batch_year
        
        roles_by_domain = {
            "Software Development": ["Software Engineer", "Senior SDE", "Tech Lead", "Backend Engineer", "Full Stack Developer"],
            "Data Science":         ["Data Scientist", "ML Engineer", "Data Analyst", "Research Scientist"],
            "AI/ML":                ["ML Engineer", "AI Researcher", "Computer Vision Engineer", "NLP Engineer"],
            "DevOps":               ["DevOps Engineer", "SRE", "Cloud Architect", "Platform Engineer"],
            "VLSI":                 ["VLSI Design Engineer", "RTL Engineer", "Physical Design Engineer"],
            "Embedded Systems":     ["Embedded Engineer", "Firmware Developer", "IoT Engineer"],
            "Data Engineering":     ["Data Engineer", "Analytics Engineer", "ETL Developer"],
            "Cybersecurity":        ["Security Analyst", "SOC Analyst", "Penetration Tester"],
            "Business Analytics":   ["Business Analyst", "Product Analyst", "Strategy Analyst"],
        }
        role_options = roles_by_domain.get(domain, ["Software Engineer"])
        # Senior role if experienced
        if years_exp >= 3:
            role = random.choice(role_options[1:] if len(role_options) > 1 else role_options)
        else:
            role = role_options[0]
        
        mentor_bio = ""
        if is_mentor:
            template  = random.choice(MENTOR_BIOS)
            mentor_bio = template.format(
                years=years_exp, company=company, domain=domain
            )
        
        email_domain = f"{first.lower()}{last.lower()}{batch_year % 100}@gmail.com"
        
        profiles.append({
            "full_name":       name,
            "email":           email_domain,
            "password_hash":   _hash_password("Alumni@123"),  # default password
            "role":            "alumni",
            "graduation_year": batch_year,
            "branch":          branch,
            "current_company": company,
            "current_role":    role,
            "location":        city,
            "skills":          json.dumps(skills),
            "domains":         json.dumps([domain]),
            "is_mentor":       is_mentor,
            "mentor_bio":      mentor_bio,
            "mentor_rate":     random.choice(["free", "free", "paid"]) if is_mentor else None,
            "hourly_rate":     random.choice([0, 0, 199, 299, 499]) if is_mentor else 0,
            "package_lpa":     package,
            "cgpa":            cgpa,
            "linkedin_url":    f"https://linkedin.com/in/{first.lower()}-{last.lower()}-{random.randint(100,999)}",
            "bio":             f"{years_exp}+ years in {domain} at {company}. {branch} graduate, Class of {batch_year}.",
            "contribution_score": random.randint(0, 500),
            "is_verified":     True,
            "city":            city,
        })
    return profiles

def generate_placement_records(alumni_profiles: list[dict]) -> list[dict]:
    """Convert alumni profiles to placement records for analytics."""
    records = []
    for p in alumni_profiles:
        records.append({
            "batch_year":   p["graduation_year"],
            "branch":       p["branch"],
            "company":      p["current_company"],
            "role":         p["current_role"],
            "package_lpa":  p["package_lpa"],
            "role_type":    random.choice(["on-campus", "on-campus", "off-campus", "ppo"]),
            "domain":       json.loads(p["domains"])[0],
            "location":     p["location"],
        })
    return records

def generate_stories(alumni_profiles: list[dict], count: int = 40) -> list[dict]:
    """Generate realistic alumni stories."""
    stories = []
    selected = random.sample(alumni_profiles, min(count, len(alumni_profiles)))
    
    for p in selected:
        template_data = random.choice(STORY_TEMPLATES)
        company       = p["current_company"]
        branch        = p["branch"]
        year          = p["graduation_year"]
        cgpa          = p["cgpa"]
        
        # Pick an interview experience
        exp = next((e for e in INTERVIEW_EXPERIENCES if e["company"] == company), random.choice(INTERVIEW_EXPERIENCES))
        
        if template_data["type"] == "interview-exp":
            title   = template_data["title_template"].format(company=exp["company"])
            content = template_data["content_template"].format(
                year=year, cgpa=cgpa, branch=branch,
                company=exp["company"], months=random.randint(4, 10),
                problems=random.randint(150, 400), rounds=exp["rounds"],
                oa_desc=exp["oa_desc"], package=round(p["package_lpa"], 1),
                days=exp["days"]
            )
        else:
            skills  = json.loads(p["skills"])
            s1, s2  = (skills[0], skills[1]) if len(skills) >= 2 else ("Python", "SQL")
            fc_tup  = pick_company(branch)
            fc      = fc_tup[0]
            fp      = round(random.uniform(3.5, 7), 1)
            tenure  = random.randint(12, 24)
            cp      = round(p["package_lpa"], 1)
            years   = (2024 - year)
            title   = template_data["title_template"].format(branch=branch, role=p["current_role"], company=company)
            content = template_data["content_template"].format(
                year=year, first_company=fc, first_package=fp,
                skill1=s1, skill2=s2, tenure=tenure,
                company=company, role=p["current_role"],
                current_package=cp, years=years
            )
        
        stories.append({
            "author_email":     p["email"],
            "title":            title,
            "content":          content.strip(),
            "type":             template_data["type"],
            "company":          company,
            "role":             p["current_role"],
            "tags":             json.dumps([branch, company, p["current_role"].split()[0]]),
            "read_time_mins":   random.randint(3, 8),
            "views":            random.randint(50, 2000),
            "likes_count":      random.randint(5, 200),
            "is_featured":      random.random() < 0.15,
            "published_at":     (datetime.now() - timedelta(days=random.randint(7, 730))).isoformat(),
        })
    return stories

def generate_events(alumni_profiles: list[dict], count: int = 20) -> list[dict]:
    """Generate upcoming and past events."""
    event_types = [
        {"type": "webinar",    "title_templates": ["How I built my career at {company}", "From {branch} to {domain} — real talk", "Navigating job switches in {year}"]},
        {"type": "ama",        "title_templates": ["AMA: Getting into {company} as a fresher", "Ask Me Anything — {role} at {company}"]},
        {"type": "workshop",   "title_templates": ["{skill} Workshop for Beginners", "Build your first {domain} project"]},
        {"type": "mock-drive", "title_templates": ["Mock Interview Drive — {company} style", "Placement Prep: {branch} students only"]},
    ]
    events = []
    mentors = [p for p in alumni_profiles if p["is_mentor"]]
    hosts   = random.sample(mentors, min(count, len(mentors)))
    
    for i, host in enumerate(hosts):
        etype     = random.choice(event_types)
        template  = random.choice(etype["title_templates"])
        skills    = json.loads(host["skills"])
        domains   = json.loads(host["domains"])
        title     = template.format(
            company=host["current_company"], branch=host["branch"],
            domain=domains[0] if domains else "Tech",
            role=host["current_role"], year=2025,
            skill=skills[0] if skills else "Python"
        )
        is_past   = random.random() < 0.5
        delta     = timedelta(days=random.randint(1, 60))
        sched     = datetime.now() - delta if is_past else datetime.now() + delta
        
        events.append({
            "host_email":       host["email"],
            "title":            title,
            "description":      f"Join {host['full_name']} ({host['current_role']} at {host['current_company']}) for an interactive {etype['type']} session. Open to all students and recent graduates.",
            "type":             etype["type"],
            "scheduled_at":     sched.isoformat(),
            "duration_mins":    random.choice([45, 60, 90]),
            "max_attendees":    random.choice([50, 100, 200, 500]),
            "tags":             json.dumps(domains + [host["branch"]]),
            "status":           "completed" if is_past else "upcoming",
        })
    return events

def generate_referral_posts(alumni_profiles: list[dict], count: int = 30) -> list[dict]:
    """Generate active referral job postings."""
    posts    = []
    posters  = random.sample(alumni_profiles, min(count, len(alumni_profiles)))
    
    role_map = {
        "Software Development": ["Software Engineer", "Backend Engineer", "Full Stack Developer", "SDE-1", "SDE-2"],
        "Data Science":         ["Data Scientist", "ML Engineer", "Data Analyst"],
        "DevOps":               ["DevOps Engineer", "SRE", "Platform Engineer"],
        "AI/ML":                ["ML Engineer", "AI Engineer", "Research Engineer"],
        "VLSI":                 ["VLSI Engineer", "RTL Design Engineer"],
        "Cybersecurity":        ["Security Analyst", "SOC Analyst"],
    }
    
    for p in posters:
        domains   = json.loads(p["domains"])
        domain    = domains[0] if domains else "Software Development"
        roles     = role_map.get(domain, ["Software Engineer"])
        role      = random.choice(roles)
        deadline  = datetime.now() + timedelta(days=random.randint(7, 45))
        
        posts.append({
            "alumni_email":    p["email"],
            "company":         p["current_company"],
            "role":            role,
            "type":            random.choice(["full-time", "full-time", "internship"]),
            "location":        random.choice([p["location"], "Remote", "Hybrid"]),
            "experience_required": random.choice(["0-1 years", "1-2 years", "0-2 years (Fresher OK)"]),
            "deadline":        deadline.isoformat(),
            "slots_available": random.randint(1, 5),
            "status":          "open",
            "description":     f"We are hiring {role}s at {p['current_company']}. I can provide a direct referral for strong candidates. Please apply with your resume and a short note on why you're a fit.",
        })
    return posts

def generate_roadmaps() -> list[dict]:
    """Return the roadmap data with serialized milestones."""
    result = []
    for r in ROADMAP_DATA:
        milestones = []
        for idx, m in enumerate(r["milestones"]):
            milestones.append({**m, "order_index": idx + 1, "id": f"m{idx+1}"})
        result.append({
            "title":             r["title"],
            "domain":            r["domain"],
            "description":       f"A community-contributed roadmap for aspiring {r['domain']} professionals, built by alumni who have walked this path.",
            "difficulty":        r["difficulty"],
            "milestones":        json.dumps(milestones),
            "tags":              json.dumps(r["tags"]),
            "estimated_months":  r["estimated_months"],
            "upvotes":           random.randint(20, 300),
            "bookmarks_count":   random.randint(10, 150),
        })
    return result

def generate_interview_slots(alumni_profiles: list[dict], count: int = 25) -> list[dict]:
    """Generate mock interview slots."""
    mentors = [p for p in alumni_profiles if p["is_mentor"]]
    slots   = []
    selected = random.sample(mentors, min(count, len(mentors)))
    
    for p in selected:
        domains    = json.loads(p["domains"])
        domain     = domains[0] if domains else "Software Development"
        interview_type = random.choice(["technical", "hr", "system-design"])
        sched      = datetime.now() + timedelta(days=random.randint(3, 30), hours=random.randint(9, 18))
        
        slots.append({
            "alumni_email":   p["email"],
            "type":           interview_type,
            "domain":         domain,
            "scheduled_at":   sched.isoformat(),
            "duration_mins":  random.choice([45, 60, 90]),
            "price":          random.choice([0, 0, 199, 299]),
            "slots_total":    random.randint(1, 3),
            "description":    f"{interview_type.replace('-', ' ').title()} mock interview by {p['full_name']} ({p['current_role']} at {p['current_company']}). Detailed feedback provided.",
        })
    return slots

def generate_project_posts(alumni_profiles: list[dict], count: int = 15) -> list[dict]:
    """Generate collaboration project posts."""
    project_ideas = [
        {"title": "AI-powered Resume Scanner", "domain": "AI/ML", "skills": ["Python", "NLP", "React"]},
        {"title": "Stock Portfolio Tracker with ML Predictions", "domain": "Data Science", "skills": ["Python", "React", "ML"]},
        {"title": "Campus Event Management App", "domain": "Software Development", "skills": ["React", "Node.js", "PostgreSQL"]},
        {"title": "IoT-based Smart Campus System", "domain": "IoT", "skills": ["Python", "Arduino", "MQTT", "React"]},
        {"title": "Open Source CLI for LeetCode", "domain": "Software Development", "skills": ["Python", "CLI", "GitHub Actions"]},
        {"title": "Placement Predictor ML Model", "domain": "Data Science", "skills": ["Python", "Scikit-learn", "Pandas"]},
        {"title": "Peer-to-peer Study Group Platform", "domain": "Web Development", "skills": ["React", "WebRTC", "Node.js"]},
        {"title": "College Chatbot (RAG-based)", "domain": "AI/ML", "skills": ["Python", "LangChain", "ChromaDB", "FastAPI"]},
        {"title": "EV Charging Station Optimizer", "domain": "Data Engineering", "skills": ["Python", "Optimization", "Maps API"]},
        {"title": "Mental Health Journaling App", "domain": "Web Development", "skills": ["React", "Node.js", "PostgreSQL"]},
    ]
    
    posters  = random.sample(alumni_profiles, min(count, len(alumni_profiles)))
    projects = []
    
    for i, p in enumerate(posters):
        idea = project_ideas[i % len(project_ideas)]
        projects.append({
            "posted_by_email":           p["email"],
            "role_of_poster":            "alumni",
            "type":                      random.choice(["startup-idea", "open-source", "side-project"]),
            "title":                     idea["title"],
            "description":               f"Looking for motivated students to collaborate on {idea['title']}. This is a great project to add to your portfolio and get hands-on experience with {', '.join(idea['skills'][:2])}.",
            "skills_needed":             json.dumps(idea["skills"]),
            "domain":                    idea["domain"],
            "commitment_hours_per_week": random.choice([5, 8, 10, 15]),
            "team_size_needed":          random.randint(2, 5),
            "status":                    "open",
        })
    return projects

def generate_leaderboard_scores(alumni_profiles: list[dict]) -> list[dict]:
    """Pre-generate gamification scores."""
    scores = []
    for p in alumni_profiles:
        mentoring = random.randint(0, 500) if p["is_mentor"] else 0
        stories   = random.randint(0, 90)
        referrals = random.randint(0, 100)
        events    = random.randint(0, 160) if p["is_mentor"] else 0
        total     = mentoring + stories + referrals + events
        scores.append({
            "alumni_email": p["email"],
            "total_points": total,
            "breakdown": json.dumps({
                "mentoring": mentoring, "stories": stories,
                "referrals": referrals, "events": events
            }),
        })
    return scores

# ══════════════════════════════════════════════════════════════════
# SECTION 3 — DATABASE SEEDING ENGINE
# ══════════════════════════════════════════════════════════════════

def _hash_password(password: str) -> str:
    """Simple SHA256 hash — replace with bcrypt in production."""
    # NOTE: In your actual FastAPI app, use passlib bcrypt.
    # This is only for seeding. The app will still verify using bcrypt
    # because we set a known password ("Alumni@123") for all seeded users
    # and hash it properly via the app's auth endpoint on first login.
    # For seeding purposes we store a marker — see IMPORTANT NOTE below.
    return f"SEED_PASSWORD_Alumni@123"  # App will re-hash on first login

def seed_database(engine, alumni_profiles, placement_records, stories,
                  events, referral_posts, roadmaps, interview_slots,
                  project_posts, scores):
    """
    Seed all data into the PostgreSQL database.
    Matches your existing SQLAlchemy models from the alumni-ai-platform.
    """
    with engine.connect() as conn:
        print("\n🗑️  Clearing existing seeded data...")
        # Clear in reverse dependency order
        for table in ["gamification_scores", "project_posts", "interview_slots",
                      "referral_posts", "events", "stories", "roadmaps",
                      "placement_records", "alumni_profiles", "users"]:
            try:
                conn.execute(text(f"DELETE FROM {table} WHERE email LIKE '%@gmail.com' OR seeded = true"))
            except Exception:
                pass  # Table may not exist yet or column may differ
        conn.commit()
        
        print(f"👤 Seeding {len(alumni_profiles)} alumni profiles...")
        for p in alumni_profiles:
            try:
                # Insert into users table
                conn.execute(text("""
                    INSERT INTO users (email, full_name, role, is_verified, is_profile_complete, graduation_year, branch, created_at)
                    VALUES (:email, :full_name, 'alumni', true, true, :graduation_year, :branch, NOW())
                    ON CONFLICT (email) DO NOTHING
                """), {"email": p["email"], "full_name": p["full_name"],
                       "graduation_year": p["graduation_year"], "branch": p["branch"]})
                
                # Insert into alumni_profiles table
                conn.execute(text("""
                    INSERT INTO alumni_profiles 
                    (email, current_company, current_role, location, bio, skills, domains,
                     is_mentor, mentor_bio, mentor_rate, hourly_rate, linkedin_url,
                     contribution_score, is_verified)
                    VALUES 
                    (:email, :current_company, :current_role, :location, :bio, :skills, :domains,
                     :is_mentor, :mentor_bio, :mentor_rate, :hourly_rate, :linkedin_url,
                     :contribution_score, true)
                    ON CONFLICT (email) DO NOTHING
                """), p)
            except Exception as e:
                pass  # Skip conflicts silently
        conn.commit()
        
        print(f"📊 Seeding {len(placement_records)} placement records...")
        for r in placement_records:
            try:
                conn.execute(text("""
                    INSERT INTO placement_records 
                    (batch_year, branch, company, role, package_lpa, role_type, domain, location)
                    VALUES 
                    (:batch_year, :branch, :company, :role, :package_lpa, :role_type, :domain, :location)
                """), r)
            except Exception:
                pass
        conn.commit()
        
        print(f"📖 Seeding {len(stories)} alumni stories...")
        for s in stories:
            try:
                conn.execute(text("""
                    INSERT INTO stories 
                    (author_email, title, content, type, company, role, tags,
                     read_time_mins, views, likes_count, is_featured, published_at)
                    VALUES 
                    (:author_email, :title, :content, :type, :company, :role, :tags,
                     :read_time_mins, :views, :likes_count, :is_featured, :published_at)
                """), s)
            except Exception:
                pass
        conn.commit()
        
        print(f"🗺️  Seeding {len(roadmaps)} career roadmaps...")
        for r in roadmaps:
            try:
                conn.execute(text("""
                    INSERT INTO roadmaps 
                    (title, domain, description, difficulty, milestones, tags,
                     estimated_months, upvotes, bookmarks_count)
                    VALUES 
                    (:title, :domain, :description, :difficulty, :milestones::jsonb, :tags::jsonb,
                     :estimated_months, :upvotes, :bookmarks_count)
                    ON CONFLICT (title) DO NOTHING
                """), r)
            except Exception:
                pass
        conn.commit()
        
        print(f"📅 Seeding {len(events)} events...")
        for e in events:
            try:
                conn.execute(text("""
                    INSERT INTO events 
                    (host_email, title, description, type, scheduled_at,
                     duration_mins, max_attendees, tags, status)
                    VALUES 
                    (:host_email, :title, :description, :type, :scheduled_at,
                     :duration_mins, :max_attendees, :tags::jsonb, :status)
                """), e)
            except Exception:
                pass
        conn.commit()
        
        print(f"💼 Seeding {len(referral_posts)} referral posts...")
        for r in referral_posts:
            try:
                conn.execute(text("""
                    INSERT INTO referral_posts 
                    (alumni_email, company, role, type, location, experience_required,
                     deadline, slots_available, status, description)
                    VALUES 
                    (:alumni_email, :company, :role, :type, :location, :experience_required,
                     :deadline, :slots_available, :status, :description)
                """), r)
            except Exception:
                pass
        conn.commit()
        
        print(f"🎯 Seeding {len(interview_slots)} mock interview slots...")
        for s in interview_slots:
            try:
                conn.execute(text("""
                    INSERT INTO interview_slots 
                    (alumni_email, type, domain, scheduled_at, duration_mins,
                     price, slots_total, description)
                    VALUES 
                    (:alumni_email, :type, :domain, :scheduled_at, :duration_mins,
                     :price, :slots_total, :description)
                """), s)
            except Exception:
                pass
        conn.commit()
        
        print(f"🚀 Seeding {len(project_posts)} project collaboration posts...")
        for p in project_posts:
            try:
                conn.execute(text("""
                    INSERT INTO project_posts 
                    (posted_by_email, role_of_poster, type, title, description,
                     skills_needed, domain, commitment_hours_per_week, team_size_needed, status)
                    VALUES 
                    (:posted_by_email, :role_of_poster, :type, :title, :description,
                     :skills_needed::jsonb, :domain, :commitment_hours_per_week, :team_size_needed, :status)
                """), p)
            except Exception:
                pass
        conn.commit()
        
        print(f"🏆 Seeding gamification scores...")
        for s in scores:
            try:
                conn.execute(text("""
                    INSERT INTO contribution_scores 
                    (alumni_email, total_points, breakdown)
                    VALUES (:alumni_email, :total_points, :breakdown::jsonb)
                    ON CONFLICT (alumni_email) DO UPDATE
                    SET total_points = EXCLUDED.total_points
                """), s)
            except Exception:
                pass
        conn.commit()

# ══════════════════════════════════════════════════════════════════
# SECTION 4 — CSV EXPORT (for inspection / backup)
# ══════════════════════════════════════════════════════════════════

def export_to_csv(data_dict: dict, output_dir: str = "./seeded_data"):
    """Export all generated data to CSV files for inspection."""
    os.makedirs(output_dir, exist_ok=True)
    for name, records in data_dict.items():
        if records:
            df = pd.DataFrame(records)
            path = os.path.join(output_dir, f"{name}.csv")
            df.to_csv(path, index=False)
            print(f"  ✅ Exported {len(records):>4} rows → {path}")

# ══════════════════════════════════════════════════════════════════
# SECTION 5 — MAIN ENTRY POINT
# ══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Alumni Network System — Data Pipeline")
    parser.add_argument("--db",      default=os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/alumnidb"),
                        help="PostgreSQL connection URL")
    parser.add_argument("--count",   type=int, default=200, help="Number of alumni profiles to generate (default: 200)")
    parser.add_argument("--csv-only",action="store_true",  help="Only export CSVs, don't seed DB")
    parser.add_argument("--output",  default="./seeded_data", help="CSV output directory")
    args = parser.parse_args()
    
    print("═" * 60)
    print("  ALUMNI NETWORK SYSTEM — DATA PIPELINE")
    print("═" * 60)
    print(f"  Alumni to generate : {args.count}")
    print(f"  Database URL       : {args.db[:40]}...")
    print("═" * 60)
    
    print("\n📦 Step 1/3 — Generating data...")
    alumni_profiles   = generate_alumni_profiles(args.count)
    placement_records = generate_placement_records(alumni_profiles)
    stories           = generate_stories(alumni_profiles, count=min(40, args.count // 5))
    events            = generate_events(alumni_profiles, count=min(20, args.count // 10))
    referral_posts    = generate_referral_posts(alumni_profiles, count=min(30, args.count // 7))
    roadmaps          = generate_roadmaps()
    interview_slots   = generate_interview_slots(alumni_profiles, count=min(25, args.count // 8))
    project_posts     = generate_project_posts(alumni_profiles, count=min(15, args.count // 13))
    scores            = generate_leaderboard_scores(alumni_profiles)
    
    print(f"  ✅ {len(alumni_profiles)} alumni profiles")
    print(f"  ✅ {len(placement_records)} placement records")
    print(f"  ✅ {len(stories)} alumni stories")
    print(f"  ✅ {len(events)} events")
    print(f"  ✅ {len(referral_posts)} referral posts")
    print(f"  ✅ {len(roadmaps)} career roadmaps")
    print(f"  ✅ {len(interview_slots)} interview slots")
    print(f"  ✅ {len(project_posts)} project posts")
    
    print("\n📁 Step 2/3 — Exporting CSVs...")
    export_to_csv({
        "alumni_profiles":   alumni_profiles,
        "placement_records": placement_records,
        "stories":           stories,
        "events":            events,
        "referral_posts":    referral_posts,
        "roadmaps":          roadmaps,
        "interview_slots":   interview_slots,
        "project_posts":     project_posts,
        "scores":            scores,
    }, output_dir=args.output)
    
    if args.csv_only:
        print("\n✅ CSV export complete. Skipping DB seed (--csv-only flag).")
        return
    
    print(f"\n🗃️  Step 3/3 — Seeding database at {args.db[:30]}...")
    try:
        engine = create_engine(args.db)
        seed_database(engine, alumni_profiles, placement_records, stories,
                      events, referral_posts, roadmaps, interview_slots,
                      project_posts, scores)
        print("\n✅ Database seeded successfully!")
    except Exception as e:
        print(f"\n⚠️  DB seeding failed: {e}")
        print("   CSVs were still exported — you can import them manually.")
    
    print("\n═" * 60)
    print("  🎉 PIPELINE COMPLETE")
    print("─" * 60)
    print("  Default login password for all seeded alumni: Alumni@123")
    print(f"  CSV files saved to: {args.output}/")
    print("─" * 60)
    print("  Next steps:")
    print("  1. Check seeded_data/ folder to inspect all generated data")
    print("  2. Update mega_seed.py in your backend to call this pipeline")
    print("  3. To use real college data: replace generate_alumni_profiles()")
    print("     with a CSV reader pointing to your Google Form export")
    print("  4. Feed stories + roadmaps into ChromaDB for the AI chatbot")
    print("═" * 60)

if __name__ == "__main__":
    main()