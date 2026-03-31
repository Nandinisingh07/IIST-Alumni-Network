import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, Target, Rocket, BookOpen, Zap, Loader2, AlertCircle, ArrowRight, GraduationCap, RotateCcw, Download, Clock, Star } from 'lucide-react';
import { careerRoadmapAPI } from '@/lib/api';
import { toast } from 'sonner';

const quickPicks = [
  { label: 'Frontend Developer', icon: Zap, desc: 'React, TypeScript, UI/UX' },
  { label: 'Data Scientist', icon: BookOpen, desc: 'Python, ML, Statistics' },
  { label: 'Product Manager', icon: Rocket, desc: 'Strategy, Analytics' },
  { label: 'AI/ML Engineer', icon: Sparkles, desc: 'Deep Learning, NLP' },
  { label: 'DevOps Engineer', icon: Target, desc: 'Cloud, CI/CD, Docker' },
  { label: 'Full Stack Developer', icon: Star, desc: 'Frontend + Backend' },
];

const stepIcons = ['🎯', '📚', '💻', '🧪', '🚀', '🏆', '💼', '🌟', '⚡', '🎓'];

export default function RoadmapPage() {
  const [goal, setGoal] = useState('');
  const [steps, setSteps] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeGoal, setActiveGoal] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const generate = async (text?: string) => {
    const target = text || goal;
    if (!target.trim()) return;
    if (text) setGoal(text);
    setActiveGoal(target.trim());
    setLoading(true);
    setError('');
    setSteps(null);
    setCompletedSteps(new Set());

    try {
      const roadmap = await careerRoadmapAPI(target.trim());
      setSteps(roadmap);
    } catch {
      setError('Failed to generate roadmap. Is your backend running at http://127.0.0.1:8000?');
      toast.error('Roadmap API failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (i: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate();
  };

  const resetRoadmap = () => {
    setSteps(null);
    setGoal('');
    setActiveGoal('');
    setCompletedSteps(new Set());
  };

  const progress = steps ? Math.round((completedSteps.size / steps.length) * 100) : 0;

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-12 overflow-hidden rounded-3xl gradient-hero p-8 sm:p-12 lg:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(38_92%_50%_/_0.15),_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,_hsl(250_55%_42%_/_0.2),_transparent_70%)]" />
        <div className="absolute top-8 right-12 hidden lg:block opacity-[0.08]">
          <GraduationCap className="h-36 w-36 text-primary-foreground" />
        </div>
        <div className="relative max-w-2xl">
          <Badge className="mb-4 bg-primary-foreground/12 text-primary-foreground border-primary-foreground/20 backdrop-blur-sm px-4 py-1.5">
            <Sparkles className="h-3 w-3 mr-1.5 fill-current" /> AI-Powered by IIST
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black text-primary-foreground mb-3 leading-[1.1]">
            Career Roadmap{' '}
            <span className="text-gradient-accent">Generator</span>
          </h1>
          <p className="text-primary-foreground/70 max-w-lg text-base sm:text-lg leading-relaxed">
            Get a personalized step-by-step career path tailored for IIST students and graduates. Track your progress as you go.
          </p>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mb-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Target className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={goal}
            onChange={e => { setGoal(e.target.value); setError(''); }}
            placeholder="Enter your dream career (e.g. AI Engineer, Product Manager)..."
            className="pl-10 h-12 bg-card shadow-card focus:shadow-card-hover transition-shadow rounded-xl text-base border-border/50"
          />
        </div>
        <Button type="submit" disabled={loading || !goal.trim()} className="gap-2 h-12 px-7 gradient-hero shadow-md rounded-xl text-sm font-semibold">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Generate Path
        </Button>
      </form>

      {/* Quick picks */}
      {!steps && !loading && !error && (
        <div className="mb-10 animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">⚡ Popular career paths for IIST graduates</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickPicks.map(({ label, icon: Icon, desc }) => (
              <button
                key={label}
                onClick={() => generate(label)}
                className="group flex items-start gap-3 rounded-2xl border border-border/50 bg-card p-4 text-left transition-all duration-200 hover:shadow-card-hover hover:border-accent/30 hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 group-hover:gradient-hero transition-all duration-300">
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="py-24 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center h-18 w-18 rounded-2xl gradient-hero mb-5 shadow-glow-primary">
            <Loader2 className="h-9 w-9 animate-spin text-primary-foreground" />
          </div>
          <p className="text-lg text-muted-foreground font-medium">Building your career roadmap...</p>
          <p className="text-xs text-muted-foreground/50 mt-1">AI is analyzing the best learning path for you</p>
        </div>
      )}

      {error && (
        <Card className="shadow-card animate-scale-in border-destructive/20 rounded-2xl">
          <CardContent className="py-12 text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold text-base">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">Make sure your FastAPI backend is running and CORS is enabled.</p>
          </CardContent>
        </Card>
      )}

      {steps && (
        <div>
          {/* Roadmap Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent shadow-glow">
                <Target className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-black font-display text-foreground">{activeGoal}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {steps.length} steps • {completedSteps.size} completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetRoadmap} className="gap-1.5 rounded-xl text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                New Path
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 bg-muted/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full gradient-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, i) => {
              const done = completedSteps.has(i);
              return (
                <div
                  key={i}
                  className="flex gap-4 opacity-0 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => toggleStep(i)}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm cursor-pointer ${
                        done
                          ? 'bg-success shadow-md scale-95'
                          : i === 0 && completedSteps.size === 0
                          ? 'gradient-accent shadow-glow animate-pulse-glow'
                          : 'bg-card border-2 border-border hover:border-accent/40'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                      ) : (
                        <span className="text-base">{stepIcons[i % stepIcons.length]}</span>
                      )}
                    </button>
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-2 min-h-[16px] transition-colors duration-300 ${
                        done ? 'bg-success/50' : 'bg-gradient-to-b from-border to-transparent'
                      }`} />
                    )}
                  </div>
                  <Card className={`flex-1 shadow-card hover-lift hover:shadow-card-hover rounded-2xl transition-all duration-300 ${
                    done
                      ? 'bg-success/5 border-success/20'
                      : i === 0 && completedSteps.size === 0
                      ? 'ring-2 ring-accent/30 border-accent/20'
                      : 'border-border/50'
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={done ? 'default' : 'outline'} 
                          className={`text-xs shrink-0 rounded-full ${done ? 'bg-success border-success text-primary-foreground' : ''}`}
                        >
                          Step {i + 1}
                        </Badge>
                        <h3 className={`font-semibold text-foreground transition-all ${done ? 'line-through opacity-60' : ''}`}>
                          {step}
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}

            {/* Completion Card */}
            <div
              className="flex gap-4 opacity-0 animate-slide-up"
              style={{ animationDelay: `${steps.length * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className="flex flex-col items-center">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md transition-all duration-500 ${
                  progress === 100 ? 'gradient-accent shadow-glow animate-pulse-glow' : 'bg-muted border-2 border-border'
                }`}>
                  {progress === 100 ? (
                    <span className="text-lg">🏆</span>
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
              <Card className={`flex-1 rounded-2xl transition-all duration-500 ${
                progress === 100 ? 'gradient-hero border-0 shadow-lg' : 'bg-muted/20 border-border/30'
              }`}>
                <CardContent className="p-5">
                  <p className={`font-black flex items-center gap-2 ${
                    progress === 100 ? 'text-primary-foreground text-lg' : 'text-muted-foreground text-sm'
                  }`}>
                    {progress === 100
                      ? '🎉 Congratulations! You completed your roadmap!'
                      : `Complete all ${steps.length} steps to unlock your achievement`
                    }
                  </p>
                  {progress === 100 && (
                    <p className="text-xs text-primary-foreground/70 mt-1">You're ready to land your dream role! Best of luck from IIST CareerAI 🚀</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
