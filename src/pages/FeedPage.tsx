import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Bookmark, Share2, Send, Plus, X, Image, Camera } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { samplePosts, type SocialPost } from "@/data/social";
import { toast } from "sonner";

const FeedPage = () => {
  const [posts, setPosts] = useState(samplePosts);
  const [showCreate, setShowCreate] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    const post = posts.find(p => p.id === postId);
    toast.success(post?.saved ? "Removed from saved" : "Recipe saved!");
  };

  const addComment = (postId: string) => {
    if (!commentText.trim()) return;
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      comments: [...p.comments, { id: `c-${Date.now()}`, userName: "You", userAvatar: "", text: commentText, createdAt: "Just now" }]
    } : p));
    setCommentText("");
    setCommentingOn(null);
  };

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Feed</h1>
          <Button onClick={() => setShowCreate(true)} size="sm" className="rounded-2xl gap-1.5">
            <Plus className="w-4 h-4" /> Post
          </Button>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50"
            >
              {/* User header */}
              <div className="flex items-center gap-3 p-4">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {post.userName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{post.createdAt} · {post.cuisine}</p>
                </div>
              </div>

              {/* Image */}
              <img src={post.image} alt={post.caption} className="w-full aspect-square object-cover" />

              {/* Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-sm">
                      <Heart className={`w-5 h-5 transition-colors ${post.liked ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                      <span className="text-muted-foreground">{post.likes}</span>
                    </button>
                    <button onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments.length}</span>
                    </button>
                    <button onClick={share} className="text-muted-foreground">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button onClick={() => toggleSave(post.id)}>
                    <Bookmark className={`w-5 h-5 transition-colors ${post.saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </button>
                </div>

                <p className="text-sm text-foreground">{post.caption}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[11px] text-primary font-medium">#{tag}</span>
                  ))}
                </div>

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {post.comments.slice(-2).map(c => (
                      <p key={c.id} className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{c.userName}</span> {c.text}
                      </p>
                    ))}
                  </div>
                )}

                {/* Comment input */}
                <AnimatePresence>
                  {commentingOn === post.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex gap-2 mt-3">
                        <Input
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          className="text-xs rounded-xl h-9"
                          onKeyDown={e => e.key === "Enter" && addComment(post.id)}
                        />
                        <Button size="sm" onClick={() => addComment(post.id)} className="rounded-xl h-9 px-3">
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-card w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">Create Post</h2>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-4">
                <div className="flex justify-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-primary" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Upload a photo of your dish</p>
              </div>

              <Input placeholder="Dish name" className="rounded-2xl mb-3" />
              <Textarea placeholder="Share your recipe story..." className="rounded-2xl mb-3 min-h-[80px]" />
              <Input placeholder="Tags (e.g. #butterchicken #homemade)" className="rounded-2xl mb-3" />

              <div className="flex flex-wrap gap-2 mb-4">
                {["North Indian", "South Indian", "Marathi", "Punjabi", "Bengali", "Gujarati"].map(c => (
                  <Badge key={c} variant="outline" className="cursor-pointer hover:bg-primary/10 rounded-xl text-xs">{c}</Badge>
                ))}
              </div>

              <Button className="w-full rounded-2xl" onClick={() => { setShowCreate(false); toast.success("Post created! 🎉"); }}>
                Share Recipe
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedPage;
