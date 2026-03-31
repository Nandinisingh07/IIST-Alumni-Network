const API_BASE = "http://127.0.0.1:8000";

export async function chatAPI(message: string): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Chat API failed");
  const data = await res.json();
  return data.response;
}

export async function careerRoadmapAPI(role: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/career-roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Roadmap API failed");
  const data = await res.json();
  return data.roadmap;
}

export interface MentorResult {
  name: string;
  company: string;
  role?: string;
  skills?: string[];
  expertise?: string;
}

export async function mentorMatchAPI(skill: string): Promise<MentorResult[]> {
  const res = await fetch(`${API_BASE}/mentor-match?skill=${encodeURIComponent(skill)}`);
  if (!res.ok) throw new Error("Mentor Match API failed");
  return await res.json();
}

export interface AlumniPayload {
  name: string;
  role: string;
  company: string;
  skills: string[];
  bio?: string;
  graduationYear?: number;
}

export async function addAlumniAPI(data: AlumniPayload): Promise<unknown> {
  const res = await fetch(`${API_BASE}/alumni`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Add Alumni API failed");
  return await res.json();
}

export async function getAlumniAPI(): Promise<MentorResult[]> {
  const res = await fetch(`${API_BASE}/alumni`);
  if (!res.ok) throw new Error("Get Alumni API failed");
  return await res.json();
}
