import axios from 'axios';
import { User, Notification } from './store';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8002';

// Axios instance with default settings for cookies
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor to handle Refresh Token rotation automatically if 401 is encountered
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/login' && originalRequest.url !== '/api/auth/refresh') {
      originalRequest._retry = true;
      try {
        await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        // Clear local storage and redirect to login if refresh fails
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// --- 1. AUTH API ---
export const authApi = {
  register: (data: any) => api.post('/api/auth/register', data).then(r => r.data),
  login: (data: any) => api.post('/api/auth/login', data).then(r => r.data),
  logout: () => api.post('/api/auth/logout').then(r => r.data),
  verifyEmail: (data: { email: string; otp: string }) => api.post('/api/auth/verify-email', data).then(r => r.data),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (data: any) => api.post('/api/auth/reset-password', data).then(r => r.data),
  googleOAuth: () => api.post('/api/auth/google-oauth').then(r => r.data),
  getMe: () => api.get<User>('/api/auth/me').then(r => r.data),
  completeProfile: (data: any) => api.post('/api/auth/complete-profile', data).then(r => r.data),
};

// --- 2. ALUMNI API ---
export const alumniApi = {
  getAlumni: (params: any = {}) => api.get('/api/alumni', { params }).then(r => r.data),
  getFeatured: () => api.get('/api/alumni/featured').then(r => r.data),
  getProfile: (userId: number) => api.get(`/api/alumni/${userId}`).then(r => r.data),
  updateProfile: (userId: number, data: any) => api.put(`/api/alumni/${userId}`, data).then(r => r.data),
  follow: (userId: number) => api.post(`/api/alumni/${userId}/follow`).then(r => r.data),
  unfollow: (userId: number) => api.delete(`/api/alumni/${userId}/follow`).then(r => r.data),
  getFollowers: (userId: number) => api.get(`/api/alumni/${userId}/followers`).then(r => r.data),
  getFollowingStatus: (userId: number) => api.get(`/api/alumni/${userId}/following-status`).then(r => r.data),
};

// --- 3. MENTORS API ---
export const mentorsApi = {
  getMentors: (params: any = {}) => api.get('/api/mentors', { params }).then(r => r.data),
  registerMentor: (data: any) => api.post('/api/mentors/register', data).then(r => r.data),
  updateAvailability: (mentorId: number, slots: any[]) => api.put(`/api/mentors/${mentorId}/availability`, slots).then(r => r.data),
  requestMentorship: (data: { mentor_id: number; message?: string; goal?: string }) => api.post('/api/mentorship/request', data).then(r => r.data),
  getRequests: () => api.get('/api/mentorship/requests').then(r => r.data),
  acceptRequest: (reqId: number) => api.put(`/api/mentorship/requests/${reqId}/accept`).then(r => r.data),
  declineRequest: (reqId: number) => api.put(`/api/mentorship/requests/${reqId}/decline`).then(r => r.data),
  getSessions: () => api.get('/api/mentorship/sessions').then(r => r.data),
  addSessionNotes: (sessId: number, notes: string) => api.post(`/api/mentorship/sessions/${sessId}/notes`, null, { params: { notes } }).then(r => r.data),
  reviewSession: (sessId: number, data: { rating: number; review_text?: string; notes?: string }) => api.post(`/api/mentorship/sessions/${sessId}/review`, data).then(r => r.data),
  getMyMentors: () => api.get('/api/mentorship/my-mentors').then(r => r.data),
  getMyMentees: () => api.get('/api/mentorship/my-mentees').then(r => r.data),
  scheduleSession: (reqId: number, scheduledAt: string, durationMins: number = 30) => api.post(`/api/mentorship/sessions/${reqId}/schedule`, null, { params: { scheduled_at: scheduledAt, duration_mins: durationMins } }).then(r => r.data),
};

// --- 4. ROADMAPS API ---
export const roadmapsApi = {
  getRoadmaps: (params: any = {}) => api.get('/api/roadmaps', { params }).then(r => r.data),
  getPopular: () => api.get('/api/roadmaps/popular').then(r => r.data),
  getRoadmap: (id: number) => api.get(`/api/roadmaps/${id}`).then(r => r.data),
  create: (data: any) => api.post('/api/roadmaps', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/api/roadmaps/${id}`, data).then(r => r.data),
  bookmark: (id: number) => api.post(`/api/roadmaps/${id}/bookmark`).then(r => r.data),
  upvote: (id: number) => api.post(`/api/roadmaps/${id}/review`).then(r => r.data),
  getProgress: (id: number) => api.get(`/api/roadmaps/${id}/progress`).then(r => r.data),
  updateProgress: (id: number, completedMilestones: string[]) => api.post(`/api/roadmaps/${id}/progress`, completedMilestones).then(r => r.data),
};

// --- 5. CHAT API ---
export const chatApi = {
  getRooms: () => api.get('/api/chat/rooms').then(r => r.data),
  createRoom: (data: { type: string; name?: string; avatar_url?: string; member_ids: number[] }) => api.post('/api/chat/rooms', data).then(r => r.data),
  getMessages: (roomId: number, before?: string, limit: number = 50) => api.get(`/api/chat/rooms/${roomId}/messages`, { params: { before, limit } }).then(r => r.data),
  sendMessage: (roomId: number, data: { content: string; type?: string; reply_to_id?: number }) => api.post(`/api/chat/rooms/${roomId}/messages`, data).then(r => r.data),
};

// --- 6. AI ADVISOR API ---
export const aiApi = {
  chat: (message: string, sessionId?: string) => api.post('/api/ai/chat', { message, session_id: sessionId }).then(r => r.data),
  getHistory: () => api.get('/api/ai/chat/history').then(r => r.data),
  createHistory: (title: string) => api.post('/api/ai/chat/history', null, { params: { title } }).then(r => r.data),
  getSessionMessages: (sessionId: number) => api.get(`/api/ai/chat/history/${sessionId}`).then(r => r.data),
  deleteHistory: (sessionId: number) => api.delete(`/api/ai/chat/history/${sessionId}`).then(r => r.data),
  outreachHelper: (data: { alumni_id: number; purpose: string; key_interests: string }) => api.post('/api/ai/outreach-helper', data).then(r => r.data),
  suggestRoadmap: (data: { target_role: string; skills_have: string[]; time_limit_months?: number }) => api.post('/api/ai/roadmap-suggest', data).then(r => r.data),
  reviewResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/ai/resume-review', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  }
};

// --- 7. REFERRALS API ---
export const referralsApi = {
  getReferrals: (params: any = {}) => api.get('/api/referrals', { params }).then(r => r.data),
  getMyPostings: () => api.get('/api/referrals/my-postings').then(r => r.data),
  getMyApplications: () => api.get('/api/referrals/my-applications').then(r => r.data),
  createReferral: (data: any) => api.post('/api/referrals', data).then(r => r.data),
  updateReferral: (id: number, data: any) => api.put(`/api/referrals/${id}`, data).then(r => r.data),
  deleteReferral: (id: number) => api.delete(`/api/referrals/${id}`).then(r => r.data),
  apply: (postId: number, data: { resume_url: string; cover_note?: string }) => api.post(`/api/referrals/${postId}/apply`, data).then(r => r.data),
  getApplicants: (postId: number) => api.get(`/api/referrals/${postId}/applicants`).then(r => r.data),
  updateApplicantStatus: (postId: number, studentId: number, status: string) => api.put(`/api/referrals/${postId}/applicants/${studentId}/status`, null, { params: { status } }).then(r => r.data),
};

// --- 8. EVENTS API ---
export const eventsApi = {
  getEvents: (params: any = {}) => api.get('/api/events', { params }).then(r => r.data),
  getRecordings: () => api.get('/api/events/recordings').then(r => r.data),
  getEvent: (id: number) => api.get(`/api/events/${id}`).then(r => r.data),
  create: (data: any) => api.post('/api/events', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/api/events/${id}`, data).then(r => r.data),
  rsvp: (id: number) => api.post(`/api/events/${id}/rsvp`).then(r => r.data),
  cancelRsvp: (id: number) => api.delete(`/api/events/${id}/rsvp`).then(r => r.data),
  getAttendees: (id: number) => api.get(`/api/events/${id}/attendees`).then(r => r.data),
  postFeedback: (id: number, data: { rating: number; comment?: string }) => api.post(`/api/events/${id}/feedback`, data).then(r => r.data),
  summarize: (id: number, transcript: string) => api.post(`/api/events/${id}/summarize`, null, { params: { transcript } }).then(r => r.data),
};

// --- 9. STORIES API ---
export const storiesApi = {
  getStories: (params: any = {}) => api.get('/api/stories', { params }).then(r => r.data),
  getBookmarked: () => api.get('/api/stories/bookmarked').then(r => r.data),
  getStory: (id: number) => api.get(`/api/stories/${id}`).then(r => r.data),
  create: (data: any) => api.post('/api/stories', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/api/stories/${id}`, data).then(r => r.data),
  like: (id: number) => api.post(`/api/stories/${id}/like`).then(r => r.data),
  bookmark: (id: number) => api.post(`/api/stories/${id}/bookmark`).then(r => r.data),
  getComments: (id: number) => api.get(`/api/stories/${id}/comments`).then(r => r.data),
  postComment: (id: number, data: { content: string; parent_id?: number }) => api.post(`/api/stories/${id}/comments`, data).then(r => r.data),
  deleteComment: (id: number, commentId: number) => api.delete(`/api/stories/${id}/comments/${commentId}`).then(r => r.data),
};

// --- 10. MOCK INTERVIEWS API ---
export const interviewsApi = {
  getSlots: (params: any = {}) => api.get('/api/mock-interviews/slots', { params }).then(r => r.data),
  getMySlots: () => api.get('/api/mock-interviews/my-slots').then(r => r.data),
  getMyBookings: () => api.get('/api/mock-interviews/my-bookings').then(r => r.data),
  postSlot: (data: any) => api.post('/api/mock-interviews/offer', data).then(r => r.data),
  initiatePayment: (price: number) => api.post('/api/mock-interviews/payment/initiate', null, { params: { price } }).then(r => r.data),
  verifyPayment: (params: { order_id: string; payment_id: string; signature: string }) => api.post('/api/mock-interviews/payment/verify', null, { params }).then(r => r.data),
  bookSlot: (slotId: number, paymentId?: string) => api.post(`/api/mock-interviews/book/${slotId}`, null, { params: { payment_id: paymentId } }).then(r => r.data),
  postFeedbackAlumni: (bookingId: number, data: { communication: number; technical_depth: number; problem_solving: number; confidence: number; notes?: string }) => api.post(`/api/mock-interviews/${bookingId}/feedback/alumni`, data).then(r => r.data),
  postFeedbackStudent: (bookingId: number, data: { rating: number; review?: string }) => api.post(`/api/mock-interviews/${bookingId}/feedback/student`, data).then(r => r.data),
};

// --- 11. ANALYTICS API ---
export const analyticsApi = {
  getSummary: (params: any = {}) => api.get('/api/analytics/summary', { params }).then(r => r.data),
  getPlacements: (params: any = {}) => api.get('/api/analytics/placements', { params }).then(r => r.data),
  getCompanies: (params: any = {}) => api.get('/api/analytics/companies', { params }).then(r => r.data),
  getSalaryTrends: (params: any = {}) => api.get('/api/analytics/salary-trends', { params }).then(r => r.data),
  getDomains: (params: any = {}) => api.get('/api/analytics/domains', { params }).then(r => r.data),
  getTopRecruiters: () => api.get('/api/analytics/top-recruiters').then(r => r.data),
  addRecord: (data: any) => api.post('/api/analytics/placement', data).then(r => r.data),
  uploadCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/analytics/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  }
};

// --- 12. GAMIFICATION API ---
export const gamificationApi = {
  getScore: () => api.get('/api/gamification/my-score').then(r => r.data),
  getLeaderboard: (params: any = {}) => api.get('/api/gamification/leaderboard', { params }).then(r => r.data),
  getBadges: () => api.get('/api/gamification/badges').then(r => r.data),
  getMyBadges: () => api.get('/api/gamification/my-badges').then(r => r.data),
};

// --- 13. PROJECTS API ---
export const projectsApi = {
  getProjects: (params: any = {}) => api.get('/api/projects', { params }).then(r => r.data),
  getMyProjects: () => api.get('/api/projects/my-projects').then(r => r.data),
  create: (data: any) => api.post('/api/projects', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/api/projects/${id}`, data).then(r => r.data),
  expressInterest: (id: number, data: { note: string; skills: string[] }) => api.post(`/api/projects/${id}/express-interest`, data).then(r => r.data),
  getInterests: (id: number) => api.get(`/api/projects/${id}/interests`).then(r => r.data),
  acceptCollaborator: (id: number, userId: number) => api.put(`/api/projects/${id}/interests/${userId}/accept`).then(r => r.data),
};

// --- 14. ADMIN API ---
export const adminApi = {
  getStats: () => api.get('/api/admin/stats').then(r => r.data),
  getUsers: (params: any = {}) => api.get('/api/admin/users', { params }).then(r => r.data),
  verifyUser: (userId: number) => api.put(`/api/admin/users/${userId}/verify`).then(r => r.data),
  banUser: (userId: number) => api.put(`/api/admin/users/${userId}/ban`).then(r => r.data),
  getPendingStories: () => api.get('/api/admin/stories/pending').then(r => r.data),
  approveStory: (storyId: number) => api.put(`/api/admin/stories/${storyId}/approve`).then(r => r.data),
  getPendingRoadmaps: () => api.get('/api/admin/roadmaps/pending').then(r => r.data),
  approveRoadmap: (roadmapId: number) => api.put(`/api/admin/roadmaps/${roadmapId}/approve`).then(r => r.data),
  broadcastAnnouncement: (data: { title: string; body: string; target_role?: string }) => api.post('/api/admin/announcements', data).then(r => r.data),
};

// --- 15. NOTIFICATIONS API ---
export const notificationsApi = {
  getNotifications: (unreadOnly?: boolean) => api.get<Notification[]>('/api/notifications', { params: { unread_only: unreadOnly } }).then(r => r.data),
  markRead: (id: number) => api.put(`/api/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.put('/api/notifications/read-all').then(r => r.data),
  deleteNotification: (id: number) => api.delete(`/api/notifications/${id}`).then(r => r.data),
};

// Expose legacy wrapper APIs for backwards compatibility
export const getAlumniAPI = () => alumniApi.getAlumni();
export const addAlumniAPI = (data: any) => alumniApi.updateProfile(data.user_id, data);
export const chatAPI = (msg: string) => aiApi.chat(msg);
export const careerRoadmapAPI = (role: string) => roadmapsApi.getRoadmaps({ domain: role }).then(arr => arr.map((r: any) => r.title));
export const mentorMatchAPI = (skill: string) => mentorsApi.getMentors({ domain: skill });

export interface MentorResult {
  id?: number;
  name: string;
  company: string;
  role?: string;
  skills?: string[] | string;
  expertise?: string;
}

export interface AlumniPayload {
  name: string;
  role: string;
  company: string;
  skills: string[];
  bio?: string;
  graduationYear?: number;
}

