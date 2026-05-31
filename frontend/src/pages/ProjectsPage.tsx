import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { projectsApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Sparkles, Code, Briefcase, Plus, Users, User, Clock, Check, Inbox } from 'lucide-react';

interface Project {
  id: number;
  posted_by: number;
  role_of_poster: string;
  type: string;
  title: string;
  description: string;
  skills_needed: string[];
  domain?: string;
  commitment_hours_per_week: number;
  status: string;
  team_size_needed: number;
  created_at: string;
  poster: any;
}

export default function ProjectsPage() {
  const { user } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<any>({ posted: [], joined: [], interested: [] });
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  
  // Create Project States
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    type: 'side-project',
    title: '',
    description: '',
    skillsString: '',
    domain: '',
    commitment_hours_per_week: 10,
    team_size_needed: 2
  });

  // Express Interest States
  const [interestedProject, setInterestedProject] = useState<Project | null>(null);
  const [interestForm, setInterestForm] = useState({
    note: '',
    skillsString: ''
  });

  // Manage Interests States (Project owner panel)
  const [activeProjectForInterests, setActiveProjectForInterests] = useState<Project | null>(null);
  const [projectInterestsList, setProjectInterestsList] = useState<any[]>([]);

  const fetchProjects = async () => {
    try {
      const data = await projectsApi.getProjects();
      setProjects(data);
      
      const myData = await projectsApi.getMyProjects();
      setMyProjects(myData);
    } catch {
      toast.error('Failed to load project collaboration boards');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skills = projectForm.skillsString.split(',').map(s => s.trim()).filter(Boolean);
      await projectsApi.create({
        ...projectForm,
        skills_needed: skills
      });
      toast.success('Project collaboration post published successfully!');
      setCreatingProject(false);
      setProjectForm({
        type: 'side-project',
        title: '',
        description: '',
        skillsString: '',
        domain: '',
        commitment_hours_per_week: 10,
        team_size_needed: 2
      });
      fetchProjects();
    } catch {
      toast.error('Failed to publish project board posting');
    }
  };

  const handleExpressInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestedProject) return;
    try {
      const skills = interestForm.skillsString.split(',').map(s => s.trim()).filter(Boolean);
      await projectsApi.expressInterest(interestedProject.id, {
        note: interestForm.note,
        skills
      });
      toast.success('Interest expressed! The owner has been notified.');
      setInterestedProject(null);
      setInterestForm({ note: '', skillsString: '' });
      fetchProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit interest application');
    }
  };

  const handleOpenInterestsPanel = async (project: Project) => {
    setActiveProjectForInterests(project);
    try {
      const data = await projectsApi.getInterests(project.id);
      setProjectInterestsList(data);
    } catch {
      toast.error('Failed to load applicants list');
    }
  };

  const handleAcceptCollaborator = async (userId: number) => {
    if (!activeProjectForInterests) return;
    try {
      await projectsApi.acceptCollaborator(activeProjectForInterests.id, userId);
      toast.success('Collaborator accepted successfully!');
      // Refresh list
      handleOpenInterestsPanel(activeProjectForInterests);
      fetchProjects();
    } catch {
      toast.error('Failed to accept collaborator');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 text-[#f9fafb] space-y-10">
      
      {/* Platform Header */}
      <div className="flex justify-between items-end bg-[#111827]/80 border border-[#374151]/30 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.1),_transparent_50%)]" />
        <div className="relative z-10 space-y-3">
          <Badge className="bg-white/10 text-white border-white/20">
            <Code className="h-3.5 w-3.5 mr-2 text-primary" /> Collab Hub
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-none font-display">
            Project <span className="text-gradient">Collaboration</span>
          </h1>
          <p className="text-sm text-[#9ca3af] max-w-sm">
            Partner on startup ideas, side projects, open-source repos, and academic research papers. Build teams inside IIST.
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <Button 
            onClick={() => setCreatingProject(true)} 
            className="gradient-hero h-12 rounded-xl text-white font-bold gap-2 shadow-lg border-0 px-6"
          >
            <Plus className="h-4.5 w-4.5" /> Post Project
          </Button>
        </div>
      </div>

      {/* Tabs list switches */}
      <div className="flex justify-start border-b border-[#374151]/30 pb-1.5 gap-4 text-sm">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-3 font-bold border-b-2 transition-all ${
            activeTab === 'all' ? 'border-[#6366f1] text-[#6366f1]' : 'border-transparent text-[#9ca3af] hover:text-white'
          }`}
        >
          All Listings
        </button>
        <button 
          onClick={() => setActiveTab('my')}
          className={`pb-3 font-bold border-b-2 transition-all ${
            activeTab === 'my' ? 'border-[#6366f1] text-[#6366f1]' : 'border-transparent text-[#9ca3af] hover:text-white'
          }`}
        >
          My Dashboard
        </button>
      </div>

      {/* Create Project Modal */}
      {creatingProject && (
        <Dialog open={creatingProject} onOpenChange={setCreatingProject}>
          <DialogContent className="bg-[#111827] border-[#374151] text-white rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-white text-xl">Create Collaboration Board Post</DialogTitle>
              <DialogDescription className="text-xs text-[#9ca3af]">Looking for developers, designers, or research mentors? Describe your project here.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9ca3af] uppercase">Project Type</label>
                  <select
                    value={projectForm.type}
                    onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })}
                    className="w-full bg-[#1f2937]/50 border border-[#374151] rounded-xl h-11 px-3 text-white text-sm"
                  >
                    <option value="startup-idea">Startup Idea</option>
                    <option value="side-project">Side Project</option>
                    <option value="open-source">Open Source</option>
                    <option value="research">Academic Research</option>
                    <option value="freelance">Freelance Gigs</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9ca3af] uppercase">Target Domain</label>
                  <Input
                    placeholder="e.g. Fintech, Deep Learning"
                    value={projectForm.domain}
                    onChange={(e) => setProjectForm({ ...projectForm, domain: e.target.value })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Project Title</label>
                <Input
                  required
                  placeholder="e.g. AI-Powered Academic OCR scanner"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Detailed Description</label>
                <Textarea
                  required
                  placeholder="Describe your project goals, milestones, tech stacks, and team roles required..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  rows={4}
                  className="bg-[#1f2937]/50 border-[#374151]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Skills Needed (comma separated)</label>
                <Input
                  placeholder="e.g. React, Python, FastAPI"
                  value={projectForm.skillsString}
                  onChange={(e) => setProjectForm({ ...projectForm, skillsString: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9ca3af] uppercase">Commitment (hrs/wk)</label>
                  <Input
                    type="number"
                    value={projectForm.commitment_hours_per_week}
                    onChange={(e) => setProjectForm({ ...projectForm, commitment_hours_per_week: parseInt(e.target.value) })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9ca3af] uppercase">Team Size Needed</label>
                  <Input
                    type="number"
                    value={projectForm.team_size_needed}
                    onChange={(e) => setProjectForm({ ...projectForm, team_size_needed: parseInt(e.target.value) })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gradient-hero font-bold border-0 text-white shadow-lg mt-2">
                Publish Project Collaboration
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Express Interest Dialog */}
      {interestedProject && (
        <Dialog open={!!interestedProject} onOpenChange={() => setInterestedProject(null)}>
          <DialogContent className="bg-[#111827] border-[#374151] text-white rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-white text-xl">Express Collaboration Interest</DialogTitle>
              <DialogDescription className="text-xs text-[#9ca3af]">Let the project owner know how you can contribute to the team.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleExpressInterest} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Short Note / Skills Highlight</label>
                <Textarea
                  required
                  placeholder="Share a short summary of why you'd like to collaborate and what value you bring..."
                  value={interestForm.note}
                  onChange={(e) => setInterestForm({ ...interestForm, note: e.target.value })}
                  rows={4}
                  className="bg-[#1f2937]/50 border-[#374151]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Your Skills for Project (comma separated)</label>
                <Input
                  placeholder="e.g. React, UI/UX Design"
                  value={interestForm.skillsString}
                  onChange={(e) => setInterestForm({ ...interestForm, skillsString: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gradient-hero font-bold border-0 text-white shadow-lg mt-2">
                Submit Interest Note
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Project Owner: Manage Interests Panel Dialog */}
      {activeProjectForInterests && (
        <Dialog open={!!activeProjectForInterests} onOpenChange={() => setActiveProjectForInterests(null)}>
          <DialogContent className="bg-[#111827] border-[#374151] text-white rounded-3xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-white text-xl">Collaborators Applications</DialogTitle>
              <DialogDescription className="text-xs text-[#9ca3af]">Review candidate profiles who expressed interest in your project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2 overflow-y-auto max-h-[360px] scrollbar-thin">
              {projectInterestsList.map((i, idx) => (
                <div key={idx} className="p-4 bg-[#1f2937]/40 border border-[#374151]/20 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <img src={i.user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Avatar" className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <h4 className="font-bold text-xs text-white">{i.user.full_name}</h4>
                        <span className="text-[9px] text-[#9ca3af] uppercase font-bold">{i.user.role} • Batch {i.user.graduation_year}</span>
                      </div>
                    </div>
                    {i.accepted ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-0 flex items-center gap-1"><Check className="h-3 w-3" /> Accepted</Badge>
                    ) : (
                      <Button onClick={() => handleAcceptCollaborator(i.user_id)} className="h-8 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-bold text-[10px] px-3 border-0 shadow-sm">
                        Accept Collab
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-[#f9fafb] bg-[#0a0f1e]/40 p-3 rounded-lg border border-[#374151]/10 leading-relaxed italic">
                    "{i.note}"
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {i.skills.map((s: string, sidx: number) => (
                      <Badge key={sidx} variant="secondary" className="bg-[#1f2937] text-[#9ca3af] text-[9px] uppercase">{s}</Badge>
                    ))}
                  </div>
                </div>
              ))}
              {projectInterestsList.length === 0 && (
                <p className="text-xs text-[#9ca3af] text-center py-10 font-bold">No candidates have applied for this collaboration board post yet.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ──── ALL LISTINGS GRID VIEW ──── */}
      {activeTab === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => (
            <Card key={p.id} className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl overflow-hidden hover-lift hover:shadow-card-hover transition-all duration-300 relative border-gradient">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge className="bg-[#1f2937]/80 text-[#9ca3af] border-0 text-[10px] uppercase font-bold py-1">
                    {p.type.replace('-', ' ')}
                  </Badge>
                  {p.domain && (
                    <Badge className="bg-[#6366f1]/10 text-[#6366f1] border-0 text-[10px] uppercase py-1">
                      {p.domain}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-white leading-snug truncate font-display">{p.title}</h3>
                  <p className="text-xs text-[#9ca3af] line-clamp-3 leading-relaxed mt-2">{p.description}</p>
                </div>

                {/* Skills tags list */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {p.skills_needed.map((s, idx) => (
                    <Badge key={idx} variant="outline" className="bg-[#1f2937]/40 border-[#374151]/30 text-[#9ca3af] text-[9px] uppercase tracking-wide">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-[#9ca3af] pt-3 border-t border-[#374151]/20">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.commitment_hours_per_week} hrs/wk</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Team: {p.team_size_needed} max</span>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-[#374151]/20">
                  <img src={p.poster.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Avatar" className="h-8.5 w-8.5 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-white truncate">{p.poster.full_name}</h4>
                    <p className="text-[10px] text-[#9ca3af] truncate">{p.poster.role.toUpperCase()} • Batch {p.poster.graduation_year}</p>
                  </div>
                  {p.posted_by !== user?.id && (
                    <Button 
                      onClick={() => setInterestedProject(p)}
                      className="bg-primary hover:bg-primary/90 text-white font-bold text-[10px] h-8 rounded-lg border-0 shadow-sm px-4"
                    >
                      Collab
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-[#9ca3af] col-span-full text-center py-20 font-bold">No active project collaboration posts available.</p>
          )}
        </div>
      ) : (
        // ──── MY DASHBOARD DASHBOARD ────
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Postings */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
            <h3 className="font-extrabold text-white text-base mb-4 font-display flex items-center gap-2">
              <Inbox className="h-4.5 w-4.5 text-[#6366f1]" /> My Project Postings
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[350px] scrollbar-thin">
              {myProjects.posted.map((p: Project) => (
                <div key={p.id} className="p-4 bg-[#1f2937]/30 border border-[#374151]/20 rounded-xl flex justify-between items-center text-sm">
                  <div>
                    <h4 className="font-bold text-white">{p.title}</h4>
                    <span className="text-[10px] text-[#9ca3af]">Status: {p.status.toUpperCase()}</span>
                  </div>
                  <Button 
                    onClick={() => handleOpenInterestsPanel(p)}
                    className="h-8 bg-[#8b5cf6] text-white hover:bg-[#8b5cf6]/90 rounded-lg text-[10px] font-bold px-3 border-0"
                  >
                    View Interests
                  </Button>
                </div>
              ))}
              {myProjects.posted.length === 0 && (
                <p className="text-xs text-[#9ca3af] text-center py-10 font-bold">You have not posted any projects yet.</p>
              )}
            </div>
          </Card>

          {/* Applications Interested */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
            <h3 className="font-extrabold text-white text-base mb-4 font-display flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-yellow-400" /> Joined / Interested Teams
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[350px] scrollbar-thin">
              {myProjects.joined.map((p: Project) => (
                <div key={p.id} className="p-4 bg-[#1f2937]/30 border border-[#374151]/20 rounded-xl flex justify-between items-center text-sm">
                  <div>
                    <h4 className="font-bold text-white">{p.title}</h4>
                    <span className="text-[10px] text-emerald-400 font-bold">Joined Collaborator</span>
                  </div>
                </div>
              ))}
              {myProjects.interested.map((p: Project) => (
                <div key={p.id} className="p-4 bg-[#1f2937]/30 border border-[#374151]/20 rounded-xl flex justify-between items-center text-sm">
                  <div>
                    <h4 className="font-bold text-white">{p.title}</h4>
                    <span className="text-[10px] text-amber-400 font-bold">Applied (Pending Verification)</span>
                  </div>
                </div>
              ))}
              {myProjects.joined.length === 0 && myProjects.interested.length === 0 && (
                <p className="text-xs text-[#9ca3af] text-center py-10 font-bold">You have not applied for any project collaboration boards yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
