import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { GraduationCap, MessageSquare, Users, Route, Globe, Home, Menu, X, Sun, Moon, Briefcase, Calendar, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/directory', icon: Users, label: 'Directory' },
  { to: '/mentors', icon: Search, label: 'Mentors' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/roadmap', icon: Route, label: 'Roadmap' },
];

export default function Layout() {
  const location = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    setDark(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background gradient-mesh">
      <header className="sticky top-0 z-50 border-b glass-strong">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl gradient-hero shadow-lg transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
              <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full gradient-accent animate-pulse-glow" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black font-display text-gradient leading-tight">
                IIST Connect
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground hidden sm:block">
                Alumni Network Platform
              </span>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-3">
            <nav className="flex items-center gap-0.5 rounded-2xl bg-muted/50 p-1 shadow-sm">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'gradient-hero text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <a
              href="https://www.indoreinstitute.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground hover:border-accent/40 hover:shadow-card"
            >
              <Globe className="h-3.5 w-3.5" />
              IIST
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileNav(!mobileNav)} className="rounded-xl">
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileNav && (
          <div className="lg:hidden border-t glass-strong animate-slide-down">
            <nav className="mx-auto max-w-7xl px-4 py-3 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileNav(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'gradient-hero text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
              <a
                href="https://www.indoreinstitute.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                IIST Official Website
              </a>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <div key={location.pathname} className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      <footer className="border-t glass mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero">
                  <GraduationCap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-base font-black font-display text-gradient">IIST Connect</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                The alumni connecting platform for Indore Institute of Science & Technology. Building bridges between students and graduates.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-3">Platform</h4>
              <div className="space-y-2">
                {[
                  { to: '/directory', label: 'Alumni Directory' },
                  { to: '/mentors', label: 'Find Mentors' },
                  { to: '/jobs', label: 'Job Board' },
                  { to: '/events', label: 'Events' },
                  { to: '/chat', label: 'AI Career Advisor' },
                  { to: '/roadmap', label: 'Career Roadmaps' },
                ].map(link => (
                  <NavLink key={link.to} to={link.to} className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-3">Institute</h4>
              <div className="space-y-2">
                <a href="https://www.indoreinstitute.com" target="_blank" rel="noopener noreferrer" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">IIST Official Website</a>
                <a href="https://iist.indoreinstitute.com" target="_blank" rel="noopener noreferrer" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">IIST Portal</a>
              </div>
              <div className="flex items-center gap-1 mt-4">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">AI Online</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} IIST Connect — Indore Institute of Science & Technology. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
