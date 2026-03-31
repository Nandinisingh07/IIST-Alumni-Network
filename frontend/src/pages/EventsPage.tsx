import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Video, ExternalLink, Star, Sparkles, ArrowRight, Bell, Globe, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'webinar' | 'meetup' | 'workshop' | 'reunion';
  location: string;
  speaker: string;
  speakerRole: string;
  attendees: number;
  maxAttendees: number;
  tags: string[];
  isOnline: boolean;
  featured?: boolean;
}

const events: Event[] = [
  {
    id: '1',
    title: 'Cracking FAANG Interviews — Insider Tips',
    description: 'Join Rajesh Patel (Google SDE-III) as he shares his journey from IIST to Google, including preparation strategies and common pitfalls.',
    date: '2026-03-28',
    time: '7:00 PM IST',
    type: 'webinar',
    location: 'Google Meet',
    speaker: 'Rajesh Patel',
    speakerRole: 'SDE-III at Google',
    attendees: 87,
    maxAttendees: 150,
    tags: ['Interview Prep', 'DSA', 'Career Growth'],
    isOnline: true,
    featured: true,
  },
  {
    id: '2',
    title: 'AI & ML Workshop: From Theory to Production',
    description: 'Hands-on workshop covering end-to-end ML pipeline — from data preprocessing to deploying models in production.',
    date: '2026-04-05',
    time: '10:00 AM IST',
    type: 'workshop',
    location: 'IIST Campus, Indore',
    speaker: 'Neha Gupta',
    speakerRole: 'ML Engineer at Microsoft',
    attendees: 42,
    maxAttendees: 60,
    tags: ['AI/ML', 'Python', 'Hands-on'],
    isOnline: false,
  },
  {
    id: '3',
    title: 'IIST Alumni Reunion 2026',
    description: 'Annual reunion for all IIST batches. Reconnect with classmates, network with seniors, and celebrate our shared alma mater.',
    date: '2026-04-15',
    time: '5:00 PM IST',
    type: 'reunion',
    location: 'IIST Auditorium, Indore',
    speaker: 'Alumni Committee',
    speakerRole: 'IIST Alumni Association',
    attendees: 210,
    maxAttendees: 500,
    tags: ['Networking', 'Community', 'Reunion'],
    isOnline: false,
    featured: true,
  },
  {
    id: '4',
    title: 'Cloud Architecture Best Practices',
    description: 'Learn AWS and GCP architecture patterns from an IIST alumnus building at scale at Amazon.',
    date: '2026-04-10',
    time: '6:30 PM IST',
    type: 'webinar',
    location: 'Zoom',
    speaker: 'Vikram Singh',
    speakerRole: 'Cloud Architect at AWS',
    attendees: 55,
    maxAttendees: 200,
    tags: ['Cloud', 'AWS', 'Architecture'],
    isOnline: true,
  },
  {
    id: '5',
    title: 'Startup Founders Meetup — Indore Chapter',
    description: 'Monthly meetup for IIST alumni who are building startups. Share learnings, find co-founders, and get feedback.',
    date: '2026-04-20',
    time: '4:00 PM IST',
    type: 'meetup',
    location: 'WeWork Indore',
    speaker: 'Startup Alumni Network',
    speakerRole: 'Various Founders',
    attendees: 28,
    maxAttendees: 40,
    tags: ['Startups', 'Networking', 'Entrepreneurship'],
    isOnline: false,
  },
  {
    id: '6',
    title: 'Resume & LinkedIn Masterclass',
    description: 'Craft a standout resume and LinkedIn profile that gets you noticed by top recruiters. Personalized feedback included.',
    date: '2026-04-25',
    time: '3:00 PM IST',
    type: 'workshop',
    location: 'Google Meet',
    speaker: 'Ananya Sharma',
    speakerRole: 'HR Lead at Deloitte',
    attendees: 63,
    maxAttendees: 100,
    tags: ['Career', 'Resume', 'LinkedIn'],
    isOnline: true,
  },
];

const typeConfig: Record<string, { color: string; icon: typeof Calendar }> = {
  webinar: { color: 'bg-info/10 text-info border-info/20', icon: Video },
  meetup: { color: 'bg-accent/10 text-accent border-accent/20', icon: Users },
  workshop: { color: 'bg-success/10 text-success border-success/20', icon: Star },
  reunion: { color: 'bg-primary/10 text-primary border-primary/20', icon: Globe },
};

export default function EventsPage() {
  const [filter, setFilter] = useState<string>('all');
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter);

  const handleRegister = (id: string, title: string) => {
    setRegistered(prev => new Set(prev).add(id));
    toast.success(`Registered for "${title}"! Check your email for details.`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const featuredEvents = events.filter(e => e.featured);

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-3xl gradient-hero p-8 sm:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(38_92%_50%_/_0.15),_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[radial-gradient(circle,_hsl(152_60%_42%_/_0.15),_transparent_70%)]" />
        <div className="relative max-w-2xl">
          <Badge className="mb-4 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 backdrop-blur-sm px-4 py-1.5">
            <Calendar className="h-3 w-3 mr-1.5" /> Upcoming Events
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-primary-foreground mb-3 leading-[1.1]">
            Alumni <span className="text-gradient-accent">Events & Meetups</span>
          </h1>
          <p className="text-primary-foreground/70 max-w-lg text-base sm:text-lg leading-relaxed">
            Join webinars, workshops, and reunions hosted by IIST alumni. Learn, connect, and grow together.
          </p>
          <div className="mt-6 flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-primary-foreground">{events.length}</div>
              <div className="text-[10px] text-primary-foreground/50 font-medium uppercase">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary-foreground">{events.filter(e => e.isOnline).length}</div>
              <div className="text-[10px] text-primary-foreground/50 font-medium uppercase">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary-foreground">{events.reduce((s, e) => s + e.attendees, 0)}+</div>
              <div className="text-[10px] text-primary-foreground/50 font-medium uppercase">Registered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold font-display text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" /> Featured Events
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {featuredEvents.map((event, i) => {
              const config = typeConfig[event.type];
              const Icon = config.icon;
              const isReg = registered.has(event.id);
              const fillPercent = Math.round((event.attendees / event.maxAttendees) * 100);
              return (
                <Card
                  key={event.id}
                  className="group relative overflow-hidden shadow-elevated hover-lift hover:shadow-card-hover rounded-2xl border-border/50 hover:border-accent/30 transition-all duration-300 opacity-0 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 gradient-accent" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <Badge className={`${config.color} rounded-full text-xs font-semibold border`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Badge>
                      {event.isOnline && (
                        <Badge variant="outline" className="rounded-full text-xs">
                          <Video className="h-3 w-3 mr-1" /> Online
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors font-display">{event.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-accent" />
                        <span>{formatDate(event.date)} • {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-accent" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-accent" />
                        <span>{event.speaker} — {event.speakerRole}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {event.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs rounded-full border-border/60">{tag}</Badge>
                      ))}
                    </div>
                    {/* Capacity bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>{event.attendees} registered</span>
                        <span>{fillPercent}% full</span>
                      </div>
                      <div className="bg-muted/50 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full gradient-accent rounded-full transition-all" style={{ width: `${fillPercent}%` }} />
                      </div>
                    </div>
                    <Button
                      onClick={() => !isReg && handleRegister(event.id, event.title)}
                      disabled={isReg}
                      className={`w-full rounded-xl font-semibold gap-2 ${isReg ? 'bg-success hover:bg-success text-primary-foreground' : 'gradient-hero shadow-md'}`}
                    >
                      {isReg ? <><CheckCircle2 className="h-4 w-4" /> Registered</> : <><Bell className="h-4 w-4" /> Register Now</>}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-2">Filter:</span>
        {['all', 'webinar', 'workshop', 'meetup', 'reunion'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filter === type
                ? 'gradient-hero text-primary-foreground shadow-md'
                : 'border border-border/60 bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground'
            }`}
          >
            {type === 'all' ? 'All Events' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* All Events */}
      <div className="space-y-4">
        {filteredEvents.map((event, i) => {
          const config = typeConfig[event.type];
          const Icon = config.icon;
          const isReg = registered.has(event.id);
          return (
            <Card
              key={event.id}
              className="group overflow-hidden shadow-card hover:shadow-card-hover rounded-2xl border-border/50 hover:border-accent/20 transition-all duration-300 opacity-0 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Date block */}
                <div className="flex sm:flex-col items-center sm:items-center gap-2 sm:gap-0 shrink-0 sm:w-16 text-center">
                  <div className="text-2xl font-black text-foreground leading-none">{new Date(event.date).getDate()}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase">{new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })}</div>
                </div>
                <div className="hidden sm:block w-px h-12 bg-border/50" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className={`${config.color} rounded-full text-xs font-semibold border`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                    {event.isOnline && (
                      <Badge variant="outline" className="rounded-full text-[10px]">Online</Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground text-base">{event.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.attendees}/{event.maxAttendees}</span>
                  </div>
                </div>
                <Button
                  onClick={() => !isReg && handleRegister(event.id, event.title)}
                  disabled={isReg}
                  size="sm"
                  className={`shrink-0 rounded-xl gap-1.5 font-semibold ${isReg ? 'bg-success hover:bg-success text-primary-foreground' : 'gradient-hero shadow-md'}`}
                >
                  {isReg ? <><CheckCircle2 className="h-3.5 w-3.5" /> Registered</> : <><ArrowRight className="h-3.5 w-3.5" /> Register</>}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
