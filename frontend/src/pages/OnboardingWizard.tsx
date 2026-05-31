import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Briefcase, GraduationCap, Laptop, Link as LinkIcon, User as UserIcon, Check } from 'lucide-react';

const domainOptions = [
  'Software Development', 'AI/ML', 'Data Science', 'Cloud Computing',
  'Product Management', 'Cybersecurity', 'Web Development', 'Consulting', 'Core Engineering'
];

const skillOptions = [
  'Python', 'React', 'FastAPI', 'TypeScript', 'Node.js', 'SQL', 'PyTorch',
  'TensorFlow', 'Docker', 'Kubernetes', 'AWS', 'System Design', 'Git', 'Java', 'C++'
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    bio: '',
    current_company: '',
    current_role: '',
    location: '',
    graduation_year: user?.graduation_year || 2025,
    branch: user?.branch || 'CSE',
    domains: [] as string[],
    skills: [] as string[],
    linkedin_url: '',
    github_url: '',
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleDomainToggle = (dom: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(dom)
        ? prev.domains.filter(d => d !== dom)
        : [...prev.domains, dom]
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async () => {
    try {
      await authApi.completeProfile(formData);
      // Fetch fresh user record
      const updatedUser = await authApi.getMe();
      setUser(updatedUser);
      toast.success('Onboarding complete! Welcome to the network.');
      navigate('/');
    } catch (e) {
      toast.error('Failed to save profile onboarding details');
    }
  };

  const handleSkip = () => {
    toast.info('You skipped onboarding. You can complete your profile later in Settings.');
    navigate('/');
  };

  const percentComplete = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-foreground relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(250_55%_42%_/_0.15),_transparent_60%)] pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-3 relative z-10 px-4">
        <h2 className="text-3xl font-extrabold font-display text-white">Complete Your Profile</h2>
        <p className="text-[#9ca3af] text-sm">Help us personalize your networking experience at IIST.</p>
        
        {/* Progress Bar */}
        <div className="space-y-1.5 pt-4">
          <Progress value={percentComplete} className="h-2 bg-[#1f2937]" />
          <div className="flex justify-between text-xs text-[#9ca3af] font-semibold">
            <span>Step {step} of 5</span>
            <span>{percentComplete}% Complete</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <Card className="bg-[#111827] border-[#374151] rounded-3xl shadow-glow-primary overflow-hidden">
          <CardContent className="p-8 space-y-6">
            
            {/* STEP 1: Basic Bio */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-[#6366f1] border border-primary/20">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg text-white">Tell us about yourself</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Short Biography</label>
                  <Textarea
                    placeholder="Briefly describe your career background, goals, or academic interests..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="bg-[#1f2937]/50 border-[#374151] rounded-xl text-white placeholder-[#9ca3af]/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9ca3af]">Current Location</label>
                    <Input
                      placeholder="e.g. Indore"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                    />
                  </div>
                  {user?.role === 'alumni' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#9ca3af]">Current Company</label>
                      <Input
                        placeholder="e.g. Google"
                        value={formData.current_company}
                        onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                        className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                      />
                    </div>
                  )}
                </div>

                {user?.role === 'alumni' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9ca3af]">Current Job Title / Role</label>
                    <Input
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.current_role}
                      onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
                      className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Education Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-[#6366f1] border border-primary/20">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg text-white">Education Information</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9ca3af] uppercase">Graduation Batch Year</label>
                    <Input
                      type="number"
                      value={formData.graduation_year}
                      onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value) })}
                      className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9ca3af] uppercase">Branch of Study</label>
                    <Input
                      placeholder="e.g. Computer Science"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Domain Selection */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-[#6366f1] border border-primary/20">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg text-white">Select Your Areas of Interest</h3>
                </div>

                <p className="text-xs text-[#9ca3af] leading-relaxed">Choose one or more domains you specialize in or wish to learn about:</p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {domainOptions.map((dom) => {
                    const isSelected = formData.domains.includes(dom);
                    return (
                      <Badge
                        key={dom}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => handleDomainToggle(dom)}
                        className={`text-xs px-4 py-2 rounded-xl cursor-pointer select-none transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[#8b5cf6] text-white shadow-glow border-0 hover:bg-[#8b5cf6]' 
                            : 'border-[#374151] hover:border-[#8b5cf6] text-[#9ca3af] hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1.5 inline" />}
                        {dom}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Skills Checklist */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-[#6366f1] border border-primary/20">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg text-white">Core Skills & Technologies</h3>
                </div>

                <p className="text-xs text-[#9ca3af] leading-relaxed">Check off your top technical/professional skills:</p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {skillOptions.map((skill) => {
                    const isSelected = formData.skills.includes(skill);
                    return (
                      <Badge
                        key={skill}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => handleSkillToggle(skill)}
                        className={`text-xs px-4 py-2 rounded-xl cursor-pointer select-none transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[#10b981] text-white shadow-md border-0 hover:bg-[#10b981]' 
                            : 'border-[#374151] hover:border-[#10b981] text-[#9ca3af] hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1.5 inline" />}
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: Social / Professional Links */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-[#6366f1] border border-primary/20">
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-lg text-white">Social Connections</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9ca3af]">LinkedIn Profile URL</label>
                    <Input
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9ca3af]">GitHub Profile URL</label>
                    <Input
                      placeholder="https://github.com/username"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS */}
            <div className="flex justify-between border-t border-[#374151]/50 pt-6">
              <div className="flex gap-2">
                {step > 1 ? (
                  <Button variant="ghost" onClick={prevStep} className="h-11 rounded-xl text-[#9ca3af] hover:bg-[#1f2937]">
                    Back
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={handleSkip} className="h-11 rounded-xl text-[#9ca3af] hover:bg-[#1f2937]">
                    Skip
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 5 ? (
                  <Button onClick={nextStep} className="gradient-hero h-11 px-6 rounded-xl text-white font-bold">
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600 h-11 px-8 rounded-xl text-white font-bold shadow-lg">
                    Complete Profile
                  </Button>
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
