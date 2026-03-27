import recipe1 from "@/assets/recipe-1.jpg";
import recipe2 from "@/assets/recipe-2.jpg";
import recipe3 from "@/assets/recipe-3.jpg";
import recipe4 from "@/assets/recipe-4.jpg";
import recipe5 from "@/assets/recipe-5.jpg";
import recipe6 from "@/assets/recipe-6.jpg";

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  image: string;
  caption: string;
  tags: string[];
  cuisine: string;
  likes: number;
  comments: Comment[];
  saved: boolean;
  liked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Reel {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  dishName: string;
  caption: string;
  hashtags: string[];
  likes: number;
  comments: number;
  liked: boolean;
  following: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  posts: number;
  followers: number;
  following: number;
  streak: number;
  points: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "reward" | "streak";
  message: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  read: boolean;
}

export const samplePosts: SocialPost[] = [
  {
    id: "p1", userId: "u1", userName: "Priya Sharma", userAvatar: "",
    image: recipe1, caption: "Made the creamiest butter chicken tonight! Family loved it 🧈🍗",
    tags: ["butterchicken", "homemade", "northindian"], cuisine: "North Indian",
    likes: 234, comments: [
      { id: "c1", userName: "Rahul K", userAvatar: "", text: "Looks amazing! Recipe please 🤤", createdAt: "2h ago" },
      { id: "c2", userName: "Sneha M", userAvatar: "", text: "The gravy looks so rich!", createdAt: "1h ago" },
    ],
    saved: false, liked: false, createdAt: "3h ago"
  },
  {
    id: "p2", userId: "u2", userName: "Ankit Patel", userAvatar: "",
    image: recipe2, caption: "Sunday morning dosa with coconut chutney 🥥 Nothing beats South Indian breakfast!",
    tags: ["dosa", "southindian", "breakfast"], cuisine: "South Indian",
    likes: 189, comments: [
      { id: "c3", userName: "Deepa R", userAvatar: "", text: "Crispy perfection! 👌", createdAt: "5h ago" },
    ],
    saved: true, liked: true, createdAt: "6h ago"
  },
  {
    id: "p3", userId: "u3", userName: "Meera Reddy", userAvatar: "",
    image: recipe3, caption: "Healthy palak paneer for dinner tonight 🌿 Added extra spinach!",
    tags: ["palakpaneer", "healthy", "vegetarian"], cuisine: "North Indian",
    likes: 156, comments: [], saved: false, liked: false, createdAt: "8h ago"
  },
  {
    id: "p4", userId: "u4", userName: "Arjun Nair", userAvatar: "",
    image: recipe4, caption: "Dum biryani slow cooked for 2 hours 🍚🔥 Worth every minute!",
    tags: ["biryani", "hyderabadi", "slowcooked"], cuisine: "Hyderabadi",
    likes: 412, comments: [
      { id: "c4", userName: "Karan S", userAvatar: "", text: "The layers look perfect!", createdAt: "1h ago" },
      { id: "c5", userName: "Nisha T", userAvatar: "", text: "Can smell it through the screen 😍", createdAt: "30m ago" },
    ],
    saved: false, liked: true, createdAt: "12h ago"
  },
  {
    id: "p5", userId: "u5", userName: "Kavita Joshi", userAvatar: "",
    image: recipe5, caption: "Chole bhature — the ultimate comfort food combo! 😋",
    tags: ["cholebhature", "streetfood", "punjabi"], cuisine: "Punjabi",
    likes: 298, comments: [], saved: true, liked: false, createdAt: "1d ago"
  },
];

export const sampleReels: Reel[] = [
  { id: "r1", userId: "u1", userName: "Priya Sharma", userAvatar: "", videoUrl: "", thumbnailUrl: recipe1, dishName: "Quick Butter Chicken", caption: "60-second butter chicken recipe!", hashtags: ["quickrecipe", "butterchicken"], likes: 1200, comments: 45, liked: false, following: false },
  { id: "r2", userId: "u2", userName: "Chef Ankit", userAvatar: "", videoUrl: "", thumbnailUrl: recipe2, dishName: "Crispy Dosa Tips", caption: "Secret to the crispiest dosa ever 🤫", hashtags: ["dosa", "cookingtips"], likes: 890, comments: 32, liked: true, following: true },
  { id: "r3", userId: "u3", userName: "Meera Cooks", userAvatar: "", videoUrl: "", thumbnailUrl: recipe3, dishName: "One-Pot Palak Paneer", caption: "Easiest palak paneer in 15 mins!", hashtags: ["onepot", "easyrecipe"], likes: 2300, comments: 78, liked: false, following: false },
  { id: "r4", userId: "u4", userName: "Biryani King", userAvatar: "", videoUrl: "", thumbnailUrl: recipe4, dishName: "Layer Biryani ASMR", caption: "Watch those layers come together 🍚", hashtags: ["biryani", "asmr", "cooking"], likes: 5600, comments: 210, liked: false, following: false },
  { id: "r5", userId: "u5", userName: "Street Food Fan", userAvatar: "", videoUrl: "", thumbnailUrl: recipe6, dishName: "Mumbai Vada Pav", caption: "Authentic Mumbai street style vada pav!", hashtags: ["vadapav", "mumbai", "streetfood"], likes: 3400, comments: 95, liked: true, following: true },
];

export const sampleBadges: Badge[] = [
  { id: "b1", name: "First Recipe", icon: "🍳", description: "Cook your first recipe", unlocked: true },
  { id: "b2", name: "Beginner Chef", icon: "👨‍🍳", description: "Maintain a 3-day streak", unlocked: true },
  { id: "b3", name: "Consistent Cook", icon: "🔥", description: "Maintain a 7-day streak", unlocked: true },
  { id: "b4", name: "Master Chef", icon: "⭐", description: "Maintain a 30-day streak", unlocked: false, progress: 12, maxProgress: 30 },
  { id: "b5", name: "Top Creator", icon: "📸", description: "Get 100 likes on a post", unlocked: false, progress: 67, maxProgress: 100 },
  { id: "b6", name: "Healthy Chef", icon: "🥗", description: "Cook 10 healthy recipes", unlocked: false, progress: 4, maxProgress: 10 },
  { id: "b7", name: "Viral Recipe", icon: "🚀", description: "Get 500 likes on a single post", unlocked: false, progress: 234, maxProgress: 500 },
  { id: "b8", name: "Community Star", icon: "💬", description: "Leave 50 comments", unlocked: false, progress: 23, maxProgress: 50 },
  { id: "b9", name: "Explorer", icon: "🗺️", description: "Try recipes from 5 cuisines", unlocked: true },
  { id: "b10", name: "Speed Chef", icon: "⚡", description: "Cook 5 recipes under 20 mins", unlocked: false, progress: 2, maxProgress: 5 },
];

export const sampleNotifications: Notification[] = [
  { id: "n1", type: "like", message: "liked your Butter Chicken post", userName: "Rahul K", userAvatar: "", createdAt: "2m ago", read: false },
  { id: "n2", type: "comment", message: "commented: \"Looks delicious!\"", userName: "Sneha M", userAvatar: "", createdAt: "15m ago", read: false },
  { id: "n3", type: "follow", message: "started following you", userName: "Chef Ankit", userAvatar: "", createdAt: "1h ago", read: false },
  { id: "n4", type: "reward", message: "You earned the \"Explorer\" badge! 🗺️", createdAt: "3h ago", read: true },
  { id: "n5", type: "streak", message: "Your 12-day streak is on fire! 🔥 Keep it going!", createdAt: "6h ago", read: true },
  { id: "n6", type: "like", message: "and 5 others liked your Dosa post", userName: "Deepa R", userAvatar: "", createdAt: "1d ago", read: true },
  { id: "n7", type: "reward", message: "You earned 50 points for posting a recipe! 🎉", createdAt: "2d ago", read: true },
];

export const currentUser: UserProfile = {
  id: "me",
  name: "Aisha Khan",
  avatar: "",
  bio: "Home chef 🍳 | Indian food lover | Experimenting daily",
  posts: 24,
  followers: 1240,
  following: 380,
  streak: 12,
  points: 2450,
  badges: sampleBadges,
};
