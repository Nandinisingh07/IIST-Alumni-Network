import { Link } from 'react-router-dom';
import {
  GraduationCap, MessageSquare, Users, Route, Sparkles, ArrowRight,
  Bot, Target, BookOpen, TrendingUp, Zap, Star, ChevronRight,
  Brain, Compass, Award, Briefcase, Calendar, Globe, Heart,
  UserPlus, Search, Video, Building2, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Users,
    title: 'Alumni Directory',
    description: 'Browse and connect with verified IIST alumni across industries. Filter by company, skill, or batch year.',
    link: '/directory',
    cta: 'Browse Directory',
    color: 'from-primary to-primary',
  },
  {
    icon: Search,
    title: 'Mentor Matching',
    description: "Find the perfect mentor by skill or expertise. Get matched with alumni who've walked your path.",
    link: '/mentors',
    cta: 'Find Mentors',
    color: 'from-accent to-accent',
  },
  {
    icon: Bot,
    title: 'AI Career Advisor',
    description: 'Get personalized career advice from our AI trained on IIST alumni success stories and industry insights.',
    link: '/chat',
    cta: 'Start Chatting',
    color: 'from-success to-success',
  },
  {
    icon: Compass,
    title: 'Career Roadmaps',
    description: 'Generate step-by-step learning paths for any career goal. Track your progress along the way.',
    link: '/roadmap',
    cta: 'Explore Paths',
    color: 'from-info to-info',
  },
  {
    icon: Briefcase,
    title: 'Job Board',
    description: 'Exclusive job opportunities and referrals shared by IIST alumni at top companies worldwide.',
    link: '/jobs',
    cta: 'View Jobs',
    color: 'from-primary to-primary',
  },
  {
    icon: Calendar,
    title: 'Events & Meetups',
    description: 'Join webinars, workshops, reunions, and networking events hosted by the IIST alumni community.',
    link: '/events',
    cta: 'View Events',
    color: 'from-accent to-accent',
  },
];

const stats = [
  { value: '500+', label: 'Alumni Connected', icon: Users },
  { value: '50+', label: 'Companies', icon: Building2 },
  { value: '120+', label: 'Active Mentors', icon: Heart },
  { value: '24/7', label: 'AI Available', icon: Zap },
];

const testimonials = [
  { name: 'Rahul S.', role: 'SDE at Google', batch: '2021', quote: 'Through this platform, I found a mentor who helped me ace my Google interview. The alumni network is incredibly supportive.' },
  { name: 'Priya V.', role: 'ML Engineer at Microsoft', batch: '2020', quote: 'The AI career advisor gave me a clear roadmap. I landed my dream ML role within 6 months of following the plan.' },
  { name: 'Amit K.', role: 'PM at Amazon', batch: '2019', quote: 'The job board referrals are gold! Got a direct referral from a senior alumnus and that made all the difference.' },
];

const topCompanies = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Razorpay', 'Deloitte', 'TCS', 'Infosys', 'Adobe', 'Goldman Sachs', 'Oracle', 'IBM'];

export default function Index() {
  return (
    <div className="space-y-0">
      {/* ──── HERO ──── */}
      <section className="relative overflow-hidden rounded-3xl gradient-hero p-8 sm:p-14 lg:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.15),_transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(circle,_hsl(250_55%_42%_/_0.2),_transparent_70%)]" />
        <div className="absolute top-8 right-8 hidden lg:block">
          <div className="relative">
            <div className="h-32 w-32 rounded-3xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 flex items-center justify-center animate-float">
              <Users className="h-16 w-16 text-primary-foreground/20" />
            </div>
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
              <Heart className="h-8 w-8 text-primary-foreground/20" />
            </div>
          </div>
        </div>

        <div className="relative max-w-2xl">
          <Badge className="mb-5 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold tracking-wide">
            <GraduationCap className="h-3 w-3 mr-1.5" /> Indore Institute of Science & Technology
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary-foreground leading-[1.1] mb-5">
            Your Alumni{' '}
            <span className="relative inline-block">
              <span className="text-gradient-accent">Network</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="hsl(38 92% 50%)" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </span>
            {' '}Platform
          </h1>

          <p className="text-primary-foreground/75 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
            Connect with alumni, find mentors, discover job opportunities, attend events, and navigate your career — all in one platform built for IIST.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/directory">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg gap-2 h-13 px-8 text-base rounded-2xl font-semibold">
                <Users className="h-5 w-5" />
                Explore Alumni
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/jobs">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2 h-13 px-8 text-base rounded-2xl font-semibold backdrop-blur-sm">
                <Briefcase className="h-5 w-5" />
                View Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ──── STATS BAR ──── */}
      <section className="-mt-8 relative z-10 mx-4 sm:mx-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ value, label, icon: Icon }, i) => (
            <Card key={label} className="shadow-elevated border-0 bg-card/95 backdrop-blur-sm rounded-2xl opacity-0 animate-slide-up" style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: 'forwards' }}>
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-hero shadow-md">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-foreground leading-none">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ──── FEATURES ──── */}
      <section className="mt-16 sm:mt-20">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full">
            <Sparkles className="h-3 w-3 mr-1.5" /> Platform Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            Everything to <span className="text-gradient">Stay Connected</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Six powerful features designed to strengthen the IIST alumni community and boost career success.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, link, cta }, i) => (
            <Link to={link} key={title} className="group block">
              <Card
                className="relative h-full overflow-hidden rounded-2xl shadow-card hover-lift hover:shadow-card-hover border-transparent hover:border-accent/20 transition-all duration-300 opacity-0 animate-slide-up"
                style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: 'forwards' }}
              >
                <div className="absolute inset-x-0 top-0 h-1 gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-7">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-hero shadow-md mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 font-display">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{description}</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-300">
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
      <section className="mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-2">
            Our Alumni Work At
          </h2>
          <p className="text-muted-foreground text-sm">Top companies where IIST graduates are making an impact</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {topCompanies.map((company, i) => (
            <div
              key={company}
              className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card px-5 py-3 text-sm font-medium text-muted-foreground opacity-0 animate-slide-up hover:shadow-card-hover hover:border-accent/30 hover:text-foreground transition-all duration-200"
              style={{ animationDelay: `${i * 60 + 200}ms`, animationFillMode: 'forwards' }}
            >
              <Building2 className="h-4 w-4 text-accent" />
              {company}
            </div>
          ))}
        </div>
      </section>

      {/* ──── HOW IT WORKS ──── */}
      <section className="mt-20">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full">
            <Route className="h-3 w-3 mr-1.5" /> How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            Get Started in{' '}
            <span className="text-gradient-accent">3 Simple Steps</span>
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: '01', title: 'Join the Network', desc: 'Register as an alumni or student. Complete your profile with skills, batch, and career interests.', icon: UserPlus },
            { step: '02', title: 'Connect & Discover', desc: 'Find mentors, browse jobs, and join events. The platform matches you with the right people.', icon: Search },
            { step: '03', title: 'Grow Together', desc: 'Get mentored, refer juniors, attend events, and give back to the IIST community.', icon: TrendingUp },
          ].map(({ step, title, desc, icon: Icon }, i) => (
            <div key={step} className="relative text-center opacity-0 animate-slide-up" style={{ animationDelay: `${i * 150 + 200}ms`, animationFillMode: 'forwards' }}>
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 border border-border/50 mb-4">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-xs font-black text-accent uppercase tracking-widest mb-2">{step}</div>
              <h3 className="text-lg font-bold text-foreground mb-2 font-display">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              {i < 2 && (
                <div className="hidden sm:block absolute top-8 -right-3 w-6">
                  <ChevronRight className="h-5 w-5 text-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ──── TESTIMONIALS ──── */}
      <section className="mt-20">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full">
            <Award className="h-3 w-3 mr-1.5" /> Success Stories
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
            Voices from <span className="text-gradient">Our Community</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {testimonials.map(({ name, role, batch, quote }, i) => (
            <Card key={name} className="rounded-2xl shadow-card hover-lift hover:shadow-card-hover transition-all duration-300 opacity-0 animate-slide-up" style={{ animationDelay: `${i * 120 + 200}ms`, animationFillMode: 'forwards' }}>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5 italic">"{quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-hero text-xs font-bold text-primary-foreground">
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{name}</div>
                    <div className="text-xs text-muted-foreground">{role} • Batch {batch}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="mt-20 mb-4">
        <Card className="overflow-hidden rounded-3xl border-0 gradient-hero relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(38_92%_50%_/_0.12),_transparent_50%)]" />
          <CardContent className="relative p-8 sm:p-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 mb-5 animate-float">
              <Globe className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-primary-foreground mb-3">
              Be Part of the IIST Alumni Network
            </h2>
            <p className="text-primary-foreground/70 max-w-md mx-auto mb-7">
              Whether you're a current student or a seasoned professional, there's a place for you in our growing community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/directory">
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg gap-2 h-13 px-8 text-base rounded-2xl font-semibold">
                  <UserPlus className="h-5 w-5" />
                  Join the Network
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
