import { useState } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, ExternalLink, Building2, Search, Star, Sparkles, BookmarkPlus, Bookmark, ArrowRight, Users, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Internship' | 'Part-time' | 'Contract';
  salary: string;
  postedBy: string;
  postedByRole: string;
  batch: string;
  description: string;
  skills: string[];
  postedAgo: string;
  isReferral: boolean;
  applyLink: string;
}

const jobs: Job[] = [
  {
    id: '1',
    title: 'Software Development Engineer',
    company: 'Google',
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '₹25-40 LPA',
    postedBy: 'Rajesh Patel',
    postedByRole: 'SDE-III at Google',
    batch: '2018',
    description: 'Looking for talented engineers with strong DSA and system design skills. IIST alumni get referral priority.',
    skills: ['Java', 'DSA', 'System Design', 'LeetCode'],
    postedAgo: '2 days ago',
    isReferral: true,
    applyLink: '#',
  },
  {
    id: '2',
    title: 'ML Engineer Intern',
    company: 'Microsoft',
    location: 'Hyderabad, India',
    type: 'Internship',
    salary: '₹80K/month',
    postedBy: 'Neha Gupta',
    postedByRole: 'ML Engineer at Microsoft',
    batch: '2019',
    description: 'Summer internship for students passionate about machine learning. 6-month program with PPO possibility.',
    skills: ['Python', 'PyTorch', 'NLP', 'Statistics'],
    postedAgo: '1 week ago',
    isReferral: true,
    applyLink: '#',
  },
  {
    id: '3',
    title: 'Frontend Developer',
    company: 'Flipkart',
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '₹18-28 LPA',
    postedBy: 'Amit Kumar',
    postedByRole: 'Tech Lead at Flipkart',
    batch: '2017',
    description: 'Join the commerce platform team. Build performant, accessible UIs at massive scale.',
    skills: ['React', 'TypeScript', 'Next.js', 'CSS'],
    postedAgo: '3 days ago',
    isReferral: false,
    applyLink: '#',
  },
  {
    id: '4',
    title: 'Data Analyst',
    company: 'Deloitte',
    location: 'Indore, India',
    type: 'Full-time',
    salary: '₹8-14 LPA',
    postedBy: 'Ananya Sharma',
    postedByRole: 'Analytics Lead at Deloitte',
    batch: '2020',
    description: 'Analyze business data and create insights. Great opportunity for freshers from IIST.',
    skills: ['SQL', 'Python', 'Tableau', 'Excel'],
    postedAgo: '5 days ago',
    isReferral: true,
    applyLink: '#',
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'Amazon',
    location: 'Remote, India',
    type: 'Full-time',
    salary: '₹20-35 LPA',
    postedBy: 'Vikram Singh',
    postedByRole: 'Cloud Architect at AWS',
    batch: '2016',
    description: 'Manage CI/CD pipelines and cloud infrastructure. Kubernetes experience preferred.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    postedAgo: '1 day ago',
    isReferral: true,
    applyLink: '#',
  },
  {
    id: '6',
    title: 'Product Management Intern',
    company: 'Razorpay',
    location: 'Bangalore, India',
    type: 'Internship',
    salary: '₹60K/month',
    postedBy: 'Priya Verma',
    postedByRole: 'PM at Razorpay',
    batch: '2021',
    description: 'Join the fintech revolution. Work on real products, conduct user research, and ship features.',
    skills: ['Product Thinking', 'Analytics', 'SQL', 'Figma'],
    postedAgo: '4 days ago',
    isReferral: false,
    applyLink: '#',
  },
];

const typeColors: Record<string, string> = {
  'Full-time': 'bg-success/10 text-success border-success/20',
  'Internship': 'bg-info/10 text-info border-info/20',
  'Part-time': 'bg-accent/10 text-accent border-accent/20',
  'Contract': 'bg-primary/10 text-primary border-primary/20',
};

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const filtered = jobs.filter(j => {
    const matchSearch = !search.trim() || 
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === 'all' || j.type === typeFilter;
    return matchSearch && matchType;
  });

  const toggleSave = (id: string, title: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info('Removed from saved jobs');
      } else {
        next.add(id);
        toast.success(`Saved "${title}"`);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-3xl gradient-hero p-8 sm:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(38_92%_50%_/_0.15),_transparent_50%)]" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-[radial-gradient(circle,_hsl(152_60%_42%_/_0.15),_transparent_70%)]" />
        <div className="relative max-w-2xl">
          <Badge className="mb-4 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 backdrop-blur-sm px-4 py-1.5">
            <Briefcase className="h-3 w-3 mr-1.5" /> Job Board
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-primary-foreground mb-3 leading-[1.1]">
            Alumni <span className="text-gradient-accent">Job Board</span>
          </h1>
          <p className="text-primary-foreground/70 max-w-lg text-base sm:text-lg leading-relaxed">
            Exclusive job opportunities and referrals shared by IIST alumni at top companies.
          </p>
          <div className="mt-6 flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-primary-foreground">{jobs.length}</div>
              <div className="text-[10px] text-primary-foreground/50 font-medium uppercase">Open Roles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary-foreground">{jobs.filter(j => j.isReferral).length}</div>
              <div className="text-[10px] text-primary-foreground/50 font-medium uppercase">With Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-primary-foreground">{new Set(jobs.map(j => j.company)).size}</div>
              <div className="text-[10px] text-primary-foreground/50 font-medium uppercase">Companies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by role, company, or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-12 bg-card shadow-card focus:shadow-card-hover transition-shadow rounded-xl text-base border-border/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'Full-time', 'Internship', 'Part-time', 'Contract'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                typeFilter === type
                  ? 'gradient-hero text-primary-foreground shadow-md'
                  : 'border border-border/60 bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground'
              }`}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No jobs match your search</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try different keywords or filters</p>
          </div>
        )}
        {filtered.map((job, i) => (
          <Card
            key={job.id}
            className="group overflow-hidden shadow-card hover:shadow-card-hover rounded-2xl border-border/50 hover:border-accent/20 transition-all duration-300 opacity-0 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
          >
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Company Logo Placeholder */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/60 border border-border/50">
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-foreground text-lg">{job.title}</h3>
                        {job.isReferral && (
                          <Badge className="bg-accent/10 text-accent border-accent/20 rounded-full text-xs font-semibold border">
                            <Star className="h-3 w-3 mr-1 fill-current" /> Referral
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-foreground/80">
                          <Building2 className="h-3.5 w-3.5 text-accent" />{job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />{job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />{job.salary}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSave(job.id, job.title)}
                      className="shrink-0 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      {saved.has(job.id) ? (
                        <Bookmark className="h-5 w-5 text-accent fill-accent" />
                      ) : (
                        <BookmarkPlus className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge className={`${typeColors[job.type]} rounded-full text-xs font-semibold border`}>{job.type}</Badge>
                    {job.skills.map(s => (
                      <Badge key={s} variant="outline" className="text-xs rounded-full border-border/60">{s}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Posted by <strong className="text-foreground">{job.postedBy}</strong> ({job.postedByRole}) • Batch {job.batch}</span>
                      <span>• {job.postedAgo}</span>
                    </div>
                    <Button size="sm" className="gradient-hero shadow-md rounded-xl gap-1.5 font-semibold">
                      Apply <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
