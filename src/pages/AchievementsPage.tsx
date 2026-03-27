import { motion } from "framer-motion";
import { Trophy, Lock, Flame, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { sampleBadges, currentUser } from "@/data/social";

const AchievementsPage = () => {
  const unlocked = sampleBadges.filter(b => b.unlocked).length;

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Achievements</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {unlocked}/{sampleBadges.length} badges unlocked
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
            <Flame className="w-6 h-6 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{currentUser.streak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
            <Star className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{currentUser.points.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Points</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
            <Trophy className="w-6 h-6 text-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{unlocked}</p>
            <p className="text-[10px] text-muted-foreground">Badges</p>
          </div>
        </div>

        {/* Badges grid */}
        <div className="grid grid-cols-2 gap-3">
          {sampleBadges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-card rounded-2xl p-4 border border-border/50 shadow-sm ${!badge.unlocked ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                  {badge.icon}
                </div>
                {!badge.unlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </div>
              <p className="text-sm font-semibold text-foreground">{badge.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{badge.description}</p>
              {!badge.unlocked && badge.progress !== undefined && badge.maxProgress && (
                <div className="mt-3">
                  <Progress value={(badge.progress / badge.maxProgress) * 100} className="h-1.5 rounded-full" />
                  <p className="text-[10px] text-muted-foreground mt-1">{badge.progress}/{badge.maxProgress}</p>
                </div>
              )}
              {badge.unlocked && (
                <p className="text-[10px] text-primary font-semibold mt-2">✓ Unlocked</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
