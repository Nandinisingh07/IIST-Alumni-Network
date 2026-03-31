import { useState, useEffect } from 'react';
import { Search, Users, Loader2, AlertCircle, Briefcase, Mail, ExternalLink, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAlumniAPI, type MentorResult } from '@/lib/api';
import { toast } from 'sonner';
import AddAlumniDialog from '@/components/AddAlumniDialog';

const avatarColors = [
  'hsl(var(--hero-start))',
  'hsl(var(--secondary))',
  'hsl(152 60% 42%)',
  'hsl(250 55% 42%)',
  'hsl(200 70% 45%)',
  'hsl(340 65% 47%)',
  'hsl(280 55% 50%)',
  'hsl(170 50% 40%)',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function DirectoryPage() {
  const [alumni, setAlumni] = useState<MentorResult[]>([]);
  const [filtered, setFiltered] = useState<MentorResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');

  const fetchAlumni = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAlumniAPI();
      setAlumni(data);
      setFiltered(data);
    } catch {
      setError('Could not load alumni directory. Is your backend running?');
      toast.error('Failed to load alumni directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlumni(); }, []);

  useEffect(() => {
    let result = alumni;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.role?.toLowerCase().includes(q) ||
        (Array.isArray(a.skills) 
          ? a.skills.some(s => s.toLowerCase().includes(q)) 
          : a.skills?.toLowerCase().includes(q))
      );
    }
    if (companyFilter !== 'all') {
      result = result.filter(a => a.company === companyFilter);
    }
    setFiltered(result);
  }, [search, companyFilter, alumni]);

  const companies = [...new Set(alumni.map(a => a.company))].sort();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="relative mb-10 overflow-hidden rounded-3xl gradient-hero p-8 sm:p-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.15),_transparent_50%)]" />
        <div className="relative z-10">
          <Badge className="mb-4 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm">
            <Users className="h-3.5 w-3.5 mr-2" /> IIST Network
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Alumni <span className="text-yellow-400">Directory</span>
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            Connecting students with Indore Institute of Science and Technology's finest professionals.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, skills, or company..."
            className="pl-10 h-12 rounded-xl border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl">
            <Briefcase className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AddAlumniDialog onAdd={fetchAlumni} />
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading verified alumni...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">{error}</h2>
          <Button onClick={fetchAlumni} variant="outline" className="mt-2">Try Again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl font-medium text-muted-foreground">No alumni found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m, i) => {
            const initials = m.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
            const color = getColor(m.name || 'User');
            
            // This ensures skills are always an array before mapping
            const skillsArr = typeof m.skills === 'string' 
              ? m.skills.split(',').map(s => s.trim()) 
              : Array.isArray(m.skills) ? m.skills : [];

            return (
              <Card key={m.id || i} className="group hover:shadow-xl transition-all duration-300 border-border/50 rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate text-foreground">{m.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {m.role}
                      </p>
                      <p className="text-xs font-semibold text-primary">{m.company}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {skillsArr.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-muted text-[10px] uppercase tracking-wider">
                        {skill}
                      </Badge>
                    ))}
                    {skillsArr.length > 3 && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        +{skillsArr.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg gap-2">
                      <Mail className="h-3.5 w-3.5" /> Mail
                    </Button>
                    <Button variant="default" size="sm" className="flex-1 rounded-lg gap-2 gradient-hero border-0">
                      <ExternalLink className="h-3.5 w-3.5" /> Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}