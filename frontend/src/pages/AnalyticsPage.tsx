import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { analyticsApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, DollarSign, Users, Award, Calendar, FileDown, Upload } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AnalyticsPage() {
  const { user } = useAppStore();
  const [summary, setSummary] = useState<any>({
    total_placements: 0,
    avg_package: 0,
    highest_package: 0,
    percent_placed: 0,
    top_recruiter: 'None'
  });
  
  // Charts States
  const [placementsData, setPlacementsData] = useState<any[]>([]);
  const [salaryTrendsData, setSalaryTrendsData] = useState<any[]>([]);
  const [domainData, setDomainData] = useState<any[]>([]);
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  
  const [yearFilter, setYearFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const fetchAnalytics = async () => {
    try {
      const year = yearFilter === 'all' ? undefined : parseInt(yearFilter);
      const branch = branchFilter === 'all' ? undefined : branchFilter;
      
      const sum = await analyticsApi.getSummary({ year, branch });
      setSummary(sum);
      
      const trend = await analyticsApi.getSalaryTrends({ branch });
      setSalaryTrendsData(trend);
      
      const dom = await analyticsApi.getDomains({ year });
      setDomainData(dom);
      
      const comps = await analyticsApi.getCompanies({ year, branch });
      setCompaniesData(comps);

      // Map placements count per branch (mock aggregate)
      setPlacementsData([
        { name: 'Computer Science', count: sum.total_placements ? Math.round(sum.total_placements * 0.5) : 80 },
        { name: 'Information Tech', count: sum.total_placements ? Math.round(sum.total_placements * 0.3) : 50 },
        { name: 'Electronics Comm', count: sum.total_placements ? Math.round(sum.total_placements * 0.2) : 30 }
      ]);
    } catch {
      toast.error('Failed to load analytics dashboard data');
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [yearFilter, branchFilter]);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        await analyticsApi.uploadCSV(e.target.files[0]);
        toast.success('Placement data CSV imported successfully!');
        fetchAnalytics();
      } catch (err: any) {
        toast.error(err.response?.data?.detail || 'CSV upload failed. Verify columns matching.');
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 text-[#f9fafb] space-y-8">
      
      {/* Filters Sticky Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111827] border border-[#374151]/50 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(230_65%_28%_/_0.15),_transparent_50%)]" />
        <div className="relative z-10 space-y-1">
          <Badge className="bg-white/10 text-white border-white/20">
            <BarChart3 className="h-3 w-3 mr-1.5 text-[#6366f1]" /> Campus Metrics
          </Badge>
          <h1 className="text-3xl font-extrabold font-display text-white">Placement Analytics</h1>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-3 relative z-10 w-full md:w-auto">
          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-[#1f2937]/50 border border-[#374151] rounded-xl h-11 px-3 text-white text-xs outline-none"
          >
            <option value="all">All Batches</option>
            <option value="2023">Batch 2023</option>
            <option value="2024">Batch 2024</option>
            <option value="2025">Batch 2025</option>
          </select>

          <select 
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-[#1f2937]/50 border border-[#374151] rounded-xl h-11 px-3 text-white text-xs outline-none"
          >
            <option value="all">All Branches</option>
            <option value="Computer Science">Computer Science (CSE)</option>
            <option value="Information Technology">Information Tech (IT)</option>
            <option value="Electronics & Comm">Electronics & Comm (ECE)</option>
          </select>

          {user?.role === 'admin' && (
            <div className="relative">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleCSVUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
              <Button className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white font-bold h-11 px-4 rounded-xl gap-2 border-0">
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Placements', value: summary.total_placements, icon: Users, color: 'text-[#6366f1]' },
          { label: 'Average Package', value: `${summary.avg_package} LPA`, icon: DollarSign, color: 'text-[#10b981]' },
          { label: 'Highest Package', value: `${summary.highest_package} LPA`, icon: TrendingUp, color: 'text-yellow-400' },
          { label: 'Top Recruiter', value: summary.top_recruiter, icon: Award, color: 'text-[#8b5cf6]' }
        ].map((kpi, idx) => (
          <Card key={idx} className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl shadow-elevated overflow-hidden border-gradient">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#1f2937] flex items-center justify-center border border-[#374151]/30">
                <kpi.icon className={`h-5.5 w-5.5 ${kpi.color}`} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-wider block">{kpi.label}</span>
                <h3 className="text-lg font-black text-white truncate leading-none mt-1">{kpi.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BAR CHART: Recruiting Headcounts per Branch */}
        <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
          <h3 className="font-extrabold text-white text-base mb-6 font-display">Placements count per Branch</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={placementsData}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* LINE CHART: Salary Package Trends over years */}
        <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
          <h3 className="font-extrabold text-white text-base mb-6 font-display">Salary Package Trends (LPA)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salaryTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151/20" />
              <XAxis dataKey="year" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb' }} />
              <Legend />
              <Line type="monotone" dataKey="avg_package" name="Average LPA" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="highest_package" name="Highest LPA" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* DONUT CHART: Domains Distribution */}
        <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="font-extrabold text-white text-base mb-6 font-display self-start">Domain Distribution</h3>
          {domainData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={domainData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="domain"
                >
                  {domainData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-[#9ca3af] py-20">No domain metrics found for this batch.</p>
          )}
        </Card>

        {/* BAR CHART: Recruiting Companies counts */}
        <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
          <h3 className="font-extrabold text-white text-base mb-6 font-display">Top Recruiting Companies</h3>
          <div className="space-y-4 overflow-y-auto max-h-[220px] scrollbar-thin pr-2">
            {companiesData.map((c, index) => (
              <div key={index} className="flex justify-between items-center text-sm border-b border-[#374151]/20 pb-2.5">
                <div>
                  <h4 className="font-bold text-white">{c.company}</h4>
                  <span className="text-[10px] text-[#9ca3af]">Avg Package: {c.avg_package} LPA</span>
                </div>
                <Badge className="bg-[#6366f1]/15 text-[#6366f1] border-0 text-xs px-2.5 py-1">
                  {c.count} Hires
                </Badge>
              </div>
            ))}
            {companiesData.length === 0 && (
              <p className="text-xs text-[#9ca3af] text-center py-20 font-bold">No companies recruited in this filter slot yet.</p>
            )}
          </div>
        </Card>

      </div>

    </div>
  );
}
