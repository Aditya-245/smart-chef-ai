import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Bookmark, Share2, Send, Plus, X, Image as ImageIcon, Camera } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { samplePosts, type SocialPost } from "@/data/social";
import { toast } from "sonner";
import recipe1 from "@/assets/recipe-1.jpg";

const FeedPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(samplePosts);
  const [showCreate, setShowCreate] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const postImageRef = useRef<HTMLInputElement>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);

  const [newDishName, setNewDishName] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newTags, setNewTags] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !p.saved } : p));
    toast.success(post?.saved ? "Removed from saved" : "Recipe saved!");
  };

  const openComment = (postId: string) => {
    if (commentingOn === postId) {
      setCommentingOn(null);
      setCommentText("");
    } else {
      setCommentingOn(postId);
      setCommentText("");
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  };

  const addComment = (postId: string) => {
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText("");
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      comments: [...p.comments, { id: `c-${Date.now()}`, userName: "You", userAvatar: "", text, createdAt: "Just now" }]
    } : p));
  };

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const handlePostImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (postImagePreview) URL.revokeObjectURL(postImagePreview);
    const url = URL.createObjectURL(file);
    setPostImagePreview(url);
  };

  const createPost = () => {
    if (!newDishName.trim() || !newCaption.trim()) {
      toast.error("Please fill in the dish name and caption.");
      return;
    }
    const newPost: SocialPost = {
      id: `p-${Date.now()}`,
      userId: "me",
      userName: "Aisha Khan",
      userAvatar: "",
      image: postImagePreview || recipe1,
      caption: newCaption,
      tags: newTags.split("#").filter(Boolean).map(t => t.trim()),
      cuisine: selectedCuisine || "North Indian",
      likes: 0,
      comments: [],
      saved: false,
      liked: false,
      createdAt: "Just now",
    };
    setPosts(prev => [newPost, ...prev]);
    setNewDishName("");
    setNewCaption("");
    setNewTags("");
    setSelectedCuisine(null);
    setPostImagePreview(null);
    setShowCreate(false);
    toast.success("Recipe posted!");
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Feed</h1>
          <Button onClick={() => setShowCreate(true)} size="sm" className="rounded-2xl gap-1.5">
            <Plus className="w-4 h-4" /> Post
          </Button>
        </div>

        <div className="space-y-6">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50"
            >
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => post.userId !== "me" && navigate(`/user/${post.userId}`)}
                  className="cursor-pointer"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {post.userName.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <button
                  onClick={() => post.userId !== "me" && navigate(`/user/${post.userId}`)}
                  className="text-left"
                >
                  <p className="text-sm font-semibold text-foreground hover:underline">{post.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{post.createdAt} · {post.cuisine}</p>
                </button>
              </div>

              <img
                src={post.image}
                alt={post.caption}
                loading="lazy"
                decoding="async"
                className="w-full aspect-square object-cover"
              />

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 text-sm">
                      <Heart className={`w-5 h-5 transition-colors ${post.liked ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                      <span className="text-muted-foreground">{post.likes}</span>
                    </button>
                    <button onClick={() => openComment(post.id)} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className={`w-5 h-5 ${commentingOn === post.id ? "fill-primary text-primary" : ""}`} />
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

                {post.comments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {post.comments.slice(-3).map(c => (
                      <p key={c.id} className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{c.userName}</span> {c.text}
                      </p>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {commentingOn === post.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-2 mt-3">
                        <input
                          ref={commentInputRef}
                          type="text"
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              addComment(post.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          disabled={!commentText.trim()}
                          className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

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
                <button onClick={() => { setShowCreate(false); setPostImagePreview(null); }} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              <input ref={postImageRef} type="file" accept="image/*" onChange={handlePostImage} className="hidden" />

              {postImagePreview ? (
                <div className="relative rounded-2xl overflow-hidden mb-4">
                  <img
                    src={postImagePreview}
                    alt="Preview"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => setPostImagePreview(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => postImageRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-2xl p-8 text-center mb-4 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Upload a photo of your dish</p>
                </div>
              )}

              <Input
                placeholder="Dish name"
                className="rounded-2xl mb-3"
                value={newDishName}
                onChange={e => setNewDishName(e.target.value)}
              />
              <Textarea
                placeholder="Share your recipe story..."
                className="rounded-2xl mb-3 min-h-[80px]"
                value={newCaption}
                onChange={e => setNewCaption(e.target.value)}
              />
              <Input
                placeholder="Tags (e.g. #butterchicken #homemade)"
                className="rounded-2xl mb-3"
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
              />

              <div className="flex flex-wrap gap-2 mb-4">
                {["North Indian", "South Indian", "Marathi", "Punjabi", "Bengali", "Gujarati"].map(c => (
                  <Badge
                    key={c}
                    variant={selectedCuisine === c ? "default" : "outline"}
                    className={`cursor-pointer rounded-xl text-xs ${selectedCuisine === c ? "" : "hover:bg-primary/10"}`}
                    onClick={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>

              <Button className="w-full rounded-2xl" onClick={createPost}>
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
