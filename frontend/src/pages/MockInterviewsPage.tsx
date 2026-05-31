import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { interviewsApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Video, Calendar, Clock, CreditCard, Sparkles, Star, Clipboard, Award, ShieldAlert } from 'lucide-react';

interface Slot {
  id: number;
  alumni_id: number;
  type: string;
  domain: string;
  scheduled_at: string;
  duration_mins: number;
  price: number;
  slots_total: number;
  slots_booked: number;
  meet_link?: string;
  status: string;
  mentor: any;
}

interface Booking {
  id: number;
  slot_id: number;
  student_id: number;
  payment_id?: string;
  status: string;
  feedback_by_alumni?: any;
  feedback_by_student?: any;
  rating?: number;
  created_at: string;
  slot: Slot;
  student: any;
}

export default function MockInterviewsPage() {
  const { user } = useAppStore();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  // Feedback States
  const [activeBookingForFeedback, setActiveBookingForFeedback] = useState<Booking | null>(null);
  const [feedbackSliders, setFeedbackSliders] = useState({
    communication: 3,
    technical_depth: 3,
    problem_solving: 3,
    confidence: 3,
    notes: ''
  });

  // Offer Slot States
  const [offeringSlotMode, setOfferingSlotMode] = useState(false);
  const [offerForm, setOfferForm] = useState({
    type: 'technical',
    domain: 'Software Engineering',
    scheduled_at: '',
    duration_mins: 45,
    price: 0
  });

  const fetchData = async () => {
    try {
      const data = await interviewsApi.getSlots();
      setSlots(data);
      if (user?.role === 'alumni') {
        const slotsData = await interviewsApi.getMySlots();
        setMySlots(slotsData);
      }
      if (user?.role === 'student') {
        const bookingsData = await interviewsApi.getMyBookings();
        setBookings(bookingsData);
      }
    } catch {
      toast.error('Failed to load mock interview slots');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookSlot = async (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const executeBooking = async (slotId: number, isPaid: boolean, price: number) => {
    try {
      let paymentId = undefined;
      if (isPaid) {
        // 1. Call Payment Initiation
        const order = await interviewsApi.initiatePayment(price);
        
        // 2. Open Simulated Checkout
        const dummyPayId = `pay_${Math.random().toString(36).substring(7)}`;
        toast.info(`Initiating checkout order ${order.id}...`);
        
        // 3. Verify Payment
        await interviewsApi.verifyPayment({
          order_id: order.id,
          payment_id: dummyPayId,
          signature: 'mock_signature_hash_xyz'
        });
        paymentId = dummyPayId;
        toast.success('Simulated Payment Verified!');
      }

      // 4. Save Booking
      await interviewsApi.bookSlot(slotId, paymentId);
      toast.success('Mock Interview Booked successfully!');
      setSelectedSlot(null);
      fetchData();
    } catch (e) {
      toast.error('Failed to book session');
    }
  };

  const handleOfferSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await interviewsApi.postSlot(offerForm);
      toast.success('Interview slot offered successfully!');
      setOfferingSlotMode(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to offer slot. Are you registered as a Mentor?');
    }
  };

  const handleSubmitFeedbackAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingForFeedback) return;
    try {
      await interviewsApi.postFeedbackAlumni(activeBookingForFeedback.id, feedbackSliders);
      toast.success('Candidate feedback saved successfully!');
      setActiveBookingForFeedback(null);
      fetchData();
    } catch {
      toast.error('Failed to save candidate feedback');
    }
  };

  // Compile Radar data from completed booking feedback
  const getRadarData = (b: Booking) => {
    if (!b.feedback_by_alumni) return [];
    return [
      { subject: 'Communication', score: b.feedback_by_alumni.communication, fullMark: 5 },
      { subject: 'Technical Depth', score: b.feedback_by_alumni.technical_depth, fullMark: 5 },
      { subject: 'Problem Solving', score: b.feedback_by_alumni.problem_solving, fullMark: 5 },
      { subject: 'Confidence', score: b.feedback_by_alumni.confidence, fullMark: 5 },
    ];
  };

  return (
    <div className="container mx-auto py-8 px-4 text-[#f9fafb] space-y-10">
      
      {/* Platform Header */}
      <div className="flex justify-between items-end bg-[#111827]/80 border border-[#374151]/30 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(152_60%_42%_/_0.1),_transparent_50%)]" />
        <div className="relative z-10 space-y-3">
          <Badge className="bg-white/10 text-white border-white/20">
            <Award className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Mock Marketplace
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-none font-display">
            Mock Interview <span className="text-gradient">Marketplace</span>
          </h1>
          <p className="text-sm text-[#9ca3af] max-w-md">
            Schedule 1-on-1 mock interviews with technical leaders. Practice coding, system design, and resume review rounds.
          </p>
        </div>

        {user?.role === 'alumni' && (
          <Button onClick={() => setOfferingSlotMode(true)} className="relative z-10 gradient-hero h-12 rounded-xl text-white font-bold gap-2 shadow-lg border-0 px-6">
            + Offer Slot
          </Button>
        )}
      </div>

      {/* Offer Slot Dialog */}
      {offeringSlotMode && (
        <Dialog open={offeringSlotMode} onOpenChange={setOfferingSlotMode}>
          <DialogContent className="bg-[#111827] border-[#374151] rounded-3xl text-white">
            <DialogHeader>
              <DialogTitle className="font-display text-white text-xl">Offer Interview Slot</DialogTitle>
              <DialogDescription className="text-xs text-[#9ca3af]">Provide slot details for students to schedule a mock session with you.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleOfferSlot} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Round Type</label>
                <select
                  value={offerForm.type}
                  onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
                  className="w-full bg-[#1f2937]/50 border border-[#374151] rounded-xl h-11 px-3 text-white text-sm"
                >
                  <option value="technical">Technical Round</option>
                  <option value="hr">HR / Behavioral Round</option>
                  <option value="system-design">System Design Round</option>
                  <option value="case-study">Case Study Round</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Target Domain</label>
                <Input
                  required
                  placeholder="e.g. Frontend Engineering, Data Science"
                  value={offerForm.domain}
                  onChange={(e) => setOfferForm({ ...offerForm, domain: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9ca3af] uppercase">Date & Time</label>
                  <Input
                    required
                    type="datetime-local"
                    value={offerForm.scheduled_at}
                    onChange={(e) => setOfferForm({ ...offerForm, scheduled_at: e.target.value })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9ca3af] uppercase">Duration (mins)</label>
                  <Input
                    type="number"
                    value={offerForm.duration_mins}
                    onChange={(e) => setOfferForm({ ...offerForm, duration_mins: parseInt(e.target.value) })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Slot Rate (INR, 0 = free sponsored)</label>
                <Input
                  type="number"
                  placeholder="0 to 999"
                  value={offerForm.price}
                  onChange={(e) => setOfferForm({ ...offerForm, price: parseInt(e.target.value) })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gradient-hero font-bold border-0 text-white shadow-lg mt-2">
                Publish Interview Slot
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Book Slot Confirmation Modal */}
      {selectedSlot && (
        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent className="bg-[#111827] border-[#374151] text-white rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-white text-xl">Confirm Interview Booking</DialogTitle>
              <DialogDescription className="text-xs text-[#9ca3af]">Please review the schedule details for your mock session.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-[#1f2937]/40 p-4 rounded-xl border border-[#374151]/30 text-sm space-y-2">
                <p><b>Interviewer:</b> {selectedSlot.mentor.full_name}</p>
                <p><b>Round Type:</b> {selectedSlot.type.toUpperCase()}</p>
                <p><b>Scheduled:</b> {new Date(selectedSlot.scheduled_at).toLocaleString()}</p>
                <p><b>Rate:</b> {selectedSlot.price === 0 ? 'FREE (Sponsored)' : `₹${selectedSlot.price}`}</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setSelectedSlot(null)} variant="ghost" className="flex-1 h-12 rounded-xl hover:bg-[#1f2937] text-[#9ca3af]">
                  Cancel
                </Button>
                <Button 
                  onClick={() => executeBooking(selectedSlot.id, selectedSlot.price > 0, selectedSlot.price)}
                  className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white border-0 shadow-lg gap-2"
                >
                  <CreditCard className="h-4.5 w-4.5" /> 
                  {selectedSlot.price > 0 ? 'Pay & Book' : 'Book Free Slot'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Alumni Post Candidate Feedback Modal */}
      {activeBookingForFeedback && (
        <Dialog open={!!activeBookingForFeedback} onOpenChange={() => setActiveBookingForFeedback(null)}>
          <DialogContent className="bg-[#111827] border-[#374151] text-white rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-white text-xl">Candidate Performance Feedback</DialogTitle>
              <DialogDescription className="text-xs text-[#9ca3af]">Assess the student candidate performance across skill metrics (1 to 5 stars).</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitFeedbackAlumni} className="space-y-4 pt-2">
              {[
                { label: 'Communication Skills', key: 'communication' },
                { label: 'Technical Depth / Knowledge', key: 'technical_depth' },
                { label: 'Problem Solving & Logic', key: 'problem_solving' },
                { label: 'Confidence & Behavior', key: 'confidence' },
              ].map(s => (
                <div key={s.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#9ca3af]">
                    <span>{s.label}</span>
                    <span>{(feedbackSliders as any)[s.key]}/5</span>
                  </div>
                  <Slider 
                    value={[(feedbackSliders as any)[s.key]]}
                    min={1} 
                    max={5} 
                    step={1} 
                    onValueChange={(val) => setFeedbackSliders({ ...feedbackSliders, [s.key]: val[0] })}
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Review Comments / Notes</label>
                <Textarea
                  placeholder="Share constructive feedback on their coding approach, strengths, and areas to work on..."
                  value={feedbackSliders.notes}
                  onChange={(e) => setFeedbackSliders({ ...feedbackSliders, notes: e.target.value })}
                  rows={3}
                  className="bg-[#1f2937]/50 border-[#374151]"
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gradient-hero font-bold border-0 text-white shadow-lg mt-2">
                Submit Candidate Feedback
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ──── STUDENT VIEW: ACTIVE BOOKINGS AND ANALYTICS RADAR CHART ──── */}
      {user?.role === 'student' && bookings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart skill scores */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 flex flex-col items-center">
            <h3 className="font-extrabold text-white text-base mb-6 font-display self-start">My Skills Radar Chart</h3>
            {bookings.some(b => b.feedback_by_alumni) ? (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart cx="50%" cy="50%" radius="70%" data={getRadarData(bookings.filter(b => b.feedback_by_alumni)[0])}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={11} />
                  <PolarRadiusAxis stroke="#374151" />
                  <Radar name="Student Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex flex-col justify-center items-center text-center p-8 text-[#9ca3af] space-y-2">
                <ShieldAlert className="h-8 w-8 text-[#374151]" />
                <h4 className="font-bold text-white text-sm">No Scores Generated Yet</h4>
                <p className="text-xs">Once your mock interviewer posts feedback, your skill dimensions radar chart will render here.</p>
              </div>
            )}
          </Card>

          {/* Booked Sessions History List */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-white text-base font-display">My Booked Sessions</h3>
            <div className="space-y-3 overflow-y-auto max-h-[260px] scrollbar-thin">
              {bookings.map(b => (
                <div key={b.id} className="p-4 bg-[#1f2937]/40 border border-[#374151]/20 rounded-xl flex justify-between items-center text-sm">
                  <div>
                    <h4 className="font-bold text-white">{b.slot.type.toUpperCase()} - {b.slot.domain}</h4>
                    <p className="text-xs text-[#9ca3af] mt-0.5">Interviewer: {b.slot.mentor.full_name}</p>
                    <p className="text-[10px] text-[#9ca3af]">{new Date(b.slot.scheduled_at).toLocaleString()}</p>
                  </div>
                  {b.status === 'completed' && b.feedback_by_alumni ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-2.5 py-1">Feedback Ready</Badge>
                  ) : (
                    <a href={b.slot.meet_link} target="_blank" rel="noreferrer" className="h-9 px-4 bg-[#6366f1] hover:bg-[#6366f1]/90 rounded-lg text-white font-bold flex items-center gap-1.5 text-xs shadow-md">
                      <Video className="h-3.5 w-3.5" /> Join Meet
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ──── ALUMNI VIEW: MANAGE POSTED SLOTS ──── */}
      {user?.role === 'alumni' && mySlots.length > 0 && (
        <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
          <h3 className="font-extrabold text-white text-base mb-4 font-display">My Offered Slots</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySlots.map(s => {
              // Fetch booking associated with slot
              return (
                <div key={s.id} className="p-4 bg-[#1f2937]/40 border border-[#374151]/20 rounded-xl flex justify-between items-center text-sm">
                  <div>
                    <h4 className="font-bold text-white">{s.type.toUpperCase()} - {s.domain}</h4>
                    <p className="text-xs text-[#9ca3af]">{new Date(s.scheduled_at).toLocaleString()}</p>
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">Rate: {s.price === 0 ? 'FREE' : `₹${s.price}`}</p>
                  </div>
                  {s.status === 'booked' ? (
                    <Button 
                      onClick={() => {
                        // Find booking for this slot ID
                        interviewsApi.getSlots().then(() => {
                          setActiveBookingForFeedback({ id: s.id, slot: s } as any);
                        });
                      }}
                      className="bg-[#8b5cf6] text-white hover:bg-[#8b5cf6]/90 rounded-lg font-bold text-xs h-9 px-4 border-0"
                    >
                      Post Feedback
                    </Button>
                  ) : (
                    <Badge className="bg-[#1f2937] text-[#9ca3af] border-[#374151] text-xs px-2.5 py-1">Available</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ──── AVAILABLE INTERVIEW SLOTS MARKETPLACE GRID ──── */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-display text-white">Available Mock Slots</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map(s => (
            <Card key={s.id} className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl overflow-hidden hover-lift hover:shadow-card-hover transition-all duration-300 relative border-gradient">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge className="bg-[#1f2937]/80 text-[#9ca3af] border-0 text-[10px] uppercase font-bold py-1">
                    {s.type}
                  </Badge>
                  <Badge className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border-0 ${
                    s.price === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#6366f1]/10 text-[#6366f1]'
                  }`}>
                    {s.price === 0 ? 'Free' : `₹${s.price}`}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-white leading-none">{s.domain}</h3>
                  <p className="text-xs text-[#9ca3af] flex items-center gap-1.5 mt-2">
                    <Calendar className="h-3.5 w-3.5" /> {new Date(s.scheduled_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-[#9ca3af] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({s.duration_mins} mins)
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#374151]/30">
                  <img src={s.mentor.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Avatar" className="h-9 w-9 rounded-full object-cover" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{s.mentor.full_name}</h4>
                    <p className="text-[10px] text-[#9ca3af] truncate">{s.mentor.branch} Batch {s.mentor.graduation_year}</p>
                  </div>
                </div>

                {user?.role === 'student' && (
                  <Button 
                    onClick={() => handleBookSlot(s)}
                    className="w-full h-10 rounded-xl gradient-hero hover:opacity-95 text-white font-bold text-xs shadow-md border-0"
                  >
                    Schedule Interview
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {slots.length === 0 && (
            <p className="text-sm text-[#9ca3af] col-span-full text-center py-10 font-bold">No available interview slots listed currently.</p>
          )}
        </div>
      </div>

    </div>
  );
}
