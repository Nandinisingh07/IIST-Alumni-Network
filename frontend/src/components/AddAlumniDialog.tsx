import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Sparkles, Loader2, GraduationCap } from 'lucide-react';
import { addAlumniAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  onAdd?: () => void;
}

export default function AddAlumniDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', company: '', skills: '', bio: '', graduationYear: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role || !form.company) return;
    setLoading(true);
    try {
      await addAlumniAPI({
        name: form.name.trim(),
        role: form.role.trim(),
        company: form.company.trim(),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        bio: form.bio.trim(),
        graduationYear: parseInt(form.graduationYear) || new Date().getFullYear(),
      });
      toast.success('Alumni added successfully!');
      setForm({ name: '', role: '', company: '', skills: '', bio: '', graduationYear: '' });
      setOpen(false);
      onAdd?.();
    } catch {
      toast.error('Failed to add alumni. Is your backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-hero shadow-md hover:shadow-lg transition-all rounded-xl font-semibold">
          <UserPlus className="h-4 w-4" />
          Add Mentor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl animate-scale-in border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-accent shadow-glow">
              <GraduationCap className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-black">Add IIST Alumni</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Register a mentor for the community</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Full Name *</Label>
              <Input id="name" placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="shadow-card focus:shadow-card-hover transition-shadow rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Batch Year</Label>
              <Input id="year" type="number" placeholder="2023" value={form.graduationYear} onChange={e => setForm(f => ({ ...f, graduationYear: e.target.value }))} className="shadow-card focus:shadow-card-hover transition-shadow rounded-xl h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job Role *</Label>
              <Input id="role" placeholder="e.g. SDE" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required className="shadow-card focus:shadow-card-hover transition-shadow rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company *</Label>
              <Input id="company" placeholder="e.g. Google" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required className="shadow-card focus:shadow-card-hover transition-shadow rounded-xl h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skills" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills <span className="normal-case font-normal">(comma-separated)</span></Label>
            <Input id="skills" placeholder="React, Python, Machine Learning" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} className="shadow-card focus:shadow-card-hover transition-shadow rounded-xl h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Short Bio</Label>
            <Textarea id="bio" rows={3} placeholder="Tell us about your career journey..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="shadow-card focus:shadow-card-hover transition-shadow rounded-xl resize-none" />
          </div>
          <Button type="submit" disabled={loading || !form.name || !form.role || !form.company} className="w-full gradient-hero shadow-md hover:shadow-lg transition-all text-base py-5 rounded-xl font-semibold">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            {loading ? 'Adding Mentor...' : 'Add to IIST Network'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
