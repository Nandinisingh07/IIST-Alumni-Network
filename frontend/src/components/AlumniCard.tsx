import { Alumni, getAvatarColor } from '@/lib/alumni-data';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Calendar, ArrowUpRight } from 'lucide-react';

export default function AlumniCard({ alumni, index = 0 }: { alumni: Alumni; index?: number }) {
  const color = getAvatarColor(alumni.name);
  const initials = alumni.name.split(' ').map(n => n[0]).join('');

  return (
    <Card
      className="group relative overflow-hidden shadow-card hover-lift hover:shadow-card-hover cursor-pointer opacity-0 animate-slide-up border-transparent hover:border-accent/30"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      {/* Decorative gradient strip */}
      <div className="absolute inset-x-0 top-0 h-1 gradient-hero opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-primary-foreground transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: color }}
          >
            {initials}
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success border-2 border-card" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground group-hover:text-gradient transition-colors">{alumni.name}</h3>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 text-accent" />
              <span className="truncate">{alumni.role} at <strong className="font-semibold text-foreground/80">{alumni.company}</strong></span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Class of {alumni.graduationYear}</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">{alumni.bio}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {alumni.skills.map((skill, i) => (
            <Badge
              key={skill}
              variant="secondary"
              className="text-xs font-medium transition-all duration-200 hover:shadow-glow hover:scale-105 cursor-default"
            >
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
