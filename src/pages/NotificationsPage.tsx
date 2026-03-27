import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Trophy, Flame, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { sampleNotifications, type Notification } from "@/data/social";

const iconMap: Record<Notification["type"], React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-destructive" />,
  comment: <MessageCircle className="w-4 h-4 text-primary" />,
  follow: <UserPlus className="w-4 h-4 text-primary" />,
  reward: <Trophy className="w-4 h-4 text-accent" />,
  streak: <Flame className="w-4 h-4 text-accent" />,
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(sampleNotifications);
  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unread > 0 && <p className="text-xs text-muted-foreground">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary gap-1">
              <Check className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-3 p-3 rounded-2xl transition-colors ${!notif.read ? "bg-primary/5" : "bg-card"}`}
            >
              {notif.userName ? (
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                    {notif.userName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  {iconMap[notif.type]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  {notif.userName && <span className="font-semibold">{notif.userName} </span>}
                  {notif.message}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{notif.createdAt}</p>
              </div>
              {!notif.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
