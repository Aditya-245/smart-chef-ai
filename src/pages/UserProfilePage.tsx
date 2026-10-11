import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Grid3X3 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { samplePosts, publicUsers } from "@/data/social";

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);

  const user = publicUsers[userId || ""];
  const userPosts = samplePosts.filter(p => p.userId === userId);

  if (!user) {
    return (
      <div className="min-h-screen pt-20 pb-24 md:pb-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm font-medium text-foreground">User not found</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto">
        {/* Back button */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{user.name}</h1>
        </div>

        {/* Profile header */}
        <div className="text-center mb-6">
          <Avatar className="w-20 h-20 mx-auto mb-3">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {user.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
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
            <Button
              variant={following ? "outline" : "default"}
              size="sm"
              className="rounded-2xl px-6"
              onClick={() => setFollowing(!following)}
            >
              {following ? "Following" : "Follow"}
            </Button>
            <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => navigate(`/chat/${userId}`)}>
              Message
            </Button>
          </div>
        </div>

        {/* User's posts */}
        <Tabs defaultValue="posts">
          <TabsList className="w-full rounded-2xl bg-muted">
            <TabsTrigger value="posts" className="flex-1 rounded-xl gap-1.5 text-xs">
              <Grid3X3 className="w-3.5 h-3.5" /> Posts
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
                  <p className="text-sm text-muted-foreground">No posts yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfilePage;
