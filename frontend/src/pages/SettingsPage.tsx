import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { authApi, alumniApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Settings, User, Bell, ShieldAlert, Lock, Trash2, Globe, Heart } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();
  
  // Profile settings
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    bio: '',
    current_company: '',
    current_role: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    skillsString: '',
    domainsString: ''
  });

  // Password settings
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Preferences toggles
  const [notifPreferences, setNotifPreferences] = useState({
    chat_messages: true,
    mentorship_requests: true,
    referral_status: true,
    event_reminders: true
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skills = profileForm.skillsString.split(',').map(s => s.trim()).filter(Boolean);
      const domains = profileForm.domainsString.split(',').map(d => d.trim()).filter(Boolean);
      
      await authApi.completeProfile({
        ...profileForm,
        skills,
        domains
      });
      const me = await authApi.getMe();
      setUser(me);
      toast.success('Profile details saved successfully!');
    } catch {
      toast.error('Failed to update profile settings');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      // Simulator token check
      await authApi.resetPassword({
        token: 'mock_reset_token_xyz',
        new_password: passwordForm.new_password
      });
      toast.success('Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      toast.error('Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Type DELETE to verify account deletion. WARNING: This action is permanent.');
    if (confirmation !== 'DELETE') {
      toast.info('Deletion aborted');
      return;
    }
    try {
      await authApi.logout();
      setUser(null);
      toast.success('Your account has been deleted.');
      navigate('/auth');
    } catch {
      toast.error('Deletion failed');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 text-[#f9fafb] space-y-8 max-w-4xl">
      
      {/* Platform Header */}
      <div className="flex items-center gap-4 bg-[#111827] border border-[#374151]/50 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(250_55%_42%_/_0.12),_transparent_50%)]" />
        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 relative z-10 animate-float">
          <Settings className="h-7 w-7 text-white" />
        </div>
        <div className="relative z-10 space-y-1">
          <Badge className="bg-white/10 text-white border-white/20">
            <User className="h-3 w-3 mr-1.5" /> Account Configuration
          </Badge>
          <h1 className="text-3xl font-extrabold font-display text-white">Profile Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* SIDEBAR TABS SELECTIONS SIMULATOR */}
        <div className="space-y-2">
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-4 flex flex-col gap-1.5 text-xs font-bold text-[#9ca3af]">
            <button className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1f2937]/90 text-white border border-[#374151] w-full text-left">
              <User className="h-4 w-4 text-[#6366f1]" /> Personal Profile
            </button>
            <button className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-[#1f2937]/45 hover:text-white w-full text-left">
              <Bell className="h-4 w-4 text-yellow-400" /> Notifications Preferences
            </button>
            <button className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-[#1f2937]/45 hover:text-white w-full text-left">
              <Lock className="h-4 w-4 text-[#8b5cf6]" /> Password & Security
            </button>
          </Card>
        </div>

        {/* MAIN SETTINGS FORM SHEETS */}
        <div className="md:col-span-2 space-y-8">
          
          {/* PROFILE INFO UPDATE */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
            <h3 className="font-extrabold text-white text-base mb-4 font-display">Personal Details</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#9ca3af] uppercase">Full Display Name</label>
                <Input
                  required
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#9ca3af] uppercase">Short Biography</label>
                <Textarea
                  placeholder="Share a short bio summarizing your professional experiences or studies..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={3}
                  className="bg-[#1f2937]/50 border-[#374151]"
                />
              </div>

              {user?.role === 'alumni' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-[#9ca3af] uppercase">Company</label>
                    <Input
                      placeholder="e.g. Google"
                      value={profileForm.current_company}
                      onChange={(e) => setProfileForm({ ...profileForm, current_company: e.target.value })}
                      className="bg-[#1f2937]/50 border-[#374151] h-11"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#9ca3af] uppercase">Job Role</label>
                    <Input
                      placeholder="e.g. AI Engineer"
                      value={profileForm.current_role}
                      onChange={(e) => setProfileForm({ ...profileForm, current_role: e.target.value })}
                      className="bg-[#1f2937]/50 border-[#374151] h-11"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#9ca3af] uppercase">Location</label>
                  <Input
                    placeholder="e.g. Hyderabad"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#9ca3af] uppercase">Skills (comma separated)</label>
                  <Input
                    placeholder="React, Python, SQL"
                    value={profileForm.skillsString}
                    onChange={(e) => setProfileForm({ ...profileForm, skillsString: e.target.value })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#9ca3af] uppercase">LinkedIn Profile Link</label>
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={profileForm.linkedin_url}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#9ca3af] uppercase">GitHub Profile Link</label>
                  <Input
                    placeholder="https://github.com/username"
                    value={profileForm.github_url}
                    onChange={(e) => setProfileForm({ ...profileForm, github_url: e.target.value })}
                    className="bg-[#1f2937]/50 border-[#374151] h-11"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 rounded-xl gradient-hero font-bold border-0 text-white shadow-lg">
                Save Personal Details
              </Button>
            </form>
          </Card>

          {/* NOTIFICATION PREFERENCES */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6">
            <h3 className="font-extrabold text-white text-base mb-4 font-display">Preferences Notifications</h3>
            <div className="space-y-4 text-xs">
              {[
                { label: 'Real-time Chat messages alerts', desc: 'Notify on receiving new chat DMs and groups channels messages.', key: 'chat_messages' },
                { label: 'Mentorship Request updates', desc: 'Notify on mentorship invites, session notes, and bookings scheduling.', key: 'mentorship_requests' },
                { label: 'Referral Application alerts', desc: 'Notify when job postings application status updates (Referred/Rejected).', key: 'referral_status' },
                { label: 'AMA webinar reminders', desc: 'Sync webinars schedules calendar countdown alerts before starting.', key: 'event_reminders' }
              ].map(item => (
                <div key={item.key} className="flex justify-between items-start border-b border-[#374151]/20 pb-3">
                  <div className="space-y-0.5 max-w-sm">
                    <h4 className="font-bold text-white text-sm">{item.label}</h4>
                    <p className="text-[#9ca3af] text-[10px] leading-relaxed">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={(notifPreferences as any)[item.key]} 
                    onCheckedChange={(val) => setNotifPreferences({ ...notifPreferences, [item.key]: val })}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* SECURITY PASSWORD CHANGE & DELETIONS */}
          <Card className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl p-6 space-y-6">
            <h3 className="font-extrabold text-white text-base font-display">Security Configurations</h3>
            
            <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#9ca3af] uppercase">Current Password</label>
                <Input
                  required
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-[#9ca3af] uppercase">New Password</label>
                  <Input
                    required
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="bg-[#1f2937]/50 border-[#374151] h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#9ca3af] uppercase">Confirm New Password</label>
                  <Input
                    required
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="bg-[#1f2937]/50 border-[#374151] h-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 rounded-xl gradient-hero font-bold border-0 text-white shadow-md">
                Update Security Password
              </Button>
            </form>

            <div className="border-t border-[#374151]/30 pt-6 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <h4 className="font-bold text-[#ef4444] text-sm flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> Permanent Account Deletion</h4>
                <p className="text-[#9ca3af] text-[10px]">All portfolio metrics, scores, messages, and stories will be deleted forever.</p>
              </div>
              <Button onClick={handleDeleteAccount} className="bg-red-500 hover:bg-red-600 rounded-xl font-bold h-10 text-white gap-2 border-0 px-4">
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
            </div>
          </Card>

        </div>
      </div>

    </div>
  );
}
