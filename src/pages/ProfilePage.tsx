import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Star, Grid3X3, Bookmark, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { currentUser, samplePosts, sampleBadges } from "@/data/social";
import recipe1 from "@/assets/recipe-1.jpg";
import recipe2 from "@/assets/recipe-2.jpg";
import recipe3 from "@/assets/recipe-3.jpg";
import recipe4 from "@/assets/recipe-4.jpg";
import recipe5 from "@/assets/recipe-5.jpg";
import recipe6 from "@/assets/recipe-6.jpg";

const userPostImages = [recipe1, recipe2, recipe3, recipe4, recipe5, recipe6];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const user = currentUser;

  const streakMilestone = user.streak >= 30 ? "Master Chef ⭐" : user.streak >= 7 ? "Consistent Cook 🔥" : user.streak >= 3 ? "Beginner Chef 👨‍🍳" : "Getting Started";

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto">
        {/* Profile header */}
        <div className="text-center mb-6">
          <Avatar className="w-20 h-20 mx-auto mb-3">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>

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
            <Button variant="outline" size="sm" className="rounded-2xl">Edit Profile</Button>
            <Button variant="outline" size="sm" className="rounded-2xl">
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
        <Tabs defaultValue="posts" onValueChange={setActiveTab}>
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
              {userPostImages.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img src={img} alt={`Post ${i + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid grid-cols-3 gap-1 mt-3">
              {samplePosts.filter(p => p.saved).map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img src={post.image} alt={post.caption} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
