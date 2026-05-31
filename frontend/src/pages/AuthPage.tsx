import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GraduationCap, ArrowRight, Lock, Mail, User as UserIcon, Shield, Sparkles, Building, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  college_id: z.string().optional(),
  graduation_year: z.coerce.number().min(1995, 'Invalid year').max(2030, 'Invalid year').optional(),
  branch: z.string().optional(),
});

const quotes = [
  { text: "Through IIST Connect, I found a Google mentor who guided my resume review. Landing a job at DeepMind was a dream come true!", author: "Sarah Chen", role: "Class of 2018, Senior ML Engineer" },
  { text: "Referring juniors is the best way to give back. I've referred three students from Indore Institute who are now my colleagues.", author: "Amit Verma", role: "Class of 2015, Lead Architect at Amazon" },
  { text: "The AI Advisor simulated mock interview questions that came up word-for-word in my actual placement rounds. Highly recommended!", author: "Rahul Sharma", role: "Class of 2025, CS Student" },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const setUser = useAppStore(state => state.setUser);
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'student' | 'alumni'>('student');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [passwordInput, setPasswordInput] = useState('');

  // Password strength logic
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score += 20;
    if (pwd.length >= 10) score += 20;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
    return score;
  };
  const pwdStrength = getPasswordStrength(passwordInput);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm({ resolver: zodResolver(registerSchema) });

  const onLogin = async (data: any) => {
    try {
      const res = await authApi.login(data);
      setUser(res.user);
      toast.success(`Welcome back, ${res.user.full_name}!`);
      if (!res.user.is_profile_complete) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Login failed. Please verify credentials.');
    }
  };

  const onRegister = async (data: any) => {
    try {
      // Validate college domain if alumni
      if (role === 'alumni' && data.email) {
        const isCollege = data.email.endsWith('indoreinstitute.com') || data.email.endsWith('iist.in') || data.email.endsWith('.edu');
        if (!isCollege) {
          toast.warning('Alumni verification requires a college email domain (e.g. *.indoreinstitute.com)');
          return;
        }
      }
      
      const payload = { ...data, role };
      await authApi.register(payload);
      toast.success('Registration completed! Check your email for OTP.');
      
      // Enter OTP screen
      const otp = prompt('Enter the 6-digit OTP sent to your email (use 123456 to verify locally):');
      if (otp) {
        await authApi.verifyEmail({ email: data.email, otp });
        toast.success('Email verified successfully! You can now log in.');
        setIsRegister(false);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Registration failed.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await authApi.googleOAuth();
      setUser(res.user);
      toast.success(`Logged in with Google as ${res.user.full_name}`);
      if (!res.user.is_profile_complete) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (e) {
      toast.error('Google Sign In failed');
    }
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    try {
      await authApi.forgotPassword(email);
      toast.success('Password reset link sent to your email!');
      setForgotPassword(false);
    } catch (e) {
      toast.error('Email not found');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0a0f1e] overflow-hidden text-foreground">
      {/* LEFT PANEL - Testimonials and Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative gradient-hero overflow-hidden border-r border-[#374151]/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_hsl(250_55%_42%_/_0.3),_transparent_70%)]" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-[radial-gradient(circle,_hsl(38_92%_50%_/_0.06),_transparent_80%)]" />
        
        {/* Header logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl leading-none text-white font-display">IIST Connect</h1>
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-black mt-0.5">Alumni AI Network</p>
          </div>
        </div>

        {/* Testimonial slider */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <Badge className="bg-white/10 border-white/20 text-white font-semibold tracking-wide">
            <Sparkles className="h-3 w-3 mr-1.5 text-yellow-400" /> Connecting Indore Institute's Best
          </Badge>
          <div className="h-40 flex flex-col justify-center transition-all duration-500">
            <p className="text-2xl md:text-3xl font-extrabold text-white leading-tight italic">
              "{quotes[quoteIndex].text}"
            </p>
            <div className="mt-4">
              <h4 className="font-bold text-white">{quotes[quoteIndex].author}</h4>
              <p className="text-xs text-white/60">{quotes[quoteIndex].role}</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex justify-between text-xs text-white/50 border-t border-white/10 pt-6">
          <span>Indore Institute of Science & Technology</span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" /> iist.in
          </span>
        </div>
      </div>

      {/* RIGHT PANEL - Glassmorphism Forms */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative pattern-dots">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,_hsl(250_55%_42%_/_0.1),_transparent_75%)] pointer-events-none" />
        
        <Card className="w-full max-w-md bg-[#111827]/85 border-[#374151]/50 backdrop-blur-xl shadow-glow-primary rounded-3xl overflow-hidden relative border-gradient">
          <CardContent className="p-8 space-y-6">
            
            {/* Form Headers */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
                {forgotPassword ? 'Reset Password' : isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-[#9ca3af]">
                {forgotPassword 
                  ? 'Enter email to receive reset instructions' 
                  : isRegister 
                    ? 'Join the IIST networking community' 
                    : 'Log in to connect with alumni & students'}
              </p>
            </div>

            {forgotPassword ? (
              // FORGOT PASSWORD
              <form onSubmit={onForgot} className="space-y-4">
                <div className="space-y-1">
                  <Input 
                    type="email" 
                    name="email" 
                    placeholder="Enter email address" 
                    required 
                    className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50 focus:ring-primary focus:border-primary"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl gradient-hero hover:opacity-95 text-white font-bold gap-2">
                  Send Link <ArrowRight className="h-4 w-4" />
                </Button>
                <button type="button" onClick={() => setForgotPassword(false)} className="w-full text-center text-xs text-primary hover:underline block pt-2">
                  Back to Login
                </button>
              </form>
            ) : isRegister ? (
              // REGISTER ACCOUNT
              <div className="space-y-4">
                <Tabs defaultValue="student" onValueChange={(val) => setRole(val as any)} className="w-full">
                  <TabsList className="grid grid-cols-2 bg-[#1f2937] p-1 rounded-xl h-12">
                    <TabsTrigger value="student" className="rounded-lg font-bold data-[state=active]:bg-[#6366f1] data-[state=active]:text-white">Student</TabsTrigger>
                    <TabsTrigger value="alumni" className="rounded-lg font-bold data-[state=active]:bg-[#6366f1] data-[state=state]:text-white">Alumni</TabsTrigger>
                  </TabsList>
                  
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4 mt-4">
                    <div className="space-y-1">
                      <Input
                        type="text"
                        placeholder="Full Name"
                        {...registerForm.register('full_name')}
                        className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                      />
                      {registerForm.formState.errors.full_name && (
                        <p className="text-red-500 text-xs px-1">{registerForm.formState.errors.full_name.message as string}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Input
                        type="email"
                        placeholder={role === 'alumni' ? "College Email (required)" : "Email Address"}
                        {...registerForm.register('email')}
                        className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-red-500 text-xs px-1">{registerForm.formState.errors.email.message as string}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Input
                        type="password"
                        placeholder="Create Password"
                        {...registerForm.register('password')}
                        onChange={(e) => {
                          registerForm.register('password').onChange(e);
                          setPasswordInput(e.target.value);
                        }}
                        className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-red-500 text-xs px-1">{registerForm.formState.errors.password.message as string}</p>
                      )}
                      
                      {/* Password strength animation bar */}
                      {passwordInput && (
                        <div className="space-y-1 pt-1.5">
                          <div className="h-1 w-full bg-[#374151] rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                pwdStrength <= 40 ? 'bg-red-500' : pwdStrength <= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pwdStrength}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-right font-medium text-[#9ca3af]">
                            Complexity: {pwdStrength <= 40 ? 'Weak' : pwdStrength <= 80 ? 'Medium' : 'Strong'}
                          </p>
                        </div>
                      )}
                    </div>

                    {role === 'alumni' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          placeholder="Graduation Year"
                          {...registerForm.register('graduation_year')}
                          className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                        />
                        <Input
                          type="text"
                          placeholder="Branch (e.g. CSE)"
                          {...registerForm.register('branch')}
                          className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="text"
                          placeholder="Enrollment ID"
                          {...registerForm.register('college_id')}
                          className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                        />
                        <Input
                          type="text"
                          placeholder="Branch (e.g. CSE)"
                          {...registerForm.register('branch')}
                          className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12 rounded-xl gradient-hero hover:opacity-95 text-white font-bold gap-2">
                      Sign Up <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </Tabs>

                <div className="text-center pt-2">
                  <p className="text-xs text-[#9ca3af]">
                    Already have an account?{' '}
                    <button onClick={() => setIsRegister(false)} className="text-[#6366f1] font-bold hover:underline">
                      Log In
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              // LOGIN FORM
              <div className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-1">
                    <Input
                      type="email"
                      placeholder="Email Address"
                      {...loginForm.register('email')}
                      className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-red-500 text-xs px-1">{loginForm.formState.errors.email.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      type="password"
                      placeholder="Password"
                      {...loginForm.register('password')}
                      className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/50"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-xs px-1">{loginForm.formState.errors.password.message as string}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-[#9ca3af] hover:text-white hover:underline">
                      Forgot Password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl gradient-hero hover:opacity-95 text-white font-bold gap-2 shadow-lg">
                    Log In <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                {/* Social logins */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-x-0 h-[1px] bg-[#374151]" />
                  <span className="relative bg-[#111827] px-3 text-xs text-[#9ca3af]">Or continue with</span>
                </div>

                <Button 
                  onClick={handleGoogleSignIn}
                  variant="outline" 
                  className="w-full h-12 rounded-xl border-[#374151] bg-[#1f2937]/30 text-white font-bold gap-2.5 hover:bg-[#1f2937]/70"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.72 5.72 0 0 1 8.28 12.87a5.72 5.72 0 0 1 5.71-5.73 5.48 5.48 0 0 1 3.9 1.56l3.117-3.12A9.9 9.9 0 0 0 13.99 2 9.9 9.9 0 0 0 4 11.9a9.9 9.9 0 0 0 9.99 9.9c5.187 0 9.429-3.729 9.429-9.514 0-.6-.05-1.2-.148-1.785z"/>
                  </svg>
                  Sign In with Google
                </Button>

                <div className="text-center pt-2">
                  <p className="text-xs text-[#9ca3af]">
                    Don't have an account?{' '}
                    <button onClick={() => { setIsRegister(true); setPasswordInput(''); }} className="text-[#6366f1] font-bold hover:underline">
                      Sign Up
                    </button>
                  </p>
                </div>
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
