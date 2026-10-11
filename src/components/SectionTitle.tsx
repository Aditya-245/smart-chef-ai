import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  to?: string;
}

const SectionTitle = ({ title, subtitle, action, onAction, to }: SectionTitleProps) => (
  <div className="flex items-end justify-between mb-5">
    <div>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {action && onAction && (
      <button onClick={onAction} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        {action}
        <ChevronRight className="w-4 h-4" />
      </button>
    )}
    {action && !onAction && to && (
      <Link to={to} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
        {action}
        <ChevronRight className="w-4 h-4" />
      </Link>
    )}
  </div>
);

export default SectionTitle;
