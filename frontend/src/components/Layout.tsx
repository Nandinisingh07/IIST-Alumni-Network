import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  GraduationCap, MessageSquare, Users, Route, Globe, Home, Menu, X, 
  Sun, Moon, Briefcase, Calendar, Search, BookOpen, Bell, Settings, 
  LogOut, Shield, Award, Users2, Brain, ChevronLeft, ChevronRight, Check,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store';
import { authApi, notificationsApi } from '@/lib/api';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, sidebarOpen, toggleSidebar, notifications, setNotifications, addNotification, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const [dark, setDark] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = () => {
    setDark(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch {
      toast.error('Logout failed');
    }
  };

  // 1. Fetch In-App Notifications on startup
  useEffect(() => {
    if (user) {
      notificationsApi.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [user, setNotifications]);

  // 2. Establish Real-time Socket.io Connection
  useEffect(() => {
    if (!user) return;
    
    // Connect to backend Socket.io
    const socket = io('http://localhost:8000');
    
    socket.on('connect', () => {
      console.log('[SOCKET] Connected to server');
      // Join user specific room
      socket.emit('join_room', { room_id: `user_${user.id}` });
    });

    // Listen to real-time notification pushes
    socket.on('new_notification', (data) => {
      addNotification(data);
      toast.info(`🔔 ${data.title}: ${data.body}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, addNotification]);

  const handleMarkRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      markNotificationRead(id);
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      markAllNotificationsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  // Dynamic Sidebar Navigation Lists (Role-based)
  const getSidebarItems = () => {
    if (user?.role === 'admin') {
      return [
        { to: '/', icon: Home, label: 'Overview' },
        { to: '/admin', icon: Shield, label: 'Admin Panel' },
        { to: '/directory', icon: Users, label: 'Directory' },
        { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
        { to: '/settings', icon: Settings, label: 'Settings' }
      ];
    }
    
    if (user?.role === 'alumni') {
      return [
        { to: '/', icon: Home, label: 'Dashboard' },
        { to: '/directory', icon: Users, label: 'Alumni Directory' },
        { to: '/mentors', icon: Search, label: 'Mentees List' },
        { to: '/jobs', icon: Briefcase, label: 'Post Referral' },
        { to: '/events', icon: Calendar, label: 'Post Event' },
        { to: '/stories', icon: BookOpen, label: 'Stories Wall' },
        { to: '/projects', icon: Users2, label: 'Project boards' },
        { to: '/mock-interviews', icon: Award, label: 'Post Mock Slot' },
        { to: '/chat', icon: MessageSquare, label: 'Inbox DMs' },
        { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
        { to: '/leaderboard', icon: Award, label: 'Leaderboard' },
        { to: '/settings', icon: Settings, label: 'Settings' }
      ];
    }

    // Default student items
    return [
      { to: '/', icon: Home, label: 'Dashboard' },
      { to: '/directory', icon: Users, label: 'Directory' },
      { to: '/mentors', icon: Search, label: 'Find a Mentor' },
      { to: '/roadmap', icon: Route, label: 'Roadmaps' },
      { to: '/events', icon: Calendar, label: 'Webinars Calendar' },
      { to: '/jobs', icon: Briefcase, label: 'Referral Board' },
      { to: '/stories', icon: BookOpen, label: 'Stories Wall' },
      { to: '/projects', icon: Users2, label: 'Collaboration' },
      { to: '/mock-interviews', icon: Award, label: 'Mock Interviews' },
      { to: '/ai-chat', icon: Brain, label: 'AI Advisor' },
      { to: '/chat', icon: MessageSquare, label: 'Inbox DMs' },
      { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
      { to: '/leaderboard', icon: Award, label: 'Leaderboard' }
    ];
  };

  const navItems = getSidebarItems();
  const unreadNotifications = notifications.filter(n => !n.is_read);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0f1e] text-[#f9fafb]">
      {/* ──── SIDEBAR LEFT PANEL ──── */}
      <aside 
        className={`hidden lg:flex flex-col border-r border-[#374151]/30 bg-[#111827]/95 transition-all duration-300 relative z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#374151]/20">
          {sidebarOpen ? (
            <NavLink to="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center shadow-md animate-float">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold text-sm text-white font-display">IIST Connect</span>
            </NavLink>
          ) : (
            <div className="mx-auto h-9 w-9 rounded-xl gradient-hero flex items-center justify-center shadow-md animate-float">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          )}
          <button 
            onClick={toggleSidebar} 
            className="text-[#9ca3af] hover:text-white p-1 hover:bg-[#1f2937] rounded-lg transition-colors hidden sm:block"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation lists */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
          {navItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3 py-3 text-xs font-bold rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'gradient-hero text-white shadow-glow-primary border-0' 
                    : 'text-[#9ca3af] hover:bg-[#1f2937]/50 hover:text-white'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ──── MAIN PLATFORM SPACE ──── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#374151]/30 bg-[#111827]/85 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
          {/* Mobile hamburger navigation toggler */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setMobileNav(!mobileNav)} className="lg:hidden text-[#9ca3af] hover:text-white rounded-xl">
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            {/* Search bar global */}
            <form onSubmit={handleGlobalSearch} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search alumni, skills, roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 w-64 bg-[#1f2937]/40 border border-[#374151] rounded-xl text-xs text-white placeholder-[#9ca3af]/40 outline-none focus:ring-1 ring-[#6366f1] transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Theme switcher */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl text-[#9ca3af] hover:text-white">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* In-app Notification Bell Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative h-10 w-10 flex items-center justify-center hover:bg-[#1f2937]/60 rounded-xl transition-all">
                  <Bell className="h-5 w-5 text-[#9ca3af] hover:text-white" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#111827] animate-pulse" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-[#111827] border-[#374151] text-white rounded-2xl p-2 z-50">
                <DropdownMenuLabel className="flex justify-between items-center text-xs font-black uppercase text-[#9ca3af] px-3 py-2">
                  <span>Notifications</span>
                  {unreadNotifications.length > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[#6366f1] hover:underline font-bold text-[10px]">Mark all read</button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#374151]/30" />
                <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-1">
                  {notifications.map((note) => (
                    <DropdownMenuItem 
                      key={note.id}
                      onClick={() => {
                        notificationsApi.markRead(note.id).then(() => markNotificationRead(note.id));
                        if (note.link) navigate(note.link);
                      }}
                      className={`p-3 rounded-xl flex flex-col items-start gap-1 cursor-pointer transition-colors ${
                        note.is_read ? 'opacity-60 hover:bg-[#1f2937]/30' : 'bg-[#1f2937]/60 hover:bg-[#1f2937]/90'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-extrabold text-xs text-white">{note.title}</span>
                        {!note.is_read && (
                          <button onClick={(e) => handleMarkRead(note.id, e)} className="text-[10px] text-[#6366f1] font-bold">Read</button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9ca3af] leading-relaxed">{note.body}</p>
                    </DropdownMenuItem>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-center text-[#9ca3af] text-xs py-8 font-bold">No notifications found.</p>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <img 
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                  alt="Avatar" 
                  className="h-9 w-9 rounded-xl object-cover border border-[#374151]/50 cursor-pointer shadow hover:opacity-90" 
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#111827] border-[#374151] text-white rounded-2xl p-2 z-50">
                <DropdownMenuLabel className="px-3 py-2">
                  <h4 className="font-extrabold text-sm text-white leading-none">{user?.full_name}</h4>
                  <span className="text-[9px] text-[#9ca3af] font-bold uppercase mt-1 block">{user?.role} account</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#374151]/30" />
                <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl p-2.5 text-xs font-bold gap-2 cursor-pointer hover:bg-[#1f2937] text-white">
                  <Settings className="h-4 w-4" /> Profile settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl p-2.5 text-xs font-bold gap-2 cursor-pointer text-red-400 hover:text-red-500 hover:bg-red-500/10">
                  <LogOut className="h-4 w-4" /> Logout session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileNav && (
          <div className="lg:hidden fixed inset-x-0 top-16 bg-[#111827] border-b border-[#374151]/30 p-4 z-50 flex flex-col gap-2 max-h-[70vh] overflow-y-auto shadow-2xl animate-slide-down">
            {navItems.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileNav(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3.5 text-xs font-bold rounded-xl ${
                    isActive ? 'gradient-hero text-white' : 'text-[#9ca3af] hover:bg-[#1f2937]'
                  }`
                }
              >
                <item.icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto scrollbar-thin relative p-6 bg-[#0a0f1e] gradient-mesh">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
