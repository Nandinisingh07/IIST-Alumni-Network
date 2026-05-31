import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { storiesApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Heart, MessageSquare, Bookmark, Eye, Clock, User, Sparkles, Send, Trash2, ArrowLeft, Edit } from 'lucide-react';

interface Story {
  id: number;
  author_id: number;
  title: string;
  content: string;
  type: string;
  company?: string;
  role?: string;
  cover_image_url?: string;
  tags: string[];
  read_time_mins: number;
  views: number;
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  published_at: string;
  author: any;
}

interface Comment {
  id: number;
  story_id: number;
  author_id: number;
  content: string;
  parent_id?: number;
  created_at: string;
  author: any;
}

export default function StoriesPage() {
  const { user } = useAppStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  
  // Writing Mode State
  const [writingMode, setWritingMode] = useState(false);
  const [storyForm, setStoryForm] = useState({
    title: '',
    type: 'journey',
    company: '',
    role: '',
    cover_image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
    content: '',
    tagsString: ''
  });

  const fetchStories = async () => {
    try {
      const data = await storiesApi.getStories();
      setStories(data);
    } catch {
      toast.error('Failed to load stories');
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleSelectStory = async (story: Story) => {
    try {
      const details = await storiesApi.getStory(story.id);
      setSelectedStory(details);
      // Fetch comments
      const comms = await storiesApi.getComments(story.id);
      setComments(comms);
    } catch {
      toast.error('Failed to load story details');
    }
  };

  const handleLike = async (storyId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await storiesApi.like(storyId);
      toast.success('Liked!');
      if (selectedStory && selectedStory.id === storyId) {
        setSelectedStory(prev => prev ? { ...prev, likes_count: res.likes } : null);
      }
      fetchStories();
    } catch {
      toast.error('Failed to like story');
    }
  };

  const handleBookmark = async (storyId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await storiesApi.bookmark(storyId);
      toast.success('Bookmarked successfully!');
      fetchStories();
    } catch {
      toast.error('Failed to bookmark');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedStory) return;
    try {
      const newComm = await storiesApi.postComment(selectedStory.id, {
        content: newCommentText,
        parent_id: replyingTo || undefined
      });
      toast.success('Comment posted');
      setNewCommentText('');
      setReplyingTo(null);
      // Refresh comments
      const comms = await storiesApi.getComments(selectedStory.id);
      setComments(comms);
      
      // Refresh details comments count
      setSelectedStory(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : null);
      fetchStories();
    } catch {
      toast.error('Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!selectedStory || !confirm('Delete comment?')) return;
    try {
      await storiesApi.deleteComment(selectedStory.id, commentId);
      toast.success('Comment deleted');
      const comms = await storiesApi.getComments(selectedStory.id);
      setComments(comms);
      setSelectedStory(prev => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : null);
      fetchStories();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = storyForm.tagsString.split(',').map(t => t.trim()).filter(Boolean);
      await storiesApi.create({
        ...storyForm,
        tags
      });
      toast.success('Story published successfully!');
      setWritingMode(false);
      setStoryForm({
        title: '',
        type: 'journey',
        company: '',
        role: '',
        cover_image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
        content: '',
        tagsString: ''
      });
      fetchStories();
    } catch {
      toast.error('Failed to publish story');
    }
  };

  // Filter nested comments (parent comments vs child comments)
  const parentComments = comments.filter(c => !c.parent_id);
  const getRepliesForComment = (parentId: number) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="container mx-auto py-8 px-4 text-[#f9fafb]">
      {/* ──── VIEW STORY DETAILS ──── */}
      {selectedStory ? (
        <div className="max-w-3xl mx-auto space-y-8">
          <Button variant="ghost" onClick={() => setSelectedStory(null)} className="h-10 rounded-xl hover:bg-[#1f2937] text-[#9ca3af] hover:text-white mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to stories
          </Button>

          <div className="relative h-80 rounded-3xl overflow-hidden shadow-glow-primary">
            <img src={selectedStory.cover_image_url} alt="Cover image" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 space-y-3">
              <Badge className="bg-[#6366f1] text-white hover:bg-[#6366f1] text-xs uppercase px-3 py-1 rounded-lg">
                {selectedStory.type}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight font-display">
                {selectedStory.title}
              </h1>
            </div>
          </div>

          {/* Author bar info */}
          <div className="flex justify-between items-center bg-[#111827] border border-[#374151]/50 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <img src={selectedStory.author.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Avatar" className="h-11 w-11 rounded-full object-cover border border-[#374151]" />
              <div>
                <h4 className="font-bold text-white text-sm">{selectedStory.author.full_name}</h4>
                <p className="text-xs text-[#9ca3af]">{selectedStory.role} @ {selectedStory.company}</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-[#9ca3af]">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedStory.read_time_mins} min read</span>
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {selectedStory.views} views</span>
            </div>
          </div>

          {/* Story body */}
          <div className="text-base text-[#f9fafb] leading-relaxed whitespace-pre-wrap font-sans bg-[#111827]/40 p-6 rounded-2xl border border-[#374151]/30">
            {selectedStory.content}
          </div>

          {/* Floating actions bar simulator */}
          <div className="flex items-center gap-4 border-t border-[#374151]/30 pt-6">
            <Button onClick={(e) => handleLike(selectedStory.id, e)} variant="outline" className="rounded-xl border-[#374151] hover:bg-[#1f2937] text-white gap-2 h-11 px-6">
              <Heart className="h-4 w-4 fill-red-500 text-red-500" /> Like ({selectedStory.likes_count})
            </Button>
            <Button onClick={(e) => handleBookmark(selectedStory.id, e)} variant="outline" className="rounded-xl border-[#374151] hover:bg-[#1f2937] text-[#9ca3af] hover:text-white gap-2 h-11 px-6">
              <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Bookmark
            </Button>
          </div>

          {/* COMMENTS SECTION */}
          <div className="space-y-6 pt-6 border-t border-[#374151]/30">
            <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#6366f1]" /> Comments ({selectedStory.comments_count})
            </h3>

            {/* Post comment form */}
            <form onSubmit={handlePostComment} className="flex gap-3">
              <Input
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Add to the discussion..."}
                className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white placeholder-[#9ca3af]/40"
              />
              <Button type="submit" className="h-12 gradient-hero text-white px-6 rounded-xl font-bold gap-2">
                <Send className="h-4 w-4" /> Send
              </Button>
            </form>
            {replyingTo && (
              <p className="text-xs text-[#9ca3af] -mt-2">Replying to comment. <button onClick={() => setReplyingTo(null)} className="text-red-400 underline">Cancel</button></p>
            )}

            {/* List comment thread */}
            <div className="space-y-4">
              {parentComments.map(c => {
                const replies = getRepliesForComment(c.id);
                return (
                  <div key={c.id} className="space-y-3 p-4 bg-[#111827]/40 rounded-2xl border border-[#374151]/20">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <img src={c.author.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
                        <div>
                          <span className="text-xs font-bold text-white">{c.author.full_name}</span>
                          <span className="text-[10px] text-[#9ca3af] block">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setReplyingTo(c.id)} className="text-[10px] font-bold text-primary hover:underline">Reply</button>
                        {(user?.id === c.author_id || user?.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-[10px] font-bold text-red-400 hover:underline">Delete</button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#f9fafb] pl-10 leading-relaxed">{c.content}</p>

                    {/* Replies (Nesting level 1) */}
                    {replies.map(rep => (
                      <div key={rep.id} className="ml-10 p-3 bg-[#1f2937]/30 border-l-2 border-[#6366f1] rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <img src={rep.author.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
                            <div>
                              <span className="text-xs font-bold text-white">{rep.author.full_name}</span>
                              <span className="text-[9px] text-[#9ca3af] block">{new Date(rep.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {(user?.id === rep.author_id || user?.role === 'admin') && (
                            <button onClick={() => handleDeleteComment(rep.id)} className="text-[9px] font-bold text-red-400 hover:underline">Delete</button>
                          )}
                        </div>
                        <p className="text-xs text-[#f9fafb] pl-8 leading-relaxed">{rep.content}</p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : writingMode ? (
        // ──── DRAFT WRITE STORY FLOW ────
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-extrabold font-display text-white">Share Your Story</h2>
            <Button variant="ghost" onClick={() => setWritingMode(false)} className="rounded-xl h-10 hover:bg-[#1f2937] text-[#9ca3af]">
              Cancel
            </Button>
          </div>

          <form onSubmit={handlePublishStory} className="space-y-4 bg-[#111827]/90 border border-[#374151]/50 p-8 rounded-3xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#9ca3af] uppercase">Story Title</label>
              <Input
                required
                placeholder="e.g. My Placement Experience at Microsoft"
                value={storyForm.title}
                onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                className="bg-[#1f2937]/50 border-[#374151] h-12 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Story Category</label>
                <select
                  value={storyForm.type}
                  onChange={(e) => setStoryForm({ ...storyForm, type: e.target.value })}
                  className="w-full bg-[#1f2937]/50 border border-[#374151] rounded-xl h-11 px-3 text-white text-sm outline-none"
                >
                  <option value="journey">My Journey</option>
                  <option value="interview-exp">Interview Experience</option>
                  <option value="startup">Startup Story</option>
                  <option value="abroad">Study Abroad</option>
                  <option value="research">Research Path</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Tags (comma separated)</label>
                <Input
                  placeholder="e.g. SDE, Placement, Microsoft"
                  value={storyForm.tagsString}
                  onChange={(e) => setStoryForm({ ...storyForm, tagsString: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Company (if relevant)</label>
                <Input
                  placeholder="e.g. Microsoft"
                  value={storyForm.company}
                  onChange={(e) => setStoryForm({ ...storyForm, company: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9ca3af] uppercase">Role Offered / Job Title</label>
                <Input
                  placeholder="e.g. SDE-1"
                  value={storyForm.role}
                  onChange={(e) => setStoryForm({ ...storyForm, role: e.target.value })}
                  className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#9ca3af] uppercase">Cover Image URL</label>
              <Input
                placeholder="Paste image link URL..."
                value={storyForm.cover_image_url}
                onChange={(e) => setStoryForm({ ...storyForm, cover_image_url: e.target.value })}
                className="bg-[#1f2937]/50 border-[#374151] h-11 rounded-xl text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#9ca3af] uppercase">Story Content</label>
              <Textarea
                required
                placeholder="Draft your story here. Share detailed prep resources, round-by-round interview breakdown, questions asked, and key advice..."
                value={storyForm.content}
                onChange={(e) => setStoryForm({ ...storyForm, content: e.target.value })}
                rows={10}
                className="bg-[#1f2937]/50 border-[#374151] rounded-xl text-white font-sans leading-relaxed"
              />
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl gradient-hero font-bold text-white shadow-lg border-0">
              Publish Story Post
            </Button>
          </form>
        </div>
      ) : (
        // ──── GRID MAGAZINE LISTING ────
        <div className="space-y-10">
          <div className="flex justify-between items-end bg-[#111827]/80 border border-[#374151]/30 p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_50%_/_0.1),_transparent_50%)]" />
            <div className="relative z-10 space-y-3">
              <Badge className="bg-white/10 text-white border-white/20">
                <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-400" /> Story Wall
              </Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-none font-display">
                Alumni Story <span className="text-gradient">Wall</span>
              </h1>
              <p className="text-sm text-[#9ca3af] max-w-md">
                Read deep-dives on coding journeys, startup hacks, placement strategies, and interview experiences from IIST alumni.
              </p>
            </div>
            
            {user?.role === 'alumni' && (
              <Button onClick={() => setWritingMode(true)} className="relative z-10 gradient-hero h-12 rounded-xl text-white font-bold gap-2 shadow-lg border-0 px-6">
                <Edit className="h-4.5 w-4.5" /> Write Story
              </Button>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map(s => (
              <Card 
                key={s.id}
                onClick={() => handleSelectStory(s)}
                className="bg-[#111827]/90 border-[#374151]/50 rounded-2xl overflow-hidden hover-lift hover:shadow-card-hover cursor-pointer group transition-all duration-300 relative border-gradient"
              >
                <div className="h-48 overflow-hidden relative">
                  <img src={s.cover_image_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-[#111827]/80 backdrop-blur-md text-white border-0 text-[10px] uppercase font-bold px-2.5 py-1">
                      {s.type}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-extrabold text-lg leading-snug truncate text-white group-hover:text-[#6366f1] transition-colors font-display">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#9ca3af] line-clamp-3 leading-relaxed">
                    {s.content}
                  </p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-[#374151]/30">
                    <div className="flex items-center gap-2">
                      <img src={s.author.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="Avatar" className="h-6.5 w-6.5 rounded-full object-cover" />
                      <span className="text-[11px] font-bold text-white truncate max-w-[100px]">{s.author.full_name}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-[#9ca3af] font-semibold">
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {s.read_time_mins}m</span>
                      <span className="flex items-center gap-0.5"><Heart className="h-3 w-3 text-red-400" /> {s.likes_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
