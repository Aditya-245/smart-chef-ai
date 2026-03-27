import { Link, useLocation } from "react-router-dom";
import { Home, ScanLine, BookOpen, Sparkles } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/scan", icon: ScanLine, label: "Scan" },
  { to: "/recipes", icon: BookOpen, label: "Recipes" },
  { to: "/generator", icon: Sparkles, label: "Generate" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
