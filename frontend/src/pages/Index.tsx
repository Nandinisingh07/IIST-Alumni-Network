import { Link } from 'react-router-dom';
import {
  GraduationCap, MessageSquare, Users, Route, Sparkles, ArrowRight,
  Bot, Heart, Zap, Star, ChevronRight, Brain, Compass, Award, 
  Briefcase, Calendar, Globe, UserPlus, Search, Building2, Terminal, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

const features = [
  {
    icon: Users,
    title: 'Alumni Directory',
    description: 'Browse and connect with verified IIST alumni across industries. Filter by company, skill, or batch year.',
    link: '/directory',
    cta: 'Browse Directory',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: Search,
    title: 'Mentor Matching',
    description: "Find the perfect mentor by skill or expertise. Get matched with alumni who've walked your path.",
    link: '/mentors',
    cta: 'Find Mentors',
    color: 'from-violet-500 to-violet-600',
  },
  {
    icon: Bot,
    title: 'AI Career Advisor',
    description: 'Get personalized career advice from our AI trained on IIST alumni success stories and industry insights.',
    link: '/ai-chat',
    cta: 'Start Chatting',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: Compass,
    title: 'Career Roadmaps',
    description: 'Generate step-by-step learning paths for any career goal. Track your progress along the way.',
    link: '/roadmap',
    cta: 'Explore Paths',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: Briefcase,
    title: 'Job Board',
    description: 'Exclusive job opportunities and referrals shared by IIST alumni at top companies worldwide.',
    link: '/jobs',
    cta: 'View Jobs',
    color: 'from-amber-500 to-amber-600',
  },
  {
    icon: Calendar,
    title: 'Events & Meetups',
    description: 'Join webinars, workshops, reunions, and networking events hosted by the IIST alumni community.',
    link: '/events',
    cta: 'View Events',
    color: 'from-pink-500 to-pink-600',
  },
];

const stats = [
  { value: '500+', label: 'Alumni Connected', icon: Users },
  { value: '50+', label: 'Companies', icon: Building2 },
  { value: '120+', label: 'Active Mentors', icon: Heart },
  { value: '24/7', label: 'AI Available', icon: Zap },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Senior ML Engineer at Google DeepMind', batch: '2018', quote: 'Through this platform, I found a mentor who helped me ace my coding interview. The alumni network is incredibly supportive.' },
  { name: 'Nandini Singh', role: 'AI Engineer at Google', batch: '2021', quote: 'The AI career advisor gave me a clear roadmap. I landed my dream cloud SDE role within 6 months of following the plan.' },
  { name: 'Amit Verma', role: 'Lead PM at Amazon', batch: '2015', quote: 'The job board referrals are gold! Got a direct referral from a senior alumnus and that made all the difference.' },
];

const topCompanies = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Razorpay', 'Deloitte', 'TCS', 'Infosys', 'Adobe', 'Goldman Sachs', 'Oracle', 'IBM'];

export default function Index() {
  const { user } = useAppStore();

  return (
    <div className="space-y-12">
      {/* ──── HERO ──── */}
      <section className="relative overflow-hidden rounded-3xl gradient-hero p-8 sm:p-14 lg:p-16 border border-[#374151]/30 shadow-glow-primary">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.15),_transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(circle,_hsl(250_55%_42%_/_0.2),_transparent_70%)]" />
        <div className="absolute top-8 right-8 hidden lg:block animate-float">
          <div className="relative">
            <div className="h-32 w-32 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <GraduationCap className="h-16 w-16 text-white/20" />
            </div>
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center" style={{ animationDelay: '1s' }}>
              <Heart className="h-8 w-8 text-white/20" />
            </div>
          </div>
        </div>

        <div className="relative max-w-2xl space-y-6">
          <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold tracking-wide">
            <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-yellow-400" /> Indore Institute of Science & Technology
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] font-display">
            Your Alumni{' '}
            <span className="relative inline-block">
              <span className="text-gradient-accent">Network</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="hsl(38 92% 50%)" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </span>
            {' '}Platform
          </h1>

          <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-xl">
            Welcome back, <b>{user?.full_name}</b>! Connect with verified IIST alumni, browse referrals jobs, draft cold emails with AI, and practice mock interviews.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/directory">
              <Button size="lg" className="bg-white text-indigo-950 hover:bg-white/90 shadow-lg gap-2 h-13 px-8 text-sm rounded-2xl font-bold border-0">
                <Users className="h-5 w-5" />
                Explore Alumni
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/ai-chat">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 h-13 px-8 text-sm rounded-2xl font-bold backdrop-blur-sm">
                <Bot className="h-5 w-5" />
                Consult AI Advisor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──── STATS BAR ──── */}
      <section className="-mt-16 relative z-10 mx-4 sm:mx-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ value, label, icon: Icon }, i) => (
            <Card key={label} className="shadow-elevated border-0 bg-[#111827]/90 border border-[#374151]/30 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-hero shadow-md">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white leading-none">{value}</div>
                  <div className="text-xs text-[#9ca3af] mt-1 font-bold">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ──── ADDITIONAL PLATFORM HUB MODULES ──── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full border-[#374151] text-[#9ca3af]">
            <Terminal className="h-3 w-3 mr-1.5 text-[#6366f1]" /> Core Services
          </Badge>
          <h2 className="text-3xl font-bold text-white font-display">
            Interactive <span className="text-gradient">Modules</span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Story Wall', desc: 'Read blogs shared by seniors.', link: '/stories', icon: BookOpen, tag: 'Stories' },
            { title: 'Mock Marketplace', desc: 'Book interview slot sessions.', link: '/mock-interviews', icon: Award, tag: 'Interviews' },
            { title: 'Project Boards', desc: 'Partner on startup projects.', link: '/projects', icon: Compass, tag: 'Collab' },
            { title: 'Leaderboard', desc: 'Contribution points ranking.', link: '/leaderboard', icon: Star, tag: 'Gamification' },
          ].map(moduleItem => (
            <Link key={moduleItem.title} to={moduleItem.link}>
              <Card className="bg-[#111827]/95 border-[#374151]/50 rounded-2xl hover-lift p-5 flex flex-col justify-between h-40 border-gradient">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center shadow">
                    <moduleItem.icon className="h-5 w-5 text-white" />
                  </div>
                  <Badge className="bg-[#1f2937] text-[#9ca3af] border-0 text-[9px] uppercase">{moduleItem.tag}</Badge>
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-white font-display">{moduleItem.title}</h4>
                  <p className="text-xs text-[#9ca3af]">{moduleItem.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ──── FEATURES GRID ──── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full border-[#374151] text-[#9ca3af]">
            <Sparkles className="h-3 w-3 mr-1.5 text-yellow-400" /> Features Matrix
          </Badge>
          <h2 className="text-3xl font-bold text-white font-display">
            Everything to <span className="text-gradient">Grow Together</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, link, cta }, i) => (
            <Link to={link} key={title} className="group block">
              <Card className="relative h-full overflow-hidden rounded-2xl bg-[#111827]/85 border-[#374151]/50 hover-lift hover:shadow-card-hover duration-300 border-gradient">
                <CardContent className="p-7">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-md mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white mb-2 font-display">{title}</h3>
                  <p className="text-xs text-[#9ca3af] leading-relaxed mb-5">{description}</p>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#6366f1] group-hover:gap-3 transition-all duration-300">
                    {cta}
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ──── COMPANIES ──── */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white font-display">Our Alumni Work At</h2>
          <p className="text-[#9ca3af] text-xs font-semibold">Top hiring companies recruiting Indore Institute graduates</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {topCompanies.map((company) => (
            <div
              key={company}
              className="flex items-center gap-2 rounded-2xl border border-[#374151]/30 bg-[#111827] px-5 py-3.5 text-xs font-bold text-[#9ca3af] hover:shadow-card-hover hover:border-[#6366f1]/30 hover:text-white transition-all duration-200"
            >
              <Building2 className="h-4 w-4 text-[#6366f1]" />
              {company}
            </div>
          ))}
        </div>
      </section>

      {/* ──── TESTIMONIALS ──── */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white font-display">Success Stories</h2>
          <p className="text-[#9ca3af] text-xs">Read reviews from the student & alumni community</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {testimonials.map(({ name, role, batch, quote }) => (
            <Card key={name} className="rounded-2xl bg-[#111827]/90 border border-[#374151]/50 hover-lift shadow-elevated border-gradient">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-[#f9fafb] leading-relaxed mb-5 italic">"{quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#374151]/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-hero text-xs font-bold text-white">
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{name}</div>
                    <div className="text-[10px] text-[#9ca3af]">{role} • Batch {batch}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
