import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gamificationApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Award, Trophy, Sparkles, BookOpen, Star, HelpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LeaderboardUser {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  role: string;
  total_points: number;
  rank: number;
}

interface BadgeItem {
  id: number;
  name: string;
  description: string;
  icon_url?: string;
  criteria?: string;
}

export default function LeaderboardPage() {
  const { user } = useAppStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [myBadges, setMyBadges] = useState<BadgeItem[]>([]);
  const [myScore, setMyScore] = useState<any>({
    total_points: 0,
    breakdown: { mentoring: 0, stories: 0, referrals: 0, events: 0, reviews: 0 }
  });
  
  const [segment, setSegment] = useState<'alumni' | 'student'>('alumni');
  const [period, setPeriod] = useState<'monthly' | 'all-time'>('all-time');

  const fetchData = async () => {
    try {
      const lb = await gamificationApi.getLeaderboard({ type: segment, period });
      setLeaderboard(lb);
      
      const allBadges = await gamificationApi.getBadges();
      setBadges(allBadges);
      
      const earned = await gamificationApi.getMyBadges();
      setMyBadges(earned);
      
      const score = await gamificationApi.getScore();
      setMyScore(score);
    } catch {
      toast.error('Failed to load gamification metrics');
    }
  };

  useEffect(() => {
    fetchData();
  }, [segment, period]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">👑 🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-xs font-black text-[#9ca3af]">#{rank}</span>;
  };

  const isBadgeEarned = (badgeId: number) => myBadges.some(b => b.id === badgeId);

  return (
    <div className="container mx-auto py-8 px-4 text-[#f9fafb] space-y-8">
      
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111827] border border-[#374151]/50 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.12),_transparent_50%)]" />
        <div className="relative z-10 space-y-3">
          <Badge className="bg-white/10 text-white border-white/20">
            <Trophy className="h-3.5 w-3.5 mr-2 text-yellow-400" /> Contribution Hall
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-none font-display">
            Platform <span className="text-gradient-accent">Leaderboard</span>
          </h1>
          <p className="text-sm text-[#9ca3af] max-w-sm">
            Recognizing college alumni and student contributors who dedicate time to mentoring, stories, jobs referrals, and AMAs.
          </p>
        </div>

        {/* Filter Tab controls */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
          <Tabs defaultValue="alumni" onValueChange={(val) => setSegment(val as any)} className="bg-[#1f2937]/50 p-1 rounded-xl h-11 border border-[#374151]/30">
            <TabsList className="bg-transparent border-0 gap-1">
              <TabsTrigger value="alumni" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">Alumni</TabsTrigger>
              <TabsTrigger value="student" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">Students</TabsTrigger>
            </TabsList>
          </Tabs>

          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-[#1f2937]/50 border border-[#374151] rounded-xl h-11 px-3 text-white text-xs outline-none"
          >
            <option value="all-time">All-Time Score</option>
            <option value="monthly">Monthly Active</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: MY SCORE CARD & BADGES SHELF */}
        <div className="space-y-6">
          {/* User Score Card */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl shadow-elevated border-gradient">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#374151]/30">
                <h3 className="font-extrabold text-sm text-white">My Contribution Score</h3>
                <Sparkles className="h-5 w-5 text-yellow-400 animate-float" />
              </div>
              
              <div className="text-center py-4">
                <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-wider block">Total Points</span>
                <h1 className="text-4xl font-black text-white mt-1">{myScore.total_points} 🎉</h1>
              </div>

              {/* Point Breakdown bars */}
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Mentoring Sessions', key: 'mentoring', color: 'bg-[#6366f1]' },
                  { label: 'Stories Published', key: 'stories', color: 'bg-[#8b5cf6]' },
                  { label: 'Job Referrals Posted', key: 'referrals', color: 'bg-[#10b981]' },
                  { label: 'AMA Webinars Hosted', key: 'events', color: 'bg-yellow-500' },
                  { label: 'Reviews Received', key: 'reviews', color: 'bg-red-500' }
                ].map(b => (
                  <div key={b.key} className="space-y-1">
                    <div className="flex justify-between text-xs text-[#9ca3af] font-semibold">
                      <span>{b.label}</span>
                      <span>{myScore.breakdown[b.key] || 0} pts</span>
                    </div>
                    <Progress value={Math.min(100, (myScore.breakdown[b.key] || 0) * 0.8)} className="h-1.5 bg-[#1f2937]" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Badges Shelf */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-white text-base font-display">My Badges Shelf</h3>
            <div className="grid grid-cols-4 gap-3 pt-2">
              {badges.map(b => {
                const earned = isBadgeEarned(b.id);
                return (
                  <div 
                    key={b.id} 
                    className="relative group flex flex-col items-center"
                    title={`${b.name}: ${b.description}`}
                  >
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      earned 
                        ? 'bg-[#8b5cf6]/10 border-[#8b5cf6] text-[#8b5cf6] shadow-glow' 
                        : 'bg-[#1f2937]/30 border-[#374151] text-[#9ca3af]/40 grayscale'
                    }`}>
                      <Award className="h-6 w-6" />
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-14 hidden group-hover:block bg-[#111827] border border-[#374151] p-3 rounded-xl text-center z-20 w-44 shadow-lg animate-fade-in">
                      <h4 className="font-bold text-xs text-white">{b.name}</h4>
                      <p className="text-[10px] text-[#9ca3af] mt-1">{b.description}</p>
                      <span className="text-[9px] text-[#6366f1] font-semibold mt-1 block">Req: {b.criteria}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: LEADERBOARD LIST */}
        <Card className="lg:col-span-2 bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
          <div className="flex justify-between items-center pb-4 border-b border-[#374151]/30 mb-4">
            <h3 className="font-extrabold text-white text-base font-display">Top Contributors</h3>
            <span className="text-xs text-[#9ca3af] font-semibold">Updated weekly</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[500px] scrollbar-thin pr-1">
            {leaderboard.map((item) => (
              <div 
                key={item.user_id}
                className={`p-4 bg-[#1f2937]/25 hover:bg-[#1f2937]/50 border rounded-2xl flex justify-between items-center transition-all duration-200 ${
                  item.user_id === user?.id 
                    ? 'border-[#6366f1]/40 shadow-glow-primary' 
                    : 'border-[#374151]/20'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-[#1f2937] border border-[#374151]/50">
                    {getRankBadge(item.rank)}
                  </div>
                  <img 
                    src={item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                    alt="Avatar" 
                    className="h-11 w-11 rounded-xl object-cover border border-[#374151]/30 shrink-0" 
                  />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-white truncate">{item.full_name}</h4>
                    <span className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-wider">{item.role}</span>
                  </div>
                </div>

                <div className="text-right">
                  <h3 className="text-base font-black text-white">{item.total_points}</h3>
                  <span className="text-[9px] text-[#9ca3af] font-bold block uppercase tracking-wide">Points</span>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-sm text-[#9ca3af] text-center py-20 font-bold">No active users recorded in this leaderboard period.</p>
            )}
          </div>
        </Card>

      </div>

    </div>
  );
}
