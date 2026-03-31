export interface Alumni {
  id: string;
  name: string;
  role: string;
  company: string;
  skills: string[];
  bio: string;
  graduationYear: number;
  avatar: string;
}

const avatarColors = ['#1e3a5f', '#d4930d', '#2d6a4f', '#7b2d8e', '#c0392b', '#2980b9'];

export function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export const initialAlumni: Alumni[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Senior ML Engineer',
    company: 'Google DeepMind',
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'Research'],
    bio: 'Leading ML research on large language models. Passionate about mentoring underrepresented groups in tech.',
    graduationYear: 2018,
    avatar: '',
  },
  {
    id: '2',
    name: 'James Rodriguez',
    role: 'VP of Product',
    company: 'Stripe',
    skills: ['Product Management', 'Strategy', 'Fintech', 'Leadership'],
    bio: 'Building the future of online payments. Previously at Square and PayPal.',
    graduationYear: 2015,
    avatar: '',
  },
  {
    id: '3',
    name: 'Aisha Patel',
    role: 'Founding Engineer',
    company: 'Vercel',
    skills: ['React', 'TypeScript', 'Next.js', 'System Design'],
    bio: 'Full-stack engineer focused on developer experience and web performance.',
    graduationYear: 2020,
    avatar: '',
  },
  {
    id: '4',
    name: 'Marcus Williams',
    role: 'Data Science Director',
    company: 'Netflix',
    skills: ['Data Science', 'Python', 'SQL', 'A/B Testing'],
    bio: 'Driving content recommendations through data. Former academic researcher.',
    graduationYear: 2016,
    avatar: '',
  },
  {
    id: '5',
    name: 'Elena Kowalski',
    role: 'UX Design Lead',
    company: 'Figma',
    skills: ['UX Design', 'User Research', 'Prototyping', 'Design Systems'],
    bio: 'Designing tools that empower designers. Advocate for accessible design.',
    graduationYear: 2019,
    avatar: '',
  },
];
