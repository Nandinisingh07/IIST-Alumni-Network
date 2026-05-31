import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminApi, analyticsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Shield, Users, Calendar, BookOpen, AlertTriangle, Send, Check, Trash, UploadCloud, TrendingUp } from 'lucide-react';

interface Stats {
  total_users: number;
  active_this_month: number;
  sessions_booked: number;
  stories_published: number;
  events_held: number;
  referrals_posted: number;
}

interface UserItem {
  id: number;
  email: string;
  role: string;
  full_name: string;
  is_verified: boolean;
  graduation_year?: number;
  branch?: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    active_this_month: 0,
    sessions_booked: 0,
    stories_published: 0,
    events_held: 0,
    referrals_posted: 0
  });

  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [pendingStories, setPendingStories] = useState<any[]>([]);
  const [pendingRoadmaps, setPendingRoadmaps] = useState<any[]>([]);
  
  // Announcement Forms
  const [announcement, setAnnouncement] = useState({
    title: '',
    body: '',
    target_role: 'all'
  });

  const fetchData = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
      
      const uList = await adminApi.getUsers();
      setUsersList(uList);
      
      const stories = await adminApi.getPendingStories();
      setPendingStories(stories);
      
      const roadmaps = await adminApi.getPendingRoadmaps();
      setPendingRoadmaps(roadmaps);
    } catch {
      toast.error('Failed to load admin controls');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyAlumni = async (userId: number) => {
    try {
      await adminApi.verifyUser(userId);
      toast.success('Alumni verified successfully!');
      fetchData();
    } catch {
      toast.error('Verification failed');
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!confirm('Are you sure you want to ban and remove this user?')) return;
    try {
      await adminApi.banUser(userId);
      toast.success('User has been banned and deleted');
      fetchData();
    } catch {
      toast.error('Failed to ban user');
    }
  };

  const handleApproveStory = async (storyId: number) => {
    try {
      await adminApi.approveStory(storyId);
      toast.success('Story approved and featured!');
      fetchData();
    } catch {
      toast.error('Story approval failed');
    }
  };

  const handleApproveRoadmap = async (roadmapId: number) => {
    try {
      await adminApi.approveRoadmap(roadmapId);
      toast.success('Roadmap approved successfully!');
      fetchData();
    } catch {
      toast.error('Roadmap approval failed');
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.broadcastAnnouncement(announcement);
      toast.success('Announcement broadcast notice sent to emails!');
      setAnnouncement({ title: '', body: '', target_role: 'all' });
    } catch {
      toast.error('Failed to broadcast notice');
    }
  };

  const handleBulkUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const res = await analyticsApi.uploadCSV(e.target.files[0]);
        toast.success(`CSV Imported successfully! Added ${res.records_imported} records.`);
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'CSV upload failed.');
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 text-[#f9fafb] space-y-8">
      
      {/* Platform Header */}
      <div className="flex justify-between items-end bg-[#111827]/80 border border-[#374151]/30 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(0_75%_55%_/_0.06),_transparent_50%)]" />
        <div className="relative z-10 space-y-3">
          <Badge className="bg-white/10 text-white border-white/20">
            <Shield className="h-3.5 w-3.5 mr-2 text-red-500" /> Platform Admin
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-none font-display">
            Moderator <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-sm text-[#9ca3af] max-w-sm">
            Manage Indore Institute's verified accounts list, review pending story boards, trigger announcements, and upload placement tables.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts', value: stats.total_users, icon: Users, color: 'text-primary' },
          { label: 'Active this Month', value: stats.active_this_month, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Sessions Booked', value: stats.sessions_booked, icon: Calendar, color: 'text-yellow-500' },
          { label: 'Stories Published', value: stats.stories_published, icon: BookOpen, color: 'text-[#8b5cf6]' }
        ].map((kpi, idx) => (
          <Card key={idx} className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl shadow-elevated border-gradient">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#1f2937] flex items-center justify-center border border-[#374151]/30">
                <kpi.icon className={`h-5.5 w-5.5 ${kpi.color}`} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-wider block">{kpi.label}</span>
                <h3 className="text-lg font-black text-white leading-none mt-1">{kpi.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT TWO COLUMNS: USERS MANAGEMENT & CONTENT APPROVAL */}
        <div className="lg:col-span-2 space-y-8">
          {/* User management list */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
            <h3 className="font-extrabold text-white text-base mb-4 font-display">Manage Platform Accounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#374151] text-[#9ca3af] font-black uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#374151]/20">
                  {usersList.map(u => (
                    <tr key={u.id} className="text-[#f9fafb]">
                      <td className="py-3 font-semibold">{u.full_name}<span className="text-[10px] text-[#9ca3af] block">{u.email}</span></td>
                      <td className="py-3 uppercase font-bold text-primary">{u.role}</td>
                      <td className="py-3 text-[#9ca3af]">{u.branch || 'None'} {u.graduation_year ? `Batch ${u.graduation_year}` : ''}</td>
                      <td className="py-3 text-center flex justify-center gap-2">
                        {u.role === 'alumni' && !u.is_verified && (
                          <Button onClick={() => handleVerifyAlumni(u.id)} className="h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-bold text-[10px] px-2 border-0">
                            Verify Badge
                          </Button>
                        )}
                        <Button onClick={() => handleBanUser(u.id)} variant="ghost" className="h-7 hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-lg p-2.5">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pending content moderation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Stories */}
            <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
              <h3 className="font-extrabold text-white text-base mb-4 font-display">Moderate pending Stories</h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {pendingStories.map(s => (
                  <div key={s.id} className="p-3 bg-[#1f2937]/30 border border-[#374151]/20 rounded-xl flex justify-between items-center text-xs">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white truncate">{s.title}</h4>
                      <p className="text-[10px] text-[#9ca3af]">By Author ID: {s.author_id}</p>
                    </div>
                    <Button onClick={() => handleApproveStory(s.id)} className="h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-bold text-[10px] px-3.5 border-0">
                      Approve
                    </Button>
                  </div>
                ))}
                {pendingStories.length === 0 && (
                  <p className="text-xs text-[#9ca3af] text-center py-10 font-bold">No stories pending moderation approvals.</p>
                )}
              </div>
            </Card>

            {/* Pending Roadmaps */}
            <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
              <h3 className="font-extrabold text-white text-base mb-4 font-display">Moderate pending Roadmaps</h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {pendingRoadmaps.map(r => (
                  <div key={r.id} className="p-3 bg-[#1f2937]/30 border border-[#374151]/20 rounded-xl flex justify-between items-center text-xs">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white truncate">{r.title}</h4>
                      <p className="text-[10px] text-[#9ca3af]">Domain: {r.domain}</p>
                    </div>
                    <Button onClick={() => handleApproveRoadmap(r.id)} className="h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-bold text-[10px] px-3.5 border-0">
                      Approve
                    </Button>
                  </div>
                ))}
                {pendingRoadmaps.length === 0 && (
                  <p className="text-xs text-[#9ca3af] text-center py-10 font-bold">No custom roadmaps pending moderation.</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: BROADCAST & BULK IMPORT */}
        <div className="space-y-8">
          {/* Broadcast Form */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
            <h3 className="font-extrabold text-white text-base mb-4 font-display flex items-center gap-1.5">
              <Send className="h-4.5 w-4.5 text-[#6366f1]" /> Broadcast Notice
            </h3>

            <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#9ca3af] uppercase">Announcement Title</label>
                <Input
                  required
                  placeholder="Enter broadcast subject..."
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#9ca3af] uppercase">Notice Body</label>
                <Textarea
                  required
                  placeholder="Draft broadcast announcement copy details..."
                  value={announcement.body}
                  onChange={(e) => setAnnouncement({ ...announcement, body: e.target.value })}
                  rows={4}
                  className="bg-[#1f2937]/50 border-[#374151]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#9ca3af] uppercase">Target Roles segment</label>
                <select
                  value={announcement.target_role}
                  onChange={(e) => setAnnouncement({ ...announcement, target_role: e.target.value })}
                  className="w-full bg-[#1f2937]/50 border border-[#374151] rounded-xl h-10 px-2 text-xs text-white"
                >
                  <option value="all">Broadcast to All Accounts</option>
                  <option value="student">Broadcast to Students Only</option>
                  <option value="alumni">Broadcast to Alumni Only</option>
                </select>
              </div>

              <Button type="submit" className="w-full h-10 rounded-xl gradient-hero font-bold border-0 text-white shadow-md gap-2">
                <Send className="h-3.5 w-3.5" /> Broadcast emails
              </Button>
            </form>
          </Card>

          {/* Placement Bulk CSV importer */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 text-center space-y-4">
            <h3 className="font-extrabold text-white text-base font-display">Bulk Import Placements</h3>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              Upload a comma-separated CSV placement log to update analytics dashboard graphs instantly.
            </p>
            <div className="border-2 border-dashed border-[#374151] rounded-2xl p-6 relative cursor-pointer group hover:border-[#6366f1] transition-all">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleBulkUploadCSV}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="h-8 w-8 text-[#9ca3af] mx-auto mb-2" />
              <span className="text-[10px] font-bold text-[#9ca3af] group-hover:text-white">Choose CSV File</span>
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
