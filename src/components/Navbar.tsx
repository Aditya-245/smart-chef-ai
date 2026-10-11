import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Menu, X, ChefHat, Flame, MessageSquare } from "lucide-react";
import { currentUser } from "@/data/social";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/feed", label: "Feed" },
  { to: "/scan", label: "Scan" },
  { to: "/recipes", label: "Recipes" },
  { to: "/generator", label: "Generate" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Hide navbar on reels page
  if (location.pathname === "/reels") return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/recipes?q=${encodeURIComponent(q)}` : "/recipes");
    setSearchOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">SmartChef</span>
          <span className="text-xs font-semibold text-primary bg-sage-light px-2 py-0.5 rounded-full">AI</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Streak indicator */}
          <div className="flex items-center gap-1 text-accent text-xs font-bold">
            <Flame className="w-4 h-4" />
            {currentUser.streak}
          </div>

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <Link
            to="/chat"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
          <Link
            to="/notifications"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
          </Link>
          <Link
            to="/profile"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
              AK
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/50 overflow-hidden"
          >
            <div className="container py-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes, ingredients..."
                  className="w-full bg-muted rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                  autoFocus
                />
                <button
                  type="submit"
                  className="flex-shrink-0 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border/50 overflow-hidden"
          >
            <div className="container py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/chat"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                💬 Messages
              </Link>
              <Link
                to="/achievements"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                🏆 Achievements
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
