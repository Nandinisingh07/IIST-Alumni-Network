import { useState } from 'react';
import { Search, Users, Sparkles, TrendingUp, Briefcase, Loader2, AlertCircle, MapPin, Star, Mail, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mentorMatchAPI, type MentorResult } from '@/lib/api';
import { toast } from 'sonner';
import AddAlumniDialog from '@/components/AddAlumniDialog';

const stats = [
  { icon: Users, label: 'IIST Alumni Mentors', value: '120+' },
  { icon: TrendingUp, label: 'Career Switches', value: '85%' },
  { icon: Sparkles, label: 'Skills Covered', value: '50+' },
];

const avatarColors = [
  'hsl(var(--hero-start))',
  'hsl(var(--secondary))',
  'hsl(152 60% 42%)',
  'hsl(250 55% 42%)',
  'hsl(200 70% 45%)',
  'hsl(340 65% 47%)',
];
function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function MentorsPage() {
  const [skill, setSkill] = useState('');
  const [mentors, setMentors] = useState<MentorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const searchMentors = async (text?: string) => {
    const query = text || skill;
    if (!query.trim()) return;
    if (text) setSkill(text);
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const results = await mentorMatchAPI(query.trim());
      setMentors(results);
    } catch {
      setError('Failed to find mentors. Is your backend running at http://127.0.0.1:8000?');
      toast.error('Mentor Match API failed');
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMentors();
  };

  const quickSkills = ['AI', 'Web Development', 'Data Science', 'Cloud', 'Machine Learning', 'Cybersecurity', 'DevOps', 'Mobile Dev'];

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-12 overflow-hidden rounded-3xl gradient-hero p-8 sm:p-12 lg:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.18),_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[radial-gradient(circle,_hsl(250_55%_42%_/_0.25),_transparent_70%)]" />
        <div className="absolute top-6 right-10 hidden lg:block opacity-[0.08]">
          <Users className="h-40 w-40 text-primary-foreground" />
        </div>
        <div className="relative max-w-2xl">
          <Badge className="mb-4 bg-primary-foreground/12 text-primary-foreground border-primary-foreground/20 backdrop-blur-sm px-4 py-1.5">
            <Star className="h-3 w-3 mr-1.5 fill-current" /> IIST Alumni Network
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-primary-foreground mb-3 leading-[1.1]">
            Find Your Perfect{' '}
            <span className="text-gradient-accent">IIST Mentor</span>
          </h1>
          <p className="text-primary-foreground/70 max-w-lg text-base sm:text-lg leading-relaxed">
            Connect with alumni from Indore Institute of Science & Technology who've walked your path and are ready to guide you.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-primary-foreground/8 rounded-2xl px-4 py-3 backdrop-blur-sm border border-primary-foreground/10">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-primary-foreground/70" />
                </div>
                <div className="text-2xl font-black text-primary-foreground leading-none">{value}</div>
                <div className="text-[10px] text-primary-foreground/50 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-between mb-5">
          <form onSubmit={handleSubmit} className="flex flex-1 max-w-lg gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by skill (e.g. AI, Python, Cloud)..."
                value={skill}
                onChange={e => setSkill(e.target.value)}
                className="pl-10 h-12 bg-card shadow-card focus:shadow-card-hover transition-shadow rounded-xl text-base border-border/50"
              />
            </div>
            <Button type="submit" disabled={loading || !skill.trim()} className="gap-2 h-12 px-6 gradient-hero shadow-md rounded-xl text-sm font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </form>
          <AddAlumniDialog onAdd={() => skill && searchMentors()} />
        </div>

        {/* Quick skill chips */}
        {!searched && (
          <div className="animate-fade-in">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">🔥 Trending skills among IIST alumni</p>
            <div className="flex flex-wrap gap-2">
              {quickSkills.map(s => (
                <button
                  key={s}
                  onClick={() => searchMentors(s)}
                  className="rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:shadow-card-hover hover:border-accent/40 hover:-translate-y-0.5 hover:bg-accent/5 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-24 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center h-18 w-18 rounded-2xl gradient-hero mb-5 shadow-glow-primary">
            <Loader2 className="h-9 w-9 animate-spin text-primary-foreground" />
          </div>
          <p className="text-muted-foreground font-medium text-lg">Searching IIST alumni network...</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Matching mentors to your skill</p>
        </div>
      )}

      {error && (
        <Card className="shadow-card animate-scale-in border-destructive/20 rounded-2xl">
          <CardContent className="py-12 text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold text-base">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">Make sure your FastAPI backend is running and CORS is enabled.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && searched && mentors.length === 0 && (
        <div className="py-24 text-center">
          <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-2xl bg-muted/60 border border-border/50">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg text-muted-foreground font-medium">No mentors found for "<strong className="text-foreground">{skill}</strong>"</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try a broader skill keyword or add a mentor</p>
          <div className="mt-5">
            <AddAlumniDialog />
          </div>
        </div>
      )}

      {!loading && mentors.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{mentors.length}</strong> mentor{mentors.length !== 1 ? 's' : ''} found for "<strong className="text-foreground">{skill}</strong>"
            </p>
            <Button variant="ghost" size="sm" onClick={() => { setSearched(false); setMentors([]); setSkill(''); }} className="text-xs text-muted-foreground rounded-xl">
              Clear results
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((m, i) => {
              const initials = m.name.split(' ').map(n => n[0]).join('').slice(0, 2);
              const color = getColor(m.name);
              return (
                <Card
                  key={i}
                  className="group relative overflow-hidden shadow-card hover-lift hover:shadow-card-hover cursor-pointer opacity-0 animate-slide-up rounded-2xl border-border/50 hover:border-accent/30 transition-all duration-300"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
                >
                  {/* Top gradient line */}
                  <div className="absolute inset-x-0 top-0 h-1 gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-primary-foreground transition-transform duration-300 group-hover:scale-105 shadow-md"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-card" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground text-base leading-tight">{m.name}</h3>
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="truncate">{m.company}</span>
                        </div>
                        {m.expertise && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground/60">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{m.expertise}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {m.role && <Badge className="text-xs font-semibold gradient-hero text-primary-foreground border-0 rounded-full px-3">{m.role}</Badge>}
                      {m.skills && m.skills.length > 0 && m.skills.slice(0, 3).map((s, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs rounded-full border-border/60">{s}</Badge>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-4 border-t border-border/30 flex gap-2">
                      <Button variant="ghost" size="sm" className="flex-1 rounded-xl text-xs h-9 hover:bg-primary/5 hover:text-primary">
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        Connect
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 rounded-xl text-xs h-9 hover:bg-accent/5 hover:text-accent">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
