import { cn } from "@/lib/utils";
import { CircleArrowOutUpRight } from "lucide-react";

interface AccountingStatsCardProps {
  title: string;
  value: string;
  change: {
    value: string;
    trend: string; // Now accepts any string
  };
  icon: React.ReactNode;
}

export function AccountingStatsCard({ title, value, change, icon }: AccountingStatsCardProps) {
  // Check the trend value in a case-insensitive way
  const trendLower = change.trend.toLowerCase();
  const isPositive = trendLower === "up";
  const isNegative = trendLower === "down";
  // Apply colors: green for up, red for down, or fallback neutral color.
  const trendColor = isPositive ? "text-emerald-500" : isNegative ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="relative p-4 lg:p-5 group before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-input/30 before:via-input before:to-input/30 last:before:hidden">
      <div className="relative flex items-center gap-4">
        <CircleArrowOutUpRight 
          className="absolute right-0 top-0 opacity-0 group-has-[a:hover]:opacity-100 transition-opacity text-emerald-500"
          size={20}
          aria-hidden="true"
        />
        {/* Icon */}
        <div className="max-[480px]:hidden size-10 shrink-0 rounded-full bg-emerald-600/25 border border-emerald-600/50 flex items-center justify-center text-emerald-500">
          {icon}
        </div>
        {/* Content */}
        <div>
          <a
            href="#"
            className="font-medium tracking-widest text-xs uppercase text-muted-foreground/60 before:absolute before:inset-0"
          >
            {title}
          </a>
          <div className="text-2xl font-semibold mb-2">{value}</div>
          {/* <div className="text-xs text-muted-foreground/60">
            <span className={cn("font-medium", trendColor)}>
              {isPositive ? "↗" : isNegative ? "↘" : change.trend} {change.value}
            </span>{" "}
            vs last week
          </div> */}
        </div>
      </div>
    </div>
  );
}

interface AccountingStatsGridProps {
  stats: AccountingStatsCardProps[];
}

export function AccountingStatsGrid({ stats }: AccountingStatsGridProps) {
  return (
    <div className="grid grid-cols-2 min-[1200px]:grid-cols-4 border border-border rounded-xl bg-gradient-to-br from-sidebar/60 to-sidebar">
      {stats.map((stat) => (
        <AccountingStatsCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
