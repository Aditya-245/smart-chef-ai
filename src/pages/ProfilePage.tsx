import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star, Grid3X3, Bookmark, Settings, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { currentUser, samplePosts, sampleBadges } from "@/data/social";
import { toast } from "sonner";

const ProfilePage = () => {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userName, setUserName] = useState(currentUser.name);
  const [userBio, setUserBio] = useState(currentUser.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = currentUser;

  const userPosts = samplePosts.filter(p => p.userId === user.id || p.userName === user.name);
  const savedPosts = samplePosts.filter(p => p.saved);

  const streakMilestone = user.streak >= 30 ? "Master Chef ⭐" : user.streak >= 7 ? "Consistent Cook 🔥" : user.streak >= 3 ? "Beginner Chef 👨‍🍳" : "Getting Started";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    setShowEditProfile(false);
    toast.success("Profile updated!");
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto">
        {/* Profile header */}
        <div className="text-center mb-6">
          <Avatar className="w-20 h-20 mx-auto mb-3">
            {avatarUrl ? (
                    <img src={avatarUrl} alt={userName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {userName.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            )}
          </Avatar>
          <h1 className="text-xl font-bold text-foreground">{userName}</h1>
          <p className="text-sm text-muted-foreground mt-1">{userBio}</p>

          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{user.posts}</p>
              <p className="text-[11px] text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{user.followers.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{user.following}</p>
              <p className="text-[11px] text-muted-foreground">Following</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center mt-4">
            <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => setShowEditProfile(true)}>Edit Profile</Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl"
              onClick={() => setShowEditProfile(true)}
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Streak & Points Card */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-foreground">Streak</span>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{user.streak}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{streakMilestone}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Points</span>
            </div>
            <p className="text-3xl font-extrabold text-foreground">{user.points.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Level {Math.floor(user.points / 500) + 1}</p>
          </motion.div>
        </div>

        {/* Badges preview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" /> Badges
            </h2>
            <Button variant="ghost" size="sm" className="text-xs text-primary" asChild>
              <a href="/achievements">View all</a>
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {sampleBadges.filter(b => b.unlocked).map(badge => (
              <div key={badge.id} className="flex-shrink-0 w-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-xl">
                  {badge.icon}
                </div>
                <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts">
          <TabsList className="w-full rounded-2xl bg-muted">
            <TabsTrigger value="posts" className="flex-1 rounded-xl gap-1.5 text-xs">
              <Grid3X3 className="w-3.5 h-3.5" /> Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 rounded-xl gap-1.5 text-xs">
              <Bookmark className="w-3.5 h-3.5" /> Saved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="grid grid-cols-3 gap-1 mt-3">
              {userPosts.length > 0 ? userPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img src={post.image} alt={post.caption} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </motion.div>
              )) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-sm text-muted-foreground">No posts yet. Share your first recipe!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid grid-cols-3 gap-1 mt-3">
              {savedPosts.length > 0 ? savedPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img src={post.image} alt={post.caption} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </motion.div>
              )) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-sm text-muted-foreground">No saved recipes yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end md:items-center justify-center"
            onClick={() => setShowEditProfile(false)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-card w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
                <button onClick={() => setShowEditProfile(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-5">
                <Avatar className="w-16 h-16">
                  {avatarUrl ? (
              <img src={avatarUrl} alt={userName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {userName.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{userName}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    {avatarUrl ? "Change photo" : "Change photo"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
                  <Input
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bio</label>
                  <Textarea
                    value={userBio}
                    onChange={e => setUserBio(e.target.value)}
                    className="rounded-xl mt-1 min-h-[60px]"
                  />
                </div>
              </div>

              <Button className="w-full rounded-2xl mt-5" onClick={saveProfile}>
                Save Changes
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
