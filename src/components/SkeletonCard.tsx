const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden bg-card shadow-soft">
    <div className="aspect-square bg-muted animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, hsl(var(--muted-foreground) / 0.05), transparent)", backgroundSize: "200% 100%" }} />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-muted rounded-full w-3/4 animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, hsl(var(--muted-foreground) / 0.05), transparent)", backgroundSize: "200% 100%" }} />
      <div className="h-3 bg-muted rounded-full w-1/2 animate-shimmer" style={{ backgroundImage: "linear-gradient(90deg, transparent, hsl(var(--muted-foreground) / 0.05), transparent)", backgroundSize: "200% 100%" }} />
    </div>
  </div>
);

export default SkeletonCard;
