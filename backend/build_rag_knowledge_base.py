"""
═══════════════════════════════════════════════════════════════════
RAG KNOWLEDGE BASE BUILDER — Alumni AI Chatbot
═══════════════════════════════════════════════
Feeds alumni stories, roadmaps, and placement data into ChromaDB
so the AI chatbot can answer real, context-aware questions like:

  "Which alumni from our college got into Google?"
  "What skills do I need for a data science role?"
  "How should a 3rd year CSE student prepare for placements?"

Run AFTER alumni_data_pipeline.py has seeded the database.

Install:
  pip install chromadb langchain langchain-openai sentence-transformers
  
Usage:
  python build_rag_knowledge_base.py --csv-dir ./seeded_data
═══════════════════════════════════════════════════════════════════
"""

import os
import json
import argparse
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions

# ── Config ────────────────────────────────────────────────────────
CHROMA_PATH    = os.getenv("CHROMADB_PATH", "./chromadb_store")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")  # or use local embeddings


def get_embedding_fn():
    """Use OpenAI embeddings if key available, else local sentence-transformers."""
    if OPENAI_API_KEY:
        return embedding_functions.OpenAIEmbeddingFunction(
            api_key=OPENAI_API_KEY,
            model_name="text-embedding-3-small"
        )
    # Free local fallback — no API key needed
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )


def build_alumni_documents(alumni_csv: str) -> list[dict]:
    """
    Convert each alumni profile into a natural-language document
    that the LLM can reason about.
    """
    df  = pd.read_csv(alumni_csv)
    docs = []
    for _, row in df.iterrows():
        skills  = json.loads(row.get("skills", "[]")) if isinstance(row.get("skills"), str) else []
        domains = json.loads(row.get("domains", "[]")) if isinstance(row.get("domains"), str) else []
        
        text = f"""
Alumni Profile:
Name: {row.get('full_name', 'Unknown')}
Graduation Year: {row.get('graduation_year', 'N/A')} (Class of {row.get('graduation_year', 'N/A')})
Branch: {row.get('branch', 'N/A')}
Current Company: {row.get('current_company', 'N/A')}
Current Role: {row.get('current_role', 'N/A')}
Location: {row.get('location', 'N/A')}
Domain: {', '.join(domains)}
Skills: {', '.join(skills)}
Is Mentor: {'Yes' if row.get('is_mentor') else 'No'}
LinkedIn: {row.get('linkedin_url', 'N/A')}
Bio: {row.get('bio', '')}
        """.strip()
        
        docs.append({
            "id":       f"alumni_{row.get('email', '').replace('@','_').replace('.','_')}",
            "text":     text,
            "metadata": {
                "type":    "alumni_profile",
                "company": str(row.get("current_company", "")),
                "branch":  str(row.get("branch", "")),
                "year":    str(row.get("graduation_year", "")),
                "domain":  domains[0] if domains else "",
            }
        })
    return docs


def build_placement_documents(placement_csv: str) -> list[dict]:
    """Aggregate placement records into statistical summaries."""
    df   = pd.read_csv(placement_csv)
    docs = []
    
    # Company-level summary
    for company, grp in df.groupby("company"):
        avg_pkg  = grp["package_lpa"].mean()
        max_pkg  = grp["package_lpa"].max()
        branches = grp["branch"].value_counts().to_dict()
        years    = sorted(grp["batch_year"].unique().tolist())
        roles    = grp["role"].unique().tolist()[:5]
        
        text = f"""
Placement Data for {company}:
Total placements: {len(grp)}
Average package: ₹{avg_pkg:.1f} LPA
Highest package: ₹{max_pkg:.1f} LPA
Batch years that got placed: {', '.join(map(str, years))}
Branches placed: {', '.join(f"{b} ({c} students)" for b, c in branches.items())}
Roles offered: {', '.join(roles)}
        """.strip()
        
        docs.append({
            "id":       f"placement_company_{company.replace(' ', '_').lower()}",
            "text":     text,
            "metadata": {"type": "placement_data", "company": company}
        })
    
    # Branch-level summary
    for branch, grp in df.groupby("branch"):
        top_cos = grp["company"].value_counts().head(5).to_dict()
        avg_pkg = grp["package_lpa"].mean()
        
        text = f"""
Placement Statistics for {branch} branch:
Total placement records: {len(grp)}
Average package across all batches: ₹{avg_pkg:.1f} LPA
Top recruiting companies: {', '.join(f"{c} ({n} students)" for c, n in top_cos.items())}
Year range: {grp['batch_year'].min()} to {grp['batch_year'].max()}
        """.strip()
        
        docs.append({
            "id":       f"placement_branch_{branch.replace(' ', '_').lower()}",
            "text":     text,
            "metadata": {"type": "placement_data", "branch": branch}
        })
    
    return docs


def build_story_documents(stories_csv: str) -> list[dict]:
    """Feed alumni stories into RAG so AI can cite real experiences."""
    df   = pd.read_csv(stories_csv)
    docs = []
    for _, row in df.iterrows():
        # Truncate content to first 800 chars for embedding efficiency
        content_preview = str(row.get("content", ""))[:800]
        text = f"""
Alumni Story: {row.get('title', '')}
Type: {row.get('type', '')}
Company: {row.get('company', '')}
Role: {row.get('role', '')}
Story excerpt:
{content_preview}
        """.strip()
        
        docs.append({
            "id":       f"story_{_}",
            "text":     text,
            "metadata": {
                "type":    "alumni_story",
                "company": str(row.get("company", "")),
                "role":    str(row.get("role", "")),
                "title":   str(row.get("title", "")),
            }
        })
    return docs


def build_roadmap_documents(roadmaps_csv: str) -> list[dict]:
    """Feed roadmaps so AI can recommend specific learning paths."""
    df   = pd.read_csv(roadmaps_csv)
    docs = []
    for _, row in df.iterrows():
        milestones = json.loads(row.get("milestones", "[]")) if isinstance(row.get("milestones"), str) else []
        milestone_titles = [m.get("title", "") for m in milestones]
        
        text = f"""
Career Roadmap: {row.get('title', '')}
Domain: {row.get('domain', '')}
Difficulty: {row.get('difficulty', '')}
Estimated Duration: {row.get('estimated_months', 'N/A')} months
Tags: {row.get('tags', '')}
Description: {row.get('description', '')}
Key milestones in order: {' → '.join(milestone_titles)}
        """.strip()
        
        docs.append({
            "id":       f"roadmap_{_}",
            "text":     text,
            "metadata": {
                "type":       "roadmap",
                "domain":     str(row.get("domain", "")),
                "difficulty": str(row.get("difficulty", "")),
                "title":      str(row.get("title", "")),
            }
        })
    return docs


def add_custom_college_knowledge() -> list[dict]:
    """
    Hardcoded general knowledge about Indian engineering college career paths.
    Replace / extend this with your actual college's information.
    
    TO CUSTOMIZE FOR YOUR COLLEGE:
    - Replace "our college" with your college name
    - Add your college's actual placement stats
    - Add your actual department information
    - Add your college's specific clubs, achievements, rankings
    """
    docs = [
        {
            "id": "college_general_advice",
            "text": """
General Career Advice for Engineering Students:
- Start DSA preparation from 2nd year, not 3rd year
- Build at least 2-3 GitHub projects before placement season
- Get internships in 3rd year — they often convert to PPOs (Pre-Placement Offers)
- CGPA matters for shortlisting (most companies filter at 6.5+ or 7.0+)
- Soft skills matter — communication is heavily evaluated in HR rounds
- Use LinkedIn actively from 1st year — connect with seniors and alumni
- Attend hackathons — companies actively scout participants
- Core branch students: don't limit yourself to core roles; many ECE/ME students get SWE roles
            """.strip(),
            "metadata": {"type": "general_knowledge", "topic": "career_advice"}
        },
        {
            "id": "interview_preparation_guide",
            "text": """
How to Prepare for Campus Placements:
DSA Preparation:
- Focus on: Arrays, Strings, Linked Lists, Trees, Graphs, DP, Recursion
- Practice on: LeetCode (primary), GeeksforGeeks, Codeforces
- Target: 150-200 problems before placement season
- Time yourself: companies give 60-90 mins for 2-3 problems

System Design (for product companies):
- Study: scalability, load balancing, databases, caching, message queues
- Resource: System Design Primer (GitHub), Grokking System Design
- Even freshers at Google/Amazon face system design rounds

Behavioral Questions:
- Prepare STAR-format answers for: leadership, conflict, failure, teamwork
- Common questions: "Tell me about yourself", "Why this company?", "Greatest achievement"

Resume Tips:
- Keep to 1 page for freshers
- Quantify everything: "improved performance by 40%" not "improved performance"
- List only relevant skills
- GitHub link is more valuable than a portfolio website
            """.strip(),
            "metadata": {"type": "general_knowledge", "topic": "interview_prep"}
        },
        {
            "id": "domain_career_paths",
            "text": """
Career Path Guide by Domain:

SOFTWARE DEVELOPMENT:
Entry roles: SDE-1, Junior Developer, Associate Engineer
Top companies: Google, Microsoft, Amazon, Flipkart, Razorpay
Key skills: DSA, system design, one backend language, databases
Salary range (fresher 2024): ₹4-45 LPA depending on company tier

DATA SCIENCE / ML:
Entry roles: Data Analyst, Junior Data Scientist, ML Engineer
Top companies: Amazon, Microsoft, Flipkart, Fractal Analytics, Mu Sigma
Key skills: Python, SQL, statistics, scikit-learn, one deep learning framework
Salary range (fresher 2024): ₹6-30 LPA

CORE ENGINEERING (ECE/EEE/ME):
Entry roles: Graduate Engineer Trainee, Junior Engineer
Top companies: L&T, Bosch, Siemens, Tata Motors, DRDO, ISRO, ABB
Key skills: domain-specific tools (MATLAB, AutoCAD, PLC) + soft skills
Salary range (fresher 2024): ₹3.5-15 LPA

FINANCE / ANALYTICS:
Entry roles: Business Analyst, Analyst, Associate
Top companies: Goldman Sachs, JP Morgan, Deloitte, KPMG, EY
Key skills: Excel, SQL, statistics, financial modeling, Python
Salary range (fresher 2024): ₹8-40 LPA
            """.strip(),
            "metadata": {"type": "general_knowledge", "topic": "domain_paths"}
        },
    ]
    return docs


def ingest_into_chromadb(all_docs: list[dict], chroma_path: str):
    """Ingest all documents into ChromaDB."""
    client     = chromadb.PersistentClient(path=chroma_path)
    embed_fn   = get_embedding_fn()
    collection = client.get_or_create_collection(
        name="alumni_knowledge_base",
        embedding_function=embed_fn,
        metadata={"description": "Alumni network knowledge base for RAG chatbot"}
    )
    
    # Batch insert (ChromaDB handles up to 5000 at once)
    batch_size = 100
    for i in range(0, len(all_docs), batch_size):
        batch = all_docs[i:i + batch_size]
        try:
            collection.upsert(
                ids       = [d["id"]       for d in batch],
                documents = [d["text"]     for d in batch],
                metadatas = [d["metadata"] for d in batch],
            )
            print(f"  ✅ Ingested batch {i//batch_size + 1} ({len(batch)} docs)")
        except Exception as e:
            print(f"  ⚠️  Batch {i//batch_size + 1} failed: {e}")
    
    count = collection.count()
    print(f"\n  📚 Total documents in knowledge base: {count}")
    return collection


def test_rag_query(chroma_path: str):
    """Test a few sample queries to verify RAG is working."""
    client     = chromadb.PersistentClient(path=chroma_path)
    embed_fn   = get_embedding_fn()
    collection = client.get_collection(
        name="alumni_knowledge_base",
        embedding_function=embed_fn
    )
    
    test_queries = [
        "Which alumni got into Google?",
        "How should a CSE student prepare for placements?",
        "What is the average package for TCS?",
        "Roadmap for becoming a data scientist",
        "Alumni who are mentors in software development",
    ]
    
    print("\n🧪 Testing RAG queries:")
    print("─" * 50)
    for query in test_queries:
        results = collection.query(query_texts=[query], n_results=2)
        top_doc = results["documents"][0][0][:150] if results["documents"] else "No results"
        doc_type = results["metadatas"][0][0].get("type", "?") if results["metadatas"] else "?"
        print(f"\nQ: {query}")
        print(f"   [{doc_type}] {top_doc}...")


def main():
    parser = argparse.ArgumentParser(description="Build RAG knowledge base for Alumni AI chatbot")
    parser.add_argument("--csv-dir",    default="./seeded_data", help="Directory with CSV exports from data pipeline")
    parser.add_argument("--chroma-dir", default=CHROMA_PATH,     help="ChromaDB storage path")
    parser.add_argument("--test",       action="store_true",     help="Run test queries after building")
    args = parser.parse_args()
    
    print("═" * 60)
    print("  ALUMNI AI — RAG KNOWLEDGE BASE BUILDER")
    print("═" * 60)
    
    all_docs = []
    
    # 1. Alumni profiles
    alumni_csv = os.path.join(args.csv_dir, "alumni_profiles.csv")
    if os.path.exists(alumni_csv):
        docs = build_alumni_documents(alumni_csv)
        all_docs.extend(docs)
        print(f"  ✅ {len(docs)} alumni profile documents")
    else:
        print(f"  ⚠️  alumni_profiles.csv not found in {args.csv_dir}")
    
    # 2. Placement records
    placement_csv = os.path.join(args.csv_dir, "placement_records.csv")
    if os.path.exists(placement_csv):
        docs = build_placement_documents(placement_csv)
        all_docs.extend(docs)
        print(f"  ✅ {len(docs)} placement statistic documents")
    
    # 3. Stories
    stories_csv = os.path.join(args.csv_dir, "stories.csv")
    if os.path.exists(stories_csv):
        docs = build_story_documents(stories_csv)
        all_docs.extend(docs)
        print(f"  ✅ {len(docs)} alumni story documents")
    
    # 4. Roadmaps
    roadmaps_csv = os.path.join(args.csv_dir, "roadmaps.csv")
    if os.path.exists(roadmaps_csv):
        docs = build_roadmap_documents(roadmaps_csv)
        all_docs.extend(docs)
        print(f"  ✅ {len(docs)} roadmap documents")
    
    # 5. Static college knowledge
    docs = add_custom_college_knowledge()
    all_docs.extend(docs)
    print(f"  ✅ {len(docs)} general knowledge documents")
    
    print(f"\n  📦 Total documents to ingest: {len(all_docs)}")
    print(f"\n🗃️  Ingesting into ChromaDB at {args.chroma_dir}...")
    
    ingest_into_chromadb(all_docs, args.chroma_dir)
    
    if args.test:
        test_rag_query(args.chroma_dir)
    
    print("\n═" * 60)
    print("  ✅ KNOWLEDGE BASE BUILT SUCCESSFULLY")
    print("─" * 60)
    print("  Update your backend ai.py to point to:")
    print(f"  CHROMADB_PATH = '{args.chroma_dir}'")
    print("  Collection name: 'alumni_knowledge_base'")
    print("═" * 60)


if __name__ == "__main__":
    main()