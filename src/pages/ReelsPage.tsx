import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Music2, Plus, UserPlus, Play } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sampleReels, type Reel } from "@/data/social";
import { toast } from "sonner";

const ReelsPage = () => {
  const [reels, setReels] = useState(sampleReels);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleLike = (reelId: string) => {
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r));
  };

  const toggleFollow = (reelId: string) => {
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, following: !r.following } : r));
    const reel = reels.find(r => r.id === reelId);
    toast.success(reel?.following ? "Unfollowed" : "Following!");
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const idx = Math.round(container.scrollTop / container.clientHeight);
      setCurrentIndex(idx);
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  return (
    <div className="fixed inset-0 bg-foreground z-40">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-white">Reels</h1>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Reels container */}
      <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {reels.map((reel, i) => (
          <div key={reel.id} className="relative h-full w-full snap-start flex-shrink-0">
            {/* Background image (placeholder for video) */}
            <img
              src={reel.thumbnailUrl}
              alt={reel.dishName}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: i === currentIndex ? 1 : 0 }}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Play className="w-7 h-7 text-white ml-1" />
              </motion.div>
            </div>

            {/* Right sidebar actions */}
            <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
              <div className="flex flex-col items-center">
                <Avatar className="w-10 h-10 border-2 border-white">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {reel.userName[0]}
                  </AvatarFallback>
                </Avatar>
                {!reel.following && (
                  <button
                    onClick={() => toggleFollow(reel.id)}
                    className="w-5 h-5 rounded-full bg-primary flex items-center justify-center -mt-2.5"
                  >
                    <UserPlus className="w-3 h-3 text-primary-foreground" />
                  </button>
                )}
              </div>

              <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-1">
                <Heart className={`w-7 h-7 ${reel.liked ? "fill-destructive text-destructive" : "text-white"}`} />
                <span className="text-[11px] text-white font-medium">{formatCount(reel.likes)}</span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <MessageCircle className="w-7 h-7 text-white" />
                <span className="text-[11px] text-white font-medium">{formatCount(reel.comments)}</span>
              </button>

              <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }} className="flex flex-col items-center gap-1">
                <Share2 className="w-6 h-6 text-white" />
                <span className="text-[11px] text-white font-medium">Share</span>
              </button>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-20 left-0 right-16 px-4">
              <p className="text-white font-bold text-base">{reel.userName}</p>
              <p className="text-white/90 text-sm mt-1">{reel.caption}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {reel.hashtags.map(h => (
                  <span key={h} className="text-[11px] text-white/80 font-medium">#{h}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Music2 className="w-3.5 h-3.5 text-white/70" />
                <p className="text-[11px] text-white/70">Original Audio — {reel.userName}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-50">
        {reels.map((_, i) => (
          <div key={i} className={`w-1 rounded-full transition-all ${i === currentIndex ? "h-4 bg-white" : "h-1.5 bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
};

export default ReelsPage;
